import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { localDateKey } from "../../utils/progress";
import { OrbitImageContent, renderOrbitImage } from "../../share/orbitImage";
import { ShareImagePanel } from "../share/ShareImagePanel";
import { Modal } from "../../ui";
import type { Progression } from "../../api/progress";
import { addDays } from "../../../server/core/time";

// «Поделиться орбитой»: открывается из профиля, из карточки недели в шапке и из праздника «Орбита замкнута!».
// Праздник показывается и на экранах тренировок без MainLayout, поэтому окно — глобальное, как ProgressMomentsHost
const SHARE_ORBIT_EVENT = "kolo:share-orbit";

export function openOrbitShare() {
  window.dispatchEvent(new Event(SHARE_ORBIT_EVENT));
}

export function ShareOrbitHost() {
  const { t } = useI18n();
  const { progression } = useData();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SHARE_ORBIT_EVENT, handler);
    return () => window.removeEventListener(SHARE_ORBIT_EVENT, handler);
  }, []);

  // Ушли на другой экран (например, «Открыть капсулы» из следующего праздника) — окно не тянется за нами
  useEffect(() => setOpen(false), [pathname]);

  return (
    <Modal open={open && progression !== null} onClose={() => setOpen(false)} title={t.orbit.share.title}>
      {progression && <ShareOrbitBody progression={progression} />}
    </Modal>
  );
}

// «17–23 нояб.», «Nov 17 – 23»; formatRange нет в старых браузерах — тогда два дня через тире
function weekRange(locale: string, monday: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const from = new Date(`${monday}T00:00:00Z`);
  const to = new Date(`${addDays(monday, 6)}T00:00:00Z`);
  const range = (fmt as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string }).formatRange;
  return range ? range.call(fmt, from, to) : `${fmt.format(from)} – ${fmt.format(to)}`;
}

function ShareOrbitBody({ progression }: { progression: Progression }) {
  const { t, language } = useI18n();
  const locale = getLanguageInfo(language).htmlLang;
  const o = progression.orbit;
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });

  const content: OrbitImageContent = {
    goal: o.goal,
    days: o.days,
    week: o.week,
    today: localDateKey(new Date()),
    closed: o.closed,
    streak: o.streak,
    pill: `${t.orbit.label} · ${weekRange(locale, o.week)}`,
    headline: plural(locale, o.streak, t.orbit.inRow),
    status: o.closed
      ? t.orbit.share.closed
      : t.orbit.share.progress.replace("{done}", String(Math.min(o.days.length, o.goal))).replace("{goal}", String(o.goal)),
    stats: `${t.orbit.best}: ${o.longest} · ${t.orbit.moments.level.replace("{n}", String(progression.xp.level))}`,
    // Как в WeekDays: «пн», «Mo.» → «ПН», «MO»
    weekdays: Array.from({ length: 7 }, (_, i) =>
      weekday.format(new Date(`${addDays(o.week, i)}T00:00:00Z`)).replace(".", "").toLocaleUpperCase(locale),
    ),
  };

  return (
    <ShareImagePanel
      render={(style) => renderOrbitImage(content, style)}
      renderKey={JSON.stringify(content)}
      fileName={`kolo-orbit-${o.week}.png`}
      alt={t.orbit.share.alt}
    />
  );
}

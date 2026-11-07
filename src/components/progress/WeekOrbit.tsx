import { Check, Shield, Wrench } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { localDateKey } from "../../utils/progress";
import { cx } from "../../ui";
import type { Progression } from "../../api/progress";
import { MAX_SHIELDS, REPAIR_SESSIONS } from "../../../server/core/orbit";
import { OrbitRing } from "./OrbitRing";

type Orbit = Progression["orbit"];

// Ключи дней недели: понедельник из ответа сервера + 6 дней
function weekDays(monday: string): string[] {
  const [y, m, d] = monday.split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
}

// Что сказать про неделю: «ещё 2 дня», «каждый день до воскресенья», «сработает щит»…
export function useWeekStatus(o: Orbit) {
  const { t, language } = useI18n();
  const s = t.orbit.status;
  const locale = getLanguageInfo(language).htmlLang;
  switch (o.status) {
    case "closed":
      return { text: s.closed, tone: "success" as const };
    case "onTrack":
      return { text: plural(locale, o.goal - o.days.length, s.onTrack), tone: "neutral" as const };
    case "atRisk":
      return { text: s.atRisk, tone: "accent" as const };
    case "lost":
      return { text: o.shields > 0 ? s.lostShield : o.repairReady ? s.lostRepair : s.lostNew, tone: "neutral" as const };
  }
}

const TONE = {
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent-ink",
  neutral: "bg-inset text-muted",
};

export function WeekStatus({ orbit, className }: { orbit: Orbit; className?: string }) {
  const { text, tone } = useWeekStatus(orbit);
  return <p className={cx("rounded-2xl px-3.5 py-3 text-sm leading-snug", TONE[tone], className)}>{text}</p>;
}

// Пн–Вс: засчитанные дни — закрашены, сегодня — обведено
export function WeekDays({ orbit, size = "md" }: { orbit: Orbit; size?: "sm" | "md" }) {
  const { language } = useI18n();
  const locale = getLanguageInfo(language).htmlLang;
  const today = localDateKey(new Date());
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <ol className="grid grid-cols-7 gap-1">
      {weekDays(orbit.week).map((day) => {
        const date = new Date(`${day}T00:00:00Z`);
        const done = orbit.days.includes(day);
        const isToday = day === today;
        return (
          <li key={day} className="grid justify-items-center gap-1.5" aria-label={full.format(date)}>
            <span
              aria-hidden
              className={cx(
                "grid place-items-center rounded-full transition-colors",
                size === "sm" ? "h-7 w-7" : "h-9 w-9",
                done ? "bg-accent text-on-accent" : day > today ? "bg-inset" : "bg-track",
                isToday && !done && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
              )}
            >
              {done && <Check size={size === "sm" ? 14 : 16} strokeWidth={3} />}
            </span>
            <span className={cx("text-2xs font-semibold uppercase", isToday ? "text-fg" : "text-faint")}>
              {fmt.format(date).replace(".", "")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Shields({ count, label }: { count: number; label: string }) {
  return (
    <span className="flex items-center gap-1" role="img" aria-label={`${label}: ${count} / ${MAX_SHIELDS}`}>
      {Array.from({ length: MAX_SHIELDS }, (_, i) => (
        <Shield key={i} size={18} aria-hidden className={i < count ? "fill-info-soft text-info" : "text-hint"} />
      ))}
    </span>
  );
}

export function RepairLine({ orbit }: { orbit: Orbit }) {
  const { t } = useI18n();
  if (!orbit.repair) return null;
  return (
    <p className="flex items-start gap-2 rounded-2xl bg-accent-soft px-3.5 py-3 text-sm font-medium leading-snug text-accent-ink">
      <Wrench size={16} className="mt-0.5 shrink-0" />
      {t.orbit.repair
        .replace("{done}", String(orbit.repair.sessions))
        .replace("{total}", String(REPAIR_SESSIONS))}
    </p>
  );
}

// Карточка недели в шапке: кольцо, дни, состояние, серия, рекорд и щиты
export function WeekCard({ progression }: { progression: Progression }) {
  const { t, language } = useI18n();
  const o = progression.orbit;
  const locale = getLanguageInfo(language).htmlLang;
  const daysOf = t.orbit.daysOf.replace("{done}", String(Math.min(o.days.length, o.goal))).replace("{goal}", String(o.goal));

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <OrbitRing goal={o.goal} done={o.days.length} closed={o.closed} size={44} />
        <div>
          <p className="text-sm text-muted">{t.orbit.label}</p>
          <p className="font-display text-xl font-extrabold text-fg">{daysOf}</p>
        </div>
      </div>
      <WeekDays orbit={o} size="sm" />
      <RepairLine orbit={o} />
      <WeekStatus orbit={o} />
      <div className="grid gap-2 text-sm">
        <p className="flex items-center justify-between gap-3">
          <span className="font-semibold text-fg">{plural(locale, o.streak, t.orbit.inRow)}</span>
          <span className="text-muted">
            {t.orbit.best}: <span className="font-semibold tabular-nums text-fg">{o.longest}</span>
          </span>
        </p>
        <p className="flex items-center justify-between gap-3" title={t.orbit.shieldsHint}>
          <span className="text-muted">{t.orbit.shields}</span>
          <Shields count={o.shields} label={t.orbit.shields} />
        </p>
      </div>
    </div>
  );
}

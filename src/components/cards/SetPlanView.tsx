import { useState } from "react";
import { Collection } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { cx } from "../../ui";
import { Segmented } from "../other/SettingsList";
import { SetPlan, daysToStart, setPlan } from "../../perigee/setPlan";
import { newLeftToday } from "../../perigee/plan";
import { DAILY_NEW_OPTIONS, DailyNew, readDailyNew, saveDailyNew } from "../../perigee/prefs";

// План набора (docs/specs/perigee.md, «План набора и темп новых слов»): слова по силе памяти — те же
// ступени, что точки на карточке, — и когда все новые будут в работе. Ступени различаются оттенком,
// а не яркостью: крепкие — зелёные, крепнут — синие, учатся — оранжевые, новые — дорожка

const SEGMENTS = [
  { key: "strong", bar: "bg-success" },
  { key: "growing", bar: "bg-info" },
  { key: "learning", bar: "bg-accent" },
  { key: "fresh", bar: "bg-track" },
] as const;

/** Полоса плана: тонкая — на карточке набора, обычная — в окне «Учить» */
export function SetPlanBar({ plan, thin = false, className }: { plan: SetPlan; thin?: boolean; className?: string }) {
  const share = (n: number) => `${plan.total > 0 ? (n / plan.total) * 100 : 0}%`;
  return (
    <div className={cx("flex overflow-hidden rounded-full bg-track", thin ? "h-1.5" : "h-2", className)} aria-hidden>
      {SEGMENTS.slice(0, 3).map((s) => (
        <div key={s.key} className={cx("h-full transition-[width] duration-700", s.bar)} style={{ width: share(plan[s.key]) }} />
      ))}
    </div>
  );
}

/** Легенда плана: точка, ступень и число слов — только ступени, где слова есть */
export function SetPlanLegend({ plan, className }: { plan: SetPlan; className?: string }) {
  const { t } = useI18n();
  const p = t.words.setPlan;
  const labels = { strong: p.strong, growing: p.growing, learning: p.learning, fresh: p.fresh };
  return (
    <div className={cx("flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted", className)}>
      {SEGMENTS.filter((s) => plan[s.key] > 0).map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          {/* У новых точка темнее дорожки: на подложке панели дорожка сливалась (как пустые точки силы слова) */}
          <span className={cx("h-2 w-2 rounded-full", s.key === "fresh" ? "bg-faint/45" : s.bar)} />
          {labels[s.key]} <span className="font-semibold tabular-nums text-fg">{plan[s.key]}</span>
        </span>
      ))}
    </div>
  );
}

/** План набора в окне «Учить»: полоса, легенда, срок новых слов и темп */
export function SetPlanPanel({ collection }: { collection: Collection }) {
  const { t, language } = useI18n();
  const { collections } = useData();
  const p = t.words.setPlan;
  const locale = getLanguageInfo(language).htmlLang;
  const [dailyNew, setDailyNew] = useState<DailyNew>(readDailyNew);

  const plan = setPlan(collection.cards);
  if (plan.total === 0) return null;
  // Лимит новых слов общий на курс: сегодня можно начать столько, сколько осталось от темпа
  const course = collections.some((c) => c.id === collection.id) ? collections : [...collections, collection];
  const days = daysToStart(plan.fresh, newLeftToday(course, new Date(), dailyNew), dailyNew);
  const eta =
    plan.fresh === 0 ? p.allStarted : days === 0 ? p.today : plural(locale, days, p.eta).replace("{d}", String(dailyNew));
  const change = (n: DailyNew) => {
    setDailyNew(n);
    saveDailyNew(n);
  };

  return (
    <section className="grid gap-2.5 rounded-2xl bg-inset p-3.5" aria-label={p.title}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-fg">{p.title}</p>
        <p className="text-xs tabular-nums text-muted">{plural(locale, plan.total, t.words.collectionCard.words)}</p>
      </div>
      <SetPlanBar plan={plan} />
      <SetPlanLegend plan={plan} />
      <p className="text-sm text-fg">{eta}</p>
      {/* Темп — только когда есть что начинать: от него зависит срок выше */}
      {plan.fresh > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">{p.dailyNew}</span>
          <div className="w-40 shrink-0">
            <Segmented<string>
              label={p.dailyNew}
              value={String(dailyNew)}
              options={DAILY_NEW_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
              onChange={(v) => change(Number(v) as DailyNew)}
            />
          </div>
        </div>
      )}
    </section>
  );
}

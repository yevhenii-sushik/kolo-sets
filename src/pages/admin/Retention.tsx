// Удержание: когорты по неделе регистрации и путь новичка (docs/specs/admin.md → «Удержание»).
// Только сводные числа; считает сервер (/api/admin-metrics), здесь — показ
import { RefreshCw } from "lucide-react";
import { fetchMetrics, type CohortRow, type FunnelId, type FunnelStep, type Rate } from "../../api/admin";
import { Alert, Button, Text, cx } from "../../ui";
import { ErrorBox, Loading, Section, Stat, dayLabel, n, useLoad } from "./parts";

const pct = (r: Rate) => (r.of ? Math.round((r.hit / r.of) * 100) : null);

// «43 %», а пока окно у всех ещё идёт — прочерк
const rateText = (r: Rate) => {
  const p = pct(r);
  return p === null ? "—" : `${p} %`;
};
const rateHint = (r: Rate) => (r.of ? `${n(r.hit)} из ${n(r.of)}` : "окно ещё идёт");

const STEP_LABEL: Record<FunnelId, string> = {
  account: "Аккаунт",
  course: "Выбрал язык",
  set: "Завёл набор",
  words: "5 слов",
  session: "Первая тренировка",
  week2: "Вернулся на второй неделе",
};

export default function Retention() {
  const { data, error, loading, reload } = useLoad(fetchMetrics, "metrics");
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const t = data.total;
  const skipped = data.excluded.team + data.excluded.disabled;

  return (
    <>
      {data.truncated && <Alert tone="warning">Посчитаны первые 20 000 аккаунтов: дальше функции не хватит времени.</Alert>}

      <Text tone="muted">
        Регистрации за {data.weeks} недель, с {dayLabel(data.from)}: {n(t.users)} человек. Возврат — тренировка в своём окне:
        D1 — на второй день, D7 — на второй неделе (дни 7–13), D30 — во второй месяц (дни 30–59). В долю идут только те,
        чьё окно уже закончилось.
      </Text>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="D1 · второй день" value={rateText(t.d1)} hint={rateHint(t.d1)} />
        <Stat label="D7 · вторая неделя" value={rateText(t.d7)} hint={rateHint(t.d7)} />
        <Stat label="D30 · второй месяц" value={rateText(t.d30)} hint={rateHint(t.d30)} />
        <Stat label="Замкнули орбиту" value={rateText(t.orbit)} hint={rateHint(t.orbit)} />
      </div>

      <Section title="Когорты по неделе регистрации" aside="неделя с понедельника">
        <CohortTable rows={data.cohorts} />
      </Section>

      <Section title="Путь новичка" aside="за те же недели">
        <Funnel steps={data.funnel} />
      </Section>

      {/* Пробный режим (шаг 16 в docs/specs/06-audit-fixes.md): сколько начали без аккаунта и сохранили прогресс */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Начали без аккаунта" value={n(data.trial.started)} hint="за те же недели" />
        <Stat
          label="Сохранили прогресс"
          value={n(data.trial.saved)}
          hint={data.trial.started ? `${Math.round((data.trial.saved / data.trial.started) * 100)} % начавших` : "пока некому"}
        />
        <Stat
          label="Удалено без входа"
          value={n(data.trialsDeleted + data.unverifiedDeleted)}
          hint={`30 дней не открывали, за всё время: проба — ${n(data.trialsDeleted)}, без подтверждения почты — ${n(data.unverifiedDeleted)}`}
        />
      </div>

      <Text size="xs" tone="faint">
        {skipped > 0 && `Не в счёте: команда — ${n(data.excluded.team)}, отключённые — ${n(data.excluded.disabled)}. `}
        Удалённые аккаунты пропадают вместе с данными, поэтому настоящий возврат немного ниже; пробные аккаунты, которые
        30 дней не открывали, удаляются сами — у когорт старше месяца пробных бросивших в счёте нет. День регистрации — по
        часовому поясу человека. Занятие — любая тренировка, включая закрепление.
      </Text>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" loading={loading} iconLeft={<RefreshCw size={16} />} onClick={reload}>
          Обновить
        </Button>
      </div>
    </>
  );
}

// Ячейка: доля крупно, «сколько из скольких» мелко; пустая неделя — без строки цифр
function RateCell({ rate }: { rate: Rate }) {
  const p = pct(rate);
  return (
    <td className="px-3 py-2 text-right align-top">
      <span className={cx("block font-semibold tabular-nums", p === null ? "text-faint" : "text-fg")}>{rateText(rate)}</span>
      {rate.of > 0 && (
        <span className="block text-xs tabular-nums text-faint">
          {n(rate.hit)}/{n(rate.of)}
        </span>
      )}
    </td>
  );
}

function CohortTable({ rows }: { rows: CohortRow[] }) {
  return (
    // На телефоне таблица шире экрана — прокручивается внутри секции
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-md text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="py-2 pr-3 text-left font-medium">
              Неделя
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Пришло
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              D1
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              D7
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              D30
            </th>
            <th scope="col" className="py-2 pl-3 text-right font-medium">
              Орбита
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.week} className="border-b border-line last:border-0">
              <th scope="row" className="py-2 pr-3 text-left align-top font-medium text-fg">
                {dayLabel(r.week)}
              </th>
              <td className="px-3 py-2 text-right align-top font-semibold tabular-nums text-fg">{n(r.users)}</td>
              {r.users === 0 ? (
                <td colSpan={4} className="py-2 pl-3 text-right align-top text-faint">
                  никто не пришёл
                </td>
              ) : (
                <>
                  <RateCell rate={r.d1} />
                  <RateCell rate={r.d7} />
                  <RateCell rate={r.d30} />
                  <RateCell rate={r.orbit} />
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Полоса — доля от всех аккаунтов; у «второй недели» — от тех, у кого она уже прошла.
// «От прошлого шага» показывает, где именно люди отваливаются
function Funnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <ol className="grid gap-3">
      {steps.map((s, i) => {
        const share = s.of ? s.reached / s.of : 0;
        const prev = steps[i - 1];
        // У «второй недели» своя база, поэтому шаг к ней считаем от тех же людей, что и её долю
        const fromPrev = prev && prev.reached > 0 && s.id !== "week2" ? Math.round((s.reached / prev.reached) * 100) : null;
        return (
          <li key={s.id} className="grid gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-semibold text-fg">{STEP_LABEL[s.id]}</span>
              <span className="text-sm tabular-nums text-fg">
                <span className="font-semibold">{n(s.reached)}</span>
                <span className="text-muted"> · {s.of ? `${Math.round(share * 100)} %` : "—"}</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-track" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${share * 100}%` }} />
            </div>
            {(fromPrev !== null || s.id === "week2") && (
              <Text size="xs" tone="faint">
                {s.id === "week2"
                  ? s.of
                    ? `из ${n(s.of)}, у кого вторая неделя уже прошла`
                    : "вторая неделя ещё ни у кого не прошла"
                  : `от прошлого шага: ${fromPrev} %`}
              </Text>
            )}
          </li>
        );
      })}
    </ol>
  );
}

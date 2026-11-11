// Обзор: аккаунты, активность, тренировки, последние регистрации (docs/specs/admin.md)
import { RefreshCw } from "lucide-react";
import { fetchOverview } from "../../api/admin";
import { Alert, Button } from "../../ui";
import { Avatar, ErrorBox, Facts, Loading, Section, SignupChart, Stat, ago, n, provider, useLoad } from "./parts";

export default function Overview({ onOpen }: { onOpen: (query: string) => void }) {
  // Сводка не зависит от параметров — ключ постоянный, обновление — кнопкой
  const { data, error, loading, reload } = useLoad(fetchOverview, "overview");
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const a = data.accounts;
  const s = data.sessions;
  const month = a.byDay.reduce((sum, d) => sum + d.signups, 0);
  const providers = Object.entries(a.providers).sort((x, y) => y[1] - x[1]);

  return (
    <>
      {data.truncated && <Alert tone="warning">Посчитаны первые 20 000 аккаунтов: дальше сводке не хватит времени функции.</Alert>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Аккаунтов" value={n(a.total)} hint={data.profiles !== null && `профилей в базе: ${n(data.profiles)}`} />
        <Stat label="Новых за 7 дней" value={n(a.new7)} hint={`за 30 дней: ${n(a.new30)}`} />
        <Stat label="Заходили за 7 дней" value={n(a.active7)} hint={`сегодня: ${n(a.active1)} · за 30: ${n(a.active30)}`} />
        <Stat
          label="Тренировок за 7 дней"
          value={s.last7 === null ? "—" : n(s.last7)}
          hint={s.last7 === null ? "нужен индекс — docs/specs/admin.md" : s.total !== null && `всего: ${n(s.total)}`}
        />
      </div>

      <Section title="Регистрации за 30 дней" aside={`${n(month)} · дни по UTC`}>
        <SignupChart days={a.byDay} />
      </Section>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Section title="Последние регистрации">
          <ul className="-mx-2 -my-1 grid">
            {data.recent.map((u) => (
              <li key={u.uid}>
                <button
                  type="button"
                  onClick={() => onOpen(u.uid)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <Avatar name={u.name ?? u.email} />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-fg">{u.name ?? u.email ?? u.uid}</span>
                    <span className="truncate text-xs text-muted">{u.name ? u.email : u.providers.map(provider).join(", ")}</span>
                  </span>
                  <span className="shrink-0 text-xs text-faint">{ago(u.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Аккаунты">
          <Facts
            rows={[
              ...providers.map(([id, count]): [string, string] => [provider(id), n(count)]),
              ["Email подтверждён", `${n(a.verified)} из ${n(a.total)}`],
              ["Отключены", n(a.disabled)],
            ]}
          />
        </Section>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" loading={loading} iconLeft={<RefreshCw size={16} />} onClick={reload}>
          Обновить
        </Button>
      </div>
    </>
  );
}

// Общие части админ-панели: форматирование, загрузка, плитки, график (docs/specs/admin.md).
// Панель — внутренний инструмент команды, поэтому тексты здесь на русском, без i18n
import { Fragment, useCallback, useEffect, useState, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { ApiError } from "../../api/http";
import { Alert, Button, Card, Heading, Spinner, Text, cx } from "../../ui";

const LOCALE = "ru";

export const n = (v: number) => v.toLocaleString(LOCALE);

export const dateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

// Ключ дня «2026-11-10» → «10 нояб.»; ключи сводки — по UTC
export const dayLabel = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" });

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const STEPS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [3600, "minute"],
  [86_400, "hour"],
  [86_400 * 30, "day"],
  [86_400 * 365, "month"],
  [Infinity, "year"],
];
const UNIT_SEC: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86_400, month: 86_400 * 30, year: 86_400 * 365 };

export function ago(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.parse(iso) - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return "только что";
  const [, unit] = STEPS.find(([limit]) => Math.abs(diff) < limit)!;
  return rtf.format(Math.round(diff / UNIT_SEC[unit]), unit);
}

// Время занятий: «3 ч 20 мин»; длительность тренировки: «1:25»
export const studyTime = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} ч ${m} мин` : `${m} мин`;
};
export const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export const PROVIDERS: Record<string, string> = { "google.com": "Google", password: "Email и пароль", other: "Другое" };
export const provider = (id: string) => PROVIDERS[id] ?? id;

export const KINDS: Record<string, string> = {
  flashcards: "Карточки",
  review: "Повторение",
  quiz: "Тест",
  speed: "На скорость",
  survival: "Выживание",
  match: "Пары",
};

// ── Загрузка ──

export function useLoad<T>(load: () => Promise<T>, key: string) {
  const [state, setState] = useState<{ data?: T; error?: unknown; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    load().then(
      (data) => alive && setState({ data, loading: false }),
      (error) => alive && setState({ error, loading: false }),
    );
    return () => {
      alive = false;
    };
    // load меняется на каждом рендере; перезагрузка — по ключу и кнопке «Обновить»
  }, [key, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function Loading() {
  return (
    <div className="grid place-items-center py-16 text-muted">
      <Spinner size={24} />
    </div>
  );
}

// В npm run dev /api уходит на продакшен: пока функции не выложены, там 404
function errorText(error: unknown): string {
  const status = error instanceof ApiError ? error.status : 0;
  if (status === 401 || status === 403) return "Нет доступа: в токене нет прав админа. Выйди и войди снова, если права выдали только что.";
  if (status === 404) return "Функций админ-панели нет на этом адресе: они появятся после выкладки.";
  if (status === 400) return "Такой запрос не подходит. Ищи по email, @имени или uid.";
  return "Не удалось загрузить. Проверь сеть и попробуй ещё раз.";
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="grid justify-items-start gap-3">
      <Alert className="w-full">{errorText(error)}</Alert>
      {onRetry && (
        <Button variant="secondary" size="sm" iconLeft={<RefreshCw size={16} />} onClick={onRetry}>
          Ещё раз
        </Button>
      )}
    </div>
  );
}

// ── Плитки и секции ──

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card padding="sm" radius="lg" className="grid content-start gap-1.5">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <p className="font-display text-3xl font-extrabold leading-none tabular-nums text-fg">{value}</p>
      {hint && (
        <Text size="xs" tone="faint">
          {hint}
        </Text>
      )}
    </Card>
  );
}

export function Section({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card padding="sm" radius="lg" className={cx("grid content-start gap-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading size={3} as="h2">
          {title}
        </Heading>
        {aside && (
          <Text size="xs" tone="faint" as="span">
            {aside}
          </Text>
        )}
      </div>
      {children}
    </Card>
  );
}

// Пары «название — значение»; null и undefined пропускаем
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {rows
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 break-words text-right font-medium tabular-nums text-fg">{v}</dd>
          </Fragment>
        ))}
    </dl>
  );
}

// ── График регистраций ──
// Один ряд — один цвет (accent), без легенды: заголовок секции называет ряд.
// Подсказка — при наведении на всю колонку (цель шире столбика); для скринридера — таблица

export function SignupChart({ days }: { days: { day: string; signups: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.signups));
  return (
    <figure className="grid gap-2">
      <div className="flex h-36 items-end gap-0.5 border-b border-line pt-8" aria-hidden="true">
        {days.map((d, i) => {
          const pct = (d.signups / max) * 100;
          const edge = i < 3 ? "left-0" : i > days.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              {d.signups > 0 ? (
                <div className="w-full rounded-t bg-accent transition-colors group-hover:bg-accent-hover" style={{ height: `${pct}%` }} />
              ) : (
                <div className="h-0.5 w-full rounded-full bg-track" />
              )}
              <span
                className={cx(
                  "pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-lg bg-fg px-2 py-1 text-xs font-medium text-on-inverse shadow-md group-hover:block",
                  edge,
                )}
                style={{ bottom: `calc(${pct}% + 6px)` }}
              >
                {dayLabel(d.day)} · {n(d.signups)}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="flex justify-between text-xs text-faint">
        <span>{dayLabel(days[0].day)}</span>
        <span>макс. {n(max)} в день</span>
        <span>сегодня</span>
      </figcaption>
      <table className="sr-only">
        <caption>Регистрации по дням</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{dayLabel(d.day)}</th>
              <td>{d.signups}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// Буква для кружка-аватара
export const initial = (s: string | null | undefined) => (s?.trim()?.[0] ?? "?").toUpperCase();

export function Avatar({ name, size = "md" }: { name: string | null | undefined; size?: "md" | "lg" }) {
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent-ink",
        size === "lg" ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm",
      )}
      aria-hidden="true"
    >
      {initial(name)}
    </span>
  );
}

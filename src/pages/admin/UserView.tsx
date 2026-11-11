// Карточка пользователя: аккаунт, прогресс, награды, учёба в цифрах, тренировки (docs/specs/admin.md).
// Названий наборов и слов здесь нет намеренно — сервер их не отдаёт
import { useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { fetchUser, type AdminUser } from "../../api/admin";
import { courseFlag, courseName } from "../../courses/languages";
import { Alert, Badge, Button, IconButton, Text } from "../../ui";
import { Avatar, ErrorBox, Facts, KINDS, Loading, Section, ago, clock, dateTime, dayLabel, n, provider, studyTime, useLoad } from "./parts";

const course = (id: string | null) => (id ? `${courseFlag(id) ?? ""} ${courseName(id, "ru")}`.trim() : "Без курса");

export default function UserView({ query, onBack }: { query: string; onBack: () => void }) {
  const { data, error } = useLoad(() => fetchUser(query), query);

  const back = (
    <Button variant="ghost" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={onBack} className="justify-self-start">
      К обзору
    </Button>
  );

  if (error) return <div className="grid gap-4">{back}<ErrorBox error={error} /></div>;
  if (!data) return <Loading />;
  if (!data.found) {
    return (
      <div className="grid gap-4">
        {back}
        <Alert tone="info">Никого не нашли по «{query}». Email и uid — точное совпадение, имя — с @ или без.</Alert>
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {back}
      <Profile user={data.user} />
    </div>
  );
}

function CopyUid({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <code className="break-all font-mono text-xs">{uid}</code>
      <IconButton
        label={copied ? "Скопировано" : "Скопировать uid"}
        size="sm"
        onClick={() =>
          navigator.clipboard?.writeText(uid).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
        }
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </IconButton>
    </span>
  );
}

function Profile({ user }: { user: AdminUser }) {
  const { account: a, profile: p, learning: l, sessions } = user;
  const name = p?.displayName ?? a.name;

  return (
    <>
      <Section title="Аккаунт">
        <div className="flex items-center gap-4">
          <Avatar name={name ?? a.email} size="lg" />
          <div className="grid min-w-0 gap-1">
            <p className="truncate font-display text-2xl font-extrabold leading-tight text-fg">{name ?? "Без имени"}</p>
            <Text size="sm" tone="muted" className="truncate">
              {[p?.username && `@${p.username}`, a.email].filter(Boolean).join(" · ")}
            </Text>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {a.admin && <Badge tone="accent">Админ</Badge>}
              {a.disabled && <Badge tone="danger">Отключён</Badge>}
              {a.email && !a.verified && <Badge tone="warning">Email не подтверждён</Badge>}
              {a.providers.map((id) => (
                <Badge key={id}>{provider(id)}</Badge>
              ))}
            </div>
          </div>
        </div>
        <Facts
          rows={[
            ["uid", <CopyUid uid={a.uid} />],
            ["Регистрация", dateTime(a.createdAt)],
            ["Последний раз в приложении", ago(a.lastActiveAt)],
            ["Последний вход", dateTime(a.lastSignInAt)],
            ["Часовой пояс", p?.timezone ?? "—"],
            ["Принятые документы", p?.legalVersion ?? "—"],
          ]}
        />
      </Section>

      {!p ? (
        <Alert tone="warning">Профиля в базе нет: аккаунт есть, но приложение после регистрации не открылось до конца.</Alert>
      ) : (
        <>
          <div className="grid items-start gap-6 md:grid-cols-2">
            <Section title="Прогресс">
              <Facts
                rows={[
                  ["Уровень", n(p.level)],
                  ["Опыт", n(p.xp)],
                  ["Серия орбит", p.orbit ? `${n(p.orbit.streak)} нед. · рекорд ${n(p.orbit.longest)}` : "—"],
                  [
                    "Эта неделя",
                    p.orbit ? (p.orbit.goalSet ? `${p.orbit.days} из ${p.orbit.goal} дн.${p.orbit.closed ? " · закрыта" : ""}` : `${p.orbit.days} дн. · цель не выбрана`) : "—",
                  ],
                  ["Щиты", p.orbit ? n(p.orbit.shields) : "—"],
                  ["Огоньки (до орбит)", p.legacyFlames ? n(p.legacyFlames) : null],
                  ["Достижений", n(p.achievements)],
                ]}
              />
            </Section>

            <Section title="Награды">
              <Facts
                rows={[
                  ["Капсулы", n(p.loot.capsules)],
                  ["Звёздная пыль", n(p.loot.dust)],
                  ["Предметов", n(p.loot.items)],
                  ["Капсул без эпического", n(p.loot.pity)],
                ]}
              />
              {p.loot.medals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.loot.medals.map((m) => (
                    <Badge key={m} tone="special">
                      {m}
                    </Badge>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Учёба" aside="только счётчики — слова личные">
              <Facts
                rows={[
                  ["Наборов", n(l.sets)],
                  ["Карточек", n(l.cards)],
                  ...l.byCourse.map((c): [string, string] => [
                    `${course(c.courseId)}${c.courseId && c.courseId === p.activeCourseId ? " · активный" : ""}`,
                    `${n(c.sets)} наб. · ${n(c.cards)} карт.`,
                  ]),
                  // Курс без наборов тоже важен: человек выбрал язык, но ничего не создал
                  ...p.courses
                    .filter((id) => !l.byCourse.some((c) => c.courseId === id))
                    .map((id): [string, string] => [`${course(id)}${id === p.activeCourseId ? " · активный" : ""}`, "нет наборов"]),
                ]}
              />
            </Section>

            <Section title="Статистика">
              <Facts
                rows={[
                  ["Тренировок с карточками", n(p.stats.flashcardSessions)],
                  ["Тестов", `${n(p.stats.quizzesTaken)} · идеальных ${n(p.stats.perfectQuizzes)}`],
                  ["Игр", n(p.stats.gamesPlayed)],
                  ["Время занятий", studyTime(p.stats.totalStudyTime)],
                  ["Выучено карточек", n(p.stats.cardsLearned)],
                  ["Последний день занятий", p.lastStudyDay ? dayLabel(p.lastStudyDay) : "—"],
                ]}
              />
            </Section>
          </div>

          {p.history.length > 0 && (
            <Section title="Дни занятий" aside={`последние ${p.history.length} · по часовому поясу пользователя`}>
              <Table
                head={["День", "Тренировок", "Карточек", "Время"]}
                rows={p.history.map((h) => [dayLabel(h.date), n(h.sessions), n(h.cardsStudied), studyTime(h.timeSpent)])}
              />
            </Section>
          )}
        </>
      )}

      <Section title="Последние тренировки" aside={sessions.length ? `${sessions.length} последних` : undefined}>
        {sessions.length ? (
          <Table
            head={["Когда", "Режим", "Карточек", "Верно", "Время", "Опыт"]}
            rows={sessions.map((s) => [
              dateTime(s.createdAt),
              KINDS[s.kind] ?? s.kind,
              n(s.cards),
              s.correct === null ? "—" : n(s.correct),
              clock(s.durationSec),
              s.xp === null ? "—" : `+${n(s.xp)}`,
            ])}
          />
        ) : (
          <Text size="sm" tone="muted">
            Тренировок в журнале нет.
          </Text>
        )}
      </Section>
    </>
  );
}

// Таблица с прокруткой внутри карточки: на телефоне страница не уезжает вбок
function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-faint">
            {head.map((h, i) => (
              <th key={h} scope="col" className={i ? "px-3 py-2 text-right font-medium" : "py-2 pr-3 font-medium"}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, j) => (
            <tr key={j} className="border-b border-line last:border-0">
              {r.map((c, i) => (
                <td key={i} className={i ? "px-3 py-2 text-right tabular-nums text-fg" : "whitespace-nowrap py-2 pr-3 text-muted"}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

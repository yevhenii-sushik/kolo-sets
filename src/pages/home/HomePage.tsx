import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Layers, Lightbulb, RotateCw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { TIPS_ICONS } from "../../data/home/tips";
import DailyGameWidget from "../../components/game/DailyGameWidget";
import { FirstSteps, FirstStepsGuides, useFirstSteps } from "../../components/onboarding/FirstSteps";
import { FEATURES } from "../../config/features";
import { getDailyGoal, isDueCard, isNewCard } from "../../utils/storage";
import { newLeftToday } from "../../perigee/plan";
import { readDailyNew } from "../../perigee/prefs";
import { localDateKey } from "../../utils/progress";
import { ALL_ACHIEVEMENTS } from "../../utils/achievements";
import { getLanguageInfo } from "../../locales/languages";
import { plural, type PluralForms } from "../../utils/plural";
import { ButtonLink, Card, Heading, IconButton, Loading, Ring, Skeleton, Text, cx } from "../../ui";
import { OrbitScene, type SceneKind } from "../../components/scenes/OrbitScene";
import { pickNudge } from "../../motivation/nudge";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const MILESTONES = [10, 25, 50, 100, 200, 500];

// Главная: приветствие → что делать сейчас (у новичка — «Первые шаги», дальше — повторение, новые слова
// или наборы) с целью дня → цифры → игра дня и совет (оба пока выключены). В главной карточке — «голос» Kolo (фраза по настоящим
// данным: перерыв, орбита недели, цель дня) и живая сцена под состояние слов (docs/roadmap.md, «Живой Kolo»)
export default function HomePage() {
  const { t, language } = useI18n();
  const h = t.home;
  const { profile, collections, totalCards, profileLoading, contentReady, progression } = useData();
  const { user } = useAuth();
  const locale = getLanguageInfo(language).htmlLang;
  const count = (n: number, forms: PluralForms) => plural(locale, n, forms);

  const firstSteps = useFirstSteps();
  const wide = useMediaQuery("(min-width: 640px)"); // sm: где стоит сцена главной карточки
  // Без наборов главная соврала бы: «Начни с первого набора», «0 слов», а через полсекунды
  // перескочила бы на «12 слов к повторению». Обычно наборы уже есть в кэше устройства и
  // скелетона не видно; он нужен при первом входе с устройства и пока наборов ещё нет
  const loading = !contentReady;

  // ── Что делать сейчас и цель дня ──
  const dueCount = useMemo(() => collections.reduce((n, col) => n + col.cards.filter(isDueCard).length, 0), [collections]);
  // Новые слова ещё не тренировались — они не «к повторению», но и «всё повторено» про них говорить нельзя
  const newCount = useMemo(() => collections.reduce((n, col) => n + col.cards.filter(isNewCard).length, 0), [collections]);
  // Главная кнопка — сессия Perigee (docs/specs/perigee.md); исчерпан дневной лимит новых — предлагаем ещё, но не навязываем
  const dailyNew = readDailyNew();
  const newAllowed = useMemo(() => newLeftToday(collections, new Date(), dailyNew), [collections, dailyNew]);
  // Сцена рассказывает то же, что заголовок: слова уплывают (повторить), заходят на орбиту (новые),
  // орбита пуста (начать), луна (на сегодня хватит), всё спокойно (повторено)
  const now: { title: string; text: string; button: string; to: string; scene: SceneKind } =
    dueCount > 0
      ? { title: count(dueCount, h.review.dueTitle), text: h.review.dueText, button: h.review.dueButton, to: "/learn", scene: "drift" }
      : collections.length === 0
        ? { title: h.review.startTitle, text: h.review.startText, button: h.review.startButton, to: "/words?new=1", scene: "empty" }
        : totalCards === 0
          ? { title: h.review.emptyTitle, text: h.review.emptyText, button: h.review.emptyButton, to: `/collection/${collections[0].id}/edit`, scene: "empty" }
          : newCount > 0 && newAllowed > 0
            ? { title: count(newCount, h.review.newTitle), text: h.review.newText, button: h.review.newButton, to: "/learn", scene: "launch" }
            : newCount > 0
            ? { title: h.review.limitTitle, text: h.review.limitText, button: h.review.limitButton, to: "/learn?extra=1", scene: "rest" }
            : { title: h.review.doneTitle, text: h.review.doneText, button: h.review.doneButton, to: "/words", scene: "calm" };
  const dailyGoal = getDailyGoal();
  const todayStudied = useMemo(() => {
    // Ключ дня — по местному времени: так сервер записывает историю (docs/specs/00-server.md)
    const today = localDateKey(new Date());
    return profile?.studyHistory?.find((d: any) => d.date === today)?.cardsStudied ?? 0;
  }, [profile?.studyHistory]);
  const goalMet = todayStudied >= dailyGoal;

  // «Голос» главной: что сказать именно сейчас (src/motivation/nudge.ts). Пока наборов нет, говорить
  // о перерывах и целях рано — там и так «Начни с первого набора»
  const nudge = useMemo(() => {
    if (collections.length === 0 || totalCards === 0) return null;
    const date = new Date();
    const n = pickNudge({
      today: localDateKey(date),
      hour: date.getHours(),
      todayStudied,
      dailyGoal,
      dueCount,
      history: profile?.studyHistory ?? [],
      orbit: progression?.orbit,
      genericCount: h.nudge.generic.length,
    });
    if (n.key === "generic") return h.nudge.generic[n.index];
    const line = h.nudge[n.key];
    return typeof line === "string" ? line : count(n.n ?? 0, line);
  }, [collections.length, totalCards, todayStudied, dailyGoal, dueCount, profile?.studyHistory, progression?.orbit, h, locale]);

  // ── Веха: следующее круглое число слов ──
  const nextMilestone = MILESTONES.find((m) => totalCards < m) ?? null;
  const milestonePct = nextMilestone ? Math.min(100, Math.round((totalCards / nextMilestone) * 100)) : 100;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : hour >= 18 && hour < 23 ? "evening" : "night";
    const options = h.greeting[period];
    return options[(hour + new Date().getDate()) % options.length];
  }, [h.greeting]);

  // Имя из профиля, а если его там нет (старые аккаунты) — из аккаунта, как в профиле
  const name = (profile?.displayName || user?.displayName)?.split(" ")[0] || (profileLoading ? "…" : h.guest);
  const unlocked = profile?.achievements?.length ?? 0;

  return (
    <div className="grid gap-4 sm:gap-5">
      {/* ── Приветствие ── */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {profile?.photoURL || user?.photoURL ? (
            <img src={profile?.photoURL || user?.photoURL || ""} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-lg font-extrabold text-accent-ink">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <Text size="sm" tone="muted">
              {greeting}
            </Text>
            <Heading size={1} className="truncate">
              {name}
            </Heading>
          </div>
        </div>
        <ButtonLink to="/profile" variant="secondary" size="sm" iconLeft={<Trophy size={16} />} aria-label={h.achievements} title={h.achievements}>
          {unlocked}/{ALL_ACHIEVEMENTS.length}
        </ButtonLink>
      </header>

      {/* ── Что делать сейчас: у новичка — «Первые шаги»; потом — повторение, новые слова или наборы; справа — цель дня ── */}
      <FirstStepsGuides model={firstSteps} />
      {loading ? (
        <HomeSkeleton label={t.loading} />
      ) : (
      <>
      {firstSteps.mode !== "hidden" ? (
        <FirstSteps model={firstSteps} />
      ) : (
      <Card tone="inverse" padding="lg" className="relative grid gap-8 overflow-hidden sm:grid-cols-[1fr_auto] sm:items-center">
        {/* Сцена: на телефоне выглядывает из правого верхнего угла (цель дня — внизу карточки), на широком
            экране обходит кольцо цели дня — слова-спутники кружат вокруг сегодняшнего прогресса */}
        {!wide && <OrbitScene kind={now.scene} tone="inverse" className="absolute -right-16 -top-16 h-52 w-52" />}
        <div className="relative grid justify-items-start gap-3">
          {nudge && (
            <p className="flex max-w-md items-start gap-2 pr-12 text-sm font-semibold leading-snug text-on-inverse/85 sm:pr-0">
              <span aria-hidden className="relative mt-1.5 flex h-2 w-2 shrink-0">
                <span className="absolute inset-0 rounded-full bg-accent motion-safe:animate-ping" />
                <span className="relative h-2 w-2 rounded-full bg-accent" />
              </span>
              {nudge}
            </p>
          )}
          <Heading size={1} as="h2" tone="inverse">
            {now.title}
          </Heading>
          <Text tone="inverse">{now.text}</Text>
          <ButtonLink to={now.to} size="lg" iconRight={<ArrowRight size={18} />} className="mt-2">
            {now.button}
          </ButtonLink>
        </div>
        <div className="relative flex items-center gap-4 sm:grid sm:justify-items-center sm:gap-3 sm:text-center">
          {/* relative у кольца и подписи — чтобы они лежали поверх сцены */}
          <div className="relative grid shrink-0 place-items-center">
            {wide && (
              <OrbitScene kind={now.scene} tone="inverse" halo className="absolute left-1/2 top-1/2 h-68 w-68 -translate-x-1/2 -translate-y-1/2" />
            )}
            <span className="relative">
              <Ring
                value={todayStudied / dailyGoal}
                size={112}
                stroke={10}
                tone={goalMet ? "success" : "accent"}
                track="inverse"
                label={`${h.goal.label}: ${todayStudied} / ${dailyGoal}`}
              >
                <span className="font-display text-2xl font-extrabold text-on-inverse">
                  {todayStudied}
                  <span className="text-base text-on-inverse/50">/{dailyGoal}</span>
                </span>
              </Ring>
            </span>
          </div>
          <div className="relative">
            <p className="text-sm font-semibold text-on-inverse">{h.goal.label}</p>
            <p className="text-sm text-on-inverse/75">{goalMet ? h.goal.met : count(dailyGoal - todayStudied, h.goal.left)}</p>
          </div>
        </div>
      </Card>
      )}

      {/* ── Цифры и веха ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookOpen size={18} />} value={totalCards} label={count(totalCards, h.stats.words)} />
        <StatCard icon={<Layers size={18} />} value={collections.length} label={count(collections.length, h.stats.sets)} />
        <Card className="col-span-2 grid content-between gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-fg">{h.milestone.label}</p>
            {nextMilestone && <p className="text-sm text-faint tabular-nums">{h.milestone.target.replace("{m}", String(nextMilestone))}</p>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milestonePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-info"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{nextMilestone ? count(nextMilestone - totalCards, h.milestone.left) : h.milestone.done}</p>
            <Link to="/words" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink hover:underline underline-offset-2">
              {h.milestone.add}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>

      </>
      )}

      {/* ── Игра дня и совет — оба пока выключены (config/features.ts) ── */}
      {(FEATURES.dailyGame || FEATURES.tipOfDay) && (
        <div className={cx("grid gap-4", FEATURES.dailyGame && FEATURES.tipOfDay && "md:grid-cols-2")}>
          {FEATURES.dailyGame && <DailyGameWidget />}
          {FEATURES.tipOfDay && <TipOfDay />}
        </div>
      )}
    </div>
  );
}

// Совет дня: случайный из home.tips, обновляется по кнопке. Выключен флагом FEATURES.tipOfDay
function TipOfDay() {
  const { t } = useI18n();
  const h = t.home;
  const tipKeys = useMemo(() => Object.keys(h.tips), [h.tips]);
  const [tipKey, setTipKey] = useState(() => tipKeys[Math.floor(Math.random() * tipKeys.length)]);
  const tip = useMemo(() => {
    const tips = h.tips as Record<string, { category: string; text: string }>;
    const data = tips[tipKey] ?? tips[tipKeys[0]];
    return { icon: TIPS_ICONS[tipKey] ?? "💡", ...data };
  }, [tipKey, h.tips, tipKeys]);
  const refreshTip = () => setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]);

  return (
    <Card className="grid content-start gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-accent-ink" />
          <Heading size={4} as="h2">
            {h.tip.title}
          </Heading>
        </div>
        <IconButton size="sm" label={h.tipRefresh} onClick={refreshTip}>
          <RotateCw size={16} />
        </IconButton>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tip.text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-start gap-4"
        >
          <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-inset text-2xl">
            {tip.icon}
          </span>
          <div className="grid gap-1">
            <p className="text-xs font-semibold text-accent-ink">{tip.category}</p>
            <p className="text-sm leading-snug text-fg">{tip.text}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

// Форма главной на время загрузки: крупная карточка «что делать сейчас», две цифры и веха
function HomeSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label}>
      <div className="grid gap-4 sm:gap-5">
        <Skeleton className="h-96 rounded-4xl sm:h-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton tone="surface" className="h-40 rounded-4xl" />
          <Skeleton tone="surface" className="h-40 rounded-4xl" />
          <Skeleton tone="surface" className="col-span-2 h-32 rounded-4xl lg:h-40" />
        </div>
      </div>
    </Loading>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card className="grid content-between gap-6">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-inset text-muted">{icon}</span>
      <div>
        <p className="font-display text-3xl font-extrabold leading-none text-fg tabular-nums">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </Card>
  );
}

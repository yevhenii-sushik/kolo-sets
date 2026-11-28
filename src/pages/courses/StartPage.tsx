import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { Alert, Button, Heading, IconButton, Loading, Logo, Skeleton, Text, cx } from "../../ui";
import LanguagePicker from "../../components/courses/LanguagePicker";
import ConsentText from "../../components/legal/ConsentText";
import { GoalOptions } from "../../components/progress/OrbitGoalModal";
import { OrbitRing } from "../../components/progress/OrbitRing";
import { topicIcon } from "../../components/presets/topicIcons";
import { courseName } from "../../courses/languages";
import { getLanguageInfo } from "../../locales/languages";
import { defaultTranslationLanguage, firstMissingPreset, hasPresets, loadPreset, type PresetSet } from "../../presets";
import { buildPresetCollection } from "../../presets/build";
import { finishOnboarding } from "../../utils/firstRun";
import { plural } from "../../utils/plural";
import { DEFAULT_GOAL } from "../../../server/core/orbit";

// Пошаговый первый вход (решение пользователя 2026-11-28, как у Duolingo): один вопрос на экран — язык →
// сколько дней в неделю → «твой первый урок» → урок. Один путь для всех новичков: и для пробы, и для тех, кто
// зарегистрировался. Пробный аккаунт создаётся только на последнем шаге, под кнопкой «Начать урок» — там и строка
// согласия (на лендинге её больше нет). Цель недели выбирается здесь, а не окном после урока
type Step = "language" | "goal" | "lesson";
const STEPS: readonly Step[] = ["language", "goal", "lesson"];

const firstPreset = (code: string) => {
  const first = firstMissingPreset(code, new Set());
  return first ? loadPreset(first.id) : Promise.resolve(null);
};

export default function StartPage() {
  const { t, language } = useI18n();
  const f = t.courses.flow;
  const g = t.orbit.goal;
  const locale = getLanguageInfo(language).htmlLang;
  const navigate = useNavigate();
  const { user, startTrial } = useAuth();
  const { courses, coursesReady, addCourse, saveCollection, checkAchievements, setWeeklyGoal } = useData();

  const [step, setStep] = useState<Step>("language");
  const [pick, setPick] = useState<{ code: string; voice: string } | null>(null);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [preset, setPreset] = useState<PresetSet | null>(null);
  const [launching, setLaunching] = useState(false);
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  const withPresets = !!pick && hasPresets(pick.code);

  // Первая тема грузится, пока человек выбирает ритм недели
  useEffect(() => {
    if (!pick || !hasPresets(pick.code)) return setPreset(null);
    let alive = true;
    firstPreset(pick.code).then((set) => alive && setPreset(set), () => alive && setPreset(null));
    return () => {
      alive = false;
    };
  }, [pick]);

  // Запуск: курс, цель недели, первый набор и урок. У пробы — когда аккаунт создан и его данные загрузились
  useEffect(() => {
    if (!launching || !user || !coursesReady || !pick || ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        await addCourse(pick.code, pick.voice);
        // Цель — в фоне: урок ждать её не должен
        setWeeklyGoal(goal).catch(() => {});
        finishOnboarding();
        const set = hasPresets(pick.code) ? (preset ?? (await firstPreset(pick.code))) : null;
        if (!set) {
          // Готовых наборов нет — главная со сценарием «Первый набор» из «Первых шагов»
          navigate("/?guide=set", { replace: true });
          return;
        }
        const collection = buildPresetCollection(set, {
          lang: defaultTranslationLanguage(pick.code, language),
          name: (t.words.ready.topics as Record<string, string>)[set.topic] ?? set.topic,
          voice: pick.voice,
          courseId: pick.code,
          now: new Date(),
        });
        // Набор сразу в памяти, запись — в фоне; медаль за первый набор — когда запись дошла
        void saveCollection(collection).then((ok) => {
          if (ok) checkAchievements().catch(() => {});
        });
        // Главная — под уроком: «Выйти» из сессии возвращает на неё
        navigate("/", { replace: true });
        navigate(`/learn?set=${collection.id}`);
      } catch {
        ran.current = false;
        setLaunching(false);
        setFailed(true);
      }
    })();
  }, [launching, user, coursesReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = async () => {
    setFailed(false);
    setLaunching(true);
    if (user) return;
    try {
      await startTrial();
    } catch (err) {
      console.error("Trial start failed", err);
      setLaunching(false);
      setFailed(true);
    }
  };

  // Вошедший — ждём его курсы; курс уже есть — первый вход пройден
  if (!launching && user && !coursesReady) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loading label={t.loading} />
      </div>
    );
  }
  if (!launching && user && courses.length > 0) return <Navigate to="/" replace />;

  const index = STEPS.indexOf(step);
  const back = step === "goal" ? () => setStep("language") : step === "lesson" ? () => setStep("goal") : null;
  const TopicIcon = preset ? topicIcon(preset.topic) : null;
  const topicName = preset ? ((t.words.ready.topics as Record<string, string>)[preset.topic] ?? preset.topic) : "";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
        {back ? (
          <IconButton label={t.back} onClick={back} disabled={launching}>
            <ArrowLeft size={20} />
          </IconButton>
        ) : (
          <Logo />
        )}
        {/* Шаги — полосой, как у Duolingo: видно, что вопросов немного */}
        <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1} aria-label={f.progress.replace("{n}", String(index + 1)).replace("{total}", String(STEPS.length))}>
          {STEPS.map((s, i) => (
            <span key={s} className={cx("h-2 flex-1 rounded-full transition-colors", i <= index ? "bg-accent" : "bg-track")} />
          ))}
        </div>
      </header>

      {step === "language" && (
        <main className="mx-auto grid max-w-3xl gap-8 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          <div className="grid gap-2">
            <Heading size={1}>{t.courses.pickTitle}</Heading>
            <Text tone="muted">{t.courses.pickSubtitle}</Text>
          </div>
          <LanguagePicker
            existing={[]}
            submitLabel={t.next}
            onPick={async (code, voice) => {
              setPick({ code, voice });
              setStep("goal");
            }}
          />
        </main>
      )}

      {step === "goal" && (
        <main className="mx-auto grid max-w-md gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          <div className="grid gap-3">
            <Heading size={1}>{f.goalTitle}</Heading>
            <div className="flex items-center gap-4 rounded-2xl bg-inset p-3">
              <OrbitRing goal={3} done={2} closed={false} size={56} />
              <p className="text-sm leading-snug text-fg">{g.ringCaption}</p>
            </div>
            <Text size="sm" tone="muted">
              {g.introNew}
            </Text>
          </div>
          <GoalOptions value={goal} onChange={setGoal} />
          <Text size="sm" tone="faint">
            {f.goalHint}
          </Text>
          <Button size="lg" fullWidth iconRight={<ArrowRight size={18} />} onClick={() => setStep("lesson")}>
            {t.next}
          </Button>
        </main>
      )}

      {step === "lesson" && pick && (
        <main className="mx-auto grid max-w-md gap-6 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          {withPresets ? (
            <>
              <Heading size={1}>{f.lessonTitle}</Heading>
              {preset && TopicIcon ? (
                <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-special-soft text-special">
                    <TopicIcon size={22} aria-hidden />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="font-semibold text-fg">{topicName}</span>
                    <span className="text-sm text-muted">
                      {courseName(pick.code, locale)} · {preset.level} · {plural(locale, preset.cards.length, t.words.collectionCard.words)}
                    </span>
                  </span>
                </div>
              ) : (
                <Skeleton className="h-20 rounded-3xl" />
              )}
              <ol className="grid gap-3">
                {f.lessonSteps.map((line, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink">{i + 1}</span>
                    <span className="pt-0.5 text-fg">{line}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <Heading size={1}>{f.ownTitle}</Heading>
              <Text tone="muted">{f.ownText}</Text>
              <ul className="grid gap-2">
                {f.ownSteps.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-fg">
                    <Check size={18} className="mt-0.5 shrink-0 text-success" />
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="grid gap-3">
            <Button size="lg" fullWidth iconRight={<ArrowRight size={18} />} loading={launching} onClick={begin}>
              {withPresets ? f.lessonStart : f.ownStart}
            </Button>
            {/* Пробный аккаунт создаётся этой кнопкой — согласие строкой под ней (без галочки, решение 2026-11-28) */}
            {!user && (
              <p className="text-center text-xs leading-snug text-faint">
                <ConsentText template={t.legal.consent.trial} labels={t.legal.consent.labels} />
              </p>
            )}
            {failed && <Alert>{t.auth.errors.trial}</Alert>}
          </div>
        </main>
      )}
    </div>
  );
}

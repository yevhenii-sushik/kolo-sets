import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { Heading, Loading, Logo, Text } from "../../ui";
import LanguagePicker from "../../components/courses/LanguagePicker";
import { defaultTranslationLanguage, firstMissingPreset, hasPresets, loadPreset } from "../../presets";
import { buildPresetCollection } from "../../presets/build";
import { finishOnboarding } from "../../utils/firstRun";

// Первый вход: без курса дальше не пройти — сначала выбираем язык
export default function StartPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const { isTrial } = useAuth();
  const { courses, coursesReady, addCourse, saveCollection, checkAchievements } = useData();
  // Пробный вход собирает первый набор: пока он грузится, держим заставку, а не главную
  const [starting, setStarting] = useState(false);

  if (!coursesReady || starting) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loading label={t.loading} />
      </div>
    );
  }
  if (courses.length > 0) return <Navigate to="/" replace />;

  // Пробный вход (шаг 16 в docs/specs/06-audit-fixes.md): человек пришёл попробовать, а не заполнять наборы —
  // сразу первая тема готовых наборов и тренировка по ней. Вступление на главной ему уже не нужно.
  // Нет готовых наборов для языка или набор не загрузился — обычная главная с «Первыми шагами»
  const startWithPreset = async (code: string, voice: string): Promise<string | null> => {
    const first = firstMissingPreset(code, new Set());
    const set = first ? await loadPreset(first.id) : null;
    if (!set) return null;
    const collection = buildPresetCollection(set, {
      lang: defaultTranslationLanguage(code, language),
      name: (t.words.ready.topics as Record<string, string>)[set.topic] ?? set.topic,
      voice,
      courseId: code,
      now: new Date(),
    });
    // Набор сразу в памяти, запись — в фоне; медаль за первый набор — когда запись дошла
    void saveCollection(collection).then((ok) => {
      if (ok) checkAchievements().catch(() => {});
    });
    return collection.id;
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto grid max-w-3xl gap-8 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="grid gap-2">
          <Heading size={1}>{t.courses.pickTitle}</Heading>
          <Text tone="muted">{t.courses.pickSubtitle}</Text>
        </div>
        <LanguagePicker
          existing={[]}
          submitLabel={t.courses.start}
          onPick={async (code, voice) => {
            if (!isTrial || !hasPresets(code)) {
              await addCourse(code, voice);
              navigate("/", { replace: true });
              return;
            }
            setStarting(true);
            await addCourse(code, voice);
            const setId = await startWithPreset(code, voice).catch(() => null);
            navigate("/", { replace: true });
            if (setId) {
              finishOnboarding();
              // Главная — под тренировкой: «Выйти» из сессии возвращает на неё
              navigate(`/learn?set=${setId}`);
            }
          }}
        />
      </main>
    </div>
  );
}

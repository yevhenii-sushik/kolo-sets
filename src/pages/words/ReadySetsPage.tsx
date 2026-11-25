import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Briefcase,
  Bus,
  CalendarDays,
  Check,
  ChevronRight,
  CloudSun,
  Hand,
  Hash,
  HeartPulse,
  House,
  MessageCircleQuestion,
  Palette,
  Plus,
  Shirt,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Alert, Badge, Button, ButtonLink, Card, Field, Heading, Loading, Modal, Select, Skeleton, Text } from "../../ui";
import { PageHeader } from "../../components/other/PageSection";
import CourseFlag from "../../components/courses/CourseFlag";
import Toast from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useToast } from "../../hooks/useToast";
import { courseName } from "../../courses/languages";
import { getLanguageInfo, type Language } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { addCollection, getCollectionOrder, saveCollectionOrder } from "../../utils/storage";
import {
  PRESET_LEVELS,
  defaultTranslationLanguage,
  loadCoursePresets,
  translationLanguages,
  type PresetLevel,
  type PresetSet,
} from "../../presets";
import { buildPresetCollection } from "../../presets/build";
import type { Collection } from "../../types";

// Значки тем — общие для всех курсов (темы — presets/levels.ts)
const TOPIC_ICONS: Record<string, LucideIcon> = {
  greetings: Hand,
  numbers: Hash,
  time: CalendarDays,
  people: Users,
  food: UtensilsCrossed,
  home: House,
  city: Bus,
  shopping: ShoppingCart,
  health: HeartPulse,
  clothes: Shirt,
  weather: CloudSun,
  work: Briefcase,
  leisure: Bike,
  verbs: Zap,
  adjectives: Palette,
  "small-words": MessageCircleQuestion,
};

// Папка уровня — оранжевая, как Kolo (первый цвет палитры папок, FOLDER_COLORS в WordsPage)
const LEVEL_FOLDER_COLOR = "#FF5A1F";

// «Готовые наборы»: темы уровней A1/A2 для активного курса. Набор копируется в наборы человека
// и дальше живёт как свой (docs/specs/05-ready-sets.md)
export default function ReadySetsPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const r = t.words.ready;
  const locale = getLanguageInfo(language).htmlLang;
  const wordsCount = (n: number) => plural(locale, n, t.words.collectionCard.words);
  const setsCount = (n: number) => plural(locale, n, t.words.library.setsCount);
  const topicTitle = (topic: string) => (r.topics as Record<string, string>)[topic] ?? topic;
  const folderName = (level: PresetLevel) => r.folder.replace("{level}", level);
  const { user } = useAuth();
  const { activeCourse, collections, folders, contentReady, setCollections, createFolder, checkAchievements } = useData();
  const { success, error, toastState, hideToast } = useToast();

  const course = activeCourse?.id;
  const [loaded, setLoaded] = useState<{ course: string; sets: PresetSet[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!course) return;
    let alive = true;
    setFailed(false);
    loadCoursePresets(course)
      .then((sets) => alive && setLoaded({ course, sets }))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [course, attempt]);
  const sets = loaded && loaded.course === course ? loaded.sets : null;

  // Язык перевода выбирается при добавлении; по умолчанию — язык интерфейса (presets/levels.ts)
  const [chosenLang, setChosenLang] = useState<Language | null>(null);
  const langs = course ? translationLanguages(course) : [];
  const lang = chosenLang && langs.includes(chosenLang) ? chosenLang : course ? defaultTranslationLanguage(course, language) : language;

  // Уже добавленные в этот курс: id готового набора → id набора человека
  const added = useMemo(
    () => new Map(collections.flatMap((c) => (c.preset ? [[c.preset.id, c.id] as const] : []))),
    [collections],
  );
  const levels = useMemo(
    () =>
      PRESET_LEVELS.map((level) => ({ level, sets: (sets ?? []).filter((s) => s.level === level) })).filter((l) => l.sets.length > 0),
    [sets],
  );
  // Одна главная кнопка на экран — у первого уровня, где ещё есть что добавить
  const primaryLevel = levels.find((l) => l.sets.some((s) => !added.has(s.id)))?.level;

  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<PresetSet | null>(null);
  const previewAdded = preview ? added.get(preview.id) : undefined;

  const build = (set: PresetSet, now: Date, extra: { offset?: number; folderId?: string } = {}) =>
    buildPresetCollection(set, {
      lang,
      name: topicTitle(set.topic),
      voice: activeCourse!.voice,
      courseId: activeCourse!.id,
      now,
      ...extra,
    });

  const addSet = async (set: PresetSet) => {
    if (!activeCourse || busy) return;
    setBusy(set.id);
    try {
      const col = build(set, new Date());
      await addCollection(col);
      setCollections((prev) => [col, ...prev]);
      success(r.addedToast);
      checkAchievements();
    } catch {
      error(r.error);
    } finally {
      setBusy(null);
    }
  };

  // Наборы приходят из базы в порядке случайных id — порядок тем закрепляем в сохранённом порядке наборов,
  // иначе после перезагрузки темы уровня в папке перемешаются
  const keepOrder = (saved: Collection[]) => {
    if (!user) return;
    const newIds = new Set(saved.map((c) => c.id));
    const current = getCollectionOrder(user.uid);
    const base = current.length > 0 ? current : collections.map((c) => c.id);
    try {
      saveCollectionOrder(user.uid, [...base.filter((id) => !newIds.has(id)), ...newIds]);
    } catch {
      // Хранилище закрыто — порядок просто не запомнится
    }
  };

  // Весь уровень: недостающие темы — в папку уровня, слова идут по порядку тем (createdAt, presets/build.ts)
  const addLevel = async (level: PresetLevel, levelSets: PresetSet[]) => {
    const missing = levelSets.filter((s) => !added.has(s.id));
    if (!activeCourse || busy || missing.length === 0) return;
    setBusy(level);
    try {
      const folder = folderName(level);
      const folderId = folders.find((f) => f.name === folder)?.id ?? (await createFolder(folder, LEVEL_FOLDER_COLOR));
      const now = new Date();
      let offset = 0;
      const built = missing.map((set) => {
        const col = build(set, now, { offset, folderId });
        offset += set.cards.length;
        return col;
      });
      const results = await Promise.allSettled(built.map((col) => addCollection(col)));
      const saved = built.filter((_, i) => results[i].status === "fulfilled");
      if (saved.length > 0) {
        keepOrder(saved);
        setCollections((prev) => [...saved, ...prev]);
        checkAchievements();
      }
      if (saved.length < built.length) error(r.error);
      else success(r.levelToast.replace("{sets}", setsCount(saved.length)).replace("{folder}", folder));
    } catch {
      error(r.error);
    } finally {
      setBusy(null);
    }
  };

  if (!activeCourse) return <Loading label={t.loading} />;

  const loading = !failed && (!sets || !contentReady);

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div className="grid gap-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <CourseFlag code={activeCourse.id} voice={activeCourse.voice} size="sm" />
          {courseName(activeCourse.id, locale)}
        </div>
        <PageHeader title={r.title} subtitle={r.subtitle} />
        {sets && sets.length > 0 && (
          <Field label={r.translations} htmlFor="preset-lang" className="sm:max-w-xs">
            <Select id="preset-lang" value={lang} onChange={(e) => setChosenLang(e.target.value as Language)}>
              {langs.map((code) => (
                <option key={code} value={code}>
                  {getLanguageInfo(code).label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {failed ? (
        <Alert>
          <div className="grid justify-items-start gap-3">
            {t.error.text}
            <Button size="sm" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
              {t.error.retry}
            </Button>
          </div>
        </Alert>
      ) : loading ? (
        <Loading label={t.loading}>
          <div className="grid gap-4">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
              ))}
            </div>
          </div>
        </Loading>
      ) : levels.length === 0 ? (
        <Card tone="inset" padding="lg" className="grid justify-items-center gap-3 py-10 text-center">
          <Heading size={3} as="h2">
            {r.none}
          </Heading>
          <Text size="sm" tone="muted" className="max-w-sm">
            {r.noneText}
          </Text>
          <ButtonLink to="/words?new=1" iconLeft={<Plus size={18} />}>
            {t.words.addDeck}
          </ButtonLink>
        </Card>
      ) : (
        levels.map(({ level, sets: levelSets }) => {
          const missing = levelSets.filter((s) => !added.has(s.id)).length;
          const words = levelSets.reduce((n, s) => n + s.cards.length, 0);
          return (
            <section key={level} aria-labelledby={`level-${level}`} className="grid gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid gap-1">
                  <Heading size={2} id={`level-${level}`}>
                    {level} · {r.levels[level]}
                  </Heading>
                  <Text size="sm" tone="muted">
                    {setsCount(levelSets.length)} · {wordsCount(words)}
                  </Text>
                </div>
                {missing > 0 ? (
                  <Button
                    variant={level === primaryLevel ? "primary" : "secondary"}
                    iconLeft={<Plus size={18} />}
                    loading={busy === level}
                    disabled={busy !== null && busy !== level}
                    onClick={() => addLevel(level, levelSets)}
                  >
                    {r.addLevel}
                  </Button>
                ) : (
                  <Badge tone="success">
                    <Check size={14} aria-hidden />
                    {r.levelDone}
                  </Badge>
                )}
              </div>
              {missing > 0 && (
                <Text size="sm" tone="faint">
                  {r.addLevelHint.replace("{folder}", folderName(level))}
                </Text>
              )}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {levelSets.map((set) => (
                  <li key={set.id}>
                    <SetTile
                      icon={TOPIC_ICONS[set.topic] ?? Hash}
                      title={topicTitle(set.topic)}
                      count={wordsCount(set.cards.length)}
                      added={added.has(set.id) ? r.added : null}
                      onOpen={() => setPreview(set)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? topicTitle(preview.topic) : undefined}
        footer={
          preview &&
          (previewAdded ? (
            <>
              <Button variant="secondary" onClick={() => navigate(`/collection/${previewAdded}/edit`)}>
                {r.openSet}
              </Button>
              <Button onClick={() => navigate(`/learn?set=${previewAdded}`)}>{r.learn}</Button>
            </>
          ) : (
            <Button
              iconLeft={<Plus size={18} />}
              loading={busy === preview.id}
              disabled={busy !== null && busy !== preview.id}
              onClick={() => addSet(preview)}
            >
              {r.add}
            </Button>
          ))
        }
      >
        {preview && (
          <>
            <Text size="sm" tone="muted">
              {preview.level} · {wordsCount(preview.cards.length)}
            </Text>
            {/* Свой скролл у списка: кнопка «Добавить» под ним видна сразу, без прокрутки окна */}
            <ul className="mt-4 max-h-[45dvh] divide-y divide-line overflow-y-auto rounded-2xl border border-line">
              {preview.cards.map((card) => (
                <li key={card.id} className="grid gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <span lang={activeCourse.voice} className="font-semibold text-fg">
                      {card.word}
                    </span>
                    <span className="text-sm text-muted">{card.translation[lang] ?? card.translation.en}</span>
                  </div>
                  {card.example && (
                    <p lang={activeCourse.voice} className="text-xs text-faint">
                      {card.example}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Modal>
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function SetTile({
  icon: Icon,
  title,
  count,
  added,
  onOpen,
}: {
  icon: LucideIcon;
  title: string;
  count: string;
  added: string | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-special-soft text-special">
        <Icon size={22} aria-hidden />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-semibold text-fg">{title}</span>
        <span className="text-sm text-muted">{count}</span>
      </span>
      {added ? (
        <Badge tone="success" className="shrink-0">
          <Check size={12} aria-hidden />
          {added}
        </Badge>
      ) : (
        <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden />
      )}
    </button>
  );
}

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Check, PartyPopper, RotateCw, Scale } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { addCollection, createCard, createCollection, updateCollection } from "../../utils/storage";
import { starterWords } from "../../data/starterWords";
import { Alert, Button, Field, Input, Modal, Skeleton, Text, cx } from "../../ui";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { defaultTranslationLanguage, firstMissingPreset, hasPresets, loadPreset, type PresetSet } from "../../presets";
import { buildPresetCollection } from "../../presets/build";
import { topicIcon } from "../presets/topicIcons";

// Сценарии «Первых шагов» (главная): каждый пункт списка открывает свой — с подсказками и настоящим
// действием прямо в окне. В конце сценария — переход к следующему шагу или «Позже»

export const WORDS_GOAL = 5;

function Done({ title, text }: { title: ReactNode; text: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 py-2 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
        <PartyPopper size={26} />
      </span>
      <p className="font-display text-xl font-extrabold text-fg">{title}</p>
      <Text size="sm" tone="muted">
        {text}
      </Text>
    </div>
  );
}

function NextOrLater({ next, onNext, onLater }: { next: string; onNext: () => void; onLater: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid w-full gap-2">
      <Button fullWidth onClick={onNext} iconRight={<ArrowRight size={16} />}>
        {next}
      </Button>
      <Button variant="ghost" fullWidth onClick={onLater}>
        {t.home.firstSteps.guides.later}
      </Button>
    </div>
  );
}

// ── Первый набор. У курса с готовыми наборами (docs/specs/05-ready-sets.md) сначала — первая тема Kolo, которой
// ещё нет у человека: одно нажатие, и слова с переводом и примерами уже внутри, шаг «5 слов» тоже готов.
// Второй путь — свой набор: что такое набор, название (с готовыми вариантами) и создание прямо здесь ──
export function SetGuide({
  open,
  onClose,
  onNext,
}: {
  open: boolean;
  onClose: () => void;
  onNext: (next: "words" | "train") => void;
}) {
  const { t, language } = useI18n();
  const g = t.home.firstSteps.guides.set;
  const r = t.words.ready;
  const navigate = useNavigate();
  const { activeCourse, collections, setCollections, checkAchievements } = useData();
  const locale = getLanguageInfo(language).htmlLang;
  const course = activeCourse?.id;
  const [mode, setMode] = useState<"ready" | "own">("own");
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ name: string; words: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Предлагаемая тема — первая по порядку, которой у человека ещё нет. Грузится только она
  const offer = useMemo(() => {
    if (!course || !hasPresets(course)) return null;
    return firstMissingPreset(course, new Set(collections.flatMap((c) => (c.preset ? [c.preset.id] : []))));
  }, [course, collections]);
  const [preset, setPreset] = useState<PresetSet | null>(null);
  const [presetFailed, setPresetFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(offer ? "ready" : "own");
    setName(g.suggestions[0]);
    setCreated(null);
    setFailed(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // После добавления предложение сдвигается на следующую тему — её грузить уже незачем
  const offerId = created ? undefined : offer?.id;
  useEffect(() => {
    if (!open || !offerId) return;
    let alive = true;
    setPresetFailed(false);
    loadPreset(offerId)
      .then((set) => alive && (set ? setPreset(set) : setPresetFailed(true)))
      .catch(() => alive && setPresetFailed(true));
    return () => {
      alive = false;
    };
  }, [open, offerId]);
  const ready = preset && preset.id === offerId ? preset : null;
  // Набор не загрузился (нет сети) — без него остаётся только свой
  const readyMode = mode === "ready" && !!offer && !presetFailed;
  const topicTitle = (topic: string) => (r.topics as Record<string, string>)[topic] ?? topic;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !name.trim()) return;
    setBusy(true);
    setFailed(false);
    try {
      const collection = await createCollection(name.trim(), activeCourse.voice, activeCourse.id);
      setCollections((prev) => [collection, ...prev]);
      setCreated({ name: collection.name, words: 0 });
      checkAchievements().catch(() => {});
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // Готовый набор — как «Добавить набор» на вкладке «Наборы Kolo»: перевод на язык интерфейса
  const take = async () => {
    if (!activeCourse || !ready) return;
    setBusy(true);
    setFailed(false);
    try {
      const collection = buildPresetCollection(ready, {
        lang: defaultTranslationLanguage(activeCourse.id, language),
        name: topicTitle(ready.topic),
        voice: activeCourse.voice,
        courseId: activeCourse.id,
        now: new Date(),
      });
      await addCollection(collection);
      setCollections((prev) => [collection, ...prev]);
      setCreated({ name: collection.name, words: collection.cards.length });
      checkAchievements().catch(() => {});
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // Слов уже хватает на шаг «5 слов» — сразу к тренировке
  const enoughWords = (created?.words ?? 0) >= WORDS_GOAL;
  const TopicIcon = ready ? topicIcon(ready.topic) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={g.title}
      size="sm"
      footer={
        created ? (
          <NextOrLater next={enoughWords ? g.nextTrain : g.next} onNext={() => onNext(enoughWords ? "train" : "words")} onLater={onClose} />
        ) : readyMode ? (
          <div className="grid w-full gap-2">
            <Button fullWidth loading={busy} disabled={!ready} onClick={take}>
              {g.take}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setMode("own")}>
              {g.own}
            </Button>
          </div>
        ) : (
          <>
            {offer && !presetFailed && (
              <Button variant="ghost" onClick={() => setMode("ready")}>
                {t.back}
              </Button>
            )}
            <Button type="submit" form="guide-set" fullWidth={!offer || presetFailed} loading={busy} disabled={!name.trim()}>
              {g.create}
            </Button>
          </>
        )
      }
    >
      {created ? (
        <Done
          title={g.doneTitle.replace("{name}", created.name)}
          text={enoughWords ? g.readyDoneText.replace("{words}", plural(locale, created.words, t.words.collectionCard.words)) : g.doneText}
        />
      ) : readyMode ? (
        <div className="grid gap-5">
          <Text size="sm" tone="muted">
            {g.readyIntro}
          </Text>
          {ready && TopicIcon ? (
            <div className="flex items-center gap-4 rounded-3xl border border-line p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-special-soft text-special">
                <TopicIcon size={22} aria-hidden />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="font-semibold text-fg">{topicTitle(ready.topic)}</span>
                <span className="text-sm text-muted">
                  {ready.level} · {plural(locale, ready.cards.length, t.words.collectionCard.words)}
                </span>
              </span>
            </div>
          ) : (
            <Skeleton className="h-20 rounded-3xl" />
          )}
          {/* Ещё темы — на вкладке «Наборы Kolo»: там и все уровни, и язык перевода */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/words?tab=kolo");
            }}
            className="justify-self-start text-sm font-semibold text-accent-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {g.allSets}
          </button>
          {failed && <Alert>{r.error}</Alert>}
        </div>
      ) : (
        <form id="guide-set" onSubmit={create} className="grid gap-5">
          <Text size="sm" tone="muted">
            {g.intro}
          </Text>
          <Field label={g.nameLabel} htmlFor="guide-set-name">
            <Input id="guide-set-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </Field>
          <div className="grid gap-2">
            <p className="text-sm font-medium text-fg">{g.suggestTitle}</p>
            <div className="flex flex-wrap gap-2">
              {g.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={name === s}
                  onClick={() => setName(s)}
                  className={cx(
                    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    name === s ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-muted hover:bg-inset hover:text-fg",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {failed && <Alert>{g.error}</Alert>}
        </form>
      )}
    </Modal>
  );
}

// ── Первые слова: пять готовых слов для языка курса (оставь нужные) или свои — слово и перевод ──
export function WordsGuide({
  open,
  onClose,
  onNext,
  collectionId,
}: {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
  collectionId?: string;
}) {
  const { t } = useI18n();
  const g = t.home.firstSteps.guides.words;
  const { collections, setCollections, activeCourse, checkAchievements } = useData();
  const collection = collections.find((c) => c.id === collectionId);
  const have = collection?.cards.length ?? 0;
  const inSet = new Set(collection?.cards.map((c) => c.word.trim().toLowerCase()) ?? []);
  const starter = (activeCourse ? starterWords(activeCourse.id, g.starter) : null)?.filter((s) => !inSet.has(s.word.toLowerCase())) ?? [];

  const [mode, setMode] = useState<"starter" | "own" | "done">("own");
  const [picked, setPicked] = useState<string[]>([]);
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const wordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(have >= WORDS_GOAL ? "done" : starter.length > 0 ? "starter" : "own");
    setPicked(starter.map((s) => s.word));
    setWord("");
    setTranslation("");
    setFailed(false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (items: { word: string; translation: string }[]) => {
    if (!collection || items.length === 0) return;
    setBusy(true);
    setFailed(false);
    try {
      const updated = { ...collection, cards: [...collection.cards, ...items.map((i) => createCard(i.word, i.translation, "", "", ""))] };
      await updateCollection(updated);
      setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      checkAchievements().catch(() => {});
      if (updated.cards.length >= WORDS_GOAL) setMode("done");
      else if (mode === "starter") setMode("own");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const addOwn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;
    await save([{ word: word.trim(), translation: translation.trim() }]);
    setWord("");
    setTranslation("");
    wordRef.current?.focus();
  };

  const progress = (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-fg">{g.progress.replace("{n}", String(Math.min(have, WORDS_GOAL))).replace("{goal}", String(WORDS_GOAL))}</span>
        {collection && <span className="truncate pl-3 text-muted">{collection.name}</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(Math.min(have, WORDS_GOAL) / WORDS_GOAL) * 100}%` }} />
      </div>
    </div>
  );

  const footer =
    mode === "done" ? (
      <NextOrLater next={g.next} onNext={onNext} onLater={onClose} />
    ) : mode === "starter" ? (
      <div className="grid w-full gap-2">
        <Button
          fullWidth
          loading={busy}
          disabled={picked.length === 0}
          onClick={() => save(starter.filter((s) => picked.includes(s.word)))}
        >
          {g.addStarter.replace("{n}", String(picked.length))}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setMode("own")}>
          {g.own}
        </Button>
      </div>
    ) : (
      <div className="grid w-full gap-2">
        <Button type="submit" form="guide-words" fullWidth loading={busy} disabled={!word.trim() || !translation.trim()}>
          {g.add}
        </Button>
        <Button variant="ghost" fullWidth onClick={onClose}>
          {have > 0 ? g.finish : t.home.firstSteps.guides.later}
        </Button>
      </div>
    );

  return (
    <Modal open={open} onClose={onClose} title={g.title} size="sm" footer={footer}>
      {mode === "done" ? (
        <Done title={g.doneTitle} text={g.doneText} />
      ) : (
        <div className="grid gap-5">
          <Text size="sm" tone="muted">
            {mode === "starter" ? g.introStarter : g.introOwn}
          </Text>
          {progress}
          {mode === "starter" ? (
            <ul className="grid gap-1.5">
              {starter.map((s) => {
                const on = picked.includes(s.word);
                return (
                  <li key={s.word}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setPicked((p) => (on ? p.filter((w) => w !== s.word) : [...p, s.word]))}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        on ? "border-accent bg-accent-soft" : "border-line hover:bg-inset",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          on ? "border-accent bg-accent text-on-accent" : "border-line bg-surface",
                        )}
                      >
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-fg">{s.word}</span>
                      <span className="shrink-0 text-sm text-muted">{s.translation}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <form id="guide-words" onSubmit={addOwn} className="grid gap-3 sm:grid-cols-2">
              <Field label={g.wordLabel} htmlFor="guide-word">
                <Input id="guide-word" ref={wordRef} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
              </Field>
              <Field label={g.translationLabel} htmlFor="guide-translation">
                <Input id="guide-translation" value={translation} onChange={(e) => setTranslation(e.target.value)} autoComplete="off" />
              </Field>
            </form>
          )}
          {failed && <Alert>{g.error}</Alert>}
        </div>
      )}
    </Modal>
  );
}

const RATINGS = [
  { key: "dontKnow", tone: "bg-danger-soft text-danger", soon: true },
  { key: "forgot", tone: "bg-warning-soft text-warning", soon: true },
  { key: "remember", tone: "bg-info-soft text-info", soon: false },
  { key: "know", tone: "bg-success-soft text-success", soon: false },
] as const;

// ── Первая тренировка: три действия на карточке и что значат оценки — потом сама тренировка ──
export function TrainGuide({ open, onClose, collectionId }: { open: boolean; onClose: () => void; collectionId?: string }) {
  const { t } = useI18n();
  const g = t.home.firstSteps.guides.train;
  const levels = t.words.flashcards.levels;
  const navigate = useNavigate();
  const icons = [Brain, RotateCw, Scale];

  const start = () => {
    onClose();
    if (collectionId) navigate(`/collection/${collectionId}/flashcards`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={g.title}
      size="sm"
      footer={
        <Button fullWidth onClick={start} disabled={!collectionId} iconRight={<ArrowRight size={16} />}>
          {g.start}
        </Button>
      }
    >
      <div className="grid gap-5">
        <Text size="sm" tone="muted">
          {g.intro}
        </Text>
        <ol className="grid gap-4">
          {g.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
                  <Icon size={20} />
                </span>
                <div className="grid min-w-0 flex-1 gap-1">
                  <p className="font-semibold text-fg">
                    {i + 1}. {step.title}
                  </p>
                  <p className="text-sm leading-snug text-muted">{step.text}</p>
                  {i === 2 && (
                    <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
                      {RATINGS.map((r) => (
                        <li key={r.key} className={cx("grid rounded-xl px-2.5 py-1.5", r.tone)}>
                          <span className="text-sm font-semibold">{levels[r.key]}</span>
                          <span className="text-xs opacity-80">{r.soon ? g.soon : g.later}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Modal>
  );
}

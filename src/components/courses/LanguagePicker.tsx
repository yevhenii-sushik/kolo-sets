import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { COURSE_LANGUAGES, CourseLanguage, courseEndonym, courseName, variantRegionName } from "../../courses/languages";
import { Button, Field, Heading, Input, Select, Text, cx } from "../../ui";
import CourseFlag from "./CourseFlag";

// Языковые префиксы голосов, доступных на этом устройстве. Список голосов в Chrome приходит
// не сразу, поэтому слушаем voiceschanged; пустой список = «ещё не знаем», а не «голосов нет».
function useVoicePrefixes(): Set<string> | null {
  const read = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return new Set<string>();
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    return new Set(voices.map((v) => v.lang.toLowerCase().replace("_", "-")));
  };
  const [prefixes, setPrefixes] = useState<Set<string> | null>(read);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => setPrefixes(read());
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  return prefixes;
}

function hasVoice(code: string, prefixes: Set<string>): boolean {
  const wanted = code === "nb" ? ["nb", "no"] : code === "yue" ? ["zh-hk", "yue"] : [code];
  for (const lang of prefixes) if (wanted.some((w) => lang === w || lang.startsWith(`${w}-`))) return true;
  return false;
}

// Для поиска: без регистра и диакритики («Norsk» находится по «norsk», «Français» — по «francais»)
const fold = (s: string) => s.toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

interface Item {
  lang: CourseLanguage;
  name: string;
  endonym: string;
  haystack: string;
}

// Выбор языка курса: поиск, популярные, все языки; снизу — панель с вариантом произношения и кнопкой
export default function LanguagePicker({
  existing,
  submitLabel,
  onPick,
}: {
  existing: string[];
  submitLabel: string;
  onPick: (code: string, voice: string) => Promise<void>;
}) {
  const { t, language } = useI18n();
  const c = t.courses;
  const locale = getLanguageInfo(language).htmlLang;
  const voices = useVoicePrefixes();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [voice, setVoice] = useState("");
  const [busy, setBusy] = useState(false);

  const items = useMemo<Item[]>(() => {
    const english = new Intl.DisplayNames(["en"], { type: "language" });
    return COURSE_LANGUAGES.map((lang) => {
      const name = courseName(lang.code, locale);
      const endonym = courseEndonym(lang.code);
      const en = english.of(lang.nameCode ?? lang.code) ?? "";
      return { lang, name, endonym, haystack: fold([name, endonym, en, lang.code].join(" ")) };
    }).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [locale]);

  const q = fold(query.trim());
  const matches = q ? items.filter((i) => i.haystack.includes(q)) : null;
  const popular = items.filter((i) => i.lang.popular).sort((a, b) => COURSE_LANGUAGES.indexOf(a.lang) - COURSE_LANGUAGES.indexOf(b.lang));
  const rest = items.filter((i) => !i.lang.popular);

  const choose = (lang: CourseLanguage) => {
    setSelected(lang.code);
    setVoice(lang.variants[0].voice);
  };

  const current = selected ? items.find((i) => i.lang.code === selected) : undefined;
  const noVoice = Boolean(current && voices && voices.size > 0 && !hasVoice(current.lang.code, voices));

  const submit = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await onPick(current.lang.code, voice);
    } finally {
      setBusy(false);
    }
  };

  const tile = (item: Item) => {
    const active = selected === item.lang.code;
    const added = existing.includes(item.lang.code);
    return (
      <button
        key={item.lang.code}
        type="button"
        aria-pressed={active}
        onClick={() => choose(item.lang)}
        className={cx(
          "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-inset",
        )}
      >
        <CourseFlag code={item.lang.code} />
        <span className="grid min-w-0 flex-1">
          <span className={cx("truncate font-semibold", active ? "text-accent-ink" : "text-fg")}>{item.name}</span>
          {added ? (
            <span className="truncate text-sm font-medium text-accent-ink">{c.added}</span>
          ) : (
            fold(item.endonym) !== fold(item.name) && (
              <span lang={item.lang.code} dir="auto" className="truncate text-sm text-muted">
                {item.endonym}
              </span>
            )
          )}
        </span>
      </button>
    );
  };

  const grid = "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cx("grid gap-6", current && "pb-44 sm:pb-32")}>
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={c.search}
        aria-label={c.search}
        iconLeft={<Search size={18} />}
      />

      {matches ? (
        matches.length > 0 ? (
          <div className={grid}>{matches.map(tile)}</div>
        ) : (
          <Text tone="muted" className="py-8 text-center">
            {c.noResults.replace("{q}", query.trim())}
          </Text>
        )
      ) : (
        <>
          <section className="grid gap-3">
            <Heading size={4} as="h2" className="text-muted">
              {c.popular}
            </Heading>
            <div className={grid}>{popular.map(tile)}</div>
          </section>
          <section className="grid gap-3">
            <Heading size={4} as="h2" className="text-muted">
              {c.all}
            </Heading>
            <div className={grid}>{rest.map(tile)}</div>
          </section>
        </>
      )}

      {/* Выбранный язык: вариант произношения и подтверждение — панель внизу экрана */}
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
          <div className="mx-auto grid max-w-3xl gap-3 sm:flex sm:items-end">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <CourseFlag code={current.lang.code} voice={voice} size="lg" />
              <div className="grid min-w-0 gap-0.5">
                <p className="truncate font-display text-xl font-extrabold text-fg">{current.name}</p>
                {noVoice && <p className="text-xs leading-snug text-muted">{c.noVoice}</p>}
              </div>
            </div>
            {current.lang.variants.length > 1 && (
              <Field label={c.pronunciation} htmlFor="course-voice" className="sm:w-64">
                <Select id="course-voice" value={voice} onChange={(e) => setVoice(e.target.value)}>
                  {current.lang.variants.map((v) => (
                    <option key={v.voice} value={v.voice}>
                      {[v.flag, variantRegionName(v.voice, locale) ?? v.voice].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Button size="lg" loading={busy} onClick={submit} className="sm:shrink-0">
              {submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { ChevronRight, SearchX } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import type { WordSearchResult } from "../../utils/wordSearch";
import { Card, Heading, Text } from "../../ui";

function Highlight({ text, range }: { text: string; range?: [number, number] }) {
  if (!range) return <>{text}</>;
  const [from, to] = range;
  return (
    <>
      {text.slice(0, from)}
      <mark className="rounded bg-accent-soft px-0.5 text-accent-ink">{text.slice(from, to)}</mark>
      {text.slice(to)}
    </>
  );
}

interface Props {
  query: string;
  results: WordSearchResult[];
  total: number;
}

// Результаты поиска на вкладке «Слова»: слово — перевод, набор; по нажатию — карточка в редакторе набора
export default function WordSearchResults({ query, results, total }: Props) {
  const { t, language } = useI18n();
  const ws = t.wordSearch;

  if (results.length === 0) {
    return (
      <Card tone="inset" padding="lg" className="grid justify-items-center gap-2 py-12 text-center">
        <SearchX size={28} className="mb-1 text-faint" />
        <Heading size={3} as="h2">
          {ws.noResults}
        </Heading>
        <Text size="sm" tone="muted" className="max-w-sm">
          {ws.noResultsText.replace("{q}", query.trim())}
        </Text>
      </Card>
    );
  }

  return (
    <section aria-label={ws.placeholder}>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {plural(getLanguageInfo(language).htmlLang, total, ws.found)}
      </p>
      <ul className="grid gap-2">
        {results.map(({ card, collection, field, range }) => (
          <li key={`${collection.id}-${card.id}`}>
            <Link
              to={`/collection/${collection.id}/edit?card=${encodeURIComponent(card.id)}`}
              className="group flex items-center gap-4 rounded-3xl border border-line bg-surface px-5 py-3.5 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="truncate">
                  <span dir="auto" className="font-semibold text-fg">
                    <Highlight text={card.word} range={field === "word" ? range : undefined} />
                  </span>
                  <span dir="auto" className="text-muted">
                    {" — "}
                    <Highlight text={card.translation} range={field === "translation" ? range : undefined} />
                  </span>
                </p>
                {field === "explanation" && (
                  <p dir="auto" className="line-clamp-1 text-sm text-muted">
                    <Highlight text={card.explanation} range={range} />
                  </p>
                )}
                <p className="truncate text-xs text-faint">{collection.name}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-faint transition-colors group-hover:text-fg" />
            </Link>
          </li>
        ))}
      </ul>
      {total > results.length && <p className="mt-3 text-center text-xs text-faint">{ws.limit}</p>}
    </section>
  );
}

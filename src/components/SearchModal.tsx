import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight } from "lucide-react";
import { useData } from "../contexts/DataContext";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { Card, Collection } from "../types";
import { IconButton } from "../ui";

const LIMIT = 50;

interface SearchResult {
  card: Card;
  collection: Collection;
  matchField: "word" | "translation" | "explanation";
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent-soft px-0.5 text-accent-ink">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Поиск по всем карточкам (⌘K): слово, перевод или объяснение → переход к набору
export default function SearchModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const sp = t.shell.searchPanel;
  const locale = getLanguageInfo(language).htmlLang;
  const { collections } = useData();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const found: SearchResult[] = [];
    for (const col of collections) {
      for (const card of col.cards) {
        let matchField: SearchResult["matchField"] | null = null;
        if (card.word.toLowerCase().includes(q)) matchField = "word";
        else if (card.translation.toLowerCase().includes(q)) matchField = "translation";
        else if (card.explanation?.toLowerCase().includes(q)) matchField = "explanation";

        if (matchField) found.push({ card, collection: col, matchField });
        if (found.length >= LIMIT) break;
      }
      if (found.length >= LIMIT) break;
    }
    return found;
  }, [query, collections]);

  const totalCards = collections.reduce((n, c) => n + c.cards.length, 0);

  const handleSelect = (result: SearchResult) => {
    navigate(`/collection/${result.collection.id}/edit`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label={t.shell.search} className="fixed inset-0 z-200">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="relative mx-auto mt-[10dvh] w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-4xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center gap-3 border-b border-line py-2 pl-5 pr-2">
                <Search size={18} className="shrink-0 text-faint" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={sp.placeholder}
                  aria-label={sp.placeholder}
                  className="h-12 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-hint [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                  <IconButton size="sm" label={sp.clear} onClick={() => setQuery("")}>
                    <X size={16} />
                  </IconButton>
                )}
                <IconButton label={t.close} onClick={onClose}>
                  <span className="rounded-md bg-inset px-1.5 py-0.5 text-2xs font-semibold text-faint">Esc</span>
                </IconButton>
              </div>

              <div className="max-h-[60dvh] overflow-y-auto">
                {query.trim().length === 0 ? (
                  <div className="grid justify-items-center gap-1 px-6 py-12 text-center">
                    <Search size={28} className="mb-2 text-faint" />
                    <p className="text-sm text-muted">{sp.empty}</p>
                    <p className="text-xs text-faint">
                      {plural(locale, totalCards, t.profile.calendar.cards)} {plural(locale, collections.length, sp.inSets)}
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="grid justify-items-center gap-1 px-6 py-12 text-center">
                    <p className="font-semibold text-fg">{sp.noResults}</p>
                    <p className="text-sm text-muted">{sp.noResultsText.replace("{q}", query.trim())}</p>
                  </div>
                ) : (
                  <ul className="p-2">
                    {results.map((result) => {
                      const { card, collection, matchField } = result;
                      return (
                        <li key={`${collection.id}-${card.id}`}>
                          <button
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="group flex w-full items-center gap-4 rounded-3xl px-4 py-3 text-left transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-accent"
                          >
                            <div className="grid min-w-0 flex-1 gap-0.5">
                              <p className="truncate">
                                <span className="font-semibold text-fg">{highlight(card.word, matchField === "word" ? query.trim() : "")}</span>
                                <span className="text-muted"> — {highlight(card.translation, matchField === "translation" ? query.trim() : "")}</span>
                              </p>
                              {matchField === "explanation" && card.explanation && (
                                <p className="line-clamp-1 text-sm text-muted">{highlight(card.explanation, query.trim())}</p>
                              )}
                              <p className="truncate text-xs text-faint">{collection.name}</p>
                            </div>
                            <ChevronRight size={16} className="shrink-0 text-faint group-hover:text-fg" />
                          </button>
                        </li>
                      );
                    })}
                    {results.length === LIMIT && <li className="px-4 py-3 text-center text-xs text-faint">{sp.limit}</li>}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

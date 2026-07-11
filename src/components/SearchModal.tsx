import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, ArrowUpRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Card, Collection } from '../types';

interface SearchResult {
  card: Card;
  collection: Collection;
  matchField: 'word' | 'translation' | 'explanation';
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FF5733]/15 text-[#FF5733] rounded px-0.5 not-italic font-black">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { collections } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];

    const found: SearchResult[] = [];
    for (const col of collections) {
      for (const card of col.cards) {
        let matchField: SearchResult['matchField'] | null = null;
        if (card.word.toLowerCase().includes(q)) matchField = 'word';
        else if (card.translation.toLowerCase().includes(q)) matchField = 'translation';
        else if (card.explanation?.toLowerCase().includes(q)) matchField = 'explanation';

        if (matchField) found.push({ card, collection: col, matchField });
        if (found.length >= 50) break;
      }
      if (found.length >= 50) break;
    }
    return found;
  }, [query, collections]);

  const handleSelect = (result: SearchResult) => {
    navigate(`/collection/${result.collection.id}/edit`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-[#1A1714]/50 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[10dvh] left-1/2 -translate-x-1/2 z-201 w-full max-w-2xl px-4"
          >
            <div className="bg-white dark:bg-[#1A1917] rounded-4xl shadow-2xl shadow-black/20 border border-[#E0DBD3] dark:border-[#2E2C29] overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EDE8] dark:border-[#2E2C29]">
                <Search size={18} className="text-[#B5B0A8] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search words, translations, definitions…"
                  className="flex-1 bg-transparent outline-none text-[#1A1714] dark:text-[#F0EDE8] placeholder-[#B5B0A8] text-[15px] font-medium"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-[#B5B0A8] hover:text-[#FF5733] transition-colors shrink-0">
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F5F2ED] dark:bg-[#242220] text-[10px] font-black text-[#B5B0A8] uppercase tracking-widest shrink-0 hover:text-[#FF5733] transition-colors"
                >
                  Esc
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60dvh] overflow-y-auto">
                {query.trim().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <Search size={32} className="text-[#D0CBC4] dark:text-[#3A3735] mb-3" />
                    <p className="text-[13px] font-medium text-[#B5B0A8]">
                      Start typing to search across all your cards
                    </p>
                    <p className="text-[11px] text-[#C5C0B8] mt-1 font-medium">
                      {collections.reduce((n, c) => n + c.cards.length, 0)} cards in {collections.length} collections
                    </p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                    <p className="text-[15px] font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1">No results</p>
                    <p className="text-[13px] font-medium text-[#B5B0A8]">
                      No cards matched "<span className="text-[#FF5733]">{query}</span>"
                    </p>
                  </div>
                ) : (
                  <ul className="py-2">
                    {results.map(({ card, collection, matchField }) => (
                      <li key={`${collection.id}-${card.id}`}>
                        <button
                          onClick={() => handleSelect({ card, collection, matchField })}
                          className="w-full flex items-start gap-4 px-5 py-3.5 hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#FF5733] transition-colors">
                            <BookOpen size={15} className="text-[#FF5733] group-hover:text-white transition-colors" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[14px] font-black text-[#1A1714] dark:text-[#F0EDE8] italic font-serif">
                                {highlight(card.word, matchField === 'word' ? query : '')}
                              </span>
                              <span className="text-[12px] font-medium text-[#7A756E] dark:text-[#8A867F]">
                                {highlight(card.translation, matchField === 'translation' ? query : '')}
                              </span>
                            </div>
                            {matchField === 'explanation' && card.explanation && (
                              <p className="text-[11px] text-[#B5B0A8] mt-0.5 line-clamp-1">
                                {highlight(card.explanation, query)}
                              </p>
                            )}
                            <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] px-2 py-0.5 bg-[#F5F2ED] dark:bg-[#2E2C29] rounded-full">
                              {collection.name}
                            </span>
                          </div>

                          <ArrowUpRight size={14} className="text-[#D0CBC4] group-hover:text-[#FF5733] shrink-0 mt-1 transition-colors" />
                        </button>
                      </li>
                    ))}
                    {results.length === 50 && (
                      <li className="px-5 py-3 text-center text-[11px] font-medium text-[#B5B0A8]">
                        Showing top 50 results — refine your search
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus, Settings2 } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseName } from "../../courses/languages";
import { plural } from "../../utils/plural";
import { cx } from "../../ui";
import CourseFlag from "./CourseFlag";

// Переключатель курса в шапке: флаг (и название на широком экране), меню со всеми курсами
export default function CourseSwitcher() {
  const { t, language } = useI18n();
  const c = t.courses;
  const locale = getLanguageInfo(language).htmlLang;
  const { courses, activeCourse, allCollections, setActiveCourse } = useData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const wordsByCourse = useMemo(() => {
    const m = new Map<string, number>();
    for (const col of allCollections) if (col.courseId) m.set(col.courseId, (m.get(col.courseId) ?? 0) + col.cards.length);
    return m;
  }, [allCollections]);

  if (!activeCourse) return null;
  const activeName = courseName(activeCourse.id, locale);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={c.switcher.replace("{name}", activeName)}
        className="flex h-9 items-center gap-2 rounded-full bg-inset py-1 pl-1 pr-2.5 text-sm font-semibold text-fg transition-colors hover:bg-track"
      >
        <CourseFlag code={activeCourse.id} voice={activeCourse.voice} size="sm" className="bg-surface" />
        <span className="hidden max-w-36 truncate lg:inline">{activeName}</span>
        <ChevronDown size={15} className={cx("text-muted transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              // На телефоне кнопка не у края экрана — меню во всю ширину под шапкой, иначе уезжает влево
              className="fixed inset-x-4 top-18 z-50 grid gap-1 rounded-3xl border border-line bg-surface p-2 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-72"
            >
              <p className="px-3 pb-1 pt-2 text-sm font-semibold text-muted">{c.menuTitle}</p>
              {courses.map((course) => {
                const active = course.id === activeCourse.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setOpen(false);
                      if (!active) setActiveCourse(course.id);
                    }}
                    className={cx(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-accent-soft" : "hover:bg-inset",
                    )}
                  >
                    <CourseFlag code={course.id} voice={course.voice} />
                    <span className="grid min-w-0 flex-1">
                      <span className={cx("truncate font-semibold", active ? "text-accent-ink" : "text-fg")}>
                        {courseName(course.id, locale)}
                      </span>
                      <span className="text-xs text-muted">
                        {plural(locale, wordsByCourse.get(course.id) ?? 0, t.words.collectionCard.words)}
                      </span>
                    </span>
                    {active && <Check size={18} className="shrink-0 text-accent-ink" />}
                  </button>
                );
              })}
              <div className="my-1 border-t border-line" />
              <Link
                to="/courses/new"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-inset"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <Plus size={18} />
                </span>
                {c.add}
              </Link>
              <Link
                to="/courses"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-inset"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-inset text-muted">
                  <Settings2 size={18} />
                </span>
                {c.manage}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

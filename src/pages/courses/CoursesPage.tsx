import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { getLanguageInfo } from "../../locales/languages";
import { courseEndonym, courseName, getCourseLanguage, variantRegionName } from "../../courses/languages";
import { plural } from "../../utils/plural";
import { Badge, Button, ButtonLink, Card, Field, Select } from "../../ui";
import CourseFlag from "../../components/courses/CourseFlag";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { PageHeader } from "../../components/other/PageSection";

// «Курсы»: все изучаемые языки — цифры, произношение, переключение и удаление
export default function CoursesPage() {
  const { t, language } = useI18n();
  const c = t.courses;
  const locale = getLanguageInfo(language).htmlLang;
  const navigate = useNavigate();
  const { courses, activeCourse, allCollections, setActiveCourse, updateCourseVoice, removeCourse } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { error, toastState, hideToast } = useToast();
  const [removing, setRemoving] = useState<string | null>(null);

  const stats = useMemo(() => {
    const m = new Map<string, { sets: number; words: number }>();
    for (const col of allCollections) {
      if (!col.courseId) continue;
      const s = m.get(col.courseId) ?? { sets: 0, words: 0 };
      m.set(col.courseId, { sets: s.sets + 1, words: s.words + col.cards.length });
    }
    return m;
  }, [allCollections]);

  const handleRemove = async (id: string) => {
    const name = courseName(id, locale);
    const sets = stats.get(id)?.sets ?? 0;
    const ok = await confirm({
      title: c.removeTitle.replace("{name}", name),
      message: sets > 0 ? c.removeText.replace("{sets}", plural(locale, sets, t.words.library.setsCount)) : c.removeEmpty,
      type: "danger",
      confirmText: c.remove,
      cancelText: t.cancel,
    });
    if (!ok) return;
    setRemoving(id);
    try {
      await removeCourse(id);
      // Последний курс удалён — без курса приложение начинается с выбора языка
      if (courses.length === 1) navigate("/start", { replace: true });
    } catch {
      error(c.removeError);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={c.title} subtitle={c.subtitle} />

      {courses.map((course) => {
        const lang = getCourseLanguage(course.id);
        const s = stats.get(course.id) ?? { sets: 0, words: 0 };
        const active = course.id === activeCourse?.id;
        const name = courseName(course.id, locale);
        const endonym = courseEndonym(course.id);
        return (
          <Card key={course.id} padding="lg" className="grid grid-cols-1 gap-5">
            <div className="flex items-center gap-4">
              <CourseFlag code={course.id} voice={course.voice} size="lg" />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xl font-extrabold text-fg">{name}</p>
                  {active && <Badge tone="accent">{c.current}</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {endonym !== name && (
                    <span lang={course.id} dir="auto">
                      {endonym} ·{" "}
                    </span>
                  )}
                  {plural(locale, s.words, t.words.collectionCard.words)} · {plural(locale, s.sets, t.words.library.setsCount)}
                </p>
              </div>
              {!active && (
                <span className="hidden sm:contents">
                  <Button variant="secondary" size="sm" onClick={() => setActiveCourse(course.id)}>
                    {c.switchTo}
                  </Button>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
              {lang && lang.variants.length > 1 ? (
                <Field label={c.pronunciation} htmlFor={`voice-${course.id}`} className="w-full sm:w-64">
                  <Select id={`voice-${course.id}`} value={course.voice} onChange={(e) => updateCourseVoice(course.id, e.target.value)}>
                    {lang.variants.map((v) => (
                      <option key={v.voice} value={v.voice}>
                        {[v.flag, variantRegionName(v.voice, locale) ?? v.voice].filter(Boolean).join(" ")}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                // Один вариант — произношение просто подписью, чтобы карточки курсов были одинаковыми
                <div className="grid gap-1.5">
                  <p className="text-sm font-medium text-fg">{c.pronunciation}</p>
                  <p className="text-sm text-muted">
                    {[lang?.variants[0]?.flag, variantRegionName(course.voice, locale) ?? course.voice].filter(Boolean).join(" ")}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                {!active && (
                  <span className="sm:hidden">
                    <Button variant="secondary" size="sm" onClick={() => setActiveCourse(course.id)}>
                      {c.switchTo}
                    </Button>
                  </span>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  iconLeft={<Trash2 size={15} />}
                  loading={removing === course.id}
                  onClick={() => handleRemove(course.id)}
                >
                  {c.remove}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      <ButtonLink to="/courses/new" variant="secondary" size="lg" fullWidth iconLeft={<Plus size={18} />}>
        {c.add}
      </ButtonLink>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

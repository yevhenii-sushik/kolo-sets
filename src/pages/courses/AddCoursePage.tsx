import { useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import LanguagePicker from "../../components/courses/LanguagePicker";
import { PageHeader } from "../../components/other/PageSection";

// Новый курс: выбранный язык сразу становится активным; уже добавленный — просто открывается
export default function AddCoursePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { courses, addCourse } = useData();

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6">
      <PageHeader title={t.courses.addTitle} subtitle={t.courses.subtitle} />
      <LanguagePicker
        existing={courses.map((c) => c.id)}
        submitLabel={t.courses.addButton}
        onPick={async (code, voice) => {
          await addCourse(code, voice);
          navigate("/words");
        }}
      />
    </div>
  );
}

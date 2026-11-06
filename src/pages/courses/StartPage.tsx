import { Navigate, useNavigate } from "react-router-dom";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { Heading, Logo, Spinner, Text } from "../../ui";
import LanguagePicker from "../../components/courses/LanguagePicker";

// Первый вход: без курса дальше не пройти — сначала выбираем язык
export default function StartPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { courses, coursesReady, addCourse } = useData();

  if (!coursesReady) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        <Spinner size={24} />
      </div>
    );
  }
  if (courses.length > 0) return <Navigate to="/" replace />;

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
            await addCourse(code, voice);
            navigate("/", { replace: true });
          }}
        />
      </main>
    </div>
  );
}

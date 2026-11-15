import { useNavigate } from "react-router-dom";
import { Spinner, useDelayed } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import SessionShell from "./SessionShell";

// Набор или код режима ещё грузится. Первые 300 мс — ничего (из кэша приходит быстрее, и экран
// не мигает), дальше — оболочка тренировки со спиннером и кнопкой «закрыть», чтобы на медленной
// сети не сидеть перед пустым экраном. Общая для всех режимов — раньше у каждого было своё
export default function SessionLoading({ onExit }: { onExit?: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const visible = useDelayed(300);
  // Открыли режим ссылкой или ярлыком — «назад» вывел бы из приложения, ведём на главную
  const exit = onExit ?? (() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate("/", { replace: true })));

  if (!visible) {
    return (
      <span role="status" className="sr-only">
        {t.loading}
      </span>
    );
  }
  return (
    <SessionShell title="" onClose={exit}>
      <main role="status" className="flex flex-1 items-center justify-center text-muted">
        <span className="sr-only">{t.loading}</span>
        <Spinner size={28} />
      </main>
    </SessionShell>
  );
}

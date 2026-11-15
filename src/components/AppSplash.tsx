import { useI18n } from "../contexts/I18nContext";
import { LogoMark } from "../ui";

// Заставка на старте: тот же знак и те же классы, что у статичной заставки в index.html, —
// React подменяет её без скачка. Появляется только если запуск длится дольше 400 мс
// с открытия страницы: отрицательная задержка продолжает уже начатое появление, а не запускает заново
export default function AppSplash() {
  const { t } = useI18n();
  const delay = Math.round(400 - performance.now());
  return (
    <div className="boot-splash" role="status" style={{ animationDelay: `${delay}ms` }}>
      <span className="sr-only">{t.loading}</span>
      <LogoMark size={56} />
    </div>
  );
}

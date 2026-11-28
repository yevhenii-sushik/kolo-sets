import { ReactNode, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Alert, Button, cx } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import ConsentText from "../legal/ConsentText";

// «Попробовать без регистрации» (шаг 16 в docs/specs/06-audit-fixes.md): анонимный вход Firebase и строка
// согласия под кнопкой — галочки нет (решение пользователя 2026-11-28). Дальше ведёт маршрут: вошедшего
// PublicRoute отправляет в приложение, а без курса приложение начинается с выбора языка.
// onStarted — для страниц, которые сами продолжают после входа (набор по ссылке, «О Kolo»).
// inverse — кнопка на тёмном блоке (итог страниц «О Kolo»)
export default function TrialButton({
  label,
  size = "lg",
  align = "center",
  icon = <ArrowRight size={18} />,
  inverse = false,
  className,
  onStarted,
}: {
  label: string;
  size?: "md" | "lg";
  align?: "center" | "start";
  icon?: ReactNode;
  inverse?: boolean;
  className?: string;
  onStarted?: () => void;
}) {
  const { startTrial } = useAuth();
  const { t } = useI18n();
  const c = t.legal.consent;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await startTrial();
      onStarted?.();
    } catch (err) {
      console.error("Trial start failed", err);
      setFailed(true);
      setBusy(false);
    }
    // После входа кнопка остаётся «занятой»: страница сейчас сменится, второе нажатие ни к чему
  };

  return (
    <div className={cx("grid max-w-sm gap-3", align === "center" ? "justify-items-center text-center" : "justify-items-start text-left", className)}>
      <Button size={size} iconRight={icon} loading={busy} onClick={start}>
        {label}
      </Button>
      <p className={cx("text-xs", inverse ? "text-on-inverse/75" : "text-muted")}>
        <ConsentText template={c.trial} labels={c.labels} inverse={inverse} />
      </p>
      {failed && <Alert>{t.auth.errors.trial}</Alert>}
    </div>
  );
}

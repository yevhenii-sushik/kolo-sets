import { AlertTriangle, CheckCircle, Info, Trash2 } from "lucide-react";
import { Button, Modal, Text, cx } from "../ui";
import { useI18n } from "../contexts/I18nContext";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "warning" | "info" | "success" | "danger";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const TONES = {
  warning: { icon: AlertTriangle, tile: "bg-warning-soft text-warning" },
  info: { icon: Info, tile: "bg-info-soft text-info" },
  success: { icon: CheckCircle, tile: "bg-success-soft text-success" },
  danger: { icon: Trash2, tile: "bg-danger-soft text-danger" },
};

// Подтверждение действия (вызывается через useConfirm): кнопка «Отмена» и кнопка действия
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  type = "warning",
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const { icon: Icon, tile } = TONES[type];

  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText ?? t.cancel}
          </Button>
          <Button variant={type === "danger" ? "danger" : "primary"} onClick={onConfirm} autoFocus>
            {confirmText ?? t.confirm}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <span className={cx("grid h-12 w-12 place-items-center rounded-2xl", tile)}>
          <Icon size={22} />
        </span>
        <div className="grid gap-2">
          <h2 className="font-display text-xl font-extrabold text-fg">{title}</h2>
          <Text size="sm" tone="muted">
            {message}
          </Text>
        </div>
      </div>
    </Modal>
  );
}

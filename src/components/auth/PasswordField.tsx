import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Field, IconButton, Input } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

// Поле пароля с кнопкой «показать / скрыть»
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder="••••••••"
        required
        iconLeft={<Lock size={18} />}
        trailing={
          <IconButton size="sm" label={visible ? t.auth.hidePassword : t.auth.showPassword} onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </IconButton>
        }
      />
    </Field>
  );
}

import { useEffect, useRef, useState } from "react";
import { CloudUpload, Mail, X } from "lucide-react";
import type { AuthCredential } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, Button, Field, IconButton, Input, Modal, Text } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { signInExisting, type LinkResult } from "../../firebase/auth";
import { syncCollectionsToFirestore } from "../../firebase/firestore";
import { AuthDivider } from "./AuthLayout";
import GoogleButton from "./GoogleButton";
import PasswordField from "./PasswordField";

// «Сохранить прогресс» (шаг 16 в docs/specs/06-audit-fixes.md): к пробному аккаунту привязывается Google или почта,
// uid тот же — слова, опыт и награды остаются. Окно глобальное: после входа в другой аккаунт пробный режим
// пропадает вместе с баннером и строкой в настройках, а окну ещё нужно перенести слова и сказать, что вышло
const SAVE_PROGRESS_EVENT = "kolo:save-progress";

export function openSaveProgress() {
  window.dispatchEvent(new Event(SAVE_PROGRESS_EVENT));
}

// Коды Firebase Auth → ключи переведённых ошибок
const AUTH_ERRORS: Record<string, "invalidEmail" | "weakPassword" | "wrongCredentials" | "tooManyRequests"> = {
  "auth/invalid-email": "invalidEmail",
  "auth/weak-password": "weakPassword",
  "auth/wrong-password": "wrongCredentials",
  "auth/invalid-credential": "wrongCredentials",
  "auth/user-not-found": "wrongCredentials",
  "auth/too-many-requests": "tooManyRequests",
};
// Человек сам закрыл окно Google — это не ошибка
const SILENT = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

type Taken = { via: "google"; credential: AuthCredential } | { via: "email"; email: string };
type Stage = { kind: "form" } | { kind: "taken"; taken: Taken } | { kind: "saved" } | { kind: "moved" };

export function SaveProgressHost() {
  const { t } = useI18n();
  const a = t.auth;
  const sp = a.save;
  const { isTrial, saveWithGoogle, saveWithEmail } = useAuth();
  const { allCollections, refreshCollections } = useData();
  // После входа в другой аккаунт DataContext пересоздаёт refreshCollections под нового человека — берём свежую
  const refreshRef = useRef(refreshCollections);
  refreshRef.current = refreshCollections;

  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | "move" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = () => {
      setStage({ kind: "form" });
      setError("");
      setPassword("");
      setOpen(true);
    };
    window.addEventListener(SAVE_PROGRESS_EVENT, handler);
    return () => window.removeEventListener(SAVE_PROGRESS_EVENT, handler);
  }, []);

  const close = () => {
    if (busy) return;
    setOpen(false);
  };

  const errorText = (err: unknown) => a.errors[AUTH_ERRORS[(err as { code?: string })?.code ?? ""] ?? "generic"];

  // Почта занята: если человек вводил её сам, пароль, скорее всего, от того же аккаунта — оставляем его в поле.
  // Если почту назвал Google — поле пароля пустое
  const after = (result: LinkResult, typedEmail: boolean) => {
    if (result.ok) setStage({ kind: "saved" });
    else if (result.taken === "google") setStage({ kind: "taken", taken: { via: "google", credential: result.credential } });
    else {
      setEmail(result.email);
      if (!typedEmail) setPassword("");
      setStage({ kind: "taken", taken: { via: "email", email: result.email } });
    }
  };

  const withGoogle = async () => {
    setError("");
    setBusy("google");
    try {
      after(await saveWithGoogle(), false);
    } catch (err) {
      if (!SILENT.has((err as { code?: string })?.code ?? "")) setError(a.errors.google);
    } finally {
      setBusy(null);
    }
  };

  const withEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(a.errors.passwordTooShort);
      return;
    }
    setBusy("email");
    try {
      after(await saveWithEmail(email.trim(), password), true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  // Google или почта уже у другого аккаунта Kolo: входим в него и переносим туда наборы пробы — с их
  // расписанием. Опыт, орбита и награды пробы остаются в пробном аккаунте (их считает сервер, складывать их
  // нельзя); он удалится сам через 30 дней. Папки не переносим — их в другом аккаунте нет
  const moveInto = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (stage.kind !== "taken") return;
    setError("");
    setBusy("move");
    const sets = allCollections.map((c) => ({ ...c, folderId: undefined }));
    try {
      const taken = stage.taken;
      const user = await signInExisting(taken.via === "google" ? { credential: taken.credential } : { email: taken.email, password });
      if (sets.length > 0) await syncCollectionsToFirestore(user.uid, sets);
      await refreshRef.current().catch(() => {});
      setStage({ kind: "moved" });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const done = stage.kind === "saved" || stage.kind === "moved";

  return (
    <Modal
      open={open && (isTrial || stage.kind !== "form")}
      onClose={close}
      size="sm"
      title={done ? (stage.kind === "saved" ? sp.savedTitle : sp.movedTitle) : stage.kind === "taken" ? sp.takenTitle : sp.title}
      footer={
        done ? (
          <Button fullWidth onClick={close}>
            {t.close}
          </Button>
        ) : stage.kind === "taken" ? (
          <>
            <Button variant="ghost" onClick={() => setStage({ kind: "form" })} disabled={busy !== null}>
              {t.back}
            </Button>
            <Button
              fullWidth
              loading={busy === "move"}
              onClick={stage.taken.via === "google" ? () => moveInto() : undefined}
              type={stage.taken.via === "email" ? "submit" : "button"}
              form={stage.taken.via === "email" ? "save-progress-move" : undefined}
            >
              {sp.takenConfirm}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="grid gap-5">
        {error && <Alert>{error}</Alert>}

        {stage.kind === "saved" && <Text tone="muted">{sp.savedText}</Text>}
        {stage.kind === "moved" && <Text tone="muted">{sp.movedText}</Text>}

        {stage.kind === "taken" && (
          <>
            <Text tone="muted">{stage.taken.via === "google" ? sp.takenGoogle : sp.takenEmail.replace("{email}", stage.taken.email)}</Text>
            {stage.taken.via === "email" && (
              <form id="save-progress-move" onSubmit={moveInto}>
                <PasswordField id="save-progress-existing" label={a.password} value={password} onChange={setPassword} autoComplete="current-password" />
              </form>
            )}
          </>
        )}

        {stage.kind === "form" && (
          <>
            <Text tone="muted">{sp.text}</Text>
            <GoogleButton onClick={withGoogle} disabled={busy !== null}>
              {a.google}
            </GoogleButton>
            <AuthDivider>{a.or}</AuthDivider>
            <form onSubmit={withEmail} className="grid gap-4">
              <Field label={a.email} htmlFor="save-progress-email">
                <Input
                  id="save-progress-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={a.emailPlaceholder}
                  required
                  iconLeft={<Mail size={18} />}
                />
              </Field>
              <PasswordField id="save-progress-password" label={a.password} value={password} onChange={setPassword} autoComplete="new-password" />
              <Button type="submit" fullWidth loading={busy === "email"} disabled={busy !== null && busy !== "email"}>
                {sp.submit}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

// Баннер пробного режима над страницами приложения: прогресс только на этом устройстве — сохрани.
// Скрывается до конца сессии браузера, как просьба подтвердить почту; строка в настройках остаётся
const DISMISS_KEY = "kolo_trial_banner_dismissed";

export function TrialBanner() {
  const { isTrial } = useAuth();
  const { t } = useI18n();
  const b = t.shell.trial;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // приватный режим — баннер просто вернётся при следующем открытии
    }
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {isTrial && !dismissed && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <Alert tone="info" className="mb-4 flex items-center gap-3 py-2 pr-2">
            <CloudUpload size={18} className="shrink-0" />
            <p className="flex-1">
              {b.text}{" "}
              <button type="button" onClick={openSaveProgress} className="font-semibold underline underline-offset-2 hover:no-underline">
                {b.action}
              </button>
            </p>
            <IconButton size="sm" label={b.dismiss} onClick={dismiss}>
              <X size={16} />
            </IconButton>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

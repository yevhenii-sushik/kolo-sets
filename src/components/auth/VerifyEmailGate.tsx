import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Alert, Button, Heading, Logo, Text } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { LEGAL } from "../../pages/legal/legalInfo";

// «Стоп» после недели без подтверждения почты (решение пользователя 2026-11-28, server/core/access.ts): приложение
// не открывается, пока почта не подтверждена. Данные не трогаются — после подтверждения всё на месте.
// Аккаунты, созданные до правила, сюда не попадают никогда
export default function VerifyEmailGate() {
  const { user, sendVerificationEmail, refreshVerification, logout } = useAuth();
  const { t } = useI18n();
  const g = t.shell.verifyGate;
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"send" | "check" | null>(null);
  const [note, setNote] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);

  // Человек мог нажать ссылку в письме на другом устройстве — проверяем сразу при открытии
  useEffect(() => {
    refreshVerification().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resend = async () => {
    setBusy("send");
    try {
      await sendVerificationEmail();
      setNote({ tone: "success", text: g.sent });
    } catch {
      setNote({ tone: "danger", text: g.sendError });
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setBusy("check");
    try {
      // Подтверждена — AuthContext перерисуется, и этот экран сменится приложением
      if (!(await refreshVerification())) setNote({ tone: "warning", text: g.notYet });
    } catch {
      setNote({ tone: "danger", text: g.sendError });
    } finally {
      setBusy(null);
    }
  };

  const leave = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto grid max-w-md justify-items-center gap-5 px-5 pb-16 pt-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-warning-soft text-warning">
          <MailCheck size={28} />
        </span>
        <div className="grid gap-2">
          <Heading size={2} as="h1">
            {g.title}
          </Heading>
          <Text tone="muted">{g.text.replace("{email}", user?.email ?? "")}</Text>
        </div>
        {note && <Alert tone={note.tone}>{note.text}</Alert>}
        <div className="grid w-full gap-3">
          <Button fullWidth size="lg" loading={busy === "check"} disabled={busy !== null} onClick={check}>
            {g.check}
          </Button>
          <Button fullWidth variant="secondary" loading={busy === "send"} disabled={busy !== null} onClick={resend}>
            {g.resend}
          </Button>
          <Button fullWidth variant="ghost" disabled={busy !== null} onClick={leave}>
            {g.logout}
          </Button>
        </div>
        <Text size="sm" tone="faint">
          {g.help.replace("{email}", LEGAL.email.support)}
        </Text>
      </main>
    </div>
  );
}

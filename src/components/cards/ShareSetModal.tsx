import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, RotateCw, Send } from "lucide-react";
import type { Collection } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { createShareLink, revokeShareLink, shareLinkStatus, shareUrl } from "../../api/shareLinks";
import { ApiError } from "../../api/http";
import { useAuth } from "../../contexts/AuthContext";
import { canShare } from "../../../server/core/access";
import { openSaveProgress } from "../auth/SaveProgress";
import { Alert, Button, Field, Input, Loading, Modal, Skeleton, Text } from "../../ui";

type LinkState = { kind: "loading" } | { kind: "failed" } | { kind: "off" } | { kind: "on"; id: string };

const canShareUrl = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

// «Поделиться набором» (docs/specs/07-shared-sets.md): одна живая ссылка на набор — создать, скопировать,
// отправить, выключить. Ссылками управляет сервер, поэтому окно спрашивает его о ссылке при каждом открытии
export default function ShareSetModal({ collection, open, onClose }: { collection: Collection; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const s = t.words.shareSet;
  const { user, standing, sendVerificationEmail } = useAuth();
  // Создать ссылку может только подтверждённый аккаунт (решение 2026-11-28, server/core/access.ts): ссылка — публичная
  // страница на нашем адресе. Пробе — «сохрани прогресс», почте без подтверждения — «подтверди почту»
  const [refused, setRefused] = useState(false);
  const blocked = (standing !== null && !canShare(standing)) || refused;
  const [mailSent, setMailSent] = useState(false);

  const [state, setState] = useState<LinkState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setState({ kind: "loading" });
    setActionFailed(false);
    setConfirmOff(false);
    setCopied(false);
    setRefused(false);
    setMailSent(false);
    // Пробе и неподтверждённой почте ссылку не создать — объяснение сразу, сервер не спрашиваем
    if (standing !== null && !canShare(standing)) {
      setState({ kind: "off" });
      return;
    }
    shareLinkStatus(collection.id).then(
      (id) => alive && setState(id ? { kind: "on", id } : { kind: "off" }),
      () => alive && setState({ kind: "failed" }),
    );
    return () => {
      alive = false;
    };
  }, [open, collection.id, attempt, standing]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setActionFailed(false);
    try {
      const id = await action();
      setState(id ? { kind: "on", id } : { kind: "off" });
      setConfirmOff(false);
    } catch (err) {
      // Сервер отказал по правилу доступа — показываем объяснение, а не «не получилось»
      if (err instanceof ApiError && err.status === 403) setRefused(true);
      else setActionFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const url = state.kind === "on" ? shareUrl(state.id) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Буфер обмена закрыт (старый браузер, нет разрешения) — выделяем ссылку, чтобы скопировать вручную
      inputRef.current?.select();
    }
  };

  const send = async () => {
    try {
      await navigator.share({ title: collection.name, text: s.shareText.replace("{name}", collection.name), url });
    } catch {
      // Закрыли меню или система отказала — ссылка по-прежнему в поле, её можно скопировать
    }
  };

  const resend = async () => {
    try {
      await sendVerificationEmail();
      setMailSent(true);
    } catch {
      setActionFailed(true);
    }
  };

  const footer =
    state.kind === "off" && blocked ? (
      standing === "trial" ? (
        <Button
          onClick={() => {
            onClose();
            openSaveProgress();
          }}
        >
          {t.auth.save.submit}
        </Button>
      ) : (
        <Button variant="secondary" disabled={mailSent} onClick={resend}>
          {mailSent ? t.shell.verify.sent : t.shell.verify.resend}
        </Button>
      )
    ) : state.kind === "off" ? (
      <Button iconLeft={<Link2 size={18} />} loading={busy} onClick={() => run(() => createShareLink(collection.id))}>
        {s.create}
      </Button>
    ) : state.kind === "on" && confirmOff ? (
      <>
        <Button variant="secondary" disabled={busy} onClick={() => setConfirmOff(false)}>
          {t.cancel}
        </Button>
        <Button variant="danger" loading={busy} onClick={() => run(() => revokeShareLink(collection.id))}>
          {s.revokeYes}
        </Button>
      </>
    ) : state.kind === "on" ? (
      <>
        <Button variant="ghost" className="sm:mr-auto" onClick={() => setConfirmOff(true)}>
          {s.revoke}
        </Button>
        {canShareUrl() && (
          <Button iconLeft={<Send size={18} />} onClick={send}>
            {s.send}
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <Modal open={open} onClose={onClose} title={s.title} footer={footer}>
      <div className="grid gap-4">
        <Text size="sm" tone="muted">
          {s.intro}
        </Text>

        {state.kind === "loading" && (
          <Loading label={t.loading}>
            <Skeleton className="h-12 rounded-2xl" />
          </Loading>
        )}

        {state.kind === "failed" && (
          <Alert>
            <div className="grid justify-items-start gap-3">
              {s.error}
              <Button size="sm" variant="secondary" iconLeft={<RotateCw size={16} />} onClick={() => setAttempt((n) => n + 1)}>
                {t.error.retry}
              </Button>
            </div>
          </Alert>
        )}

        {state.kind === "on" &&
          (confirmOff ? (
            <div className="grid gap-1 rounded-2xl bg-inset p-4">
              <p className="font-semibold text-fg">{s.revokeTitle}</p>
              <Text size="sm" tone="muted">
                {s.revokeText}
              </Text>
            </div>
          ) : (
            <>
              <Field label={s.linkLabel} htmlFor="share-set-link">
                <div className="flex gap-2">
                  <Input
                    id="share-set-link"
                    ref={inputRef}
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1"
                  />
                  <Button
                    variant="secondary"
                    className="h-12 shrink-0"
                    iconLeft={copied ? <Check size={18} /> : <Copy size={18} />}
                    onClick={copy}
                    aria-live="polite"
                  >
                    {copied ? s.copied : s.copy}
                  </Button>
                </div>
              </Field>
              <Text size="sm" tone="faint">
                {s.live}
              </Text>
            </>
          ))}

        {state.kind === "off" && blocked && (
          <Alert tone="info">{standing === "trial" ? s.needSave : s.needVerify.replace("{email}", user?.email ?? "")}</Alert>
        )}

        {actionFailed && <Alert>{s.error}</Alert>}
      </div>
    </Modal>
  );
}

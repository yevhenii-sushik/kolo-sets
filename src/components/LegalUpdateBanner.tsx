import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { recordLegalAcceptance } from "../firebase/firestore";
import { LEGAL } from "../pages/legal/legalInfo";
import { Alert, Button } from "../ui";

// Условия или Политика изменились после того, как человек их принял (users/{uid}.legalAcceptance).
// Условия обещают сообщать о существенных изменениях в приложении — это и есть то сообщение.
// «Понятно» записывает, что новая версия показана и принята
export default function LegalUpdateBanner() {
  const { user } = useAuth();
  const { profile } = useData();
  const { t, language } = useI18n();
  const u = t.shell.legalUpdate;
  const [hidden, setHidden] = useState(false);
  const [saving, setSaving] = useState(false);

  const accepted = profile?.legalAcceptance?.version;
  // Новички приняли текущую версию при регистрации (запись может прийти позже профиля) — им не показываем
  const created = profile?.createdAt;
  const createdAt: Date | null =
    typeof created?.toDate === "function" ? created.toDate() : typeof created?.seconds === "number" ? new Date(created.seconds * 1000) : null;
  const isNew = !!createdAt && createdAt >= new Date(`${LEGAL.version}T00:00:00`);
  if (!user || !profile || hidden || isNew || accepted === LEGAL.version) return null;

  const date = new Date(`${LEGAL.version}T12:00:00`).toLocaleDateString(getLanguageInfo(language).htmlLang, { day: "numeric", month: "long" });

  const ok = async () => {
    setSaving(true);
    try {
      await recordLegalAcceptance(user.uid, LEGAL.version);
    } catch {
      // Покажем снова при следующем входе — запись не удалась
    } finally {
      setSaving(false);
      setHidden(true);
    }
  };

  return (
    <Alert tone="info" className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 py-2 pr-2">
      <FileText size={18} className="shrink-0" />
      <p className="min-w-0 flex-1">
        {u.text.replace("{date}", date)}{" "}
        <Link to="/terms" className="font-semibold underline underline-offset-2">
          {u.terms}
        </Link>
        {" · "}
        <Link to="/privacy" className="font-semibold underline underline-offset-2">
          {u.privacy}
        </Link>
      </p>
      <Button size="sm" variant="secondary" loading={saving} onClick={ok}>
        {u.ok}
      </Button>
    </Alert>
  );
}

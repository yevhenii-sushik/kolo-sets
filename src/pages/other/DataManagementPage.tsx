import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2, Upload } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { getCollections } from "../../utils/storage";
import { exportCollectionsToJSON, downloadJSON, importCollectionsFromJSON, readJSONFile } from "../../utils/exportImport";
import { saveUserCollection } from "../../firebase/firestore";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Button, Card } from "../../ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { PageHeader, Section } from "../../components/other/PageSection";

// «Данные и аккаунт»: резервная копия наборов (скачать / восстановить) и удаление аккаунта.
// На этот раздел ссылаются юридические документы («Другое → Данные и аккаунт»).
export default function DataManagementPage() {
  const { t, language } = useI18n();
  const d = t.settings.data;
  const a = t.settings.account;
  const locale = getLanguageInfo(language).htmlLang;
  const navigate = useNavigate();
  const { user, deleteAccount } = useAuth();
  const { refreshCollections } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setBusy("export");
    try {
      const collections = await getCollections();
      if (collections.length === 0) {
        error(d.noCollections);
        return;
      }
      downloadJSON(exportCollectionsToJSON(collections), `kolo-backup-${new Date().toISOString().split("T")[0]}.json`);
      success(d.exportSuccess);
    } catch {
      error(d.exportError);
    } finally {
      setBusy(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // иначе повторный выбор того же файла не сработает
    if (!file) return;
    if (!user) {
      error(d.signInToImport);
      return;
    }
    setBusy("import");
    try {
      const imported = importCollectionsFromJSON(await readJSONFile(file));
      // id из файла сохраняются: набор, который уже есть, перезапишется версией из копии
      for (const coll of imported) await saveUserCollection(user.uid, coll);
      await refreshCollections();
      success(plural(locale, imported.length, d.importSuccess));
    } catch {
      error(d.importError);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: a.confirmTitle,
      message: a.confirmMessage,
      type: "danger",
      confirmText: a.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate("/welcome", { replace: true });
    } catch {
      error(a.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={d.title} subtitle={d.subtitle} />

      <Section title={d.backup} description={d.importNote}>
        <div className="grid gap-3">
          <ActionRow
            icon={<Download size={18} />}
            title={d.export}
            description={d.exportDesc}
            action={
              <Button variant="secondary" size="sm" loading={busy === "export"} disabled={busy !== null} onClick={handleExport}>
                {d.exportButton}
              </Button>
            }
          />
          <ActionRow
            icon={<Upload size={18} />}
            title={d.import}
            description={d.importDesc}
            action={
              <>
                <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
                <Button variant="secondary" size="sm" loading={busy === "import"} disabled={busy !== null} onClick={() => fileRef.current?.click()}>
                  {d.importButton}
                </Button>
              </>
            }
          />
        </div>
      </Section>

      <Section title={a.title}>
        <Card tone="inset" padding="sm" radius="lg" className="grid justify-items-start gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <p className="font-semibold text-fg">{a.delete}</p>
            <p className="text-sm text-muted">{a.deleteDesc}</p>
          </div>
          <Button variant="danger" iconLeft={<Trash2 size={16} />} loading={isDeleting} onClick={handleDeleteAccount} className="shrink-0">
            {isDeleting ? a.deleting : a.delete}
          </Button>
        </Card>
      </Section>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function ActionRow({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action: React.ReactNode }) {
  return (
    <Card tone="inset" padding="sm" radius="lg" className="grid gap-3 sm:flex sm:items-center sm:gap-4">
      <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-accent-ink sm:grid">{icon}</span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="font-semibold text-fg">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {/* На телефоне кнопка уходит под текст — иначе описание сжимается в узкую колонку */}
      <div className="shrink-0">{action}</div>
    </Card>
  );
}

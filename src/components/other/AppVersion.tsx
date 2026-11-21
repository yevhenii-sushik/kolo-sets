import { useState } from "react";
import { Check, RefreshCw, WifiOff } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { checkForUpdates, type UpdateCheck } from "../../utils/registerServiceWorker";
import { Button, Text } from "../../ui";

type State = "idle" | "checking" | UpdateCheck;

// Подвал «Ещё»: какая версия и сборка открыта на этом устройстве и кнопка «Проверить обновления».
// Метка сборки нужна, чтобы сравнить устройства: где старая версия, видно сразу
export function AppVersion() {
  const { t, language } = useI18n();
  const u = t.other.updateCheck;
  const [state, setState] = useState<State>("idle");
  const version = t.updates.versions[0]?.number;
  const build = new Date(__BUILD_ID__).toLocaleString(getLanguageInfo(language).htmlLang, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const check = async () => {
    setState("checking");
    setState(await checkForUpdates());
  };

  const busy = state === "checking" || state === "updating";

  return (
    <div className="grid justify-items-center gap-2 text-center">
      <Text size="sm" tone="faint">
        Kolo Sets{version && <> · {t.other.version.replace("{v}", version)}</>} · {u.build.replace("{d}", build)}
      </Text>
      <Button size="sm" variant="ghost" loading={busy} iconLeft={<RefreshCw size={16} />} onClick={check}>
        {state === "checking" ? u.checking : state === "updating" ? u.updating : u.check}
      </Button>
      <div aria-live="polite">
        {state === "latest" && (
          <Text size="sm" tone="success" className="inline-flex items-center gap-1.5">
            <Check size={16} />
            {u.latest}
          </Text>
        )}
        {state === "offline" && (
          <Text size="sm" tone="muted" className="inline-flex items-center gap-1.5">
            <WifiOff size={16} />
            {u.offline}
          </Text>
        )}
      </div>
    </div>
  );
}

import { CloudOff, RotateCw } from "lucide-react";
import { Button, Heading, Text } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import SessionShell from "./SessionShell";

// Набор не загрузился (нет сети и нет копии в кэше, сбой сервера). Раньше страница оставалась пустой
export default function SessionLoadError({ onRetry, onExit }: { onRetry: () => void; onExit: () => void }) {
  const { t } = useI18n();
  const e = t.words.session.loadError;
  return (
    <SessionShell title="" onClose={onExit}>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-inset text-muted">
          <CloudOff size={26} />
        </span>
        <div className="grid max-w-sm gap-1">
          <Heading size={3}>{e.title}</Heading>
          <Text tone="muted">{e.text}</Text>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onExit}>
            {t.words.session.exit}
          </Button>
          <Button iconLeft={<RotateCw size={18} />} onClick={onRetry}>
            {e.retry}
          </Button>
        </div>
      </main>
    </SessionShell>
  );
}

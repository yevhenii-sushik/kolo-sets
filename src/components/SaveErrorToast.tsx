import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import { onSaveEvent, type SaveEvent } from "../utils/backgroundSave";
import Toast from "./ui/Toast";

type Failure = Extract<SaveEvent, { failed: true }>;

// Одно уведомление на всё приложение о записях, которые не приняли (src/utils/backgroundSave.ts).
// Общее, а не на странице: запись в фоне может не пройти, когда страница уже другая (создал набор —
// и сразу в нём). С повтором висит, пока не нажмут: несохранённое не должно молча исчезнуть.
// «Повторить» повторяет все неудачные записи разом
export default function SaveErrorToast() {
  const { t } = useI18n();
  const s = t.saveFailed;
  const [failures, setFailures] = useState<Failure[]>([]);

  useEffect(
    () =>
      onSaveEvent((event) =>
        setFailures((list) => {
          const rest = list.filter((f) => f.key !== event.key);
          return event.failed ? [...rest, event] : rest;
        }),
      ),
    [],
  );

  const hide = useCallback(() => setFailures([]), []);
  const retries = failures.flatMap((f) => (f.retry ? [f.retry] : []));

  return (
    <Toast
      isOpen={failures.length > 0}
      type="error"
      message={retries.length > 0 ? s.text : s.undone}
      duration={retries.length > 0 ? 0 : 6000}
      action={
        retries.length > 0
          ? {
              label: s.retry,
              onClick: () => {
                hide();
                retries.forEach((retry) => retry());
              },
            }
          : undefined
      }
      onClose={hide}
    />
  );
}

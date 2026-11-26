// Запись без ожидания сети (docs/specs/06-audit-fixes.md, шаг 4).
//
// У Firestore постоянный кэш: запись сразу ложится на устройство и уходит на сервер, когда есть сеть.
// Но промис setDoc ждёт ответа сервера и без сети висит — окна, которые его ждали, не закрывались,
// новый набор не открывался. Поэтому экран меняется сразу, а запись идёт в фоне. Нет сети — не ошибка:
// запись дождётся её сама. Ошибка — это отказ (правила Firestore, слишком большой документ, переполненное
// хранилище); о ней говорит общее уведомление (components/SaveErrorToast.tsx) с «Повторить», а не тишина.

export type SaveEvent =
  | { key: string; failed: false }
  | { key: string; failed: true; retry?: () => void }; // retry нет — экран уже вернул всё как было

type Listener = (event: SaveEvent) => void;
const listeners = new Set<Listener>();
let anonymous = 0;

export function onSaveEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const emit = (event: SaveEvent) => listeners.forEach((l) => l(event));

interface SaveOptions {
  /** Что записывается (`set:<id>`, `folders`): удачная запись снимает прежнюю неудачу с тем же ключом —
   *  последняя версия уже на сервере, — а новая неудача заменяет прежнюю, и повтор один */
  key?: string;
  /** Откат экрана при отказе. С ним повтора нет: на экране снова то, что на сервере, действие можно сделать заново */
  onFail?: () => void;
}

/**
 * Записать в фоне. `write` при повторе вызывается снова, поэтому пусть читает актуальное состояние, а не
 * версию из замыкания: иначе повтор затрёт то, что успело сохраниться после неудачи.
 * Промис не отклоняется: true — запись принята, false — отказ (о нём уже сказано).
 */
export function saveInBackground(write: () => Promise<unknown>, options: SaveOptions = {}): Promise<boolean> {
  const key = options.key ?? `save-${++anonymous}`;
  // new Promise ловит и синхронное исключение из write, а сама запись начинается сразу — порядок записей сохраняется
  return new Promise((resolve) => resolve(write())).then(
    () => {
      emit({ key, failed: false });
      return true;
    },
    (err) => {
      console.error("Не удалось сохранить", key, err);
      options.onFail?.();
      emit({ key, failed: true, retry: options.onFail ? undefined : () => void saveInBackground(write, { key }) });
      return false;
    },
  );
}

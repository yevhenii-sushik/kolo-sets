// PWA: устанавливаемость (manifest + SW) и переход на свежий деплой.
//
// Почему не только события SW: установленное приложение на телефоне (особенно на iOS) почти не
// перезапускается, а «просыпается» из фона. Навигации нет, таймеры стоят, и браузер днями не
// проверяет обновления — устройство так и живёт со старой версией. Поэтому проверяем сами при
// каждом возвращении в приложение и сверяем метку сборки: __BUILD_ID__ в коде и /version.json
// на сервере (vite.config.ts). Расхождение значит, что открыта старая версия.
//
// Почему не virtual:pwa-register: его autoUpdate перезагружает страницу в любой момент, в том
// числе посреди тренировки. Здесь перезагрузка ждёт безопасного экрана (applyIfSafe).

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;
// Переключение между приложениями бывает частым — в сеть ходим не чаще раза в минуту
const CHECK_GAP = 60 * 1000;
// Вкладка может быть открыта днями — проверяем и по таймеру
const CHECK_EVERY = 60 * 60 * 1000;
// Сразу после запуска или возвращения человек ещё ничего не начал — можно перезагрузить без спроса
const FRESH_WINDOW = 10 * 1000;
// Сколько ждём установки нового SW по кнопке, прежде чем сбросить кэш вручную
const INSTALL_TIMEOUT = 20 * 1000;
// Сборка, ради которой уже перезагружались: если после перезагрузки она всё ещё не наша, не зацикливаемся
const RELOADED_KEY = "kolo_update_reloaded_for";

// Экраны, где перезагрузка оборвёт работу: тренировки (/learn, /collection/:id/…), редактор набора, админка
const BUSY_ROUTE = /^\/(learn|collection|admin)(\/|$)/;

let registration: ServiceWorkerRegistration | undefined;
let pending = false; // новая версия уже управляет страницей, осталось перезагрузиться
let forced = false; // человек сам нажал «Проверить обновления» — перезагружаем сразу
let reloading = false;
let activeSince = Date.now();
let lastCheck = 0;
let serverBuild: string | null = null; // последняя метка сборки, полученная с сервера
let previousPath = window.location.pathname;

export type UpdateCheck = "latest" | "updating" | "offline";

export function setupServiceWorker(): void {
  // В dev SW нет (devOptions.enabled: false) и метка сборки всегда совпадает
  if (import.meta.env.DEV) return;

  if ("serviceWorker" in navigator) {
    // Страница уже под SW — значит, смена контроллера означает новую версию.
    // Без контроллера это первая установка: страница и так свежая
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (forced) return reload();
      if (!hadController) return;
      pending = true;
      applyIfSafe(false);
    });

    const register = () => {
      navigator.serviceWorker
        .register(SW_URL, { scope: import.meta.env.BASE_URL })
        .then((r) => {
          registration = r;
        })
        .catch(() => {});
    };
    // Не мешаем первой загрузке: регистрируем после load, как делал workbox-window
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }

  // И сразу сверяемся с сервером: SW мог обновиться, когда старый код уже был загружен
  window.setTimeout(() => void checkQuietly(), 3000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    activeSince = Date.now();
    void checkQuietly();
  });
  // Возврат из bfcache (кнопка «назад» в браузере) — тоже «вернулись в приложение»
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    activeSince = Date.now();
    void checkQuietly();
  });
  setInterval(() => void checkQuietly(), CHECK_EVERY);
}

// Вызывается при каждой смене маршрута (UpdateOnNavigate в App.tsx). Переход между обычными
// экранами — естественный момент подменить версию: человек и так уходит с текущего. Переход
// с тренировки не годится: там ещё может уходить результат на сервер и идти празднование
export function applyPendingUpdate(pathname: string): void {
  const from = previousPath;
  previousPath = pathname;
  if (from === pathname || BUSY_ROUTE.test(from)) return;
  applyIfSafe(true);
}

// Кнопка «Проверить обновления» (раздел «Ещё»)
export async function checkForUpdates(): Promise<UpdateCheck> {
  const server = await fetchServerBuild();
  if (!server) return "offline";
  lastCheck = Date.now();
  const reg = await currentRegistration();
  if (server === __BUILD_ID__) {
    reg?.update().catch(() => {});
    return "latest";
  }

  forced = true;
  if (pending) {
    reload();
    return "updating";
  }
  await reg?.update().catch(() => {});
  if (reg?.installing || reg?.waiting) {
    // Новый SW ставится: controllerchange перезагрузит страницу. Если он завис — сбрасываем вручную
    setTimeout(() => void hardReset(), INSTALL_TIMEOUT);
  } else {
    // Браузер не видит нового SW, а на сервере другая сборка — кэш застрял. Сбрасываем его:
    // данные (наборы, очередь тренировок) лежат в localStorage и IndexedDB, их это не трогает
    void hardReset();
  }
  return "updating";
}

async function checkQuietly(): Promise<void> {
  if (Date.now() - lastCheck < CHECK_GAP) return;
  lastCheck = Date.now();
  const server = await fetchServerBuild();
  if (!server || server === __BUILD_ID__) return;

  const reg = await currentRegistration();
  await reg?.update().catch(() => {});
  // Новый SW ставится — дальше сработает controllerchange
  if (reg?.installing || reg?.waiting) return;
  // SW уже новый (или его нет), а код на странице старый — хватит перезагрузки. Но только раз
  // на сборку: если и после неё версия не сменилась, дальше поможет только кнопка
  if (readReloadedFor() === server) return;
  pending = true;
  applyIfSafe(false);
}

// Наша регистрация ещё может не успеть (ждёт load) — тогда берём ту, что уже есть у браузера
async function currentRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (registration || !("serviceWorker" in navigator)) return registration;
  return navigator.serviceWorker.getRegistration().catch(() => undefined);
}

function applyIfSafe(onNavigation: boolean): void {
  if (!pending) return;
  if (BUSY_ROUTE.test(window.location.pathname)) return;
  // Без перехода перезагружаем только в первые секунды после запуска или возвращения
  if (!onNavigation && Date.now() - activeSince > FRESH_WINDOW) return;
  if (serverBuild) writeReloadedFor(serverBuild);
  reload();
}

function reload(): void {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

// Последнее средство: снять SW и очистить кэш файлов приложения. Следующая загрузка идёт
// мимо SW прямо с сервера и ставит новый SW с нуля
async function hardReset(): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Что не удалось снять — всё равно перезагружаемся: сервер отдаст свежий index.html
  }
  reload();
}

// Метка сборки на сервере; null — нет сети или ответ не тот
async function fetchServerBuild(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { build?: unknown };
    if (typeof data.build !== "string") return null;
    serverBuild = data.build;
    return data.build;
  } catch {
    return null;
  }
}

function readReloadedFor(): string | null {
  try {
    return sessionStorage.getItem(RELOADED_KEY);
  } catch {
    return null;
  }
}

function writeReloadedFor(build: string): void {
  try {
    sessionStorage.setItem(RELOADED_KEY, build);
  } catch {
    // Без sessionStorage просто не запоминаем: защита от цикла перезагрузок слабее, но не ломается
  }
}

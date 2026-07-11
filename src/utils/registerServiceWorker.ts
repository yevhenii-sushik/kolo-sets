import { registerSW } from 'virtual:pwa-register';

// Подключаем PWA: устанавливаемость (manifest + SW) + автообновление.
// Как только Workbox замечает новый деплой (изменился хэш прекэша),
// сразу активируем новый SW и перезагружаем страницу — без промпта
// пользователю, чтобы приложение всегда было свежим без ручных действий.
export function setupServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      updateSW(true);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Вкладка может быть открыта часами/днями — периодически дёргаем
      // update(), чтобы новый деплой подхватился и без ручной перезагрузки
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000);
    },
  });
}

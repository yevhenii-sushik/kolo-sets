import { useEffect } from "react";

// Метаданные публичных страниц для поисковиков. Значения по умолчанию — в index.html: их видят
// мессенджеры и превью ссылок, которые JS не запускают. Здесь — то, что Google видит после
// отрисовки конкретной страницы: свой заголовок, описание и канонический адрес
export const SITE_URL = "https://kolo.dakuta.dev";
// Во вкладке приложения — просто «Kolo»; длинный заголовок из index.html — для поиска и лендинга
export const APP_TITLE = "Kolo";

export function usePageMeta({ title, description, path }: { title?: string; description?: string; path?: string }) {
  useEffect(() => {
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDesc = desc?.content;
    if (title) document.title = title;
    if (description && desc) desc.content = description;

    // Канонический адрес — у каждой страницы свой: один общий в index.html склеил бы все страницы с главной
    let canonical: HTMLLinkElement | null = null;
    if (path) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = SITE_URL + path;
      document.head.appendChild(canonical);
    }

    return () => {
      document.title = APP_TITLE;
      if (desc && prevDesc !== undefined) desc.content = prevDesc;
      canonical?.remove();
    };
  }, [title, description, path]);
}

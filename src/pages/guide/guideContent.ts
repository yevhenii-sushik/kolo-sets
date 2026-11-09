import { useEffect, useState } from "react";
import { useI18n } from "../../contexts/I18nContext";
import type { Language } from "../../locales/languages";
import type enGuide from "../../locales/en/auth/guide.json";

// Публичные страницы «О Kolo» из подвала сайта: как это работает, режимы, движок Perigee
export type Guide = typeof enGuide;
export type GuidePageKey = keyof Guide["pages"];

// Блок страницы: заголовок, текст и/или список пунктов; иллюстрация подбирается по id (GuidePage)
export interface GuideSection {
  id: string;
  title: string;
  text?: string;
  tags?: string[];
  points?: { title: string; text: string }[];
}

export const GUIDE_PAGES: readonly { key: GuidePageKey; path: string }[] = [
  { key: "how", path: "/how-it-works" },
  { key: "modes", path: "/modes" },
  { key: "perigee", path: "/perigee" },
];

// Каждый язык — отдельный чанк, как у юридических текстов: в основной бандл приложения тексты не попадают.
// Нет файла для языка — английский
const loaders = import.meta.glob<Guide>("../../locales/*/auth/guide.json", { import: "default" });
const cache = new Map<Language, Promise<Guide>>();

const load = (lang: Language) => {
  let pending = cache.get(lang);
  if (!pending) {
    pending = (loaders[`../../locales/${lang}/auth/guide.json`] ?? loaders["../../locales/en/auth/guide.json"])();
    cache.set(lang, pending);
  }
  return pending;
};

// Тексты на языке сайта. При смене языка до загрузки нового остаются прежние — страница не мигает
export function useGuide(): Guide | null {
  const { language } = useI18n();
  const [guide, setGuide] = useState<Guide | null>(null);

  useEffect(() => {
    let alive = true;
    load(language).then((data) => alive && setGuide(data));
    return () => {
      alive = false;
    };
  }, [language]);

  return guide;
}

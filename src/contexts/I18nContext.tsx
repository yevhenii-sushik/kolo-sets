import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Language, Translations, translations, getCurrentLanguage, savedLanguage, setLanguage as saveLanguage } from '../locales';
import { getLanguageInfo } from '../locales/languages';
import { auth } from '../firebase/config';

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [t, setT] = useState<Translations>(translations[language]);

  // <html lang> — для скринридеров, переносов и автоперевода браузера.
  // auth.languageCode — язык писем Firebase (подтверждение почты, сброс пароля); норвежский у Firebase — 'no'
  useEffect(() => {
    document.documentElement.lang = getLanguageInfo(language).htmlLang;
    auth.languageCode = language;
  }, [language]);

  // Язык, угаданный по стране, закрепляем, как только человек вошёл. Иначе он менялся бы в поездке
  // (пояс Испании → испанский), а со следующего запуска человек считался бы «вернувшимся» и получил бы
  // язык браузера (locales/index.ts → getCurrentLanguage)
  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user && !savedLanguage()) saveLanguage(language);
      }),
    [language],
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setT(translations[lang]);
    saveLanguage(lang);
  };

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

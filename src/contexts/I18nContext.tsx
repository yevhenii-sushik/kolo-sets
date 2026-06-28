import { createContext, useContext, useState, ReactNode } from 'react';
import { Language, Translations, translations, getCurrentLanguage, setLanguage as saveLanguage } from '../locales';

interface I18nContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [t, setT] = useState<Translations>(translations[language]);

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

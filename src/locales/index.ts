import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enLanding from './en/auth/landing.json'
import enUpdates from './en/other/updates.json';
import enHome from './en/home.json';
import enTips from './en/tips.json';
import enWords from './en/words/words.json';
import enProfile from './en/profile.json';
import enOther from './en/other/other.json';
import enSettings from './en/other/settings.json';

import ruCommon from './ru/common.json';
import ruAuth from './ru/auth.json';
import ruLanding from './ru/auth/landing.json'
import ruUpdates from './ru/other/updates.json';
import ruHome from './ru/home.json';
import ruTips from './ru/tips.json';
import ruWords from './ru/words/words.json';
import ruProfile from './ru/profile.json';
import ruOther from './ru/other/other.json';
import ruSettings from './ru/other/settings.json';


const en = { 
  ...enCommon, 
  auth: enAuth, 
  landing: enLanding,
  updates: enUpdates,
  home: enHome, 
  tips: enTips,
  words: enWords,
  profile: enProfile,
  other: enOther,
  settings: enSettings
};

const ru = { 
  ...ruCommon, 
  auth: ruAuth, 
  landing: ruLanding,
  updates: ruUpdates, 
  home: ruHome,
  tips: ruTips,
  words: ruWords,
  profile: ruProfile,
  other: ruOther,
  settings: ruSettings
};

export type Translations = typeof en;
export type Language = 'en' | 'ru' | 'no' | 'uk';

export const translations: Record<Language, Translations> = {
  en,
  ru,
  no: en, 
  uk: en
};

export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('appLanguage') as Language;
  return saved || 'en';
};

export const setLanguage = (lang: Language): void => {
  localStorage.setItem('appLanguage', lang);
};
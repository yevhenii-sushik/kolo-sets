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
import enGame from './en/game.json';

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
import ruGame from './ru/game.json';

import noCommon from './no/common.json';
import noAuth from './no/auth.json';
import noLanding from './no/auth/landing.json'
import noUpdates from './no/other/updates.json';
import noHome from './no/home.json';
import noTips from './no/tips.json';
import noWords from './no/words/words.json';
import noProfile from './no/profile.json';
import noOther from './no/other/other.json';
import noSettings from './no/other/settings.json';
import noGame from './no/game.json';

import ukCommon from './uk/common.json';
import ukAuth from './uk/auth.json';
import ukLanding from './uk/auth/landing.json'
import ukUpdates from './uk/other/updates.json';
import ukHome from './uk/home.json';
import ukTips from './uk/tips.json';
import ukWords from './uk/words/words.json';
import ukProfile from './uk/profile.json';
import ukOther from './uk/other/other.json';
import ukSettings from './uk/other/settings.json';
import ukGame from './uk/game.json';


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
  settings: enSettings,
  game: enGame,
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
  settings: ruSettings,
  game: ruGame,
};

const no = {
  ...noCommon,
  auth: noAuth,
  landing: noLanding,
  updates: noUpdates,
  home: noHome,
  tips: noTips,
  words: noWords,
  profile: noProfile,
  other: noOther,
  settings: noSettings,
  game: noGame,
};

const uk = {
  ...ukCommon,
  auth: ukAuth,
  landing: ukLanding,
  updates: ukUpdates,
  home: ukHome,
  tips: ukTips,
  words: ukWords,
  profile: ukProfile,
  other: ukOther,
  settings: ukSettings,
  game: ukGame,
};

export type Translations = typeof en;
export type Language = 'en' | 'ru' | 'no' | 'uk';

export const translations: Record<Language, Translations> = {
  en,
  ru,
  no,
  uk
};

export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('appLanguage') as Language;
  return saved || 'en';
};

export const setLanguage = (lang: Language): void => {
  localStorage.setItem('appLanguage', lang);
};

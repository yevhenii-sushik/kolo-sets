import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enLanding from './en/auth/landing.json'
import enUpdates from './en/other/updates.json';
import enHome from './en/home.json';
import enTips from './en/tips.json';
import enWords from './en/words/words.json';
import enProfile from './en/profile.json';
import enRewards from './en/rewards.json';
import enOther from './en/other/other.json';
import enSettings from './en/other/settings.json';
import enExplore from './en/other/explore.json';
import enGame from './en/game.json';
import enLegal from './en/legal.json';
import enError from './en/error.json';

import ruCommon from './ru/common.json';
import ruAuth from './ru/auth.json';
import ruLanding from './ru/auth/landing.json'
import ruUpdates from './ru/other/updates.json';
import ruHome from './ru/home.json';
import ruTips from './ru/tips.json';
import ruWords from './ru/words/words.json';
import ruProfile from './ru/profile.json';
import ruRewards from './ru/rewards.json';
import ruOther from './ru/other/other.json';
import ruSettings from './ru/other/settings.json';
import ruExplore from './ru/other/explore.json';
import ruGame from './ru/game.json';
import ruLegal from './ru/legal.json';
import ruError from './ru/error.json';

import noCommon from './no/common.json';
import noAuth from './no/auth.json';
import noLanding from './no/auth/landing.json'
import noUpdates from './no/other/updates.json';
import noHome from './no/home.json';
import noTips from './no/tips.json';
import noWords from './no/words/words.json';
import noProfile from './no/profile.json';
import noRewards from './no/rewards.json';
import noOther from './no/other/other.json';
import noSettings from './no/other/settings.json';
import noExplore from './no/other/explore.json';
import noGame from './no/game.json';
import noLegal from './no/legal.json';
import noError from './no/error.json';

import ukCommon from './uk/common.json';
import ukAuth from './uk/auth.json';
import ukLanding from './uk/auth/landing.json'
import ukUpdates from './uk/other/updates.json';
import ukHome from './uk/home.json';
import ukTips from './uk/tips.json';
import ukWords from './uk/words/words.json';
import ukProfile from './uk/profile.json';
import ukRewards from './uk/rewards.json';
import ukOther from './uk/other/other.json';
import ukSettings from './uk/other/settings.json';
import ukExplore from './uk/other/explore.json';
import ukGame from './uk/game.json';
import ukLegal from './uk/legal.json';
import ukError from './uk/error.json';

// Языки, у которых пока переведены только публичные страницы: лендинг, вход/регистрация, юр. тексты и Explore
import esLanding from './es/auth/landing.json';
import esExplore from './es/other/explore.json';
import deLanding from './de/auth/landing.json';
import deExplore from './de/other/explore.json';
import frLanding from './fr/auth/landing.json';
import frExplore from './fr/other/explore.json';
import ptBRLanding from './pt-BR/auth/landing.json';
import ptBRExplore from './pt-BR/other/explore.json';
import esLegal from './es/legal.json';
import deLegal from './de/legal.json';
import frLegal from './fr/legal.json';
import ptBRLegal from './pt-BR/legal.json';
import esAuth from './es/auth.json';
import deAuth from './de/auth.json';
import frAuth from './fr/auth.json';
import ptBRAuth from './pt-BR/auth.json';
import esError from './es/error.json';
import deError from './de/error.json';
import frError from './fr/error.json';
import ptBRError from './pt-BR/error.json';
import { LANGUAGES, Language, detectBrowserLanguage } from './languages';

export type { Language } from './languages';


const en = {
  ...enCommon,
  auth: enAuth,
  landing: enLanding,
  updates: enUpdates,
  home: enHome,
  tips: enTips,
  words: enWords,
  profile: enProfile,
  rewards: enRewards,
  other: enOther,
  settings: enSettings,
  explore: enExplore,
  game: enGame,
  legal: enLegal,
  error: enError,
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
  rewards: ruRewards,
  other: ruOther,
  settings: ruSettings,
  explore: ruExplore,
  game: ruGame,
  legal: ruLegal,
  error: ruError,
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
  rewards: noRewards,
  other: noOther,
  settings: noSettings,
  explore: noExplore,
  game: noGame,
  legal: noLegal,
  error: noError,
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
  rewards: ukRewards,
  other: ukOther,
  settings: ukSettings,
  explore: ukExplore,
  game: ukGame,
  legal: ukLegal,
  error: ukError,
};

export type Translations = typeof en;

// Непереведённые разделы берутся из английского
const es: Translations = { ...en, landing: esLanding, explore: esExplore, legal: esLegal, auth: esAuth, error: esError };
const de: Translations = { ...en, landing: deLanding, explore: deExplore, legal: deLegal, auth: deAuth, error: deError };
const fr: Translations = { ...en, landing: frLanding, explore: frExplore, legal: frLegal, auth: frAuth, error: frError };
const ptBR: Translations = { ...en, landing: ptBRLanding, explore: ptBRExplore, legal: ptBRLegal, auth: ptBRAuth, error: ptBRError };

export const translations: Record<Language, Translations> = {
  en,
  es,
  de,
  fr,
  'pt-BR': ptBR,
  ru,
  uk,
  no,
};

export const getCurrentLanguage = (): Language => {
  const saved = localStorage.getItem('appLanguage');
  const known = LANGUAGES.find((l) => l.code === saved);
  return known ? known.code : detectBrowserLanguage();
};

export const setLanguage = (lang: Language): void => {
  localStorage.setItem('appLanguage', lang);
};

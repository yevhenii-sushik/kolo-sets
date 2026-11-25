import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enLanding from './en/auth/landing.json'
import enUpdates from './en/other/updates.json';
import enHome from './en/home.json';
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
import ukWords from './uk/words/words.json';
import ukProfile from './uk/profile.json';
import ukRewards from './uk/rewards.json';
import ukOther from './uk/other/other.json';
import ukSettings from './uk/other/settings.json';
import ukExplore from './uk/other/explore.json';
import ukGame from './uk/game.json';
import ukLegal from './uk/legal.json';
import ukError from './uk/error.json';

// Языки, у которых переведена часть приложения: публичные страницы (лендинг, вход, юр. тексты, Explore)
// и разделы, до которых уже дошли. Новые строки сразу переводятся на все 8 языков (CLAUDE.md, «Internationalization»)
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
import deCommon from './de/common.json';
// Из общих строк пока только подписи заставки на старте (boot)
import esCommon from './es/common.json';
import frCommon from './fr/common.json';
import ptBRCommon from './pt-BR/common.json';
import deGame from './de/game.json';
import deOther from './de/other/other.json';
// Подвал «Ещё»: версия и «Проверить обновления»
import esOther from './es/other/other.json';
import frOther from './fr/other/other.json';
import ptBROther from './pt-BR/other/other.json';
import deWords from './de/words/words.json';
import esWords from './es/words/words.json';
import frWords from './fr/words/words.json';
import ptBRWords from './pt-BR/words/words.json';
// Профиль пока переведён частично: описания достижений теста (остальное — из английского)
import deProfile from './de/profile.json';
import esProfile from './es/profile.json';
import frProfile from './fr/profile.json';
import ptBRProfile from './pt-BR/profile.json';
// Главная — целиком, кроме советов дня (home.tips: карточка выключена, docs/roadmap.md)
import deHome from './de/home.json';
import esHome from './es/home.json';
import frHome from './fr/home.json';
import ptBRHome from './pt-BR/home.json';
import deSettings from './de/other/settings.json';
import esSettings from './es/other/settings.json';
import frSettings from './fr/other/settings.json';
import ptBRSettings from './pt-BR/other/settings.json';
// «Что нового»: подписи страницы и записи с текущей версии; прежние записи — из английского (versionsFrom)
import deUpdates from './de/other/updates.json';
import esUpdates from './es/other/updates.json';
import frUpdates from './fr/other/updates.json';
import ptBRUpdates from './pt-BR/other/updates.json';
import { Language, deviceLanguageTags, startLanguage } from './languages';
import { deviceTimeZone } from './regionLanguages';
import { hadSignInOnDevice } from '../utils/profileCache';
import { onboardingDone } from '../utils/firstRun';
import { DeepPartial, fillFrom } from './fillFrom';

export type { Language } from './languages';


const en = {
  ...enCommon,
  auth: enAuth,
  landing: enLanding,
  updates: enUpdates,
  home: enHome,
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

const partial = (parts: DeepPartial<Translations>): Translations => fillFrom(en, parts);

// Массивы fillFrom берёт целиком, а записи «Что нового» переводятся по одной, начиная с новой версии.
// Поэтому список версий собирается по номеру: переведённая запись заменяет английскую, остальные —
// английские, пока до них не дойдёт перевод (docs/roadmap.md, 0.4.1)
type Updates = Translations['updates'];
const versionsFrom = (part: Omit<Updates, 'versions'> & { versions: Updates['versions'] }): Updates => ({
  ...part,
  versions: enUpdates.versions.map((v) => part.versions.find((p) => p.number === v.number) ?? v),
});

const es = partial({ ...esCommon, landing: esLanding, explore: esExplore, legal: esLegal, auth: esAuth, error: esError, other: esOther, words: esWords, profile: esProfile, home: esHome, settings: esSettings, updates: versionsFrom(esUpdates) });
const de = partial({ ...deCommon, landing: deLanding, explore: deExplore, legal: deLegal, auth: deAuth, error: deError, game: deGame, other: deOther, words: deWords, profile: deProfile, home: deHome, settings: deSettings, updates: versionsFrom(deUpdates) });
const fr = partial({ ...frCommon, landing: frLanding, explore: frExplore, legal: frLegal, auth: frAuth, error: frError, other: frOther, words: frWords, profile: frProfile, home: frHome, settings: frSettings, updates: versionsFrom(frUpdates) });
const ptBR = partial({ ...ptBRCommon, landing: ptBRLanding, explore: ptBRExplore, legal: ptBRLegal, auth: ptBRAuth, error: ptBRError, other: ptBROther, words: ptBRWords, profile: ptBRProfile, home: ptBRHome, settings: ptBRSettings, updates: versionsFrom(ptBRUpdates) });

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

const LANGUAGE_KEY = 'appLanguage';

export const savedLanguage = (): string | null => {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
};

export const getCurrentLanguage = (): Language => {
  const saved = savedLanguage();
  // Следы прежних запусков: копия профиля (вход) или пройденное знакомство. Новичок к следующему
  // запуску уже с сохранённым языком (закрепляется при входе), так что сюда попадают только те,
  // кто пользовался Kolo до 0.4.1 и язык сам не выбирал
  const returning = !saved && (hadSignInOnDevice() || onboardingDone());
  const lang = startLanguage({ saved, returning, browserTags: deviceLanguageTags(), timeZone: deviceTimeZone() });
  if (returning) setLanguage(lang);
  return lang;
};

export const setLanguage = (lang: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Хранилище закрыто (приватный режим) — язык просто не запомнится
  }
};

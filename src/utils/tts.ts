// Озвучка текста с помощью Web Speech API

export interface VoiceOption {
  lang: string;
  name: string;
  voice: SpeechSynthesisVoice;
}

// Получить доступные голоса для языка
export const getAvailableVoices = (lang?: string): VoiceOption[] => {
  const voices = window.speechSynthesis.getVoices();
  
  if (lang) {
    return voices
      .filter(voice => voice.lang.startsWith(lang))
      .map(voice => ({
        lang: voice.lang,
        name: voice.name,
        voice
      }));
  }
  
  return voices.map(voice => ({
    lang: voice.lang,
    name: voice.name,
    voice
  }));
};

// Озвучить текст
export const speak = (
  text: string,
  lang: string = 'en-US',
  rate: number = 0.9
): void => {
  // Останавливаем текущую озвучку если идет
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Пытаемся найти подходящий голос
  const voices = window.speechSynthesis.getVoices();
  
  // Приоритет: точное совпадение языка > начинается с кода > первый доступный
  let voice = voices.find(v => v.lang === lang);
  
  if (!voice) {
    const langPrefix = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langPrefix));
  }
  
  // Для норвежского - ищем nb-NO (Bokmål) или nn-NO (Nynorsk)
  if (!voice && (lang.startsWith('no') || lang.startsWith('nb') || lang.startsWith('nn'))) {
    voice = voices.find(v => v.lang.startsWith('nb-NO') || v.lang.startsWith('nn-NO') || v.lang.startsWith('no'));
  }
  
  if (voice) {
    utterance.voice = voice;
  }
  
  // Для отладки - покажем какой голос используется
  console.log('Using TTS voice:', voice ? `${voice.name} (${voice.lang})` : 'default');
  
  window.speechSynthesis.speak(utterance);
};

// Остановить озвучку
export const stopSpeaking = (): void => {
  window.speechSynthesis.cancel();
};

// Проверить, поддерживается ли TTS
export const isTTSSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Получить язык по коду
export const getLanguageName = (langCode: string): string => {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'no': 'Norsk',
    'nb-NO': 'Norsk (Bokmål)',
    'nn-NO': 'Norsk (Nynorsk)',
    'ru': 'Русский',
    'ru-RU': 'Русский',
    'es': 'Español',
    'es-ES': 'Español (España)',
    'fr': 'Français',
    'fr-FR': 'Français',
    'de': 'Deutsch',
    'de-DE': 'Deutsch',
    'it': 'Italiano',
    'it-IT': 'Italiano',
    'pt': 'Português',
    'pt-BR': 'Português (Brasil)',
    'ja': '日本語',
    'ja-JP': '日本語',
    'ko': '한국어',
    'ko-KR': '한국어',
    'zh': '中文',
    'zh-CN': '中文 (简体)',
    'ar': 'العربية',
    'ar-SA': 'العربية',
    'hi': 'हिन्दी',
    'hi-IN': 'हिन्दी'
  };
  
  return languages[langCode] || langCode;
};

// Популярные языки для быстрого выбора
export const POPULAR_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'nb-NO', name: 'Norsk (Bokmål)' },
  { code: 'nn-NO', name: 'Norsk (Nynorsk)' },
  { code: 'ru-RU', name: 'Русский' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文' }
];

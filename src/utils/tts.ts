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
  rate: number = 1.0
): void => {
  // Останавливаем текущую озвучку если идет
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  
  // Пытаемся найти подходящий голос
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
  
  if (voice) {
    utterance.voice = voice;
  }
  
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
  { code: 'ru-RU', name: 'Русский' },
  { code: 'es-ES', name: 'Español' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'zh-CN', name: '中文' },
  { code: 'ar-SA', name: 'العربية' },
  { code: 'hi-IN', name: 'हिन्दी' }
];

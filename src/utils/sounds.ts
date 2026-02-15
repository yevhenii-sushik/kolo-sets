// Звуковые эффекты для приложения

// Генерация звука с помощью Web Audio API
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Воспроизведение последовательности нот
const playSequence = (notes: { frequency: number; duration: number; delay: number }[]) => {
  notes.forEach(note => {
    setTimeout(() => {
      playTone(note.frequency, note.duration);
    }, note.delay);
  });
};

// Звук правильного ответа (веселый восходящий)
export const playCorrectSound = () => {
  playSequence([
    { frequency: 523.25, duration: 0.1, delay: 0 },    // C5
    { frequency: 659.25, duration: 0.1, delay: 100 },  // E5
    { frequency: 783.99, duration: 0.2, delay: 200 }   // G5
  ]);
};

// Звук неправильного ответа (мягкий нисходящий)
export const playIncorrectSound = () => {
  playSequence([
    { frequency: 392.00, duration: 0.15, delay: 0 },   // G4
    { frequency: 329.63, duration: 0.25, delay: 150 }  // E4
  ]);
};

// Звук завершения сессии (победная фанфара)
export const playSessionCompleteSound = () => {
  playSequence([
    { frequency: 523.25, duration: 0.15, delay: 0 },    // C5
    { frequency: 659.25, duration: 0.15, delay: 150 },  // E5
    { frequency: 783.99, duration: 0.15, delay: 300 },  // G5
    { frequency: 1046.50, duration: 0.4, delay: 450 }   // C6
  ]);
};

// Звук достижения (короткий всплеск)
export const playAchievementSound = () => {
  playSequence([
    { frequency: 880.00, duration: 0.1, delay: 0 },    // A5
    { frequency: 1046.50, duration: 0.1, delay: 80 },  // C6
    { frequency: 1318.51, duration: 0.25, delay: 160 } // E6
  ]);
};

// Звук кнопки (короткий клик)
export const playClickSound = () => {
  playTone(800, 0.05, 'square');
};

// Настройки звука (можно сохранять в localStorage)
export const getSoundEnabled = (): boolean => {
  const saved = localStorage.getItem('soundEnabled');
  return saved !== 'false'; // По умолчанию включено
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem('soundEnabled', String(enabled));
};

// Обертки с проверкой настроек
export const playCorrectIfEnabled = () => {
  if (getSoundEnabled()) playCorrectSound();
};

export const playIncorrectIfEnabled = () => {
  if (getSoundEnabled()) playIncorrectSound();
};

export const playSessionCompleteIfEnabled = () => {
  if (getSoundEnabled()) playSessionCompleteSound();
};

export const playAchievementIfEnabled = () => {
  if (getSoundEnabled()) playAchievementSound();
};

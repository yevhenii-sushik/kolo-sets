import { KnowledgeLevel } from "../types";

// Звуковые эффекты: файлы public/sounds/<id>.mp3 собирает scripts/sounds/synth.py (там же README с высотами
// и громкостью). Играем через один общий AudioContext: каждый файл декодируется один раз, высота меняется
// через playbackRate, а петля капсулы звучит без щелчка на стыке (у <audio loop> с mp3 он бывает).

const SOUND_IDS = [
  "answer-correct",
  "answer-wrong",
  "card-flip",
  "card-next",
  "ui-tap",
  "streak-up",
  "timer-tick",
  "time-up",
  "life-lost",
  "game-over",
  "session-complete",
  "achievement",
  "level-up",
  "orbit-closed",
  "shield",
  "orbit-repaired",
  "capsule-shake",
  "capsule-open",
  "reveal-common",
  "reveal-rare",
  "reveal-epic",
  "reveal-legendary",
  "dust",
  "item-equip",
] as const;

export type SoundId = (typeof SOUND_IDS)[number];

// Праздничные звуки не накладываются: итог сессии, уровень, орбита и медаль, пришедшие одним ответом
// сервера, звучат по очереди — каждый ждёт, пока доиграет предыдущий
const CEREMONY = new Set<SoundId>([
  "session-complete",
  "time-up",
  "game-over",
  "achievement",
  "level-up",
  "orbit-closed",
  "shield",
  "orbit-repaired",
]);

// Отклик на ответ, опоздавший больше чем на четверть секунды (файл ещё грузился), хуже тишины
const MAX_LATE = 0.25;

// Длина петли capsule-shake: mp3 добавляет тишину энкодера, границы петли её отрезают
const SHAKE_LOOP = 0.75;

// Сдвиг на n полутонов. Шаги из scripts/sounds/README.md держат звуки в до-мажорной пентатонике
export const semitones = (n: number) => 2 ** (n / 12);

// Самооценка — не ошибка: один и тот же «тик», только «знаю» чуть выше, а «не знаю» чуть ниже
export const RATING_PITCH: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.DONT_KNOW]: semitones(-2),
  [KnowledgeLevel.FORGOT]: semitones(-1),
  [KnowledgeLevel.REMEMBER]: 1,
  [KnowledgeLevel.KNOW]: semitones(2),
};

// Настройка в localStorage (ключ указан в политике cookies)
export const getSoundEnabled = (): boolean => {
  const saved = localStorage.getItem("soundEnabled");
  return saved !== "false"; // По умолчанию включено
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem("soundEnabled", String(enabled));
};

let ctx: AudioContext | null = null;
const buffers = new Map<SoundId, Promise<AudioBuffer | null>>();
let ceremonyEnd = 0;

function audio(): AudioContext | null {
  if (!("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  // До первого жеста и после сворачивания приложения (iOS) контекст стоит на паузе
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  return ctx;
}

function load(c: AudioContext, id: SoundId): Promise<AudioBuffer | null> {
  let buffer = buffers.get(id);
  if (!buffer) {
    buffer = fetch(`/sounds/${id}.mp3`)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.statusText))))
      .then((data) => c.decodeAudioData(data))
      .catch(() => {
        buffers.delete(id); // офлайн до первого кэша — попробуем в следующий раз
        return null;
      });
    buffers.set(id, buffer);
  }
  return buffer;
}

// Браузеры дают звуку зазвучать только после жеста: на касании или клавише будим контекст и заранее
// загружаем весь набор (~330 КБ, обычно из кэша service worker), чтобы первый же ответ прозвучал вовремя
export function initSounds(): void {
  const wake = () => {
    if (!getSoundEnabled()) return;
    const c = audio();
    if (c && buffers.size < SOUND_IDS.length) for (const id of SOUND_IDS) void load(c, id);
  };
  // Касание даёт право на звук на pointerup, мышь — на pointerdown
  for (const type of ["pointerdown", "pointerup", "keydown"]) {
    window.addEventListener(type, wake, { capture: true, passive: true });
  }
}

interface PlayOptions {
  rate?: number; // playbackRate: высота вместе со скоростью
  delay?: number; // секунды от текущего момента
}

export function playSound(id: SoundId, { rate = 1, delay = 0 }: PlayOptions = {}): void {
  if (!getSoundEnabled()) return;
  const c = audio();
  if (!c) return;
  const asked = c.currentTime + delay;
  void load(c, id).then((buffer) => {
    if (!buffer) return;
    const ceremony = CEREMONY.has(id);
    if (!ceremony && c.currentTime - asked > MAX_LATE) return;
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.connect(c.destination);
    let at = Math.max(asked, c.currentTime);
    if (ceremony) {
      at = Math.max(at, ceremonyEnd);
      ceremonyEnd = at + buffer.duration / rate;
    }
    source.start(at);
  });
}

// Петля (тряска капсулы) играет, пока не вызовут возвращённую функцию, и гаснет за ~0,1 с, без щелчка
export function startLoop(id: SoundId): () => void {
  if (!getSoundEnabled()) return () => {};
  const c = audio();
  if (!c) return () => {};
  let stopped = false;
  let fadeOut = () => {};
  void load(c, id).then((buffer) => {
    if (!buffer || stopped) return;
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = Math.min(SHAKE_LOOP, buffer.duration);
    source.connect(gain).connect(c.destination);
    source.start();
    fadeOut = () => {
      gain.gain.setTargetAtTime(0, c.currentTime, 0.02);
      source.stop(c.currentTime + 0.12);
    };
  });
  return () => {
    stopped = true;
    fadeOut();
  };
}

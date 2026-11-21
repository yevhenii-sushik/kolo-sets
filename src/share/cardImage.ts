// Картинка карточки для соцсетей и мессенджеров: слово, часть речи, перевод, объяснение и пример
// в оформлении «Орбиты», внизу знак Kolo и адрес. Рисуем сами на canvas: без лишних библиотек,
// с нашими шрифтами, и один и тот же результат на любом устройстве.
//
// Цвета ниже — рисунок, а не цвета интерфейса (как предметы в src/progression/looks.ts): картинка
// не должна зависеть от темы приложения. Значения взяты из src/design/tokens.css.

import { MARK_DOT, MARK_RING } from "../ui/Logo";
import { clampLines, wrapText } from "./wrapText";

export type ShareStyle = "light" | "warm" | "night";

export const SHARE_STYLES: ShareStyle[] = ["light", "warm", "night"];

interface Palette {
  bg: string;
  fg: string;
  muted: string;
  translation: string;
  accent: string;
  pill: string;
  decor: string; // кольцо орбиты на фоне
  dot: string; // спутник знака Kolo
}

export const PALETTES: Record<ShareStyle, Palette> = {
  // Фон страницы приложения
  light: {
    bg: "#F5F6FA",
    fg: "#101426",
    muted: "#4E5568",
    translation: "#C2410C",
    accent: "#FF5A1F",
    pill: "#FFFFFF",
    decor: "rgba(255, 90, 31, 0.2)",
    dot: "#101426",
  },
  // Лицо флэшкарты (accent-soft)
  warm: {
    bg: "#FFEEE6",
    fg: "#101426",
    muted: "#4E5568",
    translation: "#C2410C",
    accent: "#FF5A1F",
    pill: "rgba(255, 255, 255, 0.75)",
    decor: "rgba(255, 90, 31, 0.28)",
    dot: "#101426",
  },
  // Ночной синий бренда — как иконка приложения
  night: {
    bg: "#101426",
    fg: "#FFFFFF",
    muted: "#A3A9BD",
    translation: "#FF8A5C",
    accent: "#FF5A1F",
    pill: "rgba(255, 255, 255, 0.09)",
    decor: "rgba(255, 90, 31, 0.32)",
    dot: "#FFFFFF",
  },
};

export interface CardImageContent {
  word: string;
  translation: string;
  partOfSpeech?: string; // уже подписью на языке интерфейса
  explanation?: string;
  example?: string;
  language: string; // «Норвежский» — плашка сверху
}

// 4 : 5 — формат поста: целиком помещается в ленте Instagram, Telegram и WhatsApp
export const IMAGE_WIDTH = 1080;
export const IMAGE_HEIGHT = 1350;
const PAD = 96;
const CONTENT_WIDTH = IMAGE_WIDTH - PAD * 2;
const SITE = "kolo.dakuta.dev";

const DISPLAY = '"Nunito Variable", "Nunito", system-ui, sans-serif';
const SANS = '"Onest Variable", "Onest", system-ui, sans-serif';

// Арабский, иврит, персидский: canvas должен знать направление, иначе знаки препинания уедут
const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

type Ctx = CanvasRenderingContext2D;

interface Block {
  lines: string[];
  font: string;
  size: number;
  lineHeight: number;
  color: string;
  gapBefore: number;
}

export async function renderCardImage(content: CardImageContent, style: ShareStyle): Promise<Blob> {
  await loadFonts(content);
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  const p = PALETTES[style];

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  drawOrbit(ctx, p);

  const pillBottom = drawLanguagePill(ctx, p, content.language);
  const footerTop = drawFooter(ctx, p);

  // Слова между плашкой и подвалом, по центру. Не влезает — уменьшаем всё вместе
  const top = pillBottom + 56;
  const bottom = footerTop - 56;
  let blocks = layout(ctx, content, p, 1);
  for (let k = 0.95; height(blocks) > bottom - top && k >= 0.55; k -= 0.05) blocks = layout(ctx, content, p, k);

  let y = top + Math.max(0, (bottom - top - height(blocks)) / 2);
  for (const b of blocks) {
    y += b.gapBefore;
    if (b.lines.length === 0) {
      // Разделитель между переводом и объяснением — короткая оранжевая черта
      ctx.fillStyle = p.accent;
      roundRect(ctx, IMAGE_WIDTH / 2 - 48, y, 96, b.size, b.size / 2);
      ctx.fill();
      y += b.size;
      continue;
    }
    ctx.font = b.font;
    ctx.fillStyle = b.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const line of b.lines) {
      ctx.direction = RTL.test(line) ? "rtl" : "ltr";
      ctx.fillText(line, IMAGE_WIDTH / 2, y + (b.size * b.lineHeight) / 2);
      y += b.size * b.lineHeight;
    }
  }
  ctx.direction = "ltr";

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas-export"))), "image/png"),
  );
}

// k — общий множитель размеров, когда текста много
function layout(ctx: Ctx, c: CardImageContent, p: Palette, k: number): Block[] {
  const blocks: Block[] = [];

  // Слово — как можно крупнее, но не больше двух строк
  const word = fit(ctx, c.word, (s) => `800 ${s}px ${DISPLAY}`, 170 * k, 64 * k, 2, 3);
  blocks.push({ ...word, lineHeight: 1.12, color: p.fg, gapBefore: 0 });

  if (c.partOfSpeech) {
    const size = 36 * k;
    blocks.push(text(ctx, c.partOfSpeech, `500 ${size}px ${SANS}`, size, 1.3, p.muted, 18 * k, 1));
  }

  const translation = fit(ctx, c.translation, (s) => `700 ${s}px ${DISPLAY}`, 84 * k, 46 * k, 2, 3);
  blocks.push({ ...translation, lineHeight: 1.18, color: p.translation, gapBefore: 32 * k });

  if (c.explanation || c.example) blocks.push({ lines: [], font: "", size: 8 * k, lineHeight: 1, color: p.accent, gapBefore: 52 * k });

  if (c.explanation) {
    const size = 46 * k;
    blocks.push(text(ctx, c.explanation, `400 ${size}px ${SANS}`, size, 1.4, p.fg, 52 * k, 4));
  }
  if (c.example) {
    const size = 42 * k;
    blocks.push(text(ctx, c.example, `italic 400 ${size}px ${SANS}`, size, 1.4, p.muted, (c.explanation ? 28 : 52) * k, 3));
  }
  return blocks;
}

// Самый крупный размер от max до min, при котором текст укладывается в want строк и ни одно слово
// не разрезано посередине («Schmetterli-ng»); если и на min не укладывается — min и не больше
// limit строк с многоточием (длинное слово тогда режется по символам)
function fit(ctx: Ctx, value: string, font: (size: number) => string, max: number, min: number, want: number, limit: number) {
  const words = value.split(/\s+/).filter(Boolean);
  for (let size = max; size > min; size -= 4) {
    ctx.font = font(size);
    const measure = (s: string) => ctx.measureText(s).width;
    if (words.some((w) => measure(w) > CONTENT_WIDTH)) continue;
    const lines = wrapText(value, CONTENT_WIDTH, measure);
    if (lines.length <= want) return { lines, font: font(size), size };
  }
  ctx.font = font(min);
  const measure = (s: string) => ctx.measureText(s).width;
  return { lines: clampLines(wrapText(value, CONTENT_WIDTH, measure), limit, CONTENT_WIDTH, measure), font: font(min), size: min };
}

function text(ctx: Ctx, value: string, font: string, size: number, lineHeight: number, color: string, gapBefore: number, maxLines: number): Block {
  ctx.font = font;
  const measure = (s: string) => ctx.measureText(s).width;
  const lines = clampLines(wrapText(value, CONTENT_WIDTH, measure), maxLines, CONTENT_WIDTH, measure);
  return { lines, font, size, lineHeight, color, gapBefore };
}

function height(blocks: Block[]): number {
  return blocks.reduce((sum, b) => sum + b.gapBefore + (b.lines.length ? b.lines.length * b.size * b.lineHeight : b.size), 0);
}

// Кольца орбиты со спутником в правом верхнем углу, напротив плашки языка: уходят за край
// и не заходят на текст (как кольцо на лице флэшкарты)
function drawOrbit(ctx: Ctx, p: Palette) {
  const cx = IMAGE_WIDTH + 30;
  const cy = -30;
  const r = 300;
  ctx.strokeStyle = p.decor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 72, 0, Math.PI * 2);
  ctx.stroke();
  const a = (128 * Math.PI) / 180;
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 16, 0, Math.PI * 2);
  ctx.fill();
}

// Плашка языка слева сверху: оранжевая точка-спутник и название. Возвращает нижний край
function drawLanguagePill(ctx: Ctx, p: Palette, language: string): number {
  const size = 36;
  const h = 76;
  ctx.font = `600 ${size}px ${SANS}`;
  const label = clampLines(wrapText(language, CONTENT_WIDTH - 90, (s) => ctx.measureText(s).width), 1, CONTENT_WIDTH - 90, (s) => ctx.measureText(s).width)[0] ?? "";
  const w = ctx.measureText(label).width + 30 + 16 + 22 + 30;
  ctx.fillStyle = p.pill;
  roundRect(ctx, PAD, PAD, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(PAD + 30 + 8, PAD + h / 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.fillText(label, PAD + 30 + 16 + 22, PAD + h / 2 + 1);
  return PAD + h;
}

// Подвал: знак и «kolo» слева, адрес справа. Возвращает верхний край
function drawFooter(ctx: Ctx, p: Palette): number {
  const mark = 64;
  const top = IMAGE_HEIGHT - PAD - mark;
  const mid = top + mark / 2;

  // Знак Kolo: геометрия из src/ui/Logo.tsx, viewBox 7 7 86 86
  ctx.save();
  ctx.translate(PAD, top);
  ctx.scale(mark / 86, mark / 86);
  ctx.translate(-7, -7);
  ctx.fillStyle = p.accent;
  ctx.fill(new Path2D(MARK_RING));
  ctx.fillStyle = p.dot;
  ctx.beginPath();
  ctx.arc(MARK_DOT.cx, MARK_DOT.cy, MARK_DOT.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.fillStyle = p.fg;
  ctx.textAlign = "left";
  ctx.font = `800 58px ${DISPLAY}`;
  ctx.fillText("kolo", PAD + mark + 18, mid);

  ctx.fillStyle = p.muted;
  ctx.textAlign = "right";
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText(SITE, IMAGE_WIDTH - PAD, mid + 2);
  return top;
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Шрифты бренда грузятся по unicode-range: просим нужные начертания именно для этого текста
// (кириллица, латиница с диакритикой), иначе canvas нарисует его системным шрифтом
async function loadFonts(c: CardImageContent) {
  if (!document.fonts?.load) return;
  const sample = [c.word, c.translation, c.partOfSpeech, c.explanation, c.example, c.language, "kolo", SITE].filter(Boolean).join(" ");
  await Promise.all(
    [`800 100px ${DISPLAY}`, `700 100px ${DISPLAY}`, `400 40px ${SANS}`, `italic 400 40px ${SANS}`, `500 40px ${SANS}`, `600 40px ${SANS}`].map((f) =>
      document.fonts.load(f, sample),
    ),
  ).catch(() => {});
  await document.fonts.ready;
}

// Общее для картинок «Поделиться» (слово — cardImage.ts, орбита недели — orbitImage.ts): формат,
// оформления, плашка сверху, подвал со знаком Kolo и адресом, шрифты. Рисуем сами на canvas: без лишних
// библиотек, с нашими шрифтами, и один и тот же результат на любом устройстве.
//
// Цвета ниже — рисунок, а не цвета интерфейса (как предметы в src/progression/looks.ts): картинка
// не должна зависеть от темы приложения. Значения взяты из src/design/tokens.css.

import { MARK_DOT, MARK_RING } from "../ui/Logo";
import { clampLines, wrapText } from "./wrapText";

export type ShareStyle = "light" | "warm" | "night";

export const SHARE_STYLES: ShareStyle[] = ["light", "warm", "night"];

export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  translation: string; // оранжевый текст: перевод слова, «орбита замкнута»
  accent: string;
  onAccent: string; // галочка на оранжевом
  pill: string; // плашка сверху, будущие дни недели
  track: string; // пустая орбита и пропущенные дни
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
    onAccent: "#101426",
    pill: "#FFFFFF",
    track: "#E1E4EC",
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
    onAccent: "#101426",
    pill: "rgba(255, 255, 255, 0.75)",
    track: "rgba(194, 65, 12, 0.14)",
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
    onAccent: "#101426",
    pill: "rgba(255, 255, 255, 0.09)",
    track: "rgba(255, 255, 255, 0.16)",
    decor: "rgba(255, 90, 31, 0.32)",
    dot: "#FFFFFF",
  },
};

// 4 : 5 — формат поста: целиком помещается в ленте Instagram, Telegram и WhatsApp
export const IMAGE_WIDTH = 1080;
export const IMAGE_HEIGHT = 1350;
export const PAD = 96;
export const CONTENT_WIDTH = IMAGE_WIDTH - PAD * 2;
const SITE = "kolo.dakuta.dev";

export const DISPLAY = '"Nunito Variable", "Nunito", system-ui, sans-serif';
export const SANS = '"Onest Variable", "Onest", system-ui, sans-serif';

// Арабский, иврит, персидский: canvas должен знать направление, иначе знаки препинания уедут
export const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

export type Ctx = CanvasRenderingContext2D;

// Холст нужного размера, залитый фоном оформления
export function startCanvas(style: ShareStyle): { canvas: HTMLCanvasElement; ctx: Ctx; p: Palette } {
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  const p = PALETTES[style];
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  return { canvas, ctx, p };
}

export function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas-export"))), "image/png"),
  );
}

// Плашка слева сверху: оранжевая точка-спутник и подпись (язык набора, неделя). Возвращает нижний край
export function drawPill(ctx: Ctx, p: Palette, text: string): number {
  const size = 36;
  const h = 76;
  ctx.font = `600 ${size}px ${SANS}`;
  const measure = (s: string) => ctx.measureText(s).width;
  const label = clampLines(wrapText(text, CONTENT_WIDTH - 90, measure), 1, CONTENT_WIDTH - 90, measure)[0] ?? "";
  const w = measure(label) + 30 + 16 + 22 + 30;
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
export function drawFooter(ctx: Ctx, p: Palette): number {
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

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
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
export async function loadFonts(texts: (string | undefined)[], fonts: string[]) {
  if (!document.fonts?.load) return;
  const sample = [...texts, "kolo", SITE].filter(Boolean).join(" ");
  await Promise.all(fonts.map((f) => document.fonts.load(f, sample))).catch(() => {});
  await document.fonts.ready;
}

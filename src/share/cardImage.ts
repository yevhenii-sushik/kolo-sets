// Картинка карточки для соцсетей и мессенджеров: слово, часть речи, перевод, объяснение и пример
// в оформлении «Орбиты», внизу знак Kolo и адрес. Формат, оформления и подвал — общие (canvas.ts)

import { CONTENT_WIDTH, Ctx, DISPLAY, IMAGE_WIDTH, Palette, RTL, SANS, ShareStyle, drawFooter, drawPill, loadFonts, roundRect, startCanvas, toPng } from "./canvas";
import { clampLines, wrapText } from "./wrapText";

export interface CardImageContent {
  word: string;
  translation: string;
  partOfSpeech?: string; // уже подписью на языке интерфейса
  explanation?: string;
  example?: string;
  language: string; // «Норвежский» — плашка сверху
}

interface Block {
  lines: string[];
  font: string;
  size: number;
  lineHeight: number;
  color: string;
  gapBefore: number;
}

export async function renderCardImage(content: CardImageContent, style: ShareStyle): Promise<Blob> {
  const c = content;
  await loadFonts(
    [c.word, c.translation, c.partOfSpeech, c.explanation, c.example, c.language],
    [`800 100px ${DISPLAY}`, `700 100px ${DISPLAY}`, `400 40px ${SANS}`, `italic 400 40px ${SANS}`, `500 40px ${SANS}`, `600 40px ${SANS}`],
  );
  const { canvas, ctx, p } = startCanvas(style);
  drawOrbit(ctx, p);

  const pillBottom = drawPill(ctx, p, content.language);
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

  return toPng(canvas);
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

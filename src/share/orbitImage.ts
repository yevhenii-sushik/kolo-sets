// Картинка орбиты недели для соцсетей и мессенджеров: кольцо с серией внутри, «5 орбит подряд»,
// как идёт неделя, дни Пн–Вс, рекорд и уровень. Кольцо и дни нарисованы так же, как в приложении
// (components/progress/OrbitRing.tsx, WeekOrbit.tsx). Формат, оформления и подвал — общие (canvas.ts)

import { addDays } from "../../server/core/time";
import { CONTENT_WIDTH, Ctx, DISPLAY, IMAGE_WIDTH, PAD, Palette, SANS, ShareStyle, drawFooter, drawPill, loadFonts, startCanvas, toPng } from "./canvas";
import { clampLines, wrapText } from "./wrapText";

export interface OrbitImageContent {
  goal: number;
  days: string[]; // засчитанные дни недели
  week: string; // понедельник
  today: string;
  closed: boolean;
  streak: number;
  // Подписи — уже на языке интерфейса
  pill: string; // «Орбита недели · 17–23 нояб.»
  headline: string; // «5 орбит подряд»
  status: string; // «Орбита этой недели замкнута» или «2 из 4 дней на этой неделе»
  stats: string; // «Рекорд: 8 · Уровень 12»
  weekdays: string[]; // 7 коротких названий, пн → вс
}

const R = 180; // радиус орбиты по центрам точек
const DOT = 24;
const STROKE = 16;
const DAY = 92; // кружок дня недели

const HEADLINE_LH = 1.2;
const STATUS_SIZE = 40;
const STATUS_LH = 1.3;
const LABEL_SIZE = 30;
const STATS_SIZE = 36;

export async function renderOrbitImage(c: OrbitImageContent, style: ShareStyle): Promise<Blob> {
  await loadFonts(
    [c.pill, c.headline, c.status, c.stats, ...c.weekdays, String(c.streak)],
    [`800 100px ${DISPLAY}`, `500 40px ${SANS}`, `600 40px ${SANS}`],
  );
  const { canvas, ctx, p } = startCanvas(style);

  const pillBottom = drawPill(ctx, p, c.pill);
  const footerTop = drawFooter(ctx, p);

  // Заголовок — как можно крупнее, но в одну строку (длинные языки, большая серия)
  let headlineSize = 76;
  ctx.font = `800 ${headlineSize}px ${DISPLAY}`;
  while (headlineSize > 44 && ctx.measureText(c.headline).width > CONTENT_WIDTH) {
    headlineSize -= 4;
    ctx.font = `800 ${headlineSize}px ${DISPLAY}`;
  }

  // Высоты блоков сверху вниз; всё вместе — по центру между плашкой и подвалом
  const ring = 2 * (R + DOT);
  const headline = headlineSize * HEADLINE_LH;
  const status = STATUS_SIZE * STATUS_LH;
  const week = DAY + 16 + LABEL_SIZE * 1.2;
  const stats = STATS_SIZE * STATUS_LH;
  const gaps = [48, 12, 52, 40];
  const total = ring + headline + status + week + stats + gaps.reduce((a, b) => a + b, 0);
  const top = pillBottom + 48;
  const bottom = footerTop - 48;
  let y = top + Math.max(0, (bottom - top - total) / 2);

  const cx = IMAGE_WIDTH / 2;
  const cy = y + R + DOT;
  drawDecor(ctx, p, cx, cy);
  drawRing(ctx, p, c, cx, cy);
  y += ring + gaps[0];

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.fillStyle = p.fg;
  ctx.font = `800 ${headlineSize}px ${DISPLAY}`;
  ctx.fillText(c.headline, cx, y + headline / 2);
  y += headline + gaps[1];

  ctx.fillStyle = c.closed ? p.translation : p.muted;
  line(ctx, c.status, `600 ${STATUS_SIZE}px ${SANS}`, cx, y + status / 2);
  y += status + gaps[2];

  drawWeek(ctx, p, c, y);
  y += week + gaps[3];

  ctx.fillStyle = p.muted;
  line(ctx, c.stats, `500 ${STATS_SIZE}px ${SANS}`, cx, y + stats / 2);

  return toPng(canvas);
}

// Одна строка по центру; не влезает — многоточие
function line(ctx: Ctx, text: string, font: string, x: number, y: number) {
  ctx.font = font;
  const measure = (s: string) => ctx.measureText(s).width;
  const value = clampLines(wrapText(text, CONTENT_WIDTH, measure), 1, CONTENT_WIDTH, measure)[0] ?? "";
  ctx.fillText(value, x, y);
}

// Тонкая внешняя орбита со спутником вокруг кольца недели — как на лице флэшкарты
function drawDecor(ctx: Ctx, p: Palette, cx: number, cy: number) {
  const r = R + DOT + 34;
  ctx.strokeStyle = p.decor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const a = (-150 * Math.PI) / 180; // слева сверху: дуга недели доходит туда последней и не сливается со спутником
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 14, 0, Math.PI * 2);
  ctx.fill();
}

// Кольцо недели: точки — цель, закрашенные — засчитанные дни, дуга соединяет засчитанные;
// замкнутая орбита — кольцо целиком. Внутри — серия орбит
function drawRing(ctx: Ctx, p: Palette, c: OrbitImageContent, cx: number, cy: number) {
  const filled = Math.min(c.days.length, c.goal);
  const arc = c.closed ? 1 : Math.max(0, filled - 1) / c.goal;
  const start = -Math.PI / 2;

  ctx.lineWidth = STROKE;
  ctx.strokeStyle = p.track;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  if (arc > 0) {
    ctx.strokeStyle = p.accent;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, R, start, start + arc * Math.PI * 2);
    ctx.stroke();
    ctx.lineCap = "butt";
  }

  for (let i = 0; i < c.goal; i++) {
    const a = start + (i * 2 * Math.PI) / c.goal;
    ctx.fillStyle = i < filled || c.closed ? p.accent : p.track;
    ctx.beginPath();
    ctx.arc(cx + R * Math.cos(a), cy + R * Math.sin(a), DOT, 0, Math.PI * 2);
    ctx.fill();
  }

  // Число — как можно крупнее, но внутри кольца
  const inner = 2 * (R - DOT - 28);
  const value = String(c.streak);
  let size = 200;
  ctx.font = `800 ${size}px ${DISPLAY}`;
  while (size > 60 && ctx.measureText(value).width > inner) {
    size -= 8;
    ctx.font = `800 ${size}px ${DISPLAY}`;
  }
  ctx.fillStyle = p.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  // Цифры Nunito сидят чуть выше середины строки — опускаем на глаз
  ctx.fillText(value, cx, cy + size * 0.04);
}

// Пн–Вс: засчитанные — оранжевые с галочкой, пропущенные — серые, будущие — только контур,
// сегодня — обведено (как WeekDays в приложении)
function drawWeek(ctx: Ctx, p: Palette, c: OrbitImageContent, top: number) {
  const cell = CONTENT_WIDTH / 7;
  const cy = top + DAY / 2;
  for (let i = 0; i < 7; i++) {
    const day = addDays(c.week, i);
    const x = PAD + cell * (i + 0.5);
    const done = c.days.includes(day);
    const isToday = day === c.today;

    ctx.beginPath();
    if (done) {
      ctx.fillStyle = p.accent;
      ctx.arc(x, cy, DAY / 2, 0, Math.PI * 2);
      ctx.fill();
      drawCheck(ctx, p, x, cy);
    } else if (day < c.today) {
      ctx.fillStyle = p.track;
      ctx.arc(x, cy, DAY / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = p.track;
      ctx.lineWidth = 5;
      ctx.arc(x, cy, DAY / 2 - 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (isToday && !done) {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, cy, DAY / 2 - 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = isToday ? p.fg : p.muted;
    ctx.font = `600 ${LABEL_SIZE}px ${SANS}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.weekdays[i] ?? "", x, top + DAY + 16 + (LABEL_SIZE * 1.2) / 2);
  }
}

function drawCheck(ctx: Ctx, p: Palette, x: number, y: number) {
  ctx.strokeStyle = p.onAccent;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 17, y + 1);
  ctx.lineTo(x - 5, y + 13);
  ctx.lineTo(x + 18, y - 12);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
}

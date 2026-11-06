// Проверка дизайн-системы: запускается перед сборкой (npm run build) и отдельно — npm run check:design.
// Не даёт вернуть то, от чего ушли при редизайне: сырые цвета, произвольные размеры и скругления.
// Цвета — только токены из src/design/tokens.css; правила — src/design/README.md.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Цвета чужих брендов — их нельзя переводить на токены Kolo:
// Woky, Bøy! и кнопка «Продолжить с Google» (цвета из правил оформления Google Sign-In)
const BRAND_HEX = new Set([
  "#13121B", "#6366F1", "#A5B4FC", "#C0553B", "#F3ECE2", "#E6DCCF", "#1E1915",
  "#747775", "#1F1F1F", "#131314", "#8E918F", "#E3E3E3",
]);

const UTIL = "(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|from|via|to|fill|stroke|decoration|accent|placeholder|caret|outline|divide|shadow)";
const PALETTE = "(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const B = "(?<![\\w-])"; // начало класса

const RULES = [
  {
    id: "raw-hex",
    hint: "цвет — только токен (text-fg, bg-surface, border-line…), см. src/design/tokens.css",
    re: new RegExp(`${B}(?:[\\w-]+:)*${UTIL}-\\[([^\\]]*#[0-9A-Fa-f]{3,8}[^\\]]*)\\]`, "g"),
    allow: (m) => [...m[1].matchAll(/#[0-9A-Fa-f]{3,8}/g)].every((h) => BRAND_HEX.has(h[0].toUpperCase())),
  },
  {
    id: "palette",
    hint: "палитра Tailwind заменена токенами состояний: danger, success, warning, info, special (+ -soft)",
    re: new RegExp(`${B}(?:[\\w-]+:)*${UTIL}-${PALETTE}-\\d{2,3}(?![\\w-])`, "g"),
  },
  {
    id: "text-size",
    hint: "размер текста — из шкалы: text-2xs, text-xs, text-sm, text-base, text-lg…",
    re: new RegExp(`${B}(?:[\\w-]+:)*text-\\[\\d+(?:\\.\\d+)?(?:px|rem|em)\\]`, "g"),
  },
  {
    id: "radius",
    hint: "скругление — из шкалы: rounded-lg … rounded-4xl, rounded-full",
    re: new RegExp(`${B}(?:[\\w-]+:)*rounded(?:-[trblse]{1,2})?-\\[[^\\]]+\\]`, "g"),
  },
  {
    id: "scrim",
    hint: "scrim — только затемнение под модалками (bg-scrim/50); в тёмной теме он чёрный. Текст — text-fg",
    re: new RegExp(`${B}(?:[\\w-]+:)*(?:text|fill|stroke|border|ring|outline|decoration)-scrim(?![\\w-])`, "g"),
  },
  {
    id: "font",
    hint: "шрифты: font-sans (Onest) и font-display (Unbounded); вес не выше font-bold",
    re: new RegExp(`${B}(?:[\\w-]+:)*font-(?:black|serif)(?![\\w-])`, "g"),
  },
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx?|css)$/.test(name) && !path.endsWith(join("design", "tokens.css"))) yield path;
  }
}

const problems = [];
for (const file of files(SRC)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      for (const m of line.matchAll(rule.re)) {
        if (rule.allow?.(m)) continue;
        problems.push(`${relative(ROOT, file)}:${i + 1}  ${m[0]}  — ${rule.hint}`);
      }
    }
  });
}

if (problems.length) {
  console.error(`check-design: ${problems.length} нарушений дизайн-системы\n`);
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("check-design: ok");

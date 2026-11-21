// Перенос текста по ширине для рисования на canvas: у canvas нет своего переноса строк.
// Чистые функции — ширину строки меряет переданный measure (в браузере это ctx.measureText)

export type Measure = (text: string) => number;

// Строки, каждая не шире maxWidth. Переносим по пробелам; слово, которое не влезает целиком
// (длинное составное слово, китайский или японский без пробелов), режем по символам
export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const lines: string[] = [];
  let line = "";
  for (const token of clean.split(/( )/)) {
    if (!token) continue;
    if (measure((line + token).trimEnd()) <= maxWidth) {
      line += token;
      continue;
    }
    if (token === " ") {
      lines.push(line.trimEnd());
      line = "";
      continue;
    }
    if (line.trim()) lines.push(line.trimEnd());
    line = "";
    if (measure(token) <= maxWidth) {
      line = token;
      continue;
    }
    for (const ch of Array.from(token)) {
      if (line && measure(line + ch) > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line += ch;
      }
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

// Не больше max строк: лишнее отрезаем, последнюю строку заканчиваем многоточием
export function clampLines(lines: string[], max: number, maxWidth: number, measure: Measure): string[] {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = Array.from(kept[max - 1]);
  while (last.length && measure(`${last.join("").trimEnd()}…`) > maxWidth) last = last.slice(0, -1);
  kept[max - 1] = `${last.join("").trimEnd()}…`;
  return kept;
}

// Склонение по числу: формы из перевода — one / few / many / other (в английском и норвежском только one и other).
// {n} в форме заменяется числом: plural("ru", 7, { one: "{n} слово", few: "{n} слова", many: "{n} слов" }) → «7 слов»
export type PluralForms = { one: string; other: string; few?: string; many?: string };

export const plural = (locale: string, n: number, forms: PluralForms): string => {
  const rule = new Intl.PluralRules(locale).select(n) as keyof PluralForms;
  return (forms[rule] ?? forms.other).replace("{n}", String(n));
};

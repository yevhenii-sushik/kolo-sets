// Склейка классов: пропускает false / null / undefined
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

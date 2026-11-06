import { HTMLAttributes } from "react";
import { cx } from "./cx";

type CardTone = "surface" | "inset" | "inverse" | "accent";

// surface — обычная карточка; inset — вложенный блок внутри карточки;
// inverse — главный акцент экрана (тёмный в светлой теме и наоборот); accent — мягкий оранжевый
const TONES: Record<CardTone, string> = {
  surface: "bg-surface border border-line",
  inset: "bg-inset",
  inverse: "bg-fg text-on-inverse",
  accent: "bg-accent-soft",
};

const PADDING = { none: "", sm: "p-4", md: "p-6", lg: "p-6 sm:p-8" };
const RADIUS = { md: "rounded-2xl", lg: "rounded-3xl", xl: "rounded-4xl" };

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: keyof typeof PADDING;
  radius?: keyof typeof RADIUS;
}

export function Card({ tone = "surface", padding = "md", radius = "xl", className, ...rest }: CardProps) {
  return <div className={cx(TONES[tone], PADDING[padding], RADIUS[radius], className)} {...rest} />;
}

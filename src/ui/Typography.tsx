import { createElement, HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type HeadingSize = "display" | 1 | 2 | 3 | 4;

// display и 1–2 — Nunito (заголовки экранов и секций); 3–4 — Onest (заголовки карточек и групп)
const HEADING: Record<HeadingSize, string> = {
  display: "font-display font-extrabold text-4xl sm:text-5xl leading-[1.08] tracking-tight",
  1: "font-display font-extrabold text-3xl sm:text-4xl leading-tight tracking-tight",
  2: "font-display font-extrabold text-2xl sm:text-3xl leading-tight",
  3: "font-semibold text-lg leading-snug",
  4: "font-semibold text-base leading-snug",
};

// inverse — на bg-fg (тёмный блок в светлой теме и наоборот)
type HeadingTone = "default" | "inverse";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: HeadingSize;
  tone?: HeadingTone;
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  children: ReactNode;
}

export function Heading({ size = 2, tone = "default", as, className, children, ...rest }: HeadingProps) {
  const tag = as ?? (size === "display" ? "h1" : (`h${size}` as const));
  const color = tone === "inverse" ? "text-on-inverse" : "text-fg";
  return createElement(tag, { className: cx(color, "text-balance", HEADING[size], className), ...rest }, children);
}

type TextTone = "default" | "muted" | "faint" | "accent" | "danger" | "success" | "inverse";

const TONES: Record<TextTone, string> = {
  default: "text-fg",
  muted: "text-muted",
  faint: "text-faint",
  accent: "text-accent-ink",
  danger: "text-danger",
  success: "text-success",
  inverse: "text-on-inverse/75", // второстепенный текст на bg-fg
};

const SIZES = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg leading-relaxed" };

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: TextTone;
  size?: keyof typeof SIZES;
  as?: "p" | "span" | "div";
}

export function Text({ tone = "default", size = "base", as = "p", className, ...rest }: TextProps) {
  return createElement(as, { className: cx(TONES[tone], SIZES[size], className), ...rest });
}

// Единственное место, где разрешён КАПС: короткая метка над заголовком секции
export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx("text-xs font-semibold uppercase tracking-[0.08em] text-accent-ink", className)} {...rest} />;
}

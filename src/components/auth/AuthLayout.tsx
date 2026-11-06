import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Heading, Logo, LogoMark, Text } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import SiteLanguagePicker from "../landing/SiteLanguagePicker";

// Макет входа, регистрации и восстановления пароля: слева форма, справа (на широком экране) —
// ночная панель бренда с орбитой и обещаниями с лендинга
export default function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-2 lg:gap-4 lg:p-4">
      <div className="flex min-h-dvh flex-col px-4 sm:px-8 lg:min-h-0">
        <header className="flex h-16 shrink-0 items-center justify-between">
          <Link to="/welcome" className="group">
            <Logo />
          </Link>
          <SiteLanguagePicker />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full max-w-md gap-8">
            <div className="grid gap-2">
              <Heading size={1}>{title}</Heading>
              {subtitle && <Text tone="muted">{subtitle}</Text>}
            </div>
            {children}
            {footer && <p className="text-center text-sm text-muted">{footer}</p>}
          </div>
        </main>
      </div>
      <BrandPanel />
    </div>
  );
}

function BrandPanel() {
  const { t } = useI18n();
  const l = t.landing;
  return (
    <aside className="relative hidden overflow-hidden rounded-4xl bg-brand-night p-12 text-white lg:sticky lg:top-4 lg:flex lg:h-[calc(100dvh-2rem)] lg:flex-col lg:justify-end">
      {/* Орбиты вокруг знака: спутник облетает кольцо */}
      <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 aspect-square w-[560px]">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-20 rounded-full border border-white/10" />
        <div className="absolute inset-40 grid place-items-center">
          <LogoMark size={200} tone="night" className="motion-safe:animate-orbit" />
        </div>
      </div>
      <div className="relative grid max-w-md gap-5">
        <h2 className="font-display text-4xl font-semibold leading-tight text-balance">{l.how.title}</h2>
        <p className="text-lg text-white/70">{l.how.text}</p>
        <ul className="grid gap-2 pt-2">
          {l.hero.promises.map((promise) => (
            <li key={promise} className="flex items-center gap-2 text-sm text-white/80">
              <Check size={16} strokeWidth={2.5} className="text-brand-orange" />
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

// Разделитель «или» между формой и входом через Google
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-sm text-faint">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

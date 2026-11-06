import { ReactNode, useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Mail, Monitor, Plus, Rocket, Smartphone, TabletSmartphone } from "lucide-react";
import { Badge, ButtonLink, Card, Heading, Logo, LogoMark, Ring, Text, buttonStyles, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { APP_LANGUAGES, LANGUAGES, getLanguageInfo } from "../../locales/languages";
import { FEATURES } from "../../config/features";
import { LEGAL } from "../legal/legalInfo";
import SiteLanguagePicker from "../../components/landing/SiteLanguagePicker";
import LandingFooter from "../../components/landing/LandingFooter";
import { DakutaLogo } from "../../components/brand/DakutaLogo";
import {
  AchievementPreview,
  AudioPreview,
  DailyPreview,
  FlashcardsPreview,
  ForgettingCurve,
  HeroPhone,
  HomeScreenPhone,
  MatchPreview,
  QuizPreview,
  ReviewPreview,
  SetsPreview,
  SpeedPreview,
  StreakPreview,
  SurvivalPreview,
} from "../../components/landing/LandingIllustrations";

// Лендинг /welcome. Порядок блоков: что это → как работает → что внутри → почему не бросишь → где → вопросы.
// Главное действие — «Начать учиться» — в шапке, на первом экране и в конце.


const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("max-w-6xl mx-auto px-4 sm:px-8", className)}>{children}</div>;
}

function SectionHeader({ title, text, center = true }: { title: string; text?: string; center?: boolean }) {
  return (
    <motion.div {...reveal} className={cx("grid gap-4 max-w-2xl", center && "mx-auto text-center")}>
      <Heading size={1} as="h2">
        {title}
      </Heading>
      {text && (
        <Text size="lg" tone="muted">
          {text}
        </Text>
      )}
    </motion.div>
  );
}

// Карточка с макетом сверху и подписью снизу — для режимов, привычки и словаря.
// Макет декоративный: всё важное сказано в подписи.
function PreviewCard({
  title,
  text,
  preview,
  className,
  previewClassName = "h-44",
}: {
  title: string;
  text: string;
  preview: ReactNode;
  className?: string;
  previewClassName?: string;
}) {
  return (
    <motion.div {...reveal} className={cx("flex", className)}>
      <Card padding="sm" className="flex flex-1 flex-col gap-4">
        <div aria-hidden className={cx("grid place-items-center overflow-hidden rounded-3xl bg-inset", previewClassName)}>
          {preview}
        </div>
        <div className="grid gap-1 px-2 pb-2">
          <Heading size={4} as="h3">
            {title}
          </Heading>
          <Text size="sm" tone="muted">
            {text}
          </Text>
        </div>
      </Card>
    </motion.div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-base sm:text-lg font-semibold text-fg">{q}</span>
        <span
          className={cx(
            "w-8 h-8 shrink-0 rounded-full grid place-items-center border transition-[transform,background-color,color] duration-300",
            open ? "rotate-45 bg-accent border-accent text-on-accent" : "bg-surface border-line text-muted",
          )}
        >
          <Plus size={16} strokeWidth={2.5} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <Text tone="muted" className="pb-5 pr-4 sm:pr-14 leading-relaxed">
              {a}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Языки, которые можно учить: названия берём из Intl на языке сайта и ставим по алфавиту этих названий
const LEARNABLE = [
  ["es", "🇪🇸"],
  ["fr", "🇫🇷"],
  ["de", "🇩🇪"],
  ["it", "🇮🇹"],
  ["ja", "🇯🇵"],
  ["ko", "🇰🇷"],
  ["zh", "🇨🇳"],
  ["nb", "🇳🇴"],
  ["pl", "🇵🇱"],
  ["tr", "🇹🇷"],
] as const;

function LearnLanguagesStrip() {
  const { t, language } = useI18n();
  const locale = getLanguageInfo(language).htmlLang;
  const names = new Intl.DisplayNames([locale], { type: "language" });
  const languages = LEARNABLE.map(([code, flag]) => {
    const n = names.of(code) ?? code;
    return { code, flag, name: n.charAt(0).toLocaleUpperCase(locale) + n.slice(1) };
  }).sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <section aria-label={t.landing.languages.label} className="border-y border-line">
      <Container className="py-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <span className="text-sm font-medium text-faint">{t.landing.languages.label}</span>
        {languages.map(({ code, flag, name }) => (
          <span key={code} className="flex items-center gap-2 text-sm font-semibold text-fg">
            <span className="text-lg leading-none">{flag}</span>
            {name}
          </span>
        ))}
        <span className="text-sm text-muted">{t.landing.languages.more}</span>
      </Container>
    </section>
  );
}

export default function LandingPage() {
  const { t, language } = useI18n();
  const l = t.landing;
  const info = getLanguageInfo(language);

  // Списки языков считаем из LANGUAGES, чтобы не править тексты при добавлении нового.
  // В «языках интерфейса» — только полностью переведённые (app: true), остальные пока есть лишь на сайте.
  const listLanguages = (langs: readonly { label: string }[]) => langs.map((lang) => lang.label).join(", ");
  const faqItems = l.faq.items.map((item) => ({
    ...item,
    a: item.a
      .replace("{appLanguages}", listLanguages(APP_LANGUAGES))
      .replace("{siteOnlyLanguages}", listLanguages(LANGUAGES.filter((lang) => !lang.app))),
  }));

  // Переход с другой страницы на раздел лендинга (/welcome#faq): прокручиваем, когда страница отрисовалась
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  // Шапка получает фон, когда страницу прокрутили
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  const nav = [
    { href: "#how", label: l.nav.how },
    { href: "#modes", label: l.nav.modes },
    { href: "#faq", label: l.nav.faq },
  ];
  const mode = (key: keyof typeof l.modes.items) => ({ title: l.modes.items[key].name, text: l.modes.items[key].text });
  const platforms = [
    { icon: Smartphone, ...l.app.ios },
    { icon: TabletSmartphone, ...l.app.android },
    { icon: Monitor, ...l.app.desktop },
  ];
  const e = t.explore;

  return (
    <MotionConfig reducedMotion="user">
      <div lang={info.htmlLang} className="min-h-dvh bg-bg overflow-x-hidden">
        {/* ── Шапка ── */}
        <header
          className={cx(
            "fixed top-0 inset-x-0 z-50 border-b transition-colors duration-300",
            scrolled ? "bg-bg/85 backdrop-blur-xl border-line" : "border-transparent",
          )}
        >
          <Container className="h-16 flex items-center justify-between gap-3">
            <Link to="/welcome" className="group shrink-0">
              <Logo />
            </Link>
            <nav aria-label={l.nav.sections} className="hidden lg:flex items-center gap-1">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-full text-sm font-medium text-muted hover:text-fg hover:bg-inset transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1 sm:gap-2">
              <SiteLanguagePicker />
              <span className="hidden sm:contents">
                <ButtonLink to="/login" variant="ghost" size="sm">
                  {l.nav.login}
                </ButtonLink>
              </span>
              <ButtonLink to="/register" size="sm">
                {l.nav.start}
              </ButtonLink>
            </div>
          </Container>
        </header>

        <main>
          {/* ── Первый экран ── */}
          <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
            <Container className="grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="grid justify-items-center gap-6 text-center lg:justify-items-start lg:text-left"
              >
                <Heading size="display">{l.hero.title}</Heading>
                <Text size="lg" tone="muted" className="max-w-xl">
                  {l.hero.subtitle}
                </Text>
                <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
                  <ButtonLink to="/register" size="lg" iconRight={<ArrowRight size={18} />}>
                    {l.hero.start}
                  </ButtonLink>
                  <ButtonLink to="/login" size="lg" variant="secondary">
                    {l.hero.login}
                  </ButtonLink>
                </div>
                <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted lg:justify-start">
                  {l.hero.promises.map((promise) => (
                    <li key={promise} className="flex items-center gap-1.5">
                      <Check size={16} strokeWidth={2.5} className="text-success" />
                      {promise}
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
                <HeroPhone />
              </motion.div>
            </Container>
          </section>

          {FEATURES.learnLanguagesStrip && <LearnLanguagesStrip />}

          {/* ── Как это работает ── */}
          <section id="how" className="scroll-mt-16 py-20 md:py-28 bg-band">
            <Container>
              <SectionHeader title={l.how.title} text={l.how.text} />
              <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
                {/* Орбита, на которой стоят шаги */}
                <div aria-hidden className="absolute top-8 left-[17%] right-[17%] hidden border-t-2 border-dashed border-line md:block" />
                {l.how.steps.map((step, i) => (
                  <motion.li
                    key={step.title}
                    {...reveal}
                    transition={{ ...reveal.transition, delay: i * 0.12 }}
                    className="relative grid content-start justify-items-center gap-3 text-center"
                  >
                    <div aria-hidden className="rounded-full bg-band p-1.5">
                      <Ring value={(i + 1) / l.how.steps.length} size={60} stroke={6} label={step.title}>
                        <span className="font-display text-xl font-extrabold text-fg">{i + 1}</span>
                      </Ring>
                    </div>
                    <Heading size={3}>{step.title}</Heading>
                    <Text tone="muted" className="max-w-xs">
                      {step.text}
                    </Text>
                  </motion.li>
                ))}
              </ol>
            </Container>
          </section>

          {/* ── Режимы ── */}
          <section id="modes" className="scroll-mt-16 py-20 md:py-28">
            <Container>
              <SectionHeader title={l.modes.title} text={l.modes.text} />
              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PreviewCard
                  {...mode("flashcards")}
                  preview={<FlashcardsPreview />}
                  className="sm:col-span-2 lg:row-span-2"
                  previewClassName="flex-1 min-h-80"
                />
                <PreviewCard {...mode("review")} preview={<ReviewPreview />} className="sm:col-span-2" />
                <PreviewCard {...mode("quiz")} preview={<QuizPreview />} />
                <PreviewCard {...mode("speed")} preview={<SpeedPreview />} />
                <PreviewCard {...mode("survival")} preview={<SurvivalPreview />} className="lg:col-span-2" />
                <PreviewCard {...mode("match")} preview={<MatchPreview />} className="lg:col-span-2" />
              </div>
            </Container>
          </section>

          {/* ── Методика: единственный инверсный блок страницы ── */}
          <section id="method" className="scroll-mt-16 py-4 md:py-8">
            <Container>
              <div className="grid items-center gap-10 rounded-4xl bg-fg p-6 sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
                <motion.div {...reveal} className="grid justify-items-start gap-5">
                  {/* Perigee — движок повторений: перигей — точка орбиты, где спутник ближе всего */}
                  <span className="inline-flex items-center gap-2 rounded-full border border-on-inverse/15 py-1.5 pl-2 pr-3.5 text-sm font-semibold text-on-inverse">
                    <LogoMark size={20} tone="inverse" />
                    Perigee
                  </span>
                  <Heading size={1} as="h2" tone="inverse">
                    {l.method.title}
                  </Heading>
                  <Text size="lg" tone="inverse">
                    {l.method.text}
                  </Text>
                </motion.div>
                <ForgettingCurve />
              </div>
            </Container>
          </section>

          {/* ── Привычка ── */}
          <section id="habit" className="scroll-mt-16 py-20 md:py-28">
            <Container>
              <SectionHeader title={l.habit.title} text={l.habit.text} />
              <div className="mt-14 grid gap-4 md:grid-cols-3">
                <PreviewCard {...l.habit.streak} preview={<StreakPreview />} />
                <PreviewCard {...l.habit.daily} preview={<DailyPreview />} />
                <PreviewCard {...l.habit.achievements} preview={<AchievementPreview />} />
              </div>
            </Container>
          </section>

          {/* ── Свои слова ── */}
          <section id="words" className="scroll-mt-16 pb-20 md:pb-28">
            <Container>
              <SectionHeader title={l.words.title} text={l.words.text} />
              <div className="mt-14 grid gap-4 md:grid-cols-2">
                <PreviewCard {...l.words.sets} preview={<SetsPreview />} previewClassName="h-80" />
                <PreviewCard {...l.words.audio} preview={<AudioPreview />} previewClassName="h-80" />
              </div>
            </Container>
          </section>

          {/* ── Кто делает Kolo ── */}
          <section className="py-20 md:py-28 bg-band">
            <Container className="max-w-4xl">
              <motion.div {...reveal} className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
                <DakutaLogo size={88} label="Dakuta" className="text-fg" />
                <div className="grid justify-items-start gap-5">
                  <Heading size={1} as="h2">
                    {l.team.title}
                  </Heading>
                  <Text size="lg">{l.team.text}</Text>
                  <a
                    href="https://dakuta.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    {l.team.link}
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* ── Где учиться ── */}
          <section id="apps" className="scroll-mt-16 py-20 md:py-28">
            <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
              <HomeScreenPhone />
              <div className="grid gap-8">
                <SectionHeader title={l.app.title} text={l.app.text} center={false} />
                <ul className="grid gap-3">
                  {platforms.map(({ icon: Icon, title, hint }) => (
                    <li key={title} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
                      <span className="w-11 h-11 shrink-0 rounded-2xl bg-accent-soft text-accent-ink grid place-items-center">
                        <Icon size={22} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-fg">{title}</span>
                        <span className="block text-sm text-muted">{hint}</span>
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center gap-4 rounded-3xl border border-dashed border-line p-4">
                    <span className="w-11 h-11 shrink-0 rounded-2xl bg-inset text-muted grid place-items-center">
                      <Rocket size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-fg">{l.app.native.title}</span>
                        <Badge tone="info">{l.app.native.badge}</Badge>
                      </span>
                      <span className="block text-sm text-muted">{l.app.native.text}</span>
                    </span>
                  </li>
                </ul>
              </div>
            </Container>
          </section>

          {/* ── Вопросы ── */}
          <section id="faq" className="scroll-mt-16 py-20 md:py-28 bg-band">
            <Container className="grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
              <div className="grid content-start gap-6 lg:sticky lg:top-24 lg:self-start">
                <Heading size={1} as="h2">
                  {l.faq.title}
                </Heading>
                <Card className="grid gap-2">
                  <Heading size={4} as="h3">
                    {l.faq.askTitle}
                  </Heading>
                  <Text size="sm" tone="muted">
                    {l.faq.askText}
                  </Text>
                  <a href={`mailto:${LEGAL.email.support}`} className={cx(buttonStyles({ variant: "secondary", size: "sm" }), "mt-2 w-fit")}>
                    <Mail size={16} />
                    {l.faq.askButton}
                  </a>
                </Card>
              </div>
              <div className="border-t border-line">
                {faqItems.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </Container>
          </section>

          {/* ── Для изучающих норвежский: другие инструменты Dakuta ── */}
          <section className="py-16">
            <Container className="grid gap-4 lg:grid-cols-[1fr_1.3fr_1.3fr]">
              <div className="grid content-center gap-1 lg:pr-6">
                <Heading size={3} as="h2">
                  {l.more.title}
                </Heading>
                <Text size="sm" tone="muted">
                  {l.more.text}
                </Text>
              </div>
              {/* Цвета Woky и Bøy! — их собственные бренды, а не токены Kolo */}
              <a
                href="https://woky.dakuta.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-3xl bg-[#13121B] p-5 text-white"
              >
                <span className="grid flex-1 gap-1">
                  <span className="font-display text-xl font-extrabold">Woky</span>
                  <span className="text-sm text-white/65">{e.woky.tagline}</span>
                </span>
                <ArrowUpRight size={18} className="shrink-0 text-[#A5B4FC] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://boey.dakuta.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-3xl border border-[#E6DCCF] bg-[#F3ECE2] p-5 dark:border-line dark:bg-[#1E1915]"
              >
                <span className="grid flex-1 gap-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-xl font-extrabold text-fg">
                      Bøy<span className="text-[#C0553B]">!</span>
                    </span>
                    <Badge tone="warning">{e.comingSoon}</Badge>
                  </span>
                  <span className="text-sm text-muted">{e.boey.tagline}</span>
                </span>
                <ArrowUpRight size={18} className="shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Container>
          </section>

          {/* ── Финал ── */}
          <section className="pt-12 pb-24 md:pb-32">
            <Container className="grid justify-items-center gap-6 text-center">
              {/* Спутник медленно облетает кольцо */}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}>
                <LogoMark size={104} />
              </motion.div>
              <Heading size="display" as="h2" className="max-w-3xl">
                {l.cta.title}
              </Heading>
              <Text size="lg" tone="muted" className="max-w-xl">
                {l.cta.text}
              </Text>
              <ButtonLink to="/register" size="lg" iconRight={<ArrowRight size={18} />} className="mt-2">
                {l.cta.button}
              </ButtonLink>
            </Container>
          </section>
        </main>

        <LandingFooter />
      </div>
    </MotionConfig>
  );
}

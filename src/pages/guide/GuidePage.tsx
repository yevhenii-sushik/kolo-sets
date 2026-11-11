import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge, ButtonLink, Card, Eyebrow, Heading, PerigeeMark, Spinner, Text, cx } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { courseFlag } from "../../courses/languages";
import { usePageMeta } from "../../utils/pageMeta";
import {
  FlashcardsPreview,
  ForgettingCurve,
  MatchPreview,
  OrbitPreview,
  QuizPreview,
  ReviewPreview,
  RewardsPreview,
  SetsPreview,
  SpeedPreview,
  SurvivalPreview,
} from "../../components/landing/LandingIllustrations";
import { GUIDE_PAGES, useGuide, type GuidePageKey, type GuideSection } from "./guideContent";

// Флаги для блока «Выбери язык» — несколько курсов из каталога, остальные — числом
const SAMPLE_COURSES = ["nb", "es", "de", "fr", "it", "ja", "uk", "ko", "pt", "pl", "tr", "zh"];

function LanguagesArt() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {SAMPLE_COURSES.map((code) => (
        <span key={code} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-3xl leading-none shadow-xs">
          {courseFlag(code)}
        </span>
      ))}
    </div>
  );
}

// Иллюстрации — те же макеты, что на лендинге; подбираются по id блока. inverse — макет нарисован для тёмного фона
const ART: Record<string, { node: ReactNode; inverse?: boolean }> = {
  language: { node: <LanguagesArt /> },
  sets: { node: <SetsPreview /> },
  practise: { node: <FlashcardsPreview /> },
  flashcards: { node: <FlashcardsPreview /> },
  return: { node: <ReviewPreview /> },
  review: { node: <ReviewPreview /> },
  goal: { node: <OrbitPreview /> },
  rewards: { node: <RewardsPreview /> },
  quiz: { node: <QuizPreview /> },
  speed: { node: <SpeedPreview /> },
  survival: { node: <SurvivalPreview /> },
  match: { node: <MatchPreview /> },
  name: { node: <PerigeeMark size={140} /> },
  curve: { node: <ForgettingCurve />, inverse: true },
};

function Points({ points }: { points: NonNullable<GuideSection["points"]> }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {points.map((p) => (
        <li key={p.title}>
          <Card padding="sm" className="grid h-full gap-1 px-5 py-4">
            <span className="font-semibold text-fg">{p.title}</span>
            <Text size="sm" tone="muted">
              {p.text}
            </Text>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Section({ section, step, flip }: { section: GuideSection; step?: number; flip: boolean }) {
  const art = ART[section.id];
  const body = (
    <div className="grid content-start justify-items-start gap-4">
      {(step || section.tags) && (
        <div className="flex flex-wrap items-center gap-2">
          {step && (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-base font-extrabold text-on-accent">
              {step}
            </span>
          )}
          {section.tags?.map((tag) => (
            <Badge key={tag} tone="accent">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <Heading size={2} as="h2">
        {section.title}
      </Heading>
      {section.text && (
        <Text size="lg" tone="muted">
          {section.text}
        </Text>
      )}
    </div>
  );

  if (!art) {
    return (
      <section className="mx-auto grid w-full max-w-3xl gap-6">
        {body}
        {section.points && <Points points={section.points} />}
      </section>
    );
  }

  return (
    <section className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className={cx("grid gap-6", flip && "md:order-last")}>
        {body}
        {section.points && <Points points={section.points} />}
      </div>
      <div
        aria-hidden
        className={cx("grid min-h-72 place-items-center overflow-hidden rounded-4xl p-6", art.inverse ? "bg-fg" : "bg-inset")}
      >
        {art.node}
      </div>
    </section>
  );
}

// Страница «О Kolo»: заголовок, блоки с макетами через один, призыв попробовать и ссылка на следующую страницу
export default function GuidePage({ page }: { page: GuidePageKey }) {
  const { user } = useAuth();
  const guide = useGuide();
  const content = guide?.pages[page];
  const index = GUIDE_PAGES.findIndex((p) => p.key === page);
  const next = GUIDE_PAGES[(index + 1) % GUIDE_PAGES.length];

  usePageMeta({ title: content?.meta.title, description: content?.meta.description, path: GUIDE_PAGES[index].path });

  if (!guide || !content) {
    return (
      <div className="grid min-h-dvh place-items-start justify-center pt-24">
        <Spinner size={24} />
      </div>
    );
  }

  const sections = content.sections as readonly GuideSection[];
  // На странице «Как это работает» блоки с макетами — шаги по порядку
  let step = 0;
  let art = 0;

  return (
    <article className="grid gap-16 md:gap-24">
      <header className="mx-auto grid max-w-3xl justify-items-center gap-4 text-center">
        <Eyebrow>{content.tab}</Eyebrow>
        <Heading size={1} as="h1">
          {content.title}
        </Heading>
        <Text size="lg" tone="muted">
          {content.lead}
        </Text>
      </header>

      {sections.map((s) => {
        const hasArt = Boolean(ART[s.id]);
        const flip = hasArt && art++ % 2 === 1;
        return <Section key={s.id} section={s} step={page === "how" && hasArt ? ++step : undefined} flip={flip} />;
      })}

      <Card tone="inverse" padding="lg" className="grid justify-items-center gap-4 py-12 text-center">
        <Heading size={2} as="h2" tone="inverse">
          {guide.cta.title}
        </Heading>
        <Text tone="inverse" className="max-w-md opacity-80">
          {guide.cta.text}
        </Text>
        <ButtonLink to={user ? "/" : "/register"} size="lg" iconRight={<ArrowRight size={18} />} className="mt-2">
          {user ? guide.cta.openApp : guide.cta.start}
        </ButtonLink>
      </Card>

      <Link
        to={next.path}
        className="group mx-auto inline-flex items-center gap-2 text-lg font-semibold text-accent-ink underline-offset-4 hover:underline"
      >
        {guide.next}: {guide.pages[next.key].tab}
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  );
}

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "../../contexts/I18nContext";
import { Button, ButtonLink, Eyebrow, Heading, Logo, MARK_DOT, MARK_RING, Text } from "../../ui";

// Знак, у которого спутник сошёл с орбиты: вырез на кольце пуст, точка улетает по пунктиру
function DriftingMark() {
  const reduceMotion = useReducedMotion();
  // Кольцо сдвинуто на (8, 14) — вырез под спутник оказывается здесь
  const bite = { x: MARK_DOT.cx + 8, y: MARK_DOT.cy + 14 };
  return (
    <svg viewBox="0 0 150 112" className="w-40 h-auto" aria-hidden>
      <path d={MARK_RING} transform="translate(8 14)" className="fill-accent" />
      <path
        d={`M${bite.x} ${bite.y}Q105 10 132 18`}
        fill="none"
        strokeWidth="2.5"
        strokeDasharray="0.5 7"
        strokeLinecap="round"
        className="stroke-hint"
      />
      <motion.circle
        cx={132}
        cy={18}
        r={MARK_DOT.r}
        className="fill-fg"
        animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function NotFoundPage() {
  const { t } = useI18n();
  const e = t.error;
  const navigate = useNavigate();
  // react-router хранит номер записи в истории: 0 — на сайт пришли сразу сюда, назад идти некуда
  const canGoBack = (window.history.state?.idx ?? 0) > 0;

  // SPA отвечает на любой адрес кодом 200, поэтому просим поисковики не индексировать эту страницу
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "404 · Kolo";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => {
      document.title = prevTitle;
      robots.remove();
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="h-16 px-4 sm:px-8 flex items-center">
        <Link to="/" className="group">
          <Logo />
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-4 pb-16">
        <div className="grid justify-items-center gap-6 max-w-md text-center">
          <DriftingMark />
          <div className="grid gap-3">
            <Eyebrow>404</Eyebrow>
            <Heading size={1}>{e.notFoundTitle}</Heading>
            <Text tone="muted">{e.notFoundText}</Text>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to="/" size="lg">
              {e.home}
            </ButtonLink>
            {canGoBack && (
              <Button variant="secondary" size="lg" onClick={() => navigate(-1)}>
                {e.back}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

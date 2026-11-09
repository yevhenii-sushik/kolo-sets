import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, ButtonLink, Card, Heading, Text, cx } from "../../ui";
import { PageHeader } from "../../components/other/PageSection";

// «Что нового»: версии от новой к старой, по-человечески — как заметки к выпускам у Arc;
// на широком экране слева — оглавление по версиям
export default function UpdatesPage() {
  const { t } = useI18n();
  const u = t.updates;
  const versions = u.versions;
  const [activeVersion, setActiveVersion] = useState(versions[0]?.number ?? "");

  // Подсвечиваем в оглавлении версию, которая сейчас в верхней части экрана
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveVersion(entry.target.id.replace("v-", ""));
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    versions.forEach((v) => {
      const el = document.getElementById(`v-${v.number}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [versions]);

  const scrollToVersion = (number: string) => {
    document.getElementById(`v-${number}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto lg:flex lg:max-w-232 lg:items-start lg:gap-10">
      <nav aria-label={u.sidebarTitle} className="sticky top-24 hidden w-48 shrink-0 lg:block">
        <p className="mb-3 px-3 text-sm font-semibold text-muted">{u.sidebarTitle}</p>
        <ul className="no-scrollbar grid max-h-[70vh] gap-0.5 overflow-y-auto">
          {versions.map((v) => {
            const active = activeVersion === v.number;
            return (
              <li key={v.number}>
                <button
                  type="button"
                  onClick={() => scrollToVersion(v.number)}
                  aria-current={active || undefined}
                  className={cx(
                    "flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-sm tabular-nums transition-colors",
                    active ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:bg-inset hover:text-fg",
                  )}
                >
                  <span className={cx("h-1.5 w-1.5 rounded-full", active ? "bg-accent" : "bg-line")} />v{v.number}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid min-w-0 max-w-2xl flex-1 grid-cols-1 gap-5">
        <PageHeader title={u.title} subtitle={u.subtitle} />

        {/* Выпуск: заголовок с характером, пара фраз вступления, новинки — абзацами, исправления — коротким списком */}
        {versions.map((v, i) => (
          <Card key={v.number} id={`v-${v.number}`} padding="lg" className="grid scroll-mt-24 gap-5">
            <header className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Text size="sm" tone="faint" className="tabular-nums">
                  v{v.number} · {v.date}
                </Text>
                {i === 0 && <Badge tone="accent">{u.latest}</Badge>}
              </div>
              <Heading size={2} as="h2">
                {v.title}
              </Heading>
              {v.intro && <Text className="mt-1 leading-relaxed">{v.intro}</Text>}
            </header>

            {v.features.length > 0 && (
              <div className="grid gap-4">
                {v.features.map((f) => (
                  <section key={f.title} className="grid gap-1">
                    <h3 className="font-semibold text-fg">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{f.text}</p>
                  </section>
                ))}
              </div>
            )}

            {v.fixes.length > 0 && (
              <section className={cx("grid gap-3", v.features.length > 0 && "border-t border-line pt-5")}>
                <h3 className="text-sm font-semibold text-fg">{u.fixesTitle}</h3>
                <ul className="grid gap-2">
                  {v.fixes.map((fix, idx) => (
                    <li key={idx} className="flex gap-3 text-sm leading-relaxed text-muted">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </Card>
        ))}

        <Card tone="inverse" padding="lg" className="grid justify-items-start gap-3">
          <Heading size={2} as="h2" tone="inverse">
            {u.footer.title}
          </Heading>
          <Text tone="inverse">{u.footer.subtitle}</Text>
          <ButtonLink to="/other/support" iconRight={<ArrowRight size={16} />} className="mt-2">
            {u.footer.button}
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}

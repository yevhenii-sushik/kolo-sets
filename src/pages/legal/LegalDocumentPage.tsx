import { Fragment, MouseEvent, ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, ChevronDown, Hash, Info, Languages, Mail } from "lucide-react";
import { Badge, Button, Card, Heading, Text, buttonStyles, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo, type Language } from "../../locales/languages";
import { openCookieSettings } from "../../utils/consent";
import { LEGAL, LEGAL_DOCS, operatorLine, type DocKey } from "./legalInfo";

// ── Формат текстов: locales/{lang}/legal-docs.json ──────────────────────────
// Блок — абзац (строка), список, таблица или выделенная заметка. В строках:
// **жирный**, `код`, [текст](/путь | https://… | #cookie-settings),
// {site}, {operator}, {email.privacy|legal|support}.

type Block =
  | string
  | { list: string[] }
  | { note: string }
  | { table: { columns: string[]; rows: string[][] } };

interface LegalSection {
  id: string;
  title: string;
  blocks: Block[];
}

interface LegalDoc {
  title: string;
  scope: string;
  summary: string[];
  sections: LegalSection[];
}

type LegalDocs = Record<DocKey, LegalDoc>;

// Каждый язык — отдельный чанк, грузится только при открытии юридической страницы
const loaders = import.meta.glob<LegalDocs>("../../locales/*/legal-docs.json", { import: "default" });
const loadDocs = (lang: Language) =>
  (loaders[`../../locales/${lang}/legal-docs.json`] ?? loaders["../../locales/en/legal-docs.json"])();

const TOKEN = /(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\{[\w.]+\})/;
const LINK = "font-semibold text-accent-ink underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent";

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => (
        <Fragment key={i}>{renderToken(part)}</Fragment>
      ))}
    </>
  );
}

function renderToken(part: string): ReactNode {
  if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
    return (
      <strong className="font-semibold text-fg">
        <Inline text={part.slice(2, -2)} />
      </strong>
    );
  }
  if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
    return (
      <code className="inline-block max-w-full truncate rounded-md bg-inset px-1.5 py-0.5 align-bottom font-mono text-xs text-fg">
        {part.slice(1, -1)}
      </code>
    );
  }
  const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) {
    const [, label, href] = link;
    if (href === "#cookie-settings") {
      return (
        <button type="button" onClick={openCookieSettings} className={LINK}>
          {label}
        </button>
      );
    }
    if (href.startsWith("/")) {
      return (
        <Link to={href} className={LINK}>
          {label}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cx(LINK, "inline-flex items-center gap-0.5")}>
        {label}
        <ArrowUpRight size={13} className="shrink-0" />
      </a>
    );
  }
  const placeholder = part.match(/^\{([\w.]+)\}$/)?.[1];
  if (placeholder === "site") return LEGAL.site;
  if (placeholder === "operator") return operatorLine();
  if (placeholder?.startsWith("email.")) {
    const email = LEGAL.email[placeholder.slice(6) as keyof typeof LEGAL.email];
    if (email) {
      return (
        <a href={`mailto:${email}`} className={LINK}>
          {email}
        </a>
      );
    }
  }
  return part;
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      <table className="w-full text-left text-sm hyphens-manual">
        <thead className="hidden bg-inset md:table-header-group">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-5 py-3.5 text-xs font-semibold text-muted last:min-w-44">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="block space-y-2 border-t border-line p-5 first:border-t-0 md:table-row md:space-y-0 md:p-0 md:first:border-t">
              {row.map((cell, c) => (
                <td key={c} className="block align-top leading-relaxed md:table-cell md:px-5 md:py-4 md:last:min-w-44">
                  <span className="mb-0.5 block text-xs font-semibold text-faint md:hidden">{columns[c]}</span>
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (typeof block === "string") {
    return (
      <p className="max-w-[70ch]">
        <Inline text={block} />
      </p>
    );
  }
  if ("list" in block) {
    return (
      <ul className="max-w-[70ch] space-y-2.5">
        {block.list.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              <Inline text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if ("note" in block) {
    return (
      <div className="flex max-w-[70ch] gap-3 rounded-3xl border border-accent/20 bg-accent-soft p-5 text-fg">
        <Info size={18} className="mt-1 shrink-0 text-accent-ink" />
        <p>
          <Inline text={block.note} />
        </p>
      </div>
    );
  }
  return <DataTable columns={block.table.columns} rows={block.table.rows} />;
}

// Подсвечивает последний раздел, чей заголовок прошёл верхнюю треть экрана;
// в самом низу страницы — последний раздел (короткие разделы до этой линии не доходят)
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = ids[0];
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = id;
      }
      setActive(atBottom ? ids[ids.length - 1] : current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return active;
}

const num = (i: number) => String(i + 1).padStart(2, "0");

export default function LegalDocumentPage({ doc }: { doc: DocKey }) {
  const { t, language } = useI18n();
  const page = t.legal.page;
  const meta = LEGAL_DOCS.find((d) => d.key === doc)!;
  const { hash } = useLocation();

  // Перевод можно на время заменить английским оригиналом (он юридически приоритетен)
  const [showOriginal, setShowOriginal] = useState(false);
  useEffect(() => setShowOriginal(false), [language]);
  const docLang: Language = showOriginal ? "en" : language;

  const [docs, setDocs] = useState<LegalDocs | null>(null);
  useEffect(() => {
    let alive = true;
    loadDocs(docLang).then((data) => alive && setDocs(data));
    return () => {
      alive = false;
    };
  }, [docLang]);

  const content = docs?.[doc];
  const sections = content?.sections ?? [];
  const active = useScrollSpy(sections.map((s) => s.id));

  useEffect(() => {
    if (!content) return;
    document.title = `${content.title} · Kolo`;
    return () => {
      document.title = "Kolo";
    };
  }, [content]);

  // Прямая ссылка на раздел (/privacy#rights) — прокручиваем, когда текст загрузился
  useEffect(() => {
    if (content && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(content)]);

  const jump = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  const date = new Intl.DateTimeFormat(getLanguageInfo(language).htmlLang, { dateStyle: "long" }).format(
    new Date(`${LEGAL.version}T12:00:00`),
  );
  const Icon = meta.icon;
  const docHtmlLang = getLanguageInfo(docLang).htmlLang;

  if (!content) {
    return (
      <div className="animate-pulse space-y-6" aria-busy>
        <div className="h-8 w-40 rounded-full bg-inset" />
        <div className="h-14 w-3/4 rounded-2xl bg-inset" />
        <div className="h-40 rounded-4xl bg-inset" />
      </div>
    );
  }

  const toc = (
    <ol lang={docHtmlLang} className="space-y-0.5">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={jump(s.id)}
            aria-current={active === s.id ? "location" : undefined}
            className={cx(
              "flex gap-3 rounded-xl px-3 py-2 text-sm font-medium leading-snug transition-colors",
              active === s.id ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg",
            )}
          >
            <span className={cx("tabular-nums", active === s.id ? "text-accent-ink" : "text-faint")}>{num(i)}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <article>
      {/* ── Шапка документа ── */}
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-8">
        <div className="grid justify-items-start gap-5">
          <Badge className="inline-flex items-center gap-1.5">
            <Icon size={14} />
            {page.effective.replace("{date}", date)}
          </Badge>
          <Heading size="display" lang={docHtmlLang} className="hyphens-auto sm:hyphens-none">
            {content.title}
          </Heading>
          <Text size="lg" tone="muted" lang={docHtmlLang}>
            {content.scope}
          </Text>
        </div>

        <Card padding="none" className="overflow-hidden">
          <p className="border-b border-line px-6 py-4 text-sm font-semibold text-fg">{page.shortVersion}</p>
          <div lang={docHtmlLang} className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {content.summary.map((text, i) => {
              const SummaryIcon = meta.summaryIcons[i];
              return (
                <div key={i} className="flex gap-3 p-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                    <SummaryIcon size={18} />
                  </span>
                  <p className="text-sm font-medium leading-snug text-fg">{text}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.header>

      {/* ── Перевод / оригинал ── */}
      {language !== "en" && (
        <div className="mt-4 flex flex-col gap-3 rounded-3xl bg-inset px-5 py-4 sm:flex-row sm:items-center">
          <Languages size={18} className="shrink-0 text-info" />
          <p className="flex-1 text-sm leading-snug text-muted">{showOriginal ? page.originalNote : page.translationNote}</p>
          <Button variant="secondary" size="sm" onClick={() => setShowOriginal((v) => !v)} className="self-start sm:self-auto">
            {showOriginal ? page.showTranslation : page.showOriginal}
          </Button>
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        {/* ── Оглавление ── */}
        <aside className="hidden lg:block">
          <nav aria-label={page.contents} className="sticky top-28">
            <p className="mb-3 px-3 text-sm font-semibold text-fg">{page.contents}</p>
            {toc}
          </nav>
        </aside>

        <div className="min-w-0">
          <details className="group mb-8 rounded-3xl bg-inset p-2 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold text-fg">
              {page.contents}
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label={page.contents} className="pt-1">
              {toc}
            </nav>
          </details>

          {/* ── Разделы ── */}
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              lang={docHtmlLang}
              className="scroll-mt-28 border-t border-line py-10 first-of-type:border-t-0 first-of-type:pt-0"
            >
              <div className="group mb-5 flex items-baseline gap-4">
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-accent-ink">{num(i)}</span>
                <h2 className="text-2xl font-semibold leading-tight tracking-tight text-fg text-balance">{s.title}</h2>
                <a
                  href={`#${s.id}`}
                  onClick={jump(s.id)}
                  aria-label={page.linkToSection}
                  className="text-faint opacity-0 transition-opacity hover:text-accent-ink focus:opacity-100 group-hover:opacity-100"
                >
                  <Hash size={16} />
                </a>
              </div>
              <div className="space-y-4 text-base leading-[1.75] text-muted hyphens-auto">
                {s.blocks.map((block, b) => (
                  <BlockView key={b} block={block} />
                ))}
              </div>
            </section>
          ))}

          {/* ── Вопросы по документу ── */}
          <Card tone="inverse" padding="lg" className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Heading size={3} as="h2" tone="inverse">
                {page.questionsTitle}
              </Heading>
              <Text size="sm" tone="inverse" className="mt-1">
                {page.questionsText}
              </Text>
            </div>
            <a href={`mailto:${meta.contact}`} className={cx(buttonStyles({ variant: "primary" }), "break-all")}>
              <Mail size={16} className="shrink-0" />
              {meta.contact}
            </a>
          </Card>

          {/* ── Другие документы ── */}
          <p className="mb-4 mt-14 text-sm font-semibold text-fg">{page.alsoRead}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {LEGAL_DOCS.filter((d) => d.key !== doc).map((d) => {
              const DocIcon = d.icon;
              return (
                <Link
                  key={d.key}
                  to={d.path}
                  className="group flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-accent/50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-inset text-muted">
                    <DocIcon size={18} />
                  </span>
                  <span className="flex-1 text-sm font-semibold leading-snug text-fg">{t.legal.docs[d.key]}</span>
                  <ArrowUpRight size={16} className="text-faint transition-colors group-hover:text-accent-ink" />
                </Link>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconLeft={<ArrowUp size={16} />}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-10"
          >
            {page.backToTop}
          </Button>
        </div>
      </div>
    </article>
  );
}

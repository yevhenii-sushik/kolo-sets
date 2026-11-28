import { Fragment, ReactNode } from "react";
import { useI18n } from "../../contexts/I18nContext";

type DocKey = "terms" | "privacy" | "cookies";

// Подставляет ссылки на документы вместо {terms} / {privacy} / {cookies} в переведённой строке.
// labels — подписи ссылок в нужном падеже («прочитал(а) Политику…»), иначе берутся названия документов.
// Ссылки открываются в новой вкладке, чтобы не терять заполненную форму.
// inverse — строка на тёмном блоке (bg-fg): ссылки светлые с подчёркиванием, акцентный цвет там не читается
export default function ConsentText({
  template,
  labels,
  inverse = false,
}: {
  template: string;
  labels?: Partial<Record<DocKey, string>>;
  inverse?: boolean;
}) {
  const { t } = useI18n();
  const d = { ...t.legal.docs, ...labels };
  const links: Record<string, ReactNode> = {
    terms: <DocAnchor href="/terms" inverse={inverse}>{d.terms}</DocAnchor>,
    privacy: <DocAnchor href="/privacy" inverse={inverse}>{d.privacy}</DocAnchor>,
    cookies: <DocAnchor href="/cookies" inverse={inverse}>{d.cookies}</DocAnchor>,
  };

  return (
    <>
      {template.split(/(\{\w+\})/).map((part, i) => {
        const key = part.match(/^\{(\w+)\}$/)?.[1];
        return <Fragment key={i}>{key && key in links ? links[key] : part}</Fragment>;
      })}
    </>
  );
}

function DocAnchor({ href, inverse, children }: { href: string; inverse: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        inverse
          ? "font-semibold text-on-inverse underline underline-offset-2 hover:no-underline"
          : "text-accent-ink font-semibold underline-offset-2 hover:underline"
      }
    >
      {children}
    </a>
  );
}

import { Fragment, ReactNode } from "react";
import { useI18n } from "../../contexts/I18nContext";

type DocKey = "terms" | "privacy" | "cookies";

// Подставляет ссылки на документы вместо {terms} / {privacy} / {cookies} в переведённой строке.
// labels — подписи ссылок в нужном падеже («прочитал(а) Политику…»), иначе берутся названия документов.
// Ссылки открываются в новой вкладке, чтобы не терять заполненную форму.
export default function ConsentText({
  template,
  labels,
}: {
  template: string;
  labels?: Partial<Record<DocKey, string>>;
}) {
  const { t } = useI18n();
  const d = { ...t.legal.docs, ...labels };
  const links: Record<string, ReactNode> = {
    terms: <DocAnchor href="/terms">{d.terms}</DocAnchor>,
    privacy: <DocAnchor href="/privacy">{d.privacy}</DocAnchor>,
    cookies: <DocAnchor href="/cookies">{d.cookies}</DocAnchor>,
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

function DocAnchor({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-ink font-semibold underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

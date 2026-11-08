import {
  Ban,
  Cookie,
  FileText,
  FolderLock,
  GraduationCap,
  Handshake,
  ReceiptText,
  Scale,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

// Реквизиты и версии юридических документов — единое место для всех страниц.
// Тексты документов — в locales/{lang}/legal-docs.json (оригинал — en).
//
// TODO: заполнить legalName, orgNumber и address. Без них документы неполные:
// GDPR ст. 13(1)(a) требует указать, кто контролёр данных, а норвежский
// ehandelsloven § 8 — название, оргномер и географический адрес поставщика.
// Пустые поля на страницах просто не выводятся.
export const LEGAL = {
  product: "Kolo Sets",
  site: "kolo.dakuta.dev",
  operator: "Dakuta",
  legalName: "",
  orgNumber: "",
  address: "",
  country: "Norway",
  email: {
    privacy: "privacy@dakuta.dev",
    legal: "legal@dakuta.dev",
    support: "support@dakuta.dev",
  },
  // Дата вступления в силу и версия, которую пользователь принимает при регистрации
  // (users/{uid}.legalAcceptance). Меняй при существенных правках Условий или Политики.
  version: "2026-11-08", // этапы 0–2: виртуальные предметы в Условиях, прогресс и награды в Политике
};

// «Dakuta (Dakuta AS, org. no. 123 456 789), Storgata 1, Oslo, Norway» — из заполненных полей
export const operatorLine = () => {
  const details = [LEGAL.legalName, LEGAL.orgNumber && `org. no. ${LEGAL.orgNumber}`]
    .filter(Boolean)
    .join(", ");
  return [
    details ? `${LEGAL.operator} (${details})` : LEGAL.operator,
    LEGAL.address,
    LEGAL.country,
  ]
    .filter(Boolean)
    .join(", ");
};

export type DocKey = "privacy" | "terms" | "cookies" | "refund";

// Порядок = порядок вкладок. summaryIcons — к трём пунктам «Коротко»; contact — адрес для вопросов по документу.
export const LEGAL_DOCS: {
  key: DocKey;
  path: string;
  icon: LucideIcon;
  summaryIcons: LucideIcon[];
  contact: string;
}[] = [
  { key: "privacy", path: "/privacy", icon: ShieldCheck, summaryIcons: [Ban, FolderLock, Trash2], contact: LEGAL.email.privacy },
  { key: "terms", path: "/terms", icon: Scale, summaryIcons: [GraduationCap, FileText, Handshake], contact: LEGAL.email.legal },
  { key: "cookies", path: "/cookies", icon: Cookie, summaryIcons: [Cookie, Settings2, SlidersHorizontal], contact: LEGAL.email.privacy },
  { key: "refund", path: "/refund", icon: ReceiptText, summaryIcons: [GraduationCap, ReceiptText, Scale], contact: LEGAL.email.support },
];

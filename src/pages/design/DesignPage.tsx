import { ReactNode, useEffect, useState } from "react";
import { ArrowRight, Eye, Heart, Mail, Moon, Plus, Search, Sun, Trash2 } from "lucide-react";
import {
  AppIcon,
  Badge,
  Button,
  ButtonLink,
  Card,
  Checkbox,
  Eyebrow,
  Field,
  Heading,
  IconButton,
  Input,
  Logo,
  LogoMark,
  Modal,
  Ring,
  Switch,
  Text,
  Textarea,
} from "../../ui";
import type { BadgeTone, ButtonVariant } from "../../ui";

// Витрина дизайн-системы (только dev, маршрут /design): все токены и компоненты в одном месте

const COLOR_GROUPS: { title: string; tokens: string[] }[] = [
  { title: "Поверхности", tokens: ["bg", "band", "surface", "inset", "subtle", "track", "line", "scrim"] },
  { title: "Текст", tokens: ["fg", "muted", "faint", "hint", "on-inverse"] },
  { title: "Акцент", tokens: ["accent", "accent-hover", "accent-deep", "accent-ink", "accent-soft", "on-accent"] },
  { title: "Бренд — не меняются в тёмной теме", tokens: ["brand-night", "brand-orange"] },
  {
    title: "Состояния",
    tokens: ["danger", "danger-soft", "success", "success-soft", "warning", "warning-soft", "info", "info-soft", "special", "special-soft"],
  },
];
const VARIANTS: ButtonVariant[] = ["primary", "inverse", "secondary", "soft", "ghost", "danger"];
const BADGES: BadgeTone[] = ["neutral", "accent", "success", "warning", "danger", "info", "special"];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 py-10 border-t border-line first:border-t-0">
      <div className="grid gap-1">
        <Heading size={2}>{title}</Heading>
        {note && <Text tone="muted" size="sm">{note}</Text>}
      </div>
      {children}
    </section>
  );
}

function Swatch({ token, dark }: { token: string; dark: boolean }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(`--color-${token}`).trim());
  }, [token, dark]);
  return (
    <div className="grid gap-2 min-w-0">
      <div className="h-14 rounded-2xl border border-line" style={{ backgroundColor: `var(--color-${token})` }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg truncate">{token}</p>
        <p className="text-xs text-faint font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function DesignPage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [modal, setModal] = useState(false);
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);

  // Переключатель темы только для просмотра: при уходе со страницы возвращаем как было
  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark");
    return () => {
      document.documentElement.classList.toggle("dark", initial);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-dvh bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
          <div className="grid gap-2">
            <Eyebrow>Kolo · дизайн-система</Eyebrow>
            <Heading size="display">Витрина</Heading>
            <Text tone="muted">
              Токены — <code className="font-mono text-sm">src/design/tokens.css</code>, компоненты —{" "}
              <code className="font-mono text-sm">src/ui</code>, правила — <code className="font-mono text-sm">src/design/README.md</code>.
            </Text>
          </div>
          <Button variant="secondary" iconLeft={dark ? <Sun size={16} /> : <Moon size={16} />} onClick={() => setDark((d) => !d)}>
            {dark ? "Светлая тема" : "Тёмная тема"}
          </Button>
        </header>

        <Section title="Цвета" note="Используйте только эти имена: text-fg, bg-surface, border-line, bg-accent/10…">
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="grid gap-3">
              <Text size="sm" tone="faint" className="font-semibold">
                {group.title}
              </Text>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {group.tokens.map((token) => (
                  <Swatch key={token} token={token} dark={dark} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section
          title="Знак"
          note="«Орбита»: кольцо и спутник. Logo — знак с надписью «kolo», LogoMark — знак отдельно, AppIcon — иконка приложения."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Card tone="surface" padding="lg" className="grid gap-5 justify-items-start">
              <Logo size="lg" />
              <Logo />
              <Logo size="sm" />
            </Card>
            <Card tone="inverse" padding="lg" className="grid gap-5 justify-items-start content-start">
              <Logo size="lg" tone="inverse" />
              <Text size="xs" className="text-on-inverse/60">
                tone="inverse" — на bg-fg
              </Text>
            </Card>
            <Card tone="accent" padding="lg" className="grid gap-5 justify-items-start content-start">
              <Logo size="lg" tone="mono" />
              <Text size="xs">tone="mono" — цвет от текста вокруг</Text>
            </Card>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <AppIcon size={96} />
            <AppIcon size={60} />
            <AppIcon size={32} />
            {[16, 24, 32, 48].map((s) => (
              <LogoMark key={s} size={s} />
            ))}
          </div>
        </Section>

        <Section title="Типографика" note="Nunito — заголовки экранов и секций, крупные цифры и логотип; Onest — всё остальное. Капс — только Eyebrow.">
          <div className="grid gap-4">
            <Eyebrow>Eyebrow — метка над заголовком</Eyebrow>
            <Heading size="display">Display · Каждое слово идёт по кругу</Heading>
            <Heading size={1}>Heading 1 · Слова на сегодня</Heading>
            <Heading size={2}>Heading 2 · Режимы тренировки</Heading>
            <Heading size={3}>Heading 3 · Заголовок карточки</Heading>
            <Heading size={4}>Heading 4 · Заголовок группы</Heading>
            <Text size="lg">Text lg — вводный абзац. Ææ Øø Åå · Ґґ Її · Ññ ß</Text>
            <Text>Text base — основной текст интерфейса и описаний.</Text>
            <Text size="sm" tone="muted">Text sm muted — второстепенные пояснения.</Text>
            <Text size="xs" tone="faint">Text xs faint — подписи и метаданные.</Text>
            <div className="flex flex-wrap gap-4">
              {(["accent", "success", "danger"] as const).map((tone) => (
                <Text key={tone} size="sm" tone={tone} className="font-semibold">
                  tone="{tone}"
                </Text>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Кнопки" note="Одна primary на экран. Иконка-кнопка всегда с подписью label.">
          <div className="grid gap-4">
            {VARIANTS.map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-xs font-mono text-faint">{variant}</span>
                <Button variant={variant} size="sm">Small</Button>
                <Button variant={variant}>Medium</Button>
                <Button variant={variant} size="lg" iconRight={<ArrowRight size={18} />}>
                  Large
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-xs font-mono text-faint">states</span>
              <Button loading>Сохраняем</Button>
              <Button disabled>Недоступно</Button>
              <Button variant="secondary" iconLeft={<Plus size={16} />}>
                Добавить слово
              </Button>
              <Button variant="danger" iconLeft={<Trash2 size={16} />}>
                Удалить
              </Button>
              <ButtonLink to="/design" variant="soft">
                ButtonLink
              </ButtonLink>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-xs font-mono text-faint">icon</span>
              <IconButton label="Поиск">
                <Search size={18} />
              </IconButton>
              <IconButton label="В избранное" variant="surface">
                <Heart size={18} />
              </IconButton>
              <IconButton label="Добавить" variant="soft">
                <Plus size={18} />
              </IconButton>
              <IconButton label="Удалить" size="sm">
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>
        </Section>

        <Section title="Поля" note="Подписи — обычным регистром. Текст полей 16px, чтобы iOS не увеличивал страницу.">
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Email" hint="Мы не показываем его другим" htmlFor="d-email">
              <Input id="d-email" type="email" placeholder="name@example.com" iconLeft={<Mail size={18} />} />
            </Field>
            <Field label="Пароль" htmlFor="d-pass">
              <Input
                id="d-pass"
                type="password"
                defaultValue="secret-password"
                trailing={
                  <IconButton label="Показать пароль" size="sm">
                    <Eye size={18} />
                  </IconButton>
                }
              />
            </Field>
            <Field label="Название набора" error="Название не может быть пустым" htmlFor="d-name">
              <Input id="d-name" invalid placeholder="Например, Еда и напитки" />
            </Field>
            <Field label="Пример" htmlFor="d-example">
              <Textarea id="d-example" rows={3} defaultValue="Jeg leser en interessant bok." />
            </Field>
            <Checkbox label="Я принимаю Условия использования" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <div className="flex items-center gap-3">
              <Switch checked={on} onChange={setOn} label="Напоминания" />
              <Text size="sm">Напоминания</Text>
            </div>
          </div>
        </Section>

        <Section title="Метки">
          <div className="flex flex-wrap gap-2">
            {BADGES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Карточки" note="inverse — один главный акцент на экран.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <Heading size={3}>surface</Heading>
              <Text tone="muted" size="sm">Обычная карточка.</Text>
              <Card tone="inset" padding="sm" radius="md" className="mt-4">
                <Text size="sm">inset — вложенный блок</Text>
              </Card>
            </Card>
            <Card tone="inverse">
              <Heading size={3} className="text-on-inverse">inverse</Heading>
              <p className="text-sm opacity-70">Главный акцент экрана.</p>
            </Card>
            <Card tone="accent">
              <Heading size={3}>accent</Heading>
              <Text tone="muted" size="sm">Мягкий оранжевый: напоминания, «к повторению».</Text>
            </Card>
            <Card tone="inset">
              <Heading size={3}>inset</Heading>
              <Text tone="muted" size="sm">Приглушённый блок на фоне страницы.</Text>
            </Card>
          </div>
        </Section>

        <Section title="Кольцо" note="Фирменный элемент: прогресс, цели, загрузка.">
          <div className="flex flex-wrap items-center gap-6">
            <Ring value={0.25} label="25%" />
            <Ring value={0.72} size={64} stroke={7} label="18 из 25 слов на сегодня">
              <span className="text-sm font-semibold text-fg">18</span>
            </Ring>
            <Ring value={1} size={64} stroke={7} tone="success" label="Цель выполнена">
              <span className="text-xs font-semibold text-success">100%</span>
            </Ring>
            <Ring value={0.5} size={96} stroke={9} tone="info" label="Выучено 50%">
              <span className="font-display font-extrabold text-xl text-fg">50</span>
            </Ring>
          </div>
        </Section>

        <Section title="Скругления и тени">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {["rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-4xl", "rounded-full"].map((r) => (
              <div key={r} className="grid gap-2 justify-items-center">
                <div className={`w-16 h-16 bg-surface border border-line ${r}`} />
                <span className="text-xs font-mono text-faint">{r}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {["shadow-xs", "shadow-sm", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl"].map((s) => (
              <div key={s} className="grid gap-2 justify-items-center">
                <div className={`w-16 h-16 bg-surface rounded-2xl ${s}`} />
                <span className="text-xs font-mono text-faint">{s}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Модальное окно">
          <div>
            <Button variant="inverse" onClick={() => setModal(true)}>
              Открыть
            </Button>
          </div>
          <Modal
            open={modal}
            onClose={() => setModal(false)}
            title="Удалить набор «Hverdag»?"
            footer={
              <>
                <Button variant="secondary" onClick={() => setModal(false)}>
                  Отмена
                </Button>
                <Button variant="danger" onClick={() => setModal(false)}>
                  Удалить
                </Button>
              </>
            }
          >
            <Text tone="muted">8 слов и их прогресс будут удалены. Это действие нельзя отменить.</Text>
          </Modal>
        </Section>
      </div>
    </div>
  );
}

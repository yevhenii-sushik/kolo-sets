import { ReactNode } from "react";
import { Heading, Text } from "../../ui";

// Заголовок внутренних страниц «Ещё» (настройки, поддержка, обновления, Dakuta) —
// чтобы страницы не могли разъехаться по виду. Сами страницы — списки из SettingsList.

export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="grid gap-2">
      <Heading size={1}>{title}</Heading>
      {subtitle && <Text tone="muted">{subtitle}</Text>}
    </header>
  );
}

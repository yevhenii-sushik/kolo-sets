// Админ-панель (docs/specs/admin.md): обзор, удержание и поиск пользователя, только просмотр.
// Запрос поиска и вкладка живут в адресе (?u=…, ?tab=retention): ссылку можно переслать, «назад» возвращает
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useIsAdmin } from "../../api/admin";
import { Button, Eyebrow, Heading, Input, cx } from "../../ui";
import { Loading } from "./parts";
import Overview from "./Overview";
import Retention from "./Retention";
import UserView from "./UserView";

const TABS = [
  { id: "overview", label: "Обзор" },
  { id: "retention", label: "Удержание" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function AdminPage() {
  // Свежий токен: если права выдали только что, в закэшированном claim ещё нет
  const admin = useIsAdmin(true);
  const [params, setParams] = useSearchParams();
  const query = params.get("u")?.trim() ?? "";
  const tab: Tab = params.get("tab") === "retention" ? "retention" : "overview";

  if (admin === null) return <Loading />;
  // Обычному пользователю страница не существует; данные всё равно закрыты на сервере
  if (!admin) return <Navigate to="/" replace />;

  const open = (q: string) => setParams(q ? { u: q } : {});

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="grid gap-1">
        <Eyebrow>Kolo · команда</Eyebrow>
        <Heading size={1}>Админ-панель</Heading>
      </div>
      <SearchBar key={query} initial={query} onSearch={open} />
      {query ? (
        <UserView key={query} query={query} onBack={() => open("")} />
      ) : (
        <>
          <Tabs value={tab} onChange={(id) => setParams(id === "overview" ? {} : { tab: id })} />
          {/* Удержание читает каждый профиль окна — грузим, только когда вкладку открыли */}
          {tab === "retention" ? <Retention /> : <Overview onOpen={open} />}
        </>
      )}
    </div>
  );
}

function Tabs({ value, onChange }: { value: Tab; onChange: (id: Tab) => void }) {
  return (
    <div role="tablist" aria-label="Разделы панели" className="flex w-fit gap-1 rounded-full bg-inset p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            value === t.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Input
        aria-label="Email, @имя или uid"
        placeholder="Email, @имя или uid"
        iconLeft={<Search size={18} />}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className="flex-1"
      />
      <Button type="submit" size="lg">
        Найти
      </Button>
    </form>
  );
}

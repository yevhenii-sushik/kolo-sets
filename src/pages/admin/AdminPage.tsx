// Админ-панель (docs/specs/admin.md): обзор и поиск пользователя, только просмотр.
// Запрос поиска живёт в адресе (?u=…): ссылку можно переслать, «назад» возвращает к обзору
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useIsAdmin } from "../../api/admin";
import { Button, Eyebrow, Heading, Input } from "../../ui";
import { Loading } from "./parts";
import Overview from "./Overview";
import UserView from "./UserView";

export default function AdminPage() {
  // Свежий токен: если права выдали только что, в закэшированном claim ещё нет
  const admin = useIsAdmin(true);
  const [params, setParams] = useSearchParams();
  const query = params.get("u")?.trim() ?? "";

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
      {query ? <UserView key={query} query={query} onBack={() => open("")} /> : <Overview onOpen={open} />}
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

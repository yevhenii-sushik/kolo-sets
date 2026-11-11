// Админ-панель (docs/specs/admin.md): права — claim admin в токене, данные — /api/admin-*.
// Скрытая страница — только удобство: доступ проверяет сервер
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { post } from "./http";
import type { AccountLite, AccountsSummary, LearningView, ProfileView, SessionRow } from "../../server/core/admin";

export type { AccountLite, AccountsSummary, LearningView, ProfileView, SessionRow };

export interface AdminOverview {
  accounts: AccountsSummary;
  truncated: boolean;
  profiles: number | null;
  sessions: { total: number | null; last7: number | null }; // null — не посчиталось (нет индекса)
  recent: AccountLite[];
}

export interface AdminUser {
  account: AccountLite & { lastSignInAt: string | null; admin: boolean };
  profile: ProfileView | null;
  learning: LearningView;
  sessions: SessionRow[];
}

export const fetchOverview = () => post<AdminOverview>("/api/admin-overview", {});

export const fetchUser = (query: string) =>
  post<{ found: false } | { found: true; user: AdminUser }>("/api/admin-user", { query });

// null — ещё проверяем. fresh — взять новый токен: после выдачи прав в старом claim ещё нет
export function useIsAdmin(fresh = false): boolean | null {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) {
      setAdmin(false);
      return;
    }
    let alive = true;
    user.getIdTokenResult(fresh).then(
      (r) => alive && setAdmin(r.claims.admin === true),
      () => alive && setAdmin(false),
    );
    return () => {
      alive = false;
    };
  }, [user, fresh]);
  return admin;
}

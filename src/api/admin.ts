// Админ-панель и роли команды (docs/specs/admin.md): роли — claims в токене, данные — /api/admin-*.
// Скрытая страница и значки — только отображение: доступ проверяет сервер
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { post } from "./http";
import { rolesOf, type Roles } from "../../server/core/admin";
import type { AccountLite, AccountsSummary, LearningView, ProfileView, SessionRow } from "../../server/core/admin";

import type { CohortRow, FunnelId, FunnelStep, Metrics, Rate } from "../../server/core/metrics";

export type { AccountLite, AccountsSummary, LearningView, ProfileView, Roles, SessionRow };
export type { CohortRow, FunnelId, FunnelStep, Rate };

export interface AdminOverview {
  accounts: AccountsSummary;
  truncated: boolean;
  profiles: number | null;
  sessions: { total: number | null; last7: number | null }; // null — не посчиталось (нет индекса)
  recent: AccountLite[];
}

export interface AdminUser {
  account: AccountLite & Roles & { lastSignInAt: string | null };
  profile: ProfileView | null;
  learning: LearningView;
  sessions: SessionRow[];
}

// Удержание: excluded — сколько регистраций окна не в счёте (команда, отключённые)
export interface AdminMetrics extends Metrics {
  excluded: { team: number; disabled: number };
  trialsDeleted: number; // пробные аккаунты, удалённые за 30 дней без входа, — за всё время
  unverifiedDeleted: number; // аккаунты на неподтверждённую почту, удалённые так же, — за всё время
  truncated: boolean;
}

export const fetchMetrics = () => post<AdminMetrics>("/api/admin-metrics", {});

export const fetchOverview = () => post<AdminOverview>("/api/admin-overview", {});

export const fetchUser = (query: string) =>
  post<{ found: false } | { found: true; user: AdminUser }>("/api/admin-user", { query });

const NO_ROLES: Roles = { admin: false, staff: false };

// Роли текущего пользователя; null — ещё проверяем.
// fresh — взять новый токен: после выдачи прав в закэшированном claims ещё нет. Без fresh токен
// обновляется сам раз в час, поэтому новый значок в профиле появляется не сразу
export function useRoles(fresh = false): Roles | null {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Roles | null>(null);
  useEffect(() => {
    if (!user) {
      setRoles(NO_ROLES);
      return;
    }
    let alive = true;
    user.getIdTokenResult(fresh).then(
      (r) => alive && setRoles(rolesOf(r.claims)),
      () => alive && setRoles(NO_ROLES),
    );
    return () => {
      alive = false;
    };
  }, [user, fresh]);
  return roles;
}

export function useIsAdmin(fresh = false): boolean | null {
  const roles = useRoles(fresh);
  return roles && roles.admin;
}

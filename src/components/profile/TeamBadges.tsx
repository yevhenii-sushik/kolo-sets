// Значки команды в шапке профиля: «Команда Dakuta» и «Админ» (docs/specs/admin.md).
// Роли — из собственного токена, поэтому значки видит только сам человек: публичных профилей пока нет.
// Размер — как у титула (TitleBadge), чтобы стоять с ним в одной строке
import { ShieldCheck } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { useRoles } from "../../api/admin";
import { DakutaLogo } from "../brand/DakutaLogo";
import { cx } from "../../ui";

const PILL = "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold";

export function TeamBadges() {
  const { t } = useI18n();
  const roles = useRoles();
  if (!roles?.staff) return null;
  const team = t.profile.team;
  return (
    <>
      {/* Инверсная плашка — официальная отметка, не путается с титулами из капсул */}
      <span className={cx(PILL, "bg-fg text-on-inverse")} title={team.staffHint}>
        <DakutaLogo size={14} />
        {team.staff}
      </span>
      {roles.admin && (
        <span className={cx(PILL, "bg-info-soft text-info")} title={team.adminHint}>
          <ShieldCheck size={14} aria-hidden />
          {team.admin}
        </span>
      )}
    </>
  );
}

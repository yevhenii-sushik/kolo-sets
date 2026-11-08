import { NavLink } from "react-router-dom";
import { navItems } from "../../navigation";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { cx } from "../../ui";

// Нижняя навигация на телефоне
export default function BottomNav() {
  const { t } = useI18n();
  // Неоткрытые капсулы — точка на «Профиле»
  const { loot } = useData();

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 flex h-24 items-center justify-around border-t border-line bg-bg/90 px-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-lg">
      {navItems.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cx("flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors", isActive ? "text-accent-ink" : "text-muted")
          }
        >
          {({ isActive }) => (
            <>
              <span className={cx("relative rounded-xl px-3 py-1.5 transition-colors", isActive && "bg-accent-soft")}>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {to === "/profile" && loot.capsules > 0 && (
                  <span aria-hidden className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" />
                )}
              </span>
              <span className={cx("text-xs leading-none", isActive ? "font-semibold" : "font-medium")}>{t.nav[labelKey]}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

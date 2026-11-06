import { NavLink } from 'react-router-dom';
import { navItems } from '../../navigation';
import { useI18n } from '../../contexts/I18nContext';
import { cx } from '../../ui';

// Боковое меню на широких экранах: свёрнутое — только иконки
export default function Sidebar({ open }: { open: boolean }) {
  const { t } = useI18n();

  return (
    <>
      {/* Прослойка, чтобы контент не уходил под фиксированное меню */}
      <div className={cx('hidden md:block shrink-0 transition-[width] duration-300', open ? 'w-50' : 'w-20')} />

      <aside
        className={cx(
          'hidden md:flex flex-col fixed top-16 left-0 h-[calc(100dvh-64px)] z-40 transition-[width] duration-300',
          open ? 'w-45' : 'w-18',
        )}
      >
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, labelKey, icon: Icon }) => {
            const label = t.nav[labelKey];
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                title={open ? undefined : label}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3.5 rounded-2xl px-3 py-2.5 text-sm transition-colors',
                    isActive ? 'bg-accent-soft font-semibold text-accent-ink' : 'font-medium text-muted hover:bg-inset hover:text-fg',
                  )
                }
              >
                <Icon size={22} className="shrink-0" />
                {/* Подпись плавно исчезает, когда меню свёрнуто */}
                <span
                  className={cx(
                    'whitespace-nowrap overflow-hidden transition-all duration-300',
                    open ? 'opacity-100 w-auto' : 'opacity-0 w-0',
                  )}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

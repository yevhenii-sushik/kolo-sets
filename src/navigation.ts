// import { Home, Layers, User, Shapes, BookOpen, BookMarked } from 'lucide-react';
import { Home, Layers, User, Shapes, type LucideIcon } from 'lucide-react';
import type { Translations } from './locales';

// Разделы приложения в боковом меню и нижней навигации; labelKey — ключ подписи в t.nav
export const navItems: { to: string; labelKey: keyof Translations['nav']; icon: LucideIcon }[] = [
  { to: '/', labelKey: 'home', icon: Home },
  { to: '/words', labelKey: 'words', icon: Layers },
  // { to: '/stories', labelKey: 'stories', icon: BookOpen },
  // { to: '/dictionary', labelKey: 'dictionary', icon: BookMarked },
  { to: '/profile', labelKey: 'profile', icon: User },
  { to: '/other', labelKey: 'other', icon: Shapes },
];
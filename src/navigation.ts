// navigation.ts
import { Home, HelpCircle, User } from 'lucide-react';

export const navItems = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/about', labelKey: 'nav.about', icon: HelpCircle },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
];
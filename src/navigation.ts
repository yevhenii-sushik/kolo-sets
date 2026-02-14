// navigation.ts
import { Home, BookOpen, Edit3, HelpCircle, User } from 'lucide-react';

export const navItems = [
  { to: '/', label: 'Home', icon: Home },
  // { to: '/collections', label: 'Sets', icon: BookOpen },
  // { to: '/create', label: 'Create', icon: Edit3 },
  { to: '/about', label: 'About', icon: HelpCircle },
  { to: '/profile', label: 'Profile', icon: User },
];
// import { Home, Layers, User, Shapes, BookOpen, BookMarked } from 'lucide-react';
import { Home, Layers, User, Shapes } from 'lucide-react';

export const navItems = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/words', labelKey: 'nav.words', icon: Layers },
  // { to: '/stories', labelKey: 'nav.stories', icon: BookOpen },
  // { to: '/dictionary', labelKey: 'nav.dictionary', icon: BookMarked },
  { to: '/profile', labelKey: 'nav.profile', icon: User },
  { to: '/other', labelKey: 'nav.other', icon: Shapes },
];
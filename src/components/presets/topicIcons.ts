import {
  Bike,
  Briefcase,
  Bus,
  CalendarDays,
  CloudSun,
  Hand,
  Hash,
  HeartPulse,
  House,
  MessageCircleQuestion,
  Palette,
  Shirt,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Значки тем готовых наборов — общие для всех курсов (темы — presets/levels.ts). Отдельным файлом:
// ими пользуются и вкладка «Наборы Kolo», и сценарий «Первый набор» на главной
const TOPIC_ICONS: Record<string, LucideIcon> = {
  greetings: Hand,
  numbers: Hash,
  time: CalendarDays,
  people: Users,
  food: UtensilsCrossed,
  home: House,
  city: Bus,
  shopping: ShoppingCart,
  health: HeartPulse,
  clothes: Shirt,
  weather: CloudSun,
  work: Briefcase,
  leisure: Bike,
  verbs: Zap,
  adjectives: Palette,
  "small-words": MessageCircleQuestion,
};

export const topicIcon = (topic: string): LucideIcon => TOPIC_ICONS[topic] ?? Hash;

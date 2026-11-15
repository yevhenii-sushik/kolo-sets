// Загрузчики страниц: каждая — в отдельном чанке. Собраны здесь, чтобы App.tsx строил из них
// lazy-компоненты, а приложение могло подгрузить нужные заранее (prefetchAppPages)
export const pages = {
  landing: () => import("./auth/LandingPage"),
  login: () => import("./auth/LoginPage"),
  register: () => import("./auth/RegisterPage"),
  forgotPassword: () => import("./auth/ForgotPasswordPage"),
  home: () => import("./home/HomePage"),
  legalLayout: () => import("./legal/LegalLayout"),
  legalDocument: () => import("./legal/LegalDocumentPage"),
  guideLayout: () => import("./guide/GuideLayout"),
  guide: () => import("./guide/GuidePage"),
  notFound: () => import("./error/NotFoundPage"),
  words: () => import("./words/WordsPage"),
  collectionEdit: () => import("./words/CollectionEditPage"),
  flashcards: () => import("./words/FlashcardsPage"),
  perigee: () => import("./learn/PerigeeSessionPage"),
  quiz: () => import("./words/QuizPage"),
  speed: () => import("./games/SpeedRoundPage"),
  profile: () => import("./profile/ProfilePage"),
  rewards: () => import("./rewards/RewardsPage"),
  other: () => import("./other/OtherPage"),
  settings: () => import("./other/SettingsPage"),
  updates: () => import("./other/UpdatesPage"),
  support: () => import("./other/SupportPage"),
  explore: () => import("./other/ExplorePage"),
  start: () => import("./courses/StartPage"),
  courses: () => import("./courses/CoursesPage"),
  addCourse: () => import("./courses/AddCoursePage"),
  // Админ-панель — отдельный чанк, обычные пользователи его не загружают (docs/specs/admin.md)
  admin: () => import("./admin/AdminPage"),
};

// Что открывают чаще всего: вкладки, сессия Perigee, карточки и редактор набора.
// Остальное (настройки, квиз, документы) грузится по первому переходу
const PREFETCH: (keyof typeof pages)[] = ["home", "words", "perigee", "profile", "rewards", "other", "flashcards", "collectionEdit"];

let prefetched = false;

// Подгружаем код в фоне, когда браузер свободен: первый переход на вкладку — без ожидания.
// Не трогаем, если пользователь включил экономию трафика
export function prefetchAppPages() {
  if (prefetched || typeof window === "undefined") return;
  prefetched = true;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  const run = () => PREFETCH.forEach((key) => pages[key]().catch(() => {}));
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}

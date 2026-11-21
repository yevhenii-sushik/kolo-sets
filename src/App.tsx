import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider, useI18n } from "./contexts/I18nContext";
import { DataProvider, useData } from "./contexts/DataContext";
import { Collection } from "./types";
import ErrorBoundary from "./components/ErrorBoundary";
import { isDueCard } from "./utils/storage";
import { getReminderSettings, scheduleReminder, cancelReminder, registerDueCountGetter, registerReminderText } from "./utils/notifications";
import { plural } from "./utils/plural";
import { getLanguageInfo } from "./locales/languages";
import { applyPendingUpdate } from "./utils/registerServiceWorker";

import AchievementUnlockBanner from "./components/AchievementUnlockBanner";
import { ProgressMomentsHost } from "./components/progress/ProgressMoments";
import CookieConsentBanner from "./components/legal/CookieConsentBanner";

// Layouts (небольшие — грузим сразу)
import MainLayout from "./pages/layouts/MainLayout";
import EmptyLayout from "./pages/layouts/EmptyLayout";
import NavLayout from "./pages/layouts/NavLayout";
import { pages } from "./pages/lazyPages";
import AppSplash from "./components/AppSplash";

// Pages (lazy — каждая в отдельном чанке; загрузчики — в pages/lazyPages.ts, оттуда же фоновая подгрузка)
const LandingPage = lazy(pages.landing);
const LoginPage = lazy(pages.login);
const RegisterPage = lazy(pages.register);
const ForgotPasswordPage = lazy(pages.forgotPassword);
const HomePage = lazy(pages.home);
// Public legal & support pages
const LegalLayout = lazy(pages.legalLayout);
const LegalDocumentPage = lazy(pages.legalDocument);
const GuideLayout = lazy(pages.guideLayout);
const GuidePage = lazy(pages.guide);
// Витрина дизайн-системы — только в режиме разработки, в продакшен-сборку не попадает
const DesignPage = import.meta.env.DEV ? lazy(() => import("./pages/design/DesignPage")) : null;
const NotFoundPage = lazy(pages.notFound);
const WordsPage = lazy(pages.words);
const CollectionEditPage = lazy(pages.collectionEdit);
const FlashcardsPage = lazy(pages.flashcards);
const PerigeeSessionPage = lazy(pages.perigee);
const QuizPage = lazy(pages.quiz);
const BlitzPage = lazy(pages.speed);
const ProfilePage = lazy(pages.profile);
const RewardsPage = lazy(pages.rewards);
const OtherPage = lazy(pages.other);
const SettingsPage = lazy(pages.settings);
const UpdatesPage = lazy(pages.updates);
const SupportPage = lazy(pages.support);
const ExplorePage = lazy(pages.explore);
const StartPage = lazy(pages.start);
const CoursesPage = lazy(pages.courses);
const AddCoursePage = lazy(pages.addCourse);
const AdminPage = lazy(pages.admin);

// Ссылка на убранный режим набора → похожий режим того же набора
function SetRedirect({ to }: { to: "speed" | "learn" }) {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={to === "learn" ? `/learn?set=${id}` : `/collection/${id}/${to}`} replace />;
}

function ReminderScheduler() {
  // Напоминание считает карточки всех курсов
  const { allCollections: collections } = useData();
  // Ref, чтобы не пересоздавать таймер на каждое изменение коллекций:
  // dueCount вычисляется в момент срабатывания из актуального снапшота
  const collectionsRef = useRef<Collection[]>(collections);
  collectionsRef.current = collections;
  // Текст — на текущем языке интерфейса, тоже через ref
  const { t, language } = useI18n();
  const notify = t.settings.reminder.notify;
  const locale = getLanguageInfo(language).htmlLang;
  const textRef = useRef((due: number) => (due > 0 ? plural(locale, due, notify.due) : notify.idle));
  textRef.current = (due: number) => (due > 0 ? plural(locale, due, notify.due) : notify.idle);

  useEffect(() => {
    registerDueCountGetter(() =>
      collectionsRef.current.reduce((n, col) => n + col.cards.filter(isDueCard).length, 0)
    );
    registerReminderText((due) => textRef.current(due));
    scheduleReminder(getReminderSettings());
    return cancelReminder;
  }, []);
  return null;
}

// Защищенный маршрут: ждём ответа Firebase (заставка видна, только если дольше 400 мс)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <AppSplash />;
  // Если юзера нет, отправляем на лендинг
  return user ? <>{children}</> : <Navigate to="/welcome" replace />;
}

// Публичный маршрут (лендинг, вход, регистрация). Новый посетитель видит страницу сразу, не дожидаясь
// Firebase; если на устройстве уже входили — ждём, чтобы не мигнуть лендингом перед приложением
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, expectUser } = useAuth();
  if (loading && expectUser) return <AppSplash />;
  // Если юзер уже залогинен, отправляем его в приложение
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

// Новая версия, которая уже скачалась, подменяется при переходе между экранами (utils/registerServiceWorker.ts)
function UpdateOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => applyPendingUpdate(pathname), [pathname]);
  return null;
}

function AppContent() {
  return (
    <ErrorBoundary>
    <UpdateOnNavigate />
    <ReminderScheduler />
    <AchievementUnlockBanner />
    <ProgressMomentsHost />
    <CookieConsentBanner />
    {/* Граница для страниц без своего макета (вход, лендинг, выбор языка) и для ленивых макетов.
        У MainLayout, EmptyLayout и NavLayout — свои границы: шапка и меню не пропадают, пока грузится страница */}
    <Suspense fallback={<AppSplash />}>
    <Routes>
      {/* 1. Группа публичных маршрутов */}
      <Route
        path="/welcome"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* Первый вход: выбор языка — без шапки и меню (docs/specs/01-courses.md) */}
      <Route
        path="/start"
        element={
          <ProtectedRoute>
            <StartPage />
          </ProtectedRoute>
        }
      />

      {/* 2. Основное приложение (с Хедером/Футером) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/other" element={<OtherPage />} />
      </Route>

      {/* 3. Игровые/Редакторские режимы */}
      <Route
        element={
          <ProtectedRoute>
            <EmptyLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/collection/:id/flashcards" element={<FlashcardsPage />} />
        <Route path="/collection/:id/quiz" element={<QuizPage />} />
        <Route path="/collection/:id/speed" element={<BlitzPage />} />
        {/* Убранные режимы (docs/specs/perigee.md, «Режимы после чистки»): старые ссылки и ярлыки ведут в похожий */}
        <Route path="/collection/:id/survival" element={<SetRedirect to="speed" />} />
        <Route path="/collection/:id/match" element={<SetRedirect to="learn" />} />
        <Route path="/review" element={<Navigate to="/learn" replace />} />
        <Route path="/learn" element={<PerigeeSessionPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <NavLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/collection/:id/edit" element={<CollectionEditPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/new" element={<AddCoursePage />} />

        <Route path="/other/settings" element={<SettingsPage />} />
        <Route path="/other/updates" element={<UpdatesPage />} />
        {/* «Данные и аккаунт» переехали в настройки; старый адрес — из прежних версий документов */}
        <Route path="/other/data-management" element={<Navigate to="/other/settings" replace />} />
        <Route path="/other/support" element={<SupportPage />} />
        <Route path="/other/explore" element={<ExplorePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* 4. Публичные правовые страницы — доступны всем без авторизации */}
      <Route element={<LegalLayout />}>
        <Route path="/privacy" element={<LegalDocumentPage doc="privacy" />} />
        <Route path="/terms" element={<LegalDocumentPage doc="terms" />} />
        <Route path="/cookies" element={<LegalDocumentPage doc="cookies" />} />
        <Route path="/refund" element={<LegalDocumentPage doc="refund" />} />
      </Route>

      {/* 5. Страницы «О Kolo» из подвала сайта: как это работает, режимы, движок Perigee */}
      <Route element={<GuideLayout />}>
        <Route path="/how-it-works" element={<GuidePage page="how" />} />
        <Route path="/modes" element={<GuidePage page="modes" />} />
        <Route path="/perigee" element={<GuidePage page="perigee" />} />
      </Route>

      {DesignPage && <Route path="/design" element={<DesignPage />} />}

      {/* Неизвестный адрес — своя страница 404 вместо молчаливого перехода на главную */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    // v7_startTransition: переход — в startTransition, и пока грузится код новой страницы,
    // на экране остаётся прежняя, а не пустое место (src/design/README.md → «Загрузка»)
    <BrowserRouter future={{ v7_startTransition: true }}>
      <I18nProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;

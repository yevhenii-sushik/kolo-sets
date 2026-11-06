import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { DataProvider, useData } from "./contexts/DataContext";
import { Collection } from "./types";
import ErrorBoundary from "./components/ErrorBoundary";
import { isDueCard } from "./utils/storage";
import { getReminderSettings, scheduleReminder, cancelReminder, registerDueCountGetter } from "./utils/notifications";

import AchievementUnlockBanner from "./components/AchievementUnlockBanner";
import { StreakCelebrationHost } from "./components/StreakCelebration";
import CookieConsentBanner from "./components/legal/CookieConsentBanner";

// Layouts (небольшие — грузим сразу)
import MainLayout from "./pages/layouts/MainLayout";
import EmptyLayout from "./pages/layouts/EmptyLayout";
import NavLayout from "./pages/layouts/NavLayout";

// Pages (lazy — каждая в отдельном чанке)
const LandingPage = lazy(() => import("./pages/auth/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const HomePage = lazy(() => import("./pages/home/HomePage"));
// Public legal & support pages
const LegalLayout = lazy(() => import("./pages/legal/LegalLayout"));
const LegalDocumentPage = lazy(() => import("./pages/legal/LegalDocumentPage"));
// Витрина дизайн-системы — только в режиме разработки, в продакшен-сборку не попадает
const DesignPage = import.meta.env.DEV ? lazy(() => import("./pages/design/DesignPage")) : null;
const NotFoundPage = lazy(() => import("./pages/error/NotFoundPage"));
const WordsPage = lazy(() => import("./pages/words/WordsPage"));
const CollectionEditPage = lazy(() => import("./pages/words/CollectionEditPage"));
const FlashcardsPage = lazy(() => import("./pages/words/FlashcardsPage"));
const ReviewPage = lazy(() => import("./pages/words/ReviewPage"));
const QuizPage = lazy(() => import("./pages/words/QuizPage"));
const SpeedRoundPage = lazy(() => import("./pages/games/SpeedRoundPage"));
const SurvivalPage = lazy(() => import("./pages/games/SurvivalPage"));
const MatchPage = lazy(() => import("./pages/games/MatchPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const OtherPage = lazy(() => import("./pages/other/OtherPage"));
const SettingsPage = lazy(() => import("./pages/other/SettingsPage"));
const UpdatesPage = lazy(() => import("./pages/other/UpdatesPage"));
const DataManagementPage = lazy(() => import("./pages/other/DataManagementPage"));
const SupportPage = lazy(() => import("./pages/other/SupportPage"));
const ExplorePage = lazy(() => import("./pages/other/ExplorePage"));
const StartPage = lazy(() => import("./pages/courses/StartPage"));
const CoursesPage = lazy(() => import("./pages/courses/CoursesPage"));
const AddCoursePage = lazy(() => import("./pages/courses/AddCoursePage"));

function ReminderScheduler() {
  // Напоминание считает карточки всех курсов
  const { allCollections: collections } = useData();
  // Ref, чтобы не пересоздавать таймер на каждое изменение коллекций:
  // dueCount вычисляется в момент срабатывания из актуального снапшота
  const collectionsRef = useRef<Collection[]>(collections);
  collectionsRef.current = collections;

  useEffect(() => {
    registerDueCountGetter(() =>
      collectionsRef.current.reduce((n, col) => n + col.cards.filter(isDueCard).length, 0)
    );
    scheduleReminder(getReminderSettings());
    return cancelReminder;
  }, []);
  return null;
}

// Защищенный маршрут
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Если юзера нет, отправляем на лендинг
  return user ? <>{children}</> : <Navigate to="/welcome" replace />;
}

// Публичный маршрут
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Если юзер уже залогинен, отправляем его в приложение
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppContent() {
  return (
    <ErrorBoundary>
    <ReminderScheduler />
    <Suspense fallback={null}>
    <AchievementUnlockBanner />
    <StreakCelebrationHost />
    <CookieConsentBanner />
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
        <Route path="/collection/:id/speed" element={<SpeedRoundPage />} />
        <Route path="/collection/:id/survival" element={<SurvivalPage />} />
        <Route path="/collection/:id/match" element={<MatchPage />} />
        <Route path="/review" element={<ReviewPage />} />
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
        <Route path="/other/data-management" element={<DataManagementPage />} />
        <Route path="/other/support" element={<SupportPage />} />
        <Route path="/other/explore" element={<ExplorePage />} />
      </Route>

      {/* 4. Публичные правовые страницы — доступны всем без авторизации */}
      <Route element={<LegalLayout />}>
        <Route path="/privacy" element={<LegalDocumentPage doc="privacy" />} />
        <Route path="/terms" element={<LegalDocumentPage doc="terms" />} />
        <Route path="/cookies" element={<LegalDocumentPage doc="cookies" />} />
        <Route path="/refund" element={<LegalDocumentPage doc="refund" />} />
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
    <BrowserRouter>
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

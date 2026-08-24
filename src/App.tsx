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
const PrivacyPagePublic = lazy(() => import("./pages/legal/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/legal/TermsPage"));
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

function ReminderScheduler() {
  const { collections } = useData();
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

        <Route path="/other/settings" element={<SettingsPage />} />
        <Route path="/other/updates" element={<UpdatesPage />} />
        <Route path="/other/data-management" element={<DataManagementPage />} />
        <Route path="/other/support" element={<SupportPage />} />
        <Route path="/other/explore" element={<ExplorePage />} />
      </Route>

      {/* 4. Публичные правовые страницы — доступны всем без авторизации */}
      <Route element={<LegalLayout />}>
        <Route path="/privacy" element={<PrivacyPagePublic />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Редирект для любых неопознанных путей */}
      <Route path="*" element={<Navigate to="/" replace />} />
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

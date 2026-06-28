import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { DataProvider } from "./contexts/DataContext";

import AchievementUnlockBanner from "./components/AchievementUnlockBanner";

// Layouts (небольшие — грузим сразу)
import MainLayout from "./pages/layouts/MainLayout";
import EmptyLayout from "./pages/layouts/EmptyLayout";
import NavLayout from "./pages/layouts/NavLayout";

// Pages (lazy — каждая в отдельном чанке)
const LandingPage = lazy(() => import("./pages/auth/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const HomePage = lazy(() => import("./pages/home/HomePage"));
const WordsPage = lazy(() => import("./pages/words/WordsPage"));
const CollectionEditPage = lazy(() => import("./pages/words/CollectionEditPage"));
const FlashcardsPage = lazy(() => import("./pages/words/FlashcardsPage"));
const QuizPage = lazy(() => import("./pages/words/QuizPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const OtherPage = lazy(() => import("./pages/other/OtherPage"));
const SettingsPage = lazy(() => import("./pages/other/SettingsPage"));
const UpdatesPage = lazy(() => import("./pages/other/UpdatesPage"));
const PrivacyPage = lazy(() => import("./pages/other/PrivacyPage"));
const SystemInfoPage = lazy(() => import("./pages/other/SystemInfoPage"));
const DataManagementPage = lazy(() => import("./pages/other/DataManagementPage"));
const SupportPage = lazy(() => import("./pages/other/SupportPage"));

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
    <Suspense fallback={null}>
    <AchievementUnlockBanner />
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
        <Route path="/other/privacy" element={<PrivacyPage />} />
        <Route path="/other/system-info" element={<SystemInfoPage />} />
        <Route path="/other/data-management" element={<DataManagementPage />} />
        <Route path="/other/support" element={<SupportPage />} />
      </Route>

      {/* Редирект для любых неопознанных путей */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
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

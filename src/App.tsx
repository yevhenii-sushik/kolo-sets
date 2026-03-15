import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getTheme, setTheme } from "./utils/storage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";

// Layouts
import MainLayout from "./pages/layouts/MainLayout";
import EmptyLayout from "./pages/layouts/EmptyLayout";
import NavLayout from "./pages/layouts/NavLayout";

// Pages
import LandingPage from "./pages/auth/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/home/HomePage";
import WordsPage from "./pages/words/WordsPage";
import CollectionEditPage from "./pages/words/CollectionEditPage";
import FlashcardsPage from "./pages/words/FlashcardsPage";
import QuizPage from "./pages/words/QuizPage";
import ProfilePage from "./pages/profile/ProfilePage";
import OtherPage from "./pages/other/OtherPage";
import SettingsPage from "./pages/other/SettingsPage";
import UpdatesPage from "./pages/other/UpdatesPage";
import PrivacyPage from "./pages/other/PrivacyPage";
import SystemInfoPage from "./pages/other/SystemInfoPage";
import DataManagementPage from "./pages/other/DataManagementPage";
import SupportPage from "./pages/other/SupportPage";
import CollectionTyPage from "./pages/CollectionTyPage";
import SixSevenPage from "./pages/secret/SixSevenPage";

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
  const [theme] = useState<"light" | "dark">(getTheme());

  useEffect(() => {
    setTheme(theme);

    // Принудительно обновляем класс на body для Tailwind dark mode

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
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
        
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/system-info" element={<SystemInfoPage />} />
        <Route path="/data-management" element={<DataManagementPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/tytyty" element={<CollectionTyPage />} />
        <Route path="/67" element={<SixSevenPage />} />
      </Route>

      {/* Редирект для любых неопознанных путей */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;

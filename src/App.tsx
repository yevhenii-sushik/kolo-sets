import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getTheme, setTheme } from './utils/storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';

// Layouts
import MainLayout from './pages/MainLayout';
import EmptyLayout from './pages/EmptyLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CollectionEditPage from './pages/CollectionEditPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import OtherPage from './pages/OtherPage';
import UpdatesPage from './pages/UpdatesPage';
import PrivacyPage from './pages/PrivacyPage';
import SystemInfoPage from './pages/SystemInfoPage';
import DataManagementPage from './pages/DataManagementPage';
import SupportPage from './pages/SupportPage';


/**
 * Защищенный маршрут — только для авторизованных
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Если юзера нет, отправляем на лендинг (или логин)
  return user ? <>{children}</> : <Navigate to="/welcome" replace />;
}

/**
 * Публичный маршрут — только для гостей (логин/регистрация/приветствие)
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Если юзер уже залогинен, отправляем его в приложение
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppContent() {
  const [theme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
    // Принудительно обновляем класс на body для Tailwind dark mode
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Routes>
      {/* 1. Группа публичных маршрутов (доступны без входа) */}
      <Route path="/welcome" element={
        <PublicRoute>
          <LandingPage />
        </PublicRoute>
      } />
      
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* 2. Основное приложение (с Хедером/Футером) */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/other" element={<OtherPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/system-info" element={<SystemInfoPage />} />
        <Route path="/data-management" element={<DataManagementPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>

      {/* 3. Игровые/Редакторские режимы (Чистый экран без лишнего) */}
      <Route element={
        <ProtectedRoute>
          <EmptyLayout />
        </ProtectedRoute>
      }>
        <Route path="/collection/:id/edit" element={<CollectionEditPage />} />
        <Route path="/collection/:id/flashcards" element={<FlashcardsPage />} />
        <Route path="/collection/:id/quiz" element={<QuizPage />} />
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
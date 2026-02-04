import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { getTheme, setTheme } from './utils/storage';
import HomePage from './pages/HomePage';
import BetaNdaModal from './components/BetaNdaModal';
import CollectionEditPage from './pages/CollectionEditPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import AboutPage from './pages/AboutPage';
import './index.css';

function App() {
  // const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme());
  const [theme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  // const toggleTheme = () => {
  //   setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  // };

  return (
    <BrowserRouter>
      <BetaNdaModal />
      <div className="min-h-screen">
        {/* Шапка приложения */}

        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center align-middle">
              <Link to="/">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex justify-between items-center align-middle">
                  <img src="/icon.svg" alt="logo" className="ml-2 inline-block w-10 h-10" />
                  <div className="ml-2 inline-block w-1"></div>
                  Kolo
                </h1>
              </Link>
              <span className="version-badge badge-beta">beta-test</span>
              {/* Переключатель темы */}
              {/* <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button> */}
            </div>
          </div>
        </header>

        {/* Основной контент */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/collection/:id/edit" element={<CollectionEditPage />} />
            <Route path="/collection/:id/flashcards" element={<FlashcardsPage />} />
            <Route path="/collection/:id/quiz" element={<QuizPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>

        {/* Футер */}
        <footer className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="footer">
            <Link to="/about">
              <p>Kolo — Versjon 0.1.0-alpha (beta-test)</p>
            </Link>
            <p>© 2026 Euphoria Software</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

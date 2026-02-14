import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getTheme, setTheme } from './utils/storage';

import MainLayout from './pages/MainLayout';
import EmptyLayout from './pages/EmptyLayout';

import HomePage from './pages/HomePage';
import CollectionEditPage from './pages/CollectionEditPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [theme] = useState<'light' | 'dark'>(getTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Страницы с хедером и футером */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Страницы БЕЗ хедера и футера */}
        <Route element={<EmptyLayout />}>
          <Route path="/collection/:id/edit" element={<CollectionEditPage />} />
          <Route path="/collection/:id/flashcards" element={<FlashcardsPage />} />
          <Route path="/collection/:id/quiz" element={<QuizPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
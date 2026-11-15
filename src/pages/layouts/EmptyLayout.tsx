import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import SessionLoading from '../../components/session/SessionLoading';

export default function EmptyLayout() {
  return (
    <div className="min-h-dvh max-h-dvh overflow-y-auto my-auto mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-3 sm:py-4">
      <main className="min-h-0">
        {/* Своя граница: пока грузится код режима — экран загрузки тренировки, а не пустота */}
        <Suspense fallback={<SessionLoading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
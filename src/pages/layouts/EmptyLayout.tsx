import { Outlet } from 'react-router-dom';

export default function EmptyLayout() {
  return (
    <div className="min-h-screen max-h-screen overflow-y-auto my-auto mx-auto max-w-7xl px-4 sm:px-5 lg:px-8 py-3 sm:py-4">
      <main className="min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
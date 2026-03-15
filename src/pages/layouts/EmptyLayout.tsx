import { Outlet } from 'react-router-dom';

export default function EmptyLayout() {
  return (
    <div className="min-h-screen my-auto mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-4">
      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
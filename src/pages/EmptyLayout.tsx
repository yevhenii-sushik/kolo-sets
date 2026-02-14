import { Outlet } from 'react-router-dom';

export default function EmptyLayout() {
  return (
    <div className="min-h-screen my-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
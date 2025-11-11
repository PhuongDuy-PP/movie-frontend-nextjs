'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { FiUsers, FiFilm, FiCalendar, FiLogOut, FiSettings, FiHome } from 'react-icons/fi';
import UsersManagement from '@/components/admin/UsersManagement';
import MoviesManagement from '@/components/admin/MoviesManagement';
import SchedulesManagement from '@/components/admin/SchedulesManagement';

type TabType = 'users' | 'movies' | 'schedules';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, logout, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Initialize auth state on mount (client-side only)
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  // Only redirect after hydration is complete
  useEffect(() => {
    if (!isHydrated) {
      return; // Wait for hydration
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, isHydrated, router]);

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated or not admin (redirecting)
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-gray-200 z-30">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center">
              <FiSettings className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">CGV Cinemas</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            <FiHome className="text-lg" />
            <span className="font-semibold">Trang chủ</span>
          </button>

          <div className="pt-4">
            <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quản lý</p>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiUsers className="text-lg" />
              <span className="font-semibold">Người dùng</span>
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-2 ${
                activeTab === 'movies'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiFilm className="text-lg" />
              <span className="font-semibold">Phim</span>
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-2 ${
                activeTab === 'schedules'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiCalendar className="text-lg" />
              <span className="font-semibold">Lịch chiếu</span>
            </button>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="mb-4 px-4">
            <p className="text-sm font-bold text-gray-900">{user?.fullName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <FiLogOut className="text-lg" />
            <span className="font-semibold">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'movies' && <MoviesManagement />}
          {activeTab === 'schedules' && <SchedulesManagement />}
        </div>
      </div>
    </div>
  );
}


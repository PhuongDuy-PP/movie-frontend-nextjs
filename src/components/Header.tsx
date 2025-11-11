'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { FiSearch, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/', label: 'Trang chủ' },
    { href: '/movies', label: 'Phim' },
    { href: '/cinemas', label: 'Rạp chiếu' },
    { href: '/schedules', label: 'Lịch chiếu' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-800/50' 
          : 'bg-gray-900/90 backdrop-blur-lg border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group relative">
            <div className="relative flex items-center space-x-3">
              {/* Logo Icon */}
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] via-[#FF8C42] to-[#FF6B35] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30 group-hover:shadow-[#FF6B35]/50 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <span className="text-white font-black text-xl">C</span>
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              {/* Logo Text */}
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white leading-none">
                  CGV
                </span>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  Cinemas
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 bg-gray-800/60 backdrop-blur-sm rounded-full px-2 py-1.5 border border-gray-700/50">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-md shadow-[#FF6B35]/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/60'
                  }`}
                  style={{
                    animation: `fadeInDown 0.5s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <span className="relative z-10 flex items-center space-x-1.5">
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    )}
                  </span>
                  {/* Ripple effect on hover */}
                  {!isActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF8C42]/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search and User */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/20 to-[#FF8C42]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <FiSearch className="absolute left-4 text-gray-400 text-lg group-focus-within:text-[#FF6B35] transition-colors duration-300 z-10" />
                <input
                  type="text"
                  placeholder="Tìm phim, diễn viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-5 py-2.5 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder-gray-400 w-64 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35] transition-all duration-300 hover:border-gray-600 hover:bg-gray-800/80"
                />
              </div>
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 transform hover:scale-105">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] rounded-lg flex items-center justify-center shadow-md shadow-[#FF6B35]/30 group-hover:shadow-[#FF6B35]/50 transition-shadow duration-300">
                    <FiUser className="text-sm text-white" />
                  </div>
                  <span className="font-medium text-sm text-white hidden lg:block">{user?.fullName}</span>
                </button>
                <div className="absolute right-0 mt-3 w-64 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                  <div className="p-2">
                    <div className="px-4 py-3 border-b border-gray-700/50 mb-2">
                      <p className="font-semibold text-sm text-white">{user?.fullName}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-white"
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-white"
                    >
                      Vé của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 text-gray-300 hover:text-white"
                      >
                        Quản trị
                      </Link>
                    )}
                    <div className="border-t border-gray-700/50 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-red-500/20 rounded-xl flex items-center space-x-2 transition-all duration-200 text-red-400 hover:text-red-300"
                    >
                      <FiLogOut />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 font-medium text-sm text-gray-300 hover:text-white transform hover:scale-105"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all duration-300 font-medium text-sm shadow-lg shadow-[#FF6B35]/30 hover:shadow-xl hover:shadow-[#FF6B35]/40 transform hover:scale-105"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2.5 rounded-xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 transform hover:scale-105"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <FiX className="text-xl text-white transform transition-transform duration-300" />
            ) : (
              <FiMenu className="text-xl text-white transform transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4 border-t border-gray-700/50 mt-2">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <span className="flex items-center">
                      {item.label}
                      {isActive && (
                        <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      )}
                    </span>
                  </Link>
                );
              })}
              <div className="border-t border-gray-700/50 my-2"></div>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Thông tin cá nhân
                  </Link>
                  <Link
                    href="/bookings"
                    className="px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Vé của tôi
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all duration-300"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800/50 hover:text-white transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] rounded-xl hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all duration-300 text-center text-white font-medium shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}


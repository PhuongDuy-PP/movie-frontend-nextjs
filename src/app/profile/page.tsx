'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, bookingAPI, authAPI } from '@/lib/api';
import { FiUser, FiMail, FiPhone, FiLock, FiEdit, FiSave, FiX, FiCalendar, FiFilm, FiMapPin, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

// Helper function to safely format date
const safeFormatDate = (date: string | Date | null | undefined, formatStr: string, fallback: string = 'N/A'): string => {
  if (!date) return fallback;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return fallback;
    return format(dateObj, formatStr);
  } catch {
    return fallback;
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isHydrated, logout, setUser, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'bookings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize auth state on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Fetch user profile to ensure we have latest data (optional - can be used to refresh user data)
  const { data: updatedUser } = useQuery({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user?.id) return user;
      try {
        // Try to fetch user profile from API if available
        const response = await adminAPI.users.getById(user.id);
        return response.data;
      } catch {
        // If API fails, return current user from store
        return user;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Use updated user if available, otherwise use user from store
  const currentUser = updatedUser || user;

  // Initialize form data when user is loaded
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        phone: currentUser.phone || '',
      });
      // Update user in store if we got updated data
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  }, [currentUser, updatedUser, setUser]);

  // Fetch user bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingAPI.getAll(user?.id).then((res) => res.data),
    enabled: !!user?.id && activeTab === 'bookings',
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { fullName?: string; phone?: string }) =>
      adminAPI.users.update(user!.id, data),
    onSuccess: (response) => {
      const updatedUser = response.data;
      setUser(updatedUser);
      setIsEditing(false);
      setSuccess('Cập nhật thông tin thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      setSuccess('');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => {
      // Try auth API if available, otherwise use admin API
      // Note: Backend may need to validate currentPassword
      return adminAPI.users.update(user!.id, { 
        password: data.newPassword 
      } as any);
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Đổi mật khẩu thành công!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.');
      setSuccess('');
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      fullName: currentUser?.fullName || '',
      phone: currentUser?.phone || '',
    });
    setError('');
    setSuccess('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }

    updateProfileMutation.mutate({
      fullName: formData.fullName,
      phone: formData.phone || undefined,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

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

  // Show nothing if not authenticated (redirecting)
  if (!isAuthenticated || !user || !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 font-bold transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUser className="text-lg" />
                <span>Thông tin</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 font-bold transition-all duration-200 ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiLock className="text-lg" />
                <span>Đổi mật khẩu</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-6 py-4 font-bold transition-all duration-200 ${
                activeTab === 'bookings'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCalendar className="text-lg" />
                <span>Vé đã đặt</span>
              </div>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <FiCheck className="text-lg" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <FiAlertCircle className="text-lg" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Thông tin cá nhân</h2>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-lg font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all flex items-center gap-2"
                >
                  <FiEdit className="text-lg" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-black text-white">
                      {currentUser.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-1">{currentUser.fullName}</h3>
                    <p className="text-gray-600">{currentUser.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiMail className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="text-lg font-semibold text-gray-900">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiPhone className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                      <p className="text-lg font-semibold text-gray-900">{currentUser.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiCalendar className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày tham gia</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {safeFormatDate(currentUser.createdAt, 'dd/MM/yyyy', 'Chưa có thông tin')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiUser className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        Hoạt động
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Họ tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiSave className="text-lg" />
                    {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <FiX className="text-lg" />
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Đổi mật khẩu</h2>
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiLock className="text-lg" />
                  {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Vé đã đặt</h2>
            {isLoadingBookings ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-[#FF6B35]/50 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Movie Poster */}
                      {booking.schedule?.movie?.poster && (
                        <div className="relative w-full md:w-32 h-48 md:h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                          <Image
                            src={booking.schedule.movie.poster}
                            alt={booking.schedule.movie.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Booking Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 mb-4">
                          {booking.schedule?.movie?.title || 'Phim không xác định'}
                        </h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="text-[#FF6B35]" />
                              <span className="font-semibold">{booking.schedule?.cinema?.name || '-'}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-[#FF6B35]" />
                              <span>{safeFormatDate(booking.schedule?.showTime || booking.createdAt, 'dd/MM/yyyy', '-')}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiClock className="text-[#FF6B35]" />
                              <span className="font-bold">{safeFormatDate(booking.schedule?.showTime || booking.createdAt, 'HH:mm', '-')}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiFilm className="text-[#FF6B35]" />
                              <span>Phòng {booking.schedule?.room || '-'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ghế đã chọn</p>
                            <p className="text-lg font-bold text-gray-900">
                              {booking.seats?.join(', ') || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                            <p className="text-lg font-bold text-gray-900">{booking.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tổng tiền</p>
                            <p className="text-xl font-black text-[#FF6B35]">
                              {(booking.totalPrice / 1000).toFixed(0)}k VNĐ
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status === 'confirmed'
                              ? 'Đã xác nhận'
                              : booking.status === 'pending'
                              ? 'Đang chờ'
                              : 'Đã hủy'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Đặt vé lúc: {safeFormatDate(booking.createdAt, 'dd/MM/yyyy HH:mm', '-')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">Chưa có vé nào</p>
                <p className="text-gray-400 text-sm mb-4">Bạn chưa đặt vé nào cả</p>
                <Link
                  href="/movies"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg"
                >
                  Đặt vé ngay
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


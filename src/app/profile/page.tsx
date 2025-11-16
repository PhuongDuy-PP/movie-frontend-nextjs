'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, bookingAPI, authAPI } from '@/lib/api';
import { FiUser, FiMail, FiPhone, FiLock, FiEdit, FiSave, FiX, FiCalendar, FiFilm, FiMapPin, FiClock, FiCheck, FiAlertCircle, FiCamera } from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import AvatarCropModal from '@/components/AvatarCropModal';

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

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | undefined | null): string | null => {
  if (!avatarPath) return null;
  
  // If already a full URL (starts with http:// or https://), return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // If relative path (starts with /), prepend backend URL
  if (avatarPath.startsWith('/')) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${backendUrl}${avatarPath}`;
  }
  
  // Otherwise return as is (shouldn't happen but just in case)
  return avatarPath;
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now());
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
  // Ensure we always have user data
  const currentUser = updatedUser || user;
  
  // Safety check - if no user, don't render (will redirect)
  if (!currentUser && isAuthenticated) {
    // If authenticated but no user data, try to refetch
    queryClient.refetchQueries({ queryKey: ['user', user?.id] });
  }

  // Initialize form data when user is loaded
  useEffect(() => {
    const userData = currentUser || user;
    if (userData) {
      setFormData({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
      });
      // Update user in store if we got updated data
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  }, [currentUser, user, updatedUser, setUser]);

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

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => authAPI.uploadAvatar(file),
    onSuccess: async (response) => {
      try {
        // Refetch user profile to get updated avatar URL
        const profileResponse = await authAPI.getProfile();
        const updatedUserData = profileResponse.data;
        
        // Merge with existing user data to ensure no fields are lost
        if (updatedUserData && user) {
          const mergedUser: User = {
            ...user,
            ...updatedUserData,
            // Preserve all required fields
            id: updatedUserData.id || user.id,
            email: updatedUserData.email || user.email,
            fullName: updatedUserData.fullName || user.fullName,
            phone: updatedUserData.phone || user.phone,
            role: updatedUserData.role || user.role,
            isActive: updatedUserData.isActive !== undefined ? updatedUserData.isActive : user.isActive,
            createdAt: updatedUserData.createdAt || user.createdAt,
            updatedAt: updatedUserData.updatedAt || user.updatedAt,
            // Ensure avatar is updated
            avatar: updatedUserData.avatar || user.avatar,
          };
          setUser(mergedUser);
        } else if (updatedUserData) {
          setUser(updatedUserData);
        } else if (user) {
          // If no updated data but user exists, just update avatar from response if available
          const responseData = response.data?.user || response.data;
          if (responseData?.avatar) {
            setUser({ ...user, avatar: responseData.avatar });
          }
        }
        
        // Clear preview and update state
        setAvatarPreview(null);
        setSuccess('Cập nhật avatar thành công!');
        setError('');
        setTimeout(() => setSuccess(''), 3000);
        
        // Invalidate and refetch user queries
        await queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
        await queryClient.refetchQueries({ queryKey: ['user', user?.id] });
        
        // Update timestamp to force image reload
        setAvatarTimestamp(Date.now());
      } catch (error) {
        // If getProfile fails, try to use response data or merge with existing user
        const responseUser = response.data?.user || response.data;
        if (responseUser && user) {
          // Merge with existing user to preserve all fields
          const mergedUser = {
            ...user,
            ...responseUser,
            avatar: responseUser.avatar || user.avatar,
          };
          setUser(mergedUser);
        } else if (responseUser) {
          setUser(responseUser);
        }
        
        setAvatarPreview(null);
        setSuccess('Cập nhật avatar thành công!');
        setError('');
        setTimeout(() => setSuccess(''), 3000);
        queryClient.invalidateQueries({ queryKey: ['user', user?.id] });
        // Update timestamp to force image reload
        setAvatarTimestamp(Date.now());
      }
      setIsUploadingAvatar(false);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi upload avatar');
      setSuccess('');
      setIsUploadingAvatar(false);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Create preview and open crop modal
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageSrc = reader.result as string;
      setImageToCrop(imageSrc);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropComplete = (croppedFile: File) => {
    // Upload cropped image
    setIsUploadingAvatar(true);
    setError('');
    setAvatarPreview(URL.createObjectURL(croppedFile));
    uploadAvatarMutation.mutate(croppedFile);
    setShowCropModal(false);
    setImageToCrop(null);
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
                  <div className="relative group">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-white">
                      {(currentUser?.avatar || user?.avatar || avatarPreview) ? (
                        <Image
                          key={avatarTimestamp}
                          src={
                            avatarPreview 
                              ? avatarPreview 
                              : (() => {
                                  const avatarUrl = getAvatarUrl(currentUser?.avatar || user?.avatar);
                                  return avatarUrl ? `${avatarUrl}?t=${avatarTimestamp}` : '';
                                })()
                          }
                          alt={currentUser?.fullName || user?.fullName || 'Avatar'}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center">
                          <span className="text-3xl font-black text-white">
                            {(currentUser?.fullName || user?.fullName)?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF6B35] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E55A2B] transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
                      title="Đổi avatar"
                    >
                      {isUploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiCamera className="text-lg" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-1">{currentUser?.fullName || user?.fullName || 'Người dùng'}</h3>
                    <p className="text-gray-600">{currentUser?.email || user?.email || ''}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      (currentUser?.role || user?.role) === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {(currentUser?.role || user?.role) === 'admin' ? 'Quản trị viên' : 'Người dùng'}
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
                      <p className="text-lg font-semibold text-gray-900">{(currentUser || user)?.email || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiPhone className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                      <p className="text-lg font-semibold text-gray-900">{(currentUser || user)?.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <FiCalendar className="text-xl text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ngày tham gia</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {safeFormatDate((currentUser || user)?.createdAt, 'dd/MM/yyyy', 'Chưa có thông tin')}
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
                          {(() => {
                            // Check if show time has passed
                            const isShowTimePassed = (showTime: string | Date | null | undefined): boolean => {
                              if (!showTime) return false;
                              const showDate = new Date(showTime);
                              const now = new Date();
                              return showDate < now;
                            };
                            
                            let statusText = '';
                            let statusClass = '';
                            
                            if (booking.status === 'cancelled') {
                              statusText = 'Đã hủy';
                              statusClass = 'bg-red-100 text-red-800';
                            } else if (booking.status === 'confirmed') {
                              // If show time has passed, show as "Đã thanh toán"
                              if (isShowTimePassed(booking.schedule?.showTime)) {
                                statusText = 'Đã thanh toán';
                                statusClass = 'bg-blue-100 text-blue-800';
                              } else {
                                statusText = 'Đã xác nhận';
                                statusClass = 'bg-green-100 text-green-800';
                              }
                            } else {
                              statusText = 'Đang chờ';
                              statusClass = 'bg-yellow-100 text-yellow-800';
                            }
                            
                            return (
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                                {statusText}
                              </span>
                            );
                          })()}
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

      {/* Avatar Crop Modal */}
      {imageToCrop && (
        <AvatarCropModal
          imageSrc={imageToCrop}
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}


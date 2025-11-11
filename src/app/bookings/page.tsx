'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { FiX, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';

export default function BookingsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingAPI.getAll(user?.id).then((res) => res.data),
    enabled: isAuthenticated && !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-black mb-8 text-center">Vé của tôi</h1>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-6 max-w-5xl mx-auto">
          {bookings.map((booking: any) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold mb-4">
                    {booking.schedule?.movie?.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiMapPin />
                      <span>{booking.schedule?.cinema?.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiCalendar />
                      <span>
                        {format(new Date(booking.schedule?.showTime), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <FiClock />
                      <span>
                        {format(new Date(booking.schedule?.showTime), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      Phòng: {booking.schedule?.room}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-gray-600">Ghế</p>
                      <p className="font-semibold">{booking.seats.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tổng tiền</p>
                      <p className="font-semibold text-red-600">
                        {booking.totalPrice.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Trạng thái</p>
                      <span
                        className={`px-3 py-1 rounded ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status === 'confirmed'
                          ? 'Đã xác nhận'
                          : booking.status === 'cancelled'
                          ? 'Đã hủy'
                          : 'Đang chờ'}
                      </span>
                    </div>
                  </div>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc muốn hủy vé này?')) {
                        cancelMutation.mutate(booking.id);
                      }
                    }}
                    disabled={cancelMutation.isLoading}
                    className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <FiX />
                    <span>Hủy vé</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Bạn chưa có vé nào</p>
        </div>
      )}
    </div>
  );
}


'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI, bookingAPI } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { format } from 'date-fns';
import Image from 'next/image';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = searchParams.get('scheduleId');
  const { isAuthenticated, user } = useAuthStore();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => scheduleAPI.getById(scheduleId!).then((res) => res.data),
    enabled: !!scheduleId,
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings', scheduleId],
    queryFn: () => bookingAPI.getAll().then((res) => res.data),
    enabled: !!scheduleId && isAuthenticated,
  });

  const queryClient = useQueryClient();
  const bookingMutation = useMutation({
    mutationFn: (data: { scheduleId: string; seats: string[]; quantity: number }) =>
      bookingAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      router.push('/bookings');
    },
  });

  // Get booked seats for this schedule
  const bookedSeats =
    bookings
      ?.filter((b: any) => b.scheduleId === scheduleId && b.status === 'confirmed')
      .flatMap((b: any) => b.seats) || [];

  // Generate seat layout (example: 10 rows x 15 seats)
  const rows = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)); // A-J
  const seatsPerRow = 15;

  const handleSeatClick = (seat: string) => {
    if (bookedSeats.includes(seat)) return;
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!scheduleId || selectedSeats.length === 0) return;

    bookingMutation.mutate({
      scheduleId,
      seats: selectedSeats,
      quantity: selectedSeats.length,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl">Lịch chiếu không tồn tại</p>
      </div>
    );
  }

  const totalPrice = schedule.price * selectedSeats.length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-4xl font-black mb-8 text-center">Đặt vé</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Movie Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-center md:text-left">{schedule.movie?.title}</h2>
            <div className="space-y-2 text-gray-600 text-center md:text-left">
              <p>
                <strong>Rạp:</strong> {schedule.cinema?.name}
              </p>
              <p>
                <strong>Địa chỉ:</strong> {schedule.cinema?.address}
              </p>
              <p>
                <strong>Phòng chiếu:</strong> {schedule.room}
              </p>
              <p>
                <strong>Suất chiếu:</strong>{' '}
                {format(new Date(schedule.showTime), 'HH:mm - dd/MM/yyyy')}
              </p>
            </div>
          </div>

          {/* Seat Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-center md:text-left">Chọn ghế</h3>
            <div className="mb-6 flex items-center justify-center space-x-6 flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <span className="text-sm">Ghế trống</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span className="text-sm">Đã chọn</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-sm">Đã đặt</span>
              </div>
            </div>

            {/* Screen */}
            <div className="text-center mb-8">
              <div className="bg-gray-800 text-white py-3 px-8 rounded-lg mb-4 font-semibold inline-block">MÀN HÌNH</div>
            </div>

            {/* Seats */}
            <div className="space-y-2 max-w-2xl mx-auto">
              {rows.map((row) => (
                <div key={row} className="flex items-center justify-center space-x-2">
                  <span className="w-6 font-bold">{row}</span>
                  {Array.from({ length: seatsPerRow }, (_, i) => {
                    const seat = `${row}${i + 1}`;
                    const isBooked = bookedSeats.includes(seat);
                    const isSelected = selectedSeats.includes(seat);
                    return (
                      <button
                        key={seat}
                        onClick={() => handleSeatClick(seat)}
                        disabled={isBooked}
                        className={`w-10 h-10 rounded font-medium text-sm ${
                          isBooked
                            ? 'bg-red-500 cursor-not-allowed opacity-50'
                            : isSelected
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-300 hover:bg-gray-400 hover:shadow-sm'
                        } transition-all duration-200`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20">
            <h3 className="text-xl font-bold mb-6 text-center">Thông tin đặt vé</h3>
            
            {/* Movie Poster */}
            {schedule.movie?.poster && (
              <div className="mb-6 flex justify-center">
                <div className="relative w-full max-w-[200px] aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={schedule.movie.poster}
                    alt={schedule.movie.title || 'Movie poster'}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm mb-1">Phim</p>
                <p className="font-semibold text-gray-900">{schedule.movie?.title}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Suất chiếu</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(schedule.showTime), 'HH:mm - dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Rạp</p>
                <p className="font-semibold text-gray-900">{schedule.cinema?.name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Phòng</p>
                <p className="font-semibold text-gray-900">{schedule.room}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Ghế đã chọn</p>
                <p className="font-semibold text-gray-900">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Số lượng</p>
                <p className="font-semibold text-gray-900">{selectedSeats.length} vé</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-[#FF6B35]">
                    {totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || bookingMutation.isLoading}
              className="w-full bg-[#FF6B35] text-white py-4 px-6 rounded-lg hover:bg-[#E55A2B] transition-all font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-[#FF6B35]/20 hover:shadow-xl hover:shadow-[#FF6B35]/30 transform hover:scale-105 disabled:hover:scale-100"
            >
              {bookingMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


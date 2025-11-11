'use client';

import { useQuery } from '@tanstack/react-query';
import { scheduleAPI, movieAPI, cinemaAPI } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format, isAfter } from 'date-fns';
import { FiCalendar, FiMapPin, FiClock, FiFilm, FiMonitor, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Image from 'next/image';

const ITEMS_PER_PAGE = 8;

export default function SchedulesPage() {
  const searchParams = useSearchParams();
  const movieId = searchParams.get('movieId');
  const cinemaId = searchParams.get('cinemaId');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', movieId, cinemaId],
    queryFn: () => {
      if (movieId) {
        return scheduleAPI.getByMovie(movieId).then((res) => res.data);
      }
      if (cinemaId) {
        return scheduleAPI.getByCinema(cinemaId).then((res) => res.data);
      }
      return scheduleAPI.getAll().then((res) => res.data);
    },
  });

  const { data: movies } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieAPI.getAll().then((res) => res.data),
  });

  const { data: cinemas } = useQuery({
    queryKey: ['cinemas'],
    queryFn: () => cinemaAPI.getAll().then((res) => res.data),
  });

  const now = new Date();

  // Filter and categorize schedules
  const { upcomingSchedules, pastSchedules } = useMemo(() => {
    if (!schedules) return { upcomingSchedules: [], pastSchedules: [] };

    const filtered = schedules.filter((schedule: any) => {
      if (!selectedDate) return true;
      const scheduleDate = format(new Date(schedule.showTime), 'yyyy-MM-dd');
      return scheduleDate === selectedDate;
    });

    const upcoming: any[] = [];
    const past: any[] = [];

    filtered.forEach((schedule: any) => {
      const showTime = new Date(schedule.showTime);
      if (isAfter(showTime, now)) {
        upcoming.push(schedule);
      } else {
        past.push(schedule);
      }
    });

    // Sort upcoming by time (earliest first)
    upcoming.sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());
    // Sort past by time (latest first)
    past.sort((a, b) => new Date(b.showTime).getTime() - new Date(a.showTime).getTime());

    return { upcomingSchedules: upcoming, pastSchedules: past };
  }, [schedules, selectedDate, now]);

  const currentSchedules = activeTab === 'upcoming' ? upcomingSchedules : pastSchedules;

  // Pagination
  const totalPages = Math.ceil(currentSchedules.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSchedules = currentSchedules.slice(startIndex, endIndex);

  // Reset page when tab or filter changes
  useState(() => {
    setCurrentPage(1);
  });

  // Get unique dates from schedules
  const dates = schedules
    ?.map((s: any) => format(new Date(s.showTime), 'yyyy-MM-dd'))
    .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
    .sort() || [];

  // Reset page when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              Lịch chiếu phim
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Xem và đặt vé cho các suất chiếu</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Chọn ngày
              </label>
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-all"
              >
                <option value="">Tất cả ngày</option>
                {dates.map((date: string) => (
                  <option key={date} value={date}>
                    {format(new Date(date), 'dd/MM/yyyy')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('upcoming');
                setCurrentPage(1);
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiClock className="text-lg" />
                <span>Lịch sắp chiếu ({upcomingSchedules.length})</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('past');
                setCurrentPage(1);
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'past'
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCalendar className="text-lg" />
                <span>Lịch đã chiếu ({pastSchedules.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Schedules List */}
        {isLoading ? (
          <div className="space-y-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-40 rounded-2xl" />
            ))}
          </div>
        ) : paginatedSchedules && paginatedSchedules.length > 0 ? (
          <>
            <div className="space-y-4 max-w-6xl mx-auto mb-8">
              {paginatedSchedules.map((schedule: any) => (
                <div
                  key={schedule.id}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-[#FF6B35]/50 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Movie Poster */}
                    {schedule.movie?.poster && (
                      <div className="relative w-full md:w-32 h-48 md:h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                        <Image
                          src={schedule.movie.poster}
                          alt={schedule.movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Schedule Info */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-3 line-clamp-2">
                          {schedule.movie?.title}
                        </h3>
                        <div className="space-y-2 mb-4">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="text-[#FF6B35]" />
                              <span className="font-semibold">{schedule.cinema?.name}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-[#FF6B35]" />
                              <span>{format(new Date(schedule.showTime), 'dd/MM/yyyy')}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiClock className="text-[#FF6B35]" />
                              <span className="font-bold">{format(new Date(schedule.showTime), 'HH:mm')}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                              <FiMonitor className="text-[#FF6B35]" />
                              <span>Phòng {schedule.room}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Giá vé</p>
                            <p className="text-xl font-black text-[#FF6B35]">
                              {(schedule.price / 1000).toFixed(0)}k VNĐ
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ghế còn lại</p>
                            <p className="text-lg font-bold text-gray-900">{schedule.availableSeats}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center md:justify-end">
                        {activeTab === 'upcoming' ? (
                          <Link
                            href={`/booking?scheduleId=${schedule.id}`}
                            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white px-8 py-3 rounded-xl hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all font-bold text-center transform hover:scale-105 active:scale-95 shadow-lg shadow-[#FF6B35]/25"
                          >
                            Đặt vé
                          </Link>
                        ) : (
                          <div className="px-8 py-3 rounded-xl bg-gray-200 text-gray-500 font-bold cursor-not-allowed">
                            Đã chiếu
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 max-w-6xl mx-auto">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft className="text-xl" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-xl font-bold transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg'
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF6B35]'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight className="text-xl" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FiFilm className="text-3xl text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-semibold mb-2">
              Không có lịch chiếu {activeTab === 'upcoming' ? 'sắp chiếu' : 'đã chiếu'}
            </p>
            <p className="text-gray-400 text-sm">
              {activeTab === 'upcoming' ? 'Vui lòng chọn ngày khác hoặc quay lại sau' : 'Đã không còn lịch chiếu nào'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


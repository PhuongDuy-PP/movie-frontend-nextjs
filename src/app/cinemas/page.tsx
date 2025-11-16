'use client';

import { useQuery } from '@tanstack/react-query';
import { cinemaAPI, scheduleAPI } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiPhone, FiCalendar, FiClock, FiFilm, FiMonitor } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';

export default function CinemasPage() {
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const previousCinemaRef = useRef<string | null>(null);

  const { data: cinemas, isLoading } = useQuery({
    queryKey: ['cinemas'],
    queryFn: () => cinemaAPI.getAll().then((res) => res.data),
  });

  // Set first cinema as selected by default
  useEffect(() => {
    if (cinemas && cinemas.length > 0 && !selectedCinema) {
      setSelectedCinema(cinemas[0].id);
    }
  }, [cinemas, selectedCinema]);

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', selectedCinema],
    queryFn: () => scheduleAPI.getByCinema(selectedCinema!).then((res) => res.data),
    enabled: !!selectedCinema,
  });

  // Get unique dates from schedules and sort
  const availableDates = schedules
    ?.map((s: any) => format(new Date(s.showTime), 'yyyy-MM-dd'))
    .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
    .sort() || [];

  // Set today's date on client side only
  useEffect(() => {
    setTodayDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Reset selected date only when cinema changes
  useEffect(() => {
    // Check if cinema actually changed
    if (selectedCinema !== previousCinemaRef.current) {
      previousCinemaRef.current = selectedCinema;
      // Reset date when cinema changes - this will be set when availableDates is ready
      setSelectedDate('');
    }
  }, [selectedCinema]);

  // Set default date when availableDates changes, but only if no date is selected or selected date is invalid
  useEffect(() => {
    if (availableDates.length > 0) {
      // Only set default if no date is selected or selected date is not in available dates
      // Use functional update to get current selectedDate value
      setSelectedDate((prevDate) => {
        if (!prevDate || !availableDates.includes(prevDate)) {
          return availableDates[0];
        }
        return prevDate; // Keep current selection if it's valid
      });
    } else {
      // Clear selected date if no dates available
      setSelectedDate('');
    }
  }, [availableDates]);

  // Filter schedules by selected date
  const filteredSchedules = schedules?.filter((schedule: any) => {
    if (!selectedDate) return true;
    const scheduleDate = format(new Date(schedule.showTime), 'yyyy-MM-dd');
    return scheduleDate === selectedDate;
  });

  // Group filtered schedules by movie, then by room and time
  const schedulesByMovie = filteredSchedules?.reduce((acc: any, schedule: any) => {
    const movieId = schedule.movie?.id;
    if (!acc[movieId]) {
      acc[movieId] = {
        movie: schedule.movie,
        schedules: [],
      };
    }
    acc[movieId].schedules.push(schedule);
    return acc;
  }, {});

  // Sort schedules by time within each movie
  Object.values(schedulesByMovie || {}).forEach((group: any) => {
    group.schedules.sort((a: any, b: any) => 
      new Date(a.showTime).getTime() - new Date(b.showTime).getTime()
    );
  });

  // Get cinema background image
  const getCinemaImage = (cinema: any) => {
    if (cinema.image) return cinema.image;
    return null;
  };

  // Get cinema logo URL
  const getCinemaLogoUrl = (cinema: any) => {
    if (cinema.logo && (cinema.logo.startsWith('http') || cinema.logo.startsWith('/'))) {
      return cinema.logo;
    }
    return null;
  };

  // Get cinema logo/initial from name
  const getCinemaLogo = (cinema: any) => {
    // If logo exists but is not a URL, use it as text
    if (cinema.logo && !cinema.logo.startsWith('http') && !cinema.logo.startsWith('/')) {
      return cinema.logo;
    }
    // Extract first 2-3 characters from cinema name
    const words = cinema.name?.split(' ') || [];
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cinema.name?.substring(0, 2).toUpperCase() || 'CG';
  };

  // Get gradient colors for cinema (based on name hash)
  const getCinemaGradient = (cinema: any, index: number) => {
    const gradients = [
      'from-[#FF6B35] via-[#FF8C42] to-[#FF6B35]',
      'from-[#667eea] via-[#764ba2] to-[#667eea]',
      'from-[#f093fb] via-[#f5576c] to-[#f093fb]',
      'from-[#4facfe] via-[#00f2fe] to-[#4facfe]',
      'from-[#43e97b] via-[#38f9d7] to-[#43e97b]',
      'from-[#fa709a] via-[#fee140] to-[#fa709a]',
    ];
    return gradients[index % gradients.length];
  };

  const selectedCinemaData = cinemas?.find((c: any) => c.id === selectedCinema);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
              Danh sách rạp chiếu
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Chọn rạp để xem lịch chiếu phim</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-72 h-52 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : cinemas && cinemas.length > 0 ? (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Cinema Tabs - Horizontal Tab Design */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {cinemas.map((cinema: any, index: number) => (
                  <button
                    key={cinema.id}
                    onClick={() => setSelectedCinema(cinema.id)}
                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      selectedCinema === cinema.id
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-lg scale-105'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {/* Logo/Initial */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedCinema === cinema.id
                        ? 'bg-white/20 backdrop-blur-sm'
                        : 'bg-white border border-gray-200'
                    }`}>
                      {getCinemaLogoUrl(cinema) ? (
                        <div className="relative w-8 h-8 rounded overflow-hidden">
                          <Image
                            src={getCinemaLogoUrl(cinema)!}
                            alt={`${cinema.name} logo`}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <span className={`text-sm font-black ${
                          selectedCinema === cinema.id ? 'text-white' : 'text-gray-700'
                        }`}>
                          {getCinemaLogo(cinema)}
                        </span>
                      )}
                    </div>
                    {/* Cinema Name */}
                    <span className="text-sm font-bold whitespace-nowrap">
                      {cinema.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Cinema Details */}
            {selectedCinema && selectedCinemaData && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                {/* Cinema Header - Compact */}
                <div className={`relative bg-gradient-to-r ${getCinemaGradient(selectedCinemaData, cinemas.findIndex((c: any) => c.id === selectedCinema))} p-5 md:p-6 text-white`}>
                  <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Cinema Logo - Smaller */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center">
                          {getCinemaLogoUrl(selectedCinemaData) ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10">
                              <Image
                                src={getCinemaLogoUrl(selectedCinemaData)!}
                                alt={`${selectedCinemaData.name} logo`}
                                fill
                                className="object-contain p-2"
                              />
                            </div>
                          ) : (
                            <span className="text-white font-black text-xl drop-shadow-lg">
                              {getCinemaLogo(selectedCinemaData)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Cinema Name & Info - Compact */}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl md:text-2xl font-black mb-3 drop-shadow-lg line-clamp-1">
                          {selectedCinemaData.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/95">
                          <div className="flex items-center gap-2">
                            <FiMapPin className="text-base flex-shrink-0" />
                            <span className="line-clamp-1">
                              {selectedCinemaData.address}, {selectedCinemaData.city}
                            </span>
                          </div>
                          {selectedCinemaData.phone && (
                            <div className="flex items-center gap-2">
                              <FiPhone className="text-base" />
                              <span>{selectedCinemaData.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FiMonitor className="text-base" />
                            <span className="font-semibold">{selectedCinemaData.totalRooms} phòng</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Tabs - Horizontal */}
                {schedules && schedules.length > 0 && (
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="px-4 py-3">
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {availableDates.map((date: string) => {
                          const isToday = todayDate === date;
                          const dateObj = new Date(date + 'T00:00:00');
                          const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          const dayName = dayNames[dateObj.getDay()];
                          const dayNumber = format(dateObj, 'dd');
                          const month = format(dateObj, 'MM');
                          
                          return (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 min-w-[70px] ${
                                selectedDate === date
                                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-md scale-105'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-[#FF6B35]/30'
                              }`}
                            >
                              <div className="text-center">
                                {isToday && (
                                  <div className={`text-[9px] font-black mb-0.5 ${
                                    selectedDate === date ? 'text-white' : 'text-[#FF6B35]'
                                  }`}>
                                    HÔM NAY
                                  </div>
                                )}
                                <div className={`text-xs mb-0.5 ${selectedDate === date ? 'text-white/90' : 'text-gray-500'}`}>
                                  {dayName}
                                </div>
                                <div className={`text-base font-black ${
                                  selectedDate === date ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {dayNumber}/{month}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedules Content */}
                <div className="p-4 md:p-6">
                  {schedulesLoading ? (
                    <div className="space-y-6 max-w-5xl mx-auto">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                          <div className="h-5 bg-gray-200 rounded-lg w-1/3 mb-4" />
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((j) => (
                              <div key={j} className="h-16 bg-gray-200 rounded-lg" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredSchedules && filteredSchedules.length > 0 ? (
                    <div className="space-y-6 max-w-5xl mx-auto">
                      {Object.values(schedulesByMovie || {}).map((group: any) => (
                        <div
                          key={group.movie?.id}
                          className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 md:p-5 border border-gray-200 hover:border-[#FF6B35]/30 transition-all duration-300 hover:shadow-md"
                        >
                          {/* Movie Header - Compact */}
                          <div className="flex items-center gap-3 md:gap-4 mb-5">
                            {group.movie?.poster && (
                              <div className="relative w-16 h-24 md:w-20 md:h-28 rounded-lg overflow-hidden shadow-md flex-shrink-0 ring-1 ring-gray-200">
                                <Image
                                  src={group.movie.poster}
                                  alt={group.movie.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-base md:text-lg text-gray-900 line-clamp-2 mb-2">
                                {group.movie?.title}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <span className="flex items-center gap-1.5">
                                  <FiFilm className="text-[#FF6B35] text-sm" />
                                  {group.movie?.genre}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                  <FiClock className="text-[#FF6B35] text-sm" />
                                  {group.movie?.duration} phút
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule Times Grid - Compact */}
                          <div className="p-2">
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 md:gap-3 justify-items-center">
                              {group.schedules.map((schedule: any) => {
                                const showTime = new Date(schedule.showTime);
                                const now = new Date();
                                const isPast = showTime < now;
                                
                                return isPast ? (
                                  <div
                                    key={schedule.id}
                                    className="group bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-lg p-2.5 md:p-3 w-full max-w-[100px] opacity-60 cursor-not-allowed relative"
                                  >
                                    <div className="text-center space-y-1.5">
                                      <div className="flex items-center justify-center gap-1">
                                        <FiClock className="text-[10px] opacity-70" />
                                        <span className="font-black text-sm md:text-base line-through">
                                          {format(showTime, 'HH:mm')}
                                        </span>
                                      </div>
                                      <div className="text-[10px] opacity-80 font-semibold">
                                        Phòng {schedule.room}
                                      </div>
                                      <div className="text-[10px] font-black pt-1 mt-1 border-t border-white/30">
                                        {(schedule.price / 1000).toFixed(0)}k
                                      </div>
                                      <div className="text-[9px] opacity-90 bg-white/20 rounded-full px-1.5 py-0.5 mt-1 font-semibold">
                                        Đã qua
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <Link
                                    key={schedule.id}
                                    href={`/booking?scheduleId=${schedule.id}`}
                                    className="group bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] text-white rounded-lg p-2.5 md:p-3 hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 w-full max-w-[100px]"
                                  >
                                    <div className="text-center space-y-1.5">
                                      <div className="flex items-center justify-center gap-1">
                                        <FiClock className="text-[10px] opacity-90" />
                                        <span className="font-black text-sm md:text-base">
                                          {format(showTime, 'HH:mm')}
                                        </span>
                                      </div>
                                      <div className="text-[10px] opacity-95 font-semibold">
                                        Phòng {schedule.room}
                                      </div>
                                      <div className="text-[10px] font-black pt-1 mt-1 border-t border-white/30">
                                        {(schedule.price / 1000).toFixed(0)}k
                                      </div>
                                      {schedule.availableSeats < 10 && (
                                        <div className="text-[9px] opacity-80 bg-white/20 rounded-full px-1.5 py-0.5 mt-1">
                                          {schedule.availableSeats} ghế
                                        </div>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : schedules && schedules.length > 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-base font-semibold mb-1">Không có lịch chiếu cho ngày này</p>
                      <p className="text-gray-400 text-sm">Vui lòng chọn ngày khác</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <FiFilm className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-base font-semibold mb-1">Chưa có lịch chiếu</p>
                      <p className="text-gray-400 text-sm">Vui lòng quay lại sau</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FiFilm className="text-2xl text-gray-400" />
            </div>
            <p className="text-gray-600 text-base font-semibold">Không có rạp chiếu nào</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
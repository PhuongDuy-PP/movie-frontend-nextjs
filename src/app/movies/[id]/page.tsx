'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieAPI, scheduleAPI, commentAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiStar, FiClock, FiCalendar, FiMapPin, FiPlay, FiX, FiFilm, FiMonitor, FiUser, FiCheckCircle, FiSend, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const movieId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();
  const [showTrailer, setShowTrailer] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null);
  
  // Comment form state
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    if (showTrailer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTrailer]);

  const handleCloseTrailer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowTrailer(false);
      setIsClosing(false);
    }, 300);
  };

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => movieAPI.getById(movieId).then((res) => res.data),
    enabled: !!movieId,
  });

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', movieId],
    queryFn: () => scheduleAPI.getByMovie(movieId).then((res) => res.data),
    enabled: !!movieId,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', movieId],
    queryFn: () => commentAPI.getAll(movieId).then((res) => res.data),
    enabled: !!movieId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (data: { movieId: string; content: string; rating: number }) =>
      commentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie', movieId] });
      setCommentContent('');
      setCommentRating(0);
      setShowCommentForm(false);
    },
    onError: (error: any) => {
      console.error('Error creating comment:', error);
    },
  });

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!commentContent.trim()) {
      return;
    }
    if (commentRating === 0) {
      return;
    }
    createCommentMutation.mutate({
      movieId,
      content: commentContent.trim(),
      rating: commentRating,
    });
  };

  // Get unique dates from schedules
  const availableDates = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .map((s: any) => format(new Date(s.showTime), 'yyyy-MM-dd'))
      .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
      .sort();
  }, [schedules]);

  // Set today's date on client side only
  useEffect(() => {
    setTodayDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // Set first date as selected by default
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Filter schedules by selected date
  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (!selectedDate) return schedules;
    return schedules.filter((schedule: any) => {
      const scheduleDate = format(new Date(schedule.showTime), 'yyyy-MM-dd');
      return scheduleDate === selectedDate;
    });
  }, [schedules, selectedDate]);

  // Group schedules by cinema
  const schedulesByCinema = useMemo(() => {
    const grouped: any = {};
    filteredSchedules.forEach((schedule: any) => {
      const cinemaId = schedule.cinema?.id;
      if (!grouped[cinemaId]) {
        grouped[cinemaId] = {
          cinema: schedule.cinema,
          schedules: [],
        };
      }
      grouped[cinemaId].schedules.push(schedule);
    });
    // Sort schedules by time within each cinema
    Object.values(grouped).forEach((group: any) => {
      group.schedules.sort((a: any, b: any) => 
        new Date(a.showTime).getTime() - new Date(b.showTime).getTime()
      );
    });
    return grouped;
  }, [filteredSchedules]);

  // Set first cinema as selected by default, reset when date changes
  useEffect(() => {
    if (Object.keys(schedulesByCinema).length > 0) {
      // Check if current selected cinema exists for the filtered schedules
      if (!selectedCinema || !schedulesByCinema[selectedCinema]) {
        // Reset to first cinema if current selection is invalid
        const firstCinemaId = Object.keys(schedulesByCinema)[0];
        setSelectedCinema(firstCinemaId);
      }
    } else {
      setSelectedCinema(null);
    }
  }, [schedulesByCinema, selectedCinema]);

  // Calculate average rating from comments
  const averageRating = useMemo(() => {
    if (!comments || comments.length === 0) return 0;
    const total = comments.reduce((sum: number, comment: any) => sum + (comment.rating || 0), 0);
    return total / comments.length;
  }, [comments]);

  // Get cinema logo URL
  const getCinemaLogoUrl = (cinema: any) => {
    if (!cinema) return null;
    if (cinema.logo && (cinema.logo.startsWith('http') || cinema.logo.startsWith('/'))) {
      return cinema.logo;
    }
    return null;
  };

  // Get cinema logo/initial from name
  const getCinemaLogo = (cinema: any) => {
    if (!cinema) return 'CG';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">Phim không tồn tại</p>
        </div>
      </div>
    );
  }

  // Safely convert rating to number
  const rating = typeof movie.rating === 'number' 
    ? movie.rating 
    : movie.rating != null 
    ? Number(movie.rating) 
    : 0;
  const isValidRating = rating > 0 && !isNaN(rating);

  // Get user avatar initial
  const getUserInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url(${movie.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Poster */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="relative w-[280px] md:w-[320px] h-[420px] md:h-[480px] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20">
                  {movie.poster ? (
                    <Image
                      src={movie.poster}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <FiFilm className="text-6xl text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Movie Info */}
              <div className="flex-1 text-center lg:text-left space-y-6">
                <div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6">
                    {isValidRating && (
                      <div className="flex items-center gap-2 bg-[#FF6B35] text-white px-5 py-2.5 rounded-xl shadow-lg">
                        <FiStar className="fill-current text-yellow-300 text-xl" />
                        <span className="font-black text-lg">{rating.toFixed(1)}</span>
                      </div>
                    )}
                    {averageRating > 0 && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl">
                        <span className="text-sm opacity-90">Đánh giá:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`text-sm ${
                                star <= Math.round(averageRating)
                                  ? 'fill-yellow-300 text-yellow-300'
                                  : 'text-white/30'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold ml-1">({comments?.length || 0})</span>
                      </div>
                    )}
                    <span className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <FiClock className="text-lg" />
                      <span className="font-medium">{movie.duration} phút</span>
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold">
                      {movie.genre}
                    </span>
                  </div>
                </div>

                <p className="text-lg text-white/90 leading-relaxed max-w-3xl mx-auto lg:mx-0">
                  {movie.description}
                </p>

                <div className="grid md:grid-cols-2 gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div>
                    <strong className="text-white/80 text-sm block mb-1">Đạo diễn</strong>
                    <p className="text-white font-semibold">{movie.director}</p>
                  </div>
                  <div>
                    <strong className="text-white/80 text-sm block mb-1">Diễn viên</strong>
                    <p className="text-white font-semibold line-clamp-2">{movie.actors.join(', ')}</p>
                  </div>
                  <div>
                    <strong className="text-white/80 text-sm block mb-1">Khởi chiếu</strong>
                    <p className="text-white font-semibold">{format(new Date(movie.releaseDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>

                {movie.trailer && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-[#FF6B35]/50 hover:shadow-[#FF6B35]/70 transition-all transform hover:scale-105"
                  >
                    <FiPlay className="text-2xl" />
                    <span>Xem Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Schedules Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">Lịch chiếu</h2>
            <p className="text-gray-600 text-lg">Chọn ngày và rạp để đặt vé</p>
          </div>

          {schedulesLoading ? (
            <div className="space-y-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 mx-auto"></div>
                  <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-20 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : schedules && schedules.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              {/* Date Tabs */}
              <div className="mb-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
                  <div className="flex justify-center gap-3 overflow-x-auto scrollbar-hide pb-2 px-2">
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
                          className={`flex-shrink-0 px-5 py-4 rounded-xl font-bold transition-all duration-300 min-w-[90px] ${
                            selectedDate === date
                              ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] text-white shadow-xl scale-105 ring-4 ring-[#FF6B35]/30'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200 hover:border-[#FF6B35]/30'
                          }`}
                        >
                          <div className="text-center">
                            {isToday && (
                              <div className={`text-[10px] font-black mb-1 tracking-wide ${
                                selectedDate === date ? 'text-white' : 'text-[#FF6B35]'
                              }`}>
                                HÔM NAY
                              </div>
                            )}
                            <div className={`text-xs mb-1 ${selectedDate === date ? 'text-white/90' : 'text-gray-500'}`}>
                              {dayName}
                            </div>
                            <div className={`text-xl font-black ${
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

              {/* Cinema Tabs & Schedules */}
              {filteredSchedules.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Cinema Tabs */}
                  {Object.keys(schedulesByCinema).length > 1 && (
                    <div className="border-b border-gray-200 bg-gray-50">
                      <div className="px-6 py-4">
                        <div className="flex justify-center gap-3 overflow-x-auto scrollbar-hide pb-2 px-2">
                          {Object.values(schedulesByCinema).map((group: any, index: number) => (
                            <button
                              key={group.cinema?.id}
                              onClick={() => setSelectedCinema(group.cinema?.id)}
                              className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                                selectedCinema === group.cinema?.id
                                  ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] text-white shadow-lg scale-105 ring-4 ring-[#FF6B35]/30'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200 hover:border-[#FF6B35]/30 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Cinema Logo */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  selectedCinema === group.cinema?.id
                                    ? 'bg-white/20 backdrop-blur-sm border border-white/30'
                                    : 'bg-gradient-to-br from-[#FF6B35] to-[#FF8C42]'
                                }`}>
                                  {getCinemaLogoUrl(group.cinema) ? (
                                    <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white/10">
                                      <Image
                                        src={getCinemaLogoUrl(group.cinema)!}
                                        alt={`${group.cinema?.name} logo`}
                                        fill
                                        className="object-contain p-1"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-black text-sm text-white">
                                      {getCinemaLogo(group.cinema)}
                                    </span>
                                  )}
                                </div>
                                <span className={selectedCinema === group.cinema?.id ? 'text-white' : 'text-gray-900'}>
                                  {group.cinema?.name}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Cinema Schedules */}
                  {selectedCinema && schedulesByCinema[selectedCinema] && (
                    <div>
                      {/* Cinema Info Header - Show when only 1 cinema or when tabs are visible */}
                      <div className={`bg-gradient-to-r from-gray-50 to-white ${Object.keys(schedulesByCinema).length > 1 ? 'border-b border-gray-200' : ''} p-6`}>
                        <div className="flex items-center gap-4 max-w-4xl mx-auto">
                          {/* Cinema Logo */}
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-gray-200">
                            {getCinemaLogoUrl(schedulesByCinema[selectedCinema].cinema) ? (
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/10">
                                <Image
                                  src={getCinemaLogoUrl(schedulesByCinema[selectedCinema].cinema)!}
                                  alt={`${schedulesByCinema[selectedCinema].cinema?.name} logo`}
                                  fill
                                  className="object-contain p-2"
                                />
                              </div>
                            ) : (
                              <span className="text-white font-black text-xl">
                                {getCinemaLogo(schedulesByCinema[selectedCinema].cinema)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-black text-gray-900 mb-1">
                              {schedulesByCinema[selectedCinema].cinema?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <FiMapPin className="text-[#FF6B35] flex-shrink-0" />
                              <span>{schedulesByCinema[selectedCinema].cinema?.address}, {schedulesByCinema[selectedCinema].cinema?.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Schedule Times Grid */}
                      <div className="p-6 md:p-8 lg:p-10">
                        {schedulesByCinema[selectedCinema].schedules.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-5 justify-items-center max-w-5xl mx-auto">
                            {schedulesByCinema[selectedCinema].schedules.map((schedule: any) => (
                              <Link
                                key={schedule.id}
                                href={`/booking?scheduleId=${schedule.id}`}
                                className="group bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] text-white rounded-xl p-4 md:p-5 hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center border-2 border-transparent hover:border-white/30 w-full max-w-[140px]"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <FiClock className="text-sm opacity-90" />
                                    <span className="font-black text-lg">
                                      {format(new Date(schedule.showTime), 'HH:mm')}
                                    </span>
                                  </div>
                                  <div className="text-xs opacity-95 font-semibold">
                                    Phòng {schedule.room}
                                  </div>
                                  <div className="text-xs font-black pt-2 mt-2 border-t border-white/30">
                                    {(schedule.price / 1000).toFixed(0)}k VNĐ
                                  </div>
                                  {schedule.availableSeats < 10 && (
                                    <div className="text-[10px] opacity-80 bg-white/20 rounded-full px-2 py-0.5 mt-1">
                                      {schedule.availableSeats} ghế
                                    </div>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <FiClock className="text-5xl text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-semibold mb-2">Không có suất chiếu</p>
                            <p className="text-gray-400 text-sm">Vui lòng chọn ngày hoặc rạp khác</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <FiCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-semibold mb-2">Không có lịch chiếu cho ngày này</p>
                  <p className="text-gray-400">Vui lòng chọn ngày khác</p>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
              <FiFilm className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold mb-2">Chưa có lịch chiếu</p>
              <p className="text-gray-400">Vui lòng quay lại sau</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">Đánh giá & Bình luận</h2>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <p className="text-gray-600 text-lg">
                {comments && comments.length > 0 
                  ? `${comments.length} đánh giá từ khán giả`
                  : 'Chưa có đánh giá nào'}
              </p>
              {averageRating > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border border-yellow-200">
                  <div className="flex items-center gap-1">
                    <FiStar className="fill-yellow-400 text-yellow-400 text-lg" />
                    <span className="font-black text-gray-900 text-lg">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-600 text-sm">/ 5.0</span>
                </div>
              )}
            </div>
          </div>

          {/* Comment Form */}
          {isAuthenticated ? (
            <div className="max-w-4xl mx-auto mb-8">
              {!showCommentForm ? (
                <button
                  onClick={() => setShowCommentForm(true)}
                  className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FiStar className="text-xl" />
                  <span>Viết đánh giá của bạn</span>
                </button>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 animate-fadeIn">
                  <div className="flex items-start gap-4 mb-6">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {getUserInitial(user?.fullName || 'U')}
                      </div>
                    </div>
                    
                    {/* Form Content */}
                    <div className="flex-1">
                      <h3 className="font-black text-gray-900 mb-4 text-lg">
                        {user?.fullName || 'Bạn'}
                      </h3>
                      
                      {/* Rating Stars */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Đánh giá của bạn *
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCommentRating(star)}
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <FiStar
                                className={`text-3xl ${
                                  star <= (hoveredRating || commentRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                } transition-colors`}
                              />
                            </button>
                          ))}
                          {commentRating > 0 && (
                            <span className="ml-2 text-sm font-semibold text-gray-600">
                              {commentRating}.0 / 5.0
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment Textarea */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nội dung đánh giá *
                        </label>
                        <textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Chia sẻ cảm nhận của bạn về bộ phim này..."
                          rows={5}
                          maxLength={1000}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none transition-all text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {commentContent.length} / 1000 ký tự
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCommentForm(false);
                            setCommentContent('');
                            setCommentRating(0);
                          }}
                          className="px-6 py-2.5 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitComment}
                          disabled={!commentContent.trim() || commentRating === 0 || createCommentMutation.isPending}
                          className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {createCommentMutation.isPending ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang gửi...</span>
                            </>
                          ) : (
                            <>
                              <FiSend className="text-lg" />
                              <span>Gửi đánh giá</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                <FiAlertCircle className="text-4xl text-blue-500 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold mb-2">Đăng nhập để viết đánh giá</p>
                <p className="text-gray-600 text-sm mb-4">Bạn cần đăng nhập để có thể chia sẻ cảm nhận về bộ phim này</p>
                <Link
                  href="/login"
                  className="inline-block bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          )}

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {comments.map((comment: any) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8 lg:p-10 hover:shadow-xl transition-all duration-300 animate-fadeIn"
                >
                  <div className="flex items-start gap-5 md:gap-6 lg:gap-8">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8C42] flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg ring-2 ring-white">
                        {getUserInitial(comment.user?.fullName || 'U')}
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4 flex-wrap">
                          <h4 className="font-black text-gray-900 text-lg md:text-xl">{comment.user?.fullName || 'Khách'}</h4>
                          {comment.rating > 0 && (
                            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 rounded-full border border-yellow-200">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FiStar
                                    key={star}
                                    className={`text-sm ${
                                      star <= comment.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-1.5 text-sm font-bold text-gray-700">
                                {comment.rating}.0
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm flex items-center gap-2">
                          <FiCalendar className="text-xs" />
                          {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
              <FiStar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold mb-2">Chưa có đánh giá</p>
              <p className="text-gray-400">Hãy là người đầu tiên đánh giá bộ phim này</p>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && movie.trailer && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
            isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
          }`}
          onClick={handleCloseTrailer}
        >
          <div
            className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          ></div>
          
          <div
            className={`relative z-10 max-w-5xl w-full ${
              isClosing ? 'animate-scaleOut' : 'animate-scaleIn'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseTrailer}
              className="absolute -top-12 right-0 text-white bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all duration-300 z-20 transform hover:scale-110 hover:rotate-90 shadow-lg"
              aria-label="Đóng trailer"
            >
              <FiX className="text-2xl" />
            </button>
            
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <div className="aspect-video w-full relative">
                <iframe
                  src={
                    movie.trailer.includes('youtube.com/watch')
                      ? movie.trailer.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1'
                      : movie.trailer.includes('youtu.be')
                      ? movie.trailer.replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1'
                      : movie.trailer
                  }
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

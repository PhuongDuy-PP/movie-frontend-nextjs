'use client';

import { useQuery } from '@tanstack/react-query';
import { movieAPI } from '@/lib/api';
import { Movie } from '@/types';
import MovieCard from '@/components/MovieCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Link from 'next/link';
import { FiPlay, FiCalendar, FiMapPin, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function Home() {
  const { data: movies, isLoading: moviesLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieAPI.getAll().then((res) => res.data),
  });

  const [showTrailer, setShowTrailer] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isClosing, setIsClosing] = useState(false);

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

  const handleOpenTrailer = (movie: Movie) => {
    if (movie.trailer) {
      setSelectedMovie(movie);
      setShowTrailer(true);
    }
  };

  const handleCloseTrailer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowTrailer(false);
      setSelectedMovie(null);
      setIsClosing(false);
    }, 300);
  };

  const featuredMovies = movies?.slice(0, 5) || [];

  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden -mt-20 pt-20">
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation
          pagination={{ clickable: true }}
          className="h-full"
          style={{
            '--swiper-navigation-color': '#FF6B35',
            '--swiper-pagination-color': '#FF6B35',
          } as React.CSSProperties}
        >
          {featuredMovies.map((movie: Movie) => (
            <SwiperSlide key={movie.id}>
              <div className="relative h-full flex items-center">
                {/* Background Image with Overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: movie.poster
                      ? `url(${movie.poster})`
                      : 'none',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>
                
                {/* Content */}
                <div className="container mx-auto px-4 relative z-10">
                  <div className="max-w-4xl mx-auto text-white text-center">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight drop-shadow-2xl">
                      {movie.title}
                    </h1>
                    <p className="text-lg md:text-xl mb-8 line-clamp-3 text-gray-200 max-w-2xl leading-relaxed mx-auto">
                      {movie.description}
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <Link
                        href={`/movies/${movie.id}`}
                        className="bg-[#FF6B35] text-white px-8 py-4 rounded-lg font-bold hover:bg-[#E55A2B] transition-all flex items-center space-x-2 shadow-lg shadow-[#FF6B35]/30 hover:shadow-xl hover:shadow-[#FF6B35]/40 hover:scale-105"
                      >
                        <FiPlay className="text-xl" />
                        <span>Xem chi tiết</span>
                      </Link>
                      {movie.trailer && (
                        <button
                          onClick={() => handleOpenTrailer(movie)}
                          className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-lg font-bold hover:bg-white/20 transition-all hover:scale-105 flex items-center space-x-2"
                        >
                          <FiPlay className="text-xl" />
                          <span>Xem trailer</span>
                        </button>
                      )}
                      <Link
                        href={`/booking?movieId=${movie.id}`}
                        className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-lg font-bold hover:bg-white/20 transition-all hover:scale-105"
                      >
                        Đặt vé ngay
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Now Showing */}
      <section className="w-full bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="mb-4">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Phim đang chiếu</h2>
              <p className="text-gray-600">Khám phá những bộ phim hay nhất hiện tại</p>
            </div>
            <Link
              href="/movies?status=now-showing"
              className="text-[#FF6B35] hover:text-[#E55A2B] font-semibold text-lg flex items-center space-x-1 group"
            >
              <span>Xem tất cả</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1280px] w-full">
              {moviesLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse h-96 rounded-xl w-full"
                  />
                ))
              ) : (
                movies
                  ?.filter((movie: Movie) => {
                    const releaseDate = new Date(movie.releaseDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return releaseDate <= today;
                  })
                  .slice(0, 8)
                  .map((movie: Movie) => (
                    <div key={movie.id} className="w-full">
                      <MovieCard movie={movie} />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="w-full bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="mb-4">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Phim sắp chiếu</h2>
              <p className="text-gray-600">Đừng bỏ lỡ những bộ phim hấp dẫn sắp tới</p>
            </div>
            <Link
              href="/movies?status=coming-soon"
              className="text-[#FF6B35] hover:text-[#E55A2B] font-semibold text-lg flex items-center space-x-1 group"
            >
              <span>Xem tất cả</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1280px] w-full">
              {moviesLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse h-96 rounded-xl w-full"
                  />
                ))
              ) : (
                movies
                  ?.filter((movie: Movie) => {
                    const releaseDate = new Date(movie.releaseDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return releaseDate > today;
                  })
                  .slice(0, 4)
                  .map((movie: Movie) => (
                    <div key={movie.id} className="w-full">
                      <MovieCard movie={movie} />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Booking */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-black mb-4 text-center">
            Đặt vé nhanh
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Chỉ với 3 bước đơn giản, bạn đã có thể sở hữu vé xem phim yêu thích
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link
              href="/movies"
              className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#FF6B35] transition-all text-center group"
            >
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FiCalendar className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3">Chọn phim</h3>
              <p className="text-gray-400">Xem danh sách phim đang chiếu và sắp chiếu</p>
            </Link>
            <Link
              href="/cinemas"
              className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#FF6B35] transition-all text-center group"
            >
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FiMapPin className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3">Chọn rạp</h3>
              <p className="text-gray-400">Tìm rạp chiếu gần bạn nhất</p>
            </Link>
            <Link
              href="/schedules"
              className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#FF6B35] transition-all text-center group"
            >
              <div className="w-16 h-16 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FiPlay className="text-2xl text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3">Chọn suất</h3>
              <p className="text-gray-400">Xem lịch chiếu và đặt vé ngay</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="w-full bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="mb-4">
              <h2 className="text-4xl font-black text-gray-900 mb-2">Tin tức & Blog</h2>
              <p className="text-gray-600">Cập nhật những tin tức mới nhất về điện ảnh</p>
            </div>
            <Link
              href="/blog"
              className="text-[#FF6B35] hover:text-[#E55A2B] font-semibold text-lg flex items-center space-x-1 group"
            >
              <span>Xem tất cả</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1280px]">
              {/* Blog cards will be added here */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group w-full">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl mb-4 group-hover:scale-105 transition-transform duration-300"></div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-[#FF6B35] transition-colors">Tin tức phim</h3>
                  <p className="text-gray-600">
                    Cập nhật những tin tức mới nhất về phim ảnh và giải trí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      {showTrailer && selectedMovie?.trailer && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
            isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
          }`}
          onClick={handleCloseTrailer}
          style={{
            animation: isClosing ? 'fadeOut 0.3s ease-in' : 'fadeIn 0.3s ease-out',
          }}
        >
          {/* Backdrop with blur */}
          <div
            className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
          ></div>
          
          {/* Modal Content */}
          <div
            className={`relative z-10 max-w-5xl w-full ${
              isClosing ? 'animate-scaleOut' : 'animate-scaleIn'
            }`}
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: isClosing
                ? 'scaleOut 0.3s ease-in'
                : 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseTrailer}
              className="absolute -top-12 right-0 text-white bg-white/10 backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all duration-300 z-20 transform hover:scale-110 hover:rotate-90 shadow-lg group"
              aria-label="Đóng trailer"
            >
              <FiX className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
            </button>
            
            {/* Video Container */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform transition-transform duration-300 hover:scale-[1.02]">
              <div className="aspect-video w-full relative">
                <iframe
                  src={
                    selectedMovie.trailer.includes('youtube.com/watch')
                      ? selectedMovie.trailer.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1'
                      : selectedMovie.trailer.includes('youtu.be')
                      ? selectedMovie.trailer.replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1'
                      : selectedMovie.trailer
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
    </div>
  );
}

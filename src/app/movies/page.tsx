'use client';

import { useQuery } from '@tanstack/react-query';
import { movieAPI } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch } from 'react-icons/fi';

export default function MoviesPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as 'now-showing' | 'coming-soon' | null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'now-showing' | 'coming-soon'>(
    status || 'all'
  );

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies', selectedStatus],
    queryFn: () => {
      if (selectedStatus === 'all') {
        return movieAPI.getAll().then((res) => res.data);
      }
      return movieAPI.getAll().then((res) => {
        const allMovies = res.data;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return allMovies.filter((movie: any) => {
          const releaseDate = new Date(movie.releaseDate);
          if (selectedStatus === 'now-showing') {
            return releaseDate <= today;
          } else {
            return releaseDate > today;
          }
        });
      });
    },
  });

  const filteredMovies = movies?.filter((movie: any) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black text-gray-900 mb-3">Danh sách phim</h1>
          <p className="text-gray-600 text-lg">Khám phá bộ sưu tập phim đa dạng</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex space-x-2 border-b border-gray-200 justify-center max-w-2xl mx-auto">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-6 py-4 font-semibold transition-all relative ${
              selectedStatus === 'all'
                ? 'text-[#FF6B35]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tất cả
            {selectedStatus === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]"></span>
            )}
          </button>
          <button
            onClick={() => setSelectedStatus('now-showing')}
            className={`px-6 py-4 font-semibold transition-all relative ${
              selectedStatus === 'now-showing'
                ? 'text-[#FF6B35]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Đang chiếu
            {selectedStatus === 'now-showing' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]"></span>
            )}
          </button>
          <button
            onClick={() => setSelectedStatus('coming-soon')}
            className={`px-6 py-4 font-semibold transition-all relative ${
              selectedStatus === 'coming-soon'
                ? 'text-[#FF6B35]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sắp chiếu
            {selectedStatus === 'coming-soon' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]"></span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="mb-10 flex justify-center">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Tìm phim, thể loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-[1280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-96 rounded-xl w-full" />
            ))}
          </div>
        </div>
      ) : filteredMovies?.length > 0 ? (
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-[1280px]">
            {filteredMovies.map((movie: any) => (
              <div key={movie.id} className="w-full">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-600 text-xl mb-2">Không tìm thấy phim nào</p>
            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


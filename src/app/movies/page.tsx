'use client';

import { useQuery } from '@tanstack/react-query';
import { movieAPI } from '@/lib/api';
import MovieCard from '@/components/MovieCard';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ITEMS_PER_PAGE = 12;

export default function MoviesPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as 'now-showing' | 'coming-soon' | null;
  const searchFromUrl = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'now-showing' | 'coming-soon'>(
    status || 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Update search query when URL param changes
  useEffect(() => {
    setSearchQuery(searchFromUrl);
  }, [searchFromUrl]);

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

  const filteredMovies = movies?.filter((movie: any) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = movie.title?.toLowerCase().includes(query) || false;
    const genreMatch = movie.genre?.toLowerCase().includes(query) || false;
    const directorMatch = movie.director?.toLowerCase().includes(query) || false;
    // Check actors - assuming actors is a string or array
    const actors = movie.actors || '';
    const actorsMatch = Array.isArray(actors)
      ? actors.some((actor: string) => actor.toLowerCase().includes(query))
      : actors.toLowerCase().includes(query);
    
    return titleMatch || genreMatch || directorMatch || actorsMatch;
  });

  // Reset page when status or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  // Calculate pagination
  const totalMovies = filteredMovies?.length || 0;
  const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMovies = filteredMovies?.slice(startIndex, endIndex) || [];

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

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
        <>
          <div className="flex justify-center w-full mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-[1280px]">
              {paginatedMovies.map((movie: any) => (
                <div key={movie.id} className="w-full">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-[#FF6B35] hover:text-white shadow-md hover:shadow-lg'
                }`}
              >
                <FiChevronLeft />
                <span>Trước</span>
              </button>

              <div className="flex items-center space-x-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      page === '...'
                        ? 'text-gray-400 cursor-default'
                        : page === currentPage
                        ? 'bg-[#FF6B35] text-white shadow-lg scale-110'
                        : 'bg-white text-gray-700 hover:bg-[#FF6B35] hover:text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-[#FF6B35] hover:text-white shadow-md hover:shadow-lg'
                }`}
              >
                <span>Sau</span>
                <FiChevronRight />
              </button>
            </div>
          )}

          {/* Page Info */}
          {totalPages > 1 && (
            <div className="text-center mt-4 text-gray-600 text-sm">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, totalMovies)} trong tổng số {totalMovies} phim
            </div>
          )}
        </>
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


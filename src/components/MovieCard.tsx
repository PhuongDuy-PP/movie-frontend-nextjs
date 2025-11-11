import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/types';
import { FiStar, FiClock } from 'react-icons/fi';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  // Safely convert rating to number
  const rating = typeof movie.rating === 'number' 
    ? movie.rating 
    : movie.rating != null 
    ? Number(movie.rating) 
    : 0;
  const isValidRating = rating > 0 && !isNaN(rating);

  return (
    <Link href={`/movies/${movie.id}`} className="group block h-full">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Poster */}
        <div className="relative h-80 bg-gray-200 overflow-hidden">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
              No Image
            </div>
          )}
          {/* Rating Badge */}
          {isValidRating && (
            <div className="absolute top-4 right-4 bg-[#FF6B35] text-white px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
              <FiStar className="fill-current text-yellow-300" />
              <span className="font-bold text-sm">{rating.toFixed(1)}</span>
            </div>
          )}
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-bold text-lg mb-4 line-clamp-1 group-hover:text-[#FF6B35] transition-colors text-gray-900">
            {movie.title}
          </h3>
          <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mb-4">
            <span className="flex items-center space-x-1.5">
              <FiClock className="text-gray-400" />
              <span>{movie.duration} phút</span>
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-md text-xs font-medium">{movie.genre}</span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-6 flex-1">{movie.description}</p>
          <div className="mt-auto">
            <span className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg hover:bg-[#E55A2B] transition-colors font-semibold text-sm shadow-md shadow-[#FF6B35]/20">
              Đặt vé
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}


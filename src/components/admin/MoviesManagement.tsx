'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, cinemaAPI } from '@/lib/api';
import { Movie } from '@/types';
import { useState, useRef } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiImage, FiUpload } from 'react-icons/fi';
import { format } from 'date-fns';
import Image from 'next/image';

// Movie genres list
const MOVIE_GENRES = [
  'Hành động',
  'Phiêu lưu',
  'Hoạt hình',
  'Hài',
  'Tội phạm',
  'Tài liệu',
  'Chính kịch',
  'Gia đình',
  'Fantasy',
  'Lịch sử',
  'Kinh dị',
  'Nhạc kịch',
  'Bí ẩn',
  'Lãng mạn',
  'Khoa học viễn tưởng',
  'Thể thao',
  'Giật gân',
  'Chiến tranh',
  'Western',
];

export default function MoviesManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    director: '',
    actors: '',
    genre: '',
    duration: '',
    releaseDate: '',
    poster: '',
    trailer: '',
    rating: '',
    isActive: true,
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ['admin', 'movies'],
    queryFn: () => adminAPI.movies.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminAPI.movies.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      setShowModal(false);
      resetForm();
      alert('Tạo phim thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo phim');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.movies.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      setShowModal(false);
      setEditingMovie(null);
      resetForm();
      alert('Cập nhật phim thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật phim');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAPI.movies.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
      alert('Xóa phim thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa phim');
    },
  });

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > 1024 * 1024) {
                  canvas.toBlob(
                    (smallerBlob) => {
                      if (smallerBlob) {
                        const reader2 = new FileReader();
                        reader2.onloadend = () => {
                          resolve(reader2.result as string);
                        };
                        reader2.onerror = reject;
                        reader2.readAsDataURL(smallerBlob);
                      } else {
                        reject(new Error('Failed to compress image'));
                      }
                    },
                    'image/jpeg',
                    0.6
                  );
                } else {
                  const reader2 = new FileReader();
                  reader2.onloadend = () => {
                    resolve(reader2.result as string);
                  };
                  reader2.onerror = reject;
                  reader2.readAsDataURL(blob);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 10MB');
        return;
      }

      try {
        const compressedBase64 = await compressImage(file, 1200, 0.7);
        setFormData({ ...formData, poster: compressedBase64 });
        setPosterPreview(compressedBase64);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      director: '',
      actors: '',
      genre: '',
      duration: '',
      releaseDate: '',
      poster: '',
      trailer: '',
      rating: '',
      isActive: true,
    });
    setPosterPreview('');
    setEditingMovie(null);
    if (posterInputRef.current) {
      posterInputRef.current.value = '';
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      director: movie.director,
      actors: Array.isArray(movie.actors) ? movie.actors.join(', ') : (movie.actors || ''),
      genre: movie.genre,
      duration: movie.duration ? movie.duration.toString() : '',
      releaseDate: movie.releaseDate ? format(new Date(movie.releaseDate), 'yyyy-MM-dd') : '',
      poster: movie.poster || '',
      trailer: movie.trailer || '',
      rating: (Number(movie.rating) || 0).toString(),
      isActive: movie.isActive,
    });
    setPosterPreview(movie.poster || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseData = {
      title: formData.title,
      description: formData.description,
      director: formData.director,
      actors: formData.actors.split(',').map(a => a.trim()).filter(a => a),
      genre: formData.genre,
      duration: parseInt(formData.duration),
      releaseDate: formData.releaseDate,
      poster: formData.poster || undefined,
      trailer: formData.trailer || undefined,
      rating: formData.rating ? parseFloat(formData.rating) : undefined,
    };

    if (editingMovie) {
      // Include isActive only when updating
      const updateData = {
        ...baseData,
        isActive: formData.isActive,
      };
      updateMutation.mutate({ id: editingMovie.id, data: updateData });
    } else {
      // Don't include isActive when creating
      createMutation.mutate(baseData);
    }
  };

  const filteredMovies = movies?.filter((movie: Movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Quản lý Phim</h2>
        <p className="text-gray-600">Quản lý danh sách phim và thông tin chi tiết</p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg flex items-center gap-2"
          >
            <FiPlus className="text-lg" />
            Thêm phim
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : filteredMovies && filteredMovies.length > 0 ? (
          filteredMovies.map((movie: Movie) => (
            <div key={movie.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              {movie.poster && (
                <div className="relative w-full h-64 bg-gray-200">
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {movie.genre}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                    {movie.duration} phút
                  </span>
                  {movie.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      Vô hiệu
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <p className="mb-1">Đạo diễn: {movie.director}</p>
                  <p className="mb-1">Ngày ra mắt: {format(new Date(movie.releaseDate), 'dd/MM/yyyy')}</p>
                  <p>Đánh giá: {Number(movie.rating || 0).toFixed(1)}/10</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(movie)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEdit className="text-sm" />
                    Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa phim này?')) {
                        deleteMutation.mutate(movie.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-600">Không tìm thấy phim nào</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900">
                {editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên phim *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Thể loại *</label>
                  <select
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] bg-white"
                  >
                    <option value="">-- Chọn thể loại --</option>
                    {MOVIE_GENRES.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Đạo diễn *</label>
                  <input
                    type="text"
                    required
                    value={formData.director}
                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Diễn viên (phân cách bằng dấu phẩy) *</label>
                  <input
                    type="text"
                    required
                    value={formData.actors}
                    onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                    placeholder="Người 1, Người 2, Người 3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Thời lượng (phút) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ngày ra mắt *</label>
                  <input
                    type="date"
                    required
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Đánh giá (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Trạng thái</label>
                  <div className="flex items-center gap-4 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 text-[#FF6B35] rounded focus:ring-2 focus:ring-[#FF6B35]"
                      />
                      <span className="text-sm font-semibold">Hoạt động</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Poster</label>
                <div className="space-y-4">
                  {/* Poster Preview */}
                  {posterPreview && (
                    <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                      <Image
                        src={posterPreview}
                        alt="Poster Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Upload Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Upload từ máy tính
                      </label>
                      <input
                        ref={posterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => posterInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-all flex items-center justify-center gap-2 text-gray-700 font-semibold"
                      >
                        <FiUpload className="text-lg" />
                        Chọn hình ảnh
                      </button>
                      <p className="text-xs text-gray-500 mt-2">Tối đa 10MB (JPG, PNG, GIF)</p>
                    </div>

                    {/* URL Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hoặc nhập URL hình ảnh
                      </label>
                      <input
                        type="url"
                        value={formData.poster && !posterPreview.startsWith('data:') ? formData.poster : ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData({ ...formData, poster: url });
                          if (url && !url.startsWith('data:')) {
                            setPosterPreview(url);
                          }
                        }}
                        placeholder="https://example.com/poster.jpg"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>

                  {/* Remove Poster Button */}
                  {posterPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, poster: '' });
                        setPosterPreview('');
                        if (posterInputRef.current) {
                          posterInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                    >
                      <FiX className="text-sm" />
                      Xóa poster
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Trailer</label>
                <input
                  type="url"
                  value={formData.trailer}
                  onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-xl font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiCheck className="text-lg" />
                  {editingMovie ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


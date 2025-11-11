'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, movieAPI, cinemaAPI } from '@/lib/api';
import { Schedule } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function SchedulesManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: '',
    room: '',
    showTime: '',
    price: '',
    totalSeats: '',
    isActive: true,
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin', 'schedules'],
    queryFn: () => adminAPI.schedules.getAll().then((res) => res.data),
  });

  const { data: movies } = useQuery({
    queryKey: ['movies'],
    queryFn: () => movieAPI.getAll().then((res) => res.data),
  });

  const { data: cinemas } = useQuery({
    queryKey: ['cinemas'],
    queryFn: () => cinemaAPI.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminAPI.schedules.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setShowModal(false);
      resetForm();
      alert('Tạo lịch chiếu thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch chiếu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminAPI.schedules.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      alert('Cập nhật lịch chiếu thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật lịch chiếu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAPI.schedules.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      alert('Xóa lịch chiếu thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa lịch chiếu');
    },
  });

  const resetForm = () => {
    setFormData({
      movieId: '',
      cinemaId: '',
      room: '',
      showTime: '',
      price: '',
      totalSeats: '',
      isActive: true,
    });
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      movieId: schedule.movieId,
      cinemaId: schedule.cinemaId,
      room: schedule.room,
      showTime: format(new Date(schedule.showTime), "yyyy-MM-dd'T'HH:mm"),
      price: schedule.price.toString(),
      totalSeats: schedule.totalSeats.toString(),
      isActive: schedule.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      movieId: formData.movieId,
      cinemaId: formData.cinemaId,
      room: formData.room,
      showTime: formData.showTime,
      price: parseInt(formData.price),
      totalSeats: parseInt(formData.totalSeats),
      isActive: formData.isActive,
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules.filter((schedule: Schedule) => {
      const movieTitle = schedule.movie?.title?.toLowerCase() || '';
      const cinemaName = schedule.cinema?.name?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      return movieTitle.includes(search) || cinemaName.includes(search) || schedule.room.includes(search);
    });
  }, [schedules, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSchedules = filteredSchedules.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Quản lý Lịch chiếu</h2>
        <p className="text-gray-600 text-sm">Quản lý lịch chiếu phim tại các rạp</p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Tìm kiếm lịch chiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-lg font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg flex items-center gap-2 text-sm"
          >
            <FiPlus className="text-base" />
            Thêm lịch chiếu
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6B35]"></div>
          </div>
        ) : filteredSchedules && filteredSchedules.length > 0 ? (
          <>
            <div className="w-full overflow-hidden">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '20%' }}>Phim</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '15%' }}>Rạp</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '8%' }}>Phòng</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '12%' }}>Ngày giờ</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '10%' }}>Giá vé</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '10%' }}>Ghế</th>
                    <th className="px-2 py-2 text-left text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '13%' }}>Trạng thái</th>
                    <th className="px-2 py-2 text-right text-[10px] font-bold text-gray-700 uppercase tracking-wider" style={{ width: '12%' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSchedules.map((schedule: Schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2">
                        <div className="text-xs font-semibold text-gray-900 line-clamp-2">{schedule.movie?.title || '-'}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs text-gray-900 line-clamp-2">{schedule.cinema?.name || '-'}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs text-gray-600">{schedule.room}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs text-gray-900">
                          {format(new Date(schedule.showTime), 'dd/MM/yy')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(schedule.showTime), 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs font-bold text-[#FF6B35]">
                          {(schedule.price / 1000).toFixed(0)}k
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="text-xs text-gray-600">
                          {schedule.availableSeats}/{schedule.totalSeats}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          schedule.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FiEdit className="text-xs" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa lịch chiếu này?')) {
                                deleteMutation.mutate(schedule.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-600">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredSchedules.length)} của {filteredSchedules.length} lịch chiếu
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FiChevronLeft className="text-xs" />
                    </button>
                    <div className="flex gap-1">
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
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white shadow-md'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:border-[#FF6B35]'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-1 text-gray-400 text-xs">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-200 hover:border-[#FF6B35] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <FiChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 text-sm">Không tìm thấy lịch chiếu nào</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">
                {editingSchedule ? 'Chỉnh sửa lịch chiếu' : 'Thêm lịch chiếu mới'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phim *</label>
                <select
                  required
                  value={formData.movieId}
                  onChange={(e) => setFormData({ ...formData, movieId: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                >
                  <option value="">Chọn phim</option>
                  {movies?.map((movie: any) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Rạp *</label>
                <select
                  required
                  value={formData.cinemaId}
                  onChange={(e) => setFormData({ ...formData, cinemaId: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                >
                  <option value="">Chọn rạp</option>
                  {cinemas?.map((cinema: any) => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Phòng *</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Ngày giờ chiếu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.showTime}
                    onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Tổng số ghế *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Trạng thái</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-[#FF6B35] rounded focus:ring-2 focus:ring-[#FF6B35]"
                    />
                    <span className="text-xs font-semibold">Hoạt động</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-5 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-lg font-bold hover:from-[#E55A2B] hover:to-[#FF6B35] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <FiCheck className="text-base" />
                  {editingSchedule ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all text-sm"
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


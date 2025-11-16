import axios from 'axios';
import Cookies from 'js-cookie';

// Use proxy API route in browser to avoid CORS issues
// The proxy route will forward requests to the backend
const API_URL = typeof window !== 'undefined' 
  ? '/api'  // Use Next.js API proxy in browser
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'); // Direct connection in server-side

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    api.post('/auth/register', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { fullName?: string; phone?: string }) =>
    api.patch('/auth/profile', data),
  // Added
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Don't set Content-Type header - let browser set it with boundary
    return api.post('/users/me/avatar', formData);
  },
};

// Movie APIs
export const movieAPI = {
  getAll: (status?: 'now-showing' | 'coming-soon') => {
    const params = status ? { status } : {};
    return api.get('/movies', { params });
  },
  getById: (id: string) => api.get(`/movies/${id}`),
};

// Cinema APIs
export const cinemaAPI = {
  getAll: () => api.get('/cinemas'),
  getById: (id: string) => api.get(`/cinemas/${id}`),
};

// Schedule APIs
export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getByMovie: (movieId: string) => api.get(`/schedules?movieId=${movieId}`),
  getByCinema: (cinemaId: string) => api.get(`/schedules?cinemaId=${cinemaId}`),
  getById: (id: string) => api.get(`/schedules/${id}`),
};

// Booking APIs
export const bookingAPI = {
  create: (data: { scheduleId: string; seats: string[]; quantity: number }) =>
    api.post('/bookings', data),
  getAll: (userId?: string) =>
    api.get(userId ? `/bookings?userId=${userId}` : '/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
};

// Comment APIs
export const commentAPI = {
  create: (data: { movieId: string; content: string; rating?: number }) =>
    api.post('/comments', data),
  getAll: (movieId?: string) =>
    api.get(movieId ? `/comments?movieId=${movieId}` : '/comments'),
  getById: (id: string) => api.get(`/comments/${id}`),
  update: (id: string, data: { content?: string; rating?: number }) =>
    api.patch(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Blog APIs
export const blogAPI = {
  getAll: (published?: boolean) =>
    api.get(published ? '/blogs?published=true' : '/blogs'),
  getById: (id: string) => api.get(`/blogs/${id}`),
  create: (data: { title: string; content: string; image?: string; excerpt?: string; isPublished?: boolean }) =>
    api.post('/blogs', data),
  update: (id: string, data: any) => api.patch(`/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/${id}`),
};

// Admin APIs
export const adminAPI = {
  // Users
  users: {
    getAll: () => api.get('/users'),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: { email: string; password: string; fullName: string; phone?: string; role?: 'admin' | 'user' }) =>
      api.post('/users', data),
    update: (id: string, data: { email?: string; fullName?: string; phone?: string; role?: 'admin' | 'user'; isActive?: boolean }) =>
      api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
  },
  // Movies
  movies: {
    getAll: () => api.get('/movies'),
    getById: (id: string) => api.get(`/movies/${id}`),
    create: (data: { title: string; description: string; director: string; actors: string[]; genre: string; duration: number; releaseDate: string; poster?: string; trailer?: string; rating?: number; isActive?: boolean }) =>
      api.post('/movies', data),
    update: (id: string, data: any) => api.patch(`/movies/${id}`, data),
    delete: (id: string) => api.delete(`/movies/${id}`),
  },
  // Schedules
  schedules: {
    getAll: () => api.get('/schedules'),
    getById: (id: string) => api.get(`/schedules/${id}`),
    create: (data: { movieId: string; cinemaId: string; room: string; showTime: string; price: number; totalSeats: number; isActive?: boolean }) =>
      api.post('/schedules', data),
    update: (id: string, data: any) => api.patch(`/schedules/${id}`, data),
    delete: (id: string) => api.delete(`/schedules/${id}`),
  },
};

export default api;


'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSuccess('Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.');
      setEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 text-center">Quên mật khẩu</h1>
        <p className="text-gray-600 text-sm text-center mb-6">Nhập email để nhận liên kết đặt lại mật khẩu</p>

        {success && (
          <div className="mb-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-800 px-4 py-3 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-linear-to-r from-orange-500 to-orange-600 text-white font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-60"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
      </div>
    </div>
  );
}

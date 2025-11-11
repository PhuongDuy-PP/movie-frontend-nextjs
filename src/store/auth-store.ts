import { create } from 'zustand';
import Cookies from 'js-cookie';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to get token from cookie
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return Cookies.get('token') || null;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize state - will be hydrated on client side
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isHydrated: false,
  };

  return {
    ...initialState,
    setAuth: (user: User, token: string) => {
      Cookies.set('token', token, { expires: 7 });
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      set({ user, token, isAuthenticated: true, isHydrated: true });
    },
    logout: () => {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
      }
      set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
    },
    setUser: (user: User) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      set({ user });
    },
    hydrate: () => {
      // Only hydrate on client side
      if (typeof window === 'undefined') return;
      
      const token = getStoredToken();
      const user = getStoredUser();
      
      set({
        token,
        user,
        isAuthenticated: !!token && !!user,
        isHydrated: true,
      });
    },
  };
});


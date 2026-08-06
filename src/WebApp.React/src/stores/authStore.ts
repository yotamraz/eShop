import { create } from 'zustand';
import type { UserInfo } from '../api/types';

interface AuthState {
  isAuthenticated: boolean;
  userName: string;
  buyerId: string;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  login: (returnUrl?: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userName: '',
  buyerId: '',
  isLoading: true,

  fetchUser: async () => {
    try {
      const response = await fetch('/bff/user');
      if (response.ok) {
        const user: UserInfo = await response.json();
        set({
          isAuthenticated: user.isAuthenticated,
          userName: user.userName,
          buyerId: user.buyerId,
          isLoading: false,
        });
      } else {
        set({ isAuthenticated: false, userName: '', buyerId: '', isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, userName: '', buyerId: '', isLoading: false });
    }
  },

  login: (returnUrl?: string) => {
    const url = returnUrl
      ? `/bff/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/bff/login';
    window.location.href = url;
  },

  logout: async () => {
    try {
      await fetch('/bff/logout', { method: 'POST' });
    } finally {
      set({ isAuthenticated: false, userName: '', buyerId: '' });
      window.location.href = '/';
    }
  },
}));

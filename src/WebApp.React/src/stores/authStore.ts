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

const UNAUTHENTICATED_USER = { isAuthenticated: false, userName: '', buyerId: '' } as const;

export const useAuthStore = create<AuthState>((set) => ({
  ...UNAUTHENTICATED_USER,
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
        set({ ...UNAUTHENTICATED_USER, isLoading: false });
      }
    } catch {
      set({ ...UNAUTHENTICATED_USER, isLoading: false });
    }
  },

  login: (returnUrl?: string) => {
    let safeReturnUrl = returnUrl ?? '/';
    try {
      const parsed = new URL(safeReturnUrl, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        safeReturnUrl = '/';
      }
    } catch {
      safeReturnUrl = '/';
    }
    window.location.href = `/bff/login?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
  },

  logout: async () => {
    try {
      await fetch('/bff/logout', { method: 'POST' });
    } finally {
      set(UNAUTHENTICATED_USER);
      window.location.href = '/';
    }
  },
}));

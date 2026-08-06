import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';

// Save original location so we can restore it
const originalLocation = window.location;

beforeEach(() => {
  // Reset the store to its initial state before each test
  useAuthStore.setState({
    isAuthenticated: false,
    userName: '',
    buyerId: '',
    isLoading: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Restore window.location if it was replaced
  if (window.location !== originalLocation) {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  }
});

describe('authStore', () => {
  it('has isAuthenticated=false in initial state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it('fetchUser hydrates state from /bff/user on success', async () => {
    const mockUser = {
      isAuthenticated: true,
      userName: 'testuser',
      buyerId: 'buyer-123',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      }),
    );

    await useAuthStore.getState().fetchUser();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.userName).toBe('testuser');
    expect(state.buyerId).toBe('buyer-123');
    expect(state.isLoading).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/bff/user');
  });

  it('fetchUser handles a failed response gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    await useAuthStore.getState().fetchUser();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userName).toBe('');
    expect(state.buyerId).toBe('');
    expect(state.isLoading).toBe(false);
  });

  it('fetchUser handles a network error gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    await useAuthStore.getState().fetchUser();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('login redirects to /bff/login with default returnUrl', () => {
    const mockLocation = { href: '', origin: 'http://localhost:3000' } as Location;
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    useAuthStore.getState().login();
    expect(window.location.href).toBe('/bff/login?returnUrl=%2F');
  });

  it('login includes returnUrl when provided', () => {
    const mockLocation = { href: '', origin: 'http://localhost:3000' } as Location;
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    useAuthStore.getState().login('/checkout');
    expect(window.location.href).toBe('/bff/login?returnUrl=%2Fcheckout');
  });

  it('login rejects cross-origin returnUrl (open-redirect protection)', () => {
    const mockLocation = { href: '', origin: 'http://localhost:3000' } as Location;
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    useAuthStore.getState().login('https://evil.com/steal');
    expect(window.location.href).toBe('/bff/login?returnUrl=%2F');
  });

  it('logout posts to /bff/logout and resets state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true }),
    );

    const mockLocation = { href: '' } as Location;
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    useAuthStore.setState({ isAuthenticated: true, userName: 'testuser', buyerId: 'b1' });
    await useAuthStore.getState().logout();

    expect(fetch).toHaveBeenCalledWith('/bff/logout', { method: 'POST' });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.userName).toBe('');
    expect(state.buyerId).toBe('');
    expect(window.location.href).toBe('/');
  });

  it('logout resets state even when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const mockLocation = { href: '' } as Location;
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    useAuthStore.setState({ isAuthenticated: true, userName: 'testuser', buyerId: 'b1' });
    try {
      await useAuthStore.getState().logout();
    } catch {
      // expected — fetch threw, but finally block still runs
    }

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/');
  });
});

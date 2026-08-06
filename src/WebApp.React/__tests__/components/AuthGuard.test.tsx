import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test-utils';
import { AuthGuard } from '../../src/components/AuthGuard';
import { useAuthStore } from '../../src/stores/authStore';

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    userName: '',
    buyerId: '',
    isLoading: true,
  });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthGuard', () => {
  it('renders nothing while loading', () => {
    useAuthStore.setState({ isLoading: true, isAuthenticated: false });
    const { container } = render(<AuthGuard><p>Protected</p></AuthGuard>);
    expect(container.textContent).toBe('');
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const loginSpy = vi.fn();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, login: loginSpy } as any);

    const { container } = render(<AuthGuard><p>Protected</p></AuthGuard>);
    expect(container.textContent).toBe('');
    expect(loginSpy).toHaveBeenCalled();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: true, userName: 'testuser', buyerId: 'b1' });

    render(<AuthGuard><p>Protected</p></AuthGuard>);
    expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});

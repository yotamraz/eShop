import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../test-utils';
import { HeaderBar } from '../../src/components/HeaderBar';

beforeEach(() => {
  // UserMenu reads from authStore which may call fetch; stub it to avoid errors
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeaderBar', () => {
  it('renders the logo image with alt text', () => {
    render(<HeaderBar />);
    const logo = screen.getByAltText('AdventureWorks');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/logo-header.svg');
  });

  it('renders navigation elements including cart and sign-in links', () => {
    render(<HeaderBar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    // CartMenu renders a link with aria-label "cart"
    const cartLink = screen.getByRole('link', { name: /cart/i });
    expect(cartLink).toBeInTheDocument();

    // UserMenu renders a sign-in button when not authenticated
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });
});

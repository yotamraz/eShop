import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, render } from '@testing-library/react';
import { useAuthStore } from '../../src/stores/authStore';
import React from 'react';

import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ItemPage } from '../../src/features/item/ItemPage';

function renderItemPage(itemId = '42') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/item/${itemId}`]}>
        <Routes>
          <Route path="/item/:itemId" element={<ItemPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockItem = {
  id: 42,
  name: 'Trail Running Shoes',
  description: 'Lightweight trail shoes for all terrains',
  price: 89.99,
  pictureUrl: '/product-images/42',
  catalogBrandId: 1,
  catalogBrand: { id: 1, brand: 'Alpine' },
  catalogTypeId: 1,
  catalogType: { id: 1, type: 'Footwear' },
};

beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: false, userName: '', buyerId: '', isLoading: false });

  const titleEl = document.createElement('h1');
  titleEl.id = 'page-header-title';
  document.body.appendChild(titleEl);

  const subtitleEl = document.createElement('p');
  subtitleEl.id = 'page-header-subtitle';
  document.body.appendChild(subtitleEl);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('page-header-title')?.remove();
  document.getElementById('page-header-subtitle')?.remove();
});

describe('ItemPage', () => {
  it('renders product name and description', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockItem }));
    renderItemPage();
    expect(await screen.findByText('Trail Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Lightweight trail shoes for all terrains')).toBeInTheDocument();
  });

  it('shows "Add to shopping bag" when authenticated', async () => {
    useAuthStore.setState({ isAuthenticated: true, userName: 'testuser', buyerId: 'b1', isLoading: false });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockItem }));
    renderItemPage();
    expect(await screen.findByText(/add to shopping bag/i)).toBeInTheDocument();
  });

  it('shows "Log in to purchase" when not authenticated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockItem }));
    renderItemPage();
    expect(await screen.findByText(/log in to purchase/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderItemPage();
    expect(await screen.findByText(/couldn't find any such product/i)).toBeInTheDocument();
  });

  it('sets page header title on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockItem }));
    renderItemPage();
    await waitFor(() => {
      expect(document.getElementById('page-header-title')?.textContent).toBe('Trail Running Shoes');
    });
  });

  it('sets page header title to Not found on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    renderItemPage();
    await waitFor(() => {
      expect(document.getElementById('page-header-title')?.textContent).toBe('Not found');
    });
  });
});

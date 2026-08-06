import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';
import { CatalogPage } from '../../src/features/catalog/CatalogPage';
import type { CatalogResult, CatalogBrand, CatalogItemType } from '../../src/api/types';

// --- mock data ---

const mockCatalogResult: CatalogResult = {
  pageIndex: 0,
  pageSize: 9,
  count: 18,
  data: [
    {
      id: 1,
      name: 'Trail Running Shoes',
      description: 'Lightweight trail shoes',
      price: 89.99,
      pictureUrl: '/product-images/1',
      catalogBrandId: 1,
      catalogBrand: { id: 1, brand: 'Alpine' },
      catalogTypeId: 1,
      catalogType: { id: 1, type: 'Footwear' },
    },
    {
      id: 2,
      name: 'Hiking Backpack',
      description: 'A durable 40L backpack',
      price: 129.5,
      pictureUrl: '/product-images/2',
      catalogBrandId: 2,
      catalogBrand: { id: 2, brand: 'Summit' },
      catalogTypeId: 2,
      catalogType: { id: 2, type: 'Bags' },
    },
  ],
};

const mockBrands: CatalogBrand[] = [
  { id: 1, brand: 'Alpine' },
  { id: 2, brand: 'Summit' },
];

const mockTypes: CatalogItemType[] = [
  { id: 1, type: 'Footwear' },
  { id: 2, type: 'Bags' },
];

// --- helpers ---

/** Build a mock fetch that routes by URL pathname */
function createMockFetch() {
  return vi.fn().mockImplementation((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('/bff/catalog/items')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockCatalogResult,
      });
    }
    if (url.includes('/bff/catalog/brands')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockBrands,
      });
    }
    if (url.includes('/bff/catalog/types')) {
      return Promise.resolve({
        ok: true,
        json: async () => mockTypes,
      });
    }
    // fallback (e.g. /bff/user used by UserMenu through authStore)
    return Promise.resolve({
      ok: false,
      json: async () => ({}),
    });
  });
}

// --- setup ---

beforeEach(() => {
  // CatalogPage writes into these DOM elements via useEffect
  const titleEl = document.createElement('h1');
  titleEl.id = 'page-header-title';
  document.body.appendChild(titleEl);

  const subtitleEl = document.createElement('p');
  subtitleEl.id = 'page-header-subtitle';
  document.body.appendChild(subtitleEl);

  vi.stubGlobal('fetch', createMockFetch());
});

afterEach(() => {
  vi.restoreAllMocks();

  // Clean up the DOM elements we added
  document.getElementById('page-header-title')?.remove();
  document.getElementById('page-header-subtitle')?.remove();
});

// --- tests ---

describe('CatalogPage', () => {
  it('sets the heading "Ready for a new adventure?" via useEffect', async () => {
    render(<CatalogPage />);

    await waitFor(() => {
      const titleEl = document.getElementById('page-header-title');
      expect(titleEl?.textContent).toBe('Ready for a new adventure?');
    });
  });

  it('renders a product grid when data is loaded', async () => {
    render(<CatalogPage />);

    // Wait for the product names to appear (TanStack Query fetches asynchronously)
    expect(await screen.findByText('Trail Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Hiking Backpack')).toBeInTheDocument();
  });

  it('renders pagination page links for multi-page results', async () => {
    render(<CatalogPage />);

    // count=18 with PAGE_SIZE=9 yields 2 pages
    await waitFor(() => {
      const pageLinks = screen.getAllByRole('link').filter((el) => {
        const text = el.textContent?.trim();
        return text === '1' || text === '2';
      });
      expect(pageLinks.length).toBe(2);
    });
  });

  it('shows a loading indicator before data arrives', () => {
    // Use a fetch mock that never resolves to keep isLoading=true
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})),
    );

    render(<CatalogPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

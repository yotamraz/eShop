import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils';
import { CatalogSearch } from '../../src/features/catalog/CatalogSearch';

const mockBrands = [
  { id: 1, brand: 'Alpine' },
  { id: 2, brand: 'Summit' },
];

const mockTypes = [
  { id: 1, type: 'Footwear' },
  { id: 2, type: 'Bags' },
];

function createMockFetch() {
  return vi.fn().mockImplementation((input: string) => {
    if (input.includes('/bff/catalog/brands')) {
      return Promise.resolve({ ok: true, json: async () => mockBrands });
    }
    if (input.includes('/bff/catalog/types')) {
      return Promise.resolve({ ok: true, json: async () => mockTypes });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', createMockFetch());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CatalogSearch', () => {
  it('renders nothing before data loads', () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));
    const { container } = render(<CatalogSearch />);
    expect(container.querySelector('.catalogSearch')).not.toBeInTheDocument();
  });

  it('renders brand and type filter groups', async () => {
    render(<CatalogSearch />);
    expect(await screen.findByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Alpine')).toBeInTheDocument();
    expect(screen.getByText('Summit')).toBeInTheDocument();
    expect(screen.getByText('Footwear')).toBeInTheDocument();
    expect(screen.getByText('Bags')).toBeInTheDocument();
  });

  it('renders All links for both groups', async () => {
    render(<CatalogSearch />);
    await screen.findByText('Brand');
    const allLinks = screen.getAllByText('All');
    expect(allLinks.length).toBe(2);
  });

  it('highlights the selected brand', async () => {
    render(<CatalogSearch brandId={1} />);
    const alpine = await screen.findByText('Alpine');
    expect(alpine.className).toMatch(/active/);
  });

  it('highlights All when no brand is selected', async () => {
    render(<CatalogSearch />);
    await screen.findByText('Brand');
    const allLinks = screen.getAllByText('All');
    expect(allLinks[0].className).toMatch(/active/);
  });

  it('highlights the selected type', async () => {
    render(<CatalogSearch itemTypeId={2} />);
    const bags = await screen.findByText('Bags');
    expect(bags.className).toMatch(/active/);
  });
});

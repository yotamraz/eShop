import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCatalogItems, getCatalogItem, getBrands, getTypes } from '../../src/api/catalogApi';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('catalogApi', () => {
  describe('getCatalogItems', () => {
    it('fetches items with correct URL params', async () => {
      const mockResult = { pageIndex: 0, pageSize: 9, count: 1, data: [] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockResult }));

      const result = await getCatalogItems(0, 2, 3, 9);
      expect(result).toEqual(mockResult);
      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('pageIndex=0');
      expect(url).toContain('pageSize=9');
      expect(url).toContain('brand=2');
      expect(url).toContain('type=3');
    });

    it('omits brand and type when not provided', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

      await getCatalogItems(0);
      const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).not.toContain('brand=');
      expect(url).not.toContain('type=');
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      await expect(getCatalogItems(0)).rejects.toThrow('Failed to fetch catalog items: 500');
    });
  });

  describe('getCatalogItem', () => {
    it('fetches a single item by id', async () => {
      const mockItem = { id: 42, name: 'Test Item' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockItem }));

      const result = await getCatalogItem(42);
      expect(result).toEqual(mockItem);
      expect(fetch).toHaveBeenCalledWith('/bff/catalog/items/42');
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
      await expect(getCatalogItem(999)).rejects.toThrow('Failed to fetch catalog item 999: 404');
    });
  });

  describe('getBrands', () => {
    it('fetches brands', async () => {
      const mockBrands = [{ id: 1, brand: 'Alpine' }];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockBrands }));

      const result = await getBrands();
      expect(result).toEqual(mockBrands);
      expect(fetch).toHaveBeenCalledWith('/bff/catalog/brands');
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      await expect(getBrands()).rejects.toThrow('Failed to fetch brands: 500');
    });
  });

  describe('getTypes', () => {
    it('fetches types', async () => {
      const mockTypes = [{ id: 1, type: 'Footwear' }];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => mockTypes }));

      const result = await getTypes();
      expect(result).toEqual(mockTypes);
      expect(fetch).toHaveBeenCalledWith('/bff/catalog/types');
    });

    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
      await expect(getTypes()).rejects.toThrow('Failed to fetch types: 500');
    });
  });
});

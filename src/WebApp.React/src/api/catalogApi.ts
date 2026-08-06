import type { CatalogItem, CatalogResult, CatalogBrand, CatalogItemType } from './types';

const BASE_URL = '/bff/catalog';

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label}: ${response.status}`);
  }
  return response.json();
}

export async function getCatalogItems(
  pageIndex: number,
  brand?: number | null,
  type?: number | null,
  pageSize: number = 9
): Promise<CatalogResult> {
  const params = new URLSearchParams();
  params.set('pageIndex', String(pageIndex));
  params.set('pageSize', String(pageSize));
  if (brand != null) {
    params.set('brand', String(brand));
  }
  if (type != null) {
    params.set('type', String(type));
  }
  return fetchJson<CatalogResult>(`${BASE_URL}/items?${params}`, 'Failed to fetch catalog items');
}

export async function getCatalogItem(id: number): Promise<CatalogItem> {
  return fetchJson<CatalogItem>(`${BASE_URL}/items/${id}`, `Failed to fetch catalog item ${id}`);
}

export async function getBrands(): Promise<CatalogBrand[]> {
  return fetchJson<CatalogBrand[]>(`${BASE_URL}/brands`, 'Failed to fetch brands');
}

export async function getTypes(): Promise<CatalogItemType[]> {
  return fetchJson<CatalogItemType[]>(`${BASE_URL}/types`, 'Failed to fetch types');
}

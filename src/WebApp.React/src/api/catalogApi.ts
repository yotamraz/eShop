import type { CatalogItem, CatalogResult, CatalogBrand, CatalogItemType } from './types';

const BASE_URL = '/bff/catalog';

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
  const response = await fetch(`${BASE_URL}/items?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog items: ${response.status}`);
  }
  return response.json();
}

export async function getCatalogItem(id: number): Promise<CatalogItem> {
  const response = await fetch(`${BASE_URL}/items/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog item ${id}: ${response.status}`);
  }
  return response.json();
}

export async function getBrands(): Promise<CatalogBrand[]> {
  const response = await fetch(`${BASE_URL}/brands`);
  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.status}`);
  }
  return response.json();
}

export async function getTypes(): Promise<CatalogItemType[]> {
  const response = await fetch(`${BASE_URL}/types`);
  if (!response.ok) {
    throw new Error(`Failed to fetch types: ${response.status}`);
  }
  return response.json();
}

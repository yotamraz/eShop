export interface CatalogItem {
  id: number;
  name: string;
  description: string;
  price: number;
  pictureUrl: string;
  catalogBrandId: number;
  catalogBrand: CatalogBrand;
  catalogTypeId: number;
  catalogType: CatalogItemType;
}

export interface CatalogResult {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: CatalogItem[];
}

export interface CatalogBrand {
  id: number;
  brand: string;
}

export interface CatalogItemType {
  id: number;
  type: string;
}

export interface BasketItem {
  id: string;
  productId: number;
  productName: string;
  unitPrice: number;
  oldUnitPrice: number;
  quantity: number;
  pictureUrl: string;
}

export interface UserInfo {
  isAuthenticated: boolean;
  userName: string;
  buyerId: string;
}

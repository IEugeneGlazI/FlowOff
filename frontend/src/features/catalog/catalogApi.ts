import type { Category, ColorReference, FlowerInReference, Product, ProductType, Promotion } from '../../entities/catalog';
import { apiRequest } from '../../shared/api';

export async function getCategories() {
  return apiRequest<Category[]>('/Categories');
}

export async function getColors() {
  return apiRequest<ColorReference[]>('/Colors');
}

export async function getFlowerIns() {
  return apiRequest<FlowerInReference[]>('/FlowerIns');
}

export async function getPromotions() {
  return apiRequest<Promotion[]>('/Promotions');
}

export async function getProducts(filter: {
  type?: ProductType | 'All';
  categoryId?: string | null;
  colorId?: string | null;
  flowerInId?: string | null;
}) {
  const params = new URLSearchParams();

  if (filter.type && filter.type !== 'All') {
    params.set('type', filter.type);
  }

  if (filter.categoryId) {
    params.set('categoryId', filter.categoryId);
  }

  if (filter.colorId) {
    params.set('colorId', filter.colorId);
  }

  if (filter.flowerInId) {
    params.set('flowerInId', filter.flowerInId);
  }

  const query = params.toString();
  return apiRequest<Product[]>(`/Products${query ? `?${query}` : ''}`);
}

export async function getProductById(productId: string) {
  return apiRequest<Product>(`/Products/${productId}`);
}

import type { Category, ColorReference, FlowerInReference, Product, ProductType, Promotion } from '../../entities/catalog';
import { apiRequest } from '../../shared/api';

type ProductMutationPayload = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  isVisible: boolean;
  type?: ProductType;
  categoryId?: string | null;
  flowerInId?: string | null;
  colorId?: string | null;
  flowerInIds?: string[];
  colorIds?: string[];
};

export async function getCategories() {
  return apiRequest<Category[]>('/Categories');
}

export async function createCategory(payload: { name: string; description?: string | null }, token: string) {
  return apiRequest<Category>('/Categories', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(categoryId: string, payload: { name: string; description?: string | null }, token: string) {
  return apiRequest<Category>(`/Categories/${categoryId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(categoryId: string, token: string) {
  return apiRequest<void>(`/Categories/${categoryId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getColors() {
  return apiRequest<ColorReference[]>('/Colors');
}

export async function createColor(payload: { name: string }, token: string) {
  return apiRequest<ColorReference>('/Colors', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateColor(colorId: string, payload: { name: string }, token: string) {
  return apiRequest<ColorReference>(`/Colors/${colorId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteColor(colorId: string, token: string) {
  return apiRequest<void>(`/Colors/${colorId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getFlowerIns() {
  return apiRequest<FlowerInReference[]>('/FlowerIns');
}

export async function createFlowerIn(payload: { name: string }, token: string) {
  return apiRequest<FlowerInReference>('/FlowerIns', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateFlowerIn(flowerInId: string, payload: { name: string }, token: string) {
  return apiRequest<FlowerInReference>(`/FlowerIns/${flowerInId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteFlowerIn(flowerInId: string, token: string) {
  return apiRequest<void>(`/FlowerIns/${flowerInId}`, {
    method: 'DELETE',
    token,
  });
}

export async function getPromotions() {
  return apiRequest<Promotion[]>('/Promotions');
}

export async function getProducts(filter: {
  type?: ProductType | 'All';
  categoryId?: string | null;
  colorId?: string | null;
  flowerInId?: string | null;
  includeHidden?: boolean;
  token?: string | null;
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

  if (filter.includeHidden) {
    params.set('includeHidden', 'true');
  }

  const query = params.toString();
  return apiRequest<Product[]>(`/Products${query ? `?${query}` : ''}`, { token: filter.token });
}

export async function getProductById(productId: string) {
  return apiRequest<Product>(`/Products/${productId}`);
}

export async function createProduct(payload: ProductMutationPayload, token: string) {
  return apiRequest<Product>('/Products', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(productId: string, payload: ProductMutationPayload, token: string) {
  return apiRequest<Product>(`/Products/${productId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
}

export async function uploadProductImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ imageUrl: string }>('/Products/upload-image', {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function deleteProduct(productId: string, token: string) {
  return apiRequest<void>(`/Products/${productId}`, {
    method: 'DELETE',
    token,
  });
}

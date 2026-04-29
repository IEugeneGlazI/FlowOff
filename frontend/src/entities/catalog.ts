export type ProductType = 'Flower' | 'Bouquet';

export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  type: ProductType;
  isShowcase: boolean;
  categoryId: string;
  categoryName?: string | null;
};

export type Promotion = {
  id: string;
  title: string;
  description?: string | null;
  discountPercent: number;
  startsAtUtc: string;
  endsAtUtc: string;
  isActive: boolean;
};

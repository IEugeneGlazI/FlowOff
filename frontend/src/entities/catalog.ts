export type ProductType = 'Flower' | 'Bouquet' | 'Gift';

export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export type ColorReference = {
  id: string;
  name: string;
};

export type FlowerInReference = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  type: ProductType;
  categoryId?: string | null;
  categoryName?: string | null;
  flowerInId?: string | null;
  flowerInName?: string | null;
  colorId?: string | null;
  colorName?: string | null;
  flowerInIds?: string[];
  flowerInNames?: string[];
  colorIds?: string[];
  colorNames?: string[];
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

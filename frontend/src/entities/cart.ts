export type CartItem = {
  productId: string;
  productType: 'Flower' | 'Bouquet' | 'Gift';
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Cart = {
  id: string;
  customerId: string;
  totalAmount: number;
  items: CartItem[];
};

export type Order = {
  id: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  createdAtUtc: string;
  deliveryAddress?: string | null;
  courierId?: string | null;
  paymentStatus?: string | null;
  items: {
    productId: string;
    productType: 'Flower' | 'Bouquet' | 'Gift';
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
};

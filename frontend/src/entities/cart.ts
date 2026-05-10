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
  orderNumber?: number;
  customerId?: string;
  customerEmail?: string;
  customerFullName?: string;
  status: string;
  deliveryMethod: string;
  totalAmount: number;
  createdAtUtc: string;
  deliveryAddress?: string | null;
  floristId?: string | null;
  floristEmail?: string | null;
  floristFullName?: string | null;
  courierId?: string | null;
  courierEmail?: string | null;
  courierFullName?: string | null;
  deliveryStatus?: string | null;
  paymentStatus?: string | null;
  paymentProvider?: string | null;
  paidAtUtc?: string | null;
  items: {
    productId: string;
    productType: 'Flower' | 'Bouquet' | 'Gift';
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
};

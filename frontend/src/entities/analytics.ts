export type AnalyticsSummary = {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  paidOrders: number;
  pendingPaymentOrders: number;
  openSupportRequests: number;
  uniqueCustomers: number;
  revenue: number;
  averageOrderValue: number;
};

export type RevenuePeriodMetric = {
  key: string;
  label: string;
  ordersCount: number;
  revenue: number;
  averageOrderValue: number;
};

export type TrendPoint = {
  label: string;
  periodStartUtc: string;
  ordersCount: number;
  revenue: number;
};

export type StatusMetric = {
  label: string;
  count: number;
};

export type ProductTypeAnalytics = {
  productType: string;
  itemsSold: number;
  ordersCount: number;
  revenue: number;
};

export type TopProductAnalytics = {
  productId: string;
  productType: 'Bouquet' | 'Flower' | 'Gift' | string;
  productName: string;
  quantitySold: number;
  ordersCount: number;
  revenue: number;
};

export type EmployeePerformance = {
  employeeId: string;
  fullName: string;
  email: string;
  totalAssignedOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueHandled: number;
  completionRatePercent: number;
};

export type AdminAnalytics = {
  generatedAtUtc: string;
  dateFrom: string;
  dateTo: string;
  trendGranularity: 'daily' | 'monthly' | string;
  summary: AnalyticsSummary;
  revenueByPeriods: RevenuePeriodMetric[];
  revenueTrend: TrendPoint[];
  orderStatuses: StatusMetric[];
  deliveryStatuses: StatusMetric[];
  paymentStatuses: StatusMetric[];
  deliveryMethods: StatusMetric[];
  productTypes: ProductTypeAnalytics[];
  topProducts: TopProductAnalytics[];
  florists: EmployeePerformance[];
  couriers: EmployeePerformance[];
};

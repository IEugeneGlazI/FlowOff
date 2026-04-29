import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { StorefrontPage } from '../pages/storefront/StorefrontPage';
import { ProductPage } from '../pages/product/ProductPage';
import { CartPage } from '../pages/cart/CartPage';
import { AccountPage } from '../pages/account/AccountPage';
import { OrdersPage } from '../pages/orders/OrdersPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/bouquets" replace />} />
        <Route path="/bouquets" element={<StorefrontPage />} />
        <Route path="/flowers" element={<StorefrontPage />} />
        <Route path="/gifts" element={<StorefrontPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="*" element={<Navigate to="/bouquets" replace />} />
      </Route>
    </Routes>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Cart } from '../../entities/cart';
import { apiRequest, ApiError } from '../../shared/api';
import { useAuth } from '../auth/AuthContext';

type CartContextValue = {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!session?.token || session.role !== 'Customer') {
      setCart(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiRequest<Cart>('/Cart', {
        token: session.token,
      });
      setCart(result);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'Не удалось загрузить корзину.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  async function addItem(productId: string, quantity: number) {
    if (!session?.token) {
      throw new ApiError('Чтобы добавить товар в корзину, нужно войти в аккаунт.', 401);
    }

    const result = await apiRequest<Cart>('/Cart/items', {
      method: 'POST',
      token: session.token,
      body: JSON.stringify({ productId, quantity }),
    });
    setCart(result);
  }

  async function updateItem(productId: string, quantity: number) {
    if (!session?.token) {
      throw new ApiError('Чтобы изменить корзину, нужно войти в аккаунт.', 401);
    }

    const result = quantity === 0
      ? await apiRequest<void>(`/Cart/items/${productId}`, {
          method: 'DELETE',
          token: session.token,
        }).then(() => null)
      : await apiRequest<Cart>('/Cart/items', {
          method: 'PUT',
          token: session.token,
          body: JSON.stringify({ productId, quantity }),
        });

    if (result) {
      setCart(result);
    } else {
      await refreshCart();
    }
  }

  async function clearCart() {
    if (!session?.token) {
      return;
    }

    await apiRequest<void>('/Cart', {
      method: 'DELETE',
      token: session.token,
    });
    setCart({
      id: '',
      customerId: '',
      totalAmount: 0,
      items: [],
    });
  }

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      error,
      refreshCart,
      addItem,
      updateItem,
      clearCart,
    }),
    [cart, isLoading, error, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}

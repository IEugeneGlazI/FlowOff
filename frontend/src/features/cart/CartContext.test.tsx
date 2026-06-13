import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider, useCart } from './CartContext';

const apiRequestMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock('../../shared/api', () => ({
  ApiError: class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function TestConsumer() {
  const { cart, isLoading, error, addItem, clearCart } = useCart();
  const [actionError, setActionError] = useState('');

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="action-error">{actionError}</div>
      <div data-testid="count">{cart?.items.length ?? -1}</div>
      <button
        type="button"
        onClick={() =>
          void addItem('product-1', 2).catch((requestError: Error) => {
            setActionError(requestError.message);
          })
        }
      >
        add
      </button>
      <button type="button" onClick={() => void clearCart()}>
        clear
      </button>
    </div>
  );
}

describe('Контекст корзины', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    useAuthMock.mockReset();
  });

  it('загружает корзину при монтировании для авторизованного покупателя', async () => {
    useAuthMock.mockReturnValue({
      session: {
        token: 'token-1',
        role: 'Customer',
      },
    });
    apiRequestMock.mockResolvedValue({
      id: 'cart-1',
      customerId: 'customer-1',
      totalAmount: 1000,
      items: [{ productId: 'product-1', quantity: 1 }],
    });

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(apiRequestMock).toHaveBeenCalledWith('/Cart', { token: 'token-1' });
  });

  it('не запрашивает корзину для пользователя без роли покупателя и сбрасывает состояние корзины', async () => {
    useAuthMock.mockReturnValue({
      session: {
        token: 'token-1',
        role: 'Administrator',
      },
    });

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('-1'));
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('возвращает ошибку при попытке добавить товар без токена авторизации', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ session: null });

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(() => expect(screen.getByTestId('action-error')).not.toHaveTextContent(''));
  });

  it('очищает корзину после успешного запроса на удаление', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({
      session: {
        token: 'token-1',
        role: 'Customer',
      },
    });
    apiRequestMock
      .mockResolvedValueOnce({
        id: 'cart-1',
        customerId: 'customer-1',
        totalAmount: 1200,
        items: [{ productId: 'product-1', quantity: 2 }],
      })
      .mockResolvedValueOnce(undefined);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    await user.click(screen.getByRole('button', { name: 'clear' }));

    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));
    expect(apiRequestMock).toHaveBeenLastCalledWith('/Cart', {
      method: 'DELETE',
      token: 'token-1',
    });
  });
});

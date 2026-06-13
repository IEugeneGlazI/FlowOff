import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersPage } from './OrdersPage';

const useAuthMock = vi.fn();
const apiRequestMock = vi.fn();

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../shared/api', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

vi.mock('../../shared/ProductImage', () => ({
  ProductImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <OrdersPage />
    </MemoryRouter>,
  );
}

function createOrder(overrides: Partial<import('../../entities/cart').Order> = {}) {
  return {
    id: 'order-1',
    orderNumber: 123,
    status: 'Активен',
    deliveryMethod: 'Delivery',
    totalAmount: 2500,
    createdAtUtc: '2026-06-13T10:00:00Z',
    deliveryAddress: 'Москва',
    deliveryStatus: 'Заказ на рассмотрении',
    paymentStatus: 'Оплачен',
    items: [
      {
        productId: 'product-1',
        productType: 'Bouquet',
        productName: 'Букет 1',
        unitPrice: 2500,
        quantity: 1,
        imageUrl: null,
      },
    ],
    ...overrides,
  };
}

describe('Страница заказов', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    apiRequestMock.mockReset();
  });

  it('отображает приглашение ко входу для неавторизованного пользователя', () => {
    useAuthMock.mockReturnValue({ session: null });

    renderPage();

    expect(screen.getByRole('link', { name: /аккаунт/i })).toHaveAttribute('href', '/account');
  });

  it('загружает и отображает активные заказы авторизованного пользователя', async () => {
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    apiRequestMock.mockResolvedValue([createOrder()]);

    renderPage();

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith('/Orders/my', { token: 'token-1' }));
    expect(await screen.findByText(/000123/)).toBeInTheDocument();
    expect(screen.getByText('Букет 1')).toBeInTheDocument();
  });

  it('переключается на вкладку завершенных заказов и отображает их', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    apiRequestMock.mockResolvedValue([
      createOrder({ id: 'order-1', orderNumber: 101, status: 'Активен' }),
      createOrder({ id: 'order-2', orderNumber: 202, status: 'Завершен' }),
    ]);

    renderPage();

    expect(await screen.findByText(/000101/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /заверш/i }));

    expect(await screen.findByText(/000202/)).toBeInTheDocument();
  });

  it('показывает пустое состояние при отсутствии активных заказов', async () => {
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    apiRequestMock.mockResolvedValue([createOrder({ status: 'Завершен' })]);

    renderPage();

    expect(await screen.findByText(/нет активных заказов/i)).toBeInTheDocument();
  });
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartPage } from './CartPage';

const useCartMock = vi.fn();
const useAuthMock = vi.fn();
const getPromotionsMock = vi.fn();
const getAddressSuggestionsMock = vi.fn();
const apiRequestMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('../../features/cart/CartContext', () => ({
  useCart: () => useCartMock(),
}));

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../features/catalog/catalogApi', () => ({
  getPromotions: () => getPromotionsMock(),
}));

vi.mock('../../features/address/addressApi', () => ({
  getAddressSuggestions: (...args: unknown[]) => getAddressSuggestionsMock(...args),
}));

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

vi.mock('../../shared/ProductImage', () => ({
  ProductImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );
}

function createCart() {
  return {
    id: 'cart-1',
    customerId: 'customer-1',
    totalAmount: 1000,
    items: [
      {
        productId: 'product-1',
        productType: 'Bouquet' as const,
        productName: 'Букет 1',
        unitPrice: 1000,
        quantity: 1,
        lineTotal: 1000,
        imageUrl: null,
      },
    ],
  };
}

describe('Страница корзины', () => {
  beforeEach(() => {
    useCartMock.mockReset();
    useAuthMock.mockReset();
    getPromotionsMock.mockReset();
    getAddressSuggestionsMock.mockReset();
    apiRequestMock.mockReset();
    navigateMock.mockReset();
    getPromotionsMock.mockResolvedValue([]);
    getAddressSuggestionsMock.mockResolvedValue([]);
  });

  it('отображает приглашение ко входу для неавторизованного пользователя', async () => {
    useAuthMock.mockReturnValue({ session: null });
    useCartMock.mockReturnValue({
      cart: null,
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole('link', { name: /вход/i })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: /каталог/i })).toHaveAttribute('href', '/bouquets');
  });

  it('отображает пустое состояние, если в корзине нет товаров', async () => {
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    useCartMock.mockReturnValue({
      cart: { id: 'cart-1', customerId: 'customer-1', totalAmount: 0, items: [] },
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    renderPage();

    const links = await screen.findAllByRole('link', { name: /покупк/i });
    expect(links[0]).toHaveAttribute('href', '/bouquets');
  });

  it('показывает предупреждение и не оформляет доставку без адреса', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    useCartMock.mockReturnValue({
      cart: createCart(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    renderPage();

    await user.click(await screen.findByRole('button', { name: /оформить заказ/i }));

    expect(apiRequestMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('открывает диалог подтверждения для заказа с самовывозом', async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    useCartMock.mockReturnValue({
      cart: createCart(),
      updateItem: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn(),
    });

    renderPage();

    await user.click(await screen.findByRole('button', { name: /самовывоз/i }));
    await user.click(screen.getByRole('button', { name: /оформить заказ/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('оформляет подтвержденный заказ с самовывозом и выполняет переход на страницу заказов', async () => {
    const user = userEvent.setup();
    const updateItem = vi.fn().mockResolvedValue(undefined);
    const refreshCart = vi.fn().mockResolvedValue(undefined);

    useAuthMock.mockReturnValue({ session: { token: 'token-1', role: 'Customer' } });
    useCartMock.mockReturnValue({
      cart: createCart(),
      updateItem,
      clearCart: vi.fn(),
      refreshCart,
    });
    apiRequestMock.mockResolvedValue({});

    renderPage();

    await user.click(await screen.findByRole('button', { name: /самовывоз/i }));
    await user.click(screen.getByRole('button', { name: /оформить заказ/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /подтвердить/i }));

    await waitFor(() => expect(apiRequestMock).toHaveBeenCalledWith('/Orders', expect.objectContaining({
      method: 'POST',
      token: 'token-1',
    })));
    expect(updateItem).toHaveBeenCalledWith('product-1', 0);
    expect(refreshCart).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/orders');
  });
});

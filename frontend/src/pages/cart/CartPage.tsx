import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../features/cart/CartContext';
import { useAuth } from '../../features/auth/AuthContext';
import { formatCurrency } from '../../shared/format';
import { apiRequest, ApiError } from '../../shared/api';

type DeliveryMethod = 'Delivery' | 'Pickup';

export function CartPage() {
  const { cart, updateItem, clearCart, refreshCart } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [payOnPickup, setPayOnPickup] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckout = useMemo(() => Boolean(session?.token && cart && cart.items.length > 0), [session, cart]);

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.token || !cart || cart.items.length === 0) {
      setFeedback('Для оформления заказа нужна авторизация покупателя и хотя бы один товар в корзине.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await apiRequest('/Orders', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({
          deliveryMethod,
          deliveryAddress: deliveryMethod === 'Delivery' ? deliveryAddress : null,
          payOnPickup,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      await clearCart();
      await refreshCart();
      navigate('/orders');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось оформить заказ.';
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session) {
    return (
      <div className="panel empty-panel">
        <h1>Корзина доступна после входа</h1>
        <p>Для customer-сценария нужно войти в систему и получить JWT-токен.</p>
        <Link to="/account" className="primary-button link-button-solid">
          Перейти ко входу
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <section className="panel">
        <div className="panel-heading">
          <h1>Корзина</h1>
          <span className="section-note">{cart?.items.length ?? 0} позиций</span>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="empty-panel">
            <p>Корзина пока пустая.</p>
            <Link to="/" className="link-button">
              Вернуться в каталог
            </Link>
          </div>
        ) : (
          <div className="cart-items">
            {cart.items.map((item) => (
              <article key={item.productId} className="cart-item">
                <div>
                  <h3>{item.productName}</h3>
                  <p>{formatCurrency(item.unitPrice)} за единицу</p>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-picker compact">
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => void updateItem(item.productId, Math.max(0, item.quantity - 1))}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => void updateItem(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatCurrency(item.lineTotal)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="panel checkout-panel">
        <h2>Оформление заказа</h2>
        <form className="checkout-form" onSubmit={handleCheckout}>
          <div>
            <label className="field-label">Способ получения</label>
            <div className="segmented">
              <button
                type="button"
                className={deliveryMethod === 'Delivery' ? 'segment active' : 'segment'}
                onClick={() => setDeliveryMethod('Delivery')}
              >
                Доставка
              </button>
              <button
                type="button"
                className={deliveryMethod === 'Pickup' ? 'segment active' : 'segment'}
                onClick={() => setDeliveryMethod('Pickup')}
              >
                Самовывоз
              </button>
            </div>
          </div>

          {deliveryMethod === 'Delivery' ? (
            <div>
              <label className="field-label" htmlFor="delivery-address">
                Адрес доставки
              </label>
              <textarea
                id="delivery-address"
                className="text-area"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
                placeholder="Город, улица, дом, подъезд, комментарий"
              />
            </div>
          ) : (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={payOnPickup}
                onChange={(event) => setPayOnPickup(event.target.checked)}
              />
              Оплатить при получении
            </label>
          )}

          <div className="checkout-summary">
            <span>Итого</span>
            <strong>{formatCurrency(cart?.totalAmount ?? 0)}</strong>
          </div>

          <button type="submit" className="primary-button wide-button" disabled={!canCheckout || isSubmitting}>
            {isSubmitting ? 'Оформляем...' : 'Оформить заказ'}
          </button>

          {feedback ? <p className="helper-text">{feedback}</p> : null}
        </form>
      </aside>
    </div>
  );
}

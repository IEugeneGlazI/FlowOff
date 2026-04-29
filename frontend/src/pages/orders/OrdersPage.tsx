import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '../../entities/cart';
import { useAuth } from '../../features/auth/AuthContext';
import { apiRequest } from '../../shared/api';
import { formatCurrency, formatDate } from '../../shared/format';

export function OrdersPage() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!session?.token) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    void apiRequest<Order[]>('/Orders/my', { token: session.token })
      .then(setOrders)
      .finally(() => setIsLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="panel empty-panel">
        <h1>История заказов доступна после входа</h1>
        <Link to="/account" className="primary-button link-button-solid">
          Перейти ко входу
        </Link>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h1>Мои заказы</h1>
        <span className="section-note">Customer endpoint `/api/orders/my`</span>
      </div>

      {isLoading ? <div className="loading-state">Загружаем заказы...</div> : null}

      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <div className="order-card-head">
              <div>
                <h3>Заказ {order.id.slice(0, 8)}</h3>
                <p>{formatDate(order.createdAtUtc)}</p>
              </div>
              <div className="order-summary">
                <span className="status-chip">{order.status}</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
            </div>

            <div className="order-meta">
              <span>Получение: {order.deliveryMethod}</span>
              <span>Оплата: {order.paymentStatus || 'Не указано'}</span>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div key={item.productId} className="order-item-row">
                  <span>
                    {item.productName} x {item.quantity}
                  </span>
                  <strong>{formatCurrency(item.unitPrice * item.quantity)}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}

        {!isLoading && orders.length === 0 ? (
          <div className="empty-panel">Пока нет оформленных заказов.</div>
        ) : null}
      </div>
    </section>
  );
}

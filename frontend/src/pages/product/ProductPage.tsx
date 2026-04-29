import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import type { Product } from '../../entities/catalog';
import { getProductById } from '../../features/catalog/catalogApi';
import { useCart } from '../../features/cart/CartContext';
import { ApiError } from '../../shared/api';
import { formatCurrency } from '../../shared/format';

export function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    if (!productId) {
      return;
    }

    void getProductById(productId).then(setProduct);
  }, [productId]);

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    try {
      await addItem(product.id, quantity);
      setFeedback('Товар добавлен в корзину.');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Не удалось добавить товар в корзину.';
      setFeedback(message);
    }
  }

  if (!product) {
    return <div className="panel">Загружаем карточку товара...</div>;
  }

  return (
    <div className="details-layout">
      <div className="details-main panel">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Назад к каталогу
        </Link>

        <div className="details-header">
          <div>
            <span className="type-badge">{product.type === 'Flower' ? 'Цветок' : 'Букет'}</span>
            <h1>{product.name}</h1>
            <p className="details-description">
              {product.description || 'Подробное описание для этой позиции пока не добавлено.'}
            </p>
          </div>
          <div className="details-price-block">
            <strong>{formatCurrency(product.price)}</strong>
            <span>{product.categoryName || 'Без категории'}</span>
          </div>
        </div>

        <div className="details-specs">
          <div>
            <span className="spec-label">Остаток</span>
            <strong>{product.stockQuantity}</strong>
          </div>
          <div>
            <span className="spec-label">Витринная позиция</span>
            <strong>{product.isShowcase ? 'Да' : 'Нет'}</strong>
          </div>
        </div>
      </div>

      <aside className="details-side panel">
        <h2>Добавить в корзину</h2>
        <div className="quantity-picker">
          <button type="button" className="icon-button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            -
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setQuantity((value) => Math.min(product.stockQuantity || 1, value + 1))}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="primary-button wide-button"
          disabled={product.stockQuantity === 0}
          onClick={() => void handleAddToCart()}
        >
          <ShoppingBag size={16} />
          Добавить
        </button>

        {feedback ? <p className="helper-text">{feedback}</p> : null}
      </aside>
    </div>
  );
}

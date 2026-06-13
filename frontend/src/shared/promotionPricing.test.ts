import { describe, expect, it } from 'vitest';
import type { Promotion } from '../entities/catalog';
import { getPromotionPricing, getPromotionState, isPromotionActive } from './promotionPricing';

function createPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: 'promotion-1',
    title: 'Promo',
    discountPercent: 10,
    startsAtUtc: '2026-06-10T00:00:00Z',
    endsAtUtc: '2026-06-20T00:00:00Z',
    isActive: true,
    bouquetIds: [],
    flowerIds: [],
    giftIds: [],
    ...overrides,
  };
}

describe('Логика акций', () => {
  it('возвращает состояние запланированной акции, если акция еще не началась', () => {
    const promotion = createPromotion({
      startsAtUtc: '2026-06-20T00:00:00Z',
      endsAtUtc: '2026-06-30T00:00:00Z',
    });

    expect(getPromotionState(promotion, new Date('2026-06-15T00:00:00Z'))).toBe('scheduled');
  });

  it('возвращает состояние отключенной акции, если акция неактивна', () => {
    const promotion = createPromotion({ isActive: false });

    expect(getPromotionState(promotion, new Date('2026-06-15T00:00:00Z'))).toBe('disabled');
  });

  it('возвращает состояние завершенной акции, если срок ее действия истек', () => {
    const promotion = createPromotion({
      startsAtUtc: '2026-06-01T00:00:00Z',
      endsAtUtc: '2026-06-05T00:00:00Z',
    });

    expect(getPromotionState(promotion, new Date('2026-06-15T00:00:00Z'))).toBe('completed');
  });

  it('корректно определяет активную акцию', () => {
    const promotion = createPromotion();

    expect(isPromotionActive(promotion, new Date('2026-06-15T00:00:00Z'))).toBe(true);
  });

  it('применяет максимальную активную скидку для подходящего товара', () => {
    const promotions = [
      createPromotion({ id: 'promotion-1', discountPercent: 10, bouquetIds: ['product-1'] }),
      createPromotion({ id: 'promotion-2', discountPercent: 25, bouquetIds: ['product-1'] }),
      createPromotion({ id: 'promotion-3', discountPercent: 50, bouquetIds: ['product-2'] }),
    ];

    const result = getPromotionPricing(
      {
        id: 'product-1',
        type: 'Bouquet',
        price: 1000,
      },
      promotions,
    );

    expect(result).toEqual({
      originalPrice: 1000,
      discountedPrice: 750,
      discountPercent: 25,
      hasDiscount: true,
    });
  });

  it('возвращает исходную цену, если для товара нет подходящих акций', () => {
    const result = getPromotionPricing(
      {
        id: 'gift-1',
        type: 'Gift',
        price: 500,
      },
      [createPromotion({ bouquetIds: ['other-id'] })],
    );

    expect(result.discountedPrice).toBe(500);
    expect(result.discountPercent).toBe(0);
    expect(result.hasDiscount).toBe(false);
  });
});

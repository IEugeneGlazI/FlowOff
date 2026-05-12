import type { ProductType, Promotion } from '../entities/catalog';

type PromotionProductTarget = {
  id: string;
  type: ProductType;
  price: number;
};

export type PromotionPricing = {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
};

function isPromotionActive(promotion: Promotion, now = new Date()) {
  if (!promotion.isActive) {
    return false;
  }

  const startsAt = new Date(promotion.startsAtUtc);
  const endsAt = new Date(promotion.endsAtUtc);
  return startsAt <= now && now <= endsAt;
}

function appliesToProduct(target: PromotionProductTarget, promotion: Promotion) {
  if (target.type === 'Bouquet') {
    return promotion.bouquetIds?.includes(target.id) ?? false;
  }

  if (target.type === 'Flower') {
    return promotion.flowerIds?.includes(target.id) ?? false;
  }

  return promotion.giftIds?.includes(target.id) ?? false;
}

export function getPromotionPricing(
  target: PromotionProductTarget,
  promotions: Promotion[],
): PromotionPricing {
  const activePromotion = promotions
    .filter((promotion) => isPromotionActive(promotion) && appliesToProduct(target, promotion))
    .sort((left, right) => right.discountPercent - left.discountPercent)[0];

  if (!activePromotion || activePromotion.discountPercent <= 0) {
    return {
      originalPrice: target.price,
      discountedPrice: target.price,
      discountPercent: 0,
      hasDiscount: false,
    };
  }

  const discountedPrice = Number((target.price * (1 - activePromotion.discountPercent / 100)).toFixed(2));

  return {
    originalPrice: target.price,
    discountedPrice,
    discountPercent: activePromotion.discountPercent,
    hasDiscount: discountedPrice < target.price,
  };
}

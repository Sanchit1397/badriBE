export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  active: boolean;
}

export function calculateDiscountedPrice(originalPrice: number, discount?: Discount): number {
  if (!discount || !discount.active) return originalPrice;

  if (discount.type === 'percentage') {
    return originalPrice * (1 - discount.value / 100);
  }
  return Math.max(0, originalPrice - discount.value);
}

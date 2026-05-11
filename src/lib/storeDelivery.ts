import { getSettingValue } from '../services/settingsService';

/**
 * Compute delivery fee from store settings (subtotal excludes delivery).
 * If free_delivery_threshold is 0, free-delivery-by-subtotal is disabled.
 */
export async function computeDeliveryFeeForSubtotal(subtotal: number): Promise<number> {
  const baseFee = await getSettingValue<number>('delivery_base_fee', 50);
  const freeThreshold = await getSettingValue<number>('free_delivery_threshold', 0);
  if (freeThreshold > 0 && subtotal >= freeThreshold) {
    return 0;
  }
  return Math.max(0, baseFee);
}

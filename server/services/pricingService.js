import Coupon from '../models/Coupon.js';
import { ApiError } from '../middleware/auth.js';
import { roundMoney } from '../utils/helpers.js';

export function calculateDeliveryFee({ subtotal, fulfillmentType, settings }) {
  if (fulfillmentType === 'takeaway') return 0;
  if (settings.freeDeliveryThreshold > 0 && subtotal >= settings.freeDeliveryThreshold) return 0;
  return roundMoney(settings.deliveryFee || 0);
}

export async function evaluateCoupon({ code, subtotal }) {
  if (!code) return { coupon: null, discount: 0 };
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon || !coupon.isActive) throw new ApiError(400, 'This coupon code is not valid.');
  if (coupon.expiresAt.getTime() < Date.now()) throw new ApiError(400, 'This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'This coupon has reached its usage limit.');
  }
  if (subtotal < coupon.minOrder) {
    throw new ApiError(400, `Coupon ${coupon.code} requires a minimum order of Rs ${coupon.minOrder}.`);
  }

  let discount =
    coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : Number(coupon.value);
  if (coupon.type === 'percentage' && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = roundMoney(Math.min(discount, subtotal));

  return { coupon, discount };
}

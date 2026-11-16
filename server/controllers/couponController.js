import Coupon from '../models/Coupon.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';
import { evaluateCoupon } from '../services/pricingService.js';

export const listActiveCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
    .sort({ minOrder: 1 })
    .select('code description type value minOrder maxDiscount expiresAt usageLimit usedCount');
  res.json({ success: true, coupons });
});

export const validateCoupon = asyncHandler(async (req, res) => {  const { code = '', subtotal = 0 } = req.body;
  try {
    const { coupon, discount } = await evaluateCoupon({ code, subtotal: Number(subtotal) || 0 });
    if (!coupon) return res.json({ success: true, valid: false, message: 'Enter a coupon code.' });
    res.json({
      success: true,
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discount,
      message: `Coupon ${coupon.code} applied — you saved Rs ${discount}.`,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.json({ success: true, valid: false, message: error.message });
    }
    throw error;
  }
});

export const adminListCoupons = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const search = String(req.query.search || '');
  const filter = search ? { code: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Coupon.countDocuments(filter),
  ]);
  res.json({ success: true, coupons, total, page, pages: Math.ceil(total / limit) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const existing = await Coupon.findOne({ code: req.body.code });
  if (existing) throw new ApiError(409, 'A coupon with this code already exists.');
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  if (req.body.code && req.body.code !== coupon.code) {
    const clash = await Coupon.findOne({ code: req.body.code, _id: { $ne: coupon._id } });
    if (clash) throw new ApiError(409, 'A coupon with this code already exists.');
  }
  Object.assign(coupon, req.body);
  await coupon.save();
  res.json({ success: true, coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  res.json({ success: true, message: 'Coupon deleted.' });
});

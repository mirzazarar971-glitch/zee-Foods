import { Router } from 'express';
import { validateCoupon, listActiveCoupons } from '../controllers/couponController.js';

const router = Router();
router.get('/active', listActiveCoupons);
router.post('/validate', validateCoupon);

export default router;

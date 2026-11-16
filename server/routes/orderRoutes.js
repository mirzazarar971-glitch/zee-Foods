import { Router } from 'express';
import {
  createOrder,
  myOrders,
  myOrder,
  cancelMyOrder,
  trackOrder,
} from '../controllers/orderController.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema, trackQuerySchema } from '../utils/schemas.js';

const router = Router();

router.post('/', optionalAuth, validate(orderSchema), createOrder);
router.get('/track', validate(trackQuerySchema, 'query'), trackOrder);
router.get('/mine', protect, myOrders);
router.get('/mine/:id', protect, myOrder);
router.patch('/mine/:id/cancel', protect, cancelMyOrder);

export default router;

import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  categorySchema,
  couponSchema,
  orderStatusSchema,
  settingsSchema,
} from '../utils/schemas.js';
import { getDashboardStats, listCustomers, getCustomer } from '../controllers/adminController.js';
import { adminListProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import {
  adminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
} from '../controllers/orderController.js';
import {
  adminListCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { adminListReviews, deleteReview } from '../controllers/reviewController.js';
import {
  listConversations,
  getConversation,
  deleteConversation,
  chatbotStatus,
} from '../controllers/chatbotController.js';
import {
  getSettings,
  updateSettings,
  createFaq,
  updateFaq,
  deleteFaq,
} from '../controllers/settingsController.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);

router.get('/products', adminListProducts);
router.post('/products', uploadImage, createProduct);
router.put('/products/:id', uploadImage, updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/categories', adminCategories);
router.post('/categories', validate(categorySchema), createCategory);
router.put('/categories/:id', validate(categorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/orders', adminListOrders);
router.get('/orders/:id', adminGetOrder);
router.patch('/orders/:id/status', validate(orderStatusSchema), adminUpdateOrderStatus);

router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);

router.get('/coupons', adminListCoupons);
router.post('/coupons', validate(couponSchema), createCoupon);
router.put('/coupons/:id', validate(couponSchema), updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/reviews', adminListReviews);
router.delete('/reviews/:id', deleteReview);

router.get('/chatbot/status', chatbotStatus);
router.get('/chatbot/conversations', listConversations);
router.get('/chatbot/conversations/:id', getConversation);
router.delete('/chatbot/conversations/:id', deleteConversation);

router.get('/settings', getSettings);
router.put('/settings', validate(settingsSchema), updateSettings);

router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

export default router;

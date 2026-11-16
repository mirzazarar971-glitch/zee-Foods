import { Router } from 'express';
import { listProductReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../utils/schemas.js';

const router = Router();
router.get('/product/:productId', listProductReviews);
router.post('/', protect, validate(reviewSchema), createReview);
router.delete('/:id', protect, deleteReview);

export default router;

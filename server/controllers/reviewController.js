import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

async function refreshProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.rating * 10) / 10 : 0,
    numReviews: stats?.count || 0,
  });
}

export const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, isApproved: true })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('name rating comment createdAt');
  res.json({ success: true, reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw new ApiError(409, 'You have already reviewed this item.');

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  });
  await refreshProductRating(product._id);
  res.status(201).json({ success: true, review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  const isOwner = review.user.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not allowed.');
  await review.deleteOne();
  await refreshProductRating(review.product);
  res.json({ success: true, message: 'Review removed.' });
});

export const adminListReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 15;
  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('product', 'name image')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(),
  ]);
  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
});

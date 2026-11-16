import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler, parseJSONField, slugify } from '../utils/helpers.js';

const SORT_OPTIONS = {
  recommended: { isFeatured: -1, isPopular: -1, sortOrder: 1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  newest: { createdAt: -1 },
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function uniqueSlug(name, currentId = null) {
  const base = slugify(name) || `item-${Date.now()}`;
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, _id: { $ne: currentId } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 12));
  const { search = '', sort = 'recommended', category = '', featured, popular, available } = req.query;

  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
  }
  if (category && category !== 'all') {
    const found = await Category.findOne({ slug: category });
    if (!found) return res.json({ success: true, items: [], total: 0, page, pages: 0 });
    filter.category = found._id;
  }
  if (featured === 'true') filter.isFeatured = true;
  if (popular === 'true') filter.isPopular = true;
  if (available === 'true') filter.isAvailable = true;

  const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.recommended;
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v'),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found.');
  const related = await Product.find({ category: product.category?._id, _id: { $ne: product._id } })
    .limit(4)
    .populate('category', 'name slug');
  res.json({ success: true, product, related });
});

const parseList = (value, fallback = []) => {
  const parsed = parseJSONField(value, null);
  if (Array.isArray(parsed)) return parsed;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return fallback;
};

const buildProductPayload = (body, file) => {
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);

  if (!name) throw new ApiError(422, 'Product name is required.');
  if (!description) throw new ApiError(422, 'Product description is required.');
  if (!Number.isFinite(price) || price < 0) throw new ApiError(422, 'Enter a valid price.');
  if (!body.category) throw new ApiError(422, 'Choose a category.');

  const variants = parseList(body.variants, [])
    .map((variant) => ({ name: String(variant.name || '').trim(), priceDelta: Number(variant.priceDelta) || 0 }))
    .filter((variant) => variant.name);
  const addons = parseList(body.addons, [])
    .map((addon) => ({ name: String(addon.name || '').trim(), price: Number(addon.price) || 0 }))
    .filter((addon) => addon.name);

  return {
    name,
    description,
    category: body.category,
    price,
    compareAtPrice: Number(body.compareAtPrice) || 0,
    image: file ? `/uploads/${file.filename}` : String(body.image || '').trim(),
    ingredients: parseList(body.ingredients, []).map(String),
    tags: parseList(body.tags, []).map(String),
    variants,
    addons,
    isAvailable: body.isAvailable === 'false' ? false : body.isAvailable === 'true' ? true : Boolean(body.isAvailable),
    isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
    isPopular: body.isPopular === 'true' || body.isPopular === true,
    prepTime: Number(body.prepTime) || 20,
    serves: String(body.serves || '1 person').trim(),
    sortOrder: Number(body.sortOrder) || 0,
  };
};

export const createProduct = asyncHandler(async (req, res) => {
  const payload = buildProductPayload(req.body, req.file);
  const category = await Category.findById(payload.category);
  if (!category) throw new ApiError(422, 'Selected category does not exist.');
  payload.slug = await uniqueSlug(payload.name);
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  const payload = buildProductPayload(req.body, req.file);
  if (!req.file && !payload.image) payload.image = product.image;
  if (product.name !== payload.name) payload.slug = await uniqueSlug(payload.name, product._id);
  if (req.body.isAvailable === undefined) delete payload.isAvailable;
  if (req.body.isFeatured === undefined) delete payload.isFeatured;
  if (req.body.isPopular === undefined) delete payload.isPopular;
  Object.assign(product, payload);
  await product.save();
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  await Review.deleteMany({ product: product._id });
  res.json({ success: true, message: 'Product deleted.' });
});

export const adminListProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12));
  const { search = '', category = '' } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { tags: rx }];
  }
  if (category && category !== 'all') filter.category = category;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

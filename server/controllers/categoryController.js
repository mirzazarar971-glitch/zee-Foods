import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler, slugify } from '../utils/helpers.js';

async function uniqueCategorySlug(name, currentId = null) {
  const base = slugify(name) || `category-${Date.now()}`;
  let slug = base;
  let counter = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await Category.exists({ slug, _id: { $ne: currentId } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export const publicCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  const counts = await Product.aggregate([
    { $match: { isAvailable: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
  res.json({
    success: true,
    categories: categories.map((category) => ({
      ...category.toObject(),
      productCount: countMap.get(category._id.toString()) || 0,
    })),
  });
});

export const adminCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
  res.json({
    success: true,
    categories: categories.map((category) => ({
      ...category.toObject(),
      productCount: countMap.get(category._id.toString()) || 0,
    })),
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, sortOrder, isActive } = req.body;
  const existing = await Category.findOne({ name });
  if (existing) throw new ApiError(409, 'A category with this name already exists.');
  const category = await Category.create({
    name,
    slug: await uniqueCategorySlug(name),
    description,
    image,
    sortOrder,
    isActive,
  });
  res.status(201).json({ success: true, category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  const { name, description, image, sortOrder, isActive } = req.body;
  if (name && name !== category.name) {
    const clash = await Category.findOne({ name, _id: { $ne: category._id } });
    if (clash) throw new ApiError(409, 'A category with this name already exists.');
    category.name = name;
    category.slug = await uniqueCategorySlug(name, category._id);
  }
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;
  await category.save();
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw new ApiError(400, `Move or delete the ${productCount} product(s) in this category first.`);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, message: 'Category deleted.' });
});

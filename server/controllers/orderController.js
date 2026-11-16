import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import RestaurantSettings from '../models/RestaurantSettings.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler, generateOrderNumber, roundMoney } from '../utils/helpers.js';
import { calculateDeliveryFee, evaluateCoupon } from '../services/pricingService.js';
import { STATUS_LABELS } from '../config/constants.js';

const digits = (value = '') => String(value).replace(/\D/g, '');
const maskPhone = (value = '') => {
  const cleaned = digits(value);
  return cleaned.length >= 4 ? `${cleaned.slice(0, 4)}•••${cleaned.slice(-3)}` : '••••';
};

async function buildOrderItems(inputItems) {
  const ids = [...new Set(inputItems.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: ids } });
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  return inputItems.map((input) => {
    const product = productMap.get(String(input.productId));
    if (!product) throw new ApiError(400, 'One of the items in your cart is no longer available.');
    if (!product.isAvailable) throw new ApiError(400, `${product.name} is currently unavailable.`);

    let variant = null;
    if (input.variantName) {
      variant = product.variants.find((entry) => entry.name === input.variantName);
      if (!variant) throw new ApiError(400, `Invalid size selected for ${product.name}.`);
    }

    const addons = input.addonNames
      .map((name) => product.addons.find((entry) => entry.name === name))
      .filter(Boolean)
      .map((entry) => ({ name: entry.name, price: entry.price }));

    const unitPrice = roundMoney(product.price + (variant?.priceDelta || 0));
    const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
    const lineTotal = roundMoney((unitPrice + addonTotal) * input.quantity);

    return {
      product: product._id,
      name: product.name,
      image: product.image,
      unitPrice,
      quantity: input.quantity,
      variant: { name: variant?.name || '', price: variant?.priceDelta || 0 },
      addons,
      instructions: input.instructions || '',
      lineTotal,
    };
  });
}

export const createOrder = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.getMain();
  const { customer, fulfillmentType, address, items, couponCode, paymentMethod } = req.body;

  if (paymentMethod === 'online' && !settings.onlinePaymentEnabled) {
    throw new ApiError(400, 'Online payment is not available right now. Please choose Cash on Delivery.');
  }

  const orderItems = await buildOrderItems(items);
  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));

  if (subtotal < settings.minOrder) {
    throw new ApiError(400, `Minimum order value is Rs ${settings.minOrder}. Please add a little more.`);
  }

  const { coupon, discount } = await evaluateCoupon({ code: couponCode, subtotal });
  const deliveryFee = calculateDeliveryFee({ subtotal, fulfillmentType, settings });
  const total = roundMoney(subtotal - discount + deliveryFee);

  let orderNumber = generateOrderNumber();
  // eslint-disable-next-line no-await-in-loop
  while (await Order.exists({ orderNumber })) orderNumber = generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: req.user?._id || null,
    customer,
    fulfillmentType,
    address,
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    couponCode: coupon?.code || '',
    paymentMethod,
    paymentStatus: 'pending',
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Order placed', at: new Date() }],
    estimatedDeliveryMins: settings.deliveryTimeMins,
  });

  if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });

  res.status(201).json({
    success: true,
    order,
    paymentNote:
      paymentMethod === 'online'
        ? 'Our team will share a secure payment link on WhatsApp before dispatch.'
        : 'Please keep the exact amount ready for the rider.',
  });
});

export const myOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-statusHistory -__v'),
    Order.countDocuments({ user: req.user._id }),
  ]);
  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

export const myOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, order });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new ApiError(400, 'This order is already being prepared and can no longer be cancelled online. Please call us.');
  }
  order.status = 'cancelled';
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', note: order.cancellationReason, at: new Date() });
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
  await order.save();
  res.json({ success: true, order });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber, phone } = req.query;
  const order = await Order.findOne({ orderNumber });
  if (!order) throw new ApiError(404, 'No order found with that number. Please check and try again.');

  const storedPhone = digits(order.customer.phone);
  const providedPhone = digits(phone);
  if (!storedPhone.endsWith(providedPhone.slice(-10)) || providedPhone.length < 10) {
    throw new ApiError(403, 'The phone number does not match this order.');
  }

  res.json({
    success: true,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory,
      items: order.items.map((item) => ({
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        variant: item.variant?.name,
        lineTotal: item.lineTotal,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      fulfillmentType: order.fulfillmentType,
      createdAt: order.createdAt,
      estimatedDeliveryMins: order.estimatedDeliveryMins,
      customerName: order.customer.name.split(' ')[0],
      phone: maskPhone(order.customer.phone),
      city: order.address?.city || '',
    },
  });
});

export const adminListOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const { status = 'all', search = '', from = '', to = '' } = req.query;

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00`);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59`);
  }

  const [orders, total, statusCounts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('orderNumber customer items total status paymentMethod paymentStatus fulfillmentType createdAt'),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
    statusCounts: Object.fromEntries(statusCounts.map((entry) => [entry._id, entry.count])),
  });
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, order });
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const { status, note, paymentStatus } = req.body;
  if (status !== order.status) {
    order.status = status;
    order.statusHistory.push({ status, note: note || `Status changed to ${STATUS_LABELS[status]}`, at: new Date() });
  } else if (note) {
    order.statusHistory.push({ status, note, at: new Date() });
  }

  if (status === 'cancelled') {
    order.cancellationReason = note || order.cancellationReason || 'Cancelled by restaurant';
    if (!paymentStatus && order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
  }
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'paid';
  }
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();
  res.json({ success: true, order });
});

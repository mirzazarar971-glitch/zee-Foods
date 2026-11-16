import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler, roundMoney } from '../utils/helpers.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const keyOf = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const thirtyDaysAgo = addDays(todayStart, -30);
  const validOrders = { status: { $ne: 'cancelled' } };

  const [revenueAgg, totalOrders, totalCustomers, totalProducts, pendingOrders, todayAgg, statusAgg, recentOrders, seriesOrders, popularProducts, deliveredCount] =
    await Promise.all([
      Order.aggregate([{ $match: validOrders }, { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } }),
      Order.aggregate([
        { $match: { ...validOrders, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.find().sort({ createdAt: -1 }).limit(8).select('orderNumber customer total status paymentMethod fulfillmentType createdAt'),
      Order.find({ ...validOrders, createdAt: { $gte: sixMonthsAgo } }).select('total createdAt').lean(),
      Order.aggregate([
        { $match: { ...validOrders, createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { quantity: -1 } },
        { $limit: 6 },
      ]),
      Order.countDocuments({ status: 'delivered' }),
    ]);

  const revenue = roundMoney(revenueAgg[0]?.revenue || 0);
  const validOrderCount = revenueAgg[0]?.count || 0;

  const daily = [];
  for (let i = 13; i >= 0; i -= 1) {
    const day = addDays(todayStart, -i);
    const key = keyOf(day);
    daily.push({ date: key, label: `${day.getDate()} ${MONTHS[day.getMonth()]}`, revenue: 0, orders: 0 });
  }
  const dailyIndex = new Map(daily.map((entry, index) => [entry.date, index]));
  for (const order of seriesOrders) {
    const created = new Date(order.createdAt);
    const index = dailyIndex.get(keyOf(created));
    if (index !== undefined) {
      daily[index].revenue = roundMoney(daily[index].revenue + order.total);
      daily[index].orders += 1;
    }
  }

  const mondayOffset = (todayStart.getDay() + 6) % 7;
  const thisMonday = addDays(todayStart, -mondayOffset);
  const weekly = [];
  for (let i = 7; i >= 0; i -= 1) {
    const start = addDays(thisMonday, -i * 7);
    weekly.push({ start: keyOf(start), label: `${start.getDate()} ${MONTHS[start.getMonth()]}`, revenue: 0, orders: 0 });
  }
  for (const order of seriesOrders) {
    const created = new Date(order.createdAt);
    for (let i = weekly.length - 1; i >= 0; i -= 1) {
      const bucketStart = addDays(thisMonday, -(weekly.length - 1 - i) * 7);
      if (created >= bucketStart) {
        weekly[i].revenue = roundMoney(weekly[i].revenue + order.total);
        weekly[i].orders += 1;
        break;
      }
    }
  }

  const monthly = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({ label: `${MONTHS[start.getMonth()]} ${String(start.getFullYear()).slice(2)}`, revenue: 0, orders: 0 });
  }
  for (const order of seriesOrders) {
    const created = new Date(order.createdAt);
    const diff = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    if (diff >= 0 && diff < 6) {
      const index = 5 - diff;
      monthly[index].revenue = roundMoney(monthly[index].revenue + order.total);
      monthly[index].orders += 1;
    }
  }

  const statusBreakdown = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(
    (status) => ({ status, count: statusAgg.find((entry) => entry._id === status)?.count || 0 })
  );

  res.json({
    success: true,
    kpis: {
      revenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders: deliveredCount,
      todayRevenue: roundMoney(todayAgg[0]?.revenue || 0),
      todayOrders: todayAgg[0]?.count || 0,
      averageOrderValue: validOrderCount ? roundMoney(revenue / validOrderCount) : 0,
    },
    daily,
    weekly,
    monthly,
    popularProducts,
    recentOrders,
    statusBreakdown,
  });
});

export const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 15;
  const search = String(req.query.search || '').trim();
  const filter = { role: 'customer' };
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  const ids = users.map((user) => user._id);
  const stats = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrderAt: { $max: '$createdAt' } } },
  ]);
  const statMap = new Map(stats.map((entry) => [entry._id.toString(), entry]));

  res.json({
    success: true,
    customers: users.map((user) => {
      const stat = statMap.get(user._id.toString());
      return {
        ...user.toSafeJSON(),
        orderCount: stat?.orders || 0,
        totalSpent: roundMoney(stat?.spent || 0),
        lastOrderAt: stat?.lastOrderAt || null,
      };
    }),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Customer not found.');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Customer not found.');
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, customer: user.toSafeJSON(), orders });
});

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Coupon from '../models/Coupon.js';
import Review from '../models/Review.js';
import ChatConversation from '../models/ChatConversation.js';
import RestaurantSettings from '../models/RestaurantSettings.js';
import { slugify, roundMoney } from './helpers.js';
import { categories, products, coupons, settings } from './seedData.js';

const demoUsers = [
  { name: 'Ali Raza', email: 'ali@example.com', phone: '03011234567', addresses: [{ label: 'Home', line1: 'House 24, Street 7, DHA Phase 5', city: 'Lahore', area: 'DHA Phase 5', phone: '03011234567', isDefault: true }] },
  { name: 'Sana Khan', email: 'sana@example.com', phone: '03022345678', addresses: [{ label: 'Home', line1: 'Flat 9-B, Askari 10', city: 'Lahore', area: 'Askari 10', phone: '03022345678', isDefault: true }] },
  { name: 'Hamza Sheikh', email: 'hamza@example.com', phone: '03033456789', addresses: [] },
  { name: 'Fatima Noor', email: 'fatima@example.com', phone: '03044567890', addresses: [] },
  { name: 'Usman Tariq', email: 'usman@example.com', phone: '03055678901', addresses: [] },
  { name: 'Ayesha Malik', email: 'ayesha@example.com', phone: '03066789012', addresses: [] },
  { name: 'Bilal Ahmed', email: 'bilal@example.com', phone: '03077890123', addresses: [] },
  { name: 'Zainab Rizvi', email: 'zainab@example.com', phone: '03088901234', addresses: [] },
];

const comments = {
  5: [
    'Absolutely delicious — the flavours were on point and delivery was quicker than expected.',
    'Our new family favourite. Generous portion and everything arrived hot and fresh.',
    'Ordered for the first time and I am impressed. Will definitely be back for more!',
    'The crunch, the sauce, the bun — everything was perfect. Five stars.',
    'Great value for the price, and the packaging was neat too.',
    'Tasted fresh and the spice level was just right. Highly recommended.',
    'Zee Foods never disappoints. Consistent quality every single time.',
    'Bohat zabardast taste hai, dobara zaroor order karunga.',
    'Quality behtareen thi aur delivery bhi time pe aayi. Shukriya Zee Foods!',
    'Paisay ki poora value hai — family ke liye best option.',
  ],
  4: [
    'Really good overall. Would love a slightly bigger portion next time.',
    'Tasty and well packed. Delivery took a little longer than promised.',
    'Solid choice for a quick meal — flavour was great.',
    'Achha tha, lekin thora zyada spicy ho sakta tha.',
  ],
  3: [
    'Decent taste but arrived slightly lukewarm. The flavour itself was fine.',
    'Average experience this time — usually it is better.',
  ],
};

let seedValue = 1337;
const rand = () => {
  seedValue = (seedValue * 16807) % 2147483647;
  return (seedValue - 1) / 2147483646;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const STATUS_SEQUENCE = {
  pending: ['pending'],
  confirmed: ['pending', 'confirmed'],
  preparing: ['pending', 'confirmed', 'preparing'],
  ready: ['pending', 'confirmed', 'preparing', 'ready'],
  out_for_delivery: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'],
  delivered: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'],
  cancelled: ['pending', 'cancelled'],
};

const STATUS_NOTES = {
  pending: 'Order received',
  confirmed: 'Order confirmed by restaurant',
  preparing: 'Kitchen is preparing your food',
  ready: 'Order packed and ready',
  out_for_delivery: 'Rider picked up your order',
  delivered: 'Order delivered',
  cancelled: 'Order cancelled',
};

async function createSampleOrders(productDocs, userDocs) {
  const offsets = [0.1, 0.3, 0.6, 1, 1.4, 2, 3, 4, 5, 7, 9, 12, 16, 21, 27, 34, 42, 52, 63, 78, 95, 120];
  const statuses = [
    'pending',
    'preparing',
    'out_for_delivery',
    'confirmed',
    'delivered',
    'ready',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'cancelled',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
    'delivered',
  ];

  const docs = offsets.map((daysAgo, index) => {
    const status = statuses[index] || 'delivered';
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 6) * 3600000);
    const customerUser = index < 6 ? userDocs[0] : pick(userDocs.slice(1));
    const itemCount = 1 + Math.floor(rand() * 3);
    const chosen = [];
    for (let i = 0; i < itemCount; i += 1) {
      const product = productDocs[Math.floor(rand() * productDocs.length)];
      if (chosen.some((entry) => entry._id.equals(product._id))) continue;
      chosen.push(product);
    }

    const items = chosen.map((product) => {
      const quantity = 1 + Math.floor(rand() * 2);
      const useVariant = product.variants.length > 1 && rand() > 0.5;
      const variant = useVariant ? product.variants[1] : null;
      const unitPrice = roundMoney(product.price + (variant?.priceDelta || 0));
      return {
        product: product._id,
        name: product.name,
        image: product.image,
        unitPrice,
        quantity,
        variant: { name: variant?.name || '', price: variant?.priceDelta || 0 },
        addons: [],
        instructions: '',
        lineTotal: roundMoney(unitPrice * quantity),
      };
    });

    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const deliveryFee = subtotal >= 2500 ? 0 : 149;
    const useWelcome = index === 4 || index === 11;
    const discount = useWelcome ? 200 : 0;
    const total = roundMoney(subtotal + deliveryFee - discount);
    const history = STATUS_SEQUENCE[status].map((entry, step) => ({
      status: entry,
      note: STATUS_NOTES[entry],
      at: new Date(createdAt.getTime() + step * 22 * 60000),
    }));

    const guestNames = ['Ahmed Raza', 'Maryam Javed', 'Saad Iqbal'];
    const isGuest = index > 13 && rand() > 0.6;
    const name = isGuest ? pick(guestNames) : customerUser.name;
    const phone = isGuest ? `0300${String(1000000 + Math.floor(rand() * 8999999))}` : customerUser.phone;

    return {
      orderNumber: `ZF-SEED${String(index + 1).padStart(2, '0')}`,
      user: isGuest ? null : customerUser._id,
      customer: { name, phone, email: isGuest ? '' : customerUser.email },
      fulfillmentType: index % 7 === 3 ? 'takeaway' : 'delivery',
      address: {
        line1: isGuest ? 'House 5, Block C, Model Town' : customerUser.addresses[0]?.line1 || 'House 18, Johar Town',
        city: 'Lahore',
        area: isGuest ? 'Model Town' : customerUser.addresses[0]?.area || 'Johar Town',
        notes: index % 5 === 0 ? 'Please call on arrival.' : '',
      },
      items,
      subtotal,
      deliveryFee: index % 7 === 3 ? 0 : deliveryFee,
      discount,
      total: index % 7 === 3 ? roundMoney(subtotal - discount) : total,
      couponCode: useWelcome ? 'WELCOME200' : '',
      paymentMethod: index === 2 ? 'online' : 'cod',
      paymentStatus: status === 'delivered' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
      status,
      statusHistory: history,
      cancellationReason: status === 'cancelled' ? 'Customer changed their mind' : '',
      estimatedDeliveryMins: 35,
      createdAt,
      updatedAt: history[history.length - 1].at,
      __v: 0,
    };
  });

  await Order.collection.insertMany(docs);
  await Coupon.updateOne({ code: 'WELCOME200' }, { $inc: { usedCount: 2 } });
  return docs.length;
}

export async function seedDatabase({ onlyIfEmpty = false } = {}) {
  if (onlyIfEmpty) {
    const existing = await Product.estimatedDocumentCount();
    if (existing > 0) {
      console.log('[seed] existing menu detected — skipping auto-seed');
      return false;
    }
  } else {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      ChatConversation.deleteMany({}),
      RestaurantSettings.deleteMany({}),
    ]);
  }

  // Build unique indexes before inserting so concurrent/restarted seed runs
  // cannot create duplicate category, product, user or coupon documents.
  await Promise.all([Category.init(), Product.init(), User.init(), Coupon.init()]);

  const categoryDocs = await Category.insertMany(
    categories.map((category) => ({ ...category, slug: slugify(category.name), isActive: true }))
  );  const categoryMap = new Map(categoryDocs.map((category) => [category.name, category._id]));

  const productDocs = await Product.insertMany(
    products.map((product) => ({
      ...product,
      slug: slugify(product.name),
      category: categoryMap.get(product.category),
      isAvailable: true,
    }))
  );

  const [admin, ...customerDocs] = await Promise.all([
    User.create({
      name: 'Zee Foods Admin',
      email: 'admin@zeefoods.pk',
      phone: '03001234567',
      password: 'Admin@123',
      role: 'admin',
    }),
    ...demoUsers.map((user) => User.create({ ...user, password: 'Customer@123', role: 'customer' })),
  ]);

  await Coupon.insertMany(coupons);
  await RestaurantSettings.create(settings);

  const reviewDocs = [];
  productDocs.forEach((product, productIndex) => {
    const count = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < count; i += 1) {
      const user = customerDocs[(productIndex + i) % customerDocs.length];
      const roll = rand();
      const rating = roll > 0.25 ? 5 : roll > 0.08 ? 4 : 3;
      reviewDocs.push({
        product: product._id,
        user: user._id,
        name: user.name,
        rating,
        comment: pick(comments[rating]),
        isApproved: true,
      });
    }
  });
  await Review.insertMany(reviewDocs);

  const ratingStats = await Review.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Promise.all(
    ratingStats.map((entry) =>
      Product.updateOne(
        { _id: entry._id },
        { rating: Math.round(entry.rating * 10) / 10, numReviews: entry.count }
      )
    )
  );

  const orderCount = await createSampleOrders(productDocs, customerDocs);

  await ChatConversation.insertMany([
    {
      sessionId: 'seed-session-ali-001',
      user: customerDocs[0]._id,
      provider: 'fallback',
      messages: [
        { role: 'user', content: 'Salam, do you deliver to DHA Phase 5?' },
        { role: 'assistant', content: 'Walaikum salam! Yes, we deliver across Lahore including DHA Phase 5. Delivery fee is Rs 149 and it is free above Rs 2,500.' },
        { role: 'user', content: 'What is the delivery time?' },
        { role: 'assistant', content: 'Our average delivery time is 30–40 minutes depending on your area and kitchen load.' },
      ],
      lastMessageAt: new Date(Date.now() - 86400000),
    },
    {
      sessionId: 'seed-session-guest-002',
      provider: 'fallback',
      messages: [
        { role: 'user', content: 'Zinger burger price kya hai?' },
        { role: 'assistant', content: 'Zinger Classic Rs 650 hai. Cheese Blast Rs 780 aur Zinger Tower Rs 950. Large Meal add-on bhi available hai.' },
        { role: 'user', content: 'Koi deal hai?' },
        { role: 'assistant', content: 'ZEE10 se 10% off (max Rs 400), WELCOME200 se Rs 200 off aur FEAST500 se Rs 500 off family orders par. Cart mein code apply karein.' },
      ],
      lastMessageAt: new Date(Date.now() - 3600000 * 5),
    },
  ]);

  console.log('\n[seed] Zee Foods database ready');
  console.log(`  • ${categoryDocs.length} categories`);
  console.log(`  • ${productDocs.length} products`);
  console.log(`  • ${customerDocs.length + 1} users (1 admin)`);
  console.log(`  • ${reviewDocs.length} reviews`);
  console.log(`  • ${orderCount} sample orders`);
  console.log('  • Admin login: admin@zeefoods.pk / Admin@123');
  console.log('  • Customer login: ali@example.com / Customer@123\n');
  return true;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await connectDB();
  try {
    await seedDatabase({ onlyIfEmpty: false });
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

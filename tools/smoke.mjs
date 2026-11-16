const BASE = process.env.API_URL || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

async function request(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(name, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
}

const health = await request('/health');
check('health endpoint', health.status === 200 && health.data.status === 'ok');

const products = await request('/products?limit=3');
check('product listing', products.status === 200 && products.data.items.length === 3);
check('seed total is 42', products.data.total === 42, `got ${products.data.total}`);

const slug = products.data.items[0]?.slug;
const detail = await request(`/products/${slug}`);
check('product detail', detail.status === 200 && detail.data.product.slug === slug);

const search = await request('/products?search=zinger&limit=20');
check('product search', search.status === 200 && search.data.total >= 3);

const categories = await request('/categories');
check('categories with counts', categories.status === 200 && categories.data.categories.length === 10);

const settings = await request('/settings/public');
check('public settings', settings.status === 200 && settings.data.settings.restaurantName === 'Zee Foods');

const coupons = await request('/coupons/active');
check('active coupons', coupons.status === 200 && coupons.data.coupons.length === 3);

const badCoupon = await request('/coupons/validate', { method: 'POST', body: { code: 'NOPE', subtotal: 2000 } });
check('invalid coupon handled', badCoupon.status === 200 && badCoupon.data.valid === false);

const goodCoupon = await request('/coupons/validate', { method: 'POST', body: { code: 'ZEE10', subtotal: 2000 } });
check('coupon discount applied', goodCoupon.data.valid === true && goodCoupon.data.discount === 200);

const adminLogin = await request('/auth/login', {
  method: 'POST',
  body: { email: 'admin@zeefoods.pk', password: 'Admin@123' },
});
check('admin login', adminLogin.status === 200 && adminLogin.data.user.role === 'admin');
const adminToken = adminLogin.data.token;

const stats = await request('/admin/stats', { token: adminToken });
check('admin stats', stats.status === 200 && stats.data.kpis.totalProducts === 42);
check('sales series present', stats.data.daily.length === 14 && stats.data.monthly.length === 6);

const customerLogin = await request('/auth/login', {
  method: 'POST',
  body: { email: 'ali@example.com', password: 'Customer@123' },
});
check('customer login', customerLogin.status === 200 && customerLogin.data.user.role === 'customer');
const customerToken = customerLogin.data.token;

const forbidden = await request('/admin/stats', { token: customerToken });
check('customer blocked from admin', forbidden.status === 403);

const myOrders = await request('/orders/mine', { token: customerToken });
check('customer order history', myOrders.status === 200 && myOrders.data.orders.length > 0);

const burger = products.data.items.find((item) => item.slug === 'zinger-classic') || products.data.items[0];
const order = await request('/orders', {
  method: 'POST',
  token: customerToken,
  body: {
    customer: { name: 'Ali Raza', phone: '03011234567', email: 'ali@example.com' },
    fulfillmentType: 'delivery',
    address: { line1: 'House 24, Street 7, DHA Phase 5', city: 'Lahore', area: 'DHA Phase 5', notes: 'Gate code 1234' },
    items: [{ productId: burger._id, quantity: 2, addonNames: [], instructions: 'Extra sauce please' }],
    couponCode: '',
    paymentMethod: 'cod',
  },
});
check('order creation', order.status === 201 && order.data.order.orderNumber.startsWith('ZF-'));
check(
  'server-side pricing',
  order.data.order && order.data.order.total === order.data.order.subtotal + order.data.order.deliveryFee,
  JSON.stringify(order.data)
);

const track = await request(`/orders/track?orderNumber=${order.data.order?.orderNumber}&phone=03011234567`);
check('order tracking', track.status === 200 && track.data.order.status === 'pending');

const badTrack = await request(`/orders/track?orderNumber=${order.data.order?.orderNumber}&phone=03099999999`);
check('tracking rejects wrong phone', badTrack.status === 403);

const chat1 = await request('/chatbot/message', {
  method: 'POST',
  body: { sessionId: 'smoke-test-session-1', message: 'Zinger burger kitna ka hai?' },
});
check('chatbot fallback (Roman Urdu)', chat1.status === 200 && /650/.test(chat1.data.reply), chat1.data.reply);

const chat2 = await request('/chatbot/message', {
  method: 'POST',
  body: { sessionId: 'smoke-test-session-1', message: `Track ${order.data.order?.orderNumber} 03011234567` },
});
check('chatbot secure order tracking', chat2.status === 200 && chat2.data.reply.includes(order.data.order?.orderNumber));

const chat3 = await request('/chatbot/message', {
  method: 'POST',
  body: { sessionId: 'smoke-test-session-1', message: 'What deals do you have?' },
});
check('chatbot deals', chat3.status === 200 && chat3.data.reply.includes('ZEE10'));

const newsletter = await request('/newsletter', { method: 'POST', body: { email: `smoke${Date.now()}@example.com` } });
check('newsletter subscribe', newsletter.status === 201);

const conversations = await request('/admin/chatbot/conversations', { token: adminToken });
check('admin chatbot conversations', conversations.status === 200 && conversations.data.conversations.length > 0);

const validation = await request('/auth/register', {
  method: 'POST',
  body: { name: 'A', email: 'bad', password: '123' },
});
check('input validation', validation.status === 422);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

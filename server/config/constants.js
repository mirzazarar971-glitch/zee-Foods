export const ROLES = { CUSTOMER: 'customer', ADMIN: 'admin' };

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_METHODS = ['cod', 'online'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

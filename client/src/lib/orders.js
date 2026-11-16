import { Bike, ChefHat, CheckCircle2, ClipboardCheck, Clock3, PackageCheck, ShoppingBag, XCircle } from 'lucide-react';

export const ORDER_STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock3, description: 'We have received your order.' },
  { key: 'confirmed', label: 'Confirmed', icon: ClipboardCheck, description: 'The restaurant confirmed your order.' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your food is being cooked fresh.' },
  { key: 'ready', label: 'Ready', icon: PackageCheck, description: 'Packed and ready for pickup.' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: Bike, description: 'The rider is on the way.' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Enjoy your meal!' },
];

export const STATUS_META = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmed', className: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  preparing: { label: 'Preparing', className: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  ready: { label: 'Ready', className: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  out_for_delivery: { label: 'Out for delivery', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  delivered: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
};

export const STATUS_OPTIONS = [
  ...ORDER_STEPS.map((step) => ({ value: step.key, label: step.label })),
  { value: 'cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_META = {
  pending: { label: 'Payment pending', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  failed: { label: 'Failed', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  refunded: { label: 'Refunded', className: 'bg-ink-100 text-ink-600 ring-ink-200' },
};

export const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on Delivery',
  online: 'Online payment',
};

export const isActiveStatus = (status) => !['delivered', 'cancelled'].includes(status);

export const placeholderImage = '/images/burger-classic.webp';

export const statusIcon = (status) => {
  if (status === 'cancelled') return XCircle;
  if (status === 'delivered') return ShoppingBag;
  return STATUS_META[status] ? ORDER_STEPS.find((step) => step.key === status)?.icon || Clock3 : Clock3;
};

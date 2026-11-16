import clsx from 'clsx';

export const cn = (...inputs) => clsx(inputs);

const pkrFormatter = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export const formatPKR = (value) => `Rs ${pkrFormatter.format(Math.round(Number(value) || 0))}`;

export const formatCompact = (value) => {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
  return String(number);
};

export const formatDate = (value, { time = true } = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(time ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
};

export const formatTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const discountPercent = (price, compareAtPrice) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizePhone = (value = '') => String(value).replace(/[\s-]/g, '');

export const todayHours = (openingHours = []) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return openingHours.find((entry) => entry.day === today) || null;
};

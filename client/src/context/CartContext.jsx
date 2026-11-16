import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const CartContext = createContext(null);
const STORAGE_KEY = 'zf_cart';

const buildKey = ({ productId, variantName = '', addons = [], instructions = '' }) =>
  [productId, variantName, [...addons.map((addon) => addon.name)].sort().join('|'), instructions.trim()]
    .join('::')
    .toLowerCase();

const readStoredCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.items)) return { items: [], coupon: null };
    return { items: parsed.items, coupon: parsed.coupon || null };
  } catch {
    return { items: [], coupon: null };
  }
};

export function CartProvider({ children }) {
  const initial = useRef(readStoredCart()).current;
  const [items, setItems] = useState(initial.items);
  const [coupon, setCoupon] = useState(initial.coupon);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, coupon }));
  }, [items, coupon]);

  const addItem = useCallback((payload) => {
    const quantity = Math.max(1, Math.min(20, Number(payload.quantity) || 1));
    const key = buildKey(payload);
    setItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item
        );
      }
      return [
        ...prev,
        {
          key,
          productId: payload.productId,
          slug: payload.slug,
          name: payload.name,
          image: payload.image,
          unitPrice: payload.unitPrice,
          compareAtPrice: payload.compareAtPrice || 0,
          variantName: payload.variantName || '',
          addons: payload.addons || [],
          instructions: payload.instructions || '',
          isAvailable: payload.isAvailable !== false,
          quantity,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    const nextQuantity = Math.max(0, Math.min(20, Number(quantity) || 0));
    setItems((prev) =>
      nextQuantity === 0
        ? prev.filter((item) => item.key !== key)
        : prev.map((item) => (item.key === key ? { ...item, quantity: nextQuantity } : item))
    );
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const subtotal = useMemo(
    () =>
      Math.round(
        items.reduce((sum, item) => {
          const addonTotal = item.addons.reduce((addonSum, addon) => addonSum + Number(addon.price || 0), 0);
          return sum + (item.unitPrice + addonTotal) * item.quantity;
        }, 0)
      ),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const applyCouponCode = useCallback(
    async (code) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) return { valid: false, message: 'Enter a coupon code.' };
      const { data } = await api.post('/coupons/validate', { code: trimmed, subtotal });
      if (data.valid) {
        setCoupon({ code: data.code, discount: data.discount, description: data.description || '' });
      } else {
        setCoupon(null);
      }
      return data;
    },
    [subtotal]
  );

  const removeCoupon = useCallback(() => setCoupon(null), []);

  useEffect(() => {
    if (!coupon?.code || subtotal <= 0) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      api
        .post('/coupons/validate', { code: coupon.code, subtotal })
        .then(({ data }) => {
          if (!active) return;
          if (!data.valid) {
            setCoupon(null);
            toast.error(data.message || 'Your coupon is no longer valid.');
          } else if (data.discount !== coupon.discount) {
            setCoupon({ code: data.code, discount: data.discount, description: data.description || '' });
          }
        })
        .catch(() => {});
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      coupon,
      discount: coupon?.discount || 0,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyCouponCode,
      removeCoupon,
    }),
    [items, count, subtotal, coupon, addItem, updateQuantity, removeItem, clearCart, applyCouponCode, removeCoupon]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};

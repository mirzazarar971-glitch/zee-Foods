import { z } from 'zod';

const phoneRegex = /^(\+?92|0)?3\d{9}$/;
const cleanPhone = (value) => String(value || '').replace(/[\s-]/g, '');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.preprocess(cleanPhone, z.string().regex(phoneRegex, 'Enter a valid Pakistani mobile number (e.g. 03001234567).').optional().or(z.literal(''))),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name.').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.preprocess(cleanPhone, z.string().regex(phoneRegex, 'Enter a valid mobile number.').optional().or(z.literal(''))),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').max(72),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  line1: z.string().trim().min(5, 'Address is required.').max(200),
  city: z.string().trim().min(2, 'City is required.').max(60),
  area: z.string().trim().max(80).optional(),
  phone: z.preprocess(cleanPhone, z.string().regex(phoneRegex, 'Enter a valid phone number.').optional().or(z.literal(''))),
  isDefault: z.coerce.boolean().optional(),
});

export const orderSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Please enter your name.').max(80),
      phone: z.preprocess(cleanPhone, z.string().regex(phoneRegex, 'Enter a valid mobile number.')),
      email: z.string().trim().toLowerCase().email('Enter a valid email.').optional().or(z.literal('')).default(''),
    }),
    fulfillmentType: z.enum(['delivery', 'takeaway']),
    address: z
      .object({
        line1: z.string().trim().max(200).default(''),
        city: z.string().trim().max(60).default(''),
        area: z.string().trim().max(80).default(''),
        notes: z.string().trim().max(500).default(''),
      })
      .default({ line1: '', city: '', area: '', notes: '' }),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.coerce.number().int().min(1).max(20),
          variantName: z.string().trim().max(60).optional().default(''),
          addonNames: z.array(z.string().max(60)).max(8).optional().default([]),
          instructions: z.string().trim().max(300).optional().default(''),
        })
      )
      .min(1, 'Your cart is empty.'),
    couponCode: z.string().trim().max(30).optional().default(''),
    paymentMethod: z.enum(['cod', 'online']),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== 'delivery' ||
      (data.address.line1.length >= 5 && data.address.city.length >= 2),
    { message: 'Delivery address and city are required.', path: ['address', 'line1'] }
  );

export const trackQuerySchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(4, 'Enter your order number.'),
  phone: z.preprocess(cleanPhone, z.string().regex(phoneRegex, 'Enter the phone number used for the order.')),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Choose a rating.').max(5),
  comment: z.string().trim().min(4, 'Please write a short review.').max(600),
});

export const chatMessageSchema = z.object({
  sessionId: z.string().trim().min(8, 'Invalid chat session.').max(64),
  message: z.string().trim().min(1, 'Type a message.').max(800),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(12)
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name is required.').max(60),
  description: z.string().trim().max(300).optional().default(''),
  image: z.string().trim().max(500).optional().default(''),
  sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
  isActive: z.preprocess((v) => v === true || v === 'true', z.boolean()).optional().default(true),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'Code must be at least 3 characters.')
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Use letters and numbers only.'),
  description: z.string().trim().max(160).optional().default(''),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(1, 'Discount value must be greater than zero.'),
  minOrder: z.coerce.number().min(0).optional().default(0),
  maxDiscount: z.coerce.number().min(0).optional().default(0),
  expiresAt: z.coerce.date({ invalid_type_error: 'Choose an expiry date.' }),
  usageLimit: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.preprocess((v) => v === true || v === 'true', z.boolean()).optional().default(true),
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  note: z.string().trim().max(300).optional().default(''),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
});

export const settingsSchema = z.object({
  restaurantName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(140),
  phone: z.string().trim().min(5).max(30),
  whatsapp: z.string().trim().min(5).max(30),
  email: z.string().trim().email(),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(60),
  deliveryFee: z.coerce.number().min(0),
  freeDeliveryThreshold: z.coerce.number().min(0),
  minOrder: z.coerce.number().min(0),
  deliveryTimeMins: z.coerce.number().min(5).max(180),
  onlinePaymentEnabled: z.coerce.boolean(),
  announcement: z.string().trim().max(160).optional().default(''),
  openingHours: z
    .array(
      z.object({
        day: z.string().min(2),
        open: z.string().trim().min(3),
        close: z.string().trim().min(3),
        closed: z.coerce.boolean().optional().default(false),
      })
    )
    .min(1),
  socials: z
    .object({
      facebook: z.string().trim().max(300).optional().default(''),
      instagram: z.string().trim().max(300).optional().default(''),
      tiktok: z.string().trim().max(300).optional().default(''),
      youtube: z.string().trim().max(300).optional().default(''),
    })
    .optional(),
  chatbot: z
    .object({
      enabled: z.coerce.boolean(),
      logConversations: z.coerce.boolean(),
      welcomeMessage: z.string().trim().max(300),
    })
    .optional(),
  faqs: z
    .array(
      z.object({
        _id: z.string().optional(),
        question: z.string().trim().min(4).max(200),
        answer: z.string().trim().min(4).max(1000),
        keywords: z.array(z.string().trim().max(40)).max(12).optional().default([]),
        isActive: z.coerce.boolean().optional().default(true),
      })
    )
    .optional(),
});

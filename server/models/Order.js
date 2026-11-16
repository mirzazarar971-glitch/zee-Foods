import mongoose from 'mongoose';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      name: { type: String, default: '' },
      price: { type: Number, default: 0 },
    },
    addons: [{ name: String, price: Number, _id: false }],
    instructions: { type: String, default: '', maxlength: 300 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
    fulfillmentType: { type: String, enum: ['delivery', 'takeaway'], default: 'delivery' },
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      area: { type: String, default: '' },
      notes: { type: String, default: '', maxlength: 500 },
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '', uppercase: true, trim: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cod' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        note: { type: String, default: '' },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    cancellationReason: { type: String, default: '' },
    estimatedDeliveryMins: { type: Number, default: 35 },
  },
  { timestamps: true }
);

orderSchema.index({ 'customer.phone': 1, orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);

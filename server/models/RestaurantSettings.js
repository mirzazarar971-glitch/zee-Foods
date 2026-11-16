import mongoose from 'mongoose';

const hoursSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    open: { type: String, default: '11:00' },
    close: { type: String, default: '02:00' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    keywords: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    restaurantName: { type: String, default: 'Zee Foods' },
    tagline: { type: String, default: 'Cravings? We’ve got you covered!' },
    phone: { type: String, default: '+92 300 1234567' },
    whatsapp: { type: String, default: '923001234567' },
    email: { type: String, default: 'hello@zeefoods.pk' },
    address: { type: String, default: 'Plot 12, Main Boulevard, Gulberg III, Lahore' },
    city: { type: String, default: 'Lahore' },
    openingHours: { type: [hoursSchema], default: [] },
    deliveryFee: { type: Number, default: 149 },
    freeDeliveryThreshold: { type: Number, default: 2500 },
    minOrder: { type: Number, default: 300 },
    deliveryTimeMins: { type: Number, default: 35 },
    onlinePaymentEnabled: { type: Boolean, default: false },
    announcement: { type: String, default: '' },
    socials: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    chatbot: {
      enabled: { type: Boolean, default: true },
      logConversations: { type: Boolean, default: true },
      welcomeMessage: {
        type: String,
        default: "Hi, I'm Zara from Zee Foods! Ask me about our menu, deals, delivery or order tracking. Aap Roman Urdu mein bhi pooch sakte hain.",
      },
    },
    faqs: { type: [faqSchema], default: [] },
  },
  { timestamps: true }
);

settingsSchema.statics.getMain = async function getMain() {
  let settings = await this.findOne({ key: 'main' });
  if (!settings) settings = await this.create({ key: 'main' });
  return settings;
};

export default mongoose.model('RestaurantSettings', settingsSchema);

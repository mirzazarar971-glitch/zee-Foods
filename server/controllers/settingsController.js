import RestaurantSettings from '../models/RestaurantSettings.js';
import { ApiError } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  const settings = await RestaurantSettings.getMain();
  res.json({
    success: true,
    settings: {
      restaurantName: settings.restaurantName,
      tagline: settings.tagline,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      address: settings.address,
      city: settings.city,
      openingHours: settings.openingHours,
      deliveryFee: settings.deliveryFee,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      minOrder: settings.minOrder,
      deliveryTimeMins: settings.deliveryTimeMins,
      onlinePaymentEnabled: settings.onlinePaymentEnabled,
      announcement: settings.announcement,
      socials: settings.socials,
      chatbot: {
        enabled: settings.chatbot?.enabled !== false,
        welcomeMessage: settings.chatbot?.welcomeMessage,
      },
      faqs: (settings.faqs || []).filter((faq) => faq.isActive !== false),
    },
  });
});

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await RestaurantSettings.getMain();
  res.json({ success: true, settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.getMain();
  const body = req.body;
  const updatable = [
    'restaurantName',
    'tagline',
    'phone',
    'whatsapp',
    'email',
    'address',
    'city',
    'deliveryFee',
    'freeDeliveryThreshold',
    'minOrder',
    'deliveryTimeMins',
    'onlinePaymentEnabled',
    'announcement',
    'openingHours',
  ];
  for (const field of updatable) {
    if (body[field] !== undefined) settings[field] = body[field];
  }
  if (body.socials) settings.socials = { ...settings.socials.toObject?.() ?? settings.socials, ...body.socials };
  if (body.chatbot) settings.chatbot = { ...settings.chatbot.toObject?.() ?? settings.chatbot, ...body.chatbot };
  if (Array.isArray(body.faqs)) settings.faqs = body.faqs;
  await settings.save();
  res.json({ success: true, settings });
});

export const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, keywords = [], isActive = true } = req.body;
  if (!question?.trim() || !answer?.trim()) throw new ApiError(422, 'Question and answer are required.');
  const settings = await RestaurantSettings.getMain();
  settings.faqs.push({
    question: question.trim(),
    answer: answer.trim(),
    keywords: (Array.isArray(keywords) ? keywords : String(keywords).split(',')).map((k) => String(k).trim()).filter(Boolean),
    isActive,
  });
  await settings.save();
  res.status(201).json({ success: true, faqs: settings.faqs });
});

export const updateFaq = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.getMain();
  const faq = settings.faqs.id(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found.');
  const { question, answer, keywords, isActive } = req.body;
  if (question !== undefined) faq.question = question;
  if (answer !== undefined) faq.answer = answer;
  if (keywords !== undefined) {
    faq.keywords = (Array.isArray(keywords) ? keywords : String(keywords).split(',')).map((k) => String(k).trim()).filter(Boolean);
  }
  if (isActive !== undefined) faq.isActive = isActive;
  await settings.save();
  res.json({ success: true, faqs: settings.faqs });
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.getMain();
  const faq = settings.faqs.id(req.params.id);
  if (!faq) throw new ApiError(404, 'FAQ not found.');
  faq.deleteOne();
  await settings.save();
  res.json({ success: true, faqs: settings.faqs });
});

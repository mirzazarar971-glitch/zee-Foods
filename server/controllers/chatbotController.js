import ChatConversation from '../models/ChatConversation.js';
import RestaurantSettings from '../models/RestaurantSettings.js';
import { asyncHandler } from '../utils/helpers.js';
import { generateReply } from '../services/chatbotService.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const settings = await RestaurantSettings.getMain();
  const { sessionId, message, history = [] } = req.body;
  const shouldLog = settings.chatbot?.logConversations !== false;

  let conversation = null;
  if (shouldLog) {
    conversation = await ChatConversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new ChatConversation({ sessionId, user: req.user?._id || null });
    }
  }

  const priorHistory =
    conversation && conversation.messages.length
      ? conversation.messages.map((entry) => ({ role: entry.role, content: entry.content }))
      : history;

  const { reply, provider } = await generateReply({ message, history: priorHistory });

  if (shouldLog && conversation) {
    conversation.messages.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
    conversation.provider = provider;
    conversation.lastMessageAt = new Date();
    if (req.user) conversation.user = req.user._id;
    await conversation.save();
  }

  res.json({ success: true, reply, provider, sessionId });
});

export const listConversations = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const search = String(req.query.search || '').trim();
  const filter = search ? { sessionId: new RegExp(search, 'i') } : {};
  const [conversations, total] = await Promise.all([
    ChatConversation.find(filter)
      .select('sessionId provider resolved lastMessageAt createdAt messages')
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ChatConversation.countDocuments(filter),
  ]);
  res.json({
    success: true,
    conversations: conversations.map((item) => ({
      ...item,
      messageCount: item.messages.length,
      preview: item.messages.find((entry) => entry.role === 'user')?.content || '',
      messages: undefined,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await ChatConversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  res.json({ success: true, conversation });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  await ChatConversation.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Conversation deleted.' });
});

export const chatbotStatus = asyncHandler(async (_req, res) => {
  const settings = await RestaurantSettings.getMain();
  const [totalConversations, totalMessages] = await Promise.all([
    ChatConversation.countDocuments(),
    ChatConversation.aggregate([{ $unwind: '$messages' }, { $count: 'count' }]),
  ]);
  res.json({
    success: true,
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_API_KEY ? process.env.AI_MODEL || 'gpt-4o-mini' : null,
    enabled: settings.chatbot?.enabled !== false,
    logConversations: settings.chatbot?.logConversations !== false,
    totalConversations,
    totalMessages: totalMessages[0]?.count || 0,
  });
});

import Newsletter from '../models/Newsletter.js';
import { asyncHandler } from '../utils/helpers.js';

export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ success: false, message: 'Please enter a valid email address.' });
  }
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    return res.json({ success: true, message: 'You are already on the list — delicious updates are coming your way!' });
  }
  await Newsletter.create({ email });
  res.status(201).json({ success: true, message: 'Subscribed! Watch your inbox for deals and new menu drops.' });
});

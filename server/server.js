import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import path from 'node:path';
import mongoose from 'mongoose';

import { connectDB, disconnectDB } from './config/db.js';
import { sanitizeInputs } from './middleware/validate.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.set('trust proxy', 1);

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production. Add it to server/.env.');
  }
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET missing — generated an ephemeral development secret.');
}

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(sanitizeInputs);

app.use('/uploads', express.static(path.resolve('uploads'), { maxAge: '7d' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'You are sending messages too quickly. Please slow down a little.' },
});
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many order attempts. Please try again shortly.' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    database: mongoose.connection.name || null,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', (req, res, next) => (req.method === 'POST' ? authLimiter(req, res, next) : next()), authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/coupons', apiLimiter, couponRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/chatbot', chatLimiter, chatbotRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();

  if (process.env.SEED_ON_EMPTY !== 'false') {
    const { seedDatabase } = await import('./utils/seed.js');
    await seedDatabase({ onlyIfEmpty: true });
  }

  const server = app.listen(PORT, () => {
    console.log(`[api] Zee Foods API listening on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log('\n[api] shutting down...');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('[api] failed to start:', error);
  process.exit(1);
});

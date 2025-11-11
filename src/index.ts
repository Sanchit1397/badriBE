import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import adminOrdersRouter from './routes/adminOrders';
import adminSettingsRouter from './routes/adminSettings';
import catalogRouter from './routes/catalog';
import uploadRouter from './routes/upload';
import mediaRouter from './routes/media';
import ordersRouter from './routes/orders';
import profileRouter from './routes/profile';
import { errorMiddleware } from './lib/errors';
import { logger } from './lib/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { preloadSettings } from './services/settingsService';

const app = express();
app.use(express.json());
app.use(requestIdMiddleware);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  // eslint-disable-next-line no-console
  console.error('Missing MONGODB_URI');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'badrikidukan' })
  .then(async () => {
    logger.info('Connected to MongoDB');
    // Preload settings into cache on startup
    await preloadSettings();
    logger.info('Settings preloaded into cache');
  })
  .catch((err) => {
    logger.error({ err }, 'Mongo connection error');
    process.exit(1);
  });

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/admin/orders', adminOrdersRouter);
app.use('/admin/settings', adminSettingsRouter);
app.use('/catalog', catalogRouter);
app.use('/upload', uploadRouter);
app.use('/media', mediaRouter);
app.use('/orders', ordersRouter);
app.use('/profile', profileRouter);

// Error handler last
app.use(errorMiddleware);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => logger.info({ port: PORT }, 'API listening'));



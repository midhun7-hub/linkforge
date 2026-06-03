import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { rateLimiter } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';

import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import bulkRoutes from './routes/bulkRoutes.js';
import { redirectUrl } from './controllers/urlController.js';
import User from './models/User.js';
import Url from './models/Url.js';
import Visit from './models/Visit.js';

dotenv.config();

// --- Production environment validation ---
const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL'];
const missingVars = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] && !process.env.MONGODB_URI // MONGODB_URI is an alternative for MONGO_URI
);
// If MONGO_URI is missing but MONGODB_URI is present, that's fine
const mongoIndex = missingVars.indexOf('MONGO_URI');
if (mongoIndex !== -1 && process.env.MONGODB_URI) {
  missingVars.splice(mongoIndex, 1);
}
if (missingVars.length > 0) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    `[ENV ERROR] Missing required environment variables: ${missingVars.join(', ')}`
  );
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '\x1b[31m%s\x1b[0m',
      '[ENV ERROR] Server will not start in production without these variables.'
    );
    process.exit(1);
  }
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '[ENV WARN] Starting in development mode with missing variables — this may cause runtime errors.'
  );
}
// --- End validation ---

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL;
    const isDev = process.env.NODE_ENV === 'development';

    if (!origin) return callback(null, true);
    if (allowedOrigin && origin === allowedOrigin) return callback(null, true);

    if (isDev) {
      try {
        const url = new URL(origin);
        const isLocalhost =
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          url.hostname === '[::1]';
        if (isLocalhost) return callback(null, true);
      } catch {
        // ignore invalid origin
      }
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(rateLimiter);

app.get('/', (req, res) => {
  res.json({
    message: 'LinkForge API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bulk', bulkRoutes);

// Temporary debug route to verify active database/collections
app.get('/api/debug/db', async (req, res) => {
  try {
    const host = mongoose.connection.host || null;
    const database = mongoose.connection.name || null;
    const readyState = mongoose.connection.readyState;

    const collections = mongoose.connection.db
      ? (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name)
      : [];

    const [userCount, urlCount, visitCount] = await Promise.all([
      User.countDocuments({}),
      Url.countDocuments({}),
      Visit.countDocuments({})
    ]);

    res.json({
      host,
      database,
      readyState,
      collections,
      userCount,
      urlCount,
      visitCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to read DB debug info',
      error: error.message
    });
  }
});

app.get('/:shortCode', redirectUrl);
app.get('/stats/:shortCode', redirectUrl);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `[SERVER] LinkForge Backend running on port ${PORT}`);
  console.log('\x1b[36m%s\x1b[0m', `[SERVER] Environment: ${process.env.NODE_ENV}`);
  console.log('\x1b[36m%s\x1b[0m', `[SERVER] Backend URL: ${process.env.BACKEND_URL}`);
  console.log('\x1b[36m%s\x1b[0m', `[SERVER] Frontend URL: ${process.env.FRONTEND_URL}`);
});

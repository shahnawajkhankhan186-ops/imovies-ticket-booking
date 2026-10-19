import app from '../src/app.js';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

let isConnected = false;

async function ensureDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: false,
  });
  isConnected = true;
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('[VERCEL SERVERLESS ERROR] MongoDB connection failure:', err.message);
    return res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
  return app(req, res);
}

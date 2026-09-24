import mongoose from 'mongoose';
import { logger } from '../lib/logger.js';
import { ensureSrvResolution } from '../lib/dnsFallback.js';

export async function connectDatabase(uri, { dnsFallbackServers } = {}) {
  await ensureSrvResolution(uri, dnsFallbackServers);
  mongoose.set('strictQuery', true);
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

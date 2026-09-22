import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Singleton per synced file: what revision we last ingested and how the last sync went. */
const syncStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    source: String, // "drive" | "local"
    fileId: String,
    fileName: String,
    mimeType: String,
    webViewLink: String,
    fy: String,
    revision: String,
    sourceModifiedTime: Date,
    status: { type: String, enum: ['idle', 'syncing', 'error'], default: 'idle' },
    error: String,
    lastCheckedAt: Date,
    lastSyncedAt: Date,
    lastChangeAt: Date,
  },
  { timestamps: true },
);

export const SyncState = mongoose.model('SyncState', syncStateSchema);

import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Audit trail of syncs that ingested a new revision or failed. Auto-expires after 30 days. */
const syncLogSchema = new Schema(
  {
    dataset: { type: String, required: true, default: 'officer-return' },
    trigger: { type: String, enum: ['startup', 'poll', 'manual', 'webhook'], required: true },
    status: { type: String, enum: ['success', 'error'], required: true },
    revision: String,
    changedItems: { type: [String], default: [] },
    durationMs: Number,
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

syncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const SyncLog = mongoose.model('SyncLog', syncLogSchema);

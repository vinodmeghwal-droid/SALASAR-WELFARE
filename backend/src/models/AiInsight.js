import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Cached Gemini analysis per FY + period. `inputHash` changes whenever the underlying data does. */
const aiInsightSchema = new Schema(
  {
    dataset: { type: String, required: true, default: 'officer-return' },
    fy: { type: String, required: true },
    period: { type: String, required: true }, // "annual" | month key
    inputHash: { type: String, required: true },
    model: String,
    insight: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false },
);

aiInsightSchema.index({ dataset: 1, fy: 1, period: 1, inputHash: 1 }, { unique: true });
aiInsightSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const AiInsight = mongoose.model('AiInsight', aiInsightSchema);

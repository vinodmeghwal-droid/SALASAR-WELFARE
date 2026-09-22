import mongoose from 'mongoose';

const { Schema } = mongoose;

/** Workbook-level data for one financial year: the sheet's own Annual Summary tab + cross-checks. */
const workbookMetaSchema = new Schema(
  {
    fy: { type: String, required: true, unique: true },
    title: String,
    fileId: String,
    fileName: String,
    webViewLink: String,
    annualSummary: { type: Schema.Types.Mixed, default: null },
    checks: { type: [Schema.Types.Mixed], default: [] },
    sourceRevision: String,
    sourceModifiedTime: Date,
  },
  { timestamps: true, minimize: false },
);

export const WorkbookMeta = mongoose.model('WorkbookMeta', workbookMetaSchema);

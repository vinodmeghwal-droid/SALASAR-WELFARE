import mongoose from 'mongoose';

const { Schema } = mongoose;

/** One month sheet of the Officer Return workbook, parsed + KPIs computed. */
const monthlyReturnSchema = new Schema(
  {
    fy: { type: String, required: true },
    month: { type: String, required: true }, // "apr" … "mar"
    monthIndex: { type: Number, required: true }, // 0 = Apr (FY order)
    sheetName: String,
    label: String,
    title: String,
    hasData: { type: Boolean, default: false },
    header: { type: Schema.Types.Mixed, default: {} },
    sections: { type: Schema.Types.Mixed, default: {} },
    kpis: { type: Schema.Types.Mixed, default: {} },
    checks: { type: [Schema.Types.Mixed], default: [] },
    remarks: String,
    contentHash: String,
    sourceRevision: String,
  },
  { timestamps: true, minimize: false },
);

monthlyReturnSchema.index({ fy: 1, month: 1 }, { unique: true });
monthlyReturnSchema.index({ fy: 1, monthIndex: 1 });

export const MonthlyReturn = mongoose.model('MonthlyReturn', monthlyReturnSchema);

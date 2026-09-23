import mongoose from 'mongoose';

const { Schema } = mongoose;

/** One financial year of the Safety Accident Tracker: incident register + computed KPIs. */
const accidentReturnSchema = new Schema(
  {
    fy: { type: String, required: true, unique: true },
    title: String,
    reportingPeriod: String,
    fileId: String,
    fileName: String,
    webViewLink: String,
    months: { type: [Schema.Types.Mixed], default: [] },
    totals: { type: Schema.Types.Mixed, default: {} },
    capa: { type: Schema.Types.Mixed, default: {} },
    breakdowns: { type: Schema.Types.Mixed, default: {} },
    incidents: { type: [Schema.Types.Mixed], default: [] },
    sheetMonthlyKpi: { type: [Schema.Types.Mixed], default: [] },
    sheetDashboard: { type: Schema.Types.Mixed, default: null },
    checks: { type: [Schema.Types.Mixed], default: [] },
    contentHash: String,
    sourceRevision: String,
    sourceModifiedTime: Date,
  },
  { timestamps: true, minimize: false },
);

export const AccidentReturn = mongoose.model('AccidentReturn', accidentReturnSchema);

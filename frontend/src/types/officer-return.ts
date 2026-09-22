/** Mirrors the backend payloads (backend/src/services/officerReturnService.js). */

export type MonthKey = 'apr' | 'may' | 'jun' | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec' | 'jan' | 'feb' | 'mar';
export type Period = 'annual' | MonthKey;

export interface MonthKpis {
  headcountOpening: number;
  headcountClosing: number;
  joinings: number;
  separations: number;
  attritionRate: number | null;
  maleWorkers: number;
  femaleWorkers: number;
  medicalCases: number;
  safetyIncidents: number;
  reportableAccidents: number;
  nearMisses: number;
  manDaysLost: number;
  grievancesReceived: number;
  grievancesResolved: number;
  grievancesPending: number;
  grievanceResolutionRate: number | null;
  welfareActivities: number;
  activityParticipants: number;
  inspections: number;
  trainingSessions: number;
  trainingParticipants: number;
  statutoryComplied: number;
  statutoryTotal: number;
  statutoryComplianceRate: number | null;
  contractorCount: number;
  contractorManpower: number;
  contractorComplianceRate: number | null;
  facilitiesAvailable: number;
  facilitiesSatisfactory: number;
  facilitiesTotal: number;
}

export interface DataCheck {
  id: string;
  severity: 'warning' | 'info';
  month?: MonthKey;
  title: string;
  detail: string;
}

export interface MonthStatus {
  key: MonthKey;
  label: string;
  short: string;
  hasData: boolean;
  checkCount: number;
}

export type TrendPoint = { month: MonthKey; label: string; hasData: boolean } & {
  [K in keyof MonthKpis]?: number | null;
};

export interface BreakdownRow {
  id: string;
  label: string;
  [field: string]: string | number;
}

export interface SheetSummaryKpi {
  id: string;
  label: string;
  byMonth: Partial<Record<MonthKey, number>>;
  annualTotal: number | null;
}

export interface Overview {
  fy: string;
  title: string | null;
  factory: { name: string | null; address: string | null; licenceNo: string | null; welfareOfficer: string | null };
  source: { fileId: string | null; fileName: string | null; webViewLink: string | null; modifiedTime: string | null };
  months: MonthStatus[];
  submittedCount: number;
  latestMonth: MonthKey | null;
  snapshot: {
    month: MonthKey;
    label: string;
    headcountClosing: number;
    maleWorkers: number;
    femaleWorkers: number;
    attritionRate: number | null;
    grievancesPending: number;
    statutoryComplianceRate: number | null;
    contractorComplianceRate: number | null;
    contractorManpower: number;
  } | null;
  ytd: Record<string, number | null>;
  trend: TrendPoint[];
  breakdowns: {
    manpowerByType: BreakdownRow[];
    grievancesByCategory: BreakdownRow[];
    accidentsByType: BreakdownRow[];
    healthByParticular: BreakdownRow[];
    activitiesByType: BreakdownRow[];
    trainingByProgramme: BreakdownRow[];
  };
  sheetSummary: SheetSummaryKpi[];
  observations: string | null;
  checks: DataCheck[];
  updatedAt: string;
}

export interface SectionRow {
  id: string;
  label: string;
  group?: 'type' | 'gender' | 'total';
  [field: string]: string | number | null | undefined;
}

export interface Section {
  title: string;
  columns: string[];
  rows: SectionRow[];
  notes: string[];
  values?: Record<string, number>;
}

export type SectionId =
  | 'manpower'
  | 'facilities'
  | 'health'
  | 'accidents'
  | 'grievances'
  | 'activities'
  | 'contractors'
  | 'training'
  | 'compliance'
  | 'summary';

export interface MonthReturn {
  fy: string;
  month: MonthKey;
  monthIndex: number;
  sheetName: string;
  label: string;
  title: string | null;
  hasData: boolean;
  header: {
    factoryName?: string | null;
    licenceNo?: string | null;
    address?: string | null;
    reportingPeriod?: string | null;
    welfareOfficer?: string | null;
    declaredTotalWorkers?: number;
  };
  sections: Partial<Record<SectionId, Section>>;
  kpis: MonthKpis;
  checks: DataCheck[];
  remarks: string | null;
  updatedAt: string;
}

export interface SyncStatus {
  source: 'drive' | 'local';
  status: 'idle' | 'syncing' | 'error';
  error: string | null;
  fileName: string | null;
  webViewLink: string | null;
  fy: string | null;
  sourceModifiedTime: string | null;
  lastCheckedAt: string | null;
  lastSyncedAt: string | null;
  lastChangeAt: string | null;
}

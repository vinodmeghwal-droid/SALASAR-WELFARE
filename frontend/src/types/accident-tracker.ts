/** Mirrors backend/src/services/accidentTrackerService.js */

import type { DataCheck } from './officer-return';

export interface AccidentKpis {
  recordedEvents: number;
  accidents: number;
  nearMisses: number;
  lti: number;
  fatalities: number;
  firstAid: number;
  hospitalisations: number;
  majorAccidents: number;
  minorAccidents: number;
  manDaysLost: number;
  lostWorkDays: number;
  manHoursWorked: number;
  ltifr: number | null;
  severityRate: number | null;
  ltiPercentOfAccidents: number | null;
  nearMissRatio: number | null;
}

export interface AccidentMonth {
  monthId: string;
  label: string;
  monthIndex: number;
  year: number;
  hasData: boolean;
  incidentCount: number;
  kpis: AccidentKpis;
}

export interface BreakdownEntry {
  id: string;
  label: string;
  count: number;
  lti: number;
  manDaysLost: number;
  /** Charts and tables read rows generically. */
  [field: string]: string | number;
}

export interface Capa {
  total: number;
  open: number;
  overdue: number;
  closed: number;
  closureRate: number | null;
  averageClosureDays: number | null;
  missingRootCause: number;
  missingCorrectiveAction: number;
}

export interface Incident {
  id: string;
  rowNumber: number;
  srNo: number;
  accidentId: string | null;
  date: string | null;
  month: string | null;
  monthId: string | null;
  monthLabel: string | null;
  employeeName: string | null;
  payCode: number;
  department: string | null;
  section: string | null;
  designation: string | null;
  employmentType: string | null;
  contractor: string | null;
  accidentType: string | null;
  injuryType: string | null;
  lti: boolean;
  fatality: boolean;
  firstAid: boolean;
  hospitalization: boolean;
  nearMiss: boolean;
  manDaysLost: number;
  manHoursWorked: number;
  lostWorkDays: number;
  rootCause: string | null;
  correctiveAction: string | null;
  responsiblePerson: string | null;
  targetDate: string | null;
  closureDate: string | null;
  status: string | null;
  remarks: string | null;
}

export interface AccidentOverview {
  fy: string;
  title: string | null;
  reportingPeriod: string | null;
  fileId: string | null;
  fileName: string | null;
  webViewLink: string | null;
  months: AccidentMonth[];
  totals: AccidentKpis;
  capa: Capa;
  breakdowns: {
    byAccidentType: BreakdownEntry[];
    byInjuryType: BreakdownEntry[];
    byDepartment: BreakdownEntry[];
    byEmploymentType: BreakdownEntry[];
    byContractor: BreakdownEntry[];
    byRootCause: BreakdownEntry[];
    byStatus: BreakdownEntry[];
  };
  sheetMonthlyKpi: Record<string, number | string>[];
  sheetDashboard: { title: string | null; tiles: Record<string, number>; rates: Record<string, number>; typeCounts: { id: string; label: string; count: number }[] } | null;
  checks: DataCheck[];
  updatedAt: string;
}

export interface IncidentsResponse {
  fy: string;
  count: number;
  incidents: Incident[];
}

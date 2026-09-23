import { hashOf } from '../officerReturn/monthRecord.js';
import { computeCapa, computeKpis, groupBy, monthManHours } from './kpis.js';
import { checkAccidentData } from './dataChecks.js';

/**
 * Parsed accident workbook → the document persisted per financial year and served to the dashboard.
 * KPIs come from the incident register, never from the workbook's formula sheets.
 */
export function buildAccidentRecord(parsed) {
  const { incidents, months, sheetMonthlyKpi, sheetDashboard } = parsed;

  const monthly = months.map((month) => {
    const rows = incidents.filter((i) => i.monthId === month.id);
    const manHoursValues = [...new Set(rows.map((i) => i.manHoursWorked ?? 0).filter((v) => v > 0))];
    const manHours = monthManHours(rows);
    return {
      monthId: month.id,
      label: month.label,
      monthIndex: month.monthIndex,
      year: month.year,
      hasData: rows.length > 0,
      incidentCount: rows.length,
      manHoursValues,
      repeatedManHours: manHoursValues.length === 1 && rows.length > 1,
      kpis: computeKpis(rows, manHours),
    };
  });

  // Incidents whose month is outside the workbook's own month list still count in the annual totals.
  const totalManHours = monthly.reduce((sum, m) => sum + m.kpis.manHoursWorked, 0);
  const totals = computeKpis(incidents, totalManHours);
  const capa = computeCapa(incidents);

  const record = {
    fy: parsed.fy,
    title: parsed.title,
    reportingPeriod: parsed.reportingPeriod,
    months: monthly.map(({ manHoursValues, repeatedManHours, ...m }) => m),
    totals,
    capa,
    breakdowns: {
      byAccidentType: groupBy(incidents, 'accidentType'),
      byInjuryType: groupBy(incidents, 'injuryType'),
      byDepartment: groupBy(incidents, 'department'),
      byEmploymentType: groupBy(incidents, 'employmentType'),
      byContractor: groupBy(incidents, 'contractor'),
      byRootCause: groupBy(incidents, 'rootCause'),
      byStatus: groupBy(incidents, 'status'),
    },
    incidents,
    sheetMonthlyKpi,
    sheetDashboard,
    checks: checkAccidentData({ incidents, monthly, sheetMonthlyKpi, sheetDashboard }),
  };

  record.contentHash = hashOf({ incidents, sheetMonthlyKpi, sheetDashboard });
  return record;
}

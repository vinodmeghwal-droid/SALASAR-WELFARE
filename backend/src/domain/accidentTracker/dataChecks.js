import { isNearMiss } from './kpis.js';

/**
 * Data-quality checks for the accident workbook.
 * Each: { id, severity: 'warning' | 'info', month?, title, detail }.
 */
export function checkAccidentData({ incidents, monthly, sheetMonthlyKpi, sheetDashboard }) {
  const checks = [];
  const add = (id, severity, title, detail, month) => checks.push({ id, severity, title, detail, month });
  const where = (i) => `Row ${i.rowNumber}${i.employeeName ? ` (${i.employeeName})` : ''}`;

  for (const incident of incidents) {
    // A near miss has no injury by definition.
    if (isNearMiss(incident) && (incident.lti || incident.firstAid || incident.hospitalization || incident.manDaysLost > 0)) {
      add(
        `contradiction-${incident.id}`,
        'warning',
        `${where(incident)}: flagged as near miss but also records an injury`,
        `Near Miss = Y together with ${[
          incident.lti && 'LTI = Y',
          incident.firstAid && 'First Aid = Y',
          incident.hospitalization && 'Hospitalization = Y',
          incident.manDaysLost > 0 && `${incident.manDaysLost} man-days lost`,
        ]
          .filter(Boolean)
          .join(', ')}. A near miss causes no injury, so this event is counted twice in the workbook's totals.`,
        incident.monthId,
      );
    }

    if (incident.lti && !(incident.manDaysLost > 0)) {
      add(
        `lti-no-days-${incident.id}`,
        'warning',
        `${where(incident)}: LTI with no man-days lost`,
        'Lost Time Injury = Y but Man-days Lost is empty, so the severity rate is understated.',
        incident.monthId,
      );
    }

    for (const field of ['targetDate', 'closureDate']) {
      if (incident[field] && incident.date && incident[field] < incident.date) {
        add(
          `${field}-before-${incident.id}`,
          'warning',
          `${where(incident)}: ${field === 'targetDate' ? 'target' : 'closure'} date precedes the accident`,
          `Accident ${incident.date}, ${field === 'targetDate' ? 'target' : 'closure'} ${incident[field]}. Dates like 08-01-2026 may have been read as month-day; enter them as DD-MMM-YYYY.`,
          incident.monthId,
        );
      }
    }

    if (!incident.monthId) {
      add(`no-month-${incident.id}`, 'info', `${where(incident)}: no month`, 'Neither the Month column nor the Date could be read, so this incident is missing from monthly figures.');
    }
  }

  // Man-hours are a monthly figure repeated on each row; disagreements make the rates ambiguous.
  for (const month of monthly.filter((m) => m.incidentCount > 1)) {
    if (month.manHoursValues.length > 1) {
      add(
        `manhours-${month.monthId}`,
        'warning',
        `${month.label}: incidents disagree on man-hours worked`,
        `Values entered: ${month.manHoursValues.join(', ')}. The dashboard uses ${month.kpis.manHoursWorked}; the workbook adds them up (${month.manHoursValues.reduce((a, b) => a + b, 0)}), which distorts LTIFR and severity rate.`,
        month.monthId,
      );
    } else if (month.repeatedManHours) {
      add(
        `manhours-repeat-${month.monthId}`,
        'info',
        `${month.label}: man-hours repeated on ${month.incidentCount} rows`,
        `The workbook's Monthly KPI sums the column, giving ${month.manHoursValues[0] * month.incidentCount} man-hours instead of ${month.kpis.manHoursWorked}. The dashboard uses the single monthly figure.`,
        month.monthId,
      );
    }
  }

  // The workbook's own roll-up vs. what the register actually contains.
  const FIELDS = [
    ['totalAccidents', 'recordedEvents', 'Total accidents'],
    ['lti', 'lti', 'LTI'],
    ['fatalities', 'fatalities', 'Fatalities'],
    ['nearMiss', 'nearMisses', 'Near miss'],
    ['firstAid', 'firstAid', 'First aid'],
    ['manDaysLost', 'manDaysLost', 'Man-days lost'],
  ];
  for (const sheetRow of sheetMonthlyKpi ?? []) {
    const month = monthly.find((m) => m.monthId === sheetRow.monthId);
    if (!month) continue;
    const diffs = FIELDS.filter(([sheetKey, kpiKey]) => (sheetRow[sheetKey] ?? 0) !== month.kpis[kpiKey]).map(
      ([sheetKey, kpiKey, label]) => `${label}: sheet ${sheetRow[sheetKey] ?? 0} vs register ${month.kpis[kpiKey]}`,
    );
    if (diffs.length) {
      add(
        `kpi-mismatch-${month.monthId}`,
        'warning',
        `${month.label}: Monthly KPI sheet disagrees with the register`,
        `${diffs.join(' · ')}. The dashboard counts the incident rows directly.`,
        month.monthId,
      );
    }
  }

  // Dashboard "KEY RATES" point at empty cells next to the merged tiles, so they always read 0.
  const rates = sheetDashboard?.rates ?? {};
  const tiles = sheetDashboard?.tiles ?? {};
  const rateValues = Object.values(rates);
  if (rateValues.length && rateValues.every((v) => v === 0) && Object.values(tiles).some((v) => v > 0)) {
    add(
      'dashboard-key-rates',
      'warning',
      'Dashboard "KEY RATES" block always shows zero',
      'Its formulas reference empty cells beside the merged tiles (B7/B9/C7/G7), so LTIFR, severity rate and the ratios never populate in the workbook. This dashboard computes them from the register instead.',
    );
  }

  if (sheetMonthlyKpi?.some((r) => (r.totalAccidents ?? 0) > 0 && (r.accidentRatePer100 ?? 0) === 0)) {
    add(
      'accident-rate-formula',
      'info',
      'Accident Rate / 100 Workers cannot be calculated in the workbook',
      'The formula divides by Dashboard!B6, which is empty (the tile value sits in A6), and there is no worker headcount input. Add the monthly worker count to enable this rate.',
    );
  }

  return checks;
}

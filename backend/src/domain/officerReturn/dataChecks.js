/**
 * Data-quality checks shown in the dashboard's "Data checks" panel.
 * Each check: { id, severity: 'warning' | 'info', month?, title, detail }.
 */

/** KPI ids shared by section J, the Annual Summary tab and computed KPIs. */
const SUMMARY_TO_KPI = {
  totalWorkers: 'headcountClosing',
  welfareActivities: 'welfareActivities',
  grievancesReceived: 'grievancesReceived',
  grievancesResolved: 'grievancesResolved',
  accidents: 'safetyIncidents',
  medicalCases: 'medicalCases',
  trainingSessions: 'trainingSessions',
  inspections: 'inspections',
};

export function checkMonth(month, kpis) {
  const checks = [];
  const add = (id, severity, title, detail) =>
    checks.push({ id: `${month.month}:${id}`, severity, month: month.month, title, detail });
  const where = month.label;

  const manpower = month.sections.manpower?.rows ?? [];
  for (const row of manpower.filter((r) => r.group !== 'total')) {
    const expected = row.opening + row.joining - row.separation;
    if (expected !== row.closing) {
      add(
        `manpower-balance-${row.id}`,
        'warning',
        `${where}: ${row.label} closing doesn't balance`,
        `Opening ${row.opening} + joining ${row.joining} − separation ${row.separation} = ${expected}, but closing is ${row.closing}.`,
      );
    }
  }

  const genderClosing = kpis.maleWorkers + kpis.femaleWorkers;
  if (genderClosing > 0 && genderClosing !== kpis.headcountClosing) {
    add(
      'manpower-gender-mismatch',
      'warning',
      `${where}: gender split doesn't match headcount`,
      `Male + female closing = ${genderClosing}, but the employment-type rows total ${kpis.headcountClosing}.`,
    );
  }

  const totalRow = manpower.find((r) => r.group === 'total');
  if (totalRow && totalRow.closing > 0 && totalRow.closing !== kpis.headcountClosing) {
    const doubled = totalRow.closing === kpis.headcountClosing + genderClosing;
    add(
      'manpower-total-row',
      'warning',
      `${where}: manpower TOTAL row is ${doubled ? 'double-counted' : 'inconsistent'}`,
      doubled
        ? `The TOTAL row (${totalRow.closing}) adds the gender rows on top of the employment-type rows. Actual closing headcount is ${kpis.headcountClosing}. Dashboard uses ${kpis.headcountClosing}.`
        : `The TOTAL row shows ${totalRow.closing} but the rows add up to ${kpis.headcountClosing}. Dashboard uses ${kpis.headcountClosing}.`,
    );
  }

  const declared = month.header?.declaredTotalWorkers;
  if (declared > 0 && declared !== kpis.headcountClosing) {
    add(
      'declared-total-workers',
      'info',
      `${where}: header "Total Workers" differs from manpower statement`,
      `Header says ${declared}; manpower statement closing is ${kpis.headcountClosing}. The header may include staff outside this return.`,
    );
  }

  for (const row of month.sections.grievances?.rows ?? []) {
    if (row.received > 0 && row.resolved + row.pending !== row.received) {
      add(
        `grievance-balance-${row.id}`,
        'warning',
        `${where}: ${row.label} grievances don't balance`,
        `Received ${row.received}, but resolved ${row.resolved} + pending ${row.pending} = ${row.resolved + row.pending}.`,
      );
    }
  }

  const period = reportingPeriod(month);
  if (period) {
    const outside = (month.sections.training?.rows ?? []).filter(
      (row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date ?? '') && !row.date.startsWith(period),
    );
    if (outside.length) {
      add(
        'training-dates-outside-period',
        'info',
        `${where}: ${outside.length} training date(s) fall outside the reporting month`,
        `${outside.map((r) => `${r.label} (${r.date})`).join(', ')}. Dates like 05-10-2026 may have been read as month-day; enter dates as DD-MMM-YYYY to avoid ambiguity.`,
      );
    }
  }

  const summary = month.sections.summary?.values ?? {};
  const mismatches = Object.entries(SUMMARY_TO_KPI)
    .filter(([key]) => key in summary)
    .filter(([key, kpi]) => summary[key] !== kpis[kpi])
    .map(([key, kpi]) => `${labelOf(key)}: sheet ${summary[key]} vs computed ${kpis[kpi]}`);
  if (mismatches.length) {
    add(
      'section-j-mismatch',
      'warning',
      `${where}: Monthly Welfare Summary (section J) disagrees with the detail`,
      mismatches.join(' · '),
    );
  }

  return checks;
}

/** Compare the workbook's own Annual Summary tab against KPIs computed from each month sheet. */
export function checkAnnualSummary(annualSummary, monthRecords) {
  if (!annualSummary?.kpis?.length) return [];
  const checks = [];

  for (const record of monthRecords.filter((m) => m.hasData)) {
    const mismatches = annualSummary.kpis
      .filter((row) => SUMMARY_TO_KPI[row.id] && row.byMonth[record.month] !== undefined)
      .filter((row) => row.byMonth[record.month] !== record.kpis[SUMMARY_TO_KPI[row.id]])
      .map((row) => `${row.label}: tab ${row.byMonth[record.month]} vs return ${record.kpis[SUMMARY_TO_KPI[row.id]]}`);

    if (mismatches.length) {
      checks.push({
        id: `annual:${record.month}`,
        severity: 'warning',
        month: record.month,
        title: `Annual Summary tab is out of step with ${record.label}`,
        detail: `${mismatches.join(' · ')}. The tab uses fixed cell references that shift when rows are inserted; the dashboard computes from the month sheet instead.`,
      });
    }
  }
  return checks;
}

/** "2026-27" + "sep" → "2026-09"; Jan–Mar belong to the second calendar year of the FY. */
function reportingPeriod(month) {
  const startYear = Number(String(month.fy ?? '').slice(0, 4));
  if (!startYear) return null;
  const calendarMonth = ((month.monthIndex + 3) % 12) + 1;
  const year = month.monthIndex >= 9 ? startYear + 1 : startYear;
  return `${year}-${String(calendarMonth).padStart(2, '0')}`;
}

function labelOf(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

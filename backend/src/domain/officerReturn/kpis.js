import { CONTRACTOR_CHECKS } from '../../parsers/officerReturn/schema.js';

const sum = (rows, field) => rows.reduce((total, row) => total + (row[field] ?? 0), 0);
const rate = (part, whole) => (whole > 0 ? round((part / whole) * 100) : null);
const round = (n, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const isComplied = (value) => /^(complied|yes|y|ok|compliant)$/i.test(String(value ?? '').trim());

/**
 * KPIs derived from a month's own sections — NOT from the sheet's section J / Annual Summary,
 * whose formulas break when rows are inserted (see dataChecks.js).
 */
export function computeMonthKpis(sections) {
  const manpower = sections.manpower?.rows ?? [];
  const byType = manpower.filter((r) => r.group === 'type');
  const byGender = manpower.filter((r) => r.group === 'gender');

  const headcountOpening = sum(byType, 'opening');
  const headcountClosing = sum(byType, 'closing');
  const separations = sum(byType, 'separation');
  const averageHeadcount = (headcountOpening + headcountClosing) / 2;

  const accidents = sections.accidents?.rows ?? [];
  const incidentRows = accidents.filter((r) => !/compensation|claim/i.test(r.label));
  const findAccident = (re) => accidents.filter((r) => re.test(r.label));

  const grievances = sections.grievances?.rows ?? [];
  const grievancesReceived = sum(grievances, 'received');
  const grievancesResolved = sum(grievances, 'resolved');

  const activities = sections.activities?.rows ?? [];
  const training = (sections.training?.rows ?? []).filter((r) => r.participants > 0 || r.date);

  const statutory = sections.compliance?.rows ?? [];
  const statutoryComplied = statutory.filter((r) => isComplied(r.status)).length;

  const contractors = sections.contractors?.rows ?? [];
  const contractorChecksTotal = contractors.length * CONTRACTOR_CHECKS.length;
  const contractorChecksPassed = contractors.reduce(
    (total, row) => total + CONTRACTOR_CHECKS.filter((field) => isComplied(row[field])).length,
    0,
  );

  const facilities = sections.facilities?.rows ?? [];

  return {
    headcountOpening,
    headcountClosing,
    joinings: sum(byType, 'joining'),
    separations,
    attritionRate: averageHeadcount > 0 ? round((separations / averageHeadcount) * 100) : null,
    maleWorkers: sum(byGender.filter((r) => !/female/i.test(r.label)), 'closing'),
    femaleWorkers: sum(byGender.filter((r) => /female/i.test(r.label)), 'closing'),

    medicalCases: sum(sections.health?.rows ?? [], 'count'),

    safetyIncidents: sum(incidentRows, 'cases'),
    reportableAccidents: sum(findAccident(/fatal|major|minor|lost time/i), 'cases'),
    nearMisses: sum(findAccident(/near miss/i), 'cases'),
    manDaysLost: sum(accidents, 'manDaysLost'),

    grievancesReceived,
    grievancesResolved,
    grievancesPending: sum(grievances, 'pending'),
    grievanceResolutionRate: rate(grievancesResolved, grievancesReceived),

    welfareActivities: sum(activities, 'conducted'),
    activityParticipants: sum(activities, 'participants'),
    inspections: sum(activities.filter((r) => /inspection/i.test(r.label)), 'conducted'),

    trainingSessions: training.length,
    trainingParticipants: sum(training, 'participants'),

    statutoryComplied,
    statutoryTotal: statutory.length,
    statutoryComplianceRate: rate(statutoryComplied, statutory.length),

    contractorCount: contractors.length,
    contractorManpower: sum(contractors, 'manpower'),
    contractorComplianceRate: rate(contractorChecksPassed, contractorChecksTotal),

    facilitiesAvailable: facilities.filter((r) => /^y/i.test(r.available ?? '')).length,
    facilitiesSatisfactory: facilities.filter((r) => /satisf|good/i.test(r.condition ?? '')).length,
    facilitiesTotal: facilities.length,
  };
}

/**
 * A month counts as "submitted" once any operational number or named contractor exists.
 * Header text and statutory "Complied" defaults are pre-filled in the template, so they don't count.
 */
export function monthHasData(kpis) {
  return (
    kpis.headcountOpening > 0 ||
    kpis.headcountClosing > 0 ||
    kpis.medicalCases > 0 ||
    kpis.safetyIncidents > 0 ||
    kpis.grievancesReceived > 0 ||
    kpis.welfareActivities > 0 ||
    kpis.trainingParticipants > 0 ||
    kpis.contractorManpower > 0
  );
}

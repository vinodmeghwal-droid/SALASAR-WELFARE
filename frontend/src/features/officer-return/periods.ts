import type { MonthKey, Period } from '@/types/officer-return';

export const MONTH_KEYS: MonthKey[] = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];

export const MONTH_LABELS: Record<MonthKey, { short: string; long: string }> = {
  apr: { short: 'Apr', long: 'April' },
  may: { short: 'May', long: 'May' },
  jun: { short: 'Jun', long: 'June' },
  jul: { short: 'Jul', long: 'July' },
  aug: { short: 'Aug', long: 'August' },
  sep: { short: 'Sep', long: 'September' },
  oct: { short: 'Oct', long: 'October' },
  nov: { short: 'Nov', long: 'November' },
  dec: { short: 'Dec', long: 'December' },
  jan: { short: 'Jan', long: 'January' },
  feb: { short: 'Feb', long: 'February' },
  mar: { short: 'Mar', long: 'March' },
};

export function parsePeriod(value: string | undefined | null): Period {
  const key = value?.toLowerCase();
  return key && (MONTH_KEYS as string[]).includes(key) ? (key as MonthKey) : 'annual';
}

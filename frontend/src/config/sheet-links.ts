import type { MonthKey, Period } from '@/types/officer-return';

/**
 * Tab ids (gid) of the Drive workbook, so "Open in Sheets" lands on the right tab.
 * Missing months fall back to the file itself. Update if tabs are recreated.
 */
const TAB_GIDS: Partial<Record<'annual' | MonthKey, string>> = {
  annual: '141942575',
  apr: '1030383332',
  may: '2079871053',
  jun: '1265489511',
  jul: '2108280406',
  aug: '497892770',
  sep: '1381563571',
  jan: '279264282',
  feb: '725475877',
};

export function sheetTabUrl(fileId: string | null | undefined, period: Period, fallback?: string | null) {
  if (!fileId || fileId.startsWith('local:')) return fallback ?? null;
  const gid = TAB_GIDS[period];
  return `https://docs.google.com/spreadsheets/d/${fileId}/edit${gid ? `#gid=${gid}` : ''}`;
}

/** Accident Tracker workbook tabs. */
const ACCIDENT_TAB_GIDS = {
  dashboard: '1069240044',
  data: '1432397289',
  monthlyKpi: '1430559343',
} as const;

export function accidentSheetUrl(
  fileId: string | null | undefined,
  tab: keyof typeof ACCIDENT_TAB_GIDS = 'data',
  fallback?: string | null,
) {
  if (!fileId || fileId.startsWith('local:')) return fallback ?? null;
  return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${ACCIDENT_TAB_GIDS[tab]}`;
}

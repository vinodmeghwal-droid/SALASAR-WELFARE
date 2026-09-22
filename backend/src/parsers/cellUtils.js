export const clean = (value) =>
  String(value ?? '')
    .replace(/�/g, '—') // the source titles carry a mis-encoded em dash
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeKey = (value) => clean(value).toLowerCase();

export const slugify = (value) =>
  normalizeKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const isBlank = (value) => value === null || value === undefined || clean(value) === '';

export function toNumber(value) {
  if (isBlank(value)) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const match = String(value).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function toText(value) {
  if (value instanceof Date) return toISODate(value);
  if (isBlank(value)) return null;
  return clean(value);
}

const pad = (n) => String(n).padStart(2, '0');

/** Accepts Date cells and "dd-mm-yyyy" / "dd/mm/yyyy" / ISO strings; returns "yyyy-mm-dd" or the original text. */
export function toISODate(value) {
  if (isBlank(value)) return null;
  if (value instanceof Date) {
    // ExcelJS returns dates as UTC midnight.
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  const text = clean(value);
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return text;
}

/** Template instructions left in cells are not real data. */
const PLACEHOLDERS = [/^enter key observations/i, /^record major welfare achievements/i];
export const isPlaceholder = (value) => PLACEHOLDERS.some((re) => re.test(clean(value)));

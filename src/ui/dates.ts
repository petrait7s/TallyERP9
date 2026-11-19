const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function valid(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * Tally-style date entry. "1" -> day in default month/year; "1/4" or "1-4" -> day+month in default year;
 * "1-4-25" / "1/4/2025" full. Returns ISO or null.
 */
export function parseTallyDate(input: string, defaultIso: string): string | null {
  const parts = input.trim().split(/[-/.\s]+/).filter(Boolean);
  if (!parts.length || parts.length > 3) return null;
  const monthIdx = parts[1] && /^[A-Za-z]+$/.test(parts[1])
    ? MON.findIndex((x) => parts[1].toLowerCase().startsWith(x.toLowerCase()) && parts[1].length >= 3) + 1
    : 0;
  if (parts[1] && /^[A-Za-z]+$/.test(parts[1]) && !monthIdx) return null;
  if (parts.some((p, i) => !(i === 1 && monthIdx) && !/^\d{1,4}$/.test(p))) return null;
  const [dy, dm, dd] = defaultIso.split('-').map(Number);
  const d = Number(parts[0]);
  const m = monthIdx || (parts[1] ? Number(parts[1]) : dm);
  let y = parts[2] ? Number(parts[2]) : dy;
  if (parts[2] && parts[2].length <= 2) y = 2000 + y;
  void dd;
  return valid(y, m, d) ? iso(y, m, d) : null;
}

/** 2025-04-01 -> 1-Apr-2025 */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${d}-${MON[m - 1]}-${y}`;
}

export function weekday(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

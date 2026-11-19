/** Money is integer paisa (1 BDT = 100 paisa). Never floats. */
export type Paisa = number;

export function toPaisa(taka: number | string): Paisa {
  const s = typeof taka === 'number' ? taka.toFixed(2) : taka.replace(/,/g, '').trim();
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error(`Invalid amount: ${taka}`);
  const p = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0') || 0);
  return m[1] ? -p : p;
}

/** Lakh/crore grouping: 12345678 -> 1,23,45,678 */
export function groupIndian(intStr: string): string {
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3);
  let rest = intStr.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

export function formatAmount(p: Paisa, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? true;
  const neg = p < 0;
  const abs = Math.abs(p);
  const int = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  const s = groupIndian(String(int)) + (decimals ? `.${frac}` : '');
  return neg ? `-${s}` : s;
}

/** Signed paisa (+Dr / -Cr) -> "1,23,456.00 Dr" */
export function formatDrCr(p: Paisa): string {
  if (p === 0) return '0.00';
  return `${formatAmount(Math.abs(p))} ${p > 0 ? 'Dr' : 'Cr'}`;
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
  'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const out: string[] = [];
  if (n >= 100) {
    out.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    out.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
  } else if (n > 0) out.push(ONES[n]);
  return out.join(' ');
}

/** "Taka Five Thousand Only" (lakh/crore system) */
export function amountInWords(p: Paisa): string {
  const abs = Math.abs(p);
  let taka = Math.floor(abs / 100);
  const paisa = abs % 100;
  if (taka === 0 && paisa === 0) return 'Taka Zero Only';
  const parts: string[] = [];
  const crore = Math.floor(taka / 10000000);
  taka %= 10000000;
  const lakh = Math.floor(taka / 100000);
  taka %= 100000;
  const thousand = Math.floor(taka / 1000);
  taka %= 1000;
  if (crore) parts.push(`${below1000(crore)} Crore`);
  if (lakh) parts.push(`${below1000(lakh)} Lakh`);
  if (thousand) parts.push(`${below1000(thousand)} Thousand`);
  if (taka) parts.push(below1000(taka));
  let s = parts.join(' ');
  if (paisa) s += `${s ? ' and ' : ''}${below1000(paisa)} Paisa`;
  return `Taka ${s} Only`;
}

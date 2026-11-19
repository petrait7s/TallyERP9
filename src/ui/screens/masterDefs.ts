import { formatAmount, groupPath, type Company, type MasterKind, type MasterMap } from '../../engine';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'amount' | 'rate' | 'int';
  options?: (c: Company, d: Draft) => string[];
  /** Alt+C creates this kind on the fly */
  createKind?: MasterKind;
  visible?: (d: Draft) => boolean;
  hint?: string;
}
export type Draft = Record<string, string>;

export interface MasterDef {
  kind: MasterKind;
  title: string;
  plural: string;
  fields: FieldDef[];
  blank(c: Company): Draft;
  toDraft(c: Company, name: string): Draft;
  fromDraft(c: Company, d: Draft): MasterMap[MasterKind];
}

const PRIMARY = 'Primary';
const NATURES = ['asset', 'liability', 'income', 'expense'];

/** "1,000.50 Cr" -> signed paisa (+Dr/-Cr). Default side supplied by caller. */
export function parseOpening(text: string, defaultSide: 'Dr' | 'Cr'): number {
  const m = /^\s*([\d,]*\.?\d*)\s*(dr|cr)?\s*$/i.exec(text);
  if (!m || !m[1] || m[1] === '.') {
    if (!text.trim()) return 0;
    throw new Error(`Invalid amount: ${text}`);
  }
  const [i, f = ''] = m[1].replace(/,/g, '').split('.');
  const paisa = Number(i || 0) * 100 + Number(f.padEnd(2, '0').slice(0, 2));
  const side = (m[2] ?? defaultSide).toLowerCase() === 'dr' ? 1 : -1;
  return paisa * side;
}

export function formatOpening(p: number): string {
  return p === 0 ? '' : `${formatAmount(Math.abs(p))} ${p > 0 ? 'Dr' : 'Cr'}`;
}

function parseScaled(text: string, scale: number): number {
  if (!/^\d+(\.\d+)?$/.test(text.trim())) throw new Error(`Invalid number: ${text}`);
  const [i, f = ''] = text.trim().split('.');
  const digits = String(scale).length - 1;
  return Number(i) * scale + Number(f.padEnd(digits, '0').slice(0, digits));
}

export function defaultSideForGroup(c: Company, group: string): 'Dr' | 'Cr' {
  try {
    const prim = c.groups.find((g) => g.name === groupPath(c.groups, group)[0]);
    return prim && (prim.nature === 'asset' || prim.nature === 'expense') ? 'Dr' : 'Cr';
  } catch {
    return 'Dr';
  }
}

const names = (xs: { name: string }[]) => xs.map((x) => x.name);
const orNull = (s: string) => (s === PRIMARY || !s ? null : s);

export const DEFS: Record<MasterKind, MasterDef> = {
  group: {
    kind: 'group', title: 'Group', plural: 'Groups',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'parent', label: 'Under', type: 'select', options: (c) => [PRIMARY, ...names(c.groups)], createKind: 'group' },
      { key: 'nature', label: 'Nature of Group', type: 'select', options: () => NATURES, visible: (d) => d.parent === PRIMARY },
    ],
    blank: () => ({ name: '', parent: PRIMARY, nature: 'liability' }),
    toDraft: (c, n) => { const g = c.groups.find((x) => x.name === n)!; return { name: g.name, parent: g.parent ?? PRIMARY, nature: g.nature }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), parent: orNull(d.parent), nature: d.nature as any }),
  },
  ledger: {
    kind: 'ledger', title: 'Ledger', plural: 'Ledgers',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'group', label: 'Under', type: 'select', options: (c) => names(c.groups), createKind: 'group' },
      { key: 'currency', label: 'Currency', type: 'select', options: (c) => names(c.currencies), createKind: 'currency' },
      { key: 'billWise', label: 'Maintain balances bill-by-bill', type: 'select', options: () => ['No', 'Yes'] },
      { key: 'costCentres', label: 'Cost centres are applicable', type: 'select', options: () => ['No', 'Yes'] },
      { key: 'opening', label: 'Opening Balance', type: 'amount', hint: 'e.g. 85,000 or 2,00,000 Cr' },
    ],
    blank: (c) => ({ name: '', group: '', currency: c.currency, billWise: 'No', costCentres: 'No', opening: '' }),
    toDraft: (c, n) => {
      const l = c.ledgers.find((x) => x.name === n)!;
      return { name: l.name, group: l.group, currency: l.currency ?? c.currency, billWise: l.billWise ? 'Yes' : 'No', costCentres: l.costCentresApplicable ? 'Yes' : 'No', opening: formatOpening(l.opening) };
    },
    fromDraft: (c, d) => ({
      name: d.name.trim(), group: d.group,
      opening: parseOpening(d.opening, defaultSideForGroup(c, d.group)),
      billWise: d.billWise === 'Yes', costCentresApplicable: d.costCentres === 'Yes',
      ...(d.currency && d.currency !== c.currency ? { currency: d.currency } : {}),
    }),
  },
  voucherType: {
    kind: 'voucherType', title: 'Voucher Type', plural: 'Voucher Types',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'kind', label: 'Type of voucher', type: 'select', options: (c) => [...new Set(c.voucherTypes.map((v) => v.kind))] },
    ],
    blank: () => ({ name: '', kind: '' }),
    toDraft: (c, n) => { const v = c.voucherTypes.find((x) => x.name === n)!; return { name: v.name, kind: v.kind }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), kind: d.kind as any }),
  },
  costCategory: {
    kind: 'costCategory', title: 'Cost Category', plural: 'Cost Categories',
    fields: [{ key: 'name', label: 'Name', type: 'text' }],
    blank: () => ({ name: '' }),
    toDraft: (_c, n) => ({ name: n }),
    fromDraft: (_c, d) => ({ name: d.name.trim() }),
  },
  costCentre: {
    kind: 'costCentre', title: 'Cost Centre', plural: 'Cost Centres',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Under Category', type: 'select', options: (c) => c.costCategories, createKind: 'costCategory' },
    ],
    blank: () => ({ name: '', category: 'Primary Cost Category' }),
    toDraft: (c, n) => { const x = c.costCentres.find((y) => y.name === n)!; return { name: x.name, category: x.category }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), category: d.category }),
  },
  currency: {
    kind: 'currency', title: 'Currency', plural: 'Currencies',
    fields: [
      { key: 'name', label: 'Currency Name', type: 'text' },
      { key: 'symbol', label: 'Symbol', type: 'text' },
      { key: 'rate', label: 'Rate (BDT per unit)', type: 'rate' },
    ],
    blank: () => ({ name: '', symbol: '', rate: '1' }),
    toDraft: (c, n) => { const x = c.currencies.find((y) => y.name === n)!; return { name: x.name, symbol: x.symbol, rate: String(x.rate / 10000) }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), symbol: d.symbol.trim(), rate: parseScaled(d.rate, 10000) }),
  },
  unit: {
    kind: 'unit', title: 'Unit', plural: 'Units',
    fields: [
      { key: 'name', label: 'Symbol', type: 'text' },
      { key: 'decimals', label: 'Number of decimal places', type: 'int' },
    ],
    blank: () => ({ name: '', decimals: '0' }),
    toDraft: (c, n) => { const x = c.units.find((y) => y.name === n)!; return { name: x.name, decimals: String(x.decimals) }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), decimals: Number(d.decimals) }),
  },
  stockGroup: {
    kind: 'stockGroup', title: 'Stock Group', plural: 'Stock Groups',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'parent', label: 'Under', type: 'select', options: (c) => [PRIMARY, ...names(c.stockGroups)], createKind: 'stockGroup' },
    ],
    blank: () => ({ name: '', parent: PRIMARY }),
    toDraft: (c, n) => { const x = c.stockGroups.find((y) => y.name === n)!; return { name: x.name, parent: x.parent ?? PRIMARY }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), parent: orNull(d.parent) }),
  },
  stockItem: {
    kind: 'stockItem', title: 'Stock Item', plural: 'Stock Items',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'group', label: 'Under', type: 'select', options: (c) => [PRIMARY, ...names(c.stockGroups)], createKind: 'stockGroup' },
      { key: 'unit', label: 'Units', type: 'select', options: (c) => names(c.units), createKind: 'unit' },
      { key: 'qty', label: 'Opening Quantity', type: 'int' },
      { key: 'rate', label: 'Opening Rate (per unit)', type: 'rate' },
    ],
    blank: () => ({ name: '', group: PRIMARY, unit: '', qty: '0', rate: '0' }),
    toDraft: (c, n) => { const x = c.stockItems.find((y) => y.name === n)!; return { name: x.name, group: x.group ?? PRIMARY, unit: x.unit, qty: String(x.openingQty), rate: String(x.openingRate / 100) }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), group: orNull(d.group), unit: d.unit, openingQty: Number(d.qty), openingRate: parseScaled(d.rate, 100) }),
  },
  godown: {
    kind: 'godown', title: 'Godown', plural: 'Godowns',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'parent', label: 'Under', type: 'select', options: (c) => [PRIMARY, ...names(c.godowns)], createKind: 'godown' },
    ],
    blank: () => ({ name: '', parent: PRIMARY }),
    toDraft: (c, n) => { const x = c.godowns.find((y) => y.name === n)!; return { name: x.name, parent: x.parent ?? PRIMARY }; },
    fromDraft: (_c, d) => ({ name: d.name.trim(), parent: orNull(d.parent) }),
  },
};

export const ACCOUNTING_KINDS: MasterKind[] = ['group', 'ledger', 'voucherType', 'costCategory', 'costCentre', 'currency'];
export const INVENTORY_KINDS: MasterKind[] = ['stockGroup', 'stockItem', 'unit', 'godown'];

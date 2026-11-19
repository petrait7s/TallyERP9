import { AccountingError, addLedger, defaultVoucherTypes } from './company';
import { defaultGroups, groupPath } from './groups';
import type {
  Company, CostCentre, Currency, Godown, Group, Ledger, StockGroup, StockItem, Unit, VoucherType,
} from './types';

export type MasterKind =
  | 'group' | 'ledger' | 'voucherType' | 'costCategory' | 'costCentre'
  | 'currency' | 'unit' | 'stockGroup' | 'stockItem' | 'godown';

/** Plain-object masters; costCategory is just a name. */
export interface MasterMap {
  group: Group;
  ledger: Ledger;
  voucherType: VoucherType;
  costCategory: { name: string };
  costCentre: CostCentre;
  currency: Currency;
  unit: Unit;
  stockGroup: StockGroup;
  stockItem: StockItem;
  godown: Godown;
}

const RESERVED_LEDGERS = new Set(['Cash', 'Profit & Loss A/c']);
const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function collection(c: Company, kind: MasterKind): { name: string }[] {
  switch (kind) {
    case 'group': return c.groups;
    case 'ledger': return c.ledgers;
    case 'voucherType': return c.voucherTypes;
    case 'costCategory': return c.costCategories.map((name) => ({ name }));
    case 'costCentre': return c.costCentres;
    case 'currency': return c.currencies;
    case 'unit': return c.units;
    case 'stockGroup': return c.stockGroups;
    case 'stockItem': return c.stockItems;
    case 'godown': return c.godowns;
  }
}

export function listMasters(c: Company, kind: MasterKind): string[] {
  return collection(c, kind).map((x) => x.name);
}

export function getMaster<K extends MasterKind>(c: Company, kind: K, name: string): MasterMap[K] | undefined {
  return collection(c, kind).find((x) => x.name === name) as MasterMap[K] | undefined;
}

export function isReserved(c: Company, kind: MasterKind, name: string): boolean {
  switch (kind) {
    case 'group': return defaultGroups().some((g) => g.name === name);
    case 'ledger': return RESERVED_LEDGERS.has(name);
    case 'voucherType': return defaultVoucherTypes().some((v) => v.name === name);
    case 'costCategory': return name === 'Primary Cost Category';
    case 'currency': return name === c.currency;
    case 'godown': return name === 'Main Location';
    default: return false;
  }
}

function needName(name: string): void {
  if (!name || !name.trim()) throw new AccountingError('Name cannot be blank');
}

function ensureUnique(c: Company, kind: MasterKind, name: string, ignore?: string): void {
  const names = [...listMasters(c, kind)];
  // Tally: a ledger and a group cannot share a name.
  if (kind === 'ledger') names.push(...listMasters(c, 'group'));
  if (kind === 'group') names.push(...listMasters(c, 'ledger'));
  if (names.some((n) => eq(n, name) && n !== ignore)) throw new AccountingError(`${name} already exists`);
}

function natureForGroup(c: Company, g: Group): Group['nature'] {
  if (!g.parent) return g.nature;
  const parent = c.groups.find((x) => x.name === g.parent);
  if (!parent) throw new AccountingError(`Unknown group: ${g.parent}`);
  return parent.nature;
}

function validate<K extends MasterKind>(c: Company, kind: K, m: MasterMap[K], oldName?: string): void {
  const x = m as any;
  needName(x.name);
  ensureUnique(c, kind, x.name, oldName);
  switch (kind) {
    case 'group': {
      if (x.parent && !c.groups.some((g) => g.name === x.parent)) throw new AccountingError(`Unknown group: ${x.parent}`);
      if (x.parent === x.name) throw new AccountingError('Group cannot be under itself');
      if (oldName && x.parent) {
        // cycle: new parent must not be under the group being altered
        if (groupPath(c.groups, x.parent).includes(oldName)) throw new AccountingError('Group cycle');
      }
      break;
    }
    case 'ledger':
      if (!c.groups.some((g) => g.name === x.group)) throw new AccountingError(`Unknown group: ${x.group}`);
      if (!Number.isInteger(x.opening)) throw new AccountingError('Opening must be integer paisa');
      if (x.currency && !c.currencies.some((cu) => cu.name === x.currency)) throw new AccountingError(`Unknown currency: ${x.currency}`);
      break;
    case 'costCentre':
      if (!c.costCategories.includes(x.category)) throw new AccountingError(`Unknown cost category: ${x.category}`);
      break;
    case 'currency':
      if (!(x.rate > 0) || !Number.isInteger(x.rate)) throw new AccountingError('Rate must be a positive integer (x10000)');
      break;
    case 'unit':
      if (!Number.isInteger(x.decimals) || x.decimals < 0 || x.decimals > 4) throw new AccountingError('Decimals 0-4');
      break;
    case 'stockGroup':
      if (x.parent && !c.stockGroups.some((g) => g.name === x.parent)) throw new AccountingError(`Unknown stock group: ${x.parent}`);
      if (x.parent && oldName && x.parent === oldName) throw new AccountingError('Stock group cycle');
      break;
    case 'stockItem':
      if (x.group && !c.stockGroups.some((g) => g.name === x.group)) throw new AccountingError(`Unknown stock group: ${x.group}`);
      if (!c.units.some((u) => u.name === x.unit)) throw new AccountingError(`Unknown unit: ${x.unit}`);
      break;
    case 'godown':
      if (x.parent && !c.godowns.some((g) => g.name === x.parent)) throw new AccountingError(`Unknown godown: ${x.parent}`);
      break;
    case 'voucherType':
      if (!defaultVoucherTypes().some((v) => v.kind === x.kind)) throw new AccountingError(`Unknown base voucher kind: ${x.kind}`);
      break;
  }
}

export function createMaster<K extends MasterKind>(c: Company, kind: K, m: MasterMap[K]): void {
  validate(c, kind, m);
  const x: any = { ...m };
  switch (kind) {
    case 'group': x.nature = natureForGroup(c, x); c.groups.push(x); break;
    case 'ledger': addLedger(c, x); break;
    case 'voucherType': x.nonAccounting = x.kind === 'Memorandum' || x.kind === 'Reversing Journal'; c.voucherTypes.push(x); break;
    case 'costCategory': c.costCategories.push(x.name); break;
    case 'costCentre': c.costCentres.push(x); break;
    case 'currency': c.currencies.push(x); break;
    case 'unit': c.units.push(x); break;
    case 'stockGroup': c.stockGroups.push(x); break;
    case 'stockItem': c.stockItems.push(x); break;
    case 'godown': c.godowns.push(x); break;
  }
}

function recomputeNatures(c: Company): void {
  for (const g of c.groups) if (g.parent) g.nature = natureForGroup(c, g);
}

export function alterMaster<K extends MasterKind>(c: Company, kind: K, oldName: string, m: MasterMap[K]): void {
  if (!getMaster(c, kind, oldName)) throw new AccountingError(`${oldName} not found`);
  validate(c, kind, m, oldName);
  const x: any = { ...m };
  const newName: string = x.name;
  if (newName !== oldName && isReserved(c, kind, oldName)) throw new AccountingError(`${oldName} is predefined and cannot be renamed`);
  const rep = <T extends { name: string }>(arr: T[]) => {
    const i = arr.findIndex((e) => e.name === oldName);
    arr[i] = x;
  };
  switch (kind) {
    case 'group':
      rep(c.groups);
      for (const g of c.groups) if (g.parent === oldName) g.parent = newName;
      for (const l of c.ledgers) if (l.group === oldName) l.group = newName;
      recomputeNatures(c);
      break;
    case 'ledger':
      rep(c.ledgers);
      for (const v of c.vouchers) for (const e of v.entries) if (e.ledger === oldName) e.ledger = newName;
      break;
    case 'voucherType':
      if (isReserved(c, kind, oldName) && x.kind !== (getMaster(c, kind, oldName) as VoucherType).kind)
        throw new AccountingError('Predefined voucher type kind cannot change');
      x.nonAccounting = x.kind === 'Memorandum' || x.kind === 'Reversing Journal';
      rep(c.voucherTypes);
      for (const v of c.vouchers) if (v.type === oldName) v.type = newName;
      break;
    case 'costCategory': {
      const i = c.costCategories.indexOf(oldName);
      c.costCategories[i] = newName;
      for (const cc of c.costCentres) if (cc.category === oldName) cc.category = newName;
      break;
    }
    case 'costCentre':
      rep(c.costCentres);
      for (const v of c.vouchers) for (const e of v.entries) for (const a of e.costCentres ?? []) if (a.costCentre === oldName) a.costCentre = newName;
      break;
    case 'currency':
      if (oldName === c.currency && x.rate !== 10000) throw new AccountingError('Base currency rate is fixed at 1');
      rep(c.currencies);
      for (const l of c.ledgers) if (l.currency === oldName) l.currency = newName;
      if (oldName === c.currency) c.currency = newName;
      break;
    case 'unit':
      rep(c.units);
      for (const i of c.stockItems) if (i.unit === oldName) i.unit = newName;
      break;
    case 'stockGroup':
      rep(c.stockGroups);
      for (const g of c.stockGroups) if (g.parent === oldName) g.parent = newName;
      for (const i of c.stockItems) if (i.group === oldName) i.group = newName;
      break;
    case 'stockItem': rep(c.stockItems); break;
    case 'godown':
      rep(c.godowns);
      for (const g of c.godowns) if (g.parent === oldName) g.parent = newName;
      break;
  }
}

export function deleteMaster(c: Company, kind: MasterKind, name: string): void {
  if (!getMaster(c, kind, name)) throw new AccountingError(`${name} not found`);
  if (isReserved(c, kind, name)) throw new AccountingError(`${name} is predefined and cannot be deleted`);
  const used = (msg: string) => { throw new AccountingError(`${name} ${msg}`); };
  const rm = (arr: { name: string }[]) => arr.splice(arr.findIndex((e) => e.name === name), 1);
  switch (kind) {
    case 'group':
      if (c.groups.some((g) => g.parent === name) || c.ledgers.some((l) => l.group === name)) used('has sub-groups or ledgers');
      rm(c.groups); break;
    case 'ledger':
      if (c.vouchers.some((v) => v.entries.some((e) => e.ledger === name))) used('is used in vouchers');
      rm(c.ledgers); break;
    case 'voucherType':
      if (c.vouchers.some((v) => v.type === name)) used('is used in vouchers');
      rm(c.voucherTypes); break;
    case 'costCategory':
      if (c.costCentres.some((cc) => cc.category === name)) used('has cost centres');
      c.costCategories.splice(c.costCategories.indexOf(name), 1); break;
    case 'costCentre':
      if (c.vouchers.some((v) => v.entries.some((e) => e.costCentres?.some((a) => a.costCentre === name)))) used('is used in vouchers');
      rm(c.costCentres); break;
    case 'currency':
      if (c.ledgers.some((l) => l.currency === name)) used('is used by ledgers');
      rm(c.currencies); break;
    case 'unit':
      if (c.stockItems.some((i) => i.unit === name)) used('is used by stock items');
      rm(c.units); break;
    case 'stockGroup':
      if (c.stockGroups.some((g) => g.parent === name) || c.stockItems.some((i) => i.group === name)) used('has sub-groups or items');
      rm(c.stockGroups); break;
    case 'stockItem': rm(c.stockItems); break;
    case 'godown':
      if (c.godowns.some((g) => g.parent === name)) used('has sub-locations');
      rm(c.godowns); break;
  }
}

/** Opening stock value in paisa (qty x rate). Valuation proper arrives with stock vouchers. */
export function openingStockValue(c: Company): number {
  return c.stockItems.reduce((s, i) => s + i.openingQty * i.openingRate, 0);
}

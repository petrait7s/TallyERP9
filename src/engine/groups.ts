import type { Group } from './types';

const g = (name: string, parent: string | null, nature: Group['nature'], isFund = false): Group =>
  ({ name, parent, nature, ...(isFund ? { isFund } : {}) });

/** Tally ERP 9 default groups + NGO groups (see docs/02-modules.md) */
export function defaultGroups(): Group[] {
  return [
    // Tally primary & sub groups
    g('Branch / Divisions', null, 'liability'),
    g('Capital Account', null, 'liability'),
    g('Reserves & Surplus', 'Capital Account', 'liability'),
    g('Current Assets', null, 'asset'),
    g('Bank Accounts', 'Current Assets', 'asset'),
    g('Cash-in-hand', 'Current Assets', 'asset'),
    g('Deposits (Asset)', 'Current Assets', 'asset'),
    g('Loans & Advances (Asset)', 'Current Assets', 'asset'),
    g('Stock-in-hand', 'Current Assets', 'asset'),
    g('Sundry Debtors', 'Current Assets', 'asset'),
    g('Current Liabilities', null, 'liability'),
    g('Duties & Taxes', 'Current Liabilities', 'liability'),
    g('Provisions', 'Current Liabilities', 'liability'),
    g('Sundry Creditors', 'Current Liabilities', 'liability'),
    g('Fixed Assets', null, 'asset'),
    g('Investments', null, 'asset'),
    g('Loans (Liability)', null, 'liability'),
    g('Bank OD A/c', 'Loans (Liability)', 'liability'),
    g('Secured Loans', 'Loans (Liability)', 'liability'),
    g('Unsecured Loans', 'Loans (Liability)', 'liability'),
    g('Misc. Expenses (ASSET)', null, 'asset'),
    g('Suspense A/c', null, 'liability'),
    g('Direct Expenses', null, 'expense'),
    g('Direct Incomes', null, 'income'),
    g('Indirect Expenses', null, 'expense'),
    g('Indirect Incomes', null, 'income'),
    g('Purchase Accounts', null, 'expense'),
    g('Sales Accounts', null, 'income'),
    // NGO groups
    g('Corpus Fund', 'Capital Account', 'liability', true),
    g('Capital Fund', 'Capital Account', 'liability', true),
    g('Restricted Funds', 'Capital Account', 'liability', true),
    g('Designated Funds', 'Capital Account', 'liability', true),
    g('General Fund', 'Capital Account', 'liability', true),
    g('Grants Received', 'Direct Incomes', 'income'),
    g('Donations', 'Direct Incomes', 'income'),
    g('Membership Fees', 'Direct Incomes', 'income'),
    g('Entrance Fees', 'Direct Incomes', 'income'),
    g('Programme Expenses', 'Direct Expenses', 'expense'),
    g('Admin Expenses', 'Indirect Expenses', 'expense'),
    g('Salaries', 'Indirect Expenses', 'expense'),
    g('Fundraising Expenses', 'Indirect Expenses', 'expense'),
  ];
}

export function groupPath(groups: Group[], name: string): string[] {
  const byName = new Map(groups.map((x) => [x.name, x]));
  const path: string[] = [];
  let cur = byName.get(name);
  const guard = new Set<string>();
  while (cur) {
    if (guard.has(cur.name)) throw new Error(`Group cycle at ${cur.name}`);
    guard.add(cur.name);
    path.unshift(cur.name);
    cur = cur.parent ? byName.get(cur.parent) : undefined;
  }
  if (!path.length) throw new Error(`Unknown group: ${name}`);
  return path;
}

export function isUnder(groups: Group[], group: string, ancestor: string): boolean {
  return groupPath(groups, group).includes(ancestor);
}

export function primaryOf(groups: Group[], name: string): Group {
  const p = groupPath(groups, name)[0];
  return groups.find((x) => x.name === p)!;
}

/** Gateway of Tally menu tree (order as ERP 9; "Profit & Loss A/c" is I&E for NGO). */
import type { MasterKind } from '../../engine';
import { ACCOUNTING_KINDS, DEFS, INVENTORY_KINDS } from '../screens/masterDefs';

export interface MenuItem {
  /** opens a master screen */
  /** voucher type name to create */
  voucher?: string;
  /** opens voucher register */
  register?: boolean;
  master?: { mode: 'create' | 'alter' | 'display'; kind: MasterKind };
  label: string;
  /** submenu */
  children?: MenuItem[];
  /** non-selectable group heading */
  heading?: boolean;
  quit?: boolean;
}

function kinds(mode: 'create' | 'alter' | 'display', ks: MasterKind[]): MenuItem[] {
  return ks.map((kind) => ({ label: mode === 'create' ? DEFS[kind].title : DEFS[kind].plural, master: { mode, kind } }));
}
function masterTree(mode: 'create' | 'alter' | 'display'): MenuItem[] {
  return [
    { label: mode === 'display' ? 'Accounts Info' : 'Accounting Masters', children: kinds(mode, ACCOUNTING_KINDS) },
    { label: mode === 'display' ? 'Inventory Info' : 'Inventory Masters', children: kinds(mode, INVENTORY_KINDS) },
  ];
}

export const GATEWAY: MenuItem[] = [
  { label: 'Masters', heading: true },
  { label: 'Create', children: masterTree('create') },
  { label: 'Alter', children: masterTree('alter') },
  { label: 'Display Masters', children: masterTree('display') },
  { label: 'Transactions', heading: true },
  { label: 'Accounting Vouchers', children: [] }, // filled dynamically from voucher types
  { label: 'Inventory Vouchers' },
  { label: 'Utilities', heading: true },
  { label: 'Banking' },
  { label: 'Reports', heading: true },
  { label: 'Balance Sheet' },
  { label: 'Income & Expenditure A/c' },
  { label: 'Receipts & Payments A/c' },
  { label: 'Stock Summary' },
  { label: 'Ratio Analysis' },
  { label: 'Display', children: [
    { label: 'Trial Balance' }, { label: 'Day Book', register: true }, { label: 'Account Books' },
    { label: 'Statements of Accounts' }, { label: 'Inventory Books' }, { label: 'Statutory Reports' },
  ] },
  { label: 'Quit', quit: true },
];

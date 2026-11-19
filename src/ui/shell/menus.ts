/** Gateway of Tally menu tree (order as ERP 9; "Profit & Loss A/c" is I&E for NGO). */
import type { MasterKind } from '../../engine';
import type { ReportParams } from '../reports/types';
import { ACCOUNTING_KINDS, DEFS, INVENTORY_KINDS } from '../screens/masterDefs';

export interface MenuItem {
  /** opens a master screen */
  /** voucher type name to create */
  voucher?: string;
  /** opens a report */
  report?: ReportParams;
  /** choose a master first, then open the report with it */
  pick?: { kind: MasterKind; report: 'ledger' | 'group' | 'centre' };
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
  { label: 'Balance Sheet', report: { id: 'bs' } },
  { label: 'Income & Expenditure A/c', report: { id: 'ie' } },
  { label: 'Receipts & Payments A/c', report: { id: 'rp' } },
  { label: 'Stock Summary', report: { id: 'stock' } },
  { label: 'Ratio Analysis', report: { id: 'ratio' } },
  { label: 'Display', children: [
    { label: 'Trial Balance', report: { id: 'tb' } },
    { label: 'Day Book', report: { id: 'daybook' } },
    { label: 'Account Books', children: [
      { label: 'Cash/Bank Books', report: { id: 'cashbank' } },
      { label: 'Ledger', pick: { kind: 'ledger', report: 'ledger' } },
      { label: 'Group Summary', pick: { kind: 'group', report: 'group' } },
    ] },
    { label: 'Statements of Accounts', children: [
      { label: 'Outstandings', children: [
        { label: 'Receivables', report: { id: 'outstanding', billGroup: 'Sundry Debtors' } },
        { label: 'Payables', report: { id: 'outstanding', billGroup: 'Sundry Creditors' } },
      ] },
      { label: 'Fund Statement', report: { id: 'funds' } },
      { label: 'Project / Cost Centre Statement', report: { id: 'centres' } },
    ] },
    { label: 'Inventory Books', children: [{ label: 'Stock Summary', report: { id: 'stock' } }] },
    { label: 'Statutory Reports' },
  ] },
  { label: 'Quit', quit: true },
];

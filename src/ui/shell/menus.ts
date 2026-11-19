/** Gateway of Tally menu tree (order as ERP 9; "Profit & Loss A/c" is I&E for NGO). */
import type { Features, MasterKind } from '../../engine';
import type { ReportParams } from '../reports/types';
import { ACCOUNTING_KINDS, DEFS, INVENTORY_KINDS } from '../screens/masterDefs';

export interface MenuItem {
  /** hidden unless this F11 feature is on */
  feature?: keyof Features;
  /** company-management action (see CompanyScreen) */
  action?: string;
  /** not shown on the Gateway (reached by a key) */
  hidden?: boolean;
  /** opens a master screen */
  /** voucher type name to create */
  voucher?: string;
  /** opens a register list / module report (asks for arguments first) / action form / built-in function */
  reg?: string;
  mod?: string;
  run?: string;
  fn?: string;
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

const KIND_FEATURE: Partial<Record<MasterKind, keyof Features>> = {
  costCategory: 'costCentres', costCentre: 'costCentres', currency: 'multiCurrency',
  stockGroup: 'inventory', stockItem: 'inventory', unit: 'inventory', godown: 'inventory',
};

function kinds(mode: 'create' | 'alter' | 'display', ks: MasterKind[]): MenuItem[] {
  return ks.map((kind) => ({
    label: mode === 'create' ? DEFS[kind].title : DEFS[kind].plural, master: { mode, kind }, feature: KIND_FEATURE[kind],
  }));
}
function masterTree(mode: 'create' | 'alter' | 'display'): MenuItem[] {
  return [
    { label: mode === 'display' ? 'Accounts Info' : 'Accounting Masters', children: kinds(mode, ACCOUNTING_KINDS) },
    { label: mode === 'display' ? 'Inventory Info' : 'Inventory Masters', children: kinds(mode, INVENTORY_KINDS), feature: 'inventory' },
  ];
}


const R = (label: string, id: string): MenuItem => ({ label, reg: id });
const M = (label: string, mod: string): MenuItem => ({ label, mod });
const A = (label: string, run: string): MenuItem => ({ label, run });
const F = (label: string, fn: string): MenuItem => ({ label, fn });
const mod = (label: string, children: MenuItem[], feature?: keyof Features): MenuItem => ({ label, children, feature });

const NGO: MenuItem[] = [
  mod('Payroll', [R('Employee Master', 'employees'), A('Post Payroll Voucher', 'payroll'), M('Payroll Register', 'payroll.register'), M('Payslip', 'payroll.slip'), M('Project-wise Payroll Cost', 'payroll.project')], 'payroll'),
  mod('Funds & Donors', [M('Fund-wise Statement', 'funds.statement'), A('Inter-fund Transfer', 'fundTransfer'), R('Donor Master', 'donors'), M('Donor Contribution Register', 'donors.register'), M('Thank-you List', 'donors.thanks')]),
  mod('Grants', [R('Grant Master', 'grants'), R('Grant Budget Lines', 'grantBudget'), M('Grant Register', 'grants.register'), M('Donor Report (utilisation)', 'grants.utilisation'), M('Tranche Schedule', 'grants.tranches'),
    A('Move Unspent to Restricted Fund', 'restrictUnspent'), A('Refund Unspent Grant', 'refundGrant'), M('Donor x Project Report', 'grants.cross'), M('Foreign Donation Register', 'grants.foreign'), M('FC Receipts', 'grants.fx'), A('FC Receipt Voucher', 'fxReceipt')]),
  mod('Projects & Budgets', [R('Project Master', 'projects'), M('Project Costing', 'projects.cost'), M('Burn Rate', 'projects.burn'), R('Budgets', 'budgets'), M('Budget vs Actual', 'budgets.variance')]),
  mod('Membership', [R('Member Master', 'members'), M('Subscription Status', 'members.status')]),
  mod('Beneficiaries', [R('Beneficiary Register', 'beneficiaries'), R('Distribution Register', 'distributions'), M('Beneficiaries per Project', 'ben.count'), M('Distribution by Camp', 'ben.distribution')]),
  mod('Procurement', [R('Procurement Register', 'procurement'), M('Three-way Match', 'proc.match')]),
  mod('Fixed Assets', [R('Asset Register', 'assets'), A('Run Depreciation', 'depreciation'), A('Dispose Asset', 'disposeAsset'), M('Schedule of Fixed Assets', 'assets.schedule'), M('Physical Verification', 'assets.verify')]),
  mod('Petty Cash', [R('Imprest Master', 'imprest'), M('Cash Count Sheet', 'petty.count'), A('Replenish Imprest', 'replenish')]),
  mod('Fundraising', [R('Pledge Register', 'pledges'), M('Pledges vs Received', 'pledges.status'), M('Campaign ROI', 'campaign.roi')]),
  mod('Treasury & Banking', [R('FDR Register', 'fdrs'), M('FDR Interest Accrual', 'fdr.accrual'), A('Post FDR Accrual', 'fdrAccrual'), M('Bank Allocation by Fund', 'bank.allocation'), M('Bank Reconciliation', 'bank.reco'), A('Mark Voucher Reconciled', 'reconcile'), M('Cheque Register', 'bank.cheques'), M('Post-dated Cheques', 'bank.pdc')]),
  mod('Sub-grants', [R('Partner Register', 'partners'), M('Statement of Expenditure', 'sub.statement')]),
  mod('Inventory (advanced)', [R('Stock Movements', 'stockMoves'), R('Reorder / Physical Stock', 'reorder'), R('Price Lists', 'priceLists'), R('Orders', 'orders'), R('Bill of Materials', 'bom'), M('Stock Summary', 'inv.stock'), M('Physical Stock', 'inv.physical'), M('Orders Pending', 'inv.orders'), M('Batch-wise Stock', 'inv.batches')], 'inventory'),
  mod('Credit Control', [M('Interest on Overdue', 'cc.interest'), M('Payment Reminders', 'cc.reminders'), M('Confirmation Letter', 'cc.letter')], 'billWise'),
  mod('Audit & Compliance', [M('Audit Exceptions', 'audit.exceptions'), M('Edit Log', 'audit.editlog'), M('Year-end Checklist', 'audit.yearend'), M('Scenario (optional vouchers)', 'audit.scenario'), R('Related Parties', 'relatedParties'), R('Bank Confirmations', 'bankConf'), M('Error Lab Status', 'lab.status')]),
  mod('Reporting Pack', [M('Notes to Accounts', 'pack.notes'), M('Utilisation Certificate', 'pack.uc'), M('Project Completion Report', 'pack.completion'), M('Management Statistics', 'pack.dashboard'), M('Annual Report Table', 'pack.annual'), F('Auditor Pack (PDF)', 'auditorPack')]),
  mod('Security & Data', [R('Users & Roles', 'users'), F('Select User', 'login'), A('Set Vault Password', 'vault'), R('Voucher Classes', 'voucherClasses'), F('Export Masters (XML)', 'xmlExport'), A('Import Ledgers (XML)', 'xmlImport'), F('Reset Company to Seed', 'resetSeed')]),
];

export const GATEWAY: MenuItem[] = [
  { label: 'Masters', heading: true },
  { label: 'Create', children: masterTree('create') },
  { label: 'Alter', children: masterTree('alter') },
  { label: 'Display Masters', children: masterTree('display') },
  { label: 'Transactions', heading: true },
  { label: 'Accounting Vouchers', children: [] }, // filled dynamically from voucher types
  { label: 'Inventory Vouchers', feature: 'inventory' },
  { label: 'Utilities', heading: true },
  { label: 'Banking', feature: 'bankRecon' },
  { label: 'Reports', heading: true },
  { label: 'Balance Sheet', report: { id: 'bs' } },
  { label: 'Income & Expenditure A/c', report: { id: 'ie' } },
  { label: 'Receipts & Payments A/c', report: { id: 'rp' } },
  { label: 'Stock Summary', report: { id: 'stock' }, feature: 'inventory' },
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
      { label: 'Outstandings', feature: 'billWise', children: [
        { label: 'Receivables', report: { id: 'outstanding', billGroup: 'Sundry Debtors' } },
        { label: 'Payables', report: { id: 'outstanding', billGroup: 'Sundry Creditors' } },
      ] },
      { label: 'Fund Statement', report: { id: 'funds' } },
      { label: 'Project / Cost Centre Statement', report: { id: 'centres' }, feature: 'costCentres' },
    ] },
    { label: 'Inventory Books', feature: 'inventory', children: [{ label: 'Stock Summary', report: { id: 'stock' } }] },
    { label: 'Statutory Reports', feature: 'vatTds', children: [
      { label: 'VAT Summary', report: { id: 'vat' } },
      { label: 'TDS Payable & Challans', report: { id: 'tds' } },
    ] },
  ] },
  { label: 'Learning', heading: true },
  { label: 'Learning Centre', fn: 'learn' },
  { label: 'NGO Management', heading: true },
  ...NGO,
  { label: 'Quit', quit: true },
  {
    label: 'Company Info', hidden: true,
    children: [
      { label: 'Select Company', action: 'select' },
      { label: 'Create Company', action: 'create' },
      { label: 'Alter Company', action: 'alter-list' },
      { label: 'Delete Company', action: 'delete' },
      { label: 'Split Company Data', action: 'split' },
      { label: 'Backup', action: 'backup' },
      { label: 'Restore', action: 'restore' },
      { label: 'Data Repair', action: 'repair' },
    ],
  },
];

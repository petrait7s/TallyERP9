/** Gateway of Tally menu tree (order as ERP 9; "Profit & Loss A/c" is I&E for NGO). */
export interface MenuItem {
  label: string;
  /** submenu */
  children?: MenuItem[];
  /** non-selectable group heading */
  heading?: boolean;
  quit?: boolean;
}

export const GATEWAY: MenuItem[] = [
  { label: 'Masters', heading: true },
  { label: 'Create', children: [{ label: 'Accounting Masters' }, { label: 'Inventory Masters' }] },
  { label: 'Alter', children: [{ label: 'Accounting Masters' }, { label: 'Inventory Masters' }] },
  { label: 'Transactions', heading: true },
  {
    label: 'Accounting Vouchers',
    children: [
      { label: 'F4: Contra' }, { label: 'F5: Payment' }, { label: 'F6: Receipt' }, { label: 'F7: Journal' },
      { label: 'F8: Sales' }, { label: 'F9: Purchase' }, { label: 'Ctrl+F8: Credit Note' }, { label: 'Ctrl+F9: Debit Note' },
    ],
  },
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
    { label: 'Trial Balance' }, { label: 'Day Book' }, { label: 'Account Books' },
    { label: 'Statements of Accounts' }, { label: 'Inventory Books' }, { label: 'Statutory Reports' },
  ] },
  { label: 'Quit', quit: true },
];

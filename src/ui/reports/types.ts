export type ReportId =
  | 'bs' | 'ie' | 'rp' | 'tb' | 'daybook' | 'ledger' | 'group' | 'cashbank'
  | 'outstanding' | 'stock' | 'centres' | 'centre' | 'ratio' | 'funds' | 'vat' | 'tds' | 'mod' | 'register';

export interface ReportParams {
  id: ReportId;
  group?: string | null;
  ledger?: string;
  centre?: string;
  /** Sundry Debtors / Sundry Creditors */
  billGroup?: string;
  /** module report key (see MOD_REPORTS) and 'k=v|k=v' arguments */
  mod?: string;
  arg?: string;
  /** register id for the register viewer */
  reg?: string;
}

export interface Row {
  cells: string[];
  /** indent level of first cell */
  indent?: number;
  bold?: boolean;
  /** total / rule row (not selectable) */
  total?: boolean;
  /** section heading (not selectable) */
  heading?: boolean;
  drill?: ReportParams;
  voucherId?: number;
}

export interface ReportModel {
  title: string;
  subtitle?: string;
  layout: 'single' | 'double';
  columns: string[];
  rows: Row[];
  /** right-hand side for double layout (same columns) */
  right?: Row[];
  leftTitle?: string;
  rightTitle?: string;
  /** numeric columns are right-aligned from this index */
  numericFrom: number;
  canDetail: boolean;
  canVertical: boolean;
  /** day-book style voucher actions (Alt+2 / Alt+X) */
  voucherActions?: boolean;
  /** show a status note under the table */
  note?: string;
}

export interface BuildOpts { detailed: boolean; vertical: boolean }

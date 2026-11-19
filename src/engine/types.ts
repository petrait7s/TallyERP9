import type { Paisa } from './money';

export type Nature = 'asset' | 'liability' | 'income' | 'expense';

export interface Group {
  name: string;
  parent: string | null; // null = primary
  nature: Nature;
  /** NGO fund group: closing balance flows into Balance Sheet as fund */
  isFund?: boolean;
}

export interface Ledger {
  name: string;
  group: string;
  /** signed paisa: +Dr / -Cr */
  opening: Paisa;
  billWise?: boolean;
  costCentresApplicable?: boolean;
  currency?: string;
  /** opening outstanding bills (signed paisa, +Dr/-Cr) for bill-wise ledgers */
  /** statutory simulation: VAT or TDS liability ledger */
  taxType?: 'VAT' | 'TDS';
  /** rate in basis points (1500 = 15.00%) */
  taxRate?: number;
  openingBills?: { ref: string; amount: Paisa; date: string }[];
}

export type VoucherKind =
  | 'Contra' | 'Payment' | 'Receipt' | 'Journal' | 'Sales' | 'Purchase'
  | 'Credit Note' | 'Debit Note' | 'Memorandum' | 'Reversing Journal';

export interface VoucherType {
  name: string;
  kind: VoucherKind;
  /** Memorandum / Reversing Journal / Optional never hit books */
  nonAccounting?: boolean;
}

export interface BillRef {
  method: 'New Ref' | 'Agst Ref' | 'Advance' | 'On Account';
  ref: string;
  amount: Paisa; // positive
}

export interface CostAlloc {
  costCentre: string;
  amount: Paisa; // positive
}

export interface Entry {
  ledger: string;
  /** signed paisa: +Dr / -Cr */
  amount: Paisa;
  bills?: BillRef[];
  costCentres?: CostAlloc[];
}

export interface EditLogEntry { seq: number; action: 'create' | 'alter' | 'cancel' | 'delete' | 'duplicate'; voucherId: number; type: string; number: string; date: string; user?: string }

export type Row = Record<string, string>;

export interface ErrorLabItem {
  id: string;
  kind: string;
  voucherId: number;
  description: string;
  /** fixed when voucher is gone/cancelled (gone) or satisfies these */
  fix: { gone?: boolean; expectLedger?: string; rejectLedger?: string; expectAmount?: number; expectCentre?: string };
}

export interface CompanyMeta {
  seedKey?: 'scdf' | 'tea' | 'blank';
  errorLab?: ErrorLabItem[];
  /** simulated Tally Vault password (plain, teaching only) */
  vault?: string;
}

export interface Voucher {
  /** bank statement date when the bank line cleared (bank reconciliation) */
  bankDate?: string;
  /** foreign-currency source amount (simulated multi-currency receipt) */
  fx?: { currency: string; amount: number; rate: number };
  id: number;
  type: string;
  number: string;
  date: string; // ISO yyyy-mm-dd
  entries: Entry[];
  narration?: string;
  cancelled?: boolean;
  optional?: boolean;
  postDated?: boolean;
  chequeNo?: string;
  /** auto-reversal date for Reversing Journal */
  reverseOn?: string;
}

export interface CostCentre {
  name: string;
  category: string;
}

export interface Currency {
  /** ISO-like code, also the master name, e.g. BDT, USD */
  name: string;
  symbol: string;
  /** BDT per 1 unit, scaled by 10000 (integer). Base currency = 10000. */
  rate: number;
}

export interface Unit {
  name: string;
  decimals: number;
}

export interface StockGroup {
  name: string;
  parent: string | null; // null = Primary
}

export interface StockItem {
  name: string;
  group: string | null;
  unit: string;
  openingQty: number;
  /** paisa per unit */
  openingRate: Paisa;
}

export interface Godown {
  name: string;
  parent: string | null; // null = Primary location
}

/** F11 feature switches */
export interface Features {
  inventory: boolean;
  billWise: boolean;
  costCentres: boolean;
  interest: boolean;
  budgets: boolean;
  multiCurrency: boolean;
  bankRecon: boolean;
  optionalVouchers: boolean;
  vatTds: boolean;
  payroll: boolean;
}

/** F12 configuration */
export interface Config {
  /** Payment/Receipt/Sales/Purchase in single-entry layout (false = Dr/Cr lines) */
  singleEntry: boolean;
  showNarration: boolean;
  showChequeNo: boolean;
  allowPostDated: boolean;
  /** reports open in detailed view */
  reportDetailed: boolean;
}

export interface Company {
  /** data format version (see migrate) */
  version: number;
  name: string;
  fyStart: string; // ISO date
  fyEnd: string;
  currency: string;
  groups: Group[];
  ledgers: Ledger[];
  voucherTypes: VoucherType[];
  costCategories: string[];
  costCentres: CostCentre[];
  currencies: Currency[];
  units: Unit[];
  stockGroups: StockGroup[];
  stockItems: StockItem[];
  godowns: Godown[];
  vouchers: Voucher[];
  nextId: number;
  features: Features;
  config: Config;
  /** user-defined registers (donors, grants, employees, ...) */
  registers: Record<string, Row[]>;
  editLog: EditLogEntry[];
  meta: CompanyMeta;
}

export interface Period {
  from: string;
  to: string;
}

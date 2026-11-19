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

export interface Voucher {
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

export interface Company {
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
}

export interface Period {
  from: string;
  to: string;
}

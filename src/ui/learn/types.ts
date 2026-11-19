import type { MasterKind, NewVoucher, Role } from '../../engine';

export interface Bi { en: string; bn: string }

/** Declarative state checks used by lesson steps and interview tasks. */
export type Check =
  | { t: 'master'; kind: MasterKind; name: string; where?: Record<string, unknown> }
  | { t: 'voucher'; vtype?: string; ledgers?: string[]; amount?: number; narr?: string; centre?: string; optional?: boolean; postDated?: boolean; cancelled?: boolean; chequeNo?: string; fxCurrency?: string; fxAmount?: number; bankDate?: boolean; min?: number }
  | { t: 'row'; reg: string; where: Record<string, string> }
  | { t: 'feature'; key: string; on: boolean }
  | { t: 'config'; key: string; on: boolean }
  | { t: 'visited'; key: string }
  | { t: 'bill'; ledger: string; ref: string; pending?: number; min?: number }
  | { t: 'metric'; name: 'tbBalanced' | 'bsBalanced' | 'labFixed' | 'surplus' | 'integrity' | 'vouchers'; min?: number }
  | { t: 'company'; name: string }
  | { t: 'cmpExists'; name: string }
  | { t: 'user'; role: Role }
  | { t: 'vault' }
  | { t: 'not'; check: Check }
  | { t: 'all'; checks: Check[] };

/** Operations that apply a solution (used by tests, "Show me" and task banks). */
export type Op =
  | { op: 'master'; kind: MasterKind; obj: unknown }
  | { op: 'voucher'; v: NewVoucher }
  | { op: 'row'; reg: string; row: Record<string, string> }
  | { op: 'feature'; key: string; on: boolean }
  | { op: 'config'; key: string; on: boolean }
  | { op: 'visit'; key: string }
  | { op: 'run'; action: string; v: Record<string, string> }
  | { op: 'cmp'; name: string }
  | { op: 'user'; role: Role; name?: string }
  | { op: 'vault'; pw: string }
  | { op: 'alterVoucher'; narr: string; amount: number }
  | { op: 'cancelVoucher'; narr: string }
  | { op: 'deleteVoucher'; narr: string }
  | { op: 'duplicateVoucher'; narr: string }
  | { op: 'fixLab'; id: string };

export interface Step { instruction: Bi; hint?: Bi; keys?: string; check: Check }
export interface Quiz { q: Bi; options: string[]; answer: number }

export type Level = 'beginner' | 'intermediate' | 'advanced' | 'core' | 'ngo' | 'capstone';

export interface Lesson {
  id: string;
  level: Level;
  title: Bi;
  goal: Bi;
  /** seed company the sandbox starts from */
  company: 'scdf' | 'tea' | 'blank';
  /** applied after the seed loads (also on "Reset sandbox") */
  setup?: Op[];
  steps: Step[];
  quiz?: Quiz[];
  /** ops that complete every step (verified by tests) */
  solution: Op[];
  /** catalog items (docs/06) this lesson covers, e.g. ["A3","B1"] */
  covers?: string[];
}

export interface Task { id: string; family: string; text: Bi; check: Check; solution: Op[]; setup?: Op[] }
export interface Mcq { id: string; q: Bi; options: string[]; answer: number; topic: string }

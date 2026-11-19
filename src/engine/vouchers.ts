import { AccountingError } from './company';
import { isUnder } from './groups';
import type { Paisa } from './money';
import { postedVouchers } from './reports';
import type { Company, Entry, VoucherKind } from './types';

export interface VoucherLayout {
  /** single = "Account:" + particulars lines; double = Dr/Cr lines */
  mode: 'single' | 'double';
  accountLabel?: string;
  /** side the Account line takes in single mode */
  accountSide?: 'Dr' | 'Cr';
  /** groups allowed for the Account line (single mode) */
  accountGroups?: string[];
  /** every line must be under these groups */
  allowedGroups?: string[];
  hotkey: string;
}

const CB = ['Cash-in-hand', 'Bank Accounts'];

export const LAYOUTS: Record<VoucherKind, VoucherLayout> = {
  Contra: { mode: 'double', allowedGroups: CB, hotkey: 'F4' },
  Payment: { mode: 'single', accountLabel: 'Account', accountSide: 'Cr', accountGroups: CB, hotkey: 'F5' },
  Receipt: { mode: 'single', accountLabel: 'Account', accountSide: 'Dr', accountGroups: CB, hotkey: 'F6' },
  Journal: { mode: 'double', hotkey: 'F7' },
  Sales: { mode: 'single', accountLabel: 'Party A/c name', accountSide: 'Dr', accountGroups: ['Sundry Debtors', ...CB], hotkey: 'F8' },
  Purchase: { mode: 'single', accountLabel: 'Party A/c name', accountSide: 'Cr', accountGroups: ['Sundry Creditors', ...CB], hotkey: 'F9' },
  'Credit Note': { mode: 'double', hotkey: 'Ctrl+F8' },
  'Debit Note': { mode: 'double', hotkey: 'Ctrl+F9' },
  Memorandum: { mode: 'double', hotkey: 'F10' },
  'Reversing Journal': { mode: 'double', hotkey: 'F10' },
};

function inAny(c: Company, ledger: string, groups: string[]): boolean {
  const l = c.ledgers.find((x) => x.name === ledger);
  return !!l && groups.some((g) => isUnder(c.groups, l.group, g));
}

/** Tally-style restrictions per voucher kind. */
export function checkVoucherRules(c: Company, kind: VoucherKind, entries: Entry[]): void {
  const lay = LAYOUTS[kind];
  if (lay.allowedGroups) {
    for (const e of entries)
      if (!inAny(c, e.ledger, lay.allowedGroups))
        throw new AccountingError(`${kind} voucher allows only Cash/Bank ledgers (${e.ledger})`);
  }
  if (lay.mode === 'single' && lay.accountGroups) {
    const sign = lay.accountSide === 'Dr' ? 1 : -1;
    if (!entries.some((e) => Math.sign(e.amount) === sign && inAny(c, e.ledger, lay.accountGroups!)))
      throw new AccountingError(`${kind} voucher needs ${lay.accountLabel} (${lay.accountGroups.join(' / ')}) on the ${lay.accountSide} side`);
  }
}

export interface Bill {
  ledger: string;
  ref: string;
  /** signed pending (+Dr / -Cr) */
  pending: Paisa;
  /** date the reference was created */
  date: string;
}

/** Outstanding (non-zero) bill references for a ledger. */
export function outstandingBills(c: Company, ledger: string, opts: { asOn?: string; excludeVoucherId?: number } = {}): Bill[] {
  const l = c.ledgers.find((x) => x.name === ledger);
  if (!l) throw new AccountingError(`Unknown ledger: ${ledger}`);
  const map = new Map<string, Bill>();
  const add = (ref: string, amt: Paisa, date: string) => {
    const b = map.get(ref);
    if (b) b.pending += amt;
    else map.set(ref, { ledger, ref, pending: amt, date });
  };
  for (const ob of l.openingBills ?? []) add(ob.ref, ob.amount, ob.date);
  for (const v of postedVouchers(c)) {
    if (v.id === opts.excludeVoucherId) continue;
    if (opts.asOn && v.date > opts.asOn) continue;
    for (const e of v.entries) {
      if (e.ledger !== ledger) continue;
      for (const b of e.bills ?? []) {
        if (b.method === 'On Account') continue;
        add(b.ref, Math.sign(e.amount) * b.amount, v.date);
      }
    }
  }
  return [...map.values()].filter((b) => b.pending !== 0);
}

/** Bill-by-bill validation for one voucher (new or being altered). */
export function validateBills(c: Company, entries: Entry[], excludeVoucherId?: number): void {
  const local = new Map<string, Paisa>(); // key ledger|ref -> signed delta within this voucher
  for (const e of entries) {
    if (!e.bills?.length) continue;
    const l = c.ledgers.find((x) => x.name === e.ledger)!;
    if (!l.billWise) throw new AccountingError(`${e.ledger} is not maintained bill-by-bill`);
    const open = outstandingBills(c, e.ledger, { excludeVoucherId });
    const sign = Math.sign(e.amount);
    for (const b of e.bills) {
      if (b.method === 'On Account') continue;
      if (!b.ref.trim()) throw new AccountingError(`Bill reference required for ${e.ledger}`);
      const key = `${e.ledger}|${b.ref}`;
      const existing = (open.find((x) => x.ref === b.ref)?.pending ?? 0) + (local.get(key) ?? 0);
      if (b.method === 'New Ref' || b.method === 'Advance') {
        if (existing !== 0 && Math.sign(existing) !== sign) throw new AccountingError(`Bill ${b.ref} already exists for ${e.ledger}`);
        if (existing !== 0 && b.method === 'New Ref') throw new AccountingError(`Bill ${b.ref} already exists for ${e.ledger}`);
      } else {
        // Agst Ref: must reduce an existing opposite-side balance
        if (existing === 0 || Math.sign(existing) === sign) throw new AccountingError(`No pending bill ${b.ref} to adjust for ${e.ledger}`);
        if (b.amount > Math.abs(existing)) throw new AccountingError(`Bill ${b.ref}: amount exceeds pending ${Math.abs(existing)} paisa`);
      }
      local.set(key, (local.get(key) ?? 0) + sign * b.amount);
    }
  }
}

import * as E from '../../engine';
import type { Ctx } from './ops';
import type { Check } from './types';

const match = (obj: unknown, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([k, v]) => (obj as Record<string, unknown>)[k] === v);

export function evalCheck(ch: Check, ctx: Ctx): boolean {
  const c = ctx.company;
  switch (ch.t) {
    case 'master': {
      const kind = ch.kind;
      const m = E.getMaster(c, kind, ch.name);
      return !!m && (!ch.where || match(m, ch.where));
    }
    case 'voucher': {
      const n = c.vouchers.filter((v) => {
        if (ch.vtype && v.type !== ch.vtype) return false;
        if (!!v.cancelled !== !!ch.cancelled) return false;
        if (ch.ledgers && !ch.ledgers.every((l) => v.entries.some((e) => e.ledger === l))) return false;
        if (ch.amount !== undefined && !v.entries.some((e) => Math.abs(e.amount) === ch.amount)) return false;
        if (ch.narr && !v.narration?.includes(ch.narr)) return false;
        if (ch.centre && !v.entries.some((e) => e.costCentres?.some((a) => a.costCentre === ch.centre))) return false;
        if (ch.optional !== undefined && !!v.optional !== ch.optional) return false;
        if (ch.postDated !== undefined && !!v.postDated !== ch.postDated) return false;
        if (ch.chequeNo && v.chequeNo !== ch.chequeNo) return false;
        if (ch.fxCurrency && v.fx?.currency !== ch.fxCurrency) return false;
        if (ch.fxAmount !== undefined && v.fx?.amount !== ch.fxAmount) return false;
        if (ch.bankDate !== undefined && !!v.bankDate !== ch.bankDate) return false;
        return true;
      }).length;
      return n >= (ch.min ?? 1);
    }
    case 'row': return E.rows(c, ch.reg).some((r) => Object.entries(ch.where).every(([k, v]) => r[k] === v));
    case 'feature': return (c.features as unknown as Record<string, boolean>)[ch.key] === ch.on;
    case 'config': return (c.config as unknown as Record<string, boolean>)[ch.key] === ch.on;
    case 'visited': return ctx.visited.has(ch.key);
    case 'bill': {
      const b = E.outstandingBills(c, ch.ledger).find((x) => x.ref === ch.ref);
      if (ch.pending !== undefined) return Math.abs(b?.pending ?? 0) === ch.pending;
      return Math.abs(b?.pending ?? 0) >= (ch.min ?? 1);
    }
    case 'metric': {
      switch (ch.name) {
        case 'tbBalanced': return E.trialBalance(c).balanced;
        case 'bsBalanced': return E.balanceSheetGroups(c).balanced;
        case 'labFixed': return E.errorLabStatus(c).filter((x) => x.fixed).length >= (ch.min ?? 1);
        case 'surplus': return E.incomeExpenditure(c).surplus > (ch.min ?? 0);
        case 'integrity': return E.checkIntegrity(c).length === 0;
        case 'vouchers': return c.vouchers.length >= (ch.min ?? 1);
      }
      return false;
    }
    case 'company': return c.name === ch.name;
    case 'cmpExists': return ctx.companies.some((n) => n === ch.name);
    case 'user': return ctx.user.role === ch.role;
    case 'vault': return !!c.meta.vault;
    case 'not': return !evalCheck(ch.check, ctx);
    case 'all': return ch.checks.every((x) => evalCheck(x, ctx));
  }
}

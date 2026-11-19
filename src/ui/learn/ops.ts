import * as E from '../../engine';
import type { Company } from '../../engine';
import { ACTIONS } from '../actions';
import type { Op } from './types';

export interface Ctx { company: Company; visited: Set<string>; companies: string[]; user: { name: string; role: E.Role } }

function find(c: Company, narr: string): E.Voucher {
  const v = c.vouchers.find((x) => x.narration?.includes(narr));
  if (!v) throw new Error(`No voucher with narration "${narr}"`);
  return v;
}

/** Apply one op to the context (mutates ctx.company). */
export function applyOp(ctx: Ctx, op: Op): void {
  const c = ctx.company;
  switch (op.op) {
    case 'master': E.createMaster(c, (op as { kind: E.MasterKind }).kind, op.obj as never); break;
    case 'voucher': E.addVoucher(c, op.v); break;
    case 'row': E.addRow(c, op.reg, op.row); break;
    case 'feature': (c.features as unknown as Record<string, boolean>)[op.key] = op.on; break;
    case 'config': (c.config as unknown as Record<string, boolean>)[op.key] = op.on; break;
    case 'visit': ctx.visited.add(op.key); break;
    case 'run': ACTIONS[op.action].run(c, op.v); ctx.visited.add(`action:${op.action}`); break;
    case 'cmp': ctx.companies.push(op.name); break;
    case 'user': ctx.user = { name: op.name ?? 'learner', role: op.role }; break;
    case 'vault': c.meta.vault = op.pw; break;
    case 'alterVoucher': {
      const v = find(c, op.narr);
      E.alterVoucher(c, v.id, { entries: v.entries.map((e) => ({ ...e, amount: Math.sign(e.amount) * op.amount, costCentres: e.costCentres?.map((a) => ({ ...a, amount: op.amount })), bills: e.bills?.map((b) => ({ ...b, amount: op.amount })) })) });
      break;
    }
    case 'cancelVoucher': E.cancelVoucher(c, find(c, op.narr).id); break;
    case 'deleteVoucher': E.deleteVoucher(c, find(c, op.narr).id); break;
    case 'duplicateVoucher': E.duplicateVoucher(c, find(c, op.narr).id); break;
    case 'fixLab': fixLab(c, op.id); break;
  }
}

export const applyOps = (ctx: Ctx, ops: Op[] = []): void => ops.forEach((o) => applyOp(ctx, o));

/** Solve one Error Lab item (used by tests and the lesson "Show me"). */
function fixLab(c: Company, id: string): void {
  const item = c.meta.errorLab?.find((x) => x.id === id);
  const v = item && c.vouchers.find((x) => x.id === item.voucherId);
  if (!item || !v) throw new Error(`Unknown error lab item ${id}`);
  if (item.fix.gone) { E.cancelVoucher(c, v.id); return; }
  const f = item.fix;
  E.alterVoucher(c, v.id, { entries: v.entries.map((e) => {
    let x = { ...e };
    if (f.rejectLedger && x.ledger === f.rejectLedger && f.expectLedger) x = { ...x, ledger: f.expectLedger };
    if (f.expectAmount) x = { ...x, amount: Math.sign(x.amount) * f.expectAmount, costCentres: x.costCentres?.map((a) => ({ ...a, amount: f.expectAmount! })) };
    if (f.expectCentre && x.costCentres) x = { ...x, costCentres: x.costCentres.map((a) => ({ ...a, costCentre: f.expectCentre! })) };
    return x;
  }) });
}

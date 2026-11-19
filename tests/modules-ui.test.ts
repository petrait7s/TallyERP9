import { describe, expect, it } from 'vitest';
import { generateScdf } from '../src/engine';
import { ACTIONS } from '../src/ui/actions';
import { buildReport, toCsv } from '../src/ui/reports/build';
import { MOD_REPORTS } from '../src/ui/reports/modules';
import { GATEWAY, type MenuItem } from '../src/ui/shell/menus';
import { REGISTERS } from '../src/engine';

const c = generateScdf();
const per = { from: c.fyStart, to: c.fyEnd };

describe('module reports', () => {
  it('every module report builds on the seed with its default arguments', () => {
    for (const [key, def] of Object.entries(MOD_REPORTS)) {
      const arg = (def.ask ?? []).map((f) => `${f.key}=${f.def(c)}`).join('|');
      const m = buildReport(c, { id: 'mod', mod: key, arg }, per, { detailed: false, vertical: false });
      expect(m.columns.length, key).toBeGreaterThan(0);
      expect(m.rows.length, key).toBeGreaterThan(0);
      expect(m.rows[0].cells[0], key).not.toMatch(/undefined|NaN/);
      if (key !== 'pack.completion') expect(m.columns[0], key).not.toBe('Error');
      expect(toCsv(m).length).toBeGreaterThan(10);
    }
  });
  it('bad arguments produce an error row, not a crash', () => {
    const m = buildReport(c, { id: 'mod', mod: 'payroll.slip', arg: 'emp=NOPE|month=2026-03' }, per, { detailed: false, vertical: false });
    expect(m.columns[0]).toBe('Error');
  });
  it('register viewer', () => {
    const m = buildReport(c, { id: 'register', reg: 'donors' }, per, { detailed: false, vertical: false });
    expect(m.rows).toHaveLength(40);
  });
});

describe('menus', () => {
  const walk = (items: MenuItem[], f: (i: MenuItem) => void) => items.forEach((i) => { f(i); if (i.children) walk(i.children, f); });
  it('every register and module report is reachable from the Gateway', () => {
    const regs = new Set<string>(), mods = new Set<string>(), runs = new Set<string>();
    walk(GATEWAY, (i) => { if (i.reg) regs.add(i.reg); if (i.mod) mods.add(i.mod); if (i.run) runs.add(i.run); });
    for (const r of REGISTERS) expect(regs.has(r.id), `register ${r.id}`).toBe(true);
    for (const k of Object.keys(MOD_REPORTS)) expect(mods.has(k), `report ${k}`).toBe(true);
    for (const a of Object.keys(ACTIONS)) expect(runs.has(a), `action ${a}`).toBe(true);
  });
});

describe('actions', () => {
  it('post payroll / depreciation errors are readable', () => {
    const d = structuredClone(c);
    expect(() => ACTIONS.payroll.run(d, { month: '2025-04' })).toThrow(/already posted/);
    expect(() => ACTIONS.depreciation.run(d, { date: '31-3-2026' })).toThrow(/already posted/);
    expect(() => ACTIONS.fundTransfer.run(d, { date: 'zzz', from: 'a', to: 'b', amount: '1' })).toThrow(/Invalid date/);
    expect(ACTIONS.fundTransfer.run(d, { date: '31-3-2026', from: 'General Fund', to: 'Designated Fund - Emergency', amount: '1,000' })).toMatch(/Transfer posted/);
    expect(ACTIONS.vault.run(d, { pw: 'x' })).toMatch(/set/);
    expect(d.meta.vault).toBe('x');
  });
});

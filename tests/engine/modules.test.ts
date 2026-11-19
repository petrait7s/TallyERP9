import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import * as E from '../../src/engine';

let c: E.Company;
const per = () => ({ from: c.fyStart, to: c.fyEnd });
beforeAll(() => { c = E.generateScdf(); });

describe('seed (SCDF)', () => {
  it('golden totals', () => {
    const ie = E.incomeExpenditure(c);
    expect({ income: ie.totalIncome, expenditure: ie.totalExpenditure, vouchers: c.vouchers.length, ledgers: c.ledgers.length }).toEqual({ income: 1166567004, expenditure: 1161151467, vouchers: 613, ledgers: 90 });
  });
  it('trial balance and balance sheet balance; integrity clean except planted data', () => {
    expect(E.trialBalance(c).balanced).toBe(true);
    expect(E.balanceSheetGroups(c).balanced).toBe(true);
    expect(c.ledgers.reduce((s, l) => s + l.opening, 0)).toBe(0);
    expect(E.checkIntegrity(c)).toEqual([]);
  });
  it('covers every voucher type, cancelled, post-dated, optional, bills, cost centres, foreign currency', () => {
    const types = new Set(c.vouchers.map((v) => v.type));
    for (const k of ['Contra', 'Payment', 'Receipt', 'Journal', 'Sales', 'Purchase', 'Credit Note', 'Debit Note', 'Memorandum', 'Reversing Journal']) expect(types.has(k)).toBe(true);
    expect(c.vouchers.some((v) => v.cancelled)).toBe(true);
    expect(c.vouchers.some((v) => v.postDated)).toBe(true);
    expect(c.vouchers.some((v) => v.optional)).toBe(true);
    expect(c.vouchers.some((v) => v.entries.some((e) => e.bills?.length))).toBe(true);
    expect(c.vouchers.some((v) => v.fx?.currency === 'USD')).toBe(true);
    expect(c.vouchers.some((v) => v.bankDate)).toBe(true);
  });
  it('register sizes match the spec', () => {
    const n = (id: string) => E.rows(c, id).length;
    expect(n('donors')).toBe(40);
    expect(n('grants')).toBe(5);
    expect(E.rows(c, 'employees').filter((e) => e.type === 'Staff')).toHaveLength(25);
    expect(E.rows(c, 'employees').filter((e) => e.type === 'Volunteer')).toHaveLength(6);
    expect(E.rows(c, 'employees').filter((e) => e.type === 'Consultant')).toHaveLength(4);
    expect(n('members')).toBe(120);
    expect(E.rows(c, 'members').filter((m) => m.category === 'Life')).toHaveLength(5);
    expect(n('beneficiaries')).toBe(400);
    expect(n('distributions')).toBe(15);
    expect(n('procurement')).toBe(12);
    expect(n('assets')).toBe(25);
    expect(n('fdrs')).toBe(3);
    expect(n('imprest')).toBe(3);
    expect(c.costCategories.length).toBeGreaterThanOrEqual(8);
    expect(c.costCentres.filter((x) => x.category !== 'Donors' && x.category !== 'Campaigns').length).toBeGreaterThanOrEqual(18);
  });
  it('bank balances never negative (cash only where planted)', () => {
    const asc = c.vouchers.filter((v) => !v.cancelled && !v.postDated && !v.optional && !['Memorandum', 'Reversing Journal'].includes(v.type)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    for (const l of c.ledgers.filter((x) => /Bank A\/c/.test(x.name))) {
      let b = l.opening;
      for (const v of asc) for (const e of v.entries) if (e.ledger === l.name) { b += e.amount; expect(b).toBeGreaterThanOrEqual(0); }
    }
  });
  it('is deterministic and matches content/seed/scdf.v1.json', () => {
    expect(JSON.stringify(E.generateScdf().vouchers)).toBe(JSON.stringify(c.vouchers));
    const file = JSON.parse(readFileSync('content/seed/scdf.v1.json', 'utf8'));
    expect(JSON.stringify(file.company.vouchers)).toBe(JSON.stringify(c.vouchers));
    expect(E.parseCompanyFile(JSON.stringify(file)).company.name).toBe(c.name);
  });
  it('small seeds', () => {
    const t = E.generateTea();
    expect(E.trialBalance(t).balanced).toBe(true);
    expect(t.vouchers.length).toBeGreaterThan(20);
    expect(E.generateBlank().vouchers).toHaveLength(0);
  });
});

describe('payroll', () => {
  it('calc is balanced, splits to cost centres, TDS on consultants, posts once', () => {
    const { slips, entries } = E.payrollCalc(c, '2026-04'.replace('2026-04', '2026-03'));
    expect(slips).toHaveLength(35);
    expect(entries.reduce((s, e) => s + e.amount, 0)).toBe(0);
    expect(slips.filter((s) => s.type === 'Consultant').every((s) => s.tds === Math.round(s.gross / 10))).toBe(true);
    const sal = entries.find((e) => e.ledger === 'Salary Expense')!;
    expect(sal.costCentres!.reduce((s, a) => s + a.amount, 0)).toBe(sal.amount);
    expect(() => E.postPayroll(c, '2026-03')).toThrow(/already posted/);
  });
  it('payslip and register', () => {
    const slip = E.payslip(c, 'E001', '2026-03');
    expect(slip.rows.at(-1)![0]).toBe('Net pay');
    expect(E.payrollRegister(c, '2026-03').rows).toHaveLength(35);
    expect(E.projectPayrollCost(c, per()).rows.length).toBeGreaterThan(3);
  });
  it('rejects bad split', () => {
    const d = structuredClone(c);
    E.rows(d, 'employees')[0].split = 'X:50';
    expect(() => E.payrollCalc(d, '2026-03')).toThrow(/100%/);
  });
});

describe('funds, grants, projects, budgets', () => {
  it('fund transfer posts a balanced journal', () => {
    const d = structuredClone(c);
    E.fundTransfer(d, '2026-03-30', 'General Fund', 'Designated Fund - Emergency', E.toPaisa(1000));
    expect(E.trialBalance(d).balanced).toBe(true);
    expect(() => E.fundTransfer(d, '2026-03-30', 'General Fund', 'Designated Fund - Emergency', 0)).toThrow();
    expect(E.fundLedgerStatement(c).rows.length).toBeGreaterThan(3);
  });
  it('grant utilisation lines and tranche status; refund closed the Rotary grant', () => {
    const u = E.grantUtilisation(c, 'G2');
    expect(u.rows.length).toBe(4);
    expect(E.grantTranches(c, 'G2').rows.map((r) => r[4])).toContain('Received');
    const g4 = E.rows(c, 'grants').find((g) => g.id === 'G4')!;
    expect(g4.status).toBe('Refunded');
    expect(E.donorRegister(c).rows.length).toBe(40);
    expect(E.foreignRegister(c).rows.length).toBe(2);
    expect(E.fxRegister(c).rows.length).toBeGreaterThan(8);
  });
  it('project costing and burn rate; cross report', () => {
    const t = E.projectCosting(c, 'WASH Jaflong');
    expect(t.rows.find((r) => r[0] === 'Total project cost')![1]).toBeGreaterThan(0);
    expect(E.burnRate(c).rows.length).toBe(6);
    expect(E.donorProjectCross(c).rows.length).toBe(5);
  });
  it('budget variance flags >90%', () => {
    expect(E.budgetAlerts(c)).toBeGreaterThan(2);
    expect(E.budgetVariance(c).rows.some((r) => r[5] === 'ALERT >90%')).toBe(true);
  });
  it('FX receipt and revaluation', () => {
    const d = E.createCompany('X', '2025-04-01', '2026-03-31');
    E.addLedger(d, { name: 'FC', group: 'Bank Accounts', opening: 0 });
    E.addLedger(d, { name: 'Grant', group: 'Grants Received', opening: 0 });
    E.addLedger(d, { name: 'Exchange Gain/Loss', group: 'Indirect Incomes', opening: 0 });
    E.fxReceipt(d, '2025-05-01', 'FC', 'Grant', 1000, 'USD', 122);
    expect(E.ledgerBalance(d, 'FC')).toBe(E.toPaisa(122000));
    E.fxRevalue(d, '2025-06-30', 'FC', 1000, 123);
    expect(E.ledgerBalance(d, 'FC')).toBe(E.toPaisa(123000));
    expect(E.ledgerBalance(d, 'Exchange Gain/Loss')).toBe(-E.toPaisa(1000));
  });
});

describe('members, beneficiaries, procurement, assets, imprest', () => {
  it('membership arrears/advance and life fee', () => {
    const t = E.membershipArrears(c);
    expect(t.rows.some((r) => (r[3] as number) > 0)).toBe(true);
    expect(t.rows.some((r) => (r[4] as number) > 0)).toBe(true);
    expect(t.rows.filter((r) => r[1] === 'Life').every((r) => (r[5] as number) === E.toPaisa(25000))).toBe(true);
  });
  it('beneficiaries and distributions', () => {
    expect(E.beneficiaryCount(c).rows.reduce((s, r) => s + (r[1] as number), 0)).toBe(400);
    expect(E.distributionByCamp(c).rows.length).toBeGreaterThan(2);
  });
  it('three-way match finds 2 mismatches', () => {
    const r = E.procurementMatch(c).rows.map((x) => x[7]);
    expect(r.filter((x) => String(x).endsWith('mismatch'))).toHaveLength(2);
    expect(r).toContain('Pending GRN');
  });
  it('depreciation was posted once; WDV never negative; grant-funded recovered from capital reserve', () => {
    const rows = E.rows(c, 'assets');
    expect(rows.every((a) => E.money(a, 'cost') - E.money(a, 'accDep') >= 0)).toBe(true);
    expect(rows.find((a) => a.id === 'FA05')!.status).toBe('Disposed');
    expect(() => E.depreciationRun(c, '2026-03-31')).toThrow(/already posted/);
    expect(E.ledgerBalance(c, 'Depreciation Recovered from Capital Reserve')).toBeLessThan(0);
    expect(E.assetSchedule(c).rows).toHaveLength(25);
  });
  it('dispose asset with gain/loss', () => {
    const d = E.generateScdf();
    const a = E.rows(d, 'assets').find((x) => x.id === 'FA06')!;
    E.disposeAsset(d, 'FA06', '2026-03-30', E.toPaisa(10000), 'Islami Bank A/c');
    expect(a.status).toBe('Disposed');
    expect(E.trialBalance(d).balanced).toBe(true);
    expect(() => E.disposeAsset(d, 'FA06', '2026-03-30', 0, 'Islami Bank A/c')).toThrow();
  });
  it('imprest replenishment restores limit', () => {
    const d = structuredClone(c);
    const im = E.imprestStatus(d).rows;
    expect(im).toHaveLength(3);
    const need = E.imprestStatus(d).rows.find((r) => (r[4] as number) > 0);
    if (need) {
      const id = E.rows(d, 'imprest').find((x) => x.office === need[0])!.id;
      E.replenishImprest(d, id, '2026-03-30', 'Islami Bank A/c');
      expect(E.imprestStatus(d).rows.find((r) => r[0] === need[0])![4]).toBe(0);
    }
  });
});

describe('pledges, treasury, sub-grants, banking, inventory, credit, audit, pack, security', () => {
  it('pledges and campaign ROI', () => {
    expect(E.pledgeStatus(c).rows.some((r) => r[6] === 'OVERDUE')).toBe(true);
    expect(E.campaignROI(c).rows).toHaveLength(2);
  });
  it('FDR accrual runs and then is idempotent', () => {
    const d = structuredClone(c);
    const before = E.fdrAccrual(d, '2026-03-31');
    expect(before.rows.every((r) => (r[3] as number) > 0)).toBe(true);
    E.postFdrAccrual(d, '2026-03-31');
    expect(E.trialBalance(d).balanced).toBe(true);
    expect(() => E.postFdrAccrual(d, '2026-03-31')).toThrow(/No interest/);
    expect(E.bankAllocation(c).rows.length).toBeGreaterThan(5);
    expect(E.subGrantStatement(c).rows).toHaveLength(1);
  });
  it('bank reco, cheque register, pdc list', () => {
    const t = E.bankReco(c, 'Islami Bank A/c', c.fyEnd);
    expect(t.rows.length).toBeGreaterThan(3);
    expect(t.note).toMatch(/per bank/);
    expect(E.chequeRegister(c).rows.length).toBeGreaterThan(10);
    expect(E.pdcList(c).rows).toHaveLength(4);
  });
  it('stock weighted average, reorder alert, physical diff, orders, batches', () => {
    const s = E.stockClosing(c);
    expect(s.rows).toHaveLength(5);
    expect(s.rows.some((r) => r[5] === 'REORDER')).toBe(true);
    expect(E.physicalStock(c).rows.some((r) => (r[3] as number) !== 0)).toBe(true);
    expect(E.ordersPending(c).rows).toHaveLength(2);
    expect(E.batchSummary(c).rows.length).toBeGreaterThan(3);
  });
  it('credit control: overdue interest, reminders, confirmation', () => {
    const t = E.overdueInterest(c, 12, 30);
    expect(t.rows.length).toBeGreaterThan(0);
    expect(E.reminders(c).rows.length).toBeGreaterThan(0);
    expect(E.confirmationLetter(c, 'Sylhet Skills Centre', c.fyEnd).rows[1][0]).toMatch(/balance of/);
  });
  it('audit lab: planted exceptions in all categories; error lab starts unfixed', () => {
    const cats = new Set(E.auditFindings(c).map((f) => f.category));
    for (const k of ['Negative cash', 'Voucher gap', 'Backdated entry', 'Cancelled voucher', 'Unreconciled bank', 'Large cash payment', 'Wrong fund', 'PO/GRN mismatch', 'Post-dated pending']) expect(cats.has(k)).toBe(true);
    expect(E.auditFindings(c).length).toBeGreaterThanOrEqual(15);
    expect(E.errorLabStatus(c).filter((e) => e.fixed)).toHaveLength(0);
    expect(E.editLogReport(c).rows.length).toBeGreaterThan(100);
    expect(E.yearEndChecklist(c).rows.some((r) => r[1] === 'FAIL')).toBe(true);
  });
  it('error lab fixes are recognised', () => {
    const d = structuredClone(c);
    const lab = d.meta.errorLab!;
    const e1 = d.vouchers.find((v) => v.id === lab[0].voucherId)!;
    E.alterVoucher(d, e1.id, { entries: e1.entries.map((e) => (e.ledger === 'Electricity' ? { ...e, ledger: 'Rent' } : e)) });
    E.cancelVoucher(d, lab[1].voucherId);
    const e3 = d.vouchers.find((v) => v.id === lab[2].voucherId)!;
    E.alterVoucher(d, e3.id, { entries: e3.entries.map((e) => ({ ...e, amount: Math.sign(e.amount) * E.toPaisa(8500), costCentres: e.costCentres?.map((a) => ({ ...a, amount: E.toPaisa(8500) })) })) });
    const st = E.errorLabStatus(d);
    expect(st.map((s) => s.fixed)).toEqual([true, true, true, false, false]);
  });
  it('reporting pack', () => {
    expect(E.notesToAccounts(c).rows.length).toBeGreaterThan(20);
    expect(E.utilisationCertificate(c, 'G2').rows[0][0]).toMatch(/Certified/);
    expect(E.projectCompletion(c, 'Health Camp').rows).toHaveLength(3);
    expect(E.dashboard(c).rows.length).toBe(8);
    expect(E.annualTables(c).rows).toHaveLength(5);
    const sc = E.ieScenario(c);
    expect(sc.rows[2][3]).toBeLessThan(0);
  });
  it('roles and XML exchange', () => {
    expect(E.can('Auditor', 'voucher.create')).toBe(false);
    expect(E.can('Data Entry', 'voucher.create')).toBe(true);
    expect(E.can('Data Entry', 'features')).toBe(false);
    expect(E.can('Admin', 'company')).toBe(true);
    const d = E.createCompany('Y', '2025-04-01', '2026-03-31');
    const added = E.importLedgersXml(d, E.exportMastersXml(c));
    expect(added).toBeGreaterThan(80);
    expect(E.importLedgersXml(d, E.exportMastersXml(c))).toBe(0);
  });
  it('register CRUD validation', () => {
    const d = E.createCompany('Z', '2025-04-01', '2026-03-31');
    E.addRow(d, 'donors', { id: 'D1', name: 'Test', type: 'Individual' });
    expect(() => E.addRow(d, 'donors', { id: 'D1', name: 'Dup' })).toThrow(/already exists/);
    expect(() => E.addRow(d, 'donors', { id: 'D2', name: 'X', type: 'Alien' })).toThrow(/must be one of/);
    expect(() => E.addRow(d, 'assets', { id: 'A1', cost: 'abc' })).toThrow(/invalid amount/);
    E.alterRow(d, 'donors', 0, { id: 'D1', name: 'Renamed', type: 'Corporate' });
    expect(E.rows(d, 'donors')[0].name).toBe('Renamed');
    E.deleteRow(d, 'donors', 0);
    expect(E.rows(d, 'donors')).toHaveLength(0);
  });
});

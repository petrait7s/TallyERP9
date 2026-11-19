import * as E from '../../engine';
import type { Company, Period, Tab } from '../../engine';
import { formatDate } from '../dates';
import type { ReportModel, Row } from './types';

export interface AskField { key: string; label: string; def: (c: Company) => string; hint?: string }
export interface ModReport { title: string; ask?: AskField[]; build: (c: Company, p: Period, a: Record<string, string>) => Tab }

const firstId = (c: Company, reg: string, key = 'id') => E.rows(c, reg)[0]?.[key] ?? '';
const grantAsk: AskField = { key: 'grant', label: 'Grant ID', def: (c) => firstId(c, 'grants'), hint: 'e.g. G1' };
const projAsk: AskField = { key: 'project', label: 'Project', def: (c) => E.rows(c, 'projects')[0]?.project ?? '' };
const monthAsk: AskField = { key: 'month', label: 'Month (yyyy-mm)', def: (c) => c.fyEnd.slice(0, 7) };
const dateAsk: AskField = { key: 'date', label: 'As on date (yyyy-mm-dd)', def: (c) => c.fyEnd };

export const MOD_REPORTS: Record<string, ModReport> = {
  'payroll.register': { title: 'Payroll Register', ask: [monthAsk], build: (c, _p, a) => E.payrollRegister(c, a.month) },
  'payroll.slip': { title: 'Payslip', ask: [{ key: 'emp', label: 'Employee ID', def: (c) => firstId(c, 'employees') }, monthAsk], build: (c, _p, a) => E.payslip(c, a.emp, a.month) },
  'payroll.project': { title: 'Project-wise Payroll Cost', build: (c, p) => E.projectPayrollCost(c, p) },
  'funds.statement': { title: 'Fund-wise Balance Statement', build: (c, p) => E.fundLedgerStatement(c, p) },
  'donors.register': { title: 'Donor-wise Contribution Register', build: (c, p) => E.donorRegister(c, p) },
  'donors.thanks': { title: 'Thank-you List', build: (c, p) => E.thankYouList(c, p) },
  'grants.register': { title: 'Grant Register', build: (c) => E.grantRegister(c) },
  'grants.utilisation': { title: 'Grant Utilisation (donor report)', ask: [grantAsk], build: (c, _p, a) => E.grantUtilisation(c, a.grant) },
  'grants.tranches': { title: 'Tranche Schedule', ask: [grantAsk], build: (c, _p, a) => E.grantTranches(c, a.grant) },
  'grants.cross': { title: 'Donor x Project Cross Report', build: (c) => E.donorProjectCross(c) },
  'grants.foreign': { title: 'Foreign Donation Register', build: (c, p) => E.foreignRegister(c, p.to) },
  'grants.fx': { title: 'Foreign Currency Receipts', build: (c) => E.fxRegister(c) },
  'projects.cost': { title: 'Project Costing', ask: [projAsk], build: (c, p, a) => E.projectCosting(c, a.project, p) },
  'projects.burn': { title: 'Burn Rate', build: (c, p) => E.burnRate(c, p) },
  'budgets.variance': { title: 'Budget vs Actual', build: (c, p) => E.budgetVariance(c, p) },
  'members.status': { title: 'Membership Status', build: (c, p) => E.membershipArrears(c, p.to) },
  'ben.count': { title: 'Beneficiaries per Project', build: (c) => E.beneficiaryCount(c) },
  'ben.distribution': { title: 'Distribution by Camp', build: (c) => E.distributionByCamp(c) },
  'proc.match': { title: 'Three-way Match', build: (c) => E.procurementMatch(c) },
  'assets.schedule': { title: 'Schedule of Fixed Assets', build: (c) => E.assetSchedule(c) },
  'assets.verify': { title: 'Physical Verification', build: (c) => E.assetVerification(c) },
  'petty.count': { title: 'Imprest & Cash Count', build: (c, p) => E.imprestStatus(c, p.to) },
  'pledges.status': { title: 'Pledges vs Received', build: (c, p) => E.pledgeStatus(c, p.to) },
  'campaign.roi': { title: 'Campaign ROI', build: (c, p) => E.campaignROI(c, p) },
  'fdr.accrual': { title: 'FDR Interest Accrual', ask: [dateAsk], build: (c, _p, a) => E.fdrAccrual(c, a.date) },
  'bank.allocation': { title: 'Bank & Treasury Allocation', build: (c, p) => E.bankAllocation(c, p.to) },
  'bank.reco': { title: 'Bank Reconciliation', ask: [{ key: 'bank', label: 'Bank ledger', def: () => 'Islami Bank A/c' }, dateAsk], build: (c, _p, a) => E.bankReco(c, a.bank, a.date) },
  'bank.cheques': { title: 'Cheque Register', build: (c) => E.chequeRegister(c) },
  'bank.pdc': { title: 'Post-dated Cheques', build: (c) => E.pdcList(c) },
  'sub.statement': { title: 'Sub-grantee SOE', build: (c) => E.subGrantStatement(c) },
  'inv.stock': { title: 'Stock Summary', build: (c) => E.stockClosing(c) },
  'inv.physical': { title: 'Physical Stock', build: (c) => E.physicalStock(c) },
  'inv.orders': { title: 'Orders Pending', build: (c) => E.ordersPending(c) },
  'inv.batches': { title: 'Batch-wise Stock', build: (c) => E.batchSummary(c) },
  'cc.interest': { title: 'Interest on Overdue', ask: [{ key: 'rate', label: 'Interest rate % p.a.', def: () => '12' }], build: (c, p, a) => E.overdueInterest(c, Number(a.rate), 30, p.to) },
  'cc.reminders': { title: 'Payment Reminders', build: (c, p) => E.reminders(c, p.to) },
  'cc.letter': { title: 'Ledger Confirmation', ask: [{ key: 'ledger', label: 'Party ledger', def: () => 'Sylhet Skills Centre' }], build: (c, p, a) => E.confirmationLetter(c, a.ledger, p.to) },
  'audit.exceptions': { title: 'Audit Exceptions', build: (c) => E.auditExceptions(c) },
  'audit.editlog': { title: 'Edit Log', build: (c) => E.editLogReport(c) },
  'audit.yearend': { title: 'Year-end Checklist', build: (c) => E.yearEndChecklist(c) },
  'audit.scenario': { title: 'Scenario (optional vouchers)', build: (c, p) => E.ieScenario(c, p) },
  'pack.notes': { title: 'Notes to Accounts', build: (c, p) => E.notesToAccounts(c, p) },
  'pack.uc': { title: 'Utilisation Certificate', ask: [grantAsk], build: (c, _p, a) => E.utilisationCertificate(c, a.grant) },
  'pack.completion': { title: 'Project Completion Report', ask: [projAsk], build: (c, _p, a) => E.projectCompletion(c, a.project) },
  'pack.dashboard': { title: 'Management Statistics', build: (c, p) => E.dashboard(c, p) },
  'pack.annual': { title: 'Annual Report Table', build: (c) => E.annualTables(c) },
  'lab.status': {
    title: 'Error Lab Status',
    build: (c) => {
      const st = E.errorLabStatus(c);
      return { title: 'Error Lab: find and fix the wrong entries', columns: ['Item', 'Status'], kinds: ['t', 't'], rows: st.map((s, i) => [`Error ${i + 1}`, s.fixed ? 'FIXED' : 'open']), note: `${st.filter((s) => s.fixed).length} of ${st.length} fixed. Use Day Book and the Audit reports to find them.` };
    },
  },
};

const fmt = (v: string | number, k: E.Kind): string => {
  if (k === 'a') return v === 0 ? '' : E.formatAmount(Number(v));
  if (k === 'i') return String(v);
  if (k === 'p') return `${(Number(v) / 100).toFixed(2)} %`;
  if (k === 'd') return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? formatDate(String(v)) : String(v);
  return String(v);
};

export function tabToModel(t: Tab): ReportModel {
  const rows: Row[] = t.rows.map((r) => ({
    cells: r.map((v, i) => fmt(v, t.kinds[i])),
    drill: t.drill && typeof r[0] === 'string' ? (t.drill === 'ledger' ? { id: 'ledger' as const, ledger: r[0] } : t.drill === 'centre' ? { id: 'centre' as const, centre: r[0] } : { id: 'group' as const, group: r[0] }) : undefined,
    bold: typeof r[0] === 'string' && /^(Total|Net |Direct cost|Surplus|Grand)/.test(r[0]),
  }));
  if (t.total && t.rows.length) {
    const cells = t.kinds.map((k, i) => (i === 0 ? 'Total' : k === 'a' || k === 'i' ? fmt(t.rows.reduce((s, r) => s + Number(r[i]), 0), k) : ''));
    rows.push({ cells, total: true, bold: true });
  }
  const numericFrom = Math.max(1, t.kinds.findIndex((k, i) => i > 0 && (k === 'a' || k === 'i' || k === 'p')));
  return { title: t.title, subtitle: t.subtitle, layout: 'single', columns: t.columns, rows, numericFrom: t.kinds.some((k, i) => i > 0 && (k === 'a' || k === 'i' || k === 'p')) ? numericFrom : 99, canDetail: false, canVertical: false, note: t.note };
}

export function buildModule(c: Company, key: string, arg: string, period: Period): ReportModel {
  const def = MOD_REPORTS[key];
  if (!def) throw new Error(`Unknown report ${key}`);
  const a = Object.fromEntries(arg.split('|').map((x) => x.split('=')).filter((x) => x.length === 2));
  try { return tabToModel(def.build(c, period, a)); } catch (e) {
    return { title: def.title, layout: 'single', columns: ['Error'], rows: [{ cells: [(e as Error).message] }], numericFrom: 99, canDetail: false, canVertical: false, note: 'Check the values you entered (Esc, then try again).' };
  }
}

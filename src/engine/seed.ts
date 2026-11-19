import { addLedger, addVoucher, allFeatures, cancelVoucher, createCompany, deleteVoucher } from './company';
import { createMaster } from './masters';
import { addRow, fmtMoney, rows } from './registers';
import { depreciationRun, disposeAsset, fxReceipt, payrollCalc, postFdrAccrual, postPayroll, restrictUnspent, refundGrant } from './modules';
import { ledgerBalance } from './reports';
import { toPaisa as P } from './money';
import type { Company, Entry, Ledger } from './types';

/** Deterministic PRNG (mulberry32). */
export function prng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
  };
}

const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** month index 0..11 of FY (Apr 2025 .. Mar 2026) -> [year, month] */
const fyMonth = (i: number): [number, number] => (i < 9 ? [2025, 4 + i] : [2026, i - 8]);
const lastDayOf = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const PROJECTS: { name: string; short: string; acts: string[]; ledgers: string[]; budget: number; overhead: number }[] = [
  { name: 'WASH Jaflong', short: 'WASH', acts: ['Tube-well Installation', 'Water Filter Distribution', 'Hygiene Training', 'Pump Maintenance'], ledgers: ['Water Pumps', 'Transport', 'Training'], budget: 4800000, overhead: 8 },
  { name: 'Education Tea Garden', short: 'EDU', acts: ['Learning Centres', 'Teacher Training', 'Scholarships', 'Books & Supplies'], ledgers: ['Training', 'Stationery', 'Transport'], budget: 3600000, overhead: 8 },
  { name: 'Health Camp', short: 'HEALTH', acts: ['Medical Camps', 'Mother & Child Care', 'Medicine Supply', 'Health Awareness'], ledgers: ['Medical Camp', 'Transport', 'Training'], budget: 1800000, overhead: 10 },
  { name: 'Livelihood Support', short: 'LIVE', acts: ['Skills Training', 'Micro Grants', 'Market Linkage'], ledgers: ['Training', 'Transport'], budget: 1500000, overhead: 7 },
  { name: 'Disaster Relief', short: 'RELIEF', acts: ['Flood Relief', 'Winter Blankets', 'Emergency Food'], ledgers: ['Relief Materials', 'Transport'], budget: 500000, overhead: 5 },
  { name: 'General Admin', short: 'ADMIN', acts: ['General Admin'], ledgers: [], budget: 0, overhead: 0 },
];
const centreName = (p: { short: string }, act: string) => (act === 'General Admin' ? 'ADMIN: General Admin' : `${p.short}: ${act}`);

const FIRST = ['Abdul', 'Rahima', 'Karim', 'Nasrin', 'Jamal', 'Sultana', 'Habib', 'Farida', 'Monir', 'Shirin', 'Tariq', 'Ayesha', 'Faruk', 'Salma', 'Imran', 'Rokeya', 'Kabir', 'Parveen', 'Nur', 'Lutfa'];
const LAST = ['Ahmed', 'Hossain', 'Begum', 'Khan', 'Uddin', 'Akter', 'Chowdhury', 'Mia', 'Rahman', 'Islam', 'Miah', 'Sarker'];
const VILLAGES = ['Jaflong', 'Companiganj', 'Tamabil', 'Lalakhal', 'Malnicherra', 'Kadamtali', 'Fenchuganj'];
const SUPPLIERS = ['Rahim Traders', 'Sylhet Stationers', 'Jaflong Hardware', 'Surma Pipes & Fittings', 'Green Valley Medicals', 'Kamal Printing Press', 'Sunrise Rice Mills', 'Blanket House Dhaka', 'Metro IT Solutions', 'City Transport Services'];

type L = [name: string, group: string, opening?: number, extra?: Partial<Ledger>];

function ledgerList(): L[] {
  const exp = { costCentresApplicable: true };
  return [
    ['Cash', 'Cash-in-hand', P(85000)],
    ['Petty Cash - Head Office', 'Cash-in-hand'], ['Petty Cash - Jaflong Camp', 'Cash-in-hand'], ['Petty Cash - Tea Garden', 'Cash-in-hand'],
    ['Islami Bank A/c', 'Bank Accounts', P(420000)], ['Dutch-Bangla FC A/c', 'Bank Accounts', P(650000), { currency: 'USD' }],
    ['BRAC Bank A/c', 'Bank Accounts'], ['Sonali Bank A/c', 'Bank Accounts'],
    ['Office Equipment', 'Fixed Assets', P(300000)], ['Motorcycle', 'Fixed Assets', P(180000)], ['Computers & IT', 'Fixed Assets'],
    ['Furniture & Fixtures', 'Fixed Assets'], ['Project Equipment', 'Fixed Assets'], ['Accumulated Depreciation', 'Fixed Assets'],
    ['Security Deposit', 'Deposits (Asset)', P(50000)], ['Staff Advances', 'Loans & Advances (Asset)', P(30000)], ['Sub-grant Advances', 'Loans & Advances (Asset)'],
    ['Prepaid Expenses', 'Current Assets'], ['Interest Accrued on FDR', 'Current Assets'], ['TDS Receivable', 'Current Assets'], ['Grants Receivable', 'Current Assets'],
    ['Relief Stock', 'Stock-in-hand', P(373000)],
    ['FDR - Islami Bank', 'Investments'], ['FDR - Sonali Bank', 'Investments'], ['FDR - BRAC Bank', 'Investments'],
    ['Capital Fund', 'Capital Fund'], ['Corpus Fund', 'Corpus Fund', -P(200000)],
    ['UNICEF-WASH Fund', 'Restricted Funds'], ['BRAC Education Fund', 'Restricted Funds'], ['Local Govt Health Fund', 'Restricted Funds'],
    ['Rotary Water Fund', 'Restricted Funds'], ['Embassy Livelihood Fund', 'Restricted Funds'],
    ['Designated Fund - Emergency', 'Designated Funds'], ['General Fund', 'General Fund'], ['Capital Reserve', 'Reserves & Surplus'],
    ['Outstanding Salary', 'Current Liabilities', -P(100000)], ['Salary Payable', 'Provisions'], ['PF Payable', 'Provisions'], ['Outstanding Audit Fee', 'Provisions'],
    ['VAT Output', 'Duties & Taxes', 0, { taxType: 'VAT', taxRate: 1500 }], ['VAT Input', 'Duties & Taxes', 0, { taxType: 'VAT', taxRate: 1500 }],
    ['TDS Payable', 'Duties & Taxes', 0, { taxType: 'TDS', taxRate: 1000 }],
    ['Local Donations', 'Donations', 0, exp], ['Foreign Donations', 'Donations', 0, exp], ['Campaign Donations', 'Donations', 0, exp],
    ['Membership Fees', 'Membership Fees'], ['Entrance Fees', 'Entrance Fees'], ['Training Fee', 'Direct Incomes', 0, exp],
    ['UNICEF-WASH', 'Grants Received'], ['BRAC Education', 'Grants Received'], ['Local Govt Health', 'Grants Received'],
    ['Rotary Water Grant', 'Grants Received'], ['Embassy Livelihood Grant', 'Grants Received'],
    ['Bank Interest', 'Indirect Incomes'], ['Interest on FDR', 'Indirect Incomes'], ['Exchange Gain/Loss', 'Indirect Incomes'],
    ['Depreciation Recovered from Capital Reserve', 'Indirect Incomes'], ['Loss/Gain on Disposal', 'Indirect Incomes'],
    ['Salary Expense', 'Salaries', 0, exp], ['Employer PF Contribution', 'Salaries', 0, exp], ['Consultancy Fees', 'Programme Expenses', 0, exp], ['Volunteer Honorarium', 'Programme Expenses', 0, exp],
    ['Water Pumps', 'Programme Expenses', 0, exp], ['Training', 'Programme Expenses', 0, exp], ['Medical Camp', 'Programme Expenses', 0, exp],
    ['Relief Materials', 'Programme Expenses', 0, exp], ['Transport', 'Programme Expenses', 0, exp], ['Campaign Costs', 'Fundraising Expenses', 0, exp],
    ['Rent', 'Admin Expenses', 0, exp], ['Electricity', 'Admin Expenses', 0, exp], ['Internet', 'Admin Expenses', 0, exp], ['Audit Fee', 'Admin Expenses', 0, exp],
    ['Stationery', 'Admin Expenses', 0, exp], ['Bank Charges', 'Admin Expenses', 0, exp], ['Depreciation', 'Admin Expenses', 0, exp], ['Purchase Returns', 'Purchase Accounts'],
    ['Tea Garden Community Group', 'Sundry Debtors', 0, { billWise: true }], ['Sylhet Skills Centre', 'Sundry Debtors', 0, { billWise: true }], ['Upazila Health Complex', 'Sundry Debtors', 0, { billWise: true }],
    ...SUPPLIERS.map((s, i): L => [s, 'Sundry Creditors', 0, { billWise: true, ...(i < 4 ? { openingBills: [{ ref: `OP-${i + 1}`, amount: -P([30000, 25000, 18000, 12000][i]), date: '2025-03-20' }], opening: -P([30000, 25000, 18000, 12000][i]) } : {}) }]),
  ];
}

function donorNames(rand: ReturnType<typeof prng>): { name: string; type: string }[] {
  const out: { name: string; type: string }[] = [];
  const seen = new Set<string>();
  while (out.length < 28) { const n = `${rand.pick(FIRST)} ${rand.pick(LAST)}`; if (!seen.has(n)) { seen.add(n); out.push({ name: n, type: 'Individual' }); } }
  for (const n of ['Surma Tea Estates Ltd', 'Zamzam Textiles', 'Sylhet Agro Foods', 'Noor Pharma', 'Shapla Construction', 'Bay Telecom']) out.push({ name: n, type: 'Corporate' });
  for (const n of ['Dutch Friends of Sylhet', 'Sylhet Diaspora UK', 'Hope Foundation USA', 'Nordic Aid Circle']) out.push({ name: n, type: 'Foreign' });
  out.push({ name: 'Anonymous Donor A', type: 'Anonymous' }, { name: 'Anonymous Donor B', type: 'Anonymous' });
  return out;
}

/** Renumber vouchers in date order (ids and per-type numbers) so the seed looks like real chronological entry. */
function chronologize(c: Company): Map<number, number> {
  const sorted = [...c.vouchers].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const map = new Map<number, number>();
  const counters = new Map<string, number>();
  sorted.forEach((v, i) => {
    map.set(v.id, i + 1);
    v.id = i + 1;
    const n = (counters.get(v.type) ?? 0) + 1;
    counters.set(v.type, n);
    v.number = String(n);
  });
  c.vouchers = sorted;
  c.nextId = sorted.length + 1;
  c.editLog = sorted.map((v, i) => ({ seq: i + 1, action: 'create' as const, voucherId: v.id, type: v.type, number: v.number, date: v.date }));
  return map;
}

export function generateScdf(): Company {
  const r = prng(20250401);
  const c = createCompany('Sylhet Community Development Foundation', '2025-04-01', '2026-03-31', 'BDT', allFeatures(true));
  c.meta.seedKey = 'scdf';
  c.ledgers = c.ledgers.filter((l) => l.name !== 'Cash');
  createMaster(c, 'currency', { name: 'USD', symbol: '$', rate: 1225000 });
  createMaster(c, 'currency', { name: 'EUR', symbol: '€', rate: 1330000 });
  for (const [name, kind] of [['Donation Receipt', 'Receipt'], ['Grant Receipt', 'Receipt'], ['Petty Cash Payment', 'Payment'], ['Fund Transfer', 'Journal']] as const)
    createMaster(c, 'voucherType', { name, kind });
  // units / stock
  for (const [u, d] of [['Nos', 0], ['Kg', 2], ['Box', 0]] as const) createMaster(c, 'unit', { name: u, decimals: d });
  createMaster(c, 'godown', { name: 'Main Store', parent: 'Main Location' });
  createMaster(c, 'godown', { name: 'Jaflong Camp', parent: 'Main Location' });
  createMaster(c, 'stockGroup', { name: 'Relief Goods', parent: null });
  for (const [n, u, q, rate] of [['Water Filter', 'Nos', 20, 1500], ['Tube-well Pipe', 'Nos', 100, 800], ['First-Aid Kit', 'Box', 30, 600], ['Rice (kg)', 'Kg', 2000, 55], ['Blanket', 'Nos', 300, 450]] as const)
    createMaster(c, 'stockItem', { name: n, group: 'Relief Goods', unit: u, openingQty: q, openingRate: P(rate) });
  // cost categories / centres
  createMaster(c, 'costCategory', { name: 'Donors' });
  createMaster(c, 'costCategory', { name: 'Campaigns' });
  for (const p of PROJECTS) {
    createMaster(c, 'costCategory', { name: p.name });
    for (const a of p.acts) createMaster(c, 'costCentre', { name: centreName(p, a), category: p.name });
  }
  const campaigns = ['Ramadan Appeal 2025', 'Winter Warmth 2025'];
  for (const k of campaigns) createMaster(c, 'costCentre', { name: `Campaign: ${k}`, category: 'Campaigns' });
  const donors = donorNames(r);
  for (const d of donors) createMaster(c, 'costCentre', { name: `Donor: ${d.name}`, category: 'Donors' });
  // ledgers
  for (const [name, group, opening = 0, extra] of ledgerList()) addLedger(c, { name, group, opening, ...extra });
  const openSum = c.ledgers.reduce((s, l) => s + l.opening, 0);
  c.ledgers.find((l) => l.name === 'Capital Fund')!.opening = -openSum;

  // ---------------------------------------------------------- registers
  donors.forEach((d, i) => addRow(c, 'donors', {
    id: `D${String(i + 1).padStart(3, '0')}`, name: d.name, type: d.type, phone: `01${r.int(3, 9)}${r.int(10000000, 99999999)}`, address: `${r.pick(VILLAGES)}, Sylhet`,
    taxId: d.type === 'Individual' ? '' : `BIN-${r.int(100000, 999999)}`, mode: r.pick(['Cash', 'Cheque', 'Bank', 'Mobile']),
    recurring: i % 7 === 0 ? 'Monthly' : i % 11 === 0 ? 'Quarterly' : 'No', recAmount: i % 7 === 0 ? '2000.00' : '', inKind: i % 13 === 0 ? 'Yes' : 'No',
  }));
  const GR = [
    { id: 'G1', name: 'UNICEF WASH Programme', donor: 'UNICEF', project: 'WASH Jaflong', amount: 6000000, currency: 'USD', approval: 'NGOAB/2025/UNI/118', income: 'UNICEF-WASH', fund: 'UNICEF-WASH Fund', status: 'Active' },
    { id: 'G2', name: 'BRAC Education Support', donor: 'BRAC', project: 'Education Tea Garden', amount: 3600000, currency: 'BDT', approval: '', income: 'BRAC Education', fund: 'BRAC Education Fund', status: 'Active' },
    { id: 'G3', name: 'Local Government Health Grant', donor: 'Local Govt (LGD)', project: 'Health Camp', amount: 1800000, currency: 'BDT', approval: '', income: 'Local Govt Health', fund: 'Local Govt Health Fund', status: 'Active' },
    { id: 'G4', name: 'Rotary Flood Relief (closed)', donor: 'Rotary Club Dhaka', project: 'Disaster Relief', amount: 900000, currency: 'BDT', approval: '', income: 'Rotary Water Grant', fund: 'Rotary Water Fund', status: 'Active' },
    { id: 'G5', name: 'Embassy Livelihood Grant', donor: 'Embassy Development Fund', project: 'Livelihood Support', amount: 1500000, currency: 'EUR', approval: 'NGOAB/2025/EMB/302', income: 'Embassy Livelihood Grant', fund: 'Embassy Livelihood Fund', status: 'Active' },
  ];
  const tr = [[1500000, 1500000, 1500000, 1500000], [1200000, 1200000, 1200000], [900000, 900000], [900000], [750000, 750000]];
  const trDates = [['2025-04-15', '2025-08-10', '2025-11-10', '2026-02-10'], ['2025-04-20', '2025-09-15', '2026-01-15'], ['2025-05-25', '2025-12-01'], ['2025-05-20'], ['2025-06-05', '2026-01-05']];
  GR.forEach((g, i) => addRow(c, 'grants', {
    id: g.id, name: g.name, donor: g.donor, project: g.project, amount: fmtMoney(P(g.amount)), currency: g.currency, start: '2025-04-01', end: i === 3 ? '2025-12-31' : '2026-03-31',
    tranches: tr[i].map((a, k) => `${trDates[i][k]}:${fmtMoney(P(a))}`).join(';'), approvalRef: g.approval, fd6: g.approval ? `FD6-${g.id}-2025` : '', fd7: g.approval ? `FD7-${g.id}-0${i + 1}` : '',
    validTill: g.approval ? (i === 4 ? '2025-12-31' : '2027-03-31') : '', status: g.status, incomeLedger: g.income, fundLedger: g.fund, partner: g.id === 'G5' ? 'Surma Women Federation' : '',
  }));
  const bl: Record<string, [string, string, number][]> = {
    G1: [['Tube-wells and pumps', 'Water Pumps', 1800000], ['Hygiene training', 'Training', 600000], ['Transport', 'Transport', 400000], ['Staff salaries', 'Salary Expense', 1500000]],
    G2: [['Training', 'Training', 900000], ['Stationery & books', 'Stationery', 500000], ['Transport', 'Transport', 300000], ['Staff salaries', 'Salary Expense', 1400000]],
    G3: [['Medical camps', 'Medical Camp', 700000], ['Training', 'Training', 250000], ['Staff salaries', 'Salary Expense', 600000]],
    G4: [['Relief materials', 'Relief Materials', 300000], ['Transport', 'Transport', 80000]],
    G5: [['Skills training', 'Training', 600000], ['Transport', 'Transport', 200000], ['Staff salaries', 'Salary Expense', 400000]],
  };
  for (const [g, lines] of Object.entries(bl)) for (const [line, ledger, b] of lines) addRow(c, 'grantBudget', { grant: g, line, ledger, budget: fmtMoney(P(b)) });
  for (const p of PROJECTS.filter((x) => x.budget)) addRow(c, 'projects', { project: p.name, overheadPct: String(p.overhead), budget: fmtMoney(P(p.budget)), start: '2025-04-01', end: '2026-03-31', status: 'Active' });
  addRow(c, 'projects', { project: 'General Admin', overheadPct: '0', budget: '0.00', start: '2025-04-01', end: '2026-03-31', status: 'Active' });

  // employees: 25 staff + 6 volunteers + 4 consultants
  const centresFor = (pi: number) => PROJECTS[pi].acts.map((a) => centreName(PROJECTS[pi], a));
  for (let i = 0; i < 25; i++) {
    const pi = i % 4, basic = 6000 + (i * 700) % 15000;
    const c1 = r.pick(centresFor(pi)), second = i % 3 === 0 ? 'ADMIN: General Admin' : '';
    addRow(c, 'employees', {
      id: `E${String(i + 1).padStart(3, '0')}`, name: `${FIRST[i % 20]} ${LAST[(i * 5) % 12]}`, designation: ['Project Officer', 'Field Worker', 'Accountant', 'Coordinator', 'Trainer'][i % 5], type: 'Staff',
      basic: fmtMoney(P(basic)), allowance: fmtMoney(P(Math.round(basic * 0.4))), pfPct: '8', advance: i === 3 ? '12000.00' : i === 7 ? '10000.00' : i === 11 ? '8000.00' : '0.00',
      split: second ? `${c1}:70;${second}:30` : `${c1}:100`, joined: '2024-01-01',
    });
  }
  for (let i = 0; i < 6; i++) addRow(c, 'employees', { id: `V${i + 1}`, name: `Volunteer ${FIRST[(i * 3) % 20]} ${LAST[i]}`, designation: 'Volunteer', type: 'Volunteer', basic: '3000.00', allowance: '0.00', pfPct: '0', advance: '0.00', split: `${centresFor(i % 4)[0]}:100`, joined: '2024-06-01' });
  for (let i = 0; i < 4; i++) addRow(c, 'employees', { id: `C${i + 1}`, name: ['Dr. Mahbub Alam', 'Eng. Shafiq Rahman', 'Adv. Nazma Khatun', 'Ms. Roksana Parvin'][i], designation: ['Medical Consultant', 'WASH Engineer', 'Legal Advisor', 'M&E Consultant'][i], type: 'Consultant', basic: fmtMoney(P(25000 + i * 5000)), allowance: '0.00', pfPct: '0', advance: '0.00', split: `${centresFor([2, 0, 5, 1][i])[0]}:100`, joined: '2024-09-01' });
  // members: 120
  for (let i = 0; i < 120; i++) {
    const life = i >= 115;
    addRow(c, 'members', { id: `M${String(i + 1).padStart(3, '0')}`, name: `${FIRST[(i * 7) % 20]} ${LAST[(i * 3) % 12]} ${i + 1}`, category: life ? 'Life' : 'General', joined: ymd(2019 + (i % 6), 1 + (i % 12), 1 + (i % 27)), subscription: life ? '25000.00' : '1200.00', paidUpto: life ? '2025-04-01' : ymd(2024 + (i % 3), 12, 31) < '2025-04-01' ? ymd(2024 + (i % 3), 12, 31) : '2026-12-31', phone: `017${r.int(10000000, 99999999)}` });
  }
  // beneficiaries 400
  const camps = ['Jaflong Camp', 'Tea Garden Camp', 'Health Camp Site'], campProject = ['WASH Jaflong', 'Education Tea Garden', 'Health Camp'];
  for (let i = 0; i < 400; i++) { const k = i % 3; addRow(c, 'beneficiaries', { id: `B${String(i + 1).padStart(4, '0')}`, name: `${r.pick(FIRST)} ${r.pick(LAST)}`, village: r.pick(VILLAGES), camp: camps[k], programme: ['Safe water', 'Education', 'Healthcare'][k], project: campProject[k] }); }
  // assets 25
  const A: [string, string, string, number, string, number, 'SLM' | 'WDV', string][] = [
    ['Photocopier', 'Office Equipment', 'Own', 90000, '2024-02-01', 20, 'WDV', 'Head Office'], ['Desktop Computers (5)', 'Office Equipment', 'Own', 100000, '2024-02-01', 20, 'WDV', 'Head Office'],
    ['Generator', 'Office Equipment', 'Own', 60000, '2023-08-01', 20, 'WDV', 'Head Office'], ['Air Conditioners', 'Office Equipment', 'Own', 30000, '2023-08-01', 20, 'WDV', 'Head Office'],
    ['Projector', 'Office Equipment', 'Own', 12000, '2023-05-01', 20, 'WDV', 'Training Hall'], ['Filing System', 'Office Equipment', 'Own', 8000, '2023-05-01', 20, 'WDV', 'Head Office'],
    ['Honda CB 110', 'Motorcycle', 'Own', 110000, '2024-04-01', 20, 'WDV', 'Jaflong Camp'], ['Bajaj Pulsar', 'Motorcycle', 'Own', 70000, '2024-04-01', 20, 'WDV', 'Tea Garden'],
  ];
  const A2: [string, string, string, string, number, number][] = [
    ['Laptop 1', 'Computers & IT', 'Own', '2025-05-12', 85000, 30], ['Laptop 2', 'Computers & IT', 'Own', '2025-05-12', 85000, 30], ['Laser Printer', 'Office Equipment', 'Own', '2025-06-03', 32000, 20],
    ['Tablet set (10)', 'Computers & IT', 'Grant', '2025-07-15', 180000, 30], ['Office Chairs (20)', 'Furniture & Fixtures', 'Own', '2025-06-20', 60000, 10], ['Training Tables', 'Furniture & Fixtures', 'Own', '2025-06-20', 45000, 10],
    ['Steel Almirahs', 'Furniture & Fixtures', 'Own', '2025-08-01', 40000, 10], ['Meeting Table', 'Furniture & Fixtures', 'Own', '2025-08-01', 25000, 10],
    ['Water Testing Kit', 'Project Equipment', 'Grant', '2025-06-25', 120000, 15], ['Drilling Rig', 'Project Equipment', 'Grant', '2025-07-02', 450000, 15], ['Solar Pump Set', 'Project Equipment', 'Grant', '2025-09-10', 280000, 15],
    ['Medical Equipment', 'Project Equipment', 'Grant', '2025-08-20', 150000, 15], ['Scanner', 'Office Equipment', 'Own', '2025-10-05', 18000, 20], ['Server', 'Computers & IT', 'Own', '2025-11-11', 95000, 30],
    ['Projector (new)', 'Office Equipment', 'Own', '2025-12-02', 45000, 20], ['Wi-Fi Router set', 'Computers & IT', 'Own', '2026-01-08', 22000, 30], ['Field Tablets (5)', 'Computers & IT', 'Grant', '2026-01-20', 60000, 30],
  ];
  A.forEach(([n, led, f, cost, date, rate, m, loc], i) => addRow(c, 'assets', { id: `FA${String(i + 1).padStart(2, '0')}`, name: n, ledger: led, funding: f, grant: '', cost: fmtMoney(P(cost)), date, rate: String(rate), method: m, accDep: '0.00', status: 'In use', location: loc, verified: 'Yes' }));
  A2.forEach(([n, led, f, date, cost, rate], i) => addRow(c, 'assets', { id: `FA${String(i + 9).padStart(2, '0')}`, name: n, ledger: led, funding: f, grant: f === 'Grant' ? 'G1' : '', cost: fmtMoney(P(cost)), date, rate: String(rate), method: 'SLM', accDep: '0.00', status: 'In use', location: r.pick(['Head Office', 'Jaflong Camp', 'Tea Garden', 'Training Hall']), verified: i === 5 ? 'No' : 'Yes' }));
  rows(c, 'assets')[22].status = 'Missing'; rows(c, 'assets')[22].verified = 'No';
  // procurement 12
  const proc: [string, string, string, number, number, number, number, number, string][] = [
    ['Water filters', 'WASH Jaflong', 'Surma Pipes & Fittings', 50, 50, 50, 75000, 75000, 'Paid'], ['Tube-well pipes', 'WASH Jaflong', 'Jaflong Hardware', 200, 200, 200, 160000, 160000, 'Paid'],
    ['Blankets', 'Disaster Relief', 'Blanket House Dhaka', 300, 300, 280, 135000, 126000, 'Invoiced'], ['Rice sacks', 'Disaster Relief', 'Sunrise Rice Mills', 2000, 2000, 2000, 110000, 118000, 'Invoiced'],
    ['First-aid kits', 'Health Camp', 'Green Valley Medicals', 60, 60, 60, 36000, 36000, 'Paid'], ['Stationery pack', 'Education Tea Garden', 'Sylhet Stationers', 100, 100, 100, 30000, 30000, 'Paid'],
    ['Training banners', 'Livelihood Support', 'Kamal Printing Press', 20, 20, 20, 12000, 12000, 'Paid'], ['Laptops', 'General Admin', 'Metro IT Solutions', 2, 2, 2, 170000, 170000, 'Paid'],
    ['Solar pump set', 'WASH Jaflong', 'Surma Pipes & Fittings', 1, 1, 1, 280000, 280000, 'Paid'], ['Medical consumables', 'Health Camp', 'Green Valley Medicals', 80, 0, 0, 50000, 0, 'PO'],
    ['School bags', 'Education Tea Garden', 'Kamal Printing Press', 150, 150, 0, 45000, 0, 'GRN'], ['Vehicle hire', 'Livelihood Support', 'City Transport Services', 10, 10, 10, 40000, 40000, 'Paid'],
  ];
  proc.forEach(([item, project, supplier, poQty, grn, inv, poAmt, invAmt, status], i) => addRow(c, 'procurement', { id: `REQ${String(i + 1).padStart(2, '0')}`, item, project, supplier, quotes: `${supplier}: ${fmtMoney(P(poAmt))}; Alt-1: ${fmtMoney(P(Math.round(poAmt * 1.08)))}; Alt-2: ${fmtMoney(P(Math.round(poAmt * 1.12)))}`, poNo: `PO-${100 + i}`, poQty: String(poQty), poAmount: fmtMoney(P(poAmt)), grnQty: String(grn), invQty: String(inv), invAmount: invAmt ? fmtMoney(P(invAmt)) : '', status, approval: 'Approved' }));
  // pledges / FDR / partners / imprest / misc
  const pledgers = donors.slice(0, 8);
  pledgers.forEach((d, i) => addRow(c, 'pledges', { id: `PL${i + 1}`, campaign: campaigns[i % 2], donor: d.name, amount: fmtMoney(P(10000 * (i + 2))), due: ymd(2025, 6 + i, 15), received: i % 3 === 0 ? fmtMoney(P(10000 * (i + 2))) : i % 3 === 1 ? fmtMoney(P(5000)) : '0.00' }));
  addRow(c, 'fdrs', { id: 'FDR1', bank: 'Islami Bank', ledger: 'FDR - Islami Bank', amount: fmtMoney(P(500000)), rate: '8.5', start: '2025-06-01', maturity: '2026-06-01', fund: 'Corpus Fund', accruedTo: '' });
  addRow(c, 'fdrs', { id: 'FDR2', bank: 'Sonali Bank', ledger: 'FDR - Sonali Bank', amount: fmtMoney(P(300000)), rate: '8', start: '2025-07-01', maturity: '2026-07-01', fund: 'General Fund', accruedTo: '' });
  addRow(c, 'fdrs', { id: 'FDR3', bank: 'BRAC Bank', ledger: 'FDR - BRAC Bank', amount: fmtMoney(P(200000)), rate: '9', start: '2025-08-01', maturity: '2026-08-01', fund: 'Designated Fund - Emergency', accruedTo: '' });
  addRow(c, 'partners', { id: 'P1', name: 'Surma Women Federation', grant: 'G5', tranche: fmtMoney(P(500000)), utilised: fmtMoney(P(320000)), soeDue: '2026-04-15', status: 'Active' });
  addRow(c, 'imprest', { id: 'IM1', office: 'Head Office', ledger: 'Petty Cash - Head Office', limit: fmtMoney(P(20000)), custodian: 'Accountant' });
  addRow(c, 'imprest', { id: 'IM2', office: 'Jaflong Camp', ledger: 'Petty Cash - Jaflong Camp', limit: fmtMoney(P(15000)), custodian: 'Camp In-charge' });
  addRow(c, 'imprest', { id: 'IM3', office: 'Tea Garden', ledger: 'Petty Cash - Tea Garden', limit: fmtMoney(P(10000)), custodian: 'Field Officer' });
  for (const [n, role, pw] of [['admin', 'Admin', 'admin'], ['entry1', 'Data Entry', 'entry'], ['auditor1', 'Auditor', 'audit']]) addRow(c, 'users', { name: n, role, password: pw });
  addRow(c, 'voucherClasses', { type: 'Donation Receipt', class: 'Cash Donation', defaultLedger: 'Local Donations' });
  addRow(c, 'voucherClasses', { type: 'Donation Receipt', class: 'Bank Donation', defaultLedger: 'Foreign Donations' });
  addRow(c, 'relatedParties', { name: 'Chairman (Mr. Abdul Karim)', relation: 'Board member', transaction: 'Rent of head office', amount: fmtMoney(P(216000)) });
  addRow(c, 'relatedParties', { name: 'Surma Women Federation', relation: 'Partner NGO', transaction: 'Sub-grant', amount: fmtMoney(P(500000)) });
  for (const [bank, ac] of [['Islami Bank', '2050-1100-001'], ['Dutch-Bangla Bank', 'FC-0077-221'], ['BRAC Bank', '1501-2000-44'], ['Sonali Bank', '3301-7788']]) addRow(c, 'bankConf', { bank, account: ac, balance: '0.00' });
  const moves: [string, string, string, number, number, string, string][] = [
    ['2025-06-05', 'Water Filter', 'Main Store', 50, 1500, 'B-JUN', 'Receipt'], ['2025-07-01', 'Water Filter', 'Jaflong Camp', -45, 0, 'B-JUN', 'Issue'], ['2025-06-10', 'Tube-well Pipe', 'Main Store', 200, 800, 'B-JUN', 'Receipt'],
    ['2025-07-20', 'Tube-well Pipe', 'Jaflong Camp', -250, 0, 'B-JUN', 'Issue'], ['2025-09-02', 'Rice (kg)', 'Main Store', 2000, 55, 'R-SEP', 'Receipt'], ['2025-09-10', 'Rice (kg)', 'Main Store', -1500, 0, 'R-SEP', 'Issue'],
    ['2025-12-01', 'Blanket', 'Main Store', 280, 450, 'W-DEC', 'Receipt'], ['2025-12-15', 'Blanket', 'Main Store', -450, 0, 'W-DEC', 'Issue'], ['2025-08-01', 'First-Aid Kit', 'Main Store', 60, 600, 'H-AUG', 'Receipt'], ['2025-08-20', 'First-Aid Kit', 'Main Store', -70, 0, 'H-AUG', 'Issue'],
  ];
  for (const [date, item, godown, qty, rate, batch, type] of moves) addRow(c, 'stockMoves', { date, item, godown, qty: String(qty), rate: fmtMoney(P(rate)), batch, type });
  for (const [item, lvl, phys] of [['Water Filter', '30', '24'], ['Tube-well Pipe', '30', '50'], ['First-Aid Kit', '15', '20'], ['Rice (kg)', '500', '480'], ['Blanket', '100', '']]) addRow(c, 'reorder', { item, level: lvl, physical: phys });
  for (const [item, lst, rate] of [['Water Filter', 'Retail', 1800], ['Water Filter', 'NGO', 1500], ['Blanket', 'NGO', 450]] as [string, string, number][]) addRow(c, 'priceLists', { item, list: lst, rate: fmtMoney(P(rate)) });
  addRow(c, 'orders', { id: 'SO-1', type: 'Sales', party: 'Upazila Health Complex', item: 'First-Aid Kit', qty: '40', pending: '15', date: '2025-10-01' });
  addRow(c, 'orders', { id: 'PO-9', type: 'Purchase', party: 'Blanket House Dhaka', item: 'Blanket', qty: '300', pending: '20', date: '2025-11-20' });
  addRow(c, 'bom', { product: 'Water Filter Kit', component: 'Filter Candle', qty: '3' });
  addRow(c, 'bom', { product: 'Water Filter Kit', component: 'Plastic Bucket', qty: '1' });
  const dist: [string, string, string, number, number, string][] = [['2025-07-01', 'Jaflong Camp', 'Water Filter', 45, 45, 'WASH Jaflong'], ['2025-07-20', 'Jaflong Camp', 'Tube-well Pipe', 250, 25, 'WASH Jaflong'], ['2025-09-10', 'Tea Garden Camp', 'Rice (kg)', 1500, 150, 'Education Tea Garden'], ['2025-12-15', 'Tea Garden Camp', 'Blanket', 450, 225, 'Disaster Relief'], ['2025-08-20', 'Health Camp Site', 'First-Aid Kit', 70, 70, 'Health Camp']];
  for (let i = 0; i < 15; i++) { const d = dist[i % 5]; addRow(c, 'distributions', { id: `DS${i + 1}`, date: d[0], camp: d[1], item: d[2], qty: String(d[3] + i), beneficiaries: String(d[4] + i), project: d[5] }); }

  // ---------------------------------------------------------- vouchers
  const bankMain = 'Islami Bank A/c', fc = 'Dutch-Bangla FC A/c';
  const vids: Record<string, number> = {};
  const dayIn = (mi: number, lo = 1, hi = 28) => { const [y, m] = fyMonth(mi); return ymd(y, m, r.int(lo, Math.min(hi, lastDayOf(y, m)))); };
  const cc = (ledger: string, centre: string, amt: number): Entry => ({ ledger, amount: amt, costCentres: [{ costCentre: centre, amount: Math.abs(amt) }] });
  const payment = (date: string, from: string, lines: Entry[], narration: string, extra: { chequeNo?: string; type?: string; optional?: boolean; postDated?: boolean } = {}) => {
    const total = lines.reduce((s, e) => s + e.amount, 0);
    return addVoucher(c, { type: extra.type ?? 'Payment', date, narration, optional: extra.optional, postDated: extra.postDated, chequeNo: extra.chequeNo, entries: [...lines, { ledger: from, amount: -total }] });
  };
  const receipt = (date: string, into: string, lines: Entry[], narration: string, type = 'Receipt', extra: { postDated?: boolean; chequeNo?: string } = {}) => {
    const total = -lines.reduce((s, e) => s + e.amount, 0);
    return addVoucher(c, { type, date, narration, postDated: extra.postDated, chequeNo: extra.chequeNo, entries: [{ ledger: into, amount: total }, ...lines] });
  };
  // opening bills paid + outstanding salary
  payment('2025-04-05', bankMain, [{ ledger: 'Outstanding Salary', amount: P(100000) }], 'Previous year outstanding salary paid');
  for (let i = 0; i < 2; i++) { const ref = `OP-${i + 1}`, amt = [30000, 25000][i]; addVoucher(c, { type: 'Payment', date: `2025-04-${10 + i}`, narration: `Opening bill ${ref}`, entries: [{ ledger: SUPPLIERS[i], amount: P(amt), bills: [{ method: 'Agst Ref', ref, amount: P(amt) }] }, { ledger: bankMain, amount: -P(amt) }] }); }
  // funding first: grant tranches
  const gl = ['UNICEF-WASH', 'BRAC Education', 'Local Govt Health', 'Rotary Water Grant', 'Embassy Livelihood Grant'];
  const usdRate = [122, 122.5, 123, 123.5], eurRate = [132, 133];
  GR.forEach((g, gi) => tr[gi].forEach((amt, k) => {
    const date = trDates[gi][k];
    if (gi === 0) fxReceipt(c, date, fc, gl[gi], Math.round(amt / usdRate[k]), 'USD', usdRate[k], `UNICEF tranche ${k + 1}`);
    else if (gi === 4) fxReceipt(c, date, fc, gl[gi], Math.round(amt / eurRate[k]), 'EUR', eurRate[k], `Embassy tranche ${k + 1}`);
    else vids[`g${gi}${k}`] = receipt(date, bankMain, [{ ledger: gl[gi], amount: -P(amt) }], `${g.name} tranche ${k + 1}`, 'Grant Receipt', { chequeNo: `CH${gi}${k}1` }).id;
  }));
  // fc to local transfers
  for (const [d, a] of [['2025-04-18', 450000], ['2025-04-25', 300000], ['2025-08-25', 450000], ['2025-12-05', 400000], ['2026-02-20', 400000], ['2025-06-15', 350000], ['2026-01-12', 300000]] as const)
    addVoucher(c, { type: 'Contra', date: d, narration: 'Transfer from FC account', entries: [{ ledger: bankMain, amount: P(a) }, { ledger: fc, amount: -P(a) }] });
  // monthly cycle
  for (let mi = 0; mi < 12; mi++) {
    const [y, m] = fyMonth(mi), ld = lastDayOf(y, m), month = `${y}-${String(m).padStart(2, '0')}`;
    postPayroll(c, month);
    const pay = ledgerBalance(c, 'Salary Payable', ymd(y, m, ld));
    if (pay > 0) payment(ymd(y, m, ld), bankMain, [{ ledger: 'Salary Payable', amount: pay }], `Salary ${month}`, { chequeNo: `SAL${mi + 1}` });
    const admin = 'ADMIN: General Admin';
    const rent = payment(dayIn(mi, 3, 7), bankMain, [cc('Rent', admin, P(18000))], `Office rent ${month}`, { chequeNo: `RN${mi + 1}` });
    if (mi === 5) vids.rentWrong = rent.id;
    payment(dayIn(mi, 8, 12), bankMain, [cc('Electricity', admin, P(r.int(3800, 6200)))], `Electricity bill ${month}`);
    payment(dayIn(mi, 8, 12), bankMain, [cc('Internet', admin, P(2500))], `Internet ${month}`);
    payment(dayIn(mi, 25, 28), bankMain, [cc('Bank Charges', admin, P(r.int(150, 450)))], `Bank charges ${month}`);
    if (mi >= 1 && mi <= 9) { const tdsPrev = ledgerBalance(c, 'TDS Payable', ymd(y, m, 1)); if (tdsPrev < 0) payment(ymd(y, m, 18), bankMain, [{ ledger: 'TDS Payable', amount: -tdsPrev }], `TDS challan for ${fyMonth(mi - 1).join('-')}`); }
    if (mi % 3 === 2) { const pf = -ledgerBalance(c, 'PF Payable', ymd(y, m, ld)); if (pf > 0) payment(ymd(y, m, ld), bankMain, [{ ledger: 'PF Payable', amount: pf }], `PF deposit quarter ${mi / 3 + 1}`); }
    // donations (cash and bank) coded to donors
    const nd = mi < 2 ? 8 : 9;
    for (let k = 0; k < nd; k++) {
      const d = r.pick(donors.filter((x) => x.type !== 'Foreign'));
      const amt = P(r.pick([500, 1000, 2000, 5000, 10000, 25000, 50000]));
      const into = r.next() < 0.45 ? 'Cash' : bankMain;
      const v = receipt(dayIn(mi), into, [cc('Local Donations', `Donor: ${d.name}`, -amt)], `Donation from ${d.name}`, 'Donation Receipt');
      if (mi === 7 && k === 0) vids.dupA = v.id;
    }
    if (mi % 3 === 1) {
      const d = donors.find((x) => x.type === 'Foreign' && r.next() < 0.7) ?? donors[34];
      fxReceipt(c, dayIn(mi), fc, 'Foreign Donations', r.int(300, 900), 'USD', usdRate[mi % 4] ?? 122, `Foreign donation ${d.name}`);
    }
    // memberships
    for (let k = 0; k < 6; k++) receipt(dayIn(mi), r.next() < 0.5 ? 'Cash' : bankMain, [{ ledger: 'Membership Fees', amount: -P(1200 * r.int(1, 3)) }], `Subscription collection ${month}`);
    if (mi % 2 === 0) receipt(dayIn(mi), bankMain, [{ ledger: 'Entrance Fees', amount: -P(500 * r.int(2, 8)) }], `Entrance fees ${month}`);
    // programme expenses coded to project activities
    const n = 10;
    for (let k = 0; k < n; k++) {
      const pi = r.pick(mi >= 9 ? [0, 0, 1, 1, 2, 3] : [0, 0, 1, 1, 2, 3, 4]), p = PROJECTS[pi], led = r.pick(p.ledgers), centre = centreName(p, r.pick(p.acts));
      const amt = P(r.pick([3000, 5500, 8000, 12000, 18000, 25000, 40000, 60000]));
      const date = dayIn(mi);
      if (k % 4 === 0) {
        const sup = r.pick(SUPPLIERS), ref = `INV-${mi + 1}-${k}`;
        addVoucher(c, { type: 'Purchase', date, narration: `${led} purchase ${ref}`, entries: [cc(led, centre, amt), { ledger: sup, amount: -amt, bills: [{ method: 'New Ref', ref, amount: amt }] }] });
        if (r.next() < 0.75) addVoucher(c, { type: 'Payment', date: `${date.slice(0, 8)}${String(Math.min(28, Number(date.slice(8)) + 5)).padStart(2, '0')}`, narration: `Payment against ${ref}`, chequeNo: `PY${mi}${k}`, entries: [{ ledger: sup, amount: amt, bills: [{ method: 'Agst Ref', ref, amount: amt }] }, { ledger: bankMain, amount: -amt }] });
      } else payment(date, bankMain, [cc(led, centre, amt)], `${led} - ${centre}`, k % 5 === 0 ? { chequeNo: `PX${mi}${k}` } : {});
    }
    // petty cash
    for (let k = 0; k < 3; k++) {
      const imp = r.pick(['Petty Cash - Head Office', 'Petty Cash - Jaflong Camp', 'Petty Cash - Tea Garden']);
      const bal = ledgerBalance(c, imp);
      if (bal < P(3000)) addVoucher(c, { type: 'Contra', date: dayIn(mi, 1, 10), narration: `Imprest to ${imp}`, entries: [{ ledger: imp, amount: P(15000) }, { ledger: bankMain, amount: -P(15000) }] });
      payment(dayIn(mi, 11, 27), imp, [cc('Stationery', r.pick(['ADMIN: General Admin', centreName(PROJECTS[1], 'Books & Supplies')]), P(r.int(150, 1500)))], `Petty cash expense`, { type: 'Petty Cash Payment' });
    }
    // month-end cash deposit
    const cash = ledgerBalance(c, 'Cash', ymd(y, m, ld));
    if (cash > P(60000)) addVoucher(c, { type: 'Contra', date: ymd(y, m, ld), narration: 'Cash deposited in bank', entries: [{ ledger: bankMain, amount: cash - P(30000) }, { ledger: 'Cash', amount: -(cash - P(30000)) }] });
  }
  // training sales to debtors + receipts
  const debt = ['Tea Garden Community Group', 'Sylhet Skills Centre', 'Upazila Health Complex'];
  for (let i = 0; i < 15; i++) {
    const mi = Math.min(11, Math.floor(i * 0.7)), date = dayIn(mi), amt = P(r.pick([15000, 20000, 35000, 50000])), party = debt[i % 3], ref = `TF-${i + 1}`;
    addVoucher(c, { type: 'Sales', date, narration: `Training fee invoice ${ref}`, entries: [{ ledger: party, amount: amt, bills: [{ method: 'New Ref', ref, amount: amt }] }, cc('Training Fee', centreName(PROJECTS[3], 'Skills Training'), -amt)] });
    if (i < 10) { const d2 = `${date.slice(0, 8)}28`; addVoucher(c, { type: 'Receipt', date: d2 > '2026-03-31' ? date : d2, narration: `Receipt against ${ref}`, chequeNo: `RC${i}`, entries: [{ ledger: bankMain, amount: amt }, { ledger: party, amount: -amt, bills: [{ method: 'Agst Ref', ref, amount: amt }] }] }); }
  }
  addVoucher(c, { type: 'Credit Note', date: '2025-10-20', narration: 'Training fee rebate TF-2', entries: [cc('Training Fee', centreName(PROJECTS[3], 'Skills Training'), P(2000)), { ledger: debt[1], amount: -P(2000), bills: [{ method: 'On Account', ref: '', amount: P(2000) }] }] });
  addVoucher(c, { type: 'Credit Note', date: '2025-12-02', narration: 'Training fee rebate TF-6', entries: [cc('Training Fee', centreName(PROJECTS[3], 'Skills Training'), P(1500)), { ledger: debt[2], amount: -P(1500), bills: [{ method: 'On Account', ref: '', amount: P(1500) }] }] });
  addVoucher(c, { type: 'Debit Note', date: '2025-11-05', narration: 'Return of defective items', entries: [{ ledger: SUPPLIERS[4], amount: P(1200), bills: [{ method: 'On Account', ref: '', amount: P(1200) }] }, { ledger: 'Purchase Returns', amount: -P(1200) }] });
  addVoucher(c, { type: 'Debit Note', date: '2026-01-14', narration: 'Short supply debit note', entries: [{ ledger: SUPPLIERS[2], amount: P(900), bills: [{ method: 'On Account', ref: '', amount: P(900) }] }, { ledger: 'Purchase Returns', amount: -P(900) }] });
  // fixed assets purchase + capital reserve for grant-funded
  for (const a of rows(c, 'assets').filter((x) => x.date >= '2025-04-01')) {
    const amt = P(Number(a.cost));
    payment(a.date, bankMain, [{ ledger: a.ledger, amount: amt }], `Purchase of ${a.name}`, { chequeNo: `FA-${a.id}` });
    if (a.funding === 'Grant') addVoucher(c, { type: 'Journal', date: a.date, narration: `Capital reserve for grant-funded ${a.name}`, entries: [{ ledger: 'UNICEF-WASH', amount: amt }, { ledger: 'Capital Reserve', amount: -amt }] });
  }
  // relief stock purchases & distributions
  for (const [d, item, amt] of [['2025-06-05', 'Water filters', 75000], ['2025-06-10', 'Tube-well pipes', 160000], ['2025-09-02', 'Rice', 110000], ['2025-12-01', 'Blankets', 126000], ['2025-08-01', 'First-aid kits', 36000]] as const)
    addVoucher(c, { type: 'Purchase', date: d, narration: `Relief stock: ${item}`, entries: [{ ledger: 'Relief Stock', amount: P(amt) }, { ledger: 'Rahim Traders', amount: -P(amt), bills: [{ method: 'New Ref', ref: `RS-${d}`, amount: P(amt) }] }] });
  for (let i = 0; i < 15; i++) {
    const d = rows(c, 'distributions')[i], amt = P(r.pick([6000, 12000, 20000, 30000]));
    const p = PROJECTS.find((x) => x.name === d.project)!;
    addVoucher(c, { type: 'Journal', date: d.date, narration: `Distribution ${d.id}: ${d.item} to ${d.beneficiaries} beneficiaries at ${d.camp}`, entries: [cc('Relief Materials', centreName(p, p.acts[0]), amt), { ledger: 'Relief Stock', amount: -amt }] });
  }
  // fundraising pledges (memorandum) and campaign receipts
  pledgers.forEach((d, i) => addVoucher(c, { type: 'Memorandum', date: ymd(2025, 4 + (i % 3), 5 + i), narration: `Pledge ${d.name} for ${campaigns[i % 2]}`, entries: [{ ledger: 'Cash', amount: P(10000 * (i + 2)) }, { ledger: 'Campaign Donations', amount: -P(10000 * (i + 2)) }] }));
  for (let i = 0; i < 4; i++) {
    const rec = rows(c, 'pledges').filter((p) => Number(p.received) > 0);
    const p = rec[i % rec.length], a = P(Number(p.received));
    receipt(ymd(2025, 7 + i, 12), bankMain, [cc('Campaign Donations', `Campaign: ${p.campaign}`, -a)], `Pledge received ${p.donor}`, 'Donation Receipt');
  }
  for (let i = 0; i < 4; i++) payment(ymd(2025, 6 + i * 2, 9), bankMain, [cc('Campaign Costs', `Campaign: ${campaigns[i % 2]}`, P(r.int(3000, 9000)))], `Campaign expense ${campaigns[i % 2]}`);
  // treasury: FDR purchases, interest accrual, bank interest
  for (const f of rows(c, 'fdrs')) payment(f.start, bankMain, [{ ledger: f.ledger, amount: P(Number(f.amount)) }], `FDR ${f.id} purchased`, { chequeNo: `FDR-${f.id}` });
  for (const d of ['2025-09-30', '2025-12-31']) postFdrAccrual(c, d);
  for (const d of ['2025-06-30', '2025-09-30', '2025-12-31', '2026-03-31']) receipt(d, bankMain, [{ ledger: 'Bank Interest', amount: -P(r.int(2500, 5200)) }], 'Savings interest');
  // sub-grants to partner
  for (const [d, a] of [['2025-08-01', 300000], ['2026-01-10', 200000]] as const) payment(d, bankMain, [{ ledger: 'Sub-grant Advances', amount: P(a) }], 'Sub-grant tranche to Surma Women Federation', { chequeNo: `SG${d}` });
  addVoucher(c, { type: 'Journal', date: '2026-02-28', narration: 'Partner SOE utilisation (Surma Women Federation)', entries: [cc('Training', centreName(PROJECTS[3], 'Skills Training'), P(320000)), { ledger: 'Sub-grant Advances', amount: -P(320000) }] });
  // staff advances
  for (const [d, a] of [['2025-06-02', 12000], ['2025-09-02', 10000]] as const) payment(d, bankMain, [{ ledger: 'Staff Advances', amount: P(a) }], 'Staff advance');
  // funds: transfers, restrict unspent, refund
  addVoucher(c, { type: 'Fund Transfer', date: '2025-10-01', narration: 'Transfer to emergency fund', entries: [{ ledger: 'General Fund', amount: P(50000) }, { ledger: 'Designated Fund - Emergency', amount: -P(50000) }] });
  addVoucher(c, { type: 'Fund Transfer', date: '2026-01-31', narration: 'Transfer to emergency fund', entries: [{ ledger: 'Capital Fund', amount: P(20000) }, { ledger: 'Designated Fund - Emergency', amount: -P(20000) }] });
  addVoucher(c, { type: 'Fund Transfer', date: '2026-02-15', narration: 'Corpus income to general fund', entries: [{ ledger: 'Capital Fund', amount: P(10000) }, { ledger: 'General Fund', amount: -P(10000) }] });
  // year-end journals
  addVoucher(c, { type: 'Journal', date: '2026-03-31', narration: 'Audit fee accrual', entries: [cc('Audit Fee', 'ADMIN: General Admin', P(60000)), { ledger: 'Outstanding Audit Fee', amount: -P(60000) }] });
  addVoucher(c, { type: 'Reversing Journal', date: '2026-03-31', narration: 'Accrual reversal (auto-reverse next year)', reverseOn: '2026-04-01', entries: [{ ledger: 'Outstanding Audit Fee', amount: P(60000) }, { ledger: 'Audit Fee', amount: -P(60000) }] });
  addVoucher(c, { type: 'Journal', date: '2026-03-31', narration: 'Prepaid insurance', entries: [{ ledger: 'Prepaid Expenses', amount: P(12000) }, { ledger: 'Rent', amount: -P(12000) }] });
  addVoucher(c, { type: 'Journal', date: '2026-03-31', narration: 'Exchange gain on FC revaluation', entries: [{ ledger: fc, amount: P(8250) }, { ledger: 'Exchange Gain/Loss', amount: -P(8250) }] });
  // depreciation, disposal, grant year-end
  depreciationRun(c, '2026-03-31');
  disposeAsset(c, 'FA05', '2026-03-31', P(6000), bankMain);
  const g4 = rows(c, 'grants').find((g) => g.id === 'G4')!;
  g4.status = 'Closed';
  restrictUnspent(c, 'G4', '2026-01-10');
  refundGrant(c, 'G4', '2026-01-20', bankMain);
  for (const g of rows(c, 'grants').filter((x) => x.id !== 'G4')) { try { restrictUnspent(c, g.id, '2026-03-31'); } catch { /* nothing unspent */ } }
  // ---------------------------------------------------------- planted problems (Error Lab / Audit Lab)
  const idMap = chronologize(c);
  for (const k of Object.keys(vids)) vids[k] = idMap.get(vids[k]) ?? vids[k];
  const bank = bankMain;
  const rentV = c.vouchers.find((v) => v.id === vids.rentWrong)!;
  rentV.entries[0].ledger = 'Electricity';
  const dup = addVoucher(c, { type: 'Donation Receipt', date: c.vouchers.find((v) => v.id === vids.dupA)!.date, narration: c.vouchers.find((v) => v.id === vids.dupA)!.narration, entries: c.vouchers.find((v) => v.id === vids.dupA)!.entries.map((e) => ({ ...e, costCentres: e.costCentres?.map((a) => ({ ...a })) })) });
  const amtV = payment('2025-10-14', bank, [cc('Stationery', 'ADMIN: General Admin', P(85000))], 'Stationery purchase (Tk 8,500)');
  const trainV = receipt('2025-11-18', bank, [{ ledger: 'Membership Fees', amount: -P(12000) }], 'Training fee from Sylhet Skills Centre');
  const centreV = payment('2025-09-22', bank, [cc('Training', 'WASH: Hygiene Training', P(22000))], 'Teacher training workshop (Education Tea Garden)');
  c.meta.errorLab = [
    { id: 'E1', kind: 'wrong ledger', voucherId: rentV.id, description: 'Office rent of September was posted to Electricity', fix: { expectLedger: 'Rent', rejectLedger: 'Electricity' } },
    { id: 'E2', kind: 'duplicate', voucherId: dup.id, description: 'A donation receipt was entered twice (find the duplicate on the same day)', fix: { gone: true } },
    { id: 'E3', kind: 'wrong amount', voucherId: amtV.id, description: 'Stationery bought for Tk 8,500 was entered as Tk 85,000', fix: { expectAmount: P(8500) } },
    { id: 'E4', kind: 'wrong income head', voucherId: trainV.id, description: 'Training fee was received under Membership Fees', fix: { expectLedger: 'Training Fee', rejectLedger: 'Membership Fees' } },
    { id: 'E5', kind: 'wrong project', voucherId: centreV.id, description: 'Teacher-training cost was charged to the WASH project', fix: { expectCentre: 'EDU: Teacher Training' } },
  ];
  // negative cash + large cash payment
  const cashBal = ledgerBalance(c, 'Cash', '2025-08-20');
  addVoucher(c, { type: 'Contra', date: '2025-08-22', narration: 'Cash replenished from bank', entries: [{ ledger: 'Cash', amount: P(90000) }, { ledger: bank, amount: -P(90000) }] });
  payment('2026-02-10', bank, [cc('Transport', centreName(PROJECTS[4], 'Flood Relief'), P(7500))], 'Relief transport (charged to closed grant project)');
  payment('2025-08-20', 'Cash', [cc('Water Pumps', centreName(PROJECTS[0], 'Pump Maintenance'), cashBal + P(40000))], 'Cash purchase of pump parts');
  // optional + post-dated
  for (let i = 0; i < 6; i++) payment(ymd(2025, 5 + i, 20), bank, [cc('Training', centreName(PROJECTS[3], 'Skills Training'), P(5000 + i * 500))], 'Proposed training batch (optional)', { optional: true });
  for (let i = 0; i < 4; i++) receipt(ymd(2026, 3, 22 + i), bank, [{ ledger: 'Local Donations', amount: -P(10000 + i * 1000) }], 'Post-dated cheque from donor', 'Receipt', { postDated: true, chequeNo: `PDC${i + 1}` });
  // backdated entry (entered last, dated early)
  payment('2025-04-03', bank, [cc('Stationery', 'ADMIN: General Admin', P(4500))], 'Late entry of April stationery');
  // cancelled and deleted vouchers (gaps)
  const protectedIds = new Set([...Object.values(vids), dup.id, amtV.id, trainV.id, centreV.id]);
  const plain = c.vouchers.filter((v) => v.type === 'Payment' && !protectedIds.has(v.id) && !v.optional && Number(v.number) > 15 && v.entries.every((e) => !e.bills) && v.entries.every((e) => !c.ledgers.find((l) => l.name === e.ledger)!.group.includes('Fixed') && !/Advances|FDR|Salary|PF|TDS|Outstanding/.test(e.ledger)) && !/Late entry|Purchase of|FDR|Sub-grant|Stationery purchase|Teacher training|Cash purchase|challan|deposit|Refund/.test(v.narration ?? ''));
  for (let i = 0; i < 6; i++) cancelVoucher(c, plain[10 + i * 7].id);
  for (let i = 0; i < 3; i++) deleteVoucher(c, plain[80 + i * 9].id);
  // bank reconciliation dates (most older items cleared, recent and a few old ones pending)
  const dayAdd = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
  for (const v of c.vouchers) {
    if (!v.entries.some((e) => /Bank A\/c/.test(e.ledger))) continue;
    if (v.date <= '2026-02-14' && r.next() > 0.06) v.bankDate = dayAdd(v.date, 2);
  }
  // budgets from actuals (some tight to trigger >90% alerts)
  const factors = [1.05, 1.3, 1.08, 1.2, 1.04, 1.5, 1.1, 1.25];
  ['Salary Expense', 'Rent', 'Electricity', 'Internet', 'Audit Fee', 'Stationery', 'Transport', 'Training'].forEach((led, i) => {
    const m = ledgerBalance(c, led);
    addRow(c, 'budgets', { scope: 'Organisation', key: 'SCDF', ledger: led, annual: fmtMoney(Math.max(P(1000), Math.round(m * factors[i]))), revision: i === 2 ? '2' : '1', status: i === 2 ? 'Revised' : i < 6 ? 'Approved' : 'Draft' });
  });
  for (const p of PROJECTS.filter((x) => x.budget)) addRow(c, 'budgets', { scope: 'Project', key: p.name, ledger: '', annual: fmtMoney(P(p.budget)), revision: '1', status: 'Approved' });
  for (const b of rows(c, 'bankConf')) b.balance = fmtMoney(Math.max(0, ledgerBalance(c, b.bank.startsWith('Dutch') ? fc : `${b.bank.split(' ')[0]} Bank A/c`.replace('Islami Bank Bank', 'Islami Bank').replace('BRAC Bank Bank', 'BRAC Bank'))));
  void payrollCalc;
  return c;
}

export function generateTea(): Company {
  const r = prng(777);
  const c = createCompany('Tea Garden Women Cooperative', '2025-04-01', '2026-03-31', 'BDT', { ...allFeatures(false), billWise: true, costCentres: true });
  c.meta.seedKey = 'tea';
  c.ledgers = c.ledgers.filter((l) => l.name !== 'Cash');
  for (const [name, group, opening = 0, extra] of [
    ['Cash', 'Cash-in-hand', P(15000)], ['Sonali Bank A/c', 'Bank Accounts', P(60000)], ['Sewing Machines', 'Fixed Assets', P(45000)], ['Members Capital', 'Capital Fund', -P(120000)],
    ['Member Contributions', 'Membership Fees'], ['Product Sales', 'Sales Accounts'], ['Raw Materials', 'Purchase Accounts'], ['Wages', 'Indirect Expenses'], ['Rent', 'Indirect Expenses'],
    ['Local Buyer', 'Sundry Debtors', 0, { billWise: true }], ['Cloth Supplier', 'Sundry Creditors', 0, { billWise: true }],
  ] as [string, string, number?, Partial<Ledger>?][]) addLedger(c, { name, group, opening, ...extra });
  addLedger(c, { name: 'Misc Capital', group: 'Capital Fund', opening: 0 });
  c.ledgers.find((l) => l.name === 'Members Capital')!.opening = -c.ledgers.reduce((s, l) => s + l.opening, 0) + c.ledgers.find((l) => l.name === 'Members Capital')!.opening;
  for (let m = 0; m < 12; m++) {
    const [y, mo] = fyMonth(m);
    addVoucher(c, { type: 'Receipt', date: ymd(y, mo, 5), narration: 'Member contributions', entries: [{ ledger: 'Cash', amount: P(r.int(3000, 6000)) }, { ledger: 'Member Contributions', amount: 0 }] .map((e, i, a) => (i === 1 ? { ...e, amount: -a[0].amount } : e)) });
    addVoucher(c, { type: 'Payment', date: ymd(y, mo, 10), narration: 'Wages', entries: [{ ledger: 'Wages', amount: P(r.int(4000, 7000)) }, { ledger: 'Sonali Bank A/c', amount: 0 }].map((e, i, a) => (i === 1 ? { ...e, amount: -a[0].amount } : e)) });
    if (m % 2 === 0) addVoucher(c, { type: 'Sales', date: ymd(y, mo, 15), narration: `Sale S${m}`, entries: [{ ledger: 'Local Buyer', amount: P(9000), bills: [{ method: 'New Ref', ref: `S${m}`, amount: P(9000) }] }, { ledger: 'Product Sales', amount: -P(9000) }] });
  }
  return c;
}

export function generateBlank(): Company {
  const c = createCompany('Blank NGO', '2025-04-01', '2026-03-31', 'BDT', allFeatures(true));
  c.meta.seedKey = 'blank';
  return c;
}

export function generateSeed(key: 'scdf' | 'tea' | 'blank'): Company {
  return key === 'scdf' ? generateScdf() : key === 'tea' ? generateTea() : generateBlank();
}

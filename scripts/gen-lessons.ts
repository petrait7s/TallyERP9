/** Generates content/lessons/*.json: npx vite-node scripts/gen-lessons.ts */
import { writeFileSync } from 'node:fs';

const P = (x: number) => Math.round(x * 100);
type A = Record<string, any>;
const bi = (en: string, bn: string) => ({ en, bn });
const visit = (key: string) => ({ op: 'visit', key });
const ent = (...xs: [string, number][]) => xs.map(([ledger, amount]) => ({ ledger, amount }));
const vch = (type: string, date: string, entries: any[], extra: A = {}) => ({ op: 'voucher', v: { type, date, entries, ...extra } });
const vcheck = (a: A) => ({ t: 'voucher', ...a });
const visited = (key: string) => ({ t: 'visited', key });
const rep = (id: string) => visited(`report:${id}`);
const mod = (id: string) => visited(`report:mod:${id}`);
const master = (kind: string, name: string, where?: A) => ({ t: 'master', kind, name, ...(where ? { where } : {}) });
const mop = (kind: string, obj: A) => ({ op: 'master', kind, obj });
const row = (reg: string, where: A) => ({ t: 'row', reg, where });
const rop = (reg: string, r: A) => ({ op: 'row', reg, row: r });
const run = (action: string, v: A) => ({ op: 'run', action, v });

interface StepIn { en: string; bn: string; check: any; keys?: string; hen?: string; hbn?: string }
const S = (en: string, bn: string, check: any, keys?: string, hen?: string, hbn?: string): StepIn => ({ en, bn, check, keys, hen, hbn });
const Q = (en: string, bn: string, options: string[], answer: number) => ({ q: bi(en, bn), options, answer });

const lessons: A[] = [];
function L(id: string, level: string, company: string, title: [string, string], goal: [string, string], steps: StepIn[], solution: any[], o: { quiz?: any[]; setup?: any[]; covers?: string[] } = {}) {
  lessons.push({
    id, level, company, title: bi(...title), goal: bi(...goal),
    ...(o.setup ? { setup: o.setup } : {}),
    steps: steps.map((s) => ({ instruction: bi(s.en, s.bn), hint: bi(s.hen ?? `Try: ${s.keys ?? 'see the button bar'}`, s.hbn ?? `চেষ্টা করুন: ${s.keys ?? 'ডানদিকের বাটন দেখুন'}`), ...(s.keys ? { keys: s.keys } : {}), check: s.check })),
    ...(o.quiz ? { quiz: o.quiz } : {}), solution, covers: o.covers ?? [],
  });
}

// ------------------------------------------------------------------ Beginner
L('B1', 'beginner', 'tea', ['Accounting basics: Dr/Cr and the golden rules', 'হিসাবের মূল কথা: ডেবিট/ক্রেডিট ও সোনালী নিয়ম'],
  ['Understand Dr/Cr, Personal / Real / Nominal accounts and check that a Trial Balance agrees.', 'ডেবিট/ক্রেডিট, ব্যক্তিগত/বাস্তব/নামিক হিসাব বুঝুন এবং ট্রায়াল ব্যালান্স মিলান।'],
  [S('Open Gateway > Display > Trial Balance. Total Debit must equal Total Credit.', 'Gateway > Display > Trial Balance খুলুন। মোট ডেবিট ও ক্রেডিট সমান হতে হবে।', rep('tb'), 'Display > Trial Balance')],
  [visit('report:tb')],
  { covers: ['A8'], quiz: [
    Q('Rule for a PERSONAL account:', 'ব্যক্তিগত হিসাবের নিয়ম:', ['Debit the receiver, Credit the giver', 'Debit what comes in, Credit what goes out', 'Debit expenses and losses, Credit incomes and gains', 'Credit the receiver'], 0),
    Q('Rule for a REAL account:', 'বাস্তব হিসাবের নিয়ম:', ['Debit what comes in, Credit what goes out', 'Debit the giver', 'Debit incomes', 'Credit assets'], 0),
    Q('Rule for a NOMINAL account:', 'নামিক হিসাবের নিয়ম:', ['Debit all expenses and losses, Credit all incomes and gains', 'Debit the giver', 'Credit expenses', 'Debit incomes'], 0),
    Q('An NGO receives a donation in cash. Which entry is correct?', 'নগদ অনুদান পেলে সঠিক এন্ট্রি:', ['Dr Cash, Cr Donations', 'Dr Donations, Cr Cash', 'Dr Cash, Cr Capital Fund', 'Dr Donations, Cr Bank'], 0),
  ] });

L('B2', 'beginner', 'tea', ['Navigation: Gateway, keys, date and company', 'নেভিগেশন: গেটওয়ে, কী, তারিখ ও কোম্পানি'],
  ['Move around with Enter, Esc and the F-keys.', 'Enter, Esc ও F-কী দিয়ে চলাফেরা শিখুন।'],
  [S('Press F2 to open the date dialog (then Esc).', 'F2 চেপে তারিখের ডায়ালগ খুলুন (পরে Esc)।', visited('key:F2'), 'F2'),
   S('Press F11 to see the Features list (then Esc).', 'F11 চেপে ফিচার তালিকা দেখুন (পরে Esc)।', visited('overlay:features'), 'F11'),
   S('Press F1 to open the list of companies (then Esc).', 'F1 চেপে কোম্পানির তালিকা দেখুন (পরে Esc)।', visited('screen:company:select'), 'F1'),
   S('Press Ctrl+/ for the shortcut cheat sheet (then Esc).', 'Ctrl+/ চেপে শর্টকাট শিট দেখুন (পরে Esc)।', visited('overlay:cheatsheet'), 'Ctrl+/')],
  [visit('key:F2'), visit('overlay:features'), visit('screen:company:select'), visit('overlay:cheatsheet')],
  { covers: ['A1'], quiz: [Q('Which key goes back one screen?', 'কোন কী এক ধাপ পেছনে যায়?', ['Esc', 'Enter', 'F2', 'Ctrl+A'], 0), Q('Which key accepts a form?', 'ফর্ম গ্রহণ করে কোন কী?', ['Ctrl+A', 'Esc', 'F2', 'Alt+D'], 0)] });

L('B3', 'beginner', 'blank', ['Create an NGO company', 'এনজিও কোম্পানি তৈরি'],
  ['Create a company with its financial year and currency.', 'আর্থিক বছর ও মুদ্রাসহ কোম্পানি তৈরি করুন।'],
  [S('Press F3 > Create Company. Name it "Green Hope Foundation", FY from 1-Apr-2025, currency BDT. Ctrl+A to accept.', 'F3 > Create Company। নাম "Green Hope Foundation", বছর ১-এপ্রিল-২০২৫, মুদ্রা BDT। Ctrl+A দিন।', { t: 'cmpExists', name: 'Green Hope Foundation' }, 'F3 > Create Company')],
  [{ op: 'cmp', name: 'Green Hope Foundation' }], { covers: ['A1'], quiz: [Q('A financial year in Bangladesh NGOs usually starts on:', 'বাংলাদেশের এনজিওর আর্থিক বছর সাধারণত শুরু:', ['1 July or 1 April (configurable)', '1 January only', '1 December', '15 August'], 0)] });

L('B4', 'beginner', 'blank', ['Groups and ledgers, and Alt+C on the fly', 'গ্রুপ, লেজার এবং Alt+C'],
  ['Create a group, a ledger, and create one while entering another master.', 'গ্রুপ ও লেজার তৈরি করুন; অন্য মাস্টার তৈরির সময় Alt+C ব্যবহার করুন।'],
  [S('Create a group "Zakat Funds" under "Restricted Funds".', '"Restricted Funds"-এর অধীনে "Zakat Funds" গ্রুপ তৈরি করুন।', master('group', 'Zakat Funds', { parent: 'Restricted Funds' }), 'Masters > Create > Accounting Masters > Group'),
   S('Create ledger "Zakat Collection" under "Donations". While choosing "Under", you may press Alt+C to create a group on the fly.', '"Zakat Collection" লেজার "Donations"-এর অধীনে তৈরি করুন। "Under" বাছাইয়ের সময় Alt+C দিয়ে গ্রুপ তৈরি করা যায়।', master('ledger', 'Zakat Collection', { group: 'Donations' }), 'Create > Ledger'),
   S('Press Alt+C once in any selection field to see on-the-fly creation.', 'যেকোনো সিলেকশন ফিল্ডে একবার Alt+C চাপুন।', visited('key:Alt+C'), 'Alt+C')],
  [mop('group', { name: 'Zakat Funds', parent: 'Restricted Funds', nature: 'liability' }), mop('ledger', { name: 'Zakat Collection', group: 'Donations', opening: 0 }), visit('key:Alt+C')],
  { covers: ['A2'], quiz: [Q('Which group holds donation income?', 'অনুদানের আয় কোন গ্রুপে থাকে?', ['Donations', 'Sundry Debtors', 'Fixed Assets', 'Bank Accounts'], 0)] });

L('B5', 'beginner', 'scdf', ['First vouchers: Receipt, Payment, Contra', 'প্রথম ভাউচার: রিসিপ্ট, পেমেন্ট, কন্ট্রা'],
  ['Record a donation, an expense and a cash deposit.', 'অনুদান, খরচ ও নগদ জমা এন্ট্রি করুন।'],
  [S('F6 Receipt: Cash Dr / Local Donations Cr, amount 7,777.', 'F6 রিসিপ্ট: Cash ডেবিট / Local Donations ক্রেডিট, ৭,৭৭৭ টাকা।', vcheck({ vtype: 'Receipt', ledgers: ['Cash', 'Local Donations'], amount: P(7777) }), 'F6'),
   S('F5 Payment: pay Rent 12,345 from Cash.', 'F5 পেমেন্ট: নগদ থেকে Rent ১২,৩৪৫ টাকা।', vcheck({ vtype: 'Payment', ledgers: ['Cash', 'Rent'], amount: P(12345) }), 'F5'),
   S('F4 Contra: deposit 4,321 from Cash into Islami Bank A/c.', 'F4 কন্ট্রা: Cash থেকে Islami Bank A/c-তে ৪,৩২১ জমা।', vcheck({ vtype: 'Contra', ledgers: ['Cash', 'Islami Bank A/c'], amount: P(4321) }), 'F4')],
  [vch('Receipt', '2025-04-10', ent(['Cash', P(7777)], ['Local Donations', -P(7777)])), vch('Payment', '2025-04-11', ent(['Rent', P(12345)], ['Cash', -P(12345)])), vch('Contra', '2025-04-12', ent(['Islami Bank A/c', P(4321)], ['Cash', -P(4321)]))],
  { covers: ['A3'], quiz: [Q('A Contra voucher moves money between:', 'কন্ট্রা ভাউচার কোথায় টাকা সরায়?', ['Cash and Bank', 'Debtor and Creditor', 'Income and Expense', 'Capital and Fund'], 0), Q('Which key opens the Payment voucher?', 'পেমেন্ট ভাউচার খোলে:', ['F5', 'F6', 'F7', 'F4'], 0)] });

L('B6', 'beginner', 'scdf', ['Day Book, Ledger and Trial Balance drill-down', 'ডে বুক, লেজার ও ট্রায়াল ব্যালান্স ড্রিল-ডাউন'],
  ['Drill from totals down to the voucher.', 'মোট থেকে ভাউচার পর্যন্ত ড্রিল-ডাউন করুন।'],
  [S('Open Display > Day Book.', 'Display > Day Book খুলুন।', rep('daybook'), 'Display > Day Book'), S('Open an Account Books > Ledger (pick any ledger).', 'Account Books > Ledger খুলুন।', rep('ledger'), 'Display > Account Books > Ledger'),
   S('Open the Trial Balance and press Enter on a group.', 'Trial Balance খুলে একটি গ্রুপে Enter দিন।', rep('group'), 'Trial Balance > Enter')],
  [visit('report:daybook'), visit('report:ledger'), visit('report:group')], { covers: ['A8'] });

L('B7', 'beginner', 'scdf', ['Alter, delete, cancel and duplicate vouchers', 'ভাউচার সংশোধন, মুছা, বাতিল ও ডুপ্লিকেট'],
  ['Fix mistakes the Tally way.', 'ভুল ঠিক করুন টালির নিয়মে।'],
  [S('In the Day Book open voucher "B7 alter me" and change the amount to 1,500.', 'Day Book থেকে "B7 alter me" ভাউচার খুলে পরিমাণ ১,৫০০ করুন।', vcheck({ narr: 'B7 alter me', amount: P(1500) }), 'Day Book > Enter'),
   S('Duplicate it with Alt+2 so there are two vouchers.', 'Alt+2 দিয়ে ডুপ্লিকেট করুন, দুইটি ভাউচার থাকবে।', vcheck({ narr: 'B7 alter me', min: 2 }), 'Alt+2'),
   S('Cancel voucher "B7 cancel me" (Alt+X).', '"B7 cancel me" বাতিল করুন (Alt+X)।', vcheck({ narr: 'B7 cancel me', cancelled: true }), 'Alt+X'),
   S('Delete voucher "B7 delete me" (open it, Alt+D).', '"B7 delete me" মুছুন (খুলে Alt+D)।', { t: 'all', checks: [{ t: 'not', check: vcheck({ narr: 'B7 delete me' }) }, { t: 'not', check: vcheck({ narr: 'B7 delete me', cancelled: true }) }] }, 'Alt+D')],
  [{ op: 'alterVoucher', narr: 'B7 alter me', amount: P(1500) }, { op: 'duplicateVoucher', narr: 'B7 alter me' }, { op: 'cancelVoucher', narr: 'B7 cancel me' }, { op: 'deleteVoucher', narr: 'B7 delete me' }],
  { covers: ['A3'], setup: [vch('Payment', '2025-05-02', ent(['Stationery', P(1111)], ['Cash', -P(1111)]), { narration: 'B7 alter me' }), vch('Payment', '2025-05-03', ent(['Stationery', P(222)], ['Cash', -P(222)]), { narration: 'B7 cancel me' }), vch('Payment', '2025-05-04', ent(['Stationery', P(333)], ['Cash', -P(333)]), { narration: 'B7 delete me' })],
    quiz: [Q('A cancelled voucher...', 'বাতিল ভাউচার...', ['stays in the Day Book but has no effect on accounts', 'disappears completely', 'doubles the amount', 'moves to the next year'], 0)] });

// ------------------------------------------------------------------ Intermediate
L('I1', 'intermediate', 'scdf', ['Journal adjustments: prepaid, outstanding, depreciation', 'জার্নাল অ্যাডজাস্টমেন্ট'],
  ['Post year-end adjustments with F7.', 'F7 দিয়ে বছরশেষের সমন্বয় দিন।'],
  [S('Journal: Dr Prepaid Expenses / Cr Rent 9,999.', 'জার্নাল: Prepaid Expenses ডেবিট / Rent ক্রেডিট ৯,৯৯৯।', vcheck({ vtype: 'Journal', ledgers: ['Prepaid Expenses', 'Rent'], amount: P(9999) }), 'F7'),
   S('Journal: Dr Depreciation / Cr Accumulated Depreciation 8,888.', 'জার্নাল: Depreciation ডেবিট / Accumulated Depreciation ক্রেডিট ৮,৮৮৮।', vcheck({ vtype: 'Journal', ledgers: ['Depreciation', 'Accumulated Depreciation'], amount: P(8888) })),
   S('Journal: Dr Audit Fee / Cr Outstanding Audit Fee 7,777.', 'জার্নাল: Audit Fee ডেবিট / Outstanding Audit Fee ক্রেডিট ৭,৭৭৭।', vcheck({ vtype: 'Journal', ledgers: ['Audit Fee', 'Outstanding Audit Fee'], amount: P(7777) }))],
  [vch('Journal', '2026-03-30', ent(['Prepaid Expenses', P(9999)], ['Rent', -P(9999)])), vch('Journal', '2026-03-30', ent(['Depreciation', P(8888)], ['Accumulated Depreciation', -P(8888)])), vch('Journal', '2026-03-30', ent(['Audit Fee', P(7777)], ['Outstanding Audit Fee', -P(7777)]))],
  { covers: ['A3'], quiz: [Q('An expense incurred but not yet paid is booked as:', 'খরচ হয়েছে কিন্তু পরিশোধ হয়নি:', ['Outstanding expense (liability)', 'Prepaid expense', 'Income', 'Capital'], 0)] });

L('I2', 'intermediate', 'scdf', ['Bill-wise: new ref, advance, agst ref, ageing', 'বিল-ভিত্তিক: নতুন রেফ, অগ্রিম, এগেইনস্ট রেফ, বয়স'],
  ['Track what each party owes.', 'প্রতিটি পক্ষের পাওনা ট্র্যাক করুন।'],
  [S('F8 Sales: party Tea Garden Community Group, Training Fee 16,500, bill New Ref "I2-INV".', 'F8 সেলস: Tea Garden Community Group, Training Fee ১৬,৫০০, বিল New Ref "I2-INV"।', vcheck({ vtype: 'Sales', ledgers: ['Tea Garden Community Group', 'Training Fee'], amount: P(16500) }), 'F8'),
   S('F6 Receipt 5,500 from the party against reference I2-INV (Agst Ref). 11,000 should remain.', 'পার্টি থেকে ৫,৫০০ I2-INV-এর বিপরীতে (Agst Ref) রিসিপ্ট নিন। ১১,০০০ বাকি থাকবে।', { t: 'bill', ledger: 'Tea Garden Community Group', ref: 'I2-INV', pending: P(11000) }, 'F6 > Agst Ref'),
   S('Open Outstandings > Receivables to see ageing.', 'Outstandings > Receivables খুলে বয়স দেখুন।', rep('outstanding'), 'Display > Statements of Accounts > Outstandings')],
  [vch('Sales', '2026-03-10', [{ ledger: 'Tea Garden Community Group', amount: P(16500), bills: [{ method: 'New Ref', ref: 'I2-INV', amount: P(16500) }] }, { ledger: 'Training Fee', amount: -P(16500) }]),
   vch('Receipt', '2026-03-15', [{ ledger: 'Islami Bank A/c', amount: P(5500) }, { ledger: 'Tea Garden Community Group', amount: -P(5500), bills: [{ method: 'Agst Ref', ref: 'I2-INV', amount: P(5500) }] }]), visit('report:outstanding')],
  { covers: ['A6', 'B15'], quiz: [Q('"Agst Ref" is used to...', '"Agst Ref" ব্যবহার হয়...', ['settle an existing bill', 'create a new bill', 'delete a bill', 'print a bill'], 0)] });

L('I3', 'intermediate', 'scdf', ['Cost centres as projects, donors and campaigns', 'কস্ট সেন্টার: প্রকল্প, দাতা ও ক্যাম্পেইন'],
  ['Tag income and expense to a cost centre.', 'আয়-ব্যয় কস্ট সেন্টারে ট্যাগ করুন।'],
  [S('Create cost centre "Fundraising Gala" under category "Campaigns".', '"Campaigns" ক্যাটাগরির অধীনে "Fundraising Gala" কস্ট সেন্টার তৈরি করুন।', master('costCentre', 'Fundraising Gala', { category: 'Campaigns' }), 'Create > Cost Centre'),
   S('Pay Campaign Costs 33,333 from Islami Bank A/c allocated to "Fundraising Gala".', 'Islami Bank A/c থেকে Campaign Costs ৩৩,৩৩৩ "Fundraising Gala"-তে বরাদ্দ করে পেমেন্ট দিন।', vcheck({ vtype: 'Payment', ledgers: ['Campaign Costs'], amount: P(33333), centre: 'Fundraising Gala' }), 'F5 > cost allocation'),
   S('Open Display > Statements of Accounts > Project / Cost Centre Statement.', 'Project / Cost Centre Statement খুলুন।', rep('centres'), 'Display > Statements of Accounts')],
  [mop('costCentre', { name: 'Fundraising Gala', category: 'Campaigns' }), vch('Payment', '2026-02-02', [{ ledger: 'Campaign Costs', amount: P(33333), costCentres: [{ costCentre: 'Fundraising Gala', amount: P(33333) }] }, { ledger: 'Islami Bank A/c', amount: -P(33333) }]), visit('report:centres')],
  { covers: ['A2', 'B5'] });

L('I4', 'intermediate', 'scdf', ['Restricted grant lifecycle and utilisation', 'সীমাবদ্ধ অনুদানের জীবনচক্র ও ব্যবহার'],
  ['Receive a grant tranche and review utilisation.', 'অনুদানের কিস্তি গ্রহণ ও ব্যবহার পর্যালোচনা।'],
  [S('Open NGO Management > Grants > Donor Report (utilisation) for grant G2.', 'Grants > Donor Report (utilisation) খুলুন (G2)।', mod('grants.utilisation'), 'NGO Management > Grants'),
   S('Record a Grant Receipt voucher: Islami Bank A/c Dr / BRAC Education Cr 1,11,111.', 'Grant Receipt ভাউচার: Islami Bank A/c ডেবিট / BRAC Education ক্রেডিট ১,১১,১১১।', vcheck({ vtype: 'Grant Receipt', ledgers: ['Islami Bank A/c', 'BRAC Education'], amount: P(111111) }), 'Accounting Vouchers > Grant Receipt'),
   S('Open the Tranche Schedule for G2.', 'G2-এর Tranche Schedule খুলুন।', mod('grants.tranches'))],
  [visit('report:mod:grants.utilisation'), vch('Grant Receipt', '2026-03-05', ent(['Islami Bank A/c', P(111111)], ['BRAC Education', -P(111111)])), visit('report:mod:grants.tranches')], { covers: ['B3'] });

L('I5', 'intermediate', 'scdf', ['Membership and entrance fees', 'সদস্যপদ ও ভর্তি ফি'],
  ['Record subscriptions and see arrears.', 'চাঁদা এন্ট্রি করুন এবং বকেয়া দেখুন।'],
  [S('Receipt: Cash Dr / Membership Fees Cr 4,800.', 'রিসিপ্ট: Cash / Membership Fees ৪,৮০০।', vcheck({ ledgers: ['Cash', 'Membership Fees'], amount: P(4800) }), 'F6'),
   S('Receipt: Cash Dr / Entrance Fees Cr 1,234.', 'রিসিপ্ট: Cash / Entrance Fees ১,২৩৪।', vcheck({ ledgers: ['Cash', 'Entrance Fees'], amount: P(1234) })),
   S('Open Membership > Subscription Status (arrears and advance).', 'Membership > Subscription Status খুলুন।', mod('members.status'))],
  [vch('Receipt', '2026-03-02', ent(['Cash', P(4800)], ['Membership Fees', -P(4800)])), vch('Receipt', '2026-03-02', ent(['Cash', P(1234)], ['Entrance Fees', -P(1234)])), visit('report:mod:members.status')],
  { covers: ['B7'], quiz: [Q('Life membership fees are normally treated as:', 'আজীবন সদস্য ফি সাধারণত:', ['Capital / corpus fund', 'Annual income', 'Expense', 'Liability to repay'], 0)] });

L('I6', 'intermediate', 'scdf', ['Bank reconciliation', 'ব্যাংক রিকনসিলিয়েশন'],
  ['Match the books with the bank statement.', 'বই ও ব্যাংক স্টেটমেন্ট মিলান।'],
  [S('Open Treasury & Banking > Bank Reconciliation for Islami Bank A/c.', 'Bank Reconciliation খুলুন (Islami Bank A/c)।', mod('bank.reco')),
   S('Mark the cheque I6-CHQ as cleared: Treasury & Banking > Mark Voucher Reconciled.', 'I6-CHQ চেক ক্লিয়ার করুন: Mark Voucher Reconciled।', vcheck({ chequeNo: 'I6-CHQ', bankDate: true }))],
  [visit('report:mod:bank.reco'), run('reconcile', { chequeNo: 'I6-CHQ', bankDate: '2026-03-20' })],
  { covers: ['A5', 'B14'], setup: [vch('Payment', '2026-03-12', ent(['Stationery', P(5000)], ['Islami Bank A/c', -P(5000)]), { chequeNo: 'I6-CHQ', narration: 'I6 cheque' })], quiz: [Q('A cheque issued but not yet presented to the bank is called:', 'ইস্যু করা কিন্তু ব্যাংকে জমা না পড়া চেক:', ['Outstanding (uncleared) cheque', 'Bounced cheque', 'Stale cheque', 'Post-dated cheque'], 0)] });

L('I7', 'intermediate', 'scdf', ['Reading I&E, R&P and the Balance Sheet', 'I&E, R&P ও ব্যালান্স শিট পড়া'],
  ['Understand accrual vs cash statements.', 'এক্রুয়াল ও নগদ ভিত্তিক বিবরণী বুঝুন।'],
  [S('Open Income & Expenditure A/c.', 'Income & Expenditure A/c খুলুন।', rep('ie')), S('Open Receipts & Payments A/c.', 'Receipts & Payments A/c খুলুন।', rep('rp')), S('Open the Balance Sheet and press Alt+F1 for detail.', 'Balance Sheet খুলে Alt+F1 দিন।', { t: 'all', checks: [rep('bs'), visited('key:Alt+F1')] }, 'Alt+F1')],
  [visit('report:ie'), visit('report:rp'), visit('report:bs'), visit('key:Alt+F1')],
  { covers: ['A8'], quiz: [Q('Receipts & Payments is prepared on:', 'Receipts & Payments তৈরি হয়:', ['Cash basis', 'Accrual basis', 'Estimate basis', 'Budget basis'], 0), Q('Surplus of I&E goes to:', 'I&E-এর উদ্বৃত্ত যায়:', ['Capital / General Fund in the Balance Sheet', 'Cash', 'Expenses', 'Debtors'], 0)] });

L('I8', 'intermediate', 'scdf', ['Inventory for relief goods', 'ত্রাণ সামগ্রীর ইনভেন্টরি'],
  ['Create a stock item and view stock.', 'স্টক আইটেম তৈরি ও স্টক দেখুন।'],
  [S('Create stock item "Mosquito Net" (group Relief Goods, unit Nos, opening 10 @ 220).', '"Mosquito Net" স্টক আইটেম তৈরি (Relief Goods, Nos, ১০ @ ২২০)।', master('stockItem', 'Mosquito Net', { unit: 'Nos' }), 'Create > Inventory Masters > Stock Item'),
   S('Add a stock receipt of 5 for Mosquito Net in Stock Movements.', 'Stock Movements-এ Mosquito Net ৫টি রিসিপ্ট যোগ করুন।', row('stockMoves', { item: 'Mosquito Net', qty: '5' })), S('Open Inventory (advanced) > Stock Summary.', 'Stock Summary খুলুন।', mod('inv.stock'))],
  [mop('stockItem', { name: 'Mosquito Net', group: 'Relief Goods', unit: 'Nos', openingQty: 10, openingRate: P(220) }), rop('stockMoves', { date: '2026-03-01', item: 'Mosquito Net', godown: 'Main Store', qty: '5', rate: '220.00', batch: 'MN-1', type: 'Receipt' }), visit('report:mod:inv.stock')], { covers: ['A4'] });

// ------------------------------------------------------------------ Advanced
L('A1', 'advanced', 'scdf', ['Foreign grant with exchange gain/loss', 'বৈদেশিক অনুদান ও বিনিময় লাভ/ক্ষতি'],
  ['Book a USD receipt at a rate.', 'ডলার রিসিপ্ট রেটসহ এন্ট্রি।'],
  [S('NGO Management > Grants > FC Receipt Voucher: 2,500 USD at 123.', 'FC Receipt Voucher: ২,৫০০ USD @ ১২৩।', vcheck({ fxCurrency: 'USD', fxAmount: 2500 }), 'Grants > FC Receipt Voucher'), S('Open Foreign Currency Receipts.', 'FC Receipts খুলুন।', mod('grants.fx'))],
  [run('fxReceipt', { date: '10-10-2025', bank: 'Dutch-Bangla FC A/c', income: 'Foreign Donations', amount: '2500', cur: 'USD', rate: '123' }), visit('report:mod:grants.fx')],
  { covers: ['B4'], quiz: [Q('Exchange gain arises when...', 'বিনিময় লাভ হয় যখন...', ['the foreign currency is worth more in BDT than when booked', 'the donor sends less', 'the bank charges fees', 'the budget is exceeded'], 0)] });

L('A2', 'advanced', 'scdf', ['Fixed assets, depreciation and capital fund', 'স্থায়ী সম্পদ, অবচয় ও মূলধন তহবিল'],
  ['Add an asset and review the schedule.', 'সম্পদ যোগ করুন ও শিডিউল দেখুন।'],
  [S('Add asset FA90 "Wheelchair" in the Asset Register.', 'Asset Register-এ FA90 "Wheelchair" যোগ করুন।', row('assets', { id: 'FA90' })), S('Payment: Furniture & Fixtures Dr 33,333 / Islami Bank A/c Cr.', 'পেমেন্ট: Furniture & Fixtures ৩৩,৩৩৩।', vcheck({ vtype: 'Payment', ledgers: ['Furniture & Fixtures'], amount: P(33333) })), S('Open Schedule of Fixed Assets.', 'Schedule of Fixed Assets খুলুন।', mod('assets.schedule'))],
  [rop('assets', { id: 'FA90', name: 'Wheelchair', ledger: 'Furniture & Fixtures', funding: 'Own', cost: '33333.00', date: '2026-03-01', rate: '10', method: 'SLM', accDep: '0.00', status: 'In use', location: 'Head Office', verified: 'Yes' }), vch('Payment', '2026-03-01', ent(['Furniture & Fixtures', P(33333)], ['Islami Bank A/c', -P(33333)])), visit('report:mod:assets.schedule')], { covers: ['B10'] });

L('A3', 'advanced', 'scdf', ['VAT and TDS basics (simulated)', 'ভ্যাট ও টিডিএস (সিমুলেটেড)'],
  ['Flag tax ledgers and read the statutory reports.', 'কর লেজার ও রিপোর্ট দেখুন।'],
  [S('Create ledger "VAT on Fees" under Duties & Taxes, type VAT, rate 15.', '"VAT on Fees" লেজার তৈরি, ধরন VAT, হার ১৫।', master('ledger', 'VAT on Fees', { taxType: 'VAT' }), 'Create > Ledger (F11: statutory on)'),
   S('Open Display > Statutory Reports > VAT Summary.', 'VAT Summary খুলুন।', rep('vat')), S('Open TDS Payable & Challans.', 'TDS Payable & Challans খুলুন।', rep('tds')),
   S('Deposit TDS: Payment Dr TDS Payable 5,555 from Islami Bank A/c.', 'TDS জমা: TDS Payable ৫,৫৫৫।', vcheck({ vtype: 'Payment', ledgers: ['TDS Payable'], amount: P(5555) }))],
  [mop('ledger', { name: 'VAT on Fees', group: 'Duties & Taxes', opening: 0, taxType: 'VAT', taxRate: 1500 }), visit('report:vat'), visit('report:tds'), vch('Payment', '2026-03-20', ent(['TDS Payable', P(5555)], ['Islami Bank A/c', -P(5555)]))], { covers: ['A12'] });

L('A4', 'advanced', 'scdf', ['Budgets and variance', 'বাজেট ও ভ্যারিয়েন্স'],
  ['Create a budget and read the variance report.', 'বাজেট তৈরি ও ভ্যারিয়েন্স দেখুন।'],
  [S('Add a Project budget for "Health Camp": annual 12,34,567, revision 2, status Revised.', '"Health Camp" প্রকল্প বাজেট: ১২,৩৪,৫৬৭, রিভিশন ২, Revised।', row('budgets', { key: 'Health Camp', annual: '1234567.00' })), S('Open Budget vs Actual.', 'Budget vs Actual খুলুন।', mod('budgets.variance'))],
  [rop('budgets', { scope: 'Project', key: 'Health Camp', ledger: '', annual: '1234567.00', revision: '2', status: 'Revised' }), visit('report:mod:budgets.variance')], { covers: ['A7', 'B6'], quiz: [Q('A budget alert is raised when usage exceeds:', 'বাজেট সতর্কতা কখন?', ['90%', '10%', '50%', '0%'], 0)] });

L('A5', 'advanced', 'scdf', ['Year-end closing and new financial year', 'বছরশেষ ও নতুন আর্থিক বছর'],
  ['Carry balances forward into a new company.', 'নতুন কোম্পানিতে ব্যালান্স ক্যারি-ফরোয়ার্ড।'],
  [S('F3 > Split Company Data: accept the suggested name (2026-27).', 'F3 > Split Company Data: প্রস্তাবিত নাম রাখুন।', { t: 'cmpExists', name: 'Sylhet Community Development Foundation (2026-27)' }, 'F3 > Split Company Data')],
  [{ op: 'cmp', name: 'Sylhet Community Development Foundation (2026-27)' }], { covers: ['A1'], quiz: [Q('On carry-forward, the surplus moves to:', 'ক্যারি-ফরোয়ার্ডে উদ্বৃত্ত যায়:', ['Profit & Loss / fund opening balance', 'Cash', 'Creditors', 'Fixed assets'], 0)] });

L('A6', 'advanced', 'scdf', ['Backup, restore, data repair and edit log', 'ব্যাকআপ, রিস্টোর, ডেটা রিপেয়ার ও এডিট লগ'],
  ['Protect and verify your data.', 'ডেটা সুরক্ষিত ও যাচাই করুন।'],
  [S('F3 > Backup.', 'F3 > Backup।', visited('screen:company:backup')), S('F3 > Data Repair.', 'F3 > Data Repair।', visited('screen:company:repair')), S('Open Audit & Compliance > Edit Log.', 'Edit Log খুলুন।', mod('audit.editlog'))],
  [visit('screen:company:backup'), visit('screen:company:repair'), visit('report:mod:audit.editlog')], { covers: ['A1', 'A9'] });

L('A7', 'advanced', 'scdf', ['Ratios, funds flow and the auditor pack', 'রেশিও, ফান্ড ফ্লো ও অডিটর প্যাক'],
  ['Prepare statements for the auditor.', 'অডিটরের জন্য বিবরণী প্রস্তুত করুন।'],
  [S('Open Ratio Analysis.', 'Ratio Analysis খুলুন।', rep('ratio')), S('Open Display > Statements of Accounts > Fund Statement.', 'Fund Statement খুলুন।', rep('funds')), S('Reporting Pack > Auditor Pack (PDF).', 'Reporting Pack > Auditor Pack (PDF)।', visited('fn:auditorPack'))],
  [visit('report:ratio'), visit('report:funds'), visit('fn:auditorPack')], { covers: ['A8', 'A10'] });

L('A8', 'advanced', 'scdf', ['Interview Simulator: 30 tasks + 50 MCQ', 'ইন্টারভিউ সিমুলেটর: ৩০ টাস্ক + ৫০ MCQ'],
  ['Take the timed practical test and get a certificate.', 'সময়সীমাসহ পরীক্ষা দিন ও সার্টিফিকেট নিন।'],
  [S('Learning Centre > Interview Simulator: finish and pass (70%).', 'Learning Centre > Interview Simulator সম্পন্ন করুন (৭০%)।', visited('interview:passed'))],
  [visit('interview:passed')], { covers: ['A8'] });

// ------------------------------------------------------------------ Core extension
L('C1', 'core', 'scdf', ['Security: user roles and Tally Vault', 'নিরাপত্তা: ইউজার রোল ও ভল্ট'],
  ['Add a user, sign in as Auditor and protect the company.', 'ইউজার যোগ করুন, অডিটর হিসেবে সাইন-ইন ও কোম্পানি সুরক্ষিত করুন।'],
  [S('Add user "auditor2" (role Auditor) in Users & Roles.', 'Users & Roles-এ "auditor2" (Auditor) যোগ করুন।', row('users', { name: 'auditor2' })), S('Sign in as the Auditor (Select User).', 'Select User দিয়ে অডিটর হিসেবে সাইন-ইন।', { t: 'user', role: 'Auditor' }),
   S('Set a Tally Vault password for the company.', 'কোম্পানির ভল্ট পাসওয়ার্ড দিন।', { t: 'vault' })],
  [rop('users', { name: 'auditor2', role: 'Auditor', password: 'x' }), { op: 'user', role: 'Auditor', name: 'auditor2' }, { op: 'vault', pw: 'learn' }], { covers: ['A1', 'B18'], quiz: [Q('Which role can only view?', 'কোন রোল শুধু দেখতে পারে?', ['Auditor', 'Admin', 'Data Entry', 'Owner'], 0)] });

L('C2', 'core', 'scdf', ['Voucher types, classes and optional vouchers', 'ভাউচার টাইপ, ক্লাস ও অপশনাল ভাউচার'],
  ['Customise voucher types and use scenarios.', 'ভাউচার টাইপ কাস্টমাইজ ও সিনারিও ব্যবহার।'],
  [S('Create voucher type "Zakat Receipt" based on Receipt.', '"Zakat Receipt" ভাউচার টাইপ (Receipt-ভিত্তিক) তৈরি।', master('voucherType', 'Zakat Receipt', { kind: 'Receipt' })), S('Add a voucher class for "Zakat Receipt".', '"Zakat Receipt"-এর ভাউচার ক্লাস যোগ।', row('voucherClasses', { type: 'Zakat Receipt' })),
   S('Enter an OPTIONAL Payment: Training 5,555 from Islami Bank A/c.', 'অপশনাল পেমেন্ট: Training ৫,৫৫৫।', vcheck({ vtype: 'Payment', amount: P(5555), optional: true })), S('Open Scenario (optional vouchers).', 'Scenario খুলুন।', mod('audit.scenario'))],
  [mop('voucherType', { name: 'Zakat Receipt', kind: 'Receipt' }), rop('voucherClasses', { type: 'Zakat Receipt', class: 'Zakat', defaultLedger: 'Local Donations' }), vch('Payment', '2026-03-05', ent(['Training', P(5555)], ['Islami Bank A/c', -P(5555)]), { optional: true }), visit('report:mod:audit.scenario')], { covers: ['A2', 'A3', 'A7'] });

L('C3', 'core', 'scdf', ['Advanced inventory: batches, reorder, orders', 'অ্যাডভান্সড ইনভেন্টরি'],
  ['Batches, reorder levels, physical stock and orders.', 'ব্যাচ, রিঅর্ডার, ফিজিক্যাল স্টক ও অর্ডার।'],
  [S('Add a stock movement: Blanket, 50, batch C3-B1.', 'স্টক মুভমেন্ট: Blanket ৫০, ব্যাচ C3-B1।', row('stockMoves', { batch: 'C3-B1' })), S('Add a reorder level of 120 for Blanket.', 'Blanket-এর রিঅর্ডার লেভেল ১২০।', row('reorder', { item: 'Blanket', level: '120' })),
   S('Add a Sales order SO-C3.', 'সেলস অর্ডার SO-C3 যোগ।', row('orders', { id: 'SO-C3' })), S('Open Batch-wise Stock.', 'Batch-wise Stock খুলুন।', mod('inv.batches'))],
  [rop('stockMoves', { date: '2026-03-01', item: 'Blanket', godown: 'Main Store', qty: '50', rate: '450.00', batch: 'C3-B1', type: 'Receipt' }), rop('reorder', { item: 'Blanket', level: '120', physical: '' }), rop('orders', { id: 'SO-C3', type: 'Sales', party: 'Upazila Health Complex', item: 'Blanket', qty: '30', pending: '30', date: '2026-03-02' }), visit('report:mod:inv.batches')], { covers: ['A4'] });

L('C4', 'core', 'scdf', ['Banking: cheques and post-dated cheques', 'ব্যাংকিং: চেক ও পোস্ট-ডেটেড চেক'],
  ['Record cheque numbers and manage PDCs.', 'চেক নম্বর ও পিডিসি ম্যানেজ করুন।'],
  [S('F12: turn on "Show cheque number" and "Allow post-dated vouchers".', 'F12: চেক নম্বর ও পোস্ট-ডেটেড অন করুন।', { t: 'all', checks: [{ t: 'config', key: 'showChequeNo', on: true }, { t: 'config', key: 'allowPostDated', on: true }] }, 'F12'),
   S('Payment with cheque C4-1001: Stationery 2,468 from Islami Bank A/c.', 'চেক C4-1001 দিয়ে পেমেন্ট: Stationery ২,৪৬৮।', vcheck({ vtype: 'Payment', chequeNo: 'C4-1001', amount: P(2468) })),
   S('Receipt post-dated cheque C4-PDC (Local Donations 9,999).', 'পোস্ট-ডেটেড রিসিপ্ট C4-PDC (৯,৯৯৯)।', vcheck({ postDated: true, chequeNo: 'C4-PDC' })), S('Open Cheque Register and Post-dated Cheques.', 'Cheque Register ও Post-dated Cheques খুলুন।', { t: 'all', checks: [mod('bank.cheques'), mod('bank.pdc')] })],
  [{ op: 'config', key: 'showChequeNo', on: true }, { op: 'config', key: 'allowPostDated', on: true }, vch('Payment', '2026-03-06', ent(['Stationery', P(2468)], ['Islami Bank A/c', -P(2468)]), { chequeNo: 'C4-1001' }), vch('Receipt', '2026-03-27', ent(['Islami Bank A/c', P(9999)], ['Local Donations', -P(9999)]), { postDated: true, chequeNo: 'C4-PDC' }), visit('report:mod:bank.cheques'), visit('report:mod:bank.pdc')], { covers: ['A5', 'A3'] });

L('C5', 'core', 'scdf', ['Credit control: ageing, interest, reminders', 'ক্রেডিট কন্ট্রোল'],
  ['Chase overdue balances.', 'বকেয়া আদায়ের ফলো-আপ।'],
  [S('Open Receivables ageing.', 'Receivables খুলুন।', rep('outstanding')), S('Open Interest on Overdue (12%).', 'Interest on Overdue (১২%) খুলুন।', mod('cc.interest')), S('Open Payment Reminders.', 'Payment Reminders খুলুন।', mod('cc.reminders')), S('Open Confirmation Letter.', 'Confirmation Letter খুলুন।', mod('cc.letter'))],
  [visit('report:outstanding'), visit('report:mod:cc.interest'), visit('report:mod:cc.reminders'), visit('report:mod:cc.letter')], { covers: ['A6'] });

L('C6', 'core', 'scdf', ['Audit: exceptions, edit log, gaps and backdating', 'অডিট: এক্সেপশন, এডিট লগ'],
  ['Find what an auditor would find.', 'অডিটর যা খুঁজে পাবে তা বের করুন।'],
  [S('Open Audit Exceptions and read the categories.', 'Audit Exceptions খুলুন।', mod('audit.exceptions')), S('Open the Edit Log.', 'Edit Log খুলুন।', mod('audit.editlog')), S('Open the Day Book and look for cancelled vouchers.', 'Day Book-এ বাতিল ভাউচার দেখুন।', rep('daybook'))],
  [visit('report:mod:audit.exceptions'), visit('report:mod:audit.editlog'), visit('report:daybook')], { covers: ['A9', 'B17'], quiz: [Q('A gap in voucher numbers may indicate:', 'ভাউচার নম্বরে ফাঁক নির্দেশ করে:', ['deleted vouchers', 'a bank holiday', 'higher income', 'a new project'], 0)] });

L('C7', 'core', 'scdf', ['Data exchange: CSV, XML and print', 'ডেটা এক্সচেঞ্জ: CSV, XML ও প্রিন্ট'],
  ['Export and import data.', 'ডেটা এক্সপোর্ট ও ইমপোর্ট।'],
  [S('In any report press Alt+E to export CSV.', 'যেকোনো রিপোর্টে Alt+E দিয়ে CSV এক্সপোর্ট।', visited('key:Alt+E'), 'Alt+E'), S('Security & Data > Export Masters (XML).', 'Export Masters (XML)।', visited('fn:xmlExport')),
   S('Security & Data > Import Ledgers (XML): paste <LEDGER NAME="XML Ledger" PARENT="Donations" OPENING="0"/>.', 'Import Ledgers (XML): XML পেস্ট করুন।', master('ledger', 'XML Ledger'))],
  [visit('key:Alt+E'), visit('fn:xmlExport'), run('xmlImport', { xml: '<LEDGER NAME="XML Ledger" PARENT="Donations" OPENING="0"/>' })], { covers: ['A10'] });

L('C8', 'core', 'scdf', ['Payroll: full cycle', 'পেরোল: সম্পূর্ণ চক্র'],
  ['Employee to payslip.', 'কর্মী থেকে পে-স্লিপ।'],
  [S('Add employee E100 in Employee Master.', 'Employee Master-এ E100 যোগ।', row('employees', { id: 'E100' })), S('Post payroll for 2026-03.', '২০২৬-০৩ পেরোল পোস্ট করুন।', vcheck({ vtype: 'Journal', narr: 'Payroll 2026-03' })), S('Open a Payslip.', 'পে-স্লিপ খুলুন।', mod('payroll.slip')), S('Open Project-wise Payroll Cost.', 'Project-wise Payroll Cost খুলুন।', mod('payroll.project'))],
  [rop('employees', { id: 'E100', name: 'New Officer', designation: 'Officer', type: 'Staff', basic: '15000.00', allowance: '6000.00', pfPct: '8', advance: '0.00', split: 'ADMIN: General Admin:100', joined: '2026-03-01' }), run('payroll', { month: '2026-03' }), visit('report:mod:payroll.slip'), visit('report:mod:payroll.project')],
  { covers: ['A11', 'B11'], setup: [{ op: 'deleteVoucher', narr: 'Payroll 2026-03' }] });

// ------------------------------------------------------------------ NGO management
const sd = '31-3-2026';
L('N1', 'ngo', 'scdf', ['Fund accounting and inter-fund transfers', 'ফান্ড অ্যাকাউন্টিং ও আন্তঃফান্ড স্থানান্তর'],
  ['Move money between funds and report by fund.', 'ফান্ডের মধ্যে টাকা সরানো ও ফান্ডভিত্তিক রিপোর্ট।'],
  [S('Funds & Donors > Inter-fund Transfer: General Fund to Designated Fund - Emergency, 12,345.', 'Inter-fund Transfer: General Fund থেকে Designated Fund - Emergency ১২,৩৪৫।', vcheck({ vtype: 'Journal', ledgers: ['General Fund', 'Designated Fund - Emergency'], amount: P(12345) })), S('Open Fund-wise Statement.', 'Fund-wise Statement খুলুন।', mod('funds.statement')), S('Open Fund Statement (Display).', 'Fund Statement খুলুন।', rep('funds'))],
  [run('fundTransfer', { date: sd, from: 'General Fund', to: 'Designated Fund - Emergency', amount: '12345' }), visit('report:mod:funds.statement'), visit('report:funds')], { covers: ['B1'] });

L('N2', 'ngo', 'scdf', ['Donor management', 'দাতা ব্যবস্থাপনা'],
  ['Donor master, tagged receipts and statements.', 'দাতা মাস্টার, ট্যাগ করা রিসিপ্ট।'],
  [S('Add donor D900 "Test Donor".', 'দাতা D900 "Test Donor" যোগ।', row('donors', { id: 'D900' })), S('Create cost centre "Donor: Test Donor" under Donors.', '"Donor: Test Donor" কস্ট সেন্টার তৈরি।', master('costCentre', 'Donor: Test Donor', { category: 'Donors' })),
   S('Donation Receipt 3,333 tagged to that donor.', 'ঐ দাতার নামে ৩,৩৩৩ ডোনেশন রিসিপ্ট।', vcheck({ vtype: 'Donation Receipt', amount: P(3333), centre: 'Donor: Test Donor' })), S('Open the Donor Contribution Register.', 'Donor Contribution Register খুলুন।', mod('donors.register'))],
  [rop('donors', { id: 'D900', name: 'Test Donor', type: 'Individual' }), mop('costCentre', { name: 'Donor: Test Donor', category: 'Donors' }), vch('Donation Receipt', '2026-03-04', [{ ledger: 'Cash', amount: P(3333) }, { ledger: 'Local Donations', amount: -P(3333), costCentres: [{ costCentre: 'Donor: Test Donor', amount: P(3333) }] }]), visit('report:mod:donors.register')], { covers: ['B2'] });

L('N3', 'ngo', 'scdf', ['Grant lifecycle', 'অনুদানের জীবনচক্র'],
  ['Grant master, budget lines, tranche, donor report.', 'গ্র্যান্ট মাস্টার, বাজেট লাইন, কিস্তি, দাতা রিপোর্ট।'],
  [S('Add grant G9 in Grant Master.', 'Grant Master-এ G9 যোগ।', row('grants', { id: 'G9' })), S('Add a budget line for G9.', 'G9-এর বাজেট লাইন।', row('grantBudget', { grant: 'G9' })), S('Receive tranche 22,222 into BRAC Education (Grant Receipt).', 'কিস্তি ২২,২২২ BRAC Education-এ (Grant Receipt)।', vcheck({ vtype: 'Grant Receipt', amount: P(22222) })), S('Open Grant Register.', 'Grant Register খুলুন।', mod('grants.register'))],
  [rop('grants', { id: 'G9', name: 'Pilot Grant', donor: 'Pilot Donor', project: 'Health Camp', amount: '100000.00', currency: 'BDT', start: '2026-01-01', end: '2026-12-31', tranches: '2026-02-01:50000.00', status: 'Active', incomeLedger: 'Local Govt Health', fundLedger: 'Local Govt Health Fund' }), rop('grantBudget', { grant: 'G9', line: 'Medicine', ledger: 'Medical Camp', budget: '60000.00' }), vch('Grant Receipt', '2026-03-06', ent(['Islami Bank A/c', P(22222)], ['BRAC Education', -P(22222)])), visit('report:mod:grants.register')], { covers: ['B3'] });

L('N4', 'ngo', 'scdf', ['Foreign donation compliance (simulated)', 'বৈদেশিক অনুদান কমপ্লায়েন্স (সিমুলেটেড)'],
  ['Reference numbers and the foreign donation register.', 'রেফারেন্স নম্বর ও বৈদেশিক অনুদান রেজিস্টার।'],
  [S('Add grant G6 with FD-6 reference "FD6-TEST".', 'FD6-TEST রেফারেন্সসহ G6 যোগ।', row('grants', { id: 'G6', fd6: 'FD6-TEST' })), S('Book a foreign receipt 1,000 USD (FC Receipt Voucher).', '১,০০০ USD ফরেন রিসিপ্ট।', vcheck({ fxCurrency: 'USD', fxAmount: 1000 })), S('Open the Foreign Donation Register.', 'Foreign Donation Register খুলুন।', mod('grants.foreign'))],
  [rop('grants', { id: 'G6', name: 'Foreign Test', donor: 'Test Foreign Donor', project: 'Livelihood Support', amount: '50000.00', currency: 'USD', start: '2026-01-01', end: '2026-12-31', approvalRef: 'APPR-1', fd6: 'FD6-TEST', fd7: 'FD7-TEST', validTill: '2027-01-01', status: 'Active', incomeLedger: 'Embassy Livelihood Grant', fundLedger: 'Embassy Livelihood Fund' }), run('fxReceipt', { date: '5-3-2026', bank: 'Dutch-Bangla FC A/c', income: 'Foreign Donations', amount: '1000', cur: 'USD', rate: '122' }), visit('report:mod:grants.foreign')], { covers: ['B4'] });

L('N5', 'ngo', 'scdf', ['Project costing and burn rate', 'প্রকল্প কস্টিং ও বার্ন রেট'],
  ['Projects, overhead and cross reports.', 'প্রকল্প, ওভারহেড ও ক্রস রিপোর্ট।'],
  [S('Add project "Solar Pilot" (overhead 10%) in Project Master.', '"Solar Pilot" প্রকল্প (ওভারহেড ১০%) যোগ।', row('projects', { project: 'Solar Pilot' })), S('Open Project Costing for Health Camp.', 'Health Camp Project Costing খুলুন।', mod('projects.cost')), S('Open Burn Rate.', 'Burn Rate খুলুন।', mod('projects.burn')), S('Open Donor x Project Report.', 'Donor x Project Report খুলুন।', mod('grants.cross'))],
  [rop('projects', { project: 'Solar Pilot', overheadPct: '10', budget: '500000.00', start: '2026-01-01', end: '2026-12-31', status: 'Active' }), visit('report:mod:projects.cost'), visit('report:mod:projects.burn'), visit('report:mod:grants.cross')], { covers: ['B5'] });

L('N6', 'ngo', 'scdf', ['Budget management and alerts', 'বাজেট ব্যবস্থাপনা ও সতর্কতা'],
  ['Revise a budget and watch alerts.', 'বাজেট সংশোধন ও সতর্কতা।'],
  [S('Add a revised budget row for Health Camp: 15,00,000, revision 3, status Revised.', 'Health Camp বাজেট: ১৫,০০,০০০, রিভিশন ৩।', row('budgets', { key: 'Health Camp', revision: '3', annual: '1500000.00' })), S('Open Budget vs Actual and look for ALERT >90%.', 'Budget vs Actual খুলে ALERT >90% দেখুন।', mod('budgets.variance'))],
  [rop('budgets', { scope: 'Project', key: 'Health Camp', ledger: '', annual: '1500000.00', revision: '3', status: 'Revised' }), visit('report:mod:budgets.variance')], { covers: ['B6', 'B18'] });

L('N7', 'ngo', 'scdf', ['Membership and subscriptions', 'সদস্যপদ ও চাঁদা'],
  ['Member master and arrears.', 'সদস্য মাস্টার ও বকেয়া।'],
  [S('Add member M900.', 'সদস্য M900 যোগ।', row('members', { id: 'M900' })), S('Receipt Membership Fees 6,000 in Cash.', 'Membership Fees ৬,০০০ রিসিপ্ট।', vcheck({ ledgers: ['Membership Fees'], amount: P(6000) })), S('Open Subscription Status.', 'Subscription Status খুলুন।', mod('members.status'))],
  [rop('members', { id: 'M900', name: 'New Member', category: 'General', joined: '2026-01-01', subscription: '1200.00', paidUpto: '2026-12-31', phone: '017' }), vch('Receipt', '2026-03-08', ent(['Cash', P(6000)], ['Membership Fees', -P(6000)])), visit('report:mod:members.status')], { covers: ['B7'] });

L('N8', 'ngo', 'scdf', ['Beneficiary distribution', 'উপকারভোগী বিতরণ'],
  ['Register beneficiaries and distributions.', 'উপকারভোগী ও বিতরণ নিবন্ধন।'],
  [S('Add beneficiary B9999.', 'উপকারভোগী B9999 যোগ।', row('beneficiaries', { id: 'B9999' })), S('Add distribution DS99.', 'বিতরণ DS99 যোগ।', row('distributions', { id: 'DS99' })), S('Open Beneficiaries per Project and Distribution by Camp.', 'Beneficiaries per Project ও Distribution by Camp খুলুন।', { t: 'all', checks: [mod('ben.count'), mod('ben.distribution')] })],
  [rop('beneficiaries', { id: 'B9999', name: 'Test Beneficiary', village: 'Jaflong', camp: 'Jaflong Camp', programme: 'Safe water', project: 'WASH Jaflong' }), rop('distributions', { id: 'DS99', date: '2026-03-01', camp: 'Jaflong Camp', item: 'Water Filter', qty: '10', beneficiaries: '10', project: 'WASH Jaflong' }), visit('report:mod:ben.count'), visit('report:mod:ben.distribution')], { covers: ['B8'] });

L('N9', 'ngo', 'scdf', ['Procurement chain and three-way match', 'ক্রয় প্রক্রিয়া ও থ্রি-ওয়ে ম্যাচ'],
  ['Requisition to invoice; spot mismatches.', 'রিকুইজিশন থেকে ইনভয়েস; অমিল ধরুন।'],
  [S('Add requisition REQ99 with PO-199.', 'REQ99 (PO-199) যোগ।', row('procurement', { id: 'REQ99', poNo: 'PO-199' })), S('Open Three-way Match.', 'Three-way Match খুলুন।', mod('proc.match'))],
  [rop('procurement', { id: 'REQ99', item: 'Test item', project: 'Health Camp', supplier: 'Rahim Traders', quotes: 'Q1', poNo: 'PO-199', poQty: '10', poAmount: '1000.00', grnQty: '10', invQty: '10', invAmount: '1000.00', status: 'Invoiced', approval: 'Approved' }), visit('report:mod:proc.match')], { covers: ['B9'] });

L('N10', 'ngo', 'scdf', ['Fixed asset register and disposal', 'স্থায়ী সম্পদ রেজিস্টার ও বিক্রয়'],
  ['Dispose an asset and verify the register.', 'সম্পদ বিক্রয় ও রেজিস্টার যাচাই।'],
  [S('Dispose asset FA06 for 3,000 (Fixed Assets > Dispose Asset).', 'FA06 ৩,০০০ টাকায় বিক্রয় (Dispose Asset)।', row('assets', { id: 'FA06', status: 'Disposed' })), S('Open Schedule of Fixed Assets and Physical Verification.', 'Schedule ও Physical Verification খুলুন।', { t: 'all', checks: [mod('assets.schedule'), mod('assets.verify')] })],
  [run('disposeAsset', { id: 'FA06', date: sd, proceeds: '3000', bank: 'Islami Bank A/c' }), visit('report:mod:assets.schedule'), visit('report:mod:assets.verify')], { covers: ['B10'] });

L('N11', 'ngo', 'scdf', ['NGO payroll: split, volunteers, consultants', 'এনজিও পেরোল'],
  ['Project-split salaries and TDS on consultants.', 'প্রকল্পভিত্তিক বেতন ও পরামর্শকের টিডিএস।'],
  [S('Add consultant C9.', 'পরামর্শক C9 যোগ।', row('employees', { id: 'C9', type: 'Consultant' })), S('Add volunteer V9.', 'স্বেচ্ছাসেবক V9 যোগ।', row('employees', { id: 'V9', type: 'Volunteer' })), S('Open Payroll Register and Project-wise Payroll Cost.', 'Payroll Register ও Project-wise Cost খুলুন।', { t: 'all', checks: [mod('payroll.register'), mod('payroll.project')] })],
  [rop('employees', { id: 'C9', name: 'Test Consultant', designation: 'Advisor', type: 'Consultant', basic: '30000.00', allowance: '0.00', pfPct: '0', advance: '0.00', split: 'HEALTH: Medical Camps:60;ADMIN: General Admin:40', joined: '2026-01-01' }), rop('employees', { id: 'V9', name: 'Test Volunteer', designation: 'Volunteer', type: 'Volunteer', basic: '3000.00', allowance: '0.00', pfPct: '0', advance: '0.00', split: 'WASH: Hygiene Training:100', joined: '2026-01-01' }), visit('report:mod:payroll.register'), visit('report:mod:payroll.project')], { covers: ['B11', 'A11'] });

L('N12', 'ngo', 'scdf', ['Petty cash and imprest', 'পেটি ক্যাশ ও ইমপ্রেস্ট'],
  ['Replenish an imprest to its limit.', 'ইমপ্রেস্ট সীমা পর্যন্ত পূরণ।'],
  [S('Open the Cash Count Sheet.', 'Cash Count Sheet খুলুন।', mod('petty.count')), S('Replenish imprest IM1 (Petty Cash > Replenish Imprest).', 'IM1 পূরণ করুন (Replenish Imprest)।', vcheck({ vtype: 'Contra', narr: 'Replenish imprest Head Office' }))],
  [visit('report:mod:petty.count'), run('replenish', { id: 'IM1', date: sd, bank: 'Islami Bank A/c' })], { covers: ['B12'], setup: [vch('Petty Cash Payment', '2026-03-29', ent(['Stationery', P(5000)], ['Petty Cash - Head Office', -P(5000)]), { narration: 'N12 spend' })] });

L('N13', 'ngo', 'scdf', ['Fundraising: pledges and campaign ROI', 'তহবিল সংগ্রহ: প্রতিশ্রুতি ও ROI'],
  ['Pledges versus received.', 'প্রতিশ্রুতি বনাম প্রাপ্তি।'],
  [S('Add pledge PL99.', 'প্রতিশ্রুতি PL99 যোগ।', row('pledges', { id: 'PL99' })), S('Open Pledges vs Received and Campaign ROI.', 'Pledges vs Received ও Campaign ROI খুলুন।', { t: 'all', checks: [mod('pledges.status'), mod('campaign.roi')] })],
  [rop('pledges', { id: 'PL99', campaign: 'Winter Warmth 2025', donor: 'Test Donor', amount: '20000.00', due: '2026-02-01', received: '0.00' }), visit('report:mod:pledges.status'), visit('report:mod:campaign.roi')], { covers: ['B13'] });

L('N14', 'ngo', 'scdf', ['Treasury: FDR interest accrual', 'ট্রেজারি: এফডিআর সুদ'],
  ['Accrue interest and TDS on FDRs.', 'এফডিআর সুদ ও টিডিএস।'],
  [S('Treasury & Banking > Post FDR Accrual up to 31-3-2026.', 'Post FDR Accrual (৩১-৩-২০২৬)।', vcheck({ narr: 'FDR interest accrual 2026-03-31' })), S('Open Bank & Treasury Allocation.', 'Bank Allocation খুলুন।', mod('bank.allocation'))],
  [run('fdrAccrual', { date: sd }), visit('report:mod:bank.allocation')], { covers: ['B14'] });

L('N15', 'ngo', 'scdf', ['Sub-grants to partner organisations', 'সহযোগী সংস্থাকে সাব-গ্র্যান্ট'],
  ['Partner register and SOE.', 'পার্টনার রেজিস্টার ও এসওই।'],
  [S('Add partner P2.', 'পার্টনার P2 যোগ।', row('partners', { id: 'P2' })), S('Open the Statement of Expenditure.', 'Statement of Expenditure খুলুন।', mod('sub.statement'))],
  [rop('partners', { id: 'P2', name: 'Test Partner', grant: 'G5', tranche: '100000.00', utilised: '40000.00', soeDue: '2026-05-01', status: 'Active' }), visit('report:mod:sub.statement')], { covers: ['B15'] });

L('N16', 'ngo', 'scdf', ['Statutory dues: VAT, TDS and challans', 'স্ট্যাটিউটরি: ভ্যাট, টিডিএস ও চালান'],
  ['Track dues and deposit challans.', 'বকেয়া ট্র্যাক ও চালান জমা।'],
  [S('Create ledger "TDS on Rent" under Duties & Taxes, type TDS.', '"TDS on Rent" লেজার (TDS)।', master('ledger', 'TDS on Rent', { taxType: 'TDS' })), S('Open VAT Summary and TDS Payable & Challans.', 'VAT Summary ও TDS Payable খুলুন।', { t: 'all', checks: [rep('vat'), rep('tds')] }), S('Deposit challan: Payment Dr TDS on Rent 4,444.', 'চালান: TDS on Rent ৪,৪৪৪।', vcheck({ vtype: 'Payment', ledgers: ['TDS on Rent'], amount: P(4444) }))],
  [mop('ledger', { name: 'TDS on Rent', group: 'Duties & Taxes', opening: 0, taxType: 'TDS', taxRate: 500 }), visit('report:vat'), visit('report:tds'), vch('Payment', '2026-03-18', ent(['TDS on Rent', P(4444)], ['Islami Bank A/c', -P(4444)]))], { covers: ['A12'] });

L('N17', 'ngo', 'scdf', ['Final reporting pack', 'চূড়ান্ত রিপোর্টিং প্যাক'],
  ['Schedules, utilisation certificate, statistics and auditor pack.', 'শিডিউল, ইউটিলাইজেশন সার্টিফিকেট, পরিসংখ্যান ও অডিটর প্যাক।'],
  [S('Open Notes to Accounts.', 'Notes to Accounts খুলুন।', mod('pack.notes')), S('Open the Utilisation Certificate (G2).', 'Utilisation Certificate (G2) খুলুন।', mod('pack.uc')), S('Open Management Statistics.', 'Management Statistics খুলুন।', mod('pack.dashboard')), S('Run Auditor Pack (PDF).', 'Auditor Pack (PDF) চালান।', visited('fn:auditorPack'))],
  [visit('report:mod:pack.notes'), visit('report:mod:pack.uc'), visit('report:mod:pack.dashboard'), visit('fn:auditorPack')], { covers: ['B16'] });

L('N18', 'ngo', 'scdf', ['Year-end and audit readiness', 'বছরশেষ ও অডিট প্রস্তুতি'],
  ['Work through the checklist.', 'চেকলিস্ট ধরে এগোন।'],
  [S('Open the Year-end Checklist.', 'Year-end Checklist খুলুন।', mod('audit.yearend')), S('Open Audit Exceptions.', 'Audit Exceptions খুলুন।', mod('audit.exceptions')), S('Journal: Dr Audit Fee / Cr Outstanding Audit Fee 5,432 narration "Year-end accrual N18".', 'জার্নাল: Audit Fee / Outstanding Audit Fee ৫,৪৩২ "Year-end accrual N18"।', vcheck({ vtype: 'Journal', narr: 'Year-end accrual N18', amount: P(5432) }))],
  [visit('report:mod:audit.yearend'), visit('report:mod:audit.exceptions'), vch('Journal', '2026-03-31', ent(['Audit Fee', P(5432)], ['Outstanding Audit Fee', -P(5432)]), { narration: 'Year-end accrual N18' })], { covers: ['B17', 'A9'] });

// ------------------------------------------------------------------ Error lab and capstones
L('E1', 'core', 'scdf', ['Error Lab: find and fix the wrong entries', 'এরর ল্যাব: ভুল এন্ট্রি খুঁজে ঠিক করুন'],
  ['Five entries are wrong. Use the Day Book and Audit reports.', 'পাঁচটি এন্ট্রি ভুল। Day Book ও অডিট রিপোর্ট ব্যবহার করুন।'],
  [1, 2, 3, 4, 5].map((n) => S(`Fix wrong entry #${n} (see Audit & Compliance > Error Lab Status for progress).`, `ভুল এন্ট্রি #${n} ঠিক করুন (Error Lab Status দেখুন)।`, { t: 'metric', name: 'labFixed', min: n }, 'Day Book > Enter / Alt+X')),
  [1, 2, 3, 4, 5].map((n) => ({ op: 'fixLab', id: `E${n}` })), { covers: ['A9'] });

const ledgers = [['Operating Bank', 'Bank Accounts'], ['Local Donations', 'Donations'], ['Grant Income', 'Grants Received'], ['Salary Expense', 'Salaries'], ['Salary Payable', 'Provisions'], ['PF Payable', 'Provisions'], ['Employer PF Contribution', 'Salaries'], ['Staff Advances', 'Loans & Advances (Asset)'], ['TDS Payable', 'Duties & Taxes'], ['Consultancy Fees', 'Programme Expenses'], ['Volunteer Honorarium', 'Programme Expenses'], ['Rent', 'Admin Expenses']];
L('X1', 'capstone', 'blank', ['Capstone: run a full NGO year', 'ক্যাপস্টোন: পুরো এনজিও বছর পরিচালনা'],
  ['Set up, fund, spend, pay staff and report - with scored checkpoints.', 'সেটআপ, তহবিল, ব্যয়, বেতন ও রিপোর্ট - স্কোরসহ চেকপয়েন্ট।'],
  [S('Checkpoint 1: create the ledgers Operating Bank, Local Donations, Grant Income, Salary Expense, Salary Payable, PF Payable, Employer PF Contribution, Staff Advances, TDS Payable, Consultancy Fees, Volunteer Honorarium, Rent (groups as usual).', 'চেকপয়েন্ট ১: ১২টি লেজার তৈরি করুন (Operating Bank, Local Donations, Grant Income, Salary Expense, Salary Payable, PF Payable, Employer PF Contribution, Staff Advances, TDS Payable, Consultancy Fees, Volunteer Honorarium, Rent)।', { t: 'all', checks: ledgers.map(([n, g]) => master('ledger', n, { group: g })) }),
   S('Checkpoint 2: cost category "Projects" and cost centre "Clean Water: Wells".', 'চেকপয়েন্ট ২: "Projects" ক্যাটাগরি ও "Clean Water: Wells" কস্ট সেন্টার।', { t: 'all', checks: [master('costCategory', 'Projects'), master('costCentre', 'Clean Water: Wells', { category: 'Projects' })] }),
   S('Checkpoint 3: receive donations of 2,00,000 and a grant of 5,00,000 into Operating Bank.', 'চেকপয়েন্ট ৩: ২,০০,০০০ অনুদান ও ৫,০০,০০০ গ্র্যান্ট Operating Bank-এ গ্রহণ।', { t: 'all', checks: [vcheck({ ledgers: ['Local Donations'], amount: P(200000) }), vcheck({ ledgers: ['Grant Income'], amount: P(500000) })] }),
   S('Checkpoint 4: pay Rent 15,000 and project work (Consultancy Fees) 30,000 allocated to the cost centre.', 'চেকপয়েন্ট ৪: Rent ১৫,০০০ ও প্রকল্প কাজ (Consultancy Fees) ৩০,০০০ কস্ট সেন্টারসহ।', { t: 'all', checks: [vcheck({ ledgers: ['Rent'], amount: P(15000) }), vcheck({ ledgers: ['Consultancy Fees'], amount: P(30000), centre: 'Clean Water: Wells' })] }),
   S('Checkpoint 5: add employee E1 (split to the cost centre) and post payroll for 2025-04.', 'চেকপয়েন্ট ৫: কর্মী E1 যোগ ও ২০২৫-০৪ পেরোল পোস্ট।', { t: 'all', checks: [row('employees', { id: 'E1' }), vcheck({ narr: 'Payroll 2025-04' })] }),
   S('Checkpoint 6: open Balance Sheet, I&E, R&P and Trial Balance.', 'চেকপয়েন্ট ৬: BS, I&E, R&P, TB খুলুন।', { t: 'all', checks: [rep('bs'), rep('ie'), rep('rp'), rep('tb')] }),
   S('Checkpoint 7: books balance and the year shows a surplus.', 'চেকপয়েন্ট ৭: হিসাব মিলছে এবং উদ্বৃত্ত আছে।', { t: 'all', checks: [{ t: 'metric', name: 'tbBalanced' }, { t: 'metric', name: 'surplus' }] })],
  [...ledgers.map(([name, group]) => mop('ledger', { name, group, opening: 0 })), mop('costCategory', { name: 'Projects' }), mop('costCentre', { name: 'Clean Water: Wells', category: 'Projects' }),
   vch('Receipt', '2025-04-05', ent(['Operating Bank', P(200000)], ['Local Donations', -P(200000)])), vch('Receipt', '2025-04-06', ent(['Operating Bank', P(500000)], ['Grant Income', -P(500000)])),
   vch('Payment', '2025-04-10', ent(['Rent', P(15000)], ['Operating Bank', -P(15000)])), vch('Payment', '2025-04-12', [{ ledger: 'Consultancy Fees', amount: P(30000), costCentres: [{ costCentre: 'Clean Water: Wells', amount: P(30000) }] }, { ledger: 'Operating Bank', amount: -P(30000) }]),
   rop('employees', { id: 'E1', name: 'First Employee', designation: 'Officer', type: 'Staff', basic: '20000.00', allowance: '5000.00', pfPct: '8', advance: '0.00', split: 'Clean Water: Wells:100', joined: '2025-01-01' }), run('payroll', { month: '2025-04' }),
   visit('report:bs'), visit('report:ie'), visit('report:rp'), visit('report:tb')],
  { covers: ['A1', 'A2', 'A3', 'A8', 'A11', 'B1', 'B3', 'B5', 'B11', 'B16'], setup: [{ op: 'voucher', v: { type: 'Journal', date: '2025-04-01', entries: [] } }].slice(0, 0) });

L('X2', 'capstone', 'scdf', ['Interview Simulator v2: all Core and NGO topics', 'ইন্টারভিউ সিমুলেটর v2: সব বিষয়'],
  ['100+ task bank, randomised, timed, scored, certificate.', '১০০+ টাস্ক ব্যাংক, র‍্যান্ডম, সময়সীমাসহ, স্কোর ও সার্টিফিকেট।'],
  [S('Learning Centre > Interview Simulator v2: pass with 70%.', 'Interview Simulator v2 সম্পন্ন করুন (৭০%)।', visited('interview:passed:v2'))],
  [visit('interview:passed:v2')], { covers: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18'] });

// ------------------------------------------------------------------ write
const levels = ['beginner', 'intermediate', 'advanced', 'core', 'ngo', 'capstone'];
for (const lv of levels) writeFileSync(`content/lessons/${lv}.json`, JSON.stringify(lessons.filter((l) => l.level === lv), null, 1));
console.log(`${lessons.length} lessons`);

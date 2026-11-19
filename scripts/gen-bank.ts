/** Generates content/bank/*.json (task bank, MCQ bank, glossary) and content/coverage.json. */
import { readFileSync, writeFileSync } from 'node:fs';

const P = (x: number) => Math.round(x * 100);
type A = Record<string, any>;
const bi = (en: string, bn: string) => ({ en, bn });
const tasks: A[] = [];
const T = (family: string, en: string, bn: string, check: A, solution: A[], setup?: A[]) =>
  tasks.push({ id: `T${String(tasks.length + 1).padStart(3, '0')}`, family, text: bi(en, bn), check, solution, ...(setup ? { setup } : {}) });
const ent = (...xs: [string, number][]) => xs.map(([ledger, amount]) => ({ ledger, amount }));
const v = (type: string, date: string, entries: A[], extra: A = {}) => ({ op: 'voucher', v: { type, date, entries, ...extra } });
const vc = (a: A) => ({ t: 'voucher', ...a });

// F1 ledgers (8)
[['Zakat Reserve', 'Reserves & Surplus'], ['Eid Fund Collection', 'Donations'], ['School Fee Income', 'Direct Incomes'], ['Camp Rent', 'Admin Expenses'], ['Vehicle Fuel', 'Programme Expenses'], ['Volunteer Meals', 'Programme Expenses'], ['Tea Garden Levy', 'Indirect Incomes'], ['Mobile Allowance', 'Salaries']]
  .forEach(([n, g]) => T('ledger', `Create ledger "${n}" under "${g}".`, `"${g}"-এর অধীনে "${n}" লেজার তৈরি করুন।`, { t: 'master', kind: 'ledger', name: n, where: { group: g } }, [{ op: 'master', kind: 'ledger', obj: { name: n, group: g, opening: 0 } }]));
// F2 donation receipts (8)
[4011, 4127, 4243, 4359, 4475, 4591, 4707, 4823].forEach((a, i) => T('donation', `Record a cash donation of ${a.toLocaleString('en-IN')} in Local Donations (Receipt).`, `Local Donations-এ নগদ অনুদান ${a} টাকা (Receipt) এন্ট্রি করুন।`, vc({ vtype: 'Receipt', ledgers: ['Cash', 'Local Donations'], amount: P(a) }), [v('Receipt', `2025-${String((i % 6) + 5).padStart(2, '0')}-10`, ent(['Cash', P(a)], ['Local Donations', -P(a)]))]));
// F3 payments (8)
[['Rent', 5111], ['Electricity', 5227], ['Internet', 5343], ['Stationery', 5459], ['Transport', 5575], ['Audit Fee', 5691], ['Bank Charges', 5807], ['Training', 5923]].forEach(([l, a], i) => T('payment', `Pay ${l} ${(a as number).toLocaleString('en-IN')} from Islami Bank A/c.`, `Islami Bank A/c থেকে ${l} ${a} টাকা পেমেন্ট দিন।`, vc({ vtype: 'Payment', ledgers: [l as string, 'Islami Bank A/c'], amount: P(a as number) }), [v('Payment', `2025-${String((i % 6) + 5).padStart(2, '0')}-12`, ent([l as string, P(a as number)], ['Islami Bank A/c', -P(a as number)]))]));
// F4 contra (5)
[6101, 6202, 6303, 6404, 6505].forEach((a) => T('contra', `Deposit ${a.toLocaleString('en-IN')} cash into Islami Bank A/c (Contra).`, `Cash থেকে Islami Bank A/c-তে ${a} টাকা জমা (Contra)।`, vc({ vtype: 'Contra', ledgers: ['Cash', 'Islami Bank A/c'], amount: P(a) }), [v('Contra', '2025-09-15', ent(['Islami Bank A/c', P(a)], ['Cash', -P(a)]))]));
// F5 journals (6)
[['Prepaid Expenses', 'Rent', 7101], ['Depreciation', 'Accumulated Depreciation', 7202], ['Audit Fee', 'Outstanding Audit Fee', 7303], ['Prepaid Expenses', 'Internet', 7404], ['Depreciation', 'Accumulated Depreciation', 7505], ['Audit Fee', 'Outstanding Audit Fee', 7606]].forEach(([d, c, a]) => T('journal', `Journal: Dr ${d} / Cr ${c} ${a}.`, `জার্নাল: ${d} ডেবিট / ${c} ক্রেডিট ${a}।`, vc({ vtype: 'Journal', ledgers: [d as string, c as string], amount: P(a as number) }), [v('Journal', '2026-03-25', ent([d as string, P(a as number)], [c as string, -P(a as number)]))]));
// F6 bill-wise sales (5)
[8101, 8202, 8303, 8404, 8505].forEach((a, i) => T('billwise', `Sales invoice to Sylhet Skills Centre for ${a} with bill reference "TK-${i + 1}" (Training Fee).`, `Sylhet Skills Centre-কে ${a} টাকার ইনভয়েস, বিল "TK-${i + 1}" (Training Fee)।`, { t: 'bill', ledger: 'Sylhet Skills Centre', ref: `TK-${i + 1}`, pending: P(a) }, [v('Sales', '2026-03-12', [{ ledger: 'Sylhet Skills Centre', amount: P(a), bills: [{ method: 'New Ref', ref: `TK-${i + 1}`, amount: P(a) }] }, { ledger: 'Training Fee', amount: -P(a) }])]));
// F7 cost centres (6)
['Ramadan Iftar Drive', 'Eid Gift Drive', 'Winter Clothes Drive', 'School Opening Drive', 'Blood Camp Drive', 'Tree Plantation Drive'].forEach((n) => T('costcentre', `Create cost centre "${n}" under category "Campaigns".`, `"Campaigns"-এর অধীনে "${n}" কস্ট সেন্টার তৈরি করুন।`, { t: 'master', kind: 'costCentre', name: n, where: { category: 'Campaigns' } }, [{ op: 'master', kind: 'costCentre', obj: { name: n, category: 'Campaigns' } }]));
// F8 features (4)
[['interest', 'Interest on overdue'], ['budgets', 'Budgets'], ['bankRecon', 'Bank reconciliation'], ['multiCurrency', 'Multiple currencies']].forEach(([k, n]) => T('feature', `Press F11 and turn OFF "${n}".`, `F11 চেপে "${n}" বন্ধ করুন।`, { t: 'feature', key: k, on: false }, [{ op: 'feature', key: k, on: false }]));
// F9 reports (10)
[['Balance Sheet', 'report:bs'], ['Income & Expenditure', 'report:ie'], ['Receipts & Payments', 'report:rp'], ['Trial Balance', 'report:tb'], ['Day Book', 'report:daybook'], ['Receivables ageing', 'report:outstanding'], ['Fund Statement', 'report:funds'], ['Ratio Analysis', 'report:ratio'], ['VAT Summary', 'report:vat'], ['Cash/Bank Books', 'report:cashbank']]
  .forEach(([n, k]) => T('report', `Open the ${n} report.`, `${n} রিপোর্ট খুলুন।`, { t: 'visited', key: k }, [{ op: 'visit', key: k }]));
// F10 groups (5)
[['Zakat Funds', 'Restricted Funds'], ['Eid Funds', 'Designated Funds'], ['Field Offices', 'Admin Expenses'], ['Partner Advances', 'Loans & Advances (Asset)'], ['Event Income', 'Indirect Incomes']].forEach(([n, p]) => T('group', `Create group "${n}" under "${p}".`, `"${p}"-এর অধীনে "${n}" গ্রুপ।`, { t: 'master', kind: 'group', name: n, where: { parent: p } }, [{ op: 'master', kind: 'group', obj: { name: n, parent: p, nature: 'liability' } }]));
// F11 fund transfers (4)
[1111, 2222, 3333, 4444].forEach((a) => T('fundtransfer', `Transfer ${a.toLocaleString('en-IN')} from General Fund to Designated Fund - Emergency (Inter-fund Transfer).`, `General Fund থেকে Designated Fund - Emergency-তে ${a} টাকা স্থানান্তর।`, vc({ vtype: 'Journal', ledgers: ['General Fund', 'Designated Fund - Emergency'], amount: P(a) }), [{ op: 'run', action: 'fundTransfer', v: { date: '31-3-2026', from: 'General Fund', to: 'Designated Fund - Emergency', amount: String(a) } }]));
// F13 stock items (5)
['Water Bucket', 'Soap Bar', 'Tarpaulin', 'School Bag', 'Medicine Box'].forEach((n, i) => T('stock', `Create stock item "${n}" (group Relief Goods, unit Nos).`, `"${n}" স্টক আইটেম (Relief Goods, Nos)।`, { t: 'master', kind: 'stockItem', name: n, where: { unit: 'Nos' } }, [{ op: 'master', kind: 'stockItem', obj: { name: n, group: 'Relief Goods', unit: 'Nos', openingQty: 10 + i, openingRate: P(100 + i) } }]));
// F14 donor rows (6)
['Nabila Rahman', 'Tanvir Hossain', 'Mahmuda Akter', 'Shafiq Ahmed', 'Rina Das', 'Joseph Gomes'].forEach((n, i) => T('donor', `Add donor ${`D8${i}0`} "${n}" in Donor Master.`, `Donor Master-এ D8${i}0 "${n}" যোগ করুন।`, { t: 'row', reg: 'donors', where: { id: `D8${i}0` } }, [{ op: 'row', reg: 'donors', row: { id: `D8${i}0`, name: n, type: 'Individual' } }]));
// F15 budgets (4)
[['Salary Expense', 12000000], ['Rent', 250000], ['Transport', 900000], ['Training', 1500000]].forEach(([l, a]) => T('budget', `Add an Organisation budget for ${l}: ${(a as number).toLocaleString('en-IN')}.`, `${l}-এর সংস্থা বাজেট ${a} টাকা যোগ করুন।`, { t: 'row', reg: 'budgets', where: { ledger: l as string, annual: `${(a as number)}.00` } }, [{ op: 'row', reg: 'budgets', row: { scope: 'Organisation', key: 'SCDF', ledger: l, annual: `${a}.00`, revision: '1', status: 'Draft' } }]));
// F16 members (4)
[0, 1, 2, 3].forEach((i) => T('member', `Add member M8${i}0 in Member Master.`, `Member Master-এ M8${i}0 সদস্য যোগ।`, { t: 'row', reg: 'members', where: { id: `M8${i}0` } }, [{ op: 'row', reg: 'members', row: { id: `M8${i}0`, name: `Member ${i}`, category: 'General', joined: '2026-01-01', subscription: '1200.00', paidUpto: '2026-12-31' } }]));
// F17 alter vouchers (4) with setup
[1, 2, 3, 4].forEach((i) => T('alter', `Alter voucher "T-alter ${i}" (Payment) to amount ${i * 1000 + 500}.`, `"T-alter ${i}" পেমেন্ট ভাউচারের পরিমাণ ${i * 1000 + 500} করুন।`, vc({ narr: `T-alter ${i}`, amount: P(i * 1000 + 500) }), [{ op: 'alterVoucher', narr: `T-alter ${i}`, amount: P(i * 1000 + 500) }], [v('Payment', '2025-06-03', ent(['Stationery', P(i * 100 + 77)], ['Cash', -P(i * 100 + 77)]), { narration: `T-alter ${i}` })]));
// F18 FX (3)
[[1500, '121'], [2500, '122'], [3500, '123']].forEach(([a, r]) => T('fx', `Book a foreign receipt of ${a} USD at ${r} (FC Receipt Voucher).`, `${a} USD ফরেন রিসিপ্ট ${r} রেটে (FC Receipt Voucher)।`, vc({ fxCurrency: 'USD', fxAmount: a as number }), [{ op: 'run', action: 'fxReceipt', v: { date: '10-9-2025', bank: 'Dutch-Bangla FC A/c', income: 'Foreign Donations', amount: String(a), cur: 'USD', rate: r } }]));
// F19 misc rows (3)
T('register', 'Add partner PX1 in the Sub-grantee Register.', 'Sub-grantee Register-এ PX1 যোগ।', { t: 'row', reg: 'partners', where: { id: 'PX1' } }, [{ op: 'row', reg: 'partners', row: { id: 'PX1', name: 'Partner X', grant: 'G5', tranche: '1000.00', utilised: '0.00', soeDue: '2026-06-01', status: 'Active' } }]);
T('register', 'Add imprest IMX for "Camp X" in Imprest Master.', 'Imprest Master-এ IMX যোগ।', { t: 'row', reg: 'imprest', where: { id: 'IMX' } }, [{ op: 'row', reg: 'imprest', row: { id: 'IMX', office: 'Camp X', ledger: 'Petty Cash - Head Office', limit: '5000.00', custodian: 'X' } }]);
T('register', 'Add pledge PLX for the Ramadan Appeal 2025 campaign.', 'Ramadan Appeal 2025-এর জন্য প্রতিশ্রুতি PLX যোগ।', { t: 'row', reg: 'pledges', where: { id: 'PLX' } }, [{ op: 'row', reg: 'pledges', row: { id: 'PLX', campaign: 'Ramadan Appeal 2025', donor: 'X', amount: '1000.00', due: '2026-03-01', received: '0.00' } }]);
// F20 assets (3)
[1, 2, 3].forEach((i) => T('asset', `Add asset FX${i} in the Asset Register (cost ${i * 10000}).`, `Asset Register-এ FX${i} যোগ (মূল্য ${i * 10000})।`, { t: 'row', reg: 'assets', where: { id: `FX${i}` } }, [{ op: 'row', reg: 'assets', row: { id: `FX${i}`, name: `Asset ${i}`, ledger: 'Office Equipment', funding: 'Own', cost: `${i * 10000}.00`, date: '2026-02-01', rate: '20', method: 'WDV', accDep: '0.00', status: 'In use', location: 'Head Office', verified: 'Yes' } }]));
// F21 cancel (3)
[1, 2, 3].forEach((i) => T('cancel', `Cancel the Payment voucher "T-cancel ${i}".`, `"T-cancel ${i}" পেমেন্ট ভাউচার বাতিল করুন।`, vc({ narr: `T-cancel ${i}`, cancelled: true }), [{ op: 'cancelVoucher', narr: `T-cancel ${i}` }], [v('Payment', '2025-07-03', ent(['Stationery', P(i * 10 + 5)], ['Cash', -P(i * 10 + 5)]), { narration: `T-cancel ${i}` })]));
// F22 role / vault (2)
T('security', 'Add user "temp1" with role Data Entry in Users & Roles.', 'Users & Roles-এ "temp1" (Data Entry) যোগ।', { t: 'row', reg: 'users', where: { name: 'temp1' } }, [{ op: 'row', reg: 'users', row: { name: 'temp1', role: 'Data Entry', password: 'x' } }]);
T('security', 'Set a Tally Vault password for the company.', 'কোম্পানির ভল্ট পাসওয়ার্ড দিন।', { t: 'vault' }, [{ op: 'vault', pw: 'pw' }]);
writeFileSync('content/bank/tasks.json', JSON.stringify(tasks));
console.log('tasks', tasks.length, 'families', new Set(tasks.map((t) => t.family)).size);

// ---------------------------------------------------------------- MCQ bank
type M = [topic: string, en: string, bn: string, options: string[], answer: number];
const mcq: M[] = [
  ['basics', 'Which side of a ledger shows what a person OWES the NGO?', 'কেউ এনজিওকে কত দেনা তা লেজারের কোন পাশে?', ['Debit', 'Credit', 'Neither', 'Both'], 0],
  ['basics', 'Rent paid is which type of account?', 'ভাড়া প্রদান কোন ধরনের হিসাব?', ['Nominal', 'Real', 'Personal', 'Capital'], 0],
  ['basics', 'Furniture is which type of account?', 'আসবাবপত্র কোন হিসাব?', ['Real', 'Nominal', 'Personal', 'Income'], 0],
  ['basics', 'The accounting equation is:', 'হিসাব সমীকরণ:', ['Assets = Liabilities + Funds', 'Assets = Income - Expenses', 'Funds = Assets + Liabilities', 'Income = Assets'], 0],
  ['basics', 'A Trial Balance proves:', 'ট্রায়াল ব্যালান্স প্রমাণ করে:', ['Total debits equal total credits', 'There are no errors at all', 'Profit is correct', 'Cash is safe'], 0],
  ['basics', 'Receipts & Payments Account records:', 'Receipts & Payments Account-এ থাকে:', ['Actual cash and bank receipts and payments', 'Only expenses', 'Only income', 'Budgets'], 0],
  ['basics', 'Income & Expenditure Account follows which basis?', 'I&E কোন ভিত্তিতে?', ['Accrual', 'Cash', 'Estimated', 'Budget'], 0],
  ['basics', 'Surplus of Income & Expenditure is added to:', 'আয়-ব্যয় উদ্বৃত্ত যোগ হয়:', ['Capital / General Fund', 'Cash', 'Debtors', 'Expenses'], 0],
  ['navigation', 'Which key creates a master while selecting (on the fly)?', 'সিলেকশনের সময় মাস্টার তৈরির কী:', ['Alt+C', 'Ctrl+C', 'F2', 'Alt+D'], 0],
  ['navigation', 'Which key opens the Receipt voucher?', 'রিসিপ্ট ভাউচারের কী:', ['F6', 'F5', 'F8', 'F4'], 0],
  ['navigation', 'Which key opens the Journal voucher?', 'জার্নাল ভাউচারের কী:', ['F7', 'F6', 'F9', 'F4'], 0],
  ['navigation', 'Ctrl+A in a form means:', 'ফর্মে Ctrl+A মানে:', ['Accept', 'Abandon', 'Alter', 'Add'], 0],
  ['navigation', 'Alt+F1 in a report toggles:', 'রিপোর্টে Alt+F1:', ['Detailed / Condensed', 'Print', 'Period', 'Quit'], 0],
  ['navigation', 'Which key changes the report period?', 'রিপোর্টের সময়কাল বদলায়:', ['F2', 'F3', 'F9', 'Alt+P'], 0],
  ['navigation', 'Alt+X on a voucher in the Day Book:', 'Day Book-এ Alt+X:', ['Cancels the voucher', 'Exports the report', 'Duplicates it', 'Prints it'], 0],
  ['vouchers', 'A donation received in the bank is recorded in:', 'ব্যাংকে পাওয়া অনুদান কোন ভাউচারে?', ['Receipt', 'Payment', 'Contra', 'Journal'], 0],
  ['vouchers', 'Cash deposited into the bank is recorded in:', 'নগদ ব্যাংকে জমা:', ['Contra', 'Receipt', 'Payment', 'Sales'], 0],
  ['vouchers', 'Depreciation is normally recorded through:', 'অবচয় এন্ট্রি হয়:', ['Journal', 'Contra', 'Receipt', 'Payment'], 0],
  ['vouchers', 'A Memorandum voucher:', 'মেমোরেন্ডাম ভাউচার:', ['does not affect the books', 'posts to the books', 'is a cash receipt', 'deletes entries'], 0],
  ['vouchers', 'An optional voucher is used for:', 'অপশনাল ভাউচার:', ['scenarios that do not affect actual books', 'cash only', 'deleting vouchers', 'tax'], 0],
  ['vouchers', 'A post-dated cheque is accounted for:', 'পোস্ট-ডেটেড চেক হিসাবে আসে:', ['on its cheque date', 'immediately in cash', 'never', 'as expense'], 0],
  ['billwise', 'To settle part of an invoice you use:', 'ইনভয়েসের আংশিক পরিশোধে:', ['Agst Ref', 'New Ref', 'Advance', 'Contra'], 0],
  ['billwise', 'Money received before the invoice is raised is booked as:', 'ইনভয়েসের আগে পাওয়া টাকা:', ['Advance', 'New Ref', 'Agst Ref', 'Journal'], 0],
  ['billwise', 'Bill ageing shows:', 'বিল এজিং দেখায়:', ['how old unpaid bills are', 'cash balance', 'budgets', 'stock'], 0],
  ['costcentre', 'In this simulator a Project is a:', 'এই সিমুলেটরে প্রকল্প হলো:', ['Cost category with activity cost centres', 'Ledger group', 'Voucher type', 'Currency'], 0],
  ['costcentre', 'Donor-wise income tracking uses:', 'দাতাভিত্তিক আয় ট্র্যাক হয়:', ['Cost centres', 'Stock items', 'Godowns', 'Units'], 0],
  ['ngo', 'A restricted grant must be used:', 'সীমাবদ্ধ অনুদান ব্যবহার করতে হবে:', ['only for the purpose the donor specified', 'for any expense', 'only for salaries', 'only for assets'], 0],
  ['ngo', 'Unspent restricted grants are normally:', 'অব্যয়িত সীমাবদ্ধ অনুদান:', ['shown as a restricted fund or returned', 'treated as income', 'written off', 'ignored'], 0],
  ['ngo', 'A corpus fund is:', 'কর্পাস ফান্ড হলো:', ['a permanent capital fund', 'a short-term loan', 'an expense', 'a debtor'], 0],
  ['ngo', 'A grant-funded asset is often shown with a:', 'অনুদানে কেনা সম্পদের সাথে থাকে:', ['Capital Reserve', 'Bank overdraft', 'Debtor', 'Prepaid'], 0],
  ['ngo', 'Admin overhead apportioned to a project is usually a:', 'প্রকল্পে বরাদ্দ ওভারহেড:', ['percentage of direct cost', 'fixed fee per voucher', 'donation', 'tax'], 0],
  ['ngo', 'Life membership fees are:', 'আজীবন সদস্য ফি:', ['capital in nature', 'monthly income', 'a liability to the member', 'tax'], 0],
  ['ngo', 'Pledges are recorded using:', 'প্রতিশ্রুতি এন্ট্রি হয়:', ['Memorandum vouchers', 'Payment vouchers', 'Contra vouchers', 'Sales vouchers'], 0],
  ['ngo', 'The imprest system means:', 'ইমপ্রেস্ট পদ্ধতি:', ['petty cash is topped up to a fixed amount', 'cash is never kept', 'all payments are cheques', 'cash is deposited daily'], 0],
  ['ngo', 'A 3-way match compares:', 'থ্রি-ওয়ে ম্যাচ মিলায়:', ['PO, GRN and invoice', 'Cash, bank and ledger', 'Debit, credit and balance', 'Budget, actual and fund'], 0],
  ['ngo', 'An FDR is shown under:', 'এফডিআর দেখানো হয়:', ['Investments', 'Current liabilities', 'Expenses', 'Capital'], 0],
  ['ngo', 'Interest on FDR accrued but not received is:', 'প্রাপ্য কিন্তু না পাওয়া এফডিআর সুদ:', ['Interest accrued (current asset)', 'Expense', 'Capital', 'Liability'], 0],
  ['ngo', 'Statement of Expenditure (SOE) is submitted by:', 'এসওই জমা দেয়:', ['the sub-grantee partner', 'the bank', 'the auditor', 'the donor'], 0],
  ['payroll', 'Employer PF contribution is:', 'নিয়োগকর্তার পিএফ অবদান:', ['an expense of the NGO', 'deducted from salary', 'income', 'a donation'], 0],
  ['payroll', 'TDS on a consultant fee is:', 'পরামর্শক ফি-র টিডিএস:', ['deducted and deposited with the government', 'paid to the consultant', 'income', 'ignored'], 0],
  ['payroll', 'Salary charged across two projects uses:', 'দুই প্রকল্পে বেতন বণ্টন:', ['cost centre split percentages', 'two companies', 'a Contra', 'stock journal'], 0],
  ['assets', 'Written Down Value (WDV) depreciation is charged on:', 'WDV অবচয় হয়:', ['the reducing balance', 'original cost always', 'income', 'cash'], 0],
  ['assets', 'Straight Line depreciation is charged on:', 'সরলরেখা অবচয় হয়:', ['original cost every year', 'reducing balance', 'sales', 'profit'], 0],
  ['bank', 'A bank reconciliation statement explains the difference between:', 'ব্যাংক রিকনসিলিয়েশন যা মিলায়:', ['book balance and bank statement balance', 'cash and stock', 'debtors and creditors', 'income and expense'], 0],
  ['bank', 'An uncleared cheque issued by the NGO makes the bank balance:', 'ইস্যু করা আনক্লিয়ার্ড চেকে ব্যাংক ব্যালান্স:', ['higher than the book balance', 'lower than the book balance', 'zero', 'negative'], 0],
  ['audit', 'Backdated entries are risky because:', 'ব্যাকডেটেড এন্ট্রি ঝুঁকিপূর্ণ কারণ:', ['they can change closed periods', 'they are slow', 'they are free', 'they delete data'], 0],
  ['audit', 'A negative cash balance means:', 'নেগেটিভ ক্যাশ ব্যালান্স মানে:', ['more cash was paid out than available - an error', 'a surplus', 'a donation', 'normal'], 0],
  ['audit', 'The edit log records:', 'এডিট লগ রাখে:', ['who created, altered or deleted vouchers', 'only reports printed', 'bank rates', 'tax rates'], 0],
  ['statutory', 'VAT payable is:', 'ভ্যাট পরিশোধযোগ্য =', ['output VAT minus input VAT', 'input plus output', 'income minus expense', 'zero'], 0],
  ['statutory', 'In this simulator TDS deducted is due on:', 'এই সিমুলেটরে টিডিএস জমার তারিখ:', ['15th of the following month', 'the same day', '1st January', 'year end only'], 0],
  ['fx', 'A foreign grant booked at 122 and valued at 123 later gives:', '১২২ রেটে বুক করা বৈদেশিক গ্র্যান্ট ১২৩-এ মূল্যায়নে:', ['an exchange gain', 'an exchange loss', 'no effect', 'a donation'], 0],
  ['reports', 'Which report shows fund-wise opening, additions, utilised and closing?', 'ফান্ডভিত্তিক উদ্বোধনী, সংযোজন, ব্যবহার, সমাপনী:', ['Fund Statement', 'Day Book', 'Stock Summary', 'Ratio Analysis'], 0],
  ['reports', 'Burn rate tells you:', 'বার্ন রেট বলে:', ['how fast a project budget is being spent', 'how many staff', 'bank interest', 'donor count'], 0],
  ['reports', 'Budget variance is:', 'বাজেট ভ্যারিয়েন্স:', ['budget minus actual', 'actual plus budget', 'income minus expense', 'cash minus bank'], 0],
  ['inventory', 'Weighted average stock rate is:', 'ওয়েটেড এভারেজ রেট:', ['total value divided by total quantity', 'latest price', 'lowest price', 'zero'], 0],
  ['inventory', 'A reorder level warns when:', 'রিঅর্ডার লেভেল সতর্ক করে যখন:', ['stock falls to or below the level', 'stock is zero only', 'stock is high', 'price rises'], 0],
  ['data', 'Which format does Alt+E export from a report?', 'Alt+E কোন ফরম্যাটে এক্সপোর্ট করে?', ['CSV', 'DOCX', 'MP3', 'PNG'], 0],
  ['data', 'Restoring a backup in this simulator:', 'ব্যাকআপ রিস্টোর:', ['imports it as a new company', 'overwrites the open company', 'deletes all companies', 'prints it'], 0],
  ['security', 'Which role may only view reports?', 'কোন রোল শুধু রিপোর্ট দেখতে পারে?', ['Auditor', 'Admin', 'Data Entry', 'Owner'], 0],
];
const bank = mcq.map(([topic, en, bn, options, answer], i) => ({ id: `Q${String(i + 1).padStart(3, '0')}`, topic, q: bi(en, bn), options, answer }));
// rotate answer positions so the correct option is not always first
for (const q of bank) { const k = (Number(q.id.slice(1)) * 7) % q.options.length; const right = q.options[q.answer]; q.options.splice(q.answer, 1); q.options.splice(k, 0, right); q.answer = k; }
writeFileSync('content/bank/mcq.json', JSON.stringify(bank));
console.log('mcq', bank.length);

// ---------------------------------------------------------------- glossary
const gl: [string, string, string][] = [
  ['Dr (Debit)', 'Left side of an account; increases assets and expenses.', 'অ্যাকাউন্টের বাম পাশ; সম্পদ ও ব্যয় বাড়ায়।'], ['Cr (Credit)', 'Right side of an account; increases liabilities, funds and income.', 'ডান পাশ; দায়, তহবিল ও আয় বাড়ায়।'],
  ['Ledger', 'An account where all entries of one head are collected.', 'একটি খাতের সব এন্ট্রি যেখানে জমা হয়।'], ['Group', 'A collection of ledgers, e.g. Donations.', 'লেজারের সমষ্টি।'], ['Voucher', 'A record of one transaction.', 'একটি লেনদেনের রেকর্ড।'],
  ['Contra', 'Voucher for cash/bank transfers.', 'নগদ/ব্যাংক স্থানান্তর ভাউচার।'], ['Journal', 'Voucher for adjustments with no cash.', 'নগদ ছাড়া সমন্বয় ভাউচার।'], ['Narration', 'Short note explaining a voucher.', 'ভাউচারের সংক্ষিপ্ত ব্যাখ্যা।'],
  ['Trial Balance', 'List of ledger balances; debits equal credits.', 'লেজার ব্যালান্সের তালিকা; ডেবিট = ক্রেডিট।'], ['Balance Sheet', 'Statement of assets and liabilities/funds.', 'সম্পদ ও দায়/তহবিলের বিবরণী।'],
  ['Income & Expenditure', 'Accrual-basis result of the year.', 'বছরের এক্রুয়াল ভিত্তিক ফলাফল।'], ['Receipts & Payments', 'Cash-basis summary of money in and out.', 'নগদ ভিত্তিক আয়-ব্যয় সারাংশ।'],
  ['Corpus Fund', 'Permanent capital of an NGO.', 'এনজিওর স্থায়ী মূলধন।'], ['Restricted Fund', 'Money that may be used only for a stated purpose.', 'নির্দিষ্ট উদ্দেশ্যে ব্যবহারযোগ্য তহবিল।'], ['Designated Fund', 'Fund set aside by the board for a purpose.', 'বোর্ড কর্তৃক বরাদ্দকৃত তহবিল।'],
  ['Cost Centre', 'Tag used to track income/expense by project, donor or campaign.', 'প্রকল্প/দাতা/ক্যাম্পেইন অনুযায়ী ট্র্যাক করার ট্যাগ।'], ['Bill-wise', 'Tracking balances invoice by invoice.', 'ইনভয়েস ধরে ধরে ব্যালান্স ট্র্যাক।'],
  ['Agst Ref', 'Settles an existing bill reference.', 'বিদ্যমান বিল পরিশোধ।'], ['Advance', 'Payment received/made before the bill.', 'বিলের আগে লেনদেন।'], ['On Account', 'Payment not linked to a bill.', 'বিলের সাথে সংযুক্ত নয় এমন পেমেন্ট।'],
  ['Imprest', 'Petty cash topped up to a fixed limit.', 'নির্দিষ্ট সীমা পর্যন্ত পূরণযোগ্য ক্ষুদ্র নগদ।'], ['FDR', 'Fixed deposit receipt.', 'ফিক্সড ডিপোজিট।'], ['SOE', 'Statement of Expenditure from a partner.', 'পার্টনারের ব্যয় বিবরণী।'],
  ['TDS', 'Tax deducted at source.', 'উৎসে কর কর্তন।'], ['VAT', 'Value added tax.', 'মূল্য সংযোজন কর।'], ['Challan', 'Proof of tax deposit.', 'কর জমার প্রমাণ।'], ['GRN', 'Goods received note.', 'পণ্য প্রাপ্তির রশিদ।'],
  ['WDV', 'Written down value method of depreciation.', 'অবচয়ের হ্রাসকৃত মূল্য পদ্ধতি।'], ['SLM', 'Straight line method of depreciation.', 'অবচয়ের সরলরেখা পদ্ধতি।'], ['Capital Reserve', 'Fund representing grant-funded assets.', 'অনুদানে কেনা সম্পদ নির্দেশক তহবিল।'],
  ['Burn rate', 'Speed at which a project budget is spent.', 'প্রকল্প বাজেট খরচের গতি।'], ['Accrual', 'Recording income/expense when earned/incurred, not when paid.', 'অর্জন/ব্যয়ের সময়ে এন্ট্রি, পরিশোধের সময়ে নয়।'], ['Edit log', 'Audit trail of changes to vouchers.', 'ভাউচার পরিবর্তনের অডিট ট্রেইল।'],
];
writeFileSync('content/bank/glossary.json', JSON.stringify(gl.map(([term, en, bn]) => ({ term, en, bn }))));

// ---------------------------------------------------------------- coverage map
const cat: Record<string, [string, string]> = {
  A1: ['Company: create/alter/select/shut/split/backup/restore/repair, roles, Vault, FY change', 'F1, F3, Company Info'], A2: ['Masters: groups, ledgers, voucher types/classes, currencies, cost centres', 'Masters'],
  A3: ['Accounting vouchers incl. optional, post-dated, memorandum, reversing', 'F4-F10 vouchers'], A4: ['Inventory: items, batches, price lists, reorder, orders, BOM', 'Inventory + NGO > Inventory (advanced)'],
  A5: ['Banking: cheques, PDC, reconciliation', 'NGO > Treasury & Banking'], A6: ['Bill-wise & credit control', 'Outstandings, NGO > Credit Control'], A7: ['Budgets, controls, scenarios', 'NGO > Projects & Budgets, Audit'],
  A8: ['Reports (BS, I&E, R&P, TB, books, ratio, statistics, audit)', 'Gateway > Reports / Display'], A9: ['Audit: edit log, exceptions, gaps, backdated', 'NGO > Audit & Compliance'],
  A10: ['Data: CSV/XML, print/PDF, report configuration', 'Alt+E, Alt+P, XML functions'], A11: ['Payroll', 'NGO > Payroll'], A12: ['Statutory (BD simulated): VAT, TDS, challan', 'Display > Statutory Reports'],
  B1: ['Fund accounting', 'NGO > Funds & Donors'], B2: ['Donor management', 'NGO > Funds & Donors'], B3: ['Grant management', 'NGO > Grants'], B4: ['Foreign donation compliance (simulated)', 'NGO > Grants'], B5: ['Project / programme costing', 'NGO > Projects & Budgets'],
  B6: ['Budget management', 'NGO > Projects & Budgets'], B7: ['Membership & subscription', 'NGO > Membership'], B8: ['Beneficiary / programme records', 'NGO > Beneficiaries'], B9: ['Procurement', 'NGO > Procurement'], B10: ['Fixed assets', 'NGO > Fixed Assets'],
  B11: ['HR & payroll (NGO)', 'NGO > Payroll'], B12: ['Petty cash & imprest', 'NGO > Petty Cash'], B13: ['Fundraising campaigns', 'NGO > Fundraising'], B14: ['Bank & treasury', 'NGO > Treasury & Banking'], B15: ['Receivables/payables/sub-grants', 'NGO > Sub-grants, Outstandings'],
  B16: ['Reporting pack', 'NGO > Reporting Pack'], B17: ['Audit & compliance', 'NGO > Audit & Compliance'], B18: ['Governance (user log, budget approval)', 'NGO > Security & Data, Budgets'],
};
const lessonFiles = ['beginner', 'intermediate', 'advanced', 'core', 'ngo', 'capstone'];
const all: A[] = lessonFiles.flatMap((f) => JSON.parse(readFileSync(`content/lessons/${f}.json`, 'utf8')));
const coverage = Object.fromEntries(Object.entries(cat).map(([k, [title, screen]]) => [k, { title, screen, seed: k.startsWith('A') ? 'SCDF seed' : 'SCDF seed registers', lessons: all.filter((l) => l.covers?.includes(k)).map((l) => l.id) }]));
writeFileSync('content/coverage.json', JSON.stringify(coverage, null, 1));
console.log('coverage items', Object.keys(coverage).length);

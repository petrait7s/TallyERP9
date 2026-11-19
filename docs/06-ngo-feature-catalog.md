# 06 — FULL NGO Feature Catalog (every feature must exist as a working, seeded, lesson-linked mockup)

Rule: Every item below = (a) working screen in Tally ERP 9 look, (b) seed data present, (c) at least one lesson + checker. Track coverage in `docs/COVERAGE.md` (feature → screen → seed → lesson id). CI fails if any catalog item has no lesson.

Implementation note: Tally has no CRM-style modules, so NGO-management features are built the **Tally way**: masters + user-defined fields (UDF) + cost centres + vouchers + reports, all in the same boxy Tally UI. No modern dashboards.

## A. Core Tally ERP 9 features (all)
1. Company: create/alter/select/shut/split/backup/restore/data repair, security & user roles (Admin, Data Entry, Auditor), passwords, Tally Vault (simulated), financial year change
2. Masters: groups, ledgers, voucher types, voucher classes, currencies, cost categories/centres, budgets, scenarios, interest parameters
3. Accounting vouchers: Contra, Payment, Receipt, Journal, Sales, Purchase, Credit/Debit Note, Memorandum, Reversing Journal, Optional, Post-dated, Payroll
4. Inventory: stock groups/categories/items/units/godowns, batches, price lists, reorder levels, Stock Journal, Physical Stock, Rejection in/out, Delivery/Receipt Note, Purchase/Sales Order, Job work (basic), Bill of Materials (basic)
5. Banking: cheque printing, deposit slip, post-dated cheque management, bank reconciliation, e-payment advice (simulated)
6. Bill-wise & credit: ageing, interest on overdue, outstanding reminders, ledger confirmation letters
7. Budgets & controls: budget vs actual, negative cash/credit-limit warnings, scenario (optional voucher) management
8. Reports: Balance Sheet, I&E, R&P, TB, Day/Cash/Bank/Journal/Purchase/Sales Registers, Ledger/Group/Cost Centre breakups, Ratio, Cash Flow, Funds Flow, Stock reports, Statistics, Audit/Exception reports
9. Audit: edit log, Tally Audit-style checks (negative cash, unreconciled, cancelled vouchers, backdated, voucher gaps)
10. Data: Excel/CSV export, XML import/export simulated, print/PDF with report configuration (F12), voucher printing & invoice formats, email/WhatsApp share (stub)
11. Payroll (Tally ERP 9): employee groups & employees, pay heads (earnings/deductions/employer contributions), salary structure/details, attendance/production types, payroll vouchers, payslip, payroll statements (register, summary, pay sheet), loans & advances, gratuity/provident fund simulation
12. Statutory (Bangladesh simulated): VAT (basic), TDS/AIT deduction, challan; plus optional India pack toggle (TDS, 80G/12A receipts, FCRA)

## B. NGO management features (Tally-style implementation)
1. **Fund accounting**: Corpus, General, Restricted, Designated funds; inter-fund transfers; fund balance statement; fund-wise Balance Sheet
2. **Donor management**: donor master (UDF: type, address, phone, tax/PAN-like ID, preferred mode), donor-wise contribution register, receipts with auto-numbered **donation receipts** (print format), recurring donors, in-kind donations (stock/asset), anonymous donations, donor ledger statements, thank-you list
3. **Grant management**: grant master (donor, project, amount, currency, period, tranche schedule), tranche receipts, restricted fund tracking, utilisation vs budget, **donor financial report format** (budget-line-wise), unspent balance & refund/return voucher, grant closure
4. **Foreign donation compliance (Bangladesh simulated)**: separate FC bank account, foreign donation register, project-approval & fund-release request references (NGO Affairs Bureau forms e.g. FD-6/FD-7 as reference fields — verify current rules; label simulated), approval no./validity per grant; optional FCRA-style register for India pack
5. **Project / programme costing**: project (cost category) → activity/budget line (cost centre), project budget, expense allocation (direct + apportioned admin overhead %), project P&L (I&E), burn-rate report, donor-wise & project-wise cross report
6. **Budget management**: annual org budget, project budgets, revisions, variance report, alerts when >90% used
7. **Membership & subscription**: member master (UDF: ID, join date, category), subscription/entrance fee vouchers, arrears/advance subscription, member-wise statement, life-membership fund treatment
8. **Beneficiary / programme records (light)**: beneficiary master via stock-like or UDF register (name, village, programme), distribution vouchers (relief items to beneficiary groups), beneficiary count per project, distribution report by godown/camp
9. **Procurement**: purchase requisition (memo), quotation comparison (notes), purchase order, GRN, supplier invoice, 3-way match report, approval via voucher status
10. **Fixed assets**: asset register, purchase, grant-funded vs own-funded, depreciation (SLM/WDV), disposal, transfer, asset-fund reserve treatment, physical verification report
11. **HR & payroll (NGO)**: staff by project, salary charged to project cost centres (split %), allowances, PF/gratuity, advances, volunteer honorarium, consultant TDS, payslips, project-wise payroll cost
12. **Petty cash & imprest**: imprest per camp/office, replenishment vouchers, cash book, cash count sheet
13. **Fundraising campaigns**: campaign cost centre, pledges (memorandum vouchers), pledge vs received, campaign ROI report
14. **Bank & treasury**: multiple banks, FDRs (investments, interest accrual/TDS), bank reconciliation, cheque register, fund-wise bank allocation
15. **Receivables/payables**: grants receivable (accrual), pledges, advances to staff/partners, sub-grants to partner organisations (sub-grantee master, tranche, utilisation, SOE)
16. **Reporting pack**: Receipts & Payments, I&E, Balance Sheet, fund statement, schedules (notes to accounts), donor reports, utilisation certificate, project completion report, management dashboard as Tally-style statistics screen, auditor pack PDF, annual report tables
17. **Audit & compliance**: audit trail, exception reports, year-end checklist, schedule of fixed assets, related-party register, bank confirmation list, statutory dues tracker (VAT/TDS payable & due dates)
18. **Governance**: board/committee notes via voucher narration/attachments (simulated), budget approval status, user-wise entry log

## C. Cross-cutting
- All reports exportable PDF/CSV; all masters multi-create; every voucher alterable with audit log.
- Bangla number words on cheque/receipt print (e.g. "Taka Five Thousand Only") + BDT lakh/crore grouping.
- Language toggle for coach (bn/en); Tally screens English.
- Multi-company seed: (1) SCDF (full-featured, ~600 vouchers), (2) "Tea Garden Women Cooperative" (small, beginner), (3) "Blank NGO" for create-from-scratch lessons.

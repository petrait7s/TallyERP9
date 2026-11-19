# 03 — Curriculum (data in content/lessons/*.json)

Lesson JSON: `{id, level, title:{en,bn}, goal:{en,bn}, steps:[{instruction:{en,bn}, expectKey|expectState, hint:{en,bn}, validator}], quiz:[...], reset?:seedSlice}`. Coach panel shows one step at a time; validator inspects real app state/keystrokes; wrong → hint; "Show me" animates keystrokes.

## Beginner
B1 Accounting basics: Dr/Cr, golden rules (Personal/Real/Nominal) — quiz
B2 Navigation: Gateway, Esc/Enter, F-keys, date change, company select
B3 Create NGO company (name, FY, currency)
B4 Groups & ledgers (cash, bank, donation, expense) + Alt+C on the fly
B5 First vouchers: Receipt (donation), Payment (expense), Contra
B6 Day Book, Ledger, Trial Balance — drill-down
B7 Alter/Delete/Cancel/Duplicate voucher

## Intermediate
I1 Journal: adjustments, outstanding/prepaid, depreciation
I2 Bill-wise: advance, agst ref, ageing
I3 Cost centres as projects/donors
I4 Restricted grant lifecycle → utilisation report
I5 Membership & entrance fees; accrued vs received
I6 Bank reconciliation
I7 Reading I&E, R&P, Balance Sheet
I8 Inventory for relief goods

## Advanced
A1 Foreign grant + exchange gain/loss
A2 Fixed assets, depreciation, capital fund adjustment
A3 VAT/TDS basics (simulated)
A4 Budgets & variance
A5 Year-end closing, new FY carry-forward
A6 Backup/Restore, data split, edit log
A7 Ratio analysis, cash/funds flow, auditor-ready PDF pack
A8 **Interview Simulator**: 30 timed practical tasks + 50 MCQ, scored report, certificate PDF

## Mechanics
- Gating: unlock next level at ≥80%. XP/progress bar, retry, per-lesson "Reset sandbox".
- Free Practice mode: coach off.
- Error Lab: seeded wrong entries; learner finds & fixes via Day Book.
- Glossary + shortcut cheatsheet overlay (Ctrl+/).
- Coach panel is collapsible; Tally screen look never altered.

---
# EXTENSION — Full-coverage lessons (one+ lesson per catalog item in docs/06)

## Core Tally
C1 Security & user roles, Tally Vault simulation, FY change
C2 Voucher classes & custom voucher types, optional vouchers & scenarios
C3 Inventory advanced: batches, price lists, reorder, physical stock, orders, delivery/receipt notes, job work basics
C4 Banking: cheque printing, deposit slip, post-dated cheques, reconciliation
C5 Credit control: ageing, interest on overdue, reminders, confirmation letters
C6 Audit: edit log, exception reports, voucher gaps, backdated entries
C7 Data exchange: Excel/CSV export, XML import simulation, report configuration (F12), voucher/invoice print formats
C8 Payroll full cycle: employee groups → pay heads → salary structure → attendance → payroll voucher → payslip → statements → advances/loans → PF/gratuity

## NGO management
N1 Fund accounting: corpus/restricted/designated, inter-fund transfer, fund statement
N2 Donor management: donor master, receipts + printable receipt, recurring, in-kind, anonymous, donor statement
N3 Grant lifecycle: grant master, tranches, utilisation vs budget, donor report format, refund, closure
N4 Foreign donation compliance (simulated): FC account, register, approval references, FX handling
N5 Project costing: project→activity hierarchy, direct vs overhead apportionment, burn rate
N6 Budget management & variance alerts, revisions
N7 Membership: subscriptions, arrears/advance, life membership
N8 Beneficiary distribution: relief vouchers, per-project beneficiary counts
N9 Procurement chain: requisition → quotation → PO → GRN → invoice → 3-way match
N10 Fixed asset register: grant-funded vs own, depreciation, disposal, verification
N11 NGO payroll: project-split salaries, volunteers, consultants + TDS, project payroll cost
N12 Petty cash & imprest management
N13 Fundraising: pledges (memorandum), pledge vs received, campaign ROI
N14 Treasury: FDR, interest accrual/TDS, bank allocation by fund
N15 Sub-grants to partners: tranche, utilisation, statement of expenditure
N16 Statutory (BD simulated + optional India pack): VAT, TDS, challan, dues tracker
N17 Final reporting pack: schedules/notes, utilisation certificate, project completion report, auditor pack, annual report tables
N18 Year-end & audit readiness checklist (end-to-end)

## Capstone
X1 **Full NGO year simulation**: learner runs a blank NGO through one FY (set up → grants → projects → payroll → procurement → closing → reports) with auto-scored checkpoints
X2 Interview Simulator v2 covering all C* and N* topics (timed, randomised from task bank of 100+)
Progress map shows coverage % against docs/06 catalog.

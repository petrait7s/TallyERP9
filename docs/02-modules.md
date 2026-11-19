# 02 — Modules & NGO Rules

## Masters
- **Groups**: all Tally defaults (Capital Account, Reserves & Surplus, Current Assets/Liabilities, Fixed Assets, Investments, Loans, Direct/Indirect Income & Expenses, Bank Accounts, Bank OD, Cash-in-hand, Sundry Debtors/Creditors, Suspense…) + NGO groups: Corpus Fund, Capital Fund, Restricted Funds, Grants Received, Donations, Membership Fees, Entrance Fees, Programme Expenses, Admin Expenses, Salaries, Fundraising Expenses.
- **Ledgers**: name, under, opening balance, bill-by-bill, cost-centre applicable. Create/Alter/Display/Multi-create.
- **Voucher types**: default + custom, auto numbering.
- **Cost Categories & Cost Centres** used as Projects/Donors/Funds.
- **Currency**: BDT base; USD/EUR donations with exchange gain/loss.
- **Inventory**: Stock Groups, Items, Units, Godowns (relief goods).

## Vouchers (edit/cancel/delete/duplicate)
Contra, Payment, Receipt, Journal, Sales, Purchase, Credit/Debit Note, Memorandum, Reversing Journal, Optional, Post-dated, Stock Journal, Delivery/Receipt Note.
- Single vs double-entry mode (F12). Bill allocation: New Ref, Agst Ref, Advance, On Account.
- Cost-centre allocation on income/expense lines. Cheque no. + Bank Reconciliation.
- Simplified Bangladesh VAT/TDS simulation behind Statutory feature.

## Reports (computed live)
Balance Sheet (NGO layout), **Income & Expenditure**, **Receipts & Payments**, Trial Balance, Day Book, Cash/Bank Book, Ledger, Group Summary, Journal Register, Outstandings (ageing), **Fund/Project-wise statement**, **Donor-wise grant utilisation**, Stock Summary, Stock Item Movement, Ratio Analysis, Cash Flow, Funds Flow, Statistics. All: F2 period, drill-down, detailed/condensed, PDF/CSV export.

## NGO accounting rules
- I&E surplus/deficit → Capital Fund in Balance Sheet.
- Restricted grants: receipt → Grant Fund; expenses charged against it; unutilised balance shown.
- Assets bought from grant → Capital Reserve adjustment (show both treatments).
- R&P = cash basis; I&E = accrual basis.
- FY start 1-Apr (switchable to 1-Jul).

## F11 Features toggles
Accounts only / with inventory, bill-wise, cost centres, interest, budgets, multi-currency, bank reconciliation, VAT/TDS, basic payroll (later).

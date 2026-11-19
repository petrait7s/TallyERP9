# Deviations from Tally ERP 9
(Claude Code: log every intentional/unavoidable difference here.)

- Engine: Receipts & Payments lists counter-ledgers of every voucher touching Cash/Bank (Contra excluded); Tally derives R&P from Cash/Bank group summaries.
- Engine: I&E ignores opening balances of nominal ledgers for the period flow; any such opening is shown as prior-year result on the Balance Sheet.
- Engine: Money stored as integer paisa in JS numbers (safe to ~9e13 BDT).

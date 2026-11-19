# Deviations from Tally ERP 9
(Claude Code: log every intentional/unavoidable difference here.)

- Engine: Receipts & Payments lists counter-ledgers of every voucher touching Cash/Bank (Contra excluded); Tally derives R&P from Cash/Bank group summaries.
- Engine: I&E ignores opening balances of nominal ledgers for the period flow; any such opening is shown as prior-year result on the Balance Sheet.
- Engine: Money stored as integer paisa in JS numbers (safe to ~9e13 BDT).
- UI shell (P2): Gateway menu is simplified (Create/Alter/Display submenus are stubs until P3+). Esc on Gateway does not prompt quit; use Quit item. F-key buttons without a screen action render greyed.
- Masters (P3): ledger opening balance is typed as one text value ("2,00,000 Cr"; default side from group nature) instead of Tally's separate Dr/Cr prompt. Multi-create, Ctrl+Enter alter-from-list and Alt+C from list screens are not yet implemented. Group delete/rename of predefined groups is blocked; Tally also lets "Alter" non-name fields of predefined groups, here predefined groups are fully locked.
- Masters: Stock Item has only unit/opening qty/rate (no batches, BOM, reorder yet). Currency rate is a single static rate (per-date rates arrive with multi-currency vouchers).

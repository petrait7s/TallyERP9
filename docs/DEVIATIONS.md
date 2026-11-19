# Deviations from Tally ERP 9
(Claude Code: log every intentional/unavoidable difference here.)

- Engine: Receipts & Payments lists counter-ledgers of every voucher touching Cash/Bank (Contra excluded); Tally derives R&P from Cash/Bank group summaries.
- Engine: I&E ignores opening balances of nominal ledgers for the period flow; any such opening is shown as prior-year result on the Balance Sheet.
- Engine: Money stored as integer paisa in JS numbers (safe to ~9e13 BDT).
- UI shell (P2): Gateway menu is simplified (Create/Alter/Display submenus are stubs until P3+). Esc on Gateway does not prompt quit; use Quit item. F-key buttons without a screen action render greyed.
- Masters (P3): ledger opening balance is typed as one text value ("2,00,000 Cr"; default side from group nature) instead of Tally's separate Dr/Cr prompt. Multi-create, Ctrl+Enter alter-from-list and Alt+C from list screens are not yet implemented. Group delete/rename of predefined groups is blocked; Tally also lets "Alter" non-name fields of predefined groups, here predefined groups are fully locked.
- Masters: Stock Item has only unit/opening qty/rate (no batches, BOM, reorder yet). Currency rate is a single static rate (per-date rates arrive with multi-currency vouchers).
- Vouchers (P4): Payment/Receipt/Sales/Purchase use the single-entry layout (Account + Particulars); Contra/Journal/Credit & Debit Note/Memorandum/Reversing Journal use Dr/Cr lines. Sales/Purchase are accounting-invoice style (no inventory lines yet). Ledger pick lists drop below the field instead of Tally's right-hand panel. An altered voucher that does not fit single-entry (e.g. two account-side lines) opens in Dr/Cr layout.
- Bill-wise: a bill-wise ledger left without bill details is auto-allocated "On Account" (Tally forces the allocation screen). Bill allocation opens after the amount, cost allocation first.
- Reversing Journal and Memorandum are non-posting; Reversing Journal does not auto-convert on its "applicable up to" date. Optional/post-dated flags exist in the engine but have no entry-screen toggle yet (needs F12/F11 config in P6).
- Voucher register (Gateway > Display > Day Book) is a plain list for now: Enter alters, Alt+2 duplicates, Alt+X cancels and Alt+D deletes (in the alteration form). Proper Day Book report arrives in P5. Cheque no., Alt+A from list, and Ctrl+Enter are not implemented.
- Voucher-type restrictions: Contra allows only Cash/Bank ledgers; Payment/Receipt need a Cash/Bank line on Cr/Dr; Sales/Purchase need party (debtor/creditor/cash/bank) on Dr/Cr.
- Reports (P5): Balance Sheet, I&E and R&P are group-level with Enter drill-down (group -> sub-group -> ledger -> voucher -> alteration); Alt+F1 expands all sub-groups/ledgers, Alt+F5 switches horizontal/vertical. Alt+E exports CSV and Alt+P uses browser print; PDF export, XML/Excel formats and F12 report configuration are P6.
- Ledger account lists every voucher (Tally first shows a month-wise summary). Day Book shows one Amount column (first ledger as particulars) and supports Alt+2 duplicate / Alt+X cancel; Alt+A add is not implemented.
- Trial Balance shows Opening / Debit / Credit / Closing columns, one balance per group (Tally ERP 9 shows Dr/Cr split columns). Any difference in opening balances appears on the Balance Sheet as "Difference in Opening Balances", as in Tally.
- Report period (F2) is global and kept across reports; dates typed without a year resolve inside the financial year.
- Outstandings use bill date as due date (no credit periods yet) and fixed 0-30/31-60/61-90/90+ buckets; unreferenced balances show as "On Account". Stock Summary shows opening stock only until stock vouchers exist. Ratio Analysis is a short list; Cash Flow, Funds Flow, Journal/Purchase/Sales registers and Statistics are not built yet.
- Fund/Project statement uses cost centres (category-filtered view not exposed yet); donor-wise grant utilisation arrives with P7b.

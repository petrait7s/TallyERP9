# 01 — Tally ERP 9 Interface Spec

## Window layout (top→bottom)
1. **Title bar**: "TallyLearn NGO (practice edition)" + window controls. Top strip: left product label (original text/logo, not Tally's), right: company name.
2. **Main area**:
   - **Top-left small panel**: `Current Period` and `Current Date` (e.g. 1-Apr-2025 to 31-Mar-2026, Tuesday 1-Apr-2025). Light colour.
   - **Left lower panel**: "Name of Company / Date of Last Entry" list on company-select screen.
   - **Centre panel**: "Gateway of Tally" menu (title strip, items list, highlighted selection bar). Narrow, centred, light-blue/white with darker title strip.
   - **Right button bar** (vertical, ~160px): buttons labelled with their key, e.g. `F1: Select Cmp`, `F2: Date`, `F3: Cmp Info`, `F4: Contra` ... `F12: Configure`; context-sensitive; disabled = greyed. Clickable AND keyboard-triggered.
3. **Bottom status bar**: version text (original), hints area, date/time.
4. **Calculator pane** bottom-right (Ctrl+N) optional.

## Colour/typography (approximate Tally ERP 9 look)
- Background: pale grey-blue. Panels: cream/white, thin dark borders. Panel title strips: dark blue/teal, white text. Selected row: strong blue/cyan highlight. Report headings: dark blue. Dr/Cr right-aligned; closing balances show `Dr`/`Cr`.
- Sans-serif ~12–13px, tabular numerals. Flat, boxy, 1px borders, no rounded cards. Fidelity > beauty.

## Gateway of Tally menu (match real order)
Masters: Create, Alter, Display(Info) · Transactions: Accounting Vouchers, Inventory Vouchers, Display(Book) · Utilities: Import of Data, Banking · Reports: Balance Sheet, Profit & Loss A/c (→ **Income & Expenditure** for NGO), Stock Summary, Ratio Analysis · Display · Quit.
**Company Info (Alt+F3)**: Select/Shut/Create/Alter Company, Split, Backup, Restore, Data Repair. Plus Accounts Info / Inventory Info / Statutory Info menus.

## Keyboard map (implement all)
| Key | Action |
|---|---|
| Esc | back / cancel |
| Enter | select / next field / drill-down |
| Ctrl+A | accept |
| Ctrl+Q | abandon screen |
| Ctrl+Enter | alter master from list |
| Alt+C | create master on the fly |
| Alt+D | delete (alteration) |
| Alt+A | add voucher (Day Book etc.) |
| Alt+2 | duplicate voucher |
| Alt+X | cancel voucher |
| Alt+P / Alt+E | print / export |
| Alt+F1 | detailed/condensed |
| Alt+F5 | vertical/horizontal etc. |
| F1 | Select Cmp |
| F2 | date/period change |
| F3 | Select company |
| F4–F9 | Contra / Payment / Receipt / Journal / Sales / Purchase |
| Ctrl+F8 / Ctrl+F9 | Credit Note / Debit Note |
| F10 | Other vouchers (Memorandum, Reversing Journal…) |
| F11 | Features |
| F12 | Configure |
| Space | select/deselect in multi-select |
| Backspace | previous field |
| Arrows/PgUp/PgDn/Home/End | list nav |

## Behaviour details
- Sequential fields; Enter advances; Up/Backspace goes back; defaults auto-fill (date = last used).
- Ledger selection popup on right half, incremental search, "End of List", Alt+C create at top.
- Journal uses `Dr`/`Cr` prefix; Payment/Receipt use `Account:` + `Particulars`.
- Reports: Particulars left; Debit / Credit / Closing right; Enter drill-down: Balance Sheet → Group → Ledger → Voucher → alteration.
- Date input like Tally: `1-4-25`, `1/4`, `1` auto-expands to current voucher month/year.
- Voucher No. top-left (auto-increment per type), Date top-right, narration bottom.

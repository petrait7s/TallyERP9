# MASTER PROMPT — TallyLearn NGO (Tally ERP 9 style learning simulator)

You are a senior full-stack/desktop engineer. Build a **Windows desktop learning simulator** that replicates the **Tally ERP 9 interface and workflow** (keyboard-driven, Gateway of Tally, voucher entry, reports) specialised for **NGO / non-profit accounting**, with a built-in **beginner → advanced curriculum** and **pre-seeded mock data**, so a learner can see every core function working visually. Purpose: job-interview/work readiness in Tally ERP 9.

Read `CLAUDE.md` and every file in `docs/` first. They are the source of truth.

**SCOPE = FULL MOCKUP**: every feature in `docs/06-ngo-feature-catalog.md` (all Tally ERP 9 features + all NGO-management features) must exist as a working, seeded screen with a lesson and checker. Maintain `docs/COVERAGE.md` (feature → screen → seed → lesson) and make CI fail if any catalog item lacks a lesson.

## Non-negotiables
1. **Interface fidelity**: screen layout, panel colours, menu hierarchy, F-key buttons, Alt/Ctrl shortcuts, cursor/Enter-key navigation, field order and report layouts must match Tally ERP 9 (see `docs/01-ui-spec.md`). Keyboard-first; mouse is secondary.
2. **Real accounting engine**: double-entry, every voucher type, ledger groups, Trial Balance always balances. Not static screenshots — computed reports.
3. **NGO format**: Income & Expenditure A/c, Receipts & Payments A/c, Balance Sheet with Capital/Corpus Fund, Fund-wise/Project-wise (cost centres) tracking, donations, grants, membership fees (see `docs/02-modules.md`).
4. **Learning layer**: Lesson mode with guided steps, on-screen hint overlay, auto-checker per exercise, progress tracking, quizzes, reset-to-seed (see `docs/03-curriculum.md`). Learning overlay must NOT break Tally-look; it is a collapsible side coach panel + toggle.
5. **Mock data**: seeded on first run, resettable (see `docs/04-seed-data.md`).
6. **Offline-first**, no server. Installable `.exe` (NSIS installer + portable) via GitHub Actions on tag push.
7. Bilingual coach text: Bangla + English toggle. Tally screens stay English.

## Phases (commit + push after each; keep CI green)
- **P0** Repo scaffold: Electron + Vite + React + TS, lint, vitest, electron-builder, release workflow (`.github/workflows/release.yml` provided). Prove an empty window builds into an .exe in CI before anything else.
- **P1** Accounting engine (pure TS package `src/engine`): groups, ledgers, vouchers, balances, reports + unit tests (trial balance equality, stock valuation, etc.).
- **P2** Tally UI shell: Gateway of Tally, button bar, company info, F-key handling, menu stack (Esc to go back), list/selection screens, status bar.
- **P3** Masters: Groups, Ledgers (with Alt+C inline create), Voucher Types, Cost Centres/Categories, Currencies, Stock Groups/Items/Units/Godowns.
- **P4** Vouchers: Contra F4, Payment F5, Receipt F6, Journal F7, Sales F8, Purchase F9, Credit Note Ctrl+F8, Debit Note Ctrl+F9, Memorandum, Reversing Journal; bill-wise, cost-centre allocation, narration, alteration, cancel/delete.
- **P5** Reports: Balance Sheet, I&E, R&P, Trial Balance, Day Book, Ledger, Group Summary, Cash/Bank Book, Outstandings, Stock Summary, Fund/Project statements, with drill-down (Enter) and Alt+F1 / Alt+F5 view toggles, F2 period change.
- **P6** Features/Config: F11 Features, F12 Configure, Statutory (basic VAT/TDS simulation for Bangladesh, optional), Backup/Restore/Data split basic, Print preview + export PDF.
- **P7** Learning layer: curriculum engine, step validators, hints, progress, quizzes, certificate PDF, seed/reset.
- **P7b** Full-coverage modules per docs/06: Payroll, Fund accounting, Donor & Grant management, Project costing, Budgets, Membership, Beneficiary distribution, Procurement chain, Fixed assets, Petty cash, Fundraising/pledges, Treasury/FDR, Sub-grants, Statutory, Audit/exception reports, Reporting pack. Build in this order: Payroll → Funds/Donors/Grants → Projects/Budgets → Procurement/Assets → rest. Commit per module with seed + lessons + tests.
- **P7c** Extended curriculum C1–C8, N1–N18, X1–X2 and Interview Simulator v2.
- **P8** Polish: installer icon, about screen with disclaimer, accessibility, perf, docs, v1.0.0 release.

## Definition of done
- `npm test` passes; trial balance balances for seed + any learner-entered data.
- Every lesson in `docs/03-curriculum.md` (incl. extension) is completable and auto-verified; COVERAGE.md shows 100%.
- Tag `v1.0.0` produces a GitHub Release with `.exe` installer + portable.
- README (EN + Bangla quick start), screenshots, CHANGELOG.

## Working rules
- After each phase: summarise what was built, what deviates from Tally ERP 9, what's next. Ask me only if blocked.
- If unsure about a Tally behaviour, pick the Tally ERP 9 behaviour you are most confident about and log it in `docs/DEVIATIONS.md`.
- Do not copy Tally's proprietary assets/logos/code. Recreate original visuals with matching layout/colours.

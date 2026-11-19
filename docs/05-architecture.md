# 05 — Architecture

## Stack
Electron (main/preload/renderer), Vite + React 18 + TypeScript, Zustand, vitest + Playwright smoke, electron-builder (NSIS + portable), pdf-lib or print-to-PDF. No native modules (CI-safe). Persistence: JSON company files in userData/companies (atomic write + backup rotation). Output dir for builder: `release/`.

## Structure
```
src/main/  src/preload/
src/engine/   (pure TS: money, groups, ledgers, vouchers, reports, NGO rules, validators)
src/ui/shell/ (Gateway, button bar, status bar, key router)
src/ui/screens/ (masters, vouchers, reports, features, company)
src/ui/components/ (TallyList, TallyField, TallyTable, VoucherGrid, DateField)
src/ui/coach/ (lesson runner, hints, progress)
content/ lessons/*.json, seed/*.json, glossary.json
scripts/ gen-seed.ts, make-icons.ts
tests/ engine/*.test.ts, e2e/*.spec.ts
docs/DEVIATIONS.md
```

## Key design
- Key router = stack of screen handlers; each screen declares button-bar actions (drives right-side buttons).
- Reports = pure `(state, period, options) => ReportTree` with drill-down refs.
- Voucher editor = schema-driven grid per voucher type.
- Lesson validators read engine state + recorded key events.
- Versioned data format with migrations.

## Tests required
Engine: balance invariants, group hierarchy, bill allocation, FX gain/loss, stock valuation, NGO statements, period filter, alter/cancel effects. E2E: Gateway → Receipt → Day Book via keyboard. Seed golden snapshots.

## Release
Tag `v*` → release.yml on windows-latest → `TallyLearn-NGO-Setup-x.y.z.exe` + portable exe + SHA256 on GitHub Release. package.json must set `build.directories.output = "release"`. Unsigned exe → SmartScreen warning; document in README.

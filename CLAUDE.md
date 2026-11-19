# CLAUDE.md — project rules
- Project: TallyLearn NGO. Stack: Electron + Vite + React + TypeScript, Zustand, vitest. Windows target.
- Engine (`src/engine`) is pure TS, no UI/Electron imports, 100% unit tested.
- Money: integer paisa (BigInt-safe or number of paisa), never floats. Currency BDT (৳). Display `1,23,456.00` Indian/BD digit grouping (lakh/crore).
- Dr/Cr convention as Tally: Dr left, Cr right; "To"/"By" in ledger accounts.
- Keyboard-first: every screen must be fully operable by keyboard. Central key handler `src/ui/keys.ts`.
- UI font: monospace-like Tally look (e.g. Arial/Verdana 12-13px equivalents), fixed layout 1024x768 base, scales.
- Never commit secrets. Commit small, conventional commits. CI must stay green.
- Log deviations from Tally ERP 9 in docs/DEVIATIONS.md.
- Learning content lives in `content/lessons/*.json` (data, not code), bilingual `{en, bn}`.

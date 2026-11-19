# TallyLearn NGO — Prompt Pack for Claude Code

## Kivabe use korbe
1. GitHub e empty repo banao (e.g. `tallylearn-ngo`), Claude Code ke access dao.
2. Ei zip unzip kore repo root e rakho (`CLAUDE.md`, `docs/`, `.github/` shoho).
3. Claude Code te paste koro: **"Read PROMPT.md and all files in docs/. Execute phase by phase. Commit after every phase."**
4. Build hoye gele: `git tag v1.0.0 && git push --tags` → GitHub Actions `.exe` release banabe.

## Files
- `PROMPT.md`          — master prompt (eta first e dao)
- `CLAUDE.md`          — persistent project rules
- `docs/01-ui-spec.md` — Tally ERP 9 exact interface spec
- `docs/02-modules.md` — accounting features & NGO rules
- `docs/03-curriculum.md` — beginner→advanced lessons & checkers
- `docs/04-seed-data.md`  — mock NGO data
- `docs/05-architecture.md` — stack, structure, tests
- `docs/06-ngo-feature-catalog.md` — FULL feature list (Tally ERP 9 + NGO management) — scope of the mockup
- `.github/workflows/release.yml` — exe build & release

## Note
Tally ek registered trademark (Tally Solutions). App er naam "TallyLearn NGO" — practice simulator, unaffiliated. Original Tally logo/assets/code copy kora jabe na; layout, flow, keyboard shortcut recreate hobe.

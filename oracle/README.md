# oracle/ — independent tests for the running-method generator (release blocker B-5)

## Provenance and independence

- Written by the **Oracle session** on 22 Oct 2026 from `spec/` (modules 00–15, `parameters.md`, `schema/`,
  `fixtures-input/`) and `docs/` only. **`engine/` was never opened, read or searched** (CLAUDE.md rule 3).
- Formulas come from the module prose (03 §2–§4, 04 §3, 05 §2–§7, 06 §2c/§3b, 02 §4–§5, 09, 10 §4b). The rule
  records of `rules.json` (`rulexpr`) were not used for any value. Parameters are hand-transcribed in
  `src/params.ts`; `tests/01-params.test.ts` diffs them with `spec/parameters.json` (113 compared, 0 differences
  on 22 Oct 2026).
- Nothing in here has been run against a generator yet. "Passes" below means the oracle's own tests and
  self-checks, nothing more.

## What is here

| Item of the task | Where |
|---|---|
| (a) fixtures | `spec/fixtures-input/` (66 personas, used as is) + `fixtures/` (4 added: the two MVP plan inputs, `tst066-c25k`, `p3-ana-wk13-ext-missed`) + `src/grid.ts` (the 432 TST-051 grid cases, generated in the fixture format) |
| (b) invariant checks | `src/invariants.ts` — every invariant evaluable from a result + its input (table below), plus LOD-033 shares, week aggregates, GEN-001/003 |
| (c) metamorphic relations | `src/metamorphic.ts` — M-1…M-8 and TST-042a–h, each an input transformation + expected relation |
| (d) hand values | `src/expected/hand-values.ts` (13, 14 §10e: Tom, Lea, Karim, Maya, red-team, Raj, Mia, Rose, Ben, Ana), `src/expected/kinds.ts` (result kind per persona) |
| (e) two MVP plans | `plans/mvp-10k-time-12wk.md`, `plans/mvp-hm-time-14wk.md` (derivations) and `src/expected/mvp-plans.ts` (checkable) |
| open questions | `SPEC-QUESTIONS.md` (OQ-01 … OQ-26) |

Statuses on every expectation: **firm** (one reading), **conflict** (13 and the module text differ; both
accepted, the report says which the engine took), **assumed** (depends on a named OQ).

## Invariant coverage

| Class | Checked from the result + raw input | Not checkable here (why) |
|---|---|---|
| B (07 §5a) | 01, 02, 03, 05, 06, 07, 08, 09, 11, 15, 17, 18, 19, 21, 28, 29, 30, 31 | 10, 24 (static lints); 14 (engine denominators) |
| S | 13 (method_default MVP families), 16, 25; 27 as a warning | 04 (→ M-8), 12, 20, 22, 23, 26 |

## How to run (for the Engine / integration session)

```
cd oracle && npm install
npx vitest run                                   # oracle self-tests only; engine tests are skipped
ORACLE_ENGINE=engine/src/index.ts npx vitest run # against the generator (path relative to the repo root)
```

- `ORACLE_ENGINE` = module exporting `generate(input) → result` (`ORACLE_ENGINE_EXPORT` to rename the function);
  input and result follow `spec/schema/`. Without it every engine test is skipped.
- `ORACLE_RESULTS_DIR=<dir>` = offline mode: `<fixture_id>.json` files holding day-0 results (no replay,
  no metamorphic tests).
- `dev/stub-engine.ts` is **not a generator**: it returns the oracle's own hand plans, to test the plumbing.
- Every comparison is written to `oracle/reports/` (git-ignored). A disagreement goes into
  `docs/disagreements.md`; nobody edits the oracle to match the engine (CLAUDE.md rule 3).

| Test file | Needs | Checks |
|---|---|---|
| `00-contract` | — | every fixture (spec, oracle, grid) valid against `fixture-input.schema.json` |
| `01-params` | — | transcription vs registry (findings only) |
| `02-oracle-arithmetic` | — | the oracle's own hand numbers re-derived; the hand plans respect their bounds |
| `03-checker-selftest` | — | checker silent on the hand plans, fires on 11 broken copies |
| `10-day0-results` | engine | TST-130 schema, expected kind, TST-041 invariants, FEA-036 reason order, options |
| `11-hand-values` | engine (replay: live) | 13 / 14 §10e values |
| `12-mvp-plans` | engine (replay: live) | the two hand plans, day-0 and as published each Monday |
| `13-metamorphic` | live engine | TST-091 / TST-042 |
| `14-grid` | live engine | TST-051 |

## Week-by-week replay

`src/harness.ts` replays a fixture's `behaviour` block: it calls the generator every Monday with the log so far,
ticking each published session "done as planned" (target RPE, no pain, stomach 0/10 at the planned intake,
test questions yes/yes). Supported deviations: `skip_session`, `skip_week_unlogged`, `result`. Others
(illness, pain, goal change…) are reported as unsupported in this version.

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
| open questions | `SPEC-QUESTIONS.md` (OQ-01 … OQ-26; v5.3: OQ-27 … OQ-42) |

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

## v5.3 additions (28 Oct 2026, Oracle session; `engine/` still never opened)

| Task (handoff 7) | Where |
|---|---|
| Five advanced personas (TST-133) | `fixtures/v53-clem.json` (owner as typed: "official result?" unanswered → cautious + MSG-EXP-CONFIRM-Q), `v53-clem-confirmed.json` (the same, answered yes), `v53-marathon-3h.json`, `v53-5k-19min-5runs.json`, `v53-masters-55-ag70.json`, `v53-inconsistent-claims.json` (must stay cautious) |
| Oracle's own v5.3 derivations | `src/v53.ts` (qualifying race, age-grade, EXP-001/002/006, pace ranges with the declared widening, track rounding), `src/v53-params.ts` (hand transcription of `parameters.md` §15b and the 06 §2d ladders; 34 items diffed against the registry, 0 differences on 28 Oct) |
| Coach-quality and rendering checks | `src/quality.ts`: QC-01 … QC-08 (proposal §6, as restated by 14 TST-133), RD-01 … RD-04 (TST-134: track-friendly rounding, time stays the controlling quantity, effort-only → time, recoveries), EXP-P / EXP-002 / EXP-003 (path, levels, calibration) |
| Hand-computed owner plan | `plans/v53-clem-experienced.md` (weeks 1–6 and BUILD week 9, arithmetic shown) and `src/expected/v53-clem-plan.ts` |
| Invariants updated for v5.3 | `src/invariants.ts`: INV-17 (an all-E1 long run is not a hard day on the experienced path), INV-15 (declared anchors set paces there), GEN-011 (no TOL cap on L30_eff there) |

| Test file | Needs | Checks |
|---|---|---|
| `04-v53-arithmetic` | — | parameter transcription; path, age-grade and levels of the six fixtures; owner paces and track distances under both readings; hand-plan sums; the v5.3 checker silent on the hand plan and firing on broken copies (one defect each) |
| `15-v53-quality` | engine | every v5.3 persona: path + QC + RD properties; owner day-0 plan vs the hand plan, week by week (structure, then easy fill separately) |

Severity: a property the spec contradicts itself on (QC-05 in deload weeks, QC-03 in BASE, QC-02 below the SES-007
count) is a **warning**, so the report shows it without failing; see OQ-30, OQ-35, OQ-41.

## Week-by-week replay

`src/harness.ts` replays a fixture's `behaviour` block: it calls the generator every Monday with the log so far,
ticking each published session "done as planned" (target RPE, no pain, stomach 0/10 at the planned intake,
test questions yes/yes). Supported deviations: `skip_session`, `skip_week_unlogged`, `result`. Others
(illness, pain, goal change…) are reported as unsupported in this version.

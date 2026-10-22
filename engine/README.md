# engine/ — the plan generator (spec v5.2, MVP scope)

## In plain words

This folder is the program that turns a runner's answers into a training plan, following `spec/`. It is a library of pure functions: no network, no database, no screen. The same input always gives the same plan, byte for byte. It works on a computer (Node 22) and, compiled, in a browser.

It does what `spec/07` describes:
1. It checks safety first.
2. It decides whether the goal fits, and builds the weeks and sessions.
3. A separate checker (the validator) inspects every session against the safety limits. A plan that breaks a limit is repaired, or it is never shown: the runner gets checked options instead (a later date, an easier target, a shorter race, a base plan).

**Status (honest):** this is a first working engine, tested only by its own author's tests. Nothing here is validated against real runners or against the independent oracle yet (blocker B-5). See "What was run" and "Not done yet" below.

## Run it

```
cd engine
npm install            # dev tools only (TypeScript); the engine has no runtime dependencies
node cli.ts ../spec/fixtures-input/p3-ana.json > plan.json          # canonical JSON
node cli.ts ../spec/fixtures-input/p3-ana.json --pretty > plan.json # indented
npm test               # node --test test/*.test.ts
npm run typecheck      # tsc --noEmit
npm run build          # compiles src/ to dist/ (ES modules, for a browser bundle)
```

The input is either a generator input (`spec/schema/input-profile.schema.json`) or a fixture file of `spec/fixtures-input/` (the CLI unwraps `input`). The output is one result object (`spec/schema/result.schema.json`), whose `kind` is one of:
- `plan`: a validated plan;
- `fail_closed`: no plan for this goal, only ranked, pre-validated options;
- `gate_stop`: the safety gate stopped (generic message only);
- `hold`: a question must be answered first;
- `safe_state`: an internal error, with no plan.

## API

```ts
import { loadSpec, generate } from './src/index.ts';
const spec = loadSpec(rulesJson, parametersJson);   // the parsed spec/rules.json and spec/parameters.json
const result = generate(spec, input);               // pure; no clock, no randomness, no I/O
```

`src/` never reads files. The caller passes the two spec files in, so the same code runs in Node and in a browser.

## Layout

| Path | What |
|---|---|
| `src/expr/` | RuleExpr parser and evaluator: CEL subset with four values (true, false, error E, unknown U), the 12 §3.2/§3.9 null rules |
| `src/rules/` | rule engine: records of rules.json, `on_unknown`, action trees (`then`, `when`, `otherwise`, `unless`), composition per target (12 §3.6), tier order; parameter registry (12 §3.11); helpers of 12 §2b.3 |
| `src/pipeline/` | the generator stages: `state` (S0, S2), `gate` (S1), `demand` + `feasibility` (S3, with the S4/S6 dry run), `phases` (S4), `curve` (S6), `sessions` (S7.1–S7.8), `ladder` (start and return ladders), `modules` (06 §2 catalogue) |
| `src/validate/` | `validator` (S8, the engine's own check of 07 §5) and `repair` (S8r, REP-001…006) |
| `src/generate.ts` | the orchestration S0 → S10, the S9 options (fail closed) and the emitted result |
| `cli.ts` | command line |
| `test/` | the engine's own tests (no oracle code: `oracle/` is never opened) |

## Which rules the rule engine evaluates, and which are native code

The spec allows procedures (12 §2b.4). Here is where each kind of rule runs:

| Stage | Through the rule engine (records of rules.json) | Native code citing the rule ids |
|---|---|---|
| S0 | — | INP-001 (birth fields hold), INP-007/008 defaults, entry confidence, GEN-020 pace bounds |
| S1 gate | all S1 records: 48 global, plus the per_week, per_flag and per_entry ones (SCR, SAF, CTX, GEN-001/002, NUT …), with `on_unknown` → `hold` | final gate = most restrictive; SAF-060 re-checked on the built plan (S1 fixpoint) |
| S2 state | — | GEN-010/011/012/013/014, CMP-001/004, LOD-008, S_slow, anchor (INP-005) |
| S3 feasibility | every formal MVP S3 record: FEA-003/006/011/013/021/022/023/026/030…038/044/050, GEN-031/032, SAF-085, and FEA-036 for the verdict | FEA-001 demand, FEA-010 band, FEA-020 dry run (procedures) |
| S4 phases | — | 04 §3 allocation, PHS-001…006 deloads, PHS-010 SHARPEN |
| S6 weeks | — | LOD-003/004/005/007/010/011/020/040/050/052/056, GEN-013 |
| S7 sessions | SES-007 and SES-006 (key count, per week) | CMP-007 choice, place_in_order, dose (start steps), LOD-033 budget, water_fill (LOD-031/013/016), strides, sharpener, NUT-010, SES-009, FEA-014 paces |
| S8 validate | the 26 runtime INV assertions of rules.json (INV-10/12/23/24/26 are build lints) | the helpers they call (l30_time, baseline, preset_cap …), re-implemented without the generator's code (07 §5a) |
| S8r repair | REP-001…006 records choose the repair | methods clamp_to_limit, move_to_free_day, replace_with_easy |
| S9 options | — | FEA-040/041 order; each option is a nested S0–S8 run and is kept only if it validates |

## What was run (on 22 Oct 2026, in this session)

- `npm test`: **43 tests pass**. They cover:
  - CEL truth tables for `&&`, `||`, `!` and the comparisons;
  - null and unknown semantics, the helpers, and parsing of every expression in rules.json;
  - `on_unknown`, composition and tier order;
  - the 13 hand values: Ana's 18 weeks of V and LR, phases, deloads, G 11 and slack 4; her week-6 card; the band edges of Tom, Karim and Lea; Tom's and Ana's paces after FT-1; Maya's ladder and LOW_SLACK; the verdicts of Raj, Mia, Rose and Karim; the red-team cases TST-095, 096, 103 and 104;
  - tamper tests that make INV-02, 05, 06, 11, 17, 19, 21 and 25 fire;
  - every MVP persona's result checked against `result.schema.json`, with a small test-only schema checker (a subset of JSON Schema, not a full validator library);
  - determinism.
- All **66** persona inputs of `spec/fixtures-input/` were generated twice: no crash, and the two outputs were byte-identical every time.
  - **MVP personas (47):** 25 plans, 13 fail-closed with options, 7 safety stops, 2 holds.
  - **Every MVP plan validated with zero repairs** (the parity property of 07 §5, TST-092), as far as these 47 inputs go.
- `tsc --noEmit` is clean. `src/` imports nothing from Node, and `tsc` compiles it to ES modules. **It has not been run in a browser.**

None of this is an independent check. The S-group invariants are only as right as this engine's reading of the spec until the oracle (TST-110…112) agrees.

## Not done yet (MVP rules or features that are missing or partial)

- **Adaptation (08):** events after the first plan (missed sessions, pain, illness, results, re-plans, the published window ADP-014, degraded completion FEA-043) are not processed. A re-plan input with `parent_plan` is accepted and INV-04 is checked, but no ADP rule runs. TST-105a/b, which are race-week re-plans, therefore fail closed with options.
- **Level tests (SES-012/024/025):** they depend on logged instances, so a day-0 plan never schedules one. The anchor field test of ONBOARD (SES-014) is scheduled. `level_tests_opt_out` has no effect yet.
- **Projection:** following 07 §2b, a day-0 plan keeps today's levels and start doses for every week. 13's per-Monday week rows (e.g. Ana's two key sessions from week 7) need weekly re-plans with a log.
- **DST-006** (race-effort segment in half-marathon long runs for time goals), **NUT-020** (race-day fuelling: `race_fuel_g_h` stays null), NUT-011/012 fuelling steps (start step only), FEA-038 interim field tests, SES-020 strength (Q-E17).
- **Presets:** only `method_default`. A preference for another preset is logged in the ledger (LOD-021). There is no `alternative_preset` option.
- **Repairs:** REP-002/005/006 need a re-run of S4–S7. They are treated as "cannot change anything", so such a plan goes to S9.
- **Messages:** results carry message ids from messages.md, with placeholders only for the prediction band. No text is rendered (that is the display layer's job).
- **Fired-rule log:** complete for engine-evaluated rules, partial for native stages.
- **Speed:** most calls take under 0.2 s. Some fail-closed marathon goals (R2, not MVP) take up to about 50 s, because every option candidate is a full nested run; MVP calls take at most about 8 s.
- **Marathon and ultra (R2/R3):** their rules load, and Ana's marathon plan reproduces 13 §3. Many marathon and ultra rules are text-only or not applied, so their results are not claimed.

## Spec questions

Every place where the spec was not precise enough is listed in `docs/questions.md` (Q-E1…Q-E26, with the default in force) and marked `// SPEC-QUESTION Q-En` in the code. Where the engine and a value of 13 may disagree, the reading is listed there too ("Readings for the oracle"); nothing was changed to match 13 by hand.

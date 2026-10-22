# CHANGELOG v5.1 → v5.2

22 Oct 2026, Engine session part A (`handoff/1-engine-part-A.md`). Goal: a spec from which the engine and an independent oracle can both be built (`docs/gap-analysis.md`). No web research was done; every new coaching choice is a design default, graded ALLEGED at most (memory only) or UNKNOWN. **Nothing has been executed by an engine**: "checks pass" below means the build and the two static checkers, nothing more.

> **In plain words.** The method is now written down completely enough to program. There is a fixed format for what the generator receives and returns, complete starting data for every example runner, exact rules for how the pieces fit together, a fixed order for choosing each week's sessions, size ladders for every hard session, a way to judge level tests from three quick questions, and machine versions of the 27 rules that were still only text. You approved the choices that change what a runner gets (§2).

## 1. Shared contract (engine ↔ oracle)

- **`spec/schema/`** (new): `common`, `input-profile`, `result`, `fixture-input` JSON Schemas (draft 2020-12) and a README with the normative conventions (units, rounding, blank/unknown/null encoding, canonical serialisation, plan id hash, goal race outside the week total, distance stop, load ordinals). The result is one of `plan`, `fail_closed` (options carry their validated plans), `gate_stop`, `hold`, `safe_state`. Every field an invariant reads is declared (checked).
- **`spec/fixtures-input/`** (new): 66 persona inputs (13 P1–P5 and variants, Tom, Ana, Lea, Raj, Mia, Karim, Rose, Ben, TST-084…089, TST-095…106, TST-050-P01…P33), inputs only, each value tagged `spec`, `derived` or `invented`, with a behaviour model for the weeks after day 0. Dropped (sources outside the repository): TST-075 and TST-120 room cases (see `docs/questions.md`).
- 13 §0: a week row = the week as published at its Monday under the `as_planned` behaviour model.

## 2. Owner decisions (22 Oct 2026)

All recommended answers were accepted; question 4 was extended.

| # | Decision | Where |
|---|---|---|
| 1 | Key session trains the largest weighted gap; two slots never the same ability; rotation through the preset list when nothing is missing; strides instead of a hard session in BASE | 02 §4 (CMP-007), 09 DST-002/018 |
| 2 | 0 key sessions while learning or returning, ≤ 1 in BASE/TAPER/MAINTAIN, 2 later only with ≥ 4 runs and within the hard-minutes budget; the long run counts as a hard day for spacing | 06 SES-004/006/007, `quality.non_key_runs_min` |
| 3 | Dose ladders (repeats lengthen, then one is added), step up only after a session rated as intended, repeat otherwise, start size in a lighter week | 06 §2c, SES-011/016, `ses.dose.*.steps`, `ses.target_rpe` |
| 4 | Level test once the session reached the test's size twice; three questions judge it; fail or no answer → retry after 3 weeks. **Plus: tests are optional** — a runner may turn them off or skip one; the level then comes from two full-size sessions logged as intended (SES-025) | 06 §3b, SES-012/013/024/025, `profile.level_tests_opt_out` |
| 5 | Fuelling practice from late BASE at 30 g/h, +15 g/h after two comfortable runs, step down at stomach ≥ 5/10 | 11 NUT-010…013, `fuel.step_g_h` = 15 |
| 6 | Finish goals stop at FUEL L2 | 02 CMP-008 (basis now design_default) |
| 7 | HM time goals: race effort at the end of every second SPECIFIC long run; finish goals keep easy long runs | 09 DST-006 |
| 8 | Hot race: 10 easy runs of ≤ 60 min in the warmest part of the day, counted only when logged hot | 11 NUT-040, `heat.acclim_days` = 10 |
| 9 | After 15 weeks of MAINTAIN: test, reminder, new block | 04 PHS-014 |
| 10 | Half marathon hard-minutes budget 15% | `tid.hard_share_max.HM`, `goal.family_tid` |
| 11 | Deload key session at its start size | 06 SES-016 |

## 3. Engine glue (gap/engine.md §7, decided by the session)

| Q | Decision | Where |
|---|---|---|
| Q1 | Every record carries derived `stage` and `scope`; event-type catalogue; unknown event types fail the build | 12 §3.5, build_rules.py |
| Q2 | Per-target composition `min(T0–T3 caps, max(T5 floors, min(T4–T6 caps, base)))`; ordinal targets most restrictive; PRIORITY = first per target | 12 §3.6 |
| Q3 | Fixpoint per stage, `engine.max_iterations` = 5, else ENGINE_NONCONVERGENT; regenerate/record_event queue for the next call; nested S3–S8 for options | 12 §3.7 |
| Q4 | Explicit **EngineState** input and output; table of stored vs recomputed state | 12 §3.8, schema |
| Q5 | Asked-and-blank = unknown; not asked = null (compares false); helpers return null; `has()` false on U; unanswered next-morning prompt handled by LOD-006, not ADP-052 | 12 §3.9 |
| Q6 | Fixes: INV-05/SAF-020 test `subkind`; `effort_rank('E5')` = E3 rank, hard days by E3/E4 only; SES-005 uses `weekday()`; FEA-013 is a floor; GEN-003 reads `plan.s8r_exhausted`; `adaptation_event` = any kind; `goal_edit` is an event kind. Also: INV-11 excludes the goal race; LOD-033 counts segment times; INV-17 uses `next_day_is_hard`; ADP-012/055 no longer read undeclared names; `progression` → `plan.progression` | 07, 10, 06, 03, 08, 05, 12 |
| Q7 | REP-001…006 as RULE lines + records (op `repair`, root `violation`); S8r procedure (earliest violation, lowest rank, ≤ `repair.max_passes`) | 07 §2c, §6.1 |
| Q8 | Machine registry: ```param block in parameters.md → `tools/build_parameters.py` → `parameters.json` (344 entries); `limit_direction` drives override MIN/MAX | 12 §3.11, parameters.md §16 |
| Q9 | Algorithms for `water_fill`, `place_in_order`, `dry_run_weeks_needed` (iteration), `decay`, `t0t3_limit`, new `choose_key_modules` | 12 §2b.4 |
| Q10 | Optional action fields table (build rejects others); exact semantics of `then`, `until`, `block_sessions`, `freeze`, `insert_phase`, `move_session`, `schedule_session`, `route`, `shorten_week` … | 12 §3.3b |
| Q11 | Local dates in the runner's time zone; round down to int s/m at once; canonical JSON; E dominates U unless absorbed | 12 §3.10, schema README |
| Q12 | A type for every path; element types of list paths; checker resolves comprehension fields and bare identifiers | 12 §2b.2/2b.2b |
| — | What the runner gets when generation fails, first plan vs re-plan | 12 §3.12 |

## 4. Weekly session choice (gap/prose-rules.md §4)

- 07 §2b: S7 in eight ordered sub-steps (count, long run, choose, place, dose, easy fill, extras, render); DST-018 moved T5.458 → **T4.458** inside the procedure; projection policy (one step ahead).
- 06 §2c: dose ladders for the 17 MVP modules; target session RPE; module switch. 06 §3b: level-test sessions and how they are judged (new **SES-024**, **SES-025**).
- 04 §1: "BASE (late)", "BUILD (last third)" defined.
- 02 §4: the CMP-007 procedure; expected race duration defined.
- New paths (≈ 70) and parameters (§15 of parameters.md). New messages: MSG-PHS-MAINT-LIMIT, MSG-SES-STRIDES-SLOT, MSG-SES-TEST-Q, MSG-SES-TEST-AGAIN, MSG-SES-TEST-SKIP, MSG-SES-LEVEL-FROM-TRAINING, MSG-SES-STEP, MSG-SES-HOLD-DOSE, MSG-NUT-THIRST, reason ENGINE_NONCONVERGENT.
- **MVP tags** (§4.9): PHS-015, DST-007, SES-019 → `spec`; DST-017, DST-018, SES-020/021/022, NUT-021/030/040, FEA-026 → MVP with records; REP-001…006, SES-024, SES-025 new MVP.

## 5. The 27 prose rules (B-4)

All 27 now have machine records except the three retagged `spec` (PHS-015, DST-007, SES-019 stay text-only, not MVP). EASY: PHS-013, SES-013, SES-017 (static), DST-001, DST-005, NUT-012. Design choices (owner-approved, §2): CMP-007 (procedure), CMP-008, PHS-014, SES-004, SES-006, SES-007, SES-010, SES-011, SES-012, SES-015, SES-016, SES-018, DST-002, DST-004, DST-006, NUT-010, NUT-011, NUT-013. Each choice is marked in its evidence field "v5.2 … ALLEGED (from memory)" or "design choice, UNKNOWN".

## 6. Open items of v5.1 (CHANGELOG-v5.1 §5–6)

- **(a) Ana's phases** (13 §3, R-07): rewritten to 04 §3 with the dry-run G = 11 (the closed form said 10; with floor() the long run is 178 min after 8 steps): ONBOARD 1–2 · BASE 3–6 · BUILD 7 · SPECIFIC 8–15 · TAPER 16–18; deloads 4, 8, 12. Every V and LR value is unchanged (the oracle fixture values of 14 §10e still hold); key sessions, fuelling steps (FUEL L1 wk 6, L2 wk 8, was wk 10), TOL L4 (wk 11), the THR L1 test (wk 11) and the week-6 card were recomputed by script (`docs/scripts/recompute_13_ana_v5_2.py`, not for the oracle). Week 6 is now a BASE week with strides, so the v5.1 card's threshold session is gone. CHANGELOG-v5.1 §5 had predicted deloads 5, 9, 13 from the closed-form G; the dry run moves them back to 4, 8, 12.
- **(b) Slack**: ONBOARD weeks are growth weeks inside BASE. 03 §4 slack = W − (rtr + max(base, onboard − rtr) + build + specific + taper); 04 §3 step 5 B = max(base_needed, onboard_needed − rtr_needed). Ana: slack 4 (13 said 5, the v5 03 formula 3); Maya unchanged (0).
- **FEA-023**: `val.conformance_tol_pct / unit.pct`.

## 7. Tools and counts

`build_rules.py`: stage/scope, event catalogue, optional-field schema, MVP tags, version v5.2. `build_parameters.py` (new). `check_rules_v5.py` and `check_messages_v5.py` extended (14 TST-121 note). **Counts:** 301 rules (248 formal, 14 procedure, 7 static, 32 text-only), 31 invariants, 269 MVP rules, none text-only. Basis: design_default 213, evidence 67, eng 16, convention 5 (CMP-008 moved from evidence to design_default). **Results:** `build_rules.py` build OK; `build_parameters.py` build OK; `check_rules_v5.py` ALL CHECKS PASS; `check_messages_v5.py` ALL MESSAGE CHECKS PASS.

## 8. Not done (see `docs/questions.md`)

Engine code (part B), the oracle and expected outputs (Oracle session), the TST-075/120 fixtures, DST-007 and the other marathon/ultra text-only rules, PAR-Q+ text (B-1), regulatory and clinical reviews (B-2, B-3).

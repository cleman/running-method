# Test report: engine against the oracle

*Engine session, 28 October 2026. Spec v5.2. Everything below was actually run in this session; nothing more is
claimed. Nothing in `oracle/` was changed.*

## In plain words

The independent tests (the "oracle", written by another session that never saw the engine) were run against the
engine. At the start of this work 71 of them failed. After fixing the engine, **1 922 of 1 958 pass and 36 fail**.
Every one of the 36 is explained:

- **30** come from disagreements about what the spec means. I wrote each one up for you to decide (`disagreements.md`).
- **6** are things the engine does not do yet (below, "Not covered").

The weekly "re-plan every Monday" flow now works end to end for a runner who does everything as planned. That covers
the two MVP plans (10K and half marathon), Maya's first 5K, Tom's 10K, and the two marathons. Ultras do not work
(release R3).

None of this is validated on real runners. These are checks of the engine against the spec and against a second
reading of the spec, not of training outcomes.

## How it was run

- Engine unit tests: `node --test test/*.test.ts` in `engine/`.
- Oracle: from `oracle/`, `ORACLE_ENGINE=engine/node-entry.ts npx vitest run tests/<suite>`. `engine/node-entry.ts`
  is a small adapter that loads `spec/rules.json` and `spec/parameters.json` and calls the engine.
- All 66 persona inputs of `spec/fixtures-input/`, each run twice.

## Results

| Suite | What it checks | Before (start of this work) | Now |
|---|---|---|---|
| Engine unit tests | the engine's own tests (13 hand values, tamper tests, schema, determinism) | 43 / 43 | **43 / 43** |
| 00-contract | result shape and schema | 76 / 76 | **76 / 76** |
| 01-params | parameter registry | 1 / 1 | **1 / 1** |
| 02-oracle-arithmetic | the oracle's own arithmetic | 8 / 8 | **8 / 8** |
| 03-checker-selftest | the oracle's own invariant checker | 14 / 14 | **14 / 14** |
| 10-day0-results | every persona's day-0 result: kind, verdict, reasons, all invariants | 354 / 384 | **355 / 384** |
| 11-hand-values | hand-computed values of 13 and 14 | 84 / 88 | **84 / 88** |
| 12-mvp-plans | the two MVP plans, day 0 and as published each Monday | 34 / 45 | **44 / 45** |
| 13-metamorphic | "if the input changes like this, the output must change like that" | 884 / 910 | **908 / 910** |
| 14-grid | a grid of generated inputs | 432 / 432 | **432 / 432** |
| **Oracle total** | | **1 887 / 1 958** | **1 922 / 1 958** |

Also run:

- All 66 spec inputs, each twice: byte-identical output, no crash. Results: 30 plans, 27 fail-closed with options,
  7 safety stops, 2 holds (all releases). No plan needed a repair pass.
- `tsc --noEmit`: clean.

## The 36 failures, one by one

| Failing test(s) | Count | Why | Where |
|---|---|---|---|
| TST-041 invariants on *options* (ben, mia, rose, p09, p14, p25, tst097; INV-21) | 7 | Oracle checks options against the old availability | D1 |
| TST-041 on options (p07, p17, p28, p29, p31; INV-25) | 5 | Oracle checks options against the original goal's long run | D2 |
| TST-041 on options (lea INV-13; p02, p16 INV-16) | 3 | Option judged with the main plan's long-run hold / profile | D3 |
| TST-041 p01, p20 (INV-21, race on a Sunday) | 2 | Goal race on a non-running day | D4 |
| TST-041 tst102 (INV-02/03 on an option) | 1 | A logged race in the 30-day longest run (LOD-012) | D5 |
| 12: HM day-0 L_req 6 492 vs 6 491 | 1 | Half-marathon distance in metres | D6 |
| 11: ana.stop | 1 | Distance stop rounded to 100 m | D7 |
| 10 + 11: Lea is "stretch" (kind, verdict) | 2 | 13's example vs FEA-021 | D8 |
| 11: mia.first_option | 1 | One-change option fails FEA-041 | D9 |
| 10: tst050-p04 kind | 1 | A 15-year-old: safety stop before any option | D10 |
| 10: tst084, tst085 verdict (2) and TST-041 on options (2) (50K) | 4 | Verdict of a plan that failed its checks (D11); options vs original demand (D2) | D11, D2 |
| 13: M-4 for raj, tst089 | 2 | Compares a plan with "no plan" | D12 |
| 10: p5-ultra-100k, tom-100k-100wk (kind; tom TST-041) | 3 | Ultras not built (R3) | Not covered |
| 10: tst050-p06 kind | 1 | Pregnancy maintenance mode not built | Not covered |
| 10 + 11: tst105b | 2 | Degraded completion branch (b), race as run-walk | Not covered |

(Lea's TST-041 failure is counted with D3. Tom-100K's TST-041 failure is an option INV-25 like D2, counted with the
ultra row.)

## Open disagreements

13 entries, D1–D13, in `disagreements.md`. Short version:

- D1–D3: the oracle should check each **option** with the option's own availability, goal and state.
- D4: the goal race may fall on a non-running day.
- D5: a logged race counts in the 30-day longest run, capped (LOD-012).
- D6, D7: two rounding questions (half-marathon metres; distance stop to 100 m).
- D8, D9: two worked examples of 13 (Lea, Mia) that conflict with FEA-021 / FEA-041.
- D10: a minor's safety stop comes before any option.
- D11: a plan that fails its safety checks needs a reason code (proposed: ENGINE_NONCONVERGENT).
- D12: one metamorphic test compares a plan with "no plan".
- D13: weekly re-plans show "tight" near every race. Spec change proposed.

## What was fixed in the engine (found by the oracle)

1. **Order of the log:** output changed when log entries arrived in another order. Now sorted (GEN-004, M-7).
2. **Dose steps (SES-011):** key sessions now step up from the log (3 × 5 → 3 × 6 → 3 × 7 min …).
3. **Level tests (SES-012, SES-024, CMP-002):** THR, VO2 and DUR tests are scheduled once training shows readiness,
   judged from the logged answers, and set the level. Durability is proven only by its long-run test (06 §3). A pass
   while a prerequisite is missing is kept and applied later, so it is not retested every week.
4. **VO2 L1 from strides:** strides twice a week for 4 weeks (06 §3).
5. **Run-walk:** a runner who explicitly said "no run-walk" was put on run-walk. Fixed.
6. **Start and return ladders (SAF-082/083):** the ladder now moves up a step after 3 clean sessions and back after
   an unclean one, across weekly re-plans. It is never squeezed to fit a short horizon.
7. **Degraded completion (FEA-043 a):** a re-plan that fails only on growth, with the long run already reached,
   keeps the race as a finish goal.
8. **Re-plans:** session ids restart in each plan version, so logged sessions are matched by id *and* date. Taper
   and race-week re-plans no longer fail. FEA-021 is not a gate in H1.
9. **Smaller fixes:** taper "touch" room, exact progression-run shares, half-minute remainders, FUEL level after the
   DUR test.

New spec readings used for these fixes: Q-E27 to Q-E32 in `questions.md`, marked `// SPEC-QUESTION` in the code.

## Not covered (the engine does not do this yet, or it was not tested)

**Not built, so tests fail or the engine fails safe:**

- **Ultras (50K, 100K; release R3):** no plan is produced. P5 and Tom-100K fail closed; 50K plans fail their own
  checks.
- **Pregnancy maintenance mode (SAF-051):** after the clearance attestation, the engine keeps the pause instead of
  a maintenance plan. Safe, but not the spec (TST-050-P06).
- **Degraded completion (b), LADDER_RUNWALK:** a 5K on the start ladder whose race week comes early should be run as
  run-walk (TST-105b). It fails closed.
- **Adaptation events (chapter 08):** missed sessions, pain, illness, new race results, goal edits, the published
  window (ADP-014). The weekly replays only cover a runner who logs everything as planned. **No test in this run
  exercised a missed week, pain or illness end to end.**
- **Level tests, partly:** MSP tests and the HAB L2 benchmark are not scheduled. After a failed test the dose is not
  frozen (SES-013). Turning tests off (SES-025) has no effect. Levels never decay (CMP-003).
- Race-day fuelling (NUT-020), the race-effort part of half-marathon long runs (DST-006), interim field tests
  (FEA-038), strength sessions (Q-E17), presets other than `method_default`.

**Not checked by anyone yet:**

- The oracle's own weekly expectations stop at week 7 (10K) and week 6 (HM). Later weeks, and the persona plans in
  `persona-plans/`, were checked only by eye against the spec.
- PAR-Q+ items are still placeholders (blocker B-1). Regulatory reading (B-2) and clinical sign-off (B-3) are open.
  **No public release.**

## Things to look at with a runner's eye (from the persona plans)

- **"Tight" every week near the race** (D13).
- **Long key sessions:** Tom's time trial and threshold sessions last up to 67 min, because weekly minutes his easy
  days cannot hold go into the key session's cool-down (Q-E23). This is correct by the current reading but odd to
  read. Worth a council look: cap the carry, or add an easy run instead.
- **Durability tests for an experienced runner:** P4 already runs 3-hour long runs, yet gets durability tests for
  levels 1, 2, 3 and 4 in successive long runs. This is a direct result of v5.2 (durability is proven only by a
  test). Proposal for the council: let logged long runs that were "felt as intended" count up to the level below the
  longest one, and test only the top level.

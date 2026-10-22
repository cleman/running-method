# Spec questions found while writing the oracle (v5.2)

Each item names where the spec is too vague or contradicts itself for a check, what the oracle **assumed**,
and where the assumption is used (`oq` in `src/expected/*.ts`, notes in `src/invariants.ts` /
`src/metamorphic.ts`). Where the oracle encoded two readings, a test passes on either and the report
(`reports/outcomes-*.json`) says which one the engine took. **Nothing here changes `spec/`.** For the owner:
the questions marked **decision** change what a runner gets; the others are technical and can follow the
recommended reading.

## High

### OQ-01 — Level weeks re-checked at every weekly re-plan turn time-goal plans into failures (decision)
- **Spec:** FEA-021 (K_key > W − taper − P0 → LEVELS_UNREACHABLE) runs at S3 of every call (12 §3.7), and a
  re-plan counts only "what is left" (03 §4, F-21). K_key is computed from the levels held today; it is never
  reduced by the key-session weeks already trained.
- **Effect:** a 10K time goal needs THR 2 and VO2 2 (8 key-session weeks each). Plan A
  (`plans/mvp-10k-time-12wk.md`) is feasible on day 0 with slack 5, but at the week-4 re-plan only 7 such weeks
  are left → infeasible; the long run demand is not yet met, so FEA-043 offers no degraded completion → the plan
  **fails closed** in week 4. Plan B (half marathon) becomes a degraded **finish** goal in week 6. Almost every
  12–14-week time goal would do the same.
- **Assumed:** both branches are encoded — `literal` (fail closed / degraded) and `no-recheck` (the plan
  continues). **Recommended:** check FEA-021 at first generation and on goal edits only, or count the weeks
  already spent training the node toward its K.

### OQ-02 — Rounding of band edges (technical)
- README §2: every duration is "rounded down to an integer second at once". 13 rounds band edges to the
  nearest second (Tom 47:24 = 2843.57 s, Karim 52:52 = 3171.67 s, Lea 52:26 = 3145.8 s). Floor-first gives 2843 /
  3171 / 3145.
- **Assumed:** ±1–2 s tolerance on every band value; 13's value is the main expectation, the floor value the
  alternative. **Recommended:** say in 03 §3 whether P_race is floored before the edges are computed.

### OQ-03 — Is a claims-based L30_eff rounded to whole minutes? (technical, changes 14 §10e values)
- GEN-011: L30_eff = 0.9 × claimed L30. Ana: 0.9 × 95 min = 85.5 min = 5130 s. 13 writes 85 and builds the long-run
  chain on it: 93, 102, 112, 84, 123, 135, 148, 111, **162, 178**, 180. In seconds with the 60-s rounding of 05 §3 the
  chain is 94, 103, 113, 84, 124, 136, 149, 111, **163, 179**, 180. 14 §10e makes 162 and 178 oracle fixture values
  (R-05 "corrected" 163 → 162).
- **Assumed:** 13's chain is the expectation, the seconds chain the alternative (`ana.wk*.LR`). Same for Tom's
  L30_eff (4050 s vs 4020 s). **Recommended:** state in GEN-011 whether L30_eff from claims is rounded down to
  `load.round_down_s`.

### OQ-08 — Karim's "shorter distance 5K" option cannot pass (spec conflict)
- 13 §7b lists shorter_distance 5K among Karim's validated options. 03 §6 keeps the goal type (time) at the shorter
  distance, and a 5K time goal requires VO2 L2 (02 §5) → K_key = 2 × 4 = 8 > 6 → infeasible → FEA-041 drops it.
- **Assumed:** the option is absent (13's version is the alternative). **Recommended:** correct 13 §7b, or say that
  shorter_distance falls back to a finish goal.

## Medium

### OQ-04 — Second, older estimated anchor and B_slow (Tom after FT-1)
03 §3 widens B_slow "if any anchor is estimated". After FT-1 the older estimated 10K 52:00 is still one of Tom's two
anchors; read literally, B_slow = 10.5 % (slow edge ≈ 55:37), while 13 says "not widened" (53:51). Assumed 13.
Recommended: "if the anchor setting the point is estimated".

### OQ-05 — Metamorphic relations: alignment and readings
- Which list governs (07 M-1…M-8 or 14 TST-042a–h): both are encoded, each restricted to one horizon class
  (docs/questions.md Q3).
- M-1, M-8, TST-042g compare weeks by (`load_kind`, `load_ordinal`) for M-1/M-8 and by index for 042g; the spec
  gives no alignment.
- M-4 "slower logged easy pace": read as same durations, 10 % less distance.
- TST-042b: sessions have no identity across two plans; the weaker form "no week's volume or longest session rises"
  is checked.
- TST-042h (random event streams + 8 quiet weeks) is not implemented in this version.

### OQ-09 — Do strength sessions count in `planned_time_s`, V and available minutes?
INV-11 sums all sessions; SES-M-014 strength sessions are sessions with a duration; LOD-003 and the tables of 13
treat V as running time. Assumed: V = running time only (`runVolume`), and INV-11 is checked literally on
`planned_time_s`. Plan B's 360 available minutes leave room either way.

### OQ-10 — Distance logged for an `as_planned` tick
The behaviour model says "ticked done as planned" but not which distance is logged. The harness logs
duration ÷ the runner's median logged pace (else claimed weekly time ÷ distance; ladder sessions: none). 13 §3
uses "her logged 6:30" for Ana, which this reproduces only approximately (claims give 6:34).

### OQ-11 — Ben's change_availability amount
Ben is restated from a lost room file. From his invented inputs the oracle gets V_req = 228.4 min (long-run
share term 6852 s / 0.50) against 190 available → +38.4 → **39 min** (rounded up), not 13's "60". Assumed 39; 38 and
60 accepted as alternatives. Recommended: say whether the extra minutes are rounded up, and drop "60" from 13.

### OQ-13 — How ONBOARD appears in `plan.phases`
04 §3 v5.2 puts ONBOARD weeks inside BASE (B counts them); 13 prints "ONBOARD 1–2 · BASE 3–6". Assumed: two phase
entries (ONBOARD 1+2, BASE 3+4); one BASE 1+6 entry accepted as the alternative.

### OQ-14 — ONBOARD long run "≤ L30_eff" vs 13
04 §1 ONBOARD row: long run ≤ L30_eff. 13 §3 Ana week 1: 93 = 1.10 × 85 (> L30_eff); 13 §2 Tom: "LR 67 → 73". The
oracle keeps 13's Ana values and does not check Tom's ONBOARD long runs. Recommended: one rule in 04 §1.

### OQ-15 — DUR level tests on long runs
06 §3b: the DUR test is "the week's long run when its planned duration reaches 60, 90, 135, 180"; SES-012 schedules
a test only after two logged instances at that size, and allows one test per week. 13 Ana week 2 holds both FT-1
and the DUR L2 test, right after the first long run ≥ 90. Assumed: SES-012 as written (two logged instances; pre-plan
logged long runs count when their `module_id` is SES-M-003), and the long-run test does not block another test.

### OQ-16 — Race week content
05 §7 "race plus easy runs and strides; no long run", V = 0.5 × V_ref without the race. Assumed: the other run days
each get an equal easy run (3 + race = 4 runs) and no sharpener.

### OQ-17 — Which key slot gets which day
`place_in_order` picks the set of key days; it does not say which slot goes on which day. Assumed: slots in rank
order on the chosen days in date order (plan B: threshold Tuesday, progression run Friday).

### OQ-21 — The strides key slot in the result
CMP-007's strides fallback "becomes strides on an easy run". Not stated: its `module_id` (SES-M-006 or SES-M-001 with
E5 segments), whether `is_key` is true and whether it counts in `key_session_count`, and its day. The oracle checks
only that the week has the expected number of runs with strides and no extra hard session.

### OQ-22 — Dose after a deload
SES-011: "after a deload or taper the module resumes at its last completed dose". Assumed (as 13 Ana week 9): the
next instance steps up from the last **non-deload** instance; it does not repeat it.

### OQ-23 — H3 plan without a BASE phase
04 §3 gives B = max(base_needed, onboard − rtr) = 0 for a runner already at the growth targets (plan B), while 04 §2
calls H3 "full sequence". Assumed: no BASE phase; fuelling practice then starts in week 1 ("late BASE or a later
phase").

### OQ-24 — Levels in the day-0 projection
07 §2b says only "an increase only appears through a re-plan". Assumed: no level (log threshold or test) is
projected into future weeks of the day-0 plan, so module choice in the day-0 plan uses the day-0 levels.

## Low

- **OQ-06** Pace rounding: 03 §3b "rounded to pace.round_s" gives no direction; nearest 5 s reproduces every value of
  13 (Tom 5:20–5:35, Ana 6:05–6:25 and 8:25–10:50). Tolerance 5 s.
- **OQ-07** TOL from claims: 13 §3 says Ana's claim cap is `claim.l30_cap_by_tol[TOL 3]` = 120; the thresholds give TOL 2
  (210 < 240 min) and CMP-004 caps a self-reported TOL at 2 → 90. No effect on Ana (85 < 90).
- **OQ-12** Event payloads are "object": the M-8 relation sends `missed_session` with `{session_id}`.
- **OQ-18** TST-050-P04 (15-year-old, 10K): the kind of the result (fail_closed with a shorter-distance option, or a
  plan on the capped distance) is not fixed; assumed fail_closed.
- **OQ-19** TST-066 (Couch-to-5K conformance) stays report-only until the C25K table is encoded; its fixture is
  `fixtures/tst066-c25k.json`.
- **OQ-20** `week.hard_time_s` and `e3_touches`: the goal race is outside the week's training totals for
  `planned_time_s` (README §6); assumed the same for these two.
- **OQ-25** INV-30's literal assertion cannot be evaluated on a minor's session without a planned distance
  (ladder or effort-only); reported `not_checked`.
- **OQ-26** Inputs `profile.training_age_years` take band values only (0, 0.15, 0.6, 2, 5, 12); the oracle's grid
  "novice" uses 0.15.

## Invariants the oracle cannot evaluate from one result

| INV | Why | What covers it instead |
|---|---|---|
| 04 | needs the parent plan and an event | metamorphic M-8 / TST-042a |
| 10, 12, 24, 26 | static lints on rules, registry and messages | `spec/tools` checkers |
| 14 | needs the engine's denominator entries | partly: INV-01/02 use only entries the oracle itself judges measured and plausible |
| 20 | needs levels by date (generator state) | the MVP plan expectations (module choice) |
| 22 | needs the GoalEditAttempt audit log | — |
| 23 | flag only; km ranges vs a time field, no tier (docs/questions.md Q6) | — |
| 27 | needs the T0–T3 limit of each week | reported as a warning |

## Fixture review (docs/questions.md Q2)

The oracle used the restated personas as given. Spot checks only (not a full second review): Ben's "60 min" does not
follow from his invented inputs (OQ-11); TST-050-P05's goal is `base`, which is fine because the gate stops first;
Raj's goal type is assumed `finish` by the fixture. A full review of the `invented` tags is still open.

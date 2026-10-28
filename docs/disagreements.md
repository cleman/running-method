# Engine ↔ oracle disagreements

*Written by the engine session after running the oracle (`oracle/`) against the engine (`engine/`), October 2026.
Nothing in `oracle/` was changed. Each entry says which test, what the engine does, what the oracle expects, how I
read the spec, and what I recommend. **You decide**, with the council session or the Oracle session.*

Status: **13 open** (D1–D13). The engine-side gaps that are *not* disagreements (things the engine simply does not do
yet) are listed in `test-report.md`, section "Not covered".

How to read a recommendation:

- **Oracle** means the oracle's test should change, to be done by the Oracle session.
- **Engine** means the engine should change, to be done by the engine session.
- **Spec** means the spec is unclear and needs a decision, written into spec v5.3.

---

## D1. Options are checked against the runner's *old* availability

- **Tests:** `10-day0-results` → "holds every invariant (TST-041)" for ben-availability, mia-2-days, rose,
  tst050-p09, tst050-p14, tst050-p25, tst097-skips-pain-tap (and part of p02, p16). About 170 single violations, all
  INV-21 on an *option*.
- **Engine:** an option such as "add a running day" (`change_availability`) or "add a day and move the date" proposes
  a new availability. The engine builds and validates that option's plan with the availability the option proposes.
- **Oracle:** checks every option's plan against the runner's *current* days and minutes, so a Thursday run or a
  third run a week is "not an available day" or "more runs than allowed".
- **My reading:** 07 §6 and FEA-040 describe options as plans the runner could accept. An option that adds a day
  can never pass a check on the old days. FEA-041 says each shown option must be a valid plan, and it can only be
  valid under its own changes.
- **Recommendation:** **Oracle.** Check each option's plan against the profile changed by that option's `changes`
  (new days, minutes, date). Keep the check strict for everything the option does not change.

## D2. Options are checked against the *original goal's* long-run demand

- **Tests:** same TST-041 tests (ben, tst097, p07, p17, p28, p29, p31, tst084, tst085, tom): INV-25 "peak long run <
  L_req" on the `base_plan` and `shorter_distance` options.
- **Engine:** the base plan has no race, and a shorter distance has a shorter long-run demand. Each option's plan is
  built and checked against **its own** goal's demand.
- **Oracle:** compares the option's longest run with the original goal's L_req (for example 10 800 s for a
  marathon).
- **My reading:** INV-25 is about "the goal race's long-run demand". A base plan has no goal race, and a shorter
  distance has its own demand (03 §2).
- **Recommendation:** **Oracle.** Apply INV-25 to an option with that option's goal. Skip it for `base_plan`.

## D3. Options are judged with the main plan's long-run hold and progression profile

- **Tests:** TST-041 for lea-goal-switch (INV-13 on the `base_plan` option) and tst050-p02 / p16 (INV-16 on
  `move_date` and `shorter_distance` options).
- **Engine:** (a) Lea's main goal (switching from marathon to 10K) carries her long run over under ADP-080 (L_hold
  = 132 min). Her base-plan option is not a goal switch, so its hold is her measured 160-min long run. (b) The slow
  progression profile ends after its probation weeks (05 §2, Q-E18); later weeks may grow by the standard 15 %.
- **Oracle:** uses the main result's L_hold (7 920 s) and the day-0 profile (slow, +10 %) for every week of every
  option.
- **My reading:** each option is a plan of its own, with the state that plan would have.
- **Recommendation:** **Oracle** for (a). Read L_hold from the option's own view, not the main goal's carry-over.
  **Spec** for (b): confirm Q-E18, "the slow profile ends after the probation weeks also inside a plan". If
  confirmed, the oracle reads the profile per week.

## D4. The goal race on a day that is not a running day

- **Tests:** TST-041 for tst050-p01 and tst050-p20: "w10-3 on Sun, not an available day" (INV-21).
- **Engine:** the race is on its race date, which the organiser fixes, even when the runner does not normally run
  on that weekday (Q-E22).
- **Oracle:** INV-21 applies to every session, including the goal race.
- **My reading:** 05 SES-005 is about placing *training* sessions. The race date is an input, not a placement.
- **Recommendation:** **Spec** (v5.3): INV-21 exempts the goal race. Until then, **Oracle**: skip `is_goal_race`
  sessions in INV-21.

## D5. Does a logged race count in "longest run of the last 30 days"?

- **Tests:** TST-041 for tst102-weekly-goal-switch (INV-02 and INV-03 on the `move_date` option).
- **Engine:** the runner raced 1 h 55 on 1 Nov. LOD-012 counts a race in L30, capped at 1.10 × the longest run
  before it (1.10 × 85 = 93.5 min). So the next long run may be up to 1.10 × 93.5 = 102 min. The engine plans 102 min
  (6 120 s).
- **Oracle:** ignores the race, so l30_time = 85 min and the cap is 93.5 min.
- **My reading:** 05 LOD-012 explicitly covers races in the L30 window ("a race counts up to spike.warn_ratio × the
  pre-race maximum").
- **Recommendation:** **Oracle:** apply LOD-012's capped race value in `l30_time`.

## D6. Half-marathon distance: 21 097.5 m or 21 097 m

- **Test:** `12-mvp-plans` → mvp-hm-time-14wk day-0 feasibility: L_req 6 492 s ≠ 6 491 s.
- **Engine:** the half marathon is 21 097.5 m (half of 42 195 m), so 21 097.5 / 1.30 / 2.5 = 6 491.5 s, rounded to
  6 492 s.
- **Oracle:** 21 097 m, giving 6 491 s.
- **My reading:** the spec never states the half's distance in metres. The official distance is 21.0975 km.
- **Recommendation:** **Spec:** write the race distances in metres in `parameters.md` (proposed: HM 21 097.5).
  The difference is half a second either way.

## D7. Ana's distance stop: 30 100 m or 30 139 m

- **Test:** `11-hand-values` → ana.stop.
- **Engine:** 30 100 m. The distance stop is rounded down to 100 m, as 13 §3 shows it ("30.1 km").
- **Oracle:** 30 139 m (42 195 / 1.40, not rounded).
- **My reading:** 13 §3 prints "30.1 km". `load.round_down_m` (100 m) is the spec's rounding for planned distances.
- **Recommendation:** **Spec:** say whether `distance_stop_m` is rounded down to 100 m. I recommend yes, because the
  runner sees "30.1 km".

## D8. Lea (TST-122): "stretch" in 13, "infeasible" by FEA-021

- **Tests:** `10-day0-results` → lea is a plan (stretch); `11-hand-values` → lea.verdict.
- **Engine:** infeasible. Reasons: LEVELS_UNREACHABLE, LOW_SLACK, TARGET_IN_FAST_BAND. A 10K time goal needs
  threshold level 2 and VO2 level 2 (8 weeks of key sessions each). Lea has 6 weeks, and her fixture holds no
  evidence of either level (no tests, no engine state).
- **Oracle:** "stretch" (13 §7a).
- **My reading:** the worked example in 13 does not apply FEA-021. The spec contradicts itself here (already listed
  in `questions.md`, "Readings for the oracle").
- **Recommendation:** **Spec** decision, either way:
  - (a) A goal switch inside a season carries over the levels the previous plan was building (ADP-080), so 13
    stays right.
  - (b) 13 §7a is corrected to "infeasible" with the options.

  I lean to (a) for real runners, but it needs a rule.

## D9. Mia: first option "add a day" alone, or "add a day and move the date"

- **Test:** `11-hand-values` → mia.first_option.
- **Engine:** "add a day + move date". With the third day added at the same date, the plan still fails
  CURRENT_STATE_SHORT, so FEA-041 drops the single change and the combined option ranks first.
- **Oracle:** "add a day" (`change_availability`) first (13 §7a).
- **My reading:** 13 §7a does not check whether the one-change option passes on its own. The engine follows FEA-041:
  an option whose plan fails is never shown.
- **Recommendation:** **Spec / Oracle:** re-compute Mia's example with FEA-041. If her fixture should pass with one
  extra day, the restated fixture (invented values, Q2) needs a longer current long run.

## D10. A 15-year-old asking for a 10K (tst050-p04)

- **Test:** `10-day0-results` → p04 is fail_closed (assumed, OQ-18).
- **Engine:** gate stop: running is paused until a guardian attests the referral (SAF-042, under 16). The distance
  check (SAF-043, MINOR_DISTANCE) only comes after the gate.
- **Oracle:** fail_closed with a shorter-distance option (its own assumption, OQ-18).
- **My reading:** SAF-042 has priority T1, before any feasibility. Without the guardian's attestation no plan or
  option may be shown.
- **Recommendation:** **Oracle:** expect `gate_stop` while MSG-SAF-011 is not attested. Add a second fixture *with*
  the attestation to test the MINOR_DISTANCE → shorter-distance path.

## D11. What verdict a result reports when its plan failed validation

- **Tests:** `10-day0-results` → "reasons … and the verdict follows them (FEA-036)" for tst084-fatou and
  tst085-masters-67-50k.
- **Engine:** these 50K plans fail validation after the repair passes (GEN-003, s8r exhausted). The engine reports
  `infeasible` with an empty reason list.
- **Oracle:** expects the verdict to follow the reasons (no reasons, so "feasible").
- **My reading:** GEN-003 fails closed. Saying "feasible" next to no plan would mislead the runner. But an infeasible
  verdict with no reason breaks FEA-036.
- **Recommendation:** **Spec:** add a reason code for "a plan was built but failed its safety checks" (messages.md
  already has ENGINE_NONCONVERGENT: "We could not build a plan we are sure is safe"). The engine would then report
  infeasible with ENGINE_NONCONVERGENT. Both are 50K (release R3).

## D12. A slower logged pace turns a 4-week half into "infeasible" (metamorphic M-4)

- **Tests:** `13-metamorphic` → M-4 for raj-hm-4wk and tst089-hm-4wk-fever: "peak long run shortened 6 000 → 0".
- **Engine:** with the same durations but 10 % shorter distances, the runner's easy pace is slower. The half's
  long-run demand rises from 106 to 118 min, beyond what 4 weeks can reach (CURRENT_STATE_SHORT), so there is no
  plan.
- **Oracle:** M-4 says a slower pace never shortens any long-run target. It compares the plan's peak (100 min) with
  "no plan" (0).
- **My reading:** the engine keeps the relation's intent: L_req got longer, not shorter. The test compares against a
  missing plan.
- **Recommendation:** **Oracle:** when the transformed input has no plan, check L_req only (it grew), not the peak
  long run.

## D13. Weekly re-plans turn "feasible" into "stretch (LOW_SLACK)" near the race

- **Tests:** none fail on it, but it shows in every persona plan (`persona-plans/`). From about 4–6 weeks before the
  race, the weekly outlook reads "possible but tight: little spare time", though nothing went wrong.
- **Engine:** each re-plan recomputes slack = weeks left − weeks still needed. Near the end of a full plan, slack is
  naturally small.
- **Oracle:** does not tabulate these weeks (its OQ-01 covers the related level re-check).
- **My reading:** LOW_SLACK is meant to warn at plan creation that missed weeks cannot be made up (messages.md: "Your
  plan fits with {slack} spare week(s)"). Shown weekly to an on-track runner, it is a needless worry.
- **Recommendation:** **Spec:** at a weekly re-plan, show LOW_SLACK only when slack dropped below the day-0 slack
  (that is, the runner lost weeks), not because the race is near.

---

## Resolved in this session in the oracle's favour (engine changed)

These were engine errors the oracle found. They are listed so the Oracle session knows they are fixed, not
disputed.

| Oracle test | Engine fix |
|---|---|
| M-7 (13-metamorphic): output changed when log entries arrived in another order | log entries and events are sorted by date and id before use |
| M-2b: one more day made two plans fail closed | the taper "touch" session borrows minutes from other easy runs when its day is too short |
| MVP 10K/HM weekly plans: dose did not step up | SES-011 dose steps from the log |
| MVP 10K/HM: no level tests; threshold/durability never reached; weekly re-plans failed closed | SES-012/024 and CMP-002 level tests; DUR attained by its long-run test only (06 §3) |
| 10K replay: key sessions vanished in week 5 | "run-walk preference set explicitly" now means preference = yes *and* explicit (a runner who explicitly said no was put on run-walk) |
| HM replay week 6: fail closed instead of degraded completion | FEA-043 (a) degraded completion |
| HM: progression run E3 part 7 min instead of 7.5 | exact dose shares (no rounding stated) |
| tst050-p08 (race in 2 weeks): fail closed | FEA-021 is not a gate in H1 (FEA-023) |
| Fuelled long run before DUR L1 (HM day-0 weeks 1–13) | Q-E31 reading, same as the oracle's (02 "scheduling vs attaining") |

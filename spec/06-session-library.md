# 06 — Session library (v5.2; v1 author C, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria 10 (reusable modules with goal, prerequisites, dose, progression and exit test), 4 (every competence level trainable and testable), 12 (plain wording). Rule range SES-001…199, priorities T*.300–349. Module IDs SES-M-001…. Interfaces: called by 07 S7 through CMP-007; must satisfy CMP-CHK-3 (02 §6).

> **In plain words.** Every run in your plan comes from a small library of session types: easy runs, run-walk, long runs, short fast "strides", harder "threshold" and "interval" sessions, race-effort practice, strength work and a few simple tests. Each type says what it trains, what you must be able to do before you get it, how it grows, and how you prove you are ready for the next step. Effort is described by how well you can talk, not by numbers you have to guess.

## 1. Module record format

Each module is a `SessionModule` (12 §2): `id` (`SES-M-nnn`; lower ID wins ties, GEN-005), `name`, `trains` [(node, level)] (CMP-007 selects by it; CMP-CHK-3), `prereqs` [(node, level)] (CMP-006, INV-20), `goal_text` (Message ID used as the session's `why`), `dose` (segment template with start, step, max; registry `ses.dose.<id>`), `progression` (SES-011; INV-16 still binds), `exit_test` (§3; CMP-002), `effort_profile` (highest segment effort, E0–E5), `allowed_phases`, `presets` (ids or `all`), `evidence` (grade + sources).

A planned `Session` copies the template into `Session.segments[]`, e.g. SES-M-008 at its start dose:

```json
{"module_id":"SES-M-008","effort_target":"E3","pace_range":null,
 "segments":[{"effort":"E1","duration_s":"p('ses.warmup_s')","repeats":1},
  {"effort":"E3","duration_s":"p('ses.dose.SES-M-008').rep_s","repeats":"p('ses.dose.SES-M-008').reps",
   "recovery":{"effort":"E1","duration_s":"p('ses.dose.SES-M-008').rec_s"}},
  {"effort":"E1","duration_s":"p('ses.cooldown_s')","repeats":1}]}
```

`pace_range` is filled only when INV-15 allows (measured anchor younger than `anchor.max_age_days`); HR targets only from a measured `HRReference` (INV-09).

## 2. Catalogue

Doses are design defaults stored in `ses.dose.<id>` (Parameters proposed) unless a grade says otherwise. Durations include warm-up and cool-down. All long-run and session lengths are clamped by 05 caps and INV-01/02/03/13 (numeric limits combine by MIN).

| ID | Name | Trains | Prereqs | Effort | Dose: start → max (step) | Phases | Presets | Evidence |
|---|---|---|---|---|---|---|---|---|
| SES-M-001 | Easy run | AER L1–L5, HAB L2–L4 | HAB L1 | E1 | `ses.easy_min_min` (20 min) → set by 05 weekly budget | all | all | wg1 impl. 2; wg2 §2; factdesk1 §3, CORROBORATED |
| SES-M-002 | Run-walk | HAB L1→L2, AER L1, (any run when preferred) | none | E1 run / E0 walk | 20 → 45 min; ratio ladder `ses.runwalk.ladder` | all | all; galloway default | wg2 §1, CORROBORATED; outcome effect UNKNOWN [factdesk2 §4] |
| SES-M-003 | Long run | DUR L1–L4, AER, PACE L1 (even effort) | DUR L(n−1); FUEL L1 when > 150 min (v2, Room B R4: TOL gates attaining DUR levels, not single runs) | E1 | from L30_eff (05) → preset cap | BASE–TAPER (shortened) | all | wg1 §6, CORROBORATED (association); caps wg2 §1 |
| SES-M-004 | Fuelled long run | FUEL L1–L3 | DUR L1 (FUEL edges, 02) | E1 (+race effort in SPECIFIC) | intake `fuel.start_g_h` → target (`fuel.step_g_h`, owned by 11) | BASE (late)–SPECIFIC | all | wg5 §5; hearing-1 §4, CORROBORATED |
| SES-M-005 | Race-effort long run | MSP L1–L3, PACE L1 | MSP L(n−1) prereqs; DUR L2 | E1 + final segment at `ses.race_effort[distance]` | segment ≤ min(`dst.msp_share[distance][level]` × race time, `dst.msp_segment_max_min[distance]`, 0.60 × the run) (v2, Room B R5); finish goals MSP L1 share; counts as quality for TID | SPECIFIC | all except higdon_novice, galloway | hearing-1 §1–2, CORROBORATED (specificity); hearing-1 phys-field (MP long runs, practice) |
| SES-M-006 | Strides | VO2 L1, ECO L1 | HAB L1 | E5 | 4 → 8 × 15–20 s, full walk-back recovery, after an easy run | all except RTR, TRANSITION | all | ALLEGED (practice) → dd |
| SES-M-007 | Short hill sprints | VO2 L1, ECO L1 | HAB L2, TOL L1, `hill_access` | E5 uphill | 4 → 8 × 10–20 s, walk down | BASE, BUILD | all | hearing-1 coach-field, ALLEGED → dd |
| SES-M-008 | Threshold intervals | THR L1–L2 | THR L1 edges (02) | E3 | 3×5 min → 5×8 min (+1 rep or +1 min/rep), 1–2 min E1 jog | BASE (late)–SPECIFIC | all | wg1 §1; hearing-1 §1, CORROBORATED (CS); dose ALLEGED |
| SES-M-009 | Continuous threshold | THR L3–L4 | THR L2, AER L3 | E3 | 15 → 40 min continuous, or 2×20 | BUILD–SPECIFIC | all except higdon_novice, galloway | wg2 §1; wg3 §3, CORROBORATED (structure) |
| SES-M-010 | VO2 intervals | VO2 L2–L3 | VO2 L1, THR L1, TOL L2 | E4 | 5×2 min → 6×3 min (≤ 18 min accumulated), equal-time E1 jog | BUILD–SPECIFIC; ultra BUILD first | all except higdon_novice, galloway | wg1 §2, CORROBORATED (small); dose ALLEGED |
| SES-M-011 | Race-pace intervals | MSP L1–L3, PACE L2 | THR L1, DUR L1 | `ses.race_effort[distance]` | accumulated share `dst.msp_share[distance][L1]` → `[L3]` of race duration | BUILD (last third)–TAPER (reduced) | all except higdon_novice | hearing-1 §2; wg2 §1, CORROBORATED |
| SES-M-012 | Progression run | THR L1 (support), PACE L1 | HAB L2, AER L2 | E1 → E2 → E3 (last 10–20%) | 40 → 70 min | BASE (late), BUILD | method_default, daniels | ALLEGED → dd |
| SES-M-013 | Steady run | AER L3+, MSP L1–L2 (M, ultra) | AER L2, TOL L2 | E2 | 30 → 90 min | BUILD–SPECIFIC | method_default, koop_ultra, pfitzinger_classic | wg2 §4, CREDIBLE |
| SES-M-014 | Strength (basic → loaded) | ECO L1 | HAB L1 | n/a (RPE ≤ 7) | `ses.strength_session_min` × `ses.strength_per_week` | all except RACE week | all | wg1 §6, CORROBORATED (economy); injury UNKNOWN |
| SES-M-015 | Plyometrics | ECO L2–L3 | ECO L1, TOL L2 | n/a | low-level contacts → full programme, 1–2×/wk | BASE–BUILD | all | wg1 §6, CORROBORATED (economy) |
| SES-M-016 | Back-to-back pair | DUR L5 | DUR L4, TOL L5, family = ultra, opt-in | E1 | day 2 ≤ `b2b.day2_ratio` × day 1; pair ≤ `b2b.pair_cap_ratio` × L30_eff | BUILD (late), SPECIFIC | koop_ultra | wg1 §6, ALLEGED; wg2 §4; rules 09 §5 |
| SES-M-017 | Medium-long run | AER L4–L5, DUR support | AER L3, TOL L3 | E1 | `ses.medlong_ratio` × current long run | BUILD–SPECIFIC | pfitzinger_classic | wg2 §1, CREDIBLE |
| SES-M-018 | FT-0 benchmark run | HAB L2 exit test | HAB L1 | E1 (talk test) | `ses.ft0_min` continuous; log distance | ONBOARD end, RTR end | all | opening-outsider §2; factdesk2 §5, CORROBORATED |
| SES-M-019 | FT-1 time trial (anchor) | anchor (PerformanceAnchor `field_test`) | HAB L2, TOL L1, gate = proceed | E4 even effort | `ses.ft1_dist_m` solo, or any race of 5K–10K | ONBOARD end, BASE, BUILD | all | hearing-1 §1; factdesk1 §3, CORROBORATED |
| SES-M-020 | FT-2 critical-speed test | anchor (CS) | VO2 L1, THR L1, TOL L2, gate = proceed | E4/E5 | two all-out trials `ses.ft2_dists_m` | BASE, BUILD | all | factdesk1 §3; hearing-1 §1, CORROBORATED (small n) |
| SES-M-021 | Maintenance week pack | holds levels (no new level) | any | ≤ last dose | ≥ `maint.sessions_min` runs, 1 key session at last dose | MAINTAIN | all | wg1 §5, CORROBORATED (VO2max only) |
| SES-M-022 | Heat-exposure easy run | HEAT L2 | AER L2, `expected_conditions = hot` | E1 | dose owned by 11 (`heat.acclim_days`) | SPECIFIC, TAPER | all | wg5 §4, CORROBORATED |
| SES-M-023 | Race rehearsal | PACE L3, FUEL exit (11) | PACE L2, FUEL L2 | race effort | session in race kit with race plan and race fuelling | SPECIFIC (last 2–6 wk) | all | wg5 §5; hearing-1 §4, CORROBORATED |
| SES-M-024 | Taper sharpener | keeps intensity (INV-08) | the key module used pre-taper | E3 or E4 | `ses.taper_touch` (short, inside an easy run) | TAPER | all | wg1 §5, CORROBORATED |
| SES-M-025 | Cross-training | none (supports aerobic minutes) | none | E1–E3 non-impact | as preset XT days | all | first, higdon_novice, opt-in | wg3 §3; wg2 §1, CORROBORATED |

Cross-training counts toward weekly minutes (INV-21) and session-RPE load [wg1 §3, CORROBORATED], never toward running volume, L30_eff or competence thresholds.

> **In plain words.** Most of your running is easy. A few sessions a week are harder, and each one has a purpose you can read in the app. Walk breaks are a normal way to train. Strength exercises help running efficiency; nobody has shown they prevent injury, so we don't promise that.

### 2b. Exit test per module (v5, p2-A R8)

| Module | Exit test (the §3 test it serves) |
|---|---|
| SES-M-001 Easy run | AER, HAB log thresholds (02 §2) |
| SES-M-002 Run-walk | HAB L1 log; HAB L2 by run-walk (finish goals, §3) |
| SES-M-003 Long run | DUR L1–L4 drift-free long run at the level's duration |
| SES-M-004 Fuelled long run | FUEL exit: two runs at the step intake, GI ≤ `fuel.gi_pass_max` (11) |
| SES-M-005 Race-effort long run | MSP L1–L3 share at race effort, even effort |
| SES-M-006 Strides / SES-M-007 Hill sprints | VO2 L1 / ECO L1 log (2×/week for 4 weeks) |
| SES-M-008 Threshold intervals | THR L1: 2 × 8 min E3 drift-free; THR L2: `ses.exit.THR2_min` accumulated E3 |
| SES-M-009 Continuous threshold | THR L3 (30 min continuous or 2 × 20); THR L4 (`ses.exit.THR4_min`) |
| SES-M-010 VO2 intervals | VO2 L2 (5 × 3 min E4); VO2 L3 (`ses.exit.VO2_3_min`) |
| SES-M-011 Race-pace intervals | MSP shares; PACE L2 even split |
| SES-M-012 Progression run | none (supports THR L1); its checkpoint is RPE ≤ target + margin |
| SES-M-013 Steady run | MSP L1–L2 for M/ultra |
| SES-M-014 Strength / SES-M-015 Plyometrics | ECO L1–L3 log for `ses.exit.ECO_weeks` |
| SES-M-016 Back-to-back pair | DUR L5: full-dose pair, drift-free both days |
| SES-M-017 Medium-long run | none (supports AER L4–L5) |
| SES-M-018 FT-0 benchmark | HAB L2: 30 min continuous at E1 |
| SES-M-019 FT-1 / SES-M-020 FT-2 | anchor: a measured result (INP-005, INP-025) |
| SES-M-021 Maintenance pack | none (holds levels) |
| SES-M-022 Heat exposure | HEAT L2: `heat.acclim_days` exposures logged |
| SES-M-023 Race rehearsal | PACE L3; FUEL exit at race effort |
| SES-M-024 Taper sharpener | none (keeps intensity, INV-08) |
| SES-M-025 Cross-training | none |

### 2c. Dose tables of the MVP modules (v5.2)

> **In plain words.** Each kind of hard session has a fixed ladder of sizes. You start at the bottom; each time you do the session and it feels no harder than intended, the next one is one rung bigger: first the repeats get longer, then one repeat is added. If it felt too hard, or you did not rate it, you repeat the same size.

These ladders replace the prose "Dose" column for the MVP. They are design defaults (basis `design_default`, grade ALLEGED: the "lengthen the repeats first, then add one" pattern follows common coaching practice as remembered, e.g. Daniels-style cruise intervals; not checked against a source). The machine form is `ses.dose.<module>.steps` in `parameters.md` (§14 of that file). Every key session is `warm-up` (`ses.warmup_s`, E1) + work + `cool-down` (`ses.cooldown_s`, E1); recoveries are taken between repeats (`repeats − 1` times). All durations stay under the 05 caps and INV-01/02 (numeric MIN).

| Module | Steps (index 0 = start dose) | Work effort | Recovery | Notes |
|---|---|---|---|---|
| SES-M-002 Run-walk | total 20, 25, 30, 35, 40, 45 min | E1 run / E0 walk | ratio from `ses.runwalk.ladder` (SES-010) | duration grows with the week's budget; the ratio follows SES-010 |
| SES-M-003 Long run | one step: duration = `LR(w)` of 05 | E1 | — | no own ladder: the 05 long-run curve sets it |
| SES-M-004 Fuelled long run | duration = `LR(w)`; intake = the fuelling step (NUT-010…012) | E1 | — | |
| SES-M-005 Race-effort long run | duration = `LR(w)`; final segment by DST-006 | E1 + race effort | — | HM time goals only in the MVP |
| SES-M-006 Strides | 4, 6, 8 × 20 s | E5 | 60 s walk-back (E0) | attached to the end of an easy run; adds about 5–10 min |
| SES-M-008 Threshold intervals | 3×5, 3×6, 3×7, 3×8, 4×8, 5×8 min | E3 | 2 min E1 jog | accumulated 15 → 40 min E3 |
| SES-M-009 Continuous threshold | 15, 20, 25, 30, 35, 40 min continuous | E3 | — | |
| SES-M-010 VO2 intervals | 5×2, 6×2, 5×3, 6×3 min | E4 | equal time E1 jog | accumulated 10 → 18 min E4 |
| SES-M-011 Race-pace intervals | accumulated share of the expected race time: 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, then the distance's L3 share (`dst.msp_share`) | `ses.race_effort[distance]` | 2 min E1 jog | repeats of at most `ses.msp_rep_max_min` (5K/10K 10 min, HM 15 min); reps = ⌈work ÷ max rep⌉, equal length, rounded down to 30 s |
| SES-M-012 Progression run | 40, 50, 60, 70 min | E1 70%, E2 15%, E3 15% (the last 15%) | — | counts as a key session |
| SES-M-013 Steady run | 30, 40, 50, 60, 75, 90 min of E2 | E2 | — | not in the MVP key lists (06 §5); kept for M/ultra |
| SES-M-018 FT-0 benchmark | one step: `ses.ft0_min` continuous | E1 | — | a level test (HAB L2) |
| SES-M-019 FT-1 time trial | one step: `ses.ft1_dist_m` | E4 even effort | — | anchor test |
| SES-M-020 FT-2 critical-speed test | one step: 2000 m, then 15 min E1 recovery, then 400 m | E4 / E5 | 15 min E1 | anchor test (both trials in one session) |
| SES-M-021 Maintenance pack | no own ladder: one key session at its last logged dose (SES-018) | — | — | |
| SES-M-022 Heat-exposure easy run | 30, 40, 50, 60 min | E1 | — | in the warmest part of the day the runner chooses |
| SES-M-024 Taper sharpener | one step: 2 × 5 min E3 (2 min jog) **or** 4 × 1 min E4 (1 min jog), inside an easy run | E3 or E4 | as stated | E3 form after threshold or race-effort key sessions, E4 form after VO2 sessions (SES-015) |

**Target session RPE** (`ses.target_rpe`, whole session on the 0–10 scale, warm-up and recoveries included): E1 3 · E2 5 · E3 6 · E4 7. A session "felt as intended" when its logged RPE ≤ min(target + `ses.progress_rpe_margin`, `result.rpe_high` − 1): the step-up rule never steps up a session that ADP-066 would count as very hard. The session RPE of an interval session sits below the RPE of the hard repeats because warm-up and recoveries are included [Foster session-RPE method, ALLEGED from memory]. It is consistent with `rpe.expected_by_effort` (08), which describes the hard part of a session.

**Module switch.** When the node a slot trains moves to a higher module (THR: SES-M-008 → SES-M-009), the new module starts at its highest step whose accumulated work is ≤ the last logged accumulated work of the old module, and at least at its start step.


## 3. Exit tests for every competence level (CMP-CHK-3)

Attainment is either a **log threshold** (02 §2, from contemporaneous entries only) or an **exit test** logged within `log.contemporaneous_window_h`. "Drift-free" = RPE of the final `ses.drift_window_min` ≤ first-segment RPE + `ses.drift_rpe_max`, no unplanned walking, pain ≤ `pain.during_max` and no next-morning worsening (`pain.next_morning_rule`).

| Node | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| HAB | log: SES-M-002 per 02 L1 threshold | SES-M-018 passed + 02 log threshold; **or** (finish goal, run-walk preference) 3 run-walk sessions/week ≥ expected race duration for 4 weeks (v2, Room A R5) | log (02) | log (02) | — |
| AER | log V28 threshold (02) | log | log | log | log |
| THR | SES-M-008 at 2×8 min E3, talk test "a few words" held throughout, drift-free | one session with `ses.exit.THR2_min` accumulated E3 | SES-M-009 continuous 30 min or 2×20 | one session with `ses.exit.THR4_min` accumulated E3 | — |
| VO2 | log: strides 2×/wk for 4 wk (SES-M-006/007) | SES-M-010 at 5×3 min, every rep completed at E4 | SES-M-010 with `ses.exit.VO2_3_min` accumulated | — | — |
| ECO | log: strides 2×/wk + SES-M-014 2×/wk, 4 wk | log: SES-M-015 weekly for `ses.exit.ECO_weeks`, no pain flag | log: full programme 2×/wk for `ses.exit.ECO_weeks` | — | — |
| DUR | SES-M-003 of 60 min drift-free | 90 min | `ses.exit.DUR3_min` | 180 min fuelled (FUEL L1) | SES-M-016 pair at full dose, drift-free both days |
| MSP | SES-M-011/005 with share `dst.msp_share[d][L1]` at race effort, even effort | `[L2]` share | `[L3]` share | — | — |
| FUEL | owned by 11: two long runs at the level's intake, GI ≤ `fuel.gi_pass_max` [wg5 impl. 3, CORROBORATED/CREDIBLE] | same | at race effort | opt-in | — |
| HEAT | informed (content read) | `heat.acclim_days` exposures logged (11) | — | — | — |
| PACE (advisory) | SES-M-003 long run logged as even effort | SES-M-011 even split within `cmp.pace_split_tol` (needs logged distance and time) | SES-M-023 with written race plan | — | — |

TOL has no exit test: it is measured (02 §3). A failed exit test never lowers a level or reduces the plan; it is repeated (SES-013).

> **In plain words.** You move up a level either by doing the training consistently (the app counts it from your log) or by passing a short test session. Failing a test is fine: you keep training at the same level and try again later.

### 3b. How a level test is judged (v5.2)

> **In plain words.** A level test is a normal session at a set size. After it the app asks three quick questions: did you finish every part, could you hold the effort to the end without slowing down or walking, and any pain? Three good answers, logged on the day, and the level is yours.

A **level test** is a planned session flagged `is_test` with `test_for = {node, level}`. Its dose (`ses.exit.<node><level>` in parameters.md):

| Level | Test session |
|---|---|
| HAB L2 | SES-M-018: `ses.ft0_min` continuous at E1 |
| THR L1 | SES-M-008 at 2 × 8 min E3, 2 min jog |
| THR L2 | SES-M-008 at 5 × 5 min E3 (`ses.exit.THR2_min` = 25), 2 min jog |
| THR L3 | SES-M-009 at 30 min continuous E3 |
| THR L4 | SES-M-009 at 3 × 15 min E3 (`ses.exit.THR4_min` = 45), 3 min jog |
| VO2 L2 | SES-M-010 at 5 × 3 min E4 |
| VO2 L3 | SES-M-010 at 6 × 3 min E4 (`ses.exit.VO2_3_min` = 18) |
| MSP L1–L3 | SES-M-011 at the level's share of the expected race time, race effort |
| DUR L1–L4 | the week's long run when its planned duration reaches 60, 90, `ses.exit.DUR3_min`, 180 min (L4 fuelled) |

The log's tick flow asks, on a test session only: "Did you finish every part as planned?" (`test_completed`), "Could you hold the effort to the end without slowing down or walking?" (`test_held_effort`), and the usual pain tap and next-morning prompt (INP-022). **SES-024** (new, v5.2) passes the test when all of these hold: both answers yes; pain ≤ `pain.during_max` (or the pain tap answered "No"); the next-morning prompt not answered "yes"; the entry measured (logged within `log.contemporaneous_window_h`); session RPE ≤ target RPE (above) + `ses.drift_rpe_max`. It then emits `exit_test_passed`, on which CMP-002 sets the level (when the level's prerequisites hold). Any "no", a pain answer above the limit, or an RPE above the limit emits `exit_test_failed`; a missing answer or no entry within the window counts as **unlogged**. Failed and unlogged tests follow SES-013. This replaces the per-segment "drift-free" and "talk test held" criteria of §3, which the log cannot record; §3's table keeps the doses.

**Runners who do not want tests (v5.2, owner answer to question 4).** A runner may turn level tests off in the settings (`profile.level_tests_opt_out`, default off) or skip one test from its card ("Skip this test"). Then no test session is planned (or the skipped one becomes the module's normal session), and **SES-025** credits the next level from training instead: when the module that trains it was logged for `ses.exit_ready_sessions` consecutive instances at a work at least equal to the **full** test (or the module's maximum when the test is bigger than it, e.g. THR L4), each felt as intended (SES-011), with pain ≤ `pain.during_max` and no next-morning pain, and the level's prerequisites hold. The level is then `measured` with source `log_threshold`, like any level reached from the log (CMP-001). This asks for more training than the test route (the full test size twice, not once) and drops the two test questions; it is a design default for experienced runners, untested (UNKNOWN). Skipping is never counted as a failed test and never lowers anything.

**When a test is scheduled (SES-012, v5.2 reading).** The test for level n + 1 is scheduled once the module that trains it was logged, for `ses.exit_ready_sessions` consecutive instances, at a dose whose accumulated work is ≥ min(the test's accumulated work, the module's maximum) and felt as intended, and the prerequisites of level n + 1 hold. Example: the THR L1 test (2 × 8 min) follows two SES-M-008 sessions of at least 16 min of E3 (step 3 × 6). It replaces that module's instance in the next week that is not a deload, TAPER, RACE or TRANSITION week and holds no field test (SES-014 field tests take precedence; one test per week). The module may keep growing afterwards.

## 4. Selection and placement rules

```
RULE SES-001 | priority T5.300 | when 07 S7 builds the candidate list for a slot | then a module is a candidate only if Phase.type ∈ allowed_phases, the active preset ∈ presets (or presets = all), every prereq holds on the session date (CMP-006) and effort_profile ≤ the gate's effort ceiling | because modules are reusable only with declared prerequisites (C10) | evidence criteria.md C4, C10; 02 CMP-006, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE SES-002 | priority T1.300 | when GateOutcome = proceed_restricted, or SpecialStatus = pregnant | then only modules with effort_profile ≤ E2 are candidates; SES-M-019 and SES-M-020 are ineligible; ineligible slots become SES-M-001 of equal or lower duration | because vigorous work waits on clearance | evidence wg4 §3 ACSM 2015/PAR-Q+, CORROBORATED; wg4 §5 ACOG 804, CORROBORATED | basis convention | default? no
RULE SES-003 | priority T5.301 | when a week skeleton from 05 is filled | then place in this order: (1) long run on the long-run day, (2) key sessions chosen by CMP-007, (3) easy or run-walk runs to fill the run count, (4) strides attached to easy runs, (5) strength and cross-training | because proven plans share this core; a fixed order is deterministic | evidence hearing-1 §2, CORROBORATED; opening-firstprinciples §3 | basis design_default | default? yes
RULE SES-004 | priority T5.302 | when placing key sessions | then a "hard day" is any session with a segment at E3 or E4 (strides excluded, SES-021), or the long run (v5.2, owner Q2: the long run counts as a hard day for spacing, whatever quality.counts_long says for the quality count); no two hard days are consecutive, inside the week or across its start, unless the preset declares consecutive_hard_allowed; among valid placements choose the one maximising the smallest gap between hard days of the Monday–Sunday week, ties to the earlier days (12 §2b.4 place_in_order) | because spacing hard days is common practice (INV-17) | evidence hearing-1 §2, CREDIBLE practice; v5.2 long run counted as a hard day for spacing: ALLEGED (common plan practice, from memory) | basis design_default | default? yes
RULE SES-005 | priority T3.300 | when placing any session | then use only RunnerProfile.available_days minus blocked_dates; runs per week ≤ max_runs_per_week; long run on long_run_day if available, else the latest available day of the week | because T3 outranks goal structure (INV-21) | evidence criteria.md C2; 07 §1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE SES-006 | priority T5.303 | when setting the week's key-session count | then count = MIN(quality.per_week[preset], quality.method_default[state] if preset = method_default, week runs − quality.non_key_runs_min (v5.2, owner Q2: at least the long run and one easy run besides the key sessions), the largest count placeable under SES-004 and SES-005 (try k, then k − 1, 07 §2b S7.4), the largest count whose start doses fit the week's TID budgets (v5.2: drop the last-ranked slot rather than trim it, S7.5)), where the long run counts toward the total only if quality.counts_long[preset] | because a school's quality count only works in its own week | evidence wg2 impl. 7, CORROBORATED; opening-statusquo R2; v5.2 run-count and budget terms: ALLEGED (common novice and intermediate practice, from memory) | basis design_default | default? yes
RULE SES-007 | priority T5.304 | when preset = method_default | then quality.method_default = 0 in START_LADDER, RTR, ONBOARD, TRANSITION and RACE weeks or while level(HAB) < L2; 1 in BASE, TAPER and MAINTAIN or while level(TOL) ≤ L2; in SHARPEN the count of the last completed non-deload week, at most 2; otherwise 2 in BUILD and SPECIFIC (v5.2: tests in this order; owner Q2) | because novice plans use 0–1 key sessions, Daniels 2 | evidence wg2 §1, impl. 7, CORROBORATED; hearing-1 §2, CORROBORATED; v5.2 counts for TAPER, RACE, MAINTAIN, SHARPEN: design choice, UNKNOWN | basis design_default | default? yes
RULE SES-008 | priority T3.301 | when planned weekly minutes > available_minutes_per_week | then shorten in this order until it fits: easy runs down to ses.easy_min_min, key sessions down to their dose start, then drop the shortest easy run, then drop key sessions in reverse CMP-007 order; when Goal.family = ultra, key sessions are shortened and dropped before easy runs; the long run is shortened last and never moved off its day | because frequency drives response; for road ultras volume matters more than pace | evidence wg3 §2 Montero & Lundby, CORROBORATED (cycling); opening-contextrealist §3; wg1 §1, wg2 §4 Knechtle/Tanda, CORROBORATED (association) | basis design_default | default? yes
RULE SES-009 | priority T5.305 | when Phase.type = RTR or the start ladder runs, or level(HAB) < L2, or run_walk_preference was set explicitly by the runner, or a planned run exceeds 180 min (v3, LOD-017) | then render SES-M-001 and SES-M-003 as run-walk: on RTR the 10 ladder rung, otherwise ses.runwalk.ladder from the ratio matching the last rung; caps apply on duration (INV-02); a run_walk_preference that only came from the INP-008 default is switched off at the ladder exit once SES-M-018 is passed | because one ladder per situation, with a defined handover, avoids two competing ladders (F-17) | evidence wg2 §1 Galloway, CORROBORATED; F-17 | basis design_default | default? yes
RULE SES-010 | priority T5.306 | when the runner is not on the return or start ladder (those follow SAF-082) and the last ses.runwalk.sessions_per_rung run-walk sessions at the current rung since the last missed run-walk session were each done (≥ miss.partial_ratio), at RPE ≤ ses.runwalk.rpe_max, with pain ≤ pain.during_max and no next-morning pain | then move one rung up the ladder at the next session; on a pain report or a missed session hold the rung (a miss restarts the count); never skip a rung; a runner rendered as run-walk by preference starts at ses.runwalk.entry_rung.preference (2:1), one with HAB < L2 at ses.runwalk.entry_rung.hab_low (1:1) (v5.2) | because staged walk–run returns advance on symptoms | evidence factdesk1 §1 staged return structure, CORROBORATED (analogy); hearing-1 §3, majority; v5.2 entry rungs and counting: ALLEGED (Galloway 2:1 beginner ratio, from memory) | basis design_default | default? yes
RULE SES-011 | priority T5.307 | when the previous non-deload instance of a module was logged done with RPE ≤ min(target RPE + ses.progress_rpe_margin, result.rpe_high − 1) (target RPE: ses.target_rpe by effort) | then the next instance steps up by one dose step of ses.dose.<id>.steps (06 §2c); otherwise, or when the RPE was not given, repeat the dose; never exceed the dose max, the week's TID budgets (dose_fit) or any numeric cap (MIN); future weeks show one step ahead only (07 §2b projection); after a deload or taper the module resumes at its last completed dose (v5.2, owner Q3) | because progression follows tolerated work | evidence wg1 §3 session RPE, CORROBORATED; opening-statusquo R3; v5.2 dose ladders (lengthen repeats, then add one) and target session RPE: ALLEGED (Daniels-style cruise intervals and Foster session RPE, from memory) | basis design_default | default? yes
RULE SES-012 | priority T5.308 | when a module has been logged for ses.exit_ready_sessions consecutive instances at a dose whose work is ≥ min(the next level's test work, the module's dose max) and felt as intended (SES-011), and all prereqs of the next level hold | then schedule its level test (§3b) in the next week that is not a deload, TAPER, RACE or TRANSITION week and holds no field test, replacing that week's instance (v5.2, owner Q4: v5's "at its dose max" asked for 5 × 8 min before a 2 × 8 min test) | because levels are proven by tests (CMP-002) | evidence criteria.md C10; 02 CMP-002, UNKNOWN (design default); v5.2 trigger on the test's own size: design choice, UNKNOWN | basis design_default | default? yes
RULE SES-013 | priority T5.309 | when an exit test is failed or not logged (SES-024) | then keep the level, continue the module at the dose at which the test was triggered (frozen until the retest) and reschedule the test after ses.exit_retest_weeks; show MSG-SES-TEST-AGAIN | because a failed test is information; drop-out is the main risk | evidence opening-outsider §1 (drop-out risk); wg3 §5, CREDIBLE (27% C25K completion, Relph 2023, single study) | basis design_default | default? yes
RULE SES-014 | priority T5.310 | when ONBOARD ends, or no anchor with confidence = measured is younger than anchor.max_age_days − ses.retest_lead_days | then schedule SES-M-020 if VO2 L1 and THR L1 hold, else SES-M-019 if its prereqs hold, else SES-M-018 (benchmark only; plan stays effort-only); a logged race with distance ∈ {5K, 10K} replaces the test | because paces need measured anchors; novices stay effort-only until they can test safely | evidence factdesk1 §3, CORROBORATED; opening-outsider §2; 07 INV-15 | basis design_default | default? yes
RULE SES-015 | priority T5.311 | when a non-race TAPER week is filled and the pre-taper block held any session with a segment ≥ E3 | then keep at least one SES-M-024 in that week, in its E3 form (2 × 5 min) after threshold, progression or race-effort key sessions and its E4 form (4 × 1 min) after VO2 sessions, at the fixed ses.taper_touch dose, and keep the pre-taper run count (taper.freq_min_ratio) (v5.2) | because the taper keeps intensity and frequency | evidence wg1 §5, wg2 §3, CORROBORATED; v5.2 sharpener form by the last key session: ALLEGED (practice, from memory) | basis evidence | default? no
RULE SES-016 | priority T5.312 | when Week.is_deload = true | then key sessions ≤ deload.quality_max (the slot ranked first by CMP-007), each at its dose start, which governs the key session's size over LOD-040's "work cut by deload.volume_cut" (the start dose is the smaller in practice); strides kept; no exit or field tests (v5.2, owner Q3) | because a deload is for recovery; dose is convention | evidence wg1 §5 impl. 11, ALLEGED; v5.2 start dose over LOD-040's cut: design choice, UNKNOWN | basis design_default | default? yes
RULE SES-017 | priority T5.313 | when any module at E1–E4 is rendered | then the target effort comes first; a pace range is added only from the 03 §3b pace model (FEA-014) when INV-15 allows; HR only from a measured HRReference | because effort words are the shared vocabulary and paces need an explicit derivation (F-12) | evidence factdesk1 §3, CORROBORATED; F-12 | basis design_default | default? yes
RULE SES-018 | priority T5.314 | when Phase.type = MAINTAIN, or a week marked busy (ADP-071) | then fill the week with SES-M-021: ≥ maint.sessions_min runs including one key session: the most recently logged key module at its last logged dose; if none was ever logged, SES-M-008 at its start dose when THR L1's prerequisites hold, else strides (SES-M-006) (v5.2) | because kept intensity holds VO2max for weeks | evidence wg1 §5 Spiering, CORROBORATED (VO2max) / UNKNOWN (durability); v5.2 choice of the maintenance key session: design choice, UNKNOWN | basis evidence | default? no
RULE SES-019 | priority T5.315 | when preset = norwegian_elite | then double-threshold days are allowed only if THR L4, AER L5 and an explicit opt-in hold, and are labelled "untested in amateurs"; otherwise the preset is incompatible (09 DST-016) | because it is described in elites only | evidence wg1 §2, CORROBORATED (elite description) / UNKNOWN (amateurs); hearing-1 §1 | basis design_default | default? yes
RULE SES-020 | priority T6.300 | when the week has room after SES-003 steps 1–4 | then add SES-M-014 ses.strength_per_week times, on easy days or after a key session, never on the day before the long run; if the masters context modifier (01 CTX) is active, strength is placed before cross-training | because strength improves economy; injury effect unknown | evidence wg1 §6, CORROBORATED (economy) / UNKNOWN (injury); wg3 §2, CREDIBLE (masters) | basis design_default | default? yes
RULE SES-021 | priority T6.301 | when level(HAB) ≥ L1 and the phase allows SES-M-006 | then attach strides to ses.strides_per_week easy runs, never on the day before a key session; strides do not make a day "hard" | because strides are a low-cost L1 stimulus | evidence 02 §2 (ECO L1, VO2 L1 definitions); practice ALLEGED | basis design_default | default? yes
RULE SES-022 | priority T6.302 | when SES-M-007 is selected and RunnerProfile.hill_access ≠ true | then replace it with SES-M-006 | because terrain is out of scope | evidence criteria.md scope note, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE SES-023 | priority T6.303 | when SES-M-025 is considered | then use it only for preset first or higdon_novice XT days or on user opt-in; it never counts toward running volume, L30_eff or competence thresholds | because those presets prescribe XT; non-running load does not build running tolerance | evidence wg3 §3, wg2 §1, CORROBORATED (structure); wg3 §2 other-sport risk, CREDIBLE | basis evidence | default? no
RULE SES-025 | priority T5.317 | when the runner has turned level tests off or skipped the level test, and the module that trains the next level was logged for ses.exit_ready_sessions consecutive instances at a work ≥ the full test's work (or the module's maximum if the test is bigger), each felt as intended (SES-011) with pain ≤ pain.during_max and no next-morning pain, and the next level's prerequisites hold | then set that level, confidence measured, source log_threshold, without a test session | because some runners, often experienced ones, do not want test sessions, and two full-size sessions logged as intended show the same ability (v5.2, owner answer to question 4) | evidence 06 §3; the equivalence of two full-size training sessions and one test is a design default, UNKNOWN | basis design_default | default? yes
RULE SES-024 | priority T5.316 | when a logged entry is linked to a planned level test (§3b) | then the test is passed if the runner answered yes to "finished every part" and to "held the effort to the end without slowing or walking", pain stayed ≤ pain.during_max (or the pain tap was "No"), the next-morning prompt was not "yes", the entry is measured (logged within log.contemporaneous_window_h) and the session RPE ≤ the target RPE + ses.drift_rpe_max; failed if an answer is no or a limit is exceeded; unlogged if an answer or the entry is missing; a pass lets CMP-002 set the level | because the log cannot record per-segment effort drift or the talk test, so three one-tap questions stand in for them (v5.2, owner Q4; gap/prose-rules.md §4.4) | evidence 06 §3; factdesk1 §2, CORROBORATED (next-morning rule); questions are a design default, UNKNOWN | basis design_default | default? yes
```

Tests: every rule has `T-<ID>-fires` and `T-<ID>-silent` (14); e.g. T-SES-022-silent: `hill_access = true`.

> **In plain words.** The app first puts your long run on the day you chose, then spreads the harder sessions so you never have two hard days in a row, then fills the rest with easy runs. If your week is too short, easy runs get shorter before any run is dropped, because running often matters more than running long.

## 5. School-preset session mixes

Each preset is a coherent whole [opening-statusquo R2]: its quality count only works with its day count and long-run style. Mixing one preset's cap with another's frequency is a deviation and is logged (07 §7). Day and time compatibility is in 09 §7.

| Preset | `quality.per_week` | Long run counts? | Key modules by phase (BUILD → SPECIFIC) | Other features | Grade |
|---|---|---|---|---|---|
| method_default | SES-007 (0–2) | no | CMP-007 among SES-M-008/010/012 → SES-M-011/005/009; zero-gap fallback rotates this list by week index (CMP-007, F-09); MSP every `dst.msp_every_weeks` for time goals (DST-018) | strides, strength; pyramidal TID | design default; core CORROBORATED [hearing-1 §2] |
| daniels | 2 ("2Q") | no | SES-M-010 + 008 → 009 + 011 (M: 005) | long run ≤ min(`lr.pct_cap`, `lr.time_cap_min`) | CORROBORATED [wg2 §1] |
| hansons | 3 SOS | yes | speed (SES-M-010) + tempo at goal effort (011) + long → "strength" reps (011 slightly above goal effort) + 011 + long | 6 run days; long ≤ `lr.abs_cap_km` (26 km) | CORROBORATED [wg2 §1] |
| pfitzinger_classic | 2–3 | only SES-M-005 | SES-M-009 + 010 → 009 + 005 (MP long) | SES-M-017 midweek | CORROBORATED tiers / CREDIBLE details [wg2 §1] |
| higdon_novice | 0 | — | none (SES-M-001/003 only) | 4 run days + 1 SES-M-025; long-run steps re-stepped (07 §7) | CORROBORATED structure [wg2 §1; factdesk2 §7] |
| galloway | 0–1 | — | none or SES-M-006 | all runs SES-M-002 | CORROBORATED ratios [wg2 §1] |
| first | 3 | yes | SES-M-010 + 009 + long (pace targets only via INV-15) | exactly 3 runs + 2 SES-M-025; **status pending_fixture** (not selectable in v2) | CORROBORATED structure [factdesk3 §6]; outcomes ALLEGED [wg3 §3] |
| koop_ultra | 1–2 | no | VO2 (010) → THR (008/009) → steady (013), in that order → SES-M-005 at ultra effort, 004, opt-in 016 | 09 DST rules | CREDIBLE [wg2 §4] |
| norwegian_elite | 4–5 (gated, SES-019) | no | sub-threshold SES-M-008 doubles + one SES-M-010 | elites only | CORROBORATED description / UNKNOWN amateurs [wg1 §2] |

> **In plain words.** You can pick a well-known training style. The app keeps that style's pieces together, for example Hansons' three key days only with six running days, and it tells you whenever it has to change something for safety.

## 6. Effort-ladder wording per module

> **Non-normative copy (v5, p2-A R3).** `messages.md` governs every text below; where they differ, the catalogue wins and this table is a defect to be fixed at the next edit.


Each module's runner text uses the effort ladder (12 §1) and a talk-test cue. Messages (`is_safety_generic = false`):

| Message | plain_text | why |
|---|---|---|
| MSG-SES-EASY | "Easy: you can talk in full sentences. If you can't, slow down or walk." | "Easy running builds your engine with little strain." |
| MSG-SES-RW | "Run for the time shown, then walk briskly; repeat. Walk breaks are training, not failure." | "Walk breaks let you build time on your feet safely." |
| MSG-SES-LONG | "Long and easy: full sentences all the way. Finish feeling you could go on." | "Long runs build staying power for the end of a race." |
| MSG-SES-THR | "Hard but controlled: you can say only a few words. Hold an even effort." | "This raises the pace you can hold for a long time." |
| MSG-SES-VO2 | "Very hard: you cannot talk. Jog easy between repeats until breathing settles." | "This raises your top-end fitness." |
| MSG-SES-RACE | "Race effort for your goal race (see the effort word for your distance)." | "Practising race effort teaches pace and confidence." |
| MSG-SES-TEST | "A test run: even effort, the best you can hold for the distance. Log it today." | "It sets your training paces; until then we use effort only." |

Race-effort word by distance (`ses.race_effort`): 5K E4; 10K E3–E4 boundary ("hard, a word or two"); half E3; marathon E2; 50K E1–E2; 100K E1. Basis: CS ≈ 10K speed [factdesk1 §3], marathon ≈ 85% CS [wg1 §1], talk-test anchors VT1/VT2 [factdesk1 §3]; all CORROBORATED, the mapping itself a design default.

## 7. Conflicts with contract and open points (v1 record; resolved in RESOLUTIONS.md)

1. **New profile field.** SES-022 needs `RunnerProfile.hill_access` (bool, default false). Not in 12 §2; requested addition.
2. **ONBOARD exit vs novices.** 04 says ONBOARD exits when "an anchor field test is logged". A runner with HAB < 2 or a restricted gate cannot safely run SES-M-019/020; SES-014 lets SES-M-018 (benchmark, no anchor) close ONBOARD and the plan stays effort-only. 04's exit criterion should read "anchor or benchmark test logged".
3. **Quality counting.** `quality.per_week` values in parameters.md mix schools that count the long run (Hansons, FIRST) with ones that don't (Daniels). `quality.counts_long[preset]` is proposed; 05 TID accounting must use the same definition.
4. **MSP shares** `dst.msp_share` are owned by 09 (02 §2 leaves MSP L3 "distance-specific, 09").
5. **FUEL and HEAT doses** are owned by 11; this module only hosts the sessions.

## 8. Parameters proposed

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| ses.dose.<SES-M-id> | as §2 "Dose" column | segments | ±50% of default | per §5 | ALLEGED (practice) | dd | §2; hearing-1 §2 | 06 |
| ses.warmup_s / cooldown_s | 600 / 300 | s | 300–900 / 0–600 | — | ALLEGED | conv | practice | 06 |
| ses.easy_min_min | 20 | min | 15–30 | — | UNKNOWN | dd | opening-contextrealist | 06 |
| quality.method_default | ONBOARD/RTR/TRANS 0; BASE ≤1; BUILD/SPEC 2 | sessions | 0–2 | — | CORROBORATED (school range) | dd | wg2 impl. 7 | 06 |
| quality.counts_long | false | bool per preset | — | hansons, first: true; pfitzinger_classic: SES-M-005 only | CORROBORATED (structure) | conv | wg2 §1; wg3 §3 | 06 |
| ses.runwalk.ladder | 1:2, 1:1, 2:1, 3:1, 5:1, 8:1, continuous | min run : min walk | — | galloway ratios by pace | CORROBORATED (2:1 beginner) / ALLEGED (ladder) | dd | wg2 §1 | 06 |
| ses.runwalk.sessions_per_rung / rpe_max | 2 / 4 | sessions / RPE 0–10 | 2–4 / 3–5 | — | ALLEGED | dd | factdesk1 §1 | 06 |
| ses.progress_rpe_margin | 1 | RPE points | 0–2 | — | ALLEGED | dd | wg1 §3 | 06 |
| ses.exit_ready_sessions | 2 | instances | 1–3 | — | UNKNOWN | dd | 02 CMP-002 | 06 |
| ses.exit_retest_weeks | 3 | weeks | 2–6 | — | UNKNOWN | dd | — | 06 |
| ses.drift_window_min / drift_rpe_max | 20 / 2 | min / RPE | 10–30 / 1–3 | — | UNKNOWN (no durability field test) | dd | wg1 §1 | 06 |
| ses.exit.THR2_min / THR4_min | 25 / 45 | min E3 | 20–30 / 45–60 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.VO2_3_min | 18 | min E4 | 16–20 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.DUR3_min | 135 | min | 120–150 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.ECO_weeks | 6 | weeks | 4–8 | — | UNKNOWN | dd | — | 06 |
| ses.retest_lead_days | 14 | days | 7–28 | — | UNKNOWN | dd | 07 §3 | 06 |
| ses.ft0_min | 30 | min | 20–30 | — | design (= HAB L2) | dd | 02 §2 | 06 |
| ses.ft1_dist_m | 3000 | m | 2000–5000 | — | UNKNOWN (test choice) | dd | factdesk1 §3 | 06 |
| ses.ft2_dists_m | 400 + 2000 | m | or 2–3 recent races | — | CORROBORATED (n = 34 study pair) | ev | factdesk1 §3 | 06 |
| ses.taper_touch | 4×1 min E4 or 2×5 min E3 in an easy run | segments | — | — | CORROBORATED (keep intensity) / dose ALLEGED | dd | wg1 §5 | 06 |
| ses.strength_per_week / strength_session_min | 2 / 20 | sessions / min | 1–3 / 15–40 | — | CORROBORATED (economy); 10-min dose null for injury [wg1 §6] | conv | wg1 §6; 02 ECO L1 | 06 |
| ses.strides_per_week | 2 | sessions | 1–3 | — | ALLEGED | conv | 02 ECO L1 | 06 |
| ses.medlong_ratio | 0.65 | × current long run | 0.55–0.75 | pfitzinger_classic | CREDIBLE (21–27 km vs 32–35 km long) | conv | wg2 §1 | 06 |
| ses.race_effort | 5K E4; 10K E3/E4; HM E3; M E2; 50K E1/E2; 100K E1 | Effort | — | — | CORROBORATED anchors / mapping dd | dd | factdesk1 §3; wg1 §1 | 06 |

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "SES-001", "condition": "event.type == 'candidate_list'", "on_unknown": "skip", "action": {"op": "filter_candidates", "target": "slot.candidates", "expr": "week.phase in m.allowed_phases && (m.presets == ['all'] || preset.id in m.presets) && prereqs_hold(m, slot.date) && effort_rank(m.effort_profile) <= effort_rank(state.effort_ceiling)"}}
{"id": "SES-002", "condition": "state.gate == 'proceed_restricted' || profile.special_status == 'pregnant'", "on_unknown": "fire", "action": {"op": "set", "target": "state.effort_ceiling", "expr": "'E2'", "then": [{"op": "replace_module", "target": "slot", "expr": "'SES-M-001'", "when": "slot.module in ['SES-M-019', 'SES-M-020'] || effort_rank(slot.effort_profile) > effort_rank('E2')"}]}}
{"id": "SES-005", "condition": "event.type == 'place_session'", "on_unknown": "fire", "action": {"op": "constraint", "check": "weekday(session.date) in profile.available_days && !(session.date in profile.blocked_dates) && week.runs <= profile.max_runs_per_week", "place_long_run": "profile.long_run_day in week.free_days ? profile.long_run_day : last(week.free_days)"}}
{"id": "SES-008", "condition": "week.planned_time_s > unit.min_s * profile.available_minutes_per_week", "on_unknown": "fire", "action": {"op": "shorten_week", "target": "week", "order_expr": "goal.family == 'ultra' ? ['key', 'easy', 'drop_key', 'drop_easy', 'long'] : ['easy', 'key', 'drop_easy', 'drop_key', 'long']", "until": "week.planned_time_s <= unit.min_s * profile.available_minutes_per_week"}}
{"id": "SES-014", "condition": "event.type == 'onboard_end' || !exists(state.anchors, a, a.confidence == 'measured' && days_between(a.date, today) <= p('anchor.max_age_days') - p('ses.retest_lead_days'))", "on_unknown": "skip", "action": {"op": "schedule_session", "module_expr": "(state.levels.VO2 >= 1 && state.levels.THR >= 1) ? 'SES-M-020' : (prereqs_hold(module('SES-M-019'), today) ? 'SES-M-019' : 'SES-M-018')"}}
{"id": "SES-003", "condition": "event.type == 'fill_week_skeleton'", "on_unknown": "skip", "action": {"op": "set", "target": "week.sessions", "expr": "place_in_order(week, ['long', 'key', 'easy', 'strides', 'strength'])"}}
{"id": "SES-009", "condition": "week.phase == 'RTR' || state.on_start_ladder || !state.hab_continuous || profile.run_walk_preference_explicit || session.expected_duration_s > unit.min_s * p('lr.long_guard_min')", "on_unknown": "fire", "action": {"op": "render_run_walk", "target": "session"}}
{"id": "SES-004", "condition": "event.type == 'place_session'", "on_unknown": "fire", "action": {"op": "constraint", "check": "!session.is_hard || !session.next_day_is_hard || preset.consecutive_hard_allowed"}}
{"id": "SES-006", "condition": "event.type == 'count_keys'", "on_unknown": "fire", "action": {"op": "cap", "target": "week.quality_max", "expr": "max(0, min(preset.id == 'method_default' ? week.method_default_count : p('quality.per_week')[preset.id], week.runs - p('quality.non_key_runs_min')))"}}
{"id": "SES-007", "condition": "preset.id == 'method_default' && event.type == 'count_keys'", "on_unknown": "fire", "action": {"op": "set", "target": "week.method_default_count", "expr": "(week.phase in ['START_LADDER', 'RTR', 'ONBOARD', 'TRANSITION', 'RACE'] || week.is_race_week || state.levels.HAB < p('quality.min_hab_level')) ? 0 : (week.phase == 'SHARPEN' ? min(p('quality.method_default_max'), state.last_week_key_count) : ((week.phase in ['BASE', 'TAPER', 'MAINTAIN'] || state.levels.TOL <= p('quality.low_tol_level')) ? 1 : p('quality.method_default_max')))"}}
{"id": "SES-010", "condition": "state.ladder_kind == 'none' && count(log.runwalk_sessions_at_rung, x, x.clean_runwalk) >= p('ses.runwalk.sessions_per_rung')", "on_unknown": "skip", "action": {"op": "set", "target": "state.runwalk_rung", "expr": "min(state.runwalk_rung + 1, size(p('ses.runwalk.ladder')) - 1)"}, "stage": "S2"}
{"id": "SES-011", "condition": "session.is_key && !session.is_test && !week.is_deload && week.phase != 'TAPER' && event.type == 'dose_sessions'", "on_unknown": "skip", "action": {"op": "set", "target": "session.dose_step", "expr": "dose_fit(session.module_id, session.prev_instance_ok ? next_dose(session.module_id, session.prev_step) : (has(session.prev_step) ? session.prev_step : dose_start(session.module_id)), week)"}}
{"id": "SES-012", "condition": "session.is_key && session.exit_ready && week.test_allowed && !profile.level_tests_opt_out && level_prereqs_hold(session.next_test_node, session.next_test_level, session.date)", "on_unknown": "skip", "action": {"op": "replace_module", "target": "session", "expr": "session.next_test_module", "then": [{"op": "set", "target": "session.is_test", "expr": "true"}]}, "stage": "S7.3"}
{"id": "SES-013", "condition": "session.test_result in ['failed', 'unlogged']", "on_unknown": "fire", "action": {"op": "freeze", "target": "state.module_dose", "fields": ["session.module_id"], "until": "date_add(session.date, unit.week_d * p('ses.exit_retest_weeks'))", "then": [{"op": "schedule_session", "module_expr": "session.module_id", "week_expr": "date_add(session.date, unit.week_d * p('ses.exit_retest_weeks'))", "place": "key_slot"}, {"op": "emit_message", "msg": "MSG-SES-TEST-AGAIN"}]}, "stage": "S2"}
{"id": "SES-015", "condition": "week.phase == 'TAPER' && !week.is_race_week && plan.pre_taper_had_e3", "on_unknown": "fire", "action": {"op": "schedule_session", "module_expr": "'SES-M-024'", "week_expr": "week.start", "place": "key_slot", "dose_expr": "plan.taper_touch_form == 'E4' ? 1 : 0", "then": [{"op": "floor", "target": "week.runs", "expr": "p('taper.freq_min_ratio') * plan.pre_taper_runs"}]}, "stage": "S7.3"}
{"id": "SES-016", "condition": "week.is_deload", "on_unknown": "fire", "action": {"op": "cap", "target": "week.quality_max", "expr": "p('deload.quality_max')", "then": [{"op": "set", "target": "week.key_dose_mode", "expr": "'start'"}, {"op": "block_sessions", "filter": "s.is_test && s.week_id == week.id", "until": "never"}]}, "stage": "S7.1"}
{"id": "SES-017", "condition": "true", "on_unknown": "fire", "action": {"op": "constraint", "check": "lint: every session at E1–E4 is rendered effort word first (MSG-SES-*); pace_range only through FEA-014 when INV-15 allows; hr_zone only from a measured HRReference (INV-09)"}, "status": "static"}
{"id": "SES-018", "condition": "week.phase == 'MAINTAIN' || week.kind == 'maintenance'", "on_unknown": "fire", "action": {"op": "set", "target": "week.key_slots", "expr": "has(plan.last_key_module) ? [plan.last_key_module] : (level_prereqs_hold('THR', 1, week.start) ? ['SES-M-008'] : ['SES-M-006'])", "then": [{"op": "set", "target": "week.key_dose_mode", "expr": "'last'"}, {"op": "floor", "target": "week.runs", "expr": "p('maint.sessions_min')"}]}, "stage": "S7.3"}
{"id": "SES-020", "condition": "event.type == 'extras'", "on_unknown": "skip", "action": {"op": "constraint", "check": "count(week.sessions, s, s.module_id == 'SES-M-014') >= min(p('ses.strength_per_week'), week.strength_days_free) && all(week.sessions, s, s.module_id != 'SES-M-014' || !s.day_before_long_run)"}}
{"id": "SES-021", "condition": "event.type == 'extras' && state.levels.HAB >= 1 && week.strides_allowed", "on_unknown": "skip", "action": {"op": "constraint", "check": "count(week.sessions, s, s.has_strides) >= min(p('ses.strides_per_week'), week.easy_runs) && all(week.sessions, s, !s.has_strides || !s.day_before_key)"}}
{"id": "SES-022", "condition": "slot.module == 'SES-M-007' && profile.hill_access != true", "on_unknown": "fire", "action": {"op": "replace_module", "target": "slot", "expr": "'SES-M-006'"}}
{"id": "SES-024", "condition": "entry.is_test", "on_unknown": "skip", "action": {"op": "set", "target": "entry.test_result", "expr": "(!has(entry.test_completed) || !has(entry.test_held_effort) || !has(entry.rpe_0_10) || !entry.is_measured) ? 'unlogged' : ((entry.test_completed && entry.test_held_effort && !entry.pain_over_limit && !entry.pain_next_morning_yes && entry.rpe_0_10 <= entry.target_rpe + p('ses.drift_rpe_max')) ? 'passed' : 'failed')"}}
{"id": "SES-025", "condition": "(profile.level_tests_opt_out || session.test_declined) && session.credit_ready && level_prereqs_hold(session.next_test_node, session.next_test_level, session.date)", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels[session.next_test_node]", "expr": "max(state.levels[session.next_test_node], session.next_test_level)", "then": [{"op": "set", "target": "state.level_confidence[session.next_test_node]", "expr": "'measured'"}, {"op": "emit_message", "msg": "MSG-SES-LEVEL-FROM-TRAINING"}]}, "stage": "S2"}
```

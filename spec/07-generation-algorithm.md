# 07 — Generation algorithm (v5.3, architect)

Serves criteria 5 (explicit deterministic rules, stated defaults), 3 and 9 (fail closed with options), 7 (load limits enforced on every output), 11 (rule-engine ready), 13 (testable invariants). Rule ranges: GEN-001…099 (pipeline), INV-01…49 (validator invariants), REP-001…049 (repairs).

> **In plain words.** The tool builds your plan in fixed steps. It first checks safety, then whether your goal fits, then builds weeks and sessions from a proven template. A separate checker then inspects every session against the safety limits. If something breaks a limit, the tool fixes it in a fixed order (shorten the run, add a step, move a session). If it still cannot make a safe plan for your goal, it shows you no plan for that goal. It offers a later date, an easier target or a shorter race instead. It never asks you to make up missed runs.

## 1. Rule tiers and conflict resolution

| Tier | Name | Owner modules | Hit policy (DMN-style) | Combinator |
|---|---|---|---|---|
| T0 | SAFETY-STOP: red flags | 10 (routes from 01, 08, 11) | COLLECT | any firing rule → `pause_until_clearance` |
| T1 | SAFETY-GATE: screening, special populations, context modifiers | 01, 10 | COLLECT | most restrictive outcome; numeric: MIN |
| T2 | SAFETY-LIMIT: hard load limits (invariants) | 05, 07, 10, 11 | ALL must hold | numeric caps: MIN |
| T3 | USER: availability, days, hours, blocked dates, horizon | 01, 08 | ALL must hold | intersection |
| T4 | GOAL: demand, feasibility, specificity | 03, 09, 02, 04 | PRIORITY | first by priority |
| T5 | PROGRESSION & STRUCTURE | 04, 05, 06, 08, 02 | PRIORITY | first by priority; numeric caps MIN |
| T6 | PREFERENCES: school preset, long-run day, run-walk, TID | 06, 09, 11, 01 | PRIORITY | first by priority |

- A lower tier never overrides a higher one [opening-systemsarchitect R1]. User constraints (T3) outrank goal specificity: if the goal cannot be met within the stated days/hours, the goal changes, not the runner's week.
- Priorities are `T<tier>.<nnn>`. The **key (tier, nnn) is unique across the whole rule base**; the build fails on a duplicate [hearing-1 §5: equal priority fires in arbitrary order, CORROBORATED]. A module draws `nnn` only from its own block (`CONTRACTS.md §1`) in every tier, so the same `nnn` may recur in *different* tiers (tier is compared first) but never twice in one tier (RESOLUTIONS D4).
- **Floors vs caps inside T5 (v4, p1-A R1).** A T5 *floor* (the baseline hold LOD-005, INV-27) beats T5 *caps* (preset long-run caps, INV-13). It never beats a T0–T3 limit (spike caps, the > 180-min guard, gates, the runner's time and days).
- When two numeric limits apply, the **most conservative wins** (MIN), whatever their tiers. Tier order decides only between *non-numeric* actions.
- A rule whose evidence is ALLEGED/UNKNOWN may block only when it is labelled `default? yes` [opening-systemsarchitect R2].

## 2. Pipeline

`plan = f(profile, goal, log, today, ruleset_version, registry_version)`; no hidden state, no randomness. Each stage writes to the `FiredRuleLog`.

**v5.2 (engine glue).** Written in full, the function is `result = f(input)` where `input` (`spec/schema/input-profile.schema.json`) holds the profile, goal, log, flags, events, `today`, the stored **EngineState** and the parent plan (12 §3.8); `result` (`spec/schema/result.schema.json`) is one of `plan`, `fail_closed`, `gate_stop`, `hold`, `safe_state` (12 §3.12). EngineState is an explicit input, so the function stays pure. Each rule runs at the stage and over the binding given by its `stage` and `scope` (12 §3.5); writes to one target compose by 12 §3.6; each stage repeats to a fixpoint (12 §3.7).

| Stage | Does | Output | Fail exit |
|---|---|---|---|
| S0 Normalise | units (m, s), defaults for "I don't know", confidence flags, plausibility checks (§4) | `NormalisedInput` | — |
| S1 Safety gate | T0/T1 rules of 01 and 10 | `GateOutcome ∈ {proceed, proceed_restricted, pause_until_clearance, no_plan}` + special-population mode | pause/no_plan → generic message, stop |
| S2 State | `DerivedState` S (§3), competence levels (02), tolerance tier, progression profile | `DerivedState` | — |
| S3 Demand & feasibility | 03 (with 02 §5, 09) | `FeasibilityResult` | infeasible → S9 |
| S4 Phases | 04 | `Phase[]` | `PHASES_DO_NOT_FIT` → S9 |
| S5 Template | choose `SchoolPreset` (T6) + `PhaseTemplate`s; resolve parameters: registry → preset → context modifiers (MIN) | `ParentTemplate` | preset incompatible with T3 → default preset + ledger entry |
| S6 Weeks | 05: weekly volume, long-run curve, deload placement (04), key-session count | `Week[]` skeleton | — |
| S7 Sessions | 06 modules chosen by CMP-007 among eligible modules; placed on available days; **v5.2: eight ordered sub-steps S7.1–S7.8, §2b** | `Session[]` | — |
| S8 Validate | independent validator (§5) | `ValidationReport` | violations → S8r |
| S8r Repair | ranked plan repairs (§6.1), ≤ `repair.max_passes` | revised plan → S8 | still failing → S9 |
| S9 Fail closed | ranked goal-level repairs (§6.2), each pre-validated | `RepairOption[]`; **no plan for the requested goal** | — |
| S10 Emit | plan + explanations + `DeviationLedger` + `FiredRuleLog` + confidence labels | `Plan` | — |

```
RULE GEN-001 | priority T2.350 | when S1 outcome = pause_until_clearance or no_plan | then emit no running sessions; show only the generic professional-contact message and the disclaimer | because self-coached users need a hard stop; wellness-product boundary forbids naming a condition | evidence wg4 impl. 1, 7, CORROBORATED; factdesk2 §2, CORROBORATED (boundary) / UNKNOWN (screen status) | basis evidence | default? no
RULE GEN-002 | priority T1.350 | when S1 outcome = proceed_restricted | then all sessions ≤ effort E2 until clearance is attested | because vigorous work waits on clearance when screening is unresolved | evidence wg4 §3 ACSM 2015 / PAR-Q+, CORROBORATED | basis convention | default? no
RULE GEN-003 | priority T4.350 | when S3 verdict = infeasible on volume, long-run, level or phase grounds at first generation, or S4 returns PHASES_DO_NOT_FIT, or S8r exhausts its passes | then go to S9 and never emit a squeezed plan. At a **re-generation**, first try the degraded completion of FEA-043; fail closed only if none exists. Pace-only drift of a time goal is handled by ADP-064 | because a squeezed plan concentrates load, but a safe degraded completion beats abandoning a runner weeks before a race (F-21) | evidence opening-contrarian §1.2; wg4 §1, CORROBORATED (observational); F-21 | basis evidence | default? no
RULE GEN-004 | priority T5.350 | when the same inputs, ruleset_version and registry_version are given | then the output must be byte-identical | because re-planning is a pure function; LLM-style variability is unacceptable | evidence hearing-1 §5, CORROBORATED | basis evidence | default? no
RULE GEN-005 | priority T6.350 | when two eligible session modules tie on every criterion | then choose the lower module ID | because a fixed tie-break keeps output deterministic | evidence opening-systemsarchitect R1, UNKNOWN (design default) | basis design_default | default? yes
```

### 2b. Step S7 in order: choosing and placing the week's sessions (v5.2)

> **In plain words.** For each week the tool first decides how many hard sessions fit, then sets the long run, then picks what each hard session trains, puts the sessions on your days, sets how big each one is, fills the rest with easy running, adds strides and strength, and finally writes the cards you read.

S7 runs once per plan week, in week order, after S6 has fixed the week's phase, `V(w)`, `LR(w)`, deload and taper status. Its eight sub-steps run in this order; each sub-step is a stage of 12 §3.5 (`S7.1` … `S7.8`) and reads only what the earlier ones wrote. The procedures named here are specified in 12 §2b.4.

| Sub-step | Does | Rules (in this order) | Output |
|---|---|---|---|
| **S7.1 Count** | the week's key-session count `k` | SES-007 (method_default count by phase and level) → SES-006 (MIN with the preset count, the run-count term and the phase allowance) → caps LOD-034 (0 in ONBOARD, RTR, TRANSITION, restricted gate), LOD-040 (`deload.quality_max`), CTX-006 (`ctx.lowfreq_quality_max`) | `week.quality_max`, provisional `k` |
| **S7.2 Long run** | the long run's day and content | SES-005 (day) → DST-005 (short family: E1 only) → DST-006 (HM time goal: race-effort segment) → NUT-010 (fuelling practice) → DST-004/NUT-040 (heat exposure on easy runs, never the long run) | `week.long_run` |
| **S7.3 Choose** | the module of each key slot | procedure `choose_key_modules(week, k)`: (v5.3) EXP-003 calibration slots → SES-026 form a/b on the experienced path → DST-002 candidate filter → CMP-007 weighted gap per slot → fallback chain (preset list rotation in BUILD/SPECIFIC, strides; v5.3 experienced path: the threshold family, then the VO2 family) → SES-030 family rotation → DST-018 race-effort override (time goals, SPECIFIC) → SES-012 level-test substitution → SES-016 (deload) / SES-015 (taper) / SES-018 (MAINTAIN) overrides; SES-001 filters every candidate; GEN-005 breaks ties | `slot.module` per slot, ranked |
| **S7.4 Place** | the day of every session | procedure `place_in_order(week, ['long', 'key', 'easy', 'strides', 'strength'])` with SES-004 (hard-day spacing) and SES-005 (days); if no valid placement holds `k` key sessions, `k − 1` and back to S7.3 (the slot ranked last is dropped) | session dates |
| **S7.5 Dose** | the size of every key session | SES-027 (entry and top rung by level, v5.3), SES-011 (next step), SES-028 (planned path in later weeks, v5.3), SES-013 (freeze after a failed test), SES-016 (start size in a deload), SES-015 (taper touch size); then the TID check LOD-033: a slot whose **start** dose does not fit the week's hard or E2 budget is dropped (SES-006 budget term) before any segment is shortened; emits `sessions_set` | `session.segments`, `dose_step` |
| **S7.6 Easy fill** | easy runs | procedure `water_fill(week, lod.min_run_s)` (LOD-031) with LOD-013 (days next to the long run), LOD-016 (volume-carrying long run) | easy sessions |
| **S7.7 Extras** | strides, strength, run-walk | SES-021 (strides on easy runs), SES-022 (hill sprints → strides without hill access), SES-020 (strength), SES-009/SES-010 (run-walk rendering and ratio) | attachments, rendering |
| **S7.8 Render** | the runner's cards | SES-017 (effort first) → FEA-014 (pace only when INV-15 allows) → SES-031/SES-032 (time or distance form, v5.3) → NUT-020 (race-day fuelling) → messages | final `Session[]` |

Priorities follow the order: CMP-007 (T4.110) chooses first and DST-018 (now T4.458, v5.2) overrides afterwards inside the same procedure, so the override is never lost to the PRIORITY hit policy (it was T5.458 below CMP-007 in v5, and could never fire). DST-002's v5 easy-run fallback is replaced by the CMP-007 fallback chain: a key slot never becomes a plain easy run unless strides are not allowed that week (RTR, TRANSITION, an effort ceiling below E3), and then the slot is simply not filled.

**Projection (v5.3, owner decision 7; replaces the v5.2 one-step rule).** A plan is generated weeks ahead, but dose steps, level tests and fuelling steps depend on what the runner logs. Future weeks show each module's **planned dose path**, assuming every session goes as intended: one rung per planned non-deload instance, from the step the log supports (SES-011; the entry rung for a first instance, SES-027), within the level's top rung, the TID budgets and every numeric cap, and never more than `ses.projection_max_steps` (6) rungs above the last logged step (SES-028). The plan carries the label MSG-SES-PROJECTION ("planned progression, if sessions go as intended"). Level tests and fuelling steps are still not projected: they appear only when the log shows readiness. The weekly re-plan (08) restarts the path from the log: a session that felt too hard or was missed holds the path or steps it back, which is a reduction and always allowed (INV-04, ADP-014). Levels never rise inside a projection.

> **In plain words.** From day one you see how your sessions are meant to grow, week by week, if they go as planned. Each Monday the plan is redrawn from what you actually logged.

### 2c. Repair procedure (S8r, v5.2)

1. **Validate** the whole plan (all INV of §5 that apply; S group re-derived, B group from raw fields).
2. If it passes, go to S10. If not, take the **earliest violation**: earliest session date (week start for week-level invariants), then the lowest INV id.
3. Apply the REP record of **lowest rank** whose `fixes` list holds that INV (§6.1 machine records). If that repair cannot change anything (e.g. no free day for REP-003), the next rank whose `fixes` holds the INV is tried.
4. One **pass** = repair every violation dated on that earliest date, then re-validate. At most `repair.max_passes` passes; a plan still failing after the last pass sets `plan.s8r_exhausted` and goes to S9 (GEN-003). Each repair writes a DeviationLedgerEntry; volume removed is dropped (§6.1).
5. A repair on a feasible persona of the grid is a generator defect (parity, TST-092).

## 3. State estimation from a manual log

Owner decision (21 Oct 2026): history comes **only from manual entry**. Runners tick planned sessions as done (actual duration, distance, RPE) or add unplanned runs, and enter their longest recent run at onboarding.

**Derived state** `S = {V7, V28 (time and distance), L30_dist, L30_time, F28 (runs/week), anchors, flags, levels, tol_tier, log_status, profile}`.

**Entry confidence** (`ActivityRecord.confidence`):
- `measured`: entered within `log.contemporaneous_window_h` (48 h) of the session date and not flagged implausible. This is the best grade a manual log can reach.
- `estimated`: onboarding claims, backfilled entries, bulk entries (> `log.bulk_backfill_max` past-dated entries created in one day), flagged entries the user confirmed.
- `unknown`: field left blank or "I don't know".

**Log status** over the last 30 days: `rich` if ≥ `log.min_entries_30d` (3) measured runs and ≥ 2 distinct weeks; `sparse` if ≥ 1 entry or a claim; `none` otherwise.

**L30_eff** (the denominator of every spike cap), decided in this order:

```
RULE GEN-010 | priority T2.351 | when log_status = rich | then L30_eff = max distance (and max duration) of measured, non-flagged runs in the 30 days before the session date; a logged race contributes at most spike.warn_ratio × the pre-race L30_eff (LOD-012) | because this matches the Frandsen exposure as closely as a manual log allows | evidence wg4 §1, factdesk2 §1, CREDIBLE (one cohort; several summaries) (distance exposure) | basis design_default | default? yes
RULE GEN-011 | priority T2.352 | when log_status = sparse | then L30_eff = max(logged measured L30, claim.l30_discount × claimed L30), never above claim.l30_week_ratio_max × claimed weekly distance; set profile = slow for log.probation_weeks; v5 (p2-C R7): while log_status ≠ rich, L30_eff from claims is also ≤ claim.l30_cap_by_tol[tol_tier] (TOL computed from claims, capped per CMP-004); **v5.3: on the experienced path (02 EXP-001) L30_eff = max(logged measured L30, exp.l30_discount × claimed L30), still ≤ claim.l30_week_ratio_max × claimed weekly distance and every spike cap, without the TOL cap and without the slow profile** (owner decisions 1 and 3: the calibration weeks check the claim instead) | because unlogged claims may be inflated; self-reported weekly distance is fairly reliable | evidence opening-contrarian §1.4; opening-executor request 2; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE GEN-012 | priority T2.353 | when log_status = none, or the last run (logged or claimed) is ≥ gap.rtr_trigger_days ago | then L30 is undefined: start the return-to-run ladder of 08/10 at the rung set by prior tolerance and gap length; never use claimed history as the denominator | because Frandsen's handling of no-history and post-gap sessions is unknown (ratio undefined) | evidence factdesk2 §1, UNKNOWN; opening-contrarian §2 | basis design_default | default? yes
RULE GEN-013 | priority T2.354 | when gap.reduce_trigger_days ≤ days since last run < gap.rtr_trigger_days | then first week volume ≤ gap.vol_factor[band] × previous V7 and first long run ≤ gap.long_factor[band] × L30_eff; v3: from the second week back, runs dated before the gap no longer count toward L30_eff (LOD-011, d2-C R5). | because detraining starts within weeks; return bands are expert practice, unverified | evidence wg3 §3, CORROBORATED (direction); factdesk1 §4, UNKNOWN (figures) | basis design_default | default? yes
RULE GEN-014 | priority T5.351 | when log_status ≠ rich or any core input has confidence ≠ measured, and (v5.3) the runner is not on the experienced path (02 EXP-001: standard profile from week 1; EXP-004 falls back if the log disagrees) | then use progression profile slow (05) until log_status = rich for log.probation_weeks consecutive weeks | because unverified history should not unlock fast progression | evidence opening-contrarian §1.4; wg4 impl. 5 slower profile, CORROBORATED | basis design_default | default? yes
```

**Anchors.** Paces are prescribed only from an anchor with `confidence = measured` (a race result or field test entered within `log.contemporaneous_window_h`) younger than `anchor.max_age_days`. Logged training pace never sets an anchor (self-reported pace only moderately reliable [factdesk2 §6, CREDIBLE]). Otherwise the plan is effort-only (talk test [factdesk1 §3; factdesk2 §5, CORROBORATED for continuous running]; novices/run-walk validity UNKNOWN → effort words plus RPE, no pace).

## 4. Plausibility checks on manual entries

```
RULE GEN-020 | priority T2.355 | when an entry's implied pace is outside [log.pace_min_s_per_km, log.pace_max_s_per_km] for its type, or its distance > log.confirm_ratio × L30_eff, or a week's total > log.week_confirm_ratio × max(previous 4 weeks) | then mark the entry implausible, ask the runner to confirm or correct, and exclude it from L30_eff, V28 and level attainment until resolved | because single typos can unlock unsafe caps | evidence opening-contrarian §1.4; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE GEN-021 | priority T2.356 | when a flagged entry is confirmed | then count it with confidence = estimated (it can raise L30_eff only by claim.l30_discount) | because confirmation is still unverified | evidence opening-contrarian §1.4, UNKNOWN (design default) | basis design_default | default? yes
RULE GEN-022 | priority T2.357 | when onboarding claims are internally inconsistent (claimed L30 > claimed weekly distance with F ≥ 2; claimed result age-grade ≥ claim.agegrade_confirm_pct; claimed weekly time inconsistent with weekly distance by > log.pace bounds) | then ask once to confirm; if confirmed, keep as estimated with the slow profile; if unanswered, use the lower value; v5 (p2-C R7): also when training_age_years < ctx.novice_training_age_years and the claimed weekly time is above the TOL 2 band (02 §2) | because inflated claims are the main misuse path | evidence opening-contrarian §1.4; wg3 §1 WMA bands, CORROBORATED | basis design_default | default? yes
RULE GEN-023 | priority T5.352 | when a measured logged run (other than the goal race or a return-ladder session, whose planned distance is null) exceeded spike.warn_ratio × L30_eff (the runner already did it) | then do not block retroactively; show the spike warning and do not raise the next planned long run above the pre-spike L30_eff × spike.warn_ratio | because the cap governs planning; a past spike should not ratchet the plan | evidence wg4 §1, CORROBORATED (observational) | basis design_default | default? yes
```

## 5. Independent validator: invariants

The validator is separate code. It reads only `Plan`, `DerivedState`, `ParameterRegistry`, the previous `Plan` version (for re-plans) and the `GateOutcome`. Every invariant has a test where it fires and one where it does not (14).

### 5a. How independent is the validator? (v4)

Code that calls the same formula as the generator cannot detect an error inside that formula; its independence for that formula is zero. Even separately written versions from one specification fail together on the same hard inputs [hearing-3 sys-acad/sys-field: Knight & Leveson 1986, CORROBORATED]. The v4 validator therefore uses three kinds of check, and states which kind each invariant is:

| Kind | What it means | Independent of the generator's formulas? | Invariants |
|---|---|---|---|
| **B: bound** | A limit stated directly on the output (and on logged data), computed by the validator from raw fields, never by calling a generator function | **yes**, for everything except the parameter values they share | INV-01, 02, 03, 05, 06, 07, 09, 10, 11, 14, 17, 18, 19, 21, 24, 28, 29, 30, 31 (v5.1: INV-31 was missing from this table; its record already says B) |
| **M: metamorphic / property relation** | A relation between outputs of related inputs, checked by the property suite (14 TST-041, TST-076, TST-091) | **yes**: it needs no oracle formula | M-1 … M-8 below |
| **S: shared definition** | The check needs a quantity the generator also computes (L_req, V_req, L_target, V_hold, predicted band) | **no**: it catches assembly, ordering and cap errors, not formula errors | INV-04 (load ordinal), 08, 12, 13, 15, 16, 20, 22, 23, 25, 26, 27 |

Rules for the S group:
- The validator re-derives L_req, V_req, V_hold and the band from the **parameter table and raw `DerivedState` fields with its own short implementation**. It never imports the generator's functions; the formulas are given in 03 §2 and 05 §2–5 as the single specification.
- This makes the S group a second version from the same specification. That is better than shared code, but its failures can still be correlated with the generator's.
- The S-group formulas are additionally covered by the metamorphic relations M-1 … M-8 and by hand-computed golden fixtures (13, TST-075/120/122–125) and, from v5, by an **independent oracle** written from the 03 §2–§4 and 05 §2–§5 text by someone who has not read the generator: (a) demand, (b) weeks_needed and verdict, (c) the long-run curve (TST-110…112, p2-B R10). The oracle must agree with 13's hand values before the S group counts as tested. Differential and metamorphic tests find different defects; neither is claimed superior [factdesk6 §5, CORROBORATED].

**Metamorphic relations** (checked on random profiles; each needs no formula oracle):
- **M-1** More weeks to the race (all else equal) never raises any week's planned volume, long run or ramp, and never worsens the verdict.
- **M-2** More available minutes or days never lowers V_peak, never worsens the verdict, and never adds an AVAILABILITY_* reason.
- **M-3** A higher L30_eff or V28 (measured) never lengthens weeks_needed.
- **M-4** A slower logged easy pace never shortens L_req_time and never shortens any long-run duration target.
- **M-5** Adding a red flag never adds a running session; clearing it never removes a safety gate retroactively.
- **M-6** Replacing a measured anchor by an estimated one never narrows B_fast and never adds a pace range.
- **M-7** Re-running with identical inputs gives a byte-identical plan (GEN-004); permuting the order of same-day events gives the same plan (ADP-012).
- **M-8** Marking a planned session missed never raises any later week's time, distance or long run (INV-04).

**Parity property (p1-A R9).** Every feasible persona in the property grid must validate with **zero repairs**: the generator must build what the validator accepts. A repair on a feasible plan is a generator defect, not a runtime event.

| ID | Tier | Invariant | Severity | Evidence |
|---|---|---|---|---|
| INV-01 | T2 | Planned run distance ≤ `spike.warn_ratio` (1.10) × L30_eff_dist. Runner-edited sessions: warn above 1.10, **block** above `spike.block_ratio` (2.0). Only the **goal race** is exempt (INV-25); tune-up races are checked. Return-ladder sessions carry no planned distance, so only INV-02 binds for them | repair / block | wg4 §1, factdesk2 §1, CREDIBLE (one cohort; several summaries) (observational, distance-only; 1.10 partly chosen from the 10% rule, ALLEGED) → default |
| INV-02 | T2 | Same ratios on **duration** for every session (time on feet incl. walk breaks); binding for run-walk and time-prescribed sessions. **Start-ladder sessions are exempt** (v5.1 consistency fix): their steps follow the published programme (10 §4b, SAF-082), e.g. S6's 30 min after S4's 27 min (+11%); return-ladder (RTR) sessions stay bound | repair / block | factdesk2 §1, UNKNOWN for duration → design default |
| INV-03 | T2 | v2: the day before and the day after a long run are each ≤ min(`two_day.adjacent_ratio` (0.50) × LR, `two_day.cap_ratio` (1.60) × L30_eff − LR). If the prerequisites of DUR L5 hold (DUR L4, TOL L5) and back-to-backs are enabled (DST-010), a pair instead satisfies ≤ `b2b.pair_cap_ratio` (1.75) × L30_eff, with day 2 ≤ `b2b.day2_ratio` (0.60) × day 1 (DST-011) | repair | opening-contrarian I2, ALLEGED; hearing-2 coach-field (day 2 55–60%), CORROBORATED as practice; F-05 → default |
| INV-04 | T2 | **No catch-up = no added time or distance.** After any adaptation, missed time or distance is never added to another day, and future weeks are compared with the parent version **by load ordinal**: the k-th loading week of the new plan ≤ the k-th loading week of the parent, and likewise for deload and taper weeks. Moving a deload therefore never clamps a normal week to the old deload value (F-15). Total planned time over the remaining horizon ≤ the parent's. A missed hard session may *replace* a later easy session of equal or longer duration in the same week (ADP-021). Weeks inside the published window (ADP-014) are unchanged except for reductions. Exempt only on a user-accepted goal change | block | wg4 §1, CORROBORATED; opening-contrarian §1.1; hearing-2 sys, CORROBORATED (frozen window) |
| INV-05 | T0 | Active `RiskFlag` with subkind ∈ `flag.pause_kinds` → zero running sessions from flag date. Subkinds in `flag.professional_kinds` (red flags, persistent pain, REDs escalation) clear only with a professional-clearance attestation dated ≥ `flag.clearance_min_delay_days` after the flag (SAF-021); `illness` clears through 08's return gate with self-attestation (ADP-042). `reds_screen` alone is a freeze, not a pause (SAF-009) | block | wg4 §4, CORROBORATED; opening-contrarian §1.3 |
| INV-06 | T1 | Screening unresolved → no session above E2 | block | wg4 §3, CORROBORATED |
| INV-07 | T1 | Special-population limits hold: minors' distance table, pregnancy maintenance-only, postpartum < `pp.min_weeks` → no plan | block | wg4 §5–6, CORROBORATED (norm/expert) |
| INV-08 | T5 | Taper keeps frequency (≥ `taper.freq_min_ratio` × pre-taper runs/week, race week excepted) and intensity (≥ 1 E3+ touch per non-race taper week if the pre-taper block had one) | repair | wg1 §5 Bosquet, CORROBORATED |
| INV-09 | T2 | No HR zone derived from an age-predicted HRmax; HR zones only from measured HRmax/LTHR | block | wg1 §4, factdesk2 §6, CORROBORATED/CREDIBLE |
| INV-10 | T2 | (static) No rule uses ACWR, monotony or Banister output in a blocking condition | build fail | wg1 §3, wg4 §1, CORROBORATED/CONTRADICTED |
| INV-11 | T5 | Week totals = sum of sessions (time and distance); v5.2: the goal race is listed in its week but not counted in the week's planned time (spec/schema README §6) | block | consistency, N/A (engineering: arithmetic consistency) |
| INV-12 | T5 | Every parameter used resolves to a registry entry with grade and basis | build fail | opening-executor I6, N/A (engineering: build check) |
| INV-13 | T5 | Long run ≤ max(active preset cap, `L_hold`) (v4, p1-A R1); the ultra tune-up is exempt from the ultra time cap only, never from INV-01/02/03 (DST-012) | repair | wg2 §1, CREDIBLE as choice; p1-A case 1 |
| INV-14 | T2 | No implausible or unconfirmed entry contributes to L30_eff, V28 or level attainment | block | §4, N/A (engineering: data-quality rule; GEN-020 thresholds are design defaults) |
| INV-15 | T2 | No pace target from an anchor with confidence ≠ measured (v5.3: or declared, on the experienced path, 03 §3b) or older than `anchor.max_age_days`. Paces only from the 03 §3b pace model (FEA-014), never from the target, logged pace or HR formulas | repair (→ effort) | opening-outsider §2; factdesk2 §6; F-12, CREDIBLE (factdesk2 §6) |
| INV-16 | T5 | Weekly volume increase ≤ active profile ceiling, measured against the last non-deload week if it is ≤ `prog.baseline_max_age_weeks` old, else against the most recent completed week's logged volume (LOD-003/004) | repair | wg4 impl. 3, CORROBORATED figures / weak evidence → default |
| INV-17 | T5 | No two hard days on consecutive days unless the preset declares it (v5.2: hard = a segment at E3 or E4, or the long run, SES-004; strides do not count; v5.3: an all-E1 long run on the experienced path is not hard) | repair | hearing-1 §2 practice, CREDIBLE → default |
| INV-18 | T2 | Race-day fuelling plan ≤ highest intake tolerated in logged training (GI score ≤ `fuel.gi_pass_max`) | repair | wg5 impl. 3, CORROBORATED/CREDIBLE |
| INV-19 | T5 | No deload inside TAPER; no deload when W < `deload.min_plan_weeks` | repair | 04 PHS-002/003, UNKNOWN (design default) |
| INV-20 | T5 | Every session's module prerequisites (02) hold on its date | repair | 02 CMP-006, N/A (engineering: prerequisite graph) |
| INV-21 | T3 | No session on a blocked day; weekly time ≤ stated available hours; runs/week ≤ stated days | repair | criteria C2, N/A (engineering: user constraint) |
| INV-22 | T4 | Every goal or date edit re-ran feasibility; repeated failures logged (§6.3) | block | opening-contrarian I7, N/A (engineering: audit) |
| INV-23 | T6 | Plan within the Knopp normal ranges for its tier, else **flag** (never block) | flag | wg2 §2, CORROBORATED as description |
| INV-24 | T2 | In a pause state, all user-facing safety text comes from the generic message catalogue (no condition names, scores or predictions) | build fail | factdesk2 §2, CORROBORATED (boundary) |
| INV-25 | T4 | Only the **goal race** is exempt from INV-01/02/03; tune-ups are not (DST-012). The plan's peak long run must be ≥ `L_req_time` (time governs, F-14). Wherever distance is known it must also be ≥ `floor_dist = race / race.longest_floor_ratio`; this includes the v3 ultra floors 25 km (50K) and 33.3 km (100K), so a time-capped ultra run below its floor is infeasible, not stretch (d2-C R1). A peak logged this season within `feas.peak_credit_days` counts (FEA-025). A logged race raises L30_eff by at most `spike.warn_ratio` × the pre-race value (LOD-012). Extension runs (DST-019) never count toward demand | block → S9 | factdesk3 §5, factdesk4 §2, CREDIBLE (one cohort; several summaries)/CREDIBLE (longest run vs race-day injury, NYC first-timers); design default |
| INV-26 | T5 | (static) Every active `SchoolPreset` × family declares a % cap (or none), a time cap (or none), an absolute cap (or none), `race.longest_ratio_max` and `race.longest_floor_ratio` for **every** distance of the family (v3: M/HM floors default 2.00/1.60; 50K 2.00; 100K 3.00). Presets with `status = pending_fixture` are never selectable or offered | build fail | Room B R2; d2-B R7; F-02, F-27, N/A (engineering: build check) |
| INV-27 | T5 | Baseline hold: outside deload, taper, transition, RTR and SHARPEN weeks, no planned V or LR is below `V_hold` or `L_hold` unless a T0–T3 limit or a spike cap requires it (LOD-005) | repair | F-04/F-05/F-06; factdesk3 §5, CREDIBLE (one cohort; several summaries) |
| INV-28 | T2 | No run whose **expected duration** (LOD-017: real logged speed, no planning margin) exceeds `lr.long_guard_min` unless TOL L4 is held at confidence `measured`, and for age_high ≥ `masters.vigorous_assessment_age` the SAF-060 attestation exists; such runs are run-walk | repair (cap at 180) | hearing-2 med, UNKNOWN (duration); p1-B R3–R4 |
| INV-29 | T2 | Any two runs with expected duration > `lr.long_guard_min` are ≥ `lr.over180_min_gap_days` apart (a back-to-back pair counts once) (LOD-018) | repair | factdesk4 §4, CORROBORATED (Galloway alternate weeks); p1-B R5 |
| INV-30 | T2 | Minors: every run on date d obeys the caps for `age_low` on d (SAF-044 per session date) | block | wg4 §6, CORROBORATED norm; p1-B R8 |
| INV-31 | T2 | Each goal race is ≥ `race.recovery_days[distance of the previous goal race]` after the previous goal race actually run (logged or planned), across goal changes; TRANSITION after a race survives a goal change (ADP-080) | block → S9 | factdesk6 §1, CORROBORATED as convention (≈ 1 easy day per mile) / CONTRADICTED for ultras → design default; p2-C R8 |

Modules may register further invariants in their own ID ranges (e.g. `NUT-INV-*`), stated in the same table format.

## 6. Repair

### 6.1 Plan-level repairs (S8r), applied in this order on the earliest violating session

| Rank | ID | Action | Fixes |
|---|---|---|---|
| 1 | REP-001 | Clamp the session to the binding limit (shorten distance/duration, lower effort) | INV-01/02/03/13/15/18 |
| 2 | REP-002 | Re-step the progression: repeat the previous long-run length (insert a hold step) and shift later steps by one week | INV-01/02/16 from template step-ups |
| 3 | REP-003 | Move the session to another available day | INV-03/17/21 |
| 4 | REP-004 | Replace a quality session with an easy one of equal or lower duration | INV-06/17/20 |
| 5 | REP-005 | Move a phase boundary by one week (extend BASE, shorten BUILD) within 04's minimums | INV-16/20 |
| 6 | REP-006 | Lower the plan's peak volume / long-run targets to the highest reachable value; re-run feasibility | anything still failing |

Volume removed by a repair is **dropped**, never redistributed beyond the same week's easy sessions, and only if that keeps every invariant. `repair.max_passes` = 3 (design default). Each pass re-runs the full validator.

**Repair records (v5.2, engine glue Q7).** Each rank is a rule with a machine record (op `repair`, 12 §3.3) bound to one validator violation (root `violation`, stage S8r). The procedure of §2c applies them.

```
RULE REP-001 | priority T5.360 | when a validator violation of INV-01, 02, 03, 13, 15, 18, 28, 29 or 30 is the earliest one | then clamp the session to the binding limit: shorten its duration or distance to the limit (rounded down), or remove its pace or effort above the limit | because the smallest change that restores the limit keeps the rest of the plan | evidence 07 §6.1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE REP-002 | priority T5.361 | when the earliest violation is INV-01, 02 or 16 caused by a step-up | then repeat the previous loading step (hold step) and shift the later steps by one week | because a template that rises faster than the caps is held, not squeezed | evidence 07 §7; 05 LOD-014, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE REP-003 | priority T5.362 | when the earliest violation is INV-03, 17 or 21 | then move the session to another available day of the same week that keeps every invariant, the earliest such day first | because a different day often removes the conflict without changing the dose | evidence 07 §6.1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE REP-004 | priority T5.363 | when the earliest violation is INV-06, 07, 17 or 20 on a key session | then replace it with an easy run (SES-M-001) of equal or lower duration | because an easy run is always admissible where a hard one is not | evidence 07 §6.1; 06 SES-002, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE REP-005 | priority T5.364 | when the earliest violation is INV-16 or 20 and the phase minimums of 04 allow it | then move the BASE/BUILD boundary one week later and re-run S6–S7 from that week | because more base weeks lower the required ramp | evidence 07 §6.1; 04 §3, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE REP-006 | priority T5.365 | when a violation remains that no lower rank fixes | then lower the plan's peak volume and long-run targets to the highest values that validate and re-run feasibility (S3) | because a plan must never ship with a broken limit; if the goal no longer fits, S9 offers options | evidence 07 §6.1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
```

```rulexpr
{"id": "REP-001", "condition": "violation.inv_id in ['INV-01', 'INV-02', 'INV-03', 'INV-13', 'INV-15', 'INV-18', 'INV-28', 'INV-29', 'INV-30']", "on_unknown": "fire", "action": {"op": "repair", "rank": 1, "fixes": ["INV-01", "INV-02", "INV-03", "INV-13", "INV-15", "INV-18", "INV-28", "INV-29", "INV-30"], "method": "clamp_to_limit", "then": [{"op": "log_deviation"}]}, "stage": "S8r"}
{"id": "REP-002", "condition": "violation.inv_id in ['INV-01', 'INV-02', 'INV-16'] && violation.week.is_step_up", "on_unknown": "skip", "action": {"op": "repair", "rank": 2, "fixes": ["INV-01", "INV-02", "INV-16"], "method": "hold_step_and_shift", "then": [{"op": "log_deviation"}]}, "stage": "S8r"}
{"id": "REP-003", "condition": "violation.inv_id in ['INV-03', 'INV-17', 'INV-21']", "on_unknown": "skip", "action": {"op": "repair", "rank": 3, "fixes": ["INV-03", "INV-17", "INV-21"], "method": "move_to_free_day", "then": [{"op": "log_deviation"}]}, "stage": "S8r"}
{"id": "REP-004", "condition": "violation.inv_id in ['INV-06', 'INV-07', 'INV-17', 'INV-20'] && violation.session.is_key", "on_unknown": "fire", "action": {"op": "repair", "rank": 4, "fixes": ["INV-06", "INV-07", "INV-17", "INV-20"], "method": "replace_with_easy", "then": [{"op": "log_deviation"}]}, "stage": "S8r"}
{"id": "REP-005", "condition": "violation.inv_id in ['INV-16', 'INV-20']", "on_unknown": "skip", "action": {"op": "repair", "rank": 5, "fixes": ["INV-16", "INV-20"], "method": "move_phase_boundary", "then": [{"op": "log_deviation"}]}, "stage": "S8r"}
{"id": "REP-006", "condition": "violation.unfixed", "on_unknown": "fire", "action": {"op": "repair", "rank": 6, "fixes": ["INV-01", "INV-02", "INV-03", "INV-08", "INV-11", "INV-13", "INV-16", "INV-17", "INV-19", "INV-20", "INV-21", "INV-27", "INV-28", "INV-29", "INV-30"], "method": "lower_peak_targets", "then": [{"op": "regenerate", "from_stage": "S3"}]}, "stage": "S8r"}
```

### 6.2 Goal-level repairs (S9), fail closed

The original goal gets no plan. The runner sees up to `repair.max_options` options, each already generated **and validated**, in this fixed order [opening-systemsarchitect §2]:

1. **Move the date**: the earliest later race date (weekly search up to `goal.date_search_max_weeks`) that passes.
2. **Lower the goal**: slower target time inside the predicted band, then `finish` instead of `time`.
3. **Shorter distance**: the next shorter distance on the original date.
4. **Base plan**: a goal-free BASE/MAINTAIN plan (H0).

Separately labelled "alternative approach": a different school preset (e.g. Higdon-novice-style longer long runs at lower weekly volume) when that alone makes the goal feasible without breaking T0–T2; it is logged as a deviation from the default preset [opening-statusquo R2; wg2 §1, CORROBORATED that novice plans exceed the Daniels cap].

### 6.3 Goal-edit gaming

```
RULE GEN-030 | priority T4.351 | when a goal or date edit is submitted | then re-run S0–S8 and log a GoalEditAttempt with verdict | because feasibility must never be bypassed by editing | evidence opening-contrarian I7, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE GEN-031 | priority T4.352 | when ≥ goal.edit_fail_limit infeasible attempts occurred within goal.edit_window_days | then require a margin of goal.edit_margin_weeks on any later pass and show only the computed options of §6.2 | because boundary-hunting finds plans that pass by a hair | evidence opening-contrarian §2, UNKNOWN (design default) | basis design_default | default? yes
RULE GEN-032 | priority T2.358 | when history claims (L30, weekly volume, PB) are raised after an infeasible verdict | then set them to confidence = estimated and start log.probation_weeks with the slow profile | because inflating claims is the main way to unlock a harder plan | evidence opening-contrarian §1.4, UNKNOWN (design default) | basis design_default | default? yes
```

## 7. Template-first generation and the deviation ledger

S5 picks a **parent template** = school preset × phase templates. The generator only modifies it through rules; every modification writes a `DeviationLedgerEntry {plan_id, week, session_id, field, template_value, plan_value, rule_id, criterion, grade}` [opening-statusquo §3].

Templates are **not trusted**: published long-run progressions often step up by more than 1.10× (Higdon Novice 1: 7 of 9 step-ups if the commonly cited sequence is right [factdesk2 §7, sequence ALLEGED]). Caps apply explicitly through REP-001/002; each clamp or hold step is a ledger entry. Conformance tests (14) check that, for matching inputs, output stays within tolerance of the fixture on everything the caps do not touch.

## 8. Resolved conflicts

| Conflict | Resolution | Where |
|---|---|---|
| No 30-day history / after a gap | L30_eff chain GEN-010…013; undefined → RTR ladder, never claims | §3, 08, 10 |
| Back-to-back long runs pass per-session caps | DUR L5 gate (02); INV-03 pair cap; off by default; ≤ 1 pair per `b2b.min_interval_weeks`; not in deload/taper | 02, 05, 09 |
| Taper vs deload in short plans | PHS-002/003; INV-19 | 04 |
| Goal-date gaming | GEN-030…032; INV-22 | §6.3 |
| Feasibility wants a long run the caps forbid | caps win (T2 > T4); infeasible → §6.2 | §1, 03 |
| Race distance is itself a spike | INV-25 goal-race-only exemption + minimum peak long run + capped L30 contribution (LOD-012) | 03, 05, 09 |
| Mid-plan result makes a time goal unreachable | pace-only drift → ADP-064 (continue, label, offer options); demand infeasibility → GEN-003 fail closed | 07, 08 |
| Illness or pause late in a plan (v2) | remaining phases only, peak credit, degraded completion (FEA-025/043) | 03, 08 |
| Re-plan oscillation on noisy inputs (v2) | published window (ADP-014), pace deadband (FEA-014), load-ordinal INV-04 | 03, 07, 08 |
| Preset cap below the runner's current long run (v2) | baseline hold (LOD-005, INV-27); caps stop growth, never force regression | 05 |
| Same symptom handled by two modules | 10 alone raises red-flag/illness/pain/REDs flags; 01, 08, 11 rules only route answers to 10's questions (RESOLUTIONS D6) | 01, 08, 10, 11 |
| Daniels cap vs novice marathon | v2: method_default road_classic is "classic-capped" (0.50 of weekly time, 180 min, 32 km; ratio 1.40, floor 2.00); Daniels is opt-in (RESOLUTIONS Round 1) | 03, 05, 09 |
| Template step-ups > 1.10× | REP-002 hold steps + ledger | §7 |
| Self-reported history inflation | confidence flags, plausibility checks, probation, slow profile | §3–4 |
| Deload vs ramp targets | progression measured from last non-deload week (INV-16) | 05 |
| Context modifiers disagree | MIN for numbers, most restrictive gate | §1, 01 |

## 9. Outputs and explanations

**Three display layers (v4, p1-C R8).**
1. **Card** (default): the effort word, the duration (or the "whichever comes first" stop), and one plain `why` sentence. Paces only if INV-15 allows. Numbers are rounded by `display.*` (messages.md §0).
2. **"Why?"** (one tap): the reasons behind the session or verdict (at most 2 on the card, all here), each with its evidence wording from messages.md §4: a plain sentence, plus a numeric range where one exists.
3. **Coach view** (opt-in): rule IDs, grades and bases, the deviation ledger, the fired-rule log and input confidences.

Rule IDs, internal reason codes and parameter names never appear on layers 1–2 (ADP-013 change lists use plain text from messages.md). ESTIMATED_INPUTS is a confidence label on layer 1, not a verdict reason.


Each emitted session carries `why` (one plain sentence from the message catalogue), its effort level, pace only if INV-15 allows, the rule IDs that shaped it, and the user-facing grade label (00 §5). Each plan carries its deviation ledger, a fired-rule log, and the confidence of every input it used. A plan built on any `estimated` core input shows "based partly on your estimates — log your runs to sharpen it".

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "GEN-001", "condition": "state.gate in ['pause_until_clearance', 'no_plan']", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.is_run", "until": "state.gate in ['proceed', 'proceed_restricted']", "msg": "MSG-SAF-001"}}
{"id": "GEN-002", "condition": "state.gate == 'proceed_restricted'", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "effort_rank(s.effort_target) >= effort_rank('E3')", "until": "has(screen.clearance_attested_on)"}}
{"id": "GEN-003", "condition": "(feas.verdict == 'infeasible' && !plan.is_regeneration) || feas.s4_phases_do_not_fit || plan.s8r_exhausted", "on_unknown": "fire", "action": {"op": "fail_closed", "reasons_expr": "feas.reasons", "then": [{"op": "generate_options", "order": ["change_availability", "change_availability+move_date", "move_date", "lower_goal", "shorter_distance", "base_plan", "alternative_preset"]}]}}
{"id": "GEN-004", "condition": "true", "on_unknown": "fire", "action": {"op": "constraint", "check": "test: hash(output) == hash(output') for equal inputs, ruleset_version, registry_version (TST determinism)"}, "status": "static"}
{"id": "GEN-005", "condition": "event.type == 'tie'", "on_unknown": "skip", "action": {"op": "set", "target": "slot.module", "expr": "min(tied.module_ids)"}}
{"id": "GEN-010", "condition": "state.log_status == 'rich'", "on_unknown": "skip", "action": {"op": "set", "target": "state.L30_eff_time_s", "expr": "max_or_zero(log.measured_ok_runs_30d, x, x.duration_s)", "then": [{"op": "set", "target": "state.L30_eff_dist_m", "expr": "max_or_zero(log.measured_ok_runs_30d, x, x.distance_m)"}]}}
{"id": "GEN-011", "condition": "state.log_status == 'sparse'", "on_unknown": "fire", "action": {"op": "set", "target": "state.L30_eff_dist_m", "expr": "min(max(state.logged_l30_dist_m, (state.exp_path in ['calibrating', 'confirmed'] ? p('exp.l30_discount') : p('claim.l30_discount')) * claim.L30_distance_m), p('claim.l30_week_ratio_max') * claim.weekly_distance_m)", "then": [{"op": "cap", "target": "state.L30_eff_time_s", "expr": "unit.min_s * p('claim.l30_cap_by_tol')[state.tol_tier]", "when": "!(state.exp_path in ['calibrating', 'confirmed'])"}, {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "when": "!(state.exp_path in ['calibrating', 'confirmed'])"}, {"op": "emit_message", "msg": "MSG-L30-SPARSE"}]}}
{"id": "GEN-012", "condition": "state.log_status == 'none' || state.days_since_last_run >= p('gap.rtr_trigger_days')", "on_unknown": "fire", "action": {"op": "insert_phase", "phase": "RTR", "rung_expr": "rtr_entry_rung(state.prior_tol_tier, state.days_since_last_run)", "then": [{"op": "set", "target": "state.L30_source", "expr": "'undefined_rtr'"}]}}
{"id": "GEN-013", "condition": "state.days_since_last_run >= p('gap.reduce_trigger_days') && state.days_since_last_run < p('gap.rtr_trigger_days')", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "p('gap.vol_factor.' + gap_band(state.days_since_last_run)) * state.V7_prev_time_s", "then": [{"op": "cap", "target": "week.lr_s", "expr": "p('gap.long_factor.' + gap_band(state.days_since_last_run)) * state.L30_eff_time_s"}]}}
{"id": "GEN-014", "condition": "(state.log_status != 'rich' || exists(state.core_inputs, i, i.confidence != 'measured')) && !(state.exp_path in ['calibrating', 'confirmed'])", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "until": "state.rich_weeks_consecutive >= p('log.probation_weeks')"}}
{"id": "GEN-020", "condition": "entry.pace_s_per_km < p('log.pace_min_s_per_km') || entry.pace_s_per_km > p('log.pace_max_s_per_km.' + entry.type) || entry.distance_m > p('log.confirm_ratio') * state.L30_eff_dist_m || week.logged_total_s > p('log.week_confirm_ratio') * state.max_prev4_week_s", "on_unknown": "fire", "action": {"op": "flag_entry", "target": "entry", "exclude_from": ["L30_eff", "V28", "level_attainment"], "then": [{"op": "ask_confirm", "field": "entry", "max_asks": 1, "msg": "MSG-GEN-CONFIRM"}]}}
{"id": "GEN-021", "condition": "entry.plausibility == 'confirmed'", "on_unknown": "skip", "action": {"op": "set", "target": "entry.confidence", "expr": "'estimated'", "then": [{"op": "set", "target": "entry.l30_weight", "expr": "p('claim.l30_discount')"}]}}
{"id": "GEN-022", "condition": "(claim.L30_distance_m > claim.weekly_distance_m && claim.runs_per_week >= p('claim.l30_check_min_runs')) || claim.agegrade_pct >= p('claim.agegrade_confirm_pct') || claim.time_distance_inconsistent || (profile.training_age_years < p('ctx.novice_training_age_years') && claim.weekly_time_s > state.tol2_band_high_s)", "on_unknown": "fire", "action": {"op": "ask_confirm", "field": "claim", "max_asks": 1, "on_no_answer": "use_lower_value", "then": [{"op": "set", "target": "state.progression_profile", "expr": "'slow'"}]}}
{"id": "GEN-023", "condition": "entry.is_measured && !entry.is_goal_race && entry.ladder == 'none' && entry.distance_m > p('spike.warn_ratio') * state.pre_entry_L30_eff_dist_m", "on_unknown": "fire", "action": {"op": "cap", "target": "next_long_run.planned_distance_m", "expr": "p('spike.warn_ratio') * state.pre_entry_L30_eff_dist_m", "msg": "MSG-GEN-SPIKE"}}
{"id": "GEN-032", "condition": "event.claims_raised && state.last_verdict == 'infeasible'", "on_unknown": "fire", "action": {"op": "set", "target": "claim.confidence", "expr": "'estimated'", "then": [{"op": "set", "target": "state.progression_profile", "expr": "'slow'"}, {"op": "set", "target": "state.probation_until", "expr": "date_add(today, unit.week_d * p('log.probation_weeks'))"}]}}
{"id": "GEN-030", "condition": "event.type == 'goal_edit_submitted'", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S0", "then": [{"op": "record_event", "kind": "goal_edit"}]}}
{"id": "GEN-031", "condition": "count(goal.edits, e, e.verdict == 'infeasible' && days_between(e.submitted_at, today) <= p('goal.edit_window_days')) >= p('goal.edit_fail_limit')", "on_unknown": "fire", "action": {"op": "set", "target": "feas.required_margin_weeks", "expr": "p('goal.edit_margin_weeks')", "then": [{"op": "generate_options", "order": ["move_date", "lower_goal", "shorter_distance", "base_plan"]}]}}
```

### Invariant assertions (v5)

Each line holds `id`, `assert` (must be true for every emitted plan) and the validator class `check` (B bound, S shared definition; M relations live in 14). `static:` and `flag_only:` assertions are build lints, not runtime expressions.

```rulexpr-inv
{"id": "INV-01", "assert": "all(plan.sessions, s, s.is_goal_race || !has(s.planned_distance_m) || s.planned_distance_m <= p('spike.warn_ratio') * l30_dist(s.date))", "check": "B"}
{"id": "INV-02", "assert": "all(plan.sessions, s, s.is_goal_race || s.ladder == 'start' || s.planned_duration_s <= p('spike.warn_ratio') * l30_time(s.date))", "check": "B"}
{"id": "INV-03", "assert": "all(plan.long_runs, lr, lr.is_b2b_pair || all(adjacent(lr), d, d.planned_duration_s <= min(p('two_day.adjacent_ratio') * lr.planned_duration_s, p('two_day.cap_ratio') * l30_time(lr.date) - lr.planned_duration_s)))", "check": "B"}
{"id": "INV-04", "assert": "event.goal_changed || all(plan.future_weeks, w, w.planned_time_s <= parent_week(w).planned_time_s && w.lr_s <= parent_week(w).lr_s)", "check": "S"}
{"id": "INV-05", "assert": "all(flags.active, f, !(f.subkind in p('flag.pause_kinds')) || count(plan.sessions, s, s.date >= f.raised_on && s.is_run) == 0)", "check": "B"}
{"id": "INV-06", "assert": "state.gate != 'proceed_restricted' || all(plan.sessions, s, effort_rank(s.effort_target) <= effort_rank('E2'))", "check": "B"}
{"id": "INV-07", "assert": "all(plan.sessions, s, (profile.special_status != 'pregnant' || (effort_rank(s.effort_target) <= effort_rank(p('pregnancy.max_effort')))) && (age_low(s.date) >= p('minor.adult_age') || !s.is_b2b_pair)) && (profile.special_status != 'pregnant' || all(plan.weeks, w, w.planned_time_s <= p('pregnancy.vol_cap_ratio') * state.V28_at_status_start_s))", "check": "B"}
{"id": "INV-08", "assert": "all(plan.taper_weeks, w, w.is_race_week || (w.runs >= p('taper.freq_min_ratio') * plan.pre_taper_runs && (!plan.pre_taper_had_e3 || w.has_e3_touch)))", "check": "S"}
{"id": "INV-09", "assert": "all(plan.sessions, s, !has(s.hr_zone) || s.hr_source in ['hrmax_measured', 'lthr_measured'])", "check": "B"}
{"id": "INV-10", "assert": "static: no blocking condition references acwr, monotony, strain, banister or an age-predicted HRmax", "check": "B"}
{"id": "INV-11", "assert": "all(plan.weeks, w, w.planned_time_s == sum(w.sessions, s, s.is_goal_race ? 0 : s.planned_duration_s))", "check": "B"}
{"id": "INV-12", "assert": "static: every p() id resolves to a registry entry with a grade or basis eng", "check": "S"}
{"id": "INV-13", "assert": "all(plan.long_runs, lr, lr.planned_duration_s <= max(preset_cap(lr), state.L_hold_s))", "check": "S"}
{"id": "INV-14", "assert": "all(state.denominator_entries, e, e.plausibility != 'flagged')", "check": "B"}
{"id": "INV-15", "assert": "all(plan.sessions, s, !has(s.pace_range) || ((anchor.confidence == 'measured' || (anchor.confidence == 'declared' && state.exp_path in ['calibrating', 'confirmed'])) && days_between(anchor.date, s.date) <= p('anchor.max_age_days')))", "check": "S"}
{"id": "INV-16", "assert": "all(plan.loading_weeks, w, w.planned_time_s <= (1 + p('prog.' + state.progression_profile + '.week_max')) * baseline(w))", "check": "S"}
{"id": "INV-17", "assert": "all(plan.sessions, s, !(s.is_hard && s.next_day_is_hard) || preset.consecutive_hard_allowed)", "check": "B"}
{"id": "INV-18", "assert": "!has(plan.race_fuel_g_h) || plan.race_fuel_g_h <= state.max_tolerated_g_h", "check": "B"}
{"id": "INV-19", "assert": "count(plan.taper_weeks, w, w.is_deload) == 0 && (plan.W >= p('deload.min_plan_weeks') || count(plan.weeks, w, w.is_deload) == 0)", "check": "B"}
{"id": "INV-20", "assert": "all(plan.sessions, s, prereqs_hold(module(s.module_id), s.date))", "check": "S"}
{"id": "INV-21", "assert": "all(plan.sessions, s, weekday(s.date) in profile.available_days && !(s.date in profile.blocked_dates)) && all(plan.weeks, w, w.planned_time_s <= unit.min_s * profile.available_minutes_per_week && w.runs <= profile.max_runs_per_week)", "check": "B"}
{"id": "INV-22", "assert": "all(goal.edits, e, e.feasibility_rerun == true)", "check": "S"}
{"id": "INV-23", "assert": "flag_only: plan.peak_week_time_s within p('knopp.range') for its tier", "check": "S"}
{"id": "INV-24", "assert": "static: every message of a T0/T1 rule has is_safety_generic == true", "check": "B"}
{"id": "INV-25", "assert": "(plan.peak_lr_s >= demand.L_req_time_s - p('load.round_down_s') && (!has(plan.peak_lr_dist_m) || plan.peak_lr_dist_m >= demand.floor_dist_m)) || demand.met_by_logged_distance || demand.credited", "check": "S"}
{"id": "INV-26", "assert": "static: every active preset x family declares pct, time and absolute caps, longest_ratio_max and longest_floor_ratio", "check": "S"}
{"id": "INV-27", "assert": "all(plan.loading_weeks, w, w.planned_time_s >= min(state.V_hold_s, t0t3_limit(w)) && w.lr_s >= min(state.L_hold_s, spike_cap(w), t0t3_limit(w)))", "check": "S"}
{"id": "INV-28", "assert": "all(plan.sessions, s, s.expected_duration_s <= unit.min_s * p('lr.long_guard_min') || (state.tol_level >= p('lr.long_guard_tol_level') && state.tol_confidence == 'measured' && s.run_walk && (age_high(s.date) < p('masters.vigorous_assessment_age') || has(screen.saf060_attested_on))))", "check": "B"}
{"id": "INV-29", "assert": "all(pairs(plan.over_guard_runs), a, b, same_pair(a, b) || abs(days_between(a.date, b.date)) >= p('lr.over180_min_gap_days'))", "check": "B"}
{"id": "INV-30", "assert": "all(plan.sessions, s, age_low(s.date) >= p('minor.adult_age') || s.planned_distance_m <= p('minor.lr_cap_ratio') * unit.km_m * p('minor.max_race_km.recommended')[age_low(s.date)])", "check": "B"}
{"id": "INV-31", "assert": "!has(state.last_goal_race_date) || days_between(state.last_goal_race_date, goal.race_date) >= p('race.recovery_days')[state.last_goal_race_distance]", "check": "B"}
```

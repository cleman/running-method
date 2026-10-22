# 08 — Adaptation rules (v5.1; v1 author D, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria **6** (adaptation and re-planning), **7** (safety on every re-plan), **5** (deterministic). Rules ADP-001…099; priority block `nnn` 400–449 in every tier. Companions: `CONTRACTS.md`, 07, 10, 12, `parameters.md`.

> **In plain words.** When you miss runs, get ill, feel run down, have a niggle, race, or your week changes, the tool rebuilds the rest of your plan from today. Missed runs are dropped, never "made up". The plan changes only when a signal repeats, not after one odd day. Some symptoms stop the plan until you have talked to a health professional.

Adaptation means **re-measure and re-plan**; it is not claimed to prevent injury [factdesk1 §5, CORROBORATED that evidence is absent; wg4 §1 Buist, CORROBORATED].

## 1. Events and detection from a manual log

| `AdaptationEvent.kind` | Detected from | § |
|---|---|---|
| `missed_session` / `partial_session` | date passed with no linked entry / entry shorter than `miss.partial_ratio` × planned | 3 |
| `unlogged_week` *(proposed)* | whole calendar week with zero entries and no report | 1 |
| `gap` | `days_since_last_run` ≥ `gap.reduce_trigger_days` | 4 |
| `illness`, `pain`, `fatigue` | report; `pain_0_10`; RPE excess, "tired" tap, early stop | 5–6 |
| `result` | new `PerformanceAnchor` | 7 |
| `availability_change`, `life_change`, `goal_change` | profile edit, busy week, night shift, goal edit | 8–9 |
| `red_flag` | any answer in 10's symptom catalogue | 10 |

**An unlogged week is neither missed nor rest**: silence lowers confidence instead.

```
RULE ADP-001 | priority T5.400 | when a planned Session's date is more than log.contemporaneous_window_h past, nothing links to it, and ≥ 1 ActivityRecord exists that week | then Session.status = missed; create AdaptationEvent(missed_session) | because a manual log can call a session missed only while the runner is visibly logging | evidence 12 §4; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE ADP-002 | priority T5.401 | when a linked entry has duration_s < miss.partial_ratio × planned_duration_s | then Session.status = partial; keep actual values | because actual, not planned, load feeds the state | evidence wg1 §3 session RPE × time, CORROBORATED | basis design_default | default? yes
RULE ADP-003 | priority T2.402 | when a calendar week ends with zero ActivityRecords and no illness, pain or availability report | then Week.log_state = unlogged, its sessions unlogged (not missed); recompute DerivedState from measured entries; count days_since_last_run from the last logged run; start log.probation_weeks of the slow profile (GEN-014); show MSG-ADP-UNLOGGED | because unverified history must not unlock progression | evidence opening-contrarian §1.4; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE ADP-004 | priority T2.403 | when the runner answers "I ran but did not log" and enters the runs | then store them as source = backfill, confidence = estimated; they end the gap but raise L30_eff only via claim.l30_discount (GEN-021) | because backfill is recall, not a contemporaneous record | evidence 07 GEN-021; factdesk2 §6, CREDIBLE/UNKNOWN | basis design_default | default? yes
```

## 2. Re-plan procedure

> **In plain words.** What you did is fixed. From today the tool re-checks safety, re-measures your fitness from your log and rebuilds the remaining weeks. A checker confirms no future week got bigger than before.

Record → freeze past (`Week.frozen`) → S0–S2 (T0/T1 re-run on every event) → S3–S10 from today, same versions → validate with the parent as INV-04 reference → emit `Plan(version + 1, parent_plan_id)`.

```
RULE ADP-010 | priority T5.404 | when any AdaptationEvent is recorded | then freeze the past, create Plan(version + 1, parent_plan_id), re-run 07 S0–S10 from today | because re-planning is a pure function of state | evidence 07 GEN-004; hearing-1 §5, CORROBORATED | basis evidence | default? no
RULE ADP-011 | priority T2.405 | when any future week's planned time, distance or long run exceeds the parent version's value for that week | then clamp to the parent value (REP-001) and log the deviation, except under ADP-080 | because catch-up concentrates load into spikes | evidence wg4 §1 Frandsen, CREDIBLE (one cohort; several summaries) (observational); opening-contrarian §1.1 | basis design_default | default? yes
RULE ADP-012 | priority T5.406 | when several events fall on the same day | then process them in one re-plan ordered by tier, then kind (red_flag, illness, pain, gap, fatigue, missed, partial, unlogged_week, availability, life, result, goal), then id | because a fixed order keeps output deterministic | evidence hearing-1 §5, CORROBORATED (equal priority fires arbitrarily) | basis design_default | default? yes
RULE ADP-013 | priority T6.407 | when a new version is emitted | then show MSG-ADP-CHANGED listing each changed session in plain words (what changed, from what to what, and the plain reason text from messages.md); rule IDs appear only in the coach view (07 §9) | because self-coached runners must see why the plan moved, without engine jargon (p1-C R8) | evidence criteria C12; opening-outsider §3, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE ADP-014 | priority T5.444 | when a re-plan is computed | then sessions inside the published window (today + replan.published_days) keep their date, type and dose unless a T0–T2 rule or a reduction (missed, partial, pain, fatigue, illness, availability) changes them; increases and reshuffles start after the window; changes to paces need the 03 §3b step 4 bands (deadband, confirmation, minimum detectable change; v5.1) | because rolling re-planning on noisy self-reports oscillates; a frozen/published window and a deadband are the established stabilisers | evidence hearing-2 sys-acad (frozen horizon, Blackburn 1986), CORROBORATED; hearing-2 sys-field (published window, 7-day lock), CORROBORATED general / ALLEGED vendor | basis design_default | default? yes
```

## 3. Missed and partial sessions

> **In plain words.** A missed run is gone; it is not squeezed into another day. If you missed most of a week, next week repeats your last full week instead of stepping up.

```
RULE ADP-020 | priority T2.408 | when Session.status ∈ {missed, partial} | then drop the missing part: no session is added, lengthened or intensified to recover it; the long-run curve is recomputed from L30_eff | because moving missed load forward produces spikes linked to injury | evidence wg4 §1, CORROBORATED (observational); 07 INV-04 | basis evidence | default? no
RULE ADP-021 | priority T5.409 | when a session ≥ E3 is missed, a later easy session in the same week has planned_duration_s ≥ the missed one, and swapping keeps INV-03/17/21 | then offer once to swap them (replace, never add) | because keeping one quality stimulus is acceptable when no volume is added | evidence hearing-1 §2 shared core, CORROBORATED; design default | basis design_default | default? yes
RULE ADP-022 | priority T5.410 | when a week with log_state ≠ unlogged has completed time < miss.repeat_week_ratio × planned, or its long run was missed or partial | then next week repeats the last fully completed comparable week (hold_step); INV-16 measures from it. ADP-022 never fires on an unlogged week (ADP-003 handles those) | because progression must rest on load actually carried; repeatable weeks are standard beginner practice | evidence wg3 impl. 4, CORROBORATED; opening-statusquo R3–R4; F-16 | basis design_default | default? yes
RULE ADP-023 | priority T4.411 | when ADP-022 fired in 2 consecutive weeks | then re-run feasibility (03) counting remaining phases only (FEA-025); if infeasible, use the degraded completion (FEA-043) when one exists, else show 07 §6.2 options | because lost weeks may no longer fit the date, but a safe completion should be kept | evidence opening-contrarian §1.1; F-21, UNKNOWN (design default) | basis design_default | default? yes
RULE ADP-024 | priority T3.412 | when completed time < miss.repeat_week_ratio × planned for miss.fit_check_weeks consecutive weeks | then ask MSG-ADP-FIT offering fewer days or minutes; never raise the plan to compensate | because a plan that keeps failing loses runners | evidence hearing-1 §2, CORROBORATED (attrition 42–53%); wg3 §5, CREDIBLE (C25K 27%, Relph 2023, single study) | basis design_default | default? yes
```

## 4. Gaps and return to running

> **In plain words.** A few days off change nothing. One to four weeks off means a lighter first week back. A month or more off starts the return-to-run steps: short runs mixed with walking.

Detraining starts within weeks and plateaus near 4 weeks in trained athletes [wg3 §3, CORROBORATED, trained only]; Daniels' return figures are unchecked [factdesk1 §4, ALLEGED/UNKNOWN]; Frandsen's handling of post-gap runs is unknown [factdesk2 §1, UNKNOWN]. All band values are design defaults.

| Band | `days_since_last_run` | Action |
|---|---|---|
| G0 | < `gap.reduce_trigger_days` | resume at current week |
| G1 / G2 | 8–14 / 15–29 | GEN-013 factors for the first week; G2 adds slow profile |
| G3 | ≥ `gap.rtr_trigger_days` | L30 undefined → RTR via 10's ladder |

```
RULE ADP-035 | priority T2.445 | when the runner is on the start ladder and has not run for gap.reduce_trigger_days or more | then 8–14 days: repeat the last completed rung; 15–29 days: drop one rung (not below S1); ≥ gap.rtr_trigger_days: re-enter through SAF-080 | because the start ladder needs its own gap rule; the gap bands assume an L30 that a ladder runner does not have (p1-B R2) | evidence factdesk1 §1, CORROBORATED (structure); factdesk4 §9, UNKNOWN (values) → design default | basis design_default | default? yes
RULE ADP-030 | priority T2.413 | when days_since_last_run < gap.reduce_trigger_days | then resume at the current calendar week; ADP-020 drops the missed days | because a short break needs no reduction and must not trigger catch-up | evidence factdesk1 §4, ALLEGED; wg3 §3, CORROBORATED (direction) | basis design_default | default? yes
RULE ADP-031 | priority T2.414 | when gap.reduce_trigger_days ≤ days_since_last_run < gap.rtr_trigger_days | then apply GEN-013 to the first week back; if the gap is in band .15_29 set the slow profile for log.probation_weeks; re-run feasibility | because return cuts are expert practice, unverified | evidence wg1 impl. 8, CREDIBLE; factdesk1 §4, UNKNOWN | basis design_default | default? yes
RULE ADP-032 | priority T2.415 | when days_since_last_run ≥ gap.rtr_trigger_days | then L30 undefined (GEN-012); 04 inserts RTR; 10's rtr.ladder starts at the rung set by pre-gap tol_tier and gap length; feasibility re-runs with rtr_needed | because the spike ratio is undefined after a gap | evidence factdesk2 §1, UNKNOWN; factdesk1 §1, CORROBORATED (walk–run structure) | basis design_default | default? yes
RULE ADP-033 | priority T5.416 | when a gap ends | then apply CMP-003 decay; anchors older than anchor.max_age_days give effort-only prescription; offer a field test after the first full week back | because fitness falls with inactivity and old anchors overstate pace | evidence wg3 §3, CORROBORATED; opening-outsider §2 | basis design_default | default? yes
RULE ADP-034 | priority T1.417 | when the gap was caused by illness, pain or a red flag | then §5, §6 or 10 gate first; gap bands set the dose afterwards | because the cause decides the gate | evidence wg4 impl. 8–9, CORROBORATED | basis evidence | default? no
```

## 5. Illness

> **In plain words.** With a fever, or symptoms in your chest, stomach or whole body, do not run; come back gently after several symptom-free days. A cold with only a runny nose and no fever allows short easy runs. Chest pain, fainting or a racing heart: stop and seek medical help.

The return gate follows Elliott 2020: ≥ 10 days' rest, ≥ 7 days symptom-free, then ~15 min light activity [wg4 §5, CORROBORATED for prerequisites and stage 1]. It was written for COVID; using it for every feverish illness is an **extrapolation**, kept as the most conservative graded source. The "neck check" is common practice but untrialled [hearing-1 §3], so it is used only to restrict.

```
RULE ADP-040 | priority T0.418 | when an illness report includes chest pain, fainting, palpitations or disproportionate breathlessness | then raise RiskFlag(red_flag) through 10's cardiac rule: pause_until_clearance, urgent generic message | because exertional cardiac symptoms after viral illness are stop-and-refer signs | evidence wg4 §4, CORROBORATED | basis evidence | default? no
RULE ADP-041 | priority T1.419 | when an illness report includes fever or below-the-neck symptoms (chest, breathing, stomach, aches all over) | then present 10's questions I1–I2; SAF-007 alone raises RiskFlag(illness): no running; show MSG-ADP-ILL-STOP | because fever or systemic symptoms mean no training | evidence wg4 impl. 9, CORROBORATED | basis evidence | default? no
RULE ADP-042 | priority T1.420 | when RiskFlag(illness) is active | then keep it until days since onset ≥ illness.rest_days_min and the runner attests ≥ illness.symptom_free_days symptom-free; the first session back is E0–E1 ≤ illness.stage1_min; then the dose is set by the gap since the last run: < gap.rtr_trigger_days → gap bands (ADP-030/031); ≥ gap.rtr_trigger_days → ladder at R0 (10 §4) | because Elliott's prerequisites are the best graded gate; a short illness does not need a full return ladder (F-22) | evidence wg4 §5, CORROBORATED (extrapolated beyond COVID) / UNKNOWN (later stages) | basis design_default | default? yes
RULE ADP-043 | priority T1.421 | when only above-the-neck symptoms and no fever are reported | then proceed_restricted while they last: E1 only, ≤ illness.above_neck_dur_ratio × planned, no key session; worsening → ADP-041 | because the neck check is untrialled practice, so it only restricts | evidence hearing-1 §3, CORROBORATED as practice | basis design_default | default? yes
RULE ADP-044 | priority T1.422 | when RiskFlag(illness) is active on a race date | then label the race "not recommended by this plan" (MSG-ADP-ILL-RACE); add no load | because the same gate applies to racing | evidence wg4 impl. 9, CORROBORATED; factdesk2 §2 | basis evidence | default? no
```

## 6. Pain and fatigue

> **In plain words.** Mild pain (3/10 or less) that settles within a day and is gone next morning: keep training, but the plan stops stepping up. More than that: a day off, then one step back. A sore spot on a bone, pain at night or limping stops the plan until a professional has checked you. Feeling unusually tired twice in a week makes the next hard session easy; weeks of tiredness add a lighter week and suggest a check-up.

**Pain.** Published thresholds conflict [factdesk1 §2, CONTRADICTED]; the next-morning rule is in every source [CORROBORATED]. `pain.during_max` = 3 is a design default; the model is never applied to suspected bone stress [factdesk1 §1–2].

**Fatigue signals** are counted, not modelled: no ACWR, monotony or Banister gate (INV-10) [wg1 §3, CONTRADICTED/ALLEGED]; no HRV (no device data). A signal is: (a) session RPE ≥ `rpe.expected_by_effort` + `fatigue.rpe_excess`; (b) an "unusually tired" tap; (c) a session stopped early for fatigue; (d) a night shift or short sleep reported for the night before. Load changes need a consistent pattern [hearing-1 §5, CORROBORATED] — hysteresis.

```
RULE ADP-050 | priority T0.423 | when a pain report answers yes to any of 10's bone-stress questions (sore spot on a bone, pain at rest or night, pain rising during the run, limping, pain on hopping) | then route to 10: pause_until_clearance; the pain model is not applied | because suspected bone stress needs professional clearance | evidence factdesk1 §1, CORROBORATED (sites) / CREDIBLE (signs); wg4 impl. 8 | basis evidence | default? no
RULE ADP-051 | priority T5.424 | when pain_0_10 ≤ pain.during_max, settled within 24 h and absent next morning (pain.next_morning_rule) | then continue but hold_step this week and next | because the model allows activity; holding load is the conservative reading of "no worse week to week" | evidence factdesk1 §2, CORROBORATED (structure) / ALLEGED (weekly rule) | basis design_default | default? yes
RULE ADP-052 | priority T1.425 | when pain_0_10 > pain.during_max or pain is present next morning | then no running next day, then drop back to the last completed step, all sessions ≤ E2, until pain.clear_sessions consecutive sessions meet ADP-051 | because "rest a day, go back one stage" is the common return structure | evidence factdesk1 §1, CORROBORATED; §2 thresholds CONTRADICTED → conservative | basis design_default | default? yes
RULE ADP-053 | priority T0.426 | when pain_0_10 ≥ pain.severe_min, or ADP-052 fires in pain.persist_sessions consecutive sessions, or ADP-052 fires ≥ pain.recur_count times within pain.recur_window_days (non-consecutive), or the runner limps | then route to 10: bone-stress questions first (SAF-002), otherwise SAF-011 raises the pain flag; pause_until_clearance, generic message | because persistent, severe or recurring pain is outside what a self-coached tool may manage; recurrence mirrors SAF-010 and the injury definitions that count restricted sessions (p1-B R6) | evidence hearing-1 §3, CORROBORATED; hearing-3 med-acad, CORROBORATED (Yamato 2015: ≥ 7 days or 3 consecutive sessions) / ALLEGED (non-consecutive versions); hearing-3 med-field, CORROBORATED (recurrence at the same site → refer); count threshold UNKNOWN → design default | basis design_default | default? yes
RULE ADP-054 | priority T5.427 | when exactly one fatigue signal occurs within fatigue.window_days | then change nothing; show MSG-ADP-TIRED-1 | because one outlier must not move the plan | evidence hearing-1 §5, CORROBORATED | basis design_default | default? yes
RULE ADP-055 | priority T5.428 | when ≥ fatigue.signals_required signals occur within fatigue.window_days | then replace the next session ≥ E3 with an easy one of equal or lower duration (REP-004) and hold_step this week | because repeated signals justify a lighter step that adds no load | evidence wg1 §3, CORROBORATED; hearing-1 §5, CORROBORATED | basis design_default | default? yes
RULE ADP-056 | priority T5.429 | when ADP-055 fired in fatigue.persist_weeks consecutive weeks | then insert_deload next week (resets PHS-001's counter) and trigger an off-cycle REDs self-screen (NUT-050) | because persistent fatigue needs recovery and an energy check | evidence wg1 impl. 11, ALLEGED (deload); wg5 impl. 6, CORROBORATED (REDs signs) | basis design_default | default? yes
RULE ADP-057 | priority T1.430 | when signals persist for fatigue.refer_weeks consecutive weeks | then generic professional-contact message; freeze progression until the runner attests having talked to a professional | because persistent fatigue and underperformance are referral prompts | evidence wg4 impl. 12, CORROBORATED | basis design_default | default? yes
RULE ADP-058 | priority T5.431 | when no signal occurs for fatigue.clear_weeks after ADP-055/056 | then lift the hold | because a plan that only tightens loses runners | evidence opening-contrarian §2; hearing-1 §2, CORROBORATED | basis design_default | default? yes
```

## 7. Results and re-anchoring

> **In plain words.** Paces change only after a race or test run logged within two days. A small difference from your last result changes nothing: one test can be a few percent off. A medium difference changes your paces only when a second result agrees, and then to the average of the two. A large slower result lowers paces at once; a large faster one raises them a little, and fully only when a second result agrees. Runs that feel far too hard ease your paces at once, without waiting for a test.

Logged training pace is only moderately reliable [factdesk2 §6, CREDIBLE] and never anchors (07 §3).

```
RULE ADP-060 | priority T2.432 | when a PerformanceAnchor is entered | then it re-anchors paces only if confidence = measured and age < anchor.max_age_days; otherwise it only widens the feasibility band (pred.band_widen_estimated) | because paces must not rest on recall | evidence 07 INV-15; factdesk2 §6, CREDIBLE/UNKNOWN | basis design_default | default? yes
RULE ADP-061 | priority T5.433 | when a measured anchor implies paces slower by more than the minimum detectable change (pace.mdc_mult × pace.test_te_pct ≈ 9.5%; v5.1, was pace.deadband_pct) and no exclusion applies (hot conditions, illness within result.exclusion_days, effort marked not all-out) | then re-anchor down immediately and clear any pending result; a smaller slower change goes to ADP-067; within the deadband change nothing | because a change beyond the minimum detectable change is unlikely to be noise and lowering paces is the safe direction, while one test that differs by about one typical error is noise about half the time (external review v5 item 3) | evidence wg1 impl. 4, CORROBORATED; factdesk3 §3, factdesk4 §6, CREDIBLE (3.4% CV, Machado 2015, single study); MDC formula ALLEGED (memory) | basis design_default | default? yes
RULE ADP-062 | priority T5.434 | when a measured anchor implies paces faster by more than the minimum detectable change (pace.mdc_mult × pace.test_te_pct; v5.1, was pace.deadband_pct) | then raise paces by ≤ result.max_upgrade_pct and clear any pending result; apply the full change only when a second measured anchor within result.confirm_window_days agrees within pace.deadband_pct; a smaller faster change goes to ADP-067; the feasibility point uses the newest anchor at once (F-11) | because one outlier should not move training paces, but predictions should use the latest result | evidence hearing-1 §5, CORROBORATED (pattern); factdesk3 §3, CREDIBLE (Machado 2015, single study) | basis design_default | default? yes
RULE ADP-063 | priority T5.435 | when result.pattern_sessions consecutive quality sessions log RPE below (or above) the expected RPE | then do not change paces; offer a field test (06) in place of the next quality session (below), or count them as fatigue signals (above) | because training pace is not an anchor, but a pattern justifies a test | evidence factdesk2 §6, CREDIBLE; factdesk1 §3, CORROBORATED | basis design_default | default? yes
RULE ADP-064 | priority T4.436 | when a new measured anchor puts a time goal outside the predicted band while volume and long-run demand stay feasible | then keep the plan (paces follow the anchor, not the goal), label the goal "not on track", offer 07 §6.2 lower-goal options | because paces never derive from the goal, so safety is unchanged; the runner chooses | evidence wg1 §7, CORROBORATED (±6–8% error); opening-outsider §1.5 | basis design_default | default? yes
RULE ADP-066 | priority T5.446 | when two consecutive sessions ≥ E3 are logged at RPE ≥ 8 while paces come from the active anchor | then lower the paces by one pace.deadband_pct step at once (a safety slow-down: it does not wait for the ADP-067 confirmation, v5.1) and offer a field test | because paces set from a too-fast anchor show up as sessions that feel far harder than intended (p2-C R6) | evidence factdesk1 §3, CORROBORATED (RPE anchors); factdesk4 §6, CREDIBLE (deadband size; Machado 2015, single study) | basis design_default | default? yes
RULE ADP-067 | priority T5.447 | when a measured, non-excluded anchor's 10K-equivalent differs from the active one by more than pace.deadband_pct but not more than the minimum detectable change (pace.mdc_mult × pace.test_te_pct) | then do not move paces; if a pending result from the last result.confirm_window_days differs from the active anchor in the same direction by more than pace.deadband_pct, set the active 10K-equivalent to the mean of the two (the averaging rule), clear the pending result and show MSG-ADP-PACE-CONFIRMED; otherwise store this result as the pending one (replacing an older or opposite one) and show MSG-ADP-PACE-PENDING | because the difference between two tests varies by about √2 × 3.4% ≈ 4.8%, so a single change of 1 × typical error is noise about half the time, while two consistent results averaged halve the error variance (v5.1, external review v5 item 3) | evidence factdesk3 §3, factdesk4 §6, CREDIBLE (Machado 2015, single study: 5K CV 3.44%, 10K 2.43%); MDC and averaging formulas stated from memory, ALLEGED; thresholds design defaults | basis design_default | default? yes
RULE ADP-065 | priority T5.437 | when the goal race is logged done or abandoned | then store the result (ADP-060…062) and insert TRANSITION (PHS-013) | because recovery after racing is universal practice | evidence hearing-1 §2, CORROBORATED | basis evidence | default? no
```

## 8. Life and availability changes (T3)

> **In plain words.** Fewer days or less time: the tool keeps you running often and shortens runs first. A busy week becomes a light week with nothing to make up. After a night shift the next hard session becomes easy. More free time does not mean a sudden jump.

```
RULE ADP-070 | priority T3.438 | when available_days, max_runs_per_week, available_minutes_per_week or blocked_dates change | then re-run from S4 with the new hard limits; when cutting, shorten sessions before removing them, keep ≥ maint.sessions_min runs/week, remove the long run and last key session last; if the goal no longer fits, show 07 §6.2 options | because frequency drives response; user constraints outrank the goal | evidence wg3 §2 Montero & Lundby, CORROBORATED (cycling); wg1 §5 Spiering, CORROBORATED; 07 §1 | basis design_default | default? yes
RULE ADP-071 | priority T3.439 | when the runner marks a week busy or travelling | then it becomes a maintenance week (≥ maint.sessions_min runs, intensity kept, time ≤ original), counts as recovery-like for PHS-001, with no catch-up after | because maintenance with intensity holds fitness; travel/stress effects are unknown | evidence wg1 §5, CORROBORATED; wg3 §6, UNKNOWN | basis design_default | default? yes
RULE ADP-072 | priority T6.440 | when a night shift or short sleep is reported before a session ≥ E3 | then replace it with E1 of equal or lower duration, or swap under ADP-021's conditions | because sleep loss impairs endurance; no shift-work evidence exists | evidence wg3 §6, CORROBORATED (sleep) / ALLEGED (shift rule) | basis design_default | default? yes
RULE ADP-073 | priority T3.441 | when available time increases | then targets rise only through the active progression profile from current V7/V28 (INV-16) and the spike caps | because more time is not more tolerance | evidence wg4 §1, CORROBORATED; 02 principle 3 | basis evidence | default? no
```

## 9. Goal changes and red flags

```
RULE ADP-080 | priority T4.442 | when the runner accepts a new goal or date | then re-run feasibility (GEN-030) and regenerate from current DerivedState; INV-04 is exempt against the old version but every spike, progression and gate rule applies; on a change of distance a new season starts (full phase minimums; FEA-025 credits do not carry), the deload counter carries over, and L_hold = min(L30_eff, max(L_target_new, lr_cap(new preset, V_hold))) (LOD-005); GEN-031/032 apply; v5 (p2-C R8): a TRANSITION after a race already run survives the goal change, and the new goal race must satisfy INV-31 (race.recovery_days) | because a new goal is a new plan from what the runner can do now, without carrying an old plan's long run into a shorter race (p1-A R2) | evidence 07 §6.3; opening-contrarian I7; p1-A case 1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE ADP-081 | priority T0.443 | when any event carries a red-flag answer (cardiac, bone stress, heat illness, hyponatraemia signs, pregnancy stop signs, escalations from 11) | then hand over to 10; INV-05: zero running until clearance attested ≥ flag.clearance_min_delay_days later | because red flags stop the plan whatever else happens | evidence wg4 §4, CORROBORATED; opening-contrarian §1.3 | basis evidence | default? no
```

## 10. Messages

| ID | plain_text | why |
|---|---|---|
| MSG-ADP-UNLOGGED | "No runs logged last week. Did you run?" (ran, not logged / did not run / skip) | "Your plan grows from what you log; without it we stay gentle for a few weeks." |
| MSG-ADP-CHANGED | "Your plan changed from today: [list]." | "Each change follows a rule; tap one to see why." |
| MSG-ADP-FIT | "You did less than planned for two weeks. Shall we fit the plan to the time you have?" | "A plan you can follow beats a bigger one you cannot." |
| MSG-ADP-ILL-STOP | "Rest until you are well. If symptoms are severe or do not improve, talk to a doctor or qualified health professional." | "Running with fever or whole-body symptoms is not advised." |
| MSG-ADP-ILL-RACE | "This plan does not recommend racing while you recover from illness." | "The same return rules apply to races." |
| MSG-ADP-TIRED-1 | "One tired day is normal. Nothing changes yet." | "We change your plan only when tiredness repeats." |

Messages for ADP-040/050/053/081 come from 10's generic catalogue (`is_safety_generic = true`, INV-24).

## 11. Parameters proposed

| ID | Default | Unit | Range | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|
| miss.partial_ratio | 0.75 | × planned | 0.5–0.9 | UNKNOWN | dd | design | 08 |
| miss.repeat_week_ratio | 0.60 | × planned week | 0.5–0.8 | UNKNOWN (repeat-week practice CORROBORATED) | dd | wg3 impl. 4 | 08 |
| miss.fit_check_weeks | 2 | weeks | 2–3 | UNKNOWN | dd | hearing-1 §2 | 08 |
| illness.stage1_min | 15 | min | 10–20 | CORROBORATED | ev | wg4 §5 | 08 |
| pain.severe_min | 7 | /10 | 5–7 | CREDIBLE | dd | hearing-1-med-field §4 | 08 |
| pain.persist_sessions | 2 | sessions | 2–3 | UNKNOWN | dd | design | 08 |
| pain.clear_sessions | 2 | sessions | 1–3 | UNKNOWN | dd | factdesk1 §1 | 08 |
| rpe.expected_by_effort | E0 ≤ 2; E1 ≤ 3; E2 4–5; E3 6–7; E4 ≥ 8 | CR-10 | — | CORROBORATED anchors (VT1/VT2); CR-10 mapping UNKNOWN | dd | factdesk1 §3; factdesk2 §5 | 08/06 |
| fatigue.rpe_excess | 2 | RPE points | 1–3 | UNKNOWN | dd | design | 08 |
| fatigue.signals_required | 2 | signals | 2–3 | CORROBORATED principle; count UNKNOWN | dd | hearing-1 §5 | 08 |
| fatigue.window_days | 7 | days | 5–10 | UNKNOWN | dd | design | 08 |
| fatigue.persist_weeks / refer_weeks / clear_weeks | 2 / 3 / 1 | weeks | 2–3 / 3–4 / 1–2 | UNKNOWN | dd | wg4 impl. 12 | 08 |
| result.exclusion_days | 7 | days | 7–14 | UNKNOWN | dd | design | 08 |
| result.max_upgrade_pct | 3 | % pace | 2–5 | UNKNOWN | dd | hearing-1 §5 | 08 |
| result.confirm_window_days | 42 | days | 28–84 | UNKNOWN | dd | design | 08 |
| result.pattern_sessions | 3 | sessions | 3–4 | CORROBORATED principle; count UNKNOWN | dd | hearing-1 §5 | 08 |
| pace.test_te_pct / pace.mdc_mult (v5.1) | 3.4 / 2.8 | % / × | 2.4–3.5 / 2.0–2.8 | CREDIBLE (Machado 2015, single study); multiplier ALLEGED (memory) | dd | external review v5 item 3 | 08 |

## 12. Conflicts with contract / other modules (v1 record; resolved in RESOLUTIONS.md)

1. **INV-04 wording** ("no missed session's volume is moved to another day") literally forbids ADP-021, a swap that adds no volume. Reword INV-04 to "no added time or distance", or drop ADP-021.
2. **Data model additions:** `Week.log_state ∈ {logged, partial, unlogged}`; `Session.status` value `unlogged`; `AdaptationEvent.kind` value `unlogged_week`; `ActivityRecord` fields `fatigue_flag`, `stopped_early_reason`, `short_sleep_or_night_shift`, `conditions_hot`, `effort_all_out`.
3. **Illness vs INV-05.** Illness flags clear by self-attested symptom-free days (ADP-042), not professional clearance. INV-05 should state it covers `RiskFlag.kind = red_flag` only.
4. **ADP-064 vs GEN-003.** A mid-plan result that makes a *time* goal unreachable keeps the plan running rather than failing closed. GEN-003 should apply at generation and to volume/long-run infeasibility, not pace-only drift. Architect decision needed.
5. **Priority uniqueness.** 12 §3.1 says `nnn` is unique across the rule base; 07 reuses 350–352 across tiers. 08 keeps `nnn` unique across all its tiers (400–443), satisfying both readings.

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "ADP-001", "condition": "session.status == 'planned' && hours_between(session.date_end, now) > p('log.contemporaneous_window_h') && !has(session.linked_entry) && count(week.entries, x, true) >= 1", "on_unknown": "skip", "action": {"op": "set", "target": "session.status", "expr": "'missed'", "then": [{"op": "record_event", "kind": "missed_session"}]}}
{"id": "ADP-002", "condition": "has(session.linked_entry) && session.linked_entry.duration_s < p('miss.partial_ratio') * session.planned_duration_s", "on_unknown": "skip", "action": {"op": "set", "target": "session.status", "expr": "'partial'"}}
{"id": "ADP-003", "condition": "week.ended && count(week.entries, x, true) == 0 && !week.has_illness_pain_availability_report", "on_unknown": "fire", "action": {"op": "set", "target": "week.log_state", "expr": "'unlogged'", "then": [{"op": "set", "target": "state.progression_profile", "expr": "'slow'"}, {"op": "emit_message", "msg": "MSG-ADP-UNLOGGED"}]}}
{"id": "ADP-004", "condition": "event.type == 'backfill'", "on_unknown": "skip", "action": {"op": "set", "target": "entry.source", "expr": "'backfill'", "then": [{"op": "set", "target": "entry.confidence", "expr": "'estimated'"}, {"op": "set", "target": "entry.l30_weight", "expr": "p('claim.l30_discount')"}]}}
{"id": "ADP-010", "condition": "event.type == 'adaptation_event'", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S0", "then": [{"op": "set", "target": "plan.parent_plan_id", "expr": "plan.id"}]}}
{"id": "ADP-011", "condition": "exists(plan.future_weeks, w, w.planned_time_s > parent_week(w).planned_time_s || w.lr_s > parent_week(w).lr_s) && !event.goal_changed", "on_unknown": "fire", "action": {"op": "cap", "target": "w.planned_time_s", "expr": "parent_week(w).planned_time_s", "then": [{"op": "cap", "target": "w.lr_s", "expr": "parent_week(w).lr_s"}, {"op": "log_deviation"}]}}
{"id": "ADP-012", "condition": "count(today_events, x, true) > 1", "on_unknown": "skip", "action": {"op": "order_events", "expr": "sort_by(today_events, x, [tier_rank(x.tier), kind_rank(x.kind), x.id])"}}
{"id": "ADP-014", "condition": "session.in_published_window && !event.is_reduction && !event.t0t2", "on_unknown": "fire", "action": {"op": "freeze", "target": "session", "fields": ["date", "module_id", "planned_duration_s", "planned_distance_m"], "until": "date_add(today, p('replan.published_days'))"}}
{"id": "ADP-020", "condition": "session.status in ['missed', 'partial']", "on_unknown": "fire", "action": {"op": "drop_session", "target": "session.missing_part", "then": [{"op": "constraint", "check": "validator: INV-04 (no session is added, lengthened or intensified to recover)"}]}}
{"id": "ADP-021", "condition": "session.status == 'missed' && effort_rank(session.effort_target) >= effort_rank('E3') && exists(week.later_easy, x, x.planned_duration_s >= session.planned_duration_s)", "on_unknown": "skip", "action": {"op": "offer_swap", "target": "session", "expr": "first(week.later_easy, x, x.planned_duration_s >= session.planned_duration_s)", "max_offers": 1}}
{"id": "ADP-022", "condition": "week.log_state != 'unlogged' && (week.completed_time_s < p('miss.repeat_week_ratio') * week.planned_time_s || week.long_run_status in ['missed', 'partial'])", "on_unknown": "fire", "action": {"op": "hold_step", "weeks_expr": "1", "expr": "last_completed_comparable_week(week)"}}
{"id": "ADP-024", "condition": "count(state.fit_check_weeks, w, w.completed_time_s < p('miss.repeat_week_ratio') * w.planned_time_s) == p('miss.fit_check_weeks')", "on_unknown": "skip", "action": {"op": "ask", "field": "profile.availability", "msg": "MSG-ADP-FIT"}}
{"id": "ADP-030", "condition": "state.days_since_last_run < p('gap.reduce_trigger_days')", "on_unknown": "skip", "action": {"op": "set", "target": "plan.resume_week", "expr": "current_week(today)"}}
{"id": "ADP-031", "condition": "state.days_since_last_run >= p('gap.reduce_trigger_days') && state.days_since_last_run < p('gap.rtr_trigger_days')", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "p('gap.vol_factor.' + gap_band(state.days_since_last_run)) * state.V7_prev_time_s", "then": [{"op": "regenerate", "from_stage": "S3"}]}}
{"id": "ADP-032", "condition": "state.days_since_last_run >= p('gap.rtr_trigger_days')", "on_unknown": "fire", "action": {"op": "insert_phase", "phase": "RTR", "rung_expr": "rtr_entry_rung(state.prior_tol_tier, state.days_since_last_run)", "then": [{"op": "regenerate", "from_stage": "S3"}]}}
{"id": "ADP-033", "condition": "event.type == 'gap_ended'", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels", "expr": "decay(state.levels, state.gap_weeks, p('cmp.decay_weeks'))", "then": [{"op": "schedule_session", "module_expr": "'SES-M-020'", "when": "week.is_first_full_week_back"}]}}
{"id": "ADP-034", "condition": "event.gap_cause in ['illness', 'pain', 'red_flag']", "on_unknown": "fire", "action": {"op": "route", "to": "10", "before": "gap_bands"}}
{"id": "ADP-035", "condition": "state.on_start_ladder && state.days_since_last_run >= p('gap.reduce_trigger_days')", "on_unknown": "fire", "action": {"op": "set_rung", "expr": "gap_band(state.days_since_last_run) == '8_14' ? state.ladder_rung_index : max(1, state.ladder_rung_index - 1)", "then": [{"op": "route", "to": "SAF-080", "when": "state.days_since_last_run >= p('gap.rtr_trigger_days')"}]}}
{"id": "ADP-040", "condition": "event.type == 'illness_report' && (event.chest_pain || event.fainting || event.palpitations || event.disproportionate_breathlessness)", "on_unknown": "hold", "action": {"op": "route", "to": "SAF-001", "msg": "MSG-SAF-002"}}
{"id": "ADP-041", "condition": "event.type == 'illness_report' && (event.fever || event.below_neck)", "on_unknown": "fire", "action": {"op": "ask", "field": "event.I", "questions": "10 §1 I1-I2", "msg": "MSG-ADP-ILL-STOP"}}
{"id": "ADP-042", "condition": "flag.status == 'active' && flag.subkind == 'illness'", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.is_run", "until": "days_between(flag.raised_on, today) >= p('illness.rest_days_min') && state.symptom_free_days_attested >= p('illness.symptom_free_days')"}}
{"id": "ADP-043", "condition": "event.above_neck_only == true && event.fever == false", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "p('illness.above_neck_dur_ratio') * session.planned_duration_s", "then": [{"op": "set", "target": "state.effort_ceiling", "expr": "'E1'"}]}}
{"id": "ADP-044", "condition": "flag.status == 'active' && flag.subkind == 'illness' && today == goal.race_date", "on_unknown": "fire", "action": {"op": "emit_message", "msg": "MSG-ADP-ILL-RACE", "then": [{"op": "constraint", "check": "validator: INV-04 (no load added)"}]}}
{"id": "ADP-050", "condition": "exists(event.bone_answers, a, a == true)", "on_unknown": "hold", "action": {"op": "route", "to": "SAF-002"}}
{"id": "ADP-051", "condition": "entry.pain_0_10 <= p('pain.during_max') && entry.pain_settled_24h && entry.pain_next_morning == false", "on_unknown": "skip", "action": {"op": "hold_step", "weeks_expr": "p('pain.hold_step_weeks')"}}
{"id": "ADP-052", "condition": "entry.pain_0_10 > p('pain.during_max') || entry.pain_next_morning == true", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.is_run && s.date == date_add(entry.date, 1)", "until": "today > date_add(entry.date, 1)", "then": [{"op": "set", "target": "state.effort_ceiling", "expr": "'E2'"}, {"op": "hold_step", "weeks_expr": "1", "expr": "last_completed_step()"}], "msg": "MSG-ADP-PAIN-STEP"}}
{"id": "ADP-053", "condition": "entry.pain_0_10 >= p('pain.severe_min') || state.adp052_consecutive >= p('pain.persist_sessions') || count(state.adp052_events, x, days_between(x.date, today) <= p('pain.recur_window_days')) >= p('pain.recur_count') || entry.limping == true", "on_unknown": "fire", "action": {"op": "route", "to": "SAF-002|SAF-011"}}
{"id": "ADP-055", "condition": "count(state.fatigue_signals, x, days_between(x.date, today) <= p('fatigue.window_days')) >= p('fatigue.signals_required')", "on_unknown": "skip", "action": {"op": "replace_module", "target": "next_session_E3", "expr": "'SES-M-001'", "then": [{"op": "hold_step", "weeks_expr": "1"}], "msg": "MSG-ADP-TIRED-1"}}
{"id": "ADP-057", "condition": "state.fatigue_weeks_consecutive >= p('fatigue.refer_weeks')", "on_unknown": "fire", "action": {"op": "freeze", "target": "progression", "until": "has(state.professional_contact_attested_on)", "msg": "MSG-ADP-REFER"}}
{"id": "ADP-060", "condition": "event.type == 'anchor_entered'", "on_unknown": "skip", "action": {"op": "set", "target": "state.active_anchor_id", "expr": "(anchor.confidence == 'measured' && days_between(anchor.date, today) < p('anchor.max_age_days')) ? anchor.id : state.active_anchor_id", "then": [{"op": "set", "target": "feas.band_widen", "expr": "anchor.confidence == 'measured' ? 1 : p('pred.band_widen_estimated')"}]}}
{"id": "ADP-062", "condition": "anchor.confidence == 'measured' && anchor.equiv_10k_s < state.pace_anchor_10k_equiv_s * (1 - p('pace.mdc_mult') * p('pace.test_te_pct') / unit.pct)", "on_unknown": "skip", "action": {"op": "set", "target": "state.pace_anchor_10k_equiv_s", "expr": "max(anchor.equiv_10k_s, state.pace_anchor_10k_equiv_s * (1 - p('result.max_upgrade_pct') / unit.pct))", "then": [{"op": "set", "target": "state.pending_anchor_10k_s", "expr": "null"}]}}
{"id": "ADP-064", "condition": "anchor.confidence == 'measured' && goal.goal_type == 'time' && goal.target_time_s < feas.P_race_s * (1 - feas.B_fast) && !exists(feas.reasons, x, x in ['AVAILABILITY_TIME', 'LONG_RUN_UNREACHABLE_PRESET', 'CURRENT_STATE_SHORT'])", "on_unknown": "skip", "action": {"op": "label", "code": "NOT_ON_TRACK", "then": [{"op": "generate_options", "order": ["lower_goal"]}]}}
{"id": "ADP-066", "condition": "count(log.last_e3_sessions, x, x.rpe_0_10 >= p('result.rpe_high')) >= p('result.rpe_high_sessions') && size(log.last_e3_sessions) >= p('result.rpe_high_sessions') && anchor.confidence == 'measured'", "on_unknown": "skip", "action": {"op": "set", "target": "state.pace_anchor_10k_equiv_s", "expr": "state.pace_anchor_10k_equiv_s * (1 + p('pace.deadband_pct') / unit.pct)", "then": [{"op": "schedule_session", "module_expr": "'SES-M-020'"}], "msg": "MSG-ADP-PACE-DOWN"}}
{"id": "ADP-067", "condition": "anchor.confidence == 'measured' && !anchor.excluded && abs(anchor.equiv_10k_s - state.pace_anchor_10k_equiv_s) > p('pace.deadband_pct') / unit.pct * state.pace_anchor_10k_equiv_s && abs(anchor.equiv_10k_s - state.pace_anchor_10k_equiv_s) <= p('pace.mdc_mult') * p('pace.test_te_pct') / unit.pct * state.pace_anchor_10k_equiv_s", "on_unknown": "skip", "action": {"op": "set", "target": "state.pace_anchor_10k_equiv_s", "expr": "mean(anchor.equiv_10k_s, state.pending_anchor_10k_s)", "when": "state.pending_confirms", "msg": "MSG-ADP-PACE-CONFIRMED", "then": [{"op": "set", "target": "state.pending_anchor_10k_s", "expr": "null", "when": "state.pending_confirms"}], "otherwise": {"op": "set", "target": "state.pending_anchor_10k_s", "expr": "anchor.equiv_10k_s", "then": [{"op": "set", "target": "state.pending_anchor_date", "expr": "anchor.date"}], "msg": "MSG-ADP-PACE-PENDING"}}}
{"id": "ADP-070", "condition": "event.type == 'availability_changed'", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S4", "then": [{"op": "floor", "target": "week.runs", "expr": "p('maint.sessions_min')"}]}}
{"id": "ADP-071", "condition": "event.type == 'week_marked_busy'", "on_unknown": "skip", "action": {"op": "set", "target": "week.kind", "expr": "'maintenance'", "then": [{"op": "cap", "target": "week.planned_time_s", "expr": "week.original_time_s"}, {"op": "floor", "target": "week.runs", "expr": "p('maint.sessions_min')"}]}}
{"id": "ADP-073", "condition": "event.type == 'availability_increased'", "on_unknown": "fire", "action": {"op": "constraint", "check": "validator: increases only via LOD-003 (INV-16) and the spike caps (INV-01/02)"}}
{"id": "ADP-081", "condition": "event.red_flag_answer == true", "on_unknown": "hold", "action": {"op": "route", "to": "10"}}
{"id": "ADP-013", "condition": "event.type == 'version_emitted'", "on_unknown": "skip", "action": {"op": "emit_message", "msg": "MSG-ADP-CHANGED"}}
{"id": "ADP-023", "condition": "state.adp022_consecutive_weeks >= p('miss.refeas_hold_weeks')", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S3"}}
{"id": "ADP-054", "condition": "count(state.fatigue_signals, x, days_between(x.date, today) <= p('fatigue.window_days')) == 1", "on_unknown": "skip", "action": {"op": "emit_message", "msg": "MSG-ADP-TIRED-1"}}
{"id": "ADP-056", "condition": "state.adp055_consecutive_weeks >= p('fatigue.persist_weeks')", "on_unknown": "fire", "action": {"op": "set", "target": "next_week.is_deload", "expr": "true", "then": [{"op": "ask", "field": "event.reds_answers", "msg": "MSG-NUT-REDS-Q"}]}}
{"id": "ADP-058", "condition": "state.fatigue_hold_active && state.weeks_without_fatigue_signal >= p('fatigue.clear_weeks')", "on_unknown": "skip", "action": {"op": "set", "target": "state.fatigue_hold_active", "expr": "false"}}
{"id": "ADP-061", "condition": "anchor.confidence == 'measured' && anchor.equiv_10k_s > state.pace_anchor_10k_equiv_s * (1 + p('pace.mdc_mult') * p('pace.test_te_pct') / unit.pct) && !anchor.excluded", "on_unknown": "fire", "action": {"op": "set", "target": "state.pace_anchor_10k_equiv_s", "expr": "anchor.equiv_10k_s", "msg": "MSG-FEA-CHK-SLOWER", "then": [{"op": "set", "target": "state.pending_anchor_10k_s", "expr": "null"}]}}
{"id": "ADP-063", "condition": "count(log.last_quality_sessions, x, x.rpe_0_10 < x.rpe_expected) >= p('result.pattern_sessions') || count(log.last_quality_sessions, x, x.rpe_0_10 > x.rpe_expected) >= p('result.pattern_sessions')", "on_unknown": "skip", "action": {"op": "schedule_session", "module_expr": "'SES-M-020'", "when": "count(log.last_quality_sessions, x, x.rpe_0_10 < x.rpe_expected) >= p('result.pattern_sessions')", "otherwise": {"op": "record_event", "kind": "fatigue"}}}
{"id": "ADP-065", "condition": "goal.race_status in ['done', 'abandoned']", "on_unknown": "fire", "action": {"op": "insert_phase", "phase": "TRANSITION", "rung_expr": "null"}}
{"id": "ADP-080", "condition": "event.type == 'goal_accepted'", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S0", "then": [{"op": "set", "target": "state.L_hold_s", "expr": "min(state.L30_eff_time_s, max(demand.L_target_s, preset_cap(week.long_run)))", "when": "event.distance_changed"}, {"op": "constraint", "check": "validator: INV-31 and INV-04 exemption only against the old version; TRANSITION already started is kept"}]}}
```

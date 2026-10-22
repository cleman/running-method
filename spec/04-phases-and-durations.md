# 04 — Phases and durations (v5, architect)

Serves criteria 3 (any duration, phase decomposition, insufficient time), 10 (phase templates as modules), 5 (deterministic). Rule range: PHS-001…099. Parameters: `phs.*`, `taper.*`, `deload.*` in `parameters.md`.

> **In plain words.** A plan is cut into blocks, each with one job: get used to running (onboarding), build the engine (base), add harder work (build), practise the race (specific), freshen up (taper), race, then recover (transition). Short plans skip blocks; long plans repeat them as seasons. If there are not enough weeks for the blocks your goal needs, the tool tells you and offers a later date, an easier goal or a shorter race.

## 1. Phase types (templates)

Each phase is a `PhaseTemplate` (12 §2). **Phases are time-boxed; the "Exit check" names the checkpoint or test that is reviewed at the boundary (v5, p2-A R8).** A failed checkpoint never extends a phase by itself; it triggers 03's feasibility re-run. Doses come from 05; sessions from 06; distance emphasis from 09.

| Phase | Purpose | Volume trend | Long run | Key sessions | Entry | Exit | Exit check (v5) |
|---|---|---|---|---|---|---|---|
| **ONBOARD** | habit, effort vocabulary, first anchor | hold or slow profile | ≤ L30_eff | 0 (strides allowed if HAB ≥ 1) | anchor unknown, or log_status ≠ rich (07 §3) | `phs.onboard_weeks` done **and** an anchor field test (SES-M-019/020) **or**, when HAB < 2 or the gate is restricted, the benchmark test FT-0 (SES-M-018) logged; after FT-0 the plan stays effort-only (SES-014) | time-boxed (`phs.onboard_weeks`) + **checkpoint:** FT-1/FT-2 anchor test or FT-0 benchmark logged (SES-014) |
| **RTR** return to run | rebuild after gap, illness or cleared injury | ladder (10) | ladder | 0 | gap ≥ `gap.rtr_trigger_days` or clearance event | ladder complete | symptom-gated: ladder exit R5/S9 clean (SAF-082) + **checkpoint:** FT-0 benchmark |
| **BASE** | AER, TOL, HAB, DUR; strides/ECO | rising (05 profile) | rising under caps | 0–1 (THR L1, strides) | screening ≠ blocked | weeks allotted, or V/L demand met | time-boxed (weeks from 03) + **checkpoint:** demand curve on track (L30_eff and V28 vs the dry run, re-run FEA) |
| **BUILD** | THR, VO2; ultra: VO2/THR first (Koop order) | rising, then plateau | rising | 1–2 (preset) | THR L1 prerequisites | weeks allotted | time-boxed + **checkpoint:** THR/VO2 exit tests scheduled by SES-012 (06 §3) |
| **SPECIFIC** | MSP, DUR, FUEL rehearsal | plateau / peak | peak long runs, race-pace segments | 1–3 (preset) | MSP L1 prerequisites | weeks allotted | time-boxed + **checkpoint:** peak long run reached (INV-25), MSP/FUEL exit tests (06 §3, 11) |
| **TAPER** | shed fatigue, keep sharpness | −`taper.volume_cut` progressive | shortened | frequency and intensity kept | fixed window before race | race day | time-boxed (`taper.weeks`) + **checkpoint:** race-week symptom questions |
| **RACE** | race week (last taper week) | low | none | race | — | race logged | race logged |
| **TRANSITION** | recover | ≤ `transition.vol_max_ratio` × pre-taper volume, easy only | none | 0 | after goal race | `phs.transition_weeks[distance]` | time-boxed (`phs.transition_weeks`) + **checkpoint:** no pain flag; INV-31 recovery respected |
| **MAINTAIN** | hold fitness without a goal | ≥ `maint.sessions_min` per week, intensity kept | held | 1 | no race date or between seasons | user sets a goal; or `maint.max_weeks` reached → re-test | runner sets a goal, or `maint.max_weeks` → field test |

Evidence: shared core of proven plans (mostly easy, 1–3 key sessions, long run, rising specificity, taper) [hearing-1 §2, CORROBORATED]; no periodisation model is superior [wg1 §5, CORROBORATED] so the linear base→build→specific order is a convention, chosen because it matches the corpus of published plans [wg2 §2, CORROBORATED as description]; Koop ultra order "far = intense, near = specific" [wg2 §4, CREDIBLE]; taper keeps intensity and frequency, volume −41–60% [wg1 §5; wg2 §3, CORROBORATED]; maintenance with ≥ 2 sessions/week and intensity kept holds VO2max ≤ ~15 weeks but not long-race durability [wg1 §5, CORROBORATED / UNKNOWN].

## 2. Horizon classes

`W` = whole weeks from plan start (Monday of the first full week; a partial first week is an ONBOARD/BASE stub) to race week inclusive. Without a race date the plan is rolling (H0).

| Class | W | Structure |
|---|---|---|
| H0 rolling | no date | BASE or MAINTAIN in 4-week blocks, re-planned at each block end |
| H1 very short | ≤ 4 | **SHARPEN** = BASE-hold weeks + compressed TAPER. No build, no deload, no projected gain |
| H2 short | 5–8 | BASE (≥ 1) + BUILD/SPECIFIC merged (the merged phase has `Phase.type = SPECIFIC` for DST-018 and the quality allowance, v3 d2-A R7) + TAPER; deloads only if W ≥ `deload.min_plan_weeks` |
| H3 standard | 9–24 | full sequence |
| H4 extended | 25–52 | **one macrocycle** with extended BASE and FEA-038 checkpoints (v4, p1-A R6) |
| H5 multi-year | > 52 | n = ⌈W / `phs.season_max_weeks`⌉ seasons of near-equal length (longer ones last); a season ending in a **race** gets a TRANSITION, one ending in a **test** gets a deload week; re-plan per season |

## 3. Allocation algorithm (deterministic)

Inputs: `W`, `distance`, `goal_type`, `FeasibilityResult.weeks_needed` (03: `base_needed`, `rtr_needed`, `onboard_needed`), registry. Output: ordered list of `Phase {type, start_week, n_weeks}`.

0. **Never-runners (v3).** The start ladder (10 §4b, ≥ 9 weeks at 3 runs) replaces RTR/ONBOARD in P0. **No deload is placed inside the start ladder** (v4, p1-C R13): the ladder's repeatable rungs are its recovery mechanism, and the deload counter starts at ladder exit.
0. **Short finish goals (v2, Room A R4).** For a 5K/10K `finish` goal whose required levels add no THR, VO2 or MSP level: `build_min = specific_min = 0` and `T = taper.weeks.short_finish` (1). Empty phases no longer inflate the weeks needed; all weeks between P0 and the taper are BASE.
1. **Taper.** `T = taper.weeks[distance]` (5K/10K/half 2, marathon 3, 50K/100K 3). If `W ≤ 4`: `T = taper.weeks_short[distance]` (1 for ≤ half; 2 for marathon/ultra if W ≥ 3, else 1). The RACE week is the last taper week.
2. **Front phases.** `P0 = rtr_needed + max(0, onboard_needed − rtr_needed)`: return-ladder weeks count toward ONBOARD (a novice with no history enters the ladder at R1 and does not also repeat ONBOARD; RESOLUTIONS A9). ONBOARD weeks also count as BASE weeks for volume; they differ only in effort-only prescription.
3. **Remaining** `R = W − T − rtr_needed`. Taper weeks are whole weeks; a preset that prescribes a shorter taper (Hansons ~10 days) expresses it through `taper.cut_profile` inside 2 weeks (05).
4. **Specific.** `S = min(phs.specific_target[distance], max(phs.specific_min[distance], R − base_needed − phs.build_min))`.
5. **Base.** `B = max(base_needed, onboard_needed)`.
6. **Build.** `U = R − B − S`. If `U > phs.build_max[distance]`, the excess goes to BASE (H3/H4) or a new season starts (H5).
7. **Infeasible** if `U < 0` with `S = specific_min` and `B = base_needed` → return reason `PHASES_DO_NOT_FIT` to 03; 07 then fails closed with goal-level repairs. H1 is exempt from steps 4–6 (SHARPEN): it is feasible only if the *current* state already meets the goal demand (03).
7b. **Re-plans (v2, F-21).** When 08 re-allocates phases mid-season, completed weeks are frozen. Each phase minimum is reduced by the weeks already spent in it, so a done BUILD or SPECIFIC is never added again (03 FEA-025).
8. **Seasons (v4, p1-A R6).** Only when W > 52: n = ⌈W / `phs.season_max_weeks`⌉ seasons. Lengths are ⌊W/n⌋ or ⌈W/n⌉, with the longer seasons last. Each non-final season ends in a test (or a runner-chosen milestone race, `Goal.milestones[]`). After a test comes one deload week, not a TRANSITION; after a race comes a TRANSITION. Each season holds its own phase sequence, its L_hold carries across, and **the feasibility dry run models these boundaries**.

Design-default values (registry): `specific_min` 5K/10K 2, half 3, marathon 4, ultra 4; `specific_target` 4/4/6/8/8/10 (5K→100K); `build_min` 1; `build_max` 8; `season_max_weeks` 24. Basis: published plans run 12–24 weeks [wg2 §1–2, CORROBORATED as description]; per-phase lengths are coaching convention (CREDIBLE at best) and therefore **design defaults**.

## 4. Deloads and the taper-vs-deload conflict

**Cadence semantics (v2, F-08).** `deload.every = N` means N − 1 loading weeks, then the deload in week N, counted from plan start or from the last recovery-like week (deload, RTR end, taper, transition, illness pause ≥ 7 days, busy week under ADP-071).

**Spacing (v2, F-07).** Two deloads are always at least `deload.min_gap_weeks` loading weeks apart. If PHS-004 would move a deload closer than that, it stays at its unmoved position when that respects the spacing, otherwise it is dropped; the counter restarts from the last deload actually placed (PHS-006).

Deload frequency has no endurance evidence [wg1 §5, ALLEGED/UNKNOWN; hearing-1 §1, UNKNOWN in all bases]. The method uses a cadence parameter and resolves its collisions explicitly.

```
RULE PHS-001 | priority T5.210 | when building the week sequence and W ≥ deload.min_plan_weeks | then insert a deload every deload.every weeks, counted from plan start or from the last recovery-like week (deload, RTR end, taper, transition) | because periodic lighter weeks are near-universal practice; frequency unproven | evidence wg1 §5 impl. 11, ALLEGED; hearing-1 §3 practice "cutback every 3–4 wk", CREDIBLE | basis design_default | default? yes
RULE PHS-002 | priority T5.211 | when a scheduled deload falls inside TAPER or within deload.exclusion_before_taper weeks of taper start | then drop that deload (the taper is the recovery) | because a deload followed by a taper wastes the short window and removes the last loading weeks | evidence opening-contrarian §2 (short-plan collision); wg2 §3 Wang 2023 favours overload before taper, CORROBORATED | basis design_default | default? yes
RULE PHS-003 | priority T5.212 | when W < deload.min_plan_weeks | then schedule no deload | because in ≤ 5-week plans taper + deload would leave no training | evidence opening-contrarian §2, UNKNOWN (design default) | basis design_default | default? yes
RULE PHS-004 | priority T5.213 | when a deload falls within 1 week of a phase boundary, i.e. `weeks_to_phase_boundary` ≤ 1 (full weeks left in its phase after it; 12 §2b; post-audit, 13 R-03) | then move it to the last week of its phase | because aligned recovery weeks keep phases coherent and make the sequence deterministic | evidence design choice (template-first, opening-statusquo), UNKNOWN (design default) | basis design_default | default? yes
RULE PHS-005 | priority T1.210 | when a context modifier sets deload.every = deload.every_ctx (CTX-001…004: novice, other-sport background, injury in last 12 months, masters ≥ ctx.masters_age) | then use that cadence | because these groups carry higher risk; cadence value is convention | evidence wg1 impl. 11, ALLEGED; hearing-1 §3 prior injury, CORROBORATED | basis design_default | default? yes
RULE PHS-006 | priority T5.217 | when PHS-001 or PHS-004 would place a deload fewer than deload.min_gap_weeks loading weeks after the previous deload or recovery-like week | then keep it at its unmoved position if that respects the spacing, otherwise drop it; the counter restarts from the last deload actually placed | because back-to-back light weeks waste loading time and were produced by v1 (F-07) | evidence F-07; wg1 impl. 11, ALLEGED (cadence) | basis design_default | default? yes
```

## 5. Short and long horizons

```
RULE PHS-010 | priority T4.210 | when W ≤ 4 | then use SHARPEN: hold volume ≤ V28_eff, keep current key sessions, compressed taper; feasibility uses current state only, with no projected gains | because there is no time to build; the taper alone takes 2–3 weeks | evidence wg1 §5, wg2 §3, CORROBORATED; opening-contextrealist §1.4 | basis design_default | default? yes
RULE PHS-011 | priority T4.211 | when W ≤ 4 and the current state does not meet the goal demand | then do not generate a goal plan; return goal-level repairs (07 §6) | because a squeezed plan concentrates load (catch-up spike) | evidence wg4 §1 Frandsen, CREDIBLE (one cohort; several summaries) (observational); opening-contrarian §1.2 | basis design_default | default? yes
RULE PHS-012 | priority T4.212 | when W > 52 | then split into seasons as §3 step 8 and plan only the first season in sessions; later seasons are outlines re-planned at each season start from logged results; H4 (25–52 weeks) is one macrocycle | because multi-year improvement rates are unknown; a deterministic split keeps the dry run and the plan identical (p1-A R6) | evidence factdesk1 §6, UNKNOWN; hearing-1 §2, UNKNOWN | basis design_default | default? yes
RULE PHS-016 | priority T5.218 | when a non-final season ends in a test, not a race | then schedule one deload week after it instead of a TRANSITION, so L30_eff does not decay across the boundary | because a test is not a race; a transition would force the long run to regrow every season (p1-A case 2) | evidence p1-A R6; hearing-1 §2, CORROBORATED (transition after races) | basis design_default | default? yes
RULE PHS-013 | priority T5.214 | when a goal race is completed (or abandoned) | then insert TRANSITION of phs.transition_weeks[distance] before any new BASE | because recovery after racing is universal practice | evidence hearing-1 §2 shared core, CORROBORATED (structure); length design default | basis design_default | default? yes
RULE PHS-014 | priority T5.215 | when MAINTAIN has run maint.max_weeks | then schedule a field test and warn that long-race durability is not preserved | because maintenance evidence covers VO2max ≤ ~15 weeks in general populations only | evidence wg1 §5 Spiering, CORROBORATED / UNKNOWN for long races | basis design_default | default? yes
RULE PHS-015 | priority T5.216 | when goal.family = ultra | then order BUILD emphasis VO2 → THR → steady, and SPECIFIC emphasis DUR/MSP/FUEL | because Koop's intensity-first sequence is the documented ultra practice | evidence wg2 §4 impl. 6, CREDIBLE | basis design_default | default? yes
```

## 6. Interfaces

- 03 supplies `base_needed`, `rtr_needed`, `onboard_needed`; 04 returns phases or `PHASES_DO_NOT_FIT`.
- 05 owns all dose values inside phases (`taper.volume_cut`, deload depth, progression).
- 08 calls 04 again on re-plan: past phases are frozen; only phases from the current week on are re-allocated.
- 09 owns per-distance phase emphasis tables and may override `specific_target` via the registry, not by literal values.

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "PHS-001", "condition": "plan.W >= p('deload.min_plan_weeks')", "on_unknown": "skip", "action": {"op": "insert_deload", "every_expr": "p('deload.every')", "counted_from": "last_recovery_like_week"}}
{"id": "PHS-002", "condition": "week.is_deload && (week.phase == 'TAPER' || weeks_between(week.start, plan.taper_start) < p('deload.exclusion_before_taper'))", "on_unknown": "fire", "action": {"op": "drop_deload", "target": "week"}}
{"id": "PHS-003", "condition": "plan.W < p('deload.min_plan_weeks')", "on_unknown": "fire", "action": {"op": "set", "target": "plan.deload_weeks", "expr": "[]"}}
{"id": "PHS-004", "condition": "week.is_deload && week.weeks_to_phase_boundary <= 1", "on_unknown": "fire", "action": {"op": "move_deload", "target": "week", "expr": "phase_last_week(week.phase)"}}
{"id": "PHS-005", "condition": "state.deload_every_ctx_set == true", "on_unknown": "fire", "action": {"op": "set", "target": "override.deload.every", "expr": "p('deload.every_ctx')"}}
{"id": "PHS-006", "condition": "week.is_deload && week.loading_weeks_since_recovery < p('deload.min_gap_weeks')", "on_unknown": "fire", "action": {"op": "drop_deload", "target": "week", "unless": "week.unmoved_position_respects_gap"}}
{"id": "PHS-010", "condition": "plan.W <= p('phs.sharpen_max_weeks')", "on_unknown": "skip", "action": {"op": "set", "target": "plan.phase_sequence", "expr": "['SHARPEN', 'TAPER']", "then": [{"op": "cap", "target": "week.planned_time_s", "expr": "state.V28_week_s"}]}}
{"id": "PHS-011", "condition": "plan.W <= p('phs.sharpen_max_weeks') && !demand.met_by_current_state", "on_unknown": "fire", "action": {"op": "fail_closed", "reasons_expr": "['PHASES_DO_NOT_FIT']", "then": [{"op": "generate_options", "order": ["move_date", "lower_goal", "shorter_distance", "base_plan"]}]}}
```

# 03 — Goals and feasibility (v5.2; v1 author B, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria 9 (feasibility check with caveats), 3 (insufficient time → adjust the goal), 2 (how goal inputs change the plan). Rule range FEA-001…099; priorities `nnn` 150–199. Called at 07 S3; returns `weeks_needed` to 04; re-called by 08 on result, goal and life events. Reads only `DerivedState` (07 §3), never raw log entries (CONTRACTS §1.8).

> **In plain words.** You tell us the race, the date and what you want (just finish, or a time). We work out what that race asks of you: how long your longest run must be, how much weekly running you need, and which abilities must be in place. We then count how many safe weeks it takes to get from where you are to there. If the weeks fit, you get a plan. If they almost fit, or your time target is ambitious, you get the plan with a clear warning. If they do not fit, you get no plan for that goal. Instead you see a later date, an easier target or a shorter race, each already checked.

## 1. Goal model

`Goal {distance, family, goal_type, target_time_s, race_date, expected_conditions}` (12 §2).

| Field | Values | How it changes the plan |
|---|---|---|
| `distance` | 5K, 10K, HM, M, 50K, 100K, `none` | selects the demand vector and required levels (02 §5), floors, taper length |
| `family` | derived: 5K/10K → `short`; HM/M → `road_classic`; 50K/100K → `ultra` | selects the default preset family (09) and phase emphasis (04 PHS-015) |
| `goal_type` | `finish` · `time` · `maintain` · `base` | `time` adds the time-goal levels of 02 §5 and the prediction check (§3); `maintain`/`base` have no race and run H0 (04 §2) |
| `target_time_s` | seconds or null | only with `time` |
| `race_date` | date or null | sets W; null with `finish`/`time` → the tool proposes the earliest feasible date (§6, kind `move_date`) |
| `expected_conditions` | `normal`, `hot` | `hot` adds HEAT L2 to the required levels (02 §5) |

`maintain` needs ≥ `maint.sessions_min` days (FEA-037); `base` has no demand beyond the gate.

## 2. Demand

`Demand {preset_id, required_levels, V_req_peak (time, dist), L_req_peak (time, dist), weights}`. Demand is computed **per preset**, because the long-run caps of the schools differ [wg2 §1, CORROBORATED that the caps conflict; min(%, time) is CREDIBLE as a choice].

**Planning speed `S_slow`** (used only to convert distance demand into time demand; never shown, never a pace target, never used for caps):
median speed of measured E0–E2 runs (both fields logged, last 28 days, count ≥ `log.min_entries_30d`); else claimed weekly distance ÷ claimed weekly time; else 1000 / `feas.default_planning_pace_s_per_km`; then × (1 − `feas.planning_speed_margin`). Slower speed → larger time demand, so errors fall on the safe side; logged pace is only moderately reliable [factdesk2 §6, CREDIBLE].

**Governing dimension (v2, F-14/F-25).** Time is the planning unit. Every long-run and weekly-volume *demand* is judged in **time**. Distance is checked only by the distance floors (`race.longest_floor_ratio`, `feas.finish_floor` distance terms), and only where distance is logged or prescribed. A demand counts as met when the planned value is within the rounding tolerance (`load.round_down_s`, `load.round_down_m`) of it (F-13). Every % cap is a share of weekly **time**.

**Long-run demand (v3)** (per preset; values in `parameters.md` §7, §9):
- `L_ratio_time = (race_dist / race.longest_ratio_max[distance][preset]) / S_slow`. This is the run the preset's ratio asks for, converted to time.
- `floor_dist = race_dist / race.longest_floor_ratio[distance][preset]`. Every active preset declares the floor (INV-26):
  - marathon 2.00 (21.1 km), half 1.60 (13.2 km);
  - **50K 2.00 (25 km), 100K 3.00 (33.3 km)** (d2-C R1);
  - short distances: equal to the ratio.
- **One formula for every family (v4, p1-A R7).** `time_cap` = `lr.time_cap_min[distance][preset]` (road and short) or `lr.ultra_time_cap_min[distance]` (ultra).
  `L_req_time = max( min(L_ratio_time, time_cap), floor_dist / S_slow, dur_time(required DUR level) )`
  - It is admissible iff `floor_dist / S_slow ≤ lr.floor_time_max_min[distance]`:
    - marathon 240 min; half 150 min;
    - ultras: equal to their time cap (50K 240, 100K 330), which reproduces v3;
    - short: equal to the cap.
  - Otherwise → `LONG_RUN_UNREACHABLE_PRESET` (FEA-003).
  - When `min()` takes the time cap, the reason `LONG_RUN_TIME_CAPPED` is added. It is a **stretch reason for time goals** and **information for finish goals**, in every family (FEA-005 deleted).
    - Contrarian dissent: ultras should stay stretch.
    - The message shows the runner's own numbers (messages.md §2, LONG_RUN_TIME_CAPPED). P-04 is kept: a very slow runner whose 50K floor needs more than 240 min is routed to the marathon.
  - A target above `time_cap` exists only to reach the floor. Such runs are floor-bound runs (03 §2b) and need TOL L4 measured if their **expected** duration exceeds 180 min (LOD-017).
- **Demand met by logged distance (v4, p1-A R3).** When `L30_eff_dist` is **measured**, the long-run demand counts as met if `L30_eff_dist ≥ race_dist / race.longest_ratio_max`. `S_slow` then only converts *future* planning time; a distance already run is never turned into a time shortfall (FEA-023, FEA-025b, INV-25). Exposure is distance-only [factdesk4 §3, CORROBORATED]; logged pace is only moderately reliable [factdesk2 §6, CREDIBLE].
- **5K finish goals:** `L_req_time = race.5k_finish_lr_min` (30 min, continuous or run-walk under 02 §2). Completing the start ladder meets it (d2-A R2). The 1.30 ratio stays for 5K time goals.
- **§2b Floor-bound runs (v4, p1-B R3).** A long run above the time cap is written "{cap} min; if you have not reached {floor} km, continue to {floor} km, at most {L_req_time} min". Its **expected duration** is `min(L_req_time, max(time_cap, floor_dist ÷ logged median easy speed))`, with no planning margin. The > 180-min guard (LOD-017, INV-28) tests this expected duration. TOL L4 then gates floor runs only for runners slower than about 8:32/km.

**Distance stop vs demand distance (d2-B R1).** `L_req_dist = max(floor_dist, L_req_time × S_slow)` is used **only in feasibility**. The "whichever comes first" distance stop shown to the runner for a long run at the time cap is `min(race_dist / race.longest_ratio_max, lr.abs_cap_km)` (marathon: 30.1 km). It is never derived from `S_slow`, so the 10% planning margin is never a real stop (FEA-002). The phrase "for you about {x} km" uses the **logged median easy speed without margin** (≥ `log.min_entries_30d` measured runs). With fewer runs the phrase is omitted (v4, p1-C R7).
- **Absolute caps:** `floor_dist ≤ lr.abs_cap_km[preset]`, else `LONG_RUN_UNREACHABLE_PRESET`.

**Weekly demand**
- `V_req_time = max( aer_time(required AER), tol_v28(required TOL), floor_time, L_req_time / pct(preset, family) )`
  - `pct` is the preset's long-run share of weekly time. For ultras it is `lr.ultra_pct_cap`, which applies in **peak weeks only** (Room C R1).
  - **v3, road_classic:** the % term is `max( min(L_req_time, time_cap) / pct, L_req_time / lr.over_cap_pct.road_classic )`, with over-cap pct 0.60 (d2-B R2). **Short family:** `pct` depends on run count (`lr.pct_cap.short`: ≤ 3 runs 0.45, 4 runs 0.40, ≥ 5 runs 0.30; d2-A R3).
  - When `L_req_time ≤ lr.pct_floor_s`, the % term is dropped (the floor already admits that long run).
- `V_req_dist = max( floor_dist, ultra: L_req_dist / lr.ultra_pct_cap )`. Distance enters weekly demand only through the floors and the ultra term (Room C R7).
- `floor_*` = `feas.finish_floor.peak_week[distance]`. `aer_time` and `tol_v28` are the 02 §2 thresholds.
- The required HAB level sets runs per week: HAB L2 = 3, L3 = 4, L4 = 5. A marathon finish needs HAB L2 (v3, d2-B R5).

**Required levels** = the 02 §5 finish set, plus the time-goal set if `goal_type = time`, plus FUEL via CMP-008, plus HEAT if `hot`. The set is then **closed under prerequisites** (02 §3), so implied levels (e.g. AER L2 for THR L2) are counted.

> **In plain words: why the school matters.** Take a first-time marathoner whose easy pace is about 6:30/km.
> - **Default plan ("classic-capped"):** the longest run stops at 3 hours or about 30 km, whichever comes first. It must still reach at least 21 km. The long run may be up to half of the week's running time.
> - **Daniels plan (opt-in):** the long run is at most a quarter of the week and 150 minutes, so it needs a much bigger week.
>
> The method computes the demand for the preset you use. Other presets appear only as labelled alternatives (07 §6.2).

```
RULE FEA-001 | priority T4.150 | when Goal.goal_type ∈ {finish, time} | then compute Demand for the active preset with the formulas of §2, using S_slow for every distance→time conversion | because the generator must know the target long run, weekly volume and levels before it can count weeks | evidence 02 §5; wg2 §1, CORROBORATED (caps differ by school); factdesk1 §7, CORROBORATED (long run and volume associated with performance) | basis design_default | default? yes
RULE FEA-002 | priority T2.150 | when S_slow is computed | then use it only for demand conversion; never write it to Session.pace_range or to any cap denominator | because logged pace is only moderately reliable and paces need a measured anchor (INV-15) | evidence factdesk2 §6, CREDIBLE; 07 §3 | basis design_default | default? yes
RULE FEA-003 | priority T4.151 | when floor_dist / S_slow > lr.floor_time_max_min[distance] (every family; for ultras the floor time max equals the ultra time cap), or floor_dist > lr.abs_cap_km[preset] | then add reason LONG_RUN_UNREACHABLE_PRESET and mark the goal infeasible under that preset; when the time cap binds but the floor is reachable add LONG_RUN_TIME_CAPPED (stretch for time goals, information for finish goals) | because one formula serves every family, and the preset cannot produce even the shortest long run the method accepts | evidence factdesk3 §5, factdesk4 §2, CREDIBLE (one cohort; several summaries)/CREDIBLE; hearing-2 med, UNKNOWN (duration); d2-B R2, d2-C R1, p1-A R7 | basis design_default | default? yes
RULE FEA-006 | priority T4.179 | when Goal.cutoff_h is set (any family) | then compare it with the predicted range: cutoff < the fast/low edge (road: P_race × (1 − B_fast); ultra: ultra_range low) → infeasible reason CUTOFF_UNREACHABLE; cutoff < the slow/high edge (road: P_race × (1 + B_slow); ultra: ultra_range high) → stretch reason CUTOFF_AT_RISK | because a race the runner cannot finish within its cut-off is not a safe goal; the honest band decides | evidence wg1 §7, CORROBORATED (band); factdesk4 §10, ALLEGED/UNKNOWN (ultra exponent) → wide range; d2-B R4, d2-C R2 | basis design_default | default? yes
RULE FEA-004 | priority T4.152 | when Goal.expected_conditions = hot | then add HEAT L2 to required_levels | because heat acclimatisation takes 1–2 weeks of exposure | evidence wg5 §4, CORROBORATED; 02 §2 | basis evidence | default? no
```

## 3. Prediction

The prediction answers: **with today's fitness, what time is likely on race day?** It never projects training gains; improvement rates are unknown [factdesk1 §6, UNKNOWN; PHS-012].

**Anchor selection.** Use up to two `PerformanceAnchor`s of distinct distances, most recent first. A measured anchor older than `anchor.max_age_days` counts as `estimated` for prediction and is never used for paces (INV-15).

**Models** (`predicted_band.model_id`):
- `riegel` for targets ≤ HM: `T = T_a × (D/D_a)^e`, `e = pred.riegel_exp_min`. Riegel is well calibrated up to the half [wg1 §7, CORROBORATED; wg3 §4, CORROBORATED].
- `riegel_marathon` for M: `e = max(pred.riegel_exp_min, ln(pred.marathon_from_half) / ln(2))`, i.e. ≈ 1.13; from a half this equals × `pred.marathon_from_half`. Riegel's 1.06 is too fast for the marathon for half of runners [wg1 §7, wg3 §4, CORROBORATED]; the 2.19 factor is CREDIBLE as a conservative default [wg1 §7].
- `ultra_range` for 50K/100K: the predicted (or anchored) marathon time `T_M` gives `low = T_M × (D/42.195)^pred.ultra_exp_low`, `high = T_M × (D/42.195)^pred.ultra_exp_high`. No validated road-ultra formula exists [wg1 §7, UNKNOWN]. The output is a range labelled low confidence, with no point estimate.
- Vickers & Vertosick coefficients are **not** encoded: they are unknown in usable form [factdesk2 §3, UNKNOWN].

**v2 (F-11).** The point comes from the **most recent measured anchor**. A second anchor never hides a newer one. If the second anchor's prediction differs from it by more than `pace.deadband_pct`, the slow side is widened once by `pred.band_widen_estimated`.

**Band (v5 wording, p2-A R4; factdesk6 §7).** The card always names `{fast_edge}` = P_race × (1 − B_fast), `{point}` = P_race and `{slow_edge}` = P_race × (1 + B_slow), and says in words whether the target lies inside the range, faster than it, or slower than it. A range that excludes the target is never shown without that sentence.

**Band.** `P` = point; `P_race = P × (1 − pred.taper_gain_pct)` when the plan has ≥ 1 taper week (taper gain ~2–3% [wg1 §5; hearing-1 §1, CREDIBLE]).
- Fast half-width `B_fast = pred.band_min_pct` (errors 5.9–8% [wg1 §7, CORROBORATED]). **v3:** when the active anchor is measured, at the **same distance** as the goal and ≤ `pred.same_distance_max_age_days` (56) old, `B_fast = pred.band_same_distance_pct` (4%), just above the retest noise (5K CV 3.4%, 10K 2.4% recreational [factdesk4 §6, CREDIBLE: Machado 2015, a single study]; 1–1.5% trained) (d2-A R6). It is **never widened**, so estimated or inflated inputs cannot open room for faster targets.
- Slow half-width `B_slow = pred.band_min_pct × Π(widen factors)`. The factors are: `pred.band_widen_estimated` if any anchor is estimated; `pred.low_volume_widen` if the target is M and `V28_dist < pred.low_volume_km_week` (volume improves marathon prediction [wg1 §7; wg3 §4, CORROBORATED]); `pred.band_widen_estimated` again if `D / D_a > pred.max_extrapolation_ratio`.

### 3b. Pace model (v2, F-12)

Pace ranges are derived **only** from a measured anchor younger than `anchor.max_age_days` (INV-15), or (v5.3, owner decision 2) on the experienced path from a **declared** race (01 INP-005: a confirmed official all-out race entered after the 48-h window). From a declared anchor the slow edge of every range is widened by `exp.declared_pace_widen_pct` (2%: slow s/km × 1.02, rounded up to `pace.round_s`); the fast edge is not widened, so a mis-remembered time cannot push sessions faster. The widening ends when a measured race or field test becomes the active anchor. Otherwise the session stays effort-only.

1. **Equivalent times.** From the anchor, compute equivalent race times `T_5K`, `T_10K`, `T_HM`. Use the Riegel exponent `pred.riegel_exp_min` for distances up to the half, and `riegel_marathon` for `T_M`.
2. **Critical speed (CS).**
   - From an FT-2 test or two races 3–20 min apart: the linear distance–time fit (06 SES-M-020).
   - Otherwise CS ≈ `10000 / T_10K` (m/s). CS approximates 10K race speed [factdesk1 §3, CORROBORATED].
3. **Ranges by effort,** as speed ranges converted to s/km and rounded to `pace.round_s`:

| Effort | Range | Basis |
|---|---|---|
| E4 | 5K-equivalent speed × [0.98, 1.02] | VO2 work near 5K pace [wg1 §1; factdesk3 §1 Daniels I pace, CORROBORATED as practice] |
| E3 | CS × [`pace.e3_low`, `pace.e3_high`] (0.92–0.97) | threshold sits below CS; derived threshold pace tends to be too fast [factdesk1 §3, CORROBORATED direction] → design default |
| E2 | between the M- and HM-equivalent speeds | marathon effort ≈ 85% of CS, wide SD [wg1 §1, CORROBORATED] |
| E1 | M-equivalent speed × [`pace.e1_low`, `pace.e1_high`] (0.72–0.92), always shown with "or slower: talk test rules" | talk test governs easy running [factdesk1 §3, CORROBORATED] |
| E5 | no pace (strides by feel) | — |

4. **Hysteresis (v5.1, external review v5 item 3).** One recreational 5K/10K test has a typical error of about 3.4% (`pace.test_te_pct` [factdesk3 §3, factdesk4 §6, CREDIBLE: Machado 2015, a single study]; trained runners 1–1.5%, CORROBORATED). The difference between two tests therefore varies by about √2 × 3.4% ≈ 4.8%, and the v5 deadband of 3.5% was crossed by noise alone in about half of all retests (≈ 47%). v5.1 sorts a new measured, non-excluded result by the change of its 10K-equivalent from the active anchor:
   - **≤ `pace.deadband_pct` (3.5%):** noise. Nothing changes.
   - **Above the deadband but ≤ the minimum detectable change** `MDC = pace.mdc_mult × pace.test_te_pct` (2.8 × 3.4% ≈ 9.5%; noise alone exceeds it in about 5% of retests): one result does **not** move paces. It is kept as a *pending* result. When a second measured result within `result.confirm_window_days` also differs by more than the deadband **in the same direction**, paces move to the **mean** of the two 10K-equivalents (averaging two tests cuts the typical error by about √2). A pending result in the other direction, or older than the window, is replaced (ADP-067).
   - **Above the MDC:** a real change for one test. Slower results apply at once (ADP-061); faster ones step by `result.max_upgrade_pct` until a second result confirms (ADP-062), and a faster jump above `anchor.jump_confirm_mult × pace.deadband_pct` is first checked with the runner (INP-025).

   **Safety slow-downs never wait for a test.** Two very hard sessions in a row (ADP-066), illness, pain and fatigue (08 §5–§6, 10) ease paces or effort at once; only test-driven changes use the bands above. The MDC formula (1.96 × √2 × typical error) is stated from memory [ALLEGED]; its input is CREDIBLE; the thresholds are design defaults. Deadband plus hysteresis is general control practice [hearing-2 sys-field/sys-acad, CORROBORATED general; untested in running].

> **In plain words.** One test can be a few percent off on a good or bad day. A small change in your test result does not move your paces. A medium change (up to about 9–10%) moves them only when a second test agrees, and then to the average of the two. Only a large change moves them after one test. If runs feel far too hard, or you are ill or in pain, we ease off at once without waiting for a test.
5. Paces never come from the target time, from logged training pace (FEA-002) or from HR formulas (INV-09).

```
RULE FEA-014 | priority T5.150 | when a session at E1–E4 is rendered and INV-15 allows paces | then attach the pace range of §3b computed from the active measured anchor (v5.3: or declared anchor on the experienced path, slow edge widened by exp.declared_pace_widen_pct); re-compute only when the active anchor moves under the §3b step 4 bands (ADP-061, ADP-062, ADP-067; v5.1) | because paces need an explicit, deterministic derivation, and noise below retest variability must not move the plan | evidence factdesk1 §3, CORROBORATED (CS ≈ 10K speed; talk test); factdesk3 §3, factdesk4 §6, CREDIBLE (3.4% CV, Machado 2015, single study) / CORROBORATED (1–1.5% trained); hearing-2 sys, CORROBORATED (deadband practice) | basis design_default | default? yes
```

```
RULE FEA-010 | priority T4.153 | when goal_type = time and a measured or estimated anchor exists | then compute predicted_band with the model for the distance, P_race, B_fast and B_slow as in §3 | because time targets must be checked against current performance with an honest error band | evidence wg1 §7, CORROBORATED; wg3 §4, CORROBORATED | basis design_default | default? yes
RULE FEA-011 | priority T4.154 | when the target distance is M and V28_dist < pred.low_volume_km_week | then widen the slow side by pred.low_volume_widen and show LOW_VOLUME_PREDICTION ("likely optimistic"); it is a stretch reason only for time goals (finish goals: information, plus FEA-006 when a cut-off is set) | because equivalence formulas overpredict the marathon at low volume, but a finish goal's demand is unaffected (d2-B R4) | evidence wg1 §7, CORROBORATED; wg3 §4 impl. 8, CORROBORATED | basis design_default | default? yes
RULE FEA-012 | priority T4.155 | when goal.family = ultra and goal_type = time | then show ultra_range only, add reason ULTRA_LOW_CONFIDENCE, and cap the verdict at stretch | because no validated road-ultra predictor exists | evidence wg1 §7, UNKNOWN; wg2 §4, CORROBORATED (association only) | basis design_default | default? yes
RULE FEA-013 | priority T4.156 | when goal_type = time and no anchor exists | then add reason ANCHOR_UNKNOWN, build the plan on the time-goal levels with effort-only sessions, cap the verdict at stretch, and re-run FEA at the ONBOARD exit test | because a target cannot be judged without a performance anchor; guessed inputs must not become precise paces | evidence opening-outsider §2; factdesk1 §3, CORROBORATED | basis design_default | default? yes
```

## 4. Weeks needed

`weeks_needed {rtr, onboard, base, specific, taper}` feeds 04 §3.

- **`rtr`.** The weeks of the return-to-run ladder from its start rung (10, `rtr.ladder`) when L30 is undefined (GEN-012); else 0. The ladder's exit values become `L0` and `V0`.
- **`onboard`.** `phs.onboard_weeks` when the anchor is unknown or `log_status ≠ rich`; else 0. The front block is **04's `P0` = rtr + max(0, onboard − rtr)** (F-20).
- **`taper`.** `taper.weeks[distance][preset]` (short-family finish goals: `taper.weeks.short_finish`).
- **`specific`, `build`.**
  - `phs.specific_min[distance]` and `phs.build_min`.
  - Both are **0** for a 5K/10K finish goal whose required levels add no THR, VO2 or MSP level (04 §3, Room A R4).
- **Growth weeks `G`.** The weeks from `L0 = L30_eff` and `V0 = V28` up to the **growth targets** `L_target = max(L_req_time, L_hold)` and `V_target = V_req` (05 §3, §5). Closed form, for explanation:
  - `n_L = ⌈ln(L_req_time / L0) / ln(spike.warn_ratio)⌉`. For ultras, multiply by `lr.ultra_peak_every_weeks` (peak long runs come only every 2nd week; Room C R3).
  - `n_V = ⌈ln(V_req / V0) / ln(1 + prog.<profile>.week_max)⌉`; while the baseline is unconfirmed (LOD-007, v5.1) the rate is min(`prog.<profile>.week_max`, `prog.est.week_max`).
  - `G = max(n_L, n_V) + ⌊max(n_L, n_V) / (deload.every − 1)⌋` (when W ≥ `deload.min_plan_weeks`).
  - The **authoritative value** is a dry run of 05's curve builder (LOD-003, LOD-005, LOD-007/008 (v5.1), LOD-010, LOD-012, LOD-014) under the same profile, caps and deload placement. Demand counts as met within the rounding tolerance (F-13).
- **`base`** = max(0, G − build − specific). Long runs keep growing through BUILD and SPECIFIC, so only the excess has to be BASE.
- **Level weeks `K`.** K = the maximum, over required nodes not derived from volume (HAB, THR, VO2, MSP, FUEL, ECO), of `gap_levels(N) × cmp.min_weeks_per_level`.
  - Requirement: `K ≤ W − taper`.
  - HAB levels gained during the ladder count, and so do run-walk HAB L2 attainments (02 §2, Room A R5).
- **Dose fit (Room A R2).** The dry run also checks that each required exit-test dose (06 §3) fits under `tid.hard_share_max[family]` × V at the planned peak. If one does not fit → `LEVELS_UNREACHABLE` (FEA-026).
- **Slack** (v5.2) = W − (rtr + max(base, onboard − rtr) + build + specific + taper). ONBOARD weeks are running weeks that count as growth weeks inside G, so they sit **inside** BASE and are not added again; only the return-ladder or start-ladder weeks (`rtr`, SAF-085) come before BASE. This is the 04 §3 count (step 5). v5 added P0 on top of base, which counted the ONBOARD weeks twice (P3 Ana: slack 3 by the v5 formula, 5 in 13; CHANGELOG-v5.1 §5 b).
- **Dry-run iteration** (v5.2): G depends on the deload placement, which depends on the phases, which depend on G. The dry run starts from the closed-form G, allocates the phases (04 §3), runs the curve, and repeats with the dry-run G until it no longer changes, at most 3 times; if it still changes, the larger G is used (12 §2b.4 `dry_run_weeks_needed`).

**Re-plans count only what is left (F-21).**
- Phase minimums are reduced by the weeks already spent in that phase this season.
- A peak long run logged this season counts toward `L_req` while it is within `feas.peak_credit_days` of the race day (FEA-025).

> **In plain words.** Your longest run can grow by about a tenth at a time, and your weekly running a little each week, with lighter weeks in between. We count how many such steps it takes to reach what the race needs. Then we add the race-practice weeks and the easier weeks before the race, and compare with the weeks you have. When we re-plan later, we only count what is still ahead. A long run you have already done still counts.

```
RULE FEA-020 | priority T4.157 | when computing weeks_needed | then take G from a dry run of 05's curve builder **including the generator's week fill** (run count, adjacency, easy ≤ LR, share caps, LOD-016) with the same profile, presets, caps and deload placement as generation, and derive base, onboard, rtr, specific and taper as in §4 | because the feasibility count must use exactly the caps and the fill the plan will obey (d2-A R4) | evidence wg4 §1, factdesk2 §1, CREDIBLE (one cohort; several summaries) (observational, distance-only); hearing-2 sys, CREDIBLE (simulation over N ≤ 200 weeks is cheap) | basis design_default | default? yes
RULE FEA-021 | priority T4.158 | when K_key > W − weeks_needed.taper − P0, where K_key = max over THR, VO2, MSP, ECO of gap_levels × cmp.min_weeks_per_level (these need key sessions, which ONBOARD, RTR and the start ladder do not hold), or K_all > W − weeks_needed.taper for the other nodes | then add reason LEVELS_UNREACHABLE | because a required level cannot be reached in the weeks that can actually train it (p2-A R5: Karim's THR 2 needed 8 key-session weeks but only 6 existed) | evidence 02 §6; cmp.min_weeks_per_level UNKNOWN | basis design_default | default? yes
RULE FEA-022 | priority T4.159 | when slack < 0 | then add reason PHASES_DO_NOT_FIT | because the phases the goal needs do not fit before the race; a squeezed plan concentrates load | evidence wg4 §1, CORROBORATED (observational); opening-contrarian §1.2 | basis evidence | default? no
RULE FEA-023 | priority T4.160 | when horizon class = H1 | then skip growth: the long-run demand is met if L30_eff_dist (measured) ≥ race / longest_ratio_max, or L30_eff_time ≥ L_req_time; V28 ≥ V_req within tolerance; else CURRENT_STATE_SHORT; non-volume levels are not gates; SHARPEN uses the intensity modules whose prerequisites hold (self-reported levels included), ≤ 1 quality session a week when none is logged; a time target is judged against the band only | because there is no time to build, and a distance already run must not become a time shortfall (p1-A R3) | evidence wg1 §5, wg2 §3, CORROBORATED; factdesk4 §3, CORROBORATED (distance exposure); Room A R7 | basis design_default | default? yes
RULE FEA-024 | priority T4.161 | when horizon class = H5 and goal_type = time | then judge the target against today's band only, add reason LONG_HORIZON_UNPROJECTED, cap the verdict at stretch, and re-run FEA at each season start | because multi-season improvement rates are unknown and projections would be fiction (PHS-012) | evidence factdesk1 §6, UNKNOWN; hearing-1 §2, UNKNOWN | basis design_default | default? yes
RULE FEA-025 | priority T4.175 | when re-running FEA during an active season **with the goal distance unchanged** | then (a) reduce phs.build_min and phs.specific_min by the weeks already spent in those phases, and (b) treat the long-run demand as met if a logged long run of this season reached L_req (time within tolerance, or measured distance ≥ race / longest_ratio_max) within feas.peak_credit_days of the race; on a change of distance a new season starts with full phase minimums (ADP-080), and the deload counter carries over | because done phases must not be re-added, a completed peak is not undone by a short pause, and "this season" ends when the goal changes | evidence F-21; wg3 §3, CORROBORATED (direction); p1-A R2–R3 | basis design_default | default? yes
RULE FEA-026 | priority T4.178 | when the dry run reaches the planned peak week | then for each required exit test (06 §3) check its hard-effort minutes ≤ tid.hard_share_max[family] × V_peak; if not, add reason LEVELS_UNREACHABLE naming the test | because an exit test that never fits the week makes the level unreachable without notice | evidence Room A R2; factdesk3 §1, UNKNOWN (measured shares) | basis design_default | default? yes
```

## 5. Verdict

| Verdict | Condition | What the runner sees |
|---|---|---|
| `infeasible` | any infeasible reason | No plan for this goal. "This goal does not fit safely in the time you have." Plus the ranked options of §6 |
| `stretch` | no infeasible reason and any stretch reason | The plan, with the reasons in plain words and the checkpoint at which the goal is reviewed (next field test, tune-up race or season start) |
| `feasible` | otherwise | The plan; the predicted band if it is a time goal |

Reason texts, headlines (*ambitious*, *tight*, *uncertain*) and checkpoints for every code are in `messages.md` (v4, p1-C R1). At most 2 reasons are shown on the card; the rest are under "Why?". Infeasible reasons (v2): `AVAILABILITY_TIME`, `AVAILABILITY_DAYS`, `LONG_RUN_UNREACHABLE_PRESET`, `LEVELS_UNREACHABLE`, `PHASES_DO_NOT_FIT`, `CURRENT_STATE_SHORT`, `TARGET_OUTSIDE_BAND`, `MARGIN_REQUIRED` (§7). Stretch reasons: `LOW_SLACK`, `TARGET_IN_FAST_BAND`, `ANCHOR_UNKNOWN`, `ESTIMATED_INPUTS`, `LOW_VOLUME_PREDICTION`, `ULTRA_LOW_CONFIDENCE`, `LONG_HORIZON_UNPROJECTED`, `TARGET_BEYOND_CURRENT`, `LONG_RUN_TIME_CAPPED`, `DEGRADED_COMPLETION`, `CUTOFF_AT_RISK`. v3 infeasible reason added: `CUTOFF_UNREACHABLE`. v5 infeasible reason added: `RACE_TOO_SOON` (FEA-044, INV-31). LOW_VOLUME_PREDICTION is a stretch reason only for time goals. `TARGET_OUTSIDE_BAND` is infeasible in H1–H2 only.

A stretch verdict changes only messages and checkpoints, never a cap or dose.

> **In plain words.** "Feasible" means the plan fits with room to spare. "Stretch" means it fits, but only just, or your target is at the fast edge of what your current fitness suggests. You get the plan and a date when we look again. "Not feasible" means we would have to break a safety limit or your schedule to get there, so we show options instead.

```
RULE FEA-030 | priority T3.150 | when V_req_time > RunnerProfile.available_minutes_per_week | then add reason AVAILABILITY_TIME and state the exact extra minutes per week the goal needs (v2, Room C O4) | because user time constraints outrank goal specificity (T3 > T4); the goal changes, not the runner's week | evidence 07 §1; opening-contextrealist §1.3; hearing-1 §2 (≤ 3–4 h/week UNKNOWN) ; N/A (engineering: user's own availability, two-source rule post-audit) | basis eng | default? no
RULE FEA-031 | priority T3.151 | when runs/week required (H1: min(HAB runs, sustained F28); otherwise the HAB level or the preset floor) > min(max_runs_per_week, count(available_days)), or the dry run's fill capacity at max_runs (LOD-031/016, night-shift roster dates excluded for long and key sessions) < V_req | then add reason AVAILABILITY_DAYS and state the run day to add, or the roster shifts that block it | because frequency drives response and the runner's days are a hard constraint; in H1 the runner's current frequency is the honest test (p1-A R4, p1-B R9) | evidence wg3 §2, CORROBORATED (cycling); criteria C2; d2-A case 2 | basis evidence | default? no
RULE FEA-032 | priority T4.162 | when goal_type = time, horizon class ∈ {H1, H2} and target_time_s < P_race × (1 − B_fast) | then add reason TARGET_OUTSIDE_BAND | because there is no time to re-test and confirm a gain; gains are not projected | evidence wg1 §7, CORROBORATED (band); factdesk1 §6, UNKNOWN (gains); Room A R8 | basis design_default | default? yes
RULE FEA-033 | priority T4.163 | when goal_type = time and P_race × (1 − B_fast) ≤ target_time_s < P_race | then add reason TARGET_IN_FAST_BAND | because the target is plausible but at the fast edge of the prediction error | evidence wg1 §7, CORROBORATED | basis design_default | default? yes
RULE FEA-034 | priority T4.164 | when 0 ≤ slack < feas.stretch_margin_weeks | then add reason LOW_SLACK | because one missed week or illness would push the plan past its limits, and catch-up is forbidden (INV-04) | evidence opening-contrarian §1.1; wg3 §5 (27% C25K completion, Relph 2023, single study), CREDIBLE | basis design_default | default? yes
RULE FEA-038 | priority T4.176 | when goal_type = time, horizon class ∈ {H3, H4, H5} and target_time_s < P_race × (1 − B_fast) | then add the stretch reason TARGET_BEYOND_CURRENT; set the interim target = the band edge rounded **up** to pred.round_s; schedule a field test every pred.checkpoint_weeks and translate the interim target into a test time on that test's distance (Riegel, pred.riegel_exp_min, rounded up to display.time_round_s); show MSG-FEA-INTERIM and after each test one of MSG-FEA-CHK-IMPROVED / -SAME / -SLOWER; never project a gain | because the target sets neither paces nor load, and the runner must be able to check the interim target against the test they actually run (p1-C R3) | evidence Room A R8; factdesk1 §6, UNKNOWN; factdesk4 §6, CORROBORATED (retest noise) | basis design_default | default? yes
RULE FEA-035 | priority T4.165 | when any input used in Demand or weeks_needed has confidence = estimated or unknown | then attach the confidence label ESTIMATED_INPUTS ("based partly on your estimates — log your runs to sharpen it"); it is **not** a stretch reason and never changes the verdict | because the safety already sits in GEN-011, the slow profile and B_slow; a day-0 stretch for every new user carried no information (p1-C R2) | evidence factdesk2 §6, CREDIBLE; factdesk5 §1, ALLEGED (recalled times optimistic) | basis design_default | default? yes
RULE FEA-036 | priority T4.166 | when reasons are collected | then verdict = infeasible if any infeasible reason, else stretch if any stretch reason, else feasible; write FeasibilityResult with reasons in code order | because the verdict must be deterministic and explainable | evidence 07 GEN-004; hearing-1 §5, CORROBORATED | basis evidence | default? no
RULE FEA-037 | priority T4.167 | when goal_type = maintain and count(available_days) < maint.sessions_min | then add reason AVAILABILITY_DAYS | because maintenance needs at least two sessions a week with intensity kept | evidence wg1 §5 Spiering, CORROBORATED (general population) | basis evidence | default? no
```

## 6. Goal-level repairs

When the verdict is `infeasible`, the requested goal gets no plan (GEN-003). Options follow 07 §6.2. Each candidate goal runs through S3–S8 and is offered only if it is not `infeasible` **and** its plan validates.

| Rank | Kind | Generation (deterministic) |
|---|---|---|
| 0 | `change_availability` (v4, p1-C R12) | ranked **first** when the only infeasible reasons are `AVAILABILITY_*`: the exact extra minutes per week or run day (or roster change) the goal needs, validated through S3–S8 like any option; **never applied automatically**; the runner edits their availability |
| 1 | `move_date` (v3: the earliest passing date and the reason are always shown, d2-C O5) | lower bound `today + (total weeks needed + feas.stretch_margin_weeks)`; then search week by week up to `goal.date_search_max_weeks`; first passing date. Skipped when the only reasons are `TARGET_OUTSIDE_BAND`, `AVAILABILITY_*` or `LONG_RUN_UNREACHABLE_PRESET` (a later date cannot fix them) |
| 2 | `lower_goal` | time goal: target = `P_race` rounded **up** to `pred.round_s`; then `finish`. Skipped when no infeasible reason is `TARGET_*` or `LEVELS_UNREACHABLE` (a slower target cannot fix long-run, volume, time or day reasons, F-28) |
| 3 | `shorter_distance` | next shorter distance on the original date (100K → 50K → M → HM → 10K → 5K), same goal_type (time target = `P_race` at that distance); first passing distance only |
| 4 | `base_plan` | goal-free H0 BASE (or MAINTAIN if the runner chose maintain before) |
| — | `alternative_preset` | labelled "alternative approach": the first preset in 09's preset order that is compatible with T3 (`SchoolPreset.compatible`) and makes the **original** goal pass; logged as a deviation. Shown separately, not counted in `repair.max_options` |

Options never relax T0–T2; minors' caps (10) apply through S1.

```
RULE FEA-040 | priority T4.168 | when verdict = infeasible | then generate RepairOptions in the order change_availability (alone, when the reasons are all AVAILABILITY_*), **combined** change_availability + move_date ("add {day} and race on or after {date}", whenever any reason is AVAILABILITY_* and other reasons remain), move_date, lower_goal, shorter_distance, base_plan; each validated through S3–S8; keep at most repair.max_options; add the alternative_preset option separately if one passes; for a never-runner show the earliest comfortable date first | because a runner short of days and weeks must see the one change that makes the race possible (p2-A R6: Rose saw only "base plan") | evidence 07 §6.2; opening-systemsarchitect §2; wg2 §1, CORROBORATED (novice plans) | basis design_default | default? yes
RULE FEA-041 | priority T4.169 | when an option's own reasons include any infeasible reason or its plan fails validation | then drop the option without showing it | because every shown option must already be a valid plan | evidence 07 §6.2, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE FEA-042 | priority T4.170 | when 08 re-runs FEA on an active plan and the verdict becomes infeasible | then if a degraded but safe completion exists (FEA-043) continue under it; otherwise hold every future week at or below the current week's planned volume and long run, show the §6 options and wait for the runner's choice | because the tool must not change the goal without consent, nor keep building towards an unsafe target | evidence INV-04; opening-statusquo R3; F-21, UNKNOWN (design default) | basis design_default | default? yes
RULE FEA-043 | priority T4.177 | when a re-plan is infeasible only because of growth reasons (PHASES_DO_NOT_FIT, AVAILABILITY_TIME after a pause, LEVELS_UNREACHABLE) and either (a) the goal-race long-run demand is met or credited (FEA-025) and the remaining weeks hold the taper, or (b) **LADDER_RUNWALK**: goal = 5K finish, the start ladder is unfinished in race week, the current rung ≥ S5 and the race's estimated time on feet ≤ spike.block_ratio × the longest logged ladder session | then emit a degraded completion: keep the goal (time → finish), build the remaining weeks from the current state under every cap with the taper intact (b: race as run-walk at the current rung's pattern; the goal race is warn-exempt, GEN-023), verdict stretch with reason DEGRADED_COMPLETION, and show the §6 options alongside; LADDER_RUNWALK details (v5, p2-C R10): estimated race time on feet = 5 km × ladder.est_pace_s_per_km plus the 5-min warm-up walk, compared with spike.block_ratio × the longest logged ladder session (warm-up included); the last 3 ladder sessions must be clean; race-morning symptom questions are asked; race effort E1–E2; any unknown in these inputs → no completion, earliest date instead | because failing closed weeks before a race helps no one when a safe, honest completion exists; T0–T2 still bind (p1-B R1) | evidence F-21; INV-04; factdesk4 §1, CORROBORATED (C25K weeks may be repeated); wg2 §1, CORROBORATED (run-walk finish times) | basis design_default | default? yes
RULE FEA-044 | priority T4.180 | when a goal race date falls less than race.recovery_days[distance of the previous goal race] after the previous goal race actually run or still planned (across goal changes, INV-31) | then add the infeasible reason RACE_TOO_SOON and offer move_date at the first allowed date; a TRANSITION already started stays in place (ADP-080) | because back-to-back goal races with no recovery block are the weekly-chain attack of p2-C case 8; the convention of about one easy day per mile raced is the only published guide | evidence factdesk6 §1, CORROBORATED as convention (≈ 1 easy day per mile) / CONTRADICTED for ultras / UNKNOWN (no marker minimum for 5K–10K); p2-C R8 | basis design_default | default? yes
```

## 7. Goal-edit gaming

Implements GEN-030…032. Each goal or date edit creates a `GoalEditAttempt` and re-runs S0–S8 (GEN-030, INV-22).

```
RULE FEA-050 | priority T4.171 | when a GoalEditAttempt is submitted and ≥ goal.edit_fail_limit infeasible attempts exist within goal.edit_window_days | then require slack ≥ goal.edit_margin_weeks + feas.stretch_margin_weeks and, for time goals, target ≥ P_race × (1 − B_fast) × (1 + goal.edit_margin_pct); otherwise add reason MARGIN_REQUIRED and show only the §6 options | because boundary-hunting finds plans that pass by a hair | evidence opening-contrarian §2; 07 GEN-031, UNKNOWN (design default) | basis design_default | default? yes
RULE FEA-051 | priority T4.172 | when history claims were raised after an infeasible verdict (GEN-032 fired) | then compute Demand and weeks_needed with the claims at confidence = estimated and the slow profile, and add ESTIMATED_INPUTS | because inflating claims is the main way to unlock a harder plan | evidence opening-contrarian §1.4; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE FEA-052 | priority T4.173 | when a new measured anchor or race result arrives (08 result event) | then re-run FEA from the current week; if the new anchor's 10K-equivalent is within pace.deadband_pct of the active one, keep the narrower B_fast of the two; any verdict change states whether it came from a fitness change or from a change in how precisely fitness is known (MSG-FEA-WHY-CHANGE) | because a noise-level result must not loosen or tighten the goal, and the runner must be told why a verdict moved (p1-C R4) | evidence wg1 §7, CORROBORATED (prediction error); factdesk4 §6, CREDIBLE (retest CV, Machado 2015, single study; v5.1: the pace.deadband_pct threshold is a design default, so the basis is design_default, not evidence) | basis design_default | default? yes
```

## 8. Messages

> **Non-normative copy (v5, p2-A R3).** `messages.md` governs every text below; where they differ, the catalogue wins and this table is a defect to be fixed at the next edit.


| ID | plain_text | why |
|---|---|---|
| MSG-FEA-STRETCH | "Your goal is possible but tight. We'll check again on {checkpoint}." | "{reason_text}" |
| MSG-FEA-NO | "This goal doesn't fit safely in the time you have. Here are options that do." | "Reaching it would need bigger jumps than our safety limits allow, or more time than you have." |
| MSG-FEA-BAND | "Today's fitness suggests about {low}–{high}." | "Race-time predictions are typically off by 6–8%; we show the range, not one number." |
| MSG-FEA-ULTRA | "For ultras we can only give a wide range: {low}–{high}." | "No reliable formula predicts road ultra times." |

## 9. Parameters

All values live in `parameters.md` (v2), which governs. New in v2 for this module:
- `race.longest_floor_ratio.*`
- the per-preset `race.longest_ratio_max.*` (marathon method_default 1.40, higdon_novice 1.32; 5K 1.30)
- `pred.checkpoint_weeks`
- v3: `race.5k_finish_lr_min`, `lr.floor_time_max_min`, `lr.over_cap_pct.road_classic`, `pred.band_same_distance_pct`, `pred.same_distance_max_age_days`, ultra floors
- `feas.peak_credit_days`
- the `pace.*` parameters (pace model §3b)

## 10. Conflicts with contract and other modules (v1 record; resolved in RESOLUTIONS.md)

1. **Default marathon demand is very high (02, 05, 09, parameters.md).** With `race.longest_ratio_max.M` = 1.60 and Daniels caps (method_default), L_req = 26.4 km needs ≈ 106 km/week and exceeds 150 min for anyone slower than ≈ 5:40/km, so nearly every first marathoner routes to the alternative preset. Proposed per-preset ratios (§9; Daniels 2.0 → still ≈ 84 km/week). **Architect decision:** keep Daniels caps as the `road_classic` default and accept this, or name another default preset.
2. **Hansons** (42.2 / 25.7 km = 1.64) fails the default 1.60; override 1.65 needed.
3. **12 §4:** FEA-002 adds a use of derived logged pace (demand conversion only); please add it to the "Used for" column.
4. **Ultra (09):** under the 150-min cap a 40 km ultra long run is unreachable; `koop_ultra` caps must be the `ultra` default or FEA-003 fails every ultra.
5. **Ultra time goals** are capped at stretch (FEA-012); 09/11 to confirm.

## Tests

| Rule | Fires | Silent |
|---|---|---|
| FEA-001 | finish M goal → Demand written | goal_type = base |
| FEA-002 | S_slow computed → not in any pace_range | — (static check: no write path) |
| FEA-003 | daniels, M, 6:30/km, ratio 1.60 | pfitzinger_classic, same runner |
| FEA-004 | hot 50K | normal conditions |
| FEA-010 | 10K target with measured 5K | finish goal |
| FEA-011 | M, V28 30 km | M, V28 60 km |
| FEA-012 | 100K time goal | 100K finish goal |
| FEA-013 | 5K time goal, no anchor | measured anchor present |
| FEA-020 | 16-week M plan | H1 plan |
| FEA-021 | M time goal, THR 0, W 6 | THR 2 held |
| FEA-022 | first M in 10 weeks from L30 8 km | same in 30 weeks |
| FEA-023 | 3-week HM, L30 10 km | 3-week 5K, state meets demand |
| FEA-024 | M time goal 80 weeks out | 16 weeks out |
| FEA-030 | M on 180 min/week | M on 420 min/week |
| FEA-031 | HM, max 3 runs | 4 runs |
| FEA-032 | P_race 4:00, target 3:35 | target 3:55 |
| FEA-033 | target 3:55 | target 4:05 |
| FEA-034 | slack 1 | slack 3 |
| FEA-035 | claimed L30 only | rich log |
| FEA-036 | mixed reasons → infeasible | none → feasible |
| FEA-037 | maintain, 1 day | 2 days |
| FEA-040 | 3 h/week M → options | feasible goal |
| FEA-041 | move_date fails validation → dropped | option passes |
| FEA-042 | illness re-plan → infeasible, held | re-plan feasible |
| FEA-050 | 4th failed edit in 5 days | 1st edit |
| FEA-051 | L30 claim raised after fail | claim unchanged |
| FEA-052 | new 10K result mid-plan | no result |

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "FEA-001", "condition": "goal.goal_type in ['finish', 'time']", "on_unknown": "skip", "action": {"op": "set", "target": "demand", "expr": "compute_demand(goal, preset, state.s_slow)"}, "status": "procedure"}
{"id": "FEA-002", "condition": "true", "on_unknown": "fire", "action": {"op": "constraint", "check": "dataflow: state.s_slow is read only by compute_demand; never by session.pace_range or any cap denominator"}, "status": "static"}
{"id": "FEA-003", "condition": "demand.floor_dist_m / state.s_slow > unit.min_s * p('lr.floor_time_max_min.' + goal.distance) || demand.floor_dist_m > unit.km_m * p('lr.abs_cap_km.' + preset.id)", "on_unknown": "fire", "action": {"op": "add_reason", "code": "LONG_RUN_UNREACHABLE_PRESET", "then": [{"op": "set", "target": "feas.preset_ok", "expr": "false"}]}}
{"id": "FEA-004", "condition": "goal.expected_conditions == 'hot'", "on_unknown": "skip", "action": {"op": "set", "target": "demand.required_levels.HEAT", "expr": "max(demand.required_levels.HEAT, p('cmp.heat_required_level'))"}}
{"id": "FEA-010", "condition": "goal.goal_type == 'time' && has(anchor.time_s)", "on_unknown": "skip", "action": {"op": "set", "target": "feas.predicted_band", "expr": "predict_band(goal.distance, anchor, state)"}, "status": "procedure"}
{"id": "FEA-013", "condition": "goal.goal_type == 'time' && !has(anchor.time_s)", "on_unknown": "fire", "action": {"op": "add_reason", "code": "ANCHOR_UNKNOWN", "then": [{"op": "floor", "target": "feas.verdict_rank", "expr": "verdict_rank('stretch')"}, {"op": "set", "target": "plan.pace_mode", "expr": "'effort_only'"}]}}
{"id": "FEA-014", "condition": "effort_rank(session.effort_target) >= effort_rank('E1') && effort_rank(session.effort_target) <= effort_rank('E4') && (anchor.confidence == 'measured' || (anchor.confidence == 'declared' && state.exp_path in ['calibrating', 'confirmed'])) && days_between(anchor.date, session.date) <= p('anchor.max_age_days')", "on_unknown": "skip", "action": {"op": "set", "target": "session.pace_range", "expr": "pace_range(anchor, session.effort_target)"}, "status": "procedure"}
{"id": "FEA-020", "condition": "goal.goal_type in ['finish', 'time']", "on_unknown": "skip", "action": {"op": "set", "target": "feas.weeks_needed", "expr": "dry_run_weeks_needed(goal, preset, state)"}, "status": "procedure"}
{"id": "FEA-021", "condition": "feas.k_key > feas.weeks_available - feas.weeks_needed.taper - feas.p0 || feas.k_all > feas.weeks_available - feas.weeks_needed.taper", "on_unknown": "fire", "action": {"op": "add_reason", "code": "LEVELS_UNREACHABLE"}}
{"id": "FEA-022", "condition": "feas.slack < 0", "on_unknown": "fire", "action": {"op": "add_reason", "code": "PHASES_DO_NOT_FIT"}}
{"id": "FEA-023", "condition": "feas.horizon == 'H1' && !((anchor_l30_ok(state, goal)) && state.V28_time_s >= demand.V_req_time_s * (1 - p('val.conformance_tol_pct') / unit.pct))", "on_unknown": "fire", "action": {"op": "add_reason", "code": "CURRENT_STATE_SHORT"}}
{"id": "FEA-030", "condition": "demand.V_req_time_s > unit.min_s * profile.available_minutes_per_week", "on_unknown": "fire", "action": {"op": "add_reason", "code": "AVAILABILITY_TIME", "args": {"extra_min": "(demand.V_req_time_s / unit.min_s) - profile.available_minutes_per_week"}}}
{"id": "FEA-031", "condition": "demand.runs_req > min(profile.max_runs_per_week, size(profile.available_days)) || feas.fill_capacity_s < demand.V_req_time_s", "on_unknown": "fire", "action": {"op": "add_reason", "code": "AVAILABILITY_DAYS"}}
{"id": "FEA-032", "condition": "goal.goal_type == 'time' && feas.horizon in ['H1', 'H2'] && goal.target_time_s < feas.P_race_s * (1 - feas.B_fast)", "on_unknown": "fire", "action": {"op": "add_reason", "code": "TARGET_OUTSIDE_BAND"}}
{"id": "FEA-033", "condition": "goal.goal_type == 'time' && feas.P_race_s * (1 - feas.B_fast) <= goal.target_time_s && goal.target_time_s < feas.P_race_s", "on_unknown": "fire", "action": {"op": "add_reason", "code": "TARGET_IN_FAST_BAND"}}
{"id": "FEA-034", "condition": "feas.slack >= 0 && feas.slack < p('feas.stretch_margin_weeks')", "on_unknown": "fire", "action": {"op": "add_reason", "code": "LOW_SLACK"}}
{"id": "FEA-035", "condition": "exists(feas.inputs_used, i, i.confidence != 'measured')", "on_unknown": "fire", "action": {"op": "label", "code": "ESTIMATED_INPUTS", "msg": "MSG-FEA-ESTIMATED"}}
{"id": "FEA-036", "condition": "event.type == 'reasons_collected'", "on_unknown": "skip", "action": {"op": "set_verdict", "expr": "exists(feas.reasons, x, reason_class(x) == 'infeasible') ? 'infeasible' : (exists(feas.reasons, x, reason_class(x) == 'stretch') ? 'stretch' : 'feasible')"}}
{"id": "FEA-040", "condition": "feas.verdict == 'infeasible'", "on_unknown": "fire", "action": {"op": "generate_options", "order": ["change_availability", "change_availability+move_date", "move_date", "lower_goal", "shorter_distance", "base_plan", "alternative_preset"], "expr": "all(feas.reasons, x, reason_group(x) == 'availability') ? 'change_availability' : (exists(feas.reasons, x, reason_group(x) == 'availability') ? 'change_availability+move_date' : 'move_date')", "max_expr": "p('repair.max_options')"}}
{"id": "FEA-041", "condition": "exists(option.reasons, x, reason_class(x) == 'infeasible') || !option.plan_valid", "on_unknown": "fire", "action": {"op": "drop_option", "target": "option"}}
{"id": "FEA-043", "condition": "event.type == 'regeneration' && all(feas.reasons, x, x in ['PHASES_DO_NOT_FIT', 'AVAILABILITY_TIME', 'LEVELS_UNREACHABLE']) && ((demand.long_run_met || demand.credited) && feas.weeks_left >= feas.weeks_needed.taper || (goal.distance == '5K' && goal.goal_type in ['finish', 'time'] && state.on_start_ladder && state.ladder_rung_index >= p('ladder.runwalk_race_min_rung') && goal.distance_km * p('ladder.est_pace_s_per_km') + p('ses.warmup_s') <= p('spike.block_ratio') * state.longest_ladder_session_s && state.last3_ladder_clean))", "on_unknown": "fire", "action": {"op": "set_verdict", "expr": "'stretch'", "then": [{"op": "add_reason", "code": "DEGRADED_COMPLETION"}, {"op": "set", "target": "goal.goal_type", "expr": "'finish'"}, {"op": "set", "target": "plan.degraded", "expr": "true"}, {"op": "emit_message", "msg": "MSG-FEA-DEGRADED"}]}}
{"id": "FEA-044", "condition": "has(state.last_goal_race_date) && days_between(state.last_goal_race_date, goal.race_date) < p('race.recovery_days')[state.last_goal_race_distance]", "on_unknown": "fire", "action": {"op": "add_reason", "code": "RACE_TOO_SOON", "then": [{"op": "generate_options", "order": ["move_date"], "expr": "date_add(state.last_goal_race_date, p('race.recovery_days')[state.last_goal_race_distance])"}]}}
{"id": "FEA-006", "condition": "has(goal.cutoff_h) && unit.h_s * goal.cutoff_h < feas.slow_edge_s", "on_unknown": "fire", "action": {"op": "add_reason", "code": "CUTOFF_UNREACHABLE", "when": "unit.h_s * goal.cutoff_h < feas.fast_edge_s", "otherwise": {"op": "add_reason", "code": "CUTOFF_AT_RISK"}}}
{"id": "FEA-011", "condition": "goal.distance == 'M' && state.V28_dist_m < unit.km_m * p('pred.low_volume_km_week')", "on_unknown": "fire", "action": {"op": "set", "target": "feas.B_slow", "expr": "feas.B_slow * p('pred.low_volume_widen')", "then": [{"op": "add_reason", "code": "LOW_VOLUME_PREDICTION", "when": "goal.goal_type == 'time'", "otherwise": {"op": "label", "code": "LOW_VOLUME_PREDICTION"}}]}}
{"id": "FEA-037", "condition": "goal.goal_type == 'maintain' && size(profile.available_days) < p('maint.sessions_min')", "on_unknown": "fire", "action": {"op": "add_reason", "code": "AVAILABILITY_DAYS"}}
{"id": "FEA-038", "condition": "goal.goal_type == 'time' && feas.horizon in ['H3', 'H4', 'H5'] && goal.target_time_s < feas.P_race_s * (1 - feas.B_fast)", "on_unknown": "fire", "action": {"op": "add_reason", "code": "TARGET_BEYOND_CURRENT", "then": [{"op": "set", "target": "goal.interim_target_s", "expr": "round_up(feas.P_race_s * (1 - feas.B_fast), p('pred.round_s'))"}, {"op": "schedule_session", "module_expr": "'SES-M-020'", "when": "weeks_between(state.last_field_test_date, today) >= p('pred.checkpoint_weeks')"}, {"op": "emit_message", "msg": "MSG-FEA-INTERIM"}]}}
{"id": "FEA-042", "condition": "plan.is_regeneration && feas.verdict == 'infeasible'", "on_unknown": "fire", "action": {"op": "freeze", "target": "plan.future_weeks", "until": "has(event.option_chosen)", "unless": "feas.degraded_available", "then": [{"op": "generate_options", "order": ["change_availability", "change_availability+move_date", "move_date", "lower_goal", "shorter_distance", "base_plan", "alternative_preset"]}]}}
{"id": "FEA-050", "condition": "count(goal.edits, e, e.verdict == 'infeasible' && days_between(e.submitted_at, today) <= p('goal.edit_window_days')) >= p('goal.edit_fail_limit') && (feas.slack < p('goal.edit_margin_weeks') + p('feas.stretch_margin_weeks') || (goal.goal_type == 'time' && goal.target_time_s < feas.P_race_s * (1 - feas.B_fast) * (1 + p('goal.edit_margin_pct') / unit.pct)))", "on_unknown": "fire", "action": {"op": "add_reason", "code": "MARGIN_REQUIRED"}}
{"id": "FEA-051", "condition": "event.claims_raised && state.last_verdict == 'infeasible'", "on_unknown": "fire", "action": {"op": "set", "target": "feas.claims_confidence", "expr": "'estimated'", "then": [{"op": "set", "target": "state.progression_profile", "expr": "'slow'"}, {"op": "label", "code": "ESTIMATED_INPUTS"}]}}
{"id": "FEA-052", "condition": "event.type == 'result' && anchor.confidence == 'measured'", "on_unknown": "skip", "action": {"op": "regenerate", "from_stage": "S3", "then": [{"op": "set", "target": "feas.B_fast", "expr": "abs(anchor.equiv_10k_s - state.pace_anchor_10k_equiv_s) <= p('pace.deadband_pct') / unit.pct * state.pace_anchor_10k_equiv_s ? min(feas.B_fast, feas.prev_B_fast) : feas.B_fast"}, {"op": "emit_message", "msg": "MSG-FEA-WHY-CHANGE", "when": "feas.verdict != state.last_verdict"}]}}
{"id": "FEA-026", "condition": "event.type == 'compute_weeks_needed' && exists(demand.required_tests, x, x.hard_time_s > p('tid.hard_share_max.' + goal.family_tid) * feas.v_peak_s)", "on_unknown": "fire", "action": {"op": "add_reason", "code": "LEVELS_UNREACHABLE", "args": {"skill": "first(demand.required_tests, x, x.hard_time_s > p('tid.hard_share_max.' + goal.family_tid) * feas.v_peak_s).name"}}}
```

# 05 — Load and progression (v5.2; v1 author B, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria 7 (load-progression limits with grades), 5 (deterministic rules, stated defaults), 8 (schools as parameters). Rule range LOD-001…099; priorities `nnn` 250–299. Used at 07 S6 (week skeleton) and by 03 as a dry run (FEA-020). 04 places deloads and the taper; 06 fills sessions inside the budgets set here. The validator (07 §5) re-checks everything. These rules make plans pass the invariants by construction, so that repairs are rare.

> **In plain words.** This part decides how much you run each week, how long your longest run is, how much of it is hard, and how the plan eases off before the race. The main safety rule is simple: no run is more than about one tenth longer than your longest run of the past month. Weekly running grows slowly, with a lighter week every few weeks. Most running is easy. Before the race you run less, but you keep running as often and keep a little faster running.

## 1. Load model

| Quantity | Definition | Role |
|---|---|---|
| Session duration | time on feet, walk breaks included (s) | INV-02 caps, weekly time, availability |
| Session distance | metres, when logged or prescribed | INV-01 caps, floors, Knopp ranges |
| Session load | RPE (0–10) × minutes (session-RPE) [wg1 §3, CORROBORATED] | fatigue signals in 08; display |
| Weekly volume `V` | sum of durations (time is the planning unit); distance tracked alongside | progression, TID, availability |
| `L30_eff` (dist, time) | 07 GEN-010…013 | denominator of every spike cap |

Time is the planning unit: many plans are effort-only and run-walk is first-class [wg2 §1, CORROBORATED]. Distance stays a cap wherever `L30_eff_dist` is defined; manual weekly distance is fairly reliable [factdesk2 §6, CREDIBLE].

**Display-only metrics.** ACWR, monotony/strain and Banister/CTL-ATL-TSB may be shown as descriptions. They never appear in a blocking condition (INV-10). ACWR as a predictor is CONTRADICTED. Monotony > 2.0 is ALLEGED. Banister predicts poorly [wg1 §3; wg4 §1].

```
RULE LOD-001 | priority T5.250 | when computing any load quantity for a rule condition | then use only duration, distance and session-RPE load from DerivedState; ACWR, monotony, strain and fitness-fatigue values are written to display fields only | because no load model is validated for prescription | evidence wg1 §3, CORROBORATED/CONTRADICTED; hearing-1 §1, CORROBORATED | basis evidence | default? no
```

## 2. Progression profiles

| Profile | `week_max` | `2wk_max` | Selected when |
|---|---|---|---|
| `standard` | `prog.standard.week_max` | `prog.standard.2wk_max` | none of the slow triggers |
| `slow` | `prog.slow.week_max` | `prog.slow.2wk_max` | `log_status ≠ rich`; any core input not measured; probation (GEN-011/014/032); context modifiers of 01 (novice, injury in last 12 months, other-sport background, masters ≥ 50); RTR exit until `log.probation_weeks` complete |

Grades: the weekly 10% rule failed its RCT (GRONORUN 20.8% vs 20.3% injured) [wg4 §1, CORROBORATED]. In Nielsen 2014, > 30% over 2 weeks gave HR 1.59 for distance-related injuries, which was non-significant [wg4 §1; wg3 §2, CORROBORATED figures]. Week-to-week change showed no association with injury in Frandsen 2025 [wg4 §1, CORROBORATED]. Weekly ceilings are therefore **conventions that keep growth gradual**, not proven safety limits. The single-session cap (§3) is the primary load rule.

**Baseline hold (v2, F-04/F-05/F-06).** `V_hold` = the mean planned-and-logged volume of the last two non-deload weeks, or V28 when the plan starts. `L_hold` = L30_eff. No planned week drops below `V_hold`, and no long run below `L_hold`, unless one of these requires it:
- a safety gate (T0–T2: red flags, screening, spike caps, gap or illness rules);
- a user constraint (T3);
- a deload, taper, transition, return ladder, or SHARPEN.

A preset's long-run cap (T5) can stop growth. It never forces a regression; the plan holds the current value and logs a ledger entry.

**Baseline.** Growth is measured from the **last non-deload week** (INV-16). That week counts only if it is no more than `prog.baseline_max_age_weeks` old. Otherwise (after a taper, transition, RTR or gap) the baseline is the most recent completed week's logged volume. Without this, a post-race week could jump to 1.15 × the pre-taper peak.

**Unconfirmed baseline (v5.1, external review v5 item 4).** A starting volume from memory is not a measured one. In v5 a claims-only runner (13 §3, Ana) went from 210 to 360 min a week in 5 weeks (+71%), all within LOD-003, because the slow profile ends after `log.probation_weeks`. Until the log confirms the baseline, a stricter weekly cap applies on top of LOD-003 (LOD-007): V(w) ≤ (1 + `prog.est.week_max`) × the best weekly time logged in the last `prog.est.window_weeks` weeks (planned weeks count provisionally and are replaced by logged ones at every re-plan; before any logged week, the claimed weekly time). The baseline counts as **confirmed** after `prog.est.confirm_weeks` (6) consecutive logged weeks, each with ≥ `prog.est.confirm_ratio` (0.80) of its planned time logged (LOD-008). Runners whose log already holds those weeks start confirmed. The cap is T2, so the baseline-hold floor (LOD-005) cannot lift a week above it. Grade: the 10% value is a convention with weak evidence [wg4 §1: GRONORUN found no benefit, CORROBORATED]; 6 weeks and 0.80 are design defaults (UNKNOWN). With these values Ana reaches 360 min in week 7 (+59% over 6 weeks, at most +10% on any logged week) instead of week 6.

> **In plain words.** If your starting numbers come from memory, your weekly running grows by at most a tenth over your best logged week, until six weeks of logged running show where you really start. Then it grows at the usual rate.

```
RULE LOD-002 | priority T5.251 | when DerivedState.progression_profile is resolved | then select slow if any slow trigger of §2 holds, else standard; MIN applies if a context modifier sets a lower ceiling | because unverified history and higher-risk groups should not unlock fast growth | evidence wg4 impl. 5, CORROBORATED; hearing-1 §3 (prior injury), CORROBORATED; wg3 §2 other-sport, CREDIBLE | basis design_default | default? yes
RULE LOD-003 | priority T5.252 | when planning a non-deload, non-taper week w | then V(w) ≤ (1 + week_max) × V(baseline) and V(w) ≤ (1 + 2wk_max) × V(the non-deload week two non-deload weeks before w) | because gradual weekly growth is universal practice; the 2-week window mirrors Nielsen's exposure | evidence wg4 §1 Nielsen, Buist, CORROBORATED (weak, non-significant) | basis design_default | default? yes
RULE LOD-004 | priority T5.253 | when the last non-deload week is older than prog.baseline_max_age_weeks | then baseline = the most recent completed week's logged volume (planned volume if no log yet) | because a stale peak must not license a jump after taper, transition or a gap | evidence wg3 §3 detraining, CORROBORATED (direction); opening-contrarian §2 | basis design_default | default? yes
RULE LOD-005 | priority T5.267 | when a non-deload, non-taper, non-transition, non-RTR week is planned | then V(w) ≥ min(V_hold, every T0–T3 limit) and LR(w) ≥ min(L_hold, spike cap, T0–T3 limits); a T5 preset cap below L_hold holds LR at L_hold and logs a deviation; **Goal-change carry-over (v4, p1-A R2; replaces the v3 ultra→road special case).** On any change of goal distance, `L_hold = min(L30_eff, max(L_target_new, lr_cap(new preset, V_hold)))`, so a marathon long run is not carried into a 10K plan beyond what the new plan needs or allows. | because a plan must never cut a runner's current long run or volume unless safety or the runner's own limits require it | evidence F-04/F-05; factdesk3 §5 (longer longest run, fewer race-day injuries), CORROBORATED; factdesk3 §9 (under-preparation and injury in ultras), CREDIBLE | basis design_default | default? yes
RULE LOD-006 | priority T5.269 | when a week would step up volume or the long run, or a level would be unlocked | then require an answered pain prompt (INP-022) on ≥ pain.answered_min_ratio of the sessions of the last 14 days; otherwise hold the step (no increase) and show MSG-LOD-PAIN-ANSWER | because the pain model only protects runners whose pain answers it sees; missing answers are unknown, never "no pain" (p2-C R3) | evidence factdesk1 §2, CORROBORATED (next-morning rule); factdesk6 §3, CORROBORATED (prompt compliance ≈ 75%, so the default is 0.7) | basis design_default | default? yes
RULE LOD-007 | priority T2.259 | when state.baseline_confirmed = false and a non-deload week w outside TAPER, TRANSITION, RTR and START_LADDER is planned | then V(w) ≤ (1 + prog.est.week_max) × week.est_base_s (the best weekly time logged in the prog.est.window_weeks weeks before w; planned weeks count provisionally until logged; while no week is logged, the claimed V_hold); numeric MIN with LOD-003; show MSG-LOD-EST-CAP once | because a starting volume from memory is unverified, and under LOD-003 alone a claims-only runner went from 210 to 360 min a week in 5 weeks (+71%, external review v5 item 4); growth must follow what the log shows | evidence wg4 §1 Buist (GRONORUN), CORROBORATED that a 10%-a-week plan did not lower injuries; the 10% value is UNKNOWN as a safety limit (convention); external review v5 item 4 | basis design_default | default? yes
RULE LOD-008 | priority T2.260 | when state.baseline_confirmed = false and state.est_confirm_weeks ≥ prog.est.confirm_weeks (consecutive completed weeks with measured entries and logged time ≥ prog.est.confirm_ratio × planned; logged weeks before the first plan count; an unlogged week restarts the count) | then baseline_confirmed = true: LOD-007 stops applying and growth follows the active profile (LOD-002/003); show MSG-LOD-BASE-CONFIRMED | because after several logged weeks at the planned volume the baseline is a record, not a recollection | evidence factdesk2 §6, CREDIBLE (manual weekly logs fairly reliable); count and ratio UNKNOWN (design default) | basis design_default | default? yes
```

## 3. Spike caps in generation

**Long-run curve.** For each future week `w`:

`L30_eff(w) = max(L30_eff at plan time (while its run is < 30 days before w), planned non-race runs dated in the 30 days before w)`

Planned runs count provisionally. On every re-plan (08), logged runs replace them, so a shortened long run lowers the next step automatically. Then

`L_target = max(L_req_time, L_hold)` for goal plans. For H0 base plans it is `max(L_hold, dur_time(next DUR level))`.

`LR(w) = round_down( min( spike.warn_ratio × L30_eff(w), L_target, max(lr_cap(preset, V(w)), L_hold), template LR(w) ) )`

**Volume-carrying long run (v3, d2-A R3).** Sometimes water-filling leaves V(w) below max(V_req, V_hold) because every easy day is at its cap (easy ≤ LR, adjacency). In that case LR(w) is raised along the LOD-003 curve, under INV-01/02, the time cap and the run-count share cap, until the week fills (LOD-016). This never happens to chase `V_next`. A `V_next` shortfall only shows MSG-LOD-FILL: "Add a run day if you want your weekly running to keep growing."

**Long runs over 180 min (v3).** Any planned run over 180 min needs TOL L4 at confidence `measured` and is rendered run-walk (SES-009) (LOD-017). This applies to the marathon floor runs, the extension runs (DST-019) and ultra long runs.

v2 (Room A R1, F-04): `L_req` is no longer an upper bound. The long run grows toward `L_target`. It never exceeds the spike caps, and it never falls below `L_hold` because of a preset cap. The result is in **both** distance and duration (`spike.apply_duration`). Rounding is down to `load.round_down_s` / `load.round_down_m`, so a rounded value never exceeds a cap.

**Whichever comes first.** A run prescribed by time carries a distance stop of `spike.warn_ratio × L30_eff_dist` ("75 min easy or 12 km, whichever comes first"). A run prescribed by distance carries the matching time stop. INV-01 and INV-02 therefore hold without assuming a pace.

**Hold steps.** If the template step (e.g. Higdon's ≈ 1.17–1.29× step-ups [factdesk2 §7, sequence ALLEGED]) exceeds the cap, the long run is clamped. The template's later steps shift by one week (REP-002 applied at generation). Each clamp writes a `DeviationLedgerEntry`.

**Two-day budget (v2).** The day before and the day after the long run each get at most `min(two_day.adjacent_ratio × LR(w), two_day.cap_ratio × L30_eff − LR(w))`. If that is below `lod.min_run_s`, the day becomes rest or cross-training.

**Races.** The goal race is exempt from INV-01/02 (INV-25). A race counts toward `L30_eff` only up to `spike.warn_ratio ×` the pre-race `L30_eff`. Otherwise a marathon would license a 46 km "long run" a month later (consistent with GEN-023). Tune-up races in the plan are long runs and obey the caps. Tune-ups the runner adds are runner-edited sessions: warn above `spike.warn_ratio`, block above `spike.block_ratio`.

> **In plain words.** Your next long run can be at most about 10% longer than the longest run you did in the past 30 days, measured in both time and distance. If a plan you know jumps faster, we repeat a week instead and tell you so. Long runs are written as "X minutes or Y km, whichever comes first". The days next to a long run are kept short. The race itself is allowed to be longer; it does not set your next training target.

```
RULE LOD-010 | priority T2.250 | when planning any non-race run | then distance ≤ spike.warn_ratio × L30_eff_dist(w) and duration ≤ spike.warn_ratio × L30_eff_time(w), each rounded down; the unprescribed dimension is emitted as a "whichever comes first" stop | because the single-session spike is the best-supported load signal (HRR 1.64 for > 10–30%) | evidence wg4 §1, wg3 §2, factdesk2 §1, CREDIBLE (one cohort; several summaries) (observational, distance-only; cut-point ALLEGED; duration UNKNOWN) | basis design_default | default? yes
RULE LOD-011 | priority T2.251 | when computing L30_eff for a future week | then use max(current L30_eff still inside the 30-day window, planned non-race runs in the window); replace planned by logged values at every re-plan; after a gap of gap.reduce_trigger_days or more (G1/G2 bands), runs dated before the gap leave the window: the first week back uses GEN-013's factors on the pre-gap value, and every later week uses post-gap runs only | because the cap must follow what the runner actually does; v2 let a 154-min return run jump to a pre-illness 257-min peak (+67%) in the second week back (d2-C R5) | evidence factdesk2 §1, factdesk4 §9, UNKNOWN (gap handling); factdesk3 §7, CORROBORATED (spike risk) | basis design_default | default? yes
RULE LOD-012 | priority T2.252 | when a session with is_race = true is logged | then it raises L30_eff to at most spike.warn_ratio × the pre-race L30_eff | because the race exemption must not ratchet later training | evidence 07 INV-25, GEN-023; wg4 §1 (spikes), CORROBORATED | basis design_default | default? yes
RULE LOD-013 | priority T2.253 | when placing runs on the days before and after the long run | then each such day ≤ min(two_day.adjacent_ratio × LR(w), two_day.cap_ratio × L30_eff − LR(w)); if that is below lod.min_run_s the day becomes rest or cross-training | because two consecutive long days concentrate load; the v1 cap (1.30 × L30) collapsed weekly volume (F-05) | evidence opening-contrarian I2, ALLEGED; F-05 → design default | basis design_default | default? yes
RULE LOD-014 | priority T5.254 | when the template long run of week w exceeds the LOD-010 cap | then clamp it, repeat the previous step, shift later template steps by one week and log a DeviationLedgerEntry | because published step-ups often exceed 1.10× and templates are not trusted | evidence factdesk2 §7, ALLEGED (sequence); 07 §7 | basis design_default | default? yes
RULE LOD-015 | priority T2.254 | when a session is run-walk or time-prescribed | then apply LOD-010 to time on feet including walk breaks | because duration transfer of the spike finding is unknown, so the method caps both | evidence factdesk2 §1, UNKNOWN; 07 INV-02 | basis design_default | default? yes
RULE LOD-016 | priority T5.268 | when water-filling leaves V(w) < max(V_req, V_hold) with every easy day at its cap | then raise LR(w) step by step under spike.warn_ratio × L30_eff, the time cap and lr.pct_cap.short[runs] (or the family's share cap) until V(w) is reached or a cap binds; never for V_next (show MSG-LOD-FILL instead) | because at 3 runs a week easy ≤ LR froze volume below demand; the long run is the only safe carrier (d2-A R3) | evidence wg4 §1, CORROBORATED (spike rule); factdesk4 §5, CREDIBLE (C25K longest run 33–40% of the week); factdesk3 §7, UNKNOWN (share–injury) | basis design_default | default? yes
RULE LOD-017 | priority T2.257 | when a planned run's **expected duration** exceeds lr.long_guard_min (180 min) (expected = min(L_req_time, max(time_cap, distance target ÷ logged median easy speed)) for floor-bound and distance-targeted runs; planned duration otherwise) | then require TOL L4 with confidence = measured, and for age_high ≥ masters.vigorous_assessment_age also the attestation of SAF-060; otherwise cap it at lr.long_guard_min and log the deviation; render it run-walk (SES-009) | because no evidence links single-run duration to injury, so the method guards long runs by measured tissue tolerance, and the test must use the runner's real speed, not the planning margin (p1-B R3, R4) | evidence hearing-2 med-acad/crit, UNKNOWN (duration); hearing-2 coach-field, CORROBORATED (2.5–3 h practice) | basis design_default | default? yes
RULE LOD-018 | priority T2.258 | when two runs with expected duration > lr.long_guard_min would fall less than lr.over180_min_gap_days apart (a back-to-back pair counts as one) | then (v5, 13 R-04) cap the run that is not a peak long run (a non-peak, deload or taper long run) at lr.long_guard_min; when both are peak long runs, move the later one to the next allowed week, or cap it at lr.long_guard_min if no week is allowed; the feasibility dry run applies the same spacing | because runs over 3 h have no injury evidence either way; spacing follows practice (Galloway alternate weeks; Koop peaks every 2–3 weeks) rather than a count cap that would block a 50K's own demand (p1-B R5, P-02 settled) | evidence factdesk4 §4, CORROBORATED (Galloway alternate weeks); wg2 §4, CREDIBLE (Koop); hearing-2 med, UNKNOWN (duration/count) | basis design_default | default? yes
```

## 4. Long-run caps by preset

`lr_cap(preset, family, V)` = the MIN of the caps the preset declares for that family. Every % is a share of weekly **time** (F-25). Every preset × family declares all three columns and its race ratios; this is checked statically (INV-26, Room B R2).

| Preset | Family | % of weekly time | Time cap | Absolute cap | Status |
|---|---|---|---|---|---|
| `method_default` ("classic-capped") | short **and base** (v4: family `base` for goals none/maintain/base) | **by run count**: 2 runs **0.60** (v4) · 3 runs 0.45 · 4 runs 0.40 · ≥ 5 runs 0.30 | 150 min | — | active (d2-A R3) |
| `method_default` | road_classic | **0.50** up to the time cap; above it (floor runs, extension runs) the week must hold L / 0.60 (`lr.over_cap_pct.road_classic`) | HM 150 / M **180** min; floor runs up to `lr.floor_time_max_min` (M 240) | M 32 km | active (Room B R1; d2-B R2) |
| `method_default` | ultra | **0.60 in peak weeks** (non-peak weeks: `dst.ultra_alt_long_ratio`) | **50K 240 / 100K 330 min** (v3) | — | active (Room C R1; d2-C R3) |
| `daniels` | short, road_classic | 0.25 | 150 min | — | opt-in; CORROBORATED [factdesk3 §4] |
| `hansons` | road_classic | none | — | 26 km | opt-in |
| `pfitzinger_classic` | M | none | — | 35 km | opt-in |
| `higdon_novice` | M | 0.50 | — | 32 km | opt-in |
| `galloway` | short, road_classic | none | **240 min** time on feet, walk breaks included (v3: Galloway peaks at a 26-mile run [factdesk4 §4, CORROBORATED]) | — | opt-in |
| `first` | short, road_classic | — | — | — | **pending fixture**: not selectable, not offered (Room A R9, Room B R2) |
| `koop_ultra` | ultra | as method_default ultra | 330 min | — | opt-in (phase order) |

Grades:
- **Long-run share caps:** no injury evidence [hearing-1 §2; factdesk3 §7, UNKNOWN]. 0.50 describes novice practice (Higdon ~50%; Knopp low-volume longest run 30.9 km) [wg2 §1–2, CORROBORATED as description].
- **Time caps:** a **coaching convention**. No study links single-run duration to injury [hearing-2 med-acad, med-crit, UNKNOWN]. Field practice caps slow runners at 2.5–3 h [hearing-2 coach-field, CORROBORATED as practice]. The 180 min value is a design default.
- **Daniels:** the lesser of 25% and 150 min is CORROBORATED [factdesk3 §4]. Its 30% variant under ~64 km/week is ALLEGED and is no longer used, so the v1 monotone envelope and `lr.low_volume_km` are retired.

**% floor.** The % term is never below `lr.pct_floor_s`. This floor never lifts the spike, time or absolute caps.

> **In plain words (MSG-DST-LR3H).** "Your longest run stops at 3 hours or about 30 km, whichever comes first. Many plans go to 32 km. Beyond 3 hours, the extra strain is a coaching convention, not a measured limit."

```
RULE LOD-020 | priority T5.255 | when computing the long-run cap for week w | then lr_cap = MIN of the active preset's declared % of weekly time for Goal.family (short: by run count; road_classic: 0.50 up to the time cap, L/0.60 above it; ultra: 0.60 in peak weeks), floored at lr.pct_floor_s, the time cap (road: up to lr.floor_time_max_min for floor and extension runs; ultra: per distance) and the absolute cap; presets with status pending_fixture are never active | because each school's cap must be applied as a coherent whole | evidence wg2 §1, factdesk3 §4, CORROBORATED (caps); hearing-2 coach-field, CORROBORATED as practice (time caps); hearing-2 med, UNKNOWN (duration and injury); d2-A R3, d2-B R2, d2-C R3 | basis design_default | default? yes
RULE LOD-021 | priority T6.250 | when the runner has chosen a preset other than method_default | then use that preset's caps for all weeks and record the preset in the plan header and ledger | because school choice is a preference, but it must stay a whole preset | evidence wg2 impl. 1, CREDIBLE; opening-statusquo R2 | basis design_default | default? yes
```

## 5. Weekly volume, distribution and intensity

**Peak target (v2, F-06)** `V_peak = min(available_minutes_per_week, max(V_req, V_hold, V_next, 09 preset peak if set))`. Here `V_next` is the 02 §2 threshold of the runner's next AER level, one level per season. H0 base plans therefore progress block by block until the runner's available time binds. The weekly curve rises from the baseline to `V_peak` under LOD-003. Runner constraints (T3) cap every week.

**Distribution inside a week** (deterministic order): (1) long run `LR(w)`; (2) quality sessions (06), count = MIN(`quality.per_week[preset, level]`, phase allowance of 04, the days that keep INV-17); where `quality.counts_long[preset]` = true (Hansons, FIRST; Pfitzinger: medium-long run only) the long run is one of the counted quality sessions. TID accounting (LOD-033) is always by time in effort, independent of how a school counts sessions; (3) easy runs filling `V(w) − LR − quality` by **water-filling** (v2, F-05): every easy day starts at an equal share. Days capped below that share (the two-day budget, LOD-013) keep their cap, and the excess goes equally to the uncapped days. Each easy run must be ≥ `lod.min_run_s`, ≤ LR(w) and within LOD-010. Only when every day is at its cap is V(w) lowered (dropped volume is never moved to another week).

**Intensity distribution (TID).** `tid.model` ∈ {`pyramidal` (default), `polarized`} [wg1 §2, CORROBORATED: effects small, mainly on VO2max; recreational runners do as well or better with pyramidal]. Shares are of weekly time: E0–E1 ≥ `tid.easy_share_min`; E3 + E4 ≤ `tid.hard_share_max`; E2 ≤ `tid.e2_share_max`. Warm-ups, cool-downs and recoveries count as E1; strides count in their session's base effort. The plan corpus is pyramidal (≈ 79% Z1–2, ≈ 6% Z4–5) [wg2 §2 Knopp, CORROBORATED as description]. Elites are ≈ 80% low intensity [hearing-1 §2, CORROBORATED].

> **In plain words.** Your weekly running grows a little at a time, never past the hours you said you have. At least three quarters of it is easy, at a pace where you can talk in full sentences. Only a small slice is hard. If your days are too full, we shorten the plan; we never squeeze the extra running into other days.

```
RULE LOD-030 | priority T3.250 | when building any week | then V(w) ≤ available_minutes_per_week, runs ≤ min(max_runs_per_week, count(available_days)), no run on a blocked date; excess is removed from easy runs first, then quality, never from the long run below its LOD-010 value unless still over | because user constraints are hard (INV-21) and the long run carries most specific value | evidence criteria C2; 07 §1; factdesk1 §7 (long run association), CORROBORATED | basis evidence | default? no
RULE LOD-031 | priority T5.256 | when distributing V(w) | then place the long run, then quality sessions, then easy runs by water-filling within [lod.min_run_s, min(LR(w), day cap)]; lower V(w) only when every easy day is at its cap | because equal fill plus the two-day cap collapsed weekly volume and eroded levels (F-05) | evidence F-05; hearing-1 §2 shared core, CORROBORATED; GEN-004 | basis design_default | default? yes
RULE LOD-032 | priority T6.251 | when selecting tid.model | then pyramidal unless the active preset sets polarized or the runner opts in with perf_level ≥ the competitive band of 01 and quality.per_week ≥ the preset's polarized minimum | because pyramidal suits recreational runners at least as well; polarized helps mainly trained athletes | evidence wg1 §2 Rosenblat 2025, Silva Oliveira 2024, CORROBORATED | basis design_default | default? yes
RULE LOD-033 | priority T5.257 | when a week's sessions are set | then E0–E1 time ≥ tid.easy_share_min × V(w), E3+E4 time ≤ tid.hard_share_max[family] × V(w) (v5.2: the half marathon uses its own tid.hard_share_max.HM, owner Q10), E2 time ≤ tid.e2_share_max × V(w), all three counted from **segment** times (warm-ups, cool-downs, recoveries and strides count as E1; v5.2 fixes the v5 record, which counted whole sessions); race-effort segments inside long runs count as quality and are converted to E1 (never shortening the run); other quality work segments are shortened; a preset whose fixture declares its own shares uses them, and a preset that would be gutted is incompatible (DST-016) | because about 80% easy is the shared core, but the v1 cap came from marathon plans and starved short-race exit tests | evidence wg1 impl. 2, wg2 §2, CORROBORATED (description); factdesk3 §1, UNKNOWN (measured short-race shares); hearing-2 coach-acad, CREDIBLE (10–20% zone 3 in trials); Room A R2, R9; Room B R5 | basis design_default | default? yes
RULE LOD-034 | priority T5.258 | when phase ∈ {ONBOARD, RTR, TRANSITION} or GateOutcome = proceed_restricted | then quality sessions = 0 (strides allowed in ONBOARD if HAB ≥ 1) | because these phases rebuild habit, tissue or recovery; vigorous work waits on clearance | evidence 04 §1; GEN-002; wg4 §3, CORROBORATED | basis evidence | default? no
```

## 6. Deload dose

Placement: 04 (PHS-001…005). Dose: `V = (1 − deload.volume_cut) × V(baseline)`. The long run is cut by the same fraction. For ultras the long-run baseline is the **last peak** long run, and a deload week counts as a non-peak week; the peak cadence restarts after it (F-29, Room C R5). Run frequency is kept. At most `deload.quality_max` quality sessions, each with work reduced by the same fraction and intensity kept. A deload never becomes the progression baseline (LOD-003). Grade: deload frequency and depth have no endurance evidence [wg1 §5, ALLEGED/UNKNOWN; hearing-1 §1, UNKNOWN in all bases]. Practice is "cutback every 3–4 weeks" [hearing-1 §3, CREDIBLE].

```
RULE LOD-040 | priority T5.259 | when Week.is_deload = true | then V and LR = (1 − deload.volume_cut) × baseline values, runs/week unchanged, quality ≤ deload.quality_max with work cut by deload.volume_cut and intensity kept | because periodic lighter weeks are near-universal practice; depth is convention | evidence wg1 §5 impl. 11, ALLEGED; hearing-1 §3, CREDIBLE | basis design_default | default? yes
```

## 7. Taper

Length `T = taper.weeks[distance][preset]` (04). Reference `V_ref`, `LR_ref` = the last non-deload pre-taper week. For taper week k (1…T):

`V_k = V_ref × (1 − taper.volume_cut × taper.cut_profile[T][k])`, `LR_k ≤ LR_ref × (1 − taper.volume_cut × taper.cut_profile[T][k])`.

Default shape is **progressive** (T = 3: −20%, −35%, −50%; T = 2: −30%, −50%; T = 1: −50%). `taper.shape = step` applies the full cut from week 1. The final cut sits inside 41–60% [wg1 §5 Bosquet, Wang 2023; wg2 §3, CORROBORATED]. A progressive or exponential decay is the recommended form [wg1 impl. 6, CORROBORATED]. The exact per-week fractions are a design default.

**Frequency and intensity kept.** Runs/week ≥ `taper.freq_min_ratio` × pre-taper (race week excepted). Each non-race taper week keeps ≥ 1 E3+ touch if the pre-taper block had one, with its work reduced by the week's cut (INV-08) [wg1 §5: frequency kept, effect sizes favour keeping intensity, CORROBORATED]. **Disciplined:** volume never rises inside the taper [wg2 §3 Smyth & Lawlor, CORROBORATED observational]. **Race week:** the race plus easy runs and strides; no long run.

**Transition** after the goal race: volume ≤ `transition.vol_max_ratio` × V_ref, easy only, for `phs.transition_weeks` (04). **Maintain:** ≥ `maint.sessions_min` runs/week, intensity kept, volume ≥ (1 − `maint.volume_cut_max`) × the last build volume [wg1 §5 Spiering, CORROBORATED general population; long-race durability UNKNOWN].

> **In plain words.** In the last 2–3 weeks you run less, about half by race week. You still run on the same days and keep a short faster piece each week, so your legs stay sharp. Volume only goes down, never back up. After the race you get one or two easy weeks.

```
RULE LOD-050 | priority T5.260 | when week w is a taper week k of T | then V(w) and LR(w) follow the taper.cut_profile[T][k] × taper.volume_cut reduction from V_ref and LR_ref | because a 41–60% progressive volume cut is the best-supported taper | evidence wg1 §5, wg2 §3, CORROBORATED | basis design_default | default? yes
RULE LOD-051 | priority T5.261 | when building a non-race taper week | then runs/week ≥ taper.freq_min_ratio × pre-taper runs/week and ≥ 1 E3+ segment if the pre-taper block had one, with work scaled by the week's cut | because tapers that keep frequency and intensity perform best | evidence wg1 §5 Bosquet, CORROBORATED; INV-08 | basis evidence | default? no
RULE LOD-052 | priority T5.262 | when any taper week's V or LR would exceed the previous taper week's | then clamp it to the previous week's value | because disciplined tapers without late volume rises were associated with better marathon times | evidence wg2 §3 Smyth & Lawlor, CORROBORATED (observational) | basis evidence | default? no
RULE LOD-053 | priority T6.252 | when the runner or preset selects taper.shape = step | then apply the full taper.volume_cut from taper week 1 | because both step and progressive decays appear in the evidence; progressive is the default | evidence wg1 impl. 6, CORROBORATED | basis design_default | default? yes
RULE LOD-054 | priority T5.263 | when phase = TRANSITION | then V ≤ transition.vol_max_ratio × V_ref, efforts E0–E1 only | because recovery after a race is universal practice | evidence hearing-1 §2, CORROBORATED (structure); value design default | basis design_default | default? yes
RULE LOD-055 | priority T5.264 | when phase = MAINTAIN | then runs/week ≥ maint.sessions_min, ≥ 1 E3+ session, V ≥ (1 − maint.volume_cut_max) × last build volume | because fitness is held with ≥ 2 sessions and intensity kept, for up to ~15 weeks | evidence wg1 §5 Spiering, CORROBORATED (general population) | basis evidence | default? no
RULE LOD-056 | priority T5.265 | when horizon class = H1 (SHARPEN) | then V(w) ≤ V28 and LR(w) ≤ L30_eff before the taper; no step-ups | because a very short plan has no time to build safely | evidence 04 PHS-010; wg1 §5, CORROBORATED | basis design_default | default? yes
```

## 8. Back-to-back long runs (with 09)

Only when DUR L5 holds, `goal.family = ultra` and `b2b` is enabled (off by default, ALLEGED [wg1 §6; wg2 §4]). 09 owns enablement and timing; 05 owns the load accounting (LOD-060/061). Each day also obeys LOD-010, and the pair cap replaces the two-day cap for that pair only. Day 2 is shorter than day 1, so it never raises `L30_eff`.

```
RULE LOD-060 | priority T2.255 | when a back-to-back pair is scheduled | then day 2 ≤ b2b.day2_ratio × day 1, pair ≤ b2b.pair_cap_ratio × L30_eff and ≤ b2b.pair_week_share_max × V(w); not in deload, taper or RTR weeks; the pair replaces LOD-013 for those two days | because each day passes the per-session cap yet the pair concentrates load; no trial supports back-to-backs | evidence wg1 §6, ALLEGED; wg2 §4, hearing-2 coach-field, CORROBORATED as practice (day 2 ≈ 55–60%); opening-contrarian §2 | basis design_default | default? yes
RULE LOD-061 | priority T5.266 | when the previous week contained a back-to-back pair | then LR(w) ≤ LR(previous week) | because the pair is the block's peak stress; the next week holds | evidence wg2 §4 (longest runs every 2–3 weeks), CREDIBLE | basis design_default | default? yes
```

## 9. RTR handover

```
RULE LOD-070 | priority T2.256 | when the return-to-run ladder (10) completes | then L30_eff = the ladder's last logged rung (distance and time), baseline = that week's logged volume, profile = slow for log.probation_weeks | because the ladder rebuilds tolerance and its exit is the only measured denominator | evidence 07 GEN-012; factdesk1 §1, CORROBORATED (structure) / UNKNOWN (durations) | basis design_default | default? yes
```

## 10. Parameters

All values live in `parameters.md` (v2), which governs. New or changed in v2:
- `two_day.adjacent_ratio`
- `two_day.cap_ratio` (1.60)
- `b2b.day2_ratio` (0.60) and `b2b.pair_cap_ratio` (1.75)
- `tid.hard_share_max.<family>` (short **0.20 final** in v3; polarized override for short = 0.20, d2-A R5)
- per-preset × family long-run caps (§4)

`lr.low_volume_km` is retired.

## 11. Conflicts with contract and other modules (v1 record; resolved in RESOLUTIONS.md)

1. **GEN-010 / INV-25 (07):** L30_eff must cap race contributions (LOD-012), or the race exemption ratchets later long runs.
2. **INV-16 (07):** "last non-deload week" needs LOD-004's age limit, or post-taper/transition weeks jump against a stale peak.
3. **`taper.weeks` hansons 1.5** does not fit 04's whole weeks; proposed 2 weeks with `cut_profile [0.3, 1.0]`.
4. **04 TRANSITION "≤ 50%"** literal → `transition.vol_max_ratio`.
5. **Ultra default preset (09, 03):** LOD-020 uses `koop_ultra` caps for `family = ultra` unless 09 overrides.
6. **LOD-032** needs 01 to define a "competitive" `perf_level` band.

## Tests

| Rule | Fires | Silent |
|---|---|---|
| LOD-001 | ACWR computed → display only | — (static, INV-10) |
| LOD-002 | sparse log → slow | rich log, no modifiers → standard |
| LOD-003 | +20% week proposed → clamped | +8% |
| LOD-004 | first week after transition | week after a deload |
| LOD-007 | claims only, best logged week 277 → next loading week ≤ 304 | baseline confirmed |
| LOD-008 | 6th consecutive logged week ≥ 0.80 × planned → confirmed | unlogged week restarts the count |
| LOD-010 | L30 20 km, template 24 km → 22 km | template 21 km |
| LOD-011 | planned 22 km skipped → next step from 20 | run done as planned |
| LOD-012 | marathon race logged → L30 ≤ 1.10 × pre-race | non-race run |
| LOD-013 | adjacent budget < min run → rest | ample budget |
| LOD-014 | Higdon 7→9 mi step clamped, ledger entry | step ≤ 1.10× |
| LOD-015 | run-walk 40 min after L30 30 min → 33 min | continuous distance run (distance also checked) |
| LOD-020 | V 63 vs 65 km → cap non-decreasing | koop_ultra |
| LOD-021 | runner picks hansons | method_default |
| LOD-030 | 180 min/week limit | limit not binding |
| LOD-031 | fill exceeds LR → V lowered | fill fits |
| LOD-032 | opt-in, competitive → polarized | recreational → pyramidal |
| LOD-033 | 15% hard → shortened | 8% hard |
| LOD-034 | ONBOARD week | BUILD week |
| LOD-040 | deload week | normal week |
| LOD-050 | marathon taper wk 2 → −35% | build week |
| LOD-051 | taper drops a run → restored | frequency kept |
| LOD-052 | taper week 3 > week 2 → clamped | monotone |
| LOD-053 | step shape chosen | default progressive |
| LOD-054 | transition week | base week |
| LOD-055 | maintain, 1 run → raised to 2 | 3 runs |
| LOD-056 | H1, template step-up → held | H3 |
| LOD-060 | pair 1.6 × L30 → clamped to 1.5 | single long run |
| LOD-061 | week after a pair | no pair |
| LOD-070 | ladder complete | ladder in progress |

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "LOD-001", "condition": "event.type == 'load_quantity_requested'", "on_unknown": "skip", "action": {"op": "constraint", "check": "static: blocking conditions read only duration_s, distance_m, rpe load (INV-10)"}, "status": "static"}
{"id": "LOD-002", "condition": "event.type == 'resolve_profile'", "on_unknown": "skip", "action": {"op": "set", "target": "state.progression_profile", "expr": "state.any_slow_trigger ? 'slow' : 'standard'"}}
{"id": "LOD-003", "condition": "!week.is_deload && week.phase != 'TAPER'", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "min((1 + p('prog.' + state.progression_profile + '.week_max')) * baseline(week), (1 + p('prog.' + state.progression_profile + '.2wk_max')) * week.v_two_loading_weeks_before_s)"}}
{"id": "LOD-007", "condition": "!state.baseline_confirmed && !week.is_deload && !(week.phase in ['TAPER', 'TRANSITION', 'RTR', 'START_LADDER'])", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "(1 + p('prog.est.week_max')) * week.est_base_s", "then": [{"op": "emit_message", "msg": "MSG-LOD-EST-CAP", "once": true}]}}
{"id": "LOD-008", "condition": "!state.baseline_confirmed && state.est_confirm_weeks >= p('prog.est.confirm_weeks')", "on_unknown": "skip", "action": {"op": "set", "target": "state.baseline_confirmed", "expr": "true", "msg": "MSG-LOD-BASE-CONFIRMED"}}
{"id": "LOD-004", "condition": "weeks_between(state.last_non_deload_week_end, today) > p('prog.baseline_max_age_weeks')", "on_unknown": "fire", "action": {"op": "set", "target": "state.baseline_week_s", "expr": "has(state.last_completed_week_logged_s) ? state.last_completed_week_logged_s : state.last_completed_week_planned_s"}}
{"id": "LOD-005", "condition": "!week.is_deload && !(week.phase in ['TAPER', 'TRANSITION', 'RTR'])", "on_unknown": "fire", "action": {"op": "floor", "target": "week.planned_time_s", "expr": "min(state.V_hold_s, t0t3_limit(week))", "then": [{"op": "floor", "target": "week.lr_s", "expr": "min(state.L_hold_s, spike_cap(week), t0t3_limit(week))"}]}}
{"id": "LOD-006", "condition": "week.is_step_up || event.type == 'level_unlock'", "on_unknown": "fire", "action": {"op": "hold_step", "weeks_expr": "1", "unless": "count(log.sessions_last_14d, x, has(x.pain_any)) >= p('pain.answered_min_ratio') * size(log.sessions_last_14d)", "msg": "MSG-LOD-PAIN-ANSWER"}}
{"id": "LOD-010", "condition": "!session.is_goal_race && (session.planned_distance_m > p('spike.warn_ratio') * l30_dist(session.date) || session.planned_duration_s > p('spike.warn_ratio') * l30_time(session.date))", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "round_down(p('spike.warn_ratio') * l30_time(session.date), p('load.round_down_s'))", "then": [{"op": "cap", "target": "session.planned_distance_m", "expr": "round_down(p('spike.warn_ratio') * l30_dist(session.date), p('load.round_down_m'))"}]}}
{"id": "LOD-011", "condition": "event.type == 'compute_l30_future'", "on_unknown": "fire", "action": {"op": "set", "target": "week.l30_eff_s", "expr": "l30_time(week.start)"}, "status": "procedure"}
{"id": "LOD-012", "condition": "entry.is_race && event.type == 'activity_saved'", "on_unknown": "fire", "action": {"op": "cap", "target": "state.L30_eff_time_s", "expr": "max(state.pre_race_L30_eff_time_s, min(entry.duration_s, p('spike.warn_ratio') * state.pre_race_L30_eff_time_s))"}}
{"id": "LOD-013", "condition": "session.adjacent_to_long_run && session.planned_duration_s > min(p('two_day.adjacent_ratio') * week.lr_s, p('two_day.cap_ratio') * l30_time(session.date) - week.lr_s)", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "min(p('two_day.adjacent_ratio') * week.lr_s, p('two_day.cap_ratio') * l30_time(session.date) - week.lr_s)", "then": [{"op": "replace_module", "target": "session", "expr": "'rest_or_cross'", "when": "session.planned_duration_s < p('lod.min_run_s')"}]}}
{"id": "LOD-015", "condition": "session.kind in ['run_walk', 'time_prescribed']", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "round_down(p('spike.warn_ratio') * l30_time(session.date), p('load.round_down_s'))"}}
{"id": "LOD-016", "condition": "week.planned_time_s < max(demand.V_req_time_s, state.V_hold_s) && week.all_easy_at_cap", "on_unknown": "skip", "action": {"op": "raise_long_run", "target": "week.lr_s", "expr": "min(p('spike.warn_ratio') * l30_time(week.long_run_date), preset_cap(week.long_run), week.lr_s + max(demand.V_req_time_s, state.V_hold_s) - week.planned_time_s)", "msg": "MSG-LOD-FILL"}}
{"id": "LOD-017", "condition": "session.expected_duration_s > unit.min_s * p('lr.long_guard_min') && !(state.tol_level >= p('lr.long_guard_tol_level') && state.tol_confidence == 'measured' && (age_high(session.date) < p('masters.vigorous_assessment_age') || has(screen.saf060_attested_on)))", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "unit.min_s * p('lr.long_guard_min')", "then": [{"op": "log_deviation"}, {"op": "render_run_walk", "target": "session"}, {"op": "emit_message", "msg": "MSG-LOD-017"}]}}
{"id": "LOD-018", "condition": "session.expected_duration_s > unit.min_s * p('lr.long_guard_min') && exists(plan.sessions, o, o.id != session.id && o.expected_duration_s > unit.min_s * p('lr.long_guard_min') && !same_pair(o, session) && abs(days_between(o.date, session.date)) < p('lr.over180_min_gap_days') && (!session.is_peak_long_run || (o.is_peak_long_run && o.date < session.date)))", "on_unknown": "fire", "action": {"op": "move_session", "target": "session", "expr": "next_allowed_week(session, p('lr.over180_min_gap_days'))", "when": "session.is_peak_long_run && next_allowed_week(session, p('lr.over180_min_gap_days')) != null", "otherwise": {"op": "cap", "target": "session.planned_duration_s", "expr": "unit.min_s * p('lr.long_guard_min')"}, "msg": "MSG-LOD-018"}}
{"id": "LOD-020", "condition": "event.type == 'compute_lr_cap'", "on_unknown": "skip", "action": {"op": "set", "target": "week.lr_cap_s", "expr": "preset_cap(week.long_run)"}, "status": "procedure"}
{"id": "LOD-030", "condition": "event.type == 'build_week'", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "unit.min_s * profile.available_minutes_per_week", "then": [{"op": "cap", "target": "week.runs", "expr": "min(profile.max_runs_per_week, size(profile.available_days))"}, {"op": "block_sessions", "filter": "s.date in profile.blocked_dates", "until": "never"}]}}
{"id": "LOD-031", "condition": "event.type == 'distribute_week'", "on_unknown": "skip", "action": {"op": "set", "target": "week.sessions", "expr": "water_fill(week, p('lod.min_run_s'))"}, "status": "procedure"}
{"id": "LOD-033", "condition": "event.type == 'sessions_set'", "on_unknown": "fire", "action": {"op": "constraint", "check": "week.easy_time_s >= p('tid.easy_share_min') * week.planned_time_s && week.hard_time_s <= p('tid.hard_share_max.' + goal.family_tid) * week.planned_time_s && week.e2_time_s <= p('tid.e2_share_max') * week.planned_time_s", "repair": "shorten_quality_segments"}}
{"id": "LOD-060", "condition": "session.is_b2b_pair && (session.day2_s > p('b2b.day2_ratio') * session.day1_s || session.pair_s > p('b2b.pair_cap_ratio') * l30_time(session.date) || session.pair_s > p('b2b.pair_week_share_max') * week.planned_time_s || week.is_deload || week.phase in ['TAPER', 'RTR'])", "on_unknown": "fire", "action": {"op": "cap", "target": "session.pair_s", "expr": "min(p('b2b.pair_cap_ratio') * l30_time(session.date), p('b2b.pair_week_share_max') * week.planned_time_s)", "then": [{"op": "cap", "target": "session.day2_s", "expr": "p('b2b.day2_ratio') * session.day1_s"}]}}
{"id": "LOD-070", "condition": "event.type == 'ladder_complete'", "on_unknown": "skip", "action": {"op": "set", "target": "state.L30_eff_time_s", "expr": "state.last_rung_logged_s", "then": [{"op": "set", "target": "state.baseline_week_s", "expr": "week.logged_time_s"}, {"op": "set", "target": "state.progression_profile", "expr": "'slow'"}, {"op": "set", "target": "state.probation_until", "expr": "date_add(today, unit.week_d * p('log.probation_weeks'))"}]}}
{"id": "LOD-014", "condition": "week.template_lr_s > p('spike.warn_ratio') * l30_time(week.long_run_date)", "on_unknown": "fire", "action": {"op": "cap", "target": "week.lr_s", "expr": "week.prev_lr_s", "then": [{"op": "set", "target": "plan.template_shift_weeks", "expr": "plan.template_shift_weeks + 1"}, {"op": "log_deviation"}]}}
{"id": "LOD-034", "condition": "week.phase in ['ONBOARD', 'RTR', 'TRANSITION'] || state.gate == 'proceed_restricted'", "on_unknown": "fire", "action": {"op": "set", "target": "week.quality_max", "expr": "0", "then": [{"op": "set", "target": "week.strides_allowed", "expr": "week.phase == 'ONBOARD' && state.levels.HAB >= 1"}]}}
{"id": "LOD-040", "condition": "week.is_deload", "on_unknown": "fire", "action": {"op": "set", "target": "week.planned_time_s", "expr": "(1 - p('deload.volume_cut')) * baseline(week)", "then": [{"op": "set", "target": "week.lr_s", "expr": "(1 - p('deload.volume_cut')) * state.deload_lr_baseline_s"}, {"op": "cap", "target": "week.quality_max", "expr": "p('deload.quality_max')"}]}}
{"id": "LOD-050", "condition": "week.phase == 'TAPER'", "on_unknown": "fire", "action": {"op": "set", "target": "week.planned_time_s", "expr": "plan.v_ref_s * (1 - p('taper.volume_cut') * p('taper.cut_profile')[plan.taper_weeks_n][week.taper_k])", "then": [{"op": "cap", "target": "week.lr_s", "expr": "plan.lr_ref_s * (1 - p('taper.volume_cut') * p('taper.cut_profile')[plan.taper_weeks_n][week.taper_k])"}]}}
{"id": "LOD-051", "condition": "week.phase == 'TAPER' && !week.is_race_week", "on_unknown": "fire", "action": {"op": "floor", "target": "week.runs", "expr": "p('taper.freq_min_ratio') * plan.pre_taper_runs", "then": [{"op": "floor", "target": "week.e3_touches", "expr": "plan.pre_taper_had_e3 ? 1 : 0"}]}}
{"id": "LOD-052", "condition": "week.phase == 'TAPER' && (week.planned_time_s > week.prev_planned_time_s || week.lr_s > week.prev_lr_s)", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "week.prev_planned_time_s", "then": [{"op": "cap", "target": "week.lr_s", "expr": "week.prev_lr_s"}]}}
{"id": "LOD-054", "condition": "week.phase == 'TRANSITION'", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "p('transition.vol_max_ratio') * plan.v_ref_s", "then": [{"op": "set", "target": "state.effort_ceiling", "expr": "'E1'"}]}}
{"id": "LOD-055", "condition": "week.phase == 'MAINTAIN'", "on_unknown": "fire", "action": {"op": "floor", "target": "week.runs", "expr": "p('maint.sessions_min')", "then": [{"op": "floor", "target": "week.planned_time_s", "expr": "(1 - p('maint.volume_cut_max')) * plan.last_build_week_s"}, {"op": "floor", "target": "week.e3_touches", "expr": "1"}]}}
{"id": "LOD-056", "condition": "feas.horizon == 'H1'", "on_unknown": "fire", "action": {"op": "cap", "target": "week.planned_time_s", "expr": "state.V28_week_s", "then": [{"op": "cap", "target": "week.lr_s", "expr": "state.L30_eff_time_s"}, {"op": "hold_step", "weeks_expr": "plan.W"}]}}
```

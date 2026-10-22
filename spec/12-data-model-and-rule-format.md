# 12 — Data model and rule format (v5.1)

Serves criteria 11 (data model, rule format usable by a website rule engine), 5 (deterministic), 8 (evidence travels with every rule and parameter), 13 (testable). Entity layering follows the common practice profile → goal → plan → phase → week → session [hearing-1 §5, CREDIBLE]; no plan-level standard exists [hearing-1 §5, UNKNOWN], so this schema is the method's own.

> **In plain words.** Everything the tool knows about you, your goal and your plan is stored in a few clear records. Every number the tool uses lives in one list (the parameter register) with a note on how well supported it is. Every rule says what triggers it, what it does, why, and the evidence behind it.

## 1. Conventions

- Units: distance in metres (int), duration in seconds (int), pace in s/km, mass kg, dates ISO-8601 local date; week starts Monday.
- `Confidence = measured | estimated | unknown`. With manual logging only (owner decision), `measured` = entered within `log.contemporaneous_window_h` of the event and not flagged (07 §3).
- `Grade = VERIFIED | CORROBORATED | CREDIBLE | ALLEGED | CONTRADICTED | UNKNOWN`; `Basis = evidence | convention | design_default`.
- `Effort = E0 walk | E1 easy (full sentences) | E2 steady (short phrases) | E3 hard (a few words) | E4 very hard (cannot talk) | E5 strides (short, fast, relaxed)`. Mapping to the 5-zone model: Z1–Z2 → E1, Z3 → E2, Z4 → E3, Z5 → E4 [wg2 §2 zone model, CORROBORATED as description; talk-test anchors factdesk1 §3, CORROBORATED].
- IDs are stable strings; every record carries `ruleset_version` and `registry_version` when produced by the engine.

## 2. Entities

### Runner side
| Entity | Key fields |
|---|---|
| `RunnerProfile` | id, birth_month, birth_year (both required, no "I don't know"; INP-001/002, v5), sex (optional; used only for REDs screen routing and age-grade tables), body_mass_kg (optional, confidence), training_age_years (conf), other_sport_background ∈ {none, cycling, swimming, triathlon, team, other}, injury_last_12m (bool, site_text never interpreted), injuries_history_count, available_days[] (weekday set), max_runs_per_week, available_minutes_per_week, blocked_dates[], long_run_day, run_walk_preference (bool), preset_preference (SchoolPreset id or null), night_shift_dates[] (dated roster; 01 CTX-005), never_run (bool; 01 §1), hill_access (bool, default false; 06 SES-022), nutrition_referral_flag (bool, one fixed question; 11), caffeine_sensitive (bool; 11), units_pref, created_at |
| `ScreeningRecord` | id, runner_id, instrument = "PAR-Q+ 2023" (fixed text), answers{q_id: bool}, followup_answers{q_id: bool}, guardian_attested_on (minors), guardian_hardcap_optin (bool; SAF-043), completed_on, valid_until (= completed_on + `screen.valid_days`), outcome ∈ {proceed, proceed_restricted, pause_until_clearance, no_plan}, clearance_attested_on (nullable) |
| `ScreeningItemMap` | item_id → factor ∈ {symptom, known_disease, musculoskeletal, other}; filled from the licensed PAR-Q+ text and signed off in clinical review (release blocker, RESOLUTIONS A4) |
| `SpecialStatus` | runner_id, type ∈ {minor, pregnant, postpartum, masters_65_vigorous}, start_date, attested (bool), due_date (required in pregnancy mode; SAF-051/054, v5), has_given_birth (SAF-054); `pregnant` → maintenance mode, effort ≤ `pregnancy.max_effort` (SAF-051) |
| `RiskFlag` | id, runner_id, kind ∈ {red_flag, screening, reds_screen, pain, illness}, subkind ∈ {cardiac, bone_stress, bone_stress_highrisk, heat, eah, pregnancy_stop, reds_escalated, pain_persistent, illness, reds_screen}, region (bone-stress body region option, nullable), rule_id (always a SAF rule: 10 alone raises flags), raised_on, status ∈ {active, cleared}, cleared_on, clearance_attested_on — internal kind labels never shown to users (00 §6) |
| `ContextModifier` | id (`CTX-nnn/x`: one record per operation), rule_id (CTX-nnn), op_index, trigger (condition), parameter_id, operation ∈ {set, min, max, multiply}, value, grade, envelope (population tags), user_message_id |
| `ActivityRecord` | id, runner_id, date, entered_at, type ∈ {run, run_walk, race, test, cross_training, strength}, planned_session_id (nullable), duration_s, distance_m (nullable), rpe_0_10, effort_reported (nullable), pain_0_10 (nullable), gi_score_0_10 (nullable), carb_g_per_h (nullable), notes, fatigue_flag (bool), stopped_early_reason (enum, nullable), short_sleep_or_night_shift (bool), conditions_hot (bool), effort_all_out (bool), fuel_products[], **confidence**, **plausibility ∈ {ok, flagged, confirmed}**, source ∈ {tick, manual_add, onboarding_claim, backfill} |
| `OnboardingClaim` | runner_id, claimed_weekly_distance_m, claimed_weekly_time_s, claimed_runs_per_week, claimed_L30_distance_m, claimed_L30_duration_s, last_run_date, claimed_continuous_30min (bool), each with confidence |
| `PerformanceAnchor` | id, runner_id, kind ∈ {race, field_test, cs_test}, distance_m, time_s, date, entered_at, confidence, age_grade_pct (derived, WMA 2023), superseded_by |
| `SweatTest` | runner_id, date, duration_s, rate_ml_h, conditions (11) |
| `REDsScreenRecord` | runner_id, date, answers{q_id: bool} (fixed question set), trigger ∈ {onboarding, interval, off_cycle} (11 NUT-050) |
| `HRReference` | runner_id, kind ∈ {hrmax_measured, lthr_measured}, value_bpm, date, method — no `age_formula` kind exists (INV-09) |

### Derived
| Entity | Key fields |
|---|---|
| `DerivedState` | runner_id, as_of, V7_time_s, V7_dist_m, V28_time_s, V28_dist_m, F28, L30_eff_dist_m, L30_eff_time_s, L30_source ∈ {log_rich, log_sparse_claim, undefined_rtr}, log_status ∈ {rich, sparse, none}, days_since_last_run, age_low, age_high (INP-002), tol_tier, prior_tol_tier (tier before the latest gap; SAF-080), V_hold_s, L_hold_s (baseline hold, LOD-005), active_anchor_id, pace_anchor_10k_equiv_s (for the FEA-014 pace bands), pending_anchor_10k_s and pending_anchor_date (ADP-067, v5.1), baseline_confirmed and est_confirm_weeks (LOD-007/008, v5.1), perf_level (age-grade band), progression_profile ∈ {standard, slow}, probation_until, active_flags[] |
| `CompetenceState` | runner_id, node, level, confidence, source ∈ {log_threshold, exit_test, self_report}, achieved_on, last_exercised_on |

### Goal side
| Entity | Key fields |
|---|---|
| `Goal` | id, runner_id, distance ∈ {5K, 10K, HM, M, 50K, 100K} (or `none`), family ∈ {short, road_classic, ultra, base (v4: goals none/maintain/base)}, goal_type ∈ {finish, time, maintain, base}, target_time_s (nullable), race_date (nullable), expected_conditions ∈ {normal, hot}, cutoff_h (optional, any family; FEA-006), milestones[] (optional runner-chosen races ending non-final seasons, 04 §3), interim_target_s (FEA-038), next_checkpoint_date, created_at |
| `GoalEditAttempt` | goal_id, submitted_at, changed_fields[], verdict, reasons[] |
| `Demand` | goal_id, preset_id, required_levels{node: level}, V_req_peak (time, dist), L_req_peak (time, dist), weights{node: w} |
| `FeasibilityResult` | goal_id, verdict ∈ {feasible, stretch, infeasible}, weeks_available, weeks_needed{rtr, onboard, base, specific, taper}, predicted_band{low_s, point_s, high_s, model_id, inputs_used[], confidence}, reasons[] (codes), options[] (RepairOption) |
| `RepairOption` | rank, kind ∈ {change_availability (v4), move_date, lower_goal, shorter_distance, base_plan, alternative_preset}, new_goal (Goal), validated_plan_id, explanation_id |

### Plan side
| Entity | Key fields |
|---|---|
| `Plan` | id (= hash of inputs + versions), runner_id, goal_id, version, parent_plan_id (previous version), published_until (date; ADP-014), degraded (bool; FEA-043), created_at, ruleset_version, registry_version, preset_id, status ∈ {active, superseded, paused}, seasons[] |
| `Season` | id, plan_id, index, start_week, end_week, target (goal or test), detail_level ∈ {sessions, outline} |
| `Phase` | id, season_id, type ∈ {ONBOARD, RTR, BASE, BUILD, SPECIFIC, TAPER, RACE, TRANSITION, MAINTAIN, SHARPEN}, start_week, n_weeks, template_id |
| `Week` | id, phase_id, iso_week, load_ordinal (k-th loading week; deload and taper ordinals counted separately; INV-04), is_peak_long_run (ultra), is_deload, log_state ∈ {logged, partial, unlogged}, target_time_s, target_dist_m, planned_time_s, planned_dist_m, long_run_session_id, key_session_count, frozen (bool) |
| `Session` | id, week_id, date, module_id, kind, in_published_window (bool), is_extension (bool; DST-019), ladder ∈ {none, rtr, start} + rung, expected_duration_s (LOD-017), is_floor_bound (bool), effort_target (Effort), segments[] {effort, duration_s or distance_m, repeats, recovery}, planned_duration_s, planned_distance_m (nullable), pace_range (nullable; only from the FEA-014 pace model when INV-15 allows), run_walk_ratio (nullable), why_message_id, rule_ids[], is_race, status ∈ {planned, done, partial, missed, replaced, unlogged} |

### Library and governance
| Entity | Key fields |
|---|---|
| `CompetenceNode` / `CompetenceLevel` | node id, name, advisory (bool); level n, attainment {threshold expr or exit_test_module_id}, prereqs[] (node, level), min_weeks |
| `SessionModule` | id (SES-nnn), name, trains (node, level), prereqs[], goal_text, dose {segments template, min/max}, progression {step rule, max step}, exit_test {criterion}, effort_profile, allowed_phases[], presets[], evidence {grade, sources}, why_message_id |
| `PhaseTemplate` | id, phase type, distance family, volume_trend, long_run_trend, key_session_mix by preset, entry/exit criteria |
| `SchoolPreset` | id ∈ {method_default, daniels, hansons, pfitzinger_classic, higdon_novice, galloway, first, koop_ultra, norwegian_elite}, status ∈ {active, pending_fixture}, families[], caps{family: {pct_time, time_cap_min, abs_cap_km}}, ratios{distance: {longest_ratio_max, longest_floor_ratio}}, tid_shares (optional, from an encoded fixture), parameter overrides{param_id: value}, compatible {min_days, max_days, min_weekly_time}, grade, description — INV-26 checks completeness |
| `Parameter` | see `parameters.md` columns |
| `Rule` | see §3 |
| `ValidationReport` | plan_id, pass (bool), violations[] {inv_id, session_id, observed, limit, severity}, passes_used |
| `DeviationLedgerEntry` | plan_id, week, session_id, field, template_value, plan_value, rule_id, criterion, grade |
| `FiredRuleLog` | plan_id, stage, rule_id, inputs_hash, action, timestamp |
| `AdaptationEvent` | id, runner_id, kind ∈ {missed_session, partial_session, unlogged_week, illness, pain, fatigue, result, life_change, availability_change, goal_change, red_flag, gap}, date, payload, triggered_plan_version |
| `Message` | id, plain_text, why, coach_rationale, grade_label, glossary_terms[], is_safety_generic (bool) |

## 2b. Evaluation context (v5, p2-B R3)

> **In plain words.** A rule can only read things the engine has declared. This section lists every name a rule may read (the "roots" and their fields), every helper function with its exact meaning, and the few longer procedures that are specified elsewhere. If a name is not here, the build fails.

**Values.** Every path is typed by its §2 field (number, string, bool, date, timestamp, list, map). Durations are seconds, distances metres, dates ISO days. A field the runner left blank, or an answer item not yet answered, is **declared unknown** (§3.2): it evaluates to *unknown*, not to *error*. Any other absent value is an *error*.

### 2b.1 Roots

| Root | Bound to | Notes |
|---|---|---|
| `profile` | RunnerProfile + SpecialStatus (§2) | onboarding and settings; SpecialStatus fields are flattened onto profile |
| `screen` | ScreeningRecord (§2) | PAR-Q+ record; `screen.items` = the instrument item ids; `screen.complete` = every item and required follow-up answered |
| `claim` | OnboardingClaim (§2) | claimed history; names drop the `claimed_` prefix |
| `input` | any field being written (01 INP-001…007) | `input.field`, `.value`, `.source`, `.confidence`, `.default`, `.test_date` |
| `entry` | ActivityRecord being saved or evaluated (§2) | plus derived `pace_s_per_km`, `is_measured` (= confidence measured), `pain_any`, `pain_settled_24h`, `pain_next_morning`, `limping`, `l30_weight`, `date_end` (end of the entry date) |
| `anchor` | PerformanceAnchor being saved, else the active anchor (§2) | plus `equiv_10k_s` (03 §3 conversion) |
| `log` | lists over ActivityRecord (§2) | see §2b.2 |
| `state` | DerivedState (§2) + engine state | see §2b.2 |
| `goal` | Goal (§2) | plus `distance_km`, `expected_duration_s` (03 §2) |
| `demand` | Demand (§2) | plus the flags listed in §2b.2 |
| `feas` | FeasibilityResult (§2) + the S3 working values of 03 §2–§4 | see §2b.2 |
| `option` | RepairOption under validation (§2) | `reasons`, `plan_valid` |
| `plan` | Plan (§2) + list views | see §2b.2 |
| `week` | Week (§2) + derived week fields | see §2b.2 |
| `session` | Session (§2) + derived session fields | see §2b.2 |
| `slot` | a session slot being filled in S7 (07) | `date`, `module`, `effort_profile`, `candidates` |
| `m` | the SessionModule being tested as a candidate (06 SES-001) | fields of SessionModule (§2) |
| `tied` | modules tied in S7 (GEN-005) | `module_ids` |
| `next_long_run` | the next planned long-run Session (GEN-023) | Session fields |
| `flag` | the RiskFlag in scope (§2) | — |
| `flags` | RiskFlag lists | `active`, `cleared` |
| `event` | the triggering AdaptationEvent or UI event, with its payload (§2) | see §2b.2 |
| `preset` | active SchoolPreset (§2) | `id`, `consecutive_hard_allowed` |
| `override` | ContextModifier output (§2): per-runner parameter overrides, MIN-combined | `override.<param id>` |
| `rule_ctx` | the rule whose explanation is being built (CTX-008) | `envelope` (population tags of its evidence), `explanation` |
| `unit` | declared unit constants (the only numbers other than 0 and 1 allowed in expressions) | `unit.min_s` = 60, `unit.h_s` = 3600, `unit.km_m` = 1000, `unit.week_d` = 7, `unit.pct` = 100 |
| `node` | the CompetenceNode being evaluated (02 CMP-001…004) | `id` |
| `next_week` | the Week after the current one (ADP-056) | Week fields |
| `today`, `now` | evaluation date and timestamp | supplied by the engine; never read from the device clock inside a rule |
| `s`, `x`, `w`, `a`, `b`, `e`, `f`, `o`, `d`, `lr`, `q`, `t`, `i` | comprehension variables | bound by `all/exists/count/sum/pairs` or, in `block_sessions.filter`, to each planned session; an action `target` may name the witness of the condition's `exists` (it applies to every witness) |

### 2b.2 Field paths used by the machine records (generated from the rulexpr blocks)

Every path below is used by at least one record. Paths that are plain fields of a §2 entity say so; derived fields give their definition or defining rule. TST-090 regenerates this table and fails on any path that is missing here.

| Root | Path | Defined by |
|---|---|---|
| `anchor` | `anchor.confidence` | §2 entity field |
| `anchor` | `anchor.date` | §2 entity field |
| `anchor` | `anchor.distance_m` | §2 entity field |
| `anchor` | `anchor.entered_at` | §2 entity field |
| `anchor` | `anchor.equiv_10k_s` | §2 entity field |
| `anchor` | `anchor.excluded` | result excluded: hot conditions, illness within result.exclusion_days, or effort not all-out (ADP-061) |
| `anchor` | `anchor.id` | §2 entity field |
| `anchor` | `anchor.kind` | §2 entity field |
| `anchor` | `anchor.time_s` | §2 entity field |
| `claim` | `claim.L30_distance_m` | §2 entity field |
| `claim` | `claim.agegrade_pct` | §2 entity field |
| `claim` | `claim.confidence` | §2 entity field |
| `claim` | `claim.continuous_30min` | §2 entity field |
| `claim` | `claim.last_run_date` | §2 entity field |
| `claim` | `claim.runs_per_week` | §2 entity field |
| `claim` | `claim.time_distance_inconsistent` | §2 entity field |
| `claim` | `claim.weekly_distance_m` | §2 entity field |
| `claim` | `claim.weekly_time_s` | §2 entity field |
| `demand` | `demand.L_req_time_s` | §2 entity field / engine value |
| `demand` | `demand.L_target_s` | §2 entity field / engine value |
| `demand` | `demand.V_req_time_s` | §2 entity field / engine value |
| `demand` | `demand.credited` | FEA-025 credit |
| `demand` | `demand.floor_dist_m` | race distance / longest_floor_ratio |
| `demand` | `demand.long_run_met` | peak long-run demand met (INV-25) |
| `demand` | `demand.met_by_current_state` | PHS-011 test |
| `demand` | `demand.met_by_logged_distance` | INV-25 |
| `demand` | `demand.required_levels.HEAT` | §2 entity field / engine value |
| `demand` | `demand.runs_req` | FEA-031 required runs/week |
| `entry` | `entry.confidence` | §2 entity field |
| `entry` | `entry.date` | §2 entity field |
| `entry` | `entry.date_end` | §2 entity field |
| `entry` | `entry.distance_m` | §2 entity field |
| `entry` | `entry.duration_s` | §2 entity field |
| `entry` | `entry.entered_at` | §2 entity field |
| `entry` | `entry.is_goal_race` | §2 entity field |
| `entry` | `entry.is_measured` | §2 entity field |
| `entry` | `entry.is_race` | §2 entity field |
| `entry` | `entry.l30_weight` | §2 entity field |
| `entry` | `entry.ladder` | §2 entity field |
| `entry` | `entry.limping` | §2 entity field |
| `entry` | `entry.pace_s_per_km` | §2 entity field |
| `entry` | `entry.pain_0_10` | §2 entity field |
| `entry` | `entry.pain_any` | §2 entity field |
| `entry` | `entry.pain_next_morning` | §2 entity field |
| `entry` | `entry.pain_settled_24h` | §2 entity field |
| `entry` | `entry.plausibility` | §2 entity field |
| `entry` | `entry.resolution` | §2 entity field |
| `entry` | `entry.rpe_0_10` | §2 entity field |
| `entry` | `entry.source` | §2 entity field |
| `entry` | `entry.type` | §2 entity field |
| `event` | `event.B1` | answer to 10 §1 item B1 (unknown until answered) |
| `event` | `event.B2` | answer to 10 §1 item B2 (unknown until answered) |
| `event` | `event.B3` | answer to 10 §1 item B3 (unknown until answered) |
| `event` | `event.B4` | answer to 10 §1 item B4 (unknown until answered) |
| `event` | `event.B5` | answer to 10 §1 item B5 (unknown until answered) |
| `event` | `event.C1` | answer to 10 §1 item C1 (unknown until answered) |
| `event` | `event.C2` | answer to 10 §1 item C2 (unknown until answered) |
| `event` | `event.C3` | answer to 10 §1 item C3 (unknown until answered) |
| `event` | `event.C4` | answer to 10 §1 item C4 (unknown until answered) |
| `event` | `event.E1` | answer to 10 §1 item E1 (unknown until answered) |
| `event` | `event.H1` | answer to 10 §1 item H1 (unknown until answered) |
| `event` | `event.H2` | answer to 10 §1 item H2 (unknown until answered) |
| `event` | `event.I` | answers I1–I3 |
| `event` | `event.I1` | answer to 10 §1 item I1 (unknown until answered) |
| `event` | `event.I2` | answer to 10 §1 item I2 (unknown until answered) |
| `event` | `event.I3` | answer to 10 §1 item I3 (unknown until answered) |
| `event` | `event.P1` | answer to 10 §1 item P1 (unknown until answered) |
| `event` | `event.P2` | answer to 10 §1 item P2 (unknown until answered) |
| `event` | `event.above_neck_only` | §2 entity field / engine value |
| `event` | `event.absent_periods` | §2 entity field / engine value |
| `event` | `event.amenorrhoea_answer` | §2 entity field / engine value |
| `event` | `event.below_neck` | §2 entity field / engine value |
| `event` | `event.bone_answers` | §2 entity field / engine value |
| `event` | `event.bone_stress_answer` | §2 entity field / engine value |
| `event` | `event.bone_stress_flag_raised` | §2 entity field / engine value |
| `event` | `event.chest_pain` | §2 entity field / engine value |
| `event` | `event.claims_raised` | §2 entity field / engine value |
| `event` | `event.collapse` | §2 entity field / engine value |
| `event` | `event.confusion` | §2 entity field / engine value |
| `event` | `event.date` | §2 entity field / engine value |
| `event` | `event.disproportionate_breathlessness` | §2 entity field / engine value |
| `event` | `event.distance_changed` | §2 entity field / engine value |
| `event` | `event.faint` | §2 entity field / engine value |
| `event` | `event.fainting` | §2 entity field / engine value |
| `event` | `event.fever` | §2 entity field / engine value |
| `event` | `event.gap_cause` | §2 entity field / engine value |
| `event` | `event.goal_changed` | user-accepted goal change |
| `event` | `event.handover` | rule id handing over |
| `event` | `event.health_changed` | §2 entity field / engine value |
| `event` | `event.is_reduction` | event only reduces load |
| `event` | `event.level` | §2 entity field / engine value |
| `event` | `event.loss_of_coordination` | §2 entity field / engine value |
| `event` | `event.msg_id` | attestation message id |
| `event` | `event.off_cycle_trigger` | §2 entity field / engine value |
| `event` | `event.option_chosen` | §2 entity field / engine value |
| `event` | `event.palpitations` | §2 entity field / engine value |
| `event` | `event.red_flag_answer` | §2 entity field / engine value |
| `event` | `event.reds_answers` | §2 entity field / engine value |
| `event` | `event.reds_screen_positive` | §2 entity field / engine value |
| `event` | `event.severe_headache` | §2 entity field / engine value |
| `event` | `event.special_status_changed` | §2 entity field / engine value |
| `event` | `event.symptom_answers` | §2 entity field / engine value |
| `event` | `event.t0t2` | a T0–T2 rule fired in this re-plan |
| `event` | `event.type` | event kind (snake_case) |
| `event` | `event.unusual_swelling` | §2 entity field / engine value |
| `event` | `event.very_hot` | §2 entity field / engine value |
| `event` | `event.vomiting` | §2 entity field / engine value |
| `feas` | `feas.B_fast` | fast band fraction (03 §3) |
| `feas` | `feas.B_slow` | §2 entity field / engine value |
| `feas` | `feas.P_race_s` | predicted race time (03 §3) |
| `feas` | `feas.band_widen` | band multiplier |
| `feas` | `feas.claims_confidence` | §2 entity field / engine value |
| `feas` | `feas.degraded_available` | §2 entity field / engine value |
| `feas` | `feas.fast_edge_s` | P_race × (1 − B_fast) |
| `feas` | `feas.fill_capacity_s` | dry-run fill capacity at max runs (FEA-031) |
| `feas` | `feas.horizon` | H0…H5 (04) |
| `feas` | `feas.inputs_used` | inputs read by Demand and weeks_needed with their confidence |
| `feas` | `feas.k_all` | same over the other nodes |
| `feas` | `feas.k_key` | max over THR, VO2, MSP, ECO of gap_levels × cmp.min_weeks_per_level (FEA-021) |
| `feas` | `feas.p0` | weeks of ONBOARD + RTR + start ladder |
| `feas` | `feas.predicted_band` | §2 entity field / engine value |
| `feas` | `feas.preset_ok` | preset admissible |
| `feas` | `feas.prev_B_fast` | §2 entity field / engine value |
| `feas` | `feas.reasons` | §2 entity field / engine value |
| `feas` | `feas.required_margin_weeks` | §2 entity field / engine value |
| `feas` | `feas.s4_phases_do_not_fit` | S4 returned PHASES_DO_NOT_FIT |
| `feas` | `feas.slack` | weeks_available − Σ weeks_needed (03 §4) |
| `feas` | `feas.slow_edge_s` | P_race × (1 + B_slow) |
| `feas` | `feas.verdict` | §2 entity field / engine value |
| `feas` | `feas.verdict_rank` | feasible 0 < stretch 1 < infeasible 2 |
| `feas` | `feas.weeks_available` | §2 entity field / engine value |
| `feas` | `feas.weeks_left` | weeks to race at re-plan |
| `feas` | `feas.weeks_needed` | §2 entity field / engine value |
| `feas` | `feas.weeks_needed.rtr` | §2 entity field / engine value |
| `feas` | `feas.weeks_needed.taper` | §2 entity field / engine value |
| `flag` | `flag.clearance_attested_on` | §2 entity field |
| `flag` | `flag.raised_on` | §2 entity field |
| `flag` | `flag.status` | §2 entity field |
| `flag` | `flag.subkind` | §2 entity field |
| `flags` | `flags.active` | §2 entity field / engine value |
| `flags` | `flags.cleared` | §2 entity field / engine value |
| `goal` | `goal.cutoff_h` | §2 entity field |
| `goal` | `goal.distance` | §2 entity field |
| `goal` | `goal.distance_km` | §2 entity field |
| `goal` | `goal.edits` | §2 entity field |
| `goal` | `goal.expected_conditions` | §2 entity field |
| `goal` | `goal.expected_duration_s` | §2 entity field |
| `goal` | `goal.family` | §2 entity field |
| `goal` | `goal.goal_type` | §2 entity field |
| `goal` | `goal.interim_target_s` | §2 entity field |
| `goal` | `goal.race_date` | §2 entity field |
| `goal` | `goal.race_status` | §2 entity field |
| `goal` | `goal.target_time_s` | §2 entity field |
| `input` | `input.confidence` | §2 entity field |
| `input` | `input.default` | §2 entity field |
| `input` | `input.field` | §2 entity field |
| `input` | `input.source` | §2 entity field |
| `input` | `input.test_date` | §2 entity field |
| `input` | `input.value` | §2 entity field |
| `log` | `log.entries_created_today` | entries whose entered_at is today |
| `log` | `log.last_e3_sessions` | the last result.rpe_high_sessions logged sessions ≥ E3 |
| `log` | `log.last_quality_sessions` | §2 entity field / engine value |
| `log` | `log.measured_ok_runs_30d` | measured, non-flagged runs in the 30 days before the date |
| `log` | `log.sessions_last_14d` | sessions done in the last 14 days |
| `m` | `m.allowed_phases` | §2 entity field |
| `m` | `m.effort_profile` | §2 entity field |
| `m` | `m.eligible` | §2 entity field |
| `m` | `m.prereqs` | §2 entity field |
| `m` | `m.presets` | §2 entity field |
| `next_long_run` | `next_long_run.planned_distance_m` | §2 entity field |
| `next_week` | `next_week.is_deload` | §2 entity field / engine value |
| `node` | `node.id` | §2 entity field / engine value |
| `option` | `option.plan_valid` | §2 entity field |
| `option` | `option.reasons` | §2 entity field |
| `override` | `override.deload.every` | §2 entity field / engine value |
| `override` | `override.quality.per_week` | §2 entity field / engine value |
| `plan` | `plan.W` | weeks from plan start to race |
| `plan` | `plan.degraded` | §2 entity field / engine value |
| `plan` | `plan.deload_weeks` | deload week list |
| `plan` | `plan.drink_ml_h` | NUT-031 output |
| `plan` | `plan.future_weeks` | weeks after today |
| `plan` | `plan.id` | §2 entity field / engine value |
| `plan` | `plan.is_regeneration` | plan version > 1 |
| `plan` | `plan.last_build_week_s` | §2 entity field / engine value |
| `plan` | `plan.loading_weeks` | weeks not deload/taper/transition/RTR/SHARPEN |
| `plan` | `plan.long_runs` | long-run sessions |
| `plan` | `plan.lr_ref_s` | LR of that week |
| `plan` | `plan.over_guard_runs` | runs with expected duration > lr.long_guard_min (INV-29) |
| `plan` | `plan.pace_mode` | paced or effort_only |
| `plan` | `plan.parent_plan_id` | §2 entity field / engine value |
| `plan` | `plan.peak_lr_dist_m` | its distance if known |
| `plan` | `plan.peak_lr_s` | longest planned long run |
| `plan` | `plan.phase_sequence` | phase list (04) |
| `plan` | `plan.pre_taper_had_e3` | any E3+ session in those weeks |
| `plan` | `plan.pre_taper_runs` | mean runs/week in the 3 weeks before taper |
| `plan` | `plan.race_fuel_g_h` | NUT-020 output |
| `plan` | `plan.resume_week` | ADP-030 |
| `plan` | `plan.s8r_passes` | repair passes used (07 S8r) |
| `plan` | `plan.sessions` | §2 entity field / engine value |
| `plan` | `plan.status` | §2 entity field / engine value |
| `plan` | `plan.taper_start` | first TAPER date |
| `plan` | `plan.taper_weeks` | TAPER weeks |
| `plan` | `plan.taper_weeks_n` | taper length T |
| `plan` | `plan.template_shift_weeks` | §2 entity field / engine value |
| `plan` | `plan.v_ref_s` | V of the last non-deload pre-taper week (05 §6) |
| `plan` | `plan.weeks` | §2 entity field / engine value |
| `preset` | `preset.consecutive_hard_allowed` | §2 entity field |
| `preset` | `preset.id` | §2 entity field |
| `profile` | `profile.availability` | §2 entity field |
| `profile` | `profile.availability_defaults` | §2 entity field |
| `profile` | `profile.available_days` | §2 entity field |
| `profile` | `profile.available_minutes_per_week` | §2 entity field |
| `profile` | `profile.b2b_opt_in` | §2 entity field |
| `profile` | `profile.birth_month` | §2 entity field |
| `profile` | `profile.birth_year` | §2 entity field |
| `profile` | `profile.blocked_dates` | §2 entity field |
| `profile` | `profile.due_date` | §2 entity field |
| `profile` | `profile.has_given_birth` | §2 entity field |
| `profile` | `profile.injury_last_12m` | §2 entity field |
| `profile` | `profile.long_run_day` | §2 entity field |
| `profile` | `profile.max_runs_per_week` | §2 entity field |
| `profile` | `profile.never_run` | §2 entity field |
| `profile` | `profile.night_shift_dates` | §2 entity field |
| `profile` | `profile.nutrition_referral_flag` | §2 entity field |
| `profile` | `profile.other_sport_background` | §2 entity field |
| `profile` | `profile.preset_preference` | §2 entity field |
| `profile` | `profile.run_walk_preference` | §2 entity field |
| `profile` | `profile.run_walk_preference_explicit` | §2 entity field |
| `profile` | `profile.saf031_attested_on` | §2 entity field |
| `profile` | `profile.saf033_attested_on` | §2 entity field |
| `profile` | `profile.special_status` | §2 entity field |
| `profile` | `profile.special_status_start` | §2 entity field |
| `profile` | `profile.training_age_years` | §2 entity field |
| `rule_ctx` | `rule_ctx.envelope` | §2 entity field / engine value |
| `screen` | `screen.answers` | §2 entity field |
| `screen` | `screen.clearance_attested_on` | §2 entity field |
| `screen` | `screen.complete` | §2 entity field |
| `screen` | `screen.completed_on` | §2 entity field |
| `screen` | `screen.guardian_attested_on` | §2 entity field |
| `screen` | `screen.guardian_clearance_on` | §2 entity field |
| `screen` | `screen.instrument` | §2 entity field |
| `screen` | `screen.items` | §2 entity field |
| `screen` | `screen.masters_checked` | §2 entity field |
| `screen` | `screen.saf060_attested_on` | §2 entity field |
| `screen` | `screen.valid_until` | §2 entity field |
| `session` | `session.adjacent_to_long_run` | date is long-run date ± 1 |
| `session` | `session.clean` | 10 §4 clean-session test |
| `session` | `session.conditions_hot` | runner tag (11) |
| `session` | `session.date` | §2 entity field / engine value |
| `session` | `session.date_end` | end of the session date |
| `session` | `session.day1_s` | b2b day 1 duration |
| `session` | `session.day2_s` | b2b day 2 duration |
| `session` | `session.effort_target` | §2 entity field / engine value |
| `session` | `session.expected_duration_s` | LOD-017 |
| `session` | `session.hot_forecast` | runner-entered hot forecast (11) |
| `session` | `session.id` | §2 entity field / engine value |
| `session` | `session.in_published_window` | §2 Session |
| `session` | `session.is_b2b_pair` | module SES-M-016 |
| `session` | `session.is_goal_race` | is_race and the race is the goal race |
| `session` | `session.is_long_run` | module is a long-run module |
| `session` | `session.is_peak_long_run` | the long run of a loading week (ultra: a peak week per lr.ultra_peak_every_weeks); false for non-peak, deload and taper long runs (LOD-018, v5) |
| `session` | `session.kind` | §2 entity field / engine value |
| `session` | `session.ladder` | §2 entity field / engine value |
| `session` | `session.linked_entry` | ActivityRecord linked to the session |
| `session` | `session.linked_entry.duration_s` | §2 entity field / engine value |
| `session` | `session.missing_part` | planned minus done |
| `session` | `session.pace_range` | §2 entity field / engine value |
| `session` | `session.pair_s` | day1 + day2 |
| `session` | `session.planned_distance_m` | §2 entity field / engine value |
| `session` | `session.planned_duration_s` | §2 entity field / engine value |
| `session` | `session.status` | §2 entity field / engine value |
| `slot` | `slot.candidates` | §2 entity field |
| `slot` | `slot.date` | §2 entity field |
| `slot` | `slot.effort_profile` | §2 entity field |
| `slot` | `slot.module` | §2 entity field |
| `state` | `state.L30_eff_dist_m` | §2 entity field / engine value |
| `state` | `state.L30_eff_time_s` | §2 entity field / engine value |
| `state` | `state.L30_source` | §2 entity field / engine value |
| `state` | `state.L_hold_s` | §2 entity field / engine value |
| `state` | `state.V28_at_status_start_s` | V28 weekly mean at SpecialStatus start (SAF-051) |
| `state` | `state.V28_dist_m` | §2 entity field / engine value |
| `state` | `state.V28_time_s` | §2 entity field / engine value |
| `state` | `state.V28_week_s` | V28_time_s / 4 weeks, i.e. weekly mean |
| `state` | `state.V7_prev_time_s` | V7 before the gap (GEN-013) |
| `state` | `state.V_hold_s` | §2 entity field / engine value |
| `state` | `state.active_anchor_id` | §2 entity field / engine value |
| `state` | `state.adp022_consecutive_weeks` | consecutive weeks in which ADP-022 fired |
| `state` | `state.adp052_consecutive` | consecutive sessions on which ADP-052 fired |
| `state` | `state.adp052_events` | dated ADP-052 firings |
| `state` | `state.adp055_consecutive_weeks` | consecutive weeks in which ADP-055 fired |
| `state` | `state.age_high` | INP-002 |
| `state` | `state.age_low` | INP-002 |
| `state` | `state.anchors` | PerformanceAnchor list |
| `state` | `state.any_slow_trigger` | any slow trigger of 05 §2 |
| `state` | `state.baseline_confirmed` | LOD-008 (v5.1): false until state.est_confirm_weeks ≥ prog.est.confirm_weeks, then true for the rest of the season |
| `state` | `state.baseline_week_s` | LOD-003/004 baseline |
| `state` | `state.core_inputs` | inputs used by Demand and weeks_needed (03 §2) |
| `state` | `state.ctx001_applies` | CTX-001 fired |
| `state` | `state.current_symptom` | any symptom item answered yes in the last 7 days (10 §1) |
| `state` | `state.days_since_last_run` | §2 entity field / engine value |
| `state` | `state.deload_every_ctx_set` | true if any of CTX-001…004 fired |
| `state` | `state.deload_lr_baseline_s` | LR baseline for a deload (ultra: last peak; else last non-deload week, 05 §4) |
| `state` | `state.denominator_entries` | entries used in L30_eff, V28 and level attainment |
| `state` | `state.est_confirm_weeks` | LOD-008 (v5.1): consecutive most recent completed weeks with log_state = logged whose logged time from measured entries is ≥ prog.est.confirm_ratio × the planned time (weeks before the first plan count when logged); an unlogged week (ADP-003) restarts the count |
| `state` | `state.effort_ceiling` | lowest ceiling set by SES-002, SAF-008, ADP-043, ADP-052, SAF-051 (default E4) |
| `state` | `state.fatigue_hold_active` | §2 entity field / engine value |
| `state` | `state.fatigue_signals` | dated fatigue signals (08 §7) |
| `state` | `state.fatigue_weeks_consecutive` | consecutive weeks with ≥ fatigue.signals_required signals |
| `state` | `state.fit_check_weeks` | the last miss.fit_check_weeks completed weeks (ADP-024) |
| `state` | `state.gap_weeks` | length of the gap in weeks (ADP-033) |
| `state` | `state.gate` | GateOutcome of S1 (07): most restrictive outcome of SCR/SAF gates |
| `state` | `state.hab_continuous` | HAB ≥ L2 (30 min continuous) |
| `state` | `state.ladder_floor_rung` | entry rung floor (R0/R1) (SAF-083) |
| `state` | `state.ladder_kind` | none, rtr or start |
| `state` | `state.ladder_rung_index` | current rung index (S1…S9 → 1…9; R0…R5 → 0…5) |
| `state` | `state.ladder_runs_per_week` | ladder runs per week planned |
| `state` | `state.ladder_start` | date the ladder started |
| `state` | `state.last3_ladder_clean` | the last 3 ladder sessions are clean (FEA-043b) |
| `state` | `state.last_completed_week_logged_s` | logged time of the most recent completed week |
| `state` | `state.last_completed_week_planned_s` | planned time of that week |
| `state` | `state.last_exercised` | §2 entity field / engine value |
| `state` | `state.last_field_test_date` | §2 entity field / engine value |
| `state` | `state.last_goal_race_date` | date of the last goal race run (logged or planned), across goal changes (INV-31) |
| `state` | `state.last_goal_race_distance` | its distance |
| `state` | `state.last_non_deload_week_end` | end date of the last non-deload week |
| `state` | `state.last_reds_screen` | date of the last REDsScreenRecord |
| `state` | `state.last_rung_logged_s` | logged time of the last ladder rung (LOD-070) |
| `state` | `state.last_verdict` | verdict of the previous feasibility run |
| `state` | `state.level_confidence` | §2 entity field / engine value |
| `state` | `state.level_rests_on_self_report` | §2 entity field / engine value |
| `state` | `state.levels` | CompetenceState level per node (02) |
| `state` | `state.levels.DUR` | §2 entity field / engine value |
| `state` | `state.levels.HAB` | §2 entity field / engine value |
| `state` | `state.levels.THR` | §2 entity field / engine value |
| `state` | `state.levels.TOL` | §2 entity field / engine value |
| `state` | `state.levels.VO2` | §2 entity field / engine value |
| `state` | `state.log_status` | §2 entity field / engine value |
| `state` | `state.logged_l30_dist_m` | longest measured, non-flagged logged run in 30 days |
| `state` | `state.longest_ladder_session_s` | longest logged ladder session incl. warm-up walk (FEA-043b) |
| `state` | `state.max_prev4_week_s` | max logged weekly time of the previous 4 weeks (GEN-020) |
| `state` | `state.max_tolerated_g_h` | highest logged carb intake with gi_score ≤ fuel.gi_pass_max (INV-18) |
| `state` | `state.on_start_ladder` | Session.ladder == start for the current week |
| `state` | `state.pace_anchor_10k_equiv_s` | §2 DerivedState |
| `state` | `state.pending_anchor_10k_s` | ADP-067 (v5.1): 10K-equivalent of the pending measured result (inside the confirmation band), absent or null when none |
| `state` | `state.pending_anchor_date` | ADP-067 (v5.1): date of that result |
| `state` | `state.pending_confirms` | ADP-067 (v5.1): has(state.pending_anchor_10k_s) && days_between(state.pending_anchor_date, anchor.date) ≤ result.confirm_window_days && the pending and the new result lie on the same side of state.pace_anchor_10k_equiv_s; evaluated once when the result event arrives |
| `state` | `state.perf_level` | §2 entity field / engine value |
| `state` | `state.pre_entry_L30_eff_dist_m` | L30_eff before the entry (GEN-023) |
| `state` | `state.pre_race_L30_eff_time_s` | L30_eff before the race entry (LOD-012) |
| `state` | `state.prev_anchor_10k_s` | 10K-equivalent of the previous measured anchor, else of the claimed band edge (INP-025) |
| `state` | `state.prior_tol_tier` | §2 DerivedState |
| `state` | `state.probation_until` | §2 entity field / engine value |
| `state` | `state.professional_contact_attested_on` | ADP-057 attestation date |
| `state` | `state.progression_profile` | §2 entity field / engine value |
| `state` | `state.reds_flag_active` | exists(flags.active, f, f.subkind == 'reds_screen') |
| `state` | `state.rest_days_before_next` | rest days required before the next ladder session |
| `state` | `state.rich_weeks_consecutive` | consecutive weeks with log_status rich (GEN-014) |
| `state` | `state.rtr_entry_reason` | why RTR was entered (gap, postpartum, pregnancy_stop, bone_stress, illness) |
| `state` | `state.rung_advanced_by_backfill_last7d` | rungs advanced using backfilled sessions in the last 7 days |
| `state` | `state.rung_counted_sessions` | sessions counted toward the current rung under SAF-082 constraints |
| `state` | `state.rungs_to_last` | rungs from the entry rung to the last rung |
| `state` | `state.runner_tags` | {minor, masters, female, ultra_goal, novice} that apply (CTX-008) |
| `state` | `state.s_slow` | 03 §2 S_slow (demand conversion only, FEA-002) |
| `state` | `state.saf061_shown_this_season` | MSG-SAF-061 already shown this season |
| `state` | `state.scr_disease_inactive` | exists(screen.items, q, screen.answers[q] == true && screen.item_factor[q] == 'known_disease') && claim.runs_per_week < p('screen.active_runs_min') (SCR-006) |
| `state` | `state.scr_symptom` | exists(screen.items, q, screen.answers[q] == true && screen.item_factor[q] == 'symptom') || screen.followup_directs_evaluation (SCR-004) |
| `state` | `state.sweat_rate_ml_h` | SweatTest.rate_ml_h if present |
| `state` | `state.symptom_free_days_attested` | days the runner attests symptom-free (ADP-042) |
| `state` | `state.tol2_band_high_s` | upper weekly-time bound of TOL L2 (02 §2) (GEN-022) |
| `state` | `state.tol_confidence` | confidence of the TOL level (02 §2) |
| `state` | `state.tol_level` | = state.levels.TOL |
| `state` | `state.tol_rests_on_estimated` | the TOL level rests only on estimated data (INP-030) |
| `state` | `state.tol_tier` | INP-030 |
| `state` | `state.unclean_weeks_on_rung` | weeks on this rung that contain an unclean session (SAF-084) |
| `state` | `state.weeks_without_fatigue_signal` | §2 entity field / engine value |
| `tied` | `tied.module_ids` | §2 entity field |
| `unit` | `unit.h_s` | §2 entity field / engine value |
| `unit` | `unit.km_m` | §2 entity field / engine value |
| `unit` | `unit.min_s` | §2 entity field / engine value |
| `unit` | `unit.pct` | §2 entity field / engine value |
| `unit` | `unit.week_d` | §2 entity field / engine value |
| `week` | `week.all_easy_at_cap` | every easy day at its day cap (LOD-016) |
| `week` | `week.completed_time_s` | time of done/partial sessions |
| `week` | `week.e3_touches` | §2 entity field / engine value |
| `week` | `week.eco_sessions_min` | CTX-004 strength floor |
| `week` | `week.est_base_s` | LOD-007 (v5.1): the highest logged weekly time over the prog.est.window_weeks weeks before w; weeks not yet run count their planned time provisionally and are replaced by logged time at every re-plan (as LOD-011); while no week is logged, V_hold from claims |
| `week` | `week.ended` | today > last day of week |
| `week` | `week.entries` | ActivityRecords dated in the week |
| `week` | `week.free_days` | available, unblocked days not yet used |
| `week` | `week.has_illness_pain_availability_report` | any such report dated in the week |
| `week` | `week.id` | §2 entity field / engine value |
| `week` | `week.is_deload` | §2 entity field / engine value |
| `week` | `week.is_first_full_week_back` | first full week after a gap |
| `week` | `week.is_first_pair` | first back-to-back pair of the plan |
| `week` | `week.is_race_week` | §2 entity field / engine value |
| `week` | `week.is_step_up` | planned volume or long run above the previous loading week |
| `week` | `week.kind` | normal or maintenance (ADP-071) |
| `week` | `week.l30_eff_s` | LOD-011 output |
| `week` | `week.later_easy` | easy sessions later in the same week |
| `week` | `week.loading_weeks_since_recovery` | loading weeks since the last recovery-like week (PHS-006) |
| `week` | `week.log_state` | §2 entity field / engine value |
| `week` | `week.logged_time_s` | same, used by LOD-070 |
| `week` | `week.logged_total_s` | sum of logged durations |
| `week` | `week.long_run` | the long-run Session |
| `week` | `week.long_run_date` | its date |
| `week` | `week.long_run_status` | status of the week's long run |
| `week` | `week.lr_cap_s` | LOD-020 output |
| `week` | `week.lr_s` | planned long-run duration |
| `week` | `week.original_time_s` | planned time before the busy mark (ADP-071) |
| `week` | `week.phase` | §2 entity field / engine value |
| `week` | `week.planned_time_s` | = Week.planned_time_s (§2) |
| `week` | `week.prev_lr_s` | §2 entity field / engine value |
| `week` | `week.prev_planned_time_s` | §2 entity field / engine value |
| `week` | `week.quality_max` | §2 entity field / engine value |
| `week` | `week.runs` | number of running sessions |
| `week` | `week.sessions` | §2 entity field / engine value |
| `week` | `week.start` | first date |
| `week` | `week.strides_allowed` | §2 entity field / engine value |
| `week` | `week.taper_k` | index k of the taper week |
| `week` | `week.template_lr_s` | §2 entity field / engine value |
| `week` | `week.unmoved_position_respects_gap` | PHS-006 test |
| `week` | `week.v_two_loading_weeks_before_s` | planned time two loading weeks before (LOD-003) |
| `week` | `week.weeks_to_phase_boundary` | full weeks left in the week's phase after this week (0 = last week of the phase); PHS-004 moves a deload when ≤ 1 (post-audit, 13 R-03) |

### 2b.3 Helper functions (closed form; part of the grammar)

| Function | Definition |
|---|---|
| `p(id)` | resolved parameter: registry default → preset override → `override.<id>` (MIN for limits); a missing id is an error |
| `has(path)` | presence test (CEL) |
| `size(list)` | number of elements (CEL) |
| `min(a, …)`, `max(a, …)`, `abs(x)` | as usual; any unknown argument → unknown |
| `mean(a, …)` | arithmetic mean of the arguments; any unknown argument → unknown (v5.1, ADP-067 averaging rule) |
| `round_down(x, step)` | largest multiple of `step` ≤ x |
| `days_between(d1, d2)` | d2 − d1 in days; `hours_between(t1, t2)` in hours; `weeks_between(d1, d2)` = floor(days_between / 7) |
| `date_add(d, n)` | d + n days; `weekday(d)` ∈ {Mon … Sun} |
| `count(list, x, pred)`, `exists(list, x, pred)`, `all(list, x, pred)` | CEL comprehensions; `count` returns an int |
| `sum(list, x, expr)` | Σ expr over the list (0 for an empty list) |
| `max_or_zero(list, x, expr)` | max of expr over the list, 0 if empty |
| `first(list, x, pred)` | first element (date order) satisfying pred; unknown if none |
| `last(list)` | last element in date order |
| `sort_by(list, x, keys)` | stable sort by the key list |
| `pairs(list)` | all (a, b) with a.date < b.date; used as `all(pairs(L), a, b, pred)` |
| `age_low(d)`, `age_high(d)` | INP-002: age on d assuming the birthday is the last / first day of the birth month |
| `effort_rank(e)` | index of e in ['E0', 'E1', 'E2', 'E3', 'E4']; efforts are **never** compared as strings |
| `verdict_rank(v)` | feasible 0, stretch 1, infeasible 2 |
| `reason_class(code)` | 'infeasible' / 'stretch' / 'info' from the reason table of 03 §5 |
| `reason_group(code)` | 'availability' for AVAILABILITY_*, else the code's group in 03 §5 |
| `tier_rank(t)`, `kind_rank(k)` | ADP-012 orders: T0 < … < T6; red_flag < illness < pain < gap < fatigue < missed < partial < unlogged_week < availability < life < result < goal |
| `gap_band(days)` | '8_14' if gap.reduce_trigger_days ≤ days < 15, '15_29' if 15 ≤ days < gap.rtr_trigger_days (parameter suffixes of `gap.vol_factor`) |
| `rtr_entry_rung(tier, days)` | lookup in the 10 §4 entry table (most cautious matching row, SAF-080) |
| `same_pair(a, b)` | a and b belong to the same back-to-back pair |
| `adjacent(lr)` | the sessions dated lr.date − 1 and lr.date + 1 |
| `next_day(s)` | the session on s.date + 1 (or none) |
| `parent_week(w)` | the week of the parent plan with the same kind and load ordinal (INV-04) |
| `module(id)` | the SessionModule record |
| `prereqs_hold(m, d)` | all(m.prereqs, q, level(q.node, d) ≥ q.level), levels as of date d (02 CMP-006) |
| `l30_time(d)`, `l30_dist(d)` | LOD-011: max duration (distance) over measured, non-flagged logged runs and planned non-race runs dated in [d − 30, d), with pre-gap runs removed after a G1/G2 gap; logged races contribute ≤ spike.warn_ratio × the pre-race value |
| `spike_cap(w)` | p('spike.warn_ratio') × l30_time(w.long_run_date) |
| `baseline(w)` | LOD-003/004: planned time of the last non-deload week before w if it is ≤ prog.baseline_max_age_weeks old, else the most recent completed week's logged time |
| `current_week(d)` | the plan week containing d |
| `phase_last_week(ph)` | last week of phase ph |
| `last_completed_comparable_week(w)` | most recent fully completed week of the same kind (ADP-022) |
| `last_completed_step()` | the last loading step completed without pain (ADP-052) |
| `next_allowed_week(s, gap)` | first later week whose long-run day is ≥ gap days from every other run over the guard (LOD-018) |
| `fuel_band_high(dur)` | upper edge of fuel.band.by_duration for that duration |
| `highest_tol_level(v28_s, l30_s)` | highest TOL level whose 02 §2 weekly-time and long-run thresholds both hold (INP-030) |
| `threshold_level(node_id)` | highest level n of the node whose 02 §2 state threshold holds on DerivedState (CMP-001) |
| `level_prereqs_hold(node_id, n, d)` | every prerequisite edge of node level n (02 §3) holds on date d (CMP-002) |
| `round_up(x, step)` | smallest multiple of `step` ≥ x |
| `ceil_div(a, b)` | ⌈a / b⌉ |
| `anchor_l30_ok(state, goal)` | FEA-023: measured L30_eff_dist ≥ race / longest_ratio_max, or L30_eff_time ≥ L_req_time |

### 2b.4 Procedures (named algorithms; a record that calls one is `procedure`, not `formal`)

| Procedure | Specified in | Why it is not an expression |
|---|---|---|
| `compute_demand(goal, preset, s_slow)` | 03 §2 | multi-step table lookups and conversions |
| `predict_band(distance, anchor, state)` | 03 §3 | model choice, Riegel/extrapolation limits, widening |
| `pace_range(anchor, effort)` | 03 §3b | pace model with rounding and deadband |
| `dry_run_weeks_needed(goal, preset, state)` | 03 §4 | runs the 05 curve builder and the week fill |
| `water_fill(week, min_run_s)` | 05 LOD-031 | iterative fill |
| `preset_cap(long_run)` | 05 LOD-020 | MIN over the preset's %, time and absolute caps per family |
| `t0t3_limit(week)` | 07 S5 | MIN over every T0–T3 cap that applies to the week |
| `decay(levels, gap_weeks, decay_weeks)` | 02 CMP-003 | per-node decay table |
| `place_in_order(week, order)` | 06 SES-003 | slot placement with day constraints |

The validator re-implements the S-group procedures separately (07 §5a); the oracle of 07 §5a (TST-110…112) checks them against 13's hand values.

### 2b.5 Numbers in expressions

Only `0`, `1` and the unit constants `unit.min_s` (60), `unit.h_s` (3600), `unit.km_m` (1000), `unit.week_d` (7) and `unit.pct` (100) may appear. Every threshold is a `p()` id (INV-12). TST-121 rejects any other literal.

## 3. Rule format

### 3.1 Human-readable line (used in every module)

```
RULE <ID> | priority <Tn.nnn> | when <condition> | then <action> | because <rationale> | evidence <file §, grade> | basis <evidence|convention|design_default|eng> | default? yes/no
```

- `<ID>` = module prefix + 3 digits (ranges in `CONTRACTS.md`).
- `priority` = tier T0…T6 (07 §1) + a 3-digit `nnn` from the module's block (`CONTRACTS.md §1`). The pair (tier, nnn) is unique across the whole rule base; the same `nnn` may appear in different tiers. Lower tier number wins; inside a tier, lower `nnn` wins (PRIORITY hit policy).
- `when` uses only fields of §2/§2b and parameter IDs (no literal numbers except 0, 1, unit constants and enum values).
- `then` uses the action vocabulary of §3.3.
- `evidence` carries at least one grade (VERIFIED, CORROBORATED, CREDIBLE, ALLEGED, CONTRADICTED, UNKNOWN), or `N/A` when `basis = eng` (v5, p2-B R6, p2-A R7).
- `basis` (v5): `evidence` (the decisive value rests on graded findings), `convention` (an established coaching or clinical practice, graded as a description of practice), `design_default` (ALLEGED/UNKNOWN or a chosen value), `eng` (structure, ordering, data handling: no physiological claim).
- `default? yes` when any decisive number or threshold is a design default; then `basis = design_default`.

### 3.2 Expression grammar and machine record (v4, p1-C R11; corrected in v5)

**Choice: "RuleExpr", a strict subset of CEL (Common Expression Language) with explicit presence checks, using CEL's own four-valued evaluation.**

Options considered [hearing-3 sys-acad, sys-field]:

| Option | Strength | Why not chosen as-is |
|---|---|---|
| DMN tables + FEEL | Overlap and missing-rule analysis is published | `null` mixes "missing" and "error" (B-FEEL is still being standardised) |
| JSON Logic | Plain JSON, easy to ship | Two-valued truthiness: a missing value silently becomes "false", which is unsafe for gates |
| CEL | Separates *error* from *unknown*; `&&`/`||` commutative and absorbing; `has()` for presence; linear-time and side-effect-free; partial evaluation | Has no tables, so the tier, hit policy and priority metadata come from the record |
| Custom DSL | Full control | No tooling |

We take CEL's value semantics and keep the decision-table discipline in the record: tier, priority and hit policy, plus our own per-tier overlap check (§3.4).

**Correction in v5 (factdesk6 §4, CORROBORATED).** v4 described the logic as "Kleene three-valued, absent = unknown". That is not how CEL works. CEL has **four** values — `true`, `false`, `error`, `unknown` — of which the first three are definitive. A variable is *unknown* only when it is **declared** unknown (cel-go partial activation / attribute patterns; Java `UnknownContext`). An absent variable that is not declared unknown is a *missing-attribute error*. RuleExpr follows CEL exactly; the engine declares the unknowns.

**Syntax** (subset of CEL):
- **Literals:** numbers (only `0`, `1`; other numbers through `p()` or `unit.*`, §2b.5), strings, `true`, `false`, `null`; lists `[..]`; maps `{..}` in action expressions.
- **Field paths:** only the roots and paths of §2b.1–2b.2.
- **Operators:** `== != < <= > >=`, `&& || !`, `+ - * /`, `in`, `?:`, index `[ ]`.
- **Functions:** only those of §2b.3; calls to §2b.4 procedures make the record `procedure`. No user-defined functions, loops or mutation.
- **Actions** use the typed vocabulary of §3.3 in the record's `action` object, not in the expression.

**Unknown and error semantics:**
1. **Declared unknowns.** The engine declares as *unknown*: every runner-entered field left blank or answered "I don't know" (allowed only outside `inp.no_unknown_fields`, INP-001), every safety question not yet answered (10 §1 items, pain prompts), and any value with `confidence = unknown`. Every other absent path, a type mismatch or a missing parameter is an **error** (E).
2. Comparisons and arithmetic with U give U; with E they give E.
3. `&&` / `||` are commutative and absorbing: `false && U = false`, `true || U = true`; a definitive `false`/`true` also absorbs E; otherwise E dominates U (CEL).
4. A rule **fires only when its condition is `true`**. What happens on U is declared per record in `on_unknown`:
   - `fire`: the default for every T0–T2 rule whose action restricts (cap, block, gate, flag an entry, ask to confirm): an unknown age or claim is treated as the cautious case;
   - `hold` (v5, p2-C R2): for symptom questionnaires (SAF-001…007, ADP-040/050/081, NUT-033/043). No session is shown until the questions are answered; the runner sees only MSG-SAF-HOLD ("Please answer the safety questions before your next run."). **No flag is raised and no emergency text is shown** on unknown; a flag is raised only on an actual "yes";
   - `ask`: show the question that would resolve U before proceeding (e.g. INP-002 age);
   - `skip`: only for permissive or advisory rules (a T0–T2 restrictive record with `skip` fails TST-121).
5. **E never fires a rule.** E sets the plan to its safe state: the previous version is kept, a new plan is not emitted, the error is logged, and the build test suite fails on any E reachable from the persona grid.
6. Presence must be explicit. A condition that reads an optional field must guard it with `has()`, or rely on rule 4.

**Machine record.** There is one record per rule, plus one per invariant, all in `rules.json`. **v5: the module texts are the only source.** Each module ends with a `## Machine records (v5)` section holding a fenced `rulexpr` block (one JSON object per line); 07 also holds the `rulexpr-inv` invariant assertions. `design/v5/tools/build_rules.py` joins each record to its RULE line by id, reads the action schema from §3.3 and the procedure list from §2b.4, and writes `rules.json`. TST-121 (record sync, formerly the second TST-090) checks that rules.json equals a fresh build.

```json
{
  "id": "LOD-017", "module": "05", "kind": "rule", "tier": "T2", "priority": 257, "hit_policy": "ALL",
  "when_text": "a planned run's expected duration exceeds lr.long_guard_min …",
  "condition": "session.expected_duration_s > unit.min_s * p('lr.long_guard_min') && !(state.tol_level >= p('lr.long_guard_tol_level') && state.tol_confidence == 'measured' && (age_high(session.date) < p('masters.vigorous_assessment_age') || has(screen.saf060_attested_on)))",
  "on_unknown": "fire",
  "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "unit.min_s * p('lr.long_guard_min')",
             "then": [{"op": "log_deviation"}, {"op": "render_run_walk", "target": "session"}, {"op": "emit_message", "msg": "MSG-LOD-017"}]},
  "expression_status": "formal", "release": "MVP",
  "evidence": {"text": "hearing-2 med, UNKNOWN …", "grades": ["UNKNOWN"], "basis": "design_default"},
  "explain": {"runner": "MSG-LOD-017", "coach": "because: …"},
  "tests": {"fires": "T-LOD-017-fires", "silent": "T-LOD-017-silent"}
}
```

`expression_status` (v5, honest flag, p2-B R2):
- `formal`: condition and action are complete RuleExpr over §2b; an event-type test alone does not count unless the action carries the decisive expression;
- `procedure`: formal, except that it calls a §2b.4 procedure specified in a module section;
- `static`: a build-time lint or test, not a runtime rule (e.g. INP-031, FEA-002, NUT-001, GEN-004, INV-10/12/24/26);
- `text_only`: prose only; `on_unknown: null`, the engine refuses to evaluate it, and it may not ship in a release profile that lists it (§6).

### 3.3 Action vocabulary (typed, v5, p2-B R1, p2-A R2)

Every action is an object `{op, <required fields>, then?, msg?, when?, otherwise?, until?, unless?}`. `then` is a list of further actions applied after the first; `when` restricts an action or a `then` step, and `otherwise` names the action taken when `when` is false; `msg` names the message shown. The build rejects an unknown `op` or a missing required field.

| Op | Required fields | Meaning |
|---|---|---|
| `set` | target, expr | assign |
| `cap` | target, expr | target = MIN(target, expr) |
| `floor` | target, expr | target = MAX(target, expr) |
| `gate` | outcome | S1 GateOutcome ∈ {proceed, proceed_restricted, pause_until_clearance, no_plan}; optional `until`, `effort_max` |
| `raise_flag` | kind, subkind, outcome | create a RiskFlag (10 only) with the gate outcome it implies |
| `route` | to | hand the event to the named rule or module, which decides |
| `block_sessions` | filter, until | no session matching `filter` (over `s`) until `until` holds |
| `ask` | field | ask the runner; the answer resolves a declared unknown |
| `ask_confirm` | field | ask once to confirm or correct; `on_no_answer` says what happens |
| `flag_entry` | target | plausibility = flagged; `exclude_from` lists the denominators |
| `reject_input` | target | do not store the value |
| `require_attestation` | target, msg | the named attestation is needed before the flag clears |
| `require_rescreen` | — | a new ScreeningRecord before the next session |
| `emit_message` | msg | show the message |
| `insert_phase` | phase, rung_expr | insert RTR or START_LADDER at the given rung |
| `insert_deload` | every_expr | PHS-001 placement |
| `drop_deload` | target | remove a deload week |
| `move_deload` | target, expr | move a deload week |
| `set_rung` | expr | ladder rung index |
| `drop_session` | target | remove a session or part of it (never re-added) |
| `move_session` | target, expr | move a session; `otherwise` gives the fallback action |
| `replace_module` | target, expr | swap the module (REP-001…004) |
| `schedule_session` | module_expr | add a test or a specified module |
| `schedule_prompt` | field, when | a later prompt (e.g. next-morning pain) |
| `hold_step` | weeks_expr | no increase in volume, long run or level for that many weeks |
| `freeze` | target, until | no increase of the target until the condition |
| `suppress` | what | remove numeric targets of the listed kinds |
| `add_reason` | code | add a feasibility reason (03 §5) |
| `label` | code | attach a label that never changes the verdict |
| `set_verdict` | expr | feasibility verdict |
| `generate_options` | order | repair options in that order (03 §6, 07 §6.2) |
| `drop_option` | target | discard an option that fails validation |
| `offer_options` | order | offer choices; never automatic |
| `offer_swap` | target, expr | offer one swap (ADP-021); never automatic |
| `regenerate` | from_stage | re-run 07 from that stage |
| `fail_closed` | reasons_expr | go to S9 with these reasons |
| `raise_long_run` | target, expr | LOD-016 fill |
| `shorten_week` | target, order_expr, until | SES-008 order |
| `filter_candidates` | target, expr | SES-001 candidate filter |
| `order_events` | expr | ADP-012 ordering |
| `record_event` | kind | create an AdaptationEvent |
| `render_run_walk` | target | render as run-walk (SES-009) |
| `render_fixed` | target, expr | show the stored instrument unchanged |
| `constraint` | check | a condition every output must meet (checked by the validator or lint) |
| `log_deviation` | — | write a DeviationLedgerEntry |

### 3.4 Static checks at build (owned by 07/14)

1. Unique (tier, nnn) across the rule base; `nnn` inside the owner's block; unique IDs; IDs inside the owner's range.
2. Overlap check within each PRIORITY tier: two rules with satisfiable joint conditions and different non-numeric actions must have different priorities (always true by 1) and be listed in the conflict report for review.
3. Unreachable rules (condition unsatisfiable given enums/ranges).
4. Every parameter referenced exists in the registry with grade and basis (INV-12).
5. No blocking condition references ACWR, monotony, Banister output or age-predicted HRmax (INV-09, INV-10).
6. Every user-facing message of a T0/T1 rule has `is_safety_generic = true` (INV-24).
7. Competence graph checks CMP-CHK-1…6 (02 §6).
7b. Every T0–T2 rule and every INV has a `formal` record in rules.json. Every field path it uses exists in §2. Every `p()` id exists in parameters.md. Every unguarded optional field is flagged (v4).
7c. (v5) Every T0–T2 rule, every INV and every MVP rule (§6) has a machine record whose status is `formal`, `procedure` or `static`; every action passes the §3.3 schema; every path is in §2b; every function is in §2b.3/2b.4; no literal other than 0, 1 and `unit.*`; no restrictive T0–T2 record has `on_unknown = skip`; every rule has a grade and a basis; every message id resolves in messages.md (`design/v5/tools/check_rules_v5.py`, TST-121).
8. Every rule has ≥ 1 firing test and ≥ 1 silent test.

## 4. Self-reported data: fields and checks

| Field | Confidence when | Used for | Never used for |
|---|---|---|---|
| Ticked session distance/duration | measured if entered ≤ 48 h | L30_eff, V7/V28, levels | — |
| Ticked session pace (derived) | estimated at best | plausibility checks; distance↔time demand conversion only (03 FEA-002, `S_slow`) | anchors, paces, cap denominators (factdesk2 §6, CREDIBLE moderate) |
| RPE | measured if ≤ 48 h | session load (time × RPE), fatigue signals (08) | gates by itself |
| Onboarding L30 / weekly volume | estimated | L30_eff (discounted, GEN-011), feasibility with widened band | unlocking levels above `cmp.self_report_level_cap` |
| Recalled PB | estimated | feasibility band (×`pred.band_widen_estimated`) | pace targets |
| Dated race/test entered ≤ 48 h | measured | anchors, paces | — |

Plausibility rules GEN-020…022 set `plausibility`; INV-14 keeps flagged entries out of every cap denominator.

## 5. Message catalogue (v4, p1-C R7)

All user-facing text lives in **one catalogue, `messages.md`**. Each entry has:
- `id`, `audience` ∈ {runner, coach};
- `layer` ∈ {card, why, coach};
- `text`, `why`;
- typed placeholders `{name:type}` with type ∈ {min, km, pace, time, date, int, text};
- the rule IDs that emit it.

Display rounding uses `display.*` (messages.md §0). Modules reference messages by ID only; a module text that differs from the catalogue is a defect, and **the catalogue governs**. Safety messages carry `is_safety_generic = true` (INV-24).

## 6. Release profiles (v5, p2-B R12)

> **In plain words.** The whole method is specified, but it does not all ship at once. The first release covers 5K to half marathon with the default method; marathon and ultra follow only when their extra safety tests pass.

| Profile | Scope | Rules that must be `formal`, `procedure` or `static` | Entry condition |
|---|---|---|---|
| **MVP** | 5K, 10K, HM; preset `method_default`; horizons H0–H3; start ladder, RTR, all adaptation of 08 except DST | every T0–T2 rule, every INV-01…31, the 66 MVP rules of p2-B R11, 39 further MVP-reachable T3–T6 rules formalised in v5, (v5.1) the formal rules LOD-007, LOD-008 and ADP-067, and (post-audit) the 27 MVP-reachable rules still `text_only` (`release: "MVP"` in rules.json: 255 rules + 31 invariants, of which 27 are not yet executable) | TST-121 green on the MVP set; TST-110…112 oracle agrees with 13; fixtures TST-095…106 pass; PAR-Q+ licence and item map signed off; safety text reviewed (00 §8 release blockers) |
| **R2** | + marathon (`road_classic`), presets `hansons`, `pfitzinger_classic`, `higdon_novice`, `galloway` once their fixtures are encoded (INV-26) | + LOD-017/018 paths for > `lr.long_guard_min`, DST road rules, NUT race-fuelling rules used by marathon | 65+ fixtures (SAF-060), INV-28/29 fixtures and oracle (a) pass |
| **R3** | + 50K, 100K (`ultra`), back-to-backs, `koop_ultra` | + DST ultra rules, NUT T4–T6 | ultra fixtures; b2b fixtures; pilot evidence of R2 |

H4/H5 (PHS-012…016, FEA-024/025), other presets and CMP nodes beyond the MVP levels stay `text_only` until their profile. The build marks every record with `release`, and TST-121 fails if a record tagged MVP is `text_only`. The tag list lives in `tools/build_rules.py`; Post-audit, the 27 text-only rules that MVP code paths still reach (00 §8, e.g. CMP-007 key-session choice and the SES dose rules) are tagged MVP, so TST-121 currently fails; formalising them is release blocker B-4.

**Build order** (p2-B R12): (1) parameter registry and schema; (2) RuleExpr evaluator with CEL four-valued truth tables (TST-126); (3) S0–S2 and the B-group validator; (4) the independent oracle (07 §5a, TST-110…112); (5) S3–S8; (6) adaptation (08); (7) message catalogue and display. The acceptance criteria stay those of the full specification; a profile is a subset of it, not a lower bar.


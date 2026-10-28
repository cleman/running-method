# 12 — Data model and rule format (v5.3)

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
| `RunnerProfile` | (v5.3 adds injury_last_12w, hard_sessions_max ∈ {1, 2, 3}, prescription_preference ∈ {distance, time, both}; 01 §1.1) id, birth_month, birth_year (both required, no "I don't know"; INP-001/002, v5), sex (optional; used only for REDs screen routing and age-grade tables), body_mass_kg (optional, confidence), training_age_years (conf), other_sport_background ∈ {none, cycling, swimming, triathlon, team, other}, injury_last_12m (bool, site_text never interpreted), injuries_history_count, available_days[] (weekday set), max_runs_per_week, available_minutes_per_week, blocked_dates[], long_run_day, run_walk_preference (bool), preset_preference (SchoolPreset id or null), night_shift_dates[] (dated roster; 01 CTX-005), never_run (bool; 01 §1), hill_access (bool, default false; 06 SES-022), level_tests_opt_out (bool, default false; 06 SES-025, v5.2), nutrition_referral_flag (bool, one fixed question; 11), caffeine_sensitive (bool; 11), units_pref, created_at |
| `ScreeningRecord` | id, runner_id, instrument = "PAR-Q+ 2023" (fixed text), answers{q_id: bool}, followup_answers{q_id: bool}, guardian_attested_on (minors), guardian_hardcap_optin (bool; SAF-043), completed_on, valid_until (= completed_on + `screen.valid_days`), outcome ∈ {proceed, proceed_restricted, pause_until_clearance, no_plan}, clearance_attested_on (nullable) |
| `ScreeningItemMap` | item_id → factor ∈ {symptom, known_disease, musculoskeletal, other}; filled from the licensed PAR-Q+ text and signed off in clinical review (release blocker, RESOLUTIONS A4) |
| `SpecialStatus` | runner_id, type ∈ {minor, pregnant, postpartum, masters_65_vigorous}, start_date, attested (bool), due_date (required in pregnancy mode; SAF-051/054, v5), has_given_birth (SAF-054); `pregnant` → maintenance mode, effort ≤ `pregnancy.max_effort` (SAF-051) |
| `RiskFlag` | id, runner_id, kind ∈ {red_flag, screening, reds_screen, pain, illness}, subkind ∈ {cardiac, bone_stress, bone_stress_highrisk, heat, eah, pregnancy_stop, reds_escalated, pain_persistent, illness, reds_screen}, region (bone-stress body region option, nullable), rule_id (always a SAF rule: 10 alone raises flags), raised_on, status ∈ {active, cleared}, cleared_on, clearance_attested_on — internal kind labels never shown to users (00 §6) |
| `ContextModifier` | id (`CTX-nnn/x`: one record per operation), rule_id (CTX-nnn), op_index, trigger (condition), parameter_id, operation ∈ {set, min, max, multiply}, value, grade, envelope (population tags), user_message_id |
| `ActivityRecord` | id, runner_id, date, entered_at, type ∈ {run, run_walk, race, test, cross_training, strength}, planned_session_id (nullable), duration_s, distance_m (nullable), rpe_0_10, effort_reported (nullable), pain_0_10 (nullable), gi_score_0_10 (nullable), carb_g_per_h (nullable), notes, fatigue_flag (bool), stopped_early_reason (enum, nullable), short_sleep_or_night_shift (bool), conditions_hot (bool), effort_all_out (bool), fuel_products[], **confidence**, **plausibility ∈ {ok, flagged, confirmed}**, source ∈ {tick, manual_add, onboarding_claim, backfill} |
| `OnboardingClaim` | runner_id, claimed_weekly_distance_m, claimed_weekly_time_s, claimed_runs_per_week, claimed_L30_distance_m, claimed_L30_duration_s, last_run_date, claimed_continuous_30min (bool), each with confidence |
| `PerformanceAnchor` | id, runner_id, kind ∈ {race, field_test, cs_test}, distance_m, time_s, date, entered_at, effort_all_out, official_result_confirmed (v5.3, EXP-001), confidence ∈ {measured, declared (v5.3, INP-005), estimated}, age_grade_pct (derived, WMA 2023; v5.3 approximate tables, 02 §2b), superseded_by |
| `SweatTest` | runner_id, date, duration_s, rate_ml_h, conditions (11) |
| `REDsScreenRecord` | runner_id, date, answers{q_id: bool} (fixed question set), trigger ∈ {onboarding, interval, off_cycle} (11 NUT-050) |
| `HRReference` | runner_id, kind ∈ {hrmax_measured, lthr_measured}, value_bpm, date, method — no `age_formula` kind exists (INV-09) |

### Derived
| Entity | Key fields |
|---|---|
| `DerivedState` | runner_id, as_of, V7_time_s, V7_dist_m, V28_time_s, V28_dist_m, F28, L30_eff_dist_m, L30_eff_time_s, L30_source ∈ {log_rich, log_sparse_claim, undefined_rtr}, log_status ∈ {rich, sparse, none}, days_since_last_run, age_low, age_high (INP-002), tol_tier, prior_tol_tier (tier before the latest gap; SAF-080), V_hold_s, L_hold_s (baseline hold, LOD-005), active_anchor_id, pace_anchor_10k_equiv_s (for the FEA-014 pace bands), pending_anchor_10k_s and pending_anchor_date (ADP-067, v5.1), baseline_confirmed and est_confirm_weeks (LOD-007/008, v5.1), perf_level (age-grade band), progression_profile ∈ {standard, slow}, probation_until, active_flags[] |
| `CompetenceState` | runner_id, node, level, confidence ∈ {measured, declared (v5.3: experienced path, EXP-002), estimated, unknown}, source ∈ {log_threshold, exit_test, self_report, ladder_credit, race_result (v5.3)}, achieved_on, last_exercised_on |

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

### Engine state and serialised contract (v5.2)
| Entity | Key fields |
|---|---|
| `EngineState` | the only state kept between generator calls (§3.8): probation end, rich-week count, baseline confirmation, ladder state, competence levels from tests, module dose steps, exit-test schedule, fuelling step, run-walk rung, active and pending anchors, active effects (blocks, freezes, holds, effort ceilings with their `until`), counters and dated event lists, messages shown, last goal race, last verdict, season index, deload counter start |
| `GeneratorInput` / `GeneratorResult` | `spec/schema/input-profile.schema.json` and `result.schema.json`: the serialised form of every entity above. Where this table and the schema differ, **the schema governs** for field names and types; v5.2 added there the fields the invariants read (`Session.is_hard`, `is_run`, `is_key`, `run_walk`, `hr_zone`, `hr_source`, `dose_step`, `is_test`; `Week.load_kind`, `has_e3_touch`, `hard_time_s`; `Plan.race_fuel_g_h`), `ActivityRecord.test_completed` / `test_held_effort` (06 §3b), the AdaptationEvent kind `goal_edit`, the phase type START_LADDER, and the result kinds of §3.12 |

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
| `violation` | the validator violation being repaired in S8r (07 §2c, v5.2) | `inv_id`, `session`, `week`, `unfixed` |
| `today`, `now` | evaluation date and timestamp | supplied by the engine; never read from the device clock inside a rule |
| `s`, `x`, `w`, `a`, `b`, `e`, `f`, `o`, `d`, `lr`, `q`, `t`, `i` | comprehension variables | bound by `all/exists/count/sum/pairs` or, in `block_sessions.filter`, to each planned session; an action `target` may name the witness of the condition's `exists` (it applies to every witness) |

### 2b.2 Field paths used by the machine records (generated from the rulexpr blocks)

Every path below is used by at least one record. **v5.2 (Q12):** every path has a type: `int s` (seconds), `int m` (metres), `int`, `number`, `bool`, `date`, `timestamp`, `enum` (values in §2 or the schema), `string`, `map`, `list<Entity>`, or an entity name (its fields are those of `spec/schema`). A list path's elements are bound to comprehension variables; their fields are checked against the element entity (§2b.2b). Paths that are plain fields of a §2 entity say so; derived fields give their definition or defining rule. TST-090 regenerates this table and fails on any path that is missing here.

| Root | Path | Type (v5.2) | Defined by |
|---|---|---|---|
| `anchor` | `anchor.confidence` | enum | §2 entity field |
| `anchor` | `anchor.date` | date | §2 entity field |
| `anchor` | `anchor.distance_m` | int m | §2 entity field |
| `anchor` | `anchor.entered_at` | timestamp | §2 entity field |
| `anchor` | `anchor.equiv_10k_s` | int s | §2 entity field |
| `anchor` | `anchor.excluded` | bool | result excluded: hot conditions, illness within result.exclusion_days, or effort not all-out (ADP-061) |
| `anchor` | `anchor.id` | string | §2 entity field |
| `anchor` | `anchor.kind` | enum | §2 entity field |
| `anchor` | `anchor.time_s` | int s | §2 entity field |
| `claim` | `claim.L30_distance_m` | int m | §2 entity field |
| `claim` | `claim.agegrade_pct` | number | §2 entity field |
| `claim` | `claim.confidence` | enum | §2 entity field |
| `claim` | `claim.continuous_30min` | bool | §2 entity field |
| `claim` | `claim.last_run_date` | date | §2 entity field |
| `claim` | `claim.runs_per_week` | int | §2 entity field |
| `claim` | `claim.time_distance_inconsistent` | bool | §2 entity field |
| `claim` | `claim.weekly_distance_m` | int m | §2 entity field |
| `claim` | `claim.weekly_time_s` | int s | §2 entity field |
| `demand` | `demand.L_req_time_s` | int s | §2 entity field / engine value |
| `demand` | `demand.L_target_s` | int s | §2 entity field / engine value |
| `demand` | `demand.V_req_time_s` | int s | §2 entity field / engine value |
| `demand` | `demand.credited` | bool | FEA-025 credit |
| `demand` | `demand.floor_dist_m` | int m | race distance / longest_floor_ratio |
| `demand` | `demand.long_run_met` | bool | peak long-run demand met (INV-25) |
| `demand` | `demand.met_by_current_state` | bool | PHS-011 test |
| `demand` | `demand.met_by_logged_distance` | bool | INV-25 |
| `demand` | `demand.required_levels.HEAT` | int | §2 entity field / engine value |
| `demand` | `demand.runs_req` | int | FEA-031 required runs/week |
| `entry` | `entry.confidence` | enum | §2 entity field |
| `entry` | `entry.date` | date | §2 entity field |
| `entry` | `entry.date_end` | date | §2 entity field |
| `entry` | `entry.distance_m` | int m | §2 entity field |
| `entry` | `entry.duration_s` | int s | §2 entity field |
| `entry` | `entry.entered_at` | timestamp | §2 entity field |
| `entry` | `entry.is_goal_race` | bool | §2 entity field |
| `entry` | `entry.is_measured` | bool | §2 entity field |
| `entry` | `entry.is_race` | bool | §2 entity field |
| `entry` | `entry.l30_weight` | number | §2 entity field |
| `entry` | `entry.ladder` | enum | §2 entity field |
| `entry` | `entry.limping` | bool | §2 entity field |
| `entry` | `entry.pace_s_per_km` | int s/km | §2 entity field |
| `entry` | `entry.pain_0_10` | int | §2 entity field |
| `entry` | `entry.pain_any` | bool | §2 entity field |
| `entry` | `entry.pain_next_morning` | bool | §2 entity field |
| `entry` | `entry.pain_settled_24h` | bool | §2 entity field |
| `entry` | `entry.plausibility` | enum | §2 entity field |
| `entry` | `entry.resolution` | enum | §2 entity field |
| `entry` | `entry.rpe_0_10` | int | §2 entity field |
| `entry` | `entry.source` | enum | §2 entity field |
| `entry` | `entry.type` | enum | §2 entity field |
| `event` | `event.B1` | bool | answer to 10 §1 item B1 (unknown until answered) |
| `event` | `event.B2` | bool | answer to 10 §1 item B2 (unknown until answered) |
| `event` | `event.B3` | bool | answer to 10 §1 item B3 (unknown until answered) |
| `event` | `event.B4` | bool | answer to 10 §1 item B4 (unknown until answered) |
| `event` | `event.B5` | bool | answer to 10 §1 item B5 (unknown until answered) |
| `event` | `event.C1` | bool | answer to 10 §1 item C1 (unknown until answered) |
| `event` | `event.C2` | bool | answer to 10 §1 item C2 (unknown until answered) |
| `event` | `event.C3` | bool | answer to 10 §1 item C3 (unknown until answered) |
| `event` | `event.C4` | bool | answer to 10 §1 item C4 (unknown until answered) |
| `event` | `event.E1` | bool | answer to 10 §1 item E1 (unknown until answered) |
| `event` | `event.H1` | bool | answer to 10 §1 item H1 (unknown until answered) |
| `event` | `event.H2` | bool | answer to 10 §1 item H2 (unknown until answered) |
| `event` | `event.I` | list<bool> | answers I1–I3 |
| `event` | `event.I1` | bool | answer to 10 §1 item I1 (unknown until answered) |
| `event` | `event.I2` | bool | answer to 10 §1 item I2 (unknown until answered) |
| `event` | `event.I3` | bool | answer to 10 §1 item I3 (unknown until answered) |
| `event` | `event.P1` | bool | answer to 10 §1 item P1 (unknown until answered) |
| `event` | `event.P2` | bool | answer to 10 §1 item P2 (unknown until answered) |
| `event` | `event.above_neck_only` | bool | §2 entity field / engine value |
| `event` | `event.absent_periods` | bool | §2 entity field / engine value |
| `event` | `event.amenorrhoea_answer` | bool | §2 entity field / engine value |
| `event` | `event.below_neck` | bool | §2 entity field / engine value |
| `event` | `event.bone_answers` | map<item, bool> | §2 entity field / engine value |
| `event` | `event.bone_stress_answer` | bool | §2 entity field / engine value |
| `event` | `event.bone_stress_flag_raised` | bool | §2 entity field / engine value |
| `event` | `event.chest_pain` | bool | §2 entity field / engine value |
| `event` | `event.claims_raised` | bool | §2 entity field / engine value |
| `event` | `event.collapse` | bool | §2 entity field / engine value |
| `event` | `event.confusion` | bool | §2 entity field / engine value |
| `event` | `event.date` | date | §2 entity field / engine value |
| `event` | `event.disproportionate_breathlessness` | bool | §2 entity field / engine value |
| `event` | `event.distance_changed` | bool | §2 entity field / engine value |
| `event` | `event.faint` | bool | §2 entity field / engine value |
| `event` | `event.fainting` | bool | §2 entity field / engine value |
| `event` | `event.fever` | bool | §2 entity field / engine value |
| `event` | `event.gap_cause` | enum | §2 entity field / engine value |
| `event` | `event.goal_changed` | bool | user-accepted goal change |
| `event` | `event.handover` | string | rule id handing over |
| `event` | `event.health_changed` | bool | §2 entity field / engine value |
| `event` | `event.is_reduction` | bool | event only reduces load |
| `event` | `event.level` | int | §2 entity field / engine value |
| `event` | `event.loss_of_coordination` | bool | §2 entity field / engine value |
| `event` | `event.msg_id` | string | attestation message id |
| `event` | `event.off_cycle_trigger` | bool | §2 entity field / engine value |
| `event` | `event.option_chosen` | string | §2 entity field / engine value |
| `event` | `event.palpitations` | bool | §2 entity field / engine value |
| `event` | `event.red_flag_answer` | bool | §2 entity field / engine value |
| `event` | `event.reds_answers` | list<bool> | §2 entity field / engine value |
| `event` | `event.reds_screen_positive` | bool | §2 entity field / engine value |
| `event` | `event.severe_headache` | bool | §2 entity field / engine value |
| `event` | `event.special_status_changed` | bool | §2 entity field / engine value |
| `event` | `event.symptom_answers` | map<item, bool> | §2 entity field / engine value |
| `event` | `event.t0t2` | bool | a T0–T2 rule fired in this re-plan |
| `event` | `event.type` | enum | event kind (snake_case) |
| `event` | `event.unusual_swelling` | bool | §2 entity field / engine value |
| `event` | `event.very_hot` | bool | §2 entity field / engine value |
| `event` | `event.vomiting` | bool | §2 entity field / engine value |
| `feas` | `feas.B_fast` | number | fast band fraction (03 §3) |
| `feas` | `feas.B_slow` | number | §2 entity field / engine value |
| `feas` | `feas.P_race_s` | int s | predicted race time (03 §3) |
| `feas` | `feas.band_widen` | number | band multiplier |
| `feas` | `feas.claims_confidence` | enum | §2 entity field / engine value |
| `feas` | `feas.degraded_available` | bool | §2 entity field / engine value |
| `feas` | `feas.fast_edge_s` | int s | P_race × (1 − B_fast) |
| `feas` | `feas.fill_capacity_s` | int s | dry-run fill capacity at max runs (FEA-031) |
| `feas` | `feas.horizon` | enum | H0…H5 (04) |
| `feas` | `feas.inputs_used` | list<Input> | inputs read by Demand and weeks_needed with their confidence |
| `feas` | `feas.k_all` | int | same over the other nodes |
| `feas` | `feas.k_key` | int | max over THR, VO2, MSP, ECO of gap_levels × cmp.min_weeks_per_level (FEA-021) |
| `feas` | `feas.p0` | int | weeks of ONBOARD + RTR + start ladder |
| `feas` | `feas.predicted_band` | map | §2 entity field / engine value |
| `feas` | `feas.preset_ok` | bool | preset admissible |
| `feas` | `feas.prev_B_fast` | number | §2 entity field / engine value |
| `feas` | `feas.reasons` | list<enum> | §2 entity field / engine value |
| `feas` | `feas.required_margin_weeks` | int | §2 entity field / engine value |
| `feas` | `feas.s4_phases_do_not_fit` | bool | S4 returned PHASES_DO_NOT_FIT |
| `feas` | `feas.slack` | int | weeks_available − Σ weeks_needed (03 §4) |
| `feas` | `feas.slow_edge_s` | int s | P_race × (1 + B_slow) |
| `feas` | `feas.verdict` | enum | §2 entity field / engine value |
| `feas` | `feas.verdict_rank` | int | feasible 0 < stretch 1 < infeasible 2 |
| `feas` | `feas.weeks_available` | int | §2 entity field / engine value |
| `feas` | `feas.weeks_left` | int | weeks to race at re-plan |
| `feas` | `feas.weeks_needed` | map | §2 entity field / engine value |
| `feas` | `feas.weeks_needed.rtr` | int | §2 entity field / engine value |
| `feas` | `feas.weeks_needed.taper` | int | §2 entity field / engine value |
| `flag` | `flag.clearance_attested_on` | date | §2 entity field |
| `flag` | `flag.raised_on` | date | §2 entity field |
| `flag` | `flag.status` | enum | §2 entity field |
| `flag` | `flag.subkind` | enum | §2 entity field |
| `flags` | `flags.active` | list<RiskFlag> | §2 entity field / engine value |
| `flags` | `flags.cleared` | list<RiskFlag> | §2 entity field / engine value |
| `goal` | `goal.cutoff_h` | number (h) | §2 entity field |
| `goal` | `goal.distance` | enum | §2 entity field |
| `goal` | `goal.distance_km` | number (km) | §2 entity field |
| `goal` | `goal.edits` | list<GoalEditAttempt> | §2 entity field |
| `goal` | `goal.expected_conditions` | enum | §2 entity field |
| `goal` | `goal.expected_duration_s` | int s | §2 entity field |
| `goal` | `goal.family` | enum | §2 entity field |
| `goal` | `goal.goal_type` | enum | §2 entity field |
| `goal` | `goal.interim_target_s` | int s | §2 entity field |
| `goal` | `goal.race_date` | date | §2 entity field |
| `goal` | `goal.race_status` | enum | §2 entity field |
| `goal` | `goal.target_time_s` | int s | §2 entity field |
| `input` | `input.confidence` | enum | §2 entity field |
| `input` | `input.default` | any | §2 entity field |
| `input` | `input.field` | string | §2 entity field |
| `input` | `input.source` | enum | §2 entity field |
| `input` | `input.test_date` | date | §2 entity field |
| `input` | `input.value` | any | §2 entity field |
| `log` | `log.entries_created_today` | list<ActivityRecord> | entries whose entered_at is today |
| `log` | `log.last_e3_sessions` | list<ActivityRecord> | the last result.rpe_high_sessions logged sessions ≥ E3 |
| `log` | `log.last_quality_sessions` | list<ActivityRecord> | §2 entity field / engine value |
| `log` | `log.measured_ok_runs_30d` | list<ActivityRecord> | measured, non-flagged runs in the 30 days before the date |
| `log` | `log.sessions_last_14d` | list<ActivityRecord> | sessions done in the last 14 days |
| `m` | `m.allowed_phases` | list<enum> | §2 entity field |
| `m` | `m.effort_profile` | enum | §2 entity field |
| `m` | `m.eligible` | bool | §2 entity field |
| `m` | `m.prereqs` | list<{node, level}> | §2 entity field |
| `m` | `m.presets` | list<string> | §2 entity field |
| `next_long_run` | `next_long_run.planned_distance_m` | int m | §2 entity field |
| `next_week` | `next_week.is_deload` | bool | §2 entity field / engine value |
| `node` | `node.id` | string | §2 entity field / engine value |
| `option` | `option.plan_valid` | bool | §2 entity field |
| `option` | `option.reasons` | list<enum> | §2 entity field |
| `override` | `override.deload.every` | int | §2 entity field / engine value |
| `override` | `override.quality.per_week` | int | §2 entity field / engine value |
| `plan` | `plan.W` | int | weeks from plan start to race |
| `plan` | `plan.degraded` | bool | §2 entity field / engine value |
| `plan` | `plan.deload_weeks` | list<Week> | deload week list |
| `plan` | `plan.drink_ml_h` | int mL/h | NUT-031 output |
| `plan` | `plan.future_weeks` | list<Week> | weeks after today |
| `plan` | `plan.id` | string | §2 entity field / engine value |
| `plan` | `plan.is_regeneration` | bool | plan version > 1 |
| `plan` | `plan.last_build_week_s` | int s | §2 entity field / engine value |
| `plan` | `plan.loading_weeks` | list<Week> | weeks not deload/taper/transition/RTR/SHARPEN |
| `plan` | `plan.long_runs` | list<Session> | long-run sessions |
| `plan` | `plan.lr_ref_s` | int s | LR of that week |
| `plan` | `plan.over_guard_runs` | list<Session> | runs with expected duration > lr.long_guard_min (INV-29) |
| `plan` | `plan.pace_mode` | enum | paced or effort_only |
| `plan` | `plan.parent_plan_id` | string | §2 entity field / engine value |
| `plan` | `plan.peak_lr_dist_m` | int m | its distance if known |
| `plan` | `plan.peak_lr_s` | int s | longest planned long run |
| `plan` | `plan.phase_sequence` | list<enum> | phase list (04) |
| `plan` | `plan.progression` | virtual target | the plan's growth: weekly time, long run, key-session doses and level unlocks; `freeze plan.progression` = none of them increases (ADP-057, SAF-009; v5.2, v5 wrote the undeclared `progression`) |
| `plan` | `plan.pre_taper_had_e3` | bool | any E3+ session in those weeks |
| `plan` | `plan.pre_taper_runs` | int | mean runs/week in the 3 weeks before taper |
| `plan` | `plan.race_fuel_g_h` | int g/h | NUT-020 output |
| `plan` | `plan.resume_week` | date | ADP-030 |
| `plan` | `plan.s8r_passes` | int | repair passes used (07 S8r) |
| `plan` | `plan.sessions` | list<Session> | §2 entity field / engine value |
| `plan` | `plan.status` | enum | §2 entity field / engine value |
| `plan` | `plan.taper_start` | date | first TAPER date |
| `plan` | `plan.taper_weeks` | list<Week> | TAPER weeks |
| `plan` | `plan.taper_weeks_n` | int | taper length T |
| `plan` | `plan.template_shift_weeks` | int | §2 entity field / engine value |
| `plan` | `plan.v_ref_s` | int s | V of the last non-deload pre-taper week (05 §6) |
| `plan` | `plan.weeks` | list<Week> | §2 entity field / engine value |
| `preset` | `preset.consecutive_hard_allowed` | bool | §2 entity field |
| `preset` | `preset.id` | string | §2 entity field |
| `profile` | `profile.availability` | map | §2 entity field |
| `profile` | `profile.availability_defaults` | map | §2 entity field |
| `profile` | `profile.available_days` | list<weekday> | §2 entity field |
| `profile` | `profile.available_minutes_per_week` | int | §2 entity field |
| `profile` | `profile.b2b_opt_in` | bool | §2 entity field |
| `profile` | `profile.birth_month` | int | §2 entity field |
| `profile` | `profile.birth_year` | int | §2 entity field |
| `profile` | `profile.blocked_dates` | list<date> | §2 entity field |
| `profile` | `profile.due_date` | date | §2 entity field |
| `profile` | `profile.has_given_birth` | bool | §2 entity field |
| `profile` | `profile.injury_last_12m` | bool | §2 entity field |
| `profile` | `profile.long_run_day` | enum | §2 entity field |
| `profile` | `profile.max_runs_per_week` | int | §2 entity field |
| `profile` | `profile.never_run` | bool | §2 entity field |
| `profile` | `profile.night_shift_dates` | list<date> | §2 entity field |
| `profile` | `profile.nutrition_referral_flag` | bool | §2 entity field |
| `profile` | `profile.other_sport_background` | enum | §2 entity field |
| `profile` | `profile.preset_preference` | enum | §2 entity field |
| `profile` | `profile.run_walk_preference` | bool | §2 entity field |
| `profile` | `profile.run_walk_preference_explicit` | bool | §2 entity field |
| `profile` | `profile.saf031_attested_on` | date | §2 entity field |
| `profile` | `profile.saf033_attested_on` | date | §2 entity field |
| `profile` | `profile.special_status` | enum | §2 entity field |
| `profile` | `profile.special_status_start` | date | §2 entity field |
| `profile` | `profile.training_age_years` | number (years) | §2 entity field |
| `rule_ctx` | `rule_ctx.envelope` | list<enum> | §2 entity field / engine value |
| `screen` | `screen.answers` | map | §2 entity field |
| `screen` | `screen.clearance_attested_on` | date | §2 entity field |
| `screen` | `screen.complete` | bool | §2 entity field |
| `screen` | `screen.completed_on` | date | §2 entity field |
| `screen` | `screen.guardian_attested_on` | date | §2 entity field |
| `screen` | `screen.guardian_clearance_on` | date | §2 entity field |
| `screen` | `screen.instrument` | string | §2 entity field |
| `screen` | `screen.items` | list<string> | §2 entity field |
| `screen` | `screen.masters_checked` | bool | §2 entity field |
| `screen` | `screen.saf060_attested_on` | date | §2 entity field |
| `screen` | `screen.valid_until` | date | §2 entity field |
| `session` | `session.adjacent_to_long_run` | bool | date is long-run date ± 1 |
| `session` | `session.clean` | bool | 10 §4 clean-session test |
| `session` | `session.conditions_hot` | bool | runner tag (11) |
| `session` | `session.date` | date | §2 entity field / engine value |
| `session` | `session.date_end` | date | end of the session date |
| `session` | `session.day1_s` | int s | b2b day 1 duration |
| `session` | `session.day2_s` | int s | b2b day 2 duration |
| `session` | `session.effort_target` | enum | §2 entity field / engine value |
| `session` | `session.expected_duration_s` | int s | LOD-017 |
| `session` | `session.hot_forecast` | bool | runner-entered hot forecast (11) |
| `session` | `session.id` | string | §2 entity field / engine value |
| `session` | `session.in_published_window` | bool | §2 Session |
| `session` | `session.is_b2b_pair` | bool | module SES-M-016 |
| `session` | `session.is_goal_race` | bool | is_race and the race is the goal race |
| `session` | `session.is_long_run` | bool | module is a long-run module |
| `session` | `session.is_peak_long_run` | bool | the long run of a loading week (ultra: a peak week per lr.ultra_peak_every_weeks); false for non-peak, deload and taper long runs (LOD-018, v5) |
| `session` | `session.kind` | enum | §2 entity field / engine value |
| `session` | `session.ladder` | enum | §2 entity field / engine value |
| `session` | `session.linked_entry` | ActivityRecord | ActivityRecord linked to the session |
| `session` | `session.linked_entry.duration_s` | int s | §2 entity field / engine value |
| `session` | `session.missing_part` | int s | planned minus done |
| `session` | `session.pace_range` | {fast, slow} s/km | §2 entity field / engine value |
| `session` | `session.pair_s` | int s | day1 + day2 |
| `session` | `session.planned_distance_m` | int m | §2 entity field / engine value |
| `session` | `session.planned_duration_s` | int s | §2 entity field / engine value |
| `session` | `session.status` | enum | §2 entity field / engine value |
| `slot` | `slot.candidates` | list<SessionModule> | §2 entity field |
| `slot` | `slot.date` | date | §2 entity field |
| `slot` | `slot.effort_profile` | enum | §2 entity field |
| `slot` | `slot.module` | string | §2 entity field |
| `state` | `state.L30_eff_dist_m` | int m | §2 entity field / engine value |
| `state` | `state.L30_eff_time_s` | int s | §2 entity field / engine value |
| `state` | `state.L30_source` | enum | §2 entity field / engine value |
| `state` | `state.L_hold_s` | int s | §2 entity field / engine value |
| `state` | `state.V28_at_status_start_s` | int s | V28 weekly mean at SpecialStatus start (SAF-051) |
| `state` | `state.V28_dist_m` | int m | §2 entity field / engine value |
| `state` | `state.V28_time_s` | int s | §2 entity field / engine value |
| `state` | `state.V28_week_s` | int s | V28_time_s / 4 weeks, i.e. weekly mean |
| `state` | `state.V7_prev_time_s` | int s | V7 before the gap (GEN-013) |
| `state` | `state.V_hold_s` | int s | §2 entity field / engine value |
| `state` | `state.active_anchor_id` | string | §2 entity field / engine value |
| `state` | `state.adp022_consecutive_weeks` | int | consecutive weeks in which ADP-022 fired |
| `state` | `state.adp052_consecutive` | int | consecutive sessions on which ADP-052 fired |
| `state` | `state.adp052_events` | list<{date}> | dated ADP-052 firings |
| `state` | `state.adp055_consecutive_weeks` | int | consecutive weeks in which ADP-055 fired |
| `state` | `state.age_high` | int | INP-002 |
| `state` | `state.age_low` | int | INP-002 |
| `state` | `state.anchors` | list<PerformanceAnchor> | PerformanceAnchor list |
| `state` | `state.any_slow_trigger` | bool | any slow trigger of 05 §2 |
| `state` | `state.baseline_confirmed` | bool | LOD-008 (v5.1): false until state.est_confirm_weeks ≥ prog.est.confirm_weeks, then true for the rest of the season |
| `state` | `state.baseline_week_s` | int s | LOD-003/004 baseline |
| `state` | `state.core_inputs` | list<Input> | inputs used by Demand and weeks_needed (03 §2) |
| `state` | `state.ctx001_applies` | bool | CTX-001 fired |
| `state` | `state.current_symptom` | bool | any symptom item answered yes in the last 7 days (10 §1) |
| `state` | `state.days_since_last_run` | int | §2 entity field / engine value |
| `state` | `state.deload_every_ctx_set` | bool | true if any of CTX-001…004 fired |
| `state` | `state.deload_lr_baseline_s` | int s | LR baseline for a deload (ultra: last peak; else last non-deload week, 05 §4) |
| `state` | `state.denominator_entries` | list<ActivityRecord> | entries used in L30_eff, V28 and level attainment |
| `state` | `state.est_confirm_weeks` | int | LOD-008 (v5.1): consecutive most recent completed weeks with log_state = logged whose logged time from measured entries is ≥ prog.est.confirm_ratio × the planned time (weeks before the first plan count when logged); an unlogged week (ADP-003) restarts the count |
| `state` | `state.effort_ceiling` | enum | lowest ceiling set by SES-002, SAF-008, ADP-043, ADP-052, SAF-051 (default E4) |
| `state` | `state.fatigue_hold_active` | bool | §2 entity field / engine value |
| `state` | `state.fatigue_signals` | list<date> | dated fatigue signals (08 §7) |
| `state` | `state.fatigue_weeks_consecutive` | int | consecutive weeks with ≥ fatigue.signals_required signals |
| `state` | `state.fit_check_weeks` | list<Week> | the last miss.fit_check_weeks completed weeks (ADP-024) |
| `state` | `state.gap_weeks` | int | length of the gap in weeks (ADP-033) |
| `state` | `state.gate` | enum | GateOutcome of S1 (07): most restrictive outcome of SCR/SAF gates |
| `state` | `state.hab_continuous` | bool | HAB ≥ L2 (30 min continuous) |
| `state` | `state.ladder_floor_rung` | int | entry rung floor (R0/R1) (SAF-083) |
| `state` | `state.ladder_kind` | enum | none, rtr or start |
| `state` | `state.ladder_rung_index` | int | current rung index (S1…S9 → 1…9; R0…R5 → 0…5) |
| `state` | `state.ladder_runs_per_week` | int | ladder runs per week planned |
| `state` | `state.ladder_start` | date | date the ladder started |
| `state` | `state.last3_ladder_clean` | bool | the last 3 ladder sessions are clean (FEA-043b) |
| `state` | `state.last_completed_week_logged_s` | int s | logged time of the most recent completed week |
| `state` | `state.last_completed_week_planned_s` | int s | planned time of that week |
| `state` | `state.last_exercised` | map<node, date> | §2 entity field / engine value |
| `state` | `state.last_field_test_date` | date | §2 entity field / engine value |
| `state` | `state.last_goal_race_date` | date | date of the last goal race run (logged or planned), across goal changes (INV-31) |
| `state` | `state.last_goal_race_distance` | enum | its distance |
| `state` | `state.last_non_deload_week_end` | date | end date of the last non-deload week |
| `state` | `state.last_reds_screen` | date | date of the last REDsScreenRecord |
| `state` | `state.last_rung_logged_s` | int s | logged time of the last ladder rung (LOD-070) |
| `state` | `state.last_verdict` | enum | verdict of the previous feasibility run |
| `state` | `state.level_confidence` | map<node, enum> | §2 entity field / engine value |
| `state` | `state.level_rests_on_self_report` | map<node, bool> | §2 entity field / engine value |
| `state` | `state.levels` | map<node, int> | CompetenceState level per node (02) |
| `state` | `state.levels.DUR` | int | §2 entity field / engine value |
| `state` | `state.levels.HAB` | int | §2 entity field / engine value |
| `state` | `state.levels.THR` | int | §2 entity field / engine value |
| `state` | `state.levels.TOL` | int | §2 entity field / engine value |
| `state` | `state.levels.VO2` | int | §2 entity field / engine value |
| `state` | `state.log_status` | enum | §2 entity field / engine value |
| `state` | `state.logged_l30_dist_m` | int m | longest measured, non-flagged logged run in 30 days |
| `state` | `state.longest_ladder_session_s` | int s | longest logged ladder session incl. warm-up walk (FEA-043b) |
| `state` | `state.max_prev4_week_s` | int s | max logged weekly time of the previous 4 weeks (GEN-020) |
| `state` | `state.max_tolerated_g_h` | int g/h | highest logged carb intake with gi_score ≤ fuel.gi_pass_max (INV-18) |
| `state` | `state.on_start_ladder` | bool | Session.ladder == start for the current week |
| `state` | `state.pace_anchor_10k_equiv_s` | int s | §2 DerivedState |
| `state` | `state.pending_anchor_10k_s` | int s | ADP-067 (v5.1): 10K-equivalent of the pending measured result (inside the confirmation band), absent or null when none |
| `state` | `state.pending_anchor_date` | date | ADP-067 (v5.1): date of that result |
| `state` | `state.pending_confirms` | bool | ADP-067 (v5.1): has(state.pending_anchor_10k_s) && days_between(state.pending_anchor_date, anchor.date) ≤ result.confirm_window_days && the pending and the new result lie on the same side of state.pace_anchor_10k_equiv_s; evaluated once when the result event arrives |
| `state` | `state.perf_level` | enum | §2 entity field / engine value |
| `state` | `state.pre_entry_L30_eff_dist_m` | int m | L30_eff before the entry (GEN-023) |
| `state` | `state.pre_race_L30_eff_time_s` | int s | L30_eff before the race entry (LOD-012) |
| `state` | `state.prev_anchor_10k_s` | int s | 10K-equivalent of the previous measured anchor, else of the claimed band edge (INP-025) |
| `state` | `state.prior_tol_tier` | int | §2 DerivedState |
| `state` | `state.probation_until` | date | §2 entity field / engine value |
| `state` | `state.professional_contact_attested_on` | date | ADP-057 attestation date |
| `state` | `state.progression_profile` | enum | §2 entity field / engine value |
| `state` | `state.reds_flag_active` | bool | exists(flags.active, f, f.subkind == 'reds_screen') |
| `state` | `state.rest_days_before_next` | int | rest days required before the next ladder session |
| `state` | `state.rich_weeks_consecutive` | int | consecutive weeks with log_status rich (GEN-014) |
| `state` | `state.rtr_entry_reason` | enum | why RTR was entered (gap, postpartum, pregnancy_stop, bone_stress, illness) |
| `state` | `state.rung_advanced_by_backfill_last7d` | int | rungs advanced using backfilled sessions in the last 7 days |
| `state` | `state.rung_counted_sessions` | list<ActivityRecord> | sessions counted toward the current rung under SAF-082 constraints |
| `state` | `state.rungs_to_last` | int | rungs from the entry rung to the last rung |
| `state` | `state.runner_tags` | list<enum> | {minor, masters, female, ultra_goal, novice} that apply (CTX-008) |
| `state` | `state.s_slow` | number m/s | 03 §2 S_slow (demand conversion only, FEA-002) |
| `state` | `state.saf061_shown_this_season` | bool | MSG-SAF-061 already shown this season |
| `state` | `state.scr_disease_inactive` | bool | exists(screen.items, q, screen.answers[q] == true && screen.item_factor[q] == 'known_disease') && claim.runs_per_week < p('screen.active_runs_min') (SCR-006) |
| `state` | `state.scr_symptom` | bool | exists(screen.items, q, screen.answers[q] == true && screen.item_factor[q] == 'symptom') || screen.followup_directs_evaluation (SCR-004) |
| `state` | `state.sweat_rate_ml_h` | int mL/h | SweatTest.rate_ml_h if present |
| `state` | `state.symptom_free_days_attested` | int | days the runner attests symptom-free (ADP-042) |
| `state` | `state.tol2_band_high_s` | int s | upper weekly-time bound of TOL L2 (02 §2) (GEN-022) |
| `state` | `state.tol_confidence` | enum | confidence of the TOL level (02 §2) |
| `state` | `state.tol_level` | int | = state.levels.TOL |
| `state` | `state.tol_rests_on_estimated` | bool | the TOL level rests only on estimated data (INP-030) |
| `state` | `state.tol_tier` | int | INP-030 |
| `state` | `state.unclean_weeks_on_rung` | int | weeks on this rung that contain an unclean session (SAF-084) |
| `state` | `state.weeks_without_fatigue_signal` | int | §2 entity field / engine value |
| `tied` | `tied.module_ids` | list<string> | §2 entity field |
| `unit` | `unit.h_s` | int | §2 entity field / engine value |
| `unit` | `unit.km_m` | int | §2 entity field / engine value |
| `unit` | `unit.min_s` | int | §2 entity field / engine value |
| `unit` | `unit.pct` | int | §2 entity field / engine value |
| `unit` | `unit.week_d` | int | §2 entity field / engine value |
| `week` | `week.all_easy_at_cap` | bool | every easy day at its day cap (LOD-016) |
| `week` | `week.completed_time_s` | int s | time of done/partial sessions |
| `week` | `week.e3_touches` | int | §2 entity field / engine value |
| `week` | `week.eco_sessions_min` | int | CTX-004 strength floor |
| `week` | `week.est_base_s` | int s | LOD-007 (v5.1): the highest logged weekly time over the prog.est.window_weeks weeks before w; weeks not yet run count their planned time provisionally and are replaced by logged time at every re-plan (as LOD-011); while no week is logged, V_hold from claims |
| `week` | `week.ended` | bool | today > last day of week |
| `week` | `week.entries` | list<ActivityRecord> | ActivityRecords dated in the week |
| `week` | `week.free_days` | list<weekday> | available, unblocked days not yet used |
| `week` | `week.has_illness_pain_availability_report` | bool | any such report dated in the week |
| `week` | `week.id` | string | §2 entity field / engine value |
| `week` | `week.is_deload` | bool | §2 entity field / engine value |
| `week` | `week.is_first_full_week_back` | bool | first full week after a gap |
| `week` | `week.is_first_pair` | bool | first back-to-back pair of the plan |
| `week` | `week.is_race_week` | bool | §2 entity field / engine value |
| `week` | `week.is_step_up` | bool | planned volume or long run above the previous loading week |
| `week` | `week.kind` | enum | normal or maintenance (ADP-071) |
| `week` | `week.l30_eff_s` | int s | LOD-011 output |
| `week` | `week.later_easy` | list<Session> | easy sessions later in the same week |
| `week` | `week.loading_weeks_since_recovery` | int | loading weeks since the last recovery-like week (PHS-006) |
| `week` | `week.log_state` | enum | §2 entity field / engine value |
| `week` | `week.logged_time_s` | int s | same, used by LOD-070 |
| `week` | `week.logged_total_s` | int s | sum of logged durations |
| `week` | `week.long_run` | Session | the long-run Session |
| `week` | `week.long_run_date` | date | its date |
| `week` | `week.long_run_status` | enum | status of the week's long run |
| `week` | `week.lr_cap_s` | int s | LOD-020 output |
| `week` | `week.lr_s` | int s | planned long-run duration |
| `week` | `week.original_time_s` | int s | planned time before the busy mark (ADP-071) |
| `week` | `week.phase` | enum | §2 entity field / engine value |
| `week` | `week.planned_time_s` | int s | = Week.planned_time_s (§2) |
| `week` | `week.prev_lr_s` | int s | §2 entity field / engine value |
| `week` | `week.prev_planned_time_s` | int s | §2 entity field / engine value |
| `week` | `week.quality_max` | int | §2 entity field / engine value |
| `week` | `week.runs` | int | number of running sessions |
| `week` | `week.sessions` | list<Session> | §2 entity field / engine value |
| `week` | `week.start` | date | first date |
| `week` | `week.strides_allowed` | bool | §2 entity field / engine value |
| `week` | `week.taper_k` | int | index k of the taper week |
| `week` | `week.template_lr_s` | int s | §2 entity field / engine value |
| `week` | `week.unmoved_position_respects_gap` | bool | PHS-006 test |
| `week` | `week.v_two_loading_weeks_before_s` | int s | planned time two loading weeks before (LOD-003) |
| `week` | `week.weeks_to_phase_boundary` | int | full weeks left in the week's phase after this week (0 = last week of the phase); PHS-004 moves a deload when ≤ 1 (post-audit, 13 R-03) |
| `demand` | `demand.required_levels.FUEL` | int | required FUEL level after CMP-008 (v5.2) |
| `demand` | `demand.required_tests` | list<{name, node, level, hard_time_s}> | the level tests (06 §3b) of the required levels not yet held (FEA-026, v5.2) |
| `entry` | `entry.gi_score_0_10` | int | §2 entity field (blank → unknown) |
| `entry` | `entry.is_practice` | bool | the linked planned session is a fuelling-practice run (NUT-010) (v5.2) |
| `entry` | `entry.is_test` | bool | the linked planned session is a level test (06 §3b) (v5.2) |
| `entry` | `entry.pain_next_morning_yes` | bool | the next-morning prompt was answered "yes"; false when answered "no" or unanswered (12 §3.9, v5.2) |
| `entry` | `entry.pain_over_limit` | bool | has(entry.pain_0_10) && entry.pain_0_10 > p('pain.during_max') (v5.2) |
| `entry` | `entry.target_rpe` | int | target_rpe(effort) of the linked planned session (06 §2c) (v5.2) |
| `entry` | `entry.test_completed` | bool | level-test question 1 (§2 ActivityRecord, v5.2); blank → unknown |
| `entry` | `entry.test_held_effort` | bool | level-test question 2 (v5.2); blank → unknown |
| `entry` | `entry.test_level` | int | level of the linked level test (v5.2) |
| `entry` | `entry.test_node` | enum | node of the linked level test (v5.2) |
| `entry` | `entry.test_result` | enum | passed, failed or unlogged: SES-024 (v5.2) |
| `event` | `event.same_day_events` | list<AdaptationEvent> | the events of the batch dated the same day (ADP-012, v5.2; v5 read the undeclared `today_events`) |
| `feas` | `feas.v_peak_s` | int s | V_peak of the dry run (05 §5) (v5.2) |
| `goal` | `goal.family_tid` | enum | key of tid.hard_share_max: 'HM' for the half marathon (owner Q10), else goal.family (v5.2) |
| `log` | `log.last_practice_runs` | list<ActivityRecord> | the last fuel.exit_runs measured practice runs dated within cmp.decay_weeks (NUT-013, v5.2) |
| `log` | `log.practice_runs_at_step` | list<ActivityRecord> | the last fuel.step_runs measured practice runs since the current step was set, taper weeks excluded (NUT-011, v5.2) |
| `log` | `log.runwalk_sessions_at_rung` | list<ActivityRecord> | run-walk entries at the current run-walk rung since the rung started or since the last missed run-walk session, newest first, at most ses.runwalk.sessions_per_rung (SES-010, v5.2) |
| `m` | `m.id` | string | §2 entity field |
| `plan` | `plan.last_key_module` | string | module of the most recently logged key session, any phase (SES-018, v5.2); null when none |
| `plan` | `plan.next_hard_session` | Session | the next planned session with a segment at E3 or E4 (ADP-055, v5.2; v5 read the undeclared `next_session_E3`) |
| `plan` | `plan.s8r_exhausted` | bool | validation still fails after repair.max_passes repair passes (07 §2c, GEN-003, v5.2) |
| `plan` | `plan.taper_touch_form` | enum | 'E4' when the last pre-taper key session was a VO2 module (SES-M-010), else 'E3' (SES-015, v5.2) |
| `profile` | `profile.level_tests_opt_out` | bool | the runner turned level tests off (§2 RunnerProfile, v5.2; default false) |
| `profile` | `profile.hill_access` | bool | §2 entity field |
| `session` | `session.credit_ready` | bool | the module's last ses.exit_ready_sessions logged non-deload instances each reached the full work of the next level's test (or the module maximum when the test is bigger), felt as intended, with pain ≤ pain.during_max and no next-morning pain (SES-025, v5.2) |
| `session` | `session.dose_step` | int | index into ses.dose.<module>.steps (06 §2c, v5.2) |
| `session` | `session.exit_ready` | bool | the module's last ses.exit_ready_sessions logged non-deload instances felt as intended at a work ≥ min(next level's test work, module max), and no failed or unlogged test of that level is waiting for its retest date (SES-012, v5.2) |
| `session` | `session.is_hard` | bool | a segment at E3 or E4 (strides E5 excluded), or the long run (SES-004, owner Q2, v5.2) |
| `session` | `session.is_key` | bool | the session fills a key slot (07 §2b, v5.2) |
| `session` | `session.is_test` | bool | the session is a level test (06 §3b, v5.2) |
| `session` | `session.module_id` | string | §2 entity field |
| `session` | `session.next_day_is_hard` | bool | the session dated the next day is hard (also across the week boundary); false when none (SES-004, INV-17, v5.2) |
| `session` | `session.next_test_level` | int | the next level of the node this module trains (06 §3b) |
| `session` | `session.next_test_module` | string | the module of that level test (ses.exit_test) |
| `session` | `session.next_test_node` | enum | the node this module trains toward its next level |
| `session` | `session.prev_instance_ok` | bool | the module's last logged non-deload, non-test instance was done (≥ miss.partial_ratio) with an answered RPE ≤ min(target_rpe + ses.progress_rpe_margin, result.rpe_high − 1); false when the RPE is missing or there is none; for the second and later future instances false (projection, 07 §2b) (SES-011, v5.2) |
| `session` | `session.prev_step` | int | dose step of that instance; null when the module was never logged (v5.2) |
| `session` | `session.test_declined` | bool | the runner skipped this level test from its card (event `test_declined`, v5.2) |
| `session` | `session.test_result` | enum | test_result of the linked entry; 'unlogged' when the test date + log.contemporaneous_window_h has passed with no entry (v5.2) |
| `slot` | `slot.node_candidates` | list<CompetenceNode> | candidate nodes of a key slot (DST-002, CMP-007, v5.2) |
| `state` | `state.fuel_step_g_h` | int | current fuelling step, EngineState (NUT-010…012, v5.2); null before the first practice run (then fuel.start_g_h) |
| `state` | `state.last_week_key_count` | int | key sessions of the last completed non-deload week (SES-007 SHARPEN, v5.2) |
| `state` | `state.level_confidence.FUEL` | enum | as state.level_confidence |
| `state` | `state.levels.FUEL` | int | as state.levels |
| `state` | `state.module_dose` | map<module, int> | last logged dose step per module, EngineState (SES-011/013, v5.2) |
| `state` | `state.runwalk_rung` | int | index into ses.runwalk.ladder, EngineState; null → ses.runwalk.entry_rung (SES-010, v5.2) |
| `violation` | `violation.inv_id` | string | the invariant id of the validator violation being repaired (07 §2c, v5.2) |
| `violation` | `violation.session.is_key` | bool | session field of the violating session |
| `violation` | `violation.unfixed` | bool | no lower-ranked REP record changed anything for this violation in this pass (v5.2) |
| `violation` | `violation.week.is_step_up` | bool | week field of the violating week |
| `week` | `week.e2_time_s` | int s | E2 segment time of the week (LOD-033, v5.2) |
| `week` | `week.easy_runs` | int | easy runs of the week (SES-021, v5.2) |
| `week` | `week.easy_time_s` | int s | E0–E1 segment time incl. warm-ups, cool-downs, recoveries and strides (05 §5, v5.2) |
| `week` | `week.fuel_practice_allowed` | bool | the week is in late BASE (04 §1) or a later phase before the race week (NUT-010, v5.2) |
| `week` | `week.hard_time_s` | int s | E3 + E4 segment time of the week (LOD-033, v5.2) |
| `week` | `week.heat_runs_before` | int | SES-M-022 sessions planned or logged earlier in the heat window (NUT-040, v5.2) |
| `week` | `week.in_heat_window` | bool | the week overlaps the heat.acclim_window_days before the race (NUT-040, v5.2) |
| `week` | `week.is_msp_week` | bool | SPECIFIC loading week whose loading_index_in_phase is a multiple of dst.msp_every_weeks (0, 2, 4 …; DST-018, v5.2) |
| `week` | `week.is_race_long_run_week` | bool | the week's long run is the dst.race_long_every_weeks-th, 2×-th … non-deload long run of SPECIFIC (DST-006, v5.2) |
| `week` | `week.key_dose_mode` | enum | 'progress' (default), 'start' (deload, SES-016), 'last' (maintenance, SES-018) (v5.2), 'entry' (calibration: entry rung, no step-up, EXP-003, v5.3) |
| `week` | `week.key_slots` | list<Slot> | the week's key slots in rank order after S7.3 (07 §2b, v5.2) |
| `week` | `week.last_key_slot` | Slot | the last-ranked key slot (DST-018, v5.2) |
| `week` | `week.loading_index_in_phase` | int | non-deload weeks of the same phase before this one (CMP-007 rotation, v5.2) |
| `week` | `week.long_run.fuel_target_g_h` | int | fuelling target of the week's long run (NUT-010, v5.2) |
| `week` | `week.long_run.race_segment_s` | int s | race-effort final segment of the week's long run (DST-006, v5.2) |
| `week` | `week.method_default_count` | int | SES-007 count (v5.2) |
| `week` | `week.msp_share_next` | number | dst.msp_share[distance][min(MSP level + 1, required MSP level)] (DST-006, v5.2) |
| `week` | `week.phase_row` | enum | row of dst.phase_nodes for the week's phase: SHARPEN → SPECIFIC, MAINTAIN → BUILD, else the phase (DST-002, v5.2) |
| `week` | `week.strength_days_free` | int | days of the week where SES-020 may place strength (easy or key days, not the day before the long run) (v5.2) |
| `week` | `week.test_allowed` | bool | not a deload, TAPER, RACE or TRANSITION week, and no other test (SES-014 field test or level test) in the week (SES-012, v5.2) |
| `week` | `week.weeks_in_phase` | int | weeks of the current phase up to and including this one (PHS-014, v5.2) |
| `anchor` | `anchor.effort_all_out` | bool | §2 entity field (the runner says the race was run all-out) |
| `anchor` | `anchor.official_result_confirmed` | bool | v5.3 (EXP-001, INP-005): answer to "Was this an official race result, run all-out?"; null = not asked |
| `plan` | `plan.plan_start` | date | §2 entity field (Monday of plan week 1) |
| `profile` | `profile.injury_last_12w` | bool | v5.3: asked when injury_last_12m = true; the injury was in the last exp.injury_free_weeks (EXP-001) |
| `profile` | `profile.hard_sessions_max` | int | v5.3 (owner decision 4): the runner's ceiling of key sessions a week, 1–3; null → exp.hard_sessions_max_default (SES-006) |
| `profile` | `profile.prescription_preference` | enum | v5.3 (SES-031): distance, time or both; null → ses.prescription_default |
| `session` | `session.has_repeats` | bool | the session (not a long run, not the goal race) holds at least one work segment at E3 or E4, repeated or continuous (SES-031, v5.3) |
| `session` | `session.prescription_form` | enum | time, distance or both: how the card writes the repeats (SES-031, v5.3) |
| `session` | `session.show_distances` | list<int m> | the distance written for each segment and recovery in the distance form, or null where the time form is kept (SES-032, v5.3) |
| `session` | `session.is_projected` | bool | the session lies in a week after the current one (07 §2b projection, SES-028, v5.3) |
| `session` | `session.confirmed_step` | int | the module's last logged dose step, or its entry rung (SES-027) when none is logged (SES-028, v5.3) |
| `state` | `state.exp_path` | enum | none, calibrating, confirmed, fallen_back: the experienced-runner path (02 §2b, EXP-001…005; EngineState.experienced.path, v5.3) |
| `state` | `state.exp_race` | PerformanceAnchor | the qualifying race of 02 §2b: the most recent anchor of kind race within exp.distance_tol_pct of 5K, 10K, HM or M; null if none (v5.3) |
| `state` | `state.exp_race.date` | date | as anchor.date |
| `state` | `state.exp_race.effort_all_out` | bool | as anchor.effort_all_out |
| `state` | `state.exp_race.official_result_confirmed` | bool | as anchor.official_result_confirmed |
| `state` | `state.exp_claims_consistent` | bool | the claims lie in the row of the 02 §2b table for the race's age-grade band (weekly time within exp.volume_band_min_min … exp.volume_band_max_min), claimed runs/week ≥ exp.runs_min, and GEN-022 found no inconsistency (EXP-001, v5.3) |
| `state` | `state.exp_calibration_until` | date | last day of plan week exp.calibration_weeks of the experienced path (EXP-001; EngineState.experienced.calibration_until, v5.3) |
| `state` | `state.exp_fallback_nodes` | list<enum> | nodes moved back to the cautious path by EXP-004 (too-hard key sessions) (v5.3) |
| `state` | `state.exp_rpe_high_keys` | int | calibration key sessions logged with RPE > min(target RPE + ses.progress_rpe_margin, result.rpe_high − 1) (EXP-004, v5.3) |
| `state` | `state.exp_rpe_high_nodes` | list<enum> | the nodes trained by those sessions (THR for SES-M-008, VO2 for SES-M-010) when there are at least exp.fallback_rpe_sessions of them (EXP-004, v5.3) |
| `state` | `state.exp_missed_week` | bool | a completed calibration week holds no logged run (EXP-004, v5.3) |
| `state` | `state.exp_volume_ratio_min` | number | lowest logged ÷ planned time over the completed calibration weeks; null before the first one is complete (EXP-004, v5.3) |
| `state` | `state.exp_calibration_complete` | bool | every calibration week is complete and logged, with no EXP-004 condition (EXP-005, v5.3) |
| `state` | `state.level_confidence.HAB` | enum | as state.level_confidence |
| `state` | `state.level_confidence.AER` | enum | as state.level_confidence |
| `state` | `state.level_confidence.TOL` | enum | as state.level_confidence |
| `week` | `week.is_calibration` | bool | the week starts on or before state.exp_calibration_until while state.exp_path = calibrating, and its phase is BASE, BUILD or SPECIFIC (EXP-003, v5.3) |
| `week` | `week.long_run_form` | enum | a (all-easy long run, three workouts) or b (two workouts and a long run with quality) (SES-026, v5.3) |
| `week` | `week.exp_pattern_index` | int | week.loading_index_in_phase modulo the length of the exp.long_quality_pattern row (SES-026, v5.3; the grammar has no modulo operator) |
| `week` | `week.exp_pattern_row` | enum | row of exp.long_quality_pattern: BUILD, SPECIFIC_time (time goal) or SPECIFIC_finish (SES-026, v5.3) |

### 2b.2b Element fields of list paths (v5.2, Q12)

A comprehension variable (`s`, `x`, `w`, `lr`, `e`, `f`, `o`, `q` …) bound over a list path reads the fields of the list's element type. The element types and their fields are those of `spec/schema` (Session, Week: `result.schema.json`; ActivityRecord, RiskFlag, PerformanceAnchor, GoalEditAttempt, AdaptationEvent: `input-profile.schema.json`), plus these derived element fields:

| Element | Derived field | Type | Definition |
|---|---|---|---|
| Session | `is_run`, `is_hard`, `is_key`, `is_test`, `run_walk`, `hr_zone`, `hr_source`, `week_id`, `module_id` | as schema | schema fields (`is_hard`: SES-004 definition above) |
| Session | `next_day_is_hard` | bool | as `session.next_day_is_hard` |
| Session | `has_strides` | bool | the session carries a strides segment (SES-021) |
| Session | `day_before_key`, `day_before_long_run` | bool | the next day holds a key session / the long run |
| Session | `hard_time_s`, `e2_time_s` | int s | E3+E4 and E2 segment time of the session |
| Session | `repeats_family_module`, `family_alternative_exists` | bool | v5.3 (SES-030): the key session uses the same family module as the most recent earlier slot of its family / another member of that family was eligible for this slot |
| Week | `has_e3_touch` | bool | schema field (INV-08) |
| Week | `completed_time_s` | int s | time of the week's done or partial sessions (ADP-024) |
| PerformanceAnchor | `confidence` | enum | derived by INP-005 |
| ActivityRecord | `plausibility`, `confidence` | enum | derived by GEN-020/INP-020 |
| ActivityRecord | `rpe_expected` | int | the expected RPE of the linked session's effort (`rpe.expected_by_effort`, ADP-063) |
| ActivityRecord | `clean_runwalk` | bool | done ≥ miss.partial_ratio, RPE ≤ ses.runwalk.rpe_max, pain ≤ pain.during_max, next-morning prompt not "yes" (SES-010) |
| ActivityRecord | `has_race_effort` | bool | the linked session held a segment at race effort E2 or harder (NUT-013 L3) |
| ActivityRecord | `clean`, `one_per_day`, `rest_spacing_ok`, `week_counted` | bool / int | SAF-082 ladder counting (10 §4b) |
| AdaptationEvent | `tier` | enum | the tier of the rules its kind triggers first: red_flag T0; illness, pain T1; gap T2; availability, life T3; goal T4; others T5 (ADP-012) |
| `p('dst.phase_nodes')[family][row]` | `node`, `max_level` | enum, int | one candidate node and its level ceiling (DST-002) |
| `demand.required_tests` | `name`, `node`, `level`, `hard_time_s` | text, enum, int, int s | one required level test (FEA-026) |

`check_rules_v5.py` (v5.2) resolves every `<var>.<field>` read inside a comprehension against this table and the schema; an unknown field fails TST-121.

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
| `first(list, x, pred)` | first element (date order) satisfying pred; `null` if none (v5.2, §3.9; v5 said unknown) |
| `last(list)` | last element in date order |
| `sort_by(list, x, keys)` | stable sort by the key list |
| `pairs(list)` | all (a, b) with a.date < b.date; used as `all(pairs(L), a, b, pred)` |
| `age_low(d)`, `age_high(d)` | INP-002: age on d assuming the birthday is the last / first day of the birth month |
| `effort_rank(e)` | index of e in ['E0', 'E1', 'E2', 'E3', 'E4']; **v5.2: `effort_rank('E5')` = `effort_rank('E3')`** (strides are vigorous for gates and ceilings, so a restricted gate excludes them), but a hard day is defined by E3/E4 segments only (`session.is_hard`) and strides count as their run's E1 time in TID (05 §5); efforts are **never** compared as strings |
| `verdict_rank(v)` | feasible 0, stretch 1, infeasible 2 |
| `reason_class(code)` | 'infeasible' / 'stretch' / 'info' from the reason table of 03 §5 |
| `reason_group(code)` | 'availability' for AVAILABILITY_*, else the code's group in 03 §5 |
| `tier_rank(t)`, `kind_rank(k)` | ADP-012 orders: T0 < … < T6; red_flag < illness < pain < gap < fatigue < missed < partial < unlogged_week < availability < life < result < goal |
| `gap_band(days)` | '8_14' if gap.reduce_trigger_days ≤ days < 15, '15_29' if 15 ≤ days < gap.rtr_trigger_days (parameter suffixes of `gap.vol_factor`) |
| `rtr_entry_rung(tier, days)` | lookup in the 10 §4 entry table (most cautious matching row, SAF-080) |
| `same_pair(a, b)` | a and b belong to the same back-to-back pair |
| `adjacent(lr)` | the sessions dated lr.date − 1 and lr.date + 1 |
| `next_day(s)` | the session on s.date + 1, or `null` (v5.2: rules use the derived `s.next_day_is_hard`) |
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
| `fuel_band_low(dur)` | lower edge of fuel.band.by_duration for that duration (v5.2, NUT-021) |
| `fuel_level_low(n)` | lower edge of `fuel.level_band[n]` (v5.2, NUT-013) |
| `fuel_step_ceiling(goal, demand)` | min(fuel_band_high(goal.expected_duration_s), p('fuel.max_default_g_h'), upper edge of `fuel.level_band[demand.required_levels.FUEL]`) (v5.2, NUT-011) |
| `target_rpe(e)` | `p('ses.target_rpe')[e]` (v5.2, SES-011) |
| `dose_start(mid)`, `dose_max(mid)` | v5.3: the entry rung and the top rung of `ses.entry_rung.<mid>` / `ses.top_rung.<mid>` at the runner's level of the module's rung node (SES-027; modules without such a row: 0 and the last index of `ses.dose.<mid>.steps`, as in v5.2) |
| `next_dose(mid, step)` | min(step + 1, dose_max(mid)) (v5.2; v5.3: dose_max is level-dependent) |
| `dose_fit(mid, step, week)` | the largest step ≤ `step` whose work fits the week's remaining E3+E4 budget (`tid.hard_share_max` × V(w) minus the work of the slots ranked before it) and E2 budget; `null` when even `dose_start` does not fit (the slot is then dropped, SES-006) (v5.2) |
| `dose_work_s(mid, step)` | work time of a step (repeats × rep length, or the E2/E3 share of a progression run) (v5.2) |
| `highest_tol_level(v28_s, l30_s)` | highest TOL level whose 02 §2 weekly-time and long-run thresholds both hold (INP-030) |
| `threshold_level(node_id)` | highest level n of the node whose 02 §2 state threshold holds on DerivedState (CMP-001) |
| `level_prereqs_hold(node_id, n, d)` | every prerequisite edge of node level n (02 §3) holds on date d (CMP-002) |
| `round_up(x, step)` | smallest multiple of `step` ≥ x |
| `ceil_div(a, b)` | ⌈a / b⌉ |
| `exp_level(node_id)` | v5.3 (EXP-002): THR and VO2 from `exp.level_table` by the age-grade band of state.exp_race; MSP from the same table when the race's distance family equals the goal's family, else 0; HAB, TOL, AER and DUR = the 02 §2 threshold level computed on the claims (as INP-030), capped at `exp.claim_level_cap`; any other node 0 |
| `age_grade_pct(anchor, sex)` | v5.3 (02 §2b): 100 × `perf.wma_open_s`[sex][distance] / `perf.wma_age_factor`(sex, age_low(anchor.date)) / anchor.time_s, the factor interpolated linearly between the listed ages; sex unknown → the lower of the two sexes' values |
| `anchor_l30_ok(state, goal)` | FEA-023: measured L30_eff_dist ≥ race / longest_ratio_max, or L30_eff_time ≥ L_req_time |

### 2b.4 Procedures (named algorithms; a record that calls one is `procedure`, not `formal`)

| Procedure | Specified in | Why it is not an expression |
|---|---|---|
| `compute_demand(goal, preset, s_slow)` | 03 §2 | multi-step table lookups and conversions |
| `predict_band(distance, anchor, state)` | 03 §3 | model choice, Riegel/extrapolation limits, widening |
| `pace_range(anchor, effort)` | 03 §3b | pace model with rounding and deadband |
| `dry_run_weeks_needed(goal, preset, state)` | 03 §4 | runs the 05 curve builder and the week fill. **v5.2 algorithm:** start from the closed-form G; derive base and allocate phases (04 §3); place deloads (PHS-001…006); run the 05 curve (and the week fill, FEA-020) and take G' = the first week whose LR and V reach their targets within the rounding tolerance; repeat with G' while it changes, at most 3 times; return the larger value if it has not settled |
| `water_fill(week, min_run_s)` | 05 LOD-031 | iterative fill. **v5.2 algorithm:** the remaining time V(w) − LR − key sessions is shared by the easy days; each day i has a cap c_i = min(LR(w), round_down(spike.warn_ratio × l30_time(date)), the LOD-013 cap if it is next to the long run); find the largest level h with Σ min(c_i, h) ≤ the remaining time; set each day to min(c_i, h) rounded down to `load.round_down_s`; give the leftover in steps of `load.round_down_s` to the earliest days still below their cap; a day below `min_run_s` becomes rest and the fill restarts without it; time that fits nowhere is dropped (LOD-016 may first raise the long run) |
| `preset_cap(long_run)` | 05 LOD-020 | MIN over the preset's %, time and absolute caps per family |
| `t0t3_limit(week)` | 07 S5 | MIN over every T0–T3 cap that applies to the week. **v5.2:** the value of the T0–T3 term of the 12 §3.6 composition for that target and binding in the current pass (+∞ when no T0–T3 cap wrote it) |
| `decay(levels, gap_weeks, decay_weeks)` | 02 CMP-003 | per-node decay table. **v5.2:** for every node except TOL, AER and HAB (recomputed from the log), level − ⌊gap_weeks / decay_weeks⌋, floor 0, where gap_weeks counts from the node's `last_exercised_on` (EngineState) to today; recomputed at every call, so it never compounds |
| `place_in_order(week, order)` | 06 SES-003 | slot placement with day constraints. **v5.2 algorithm:** D = the week's available weekdays minus blocked dates (SES-005); long run on `long_run_day` if in D, else the latest day of D; key slots on the k days of D that maximise the smallest gap (in days) between consecutive hard days of the Monday–Sunday week, the long run counting as a hard day (SES-004, owner Q2), with no two hard days on consecutive dates — also across the week boundary with the previous week's last hard day — and no key session or long run on a post-night-shift date (CTX-005); ties to the earliest set of dates; if no set exists, the lowest-ranked slot is dropped and the search repeats (07 §2b S7.4); easy runs on the earliest remaining days up to the week's run count; strides (SES-021) on the earliest easy runs not the day before a key session; strength (SES-020) on the earliest easy or key days not the day before the long run |
| `distance_form(session)` | 06 §2d; SES-032 (v5.3) | conversion with the pace model, rounding to a list with a tolerance and a fallback to the time form per segment |
| `choose_key_modules(week, k)` | 07 §2b S7.3; 02 CMP-007 | v5.2 algorithm in 02 §4 (CMP-007): DST-002 node filter, weighted gap per slot, fallback chain, DST-018 override, SES-012 test substitution, phase overrides |

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
| `insert_phase` | phase, rung_expr | insert RTR or START_LADDER at the given rung, or (v5.2) TRANSITION / MAINTAIN for `weeks_expr` weeks (`rung_expr` null) |
| `insert_deload` | every_expr | PHS-001 placement |
| `drop_deload` | target | remove a deload week |
| `move_deload` | target, expr | move a deload week |
| `set_rung` | expr | ladder rung index |
| `drop_session` | target | remove a session or part of it (never re-added) |
| `move_session` | target, expr | move a session; `otherwise` gives the fallback action |
| `replace_module` | target, expr | swap the module (REP-001…004) |
| `schedule_session` | module_expr | add a test or a specified module (v5.2: optional `week_expr`, `replaces`, `dose_expr`, `place`; §3.3b) |
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
| `repair` | rank, fixes, method | v5.2 (07 §6.1): an S8r plan repair of the given rank that fixes the listed invariants by the named method |

### 3.3b Optional action fields and op semantics (v5.2, engine glue Q10)

> **In plain words.** Each kind of action the rules can take now has one exact meaning, so two engineers would build the same thing.

**Optional fields.** Besides the common fields `then, msg, when, otherwise, until, unless`, an action may carry only the optional fields listed here; the build rejects any other field (TST-121).

| Op | Optional fields | Meaning of the optional fields |
|---|---|---|
| `add_reason` | args | `args`: map name → RuleExpr giving the reason message's placeholder values |
| `ask` | questions | `questions`: human reference to the question set shown |
| `ask_confirm` | max_asks, on_no_answer | ask at most `max_asks` times; `on_no_answer` ∈ {use_lower_value, keep_excluded} applies after `ask.no_answer_days` |
| `constraint` | place_long_run, repair | `place_long_run`: RuleExpr giving the long-run weekday (SES-005); `repair`: name of the generation-time repair (`shorten_quality_segments`, LOD-033) |
| `emit_message` | attach_to, once, placeholders | `once`: show at most once per season (EngineState.messages_shown); `attach_to`: path of the explanation it joins; `placeholders`: map name → RuleExpr |
| `flag_entry` | exclude_from | the denominators the entry leaves (INV-14) |
| `freeze` | fields | `fields` given → those fields stay **unchanged**; no `fields` → the target may not **increase** |
| `gate` | effort_max | effort ceiling that goes with the outcome |
| `generate_options` | expr, max_expr | `expr`: kind ranked first, or the start date of a `move_date` search; `max_expr`: option count limit |
| `hold_step` | expr | reference week or step the hold returns to (ADP-052: `last_completed_step()`) |
| `insert_deload` | counted_from | where the cadence counter starts (PHS-001) |
| `insert_phase` | weeks_expr | length of the inserted phase in weeks (v5.2; TRANSITION, MAINTAIN) |
| `offer_swap` | max_offers | how many times the swap is offered |
| `raise_flag` | msg_expr | message chosen by an expression |
| `require_rescreen`, `route` | before | the next point at which the effect must hold (`next_session`, `gap_bands`) |
| `repair` | method_expr | RuleExpr argument of the repair method (v5.2, REP records) |
| `schedule_session` | week_expr, replaces, dose_expr, place | v5.2: `week_expr` = the plan week (index or start date) of the session, default the first allowed week (below); `replaces` ∈ {easy_nearest, key_slot, long_run}; `dose_expr` = dose step index; `place` ∈ {key_slot, easy_day} |
| `set`, `cap`, `floor` | (none) | |
| `set_rung` | constraint | a guard that must also hold for the rung to change (SAF-082) |

**Op semantics** (the 12 §3.3 one-liners stay normative; these settle the gaps of `docs/gap/engine.md` §1):

- `then`: the steps run in order after the first action; each step sees the writes of the earlier ones; a step is skipped when its parent did not change anything (a `cap` that did not bind is not a no-op: it still runs its `then`). `when`/`unless` are evaluated in the record's binding with the record's `on_unknown` policy; `otherwise` runs when `when` is definitely false.
- `until`: stored with the effect in EngineState (§3.8) as a predicate: an ISO date (holds while `today < date`), a RuleExpr (re-evaluated at every generator call and every event; the effect ends at the first call where it is true), or `'never'` (the effect lasts while its condition keeps firing). An `until` that evaluates to unknown keeps the effect.
- `block_sessions`: matching planned sessions are **removed** (not shown as rest); the week total drops by their duration (no redistribution, ADP-020); the block is stored with its `until`.
- `freeze`: see `fields` above. `freeze plan.future_weeks` (FEA-042) = every future week keeps its current planned time and long run as a ceiling.
- `insert_phase`: inserted at the current week (re-plan) or at week 1 (first plan). Its length: RTR = `ceil_div((rungs_to_last + 1) × rtr.sessions_per_rung, ladder runs/week)` (SAF-085); START_LADDER likewise with 9 rungs; TRANSITION = `weeks_expr` (default `phs.transition_weeks[goal.distance]`). Later phases shift right; if they no longer fit before the race, S4 is re-run, which may fail closed. `rung_expr` is required only for RTR and START_LADDER (`null` otherwise).
- `move_session`: to the same weekday of the target week if free, else the next free available day of that week; the moved session is re-validated; if no day is free, `otherwise` applies.
- `schedule_session`: default week = the first future week that is not a deload, TAPER, RACE or TRANSITION week and holds no other test (`week_expr` overrides). It `replaces` (default `easy_nearest`) the easy run of nearest duration on an available day and keeps the week total; a test or a key module may instead take a key slot (`key_slot`). The dose is the module's start step unless `dose_expr` says otherwise.
- `replace_module`: keeps date and planned duration unless the new module's dose is shorter; `'rest_or_cross'` means "no running session that day" (the day becomes rest; cross-training only if the preset or the runner allows it).
- `route`: the named rule(s) are evaluated at once with the same event and binding; `A|B` evaluates both in (tier, nnn) order; a module number (`10`) means every rule of that module bound to the event. Routes are not re-entrant: a rule already evaluated for this event is skipped.
- `regenerate`, `record_event`: never re-entered inside the same call. They **queue** a new event for the next batch (ADP-012); one generator call processes one batch (§3.7).
- `emit_message`: deduplicated per call by (id, binding); `once` additionally per season.
- `shorten_week`: tokens of `order_expr` are applied in order, each fully before the next: `easy` shortens easy runs to `ses.easy_min_min` (largest first, then latest date), `key` shortens key sessions to their start dose, `drop_easy` removes the shortest easy run (latest date on ties), `drop_key` removes the key session ranked last by CMP-007, `long` shortens the long run; it stops as soon as `until` holds.
- `adaptation_event` (ADP-010) means "any AdaptationEvent kind". `record_event` kind `goal_edit` is an AdaptationEvent kind (v5.2).


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

### 3.5 Rule binding and stages (v5.2, engine glue Q1)

> **In plain words.** Every rule now says at which step of plan building it runs, and whether it looks at the whole plan, at each week, at each session or at each logged run.

Every record in `rules.json` carries two derived fields, written by `tools/build_rules.py` and checked by TST-121:

- **`stage`** ∈ {S0, S1, S2, S3, S4, S5, S6, S7.1 … S7.8, S8, S8r, S9, S10, on_entry, on_event}. Derivation, first match wins: (1) an explicit `"stage"` in the machine record; (2) a condition that tests `event.type` takes the stage of that event type in the catalogue below; (3) T0 and T1 rules: S1 (they are re-run on every event, 08 §2); (4) the rule's module default: INP, SCR, CTX → S0 (INP) / S1 (SCR, CTX); CMP → S2; FEA → S3; PHS → S4; LOD → S6; SES, DST, NUT (T4–T6) → S7; GEN → by row of 07 §2; ADP → on_event; SAF → S1; REP → S8r; INV → S8.
- **`scope`** = the binding the rule is evaluated over, from the roots its condition reads, most specific first: `session` → per_session; `slot` or `m` → per_candidate; `entry` → per_entry; `week` or `next_week` → per_week; `node` → per_node; `flag` → per_flag; `option` → per_option; otherwise global. A per_week rule runs once for each plan week of its stage, in week order; per_session once per session in (date, slot order); per_node once per node in the 02 §3 topological order.

**Event-type catalogue.** `event.type` values are either AdaptationEvent kinds and UI events (emitted outside the generator, processed at `on_event` / `on_entry`) or **internal hooks** emitted by the pipeline at a fixed point. An `event.type` not in this table fails the build.

| event.type | Emitted by | Stage | Notes |
|---|---|---|---|
| activity_saved, tick_done_as_planned, backfill, anchor_saved, anchor_entered | logging UI | on_entry | per_entry |
| adaptation_event | any AdaptationEvent | on_event | ADP-010: matches every kind |
| illness_report, test_declined, something_felt_wrong, night_shift_tap, week_marked_busy, result, goal_accepted, goal_edit_submitted, gap_ended, flag_cleared, cardiac_flag_cleared, clearance_attested, availability_changed, availability_increased, drinking_plan_requested, onboarding_complete, ladder_complete, goal_race_closed | UI or log detection (08 §1) | on_event | goal_race_closed (v5.2): the goal race is logged done or abandoned, or `log.contemporaneous_window_h` passed after it with nothing logged (PHS-013) |
| exit_test_passed, exit_test_failed | SES-024 (v5.2) on the test entry | on_entry | CMP-002 listens |
| render_screen, load_quantity_requested | lint | static | |
| resolve_profile, compute_tol, level_unlock | pipeline | S2 | |
| compute_weeks_needed, reasons_collected, regeneration | pipeline | S3 | `regeneration` is emitted at S3 when `plan.is_regeneration` |
| enter_rtr | pipeline | S4 | |
| build_week, compute_lr_cap, compute_l30_future | pipeline | S6 | per_week |
| count_keys | pipeline | S7.1 | per_week (v5.2: SES-006/007) |
| fill_week_skeleton | pipeline | S7.1 | per_week |
| onboard_end | pipeline | S7.3 | the last ONBOARD week |
| candidate_list, tie, node_candidates, choose_keys | pipeline | S7.3 | per slot / per_week (v5.2: DST-002, CMP-007) |
| place_session | pipeline | S7.4 | per session |
| dose_sessions | pipeline | S7.5 | per session (v5.2: SES-011) |
| sessions_set | pipeline | S7.5 | per_week, after doses |
| distribute_week | pipeline | S7.6 | per_week |
| extras | pipeline | S7.7 | per_week (v5.2: SES-020/021) |
| build_race_fuelling | pipeline | S7.8 | |
| render_session | pipeline | S7.8 | per session (v5.3: SES-031/032 time or distance form) |
| version_emitted | pipeline | S10 | |

### 3.6 Write composition (v5.2, engine glue Q2)

> **In plain words.** When several rules want to set the same number, the most careful value wins; floors that protect your current running can beat a style's cap but never a safety limit.

Within one stage pass, rules are evaluated in (tier, nnn) order against the values at the start of the pass; their actions are **collected**, then resolved **per target** (a target is a path with its binding, e.g. `week.planned_time_s` of week 7):

1. **Numeric targets:** `final = min( caps of T0–T3, max( floors of T5, min( caps of T4–T6, base ) ) )`, where `base` is the value written by the `set` with the lowest (tier, nnn) on that target, else the incoming value. Floors of any tier other than T5 are treated as T5 floors. A `set` that *lowers* a value for a deload, taper or transition week (LOD-040, LOD-050, LOD-054) is a `base`, so every cap still applies to it. This is 07 §1 written as one formula; "PRIORITY: first by priority" means **first by priority per target**, never one rule per tier.
2. **Ordinal targets** (`state.effort_ceiling`, `state.progression_profile` with slow < standard, `state.gate`, `feas.verdict_rank`, `week.quality_max`): the most restrictive value wins whatever the tier and the op (`set` acts as a cap on the order): lowest effort, `slow`, the most restrictive gate (no_plan > pause_until_clearance > proceed_restricted > proceed), the worst verdict, the smallest quality count.
3. **Other non-numeric targets** (`slot.module`, `week.sessions`, booleans, dates, lists): the action of the record with the lowest (tier, nnn) wins; the others are logged in the FiredRuleLog with `applied: false`.
4. **Side-effect ops** (`emit_message`, `ask`, `add_reason`, `label`, `log_deviation`, `raise_flag`, `block_sessions`, `freeze`, `hold_step`, `schedule_session`, `route`): all apply (COLLECT), deduplicated by (op, target, message or code).
5. **Determinism:** the result of a pass never depends on the order in which records of different tiers were evaluated (TST-126 adds a permutation test).

FEA-013 is a `floor` on `feas.verdict_rank` (v5.2 fix: "at best stretch").

### 3.7 Evaluation loop (v5.2, engine glue Q3)

1. One generator call = one **batch**: the events of `input.events`, ordered by ADP-012 (tier, kind rank, id), then the pipeline S0 → S10 once.
2. Inside each stage: evaluate the stage's rules (per their scope) as one pass (§3.6), apply the resolved writes, and **repeat the pass until no target changes** (a fixpoint), at most `engine.max_iterations` passes. A stage that does not converge fails closed with reason `ENGINE_NONCONVERGENT` (result kind `fail_closed`, `previous_plan_kept` as §3.12) and logs the targets still changing.
3. `regenerate`, `record_event`, `route` and `ask` never restart a stage inside the same batch: `regenerate` and `record_event` queue an event for the **next** call; `route` evaluates its targets in place (§3.3b); `ask` ends the call with result kind `hold` when its field is still unknown and the record's policy is `ask` or `hold`.
4. S8 → S8r → S8: at most `repair.max_passes` repair passes (§07 6.1); after the last pass a still failing plan goes to S9 (`plan.s8r_exhausted`, GEN-003).
5. S9 runs, for each candidate option in order, a **nested** call S3–S8 on the option's goal or availability (never S9 again: options of options are not generated) and keeps the first `repair.max_options` that pass (FEA-041).

### 3.8 Persistence: EngineState (v5.2, engine glue Q4; v5.3 adds `experienced`)

> **In plain words.** The tool remembers only a few things between visits (for example which step of a return ladder you are on, or a doctor's clearance). Everything else is recomputed from your log, so the same inputs always give the same plan.

07 §2 reads in v5.2: `plan = f(profile, goal, log, today, engine_state, parent_plan, events, ruleset_version, registry_version)`. **EngineState** (`spec/schema/common.schema.json#/$defs/engine_state`) is an explicit, stored input; there is no other hidden state. The generator returns the next EngineState in every result; the caller stores it and passes it back unchanged.

| Kept in EngineState (cannot be recomputed from the inputs) | Recomputed at every call from the inputs |
|---|---|
| probation end (`state.probation_until`), `rich_weeks_consecutive`, `baseline_confirmed` (sticky for the season) and `est_confirm_weeks` | V7, V28, L30_eff (all sources), log_status, days_since_last_run, tol_tier, ages, S_slow, V_hold, L_hold |
| ladder kind, rung, floor, start, counted sessions, unclean weeks, backfill advance dates (SAF-080…086) | levels reached by log thresholds (CMP-001) and their decay (CMP-003) |
| levels from exit tests and ladder credit, with dates (CMP-002, SES-024) | gate outcome (S1 re-runs on every call), effort ceiling from active effects |
| module dose steps (`state.module_dose`), exit-test schedule and retest dates (SES-011…013), fuelling step (NUT-011/012), run-walk rung (SES-010) | demand, feasibility, phases, weeks, sessions |
| active anchor and pending anchor (ADP-060…067) | |
| v5.3: the experienced path (`experienced`: path, start, calibration end, fallback nodes and reason; 02 §2b EXP-001…005) | the qualifying race, its age-grade, the declared levels (EXP-002), the calibration signals of EXP-004 |
| active effects with their `until`: blocks, freezes, holds, effort ceilings (§3.3b) | |
| named counters and dated event lists: adp022/adp055/fatigue weeks, adp052 events, weeks in MAINTAIN | |
| messages already shown (`once`, SAF-061 per season), last goal race (INV-31), last verdict, season index, deload counter start | |

Flags are inputs (`input.flags`); flags raised or cleared during a call are returned in the result's `flags` list, which the caller stores and passes back as the next `input.flags`. A field written by a rule is **stored** only when it is in the left column; every other write lives for one call.

### 3.9 Blank, unknown and null (v5.2, engine glue Q5)

1. A field the runner was **asked and left blank or answered "I don't know"** is *unknown* (U). The input lists it in `declared_unknown` (spec/schema). So is an unanswered safety question and any value with `confidence = unknown`.
2. A field **not asked or not applicable** is `null`: `target_time_s` of a finish goal, `pain_0_10` when the pain tap was answered "No", `planned_distance_m` of a ladder session, `race_date` of an H0 goal, `last_reds_screen` of a new user, `last_field_test_date` before any test. Rules on `null`: `x == null` is true; `<, <=, >, >=` with a `null` operand are **false**; arithmetic with `null` gives `null`; a helper given `null` returns `null`; `has(x)` is false.
3. Helpers that find nothing return `null` ("none"): `first`, `next_day`, `parent_week`, `next_allowed_week`, `last`. (`first` returned U in v5.)
4. Any other absent value is an **error** (E): the call ends in `safe_state` (12 §3.2 rule 5).
5. A next-morning pain prompt that is unanswered is U (INP-022), and that unknown is handled by LOD-006 (no step-up without answers), not by the pain rules: ADP-052 reads `entry.pain_next_morning_yes` (answered yes), so an unanswered prompt never blocks the next day's run (v5.2 fix; before, `on_unknown: fire` turned every skipped prompt into a pain event).
6. Lint (TST-121, reported as INFO): every read of a nullable field without `has()` or `== null`, listed per rule.

### 3.10 Time, rounding and determinism (v5.2, engine glue Q11)

- All dates are local dates in `input.timezone`; `date_end` of a day is 23:59:59 local; `hours_between` on two dates uses their 00:00 local times; `today` and `now` come from the input only.
- Every arithmetic result assigned to a duration or distance is rounded **down** to an integer second or metre at once; caps that 05 rounds use `round_down(x, load.round_down_s)`. Ratios stay real numbers inside an expression.
- Results are serialised canonically (`spec/schema/README.md`): sorted keys, fixed list orders; `Plan.id` = SHA-256 of the canonical input and the two versions.
- Truth tables: in `&&`/`||`, a definite absorbing value wins over both U and E; otherwise **E dominates U**, as written in §3.2 rule 3. The evaluator library must be checked against TST-126; if a CEL library differs, the engine wraps it to follow this table.

### 3.11 Machine parameter registry (v5.2, engine glue Q8)

`parameters.md` stays the human register. From v5.2 it ends with a fenced ```` ```param ```` block holding one JSON object per parameter: `{id, type, unit, default, keys?, range?, presets?, limit_direction, owner}` with `type` ∈ {number, int, bool, enum, set, map, list, text, segments} and `limit_direction` ∈ {upper, lower, none}. `tools/build_parameters.py` joins the block to the table rows (every table row needs a machine line and vice versa; grade and basis come from the table) and writes `parameters.json`. `p(id)` resolves registry default → active preset override → ContextModifier override, combining overrides by **MIN when `limit_direction = upper`** and **MAX when `lower`**, last writer otherwise. Map-valued parameters are indexed with `[key]` (`p('race.recovery_days')['HM']`); dynamic ids built by concatenation (`p('prog.' + profile + '.week_max')`) must match a declared family (`<…>` placeholder in the id).

### 3.12 What the runner gets when generation fails (v5.2, gap/engine.md §4)

| Situation | First generation (no previous version) | Re-generation |
|---|---|---|
| gate pause or no_plan (S1) | `gate_stop`: generic message and disclaimer, no sessions | same; the paused plan is kept as `paused` (SAF-020) |
| safety questions unanswered (`hold`, `ask`) | `hold`: MSG-SAF-HOLD or the question, no sessions | `hold`; the previous plan stays, its sessions are not shown until answered |
| verdict infeasible, PHASES_DO_NOT_FIT, repairs exhausted, ENGINE_NONCONVERGENT | `fail_closed` with options, `previous_plan_kept = false` | FEA-043 degraded completion first; else `fail_closed`, `previous_plan_kept = true` with future weeks frozen (FEA-042) |
| error value E | `safe_state`, no plan, error logged | `safe_state`, `previous_plan_kept = true` |

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
| **MVP** | 5K, 10K, HM; preset `method_default`; horizons H0–H3; start ladder, RTR, all adaptation of 08 except DST | every T0–T2 rule, every INV-01…31, the 66 MVP rules of p2-B R11, 39 further MVP-reachable T3–T6 rules formalised in v5, (v5.1) the formal rules LOD-007, LOD-008 and ADP-067, and (post-audit) the 27 MVP-reachable rules still `text_only` (v5.2: `release: "MVP"` in rules.json: 269 rules + 31 invariants, every one with a machine record) | TST-121 green on the MVP set; TST-110…112 oracle agrees with 13; fixtures TST-095…106 pass; PAR-Q+ licence and item map signed off; safety text reviewed (00 §8 release blockers) |
| **R2** | + marathon (`road_classic`), presets `hansons`, `pfitzinger_classic`, `higdon_novice`, `galloway` once their fixtures are encoded (INV-26) | + LOD-017/018 paths for > `lr.long_guard_min`, DST road rules, NUT race-fuelling rules used by marathon | 65+ fixtures (SAF-060), INV-28/29 fixtures and oracle (a) pass |
| **R3** | + 50K, 100K (`ultra`), back-to-backs, `koop_ultra` | + DST ultra rules, NUT T4–T6 | ultra fixtures; b2b fixtures; pilot evidence of R2 |

**v5.2 tag corrections** (gap/prose-rules.md §4.9): PHS-015 (ultra), DST-007 (marathon) and SES-019 (`norwegian_elite`) are not reachable in the MVP profile and are tagged `spec`; DST-017, DST-018, SES-020, SES-021, SES-022, NUT-021, NUT-030, NUT-040 and FEA-026 are reachable and are tagged MVP with machine records; the repair records REP-001…006 and SES-024 are new MVP rules. All MVP rules now have machine records (B-4 closed in the rule base; behaviour still unexecuted). H4/H5 (PHS-012, PHS-016, FEA-024/025), other presets and CMP nodes beyond the MVP levels stay `text_only` until their profile. The build marks every record with `release`, and TST-121 fails if a record tagged MVP is `text_only`. The tag list lives in `tools/build_rules.py`; Post-audit, the 27 text-only rules that MVP code paths still reached were tagged MVP so that TST-121 failed until they were formalised (B-4); v5.2 formalised them and TST-121 passes.

**Build order** (p2-B R12): (1) parameter registry and schema; (2) RuleExpr evaluator with CEL four-valued truth tables (TST-126); (3) S0–S2 and the B-group validator; (4) the independent oracle (07 §5a, TST-110…112); (5) S3–S8; (6) adaptation (08); (7) message catalogue and display. The acceptance criteria stay those of the full specification; a profile is a subset of it, not a lower bar.


// Types of the serialised contract (spec/schema/*.schema.json, v5.2). The schema governs; these mirror it loosely.
import type { ISODate, Weekday } from '../util/dates.ts';

export type Effort = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
export type Confidence = 'measured' | 'estimated' | 'unknown';
export type Distance = '5K' | '10K' | 'HM' | 'M' | '50K' | '100K' | 'none';
export type PhaseType = 'START_LADDER' | 'RTR' | 'ONBOARD' | 'BASE' | 'BUILD' | 'SPECIFIC' | 'SHARPEN' | 'TAPER' | 'RACE' | 'TRANSITION' | 'MAINTAIN';
export type Gate = 'proceed' | 'proceed_restricted' | 'pause_until_clearance' | 'no_plan';
export type Verdict = 'feasible' | 'stretch' | 'infeasible';
export type Node = 'HAB' | 'TOL' | 'AER' | 'THR' | 'VO2' | 'ECO' | 'DUR' | 'MSP' | 'FUEL' | 'HEAT' | 'PACE';

export interface Goal {
  id: string; distance: Distance; family?: string; goal_type: 'finish' | 'time' | 'maintain' | 'base';
  target_time_s: number | null; race_date: ISODate | null; expected_conditions: 'normal' | 'hot';
  cutoff_h?: number | null; milestones?: unknown[]; race_status?: string; created_at?: string;
}
export interface ActivityRecord {
  id: string; date: ISODate; entered_at: string; type: string; source: string; planned_session_id?: string | null;
  module_id?: string | null; duration_s: number; distance_m?: number | null; rpe_0_10?: number | null; pain_any?: boolean | null;
  pain_0_10?: number | null; pain_next_morning?: boolean | null; pain_settled_24h?: boolean | null; gi_score_0_10?: number | null;
  carb_g_per_h?: number | null; fatigue_flag?: boolean; stopped_early_reason?: string | null; conditions_hot?: boolean;
  effort_all_out?: boolean | null; is_goal_race?: boolean; test_completed?: boolean | null; test_held_effort?: boolean | null;
  plausibility_answer?: string | null; [k: string]: unknown;
}
export interface Anchor { id: string; kind: string; distance_m: number; time_s: number; date: ISODate; entered_at: string; conditions_hot?: boolean; effort_all_out?: boolean | null; confirmed_by_runner?: boolean | null }
export interface RiskFlag { id: string; kind: string; subkind: string; region?: string | null; rule_id: string; raised_on: ISODate; status: 'active' | 'cleared'; cleared_on?: ISODate | null; clearance_attested_on?: ISODate | null }
export interface AdaptationEvent { id: string; kind: string; date: ISODate; payload: Record<string, unknown> }

export interface EngineState {
  as_of?: ISODate; plan_version?: number; progression_profile_until?: ISODate | null; rich_weeks_consecutive?: number;
  baseline_confirmed?: boolean; est_confirm_weeks?: number;
  ladder?: { kind: 'rtr' | 'start'; rung_index: number; floor_rung?: number; start: ISODate; entry_reason?: string; counted_session_ids?: string[]; unclean_weeks_on_rung?: number; backfill_advance_dates?: ISODate[] } | null;
  levels?: { node: Node; level: number; confidence: Confidence; source: string; achieved_on?: ISODate; last_exercised_on?: ISODate }[];
  module_dose?: Record<string, number>;
  exit_tests?: { node: Node; level: number; status: string; scheduled_week_start?: ISODate; retest_not_before?: ISODate }[];
  fuel_step_g_h?: number | null; runwalk_rung?: number | null; pace_anchor_10k_equiv_s?: number | null; active_anchor_id?: string | null;
  pending_anchor?: { equiv_10k_s: number; date: ISODate } | null;
  effort_ceilings?: { rule_id: string; effort: Effort; until: string }[];
  blocks?: { rule_id: string; filter: string; until: string }[];
  freezes?: { rule_id: string; target: string; until: string; fields?: string[] }[];
  holds?: { rule_id: string; until: ISODate }[];
  counters?: Record<string, number>; dated_events?: Record<string, ISODate[]>;
  messages_shown?: { id: string; on: ISODate; season?: number }[];
  last_goal_race?: { date: ISODate; distance: Distance } | null; last_verdict?: Verdict | null; season_index?: number;
  deload_counter_from?: ISODate | null;
}

export interface GeneratorInput {
  schema_version: string; today: ISODate; now?: string; timezone: string; ruleset_version?: string; registry_version?: string;
  declared_unknown: string[];
  profile: {
    id: string; birth_month: number | null; birth_year: number | null; sex: 'f' | 'm' | null; body_mass_kg?: number | null;
    training_age_years: number | null; never_run: boolean; other_sport_background: string | null; injury_last_12m: boolean | null;
    available_days: Weekday[] | null; max_runs_per_week: number | null; available_minutes_per_week: number | null; blocked_dates: ISODate[];
    long_run_day: Weekday | null; run_walk_preference: boolean | null; run_walk_preference_explicit: boolean; preset_preference: string | null;
    night_shift_dates: ISODate[]; hill_access: boolean; nutrition_referral_flag: boolean; caffeine_sensitive: boolean; b2b_opt_in: boolean;
    level_tests_opt_out?: boolean; created_at: string;
    special_status?: { type: string; start_date: ISODate; attested: boolean; due_date?: ISODate; has_given_birth?: boolean | null }[];
    attestations?: { msg_id: string; attested_on: ISODate; flag_id?: string }[];
  };
  screening: {
    instrument: string; answers: Record<string, boolean | null>; followup_answers: Record<string, boolean | null>;
    item_factor?: Record<string, string>; current_symptoms?: Record<string, boolean | null>; guardian_attested_on?: ISODate | null;
    guardian_hardcap_optin?: boolean; completed_on: ISODate | null; valid_until?: ISODate; clearance_attested_on?: ISODate | null;
    saf060_attested_on?: ISODate | null; masters_checked?: boolean;
  };
  claim: {
    runs_per_week: number | null; weekly_distance_m: number | null; weekly_time_s: number | null; L30_distance_m: number | null;
    L30_duration_s: number | null; last_run_band: string | null; last_run_date?: ISODate | null; continuous_30min: boolean | null;
  };
  anchors: Anchor[]; hr_references?: unknown[]; log: ActivityRecord[]; sweat_tests?: { rate_ml_h: number }[]; reds_screens?: { date: ISODate }[];
  goal: Goal; goal_edits?: { submitted_at: string; verdict: Verdict; changed_fields?: string[] }[]; flags: RiskFlag[]; events: AdaptationEvent[];
  engine_state: EngineState | null; parent_plan: Plan | null;
}

export interface Segment { effort: Effort; role?: string; duration_s?: number; distance_m?: number; repeats: number; recovery?: { effort: Effort; duration_s: number } }
export interface MessageInstance { id: string; layer?: 'card' | 'why' | 'coach'; placeholders?: Record<string, { type: string; value: number | string }>; rule_id?: string }

export interface Session {
  id: string; date: ISODate; weekday: Weekday; module_id: string; kind: string; is_run: boolean; is_long_run: boolean; is_peak_long_run: boolean;
  is_goal_race: boolean; is_race: boolean; is_key: boolean; is_hard: boolean; is_test: boolean; test_for: { node: Node; level: number } | null;
  is_extension: boolean; is_floor_bound: boolean; is_b2b_pair: boolean; pair_id: string | null; effort_target: Effort; segments: Segment[];
  dose_step: number | null; prescription: 'time' | 'distance' | 'ladder'; planned_duration_s: number; planned_distance_m: number | null;
  floor_extension: null; expected_duration_s: number; pace_range: { fast_s_per_km: number; slow_s_per_km: number; effort: Effort } | null;
  hr_zone: null; hr_source: null; run_walk: boolean; run_walk_ratio: { run_s: number; walk_s: number; label?: string } | null;
  ladder: { kind: 'none' | 'rtr' | 'start'; rung: string | null }; fuel_target_g_h: number | null; why_message: MessageInstance;
  messages: MessageInstance[]; rule_ids: string[]; grade_label: string | null; status: string; in_published_window: boolean; test_declined?: boolean;
}
export interface Week {
  index: number; start: ISODate; iso_week: string; phase: PhaseType; season_index: number; phase_week_index: number;
  load_kind: string; load_ordinal: number; is_deload: boolean; taper_k: number | null; is_race_week: boolean; kind: 'normal' | 'maintenance';
  planned_time_s: number; planned_dist_m: number | null; lr_s: number; runs: number; quality_max: number; key_session_count: number;
  e3_touches: number; has_e3_touch: boolean; hard_time_s: number; e2_time_s: number; easy_time_s: number; frozen: boolean;
  log_state: 'logged' | 'partial' | 'unlogged' | 'future'; sessions: Session[];
}
export interface Phase { type: PhaseType; start_week: number; n_weeks: number; season_index: number }
export interface Plan {
  id: string; version: number; parent_plan_id: string | null; goal_id: string; preset_id: string; status: 'active' | 'superseded' | 'paused';
  degraded: boolean; pace_mode: 'paced' | 'effort_only'; plan_start: ISODate; race_date: ISODate | null; W: number | null; horizon: string;
  published_until: ISODate; phases: Phase[]; taper_weeks_n: number; v_ref_s: number | null; lr_ref_s: number | null;
  pre_taper_runs: number | null; pre_taper_had_e3: boolean; peak_lr_s: number; peak_lr_dist_m: number | null; race_fuel_g_h: number | null;
  drink_ml_h: number | null; weeks: Week[];
}

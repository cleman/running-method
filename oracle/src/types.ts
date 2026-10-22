// Minimal TypeScript views of spec/schema/*.schema.json. Only the fields the oracle reads are typed; the
// schema itself (validated by ajv in src/schema.ts) is the contract. Field names are copied from the schema.

export type Effort = 'E0' | 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Segment {
  effort: Effort;
  role?: string;
  duration_s?: number;
  distance_m?: number;
  repeats: number;
  recovery?: { effort: Effort; duration_s: number };
}

export interface Session {
  id: string;
  date: string;
  weekday?: Weekday;
  module_id: string;
  kind: string;
  is_run: boolean;
  is_long_run: boolean;
  is_peak_long_run?: boolean;
  is_goal_race: boolean;
  is_race?: boolean;
  is_key: boolean;
  is_hard: boolean;
  is_test?: boolean;
  test_for?: { node?: string; level?: number } | null;
  is_extension?: boolean;
  is_b2b_pair?: boolean;
  pair_id?: string | null;
  effort_target: Effort;
  segments: Segment[];
  dose_step?: number | null;
  prescription?: 'time' | 'distance' | 'ladder';
  planned_duration_s: number;
  planned_distance_m: number | null;
  floor_extension?: { to_distance_m: number; max_duration_s: number } | null;
  expected_duration_s: number;
  pace_range: { fast_s_per_km: number; slow_s_per_km: number; effort?: Effort } | null;
  hr_zone: { low_bpm?: number; high_bpm?: number } | null;
  hr_source: 'hrmax_measured' | 'lthr_measured' | null;
  run_walk: boolean;
  run_walk_ratio: unknown;
  ladder: { kind: 'none' | 'rtr' | 'start'; rung?: string | null };
  fuel_target_g_h?: number | null;
  status: string;
  in_published_window: boolean;
}

export interface Week {
  index: number;
  start: string;
  phase: string;
  load_kind: string;
  load_ordinal: number;
  is_deload: boolean;
  taper_k: number | null;
  is_race_week: boolean;
  planned_time_s: number;
  planned_dist_m?: number | null;
  lr_s: number;
  runs: number;
  key_session_count: number;
  e3_touches: number;
  has_e3_touch?: boolean;
  hard_time_s: number;
  e2_time_s?: number;
  easy_time_s?: number;
  frozen: boolean;
  sessions: Session[];
}

export interface Plan {
  id: string;
  version: number;
  goal_id: string;
  preset_id: string;
  degraded: boolean;
  pace_mode: 'paced' | 'effort_only';
  plan_start: string;
  race_date?: string | null;
  W: number | null;
  horizon: string;
  phases: { type: string; start_week: number; n_weeks: number }[];
  taper_weeks_n?: number;
  v_ref_s?: number | null;
  lr_ref_s?: number | null;
  pre_taper_runs?: number | null;
  pre_taper_had_e3?: boolean;
  peak_lr_s?: number;
  peak_lr_dist_m?: number | null;
  race_fuel_g_h?: number | null;
  weeks: Week[];
}

export interface Feasibility {
  goal_id: string;
  verdict: 'feasible' | 'stretch' | 'infeasible';
  headline?: string | null;
  horizon: string;
  weeks_available: number | null;
  weeks_needed: { rtr: number; onboard: number; base: number; build: number; specific: number; taper: number; G?: number; n_L?: number; n_V?: number; K?: number; K_key?: number };
  slack: number | null;
  reasons: string[];
  labels: string[];
  predicted_band?: { model_id: string; point_s: number | null; p_race_s: number | null; fast_edge_s: number; slow_edge_s: number; b_fast: number; b_slow: number; confidence: string; target_where?: string | null } | null;
  demand: { L_req_time_s?: number; L_req_dist_m?: number; floor_dist_m?: number; distance_stop_m?: number | null; V_req_time_s?: number; runs_req?: number; required_levels?: Record<string, number>; expected_race_duration_s?: number | null; met_by_logged_distance?: boolean; credited?: boolean } | null;
  options?: { rank: number; kind: string; new_goal: Record<string, unknown>; verdict: string; reasons?: string[]; plan: Plan }[];
  alternative_option?: unknown;
}

export interface Result {
  schema_version: string;
  kind: 'plan' | 'fail_closed' | 'gate_stop' | 'hold' | 'safe_state';
  today: string;
  messages: { id: string; placeholders?: Record<string, { type: string; value: string | number }> }[];
  fired_rules: unknown[];
  engine_state: Record<string, unknown> | null;
  flags: { id: string; subkind?: string; raised_on: string; status: string; clearance_attested_on?: string | null }[];
  gate?: string;
  plan?: Plan;
  feasibility?: Feasibility;
  validation?: { pass: boolean; passes_used: number; violations: unknown[] };
  ledger?: unknown[];
  state?: Record<string, unknown> & { L30_eff_time_s?: number | null; L30_eff_dist_m?: number | null; V_hold_s?: number | null; L_hold_s?: number | null; max_tolerated_g_h?: number | null; tol_tier?: number; tol_confidence?: string; levels?: { node: string; level: number; confidence: string }[] };
  previous_plan_kept?: boolean;
  hold?: { rule_ids: string[]; questions: string[] };
  error?: { rule_id: string; detail: string };
}

export interface LogEntry {
  id: string;
  date: string;
  entered_at: string;
  type: string;
  source: string;
  planned_session_id: string | null;
  module_id: string | null;
  duration_s: number;
  distance_m: number | null;
  rpe_0_10: number | null;
  [k: string]: unknown;
}

// The generator input (input-profile.schema.json); kept loose on purpose.
export type Input = Record<string, any> & {
  today: string;
  profile: Record<string, any>;
  goal: Record<string, any>;
  log: LogEntry[];
  anchors: Record<string, any>[];
  flags: Record<string, any>[];
  events: Record<string, any>[];
};

export interface Fixture {
  fixture_id: string;
  persona: string;
  sources: string[];
  release: 'MVP' | 'R2' | 'R3';
  input: Input;
  behaviour: { model: 'as_planned' | 'day0_only' | 'scripted'; replan?: string; deviations: { week: number; day?: Weekday; what: string; detail?: Record<string, any> }[]; horizon_weeks?: number | null };
  provenance: Record<string, string>;
  notes?: string;
}

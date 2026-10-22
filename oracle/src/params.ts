// Parameters hand-transcribed from spec/parameters.md (the human tables), with the section each comes from.
// The oracle never loads spec/parameters.json for its own values (gap/oracle.md §7): a registry typo must
// not pass both sides. tests/01-params.test.ts diffs this file against parameters.json and reports any
// mismatch as a FINDING (not a silent fix in either direction).
//
// Units follow spec/schema/README.md §1: seconds, metres, fractions.

export const P = {
  // §1 Load safety
  'spike.warn_ratio': 1.10,
  'spike.block_ratio': 2.00,
  'two_day.cap_ratio': 1.60,
  'two_day.adjacent_ratio': 0.50,
  'b2b.day2_ratio': 0.60,
  'b2b.pair_cap_ratio': 1.75,
  'lod.min_run_s': 900,
  'load.round_down_s': 60,
  'load.round_down_m': 100,

  // §2 Manual log
  'log.contemporaneous_window_h': 48,
  'log.min_entries_30d': 3,
  'log.bulk_backfill_max': 5,
  'log.probation_weeks': 3,
  'claim.l30_discount': 0.90,
  'claim.l30_week_ratio_max': 0.60,

  // §3 Inputs, context
  'ctx.novice_training_age_years': 1,
  'ctx.masters_age': 50,
  'ctx.lowfreq_runs': 3,
  'ctx.lowfreq_quality_max': 1,
  'deload.every_ctx': 3,

  // §4 Gaps
  'gap.reduce_trigger_days': 8,
  'gap.rtr_trigger_days': 30,
  'gap.vol_factor.8_14': 0.75,
  'gap.vol_factor.15_29': 0.50,
  'gap.long_factor.8_14': 0.80,
  'gap.long_factor.15_29': 0.60,
  'miss.partial_ratio': 0.75,
  'pain.during_max': 3,
  'rtr.sessions_per_rung': 3,
  'rtr.max_runs_per_week': 4,
  'flag.clearance_min_delay_days': 1,
  'flag.pause_kinds': ['cardiac', 'bone_stress', 'bone_stress_highrisk', 'heat', 'eah', 'pregnancy_stop', 'reds_escalated', 'pain_persistent', 'illness'],

  // §5 Special populations
  'masters.vigorous_assessment_age': 65,
  'minor.adult_age': 18,
  // minor.max_race_km.recommended: 14–15: 8; 16: 12; 17: 14 (km)
  'minor.max_race_km.recommended': { 14: 8, 15: 8, 16: 12, 17: 14 } as Record<number, number>,
  'minor.lr_cap_ratio': 1.0,
  'pp.min_weeks': 12,
  'pregnancy.max_effort': 'E2',
  'pregnancy.vol_cap_ratio': 1.0,

  // §6 Phases, taper, deload
  'taper.weeks': { '5K': 2, '10K': 2, HM: 2, M: 3, '50K': 3, '100K': 3 } as Record<string, number>,
  'taper.weeks.short_finish': 1,
  'taper.volume_cut': 0.50,
  'taper.cut_profile': { 1: [1.0], 2: [0.6, 1.0], 3: [0.4, 0.7, 1.0] } as Record<number, number[]>,
  'taper.freq_min_ratio': 1.0,
  'deload.every': 4,
  'deload.volume_cut': 0.25,
  'deload.quality_max': 1,
  'deload.min_plan_weeks': 6,
  'deload.exclusion_before_taper': 2,
  'deload.min_gap_weeks': 2,
  'transition.vol_max_ratio': 0.50,
  'phs.onboard_weeks': 2,
  'phs.specific_min': { '5K': 2, '10K': 2, HM: 3, M: 4, '50K': 4, '100K': 4 } as Record<string, number>,
  'phs.specific_target': { '5K': 4, '10K': 4, HM: 6, M: 8, '50K': 8, '100K': 10 } as Record<string, number>,
  'phs.build_min': 1,
  'phs.build_max': 8,
  'phs.transition_weeks': { '5K': 1, '10K': 1, HM: 1, M: 2, '50K': 2, '100K': 2 } as Record<string, number>,

  // §7 Progression, long run, TID
  'prog.standard.week_max': 0.15,
  'prog.standard.2wk_max': 0.30,
  'prog.slow.week_max': 0.10,
  'prog.slow.2wk_max': 0.20,
  'prog.baseline_max_age_weeks': 2,
  'prog.est.week_max': 0.10,
  'prog.est.window_weeks': 4,
  'prog.est.confirm_weeks': 6,
  'prog.est.confirm_ratio': 0.80,
  // lr.pct_cap.method_default.short by run count (≤ 2: 0.60, 3: 0.45, 4: 0.40, ≥ 5: 0.30); road_classic 0.50
  'lr.pct_cap.short': { 2: 0.60, 3: 0.45, 4: 0.40, 5: 0.30 } as Record<number, number>,
  'lr.pct_cap.road_classic': 0.50,
  'lr.over_cap_pct.road_classic': 0.60,
  'lr.time_cap_min': { '5K': 150, '10K': 150, HM: 150, M: 180 } as Record<string, number>,
  'lr.floor_time_max_min': { HM: 150, M: 240, '50K': 240, '100K': 330 } as Record<string, number>,
  'lr.abs_cap_km.M': 32,
  'lr.pct_floor_s': 3600,
  'lr.long_guard_min': 180,
  'lr.long_guard_tol_level': 4,
  'lr.over180_min_gap_days': 14,
  'tid.easy_share_min': 0.75,
  'tid.hard_share_max': { short: 0.20, road_classic: 0.10, ultra: 0.10, HM: 0.15 } as Record<string, number>,
  'tid.e2_share_max': 0.20,
  'cmp.min_weeks_per_level': 4,

  // §8 Sessions
  'ses.warmup_s': 600,
  'ses.cooldown_s': 300,
  'ses.strides_per_week': 2,
  'ses.strength_per_week': 2,
  'ses.strength_session_min': 20,
  'ses.exit_ready_sessions': 2,
  'ses.exit_retest_weeks': 3,
  'ses.progress_rpe_margin': 1,
  'ses.drift_rpe_max': 2,
  'ses.target_rpe': { E1: 3, E2: 5, E3: 6, E4: 7 } as Record<string, number>,
  'ses.ft1_dist_m': 3000,
  'dst.msp_share': { L1: 0.10, L2: 0.30, L3: { '5K': 0.75, '10K': 0.65, HM: 0.55, M: 0.50 } },
  'dst.msp_every_weeks': 2,
  'dst.race_long_every_weeks': 2,
  'dst.msp_segment_max_min': { M: 90, HM: 40 } as Record<string, number>,
  'dst.msp_segment_max_ratio': 0.60,
  'ses.msp_rep_max_min': { '5K': 10, '10K': 10, HM: 15, M: 20 } as Record<string, number>,

  // §9 Goal, feasibility, prediction
  'race.longest_ratio_max': { '5K': 1.30, '10K': 1.25, HM: 1.30, M: 1.40, '50K': 1.60, '100K': 2.50 } as Record<string, number>,
  'race.longest_floor_ratio': { HM: 1.60, M: 2.00, '50K': 2.00, '100K': 3.00 } as Record<string, number>,
  'race.5k_finish_lr_min': 30,
  'feas.finish_floor.peak_week_min': { '10K': 90, HM: 150, M: 240 } as Record<string, number>,
  'feas.planning_speed_margin': 0.10,
  'feas.default_planning_pace_s_per_km': 480,
  'feas.stretch_margin_weeks': 2,
  'pred.band_min_pct': 7,
  'pred.band_widen_estimated': 1.5,
  'pred.marathon_from_half': 2.19,
  'pred.riegel_exp_min': 1.06,
  'pred.low_volume_km_week': 48,
  'pred.low_volume_widen': 1.5,
  'pred.max_extrapolation_ratio': 4.5,
  'pred.taper_gain_pct': 2,
  'pred.band_same_distance_pct': 4,
  'pred.same_distance_max_age_days': 56,
  'anchor.max_age_days': 120,
  'pace.deadband_pct': 3.5,
  'pace.e3_low': 0.92,
  'pace.e3_high': 0.97,
  'pace.e1_low': 0.72,
  'pace.e1_high': 0.92,
  'pace.round_s': 5,
  'repair.max_passes': 3,
  'repair.max_options': 4,
  'race.recovery_days': { '5K': 7, '10K': 10, HM: 14, M: 28, '50K': 42, '100K': 42 } as Record<string, number>,
  'ladder.est_pace_s_per_km': 660,

  // §10 Fuelling
  'fuel.required_above_min': 90,
  'fuel.start_g_h': 30,
  'fuel.step_g_h': 15,
  'fuel.gi_pass_max': 2,
  'fuel.practice_min_duration_min': 60,

  // §14 / §15
  'claim.l30_cap_by_tol': { 0: 30, 1: 60, 2: 90, 3: 120 } as Record<number, number>,
  'quality.non_key_runs_min': 2,
  'cmp.max_level': { HAB: 4, TOL: 5, AER: 5, THR: 4, VO2: 3, ECO: 3, DUR: 5, MSP: 3, FUEL: 4, HEAT: 2, PACE: 3 } as Record<string, number>,
} as const;

// 02 §5 weights (cmp.weight.<distance>.<node>), transcribed from the table.
export const CMP_WEIGHT: Record<string, Record<string, number>> = {
  '5K': { AER: 0.25, THR: 0.20, VO2: 0.30, ECO: 0.15, DUR: 0.00, MSP: 0.10, FUEL: 0.00 },
  '10K': { AER: 0.25, THR: 0.30, VO2: 0.20, ECO: 0.10, DUR: 0.05, MSP: 0.10, FUEL: 0.00 },
  HM: { AER: 0.30, THR: 0.30, VO2: 0.10, ECO: 0.05, DUR: 0.10, MSP: 0.15, FUEL: 0.00 },
  M: { AER: 0.30, THR: 0.15, VO2: 0.05, ECO: 0.05, DUR: 0.25, MSP: 0.15, FUEL: 0.05 },
};

// 06 §2c dose ladders: work time per step in seconds (E3/E4 work, or total duration where noted).
export const DOSE = {
  // SES-M-008 threshold intervals: [reps, rep_min]; 2 min E1 jog between reps
  'SES-M-008': [[3, 5], [3, 6], [3, 7], [3, 8], [4, 8], [5, 8]] as [number, number][],
  'SES-M-008.recovery_s': 120,
  // SES-M-010 VO2 intervals: [reps, rep_min]; equal-time E1 jog
  'SES-M-010': [[5, 2], [6, 2], [5, 3], [6, 3]] as [number, number][],
  // SES-M-012 progression run total minutes; E1 70 %, E2 15 %, E3 15 %
  'SES-M-012': [40, 50, 60, 70],
  // SES-M-011 accumulated share of the expected race time
  'SES-M-011': [0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50],
  'SES-M-011.recovery_s': 120,
  // SES-M-006 strides: count × 20 s E5, 60 s walk-back
  'SES-M-006': [4, 6, 8],
  // 06 §3b level tests
  'test.THR1': [2, 8] as [number, number], // 2 × 8 min E3, 2 min jog
  'test.THR2': [5, 5] as [number, number], // 5 × 5 min E3 (ses.exit.THR2_min = 25)
} as const;

/** Session length of an interval key session: warm-up + work + (reps − 1) recoveries + cool-down (06 §2c). */
export function intervalSessionS(reps: number, repMin: number, recoveryS: number): number {
  return P['ses.warmup_s'] + reps * repMin * 60 + (reps - 1) * recoveryS + P['ses.cooldown_s'];
}

/** round_down(x, step) of 12 §2b.3. */
export function roundDown(x: number, step: number): number {
  return Math.floor(x / step) * step;
}

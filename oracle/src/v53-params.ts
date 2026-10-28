// v5.3 parameters, hand-transcribed from spec/parameters.md §15b and the ladders of 06 §2d (the human tables).
// Like src/params.ts, never loaded from spec/parameters.json; tests/04-v53-arithmetic.test.ts diffs the scalars
// and the ladders against the registry and reports differences as findings.

export const PV = {
  'exp.race_max_age_days': 84,
  'exp.distance_tol_pct': 2,
  'exp.training_age_min': 2,
  'exp.age_min': 18,
  'exp.injury_free_weeks': 12,
  'exp.claim_level_cap': 3,
  'exp.runs_min': 3,
  'exp.calibration_weeks': 3,
  'exp.calibration_keys': 2,
  'exp.l30_discount': 0.9,
  'exp.fallback_rpe_sessions': 2,
  'exp.fallback_volume_ratio': 0.8,
  'exp.declared_pace_widen_pct': 2,
  'exp.keys_max': 3,
  'exp.three_keys_runs_min': 6,
  'exp.three_keys_tol_min': 3,
  'exp.taper_keys': 2,
  'exp.hard_sessions_max_default': 3,
  'ses.dist_round_tol_pct': 10,
  'ses.dist_round_recovery_m': 100,
  'ses.hill_speed_ratio': 0.85,
  'ses.projection_max_steps': 6,
  'ses.prescription_default': 'distance',
} as const;

/** exp.agegrade_bands lower edges and exp.level_table / volume bands, by row (02 §2b table). */
export const EXP_ROWS = [
  { lo: 0, THR: 1, VO2: 1, MSP: 0, volMin: 0, volMax: 420 as number | null },
  { lo: 55, THR: 2, VO2: 1, MSP: 1, volMin: 150, volMax: 720 as number | null },
  { lo: 65, THR: 3, VO2: 2, MSP: 1, volMin: 240, volMax: null as number | null },
  { lo: 75, THR: 3, VO2: 3, MSP: 2, volMin: 300, volMax: null as number | null },
];

/** perf.wma_open_s (ALLEGED approximation, not WMA 2023). */
export const WMA_OPEN_S: Record<'m' | 'f', Record<string, number>> = {
  m: { '5K': 769, '10K': 1584, HM: 3451, M: 7235 },
  f: { '5K': 834, '10K': 1726, HM: 3772, M: 7796 },
};
/** perf.wma_age_factor, linear between the listed ages, 1.00 up to 30. */
export const WMA_AGE_FACTOR: Record<'m' | 'f', Record<number, number>> = {
  m: { 30: 1.0, 35: 0.99, 40: 0.965, 45: 0.935, 50: 0.9, 55: 0.865, 60: 0.83, 65: 0.795, 70: 0.755, 75: 0.71, 80: 0.66, 85: 0.6, 90: 0.53 },
  f: { 30: 1.0, 35: 0.985, 40: 0.955, 45: 0.92, 50: 0.88, 55: 0.84, 60: 0.8, 65: 0.76, 70: 0.715, 75: 0.665, 80: 0.61, 85: 0.55, 90: 0.48 },
};

/** ses.track_distances_m, "then whole km". */
export const TRACK_M = [200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000];

/** ses.time_only_modules */
export const TIME_ONLY = ['SES-M-029'];

/** exp.long_quality_pattern */
export const LONG_PATTERN: Record<string, ('a' | 'b')[]> = { BUILD: ['a', 'b'], SPECIFIC_time: ['b', 'b', 'a'], SPECIFIC_finish: ['a', 'b'] };

/** ses.family.<node> (rotation lists, SES-030). */
export const FAMILY: Record<'THR' | 'VO2', string[]> = { THR: ['SES-M-008', 'SES-M-009', 'SES-M-030'], VO2: ['SES-M-010', 'SES-M-027', 'SES-M-028', 'SES-M-029'] };

/** ses.rung_node */
export const RUNG_NODE: Record<string, string> = {
  'SES-M-008': 'THR', 'SES-M-009': 'THR', 'SES-M-030': 'THR', 'SES-M-010': 'VO2', 'SES-M-027': 'VO2',
  'SES-M-028': 'VO2', 'SES-M-029': 'VO2', 'SES-M-011': 'MSP', 'SES-M-031': 'DUR',
};
/** ses.entry_rung / ses.top_rung, index by level 0…4 (06 §2d table). */
export const ENTRY_RUNG: Record<string, number[]> = {
  'SES-M-008': [0, 0, 0, 5, 7], 'SES-M-009': [0, 0, 0, 3, 5], 'SES-M-010': [0, 0, 2, 4], 'SES-M-011': [0, 0, 2, 4],
  'SES-M-027': [0, 0, 2, 3], 'SES-M-028': [0, 0, 1, 3], 'SES-M-029': [0, 0, 2, 3], 'SES-M-030': [0, 0, 0, 1, 2], 'SES-M-031': [0, 0, 0, 1, 2],
};
export const TOP_RUNG: Record<string, number[]> = {
  'SES-M-008': [5, 5, 5, 7, 9], 'SES-M-009': [5, 5, 5, 7, 8], 'SES-M-010': [3, 3, 5, 7], 'SES-M-011': [7, 7, 9, 10],
  'SES-M-027': [2, 2, 4, 5], 'SES-M-028': [2, 2, 4, 5], 'SES-M-029': [2, 2, 4, 4], 'SES-M-030': [2, 2, 2, 3, 4], 'SES-M-031': [3, 3, 3, 3, 3],
};

/** One block of a rung: reps × rep_s at effort, rec_s between reps, rec_after_s after the block. */
export interface Block { effort: 'E2' | 'E3' | 'E4' | 'race'; reps: number; rep_s: number; rec_s?: number; rec_after_s?: number }

// 06 §2d time-form ladders (index 0 = start). Recoveries as the §2d table states them.
const iv = (effort: Block['effort'], reps: number, repMin: number, recS: number): Block[] => [{ effort, reps, rep_s: repMin * 60, rec_s: recS }];
export const LADDER: Record<string, Block[][]> = {
  'SES-M-008': [[3, 5], [3, 6], [3, 7], [3, 8], [4, 8], [5, 8], [4, 11], [4, 12], [5, 11], [5, 12]].map(([r, m]) => iv('E3', r, m, 120)),
  'SES-M-009': [
    ...[15, 20, 25, 30, 35, 40].map((m) => iv('E3', 1, m, 0)),
    iv('E3', 2, 25, 180), iv('E3', 3, 18, 180), iv('E3', 2, 30, 180),
  ],
  'SES-M-010': [[5, 2, 120], [6, 2, 120], [5, 3, 180], [6, 3, 180], [5, 4, 180], [6, 4, 180], [7, 4, 180], [6, 5, 180]].map(([r, m, rec]) => iv('E4', r, m, rec)),
  'SES-M-027': [[10, 60], [12, 60], [15, 60], [12, 90], [14, 90], [16, 90]].map(([r, s]) => [{ effort: 'E4', reps: r, rep_s: s, rec_s: s }]),
  'SES-M-028': [[8, 60], [10, 60], [12, 60], [8, 90], [10, 90], [12, 90]].map(([r, s]) => [{ effort: 'E4', reps: r, rep_s: s, rec_s: 2 * s }]),
  'SES-M-029': [
    [{ effort: 'E4', reps: 8, rep_s: 60, rec_s: 60 }],
    [60, 120, 180, 120, 60].map((s, i, a) => ({ effort: 'E4' as const, reps: 1, rep_s: s, ...(i < a.length - 1 ? { rec_after_s: s } : {}) })),
    [{ effort: 'E4', reps: 10, rep_s: 60, rec_s: 60 }],
    [{ effort: 'E4', reps: 6, rep_s: 120, rec_s: 60 }],
    [{ effort: 'E4', reps: 8, rep_s: 120, rec_s: 60 }],
  ],
  'SES-M-030': [[1, 15, 4], [1, 20, 6], [2, 12, 6], [2, 15, 8], [2, 18, 8]].map(([r, m, n]) => [
    { effort: 'E3', reps: r, rep_s: m * 60, rec_s: 120, rec_after_s: 180 },
    { effort: 'E4', reps: n, rep_s: 60, rec_s: 60 },
  ]),
};

/** Work (E2–E4/race time) and full session time (warm-up 600 + blocks + recoveries + cool-down 300) of a rung. */
export function rungTimes(blocks: Block[]): { work_s: number; session_s: number } {
  let work = 0, rec = 0;
  for (const b of blocks) {
    work += b.reps * b.rep_s;
    rec += (b.reps - 1) * (b.rec_s ?? 0) + (b.rec_after_s ?? 0);
  }
  return { work_s: work, session_s: 600 + work + rec + 300 };
}

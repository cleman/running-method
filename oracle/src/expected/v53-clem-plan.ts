// Task 3 (v5.3): the hand-computed experienced-path plan of the owner's case, fixture v53-clem-confirmed.
// The derivation, rule by rule, is in oracle/plans/v53-clem-experienced.md; the arithmetic of every number is
// repeated in the comments. Day-0 plan only (the projection of 07 §2b / SES-028: every session as intended).
// Weeks 1–6 and BUILD week 9 are the task; weeks 7–8 are filled by the same rules so that the self-test can render a
// contiguous plan (status 'assumed').
import type { Status } from './hand-values.js';
import { LADDER, rungTimes, type Block } from '../v53-params.js';

export interface V53Key {
  day: string;
  module: string;
  /** index into ses.dose.<module>.steps */
  step: number;
  /** alternative step under an open question */
  alt_step?: number;
  /** per work block: the track distance shown for one repeat (null = time form kept); recovery jog in metres */
  dist: { rep_m: number | null; rec_m: number | null }[];
  /** card text, distance form / time form */
  text_dist: string;
  text_time: string;
}
export interface V53Week {
  index: number;
  phase: 'BASE' | 'BUILD';
  is_deload: boolean;
  is_calibration: boolean;
  long_run_form: 'a' | 'b' | null;
  V_s: number;
  LR_s: number;
  alt_LR_s?: number;
  keys: V53Key[];
  /** alternative key days under an open question */
  alt_days?: string[];
  easy: Record<string, number>;
  strides_runs: number;
  status: Status;
  oq?: string;
}

/** Session time of a key at a step: 600 warm-up + work + recoveries + 300 cool-down (06 §2c). */
export const keyS = (k: V53Key) => rungTimes(LADDER[k.module][k.step]).session_s;
export const keyWorkS = (k: V53Key) => rungTimes(LADDER[k.module][k.step]).work_s;
export const blocksOf = (k: V53Key): Block[] => LADDER[k.module][k.step];

// ---- shared values (plan §2–§4) ----
// L30_eff = 0.9 × 9960 = 8964 s (GEN-011 v5.3, no TOL cap); LR = round_down(min(1.10 × 8964, L_target 8964,
// max(lr_cap 0.30 × 28800 = 8640, L_hold 8964))) = round_down(8964, 60) = 8940 s (149 min).
export const L30_EFF_S = 8964;
const LR = 8940;
// Deload (LOD-040): 0.75 × 8940 = 6705 → 6660 s (111 min); alternative 0.75 × L_hold 8964 = 6723 → 6720 (OQ-03).
const LR_D = 6660, LR_D_ALT = 6720;
const V = 28800, V_D = 21600; // V_peak = min(600, max(V_req, V_hold 480, V_next 450)) = 480 min; deload 0.75 × 480 = 360

// Keys (06 §2d entry rungs at THR 3 / VO2 2; projection one rung per instance, SES-028).
const thrCal = (day: string): V53Key => ({ day, module: 'SES-M-008', step: 5, dist: [{ rep_m: 2000, rec_m: 400 }],
  text_dist: '5 × 2000 m at threshold (≈ 3:50–4:05 /km), 400 m jog', text_time: '5 × 8 min at threshold, 2 min jog' });
const vo2Cal = (day: string): V53Key => ({ day, module: 'SES-M-010', step: 2, dist: [{ rep_m: 800, rec_m: 600 }],
  text_dist: '5 × 800 m at 5K effort (≈ 3:30–3:40 /km), 600 m jog', text_time: '5 × 3 min at 5K effort, 3 min jog' });

export const CLEM_WEEKS: V53Week[] = [
  // Week 1 — BASE, calibration (EXP-003): SES-M-008 then SES-M-010 at the entry rung; days Mon/Thu when no
  // previous plan week exists (SES-004 gap score: points Mon 0, Thu 3, Sun 6 → gaps 3, 3); alternative Tue/Thu
  // if the claimed Sunday run counts as "the previous week's long run" (OQ-32).
  // Easy fill: 28800 − 8940 − 3780 − 2520 = 13560 s over Tue, Wed, Fri, Sat (Sat cap min(0.5 × 8940, 1.6 × 8964 −
  // 8940) = 4470 → 4440); h = 3390 → 3360 each, leftover 120 → Tue 3420, Wed 3420.
  { index: 1, phase: 'BASE', is_deload: false, is_calibration: true, long_run_form: null, V_s: V, LR_s: LR,
    keys: [thrCal('Mon'), vo2Cal('Thu')], alt_days: ['Tue', 'Thu'],
    easy: { Tue: 3420, Wed: 3420, Fri: 3360, Sat: 3360 }, strides_runs: 2, status: 'assumed', oq: 'OQ-32' },
  // Weeks 2–3 — the same sessions (no step-up inside calibration), Tue/Thu (points Sun −1, Tue 1, Thu 3, Sun 6;
  // min gap 2; ties → no key on Monday after the long run, then earliest). Easy Mon (cap 4440), Wed, Fri, Sat.
  ...[2, 3].map((i): V53Week => ({ index: i, phase: 'BASE', is_deload: false, is_calibration: true, long_run_form: null, V_s: V, LR_s: LR,
    keys: [thrCal('Tue'), vo2Cal('Thu')], easy: { Mon: 3420, Wed: 3420, Fri: 3360, Sat: 3360 }, strides_runs: 2, status: 'firm' })),
  // Week 4 — BASE deload (deload.every 4): V 21600, LR 6660, one key (SES-016) at its "start dose": read as the
  // entry rung 5 (alternative: index 0, 3 × 5 min; OQ-29), Wed (gaps 3/4 to the long runs; earliest).
  // Easy: 21600 − 6660 − 3780 = 11160 over Mon (cap 4440), Tue, Thu, Fri, Sat (cap min(3330, 7644) → 3300…);
  // h = 2232 → 2220 each, leftover 60 → Mon 2280.
  { index: 4, phase: 'BASE', is_deload: true, is_calibration: false, long_run_form: null, V_s: V_D, LR_s: LR_D, alt_LR_s: LR_D_ALT,
    keys: [{ ...thrCal('Wed'), alt_step: 0 }], easy: { Mon: 2280, Tue: 2220, Thu: 2220, Fri: 2220, Sat: 2220 }, strides_runs: 2, status: 'assumed', oq: 'OQ-29' },
  // Week 5 — BASE: 1 key (SES-007 BASE 1; Q-E34), threshold family (SES-026: no node has a gap), SES-M-008 one rung
  // above its last non-deload instance (week 3, step 5) → step 6 = 4 × 11 min: 600 + 2640 + 360 + 300 = 3900 s.
  // 660 s × 4.2147 m/s = 2782 m → 3000 m (+7.8 %, within 10 %). Easy: 28800 − 8940 − 3900 = 15960 over five days,
  // Mon cap 3330 (after the deload long run); 15960 / 5 = 3192 ≤ caps → 3180 each, leftover 60 → Mon 3240.
  { index: 5, phase: 'BASE', is_deload: false, is_calibration: false, long_run_form: null, V_s: V, LR_s: LR,
    keys: [{ day: 'Wed', module: 'SES-M-008', step: 6, dist: [{ rep_m: 3000, rec_m: 400 }], text_dist: '4 × 3 km at threshold (≈ 3:50–4:05 /km), 400 m jog', text_time: '4 × 11 min at threshold, 2 min jog' }],
    easy: { Mon: 3240, Tue: 3180, Thu: 3180, Fri: 3180, Sat: 3180 }, strides_runs: 2, status: 'firm' },
  // Week 6 — step 7 = 4 × 12 min (top rung for THR 3): 600 + 2880 + 360 + 300 = 4140 s; 720 × 4.2147 = 3035 → 3 km.
  // Easy: 28800 − 8940 − 4140 = 15720 → 3144 → 3120 each, leftover 120 → Mon 3180, Tue 3180.
  { index: 6, phase: 'BASE', is_deload: false, is_calibration: false, long_run_form: null, V_s: V, LR_s: LR,
    keys: [{ day: 'Wed', module: 'SES-M-008', step: 7, dist: [{ rep_m: 3000, rec_m: 400 }], text_dist: '4 × 3 km at threshold (≈ 3:50–4:05 /km), 400 m jog', text_time: '4 × 12 min at threshold, 2 min jog' }],
    easy: { Mon: 3180, Tue: 3180, Thu: 3120, Fri: 3120, Sat: 3120 }, strides_runs: 2, status: 'firm' },
  // Week 7 — as week 6 (step 7 is the top rung; SES-027). Not part of the task: filled for the self-test.
  { index: 7, phase: 'BASE', is_deload: false, is_calibration: false, long_run_form: null, V_s: V, LR_s: LR,
    keys: [{ day: 'Wed', module: 'SES-M-008', step: 7, dist: [{ rep_m: 3000, rec_m: 400 }], text_dist: '4 × 3 km at threshold, 400 m jog', text_time: '4 × 12 min at threshold, 2 min jog' }],
    easy: { Mon: 3180, Tue: 3180, Thu: 3120, Fri: 3120, Sat: 3120 }, strides_runs: 2, status: 'assumed' },
  // Week 8 — BASE deload, as week 4. Not part of the task.
  { index: 8, phase: 'BASE', is_deload: true, is_calibration: false, long_run_form: null, V_s: V_D, LR_s: LR_D, alt_LR_s: LR_D_ALT,
    keys: [{ ...thrCal('Wed'), alt_step: 0 }], easy: { Mon: 2280, Tue: 2220, Thu: 2220, Fri: 2220, Sat: 2220 }, strides_runs: 2, status: 'assumed', oq: 'OQ-29' },
  // Week 9 — first BUILD week, loading index 0 → form a (exp.long_quality_pattern BUILD [a, b]); 7 runs ≥ 6 and
  // TOL 3 → 3 keys. Rotation (SES-030): THR after SES-M-008 → SES-M-009; VO2 after SES-M-010 → SES-M-027; third slot
  // from the family with the larger 10K weight (THR .30 > VO2 .20) → next THR member not in the week → SES-M-030.
  // First instances at their entry rungs: SES-M-009 step 3 (30 min), SES-M-027 step 2 (15 × 60 s), SES-M-030 step 1
  // (20 min E3 + 6 × 1 min E4). Days: points Sun −1 and Sun 6 plus three non-adjacent keys → Tue/Thu/Sat (only set
  // without a Monday key). Slots in rank order on the days in date order (OQ-17).
  // Easy: 28800 − 8940 − (2700 + 2640 + 2940) = 11580 over Mon (cap 3330 after the deload long run), Wed, Fri;
  // h = 4125 → Mon 3300, Wed 4080, Fri 4080, leftover 120 → Wed 4140, Fri 4140 (Mon would pass its cap).
  { index: 9, phase: 'BUILD', is_deload: false, is_calibration: false, long_run_form: 'a', V_s: V, LR_s: LR,
    keys: [
      { day: 'Tue', module: 'SES-M-009', step: 3, dist: [{ rep_m: 8000, rec_m: null }], text_dist: '8 km at threshold (≈ 3:50–4:05 /km)', text_time: '30 min at threshold' },
      { day: 'Thu', module: 'SES-M-027', step: 2, dist: [{ rep_m: 300, rec_m: 200 }], text_dist: '15 × 300 m at 5K effort (≈ 3:30–3:40 /km), 200 m jog', text_time: '15 × 1 min at 5K effort, 1 min jog' },
      { day: 'Sat', module: 'SES-M-030', step: 1, dist: [{ rep_m: 5000, rec_m: 600 }, { rep_m: 300, rec_m: 200 }], text_dist: '5 km at threshold, 600 m jog, then 6 × 300 m at 5K effort, 200 m jog', text_time: '20 min at threshold, 3 min jog, then 6 × 1 min at 5K effort, 1 min jog' },
    ],
    easy: { Mon: 3300, Wed: 4140, Fri: 4140 }, strides_runs: 2, status: 'assumed', oq: 'OQ-17' },
];

/** Values that do not depend on the week. */
export const CLEM_EXPECT = {
  fixture: 'v53-clem-confirmed',
  agegrade_pct: 71.54, // men's table (lower than women's 78.68; sex unknown, INP-032)
  levels: { HAB: 3, TOL: 3, AER: 3, DUR: 3, THR: 3, VO2: 2, MSP: 0 },
  phases: 'BASE:1+8 BUILD:9+8 SPECIFIC:17+4 TAPER:21+2',
  deload_weeks: [4, 8, 12, 16],
  L30_eff_s: L30_EFF_S,
  /** pace ranges [fast, slow] s/km; reading A (round, then widen) and B (widen the unrounded edge), OQ-27 */
  pace: { A: { E3: [230, 245], E4: [210, 220], E1: [275, 365] }, B: { E3: [230, 250], E4: [210, 225], E1: [275, 365] } },
  paces_until: '2027-02-22', // race 2026-10-25 + anchor.max_age_days 120
  status: 'firm' as Status,
};

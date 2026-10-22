// Item (d): hand-computed expected values from the worked examples (13) and the oracle list of 14 §10e,
// recomputed by the oracle from the module text. Each value shows its arithmetic in a comment.
//
// status
//   firm      the spec text gives one answer and 13/14 agree with it
//   conflict  13/14 and the module text give different numbers; `value` is 13's, `alt` the strict text's.
//             The engine may match either; the test reports which (SPEC-QUESTIONS lists the conflict).
//   assumed   depends on a reading the oracle had to choose (named OQ in SPEC-QUESTIONS.md)
//
// Rounding: spec/schema/README.md §2 says "rounded down to an integer second at once"; 13 shows band edges
// rounded to the nearest second. Band values therefore carry tol = 2 s (OQ-02).
import type { Result, Week } from '../types.js';

export type Status = 'firm' | 'conflict' | 'assumed';
export interface HandValue {
  id: string;
  fixture: string;
  /** 'day0' = the first call; a number = the call of that plan week's Monday in the as_planned replay. */
  call: 'day0' | number;
  what: string;
  source: string;
  get: (r: Result) => unknown;
  value: unknown;
  alt?: unknown[];
  tol?: number;
  status: Status;
  oq?: string;
  release: 'MVP' | 'R2' | 'R3';
}

const band = (r: Result) => r.feasibility?.predicted_band;
const wk = (r: Result, index: number): Week | undefined => r.plan?.weeks.find((w) => w.index === index);
const reasons = (r: Result) => r.feasibility?.reasons ?? [];
const minutes = (s: number | undefined | null) => (s == null ? s : Math.floor(s / 60));

export const HAND_VALUES: HandValue[] = [
  // ---------------- P2 Tom, day 0 (13 §2; 14 §10e "Tom's day-0 fast edge 47:24") ----------------
  // Anchor 10K 52:00 = 3120 s, entered 42 days late → estimated (INP-005). Same distance: P = 3120.
  // P_race = 3120 × (1 − 0.02) = 3057.6 s  (13: 50:58)
  { id: 'tom.d0.p_race', fixture: 'p2-tom', call: 'day0', what: 'P_race', source: '13 §2; 03 §3', get: (r) => band(r)?.p_race_s, value: 3058, alt: [3057], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  // fast edge = 3057.6 × (1 − 0.07) = 2843.57  (13 and 14 §10e: 47:24 = 2844; floor of floored P_race: 3057 × 0.93 = 2843.01 → 2843)
  { id: 'tom.d0.fast_edge', fixture: 'p2-tom', call: 'day0', what: 'fast edge', source: '13 §2; 14 §10e', get: (r) => band(r)?.fast_edge_s, value: 2844, alt: [2843], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  // B_slow = 7 % × 1.5 (estimated anchor) = 10.5 %; slow edge = 3057.6 × 1.105 = 3378.65 (13: 56:19 = 3379)
  { id: 'tom.d0.slow_edge', fixture: 'p2-tom', call: 'day0', what: 'slow edge', source: '13 §2', get: (r) => band(r)?.slow_edge_s, value: 3379, alt: [3377, 3378], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  { id: 'tom.d0.b_slow', fixture: 'p2-tom', call: 'day0', what: 'B_slow', source: '03 §3: 0.07 × 1.5', get: (r) => band(r)?.b_slow, value: 0.105, tol: 1e-9, status: 'firm', release: 'MVP' },
  // B_fast is never widened (03 §3); the anchor is estimated so the 4 % same-distance width does not apply.
  { id: 'tom.d0.b_fast', fixture: 'p2-tom', call: 'day0', what: 'B_fast', source: '03 §3', get: (r) => band(r)?.b_fast, value: 0.07, tol: 1e-9, status: 'firm', release: 'MVP' },
  // target 2880 s: 2843.6 ≤ 2880 < 3057.6 → TARGET_IN_FAST_BAND (FEA-033) → stretch, headline ambitious
  { id: 'tom.d0.verdict', fixture: 'p2-tom', call: 'day0', what: 'verdict', source: '13 §1, §2', get: (r) => r.feasibility?.verdict, value: 'stretch', status: 'firm', release: 'MVP' },
  { id: 'tom.d0.reason', fixture: 'p2-tom', call: 'day0', what: 'TARGET_IN_FAST_BAND present', source: 'FEA-033', get: (r) => reasons(r).includes('TARGET_IN_FAST_BAND'), value: true, status: 'firm', release: 'MVP' },
  { id: 'tom.d0.label', fixture: 'p2-tom', call: 'day0', what: 'ESTIMATED_INPUTS label', source: 'FEA-035', get: (r) => r.feasibility?.labels.includes('ESTIMATED_INPUTS'), value: true, status: 'firm', release: 'MVP' },
  { id: 'tom.d0.pace_mode', fixture: 'p2-tom', call: 'day0', what: 'effort only on day 0 (estimated anchor, INV-15)', source: '13 §2 MSG-ONBOARD-NOPACE', get: (r) => r.plan?.pace_mode, value: 'effort_only', status: 'firm', release: 'MVP' },
  // GEN-011: L30_eff = 0.9 × 75 min = 67.5 min = 4050 s (13 writes 67, the minute floor)
  { id: 'tom.d0.l30_eff', fixture: 'p2-tom', call: 'day0', what: 'L30_eff_time_s', source: '13 §2 GEN-011', get: (r) => r.state?.L30_eff_time_s, value: 4050, alt: [4020], status: 'conflict', oq: 'OQ-03', release: 'MVP' },

  // ---------------- P2 Tom after FT-1 (end of week 2; replay call of week 3) ----------------
  // FT-1 3 km 14:20 = 860 s measured. 10K-equivalent = 860 × (10000/3000)^1.06 = 860 × 3.58304 = 3081.41 s (51:21)
  // P_race = 3081.41 × 0.98 = 3019.78 s (13: 50:20); 3 km ≠ goal distance → B_fast 7 %; ratio 3.33 < 4.5 → not widened.
  // fast = 3019.78 × 0.93 = 2808.40 (46:48 = 2808 ✓); slow = 3019.78 × 1.07 = 3231.17 (53:51 = 3231 ✓)
  { id: 'tom.ft1.p_race', fixture: 'p2-tom', call: 3, what: 'P_race after FT-1', source: '13 §2', get: (r) => band(r)?.p_race_s, value: 3020, alt: [3019], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  { id: 'tom.ft1.fast_edge', fixture: 'p2-tom', call: 3, what: 'fast edge after FT-1', source: '13 §2; 14 §10e', get: (r) => band(r)?.fast_edge_s, value: 2808, alt: [2807], tol: 1, status: 'firm', release: 'MVP' },
  // OQ-04: the older estimated 10K anchor is still one of the two anchors; 03 §3 "if any anchor is estimated"
  // would widen B_slow to 10.5 % (slow edge 3336.9); 13 says "not widened" (3231). Value = 13.
  { id: 'tom.ft1.slow_edge', fixture: 'p2-tom', call: 3, what: 'slow edge after FT-1', source: '13 §2', get: (r) => band(r)?.slow_edge_s, value: 3231, alt: [3230, 3336, 3337], tol: 1, status: 'conflict', oq: 'OQ-04', release: 'MVP' },
  // E3 pace: CS = 10000 / 3081.41 = 3.2453 m/s; × [0.92, 0.97] → 2.9857–3.1479 m/s → 334.94–317.67 s/km
  // rounded to the nearest 5 s (pace.round_s; 13's Tom and Ana values are reproduced by nearest) → 320–335 (5:20–5:35)
  { id: 'tom.ft1.e3_pace', fixture: 'p2-tom', call: 3, what: 'E3 pace range of the week', source: '13 §2; 03 §3b', get: (r) => firstPace(r, 'E3'), value: [320, 335], tol: 5, status: 'assumed', oq: 'OQ-06', release: 'MVP' },

  // ---------------- Lea (TST-122; 14 §10e "Lea's range 47:02–52:26") ----------------
  // 10K 50:00 measured 40 days ago, same distance, ≤ 56 days → B_fast = 4 % (03 §3 v3); B_slow 7 %.
  // P_race = 3000 × 0.98 = 2940 (49:00); fast = 2940 × 0.96 = 2822.4 (47:02); slow = 2940 × 1.07 = 3145.8 (52:26)
  { id: 'lea.p_race', fixture: 'lea-goal-switch', call: 'day0', what: 'P_race', source: '13 §7a', get: (r) => band(r)?.p_race_s, value: 2940, status: 'firm', release: 'MVP' },
  { id: 'lea.fast_edge', fixture: 'lea-goal-switch', call: 'day0', what: 'fast edge', source: '13 §7a; 14 §10e', get: (r) => band(r)?.fast_edge_s, value: 2822, status: 'firm', release: 'MVP' },
  { id: 'lea.slow_edge', fixture: 'lea-goal-switch', call: 'day0', what: 'slow edge', source: '13 §7a; 14 §10e', get: (r) => band(r)?.slow_edge_s, value: 3146, alt: [3145], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  // target 48:30 = 2910: 2822.4 ≤ 2910 < 2940 → TARGET_IN_FAST_BAND → stretch
  { id: 'lea.verdict', fixture: 'lea-goal-switch', call: 'day0', what: 'verdict', source: '13 §7a', get: (r) => r.feasibility?.verdict, value: 'stretch', status: 'firm', release: 'MVP' },
  // LOD-005 carry-over: L_hold = min(L30_eff 160, max(L_target_new 60, lr_cap 0.40 × V_hold 330 = 132)) = 132 min
  { id: 'lea.l_hold', fixture: 'lea-goal-switch', call: 'day0', what: 'L_hold after the goal change', source: '13 §7a ADP-080', get: (r) => r.state?.L_hold_s, value: 7920, tol: 60, status: 'firm', release: 'MVP' },

  // ---------------- Karim (TST-127; 14 §10e "Karim 52:52–62:48") ----------------
  // 10K 58:00 = 3480 estimated. P_race = 3480 × 0.98 = 3410.4 (56:50); fast = 3410.4 × 0.93 = 3171.67 (52:52)
  // slow = 3410.4 × 1.105 = 3768.49 (1:02:48)
  { id: 'karim.p_race', fixture: 'karim', call: 'day0', what: 'P_race', source: '13 §7b', get: (r) => band(r)?.p_race_s, value: 3410, tol: 1, status: 'firm', release: 'MVP' },
  { id: 'karim.fast_edge', fixture: 'karim', call: 'day0', what: 'fast edge', source: '13 §7b; 14 §10e', get: (r) => band(r)?.fast_edge_s, value: 3172, alt: [3171], tol: 1, status: 'conflict', oq: 'OQ-02', release: 'MVP' },
  { id: 'karim.slow_edge', fixture: 'karim', call: 'day0', what: 'slow edge', source: '13 §7b; 14 §10e', get: (r) => band(r)?.slow_edge_s, value: 3768, tol: 1, status: 'firm', release: 'MVP' },
  // FEA-021: time 10K requires THR 2, VO2 2, MSP 1 (02 §5); Karim holds 0 → K_key = max(2, 2, 1) × 4 = 8
  // W − taper − P0 = 10 − 2 − 2 = 6 < 8 → LEVELS_UNREACHABLE → infeasible
  { id: 'karim.k_key', fixture: 'karim', call: 'day0', what: 'K_key', source: '13 §7b FEA-021', get: (r) => r.feasibility?.weeks_needed?.K_key, value: 8, status: 'firm', release: 'MVP' },
  { id: 'karim.verdict', fixture: 'karim', call: 'day0', what: 'verdict', source: '13 §7b', get: (r) => r.feasibility?.verdict, value: 'infeasible', status: 'firm', release: 'MVP' },
  { id: 'karim.reason', fixture: 'karim', call: 'day0', what: 'LEVELS_UNREACHABLE present', source: '13 §7b', get: (r) => reasons(r).includes('LEVELS_UNREACHABLE'), value: true, status: 'firm', release: 'MVP' },
  { id: 'karim.kind', fixture: 'karim', call: 'day0', what: 'result kind', source: '12 §3.12', get: (r) => r.kind, value: 'fail_closed', status: 'firm', release: 'MVP' },
  // move_date: K_key 8 ≤ W − 2 − 2 needs W ≥ 12 → Sunday of week 12 = 2027-01-24 ("race on or after week 12")
  { id: 'karim.move_date', fixture: 'karim', call: 'day0', what: 'move_date option race date', source: '13 §7b; 03 §6', get: (r) => r.feasibility?.options?.find((o) => o.kind === 'move_date')?.new_goal?.race_date, value: '2027-01-24', status: 'firm', release: 'MVP' },
  // lower_goal: target = P_race rounded up to 60 s = 3420 still needs THR 2 / VO2 2 → still LEVELS_UNREACHABLE → "finish"
  { id: 'karim.lower_goal', fixture: 'karim', call: 'day0', what: 'lower_goal option is a finish goal', source: '13 §7b; 03 §6', get: (r) => r.feasibility?.options?.find((o) => o.kind === 'lower_goal')?.new_goal?.goal_type, value: 'finish', status: 'firm', release: 'MVP' },
  // shorter_distance: 03 §6 keeps goal_type = time at the shorter distance; a 5K time goal requires VO2 2 (02 §5):
  // K_key = 2 × 4 = 8 > 6 → infeasible → FEA-041 drops it. 13 §7b lists it. Oracle value: absent.
  { id: 'karim.shorter_distance', fixture: 'karim', call: 'day0', what: 'shorter_distance option offered', source: '13 §7b vs 03 §6 + 02 §5', get: (r) => !!r.feasibility?.options?.some((o) => o.kind === 'shorter_distance'), value: false, alt: [true], status: 'conflict', oq: 'OQ-08', release: 'MVP' },

  // ---------------- P1 Maya (13 §5; 14 §10e "Maya LADDER_RUNWALK 60 ≤ 66") ----------------
  // start ladder: rtr = ceil(9 × 3 / 3) = 9 (SAF-085); 5K finish: build = specific = 0, taper = 1 (04 §3 step 0)
  // slack = 10 − (9 + max(0, 2 − 9) + 0 + 0 + 1) = 0 → LOW_SLACK → stretch
  { id: 'maya.slack', fixture: 'p1-maya', call: 'day0', what: 'slack', source: '13 §1, §5; 03 §4', get: (r) => r.feasibility?.slack, value: 0, status: 'firm', release: 'MVP' },
  { id: 'maya.verdict', fixture: 'p1-maya', call: 'day0', what: 'verdict', source: '13 §1', get: (r) => r.feasibility?.verdict, value: 'stretch', status: 'firm', release: 'MVP' },
  { id: 'maya.low_slack', fixture: 'p1-maya', call: 'day0', what: 'LOW_SLACK present', source: 'FEA-034', get: (r) => reasons(r).includes('LOW_SLACK'), value: true, status: 'firm', release: 'MVP' },
  { id: 'maya.rtr', fixture: 'p1-maya', call: 'day0', what: 'weeks_needed.rtr', source: 'SAF-085', get: (r) => r.feasibility?.weeks_needed?.rtr, value: 9, status: 'firm', release: 'MVP' },
  { id: 'maya.taper', fixture: 'p1-maya', call: 'day0', what: 'weeks_needed.taper', source: '04 §3 step 0', get: (r) => r.feasibility?.weeks_needed?.taper, value: 1, status: 'firm', release: 'MVP' },
  // 5K finish L_req_time = race.5k_finish_lr_min = 30 min (03 §2)
  { id: 'maya.l_req', fixture: 'p1-maya', call: 'day0', what: 'L_req_time', source: '13 §5; 03 §2', get: (r) => r.feasibility?.demand?.L_req_time_s, value: 1800, status: 'firm', release: 'MVP' },
  { id: 'maya.no_deload', fixture: 'p1-maya', call: 'day0', what: 'no deload in the start ladder', source: '04 §3 step 0', get: (r) => r.plan?.weeks.some((w) => w.is_deload), value: false, status: 'firm', release: 'MVP' },
  // week 1: S1 = 5-min walk + 20 min of 60 s run / 90 s walk = 25 min a session, 3 sessions = 75 min
  { id: 'maya.wk1.V', fixture: 'p1-maya', call: 'day0', what: 'week 1 time (min)', source: '13 §5', get: (r) => minutes(wk(r, 1)?.planned_time_s), value: 75, status: 'firm', release: 'MVP' },
  { id: 'maya.wk1.rung', fixture: 'p1-maya', call: 'day0', what: 'week 1 rung', source: '13 §5', get: (r) => wk(r, 1)?.sessions.find((s) => s.is_run)?.ladder?.rung, value: 'S1', status: 'firm', release: 'MVP' },
  // nothing logged in week 7 → race week at S8. 5 km × 660 s/km + 300 s = 3600 s ≤ 2.0 × S8 (28 + 5 = 33 min = 1980 s) = 3960 s
  // → degraded completion: stretch with DEGRADED_COMPLETION, race kept as run-walk
  { id: 'maya.ladder_runwalk', fixture: 'p1-maya-wk7-unlogged', call: 10, what: 'DEGRADED_COMPLETION in race week', source: '13 §5; 14 §10e', get: (r) => reasons(r).includes('DEGRADED_COMPLETION'), value: true, status: 'firm', release: 'MVP' },

  // ---------------- red-team fixtures (13 §7c; 14 TST-095…106) ----------------
  { id: 'tst095.kind', fixture: 'tst095-unsure-chest-item', call: 'day0', what: 'kind', source: 'TST-095', get: (r) => r.kind, value: 'gate_stop', status: 'firm', release: 'MVP' },
  { id: 'tst095.gate', fixture: 'tst095-unsure-chest-item', call: 'day0', what: 'gate', source: 'TST-095 (unknown item → no_plan)', get: (r) => r.gate, value: 'no_plan', status: 'firm', release: 'MVP' },
  // TST-101: L30_eff from claims ≤ claim.l30_cap_by_tol[2] = 90 min → first long run ≤ 1.10 × 90 = 99 min
  { id: 'tst101.first_lr', fixture: 'tst101-novice-inflated', call: 'day0', what: 'first long run ≤ 99 min', source: 'TST-101', get: (r) => (wk(r, 1)?.lr_s ?? 0) <= 99 * 60, value: true, status: 'firm', release: 'MVP' },
  // TST-102: HM after a HM run on 2026-11-01 needs 14 days → race 2026-11-08 is too soon
  { id: 'tst102.reason', fixture: 'tst102-weekly-goal-switch', call: 'day0', what: 'RACE_TOO_SOON', source: 'TST-102 FEA-044', get: (r) => reasons(r).includes('RACE_TOO_SOON'), value: true, status: 'firm', release: 'MVP' },
  // first allowed date = 2026-11-01 + 14 = 2026-11-15
  { id: 'tst102.move_date', fixture: 'tst102-weekly-goal-switch', call: 'day0', what: 'move_date on or after 2026-11-15', source: 'TST-102', get: (r) => (r.feasibility?.options?.find((o) => o.kind === 'move_date')?.new_goal?.race_date as string | undefined ?? '') >= '2026-11-15', value: true, status: 'firm', release: 'MVP' },
  { id: 'tst103.kind', fixture: 'tst103-birth-year-blank', call: 'day0', what: 'kind', source: 'TST-103', get: (r) => r.kind, value: 'hold', status: 'firm', release: 'MVP' },
  // born Feb 2008, onboarding 2026-10-21: age_low assumes the birthday on the last day of the month (29 Feb 2008,
  // a leap year) → 18th birthday 29 Feb 2026 ≤ 2026-10-21 → age_low = 18 → adult
  { id: 'tst104.age_low', fixture: 'tst104-born-feb-2008', call: 'day0', what: 'age_low', source: 'TST-104 INP-002', get: (r) => r.state?.age_low, value: 18, status: 'firm', release: 'MVP' },
  { id: 'tst104.kind', fixture: 'tst104-born-feb-2008', call: 'day0', what: 'a plan (adult flow, no guardian hold)', source: 'TST-104', get: (r) => r.kind, value: 'plan', status: 'firm', release: 'MVP' },
  // TST-105a: at S5 the longest logged ladder session is 26 min → 2 × 26 = 52 < 60 → no degraded completion
  { id: 'tst105a.kind', fixture: 'tst105a-race-week-at-s5', call: 'day0', what: 'kind (earliest date offered)', source: 'TST-105; 13 §7c', get: (r) => r.kind, value: 'fail_closed', status: 'firm', release: 'MVP' },
  // TST-105b: at S6, 30 min → 60 ≤ 60 → race kept as run-walk (DEGRADED_COMPLETION)
  { id: 'tst105b.reason', fixture: 'tst105b-race-week-at-s6', call: 'day0', what: 'DEGRADED_COMPLETION', source: 'TST-105', get: (r) => reasons(r).includes('DEGRADED_COMPLETION'), value: true, status: 'firm', release: 'MVP' },

  // ---------------- plenary fixtures (13 §7a/b) ----------------
  // Raj: W = 4 → H1 → SHARPEN; FEA-023: L30 17.0 km measured ≥ 21.097 / 1.30 = 16.23 km → demand met → feasible
  { id: 'raj.verdict', fixture: 'raj-hm-4wk', call: 'day0', what: 'verdict', source: '13 §7a TST-124', get: (r) => r.feasibility?.verdict, value: 'feasible', status: 'firm', release: 'MVP' },
  { id: 'raj.sharpen', fixture: 'raj-hm-4wk', call: 'day0', what: 'SHARPEN phase present', source: '04 §2 H1', get: (r) => !!r.plan?.phases.some((p) => p.type === 'SHARPEN'), value: true, status: 'firm', release: 'MVP' },
  { id: 'raj.no_deload', fixture: 'raj-hm-4wk', call: 'day0', what: 'no deload (W < 6)', source: 'PHS-003', get: (r) => r.plan?.weeks.some((w) => w.is_deload), value: false, status: 'firm', release: 'MVP' },
  { id: 'mia.reason', fixture: 'mia-2-days', call: 'day0', what: 'AVAILABILITY_DAYS', source: '13 §7a TST-125', get: (r) => reasons(r).includes('AVAILABILITY_DAYS'), value: true, status: 'firm', release: 'MVP' },
  { id: 'mia.first_option', fixture: 'mia-2-days', call: 'day0', what: 'first option kind', source: '13 §7a; FEA-040', get: (r) => r.feasibility?.options?.slice().sort((a, b) => a.rank - b.rank)[0]?.kind, value: 'change_availability', status: 'firm', release: 'MVP' },
  { id: 'mia.base_plan', fixture: 'mia-2-days', call: 'day0', what: 'base_plan option validates', source: '13 §7a', get: (r) => !!r.feasibility?.options?.some((o) => o.kind === 'base_plan'), value: true, status: 'firm', release: 'MVP' },
  { id: 'rose.reasons', fixture: 'rose', call: 'day0', what: 'PHASES_DO_NOT_FIT and AVAILABILITY_DAYS', source: '13 §7b TST-128', get: (r) => reasons(r).includes('PHASES_DO_NOT_FIT') && reasons(r).includes('AVAILABILITY_DAYS'), value: true, status: 'firm', release: 'MVP' },
  { id: 'rose.first_option', fixture: 'rose', call: 'day0', what: 'combined option first', source: 'TST-128 FEA-040', get: (r) => r.feasibility?.options?.slice().sort((a, b) => a.rank - b.rank)[0]?.kind, value: 'change_availability+move_date', status: 'firm', release: 'MVP' },
  // Ben (restated): HM finish. S_slow = median logged speed 2.63125 m/s × 0.9 = 2.368125 m/s.
  // L_req = max(min(21097/1.30/2.368 = 6852.9 s, 9000), 21097/1.60/2.368 = 5568 s, DUR 2 = 5400 s) = 6852 s
  // V_req = max(AER 2 180 min, TOL 2 150, floor 150, max(6852/0.50, 6852/0.60) = 13704 s = 228.4 min) = 228.4 min
  // extra = 13704 − 190 × 60 = 2304 s = 38.4 min → 39 min rounded up (13 §7a's lost original said 60)
  { id: 'ben.extra_minutes', fixture: 'ben-availability', call: 'day0', what: 'change_availability extra minutes', source: '13 §7a (restated); 03 §2', get: (r) => r.feasibility?.options?.find((o) => o.kind === 'change_availability')?.new_goal && (r.feasibility?.options?.find((o) => o.kind === 'change_availability') as any)?.availability_change?.extra_minutes_per_week, value: 39, alt: [38, 60], status: 'assumed', oq: 'OQ-11', release: 'MVP' },

  // ---------------- P3 Ana (R2; 14 §10e list) ----------------
  // 03 §4 v5.2: slack = 18 − (0 + max(6, 2 − 0) + 1 + 4 + 3) = 4
  { id: 'ana.slack', fixture: 'p3-ana', call: 'day0', what: 'slack', source: '13 §3; 14 §10e', get: (r) => r.feasibility?.slack, value: 4, status: 'firm', release: 'R2' },
  // 04 §3: T 3, R 15, base 6: S = min(8, max(4, 15 − 6 − 1)) = 8; B = max(6, 2) = 6; U = 15 − 6 − 8 = 1
  { id: 'ana.phases', fixture: 'p3-ana', call: 'day0', what: 'phase outline', source: '13 §3; 14 §10e', get: (r) => r.plan?.phases.map((p) => `${p.type}:${p.start_week}+${p.n_weeks}`).join(' '), value: 'ONBOARD:1+2 BASE:3+4 BUILD:7+1 SPECIFIC:8+8 TAPER:16+3', alt: ['BASE:1+6 BUILD:7+1 SPECIFIC:8+8 TAPER:16+3'], status: 'assumed', oq: 'OQ-13', release: 'R2' },
  // L_req = max(min(42195/1.40 = 30139 m at 2.2857 m/s = 13186 s, 10800), 21097 m / 2.2857 = 9230 s) = 10800 s
  { id: 'ana.l_req', fixture: 'p3-ana', call: 'day0', what: 'L_req_time', source: '13 §3', get: (r) => r.feasibility?.demand?.L_req_time_s, value: 10800, status: 'firm', release: 'R2' },
  // distance stop = min(42195 / 1.40, 32 km) = 30139 m
  { id: 'ana.stop', fixture: 'p3-ana', call: 'day0', what: 'distance stop', source: '13 §3; 03 §2', get: (r) => r.feasibility?.demand?.distance_stop_m, value: 30139, tol: 1, status: 'firm', release: 'R2' },
  { id: 'ana.v_req', fixture: 'p3-ana', call: 'day0', what: 'V_req', source: '13 §3: max(AER, TOL, 240, 180/0.50 = 360)', get: (r) => r.feasibility?.demand?.V_req_time_s, value: 21600, status: 'firm', release: 'R2' },
  // weekly V (as published at the Monday, as_planned): LOD-003 slow 10 %/20 % from 210, LOD-007 from week 5
  // wk1 floor(1.10 × 210) = 231; wk2 min(254.1, 1.20 × 210 = 252) = 252; wk3 min(277.2, 1.20 × 231 = 277.2) = 277
  // wk4 deload floor(0.75 × 277) = 207; wk5 floor(1.10 × max(231, 252, 277, 207)) = 304; wk6 floor(1.10 × 304) = 334; wk7 360
  ...[[1, 231], [2, 252], [3, 277], [4, 207], [5, 304], [6, 334], [7, 360], [8, 270], [12, 270], [16, 288], [17, 234]].map(([w, v]) => ({
    id: `ana.wk${w}.V`, fixture: 'p3-ana', call: w, what: `week ${w} V (min)`, source: '13 §3; 14 §10e', get: (r: Result) => minutes(wk(r, w)?.planned_time_s), value: v, status: 'firm' as Status, release: 'R2' as const,
  })),
  // long runs: 13 floors L30_eff to 85 min first: 93, 102, 112, 84, 123, 135, 148, 111, 162, 178, 180, 135.
  // The strict seconds chain from 0.9 × 5700 = 5130 s gives round_down(5643, 60) = 5640 (94), then 103, 113, 84,
  // 124, 136, 149, 111, 163, 179, 180, 135 (OQ-03). 14 §10e names wk9 162, wk10 178, wk11 180, wk12 135.
  ...([[1, 93, 94], [2, 102, 103], [3, 112, 113], [4, 84, 84], [5, 123, 124], [6, 135, 136], [7, 148, 149], [8, 111, 111], [9, 162, 163], [10, 178, 179], [11, 180, 180], [12, 135, 135], [16, 144, 144], [17, 117, 117]] as const).map(([w, v, a]) => ({
    id: `ana.wk${w}.LR`, fixture: 'p3-ana', call: w as number, what: `week ${w} long run (min)`, source: '13 §3; 14 §10e', get: (r: Result) => minutes(wk(r, w)?.lr_s), value: v, alt: v === a ? undefined : [a], status: (v === a ? 'firm' : 'conflict') as Status, oq: v === a ? undefined : 'OQ-03', release: 'R2' as const,
  })),
];

function firstPace(r: Result, effort: string): [number, number] | null {
  for (const w of r.plan?.weeks ?? []) for (const s of w.sessions) {
    if (s.pace_range && (s.pace_range.effort === effort || s.effort_target === effort)) return [s.pace_range.fast_s_per_km, s.pace_range.slow_s_per_km];
  }
  return null;
}

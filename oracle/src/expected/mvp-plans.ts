// Item (e): the two hand-computed MVP plans, as checkable data. The derivation, step by step with the rule
// text it rests on, is in oracle/plans/*.md; the arithmetic of every number is repeated here.
// Fixtures: oracle/fixtures/mvp-10k-time-12wk.json and mvp-hm-time-14wk.json.
//
// Two views are given, because the spec defines two (07 §2b "Projection"; 13 §0):
//   day0      the plan returned by the FIRST call. Future instances show each module at its start dose
//             (never logged → "at its start dose"; later weeks repeat that step) and no level is projected.
//   published the week as published at its own Monday under the as_planned behaviour model (weekly replay).
//             Branches that depend on an open question carry `oq` and an alternative.
import type { Status } from './hand-values.js';

export interface KeyExp { day: string; module: string; dose: string; duration_s: number; e3_s: number; test?: string }
export interface WeekExp {
  index: number;
  phase: string;
  is_deload: boolean;
  taper_k: number | null;
  /** running volume, goal race and strength excluded (OQ-09) */
  V_s: number;
  LR_s: number;
  keys: KeyExp[];
  /** easy runs (day → duration); the strides key slot and the taper sharpener live on one of them */
  easy: Record<string, number>;
  /** runs carrying strides (E5 segments) */
  strides_runs: number;
  /** a strides key slot (CMP-007 fallback) is part of the week */
  strides_slot?: boolean;
  /** fuelling-practice target of the long run (NUT-010), null when none */
  fuel_g_h: number | null;
  /** level test carried by the long run (06 §3b DUR), if any */
  lr_test?: string;
  status: Status;
  oq?: string;
}
export interface PlanExp {
  fixture: string;
  verdict: string;
  reasons: string[];
  labels: string[];
  phases: string; // TYPE:start+n …
  deload_weeks: number[];
  weeks_needed: { rtr: number; onboard: number; base: number; build: number; specific: number; taper: number; G: number; n_L: number; n_V: number; K_key: number };
  slack: number;
  demand: { L_req_time_s: number; V_req_time_s: number; floor_dist_m: number };
  band: { p_race_s: number; fast_edge_s: number; slow_edge_s: number; b_fast: number; b_slow: number };
  e3_pace: [number, number];
  day0: WeekExp[];
  published: { week: number; expect: WeekExp | { kind: string; previous_plan_kept?: boolean; reason?: string; degraded?: boolean }; status: Status; oq?: string; branch?: string }[];
}

const T = 'Tue', W = 'Wed', F = 'Fri';
// SES-M-008 a × b min with 2 min jogs: 600 + a·b·60 + (a − 1)·120 + 300
const thr = (a: number, b: number, day = T, test?: string): KeyExp => ({ day, module: 'SES-M-008', dose: `${a}x${b}`, duration_s: 600 + a * b * 60 + (a - 1) * (test === 'THR1' ? 120 : 120) + 300, e3_s: a * b * 60, test });
// SES-M-012 progression run, n min, last 15 % at E3 (06 §2c)
const prog = (n: number, day = F): KeyExp => ({ day, module: 'SES-M-012', dose: `${n}min`, duration_s: n * 60, e3_s: Math.floor(n * 60 * 0.15) });

// ===================================================================================================
// Plan A — 10K time goal 52:00, 12 weeks, 4 runs (Tue, Wed, Fri, Sun), 240 min available
// ===================================================================================================
// Demand (03 §2): S_slow = 1000/360 × 0.9 = 2.5 m/s. L_ratio = (10000/1.25)/2.5 = 3200 s; floor = 8000 m / 2.5 =
// 3200 s; DUR 1 required → 60 min. L_req = max(min(3200, 9000), 3200, 3600) = 3600 s.
// Required levels (02 §5, closed): HAB 2, AER 2, TOL 2, DUR 1, THR 2, VO2 2, MSP 1.
// V_req = max(AER 2 180 min, TOL 2 150, floor 90, % term dropped because L_req ≤ lr.pct_floor_s 3600) = 10800 s.
// Weeks (03 §4): n_L = ⌈ln(3600/2520)/ln 1.10⌉ = ⌈3.742⌉ = 4; n_V = ⌈ln(180/120)/ln 1.15⌉ = ⌈2.901⌉ = 3;
// G = 4 + ⌊4/3⌋ = 5 (dry run: LR reaches 60 min and V 180 min in week 5 → G' = 5, settled).
// base = 5 − 1 − 2 = 2. slack = 12 − (0 + 2 + 1 + 2 + 2) = 5. K_key = max(THR 2, VO2 2, MSP 1) × 4 = 8 ≤ 12 − 2 − 0.
// Phases (04 §3): T = 2, R = 10, S = min(4, max(2, 10 − 2 − 1)) = 4, B = 2, U = 4 → BASE 1–2, BUILD 3–6,
// SPECIFIC 7–10, TAPER 11–12. Deloads every 4: week 4 (BUILD, 2 weeks left → stays), week 8 (SPECIFIC, 2 left →
// stays), week 12 (taper → dropped, PHS-002).
// Volume (05 §2, standard profile, baseline confirmed): wk1 1.15 × 7200 = 8280; wk2 min(1.15 × 8280 = 9522,
// 1.30 × 7200 = 9360) = 9360; wk3 min(10764, 1.30 × 8280 = 10764) → round_down 60 → 10740; wk4 deload 0.75 × 10740
// = 8055 → 8040; wk5 min(V_peak 10800, 12351, 12168) = 10800 …; wk8 0.75 × 10800 = 8100; taper V_ref 10800 →
// wk11 × (1 − 0.5 × 0.6) = 7560, wk12 × 0.5 = 5400.
// Long run (05 §3): wk1 round_down(1.10 × 2520 = 2772) = 2760; wk2 1.10 × 2760 = 3036 → 3000; wk3 3300; wk4 0.75
// × 3300 = 2475 → 2460; wk5 min(1.10 × 3300 = 3630, L_target 3600) = 3600 …; wk8 2700; wk11 0.7 × 3600 = 2520.
// Key count (SES-007): TOL 1 (V28 120 < 150) and TOL never reaches 3 → 1 key a week everywhere.
// Placement (12 §2b.4): LR Sunday; one hard key on the day of {Tue, Wed, Fri} furthest from Sunday → Tuesday.
const A_EASY = (v: number, lr: number, key: number, days: string[]): Record<string, number> => {
  // water_fill with caps far above the level: equal share, rounded down to 60 s, leftover to the earliest days
  const rem = v - lr - key, n = days.length, h = Math.floor(rem / n / 60) * 60;
  let left = rem - h * n;
  const out: Record<string, number> = {};
  for (const d of days) { const extra = left >= 60 ? 60 : 0; left -= extra; out[d] = h + extra; }
  return out;
};
const aWeek = (index: number, phase: string, V: number, LR: number, keys: KeyExp[], extra: Partial<WeekExp> = {}): WeekExp => {
  const keyDays = keys.map((k) => k.day);
  const days = [T, W, F].filter((d) => !keyDays.includes(d));
  return { index, phase, is_deload: false, taper_k: null, V_s: V, LR_s: LR, keys, easy: A_EASY(V, LR, keys.reduce((a, k) => a + k.duration_s, 0), days), strides_runs: 2, fuel_g_h: null, status: 'firm', ...extra };
};

export const PLAN_10K: PlanExp = {
  fixture: 'mvp-10k-time-12wk',
  verdict: 'feasible',
  reasons: [],
  labels: [],
  phases: 'BASE:1+2 BUILD:3+4 SPECIFIC:7+4 TAPER:11+2',
  deload_weeks: [4, 8],
  weeks_needed: { rtr: 0, onboard: 0, base: 2, build: 1, specific: 2, taper: 2, G: 5, n_L: 4, n_V: 3, K_key: 8 },
  slack: 5,
  demand: { L_req_time_s: 3600, V_req_time_s: 10800, floor_dist_m: 8000 },
  // 5K 25:00 measured → 10K: 1500 × 2^1.06 = 3127.40; P_race × 0.98 = 3064.85; × 0.93 = 2850.31; × 1.07 = 3279.39
  band: { p_race_s: 3064, fast_edge_s: 2850, slow_edge_s: 3279, b_fast: 0.07, b_slow: 0.07 },
  // CS = 10000 / 3127.40 = 3.1975 m/s; × 0.97 → 322.4 s/km, × 0.92 → 339.9 → nearest 5: 320–340
  e3_pace: [320, 340],
  day0: [
    // wk1 BASE (first half: SES-M-008/012 are "BASE (late)" modules) → THR has no eligible module; VO2 L1 wins
    // (0.20 × 2/3 = 0.133) → strides slot SES-M-006 on an easy run. 3 easy days share 8280 − 2760 = 5520:
    // 1840 → 1800 each + 2 × 60 leftover → Tue 1860, Wed 1860, Fri 1800.
    { ...aWeek(1, 'BASE', 8280, 2760, []), strides_slot: true },
    // wk2 BASE late: THR L1 (0.30 × 2/4 = 0.15) → SES-M-008 start 3 × 5 = 2040 s. Easy (9360 − 3000 − 2040)/2 = 2160.
    aWeek(2, 'BASE', 9360, 3000, [thr(3, 5)]),
    aWeek(3, 'BUILD', 10740, 3300, [thr(3, 5)]), // easy (10740 − 3300 − 2040)/2 = 2700
    { ...aWeek(4, 'BUILD', 8040, 2460, [thr(3, 5)]), is_deload: true }, // SES-016 start dose; easy 3540 → 1740 + 60 → Wed 1800, Fri 1740
    aWeek(5, 'BUILD', 10800, 3600, [thr(3, 5)]), // easy (10800 − 3600 − 2040)/2 = 2580
    aWeek(6, 'BUILD', 10800, 3600, [thr(3, 5)]),
    // SPECIFIC: THR 0.15 > VO2 0.133 > MSP 0.033; THR L1 is trained by SES-M-008 from the BUILD list. DST-018
    // (time goal, MSP week) needs the MSP L1 prerequisites THR L1 and DUR L1: not held on day 0 → no SES-M-011.
    aWeek(7, 'SPECIFIC', 10800, 3600, [thr(3, 5)]),
    { ...aWeek(8, 'SPECIFIC', 8100, 2700, [thr(3, 5)]), is_deload: true }, // easy (8100 − 2700 − 2040)/2 = 1680
    aWeek(9, 'SPECIFIC', 10800, 3600, [thr(3, 5)]),
    aWeek(10, 'SPECIFIC', 10800, 3600, [thr(3, 5)]),
    // TAPER k1: one sharpener SES-M-024, E3 form (last key was SES-M-008): 2 × 5 min E3 inside an easy run.
    // 4 runs kept (taper.freq_min_ratio 1.0): 3 runs share 7560 − 2520 = 5040 → 1680 each.
    { index: 11, phase: 'TAPER', is_deload: false, taper_k: 1, V_s: 7560, LR_s: 2520, keys: [], easy: { Tue: 1680, Wed: 1680, Fri: 1680 }, strides_runs: 2, fuel_g_h: null, status: 'firm' },
    // race week (k2): race plus easy runs and strides, no long run; 5400 s over 3 easy runs = 1800 each
    { index: 12, phase: 'TAPER', is_deload: false, taper_k: 2, V_s: 5400, LR_s: 0, keys: [], easy: { Tue: 1800, Wed: 1800, Fri: 1800 }, strides_runs: 2, fuel_g_h: null, status: 'assumed', oq: 'OQ-16' },
  ],
  published: [
    { week: 1, expect: { ...aWeek(1, 'BASE', 8280, 2760, []), strides_slot: true }, status: 'firm' },
    { week: 2, expect: aWeek(2, 'BASE', 9360, 3000, [thr(3, 5)]), status: 'firm' },
    // SES-011: week 2's 3 × 5 logged at RPE 6 ≤ min(6 + 1, 8 − 1) → one step up: 3 × 6 = 2220 s.
    // Easy (10740 − 3300 − 2220)/2 = 2610 → 2580 each + 60 → Wed 2640, Fri 2580.
    { week: 3, expect: aWeek(3, 'BUILD', 10740, 3300, [thr(3, 6)]), status: 'firm' },
    // Week-4 Monday re-plan: FEA-021 again. THR 0 → K_key 8; weeks left that hold keys = 9 − 2 = 7 < 8 →
    // LEVELS_UNREACHABLE. FEA-043 (a) fails (longest logged long run 3300 < L_req 3600), (b) is 5K-only →
    // fail closed, previous plan kept, future weeks frozen (FEA-042, 12 §3.12). Literal reading of OQ-01.
    { week: 4, expect: { kind: 'fail_closed', previous_plan_kept: true, reason: 'LEVELS_UNREACHABLE' }, status: 'assumed', oq: 'OQ-01', branch: 'literal' },
    // Alternative reading of OQ-01 (K is not re-checked against the shrinking window at weekly re-plans):
    { week: 4, expect: { ...aWeek(4, 'BUILD', 8040, 2460, [thr(3, 5)]), is_deload: true }, status: 'assumed', oq: 'OQ-01', branch: 'no-recheck' },
    // wk5: VO2 L1 from 4 weeks of strides ×2 (02 §2 log threshold); THR still wins (0.15 > 0.067); 3 × 7 = 2400 s.
    { week: 5, expect: aWeek(5, 'BUILD', 10800, 3600, [thr(3, 7)]), status: 'assumed', oq: 'OQ-01', branch: 'no-recheck' },
    // wk6: SES-012 — last two non-deload instances 18 and 21 min ≥ the 16-min test → THR L1 test 2 × 8 = 1980 s.
    // Easy (10800 − 3600 − 1980)/2 = 2610 → 2580 + 60 → Wed 2640, Fri 2580.
    { week: 6, expect: aWeek(6, 'BUILD', 10800, 3600, [thr(2, 8, T, 'THR1')]), status: 'assumed', oq: 'OQ-01', branch: 'no-recheck' },
    // wk7: THR L1 held; THR (0.075) > VO2 (0.067) → SES-M-008 for THR L2 at the step after the last non-test
    // instance (wk5 3 × 7) → 3 × 8 = 2580 s; the long run (≥ 60 min twice: wk5, wk6) is the DUR L1 test (SES-012).
    // Easy (10800 − 3600 − 2580)/2 = 2310 → 2280 + 60 → Wed 2340, Fri 2280.
    { week: 7, expect: { ...aWeek(7, 'SPECIFIC', 10800, 3600, [thr(3, 8)]), lr_test: 'DUR1' }, status: 'assumed', oq: 'OQ-01+OQ-15', branch: 'no-recheck' },
  ],
};

// ===================================================================================================
// Plan B — half marathon time goal 1:50:00, 14 weeks, 4 runs (Tue, Wed, Fri, Sun), 360 min available
// ===================================================================================================
// Demand: S_slow 2.5 m/s. L_ratio = 21097/1.30/2.5 = 6491.4 s; floor = 21097/1.60 = 13185 m / 2.5 = 5274 s;
// DUR 2 → 5400 s. L_req = max(min(6491, 9000), 5274, 5400) = 6491 s.
// Required (02 §5 + CMP-008, closed): HAB 2, AER 3, TOL 2, DUR 2, THR 2, MSP 2, FUEL 2 (expected race duration =
// slow edge 6940 s > 90 min).
// V_req = max(AER 3 300 min, TOL 2 150, floor 150, max(6491/0.50, 6491/0.60) = 12982 s) = 18000 s.
// L_hold = 7920 (L30 132 min) → L_target 7920; V_peak = min(360, max(300, 270, AER 3 = 300)) = 300 min.
// n_L = 0 (L_req < L0); n_V = ⌈ln(300/270)/ln 1.15⌉ = 1; G = 1; base 0; slack = 14 − (0 + 0 + 1 + 3 + 2) = 8.
// K_key = max(THR 2, MSP 2) × 4 = 8 ≤ 14 − 2 − 0 = 12.
// Phases: T 2, R 12, S = min(6, max(3, 12 − 0 − 1)) = 6, B 0, U 6 → BUILD 1–6, SPECIFIC 7–12, TAPER 13–14.
// Deloads 4 (BUILD, 2 left → stays), 8 (SPECIFIC, 4 left → stays), 12 (1 week before taper → dropped, PHS-002).
// V: wk1 min(18000, 1.15 × 16200 = 18630) = 18000 every loading week; deloads 0.75 × 18000 = 13500;
// taper V_ref 18000 → 12600, 9000. LR 7920; deload 0.75 × 7920 = 5940; taper 0.7 × 7920 = 5544 → 5520.
// Key count (SES-007): HAB 3, TOL 3 → 2 in BUILD and SPECIFIC; SES-006 min(2, 4 runs − 2) = 2; deload 1.
// BUILD slots: THR 0.30 × 2/4 = 0.15 → SES-M-008; second slot: DUR 0.10 × 2/5 = 0.04 is a volume node →
// fallback, BUILD list rotated by loading_index + 1: SES-M-010 fails its prerequisites (VO2 L1, THR L1) →
// SES-M-012. Placement: {Tue, Fri} (min gap 2, earliest set); slot 1 → Tue, slot 2 → Fri (OQ-17).
// FUEL required → every long run ≥ 60 min is a practice run from BASE (late) on; with no BASE, from week 1.
const bWeek = (index: number, phase: string, V: number, LR: number, keys: KeyExp[], fuel: number | null, extra: Partial<WeekExp> = {}): WeekExp => {
  const keyDays = keys.map((k) => k.day);
  const days = [T, W, F].filter((d) => !keyDays.includes(d) || (extra.strides_slot && d !== T && false));
  return { index, phase, is_deload: false, taper_k: null, V_s: V, LR_s: LR, keys, easy: A_EASY(V, LR, keys.reduce((a, k) => a + k.duration_s, 0), days), strides_runs: days.length >= 2 ? 2 : 1, fuel_g_h: fuel, status: 'firm', ...extra };
};

export const PLAN_HM: PlanExp = {
  fixture: 'mvp-hm-time-14wk',
  verdict: 'feasible',
  reasons: [],
  labels: [],
  phases: 'BUILD:1+6 SPECIFIC:7+6 TAPER:13+2',
  deload_weeks: [4, 8],
  weeks_needed: { rtr: 0, onboard: 0, base: 0, build: 1, specific: 3, taper: 2, G: 1, n_L: 0, n_V: 1, K_key: 8 },
  slack: 8,
  demand: { L_req_time_s: 6491, V_req_time_s: 18000, floor_dist_m: 13185 },
  // 10K 50:00 measured → HM 3000 × (21.097/10)^1.06 = 6619.04; P_race 6486.66; fast × 0.93 = 6032.60; slow × 1.07 = 6940.73
  band: { p_race_s: 6486, fast_edge_s: 6032, slow_edge_s: 6940, b_fast: 0.07, b_slow: 0.07 },
  // CS = 10000/3000 = 3.333 m/s; × 0.97 → 309.3, × 0.92 → 326.1 → 310–325
  e3_pace: [310, 325],
  day0: [
    // easy Wed = 18000 − 7920 − 2040 − 2400 = 5640. Long run = DUR L1 level test (two logged LRs ≥ 60 min, SES-012).
    bWeek(1, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30, { lr_test: 'DUR1', status: 'assumed', oq: 'OQ-15' }),
    bWeek(2, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30),
    bWeek(3, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30),
    // deload: only slot 1 at its start dose; easy (13500 − 5940 − 2040)/2 = 2760 each; fuel at the same step
    { ...bWeek(4, 'BUILD', 13500, 5940, [thr(3, 5)], 30), is_deload: true },
    bWeek(5, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30),
    bWeek(6, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30),
    // SPECIFIC: slot 1 THR → SES-M-008 (BUILD list). Slot 2: MSP's module SES-M-011 needs THR L1 + DUR L1; DUR is a
    // volume node; fallback lists: SES-M-009 (THR L2, AER L3 ✗), SES-M-011 ✗, SES-M-008 used, SES-M-010 ✗,
    // SES-M-012 not allowed in SPECIFIC → strides slot. Easy (18000 − 7920 − 2040)/2 = 4020 on Wed and Fri.
    { ...bWeek(7, 'SPECIFIC', 18000, 7920, [thr(3, 5)], 30), strides_slot: true },
    { ...bWeek(8, 'SPECIFIC', 13500, 5940, [thr(3, 5)], 30), is_deload: true },
    { ...bWeek(9, 'SPECIFIC', 18000, 7920, [thr(3, 5)], 30), strides_slot: true },
    { ...bWeek(10, 'SPECIFIC', 18000, 7920, [thr(3, 5)], 30), strides_slot: true },
    { ...bWeek(11, 'SPECIFIC', 18000, 7920, [thr(3, 5)], 30), strides_slot: true },
    { ...bWeek(12, 'SPECIFIC', 18000, 7920, [thr(3, 5)], 30), strides_slot: true },
    // taper k1: 12600 − 5520 = 7080 over 3 runs → 2340 each + 60 → Tue 2400 (with the 2 × 5 min E3 sharpener)
    { index: 13, phase: 'TAPER', is_deload: false, taper_k: 1, V_s: 12600, LR_s: 5520, keys: [], easy: { Tue: 2400, Wed: 2340, Fri: 2340 }, strides_runs: 2, fuel_g_h: 30, status: 'firm' },
    { index: 14, phase: 'TAPER', is_deload: false, taper_k: 2, V_s: 9000, LR_s: 0, keys: [], easy: { Tue: 3000, Wed: 3000, Fri: 3000 }, strides_runs: 2, fuel_g_h: null, status: 'assumed', oq: 'OQ-16' },
  ],
  published: [
    { week: 1, expect: bWeek(1, 'BUILD', 18000, 7920, [thr(3, 5), prog(40)], 30, { lr_test: 'DUR1' }), status: 'assumed', oq: 'OQ-15' },
    // wk2: both modules one step up (SES-011); DUR L2 test on the long run (DUR L1 passed, two logged LRs ≥ 90).
    // easy 18000 − 7920 − 2220 − 3000 = 4860. Fuel: second practice run at 30 g/h (step up after it).
    { week: 2, expect: bWeek(2, 'BUILD', 18000, 7920, [thr(3, 6), prog(50)], 30, { lr_test: 'DUR2' }), status: 'assumed', oq: 'OQ-15' },
    // wk3: 3 × 7 (2400) + 60 min (3600); easy 4080. Fuel 45 g/h (NUT-011: two runs reached 30 at GI 0 → +15).
    // slot 2 rotation offset 3 ≡ 0 → [008 used, 010 ✗, 012] → SES-M-012.
    { week: 3, expect: bWeek(3, 'BUILD', 18000, 7920, [thr(3, 7), prog(60)], 45), status: 'firm' },
    // wk4 deload: SES-M-008 start dose (SES-016); fuel 45 (deload long runs count, same step)
    { week: 4, expect: { ...bWeek(4, 'BUILD', 13500, 5940, [thr(3, 5)], 45), is_deload: true }, status: 'firm' },
    // wk5: SES-012 — wk2 18 and wk3 21 min ≥ 16 → THR L1 test 2 × 8 (1980); slot 2 rotation offset 4 ≡ 1 →
    // [010 ✗, 012] → 012 at the step after 60 → 70 min (4200, its maximum). Easy 18000 − 7920 − 1980 − 4200 = 3900.
    // Fuel 60 g/h (two runs at 45; ceiling = min(band 1–2.5 h upper 60, 90, FUEL L2 band upper 60) = 60).
    { week: 5, expect: bWeek(5, 'BUILD', 18000, 7920, [thr(2, 8, T, 'THR1'), prog(70)], 60), status: 'firm' },
    // Week-6 Monday re-plan: MSP 0 → K_key 8 > 9 − 2 = 7 → LEVELS_UNREACHABLE. FEA-043 (a): the long-run demand
    // (6491 s) is met by the logged 7920 s and the taper fits → degraded completion: goal kept as a finish goal,
    // verdict stretch with DEGRADED_COMPLETION (literal reading of OQ-01).
    { week: 6, expect: { kind: 'plan', reason: 'DEGRADED_COMPLETION', degraded: true }, status: 'assumed', oq: 'OQ-01', branch: 'literal' },
    // OQ-01 alternative: THR (0.075) → SES-M-008 3 × 8 (step after wk3's 3 × 7) = 2580; slot 2 rotation offset 5 ≡ 2 →
    // [012] stays at 70 min; easy 18000 − 7920 − 2580 − 4200 = 3300.
    { week: 6, expect: bWeek(6, 'BUILD', 18000, 7920, [thr(3, 8), prog(70)], 60), status: 'assumed', oq: 'OQ-01', branch: 'no-recheck' },
  ],
};

export const MVP_PLANS = [PLAN_10K, PLAN_HM];

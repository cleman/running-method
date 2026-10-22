// S3 part 1: demand (03 §2), required levels (02 §5, CMP-008), prediction band (03 §3), pace model (03 §3b).
import type { Distance, Effort, GeneratorInput, Node } from '../model/types.ts';
import { type Spec, pnum, pval, roundDown } from '../context.ts';
import { closePrereqs } from '../rules/helpers.ts';
import { type DerivedState, riegel } from './state.ts';
import { daysBetween } from '../util/dates.ts';

export const RACE_M: Record<string, number> = { '5K': 5000, '10K': 10000, HM: 21097.5, M: 42195, '50K': 50000, '100K': 100000 };
export const FAMILY: Record<string, 'short' | 'road_classic' | 'ultra' | 'base'> = { '5K': 'short', '10K': 'short', HM: 'road_classic', M: 'road_classic', '50K': 'ultra', '100K': 'ultra', none: 'base' };
const AER_MIN = [0, 90, 180, 300, 450, 600];
const TOL_MIN = [0, 60, 150, 240, 360, 540];
const DUR_MIN = [0, 60, 90, 135, 180, 180];

export interface Band { P_s: number; P_race_s: number; B_fast: number; B_slow: number; fast_edge_s: number; slow_edge_s: number; anchor_id: string; model: string }
export interface Demand {
  preset: string; family: 'short' | 'road_classic' | 'ultra' | 'base'; race_m: number;
  L_req_time_s: number; L_ratio_time_s: number; floor_dist_m: number; time_cap_s: number; time_capped: boolean;
  floor_time_ok: boolean; abs_cap_ok: boolean; met_by_logged_distance: boolean;
  V_req_time_s: number; runs_req: number; required_levels: Record<string, number>; expected_duration_s: number;
  dist_stop_m: number | null;
}

export function runsBucket(runs: number): string { return runs >= 5 ? '5+' : String(Math.max(2, runs)); }

/** lr_cap (LOD-020) as a function of the week's volume. */
export function timeCapS(spec: Spec, dist: string, family: string): number {
  if (family === 'ultra') return 60 * pnum(spec, `lr.ultra_time_cap_min.${dist}`);
  if (family === 'base') return 60 * pnum(spec, 'lr.time_cap_min.method_default.10K'); // SPEC-QUESTION Q-E16: base family uses the short time cap (150)
  return 60 * pnum(spec, `lr.time_cap_min.method_default.${dist}`);
}

/**
 * lr_cap (LOD-020): the preset's % of weekly time (floored at lr.pct_floor_s), MIN the time cap. Road_classic floor-bound
 * runs (L_req above the time cap) may go up to L_req while the week holds L / lr.over_cap_pct (03 §2, d2-B R2).
 */
export function lrCapFn(spec: Spec, dist: Distance, family: string, runs: number, L_req = 0): (V: number) => number {
  const key = family === 'short' || family === 'base' ? family : family === 'ultra' ? 'ultra' : 'road_classic';
  const pctMap = pval<Record<string, any> | number | string>(spec, 'lr.pct_cap.method_default.' + key);
  const pct = typeof pctMap === 'number' ? pctMap : typeof pctMap === 'string' ? pnum(spec, pctMap) : (pctMap[runsBucket(runs)] as number);
  const floor = pnum(spec, 'lr.pct_floor_s');
  const cap = timeCapS(spec, dist, family);
  const over = family === 'road_classic' && L_req > cap ? pnum(spec, 'lr.over_cap_pct.road_classic') : 0;
  return (V: number) => Math.max(Math.min(Math.max(pct * V, floor), cap), over ? Math.min(L_req, over * V) : 0);
}

export function predictBand(spec: Spec, st: DerivedState, input: GeneratorInput, dist: Distance, hasTaper: boolean, V28_dist_m: number | null): Band | null {
  const a = st.anchor;
  if (!a) return null;
  const D = RACE_M[dist];
  const P = riegel(spec, a, D);
  const P_race = hasTaper ? P * (1 - pnum(spec, 'pred.taper_gain_pct') / 100) : P;
  const sameDist = Math.abs(a.distance_m - D) < 1 && a.confidence === 'measured' && daysBetween(a.date, input.today) <= pnum(spec, 'pred.same_distance_max_age_days');
  const B_fast = (sameDist ? pnum(spec, 'pred.band_same_distance_pct') : pnum(spec, 'pred.band_min_pct')) / 100;
  let B_slow = pnum(spec, 'pred.band_min_pct') / 100;
  const anyEstimated = a.confidence !== 'measured' || input.anchors.some(x => x.kind === 'recalled');
  if (anyEstimated) B_slow *= pnum(spec, 'pred.band_widen_estimated');
  if (D / a.distance_m > pnum(spec, 'pred.max_extrapolation_ratio')) B_slow *= pnum(spec, 'pred.band_widen_estimated');
  // FEA-011 (marathon at low volume) widens B_slow through the rule engine in feasibility.ts
  void V28_dist_m;
  return { P_s: P, P_race_s: P_race, B_fast, B_slow, fast_edge_s: P_race * (1 - B_fast), slow_edge_s: P_race * (1 + B_slow), anchor_id: a.id, model: D >= 42195 ? 'riegel_marathon' : 'riegel' };
}

export function computeDemand(spec: Spec, input: GeneratorInput, st: DerivedState, band: Band | null): Demand {
  const g = input.goal;
  const dist = g.distance;
  const family = FAMILY[dist];
  const preset = 'method_default';
  const race_m = RACE_M[dist] ?? 0;
  const runsAvail = Math.min(input.profile.max_runs_per_week ?? 3, (input.profile.available_days ?? []).length || 3);
  // required levels (02 §5) + CMP-008 + FEA-004, closed under prerequisites
  const req = family === 'base' ? {} : pval<Record<string, Record<string, Record<string, number>>>>(spec, 'cmp.required.' + dist + '.finish') as unknown as Record<string, number>;
  let levels: Record<string, number> = { ...(req ?? {}) };
  if (g.goal_type === 'time' && family !== 'base') {
    const t = pval<Record<string, number>>(spec, 'cmp.required.' + dist + '.time');
    for (const [k, v] of Object.entries(t ?? {})) levels[k] = Math.max(levels[k] ?? 0, v);
  }
  const s = st.s_slow;
  const expected_duration_s = g.goal_type === 'time' && g.target_time_s ? Math.max(g.target_time_s, band?.slow_edge_s ?? 0) : band ? band.slow_edge_s : race_m / s; // SPEC-QUESTION Q12
  if (expected_duration_s > 60 * pnum(spec, 'fuel.required_above_min')) {
    const lvl = g.goal_type === 'time' && expected_duration_s > 3600 * pnum(spec, 'fuel.l4_min_race_h') ? pnum(spec, 'fuel.required_level_long') : pnum(spec, 'fuel.required_level_mid');
    levels.FUEL = Math.max(levels.FUEL ?? 0, lvl);
  }
  if (g.expected_conditions === 'hot') levels.HEAT = Math.max(levels.HEAT ?? 0, pnum(spec, 'cmp.heat_required_level'));
  levels = closePrereqs(levels);

  // long-run demand (03 §2)
  let L_req = 0, L_ratio = 0, floor_dist = 0, capS = 0, time_capped = false, floor_time_ok = true, abs_cap_ok = true, met_by_logged = false;
  let dist_stop_m: number | null = null;
  if (family === 'base') capS = timeCapS(spec, dist, family);
  if (family !== 'base') {
    const ratioRaw = pval<number | Record<string, number>>(spec, 'race.longest_ratio_max.' + dist);
    const ratio = typeof ratioRaw === 'number' ? ratioRaw : ratioRaw[preset];
    const floorRatio = pval<number>(spec, `race.longest_floor_ratio.${dist}.${preset}`);
    floor_dist = race_m / floorRatio;
    capS = timeCapS(spec, dist, family);
    L_ratio = (race_m / ratio) / s;
    const durTime = 60 * DUR_MIN[levels.DUR ?? 0];
    if (dist === '5K' && g.goal_type === 'finish') L_req = 60 * pnum(spec, 'race.5k_finish_lr_min');
    else {
      L_req = Math.max(Math.min(L_ratio, capS), floor_dist / s, durTime);
      time_capped = L_ratio > capS;
    }
    floor_time_ok = floor_dist / s <= 60 * pnum(spec, `lr.floor_time_max_min.${dist}`);
    if (family === 'ultra') L_ratio = L_ratio; // ultra demand is R3: computed with the same formula, not validated
    const abs = pval<number | null>(spec, `lr.abs_cap_km.${preset}`);
    abs_cap_ok = abs == null || floor_dist <= abs * 1000;
    met_by_logged = st.L30_conf === 'measured' && st.L30_eff_dist_m != null && st.L30_eff_dist_m >= race_m / ratio;
    dist_stop_m = family === 'road_classic' ? roundDown(Math.min(race_m / ratio, (abs ?? Infinity) * 1000), 100) : null;
  }
  // H0 base plans (05 §3): L_target = max(L_hold, dur_time(next DUR level))
  if (family === 'base') L_req = 60 * DUR_MIN[Math.min(4, (st.levels.DUR ?? 0) + 1)];
  L_req = roundDown(L_req, 60) === L_req ? L_req : Math.ceil(L_req / 60) * 60; // demand in whole minutes (rounded up: errs on the safe side)

  // weekly demand (03 §2)
  const floorPeak = pval<Record<string, { time_min?: number; runs?: number; dist_km?: number }>>(spec, 'feas.finish_floor.peak_week')[dist] ?? {};
  let pctTerm = 0;
  if (L_req > pnum(spec, 'lr.pct_floor_s')) {
    if (family === 'short') pctTerm = L_req / (pval<Record<string, number>>(spec, 'lr.pct_cap.method_default.short')[runsBucket(runsAvail)]);
    else if (family === 'road_classic') pctTerm = Math.max(Math.min(L_req, capS) / 0.5, L_req / pnum(spec, 'lr.over_cap_pct.road_classic'));
  }
  const V_req = family === 'base' ? 0 : Math.ceil(Math.max(60 * AER_MIN[levels.AER ?? 0], 60 * TOL_MIN[levels.TOL ?? 0], 60 * (floorPeak.time_min ?? 0), pctTerm) / 60) * 60;
  const habRuns = [0, 3, 3, 4, 5][levels.HAB ?? 0] ?? 3;
  const runs_req = Math.max(habRuns, floorPeak.runs ?? 0);
  return {
    preset, family, race_m, L_req_time_s: L_req, L_ratio_time_s: L_ratio, floor_dist_m: floor_dist, time_cap_s: capS, time_capped,
    floor_time_ok, abs_cap_ok, met_by_logged_distance: met_by_logged, V_req_time_s: V_req, runs_req, required_levels: levels,
    expected_duration_s, dist_stop_m,
  };
}

/** 03 §3b pace ranges (s/km, fast–slow) from a measured anchor; null for E0/E5. */
export function paceRange(spec: Spec, anchor: { distance_m: number; time_s: number }, effort: Effort): { fast_s_per_km: number; slow_s_per_km: number } | null {
  const r = pnum(spec, 'pace.round_s');
  const sp = (D: number) => D / riegel(spec, anchor, D);    // m/s
  const toPace = (v: number) => 1000 / v;
  let lo: number, hi: number;                               // speeds
  switch (effort) {
    case 'E4': { const v = sp(5000); lo = v * 0.98; hi = v * 1.02; break; }
    case 'E3': { const cs = 10000 / riegel(spec, anchor, 10000); lo = cs * pnum(spec, 'pace.e3_low'); hi = cs * pnum(spec, 'pace.e3_high'); break; }
    case 'E2': { lo = sp(42195); hi = sp(21097.5); break; }
    case 'E1': { const v = sp(42195); lo = v * pnum(spec, 'pace.e1_low'); hi = v * pnum(spec, 'pace.e1_high'); break; }
    default: return null;
  }
  return { fast_s_per_km: Math.round(toPace(hi) / r) * r, slow_s_per_km: Math.round(toPace(lo) / r) * r };
}

export type { Node };

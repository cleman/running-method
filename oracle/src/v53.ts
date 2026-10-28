// v5.3 derivations the oracle makes from the raw INPUT only (02 §2b, 03 §3b, 06 §2d): qualifying race,
// approximate age-grade, experienced-path eligibility (EXP-001, EXP-006), starting levels (EXP-002), pace
// ranges (with the declared widening) and the distance rendering of SES-032. Written from the spec text; no
// generator value is read. Where the text allows two readings both are returned and the checks accept either.
import { P } from './params.js';
import { addDays, ageLow, daysBetween } from './dates.js';
import { EXP_ROWS, PV, TRACK_M, WMA_AGE_FACTOR, WMA_OPEN_S } from './v53-params.js';
import { familyOf, tolFrom } from './invariants.js';
import type { Input } from './types.js';

export type Node = 'HAB' | 'TOL' | 'AER' | 'DUR' | 'THR' | 'VO2' | 'MSP';
const STD: [string, number][] = [['5K', 5000], ['10K', 10000], ['HM', 21097.5], ['M', 42195]];

/** Standard distance of a race within exp.distance_tol_pct, else null. */
export function standardDistance(m: number): string | null {
  for (const [id, d] of STD) if (Math.abs(m - d) <= (PV['exp.distance_tol_pct'] / 100) * d) return id;
  return null;
}

/** perf.wma_age_factor, linear between listed ages, 1.00 up to 30 (02 §2b). */
export function ageFactor(sex: 'm' | 'f', age: number): number {
  if (age <= 30) return 1;
  const t = WMA_AGE_FACTOR[sex];
  const lo = Math.min(85, Math.floor(age / 5) * 5);
  return t[lo] + ((t[lo + 5] - t[lo]) * (age - lo)) / 5;
}

/** Approximate age-grade %, lower of both tables when sex is unknown (02 §2b, INP-032 cautious side). */
export function ageGradePct(sex: 'm' | 'f' | null, dist: string, ageAtRace: number, time_s: number): number {
  const one = (s: 'm' | 'f') => (100 * WMA_OPEN_S[s][dist]) / ageFactor(s, ageAtRace) / time_s;
  return sex ? one(sex) : Math.min(one('m'), one('f'));
}

export const rowOf = (pct: number) => [...EXP_ROWS].reverse().find((r) => pct >= r.lo)!;

/** INP-005 anchor confidence. "date + 48 h" read as the end of the race day + 48 h (+14 h zone slack), as in
 *  src/invariants.ts; the v5.3 personas are entered either the next day or after 9 days, so no reading matters. */
export function anchorConfidence(a: Record<string, any>): 'measured' | 'declared' | 'estimated' {
  const measured = ['race', 'field_test', 'cs_test'].includes(a.kind) && a.distance_m && a.time_s &&
    Date.parse(a.entered_at) <= Date.parse(`${addDays(a.date, 1)}T00:00:00Z`) + P['log.contemporaneous_window_h'] * 3600e3 + 14 * 3600e3;
  if (measured) return 'measured';
  if (a.kind === 'race' && a.effort_all_out === true && a.official_result_confirmed === true) return 'declared';
  return 'estimated';
}

export interface ExpDerivation {
  /** EXP-001 holds: the plan starts on the experienced path (calibrating). */
  experienced: boolean;
  /** EXP-006: a race would qualify but official_result_confirmed is unanswered → MSG-EXP-CONFIRM-Q. */
  asksConfirm: boolean;
  /** Every EXP-001 condition that fails (empty when experienced). */
  failing: string[];
  race: Record<string, any> | null;
  raceDistance: string | null;
  agegradePct: number | null;
  /** EXP-002 levels (only meaningful when experienced). */
  levels: Record<Node, number>;
}

/** 02 §2 thresholds on the claims (sustained = as claimed), before any cap. */
export function claimLevels(input: Input): Record<'HAB' | 'TOL' | 'AER' | 'DUR', number> {
  const c = input.claim ?? {};
  const runs = c.runs_per_week ?? 0, vMin = (c.weekly_time_s ?? 0) / 60, lMin = (c.L30_duration_s ?? 0) / 60;
  const hab = runs >= 5 ? 4 : runs >= 4 ? 3 : runs >= 3 && c.continuous_30min ? 2 : runs >= 3 ? 1 : 0;
  const aer = [90, 180, 300, 450, 600].filter((t) => vMin >= t).length;
  const dur = [60, 90, 120, 180].filter((t) => lMin >= t).length; // L3 read at its lower edge (120–150)
  return { HAB: hab, TOL: tolFrom(vMin, lMin), AER: aer, DUR: dur };
}

export function deriveExp(input: Input): ExpDerivation {
  const failing: string[] = [];
  const prof = input.profile, c = input.claim ?? {};
  const races = (input.anchors ?? []).filter((a) => a.kind === 'race' && a.time_s && a.distance_m && standardDistance(a.distance_m))
    .sort((a, b) => b.date.localeCompare(a.date));
  const race = races[0] ?? null;
  const raceDistance = race ? standardDistance(race.distance_m) : null;
  let pct: number | null = null;
  let asksConfirm = false;
  if (!race) failing.push('no race at a standard distance');
  else {
    pct = ageGradePct(prof.sex ?? null, raceDistance!, ageLow(prof.birth_year, prof.birth_month, race.date), race.time_s);
    if (daysBetween(race.date, input.today) > PV['exp.race_max_age_days']) failing.push('race older than exp.race_max_age_days');
    if (race.effort_all_out !== true) failing.push('race not all-out');
    if (race.official_result_confirmed !== true) failing.push('official_result_confirmed ≠ true');
  }
  if ((prof.training_age_years ?? 0) < PV['exp.training_age_min']) failing.push('training age < exp.training_age_min');
  if (ageLow(prof.birth_year, prof.birth_month, input.today) < PV['exp.age_min']) failing.push('age < exp.age_min');
  if (pct != null) {
    const row = rowOf(pct), v = (c.weekly_time_s ?? 0) / 60;
    if (v < row.volMin || (row.volMax != null && v > row.volMax)) failing.push(`claimed ${v} min/week outside the ${row.lo}% row band`);
  }
  if ((c.runs_per_week ?? 0) < PV['exp.runs_min']) failing.push('claimed runs < exp.runs_min');
  if (c.L30_distance_m != null && c.weekly_distance_m != null && (c.runs_per_week ?? 0) >= 2 && c.L30_distance_m > c.weekly_distance_m)
    failing.push('GEN-022: claimed L30 > claimed weekly distance');
  if ((input.flags ?? []).some((f) => f.status === 'active' && /pain/.test(String(f.subkind ?? f.kind ?? '')))) failing.push('active pain flag');
  if (prof.injury_last_12m === true && prof.injury_last_12w !== false) failing.push('injury in the last exp.injury_free_weeks');
  const screenYes = Object.values(input.screening?.answers ?? {}).some((v) => v === true) ||
    Object.values(input.screening?.current_symptoms ?? {}).some((v) => v === true);
  if (screenYes) failing.push('gate may not be proceed');
  const experienced = failing.length === 0;
  asksConfirm = !!race && race.official_result_confirmed == null && failing.length === 1 && failing[0] === 'official_result_confirmed ≠ true';

  const cl = claimLevels(input);
  const cap = PV['exp.claim_level_cap'];
  const row = pct != null ? rowOf(pct) : EXP_ROWS[0];
  const sameFamily = raceDistance != null && familyOf(raceDistance) === familyOf(input.goal.distance);
  const levels: Record<Node, number> = {
    HAB: Math.min(cap, cl.HAB), TOL: Math.min(cap, cl.TOL), AER: Math.min(cap, cl.AER), DUR: Math.min(cap, cl.DUR),
    THR: row.THR, VO2: row.VO2, MSP: sameFamily ? row.MSP : 0,
  };
  return { experienced, asksConfirm, failing, race, raceDistance, agegradePct: pct, levels };
}

// ---------- 03 §3b pace model ----------

export type Reading = 'A' | 'B';
/** [fast s/km, slow s/km] by effort. */
export type Ranges = Record<'E1' | 'E2' | 'E3' | 'E4', [number, number]>;
const r5 = (x: number) => Math.round(x / P['pace.round_s']) * P['pace.round_s']; // nearest (OQ-06)
const up5 = (x: number) => Math.ceil(x / P['pace.round_s'] - 1e-9) * P['pace.round_s'];

/** Unrounded equivalent times from one anchor (Riegel 1.06 up to the half; riegel_marathon for M). */
export function equivalents(dist_m: number, time_s: number) {
  const riegel = (d: number) => time_s * (d / dist_m) ** P['pred.riegel_exp_min'];
  const eM = Math.max(P['pred.riegel_exp_min'], Math.log(P['pred.marathon_from_half']) / Math.log(2));
  return { T5K: riegel(5000), T10K: riegel(10000), THM: riegel(21097.5), TM: time_s * (42195 / dist_m) ** eM };
}

/**
 * Pace ranges of 03 §3b. widen = declared anchor on the experienced path. Reading A: the slow edge is rounded to
 * 5 s, then × 1.02 and rounded up; reading B: the unrounded slow edge × 1.02, rounded up (OQ-27).
 */
export function paceRanges(anchor: { distance_m: number; time_s: number }, widen: boolean, reading: Reading = 'A'): Ranges {
  const e = equivalents(anchor.distance_m, anchor.time_s);
  const cs = 10000 / e.T10K, v5 = 5000 / e.T5K, vM = 42195 / e.TM, vHM = 21097.5 / e.THM;
  const raw: Record<keyof Ranges, [number, number]> = {
    E4: [1000 / (v5 * 1.02), 1000 / (v5 * 0.98)],
    E3: [1000 / (cs * P['pace.e3_high']), 1000 / (cs * P['pace.e3_low'])],
    E2: [1000 / vHM, 1000 / vM],
    E1: [1000 / (vM * P['pace.e1_high']), 1000 / (vM * P['pace.e1_low'])],
  };
  const out = {} as Ranges;
  for (const k of Object.keys(raw) as (keyof Ranges)[]) {
    const [f, s] = raw[k];
    const w = 1 + PV['exp.declared_pace_widen_pct'] / 100;
    out[k] = [r5(f), !widen ? r5(s) : reading === 'A' ? up5(r5(s) * w) : up5(s * w)];
  }
  return out;
}

/** Midpoint speed (m/s) of a range: mean of the two edge speeds (06 §2d "midpoint speed"). */
export const midSpeed = ([f, s]: [number, number]) => (1000 / f + 1000 / s) / 2;

/** The anchor that sets paces on `date`, with its widening, or null (effort-only). INV-15, FEA-014. */
export function activeAnchor(input: Input, date: string): { anchor: Record<string, any>; widen: boolean } | null {
  const exp = deriveExp(input);
  const cands = (input.anchors ?? []).filter((a) => a.distance_m && a.time_s && a.date <= date && daysBetween(a.date, date) <= P['anchor.max_age_days'])
    .map((a) => ({ a, c: anchorConfidence(a) }))
    .filter(({ c }) => c === 'measured' || (c === 'declared' && exp.experienced))
    .sort((x, y) => y.a.date.localeCompare(x.a.date));
  if (!cands.length) return null;
  return { anchor: cands[0].a, widen: cands[0].c === 'declared' };
}

// ---------- SES-032 distance form ----------

/** Nearest of ses.track_distances_m, then whole km; ties to the shorter. */
export function nearestTrack(x: number): number {
  const c = [...TRACK_M];
  for (let k = 3; k <= 60; k++) c.push(k * 1000);
  let best = c[0];
  for (const d of c) if (Math.abs(d - x) < Math.abs(best - x) - 1e-9) best = d;
  return best;
}
export interface Rendered { exact_m: number; show_m: number | null; about_m: number | null }
export function renderRep(dur_s: number, speed: number): Rendered {
  const x = dur_s * speed, n = nearestTrack(x);
  if (Math.abs(n - x) / x <= PV['ses.dist_round_tol_pct'] / 100) return { exact_m: x, show_m: n, about_m: null };
  return { exact_m: x, show_m: null, about_m: Math.round(x / 100) * 100 };
}
export function renderRecovery(dur_s: number, e1Speed: number): number {
  const step = PV['ses.dist_round_recovery_m'];
  return Math.max(step, Math.round((dur_s * e1Speed) / step) * step);
}

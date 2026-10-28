// v5.3 experienced-runner path (02 §2b, EXP-001…006): qualifying race, age-grade, claim consistency, calibration
// signals and the path itself. Native code citing the rule ids; deriveState (S2) calls it and applies EXP-002's levels.
import type { ActivityRecord, Anchor, EngineState, ExpPath, ExperiencedState, GeneratorInput, Node, Plan } from '../model/types.ts';
import { type Spec, pnum, pval } from '../context.ts';
import { addDays, daysBetween, mondayOf, type ISODate } from '../util/dates.ts';

const STD_DIST: Record<string, number> = { '5K': 5000, '10K': 10000, HM: 21097.5, M: 42195 };
const FAMILY_OF_DIST: Record<string, string> = { '5K': 'short', '10K': 'short', HM: 'road_classic', M: 'road_classic', '50K': 'ultra', '100K': 'ultra' };

export interface ExpView {
  path: ExpPath;
  race: (Anchor & { std: string }) | null;
  agegrade_pct: number | null;
  band: string | null;
  claims_consistent: boolean;
  /** EXP-006: everything holds except the unanswered "official result" question */
  ask_confirm: boolean;
  /** EXP-001 fired in this call (entry, not a stored path) */
  entered: boolean;
  calibration_from: ISODate | null;
  calibration_until: ISODate | null;
  fallback_nodes: Node[];
  fallback_reason: ExperiencedState['fallback_reason'];
  rpe_high_keys: number; missed_week: boolean; volume_ratio_min: number | null; calibration_complete: boolean;
  /** performance-side levels of EXP-002 (THR, VO2, MSP) */
  perf_levels: Partial<Record<Node, number>>;
  fired: { stage: string; rule_id: string; op: string; target?: string; value?: number | string | boolean | null }[];
  messages: string[];
}

/** The plan's week 1 (Q-E13): the first Monday on or after today. */
export function planStartFrom(today: ISODate): ISODate {
  const wd = (new Date(today + 'T00:00:00Z').getUTCDay() + 6) % 7;
  return wd === 0 ? today : addDays(today, 7 - wd);
}

/** The race's standard distance (5K, 10K, HM, M) within exp.distance_tol_pct, else null. */
export function standardDistance(spec: Spec, distance_m: number): string | null {
  const tol = pnum(spec, 'exp.distance_tol_pct') / 100;
  for (const [k, d] of Object.entries(STD_DIST)) if (Math.abs(distance_m - d) <= tol * d) return k;
  return null;
}

/**
 * 02 §2b age-grade: 100 × open standard / age factor / time, factors interpolated linearly between the listed ages.
 * The tables (perf.wma_open_s, perf.wma_age_factor) are an approximation from memory, not the WMA 2023 tables (ALLEGED).
 * Sex unknown: the lower of the two values (INP-032, conservative for a value that unlocks training).
 */
export function ageGradePct(spec: Spec, std: string, time_s: number, age: number, sex: 'f' | 'm' | null): number | null {
  const open = pval<Record<string, Record<string, number>>>(spec, 'perf.wma_open_s');
  const fac = pval<Record<string, Record<string, number>>>(spec, 'perf.wma_age_factor');
  const one = (s: 'f' | 'm') => {
    const tbl = fac[s]; const ages = Object.keys(tbl).map(Number).sort((a, b) => a - b);
    let f = tbl[String(ages[0])];
    if (age >= ages.at(-1)!) f = tbl[String(ages.at(-1))];
    else for (let i = 0; i + 1 < ages.length; i++) if (age >= ages[i] && age <= ages[i + 1]) {
      const a0 = ages[i], a1 = ages[i + 1]; f = tbl[String(a0)] + (tbl[String(a1)] - tbl[String(a0)]) * (age - a0) / (a1 - a0); break;
    }
    const o = open[s]?.[std];
    return o && time_s > 0 ? (100 * o) / f / time_s : null;
  };
  if (sex === 'f' || sex === 'm') return one(sex);
  const a = one('m'), b = one('f');
  return a == null || b == null ? (a ?? b) : Math.min(a, b);
}

/** Lower edge (as a string key) of the exp.level_table row the age-grade falls in. */
export function bandOf(spec: Spec, pct: number): string {
  const edges = pval<number[]>(spec, 'exp.agegrade_bands');
  let key = '0';
  for (const e of edges) if (pct >= e) key = String(e);
  return key;
}

export interface ExpInputs {
  spec: Spec; input: GeneratorInput; ageAt: (d: ISODate) => number | null;
  /** entries (as derived by S0: measured, flagged) */
  entries: (ActivityRecord & { measured: boolean; flagged: boolean; is_run: boolean })[];
  entryBlocked: boolean;
}

export function experiencedPath(x: ExpInputs): ExpView {
  const { spec, input } = x;
  const P = (id: string) => pnum(spec, id);
  const today = input.today;
  const prev: ExperiencedState | null = input.engine_state?.experienced ?? null;
  const fired: ExpView['fired'] = [];
  const messages: string[] = [];
  // qualifying race (02 §2b): most recent anchor of kind race at a standard distance
  const races = [...input.anchors].filter(a => a.kind === 'race' && standardDistance(spec, a.distance_m)).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const r0 = prev?.race_id ? (races.find(a => a.id === prev.race_id) ?? races[0]) : races[0];
  const race = r0 ? { ...r0, std: standardDistance(spec, r0.distance_m)! } : null;
  const age = race ? x.ageAt(race.date) : null;
  const agegrade_pct = race && age != null ? ageGradePct(spec, race.std, race.time_s, age, input.profile.sex) : null;
  const band = agegrade_pct != null ? bandOf(spec, agegrade_pct) : null;
  // claim consistency (EXP-001): weekly time inside the row's band, runs/week ≥ exp.runs_min, claimed L30 ≤ claimed weekly distance (GEN-022 clause 1)
  const c = input.claim;
  const wk = (c.weekly_time_s ?? 0) / 60;
  const lo = band ? pval<Record<string, number>>(spec, 'exp.volume_band_min_min')[band] ?? 0 : Infinity;
  const hi = band ? pval<Record<string, number | null>>(spec, 'exp.volume_band_max_min')[band] ?? null : null;
  const claims_consistent = !!band && wk >= lo && (hi == null || wk <= hi) && (c.runs_per_week ?? 0) >= P('exp.runs_min')
    && !(c.L30_distance_m != null && c.weekly_distance_m != null && c.L30_distance_m > c.weekly_distance_m && (c.runs_per_week ?? 0) >= 2);
  const painFlag = input.flags.some(f => f.status === 'active' && f.kind === 'pain');
  const injuryOk = input.profile.injury_last_12m !== true || input.profile.injury_last_12w === false;
  const ageNow = x.ageAt(today);
  const baseOk = !!race && race.effort_all_out === true && daysBetween(race.date, today) <= P('exp.race_max_age_days') && daysBetween(race.date, today) >= 0
    && (input.profile.training_age_years ?? 0) >= P('exp.training_age_min') && ageNow != null && ageNow >= P('exp.age_min')
    && claims_consistent && !painFlag && injuryOk && !x.entryBlocked;
  // perf-side levels (EXP-002): THR, VO2 by band; MSP only when the race's family is the goal's family
  const tbl = band ? pval<Record<string, Record<string, number>>>(spec, 'exp.level_table')[band] : null;
  const sameFamily = race && FAMILY_OF_DIST[race.std] === FAMILY_OF_DIST[input.goal.distance];
  const perf_levels: ExpView['perf_levels'] = tbl ? { THR: tbl.THR ?? 0, VO2: tbl.VO2 ?? 0, MSP: sameFamily ? (tbl.MSP ?? 0) : 0 } : {};

  let path: ExpPath = prev?.path ?? 'none';
  let entered = false;
  let calibration_from = prev?.calibration_from ?? null, calibration_until = prev?.calibration_until ?? null;
  let fallback_nodes: Node[] = [...(prev?.fallback_nodes ?? [])];
  let fallback_reason = prev?.fallback_reason ?? null;
  let ask_confirm = false;
  if (path === 'none') {
    if (baseOk && race!.official_result_confirmed === true) {
      // EXP-001: enter the path; calibration covers plan weeks 1 … exp.calibration_weeks
      path = 'calibrating'; entered = true;
      calibration_from = planStartFrom(today);
      calibration_until = addDays(calibration_from, 7 * P('exp.calibration_weeks') - 1);
      fired.push({ stage: 'S2', rule_id: 'EXP-001', op: 'set', target: 'state.exp_path', value: 'calibrating' });
      messages.push('MSG-EXP-PATH');
    } else if (baseOk && race!.official_result_confirmed == null) {
      ask_confirm = true;                                                           // EXP-006
      fired.push({ stage: 'S2', rule_id: 'EXP-006', op: 'emit_message', value: 'MSG-EXP-CONFIRM-Q' });
      messages.push('MSG-EXP-CONFIRM-Q');
    }
  }

  // EXP-004 / EXP-005: calibration signals from the completed calibration weeks (re-plans)
  let rpe_high_keys = 0, missed_week = false, volume_ratio_min: number | null = null, calibration_complete = false;
  if (path === 'calibrating' && calibration_from && calibration_until) {
    const thisMonday = mondayOf(today);
    const parent: Plan | null = input.parent_plan;
    const weeks: ISODate[] = [];
    for (let m = calibration_from; m <= calibration_until && addDays(m, 7) <= thisMonday; m = addDays(m, 7)) weeks.push(m);
    const runs = x.entries.filter(e => e.is_run && !e.flagged);
    const targetRpe = pval<Record<string, number>>(spec, 'ses.target_rpe');
    const rungNode = pval<Record<string, Node>>(spec, 'ses.rung_node');
    const nodes = new Set<Node>();
    for (const ws of weeks) {
      const inWeek = runs.filter(e => daysBetween(ws, e.date) >= 0 && daysBetween(ws, e.date) < 7);
      if (!inWeek.length) missed_week = true;
      const pw = parent?.weeks.find(w => w.start === ws);
      if (pw && pw.planned_time_s > 0) {
        const ratio = inWeek.reduce((a, e) => a + e.duration_s, 0) / pw.planned_time_s;
        volume_ratio_min = volume_ratio_min == null ? ratio : Math.min(volume_ratio_min, ratio);
      }
      for (const e of inWeek) {
        const ps = pw?.sessions.find(s => s.id === e.planned_session_id && s.date === e.date);
        if (!ps || !ps.is_key || ps.is_test || e.rpe_0_10 == null) continue;
        const lim = Math.min((targetRpe[ps.effort_target] ?? targetRpe.E3) + P('ses.progress_rpe_margin'), P('result.rpe_high') - 1);
        if (e.rpe_0_10 > lim) { rpe_high_keys++; if (rungNode[ps.module_id]) nodes.add(rungNode[ps.module_id]); }
      }
    }
    const whole: ExperiencedState['fallback_reason'] = painFlag ? 'pain' : missed_week ? 'missed_week' : (volume_ratio_min != null && volume_ratio_min < P('exp.fallback_volume_ratio')) ? 'volume' : null;
    if (whole) {
      path = 'fallen_back'; fallback_reason = whole;
      fired.push({ stage: 'S2', rule_id: 'EXP-004', op: 'set', target: 'state.exp_path', value: 'fallen_back' });
      messages.push('MSG-EXP-FALLBACK');
    } else if (rpe_high_keys >= P('exp.fallback_rpe_sessions')) {
      const add = [...nodes].filter(n => !fallback_nodes.includes(n));
      if (add.length) {
        fallback_nodes = [...fallback_nodes, ...add].sort(); fallback_reason = 'rpe';
        fired.push({ stage: 'S2', rule_id: 'EXP-004', op: 'set', target: 'state.exp_fallback_nodes', value: fallback_nodes.join(',') });
        messages.push('MSG-EXP-FALLBACK');
      }
    }
    const nCal = Math.round((daysBetween(calibration_from, calibration_until) + 1) / 7);
    calibration_complete = path === 'calibrating' && weeks.length === nCal && !missed_week;
    if (calibration_complete && daysBetween(calibration_until, today) > 0) {
      path = 'confirmed';                                                           // EXP-005
      fired.push({ stage: 'S2', rule_id: 'EXP-005', op: 'set', target: 'state.exp_path', value: 'confirmed' });
      messages.push('MSG-EXP-CONFIRMED');
    }
  }
  return { path, race, agegrade_pct, band, claims_consistent, ask_confirm, entered, calibration_from, calibration_until, fallback_nodes, fallback_reason,
    rpe_high_keys, missed_week, volume_ratio_min, calibration_complete, perf_levels, fired, messages };
}

export const onExpPath = (p: ExpPath) => p === 'calibrating' || p === 'confirmed';

export function engineStateExperienced(v: ExpView, prev: EngineState | null): ExperiencedState | null {
  if (v.path === 'none' && !prev?.experienced) return null;
  const out: ExperiencedState = { path: v.path };
  const since = prev?.experienced?.since ?? v.calibration_from;
  if (since) out.since = since;
  if (v.calibration_from) out.calibration_from = v.calibration_from;
  if (v.calibration_until) out.calibration_until = v.calibration_until;
  out.fallback_nodes = v.fallback_nodes;
  out.fallback_reason = v.fallback_reason ?? null;
  if (v.race) out.race_id = v.race.id;
  return out;
}

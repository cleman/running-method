// S0 Normalise and S2 Derived state (07 §3, §4; 02 §2; 05 §2). Native code: each value names the rule it implements.
import type { ActivityRecord, Anchor, Confidence, GeneratorInput, Node } from '../model/types.ts';
import { addDays, daysBetween, isoWeek, toDays, mondayOf, type ISODate } from '../util/dates.ts';
import { type Spec, pnum, pval, roundDown } from '../context.ts';

export interface EntryView extends ActivityRecord { measured: boolean; flagged: boolean; is_run: boolean }

export interface DerivedState {
  today: ISODate;
  age_low: (d: ISODate) => number | null;
  age_high: (d: ISODate) => number | null;
  entries: EntryView[];
  log_status: 'rich' | 'sparse' | 'none';
  days_since_last_run: number | null;
  never_run: boolean;
  V28_time_s: number; V28_dist_m: number | null; V7_prev_time_s: number;
  L30_eff_time_s: number; L30_eff_dist_m: number | null;
  /** where L30_eff came from: logged runs (dated) or a claim (treated as dated today, docs/questions.md Q4) */
  L30_source: 'log' | 'claim' | 'undefined_rtr' | 'none';
  L30_conf: Confidence;
  V_hold_s: number; L_hold_s: number;
  logged_week_totals: { start: ISODate; time_s: number }[];
  tol_tier: number;
  levels: Record<Node, number>;
  level_confidence: Record<Node, Confidence>;
  slow_ctx: string[];          // rule ids of context slow triggers (CTX-001/002/003, CMP-005) that last the whole plan
  slow_log: boolean;           // slow because of the log (GEN-011/014, CTX-007): ends after log.probation_weeks
  probation_weeks_left: number;
  baseline_confirmed: boolean;
  est_confirm_weeks: number;
  s_slow: number;              // m/s, demand conversion only (FEA-002)
  median_easy_speed: number | null;
  anchor: (Anchor & { confidence: Confidence; equiv_10k_s: number }) | null;
  core_inputs: { name: string; confidence: Confidence }[];
  deload_every_ctx: boolean;
  gap_band: '8_14' | '15_29' | null;
  messages: string[];
  fired: { stage: string; rule_id: string; op: string; target?: string; value?: number | string | boolean | null }[];
}

export const NODES: Node[] = ['HAB', 'TOL', 'AER', 'THR', 'VO2', 'ECO', 'DUR', 'MSP', 'FUEL', 'HEAT', 'PACE'];
const TOL_V = [0, 60, 150, 240, 360, 540];     // 02 §2, minutes / week
const TOL_L = [0, 20, 60, 100, 150, 210];      // 02 §2, minutes
const AER_V = [0, 90, 180, 300, 450, 600];     // 02 §2
const DUR_L = [0, 60, 90, 135, 180];           // 02 §2 (L3 "120–150": lower bound of the session 06 test, ses.exit.DUR3_min)
const LAST_RUN_BAND_DAYS: Record<string, number> = { this_week: 3, '1_2_weeks': 11, '2_4_weeks': 22, '1_3_months': 60, '3_12_months': 180, over_a_year: 400 };

const RUN_TYPES = new Set(['run', 'run_walk', 'race', 'test']);

/** "Entered within log.contemporaneous_window_h of the end of the session date" (07 §3). */
function enteredWithin(dateStr: ISODate, enteredAt: string, hours: number): boolean {
  // entered_at carries its own offset; the local wall-clock time is what the runner saw, so read it as local.
  const localDay = enteredAt.slice(0, 10);
  const hh = Number(enteredAt.slice(11, 13) || 0), mm = Number(enteredAt.slice(14, 16) || 0);
  const hoursAfterDayEnd = (toDays(localDay) - (toDays(dateStr) + 1)) * 24 + hh + mm / 60;
  return hoursAfterDayEnd <= hours && toDays(localDay) >= toDays(dateStr);
}

export function ageFns(input: GeneratorInput) {
  const by = input.profile.birth_year, bm = input.profile.birth_month;
  // INP-002: age with the month. Low = the youngest the runner can be on d (birthday assumed at the end of the month).
  const low = (d: ISODate) => (by == null || bm == null ? null : Number(d.slice(0, 4)) - by - (Number(d.slice(5, 7)) <= bm ? 1 : 0));
  const high = (d: ISODate) => (by == null || bm == null ? null : Number(d.slice(0, 4)) - by - (Number(d.slice(5, 7)) < bm ? 1 : 0));
  return { low, high };
}

function median(xs: number[]): number { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }

/** Riegel time at distance d from an anchor; marathon uses the riegel_marathon exponent (03 §3). */
export function riegel(spec: Spec, a: { distance_m: number; time_s: number }, d: number): number {
  const e0 = pnum(spec, 'pred.riegel_exp_min');
  const e = d >= 42195 ? Math.max(e0, Math.log(pnum(spec, 'pred.marathon_from_half')) / Math.log(2)) : e0;
  return a.time_s * Math.pow(d / a.distance_m, e);
}

export function deriveState(spec: Spec, input: GeneratorInput): DerivedState {
  const today = input.today;
  const P = (id: string) => pnum(spec, id);
  const { low, high } = ageFns(input);
  const fired: DerivedState['fired'] = [];
  const messages: string[] = [];
  const claim = input.claim;
  const prof = input.profile;
  const es = input.engine_state;

  // ---- S0: entries, confidence (07 §3), plausibility (GEN-020, pace bounds only; SPEC-QUESTION Q-E9)
  const win = P('log.contemporaneous_window_h');
  const createdPerDay = new Map<string, number>();
  for (const e of input.log) { const k = e.entered_at.slice(0, 10); createdPerDay.set(k, (createdPerDay.get(k) ?? 0) + 1); }
  const entries: EntryView[] = input.log.filter(e => toDays(e.date) <= toDays(today)).map(e => {
    const is_run = RUN_TYPES.has(e.type);
    const bulk = (createdPerDay.get(e.entered_at.slice(0, 10)) ?? 0) > P('log.bulk_backfill_max') && !enteredWithin(e.date, e.entered_at, win);
    let measured = (e.source === 'tick' || e.source === 'manual_add') && enteredWithin(e.date, e.entered_at, win) && !bulk;
    let flagged = false;
    if (is_run && e.distance_m && e.distance_m > 0 && e.duration_s > 0) {
      const pace = e.duration_s / (e.distance_m / 1000);
      const maxPace = e.type === 'run_walk' ? P('log.pace_max_s_per_km.run_walk') : P('log.pace_max_s_per_km.run');
      if (pace < P('log.pace_min_s_per_km') || pace > maxPace) {
        flagged = e.plausibility_answer !== 'confirmed';
        if (!flagged) measured = false; // GEN-021: a confirmed flagged entry counts as estimated
        fired.push({ stage: 'S2', rule_id: flagged ? 'GEN-020' : 'GEN-021', op: flagged ? 'flag_entry' : 'set', target: 'entry:' + e.id });
      }
    }
    return { ...e, measured, flagged, is_run };
  });
  const runs = entries.filter(e => e.is_run && !e.flagged);
  const inLast = (e: ActivityRecord, n: number) => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) < n;
  const measured30 = runs.filter(e => e.measured && inLast(e, 30));

  // ---- log status (07 §3)
  const weeks30 = new Set(measured30.map(e => isoWeek(e.date)));
  const anyClaim = [claim.runs_per_week, claim.weekly_time_s, claim.weekly_distance_m, claim.L30_duration_s, claim.L30_distance_m].some(v => v != null && v !== 0);
  const log_status: DerivedState['log_status'] = measured30.length >= P('log.min_entries_30d') && weeks30.size >= 2 ? 'rich'
    : runs.some(e => inLast(e, 30)) || anyClaim ? 'sparse' : 'none';

  // ---- days since last run (01 §1.2 bands), never-run
  const lastLogged = runs.map(e => e.date).sort().at(-1);
  const never_run = prof.never_run || claim.last_run_band === 'never';
  let days_since_last_run: number | null = null;
  if (lastLogged) days_since_last_run = daysBetween(lastLogged, today);
  else if (claim.last_run_date) days_since_last_run = daysBetween(claim.last_run_date, today);
  else if (claim.last_run_band && claim.last_run_band in LAST_RUN_BAND_DAYS) days_since_last_run = LAST_RUN_BAND_DAYS[claim.last_run_band];

  // ---- weekly totals of logged weeks before today (Monday start)
  const thisMonday = mondayOf(today);
  const weekTotals = new Map<string, number>();
  for (const e of runs) if (toDays(e.date) < toDays(thisMonday)) { const m = mondayOf(e.date); weekTotals.set(m, (weekTotals.get(m) ?? 0) + e.duration_s); }
  const logged_week_totals = [...weekTotals.entries()].map(([start, time_s]) => ({ start, time_s })).sort((a, b) => a.start.localeCompare(b.start));

  // ---- V28, V7 (07 §3)
  const runs28 = runs.filter(e => inLast(e, 28));
  let V28_time_s: number, V28_dist_m: number | null;
  const claimSpeed = claim.weekly_distance_m && claim.weekly_time_s ? claim.weekly_distance_m / claim.weekly_time_s : null;
  if (log_status === 'rich') {
    V28_time_s = Math.round(runs28.reduce((s, e) => s + e.duration_s, 0) / 4);
    V28_dist_m = Math.round(runs28.reduce((s, e) => s + (e.distance_m ?? 0), 0) / 4);
  } else {
    const logged = runs28.reduce((s, e) => s + e.duration_s, 0) / 4;
    V28_time_s = Math.max(logged, claim.weekly_time_s ?? (claim.weekly_distance_m && claimSpeed ? claim.weekly_distance_m / claimSpeed : 0));
    V28_dist_m = claim.weekly_distance_m ?? (runs28.length ? Math.round(runs28.reduce((s, e) => s + (e.distance_m ?? 0), 0) / 4) : null);
  }
  const V7_prev_time_s = runs.filter(e => daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) < 7).reduce((s, e) => s + e.duration_s, 0) || V28_time_s;

  // ---- TOL tier from claims/log (INP-030), self-report capped (CMP-004)
  const selfReport = log_status !== 'rich';
  const capOf = (n: Node) => (pval<Record<string, number>>(spec, 'cmp.self_report_level_cap')[n] ?? 0);
  const l30ForLevels = log_status === 'rich' ? Math.max(0, ...measured30.map(e => e.duration_s)) : Math.max(claim.L30_duration_s ?? 0, ...runs.filter(e => inLast(e, 30)).map(e => e.duration_s));
  let tol = 0;
  for (let n = 1; n <= 5; n++) if (V28_time_s >= TOL_V[n] * 60 && l30ForLevels >= TOL_L[n] * 60) tol = n;
  // SPEC-QUESTION Q-E7: 13 §3 calls Ana "TOL 3" (cap 120 min); her claimed 210 min/week is below the TOL 3 threshold (240) and
  // CMP-004 caps a claim at TOL 2 anyway, so the engine uses TOL 2 (cap 90). Her L30_eff is 85 either way.
  if (selfReport) tol = Math.min(tol, capOf('TOL'));
  const tol_tier = tol;

  // ---- L30_eff (GEN-010 / GEN-011 / GEN-012)
  let L30_eff_time_s = 0, L30_eff_dist_m: number | null = null;
  let L30_source: DerivedState['L30_source'] = 'none';
  let L30_conf: Confidence = 'unknown';
  const rtrGap = days_since_last_run !== null && days_since_last_run >= P('gap.rtr_trigger_days');
  if (log_status === 'rich' && !rtrGap) {
    L30_eff_time_s = Math.max(...measured30.map(e => e.duration_s));
    const d = measured30.map(e => e.distance_m ?? 0);
    L30_eff_dist_m = d.length ? Math.max(...d) || null : null;
    L30_source = 'log'; L30_conf = 'measured';
    fired.push({ stage: 'S2', rule_id: 'GEN-010', op: 'set', target: 'state.L30_eff_time_s', value: L30_eff_time_s });
  } else if (log_status === 'sparse' && !rtrGap) {
    const disc = P('claim.l30_discount');
    const loggedL30t = Math.max(0, ...runs.filter(e => e.measured && inLast(e, 30)).map(e => e.duration_s));
    const loggedL30d = Math.max(0, ...runs.filter(e => e.measured && inLast(e, 30)).map(e => e.distance_m ?? 0));
    const claimT = claim.L30_duration_s ?? (claim.L30_distance_m && claimSpeed ? claim.L30_distance_m / claimSpeed : null);
    L30_eff_time_s = Math.max(loggedL30t, claimT != null ? disc * claimT : 0);
    const capByTol = pval<Record<string, number | null>>(spec, 'claim.l30_cap_by_tol')[String(tol_tier)];
    if (capByTol != null) L30_eff_time_s = Math.min(L30_eff_time_s, capByTol * 60);
    if (claim.L30_distance_m != null || loggedL30d > 0) {
      let d = Math.max(loggedL30d, disc * (claim.L30_distance_m ?? 0));
      if (claim.weekly_distance_m != null) d = Math.min(d, P('claim.l30_week_ratio_max') * claim.weekly_distance_m);
      L30_eff_dist_m = d > 0 ? roundDown(d, P('load.round_down_m')) : null;
    }
    L30_source = loggedL30t >= L30_eff_time_s && loggedL30t > 0 ? 'log' : 'claim';
    L30_conf = 'estimated';
    fired.push({ stage: 'S2', rule_id: 'GEN-011', op: 'set', target: 'state.L30_eff_time_s', value: roundDown(L30_eff_time_s, 60) });
  } else if (!never_run) {
    L30_source = 'undefined_rtr';
    fired.push({ stage: 'S2', rule_id: 'GEN-012', op: 'insert_phase', target: 'RTR' });
  }
  // SPEC-QUESTION Q-E3: L30_eff is rounded down to whole minutes (load.round_down_s), as 13 §3 does (0.9 × 95 = 85.5 → 85).
  L30_eff_time_s = roundDown(L30_eff_time_s, P('load.round_down_s'));

  // ---- levels (02 §2 thresholds; CMP-001 log, CMP-004 self-report cap), then EngineState levels from tests/credit
  const levels = Object.fromEntries(NODES.map(n => [n, 0])) as Record<Node, number>;
  const level_confidence = Object.fromEntries(NODES.map(n => [n, 'unknown'])) as Record<Node, Confidence>;
  const conf: Confidence = selfReport ? 'estimated' : 'measured';
  const runsPerWeek = log_status === 'rich' ? runs28.length / 4 : (claim.runs_per_week ?? 0);
  if (!never_run && (runsPerWeek > 0 || runs.length)) {
    levels.HAB = 1;
    const continuous = log_status === 'rich' ? runs28.some(e => e.type !== 'run_walk' && e.duration_s >= 1800) : claim.continuous_30min === true;
    if (runsPerWeek >= 3 && continuous) levels.HAB = 2;
    if (runsPerWeek >= 4 && continuous) levels.HAB = 3;
    if (runsPerWeek >= 5 && continuous) levels.HAB = 4;
  }
  levels.TOL = tol;
  for (let n = 1; n <= 5; n++) if (V28_time_s >= AER_V[n] * 60) levels.AER = n;
  for (let n = 1; n <= 4; n++) if (l30ForLevels >= DUR_L[n] * 60) levels.DUR = n;
  for (const n of ['HAB', 'AER', 'DUR'] as Node[]) if (selfReport) levels[n] = Math.min(levels[n], capOf(n));
  for (const n of ['HAB', 'TOL', 'AER', 'DUR'] as Node[]) if (levels[n] > 0) level_confidence[n] = conf;
  for (const l of es?.levels ?? []) {
    if (l.level > levels[l.node]) { levels[l.node] = l.level; level_confidence[l.node] = l.confidence; }
  }
  fired.push({ stage: 'S2', rule_id: selfReport ? 'CMP-004' : 'CMP-001', op: selfReport ? 'cap' : 'set', target: 'state.levels' });

  // ---- progression profile triggers (05 §2; CTX-001/002/003 and CMP-005 run in S1 through the engine and are re-read here)
  const novice = prof.training_age_years != null && prof.training_age_years < P('ctx.novice_training_age_years');
  const slow_ctx: string[] = [];
  if (novice || claim.runs_per_week === 0) slow_ctx.push('CTX-001');
  if (['cycling', 'swimming', 'triathlon'].includes(prof.other_sport_background ?? '') && novice) slow_ctx.push('CTX-002');
  if (prof.injury_last_12m === true) slow_ctx.push('CTX-003');
  const coreEstimated = log_status !== 'rich';
  const slow_log = coreEstimated;
  const probationDone = es?.progression_profile_until ? Math.max(0, Math.ceil(daysBetween(today, es.progression_profile_until) / 7)) : P('log.probation_weeks');
  const probation_weeks_left = slow_log ? probationDone : 0;
  const masters = (high(today) ?? 0) >= P('ctx.masters_age');
  const deload_every_ctx = slow_ctx.length > 0 || masters;

  // ---- baseline confirmation (LOD-008): consecutive completed logged weeks before today
  let est_confirm_weeks = es?.est_confirm_weeks ?? 0;
  if (!es) {
    let n = 0;
    for (let k = 1; k <= 52; k++) {
      const m = addDays(thisMonday, -7 * k);
      const has = runs.some(e => e.measured && mondayOf(e.date) === m);
      if (!has) break;
      n++;
    }
    est_confirm_weeks = n;
  }
  const baseline_confirmed = es?.baseline_confirmed === true || est_confirm_weeks >= P('prog.est.confirm_weeks');

  // ---- S_slow (03 §2): median speed of measured runs (28 days, ≥ log.min_entries_30d), else claims, else default pace
  const speeds = runs28.filter(e => e.measured && e.distance_m && e.duration_s && e.type !== 'race' && e.type !== 'test').map(e => (e.distance_m as number) / e.duration_s);
  const median_easy_speed = speeds.length >= P('log.min_entries_30d') ? median(speeds) : null;
  const baseSpeed = median_easy_speed ?? claimSpeed ?? 1000 / P('feas.default_planning_pace_s_per_km');
  const s_slow = baseSpeed * (1 - P('feas.planning_speed_margin'));

  // ---- anchor (03 §3, INP-005): most recent; measured = race/test entered within the window and ≤ anchor.max_age_days
  let anchor: DerivedState['anchor'] = null;
  const sorted = [...input.anchors].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  if (es?.active_anchor_id) { const i = sorted.findIndex(a => a.id === es.active_anchor_id); if (i > 0) sorted.unshift(...sorted.splice(i, 1)); }
  if (sorted.length) {
    const a = sorted[0];
    const fresh = daysBetween(a.date, today) <= P('anchor.max_age_days');
    const measured = a.kind !== 'recalled' && enteredWithin(a.date, a.entered_at, win) && fresh;
    anchor = { ...a, confidence: measured ? 'measured' : 'estimated', equiv_10k_s: riegel(spec, a, 10000) };
  }

  // ---- V_hold, L_hold (05 §2)
  let V_hold_s = roundDown(V28_time_s, P('load.round_down_s'));
  let L_hold_s = L30_eff_time_s;
  // LOD-070: with L30 undefined (return ladder) the hold values come from the ladder exit, not from pre-gap history
  if (L30_source === 'undefined_rtr' || never_run) { V_hold_s = 0; L_hold_s = 0; }
  // GEN-013: after a gap of gap.reduce_trigger_days … gap.rtr_trigger_days the first week is cut by the band factors.
  // SPEC-QUESTION Q-E24: the hold values (LOD-005, INV-27) then start from those reduced first-week values, and pre-gap runs
  // count in the 30-day window for the first week only (LOD-011).
  let gap_band: '8_14' | '15_29' | null = null;
  if (days_since_last_run !== null && days_since_last_run >= P('gap.reduce_trigger_days') && days_since_last_run < P('gap.rtr_trigger_days') && !never_run) {
    gap_band = days_since_last_run < 15 ? '8_14' : '15_29';
    V_hold_s = roundDown(Math.min(V_hold_s, P('gap.vol_factor.' + gap_band) * V7_prev_time_s), P('load.round_down_s'));
    L_hold_s = roundDown(P('gap.long_factor.' + gap_band) * L30_eff_time_s, P('load.round_down_s'));
    fired.push({ stage: 'S2', rule_id: 'GEN-013', op: 'cap', target: 'state.V_hold_s', value: V_hold_s });
  }

  const core_inputs = [
    { name: 'L30_eff', confidence: L30_conf },
    { name: 'V28', confidence: log_status === 'rich' ? 'measured' as Confidence : (V28_time_s > 0 ? 'estimated' as Confidence : 'unknown' as Confidence) },
    ...(anchor ? [{ name: 'anchor', confidence: anchor.confidence }] : []),
  ];

  return {
    today, age_low: low, age_high: high, entries, log_status, days_since_last_run, never_run,
    V28_time_s, V28_dist_m, V7_prev_time_s, L30_eff_time_s, L30_eff_dist_m, L30_source, L30_conf,
    V_hold_s, L_hold_s, logged_week_totals, tol_tier, levels, level_confidence, slow_ctx, slow_log,
    probation_weeks_left, baseline_confirmed, est_confirm_weeks, s_slow, median_easy_speed, anchor, core_inputs,
    deload_every_ctx, messages, fired, gap_band,
  };
}

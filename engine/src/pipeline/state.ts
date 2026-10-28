// S0 Normalise and S2 Derived state (07 §3, §4; 02 §2; 05 §2). Native code: each value names the rule it implements.
import type { ActivityRecord, Anchor, Confidence, EngineState, GeneratorInput, Node } from '../model/types.ts';
import { PREREQS } from '../rules/helpers.ts';
import { addDays, daysBetween, isoWeek, toDays, mondayOf, type ISODate } from '../util/dates.ts';
import { type Spec, pnum, pval, roundDown } from '../context.ts';
import { experiencedPath, onExpPath, type ExpView } from './experienced.ts';

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
  claim_day: number;
  fuel_step_g_h: number;
  /** SES-011: dose step of the last logged non-deload instance of each module, and the step its next instance takes */
  module_dose: Record<string, number>; module_next_step: Record<string, number>;
  /** level tests passed in this call (CMP-002), test records (SES-013) and tests due (SES-012) */
  test_levels: { node: Node; level: number; achieved_on: ISODate }[]; exit_tests: NonNullable<EngineState['exit_tests']>;
  tests_due: { node: Node; level: number; module: string; lr_min_s: number | null }[];
  /** SAF-082/083: position in the active ladder (sessions done from its entry, 0-based) and the clean sessions on the current rung */
  ladder_pos: number; ladder_counted: string[];
  /** dates of logged runs that held strides (VO2 L1 log threshold), kept in EngineState.dated_events.strides_runs */
  strides_dates: Set<ISODate>;
  /** v5.3 experienced-runner path (02 §2b) */
  exp: ExpView;
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

export function deriveState(spec: Spec, input: GeneratorInput, opts: { expEntryBlocked?: boolean } = {}): DerivedState {
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

  // ---- v5.3 experienced-runner path (02 §2b, EXP-001/004/005/006); EXP-001 needs gate = proceed, so the caller
  // re-derives with expEntryBlocked when S1 did not proceed
  const exp = experiencedPath({ spec, input, ageAt: low, entries, entryBlocked: opts.expEntryBlocked === true });
  const onExp = onExpPath(exp.path);
  fired.push(...exp.fired); messages.push(...exp.messages);

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
  // SPEC-QUESTION Q-E27: the 28-day window of V28 may reach back before the profile was created; those weeks were not
  // logged in the tool, so they count at the claimed weekly time, distance and runs (estimated), not as zero.
  const createdAt = (prof.created_at ?? today).slice(0, 10);
  let preWeeksInWindow = 0;
  for (let k = 1; k <= 4; k++) {
    const ws = addDays(today, -7 * k);
    if (addDays(ws, 7) <= createdAt && !runs28.some(e => daysBetween(ws, e.date) >= 0 && daysBetween(ws, e.date) < 7)) preWeeksInWindow++;
  }
  const claimFill = (v: number | null | undefined) => preWeeksInWindow * (v ?? 0);
  if (log_status === 'rich') {
    V28_time_s = Math.round((runs28.reduce((s, e) => s + e.duration_s, 0) + claimFill(claim.weekly_time_s)) / 4);
    V28_dist_m = Math.round((runs28.reduce((s, e) => s + (e.distance_m ?? 0), 0) + claimFill(claim.weekly_distance_m)) / 4);
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
  const tolRaw = tol;
  if (selfReport) tol = Math.min(tol, onExp ? P('exp.claim_level_cap') : capOf('TOL'));   // v5.3 EXP-002 replaces CMP-004 on the experienced path
  const tol_tier = tol;

  // ---- L30_eff (GEN-010 / GEN-011 / GEN-012)
  let L30_eff_time_s = 0, L30_eff_dist_m: number | null = null;
  let L30_source: DerivedState['L30_source'] = 'none';
  let L30_conf: Confidence = 'unknown';
  const rtrGap = days_since_last_run !== null && days_since_last_run >= P('gap.rtr_trigger_days');
  if (log_status === 'rich' && !rtrGap) {
    // LOD-012: a logged race raises L30_eff to at most spike.warn_ratio × the pre-race value
    const nonRace = measured30.filter(e => e.type !== 'race');
    const preRace = Math.max(0, ...nonRace.map(e => e.duration_s));
    const raceCap = P('spike.warn_ratio') * preRace;
    L30_eff_time_s = Math.floor(Math.max(preRace, ...measured30.filter(e => e.type === 'race').map(e => Math.min(e.duration_s, raceCap))));
    const preRaceD = Math.max(0, ...nonRace.map(e => e.distance_m ?? 0));
    const d = measured30.map(e => (e.type === 'race' ? Math.min(e.distance_m ?? 0, P('spike.warn_ratio') * preRaceD) : (e.distance_m ?? 0)));
    L30_eff_dist_m = d.length ? Math.floor(Math.max(...d)) || null : null;
    L30_source = 'log'; L30_conf = 'measured';
    fired.push({ stage: 'S2', rule_id: 'GEN-010', op: 'set', target: 'state.L30_eff_time_s', value: L30_eff_time_s });
  } else if (log_status === 'sparse' && !rtrGap) {
    const disc = onExp ? P('exp.l30_discount') : P('claim.l30_discount');   // v5.3 GEN-011 on the experienced path
    const loggedL30t = Math.max(0, ...runs.filter(e => e.measured && inLast(e, 30)).map(e => e.duration_s));
    const loggedL30d = Math.max(0, ...runs.filter(e => e.measured && inLast(e, 30)).map(e => e.distance_m ?? 0));
    const claimT = claim.L30_duration_s ?? (claim.L30_distance_m && claimSpeed ? claim.L30_distance_m / claimSpeed : null);
    L30_eff_time_s = Math.max(loggedL30t, claimT != null ? disc * claimT : 0);
    const capByTol = pval<Record<string, number | null>>(spec, 'claim.l30_cap_by_tol')[String(tol_tier)];
    if (capByTol != null && !onExp) L30_eff_time_s = Math.min(L30_eff_time_s, capByTol * 60);   // v5.3: no TOL cap on the experienced path
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
  const runsPerWeek = log_status === 'rich' ? (runs28.length + claimFill(claim.runs_per_week)) / 4 : (claim.runs_per_week ?? 0);
  if (!never_run && (runsPerWeek > 0 || runs.length)) {
    levels.HAB = 1;
    const continuous = log_status === 'rich' ? runs28.some(e => e.type !== 'run_walk' && e.duration_s >= 1800) : claim.continuous_30min === true;
    if (runsPerWeek >= 3 && continuous) levels.HAB = 2;
    if (runsPerWeek >= 4 && continuous) levels.HAB = 3;
    if (runsPerWeek >= 5 && continuous) levels.HAB = 4;
  }
  levels.TOL = tol;
  for (let n = 1; n <= 5; n++) if (V28_time_s >= AER_V[n] * 60) levels.AER = n;
  // 06 §3: DUR is attained by its long-run level test (drift-free), not by a log threshold; a self-reported long run
  // still sets it, capped by CMP-004
  if (selfReport) for (let n = 1; n <= 4; n++) if (l30ForLevels >= DUR_L[n] * 60) levels.DUR = n;
  for (const n of ['HAB', 'AER', 'DUR'] as Node[]) if (selfReport) levels[n] = Math.min(levels[n], onExp ? P('exp.claim_level_cap') : capOf(n));
  for (const n of ['HAB', 'TOL', 'AER', 'DUR'] as Node[]) if (levels[n] > 0) level_confidence[n] = conf;
  // v5.3 EXP-002: declared levels (volume side from the claims capped at exp.claim_level_cap, set above; performance side
  // from the race's age-grade band), except the nodes EXP-004 moved back to the cautious path
  void tolRaw;
  if (onExp) {
    if (selfReport) for (const n of ['HAB', 'TOL', 'AER', 'DUR'] as Node[]) if (levels[n] > 0) level_confidence[n] = exp.path === 'confirmed' && n !== 'DUR' ? 'measured' : 'declared';
    for (const [n, l] of Object.entries(exp.perf_levels) as [Node, number][]) {
      if (exp.fallback_nodes.includes(n) || l <= levels[n]) continue;
      levels[n] = l; level_confidence[n] = 'declared';
    }
    fired.push({ stage: 'S2', rule_id: 'EXP-002', op: 'set', target: 'state.levels', value: `THR ${levels.THR} VO2 ${levels.VO2} MSP ${levels.MSP} TOL ${levels.TOL}` });
  }
  // NUT-011/012/013 from the log: practice runs are measured entries with a logged intake
  const practice = runs.filter(e => e.measured && e.carb_g_per_h != null).sort((a, b) => a.date.localeCompare(b.date));
  const gi = (e: ActivityRecord) => e.gi_score_0_10;
  let fuel_step_g_h = P('fuel.start_g_h'), atStep = 0;
  for (const e of practice) {
    const g = gi(e);
    if (g == null) continue;                                                     // a blank stomach score holds the step
    if (g >= P('fuel.gi_stepdown_min')) { fuel_step_g_h = Math.max(P('fuel.start_g_h'), fuel_step_g_h - P('fuel.step_g_h')); atStep = 0; continue; }
    if (g > P('fuel.gi_pass_max')) { atStep = 0; continue; }
    if ((e.carb_g_per_h as number) >= fuel_step_g_h - P('fuel.reach_tol_g_h')) atStep++;
    if (atStep >= P('fuel.step_runs')) { fuel_step_g_h += P('fuel.step_g_h'); atStep = 0; }
  }
  const bands = pval<Record<string, [number, number | null]>>(spec, 'fuel.level_band');
  const lastPractice = practice.filter(e => daysBetween(e.date, today) <= 7 * P('cmp.decay_weeks')).slice(-P('fuel.exit_runs'));
  // (FUEL levels from practice runs are set after the level tests below: FUEL L1 needs DUR L1, Q-E31)
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
  const slow_log = coreEstimated && !onExp;   // v5.3 GEN-014 / CTX-007: not on the experienced path
  // GEN-014 probation: the end date stored in EngineState governs once set (12 §3.8); at the first call it starts today
  const probation_weeks_left = onExp ? 0 : es?.progression_profile_until
    ? Math.max(0, Math.ceil(daysBetween(today, es.progression_profile_until) / 7)) : (slow_log ? P('log.probation_weeks') : 0);
  const masters = (high(today) ?? 0) >= P('ctx.masters_age');
  const deload_every_ctx = slow_ctx.length > 0 || masters;

  // ---- baseline confirmation (LOD-008): consecutive completed logged weeks before today
  // recounted from the log at every call (planned weeks logged as planned meet prog.est.confirm_ratio)
  let est_confirm_weeks = 0;
  for (let k = 1; k <= 52; k++) {
    const m = addDays(thisMonday, -7 * k);
    if (!runs.some(e => e.measured && mondayOf(e.date) === m)) break;
    est_confirm_weeks++;
  }
  const baseline_confirmed = es?.baseline_confirmed === true || est_confirm_weeks >= P('prog.est.confirm_weeks') || exp.path === 'confirmed';   // v5.3 EXP-005

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
    // v5.3 INP-005: a confirmed official all-out race that was entered late is declared (paces only on the experienced path)
    const declared = !measured && fresh && a.kind === 'race' && a.effort_all_out === true && a.official_result_confirmed === true;
    anchor = { ...a, confidence: measured ? 'measured' : declared ? 'declared' : 'estimated', equiv_10k_s: riegel(spec, a, 10000) };
  }

  // Q-E19: a claimed L30 is dated the day before the profile was created (day offset from today, ≤ −1)
  const createdDay = (prof.created_at ?? today).slice(0, 10);
  const claim_day = -1 - Math.max(0, daysBetween(createdDay, today));

  // ---- V_hold, L_hold (05 §2)
  let V_hold_s = roundDown(V28_time_s, P('load.round_down_s'));
  let L_hold_s = L30_eff_time_s;
  // 05 §2: once plan weeks have been logged (a re-plan), V_hold = mean logged volume of the last two non-deload weeks
  if (input.parent_plan) {
    const deloads = new Set([...(es?.dated_events?.deload_weeks ?? []), ...(es?.dated_events?.taper_weeks ?? []), ...input.parent_plan.weeks.filter(w => w.is_deload || w.taper_k).map(w => w.start)]);
    const vals: number[] = [];
    for (let k = 1; k <= 4 && vals.length < 2; k++) {
      const ws = addDays(thisMonday, -7 * k);
      if (ws < mondayOf((prof.created_at ?? today).slice(0, 10))) break;
      if (deloads.has(ws)) continue;
      const t = runs.filter(e => mondayOf(e.date) === ws).reduce((a, e) => a + e.duration_s, 0);
      if (t > 0) vals.push(t);
    }
    if (vals.length) V_hold_s = roundDown(vals.reduce((a, b) => a + b, 0) / vals.length, P('load.round_down_s'));
  }
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

  // ---- SAF-082/083 ladder progress: a clean ladder session (pain ≤ pain.during_max, next morning not worse) counts on the
  // current rung; rtr.sessions_per_rung clean sessions move one rung up; an unclean one drops one rung (not below the
  // entry rung) and restarts its count. One counted session a day, dated on or after the ladder start.
  const perRung = P('rtr.sessions_per_rung');
  let ladder_pos = es?.ladder ? (es.ladder.rung_index - (es.ladder.floor_rung ?? 1)) * perRung + (es.ladder.counted_session_ids?.length ?? 0) : 0;
  const ladder_counted = [...(es?.ladder?.counted_session_ids ?? [])];
  if (es?.ladder) {
    const ladderIds = new Set<string>();
    // session ids restart with each plan version, so a logged entry matches its planned session by id and date
    for (const w of input.parent_plan?.weeks ?? []) for (const x of w.sessions) if (x.ladder && x.ladder.kind !== 'none') ladderIds.add(x.id + '@' + x.date);
    const seenDays = new Set<string>();
    const done = new Set(es.counters ? Object.keys(es.counters).filter(k => k.startsWith('ladder:')).map(k => k.slice(7)) : []);
    for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) {
      if (!e.planned_session_id || !ladderIds.has(e.planned_session_id + '@' + e.date) || e.date < es.ladder.start || seenDays.has(e.date)) continue;
      const key = e.planned_session_id + '@' + e.date;
      if (ladder_counted.includes(key) || done.has(key)) continue;
      seenDays.add(e.date);
      const clean = (e.pain_0_10 == null ? e.pain_any !== true : e.pain_0_10 <= P('pain.during_max')) && e.pain_next_morning !== true;
      if (clean) {
        ladder_counted.push(key); ladder_pos++;
        if (ladder_counted.length >= perRung) { ladder_counted.length = 0; fired.push({ stage: 'S2', rule_id: 'SAF-082', op: 'advance', target: 'state.ladder' }); }
      } else {
        ladder_pos = Math.max(0, (Math.floor(ladder_pos / perRung) - 1) * perRung); ladder_counted.length = 0;
        fired.push({ stage: 'S2', rule_id: 'SAF-083', op: 'drop_rung', target: 'state.ladder' });
      }
    }
  }

  // 02 §2: a finished start ladder credits HAB L2 (27 sessions = 9 rungs × rtr.sessions_per_rung)
  if (es?.ladder?.kind === 'start' && ladder_pos >= 9 * perRung && levels.HAB < 2) { levels.HAB = 2; level_confidence.HAB = 'measured'; }

  // ---- module instances from the log: SES-011 dose steps, SES-024 level-test results (CMP-002), SES-012 test readiness
  // The step of a logged instance is the parent plan session's dose_step when the parent holds it, else it is rebuilt from
  // the log itself (the first instance at the start dose, then SES-011 step by step). Deload instances are skipped
  // (SES-016 start size; the module resumes at its last dose, OQ-22 reading); tests carry no dose step.
  const module_dose: Record<string, number> = { ...(es?.module_dose ?? {}) };
  const module_next_step: Record<string, number> = {};
  const test_levels: { node: Node; level: number; achieved_on: ISODate }[] = [];
  const exit_tests: NonNullable<EngineState['exit_tests']> = [...(es?.exit_tests ?? [])];
  const tests_due: { node: Node; level: number; module: string; lr_min_s: number | null }[] = [];
  const strides_dates = new Set<ISODate>(es?.dated_events?.strides_runs ?? []);
  {
    const stridesSessions = new Set<string>();
    const parentSessions = new Map<string, { step: number | null; planned: number; effort: string; deload: boolean; test_for: { node: Node; level: number } | null }>();
    for (const w of input.parent_plan?.weeks ?? []) for (const x of w.sessions) { if (x.segments.some(g => g.effort === 'E5')) stridesSessions.add(x.id + '@' + x.date); } for (const w of input.parent_plan?.weeks ?? []) for (const x of w.sessions) parentSessions.set(x.id + '@' + x.date, { step: x.dose_step ?? null, planned: x.planned_duration_s, effort: x.effort_target, deload: w.is_deload || !!w.taper_k, test_for: x.is_test ? x.test_for : null });
    const deloadMondays = new Set([...(es?.dated_events?.deload_weeks ?? []), ...(es?.dated_events?.taper_weeks ?? [])]);
    const targetRpe = pval<Record<string, number>>(spec, 'ses.target_rpe');
    const tests = pval<Record<string, Record<string, { module: string; segments: { effort: string; duration_s: number; repeats: number }[] }>>>(spec, 'ses.exit_test.<node>.<level>');
    const workOf = (segs: { effort: string; duration_s?: number | null; repeats: number }[]) => segs.filter(x => x.effort === 'E3' || x.effort === 'E4').reduce((a, x) => a + (x.duration_s ?? 0) * x.repeats, 0);
    const stepsOf = (mid: string) => { const x = pval<{ effort?: string; reps?: number; rep_s?: number }[]>(spec, `ses.dose.${mid}.steps`); return Array.isArray(x) ? x : []; };
    const stepWork = (mid: string, k: number) => { const st0 = stepsOf(mid)[k]; return st0 && st0.rep_s ? st0.rep_s * (st0.reps ?? 1) : 0; };
    const rpeOk = (e: EntryView, effort: string) => { const t = targetRpe[effort] ?? targetRpe.E3; return e.rpe_0_10 != null && e.rpe_0_10 <= Math.min(t + P('ses.progress_rpe_margin'), P('result.rpe_high') - 1); };
    type Inst = { e: EntryView; step: number | null; ok: boolean; work: number };
    const inst = new Map<string, Inst[]>();
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    // SES-024 → CMP-002 / SES-013: level tests linked to a planned test session of the parent plan
    for (const e of sorted) {
      const ps = e.planned_session_id ? parentSessions.get(e.planned_session_id + '@' + e.date) : undefined;
      if (!ps?.test_for) continue;
      const tf = ps.test_for;
      const pass = e.test_completed === true && e.test_held_effort === true && e.pain_next_morning !== true && e.measured &&
        (e.pain_0_10 == null ? e.pain_any !== true : e.pain_0_10 <= P('pain.during_max')) &&
        e.rpe_0_10 != null && e.rpe_0_10 <= (targetRpe[ps.effort] ?? targetRpe.E3) + P('ses.drift_rpe_max');
      const unlogged = e.test_completed == null || e.test_held_effort == null;
      const prereqOk = (PREREQS[`${tf.node} ${tf.level}`] ?? []).every(([n, l]) => (levels[n as Node] ?? 0) >= l);
      if (pass && prereqOk && levels[tf.node] < tf.level) {
        levels[tf.node] = tf.level; level_confidence[tf.node] = 'measured';
        test_levels.push({ node: tf.node, level: tf.level, achieved_on: e.date });
        fired.push({ stage: 'S2', rule_id: 'CMP-002', op: 'set', target: `state.levels.${tf.node}`, value: tf.level });
      } else if (pass && levels[tf.node] < tf.level) {
        // passed while a prerequisite (e.g. TOL L4 for DUR L4, 02 'scheduling vs attaining') did not hold: kept as passed;
        // CMP-002 sets the level once the prerequisites hold, and the test is not scheduled again
        exit_tests.push({ node: tf.node, level: tf.level, status: 'passed', scheduled_week_start: e.date });
      } else if (!pass) {
        exit_tests.push({ node: tf.node, level: tf.level, status: unlogged ? 'unlogged' : 'failed', retest_not_before: addDays(e.date, 7 * P('ses.exit_retest_weeks')) });
        fired.push({ stage: 'S2', rule_id: 'SES-013', op: 'freeze', target: 'state.module_dose', value: tf.node + tf.level });
      }
    }
    // VO2 L1 log threshold (06 §3): strides twice a week in each of the last 4 completed weeks
    {
      const monday = mondayOf(today);
      for (const e of entries) if (e.measured && e.is_run && ((e.planned_session_id && stridesSessions.has(e.planned_session_id + '@' + e.date)) || e.module_id === 'SES-M-006' || e.module_id === 'SES-M-007')) strides_dates.add(e.date);
      const ok = [1, 2, 3, 4].every(k => { const m = addDays(monday, -7 * k); return [...strides_dates].filter(d => mondayOf(d) === m).length >= 2; });
      if (ok && levels.VO2 < 1 && (PREREQS['VO2 1'] ?? []).every(([n, l]) => (levels[n as Node] ?? 0) >= l)) { levels.VO2 = 1; level_confidence.VO2 = 'measured'; fired.push({ stage: 'S2', rule_id: 'CMP-001', op: 'set', target: 'state.levels.VO2', value: 1 }); }
    }
    for (const e of sorted) {
      if (!e.module_id || e.flagged || !e.is_run) continue;
      const ps = e.planned_session_id ? parentSessions.get(e.planned_session_id + '@' + e.date) : undefined;
      if (ps?.deload || deloadMondays.has(mondayOf(e.date))) continue;
      const list = inst.get(e.module_id) ?? [];
      if (e.module_id === 'SES-M-003' || e.module_id === 'SES-M-004') { const l = inst.get('SES-M-003') ?? []; l.push({ e, step: null, ok: rpeOk(e, 'E1'), work: e.duration_s }); inst.set('SES-M-003', l); continue; }
      if (e.type === 'test' || ps?.test_for || (ps && ps.step == null)) continue;
      if (!stepsOf(e.module_id).length) continue;
      const prev = list.at(-1);
      const derived = prev ? (prev.ok ? Math.min((prev.step ?? 0) + 1, stepsOf(e.module_id).length - 1) : (prev.step ?? 0)) : 0;
      const step = ps?.step ?? derived;
      const done = !ps || e.duration_s >= P('miss.partial_ratio') * ps.planned;
      const effort = ps?.effort ?? (stepsOf(e.module_id)[step]?.effort ?? 'E3');
      list.push({ e, step, ok: done && rpeOk(e, effort), work: stepWork(e.module_id, step) });
      inst.set(e.module_id, list);
    }
    for (const [mid, list] of inst) {
      const last = list.at(-1)!;
      if (last.step == null) continue;
      module_dose[mid] = last.step;
      module_next_step[mid] = last.ok ? last.step + 1 : last.step;
    }
    // NUT-013 / 11: FUEL L1–L2 from the last practice runs, once the 02 edges hold (DUR L1 for FUEL L1; Q-E31)
    if (lastPractice.length >= P('fuel.exit_runs')) for (const n of [1, 2]) {
      if (!(PREREQS[`FUEL ${n}`] ?? []).every(([pn, pl]) => (levels[pn as Node] ?? 0) >= pl || pn === 'FUEL')) break;   // Q-E31: 02 edges gate attaining                      // L3 needs race-effort runs (not in MVP)
      if (lastPractice.every(e => (e.carb_g_per_h as number) >= bands[String(n)][0] && gi(e) != null && (gi(e) as number) <= P('fuel.gi_pass_max'))) { levels.FUEL = Math.max(levels.FUEL, n); level_confidence.FUEL = 'measured'; }
    }
    for (const x of exit_tests) if (x.status === 'passed' && levels[x.node] < x.level && levels[x.node] === x.level - 1 && (PREREQS[`${x.node} ${x.level}`] ?? []).every(([pn, pl]) => (levels[pn as Node] ?? 0) >= pl)) {
      levels[x.node] = x.level; level_confidence[x.node] = 'measured';
      test_levels.push({ node: x.node, level: x.level, achieved_on: today });
      fired.push({ stage: 'S2', rule_id: 'CMP-002', op: 'set', target: `state.levels.${x.node}`, value: x.level });
    }
    // SES-012: the next level's test is due once its module was logged ses.exit_ready_sessions times in a row at a work
    // ≥ min(the test's work, the module's maximum), each felt as intended, and the level's prerequisites hold
    const ready = P('ses.exit_ready_sessions');
    const durMin = [0, 60, 90, P('ses.exit.DUR3_min'), 180];
    for (const node of NODES) {
      const n = levels[node] + 1;
      const def = node === 'DUR' ? (n <= 4 ? { module: 'SES-M-003', segments: [] } : null) : tests[node]?.[String(n)];
      // MVP: tests of THR, VO2 and DUR; MSP tests (sized by the race share) and the HAB L2 benchmark are not scheduled yet
      if (!def || !['THR', 'VO2', 'DUR'].includes(node) || (node !== 'DUR' && !def.segments?.length) || (node === 'DUR' && n === 4 && levels.FUEL < 1)) continue;
      if (!(PREREQS[`${node} ${n}`] ?? []).every(([pn, pl]) => (levels[pn as Node] ?? 0) >= pl)) continue;
      const blocked = exit_tests.some(x => x.node === node && x.level === n && (x.status === 'passed' || ((x.status === 'failed' || x.status === 'unlogged') && x.retest_not_before && x.retest_not_before > today)));
      if (blocked) continue;
      const need = node === 'DUR' ? durMin[n] * 60 : Math.min(workOf(def.segments), Math.max(0, ...stepsOf(def.module).map((_, k) => stepWork(def.module, k))));
      const list = (inst.get(def.module) ?? []).slice(-ready);
      if (list.length < ready || !list.every(x => x.ok && x.work >= need)) continue;
      tests_due.push({ node, level: n, module: def.module, lr_min_s: node === 'DUR' ? durMin[n] * 60 : null });
      fired.push({ stage: 'S2', rule_id: 'SES-012', op: 'schedule_session', target: def.module, value: node + n });
    }
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
    deload_every_ctx, messages, fired, exp, gap_band, claim_day, fuel_step_g_h, module_dose, module_next_step, test_levels, exit_tests, tests_due, strides_dates, ladder_pos, ladder_counted,
  };
}

/**
 * Plan-time sources of l30_time (LOD-011), as day offsets from today: the claimed L30_eff (dated by Q-E19) when the L30
 * comes from a claim, and every measured, non-flagged logged run of the last 30 days (a race ≤ spike.warn_ratio × the
 * pre-race maximum, LOD-012). Generator side; the validator keeps its own copy (07 §5a).
 */
export function l30PlanSources(spec: Spec, st: DerivedState): { day: number; s: number }[] {
  const out: { day: number; s: number }[] = [];
  if (st.L30_source === 'claim') out.push({ day: st.claim_day, s: st.L30_eff_time_s });
  const runs = st.entries.filter(e => e.is_run && e.measured && !e.flagged && daysBetween(e.date, st.today) <= 30);
  const pre = Math.max(0, ...runs.filter(e => e.type !== 'race').map(e => e.duration_s));
  for (const e of runs) out.push({ day: -daysBetween(e.date, st.today), s: e.type === 'race' ? Math.min(e.duration_s, pnum(spec, 'spike.warn_ratio') * pre) : e.duration_s });
  return out;
}

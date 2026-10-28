// S8 Validator (07 §5): the engine's own check. Every runtime INV assertion of rules.json is evaluated by the rule engine
// on the emitted plan. The helpers the assertions call (l30_time, l30_dist, baseline, preset_cap, adjacent, parent_week …)
// are re-implemented here from raw plan fields and parameters, without importing the generator's functions (07 §5a):
// B-group checks are independent of the generator; S-group checks are a second implementation from the same text.
// This is NOT the oracle (oracle/ is written by another session).
import type { GeneratorInput, Plan, Session, Week } from '../model/types.ts';
import { type Value, isE, isU, evalExpr, truthy } from '../expr/eval.ts';
import type { RuleRecord } from '../rules/engine.ts';
import { levelHelpers } from '../rules/helpers.ts';
import { type Spec, evalContext, openRecord, pnum, pval } from '../context.ts';
import { addDays, daysBetween, weekday } from '../util/dates.ts';
import { MODULES } from '../pipeline/modules.ts';

export interface Violation { inv_id: string; week_index: number | null; session_id: string | null; observed: number | string | boolean | null; limit: number | string | boolean | null; severity: 'repair' | 'block' | 'flag' | 'build_fail'; repaired_by?: string | null; date: string }
export interface ValidationReport { pass: boolean; passes_used: number; violations: Violation[]; errors: { inv_id: string; why: string }[] }

/** What the validator may read (07 §5): plan, derived-state fields, parameters, previous plan, gate. */
export interface ValidatorView {
  input: GeneratorInput;
  gate: string;
  state: {
    L30_eff_time_s: number; L30_eff_dist_m: number | null; L30_source: string; claimDate?: string; V_hold_s: number; L_hold_s: number; tol_level: number; tol_confidence: string;
    levels: Record<string, number>; ladderEndDate: string | null; max_tolerated_g_h: number | null; profileByWeek: string[]; age_low: (d: string) => number | null; age_high: (d: string) => number | null;
    logged: { date: string; duration_s: number; distance_m: number | null }[];
  };
  demand: { L_req_time_s: number; floor_dist_m: number; met_by_logged_distance: boolean; credited?: boolean; family: string; distance: string; time_cap_s: number; runs: number };
  anchor: { confidence: string; date: string | null } | null;
}

const SEVERITY = (s?: string): Violation['severity'] => (!s ? 'block' : s.startsWith('repair') ? 'repair' : s.startsWith('flag') ? 'flag' : s.startsWith('build') ? 'build_fail' : 'block');

function sessionsOf(plan: Plan): Session[] { return plan.weeks.flatMap(w => w.sessions); }

/** Independent re-implementation of the 12 §2b helpers used by the INV assertions. */
function helpersFor(spec: Spec, v: ValidatorView, plan: Plan) {
  const today = v.input.today;
  const all = sessionsOf(plan);
  const planned = all.filter(s => s.is_run && !s.is_goal_race);
  const claimDated = v.state.L30_source === 'claim';
  // l30(d): max over [d − 30, d) of logged measured runs and planned non-race runs; a claim-based L30_eff counts as dated today
  const l30 = (d: string, field: 'time' | 'dist'): number => {
    let m = 0;
    const inWin = (x: string) => { const k = daysBetween(x, d); return k >= 1 && k <= 30; };
    // a claimed L30 is dated the day before today (Q-E19)
    if (claimDated && inWin(v.state.claimDate ?? addDays(today, -1))) m = field === 'time' ? v.state.L30_eff_time_s : (v.state.L30_eff_dist_m ?? 0);
    for (const e of v.state.logged) if (inWin(e.date)) m = Math.max(m, field === 'time' ? e.duration_s : (e.distance_m ?? 0));
    for (const s of planned) if (inWin(s.date)) m = Math.max(m, field === 'time' ? s.planned_duration_s : (s.planned_distance_m ?? 0));
    return m;
  };
  const weekOf = (w: Week | Record<string, unknown>) => plan.weeks.find(x => x.index === (w as Week).index)!;
  const pctCap = (V: number, runs: number) => {
    const fam = v.demand.family;
    if (fam === 'road_classic') return 0.5 * V;
    const t = pval<Record<string, number>>(spec, 'lr.pct_cap.method_default.' + (fam === 'base' ? 'base' : 'short'));
    return (t[runs >= 5 ? '5+' : String(Math.max(2, runs))] ?? 0.4) * V;
  };
  const presetCap = (lr: Session) => {
    const w = plan.weeks.find(x => x.sessions.includes(lr) || x.sessions.some(s => s.id === lr.id))!;
    const V = w.planned_time_s;
    let cap = Math.min(Math.max(pctCap(V, w.runs), pnum(spec, 'lr.pct_floor_s')), v.demand.time_cap_s);
    if (v.demand.family === 'road_classic' && v.demand.L_req_time_s > v.demand.time_cap_s) cap = Math.max(cap, Math.min(v.demand.L_req_time_s, pnum(spec, 'lr.over_cap_pct.road_classic') * V));
    return cap;
  };
  const baseline = (w: Week) => {
    const idx = w.index;
    const prev = plan.weeks.filter(x => x.index < idx && !x.is_deload && !x.taper_k && !['start_ladder', 'rtr'].includes(x.load_kind));
    const last = prev.at(-1);
    if (last && idx - last.index <= pnum(spec, 'prog.baseline_max_age_weeks')) return last.planned_time_s;
    if (last) return plan.weeks.find(x => x.index === idx - 1)?.planned_time_s ?? last.planned_time_s;
    const ladderLast = plan.weeks.filter(x => x.index < idx && ['start_ladder', 'rtr'].includes(x.load_kind)).at(-1);
    if (ladderLast) return ladderLast.planned_time_s;
    // LOD-004: before any plan week, the most recent completed week's logged volume (re-plans), else V_hold
    // completed weeks: the last non-deload one ≤ prog.baseline_max_age_weeks old (deload flags from the parent version)
    const maxAge = pnum(spec, 'prog.baseline_max_age_weeks');
    for (let k = 1; k <= maxAge; k++) {
      const ws = addDays(plan.plan_start, -7 * k);
      if (v.input.parent_plan?.weeks.find(x => x.start === ws)?.is_deload || (v.input.engine_state?.dated_events?.deload_weeks ?? []).includes(ws)) continue;
      const logged = v.state.logged.filter(e => e.date >= ws && e.date < addDays(ws, 7)).reduce((a, e) => a + e.duration_s, 0);
      if (logged > 0) return Math.max(logged, v.state.V_hold_s);
    }
    return v.state.V_hold_s;
  };
  const parent = v.input.parent_plan;
  const parentWeek = (w: Week): Value => {
    if (!parent) return null;
    const kind = (x: Week) => (x.taper_k ? 'taper' : x.is_deload ? 'deload' : 'loading');
    const k = plan.weeks.filter(x => kind(x) === kind(w) && x.index <= w.index).length;
    const pw = parent.weeks.filter(x => kind(x) === kind(w) && x.start >= plan.plan_start);   // parent weeks still ahead
    return (pw[k - 1] as unknown as Value) ?? null;
  };
  const levelOn = (node: string, d: string | null) => {
    let l = v.state.levels[node] ?? 0;
    if (node === 'HAB' && v.state.ladderEndDate && d && d >= v.state.ladderEndDate) l = Math.max(l, 2);   // start-ladder credit (02 §2)
    return l;
  };
  return {
    l30_time: (a: Value[]) => (typeof a[0] === 'string' ? l30(a[0], 'time') : null),
    l30_dist: (a: Value[]) => (typeof a[0] === 'string' ? l30(a[0], 'dist') : null),
    adjacent: (a: Value[]) => {
      const lr = a[0] as unknown as Session;
      const ds = [addDays(lr.date, -1), addDays(lr.date, 1)];
      return planned.filter(s => ds.includes(s.date)) as unknown as Value;
    },
    preset_cap: (a: Value[]) => presetCap(all.find(s => s.id === (a[0] as unknown as Session).id)!),
    baseline: (a: Value[]) => baseline(weekOf(a[0] as unknown as Week)),
    parent_week: (a: Value[]) => parentWeek(weekOf(a[0] as unknown as Week)),
    module: (a: Value[]) => { const m = MODULES[String(a[0])]; return m ? ({ id: m.id, prereqs: m.prereqs } as unknown as Value) : null; },
    // SPEC-QUESTION Q-E25: t0t3_limit(w) = MIN of the runner's time (T3) and the most the week can hold under the T2 spike
    // caps measured at the week's start (runs of earlier weeks only): run count × spike.warn_ratio × l30_time(Monday).
    t0t3_limit: (a: Value[]) => {
      const w = weekOf(a[0] as unknown as Week);
      const n = w.sessions.filter(s => s.is_run && !s.is_goal_race).length;
      const spike = Math.floor(pnum(spec, 'spike.warn_ratio') * l30(w.start, 'time') / 60) * 60;
      return Math.min(60 * (v.input.profile.available_minutes_per_week ?? Infinity), n * spike || Infinity);
    },
    spike_cap: (a: Value[]) => { const w = weekOf(a[0] as unknown as Week); const lr = w.sessions.find(s => s.is_long_run); return lr ? pnum(spec, 'spike.warn_ratio') * l30(lr.date, 'time') : Infinity; },
    same_pair: (a: Value[]) => { const x = a[0] as unknown as Session, y = a[1] as unknown as Session; return x.pair_id !== null && x.pair_id === y.pair_id; },
    age_low: (a: Value[]) => (typeof a[0] === 'string' ? v.state.age_low(a[0]) : null),
    age_high: (a: Value[]) => (typeof a[0] === 'string' ? v.state.age_high(a[0]) : null),
    ...levelHelpers(levelOn),
  };
}

function rootsFor(spec: Spec, v: ValidatorView, plan: Plan): Record<string, Value> {
  const all = sessionsOf(plan);
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
  const hardByDate = new Map<string, boolean>();
  for (const s of sorted) if (s.is_hard) hardByDate.set(s.date, true);
  const sess = sorted.map(s => ({ ...s, ladder: s.ladder.kind, next_day_is_hard: hardByDate.get(addDays(s.date, 1)) === true && s.is_hard })) as unknown as Value[];
  const isLoading = (w: Week) => !w.is_deload && !w.taper_k && !['START_LADDER', 'RTR', 'TRANSITION', 'SHARPEN'].includes(w.phase);
  const ss = (v.input.profile.special_status ?? []).filter(x => x.start_date <= v.input.today).sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const runs = all.filter(s => s.is_run && !s.is_goal_race);
  return {
    today: v.input.today,
    plan: {
      sessions: sess, long_runs: sess.filter(s => (s as unknown as Session).is_long_run), weeks: plan.weeks as unknown as Value,
      loading_weeks: plan.weeks.filter(isLoading) as unknown as Value, taper_weeks: plan.weeks.filter(w => w.taper_k) as unknown as Value,
      future_weeks: plan.weeks as unknown as Value, pre_taper_runs: plan.pre_taper_runs, pre_taper_had_e3: plan.pre_taper_had_e3,
      // SPEC-QUESTION Q-E30: INV-19's W is the season plan's length; a re-plan that keeps the parent's layout (04 §3 step 7b)
      // counts its weeks in season numbering, so W is the last week's season index, not the weeks left
      W: Math.max(plan.W ?? 0, ...plan.weeks.map(w => w.index)),
      peak_lr_s: Math.max(0, ...runs.map(s => s.planned_duration_s)), peak_lr_dist_m: plan.peak_lr_dist_m, race_fuel_g_h: plan.race_fuel_g_h,
      over_guard_runs: sess.filter(s => (s as unknown as Session).expected_duration_s > 60 * pnum(spec, 'lr.long_guard_min') && (s as unknown as Session).is_run && !(s as unknown as Session).is_goal_race),
    } as unknown as Value,
    state: {
      gate: v.gate, V_hold_s: v.state.V_hold_s, L_hold_s: v.state.L_hold_s, progression_profile: v.state.profileByWeek[0] ?? 'slow', max_tolerated_g_h: v.state.max_tolerated_g_h,
      tol_level: v.state.tol_level, tol_confidence: v.state.tol_confidence, denominator_entries: [], V28_at_status_start_s: v.state.V_hold_s,
      last_goal_race_date: v.input.engine_state?.last_goal_race?.date ?? null, last_goal_race_distance: v.input.engine_state?.last_goal_race?.distance ?? null,
    } as unknown as Value,
    profile: { ...v.input.profile, special_status: ss ? ss.type : 'none' } as unknown as Value,
    flags: { active: v.input.flags.filter(f => f.status === 'active') } as unknown as Value,
    demand: { L_req_time_s: v.demand.L_req_time_s, floor_dist_m: v.demand.floor_dist_m, met_by_logged_distance: v.demand.met_by_logged_distance, credited: v.demand.credited ?? false } as unknown as Value,
    anchor: (v.anchor ?? { confidence: 'unknown', date: null }) as unknown as Value,
    preset: { id: plan.preset_id, consecutive_hard_allowed: false } as unknown as Value,
    goal: { ...v.input.goal, edits: (v.input.goal_edits ?? []).map(e => ({ ...e, feasibility_rerun: true })) } as unknown as Value,
    screen: { ...v.input.screening } as unknown as Value,
    event: openRecord({ goal_changed: false }),
  };
}

/** Find the violating element of an `all(plan.X, v, …)` assertion by evaluating it on one element at a time. */
function locate(spec: Spec, rec: RuleRecord, roots: Record<string, Value>, helpers: Record<string, any>, v: ValidatorView): { s?: Session; w?: Week } | null {
  const m = /^all\(plan\.(\w+),/.exec(rec.assert ?? '');
  if (!m) return null;
  let list = (roots.plan as Record<string, Value[]>)[m[1]];
  if ((rec.id === 'INV-28' || rec.id === 'INV-29' || rec.id === 'INV-21') && Array.isArray(list)) list = list.filter(x => !(x as unknown as Session).is_goal_race);   // Q-E20
  if (!Array.isArray(list)) return null;
  for (const el of list) {
    let st = roots.state as Record<string, Value>;
    if (rec.id === 'INV-16') st = { ...st, progression_profile: v.state.profileByWeek[((roots.plan as unknown as { weeks: Week[] }).weeks).findIndex(x => x.start === (el as unknown as Week).start)] ?? 'slow' };
    const r = { ...roots, plan: { ...(roots.plan as object), [m[1]]: [el] } as unknown as Value, state: st as unknown as Value };
    const val = truthy(evalExpr(rec.assert!, evalContext(spec, r, {}, helpers)));
    if (val === false) return 'segments' in (el as object) ? { s: el as unknown as Session } : { w: el as unknown as Week };
  }
  return null;
}

export function validate(spec: Spec, v: ValidatorView, plan: Plan): ValidationReport {
  const roots = rootsFor(spec, v, plan);
  const helpers = helpersFor(spec, v, plan);
  const violations: Violation[] = [];
  const errors: { inv_id: string; why: string }[] = [];
  for (const rec of spec.rules.invariants) {
    const a = rec.assert ?? '';
    if (a.startsWith('static:') || a.startsWith('flag_only:')) continue;     // build lints (INV-10/12/23/24/26)
    if (rec.id === 'INV-04' && !v.input.parent_plan) continue;                // no parent version at first generation
    let res: Value;
    if (rec.id === 'INV-16') {
      // SPEC-QUESTION Q-E18: INV-16 reads one state.progression_profile, but a projected plan changes profile after probation;
      // the validator checks each loading week against that week's own profile.
      const loc = locate(spec, rec, roots, helpers, v);
      res = loc ? false : true;
    } else if (rec.id === 'INV-28' || rec.id === 'INV-29' || rec.id === 'INV-21') {
      // SPEC-QUESTION Q-E20: INV-28/29 have no goal-race exemption, so a marathon race (expected > 180 min) would be "capped".
      // The engine reads them as rules about planned training runs: the goal race is exempt, as it is from INV-01/02/03 (INV-25).
      // SPEC-QUESTION Q-E22: likewise INV-21's day check: the runner fixed the race date, so a race on a day outside
      // available_days is not a violation (the race still counts toward the week's runs).
      const pl = roots.plan as Record<string, Value[]>;
      const r2 = { ...roots, plan: { ...pl, sessions: pl.sessions.filter(x => !(x as unknown as Session).is_goal_race) } as unknown as Value };
      res = truthy(evalExpr(a, evalContext(spec, r2, {}, helpers)));
    } else res = truthy(evalExpr(a, evalContext(spec, roots, {}, helpers)));
    if (isE(res)) { errors.push({ inv_id: rec.id, why: res.why }); continue; }
    if (isU(res)) { errors.push({ inv_id: rec.id, why: 'unknown' }); continue; }
    if (res === true) continue;
    const loc = locate(spec, rec, roots, helpers, v);
    const s = loc?.s, w = loc?.w ?? (s ? plan.weeks.find(x => x.sessions.some(y => y.id === s.id)) : undefined);
    violations.push({
      inv_id: rec.id, week_index: w?.index ?? null, session_id: s?.id ?? null,
      observed: s ? s.planned_duration_s : w ? w.planned_time_s : null, limit: null, severity: SEVERITY(rec.severity),
      date: s?.date ?? w?.start ?? plan.plan_start,
    });
  }
  // 07 §2c: earliest date first, then the lowest INV id
  violations.sort((a, b) => a.date.localeCompare(b.date) || a.inv_id.localeCompare(b.inv_id));
  return { pass: violations.length === 0 && errors.length === 0, passes_used: 0, violations, errors };
}

export { weekday };

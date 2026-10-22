// Helper functions of spec 12 §2b.3 that need no plan context. Plan-dependent helpers (l30_time, baseline, parent_week …)
// are supplied by the pipeline stage that binds the plan (see pipeline/contexts.ts).
import { Err, U, isE, isU, isSpecial, type Helper, type Value, type EvalContext } from '../expr/eval.ts';
import { addDays, daysBetween, hoursBetween, weekday as wd } from '../util/dates.ts';

const num = (v: Value): v is number => typeof v === 'number';

function variadic(kind: 'min' | 'max'): Helper {
  return (args) => {
    let xs = args;
    if (args.length === 1 && Array.isArray(args[0])) xs = args[0] as Value[];
    for (const a of xs) { if (isE(a)) return a; }
    for (const a of xs) { if (isU(a)) return U; }
    const ns = xs.filter(x => x !== null);
    if (!ns.length) return null;
    if (ns.every(num)) return kind === 'min' ? Math.min(...(ns as number[])) : Math.max(...(ns as number[]));
    if (ns.every(x => typeof x === 'string')) { const s = (ns as string[]).slice().sort(); return kind === 'min' ? s[0] : s[s.length - 1]; }
    return new Err('min/max on mixed types');
  };
}
const lift = (f: (...a: any[]) => Value): Helper => (args) => {
  for (const a of args) if (isE(a)) return a;
  for (const a of args) if (isU(a)) return U;
  if (args.some(a => a === null)) return null;
  return f(...args);
};

export const EFFORT_RANK: Record<string, number> = { E0: 0, E1: 1, E2: 2, E3: 3, E4: 4, E5: 3 }; // v5.2: E5 ranks as E3
const REASON_CLASS: Record<string, 'infeasible' | 'stretch' | 'info'> = {
  AVAILABILITY_TIME: 'infeasible', AVAILABILITY_DAYS: 'infeasible', MINOR_DISTANCE: 'infeasible', RACE_TOO_SOON: 'infeasible',
  LONG_RUN_UNREACHABLE_PRESET: 'infeasible', LEVELS_UNREACHABLE: 'infeasible', PHASES_DO_NOT_FIT: 'infeasible', CURRENT_STATE_SHORT: 'infeasible',
  TARGET_OUTSIDE_BAND: 'infeasible', CUTOFF_UNREACHABLE: 'infeasible', MARGIN_REQUIRED: 'infeasible', ENGINE_NONCONVERGENT: 'infeasible',
  LOW_SLACK: 'stretch', TARGET_IN_FAST_BAND: 'stretch', TARGET_BEYOND_CURRENT: 'stretch', ANCHOR_UNKNOWN: 'stretch', LOW_VOLUME_PREDICTION: 'stretch',
  ULTRA_LOW_CONFIDENCE: 'stretch', LONG_HORIZON_UNPROJECTED: 'stretch', LONG_RUN_TIME_CAPPED: 'stretch', DEGRADED_COMPLETION: 'stretch', CUTOFF_AT_RISK: 'stretch',
  LOW_FREQ: 'info',
};
export const REASON_ORDER = Object.keys(REASON_CLASS);
export const reasonClass = (c: string) => REASON_CLASS[c] ?? 'info';

/** 02 §3 prerequisite DAG: "NODE n" → [[node, level]]. */
export const PREREQS: Record<string, [string, number][]> = {
  'HAB 1': [], 'HAB 2': [['HAB', 1]], 'HAB 3': [['HAB', 2], ['TOL', 1]], 'HAB 4': [['HAB', 3], ['TOL', 2]],
  'AER 1': [['HAB', 1]], 'AER 2': [['HAB', 2]], 'AER 3': [['AER', 2], ['TOL', 2]], 'AER 4': [['AER', 3], ['TOL', 3]], 'AER 5': [['AER', 4], ['TOL', 4]],
  'THR 1': [['AER', 1], ['HAB', 2]], 'THR 2': [['THR', 1], ['AER', 2], ['TOL', 2]], 'THR 3': [['THR', 2], ['AER', 3]], 'THR 4': [['THR', 3], ['AER', 4]],
  'VO2 1': [['HAB', 1]], 'VO2 2': [['VO2', 1], ['THR', 1], ['TOL', 2]], 'VO2 3': [['VO2', 2], ['THR', 2], ['TOL', 3]],
  'ECO 1': [['HAB', 1]], 'ECO 2': [['ECO', 1], ['TOL', 2]], 'ECO 3': [['ECO', 2]],
  'DUR 1': [['AER', 1]], 'DUR 2': [['DUR', 1], ['AER', 2], ['TOL', 2]], 'DUR 3': [['DUR', 2], ['AER', 3], ['TOL', 3]],
  'DUR 4': [['DUR', 3], ['FUEL', 1], ['TOL', 4]], 'DUR 5': [['DUR', 4], ['TOL', 5]],
  'MSP 1': [['THR', 1], ['DUR', 1]], 'MSP 2': [['MSP', 1], ['THR', 2], ['DUR', 2]], 'MSP 3': [['MSP', 2], ['DUR', 3], ['FUEL', 2]],
  'FUEL 1': [['DUR', 1]], 'FUEL 2': [['FUEL', 1]], 'FUEL 3': [['FUEL', 2], ['MSP', 1]], 'FUEL 4': [['FUEL', 3]],
  'HEAT 1': [], 'HEAT 2': [['AER', 2]], 'PACE 1': [['DUR', 1]], 'PACE 2': [['MSP', 1]], 'PACE 3': [['PACE', 2]], 'TOL 1': [], 'TOL 2': [], 'TOL 3': [], 'TOL 4': [], 'TOL 5': [],
};
/** Required levels closed under prerequisites (03 §2). */
export function closePrereqs(req: Record<string, number>): Record<string, number> {
  const out = { ...req };
  let changed = true;
  while (changed) {
    changed = false;
    for (const [node, lvl] of Object.entries({ ...out })) {
      for (let n = 1; n <= lvl; n++) for (const [pn, pl] of PREREQS[`${node} ${n}`] ?? []) {
        if ((out[pn] ?? 0) < pl) { out[pn] = pl; changed = true; }
      }
    }
  }
  return out;
}

/** Context-independent helpers. `levels(node, date)` must be supplied through ctx.roots.__levels for the level helpers. */
export function baseHelpers(): Record<string, Helper> {
  return {
    size: (a) => (isSpecial(a[0]) ? a[0] : a[0] === null ? 0 : Array.isArray(a[0]) ? a[0].length : typeof a[0] === 'object' ? Object.keys(a[0] as object).length : typeof a[0] === 'string' ? (a[0] as string).length : new Err('size')),
    min: variadic('min'), max: variadic('max'),
    mean: lift((...xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length),
    abs: lift((x: number) => Math.abs(x)),
    round_down: lift((x: number, step: number) => Math.floor(x / step + 1e-9) * step),
    round_up: lift((x: number, step: number) => Math.ceil(x / step - 1e-9) * step),
    ceil_div: lift((a: number, b: number) => Math.ceil(a / b)),
    days_between: lift((a: string, b: string) => daysBetween(a, b)),
    hours_between: lift((a: string, b: string) => hoursBetween(a, b)),
    weeks_between: lift((a: string, b: string) => Math.floor(daysBetween(a, b) / 7)),
    date_add: lift((d: string, n: number) => addDays(d, n)),
    weekday: lift((d: string) => wd(d)),
    effort_rank: lift((e: string) => (e in EFFORT_RANK ? EFFORT_RANK[e] : new Err('effort_rank: ' + e))),
    verdict_rank: lift((v: string) => ({ feasible: 0, stretch: 1, infeasible: 2 } as Record<string, number>)[v] ?? new Err('verdict')),
    tier_rank: lift((t: string) => Number(String(t).slice(1))),
    kind_rank: lift((k: string) => ['red_flag', 'illness', 'pain', 'gap', 'fatigue', 'missed_session', 'partial_session', 'unlogged_week', 'availability_change', 'life_change', 'result', 'goal_change'].indexOf(k)),
    reason_class: lift((c: string) => reasonClass(c)),
    reason_group: lift((c: string) => (c.startsWith('AVAILABILITY') ? 'availability' : reasonClass(c))),
    last: (a) => (isSpecial(a[0]) ? a[0] : Array.isArray(a[0]) && a[0].length ? a[0][a[0].length - 1] : null),
    gap_band: lift((d: number) => (d >= 8 && d < 15 ? '8_14' : d >= 15 && d < 30 ? '15_29' : null)),
    hash: () => new Err('hash() is a static test, not a runtime helper'),
  };
}

/** Level helpers bound to a levels-by-date function. */
export function levelHelpers(levelOn: (node: string, date: string | null) => number): Record<string, Helper> {
  const prereqsHold = (node: string, n: number, d: string | null) =>
    (PREREQS[`${node} ${n}`] ?? []).every(([pn, pl]) => levelOn(pn, d) >= pl);
  return {
    level_prereqs_hold: lift((node: string, n: number, d: string) => prereqsHold(node, n, d)),
    prereqs_hold: lift((m: any, d: string) => {
      const ps = (m?.prereqs ?? []) as { node: string; level: number }[];
      return ps.every(q => levelOn(q.node, d) >= q.level);
    }),
  };
}

export type { EvalContext };

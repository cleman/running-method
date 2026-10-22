// Item (c): metamorphic relations. Each relation is an INPUT TRANSFORMATION plus an EXPECTED RELATION
// between the result on the original input and the result on the transformed one. No formula oracle is
// needed (07 §5a "M"). Both lists of the spec are encoded: 07 §5a M-1…M-8 (TST-091) and 14 TST-042a–h.
// docs/questions.md Q3 proposes "both, each restricted to one horizon class": every transformation here
// keeps the horizon class of 04 §2 (H0…H5) or is skipped (SPEC-QUESTIONS OQ-05).
import { addDays, weekday } from './dates.js';
import { clone } from './fixtures.js';
import { runVolume } from './invariants.js';
import type { Input, Result, Week, Weekday } from './types.js';

export interface RelationOutcome { ok: boolean; skipped?: string; detail: string }
export interface Relation {
  id: string;
  source: string;
  statement: string;
  /** null = the relation does not apply to this input (reason given by `why`). */
  transform: (input: Input) => Input | null;
  why?: string;
  /** Some relations need more than one generator call (M-7, M-8); they get the engine directly. */
  custom?: (input: Input, gen: (i: Input) => Promise<Result>) => Promise<RelationOutcome>;
  check?: (a: Result, b: Result, input: Input) => RelationOutcome;
}

// ---------- helpers ----------
const VR: Record<string, number> = { feasible: 0, stretch: 1, infeasible: 2 }; // verdict_rank, 12 §2b.3
export const verdictRank = (r: Result): number | null => (r.feasibility ? VR[r.feasibility.verdict] : null);

export function weeksAvailable(input: Input): number | null {
  if (!input.goal.race_date) return null;
  const mon = input.today; // fixtures start on a Monday (spec/fixtures-input/README.md)
  return Math.floor((Date.parse(input.goal.race_date) - Date.parse(mon)) / (7 * 86400e3)) + 1;
}
export function horizonClass(w: number | null): string {
  if (w == null) return 'H0';
  if (w <= 4) return 'H1';
  if (w <= 8) return 'H2';
  if (w <= 24) return 'H3';
  if (w <= 52) return 'H4';
  return 'H5';
}
const sameClass = (a: Input, b: Input) => horizonClass(weeksAvailable(a)) === horizonClass(weeksAvailable(b));
const weeks = (r: Result): Week[] => r.plan?.weeks ?? [];
const peakV = (r: Result) => Math.max(0, ...weeks(r).map(runVolume));
const peakLR = (r: Result) => Math.max(0, ...weeks(r).map((w) => w.lr_s));
const reasons = (r: Result) => r.feasibility?.reasons ?? [];
const paceCount = (r: Result) => weeks(r).flatMap((w) => w.sessions).filter((s) => s.pace_range).length;
const runCount = (r: Result) => weeks(r).flatMap((w) => w.sessions).filter((s) => s.is_run).length;
const G = (r: Result) => r.feasibility?.weeks_needed?.G ?? null;
const ok = (detail: string): RelationOutcome => ({ ok: true, detail });
const bad = (detail: string): RelationOutcome => ({ ok: false, detail });
const skip = (why: string): RelationOutcome => ({ ok: true, skipped: why, detail: why });

/** Weeks keyed by (load_kind, load_ordinal): the INV-04 alignment, also used for M-1 / 042g. */
function byOrdinal(r: Result): Map<string, Week> {
  return new Map(weeks(r).map((w) => [`${w.load_kind}#${w.load_ordinal}`, w]));
}
function notHigherByOrdinal(a: Result, b: Result, what: string): RelationOutcome {
  const A = byOrdinal(a);
  for (const [k, wb] of byOrdinal(b)) {
    const wa = A.get(k);
    if (!wa) continue;
    if (runVolume(wb) > runVolume(wa) + 60) return bad(`${what}: ${k} volume ${runVolume(wa)} → ${runVolume(wb)}`);
    if (wb.lr_s > wa.lr_s + 60) return bad(`${what}: ${k} long run ${wa.lr_s} → ${wb.lr_s}`);
  }
  return ok(`${what}: no aligned week rose`);
}
const verdictNotWorse = (a: Result, b: Result, what: string): RelationOutcome => {
  const ra = verdictRank(a), rb = verdictRank(b);
  if (ra == null || rb == null) return skip(`${what}: no feasibility verdict on one side (${a.kind}/${b.kind})`);
  return rb <= ra ? ok(`${what}: verdict rank ${ra} → ${rb}`) : bad(`${what}: verdict worsened ${ra} → ${rb}`);
};
const scaleLog = (input: Input, f: (e: Input['log'][number]) => void): Input => { const i = clone(input); i.log.forEach(f); return i; };
const hasRichishLog = (i: Input) => i.log.filter((e) => e.source === 'tick').length >= 3;

/** Canonical serialisation of spec/schema/README.md §4 (sorted keys, no whitespace; JS numbers already
 *  print in the shortest round-trip form and integers without a decimal point). */
export function canonical(x: unknown): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(canonical).join(',')}]`;
  const o = x as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(',')}}`;
}

// ---------- the relations ----------
export const RELATIONS: Relation[] = [
  {
    id: 'M-1', source: '07 §5a', statement: 'More weeks to the race never raises any week’s volume or long run (aligned by load kind and ordinal) and never worsens the verdict.',
    transform: (i) => { if (!i.goal.race_date) return null; const j = clone(i); j.goal.race_date = addDays(i.goal.race_date, 7); return sameClass(i, j) ? j : null; },
    why: 'no race date, or +1 week changes the horizon class',
    check: (a, b) => { const v = verdictNotWorse(a, b, 'M-1'); return v.ok ? notHigherByOrdinal(a, b, 'M-1') : v; },
  },
  {
    id: 'M-2a', source: '07 §5a M-2', statement: '+60 available minutes never lowers V_peak, never worsens the verdict, never adds an AVAILABILITY_* reason.',
    transform: (i) => { const j = clone(i); j.profile.available_minutes_per_week = (i.profile.available_minutes_per_week ?? 90) + 60; return j; },
    check: (a, b) => m2(a, b, 'M-2a'),
  },
  {
    id: 'M-2b', source: '07 §5a M-2', statement: 'One more available day (and run) never lowers V_peak, never worsens the verdict, never adds an AVAILABILITY_* reason.',
    transform: (i) => {
      const all: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const free = all.find((d) => !(i.profile.available_days ?? []).includes(d));
      if (!free) return null;
      const j = clone(i);
      j.profile.available_days = all.filter((d) => d === free || (i.profile.available_days ?? []).includes(d));
      j.profile.max_runs_per_week = (i.profile.max_runs_per_week ?? 3) + 1;
      return j;
    },
    why: 'all seven days already available',
    check: (a, b) => m2(a, b, 'M-2b'),
  },
  {
    id: 'M-3', source: '07 §5a', statement: 'A higher measured L30_eff and V28 (every logged run 10% longer in time and distance) never lengthens weeks_needed.',
    transform: (i) => hasRichishLog(i) ? scaleLog(i, (e) => { e.duration_s = Math.floor(e.duration_s * 1.1); if (e.distance_m) e.distance_m = Math.floor(e.distance_m * 1.1); }) : null,
    why: 'no measured log to scale',
    check: (a, b) => { const ga = G(a), gb = G(b); if (ga == null || gb == null) return skip('G not reported'); return gb <= ga ? ok(`G ${ga} → ${gb}`) : bad(`weeks_needed.G grew ${ga} → ${gb}`); },
  },
  {
    id: 'M-4', source: '07 §5a', statement: 'A slower logged easy pace (same durations, 10% less distance) never shortens L_req_time or any long-run target. Reading chosen: durations fixed, distances scaled (OQ-05).',
    transform: (i) => hasRichishLog(i) ? scaleLog(i, (e) => { if (e.distance_m) e.distance_m = Math.floor(e.distance_m * 0.9); }) : null,
    why: 'no measured log',
    check: (a, b) => {
      const la = a.feasibility?.demand?.L_req_time_s, lb = b.feasibility?.demand?.L_req_time_s;
      if (la != null && lb != null && lb < la) return bad(`L_req_time shortened ${la} → ${lb}`);
      return peakLR(b) + 60 >= peakLR(a) ? ok(`L_req ${la} → ${lb}; peak LR ${peakLR(a)} → ${peakLR(b)}`) : bad(`peak long run shortened ${peakLR(a)} → ${peakLR(b)}`);
    },
  },
  {
    id: 'M-5 / TST-042c', source: '07 §5a; 14 §4', statement: 'Adding an active red flag (cardiac, raised today) yields zero running sessions until attested clearance (never more sessions than before).',
    transform: (i) => { const j = clone(i); j.flags = [...(i.flags ?? []), { id: 'oracle-flag-1', kind: 'red_flag', subkind: 'cardiac', region: null, rule_id: 'SAF-001', raised_on: i.today, status: 'active', cleared_on: null, clearance_attested_on: null }]; return j; },
    check: (a, b) => (runCount(b) === 0 ? ok(`runs ${runCount(a)} → 0 (${b.kind})`) : bad(`${runCount(b)} running sessions with an active cardiac flag`)),
  },
  {
    id: 'M-6 / TST-042f', source: '07 §5a; 14 §4', statement: 'The same anchor entered too late to be measured (estimated) never narrows B_fast and removes every pace target.',
    transform: (i) => {
      if (!i.anchors?.length) return null;
      const j = clone(i);
      for (const a of j.anchors) a.entered_at = `${addDays(a.date, 10)}T21:00:00+01:00`;
      return j;
    },
    why: 'no anchor',
    check: (a, b) => {
      const fa = a.feasibility?.predicted_band?.b_fast, fb = b.feasibility?.predicted_band?.b_fast;
      if (fa != null && fb != null && fb < fa) return bad(`B_fast narrowed ${fa} → ${fb}`);
      return paceCount(b) === 0 ? ok(`paces ${paceCount(a)} → 0`) : bad(`${paceCount(b)} pace targets from an estimated anchor`);
    },
  },
  {
    id: 'M-7', source: '07 §5a; GEN-004; TST-080', statement: 'Identical inputs give byte-identical canonical output; shuffling the order of log entries gives the same output.',
    transform: (i) => i,
    custom: async (input, gen) => {
      const a = canonical(await gen(clone(input))), b = canonical(await gen(clone(input)));
      if (a !== b) return bad('two runs on identical input differ');
      const s = clone(input); s.log = [...s.log].reverse(); s.events = [...(s.events ?? [])].reverse();
      const c = canonical(await gen(s));
      return c === a ? ok('byte-identical, also with log and events reversed') : bad('output depends on the order of log entries or events');
    },
  },
  {
    id: 'M-8 / TST-042a', source: '07 §5a; 14 §4; INV-04', statement: 'Marking the first planned run missed (re-plan the same day with the plan as parent) never raises any later week’s time or long run, compared by load ordinal.',
    transform: (i) => i,
    custom: async (input, gen) => {
      const a = await gen(clone(input));
      const first = a.plan?.weeks.flatMap((w) => w.sessions).find((s) => s.is_run);
      if (!a.plan || !first) return skip('no plan on the original input');
      const j = clone(input);
      j.today = addDays(first.date, 1);
      j.parent_plan = a.plan; j.engine_state = a.engine_state; j.flags = a.flags;
      // Event payload shape is not specified beyond "payload: object" (OQ-12): session id and date.
      j.events = [{ id: 'oracle-miss-1', kind: 'missed_session', date: first.date, payload: { session_id: first.id } }];
      const b = await gen(j);
      if (!b.plan) return skip(`re-plan returned ${b.kind}`);
      return notHigherByOrdinal(a, b, 'M-8');
    },
  },
  {
    id: 'TST-042b', source: '14 §4', statement: 'Lowering the claimed L30 and weekly volume by 20% never increases any week’s volume or its longest session. Weaker form chosen: sessions have no stable identity across plans (OQ-05).',
    transform: (i) => {
      const c = i.claim; if (!c || c.L30_duration_s == null || i.log.some((e) => e.source === 'tick')) return null;
      const j = clone(i);
      for (const k of ['L30_duration_s', 'L30_distance_m', 'weekly_time_s', 'weekly_distance_m']) if (j.claim[k] != null) j.claim[k] = Math.floor(j.claim[k] * 0.8);
      return j;
    },
    why: 'not a claims-only persona',
    check: (a, b) => {
      for (const wb of weeks(b)) {
        const wa = weeks(a).find((w) => w.index === wb.index); if (!wa) continue;
        if (runVolume(wb) > runVolume(wa) + 60) return bad(`week ${wb.index} volume rose ${runVolume(wa)} → ${runVolume(wb)}`);
        const mx = (w: Week) => Math.max(0, ...w.sessions.filter((s) => s.is_run && !s.is_goal_race).map((s) => s.planned_duration_s));
        if (mx(wb) > mx(wa) + 60) return bad(`week ${wb.index} longest session rose ${mx(wa)} → ${mx(wb)}`);
      }
      return ok('no week rose');
    },
  },
  {
    id: 'TST-042d', source: '14 §4', statement: 'A slower time goal (+5%) never turns a feasible verdict infeasible.',
    transform: (i) => { if (i.goal.goal_type !== 'time' || !i.goal.target_time_s) return null; const j = clone(i); j.goal.target_time_s = Math.ceil(i.goal.target_time_s * 1.05); return j; },
    why: 'not a time goal',
    check: (a, b) => (a.feasibility?.verdict === 'feasible' && b.feasibility?.verdict === 'infeasible' ? bad('feasible → infeasible') : ok(`${a.feasibility?.verdict} → ${b.feasibility?.verdict}`)),
  },
  {
    id: 'TST-042e', source: '14 §4', statement: 'Moving the race one week later (same horizon class, ≤ goal.date_search_max_weeks) never turns a feasible verdict infeasible.',
    transform: (i) => { if (!i.goal.race_date) return null; const j = clone(i); j.goal.race_date = addDays(i.goal.race_date, 7); return sameClass(i, j) ? j : null; },
    why: 'no race date, or the horizon class changes',
    check: (a, b) => (a.feasibility?.verdict === 'feasible' && b.feasibility?.verdict === 'infeasible' ? bad('feasible → infeasible') : ok(`${a.feasibility?.verdict} → ${b.feasibility?.verdict}`)),
  },
  {
    id: 'TST-042g', source: '14 §4', statement: 'Removing one available day (not the long-run day) never increases any week’s planned time (weeks compared by index).',
    transform: (i) => {
      const days: string[] = i.profile.available_days ?? [];
      const drop = days.find((d) => d !== i.profile.long_run_day);
      if (!drop || days.length <= 1) return null;
      const j = clone(i);
      j.profile.available_days = days.filter((d) => d !== drop);
      j.profile.max_runs_per_week = Math.min(i.profile.max_runs_per_week ?? days.length, j.profile.available_days.length);
      return j;
    },
    why: 'no removable day',
    check: (a, b) => {
      for (const wb of weeks(b)) {
        const wa = weeks(a).find((w) => w.index === wb.index);
        if (wa && wb.planned_time_s > wa.planned_time_s + 60) return bad(`week ${wb.index} ${wa.planned_time_s} → ${wb.planned_time_s}`);
      }
      return ok('no week rose');
    },
  },
  {
    id: 'TST-042h', source: '14 §4', statement: 'Any event sequence followed by 8 quiet weeks gives long runs ≤ 1.10 × L30_eff of the logged data.',
    transform: () => null,
    why: 'needs a random event-stream generator over the week-by-week harness; not implemented in this version (OQ-05)',
  },
];

function m2(a: Result, b: Result, id: string): RelationOutcome {
  const v = verdictNotWorse(a, b, id); if (!v.ok) return v;
  if (peakV(b) + 60 < peakV(a)) return bad(`${id}: V_peak fell ${peakV(a)} → ${peakV(b)}`);
  const added = reasons(b).filter((x) => x.startsWith('AVAILABILITY_') && !reasons(a).includes(x));
  return added.length ? bad(`${id}: new ${added.join(', ')}`) : ok(`${id}: V_peak ${peakV(a)} → ${peakV(b)}`);
}

export { weekday };

// S8r Repair (07 §2c, §6.1). The REP records of rules.json choose the repair (rule engine, root `violation`, lowest rank whose
// condition holds and whose method changes something); the methods are native. Removed volume is dropped, never moved.
import type { Plan, Session, Week, Segment } from '../model/types.ts';
import type { Value } from '../expr/eval.ts';
import { evaluateRecord } from '../rules/engine.ts';
import { type Spec, evalContext, openRecord, pnum, roundDown } from '../context.ts';
import { addDays, daysBetween, weekday, weekdayIndex, WEEKDAYS } from '../util/dates.ts';
import type { Violation } from './validator.ts';
import { effortTimes } from '../pipeline/sessions.ts';

export interface LedgerEntry { week_index: number; session_id: string | null; field: string; template_value: number | string | null; plan_value: number | string | null; rule_id: string; criterion?: string }

export interface RepairCtx {
  spec: Spec; plan: Plan; availableDays: string[]; blocked: Set<string>;
  l30Time: (d: string) => number; l30Dist: (d: string) => number; presetCap: (w: Week) => number;
}

const MIN_RUN = (spec: Spec) => pnum(spec, 'lod.min_run_s');

function findSession(plan: Plan, id: string | null): { w: Week; s: Session } | null {
  if (!id) return null;
  for (const w of plan.weeks) { const s = w.sessions.find(x => x.id === id); if (s) return { w, s }; }
  return null;
}

/** Shorten a session to `dur` by trimming its easy (E1) main/warm-up/cool-down time; work segments are kept when possible. */
function shortenTo(s: Session, dur: number): boolean {
  if (dur >= s.planned_duration_s) return false;
  let cut = s.planned_duration_s - dur;
  const segs: Segment[] = s.segments.map(x => ({ ...x }));
  for (const role of ['main', 'cooldown', 'warmup'] as const) {
    for (const x of segs) {
      if (cut <= 0) break;
      if (x.role !== role || x.effort !== 'E1' || !x.duration_s || x.repeats !== 1) continue;
      const take = Math.min(cut, x.duration_s - (role === 'main' ? 60 : 120));
      if (take > 0) { x.duration_s -= take; cut -= take; }
    }
  }
  if (cut > 0) {
    if (s.segments.length !== 1) return false;
    segs[0].duration_s = dur; cut = 0;
  }
  s.segments = segs; s.planned_duration_s = dur; s.expected_duration_s = dur;
  return true;
}

function recomputeWeek(w: Week): void {
  let hard = 0, e2 = 0, easy = 0;
  for (const s of w.sessions) { if (s.is_goal_race) continue; const t = effortTimes(s.segments); hard += t.hard; e2 += t.e2; easy += t.easy; }
  w.planned_time_s = w.sessions.reduce((a, s) => a + (s.is_goal_race ? 0 : s.planned_duration_s), 0);
  const lr = w.sessions.find(s => s.is_long_run); w.lr_s = lr ? lr.planned_duration_s : 0;
  w.runs = w.sessions.filter(s => s.is_run).length;
  w.key_session_count = w.sessions.filter(s => s.is_key).length;
  w.e3_touches = w.sessions.filter(s => !s.is_goal_race && s.segments.some(x => x.effort === 'E3' || x.effort === 'E4')).length;
  w.has_e3_touch = w.e3_touches > 0; w.hard_time_s = hard; w.e2_time_s = e2; w.easy_time_s = easy;
}

type Method = (c: RepairCtx, v: Violation, ledger: LedgerEntry[], ruleId: string) => boolean;

const clampToLimit: Method = (c, v, ledger, ruleId) => {
  const f = findSession(c.plan, v.session_id);
  if (f?.s.is_goal_race) return false;                       // a repair never changes the goal race
  const step = pnum(c.spec, 'load.round_down_s');
  const warn = pnum(c.spec, 'spike.warn_ratio');
  if (!f) return false;
  const { w, s } = f;
  const before = s.planned_duration_s;
  let changed = false;
  switch (v.inv_id) {
    case 'INV-01': {
      const lim = roundDown(warn * c.l30Dist(s.date), pnum(c.spec, 'load.round_down_m'));
      if (s.planned_distance_m != null && s.planned_distance_m > lim) { ledger.push({ week_index: w.index, session_id: s.id, field: 'planned_distance_m', template_value: s.planned_distance_m, plan_value: lim, rule_id: ruleId, criterion: v.inv_id }); s.planned_distance_m = lim; changed = true; }
      break;
    }
    case 'INV-02': case 'INV-13': case 'INV-28': {
      let lim = roundDown(warn * c.l30Time(s.date), step);
      if (v.inv_id === 'INV-13') lim = Math.max(roundDown(c.presetCap(w), step), 0);
      if (v.inv_id === 'INV-28') lim = 60 * pnum(c.spec, 'lr.long_guard_min');
      changed = shortenTo(s, lim);
      break;
    }
    case 'INV-03': {
      const lr = w.sessions.find(x => x.is_long_run) ?? c.plan.weeks.flatMap(x => x.sessions).find(x => x.is_long_run && Math.abs(daysBetween(x.date, s.date)) === 1);
      if (!lr) break;
      const adj = c.plan.weeks.flatMap(x => x.sessions).filter(x => x.is_run && !x.is_goal_race && !x.is_long_run && Math.abs(daysBetween(x.date, lr.date)) === 1);
      for (const a of adj) {
        const lim = roundDown(Math.min(pnum(c.spec, 'two_day.adjacent_ratio') * lr.planned_duration_s, pnum(c.spec, 'two_day.cap_ratio') * c.l30Time(lr.date) - lr.planned_duration_s), step);
        if (a.planned_duration_s > lim) {
          const wk = c.plan.weeks.find(x => x.sessions.includes(a))!;
          if (lim < MIN_RUN(c.spec)) { wk.sessions = wk.sessions.filter(x => x !== a); recomputeWeek(wk); ledger.push({ week_index: wk.index, session_id: a.id, field: 'session', template_value: a.planned_duration_s, plan_value: null, rule_id: ruleId, criterion: 'INV-03' }); changed = true; continue; }
          const b = a.planned_duration_s;
          if (shortenTo(a, lim)) { recomputeWeek(wk); ledger.push({ week_index: wk.index, session_id: a.id, field: 'planned_duration_s', template_value: b, plan_value: lim, rule_id: ruleId, criterion: 'INV-03' }); changed = true; }
        }
      }
      return changed;
    }
    case 'INV-15': if (s.pace_range) { s.pace_range = null; changed = true; } break;
    default: return false;
  }
  if (changed) {
    recomputeWeek(w);
    if (before !== s.planned_duration_s) ledger.push({ week_index: w.index, session_id: s.id, field: 'planned_duration_s', template_value: before, plan_value: s.planned_duration_s, rule_id: ruleId, criterion: v.inv_id });
  }
  return changed;
};

const moveToFreeDay: Method = (c, v, ledger, ruleId) => {
  const f = findSession(c.plan, v.session_id);
  if (!f) return false;
  const { w, s } = f;
  const used = new Set(w.sessions.map(x => x.date));
  const days = c.availableDays.map(d => addDays(w.start, WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number]))).filter(d => !used.has(d) && !c.blocked.has(d)).sort();
  const allS = () => c.plan.weeks.flatMap(x => x.sessions);
  for (const d of days) {
    const hardNear = allS().some(x => x !== s && x.is_hard && Math.abs(daysBetween(x.date, d)) === 1);
    if (s.is_hard && hardNear) continue;
    const lr = allS().find(x => x.is_long_run && Math.abs(daysBetween(x.date, d)) === 1);
    if (lr && !s.is_long_run && s.planned_duration_s > Math.min(pnum(c.spec, 'two_day.adjacent_ratio') * lr.planned_duration_s, pnum(c.spec, 'two_day.cap_ratio') * c.l30Time(lr.date) - lr.planned_duration_s)) continue;
    ledger.push({ week_index: w.index, session_id: s.id, field: 'date', template_value: s.date, plan_value: d, rule_id: ruleId, criterion: v.inv_id });
    s.date = d; s.weekday = weekday(d);
    w.sessions.sort((a, b) => a.date.localeCompare(b.date));
    return true;
  }
  return false;
};

const replaceWithEasy: Method = (c, v, ledger, ruleId) => {
  const f = findSession(c.plan, v.session_id);
  if (!f || !f.s.is_key) return false;
  const { w, s } = f;
  ledger.push({ week_index: w.index, session_id: s.id, field: 'module_id', template_value: s.module_id, plan_value: 'SES-M-001', rule_id: ruleId, criterion: v.inv_id });
  const dur = s.planned_duration_s;
  Object.assign(s, { module_id: 'SES-M-001', kind: 'easy', is_key: false, is_hard: false, is_test: false, effort_target: 'E1', dose_step: null, pace_range: null,
    segments: [{ effort: 'E1', role: 'main', duration_s: dur, repeats: 1 }], prescription: 'time', planned_distance_m: null, why_message: { id: 'MSG-SES-EASY' } });
  recomputeWeek(w);
  void weekdayIndex;
  return true;
};

const METHODS: Record<string, Method> = { clamp_to_limit: clampToLimit, move_to_free_day: moveToFreeDay, replace_with_easy: replaceWithEasy };
// hold_step_and_shift (REP-002), move_phase_boundary (REP-005) and lower_peak_targets (REP-006) re-run S4–S7 or S3; the MVP
// engine treats them as "cannot change anything", so a violation they would fix ends in S9 (fail closed).

/** One repair of one violation: the REP records in rank order (rule engine), first method that changes the plan. */
export function repairOne(c: RepairCtx, v: Violation, ledger: LedgerEntry[], fired: { stage: string; rule_id: string; op: string; binding?: string; target?: string }[]): string | null {
  const reps = c.spec.rules.ofStage('S8r').slice().sort((a, b) => Number((a.action as { rank?: number })?.rank ?? 9) - Number((b.action as { rank?: number })?.rank ?? 9));
  const f = findSession(c.plan, v.session_id);
  const wk = c.plan.weeks.find(x => x.index === v.week_index) ?? f?.w;
  const prevLoading = wk ? c.plan.weeks.filter(x => x.index < wk.index && !x.is_deload && !x.taper_k).at(-1) : undefined;
  for (const unfixed of [false, true]) {
    const violation = {
      inv_id: v.inv_id, unfixed,
      session: f ? { ...f.s, is_key: f.s.is_key } : openRecord({ is_key: false }),
      week: wk ? { ...wk, is_step_up: !!prevLoading && (wk.planned_time_s > prevLoading.planned_time_s || wk.lr_s > prevLoading.lr_s) } : openRecord({ is_step_up: false }),
    } as unknown as Value;
    const ctx = evalContext(c.spec, { violation }, {});
    for (const r of reps) {
      const res = evaluateRecord(r, ctx);
      if (res.outcome !== 'fired') continue;
      const method = String((r.action as { method?: string }).method);
      const m = METHODS[method];
      if (!m) continue;
      if (m(c, v, ledger, r.id)) { fired.push({ stage: 'S8r', rule_id: r.id, op: 'repair', binding: `violation:${v.inv_id}`, target: v.session_id ?? `week:${v.week_index}` }); return r.id; }
    }
  }
  return null;
}

export { recomputeWeek };

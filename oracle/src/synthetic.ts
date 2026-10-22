// Test scaffolding only: renders a hand-computed plan (src/expected/mvp-plans.ts) as a GeneratorResult so
// that the oracle's own checker can be tested (fires on a broken copy, silent on the hand plan) and so that
// the result schema itself is exercised. It copies the hand numbers; it decides nothing.
import { addDays } from './dates.js';
import { effortTimes } from './invariants.js';
import type { PlanExp, WeekExp } from './expected/mvp-plans.js';
import type { Input, Result, Segment, Session, Week } from './types.js';

const DAY = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 } as Record<string, number>;
const msg = { id: 'MSG-SES-EASY' };

function session(id: string, date: string, module: string, kind: string, segs: Segment[], extra: Partial<Session> = {}): Session {
  const dur = segs.reduce((a, g) => a + (g.duration_s ?? 0) * g.repeats + (g.recovery ? g.recovery.duration_s * (g.repeats - 1) : 0), 0);
  const hard = segs.some((g) => g.effort === 'E3' || g.effort === 'E4');
  const top = segs.reduce((m, g) => (g.effort !== 'E5' && g.effort > m ? g.effort : m), 'E0' as Segment['effort']);
  return {
    id, date, weekday: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const)[DAY[weekdayOf(date)]], module_id: module, kind,
    is_run: true, is_long_run: kind === 'long', is_goal_race: false, is_key: kind === 'key', is_hard: hard || kind === 'long',
    effort_target: top, segments: segs, planned_duration_s: dur, planned_distance_m: Math.floor((dur / 360) * 1000),
    expected_duration_s: dur, pace_range: null, hr_zone: null, hr_source: null, run_walk: false, run_walk_ratio: null,
    ladder: { kind: 'none', rung: null }, why_message: msg, rule_ids: [], status: 'planned', in_published_window: false, ...extra,
  } as Session;
}
function weekdayOf(d: string): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${d}T12:00:00Z`).getUTCDay()];
}
const easySegs = (dur: number, strides: boolean, sharpener: boolean): Segment[] => {
  const s: Segment[] = [];
  let main = dur;
  if (sharpener) { s.push({ effort: 'E3', role: 'work', duration_s: 300, repeats: 2, recovery: { effort: 'E1', duration_s: 120 } }); main -= 720; }
  if (strides) { s.push({ effort: 'E5', role: 'strides', duration_s: 20, repeats: 4, recovery: { effort: 'E0', duration_s: 60 } }); main -= 260; }
  return [{ effort: 'E1', role: 'main', duration_s: main, repeats: 1 }, ...s];
};

export function weekToSessions(w: WeekExp, start: string): Session[] {
  const out: Session[] = [];
  let n = 0;
  const id = () => `w${w.index}s${++n}`;
  if (w.LR_s) out.push(session(id(), addDays(start, 6), 'SES-M-003', 'long', [{ effort: 'E1', role: 'main', duration_s: w.LR_s, repeats: 1 }], { fuel_target_g_h: w.fuel_g_h, is_test: !!w.lr_test, test_for: w.lr_test ? { node: 'DUR', level: Number(w.lr_test.slice(3)) } : null }));
  for (const k of w.keys) {
    let segs: Segment[];
    if (k.module === 'SES-M-012') {
      const t = k.duration_s;
      segs = [{ effort: 'E1', duration_s: t - 2 * Math.floor(t * 0.15), repeats: 1 }, { effort: 'E2', duration_s: Math.floor(t * 0.15), repeats: 1 }, { effort: 'E3', duration_s: Math.floor(t * 0.15), repeats: 1 }];
    } else {
      const [a, b] = k.dose.split('x').map(Number);
      segs = [{ effort: 'E1', role: 'warmup', duration_s: 600, repeats: 1 }, { effort: 'E3', role: 'work', duration_s: b * 60, repeats: a, recovery: { effort: 'E1', duration_s: 120 } }, { effort: 'E1', role: 'cooldown', duration_s: 300, repeats: 1 }];
    }
    out.push(session(id(), addDays(start, DAY[k.day]), k.module, 'key', segs, { is_test: !!k.test, test_for: k.test ? { node: 'THR', level: 1 } : null }));
  }
  let strides = w.taper_k == null ? w.strides_runs : 0;
  let sharp = w.taper_k === 1;
  for (const [day, dur] of Object.entries(w.easy)) {
    out.push(session(id(), addDays(start, DAY[day]), 'SES-M-001', 'easy', easySegs(dur, strides-- > 0, sharp)));
    sharp = false;
  }
  if (w.taper_k != null && !w.LR_s) out.push({ ...session(id(), addDays(start, 6), 'SES-M-001', 'race', [{ effort: 'E3', role: 'race', duration_s: 3000, repeats: 1 }]), is_goal_race: true, is_race: true, is_hard: false });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function planToResult(p: PlanExp, input: Input): Result {
  const weeks: Week[] = p.day0.map((w) => {
    const start = addDays(input.today, 7 * (w.index - 1));
    const sessions = weekToSessions(w, start);
    const runs = sessions.filter((s) => s.is_run);
    const t = runs.filter((s) => !s.is_goal_race).map(effortTimes);
    return {
      index: w.index, start, phase: w.phase, load_kind: w.is_deload ? 'deload' : w.taper_k ? (w.LR_s ? 'taper' : 'race') : 'loading',
      load_ordinal: 1, is_deload: w.is_deload, taper_k: w.taper_k, is_race_week: w.taper_k != null && !w.LR_s,
      planned_time_s: runs.filter((s) => !s.is_goal_race).reduce((a, s) => a + s.planned_duration_s, 0), lr_s: w.LR_s, runs: runs.length,
      key_session_count: sessions.filter((s) => s.is_key).length, e3_touches: sessions.filter((s) => !s.is_goal_race && effortTimes(s).hard > 0).length,
      hard_time_s: t.reduce((a, x) => a + x.hard, 0), frozen: false, sessions,
    };
  });
  return {
    schema_version: 'v5.2', kind: 'plan', ruleset_version: 'v5.2', registry_version: 'v5.2', today: input.today, messages: [], fired_rules: [], engine_state: {}, flags: [],
    gate: 'proceed',
    feasibility: { goal_id: 'goal-1', verdict: p.verdict as 'feasible', horizon: 'H3', weeks_available: p.day0.length, weeks_needed: p.weeks_needed, slack: p.slack, reasons: p.reasons, labels: p.labels, demand: p.demand, predicted_band: { model_id: 'riegel', point_s: null, p_race_s: p.band.p_race_s, fast_edge_s: p.band.fast_edge_s, slow_edge_s: p.band.slow_edge_s, b_fast: p.band.b_fast, b_slow: p.band.b_slow, confidence: 'measured' } },
    validation: { pass: true, passes_used: 0, violations: [] }, ledger: [],
    state: { progression_profile: 'standard', tol_tier: 1, tol_confidence: 'measured' },
    plan: {
      id: '0'.repeat(64), version: 1, parent_plan_id: null, goal_id: 'goal-1', preset_id: 'method_default', status: 'active', degraded: false, pace_mode: 'paced',
      plan_start: input.today, race_date: input.goal.race_date, W: p.day0.length, horizon: 'H3', published_until: addDays(input.today, 6),
      phases: p.phases.split(' ').map((x) => { const [t, r] = x.split(':'); const [s, n] = r.split('+').map(Number); return { type: t, start_week: s, n_weeks: n }; }),
      peak_lr_s: Math.max(...p.day0.map((w) => w.LR_s)), weeks,
    } as Result['plan'] & object,
  } as unknown as Result;
}

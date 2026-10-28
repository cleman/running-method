// Test scaffolding only: renders the hand-computed v5.3 plan (src/expected/v53-clem-plan.ts) as a GeneratorResult,
// so that the v5.3 checks (src/quality.ts) can be shown silent on it and firing on broken copies. It copies the
// hand numbers; it decides nothing.
import { addDays } from './dates.js';
import { effortTimes } from './invariants.js';
import { CLEM_EXPECT, blocksOf, keyS, type V53Week } from './expected/v53-clem-plan.js';
import type { Input, Result, Segment, Session, Week } from './types.js';

const DAY: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function sess(id: string, date: string, day: string, module: string, kind: 'long' | 'key' | 'easy', segs: Segment[], extra: Partial<Session> = {}): Session {
  const dur = segs.reduce((a, g) => a + (g.duration_s ?? 0) * g.repeats + (g.recovery ? g.recovery.duration_s * (g.repeats - 1) : 0), 0);
  const hard = segs.some((g) => g.effort === 'E3' || g.effort === 'E4');
  return {
    id, date, weekday: WD[DAY[day]], module_id: module, kind, is_run: true, is_long_run: kind === 'long', is_goal_race: false,
    is_key: kind === 'key', is_hard: hard, effort_target: hard ? (segs.some((g) => g.effort === 'E4') ? 'E4' : 'E3') : 'E1',
    segments: segs, planned_duration_s: dur, planned_distance_m: null, expected_duration_s: dur, pace_range: null, hr_zone: null,
    hr_source: null, run_walk: false, run_walk_ratio: null, ladder: { kind: 'none', rung: null }, why_message: { id: 'MSG-SES-EASY' }, rule_ids: [],
    status: 'planned', in_published_window: false,
    ...extra,
  } as Session;
}

export function clemWeekSessions(w: V53Week, start: string): Session[] {
  const out: Session[] = [];
  let n = 0;
  const id = () => `w${w.index}s${++n}`;
  out.push(sess(id(), addDays(start, 6), 'Sun', 'SES-M-003', 'long', [{ effort: 'E1', role: 'main', duration_s: w.LR_s, repeats: 1 }]));
  const pace = CLEM_EXPECT.pace.A;
  for (const k of w.keys) {
    const segs: Segment[] = [{ effort: 'E1', role: 'warmup', duration_s: 600, repeats: 1 }];
    blocksOf(k).forEach((b, i) => {
      const d = k.dist[i];
      const g: Segment = { effort: b.effort as Segment['effort'], role: 'work', duration_s: b.rep_s, repeats: b.reps };
      if (d?.rep_m != null) g.show_distance_m = d.rep_m;
      if (b.reps > 1 && b.rec_s) g.recovery = { effort: 'E1', duration_s: b.rec_s, ...(d?.rec_m != null ? { show_distance_m: d.rec_m } : {}) };
      segs.push(g);
      if (b.rec_after_s) segs.push({ effort: 'E1', role: 'main', duration_s: b.rec_after_s, repeats: 1 });
    });
    segs.push({ effort: 'E1', role: 'cooldown', duration_s: 300, repeats: 1 });
    const top = segs.some((g) => g.effort === 'E4') && !segs.some((g) => g.effort === 'E3') ? 'E4' : 'E3';
    const s = sess(id(), addDays(start, DAY[k.day]), k.day, k.module, 'key', segs, {
      dose_step: k.step, prescription_form: 'distance',
      pace_range: { fast_s_per_km: pace[top][0], slow_s_per_km: pace[top][1], effort: top },
    });
    if (s.planned_duration_s !== keyS(k)) throw new Error(`hand plan inconsistent: ${k.module} step ${k.step}`);
    out.push(s);
  }
  let strides = w.strides_runs;
  for (const [day, dur] of Object.entries(w.easy)) {
    const segs: Segment[] = strides-- > 0
      ? [{ effort: 'E1', role: 'main', duration_s: dur - 260, repeats: 1 }, { effort: 'E5', role: 'strides', duration_s: 20, repeats: 4, recovery: { effort: 'E0', duration_s: 60 } }]
      : [{ effort: 'E1', role: 'main', duration_s: dur, repeats: 1 }];
    out.push(sess(id(), addDays(start, DAY[day]), day, 'SES-M-001', 'easy', segs));
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function clemResult(input: Input, weeks: V53Week[]): Result {
  const W: Week[] = weeks.map((w) => {
    const start = addDays(input.today, 7 * (w.index - 1));
    const sessions = clemWeekSessions(w, start);
    const t = sessions.map(effortTimes);
    return {
      index: w.index, start, phase: w.phase, load_kind: w.is_deload ? 'deload' : 'loading', load_ordinal: 1, is_deload: w.is_deload,
      is_calibration: w.is_calibration, long_run_form: w.long_run_form, taper_k: null, is_race_week: false,
      planned_time_s: sessions.reduce((a, s) => a + s.planned_duration_s, 0), lr_s: w.LR_s, runs: sessions.length,
      key_session_count: sessions.filter((s) => s.is_key).length, e3_touches: sessions.filter((s) => effortTimes(s).hard > 0).length,
      hard_time_s: t.reduce((a, x) => a + x.hard, 0), frozen: false, sessions,
    };
  });
  const L = CLEM_EXPECT.levels;
  return {
    schema_version: 'v5.3', kind: 'plan', ruleset_version: 'v5.3', registry_version: 'v5.3', today: input.today, gate: 'proceed', fired_rules: [], flags: [], ledger: [],
    messages: [{ id: 'MSG-EXP-PATH' }, { id: 'MSG-EXP-CALIBRATION' }, { id: 'MSG-SES-PROJECTION' }],
    engine_state: { experienced: { path: 'calibrating' } },
    validation: { pass: true, passes_used: 0, violations: [] },
    feasibility: { goal_id: 'goal-1', verdict: 'stretch', horizon: 'H3', weeks_available: 22, weeks_needed: { rtr: 0, onboard: 0, base: 0, build: 1, specific: 2, taper: 2 }, slack: 17, reasons: ['TARGET_IN_FAST_BAND'], labels: [], demand: null, predicted_band: null },
    state: {
      L_hold_s: CLEM_EXPECT.L30_eff_s, V_hold_s: 28800,
      exp_path: 'calibrating', progression_profile: 'standard', tol_tier: 3, tol_confidence: 'declared', L30_eff_time_s: CLEM_EXPECT.L30_eff_s,
      levels: Object.entries(L).map(([node, level]) => ({ node, level, confidence: level > 0 ? 'declared' : 'estimated', source: ['THR', 'VO2', 'MSP'].includes(node) ? 'race_result' : 'self_report' })),
    },
    plan: {
      id: '0'.repeat(64), version: 1, parent_plan_id: null, status: 'active', published_until: addDays(input.today, 6), goal_id: 'goal-1', preset_id: 'method_default', degraded: false, pace_mode: 'paced',
      plan_start: input.today, race_date: input.goal.race_date, W: 22, horizon: 'H3',
      phases: [{ type: 'BASE', start_week: 1, n_weeks: 8 }, { type: 'BUILD', start_week: 9, n_weeks: 8 }],
      weeks: W,
    },
  } as unknown as Result;
}

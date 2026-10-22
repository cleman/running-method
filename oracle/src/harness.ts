// Week-by-week replay of a fixture under its behaviour model (spec/fixtures-input/README.md,
// fixture-input.schema.json `behaviour`). With replan = weekly the harness calls the generator on every
// Monday with the log so far; 13's week tables show each week as published at its Monday (13 §0).
// This is the harness the fixture schema describes ("the oracle and the integration harness simulate the
// log"); it builds LOG ENTRIES from what the generator published, it never plans anything itself.
import { addDays, daysBetween } from './dates.js';
import { clone } from './fixtures.js';
import { P } from './params.js';
import type { Fixture, Input, LogEntry, Result, Session, Week } from './types.js';

export interface WeekCall { week: number; today: string; result: Result; published?: Week }

function offset(date: string): string {
  const m = Number(date.slice(5, 7));
  return m >= 4 && m <= 10 ? '+02:00' : '+01:00'; // Europe/Paris, close enough for "same evening"
}

/** Logged pace used to fill distances of ticked sessions (SPEC-QUESTIONS OQ-10): the median pace of the
 *  fixture's measured day-0 log, else claimed weekly time ÷ weekly distance, else none. */
export function loggedPaceSPerKm(input: Input): number | null {
  const p = input.log.filter((e) => e.distance_m && e.duration_s && (e.type === 'run' || e.type === 'run_walk'))
    .map((e) => e.duration_s / ((e.distance_m as number) / 1000)).sort((a, b) => a - b);
  if (p.length) return p[Math.floor((p.length - 1) / 2)];
  const c = input.claim ?? {};
  return c.weekly_time_s && c.weekly_distance_m ? c.weekly_time_s / (c.weekly_distance_m / 1000) : null;
}

const RPE: Record<string, number> = { E0: 2, E1: P['ses.target_rpe'].E1, E2: P['ses.target_rpe'].E2, E3: P['ses.target_rpe'].E3, E4: P['ses.target_rpe'].E4, E5: P['ses.target_rpe'].E1 };

/** "done as planned" entry of the as_planned model. */
export function tick(s: Session, pace: number | null, n: number): LogEntry {
  const ladder = s.ladder?.kind !== 'none';
  return {
    id: `h${String(n).padStart(4, '0')}`,
    date: s.date,
    entered_at: `${s.date}T20:00:00${offset(s.date)}`,
    type: s.is_goal_race ? 'race' : s.is_test ? 'test' : s.run_walk ? 'run_walk' : 'run',
    source: 'tick',
    planned_session_id: s.id,
    module_id: s.module_id,
    duration_s: s.planned_duration_s,
    distance_m: ladder || pace == null ? null : Math.floor((s.planned_duration_s / pace) * 1000),
    rpe_0_10: RPE[s.effort_target] ?? 3,
    pain_any: false,
    pain_0_10: null,
    pain_next_morning: false,
    pain_settled_24h: null,
    gi_score_0_10: s.fuel_target_g_h != null ? 0 : null,
    carb_g_per_h: s.fuel_target_g_h ?? null,
    fuel_products: [],
    fatigue_flag: false,
    stopped_early_reason: null,
    short_sleep_or_night_shift: false,
    conditions_hot: false,
    effort_all_out: s.is_goal_race ? true : null,
    is_goal_race: s.is_goal_race,
    test_completed: s.is_test ? true : null,
    test_held_effort: s.is_test ? true : null,
    plausibility_answer: null,
    notes: '',
  };
}

export interface ReplayOptions { maxWeeks?: number }

/** Replays the fixture; returns the call made on each Monday and the week it published. */
export async function replay(fx: Fixture, gen: (i: Input) => Result | Promise<Result>, opt: ReplayOptions = {}): Promise<{ calls: WeekCall[]; unsupported: string[] }> {
  const base = clone(fx.input);
  const pace = loggedPaceSPerKm(base);
  const unsupported = fx.behaviour.deviations.filter((d) => !['skip_session', 'skip_week_unlogged', 'result'].includes(d.what)).map((d) => `${d.what} (week ${d.week})`);
  const calls: WeekCall[] = [];
  let log: LogEntry[] = clone(base.log);
  let anchors = clone(base.anchors);
  let prev: Result | null = null;
  let n = 0;
  const maxWeeks = opt.maxWeeks ?? fx.behaviour.horizon_weeks ?? 30;
  for (let k = 1; k <= maxWeeks; k++) {
    const today = addDays(base.today, 7 * (k - 1));
    const input: Input = { ...clone(base), today, log: clone(log), anchors: clone(anchors) };
    if (prev) { input.engine_state = prev.engine_state; input.parent_plan = prev.plan ?? null; input.flags = prev.flags; }
    const result = await gen(input);
    const published = result.plan?.weeks.find((w) => w.start === today);
    calls.push({ week: k, today, result, published });
    if (fx.behaviour.model === 'day0_only' || !published) break;
    // log the published week as planned, except scripted deviations
    const devs = fx.behaviour.deviations.filter((d) => d.week === k);
    if (!devs.some((d) => d.what === 'skip_week_unlogged')) {
      for (const s of published.sessions) {
        if (!s.is_run) continue;
        if (devs.some((d) => d.what === 'skip_session' && (!d.day || d.day === s.weekday))) continue;
        log.push(tick(s, pace, ++n));
      }
    }
    for (const d of devs.filter((x) => x.what === 'result')) {
      const date = addDays(today, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(d.day ?? 'Sun'));
      const det = d.detail ?? {};
      anchors.push({ id: `h-anchor-${k}`, kind: det.kind ?? 'field_test', distance_m: det.distance_m, time_s: det.time_s, date, entered_at: `${date}T20:00:00${offset(date)}`, conditions_hot: false, effort_all_out: true, confirmed_by_runner: null });
    }
    prev = result;
    if (base.goal.race_date && daysBetween(today, base.goal.race_date) < 7) break;
  }
  return { calls, unsupported };
}

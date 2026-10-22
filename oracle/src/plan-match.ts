// Compares one engine week with one hand-computed week of src/expected/mvp-plans.ts and lists every
// difference in plain words. Tolerances: 60 s on durations (load.round_down_s), none on structure.
import { weekday } from './dates.js';
import { effortTimes, runVolume } from './invariants.js';
import type { WeekExp } from './expected/mvp-plans.js';
import type { Result, Week } from './types.js';

export function diffWeek(w: Week | undefined, e: WeekExp): string[] {
  if (!w) return [`week ${e.index} missing`];
  const d: string[] = [];
  const near = (a: number, b: number) => Math.abs(a - b) <= 60;
  if (w.phase !== e.phase) d.push(`phase ${w.phase} ≠ ${e.phase}`);
  if (w.is_deload !== e.is_deload) d.push(`is_deload ${w.is_deload} ≠ ${e.is_deload}`);
  if ((w.taper_k ?? null) !== e.taper_k) d.push(`taper_k ${w.taper_k} ≠ ${e.taper_k}`);
  if (!near(runVolume(w), e.V_s)) d.push(`running volume ${runVolume(w)} s ≠ ${e.V_s}`);
  if (!near(w.lr_s, e.LR_s)) d.push(`long run ${w.lr_s} s ≠ ${e.LR_s}`);
  const runs = w.sessions.filter((s) => s.is_run && !s.is_goal_race);
  const lr = runs.find((s) => s.is_long_run);
  const hardKeys = runs.filter((s) => !s.is_long_run && effortTimes(s).hard > 0 && e.taper_k == null);
  if (e.taper_k == null && hardKeys.length !== e.keys.length) d.push(`${hardKeys.length} hard key sessions ≠ ${e.keys.length}`);
  for (const k of e.keys) {
    const s = runs.find((x) => weekday(x.date) === k.day && !x.is_long_run);
    if (!s) { d.push(`no run on ${k.day} for ${k.module} ${k.dose}`); continue; }
    if (s.module_id !== k.module) d.push(`${k.day}: module ${s.module_id} ≠ ${k.module}`);
    if (!near(s.planned_duration_s, k.duration_s)) d.push(`${k.day}: ${s.planned_duration_s} s ≠ ${k.duration_s} (${k.dose})`);
    if (effortTimes(s).hard !== k.e3_s) d.push(`${k.day}: E3/E4 work ${effortTimes(s).hard} s ≠ ${k.e3_s} (${k.dose})`);
    if (k.test && !(s.is_test && s.test_for?.node === k.test.slice(0, 3))) d.push(`${k.day}: expected the ${k.test} level test`);
    if (!k.test && s.is_test) d.push(`${k.day}: unexpected level test`);
  }
  for (const [day, dur] of Object.entries(e.easy)) {
    const s = runs.find((x) => weekday(x.date) === day && !x.is_long_run && !e.keys.some((k) => k.day === day));
    if (!s) d.push(`no easy run on ${day}`);
    else if (!near(s.planned_duration_s, dur)) d.push(`${day} easy ${s.planned_duration_s} s ≠ ${dur}`);
  }
  if (runs.length !== e.keys.length + Object.keys(e.easy).length + (e.LR_s ? 1 : 0)) d.push(`${runs.length} runs ≠ ${e.keys.length + Object.keys(e.easy).length + (e.LR_s ? 1 : 0)}`);
  if (e.taper_k == null) {
    const strides = runs.filter((s) => s.segments.some((g) => g.effort === 'E5')).length;
    if (strides !== e.strides_runs) d.push(`${strides} runs with strides ≠ ${e.strides_runs}`);
  } else if (e.taper_k === 1 && !runs.some((s) => !s.is_long_run && effortTimes(s).hard === 600)) d.push('no 2 × 5 min E3 sharpener (SES-015)');
  if (e.LR_s && lr) {
    if ((lr.fuel_target_g_h ?? null) !== e.fuel_g_h) d.push(`long-run fuel ${lr.fuel_target_g_h} g/h ≠ ${e.fuel_g_h}`);
    if (e.lr_test && !(lr.is_test && lr.test_for?.node === 'DUR' && `DUR${lr.test_for.level}` === e.lr_test)) d.push(`long run is not the ${e.lr_test} level test`);
    if (!e.lr_test && lr.is_test) d.push('long run unexpectedly flagged as a level test');
    if (weekday(lr.date) !== 'Sun') d.push(`long run on ${weekday(lr.date)}`);
  }
  return d;
}

export function diffKind(r: Result, e: { kind: string; previous_plan_kept?: boolean; reason?: string; degraded?: boolean }): string[] {
  const d: string[] = [];
  if (r.kind !== e.kind) d.push(`kind ${r.kind} ≠ ${e.kind}`);
  if (e.previous_plan_kept != null && r.previous_plan_kept !== e.previous_plan_kept) d.push(`previous_plan_kept ${r.previous_plan_kept}`);
  if (e.reason && !(r.feasibility?.reasons ?? []).includes(e.reason)) d.push(`reason ${e.reason} missing`);
  if (e.degraded != null && r.plan?.degraded !== e.degraded) d.push(`plan.degraded ${r.plan?.degraded}`);
  return d;
}

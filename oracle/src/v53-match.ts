// Compares one engine week with one hand-computed week of src/expected/v53-clem-plan.ts and lists every difference
// in plain words. Tolerance 60 s on durations (load.round_down_s); alternatives under an open question accepted.
import { weekday } from './dates.js';
import { effortTimes, runVolume } from './invariants.js';
import { keyS, keyWorkS, blocksOf, type V53Week } from './expected/v53-clem-plan.js';
import { LADDER, rungTimes } from './v53-params.js';
import type { Week } from './types.js';

export function diffV53Week(w: Week | undefined, e: V53Week, opts: { easy?: boolean } = {}): string[] {
  if (!w) return [`week ${e.index} missing`];
  const d: string[] = [];
  const near = (a: number, b: number) => Math.abs(a - b) <= 60;
  if (w.phase !== e.phase) d.push(`phase ${w.phase} ≠ ${e.phase}`);
  if (w.is_deload !== e.is_deload) d.push(`is_deload ${w.is_deload} ≠ ${e.is_deload}`);
  if (w.is_calibration != null && w.is_calibration !== e.is_calibration) d.push(`is_calibration ${w.is_calibration} ≠ ${e.is_calibration}`);
  if (e.long_run_form && w.long_run_form != null && w.long_run_form !== e.long_run_form) d.push(`long_run_form ${w.long_run_form} ≠ ${e.long_run_form}`);
  if (!near(runVolume(w), e.V_s)) d.push(`running volume ${runVolume(w)} s ≠ ${e.V_s}`);
  if (!near(w.lr_s, e.LR_s) && !(e.alt_LR_s != null && near(w.lr_s, e.alt_LR_s))) d.push(`long run ${w.lr_s} s ≠ ${e.LR_s}${e.alt_LR_s ? ' / ' + e.alt_LR_s : ''}`);
  const runs = w.sessions.filter((s) => s.is_run && !s.is_goal_race);
  if (runs.length !== 1 + e.keys.length + Object.keys(e.easy).length) d.push(`${runs.length} runs ≠ ${1 + e.keys.length + Object.keys(e.easy).length}`);
  const keys = runs.filter((s) => s.is_key && !s.is_long_run);
  if (keys.length !== e.keys.length) d.push(`${keys.length} key sessions ≠ ${e.keys.length}`);
  const days = keys.map((s) => weekday(s.date)).sort().join(',');
  const want = e.keys.map((k) => k.day).sort().join(','), alt = e.alt_days ? [...e.alt_days].sort().join(',') : null;
  if (days !== want && days !== alt) d.push(`key days ${days} ≠ ${want}${alt ? ' / ' + alt : ''}`);
  e.keys.forEach((k, i) => {
    // match by module (days may follow the alternative)
    const s = keys.find((x) => x.module_id === k.module) ?? keys[i];
    if (!s) return;
    if (s.module_id !== k.module) { d.push(`slot ${i + 1}: module ${s.module_id} ≠ ${k.module}`); return; }
    const steps = [k.step, ...(k.alt_step != null ? [k.alt_step] : [])];
    if (s.dose_step != null && !steps.includes(s.dose_step)) d.push(`${k.module}: dose_step ${s.dose_step} ≠ ${steps.join(' / ')}`);
    const okDur = steps.some((st) => near(s.planned_duration_s, rungTimes(LADDER[k.module][st]).session_s));
    if (!okDur) d.push(`${k.module}: ${s.planned_duration_s} s ≠ ${keyS(k)} (step ${k.step})`);
    const okWork = steps.some((st) => effortTimes(s).hard === rungTimes(LADDER[k.module][st]).work_s);
    if (!okWork) d.push(`${k.module}: E3/E4 work ${effortTimes(s).hard} s ≠ ${keyWorkS(k)}`);
    if (s.dose_step === k.step || s.dose_step == null) {
      const work = s.segments.filter((g) => g.effort === 'E3' || g.effort === 'E4');
      blocksOf(k).forEach((b, j) => {
        const g = work[j], want = k.dist[j];
        if (!g) { d.push(`${k.module}: work block ${j + 1} missing`); return; }
        if (g.duration_s !== b.rep_s || g.repeats !== b.reps) d.push(`${k.module}: block ${j + 1} ${g.repeats} × ${g.duration_s} s ≠ ${b.reps} × ${b.rep_s}`);
        if (want?.rep_m != null && g.show_distance_m != null && g.show_distance_m !== want.rep_m) d.push(`${k.module}: block ${j + 1} shown ${g.show_distance_m} m ≠ ${want.rep_m}`);
        if (want?.rep_m != null && g.show_distance_m == null) d.push(`${k.module}: block ${j + 1} has no distance form (expected ${want.rep_m} m)`);
        if (want?.rec_m != null && g.recovery?.show_distance_m != null && g.recovery.show_distance_m !== want.rec_m) d.push(`${k.module}: block ${j + 1} jog ${g.recovery.show_distance_m} m ≠ ${want.rec_m}`);
      });
    }
  });
  if (opts.easy) for (const [day, dur] of Object.entries(e.easy)) {
    const s = runs.find((x) => weekday(x.date) === day && !x.is_key && !x.is_long_run);
    if (!s) d.push(`no easy run on ${day}`);
    else if (!near(s.planned_duration_s, dur)) d.push(`${day} easy ${s.planned_duration_s} s ≠ ${dur}`);
  }
  const lr = runs.find((s) => s.is_long_run);
  if (lr && weekday(lr.date) !== 'Sun') d.push(`long run on ${weekday(lr.date)}`);
  if (lr && lr.segments.some((g) => g.effort !== 'E1' && g.effort !== 'E0')) d.push('long run not all-E1 (BASE / form a)');
  return d;
}

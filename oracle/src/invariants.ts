// Item (b): checks of every invariant of 07 §5 that can be evaluated from the generator RESULT plus the raw
// INPUT. Written from the 07 §5 prose and the 05/03 text; it calls no generator function and reads no
// generator-derived state where the raw input suffices (07 §5a "B: bound"). Where a check needs a value the
// oracle cannot rebuild, it says `not_checked` with the reason, rather than trusting the engine's number.
//
// Coverage (see README.md for the full table):
//   B-group  checked: 01 02 03 05 06 07 08 09 11 15 17 18 19 21 28 29 30 31
//   S-group  checked: 13 16 25 (own re-derivation), 27 as a warning
//   static / needs history or audit log, not checked here: 04 (see metamorphic M-8 / 042a), 10 12 14 20 22 23 24 26
import { P } from './params.js';
import { addDays, ageHigh, ageLow, daysBetween, weekday } from './dates.js';
import type { Effort, Input, LogEntry, Plan, Result, Segment, Session, Week } from './types.js';

export type Severity = 'violation' | 'warning' | 'not_checked';
export interface Finding {
  inv: string;
  severity: Severity;
  week?: number;
  session?: string;
  observed?: unknown;
  limit?: unknown;
  note: string;
}

const RANK: Record<Effort, number> = { E0: 0, E1: 1, E2: 2, E3: 3, E4: 4, E5: 3 }; // 12 §2b.3: E5 ranks with E3
export const effortRank = (e: Effort): number => RANK[e];
const SLACK_S = 1; // integer-second rounding noise tolerated on products (README §2 rounds down once)

// ---------- raw-input helpers (re-derived by the oracle) ----------

/** INP-020: measured = tick/manual_add entered by the end of date + 48 h. Plausibility (GEN-020) is
 *  approximated by the pace bounds of parameters.md §2 when a distance is given. */
export function isMeasured(e: LogEntry): boolean {
  if (e.source !== 'tick' && e.source !== 'manual_add') return false;
  const limit = Date.parse(`${addDays(e.date, 1)}T00:00:00Z`) + P['log.contemporaneous_window_h'] * 3600e3 + 14 * 3600e3;
  if (Date.parse(e.entered_at) > limit) return false;
  if (e.distance_m && e.duration_s) {
    const pace = e.duration_s / (e.distance_m / 1000);
    const max = e.type === 'run_walk' ? 1200 : 900;
    if (pace < 165 || pace > max) return false;
  }
  return true;
}
const isRunEntry = (e: LogEntry) => e.type === 'run' || e.type === 'run_walk' || e.type === 'test';

/** 07 §3 log status over the 30 days before `today`. */
export function logStatus(input: Input): 'rich' | 'sparse' | 'none' {
  const from = addDays(input.today, -30);
  const meas = input.log.filter((e) => isRunEntry(e) && e.date >= from && e.date < input.today && isMeasured(e));
  const weeks = new Set(meas.map((e) => Math.floor(daysBetween('2000-01-03', e.date) / 7)));
  if (meas.length >= P['log.min_entries_30d'] && weeks.size >= 2) return 'rich';
  const claim = input.claim ?? {};
  const hasClaim = claim.L30_duration_s != null || claim.weekly_time_s != null;
  if (input.log.length > 0 || hasClaim) return 'sparse';
  return 'none';
}

const TOL_THRESH: [number, number][] = [[60, 20], [150, 60], [240, 100], [360, 150], [540, 210]]; // 02 §2 (min)
export function tolFrom(v28Min: number, l30Min: number): number {
  let t = 0;
  TOL_THRESH.forEach(([v, l], i) => { if (v28Min >= v && l30Min >= l) t = i + 1; });
  return t;
}

/** L30_eff at plan time from claims (GEN-011), used only while the log is not rich. */
export function claimL30(input: Input): { time_s: number | null; dist_m: number | null } {
  const c = input.claim ?? {};
  const loggedT = Math.max(0, ...input.log.filter(isMeasured).map((e) => e.duration_s));
  const loggedD = Math.max(0, ...input.log.filter(isMeasured).map((e) => e.distance_m ?? 0));
  let t: number | null = c.L30_duration_s != null ? Math.max(loggedT, Math.floor(P['claim.l30_discount'] * c.L30_duration_s)) : null;
  let d: number | null = c.L30_distance_m != null ? Math.max(loggedD, Math.floor(P['claim.l30_discount'] * c.L30_distance_m)) : null;
  if (d != null && c.weekly_distance_m != null) {
    const ratio = (c.runs_per_week ?? 2) <= 1 ? 1.0 : P['claim.l30_week_ratio_max'];
    d = Math.min(d, Math.floor(ratio * c.weekly_distance_m));
  }
  if (t != null) {
    // TOL from claims, capped at cmp.self_report_level_cap[TOL] = 2 (CMP-004)  — SPEC-QUESTION OQ-07
    const tol = Math.min(2, tolFrom((c.weekly_time_s ?? 0) / 60, t / 60));
    const cap = (P['claim.l30_cap_by_tol'] as Record<number, number>)[tol];
    if (cap != null) t = Math.min(t, cap * 60);
  }
  return { time_s: t, dist_m: d };
}

/** Days since the last run, logged or claimed (01 §1.2 band days). */
export function daysSinceLastRun(input: Input): number | null {
  const runs = input.log.filter(isRunEntry).map((e) => e.date).sort();
  if (runs.length) return daysBetween(runs[runs.length - 1], input.today);
  const band: Record<string, number> = { this_week: 3, '1_2_weeks': 11, '2_4_weeks': 22, '1_3_months': 60, '3_12_months': 180, over_a_year: 400 };
  const b = input.claim?.last_run_band;
  return b && band[b] != null ? band[b] : null;
}

/**
 * l30(d) of 12 §2b.3 read as docs/questions.md Q4 proposes: max of (a) L30_eff at plan time from every
 * source while that run is inside the window and (b) measured logged runs and planned non-race runs dated
 * in [d − 30, d). Returns null when nothing defines it (ladder, no history).
 */
export function l30(input: Input, plan: Plan | undefined, d: string, dim: 'time' | 'dist'): number | null {
  const from = addDays(d, -30);
  const vals: number[] = [];
  for (const e of input.log) {
    if (!isRunEntry(e) || !isMeasured(e) || e.date < from || e.date >= d) continue;
    const v = dim === 'time' ? e.duration_s : e.distance_m;
    if (v != null) vals.push(v);
  }
  if (logStatus(input) === 'sparse' && daysBetween(input.today, d) < 30) {
    const c = claimL30(input);
    const v = dim === 'time' ? c.time_s : c.dist_m;
    if (v != null) vals.push(v);
  }
  for (const w of plan?.weeks ?? []) for (const s of w.sessions) {
    if (!s.is_run || s.is_goal_race || s.date < from || s.date >= d) continue;
    const v = dim === 'time' ? s.planned_duration_s : s.planned_distance_m;
    if (v != null) vals.push(v);
  }
  return vals.length ? Math.max(...vals) : null;
}

/** Time of one segment (repeats × length + (repeats − 1) recoveries); null for distance-prescribed. */
export function segmentTimes(seg: Segment): { work: number; recovery: number } | null {
  if (seg.duration_s == null) return null;
  return { work: seg.duration_s * seg.repeats, recovery: seg.recovery ? seg.recovery.duration_s * (seg.repeats - 1) : 0 };
}
/** LOD-033 accounting: E3+E4 work; E2 work; E0–E1 incl. warm-ups, recoveries and strides. */
export function effortTimes(s: Session): { hard: number; e2: number; easy: number; known: boolean } {
  let hard = 0, e2 = 0, easy = 0, known = true;
  for (const seg of s.segments) {
    const t = segmentTimes(seg);
    if (!t) { known = false; continue; }
    if (seg.effort === 'E3' || seg.effort === 'E4') hard += t.work; else if (seg.effort === 'E2') e2 += t.work; else easy += t.work;
    easy += t.recovery;
  }
  return { hard, e2, easy, known };
}
const hasHardSegment = (s: Session) => s.segments.some((g) => g.effort === 'E3' || g.effort === 'E4');

// ---------- the checks ----------

export interface CheckOptions {
  /** Gate outcome the oracle expects (S1); used by INV-05/06 when the result does not carry one. */
  expectedGate?: string;
}

export function allSessions(plan: Plan): Session[] {
  return plan.weeks.flatMap((w) => w.sessions);
}

export function checkResult(input: Input, result: Result, _opts: CheckOptions = {}): Finding[] {
  const out: Finding[] = [];
  if (result.kind === 'gate_stop' || result.kind === 'hold' || result.kind === 'safe_state') {
    // GEN-001 / 12 §3.12: no sessions are shown.
    if (result.plan && allSessions(result.plan).some((s) => s.is_run))
      out.push({ inv: 'GEN-001', severity: 'violation', note: `${result.kind} result carries running sessions` });
    return out;
  }
  if (result.kind === 'fail_closed') {
    if (result.plan) out.push({ inv: 'GEN-003', severity: 'violation', note: 'fail_closed result carries a plan for the requested goal' });
    for (const o of result.feasibility?.options ?? []) {
      if (o.verdict !== 'feasible' && o.verdict !== 'stretch') out.push({ inv: 'FEA-041', severity: 'violation', note: `option ${o.rank} verdict ${o.verdict}` });
      const sub = { ...input, goal: { ...input.goal, ...o.new_goal } } as Input;
      for (const f of checkPlan(sub, result, o.plan)) out.push({ ...f, note: `option ${o.rank} (${o.kind}): ${f.note}` });
    }
    return out;
  }
  if (!result.plan) return [{ inv: 'contract', severity: 'violation', note: 'kind plan without plan' }];
  return checkPlan(input, result, result.plan);
}

export function checkPlan(input: Input, result: Result, plan: Plan): Finding[] {
  const out: Finding[] = [];
  const v = (inv: string, note: string, x: Partial<Finding> = {}) => out.push({ inv, severity: 'violation', note, ...x });
  const nc = (inv: string, note: string) => out.push({ inv, severity: 'not_checked', note });
  const sessions = allSessions(plan);
  const byDate = new Map<string, Session[]>();
  for (const s of sessions) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  const prof = input.profile;
  const gap = daysSinceLastRun(input);
  const gapBand = gap != null && gap >= P['gap.reduce_trigger_days'];

  // --- structure (schema README §4, §6, §8) ---
  plan.weeks.forEach((w, i) => {
    if (w.index !== i + 1) v('contract', `week order: position ${i + 1} has index ${w.index}`, { week: w.index });
    if (weekday(w.start) !== 'Mon') v('contract', `week ${w.index} starts on ${weekday(w.start)}`, { week: w.index });
    if (i === 0 && w.start !== plan.plan_start) v('contract', `week 1 start ${w.start} ≠ plan_start ${plan.plan_start}`);
    for (const s of w.sessions) if (s.date < w.start || s.date > addDays(w.start, 6)) v('contract', `session ${s.id} dated outside its week`, { week: w.index, session: s.id });
  });

  // --- INV-11 week totals (and the other declared week aggregates) ---
  for (const w of plan.weeks) {
    const sum = w.sessions.reduce((a, s) => a + (s.is_goal_race ? 0 : s.planned_duration_s), 0);
    if (w.planned_time_s !== sum) v('INV-11', `week ${w.index} planned_time_s ${w.planned_time_s} ≠ Σ sessions ${sum}`, { week: w.index, observed: w.planned_time_s, limit: sum });
    const runs = w.sessions.filter((s) => s.is_run).length;
    if (w.runs !== runs) v('INV-11', `week ${w.index} runs ${w.runs} ≠ running sessions ${runs}`, { week: w.index });
    const lr = w.sessions.filter((s) => s.is_long_run && !s.is_goal_race);
    const lrS = lr.length ? Math.max(...lr.map((s) => s.planned_duration_s)) : 0;
    if (w.lr_s !== lrS) v('INV-11', `week ${w.index} lr_s ${w.lr_s} ≠ long run ${lrS}`, { week: w.index });
    // the goal race is outside the week's training totals (README §6); OQ-20 asks whether that also holds
    // for hard_time_s and e3_touches — the oracle reads it so.
    const train = w.sessions.filter((s) => !s.is_goal_race);
    const hard = train.reduce((a, s) => a + effortTimes(s).hard, 0);
    if (train.every((s) => effortTimes(s).known) && w.hard_time_s !== hard) v('INV-11', `week ${w.index} hard_time_s ${w.hard_time_s} ≠ E3+E4 segment time ${hard}`, { week: w.index });
    const touches = train.filter(hasHardSegment).length;
    if (w.e3_touches !== touches) v('INV-11', `week ${w.index} e3_touches ${w.e3_touches} ≠ ${touches}`, { week: w.index });
    const keys = w.sessions.filter((s) => s.is_key).length;
    if (w.key_session_count !== keys) v('INV-11', `week ${w.index} key_session_count ${w.key_session_count} ≠ is_key sessions ${keys}`, { week: w.index });
    for (const s of w.sessions) {
      const segT = s.segments.reduce((a, g) => { const t = segmentTimes(g); return t ? a + t.work + t.recovery : a; }, 0);
      if (s.is_run && s.segments.every((g) => g.duration_s != null) && s.prescription !== 'distance' && segT !== s.planned_duration_s)
        out.push({ inv: 'INV-11', severity: 'warning', week: w.index, session: s.id, note: `segments sum to ${segT} s, planned_duration_s ${s.planned_duration_s}` });
      const hardDay = hasHardSegment(s) || s.is_long_run;
      if (s.is_run && !s.is_goal_race && s.is_hard !== hardDay) v('INV-17', `session ${s.id} is_hard=${s.is_hard} but SES-004 gives ${hardDay}`, { week: w.index, session: s.id });
    }
  }

  // --- INV-01 / INV-02 spike caps ---
  if (gapBand) nc('INV-01/02', `last run ${gap} days before today: gap factors (GEN-013/LOD-011) not re-derived`);
  else for (const s of sessions) {
    if (!s.is_run || s.is_goal_race) continue;
    if (s.ladder?.kind === 'none' && s.planned_distance_m != null) {
      const ld = l30(input, plan, s.date, 'dist');
      if (ld != null && s.planned_distance_m > Math.floor(P['spike.warn_ratio'] * ld) + SLACK_S)
        v('INV-01', `${s.date} distance ${s.planned_distance_m} m > 1.10 × l30_dist ${ld}`, { session: s.id, observed: s.planned_distance_m, limit: P['spike.warn_ratio'] * ld });
    }
    if (s.ladder?.kind !== 'start') {
      const lt = l30(input, plan, s.date, 'time');
      if (lt == null) { if (s.ladder?.kind === 'none') nc('INV-02', `${s.date}: l30_time undefined`); continue; }
      if (s.planned_duration_s > Math.floor(P['spike.warn_ratio'] * lt) + SLACK_S)
        v('INV-02', `${s.date} duration ${s.planned_duration_s} s > 1.10 × l30_time ${lt}`, { session: s.id, observed: s.planned_duration_s, limit: P['spike.warn_ratio'] * lt });
      if (s.floor_extension && s.floor_extension.max_duration_s > Math.floor(P['spike.warn_ratio'] * lt) + SLACK_S)
        v('INV-02', `${s.date} floor extension max ${s.floor_extension.max_duration_s} s > 1.10 × l30_time`, { session: s.id });
    }
  }

  // --- INV-03 two-day budget ---
  for (const s of sessions) {
    if (!s.is_long_run || s.is_goal_race || s.is_b2b_pair || gapBand) continue;
    const lt = l30(input, plan, s.date, 'time');
    if (lt == null) continue;
    const cap = Math.min(P['two_day.adjacent_ratio'] * s.planned_duration_s, P['two_day.cap_ratio'] * lt - s.planned_duration_s);
    for (const d of [addDays(s.date, -1), addDays(s.date, 1)]) for (const n of byDate.get(d) ?? []) {
      if (n.is_run && !n.is_goal_race && n.planned_duration_s > cap + SLACK_S)
        v('INV-03', `${n.date} next to long run ${s.date}: ${n.planned_duration_s} s > ${Math.floor(cap)}`, { session: n.id, observed: n.planned_duration_s, limit: cap });
    }
  }

  // --- INV-05 pause flags ---
  for (const f of input.flags ?? []) {
    if (f.status !== 'active' || !(P['flag.pause_kinds'] as readonly string[]).includes(f.subkind)) continue;
    const bad = sessions.filter((s) => s.is_run && s.date >= f.raised_on);
    if (bad.length) v('INV-05', `active ${f.subkind} flag from ${f.raised_on}: ${bad.length} running sessions`, { observed: bad.length, limit: 0 });
  }

  // --- INV-06 restricted gate ---
  if (result.gate === 'proceed_restricted')
    for (const s of sessions) if (s.is_run && effortRank(s.effort_target) > RANK.E2) v('INV-06', `restricted gate: ${s.id} at ${s.effort_target}`, { session: s.id });

  // --- INV-07 special populations ---
  const statuses: string[] = (prof.special_status ?? []).map((x: { type: string }) => x.type);
  if (statuses.includes('pregnant')) for (const s of sessions) {
    if (s.is_run && effortRank(s.effort_target) > RANK[P['pregnancy.max_effort'] as Effort]) v('INV-07', `pregnancy: ${s.id} at ${s.effort_target}`, { session: s.id });
    if (s.segments.some((g) => g.effort === 'E5')) v('INV-07', `pregnancy: strides (E5 ranks as E3) in ${s.id}`, { session: s.id });
  }
  if (prof.birth_year != null && prof.birth_month != null) for (const s of sessions) {
    if (s.is_b2b_pair && ageLow(prof.birth_year, prof.birth_month, s.date) < P['minor.adult_age']) v('INV-07', `minor in a back-to-back pair on ${s.date}`, { session: s.id });
  }

  // --- INV-08 taper keeps frequency and intensity ---
  const taper = plan.weeks.filter((w) => w.phase === 'TAPER' || w.taper_k != null);
  if (taper.length) {
    const first = taper[0].index;
    const pre = plan.weeks.filter((w) => w.index < first && w.index >= first - 3);
    if (pre.length === 3) {
      const preRuns = Math.floor(pre.reduce((a, w) => a + w.runs, 0) / 3);
      const hadE3 = pre.some((w) => w.sessions.some(hasHardSegment));
      if (plan.pre_taper_runs != null && plan.pre_taper_runs !== preRuns) v('INV-08', `pre_taper_runs ${plan.pre_taper_runs} ≠ floor(mean runs of weeks ${first - 3}–${first - 1}) = ${preRuns}`);
      if (plan.pre_taper_had_e3 != null && plan.pre_taper_had_e3 !== hadE3) v('INV-08', `pre_taper_had_e3 ${plan.pre_taper_had_e3} ≠ ${hadE3}`);
      for (const w of taper) {
        if (w.is_race_week) continue;
        if (w.runs < P['taper.freq_min_ratio'] * preRuns) v('INV-08', `taper week ${w.index}: ${w.runs} runs < ${preRuns}`, { week: w.index });
        if (hadE3 && !w.sessions.some(hasHardSegment)) v('INV-08', `taper week ${w.index} has no E3+ touch`, { week: w.index });
      }
    } else nc('INV-08', 'fewer than 3 weeks before the taper inside the plan');
  }

  // --- INV-09 HR zones only from measured references ---
  const refs = new Set((input.hr_references ?? []).map((r: { kind: string }) => r.kind));
  for (const s of sessions) if (s.hr_zone && (s.hr_source == null || !refs.has(s.hr_source))) v('INV-09', `${s.id} HR zone without a measured ${s.hr_source ?? 'reference'}`, { session: s.id });

  // --- INV-13 long run ≤ max(preset cap, L_hold), method_default MVP families (05 §4) ---
  const fam = familyOf(input.goal.distance);
  const lHold = result.state?.L_hold_s ?? null;
  for (const w of plan.weeks) for (const s of w.sessions) {
    if (!s.is_long_run || s.is_goal_race || s.is_extension || plan.preset_id !== 'method_default') continue;
    let cap: number | null = null;
    if (fam === 'short' || fam === 'base') {
      const pct = (P['lr.pct_cap.short'] as Record<number, number>)[Math.min(5, Math.max(2, w.runs))];
      cap = Math.min(Math.max(pct * runVolume(w), P['lr.pct_floor_s']), 150 * 60);
    } else if (input.goal.distance === 'HM') cap = Math.min(Math.max(P['lr.pct_cap.road_classic'] * runVolume(w), P['lr.pct_floor_s']), 150 * 60);
    if (cap == null) continue;
    const limit = Math.max(cap, lHold ?? 0);
    if (s.planned_duration_s > limit + SLACK_S) v('INV-13', `week ${w.index} long run ${s.planned_duration_s} s > max(preset cap ${Math.floor(cap)}, L_hold ${lHold})`, { week: w.index, session: s.id });
  }

  // --- INV-15 paces only from a measured anchor ≤ anchor.max_age_days ---
  const measuredAnchors = (input.anchors ?? []).filter((a) => ['race', 'field_test', 'cs_test'].includes(a.kind) && a.distance_m && a.time_s &&
    Date.parse(a.entered_at) <= Date.parse(`${addDays(a.date, 1)}T00:00:00Z`) + P['log.contemporaneous_window_h'] * 3600e3 + 14 * 3600e3);
  for (const s of sessions) {
    if (!s.pace_range) continue;
    if (plan.pace_mode === 'effort_only') v('INV-15', `${s.id} has a pace range in an effort-only plan`, { session: s.id });
    // Logged results after day 0 can also set anchors (harness runs); only day-0 anchors are known here.
    const ok = measuredAnchors.some((a) => a.date <= s.date && daysBetween(a.date, s.date) <= P['anchor.max_age_days']);
    const later = input.log.some((e) => (e.type === 'race' || e.type === 'test') && isMeasured(e));
    if (!ok && !later) v('INV-15', `${s.id} has a pace range but no measured anchor ≤ ${P['anchor.max_age_days']} days old`, { session: s.id });
    if (s.segments.every((g) => g.effort === 'E5')) v('INV-15', `${s.id}: strides carry a pace (03 §3b: E5 has none)`, { session: s.id });
  }

  // --- INV-16 weekly growth ≤ profile ceiling over the last non-deload week ---
  const prof16 = (result.state?.progression_profile as string | undefined) ?? null;
  if (prof16 === 'standard' || prof16 === 'slow') {
    const max = prof16 === 'standard' ? P['prog.standard.week_max'] : P['prog.slow.week_max'];
    let prev: Week | null = null;
    for (const w of plan.weeks) {
      const loading = w.load_kind === 'loading';
      if (loading && prev && w.index - prev.index <= P['prog.baseline_max_age_weeks']) {
        const lim = Math.floor((1 + max) * runVolume(prev));
        if (runVolume(w) > lim + 60) v('INV-16', `week ${w.index} run volume ${runVolume(w)} s > (1 + ${max}) × week ${prev.index} (${runVolume(prev)})`, { week: w.index, observed: runVolume(w), limit: lim });
      }
      if (!w.is_deload && (loading || w.phase === 'SHARPEN')) prev = w;
    }
  } else nc('INV-16', 'progression profile not reported in result.state; ceiling unknown');

  // --- INV-17 no two hard days back to back (method_default declares none allowed) ---
  const hardDates = [...new Set(sessions.filter((s) => s.is_run && !s.is_goal_race && (hasHardSegment(s) || s.is_long_run)).map((s) => s.date))].sort();
  for (let i = 1; i < hardDates.length; i++)
    if (daysBetween(hardDates[i - 1], hardDates[i]) === 1 && plan.preset_id === 'method_default')
      v('INV-17', `hard days on ${hardDates[i - 1]} and ${hardDates[i]}`);

  // --- INV-18 race-day fuelling ≤ highest tolerated logged intake ---
  if (plan.race_fuel_g_h != null) {
    const tol = input.log.filter((e) => isMeasured(e) && e.carb_g_per_h != null && (e.gi_score_0_10 as number | null) != null && (e.gi_score_0_10 as number) <= P['fuel.gi_pass_max']).map((e) => e.carb_g_per_h as number);
    const max = tol.length ? Math.max(...tol) : null;
    if (max == null || plan.race_fuel_g_h > max) v('INV-18', `race fuel ${plan.race_fuel_g_h} g/h > tolerated ${max ?? 'none logged'}`, { observed: plan.race_fuel_g_h, limit: max });
  }

  // --- INV-19 no deload in TAPER; none when W < deload.min_plan_weeks ---
  for (const w of plan.weeks) if (w.is_deload && (w.phase === 'TAPER' || w.taper_k != null)) v('INV-19', `deload inside the taper (week ${w.index})`, { week: w.index });
  if (plan.W != null && plan.W < P['deload.min_plan_weeks'] && plan.weeks.some((w) => w.is_deload)) v('INV-19', `W ${plan.W} < ${P['deload.min_plan_weeks']} but a deload is planned`);

  // --- INV-21 user constraints (INP-007 defaults when unknown) ---
  const days: string[] = prof.available_days ?? ['Tue', 'Thu', 'Sat'];
  const maxRuns: number = prof.max_runs_per_week ?? Math.min(days.length, 3);
  const minutes: number = prof.available_minutes_per_week ?? maxRuns * 30;
  const blocked = new Set<string>(prof.blocked_dates ?? []);
  for (const s of sessions) {
    if (!days.includes(weekday(s.date))) v('INV-21', `${s.id} on ${weekday(s.date)}, not an available day`, { session: s.id });
    if (blocked.has(s.date)) v('INV-21', `${s.id} on blocked date ${s.date}`, { session: s.id });
  }
  for (const w of plan.weeks) {
    if (w.planned_time_s > minutes * 60) v('INV-21', `week ${w.index} ${w.planned_time_s} s > ${minutes} min available`, { week: w.index });
    if (w.runs > maxRuns) v('INV-21', `week ${w.index} ${w.runs} runs > ${maxRuns}`, { week: w.index });
  }

  // --- INV-25 peak long run ≥ L_req_time (time governs) unless met by logged distance or credited ---
  const dem = result.feasibility?.demand;
  if (dem?.L_req_time_s != null && plan.peak_lr_s != null) {
    const ok = plan.peak_lr_s >= dem.L_req_time_s - P['load.round_down_s'] || dem.met_by_logged_distance || dem.credited;
    if (!ok) v('INV-25', `peak long run ${plan.peak_lr_s} s < L_req ${dem.L_req_time_s}`);
    const maxLR = Math.max(0, ...sessions.filter((s) => s.is_long_run && !s.is_goal_race && !s.is_extension).map((s) => s.planned_duration_s));
    if (plan.peak_lr_s !== maxLR) v('INV-25', `peak_lr_s ${plan.peak_lr_s} ≠ longest planned long run ${maxLR}`);
  }

  // --- INV-27 baseline hold (warning: a T0–T3 limit may justify it) ---
  const vHold = result.state?.V_hold_s ?? null;
  if (vHold != null) for (const w of plan.weeks) if (w.load_kind === 'loading' && runVolume(w) < vHold - 60)
    out.push({ inv: 'INV-27', severity: 'warning', week: w.index, note: `week ${w.index} run volume ${runVolume(w)} < V_hold ${vHold} (needs a T0–T3 reason)` });

  // --- INV-28 / INV-29 long-run guard ---
  const guard = P['lr.long_guard_min'] * 60;
  const over = sessions.filter((s) => s.is_run && !s.is_goal_race && s.expected_duration_s > guard);
  for (const s of over) {
    const tol = result.state?.tol_tier ?? 0;
    const conf = result.state?.tol_confidence;
    if (tol < P['lr.long_guard_tol_level'] || conf !== 'measured') v('INV-28', `${s.id} expected ${s.expected_duration_s} s > 180 min without TOL L4 measured`, { session: s.id });
    if (!s.run_walk) v('INV-28', `${s.id} over 180 min is not run-walk`, { session: s.id });
    if (prof.birth_year != null && ageHigh(prof.birth_year, prof.birth_month, s.date) >= P['masters.vigorous_assessment_age'] && !input.screening?.saf060_attested_on)
      v('INV-28', `${s.id}: age ≥ 65 without SAF-060 attestation`, { session: s.id });
  }
  for (let i = 0; i < over.length; i++) for (let j = i + 1; j < over.length; j++) {
    const a = over[i], b = over[j];
    if (a.pair_id && a.pair_id === b.pair_id) continue;
    if (Math.abs(daysBetween(a.date, b.date)) < P['lr.over180_min_gap_days']) v('INV-29', `runs over 180 min on ${a.date} and ${b.date}`, { session: b.id });
  }

  // --- INV-30 minors' per-date caps ---
  if (prof.birth_year != null) for (const s of sessions) {
    if (!s.is_run) continue;
    const age = ageLow(prof.birth_year, prof.birth_month, s.date);
    if (age >= P['minor.adult_age']) continue;
    const km = (P['minor.max_race_km.recommended'] as Record<number, number>)[age];
    if (km == null) { v('INV-30', `${s.id}: age ${age} has no row in minor.max_race_km.recommended`, { session: s.id }); continue; }
    if (s.planned_distance_m == null) nc('INV-30', `${s.id}: minor's session without a planned distance (literal assertion cannot be evaluated)`);
    else if (s.planned_distance_m > P['minor.lr_cap_ratio'] * 1000 * km) v('INV-30', `${s.id} ${s.planned_distance_m} m > ${km} km at age ${age}`, { session: s.id });
  }

  // --- INV-31 recovery between goal races ---
  const prev = (input.engine_state as Record<string, any> | null)?.last_goal_race ?? lastLoggedGoalRace(input);
  if (prev?.date && prev.distance && input.goal.race_date) {
    const need = (P['race.recovery_days'] as Record<string, number>)[prev.distance];
    if (daysBetween(prev.date, input.goal.race_date) < need) v('INV-31', `goal race ${input.goal.race_date} < ${need} days after the ${prev.distance} on ${prev.date} (a plan must not be emitted)`);
  }

  // --- LOD-033 TID shares (not an invariant, but every week must hold it: 05 §5) ---
  const tidKey = input.goal.distance === 'HM' ? 'HM' : fam;
  for (const w of plan.weeks) {
    const t = w.sessions.filter((s) => s.is_run && !s.is_goal_race).map(effortTimes);
    if (t.some((x) => !x.known)) continue;
    const V = t.reduce((a, x) => a + x.hard + x.e2 + x.easy, 0);
    if (!V) continue;
    const hard = t.reduce((a, x) => a + x.hard, 0), e2 = t.reduce((a, x) => a + x.e2, 0);
    const hs = (P['tid.hard_share_max'] as Record<string, number>)[tidKey] ?? 0.1;
    if (hard > hs * V + SLACK_S) v('LOD-033', `week ${w.index} E3+E4 ${hard} s > ${hs} × ${V}`, { week: w.index });
    if (e2 > P['tid.e2_share_max'] * V + SLACK_S) v('LOD-033', `week ${w.index} E2 ${e2} s > 0.20 × ${V}`, { week: w.index });
    if (V - hard - e2 < P['tid.easy_share_min'] * V - SLACK_S) v('LOD-033', `week ${w.index} E0–E1 share below 0.75`, { week: w.index });
  }

  for (const id of ['INV-04', 'INV-10', 'INV-12', 'INV-14', 'INV-20', 'INV-22', 'INV-23', 'INV-24', 'INV-26'])
    nc(id, 'not evaluable from one result (static lint, audit log or generator-derived levels); see README coverage table');
  return out;
}

/** Running volume of a week: planned running time without the goal race (strength and cross-training
 *  excluded; SPEC-QUESTION OQ-09 asks whether planned_time_s includes them). */
export function runVolume(w: Week): number {
  return w.sessions.filter((s) => s.is_run && !s.is_goal_race).reduce((a, s) => a + s.planned_duration_s, 0);
}

export function familyOf(d: string): 'short' | 'road_classic' | 'ultra' | 'base' {
  if (d === '5K' || d === '10K') return 'short';
  if (d === 'HM' || d === 'M') return 'road_classic';
  if (d === '50K' || d === '100K') return 'ultra';
  return 'base';
}

function lastLoggedGoalRace(input: Input): { date: string; distance: string } | null {
  const r = input.log.filter((e) => e.is_goal_race).sort((a, b) => a.date.localeCompare(b.date)).pop();
  if (!r || !r.distance_m) return null;
  const km = r.distance_m / 1000;
  const d = km < 7 ? '5K' : km < 15 ? '10K' : km < 30 ? 'HM' : km < 45 ? 'M' : km < 75 ? '50K' : '100K';
  return { date: r.date, distance: d };
}

export const violations = (f: Finding[]) => f.filter((x) => x.severity === 'violation');

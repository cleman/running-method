// S7 Sessions (07 §2b, S7.1–S7.8): count, long run, module choice, placement, dose, easy fill, extras, render.
// SES-007/SES-006 (S7.1) run through the rule engine per week; the procedures choose_key_modules, place_in_order,
// dose_fit and water_fill (12 §2b.4) are native and follow their v5.2 algorithm text.
import type { Effort, GeneratorInput, MessageInstance, Node, PhaseType, Segment, Session, Week } from '../model/types.ts';
import type { Value } from '../expr/eval.ts';
import { runRecords, composeTarget } from '../rules/engine.ts';
import { EFFORT_RANK } from '../rules/helpers.ts';
import { type Spec, evalContext, openRecord, pnum, pval, roundDown } from '../context.ts';
import { addDays, daysBetween, isoWeek, toDays, weekday, weekdayIndex, WEEKDAYS, type ISODate } from '../util/dates.ts';
import { MODULES, type ModuleDef } from './modules.ts';
import { l30PlanSources, type DerivedState } from './state.ts';
import type { GateResult, FiredRule } from './gate.ts';
import type { Feasibility, Layout, Availability } from './feasibility.ts';
import { paceRange, type Demand } from './demand.ts';
import { spacedDays } from './ladder.ts';
import { onExpPath } from './experienced.ts';

type Block = { effort: string; reps: number; rep_s: number; rec_s?: number; rec_after_s?: number };
type DoseStep = { effort?: string; reps?: number; rep_s?: number; rec_s?: number; rec_effort?: string; total_s?: number; shares?: Record<string, number>; share?: number | string; distance_m?: number; blocks?: Block[]; e2_s?: number };

export interface BuildCtx {
  spec: Spec; input: GeneratorInput; st: DerivedState; gate: GateResult; feas: Feasibility; layout: Layout; av: Availability;
  fired: FiredRule[];
  /** levels used for eligibility (day-0 levels; projection never raises a level, 07 §2b) */
  levels: Record<Node, number>;
}

const WU = 600, CD = 300;
const hardEffort = (e: Effort) => e === 'E3' || e === 'E4';
const segTime = (s: Segment) => (s.duration_s ?? 0) * s.repeats + (s.recovery ? s.recovery.duration_s * (s.repeats - 1) : 0);
export const sessionTime = (segs: Segment[]) => segs.reduce((a, s) => a + segTime(s), 0);
/** time per effort class, recoveries counted as their own effort (05 §5: recoveries and strides count as E1/easy) */
export function effortTimes(segs: Segment[]) {
  let hard = 0, e2 = 0, easy = 0;
  for (const s of segs) {
    const work = (s.duration_s ?? 0) * s.repeats;
    if (hardEffort(s.effort)) hard += work; else if (s.effort === 'E2') e2 += work; else easy += work;
    if (s.recovery) easy += s.recovery.duration_s * (s.repeats - 1);
  }
  return { hard, e2, easy };
}

function phaseAllows(m: ModuleDef, ph: PhaseType, part: { baseLate: boolean; buildLastThird: boolean; exp?: boolean }): boolean {
  if (m.allowed_phases.includes(ph)) return true;
  if (ph === 'BASE' && part.exp && m.id === 'SES-M-008') return true;   // v5.3 SES-026: all of BASE on the experienced path
  if (ph === 'BASE' && part.baseLate && m.allowed_phases.includes('BASE_LATE')) return true;
  if (ph === 'BUILD' && (m.allowed_phases.includes('BASE_LATE'))) return true;
  if (ph === 'BUILD' && part.buildLastThird && m.allowed_phases.includes('BUILD_LAST_THIRD')) return true;
  if ((ph === 'SPECIFIC' || ph === 'SHARPEN' || ph === 'TAPER') && m.allowed_phases.includes('BUILD_LAST_THIRD') && ph === 'SPECIFIC') return true;
  return false;
}

/** SES-001 filter. */
function eligible(c: BuildCtx, m: ModuleDef, ph: PhaseType, part: { baseLate: boolean; buildLastThird: boolean; exp?: boolean }, ceiling: Effort): boolean {
  if (m.hills && c.input.profile.hill_access !== true) return false;   // SES-022 (v5.3: SES-M-028 → SES-M-027)
  if (!phaseAllows(m, ph === 'SHARPEN' ? 'SPECIFIC' : ph, part)) return false;
  if (m.presets !== 'all' && !m.presets.includes('method_default')) return false;
  if (!m.prereqs.every(q => (c.levels[q.node] ?? 0) >= q.level)) return false;
  return (EFFORT_RANK[m.effort_profile] ?? 9) <= (EFFORT_RANK[ceiling] ?? 4);
}

function intervalSegments(st: DoseStep, effort: Effort): Segment[] {
  const work: Segment = { effort, role: 'work', duration_s: st.rep_s!, repeats: st.reps ?? 1 };
  if ((st.reps ?? 1) > 1 && st.rec_s) work.recovery = { effort: 'E1', duration_s: st.rec_s };
  return [{ effort: 'E1', role: 'warmup', duration_s: WU, repeats: 1 }, work, { effort: 'E1', role: 'cooldown', duration_s: CD, repeats: 1 }];
}

/** Segments of a key module at a dose step (06 §2c). */
export function keySegments(spec: Spec, mid: string, step: number, demand: Demand, goal: GeneratorInput['goal']): Segment[] | null {
  const steps = pval<DoseStep[]>(spec, `ses.dose.${mid}.steps`);
  if (!Array.isArray(steps) || !steps.length) return null;
  const st = steps[Math.min(step, steps.length - 1)];
  if (mid === 'SES-M-012') {
    const T = st.total_s!; const e3 = Math.round(T * (st.shares!.E3 ?? 0)), e2 = Math.round(T * (st.shares!.E2 ?? 0));   // 06 §2c: exact shares, no rounding stated
    return [{ effort: 'E1', role: 'main', duration_s: T - e3 - e2, repeats: 1 }, { effort: 'E2', role: 'work', duration_s: e2, repeats: 1 }, { effort: 'E3', role: 'work', duration_s: e3, repeats: 1 }];
  }
  if (mid === 'SES-M-011') {
    const raceEff = (pval<Record<string, Effort>>(spec, 'ses.race_effort')[goal.distance] ?? 'E3');
    const share = Math.min(typeof st.share === 'number' ? st.share : 0.1, pval<Record<string, number>>(spec, 'ses.msp_share_max')[goal.distance] ?? 1);   // v5.3 06 §2d
    const repMax = 60 * (pval<Record<string, number>>(spec, 'ses.msp_rep_max_min')[goal.distance] ?? 20);
    const work = share * demand.expected_duration_s;
    const reps = Math.max(1, Math.ceil(work / repMax));
    const rep = Math.floor((work / reps / 60) * 2) / 2 * 60;
    if (rep < 60) return null;
    return intervalSegments({ reps, rep_s: rep, rec_s: st.rec_s ?? 120 }, raceEff);
  }
  if (st.blocks) {   // v5.3 SES-M-029 fartlek, SES-M-030 combination: explicit blocks, E1 jog between blocks
    const out: Segment[] = [{ effort: 'E1', role: 'warmup', duration_s: WU, repeats: 1 }];
    st.blocks.forEach((b, i) => {
      const seg: Segment = { effort: b.effort as Effort, role: 'work', duration_s: b.rep_s, repeats: b.reps };
      if (b.reps > 1 && b.rec_s) seg.recovery = { effort: 'E1', duration_s: b.rec_s };
      out.push(seg);
      if (b.rec_after_s && i < st.blocks!.length - 1) out.push({ effort: 'E1', role: 'main', duration_s: b.rec_after_s, repeats: 1 });
    });
    out.push({ effort: 'E1', role: 'cooldown', duration_s: CD, repeats: 1 });
    return out;
  }
  if (mid === 'SES-M-019') return [{ effort: 'E1', role: 'warmup', duration_s: WU, repeats: 1 }, { effort: 'E4', role: 'work', distance_m: st.distance_m ?? 3000, repeats: 1 }, { effort: 'E1', role: 'cooldown', duration_s: CD, repeats: 1 }];
  if (mid === 'SES-M-013') return [{ effort: 'E1', role: 'warmup', duration_s: WU, repeats: 1 }, { effort: 'E2', role: 'work', duration_s: st.rep_s!, repeats: 1 }, { effort: 'E1', role: 'cooldown', duration_s: CD, repeats: 1 }];
  if (st.rep_s && st.effort) return intervalSegments(st, st.effort as Effort);
  return null;
}

/** Duration of a segment list; distance segments are converted with the planning speed (expected duration only). */
function durationOf(segs: Segment[], speed: number): number {
  return segs.reduce((a, s) => a + (s.distance_m ? Math.ceil(s.distance_m / speed / 60) * 60 : segTime(s)), 0);
}

interface Slot { module: string; node: Node | null; rank: number; segments: Segment[]; step: number | null; isTest: boolean; testFor?: { node: Node; level: number }; strides: boolean; touch: boolean; ruleIds: string[] }

/**
 * place_in_order key-day search (12 §2b.4): maximise the smallest gap between hard days, no consecutive hard days.
 * v5.3 (SES-004, experienced path): an all-E1 long run is not a hard day (o.lrHard = false) but still counts as a point of
 * the gap score, with the previous week's long run (o.extraScore); ties go to the fewest key sessions on a day after a
 * long run (o.afterLR), then to the earlier days. With o.lrHard (the cautious path) the v5.2 search is unchanged.
 */
function chooseKeyDays(days: number[], lrDay: number | null, k: number, prevHard: number | null,
  o: { lrHard: boolean; extraScore: number[]; afterLR: Set<number> } = { lrHard: true, extraScore: [], afterLR: new Set() }): number[] | null {
  const cand = days.filter(d => d !== lrDay);
  let best: number[] | null = null, bestScore = -1, bestAfter = Infinity;
  const combos = (arr: number[], n: number, start = 0, acc: number[] = []): number[][] => (n === 0 ? [acc] : arr.slice(start).flatMap((x, i) => combos(arr, n - 1, start + i + 1, [...acc, x])));
  for (const set of combos(cand, k)) {
    const hard = [...set, ...(lrDay !== null && o.lrHard ? [lrDay] : [])].sort((a, b) => a - b);
    // no two hard days on consecutive dates, also across the week boundary (SES-004)
    if (prevHard !== null && hard.length && hard[0] - (prevHard - 7) <= 1) continue;
    let ok = true;
    for (let i = 1; i < hard.length; i++) if (hard[i] - hard[i - 1] <= 1) ok = false;
    if (!ok) continue;
    // the smallest gap is measured inside the Monday–Sunday week (12 §2b.4 place_in_order)
    const pts = o.lrHard && !o.extraScore.length ? hard : [...set, ...(lrDay !== null ? [lrDay] : []), ...o.extraScore].sort((a, b) => a - b);
    let minGap = Infinity;
    for (let i = 1; i < pts.length; i++) minGap = Math.min(minGap, pts[i] - pts[i - 1]);
    const score = minGap === Infinity ? 99 : minGap;
    const after = set.filter(d => o.afterLR.has(d)).length;
    if (score > bestScore || (score === bestScore && after < bestAfter)) { best = set; bestScore = score; bestAfter = after; }
  }
  return k === 0 ? [] : best;
}

export interface WeekBuild { week: Week; lastHardDay: number | null; hadE3: boolean; keyModules: string[] }

export function buildWeeks(c: BuildCtx): { weeks: Week[]; pre_taper_had_e3: boolean; pre_taper_runs: number; race_fuel: number | null } {
  const { spec, input, st, gate, feas, layout: L } = c;
  const P = (id: string) => pnum(spec, id, gate.overrides);
  const g = input.goal;
  const demand = feas.demand;
  const step = P('load.round_down_s');
  const blocked = new Set(input.profile.blocked_dates ?? []);
  const availDays = c.av.days.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).filter(i => i >= 0).sort((a, b) => a - b);
  const ceiling: Effort = gate.gate === 'proceed_restricted' ? 'E2' : (gate.effortCeiling as Effort);
  const familyTid = g.distance === 'HM' ? 'HM' : demand.family === 'base' ? 'short' : demand.family; // SPEC-QUESTION Q-E16: base plans use the short-family shares
  const hardShare = pnum(spec, `tid.hard_share_max.${familyTid}`);
  const e2Share = P('tid.e2_share_max');
  const speed = st.median_easy_speed ?? st.s_slow;
  // FEA-014 / INV-15: paces from a measured anchor, or (v5.3) from a declared race on the experienced path
  const onExp = onExpPath(st.exp.path);
  const anchorPace = st.anchor && (st.anchor.confidence === 'measured' || (st.anchor.confidence === 'declared' && onExp)) ? st.anchor : null;
  const paceWiden = anchorPace && anchorPace.confidence === 'declared' ? P('exp.declared_pace_widen_pct') / 100 : 0;
  const T = L.phases.filter(p => p === 'TAPER').length;
  const taperStart = L.phases.indexOf('TAPER');

  // history of planned runs for l30_time (LOD-011): claim/log sources plus every planned run, as day offsets from today
  const runs: { day: number; s: number; pre?: boolean }[] = [];
  const preUntil = st.gap_band ? daysBetween(input.today, L.planStart) + 7 : Infinity;   // Q-E24
  for (const r of l30PlanSources(spec, st)) runs.push({ ...r, pre: true });
  // SPEC-QUESTION Q-E21: with L30 undefined (GEN-012) the first return-ladder rung has no denominator; its session time is
  // taken as the reference (dated the day before the plan), so the later rungs are bound by INV-02 against it.
  if (st.L30_source === 'undefined_rtr' && L.ladder.length) runs.push({ day: -1, s: L.ladder[0].total_s });
  const dayOf = (d: ISODate) => daysBetween(input.today, d);
  const l30 = (d: ISODate) => { const x = dayOf(d); return Math.max(0, ...runs.filter(r => x - r.day >= 1 && x - r.day <= 30 && !(r.pre && x >= preUntil)).map(r => r.s)); };

  const weeks: Week[] = [];
  let prevHard: number | null = null;
  let prevLR: { date: ISODate; s: number } | null = null;
  let pre_taper_had_e3 = false, pre_taper_runs = 0;
  // a re-plan that starts inside the taper keeps the parent's pre-taper reference (SES-015, INV-08)
  if (L.phases[0] === 'TAPER' && input.parent_plan) { pre_taper_had_e3 = input.parent_plan.pre_taper_had_e3; pre_taper_runs = input.parent_plan.pre_taper_runs ?? 0; }
  let lastKeyModule: string | null = null;
  let ladderIdx = 0;
  const phaseLen = (i: number) => { let a = i, b = i; while (a > 0 && L.phases[a - 1] === L.phases[i]) a--; while (b + 1 < L.phases.length && L.phases[b + 1] === L.phases[i]) b++; return { a, b, n: b - a + 1, pos: i - a + 1 }; };
  const onboardEnd = L.phases.lastIndexOf('ONBOARD');
  let ftScheduled = false;
  const testsPlaced = new Set<string>();
  const fuelRequired = demand.expected_duration_s > 60 * P('fuel.required_above_min');
  const testsOff = input.profile.level_tests_opt_out === true;
  // ---- v5.3 (02 §2b, 06 §2d): calibration window, rung tables, families and the planned dose path
  const calUntil = st.exp.path === 'calibrating' ? st.exp.calibration_until : null;
  const families = pval<Record<string, string[]>>(spec, 'ses.family.<node>');
  const familyOf = (mid: string): 'THR' | 'VO2' | null => (Object.entries(families).find(([, l]) => l.includes(mid))?.[0] as 'THR' | 'VO2' | undefined) ?? null;
  const rungNode = pval<Record<string, Node>>(spec, 'ses.rung_node');
  const entryRung = pval<Record<string, number[]>>(spec, 'ses.entry_rung.<SES-M-id>');
  const topRung = pval<Record<string, number[]>>(spec, 'ses.top_rung.<SES-M-id>');
  const nStepsOf = (mid: string) => { const x = pval<DoseStep[]>(spec, `ses.dose.${mid}.steps`); return Array.isArray(x) ? x.length : 1; };
  const rungAt = (tbl: Record<string, number[]>, mid: string, dflt: number) => {
    const row = tbl[mid]; if (!row) return dflt;
    const l = Math.min(c.levels[rungNode[mid]] ?? 0, row.length - 1);
    return Math.min(row[l], nStepsOf(mid) - 1);
  };
  const entryOf = (mid: string) => rungAt(entryRung, mid, 0);                       // SES-027 dose_start
  const topOf = (mid: string) => rungAt(topRung, mid, nStepsOf(mid) - 1);          // SES-027 dose_max
  // SES-030: the most recent module of each family, first from the log, then from the plan as it is built
  const lastOfFamily: Record<string, string> = {};
  for (const e of [...st.entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) { const f = e.module_id ? familyOf(e.module_id) : null; if (f) lastOfFamily[f] = e.module_id!; }
  // SES-028: the last planned non-deload step of each module in this plan (a deload instance is not a step)
  const plannedStep: Record<string, number> = {};
  // FEA-014 pace range of an effort; a declared anchor widens the slow edge by exp.declared_pace_widen_pct (03 §3b, v5.3)
  const rangeOf = (eff: Effort) => {
    if (!anchorPace) return null;
    const pr = paceRange(spec, anchorPace, eff);
    if (!pr || !paceWiden) return pr;
    const r = P('pace.round_s');
    return { fast_s_per_km: pr.fast_s_per_km, slow_s_per_km: Math.ceil(pr.slow_s_per_km * (1 + paceWiden) / r - 1e-9) * r };
  };
  // SES-032: rep distance = rep time × the midpoint speed of the effort's range, rounded to a track-friendly distance
  const track = pval<number[]>(spec, 'ses.track_distances_m');
  const midSpeed = (eff: Effort) => { const pr = rangeOf(eff); return pr ? (1000 / pr.fast_s_per_km + 1000 / pr.slow_s_per_km) / 2 : null; };
  const distanceForm = (s: Session) => {
    const tol = P('ses.dist_round_tol_pct') / 100, recStep = P('ses.dist_round_recovery_m');
    const hills = MODULES[s.module_id]?.hills === true;
    const e1 = midSpeed('E1');
    for (const seg of s.segments) {
      if (seg.role !== 'work' || !hardEffort(seg.effort) || !seg.duration_s) continue;
      const v = midSpeed(seg.effort);
      if (!v) continue;
      const raw = seg.duration_s * v * (hills ? P('ses.hill_speed_ratio') : 1);
      const cands = [...track, ...Array.from({ length: 40 }, (_, i) => 1000 * (i + 3))];
      let best = cands[0];
      for (const d of cands) if (Math.abs(d - raw) < Math.abs(best - raw)) best = d;   // ties keep the shorter (earlier) one
      // SPEC-QUESTION Q-E33: outside the tolerance the time form is kept ("about {x} m"), not a lower rung
      if (Math.abs(best - raw) / raw <= tol) seg.show_distance_m = best;
      else seg.show_about_m = Math.round(raw / 100) * 100;
      if (seg.recovery && e1) seg.recovery = { ...seg.recovery, show_distance_m: Math.max(recStep, Math.round(seg.recovery.duration_s * e1 / recStep) * recStep) };
    }
  };

  for (let w = 0; w < L.phases.length; w++) {
    const ph = L.phases[w];
    // SPEC-QUESTION Q-E40. INV-04 (T2) on a re-plan: the k-th week of each kind (loading, deload, taper) never exceeds the parent version's k-th
    // week still ahead, in time and in long run; the generator applies it as a cap (it was a validator-only check)
    let parentLR = Infinity;
    const cw = (() => {
      const c0 = L.curve[w];
      if (!input.parent_plan || input.events.some(e => e.kind === 'goal_change')) return c0;
      const kind = (x: { taper_k: number | null; is_deload: boolean }) => (x.taper_k ? 't' : x.is_deload ? 'd' : 'l');
      const k = L.curve.slice(0, w + 1).filter(x => kind(x) === kind(c0)).length;
      const pw = input.parent_plan.weeks.filter(x => kind(x) === kind(c0) && x.start >= L.planStart)[k - 1];
      if (!pw) return c0;
      if (pw.lr_s > 0) parentLR = pw.lr_s;
      return { ...c0, V: Math.min(c0.V, pw.planned_time_s), LR: c0.LR > 0 && pw.lr_s > 0 ? Math.min(c0.LR, pw.lr_s) : c0.LR };
    })();
    const start = addDays(L.planStart, 7 * w);
    const dateOf = (d: number) => addDays(start, d);
    const D = availDays.filter(d => !blocked.has(dateOf(d)));
    const sessions: Session[] = [];
    const ruleIds = new Set<string>();
    const isRaceWeek = cw.is_race_week;
    const isDeload = cw.is_deload;
    const pl = phaseLen(w);
    const baseIdx = (() => { // BASE (late): second half of the BASE phase, ONBOARD weeks excluded (04 §1)
      if (ph !== 'BASE') return { late: false };
      return { late: pl.pos > Math.floor(pl.n / 2) };
    })();
    const part = { baseLate: baseIdx.late, buildLastThird: ph === 'BUILD' && pl.n - pl.pos < Math.ceil(pl.n / 3), exp: onExp };
    // v5.3 EXP-003: a calibration week of the experienced path
    const isCal = !!calUntil && start <= calUntil && (ph === 'BASE' || ph === 'BUILD' || ph === 'SPECIFIC');
    let longForm: 'a' | 'b' | null = null;
    let loadingIndexInPhase = 0;
    for (let i = pl.a; i < w; i++) if (!L.curve[i].is_deload) loadingIndexInPhase++;
    const mkSession = (o: Partial<Session> & { date: ISODate; module_id: string; kind: Session['kind']; segments: Segment[]; planned_duration_s: number }): Session => {
      const m = MODULES[o.module_id];
      const s: Session = {
        id: '', weekday: weekday(o.date), is_run: true, is_long_run: false, is_peak_long_run: false,
        is_goal_race: false, is_race: false, is_key: false, is_hard: false, is_test: false, test_for: null, is_extension: false, is_floor_bound: false,
        is_b2b_pair: false, pair_id: null, effort_target: m?.effort_profile === 'E5' ? 'E1' : (m?.effort_profile ?? 'E1'), dose_step: null, prescription: 'time',
        planned_distance_m: null, floor_extension: null, expected_duration_s: o.planned_duration_s, pace_range: null,
        hr_zone: null, hr_source: null, run_walk: false, run_walk_ratio: null, ladder: { kind: 'none', rung: null }, fuel_target_g_h: null,
        why_message: { id: m?.why ?? 'MSG-WHY-SES' }, messages: [], rule_ids: [], grade_label: 'common coaching practice', status: 'planned', in_published_window: false,
        ...o,
      };
      return s;
    };

    // ---------------- ladder weeks (SAF-086 start ladder / GEN-012 RTR)
    if (ph === 'START_LADDER' || ph === 'RTR') {
      const perWeek = L.ladderRunsPerWeek;
      const days = spacedDays(D);   // one rest day between (rtr.rest_days_between)
      for (let j = 0; j < Math.min(perWeek, days.length) && ladderIdx < L.ladder.length; j++, ladderIdx++) {
        const ls = L.ladder[ladderIdx];
        let segs = ls.segments.map(s => ({ ...s }));
        let dur = ls.total_s;
        const s = mkSession({ date: dateOf(days[j]), module_id: ph === 'RTR' ? 'SES-M-002' : 'SES-M-002', kind: 'ladder', segments: segs, planned_duration_s: dur, prescription: 'ladder',
          run_walk: true, run_walk_ratio: { run_s: ls.run_s, walk_s: Math.max(0, dur - ls.run_s), label: ls.rung }, ladder: { kind: ph === 'RTR' ? 'rtr' : 'start', rung: ls.rung },
          why_message: { id: 'MSG-SES-RW' }, rule_ids: [ph === 'RTR' ? 'GEN-012' : 'SAF-086', 'SES-009'], effort_target: 'E1' });
        sessions.push(s);
      }
      sessions.forEach((s, i) => { s.id = `w${w + 1 + L.indexOffset}-${i + 1}`; });
      weeks.push(finishWeek(w + L.indexOffset, start, ph, cw, sessions, 0, isRaceWeek, P));
      for (const s of sessions) runs.push({ day: dayOf(s.date), s: s.planned_duration_s });
      continue;
    }

    // ---------------- S7.1 count: SES-007 / SES-006 through the engine, then LOD-034, SES-016, CTX-006 caps
    const runsWeek = Math.min(c.av.maxRuns, D.length);
    const weekRoot: Record<string, Value> = { phase: ph, is_race_week: isRaceWeek, runs: runsWeek, is_deload: isDeload, is_calibration: isCal };
    const ctx = evalContext(spec, { preset: { id: 'method_default' } as unknown as Value, week: weekRoot as unknown as Value,
      state: { levels: { ...c.levels }, last_week_key_count: 0, exp_path: st.exp.path } as unknown as Value, event: openRecord({ type: 'count_keys' }),
      profile: openRecord({ hard_sessions_max: input.profile.hard_sessions_max ?? null }) }, gate.overrides);
    const r7 = runRecords([spec.rules.get('SES-007')], ctx);
    const mdc = composeTarget('week.method_default_count', null, r7.effects).value;
    weekRoot.method_default_count = typeof mdc === 'number' ? mdc : 0;
    const r6 = runRecords([spec.rules.get('SES-006')], evalContext(spec, { ...ctx.roots, week: weekRoot as unknown as Value }, gate.overrides));
    let k = Number(composeTarget('week.quality_max', 9, r6.effects).value ?? 0);
    for (const e of [...r7.effects, ...r6.effects]) c.fired.push({ stage: 'S7.1', rule_id: e.ruleId, binding: `week:${w + 1 + L.indexOffset}`, op: e.op, target: e.target, value: typeof e.value === 'number' ? e.value : undefined });
    if (['ONBOARD', 'RTR', 'TRANSITION'].includes(ph) || gate.gate === 'proceed_restricted') { k = 0; ruleIds.add('LOD-034'); }
    if (isDeload) { k = Math.min(k, P('deload.quality_max')); ruleIds.add('SES-016'); }
    if (typeof gate.overrides['quality.per_week.cap'] === 'number') k = Math.min(k, gate.overrides['quality.per_week.cap'] as number);
    const strides_allowed = !['RTR', 'TRANSITION'].includes(ph) && (c.levels.HAB ?? 0) >= 1 && (EFFORT_RANK[ceiling] ?? 4) >= 3;
    const quality_max = k;

    // ---------------- S7.2 long run (SES-005 day; DST-005; NUT-010)
    const lrDay = cw.LR > 0 ? (D.includes(L.lrWeekday) ? L.lrWeekday : (D.at(-1) ?? null)) : null;
    // ---------------- S7.3 choose key modules (CMP-007 procedure)
    const slots: Slot[] = [];
    const used = new Set<string>();
    const usedNodes = new Set<Node>();
    const listFor = (p: string) => { const x = spec.reg.base('quality.key_modules.method_default.' + p); return Array.isArray(x) ? (x as string[]) : []; };
    const phaseRow = ph === 'SHARPEN' ? 'SPECIFIC' : ph;
    const nodesRow = (pval<Record<string, Record<string, { node: Node; max_level: number }[]>>>(spec, 'dst.phase_nodes')[demand.family] ?? {})[phaseRow] ?? [];
    const weightOf = (n: Node) => { const x = spec.reg.base(`cmp.weight.${g.distance}.${n}`); return typeof x === 'number' ? x : 0; };
    const maxLevel = (n: Node) => pval<Record<string, number>>(spec, 'cmp.max_level.' + n) as unknown as number;
    const gapOf = (n: Node) => Math.max(0, (demand.required_levels[n] ?? 0) - (c.levels[n] ?? 0)) / (typeof maxLevel(n) === 'number' ? maxLevel(n) : 5);
    const tieOrder = pval<string[]>(spec, 'cmp.node_tie_order');
    if (ph === 'TAPER' && !isRaceWeek) {
      if (pre_taper_had_e3 && k > 0 && (EFFORT_RANK[ceiling] ?? 4) >= 3) {
        const touch = lastKeyModule && familyOf(lastKeyModule) === 'VO2' ? 1 : 0;      // SES-015 taper_touch_form
        const steps = pval<DoseStep[]>(spec, 'ses.dose.SES-M-024.steps');
        // v5.3 SES-007: the experienced path keeps exp.taper_keys sharpeners (both forms)
        const forms = onExp && k >= 2 ? [touch, 1 - touch] : [touch];
        forms.forEach((f, i) => {
          const st0 = steps[f];
          slots.push({ module: 'SES-M-024', node: null, rank: i + 1, segments: intervalSegments(st0, st0.effort as Effort), step: f, isTest: false, strides: false, touch: true, ruleIds: ['SES-015', 'LOD-051'] });
        });
      }
    } else if (!isRaceWeek && k > 0 && onExp && isCal && !isDeload) {
      // EXP-003: a calibration week holds one threshold and one VO2 session at their entry rungs
      // (EXP-003 sets the two modules whatever the phase lists say; prerequisites, presets and the effort ceiling still apply)
      for (const mid of ['SES-M-008', 'SES-M-010'].slice(0, k)) {
        if (!eligible(c, MODULES[mid], 'BUILD', part, ceiling)) continue;
        used.add(mid);
        slots.push({ module: mid, node: rungNode[mid] ?? null, rank: slots.length + 1, segments: [], step: null, isTest: false, strides: false, touch: false, ruleIds: ['EXP-003', 'SES-001'] });
      }
      if (!slots.length && strides_allowed) slots.push({ module: 'SES-M-006', node: null, rank: 1, segments: [], step: null, isTest: false, strides: true, touch: false, ruleIds: ['CMP-007'] });
    } else if (!isRaceWeek && k > 0) {
      const pool = new Set<string>([...listFor(phaseRow), ...(phaseRow === 'SPECIFIC' ? listFor('BUILD') : []), 'SES-M-006', 'SES-M-007']);
      // SES-026 (v5.3): a 3-key week of the experienced path is form a (three workouts, easy long run) or form b (two
      // workouts and a long run with a steady finish, SES-M-031, which counts as the third key session)
      let workouts = k;
      if (onExp && !isDeload && (ph === 'BUILD' || ph === 'SPECIFIC') && k >= P('exp.keys_max')) {
        const row = ph === 'BUILD' ? 'BUILD' : g.goal_type === 'time' ? 'SPECIFIC_time' : 'SPECIFIC_finish';
        const pat = pval<Record<string, string[]>>(spec, 'exp.long_quality_pattern')[row] ?? ['a'];
        longForm = pat[loadingIndexInPhase % pat.length] === 'b' ? 'b' : 'a';
        if (longForm === 'b' && !(cw.LR > 0 && eligible(c, MODULES['SES-M-031'], ph, part, ceiling))) longForm = 'a';
        if (longForm === 'b') workouts = k - 1;
        c.fired.push({ stage: 'S7.3', rule_id: 'SES-026', binding: `week:${w + 1 + L.indexOffset}`, op: 'set', target: 'week.long_run_form', value: longForm });
      }
      // SES-030 (v5.3): rotation inside a THR or VO2 family, after the family's most recent module
      const rotateIn = (fam: 'THR' | 'VO2', fallback: string | null, gapNode: Node | null): string | null => {
        const lst = families[fam] ?? [];
        const last = lastOfFamily[fam];
        const from = last && lst.includes(last) ? (lst.indexOf(last) + 1) % lst.length : 0;
        for (let i = 0; i < lst.length; i++) {
          const mid = lst[(from + i) % lst.length]; const m = MODULES[mid];
          if (!m || used.has(mid) || !eligible(c, m, ph, part, ceiling)) continue;
          if (gapNode && !m.trains.some(x => x.node === gapNode && x.level === (c.levels[gapNode] ?? 0) + 1)) continue;
          return mid;
        }
        return fallback;
      };
      const rotates = ph === 'BUILD' || ph === 'SPECIFIC' || (onExp && ph === 'BASE');
      for (let j = 1; j <= workouts; j++) {
        // candidate nodes (DST-002) with a pool module training (node, level + 1)
        const cands = nodesRow.filter(x => !usedNodes.has(x.node) && (c.levels[x.node] ?? 0) + 1 <= x.max_level && gapOf(x.node) > 0)
          .map(x => {
            const mods = [...pool].filter(mid => MODULES[mid] && MODULES[mid].trains.some(t => t.node === x.node && t.level === (c.levels[x.node] ?? 0) + 1) && eligible(c, MODULES[mid], ph, part, ceiling) && !used.has(mid) && mid !== 'SES-M-005').sort();
            return { node: x.node, score: weightOf(x.node) * gapOf(x.node), mod: mods[0] };
          }).filter(x => x.mod);
        cands.sort((a, b) => b.score - a.score || tieOrder.indexOf(a.node) - tieOrder.indexOf(b.node));
        let chosen: { module: string; node: Node | null; strides: boolean } | null = null;
        const top = cands[0];
        if (top && top.node !== 'AER' && top.node !== 'DUR') chosen = { module: top.mod!, node: top.node, strides: top.mod === 'SES-M-006' || top.mod === 'SES-M-007' };
        else if (onExp && (ph === 'BUILD' || ph === 'SPECIFIC' || ph === 'BASE')) {
          // v5.3 fallback on the experienced path (07 §2b S7.3): the threshold family, then the VO2 family; a third slot takes
          // the family with the larger cmp.weight for the goal distance
          const have = new Set(slots.map(s => familyOf(s.module)).filter(Boolean));
          const order: ('THR' | 'VO2')[] = ph === 'BASE' ? ['THR'] : (['THR', 'VO2'] as const).filter(f => !have.has(f)).concat(weightOf('VO2') > weightOf('THR') ? ['VO2', 'THR'] : ['THR', 'VO2']);
          for (const fam of order) { const mid = rotateIn(fam, null, null); if (mid) { chosen = { module: mid, node: null, strides: false }; break; } }
          if (!chosen && strides_allowed && !slots.some(s => s.strides)) chosen = { module: 'SES-M-006', node: null, strides: true };
        } else {
          // fallback chain (CMP-007 step 4)
          if (ph === 'BUILD' || ph === 'SPECIFIC' || ph === 'SHARPEN') {
            const lst = listFor(phaseRow);
            const rot = lst.length ? [...lst.slice((loadingIndexInPhase + j - 1) % lst.length), ...lst.slice(0, (loadingIndexInPhase + j - 1) % lst.length)] : [];
            for (const mid of [...rot, ...listFor('BUILD')]) {
              if (!MODULES[mid] || used.has(mid) || !eligible(c, MODULES[mid], ph, part, ceiling)) continue;
              chosen = { module: mid, node: null, strides: false }; break;
            }
          }
          if (!chosen && strides_allowed && ![...slots].some(s => s.strides)) chosen = { module: 'SES-M-006', node: null, strides: true };
        }
        if (!chosen) continue;
        if (chosen.module === 'SES-M-007' && input.profile.hill_access !== true) { chosen.module = 'SES-M-006'; ruleIds.add('SES-022'); }
        const fam = !chosen.strides ? (chosen.node === 'THR' || chosen.node === 'VO2' ? chosen.node : familyOf(chosen.module)) : null;
        const ids = ['CMP-007', 'DST-002', 'SES-001'];
        if (fam && rotates) {
          const r = rotateIn(fam, chosen.module, chosen.node === fam ? chosen.node : null);
          if (r && r !== chosen.module) { chosen.module = r; }
          ids.push('SES-030');
        }
        used.add(chosen.module); if (chosen.node) usedNodes.add(chosen.node);
        slots.push({ module: chosen.module, node: chosen.node, rank: j, segments: [], step: null, isTest: false, strides: chosen.strides, touch: false, ruleIds: ids });
      }
      // DST-018 race-effort override (time goals, SPECIFIC loading weeks with is_msp_week)
      const mspPre = (c.levels.THR ?? 0) >= 1 && (c.levels.DUR ?? 0) >= 1;
      if (g.goal_type === 'time' && ph === 'SPECIFIC' && !isDeload && loadingIndexInPhase % P('dst.msp_every_weeks') === 0 && mspPre && slots.length && !slots.some(s => s.module === 'SES-M-011')) {
        const last = slots[slots.length - 1];
        if (eligible(c, MODULES['SES-M-011'], ph, part, ceiling)) { last.module = 'SES-M-011'; last.strides = false; last.ruleIds.push('DST-018'); }
      }
    }
    // SES-014: anchor field test at the end of ONBOARD when no measured anchor is young enough
    const needAnchorTest = !ftScheduled && w === onboardEnd && !(st.anchor && st.anchor.confidence === 'measured' && daysBetween(st.anchor.date, input.today) <= P('anchor.max_age_days') - P('ses.retest_lead_days'));
    if (needAnchorTest) {
      const mid = (c.levels.VO2 ?? 0) >= 1 && (c.levels.THR ?? 0) >= 1 ? 'SES-M-020' : (MODULES['SES-M-019'].prereqs.every(q => (c.levels[q.node] ?? 0) >= q.level) ? 'SES-M-019' : 'SES-M-018');
      if (mid !== 'SES-M-020' && ceiling !== 'E2') {
        slots.unshift({ module: mid, node: null, rank: 0, segments: [], step: 0, isTest: true, strides: false, touch: false, ruleIds: ['SES-014'] });
        ftScheduled = true;
      }
    }

    // SES-012: a due level test replaces its module's instance in the first week that is not a deload, TAPER, RACE or
    // TRANSITION week and holds no field test (one test a week); the long-run DUR test is the week's long run (OQ-15 reading)
    const testWeekOk = !isDeload && !isRaceWeek && ph !== 'TAPER' && ph !== 'TRANSITION';
    if (testWeekOk && !slots.some(x => x.isTest)) {
      for (const sl of slots) {
        const due = st.tests_due.find(t => t.node !== 'DUR' && t.module === sl.module && !testsPlaced.has(t.node + t.level));
        if (!due || sl.strides || sl.touch) continue;
        const def = pval<Record<string, Record<string, { segments: { effort: Effort; duration_s: number; repeats: number; recovery_s?: number }[] }>>>(spec, 'ses.exit_test.<node>.<level>')[due.node]?.[String(due.level)];
        const seg = def?.segments?.[0];
        if (!seg) continue;
        sl.isTest = true; sl.testFor = { node: due.node, level: due.level };
        sl.segments = intervalSegments({ reps: seg.repeats, rep_s: seg.duration_s, rec_s: seg.recovery_s ?? 0 } as DoseStep, seg.effort);
        sl.ruleIds.push('SES-012');
        testsPlaced.add(due.node + due.level);
        break;
      }
    }

    // ---------------- S7.5 dose (projection: start dose for every module, 07 §2b) and TID budget (LOD-033 / SES-006)
    // LOD-003/007 on realised volumes: when earlier weeks came out below their curve value (easy runs under lod.min_run_s
    // become rest), this week's growth is measured from what those weeks actually hold (INV-16 baseline)
    let V = cw.V;
    if (!isDeload && !cw.taper_k && ph !== 'SHARPEN') {
      const G = L.growth;
      const nd = [...G.history.filter(h => !h.deload).map(h => ({ planned_time_s: h.V })), ...weeks.filter(x => !x.is_deload && !x.taper_k)];
      const base = nd.at(-1)?.planned_time_s ?? G.V_hold, two = nd.at(-2)?.planned_time_s ?? G.V_hold;
      const [wk, w2] = cw.profile === 'slow' ? G.prog.slow : G.prog.standard;
      let cap = Math.min((1 + wk) * base, (1 + w2) * two);
      if (w < G.confirmedFrom) { const rec = [...G.preWeeks, ...weeks.map(x => x.planned_time_s as number)].slice(-G.prog.window); cap = Math.min(cap, (1 + G.prog.est) * Math.max(rec.length ? Math.max(...rec) : G.V_hold, G.estFloor)); }   // v5.3 LOD-007 estFloor
      if (base > 0 && roundDown(cap, G.step) < V) { V = Math.max(roundDown(cap, G.step), Math.min(cw.V, G.V_hold)); ruleIds.add('LOD-003'); }
    }
    let hardLeft = Math.floor(hardShare * V), e2Left = Math.floor(e2Share * V);
    let timeLeft = V - cw.LR;                                  // SES-006 budget term: key sessions must fit the week's volume
    const keySlots: Slot[] = [];
    for (const s of slots) {
      if (s.strides || s.touch) { keySlots.push(s); continue; }
      // SES-011: one step above the last logged instance (never compounded, 07 §2b); SES-016 start size in a deload;
      // a step that does not fit the week's budgets falls back step by step to the start dose (dose_fit)
      // SES-011 / SES-027 / SES-028 (v5.3): a first instance starts from the log (SES-011) or at the entry rung for the runner's
      // level; later instances follow the planned path, one step per planned non-deload instance, within the level's top rung
      // and ses.projection_max_steps above the last logged step; a deload instance takes the entry rung (SES-016) and is not a
      // step of the path; calibration weeks hold the entry rung (EXP-003)
      const entry = entryOf(s.module), topR = topOf(s.module);
      let step0: number;
      if (s.isTest) step0 = 0;
      else if (isDeload || (onExp && isCal)) step0 = entry;
      else {
        const prev = plannedStep[s.module];
        const fromLog = st.module_next_step[s.module];
        const want = prev != null ? prev + 1 : (fromLog ?? entry);
        const confirmed = st.module_dose[s.module] ?? entry;
        step0 = Math.max(0, Math.min(want, topR, confirmed + P('ses.projection_max_steps')));
        if (prev != null && step0 > (st.module_next_step[s.module] ?? entry)) s.ruleIds.push('SES-028');
      }
      if (!s.isTest) s.ruleIds.push('SES-027');
      const capS = roundDown(1.1 * l30(dateOf(D[0] ?? 0)), step);
      const sized = (k: number) => {
        const sg = s.module === 'SES-M-018' ? [{ effort: 'E1' as Effort, role: 'main' as const, duration_s: 60 * P('ses.ft0_min'), repeats: 1 }] : keySegments(spec, s.module, k, demand, g);
        if (!sg) return null;
        return { sg, et: effortTimes(sg), dur: durationOf(sg, speed) };
      };
      const fits = (z: { et: { hard: number; e2: number }; dur: number }) => !(z.et.hard > hardLeft || z.et.e2 > e2Left || (capS > 0 && z.dur > capS) || z.dur > timeLeft);
      let z = s.testFor ? { sg: s.segments, et: effortTimes(s.segments), dur: durationOf(s.segments, speed) } : sized(step0);
      while (z && step0 > 0 && !fits(z)) { step0--; z = sized(step0); }
      if (!z) { c.fired.push({ stage: 'S7.5', rule_id: 'SES-006', binding: `week:${w + 1 + L.indexOffset}`, op: 'drop_slot', target: s.module }); continue; }
      const segs = z.sg, et = z.et, dur = z.dur;
      if (!fits(z)) {
        c.fired.push({ stage: 'S7.5', rule_id: et.hard > hardLeft || et.e2 > e2Left ? 'LOD-033' : 'LOD-010', binding: `week:${w + 1 + L.indexOffset}`, op: 'drop_slot', target: s.module });
        continue;
      }
      hardLeft -= et.hard; e2Left -= et.e2; timeLeft -= dur;
      s.segments = segs; s.step = s.isTest ? null : step0;
      if (!s.isTest && !isDeload) plannedStep[s.module] = step0;
      s.ruleIds.push('SES-011');
      keySlots.push(s);
    }

    // ---------------- S7.4 place (long run, then hard key sessions on spaced days)
    const hardSlots = keySlots.filter(s => !s.strides && !s.touch);
    let keyDays: number[] | null = null;
    let kk = hardSlots.length;
    // v5.3 SES-004: on the experienced path an all-E1 long run is not a hard day (form b's steady finish is)
    const lrHard = !onExp || longForm === 'b';
    const prevLROff = prevLR ? daysBetween(start, prevLR.date) : null;
    const placeOpts = !onExp ? undefined : { lrHard, extraScore: prevLROff !== null && prevLROff < 0 ? [prevLROff] : [],
      afterLR: new Set([...(lrDay !== null ? [lrDay + 1] : []), ...(prevLROff !== null ? [prevLROff + 1] : [])].filter(d => d >= 0 && d <= 6)) };
    while (kk >= 0) {
      keyDays = chooseKeyDays(D.filter(d => !(isRaceWeek && d === weekdayIndex(g.race_date ?? start))), lrDay, kk, prevHard, placeOpts);
      if (keyDays) break;
      kk--;
    }
    const placedHard = hardSlots.slice(0, kk);
    for (const s of hardSlots.slice(kk)) c.fired.push({ stage: 'S7.4', rule_id: 'SES-006', binding: `week:${w + 1 + L.indexOffset}`, op: 'drop_slot', target: s.module });
    keyDays = (keyDays ?? []).sort((a, b) => a - b);
    // rank order onto days: highest-ranked slot on the earliest chosen day
    placedHard.forEach((s, i) => {
      const day = keyDays![i];
      const dur = durationOf(s.segments, speed);
      const m = MODULES[s.module];
      const sess = mkSession({ date: dateOf(day), module_id: s.module, kind: s.isTest ? 'test' : 'key', segments: s.segments, planned_duration_s: dur,
        is_key: true, is_test: s.isTest, test_for: s.testFor ?? null, is_hard: s.segments.some(x => hardEffort(x.effort)), dose_step: s.step, rule_ids: s.ruleIds,
        effort_target: (s.segments.find(x => x.role === 'work')?.effort ?? m.effort_profile) as Effort,
        prescription: s.segments.some(x => x.distance_m) ? 'distance' : 'time', planned_distance_m: s.segments.find(x => x.distance_m)?.distance_m ?? null,
        why_message: { id: s.isTest ? 'MSG-SES-TEST' : m.why } });
      sessions.push(sess);
      if (!s.isTest) { lastKeyModule = s.module; const f = familyOf(s.module); if (f) lastOfFamily[f] = s.module; }
    });

    // goal race (race week, on race_date)
    let raceSession: Session | null = null;
    if (isRaceWeek && g.race_date) {
      let raceEff: Effort = g.goal_type === 'time' ? (pval<Record<string, Effort>>(spec, 'ses.race_effort')[g.distance] ?? 'E3') : 'E2';
      // SPEC-QUESTION Q-E26: under an effort ceiling (GEN-002, SAF-060) the goal race is planned at that ceiling
      if ((EFFORT_RANK[raceEff] ?? 0) > (EFFORT_RANK[ceiling] ?? 4)) raceEff = ceiling;
      const dur = Math.ceil((g.goal_type === 'time' && g.target_time_s ? g.target_time_s : demand.expected_duration_s) / 60) * 60;
      raceSession = mkSession({ date: g.race_date, module_id: 'SES-M-026', kind: 'race', segments: [{ effort: raceEff, role: 'race', distance_m: Math.round(demand.race_m), repeats: 1 }],
        planned_duration_s: dur, is_goal_race: true, is_race: true, is_hard: true, effort_target: raceEff, prescription: 'distance', planned_distance_m: Math.round(demand.race_m),
        why_message: { id: 'MSG-SES-RACE' }, rule_ids: ['INV-25'] });
    }

    // long run session
    let lrSession: Session | null = null;
    // v5.3 SES-026 form b: the long run ends with an E2 segment (SES-M-031), on its own dose path (rung node DUR).
    // SPEC-QUESTION Q-E39: SES-026 asks for SES-M-005 where DST-006/007 apply; DST-006 is not built, so SES-M-031 is used for every family.
    let e2s = 0;
    const lrSegs = (dur: number): Segment[] => e2s > 0 ? [{ effort: 'E1', role: 'main', duration_s: dur - e2s, repeats: 1 }, { effort: 'E2', role: 'work', duration_s: e2s, repeats: 1 }] : [{ effort: 'E1', role: 'main', duration_s: dur, repeats: 1 }];
    if (lrDay !== null && cw.LR > 0) {
      const fuelAllowed = fuelRequired && !isRaceWeek && MODULES['SES-M-004'].prereqs.every(q => (c.levels[q.node] ?? 0) >= q.level) && (ph === 'BUILD' || ph === 'SPECIFIC' || ph === 'TAPER' || (ph === 'BASE' && part.baseLate)) && cw.LR >= 60 * P('fuel.practice_min_duration_min');
      // NUT-010/011: the current step, up to the upper edge of the required FUEL level's band
      const band = pval<Record<string, [number, number | null]>>(spec, 'fuel.level_band')[String(demand.required_levels.FUEL ?? 1)];
      const fuel = fuelAllowed && !input.profile.nutrition_referral_flag ? Math.min(st.fuel_step_g_h, band?.[1] ?? P('fuel.max_default_g_h')) : null;
      const ldate = dateOf(lrDay);
      const distStop = st.L30_eff_dist_m ? roundDown(Math.min(1.1 * Math.max(st.L30_eff_dist_m, 0), demand.dist_stop_m ?? Infinity), P('load.round_down_m')) : null;
      if (longForm === 'b' && !fuelAllowed) {
        const steps = pval<DoseStep[]>(spec, 'ses.dose.SES-M-031.steps');
        const prev = plannedStep['SES-M-031'];
        let k31 = Math.min(prev != null ? prev + 1 : entryOf('SES-M-031'), topOf('SES-M-031'));
        const maxSeg = P('dst.msp_segment_max_ratio') * cw.LR;
        while (k31 > 0 && ((steps[k31].e2_s ?? 0) > e2Left || (steps[k31].e2_s ?? 0) > maxSeg)) k31--;
        const e2 = steps[k31]?.e2_s ?? 0;
        if (e2 > 0 && e2 <= e2Left && e2 <= maxSeg) { e2s = e2; e2Left -= e2; plannedStep['SES-M-031'] = k31; }
      }
      lrSession = mkSession({ date: ldate, module_id: e2s > 0 ? 'SES-M-031' : fuelAllowed ? 'SES-M-004' : 'SES-M-003', kind: 'long', segments: lrSegs(cw.LR),
        planned_duration_s: cw.LR, is_long_run: true, is_hard: lrHard, is_key: e2s > 0, dose_step: e2s > 0 ? plannedStep['SES-M-031'] : null, is_peak_long_run: !isDeload && !cw.taper_k, fuel_target_g_h: fuel, effort_target: 'E1',
        planned_distance_m: null, why_message: { id: e2s > 0 ? 'MSG-SES-LONG-STEADY' : 'MSG-SES-LONG' }, rule_ids: ['SES-005', 'LOD-010', 'LOD-020', ...(demand.family === 'short' ? ['DST-005'] : []), ...(fuel ? ['NUT-010'] : []), ...(longForm ? ['SES-026'] : []), ...(onExp && !lrHard ? ['SES-004'] : [])] });
      if (e2s > 0) lrSession.messages.push({ id: 'MSG-SES-LONG-STEADY', rule_id: 'SES-026', placeholders: { min: { type: 'min', value: Math.round(e2s / 60) } } });
      void distStop;
      const durDue = st.tests_due.find(t => t.node === 'DUR' && !testsPlaced.has(t.node + t.level));
      if (durDue && testWeekOk && cw.LR >= (durDue.lr_min_s ?? Infinity)) {
        lrSession.is_test = true; lrSession.test_for = { node: 'DUR', level: durDue.level }; lrSession.rule_ids.push('SES-012');
        testsPlaced.add('DUR' + durDue.level);
      }
    }

    // ---------------- S7.6 easy fill (water_fill, LOD-031 / LOD-013 / LOD-016)
    const taken = new Set<number>([...(lrDay !== null && lrSession ? [lrDay] : []), ...keyDays.slice(0, placedHard.length)]);
    if (raceSession) taken.add(weekdayIndex(raceSession.date));
    const nEasy = Math.max(0, runsWeek - taken.size);
    let easyDays = D.filter(d => !taken.has(d)).slice(0, nEasy);
    let LR = lrSession ? lrSession.planned_duration_s : 0;
    const keyTime = sessions.reduce((a, s) => a + s.planned_duration_s, 0);
    const target = V;
    const minRun = P('lod.min_run_s');
    const capFor = (d: number, lrNow: number) => {
      const date = dateOf(d);
      let cap = roundDown(1.1 * l30(date), step) || Infinity;
      if (lrNow > 0) cap = Math.min(cap, lrNow);
      if (lrDay !== null && lrNow > 0 && Math.abs(d - lrDay) === 1) {
        cap = Math.min(cap, roundDown(Math.min(P('two_day.adjacent_ratio') * lrNow, P('two_day.cap_ratio') * l30(dateOf(lrDay)) - lrNow), step));
      }
      if (prevLR && daysBetween(prevLR.date, date) === 1) {   // LOD-013 across the week boundary
        cap = Math.min(cap, roundDown(Math.min(P('two_day.adjacent_ratio') * prevLR.s, P('two_day.cap_ratio') * l30(prevLR.date) - prevLR.s), step));
      }
      return Math.max(0, cap);
    };
    let fill: { d: number; s: number }[] = [];
    const doFill = (lrNow: number) => {
      let days = [...easyDays];
      for (let guard = 0; guard < 8; guard++) {
        const rem = target - lrNow - keyTime;
        const caps = days.map(d => capFor(d, lrNow));
        let lo = 0, hi = Math.max(0, rem);
        for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; if (caps.reduce((a, cp) => a + Math.min(cp, mid), 0) <= rem) lo = mid; else hi = mid; }
        const vals = caps.map(cp => roundDown(Math.min(cp, lo), step));
        let left = rem - vals.reduce((a, b) => a + b, 0);
        for (let moved = true; moved && left >= step;) { moved = false; for (let i = 0; i < vals.length && left >= step; i++) if (vals[i] + step <= caps[i]) { vals[i] += step; left -= step; moved = true; } }   // one step per day, earliest first
        const drop = vals.findIndex(v => v < minRun);
        if (drop >= 0) { days = days.filter((_, i) => i !== drop); continue; }
        return { out: days.map((d, i) => ({ d, s: vals[i] })), left, allAtCap: vals.every((v, i) => v + step > caps[i]) };
      }
      return { out: [], left: target - lrNow - keyTime, allAtCap: true };
    };
    // SPEC-QUESTION Q-E23: time the easy days cannot hold goes, in equal steps, to the easy (E1) cool-down of the week's key
    // and test sessions, under the same per-run caps (≤ LR, ≤ spike.warn_ratio × l30_time), before it is dropped (LOD-031):
    // the key work then sits inside an easy run, as 13 §3/§6 count the week. Then LOD-020 is re-checked on the realised week.
    const carrierSeg = (x: Session) => x.segments.find(g => g.role === 'cooldown') ?? x.segments.find(g => g.role === 'main' && g.effort === 'E1');
    const carriers = sessions.filter(x => !!carrierSeg(x));
    const carryFor = (left0: number, lrNow: number) => {
      const room = carriers.map(x => roundDown(Math.max(0, Math.min(lrNow > 0 ? lrNow : Infinity, roundDown(1.1 * l30(x.date), step) || Infinity) - x.planned_duration_s), step));
      const add = carriers.map(() => 0);
      let left = roundDown(left0, step);
      for (let moved = true; moved && left >= step;) { moved = false; for (let i = 0; i < add.length && left >= step; i++) if (add[i] + step <= room[i]) { add[i] += step; left -= step; moved = true; } }
      return { add, left };
    };
    let res = doFill(LR);
    if (lrSession && res.left >= step && res.allAtCap && target < Math.max(demand.V_req_time_s, st.V_hold_s) + 1 && !isDeload && !cw.taper_k) {
      const raised = Math.min(roundDown(1.1 * l30(lrSession.date), step), roundDown(L.lrCap(V), step), LR + res.left, parentLR);   // LOD-016 (≤ the parent's week, INV-04)
      if (raised > LR) { LR = raised; lrSession.planned_duration_s = LR; lrSession.expected_duration_s = LR; lrSession.segments = lrSegs(LR); lrSession.rule_ids.push('LOD-016'); res = doFill(LR); }
    }
    let carry = carryFor(res.left, LR);
    for (let it = 0; it < 4 && lrSession && !cw.taper_k; it++) {
      const Vfinal = LR + keyTime + res.out.reduce((a, f) => a + f.s, 0) + carry.add.reduce((a, b) => a + b, 0);
      const allowed = Math.max(roundDown(L.lrCap(Vfinal), step), st.L_hold_s);
      if (LR <= allowed) break;
      LR = allowed; lrSession.planned_duration_s = LR; lrSession.expected_duration_s = LR; lrSession.segments = lrSegs(LR); lrSession.rule_ids.push('LOD-020');
      res = doFill(LR); carry = carryFor(res.left, LR);
    }
    fill = res.out;
    carriers.forEach((x, i) => {
      if (!carry.add[i]) return;
      const cd = carrierSeg(x)!;
      cd.duration_s = (cd.duration_s ?? 0) + carry.add[i]; x.planned_duration_s += carry.add[i]; x.rule_ids.push('LOD-031');
    });
    // a key session sized in half minutes (SES-M-011 reps) leaves the week a sub-minute remainder that whole-minute easy runs
    // cannot hold; it goes to that session's cool-down, so the week keeps its planned volume (INV-11, INV-27)
    const frac = res.left - roundDown(res.left, step);
    const odd = carriers.find(x => x.planned_duration_s % step !== 0) ?? carriers[0];
    if (frac > 0 && odd) { const cd = carrierSeg(odd)!; cd.duration_s = (cd.duration_s ?? 0) + frac; odd.planned_duration_s += frac; }
    const left = carry.left;
    if (left >= step) ruleIds.add('LOD-031');
    const easySessions = fill.map(f => mkSession({ date: dateOf(f.d), module_id: 'SES-M-001', kind: 'easy', segments: [{ effort: 'E1', role: 'main', duration_s: f.s, repeats: 1 }],
      planned_duration_s: f.s, effort_target: 'E1', why_message: { id: 'MSG-SES-EASY' }, rule_ids: ['LOD-031', ...(lrDay !== null && Math.abs(f.d - lrDay) === 1 ? ['LOD-013'] : [])] }));
    easyDays = fill.map(f => f.d);

    // SPEC-QUESTION Q-E17: SES-020 asks for strength sessions (SES-M-014), but INV-11 sums every session of a week as running
    // time; the engine does not emit strength sessions until the spec says whether they count in week.planned_time_s.
    // ---------------- S7.7 extras: strides slot / taper touch on easy runs (SES-021, SES-015), strides on ≤ ses.strides_per_week easy runs
    const keyDaySet = new Set(keyDays.slice(0, placedHard.length));
    const hardDates = new Set<string>([...sessions.filter(x => x.is_hard).map(x => x.date), ...(lrSession ? [lrSession.date] : []), ...(prevHard !== null ? [addDays(start, prevHard - 7)] : [])]);
    const notBeforeKey = (s: Session) => !keyDaySet.has(weekdayIndex(s.date) + 1);
    const touchOk = (s: Session) => !hardDates.has(addDays(s.date, -1)) && !hardDates.has(addDays(s.date, 1));   // INV-17
    const stridesStep = pval<DoseStep[]>(spec, 'ses.dose.SES-M-006.steps')[0];
    const attach = (s: Session, work: Segment, mid: string, why: string, rule: string) => {
      const workT = segTime(work);
      if (s.planned_duration_s - workT < 600) return false;
      s.segments = [{ effort: 'E1', role: 'main', duration_s: s.planned_duration_s - workT, repeats: 1 }, work];
      s.module_id = mid; s.kind = mid === 'SES-M-024' ? 'taper_touch' : 'easy';
      if (mid === 'SES-M-024') { s.is_key = true; s.is_hard = true; s.effort_target = work.effort; }
      s.why_message = { id: why }; s.rule_ids.push(rule);
      return true;
    };
    let order = easySessions.filter(notBeforeKey);
    // SES-015 (v5.3: up to exp.taper_keys sharpeners on the experienced path, each on its own easy day)
    for (const touchSlot of keySlots.filter(s => s.touch)) {
    const touchDay = order.find(touchOk);
    if (!touchDay) continue;
    {
      const work = touchSlot.segments.find(x => x.role === 'work')!;
      // SES-015 touch on a short easy run: move whole minutes from the other easy runs (each kept ≥ lod.min_run_s) so the
      // run holds the touch plus 10 min easy; the week total is unchanged (LOD-011 time-based)
      let need = segTime(work) + 600 - touchDay.planned_duration_s;
      const donors = order.filter(x => x !== touchDay).sort((a, b) => b.planned_duration_s - a.planned_duration_s || (a.date < b.date ? -1 : 1));
      const spare = donors.reduce((a, x) => a + Math.max(0, roundDown(x.planned_duration_s - P('lod.min_run_s'), 60)), 0);
      if (need > 0 && spare >= need) {
        for (const d of donors) {
          if (need <= 0) break;
          const take = Math.min(Math.ceil(need / 60) * 60, Math.max(0, roundDown(d.planned_duration_s - P('lod.min_run_s'), 60)));
          if (!take) continue;
          d.planned_duration_s -= take; d.segments = [{ effort: 'E1', role: 'main', duration_s: d.planned_duration_s, repeats: 1 }];
          touchDay.planned_duration_s += take; touchDay.segments = [{ effort: 'E1', role: 'main', duration_s: touchDay.planned_duration_s, repeats: 1 }];
          need -= take;
        }
      }
      if (attach(touchDay, { ...work }, 'SES-M-024', work.effort === 'E4' ? 'MSG-SES-VO2' : 'MSG-SES-THR', 'SES-015')) { order = order.filter(x => x !== touchDay); hardDates.add(touchDay.date); }
    }
    }
    const stridesWanted = strides_allowed ? Math.min(P('ses.strides_per_week'), order.length) : 0;
    const stridesWork: Segment = { effort: 'E5', role: 'strides', duration_s: stridesStep.rep_s!, repeats: stridesStep.reps!, recovery: { effort: 'E0', duration_s: stridesStep.rec_s! } };
    let stridesSlotUsed = false;
    for (let i = 0; i < stridesWanted; i++) {
      const s = order[i];
      const fromSlot = !stridesSlotUsed && keySlots.some(x => x.strides);
      if (attach(s, { ...stridesWork }, 'SES-M-006', fromSlot ? 'MSG-SES-STRIDES-SLOT' : 'MSG-SES-EASY', 'SES-021')) {
        s.kind = 'easy'; s.module_id = 'SES-M-001'; s.messages.push({ id: 'MSG-SES-STRIDES-SLOT', rule_id: 'SES-021' });
        if (fromSlot) { s.is_key = true; stridesSlotUsed = true; s.rule_ids.push('CMP-007'); }
      }
    }

    // ---------------- assemble, S7.8 render (effort first; paces only through FEA-014 / INV-15; run-walk SES-009)
    const all = [...sessions, ...easySessions, ...(lrSession ? [lrSession] : []), ...(raceSession ? [raceSession] : [])].sort((a, b) => a.date.localeCompare(b.date));
    all.forEach((s, i) => { s.id = `w${w + 1 + L.indexOffset}-${i + 1}`; });
    for (const s of all) {
      s.expected_duration_s = s.planned_duration_s;
      const eff = s.effort_target;
      const paceOn = !!anchorPace && daysBetween(anchorPace.date, s.date) <= P('anchor.max_age_days');
      if (paceOn && eff !== 'E0' && eff !== 'E5' && !s.is_goal_race) {
        const pr = rangeOf(eff);
        if (pr) { s.pace_range = { ...pr, effort: eff }; s.rule_ids.push('FEA-014'); }
      }
      // SES-031 / SES-032 (v5.3): time or distance form of the E3/E4 work; the time stays the prescription
      if (s.segments.some(x => x.role === 'work' && hardEffort(x.effort)) && !s.is_goal_race && !s.is_long_run) {
        const pref = input.profile.prescription_preference ?? pval<string>(spec, 'ses.prescription_default');
        const timeOnly = pval<string[]>(spec, 'ses.time_only_modules').includes(s.module_id);
        s.prescription_form = !paceOn || timeOnly ? 'time' : (pref as 'distance' | 'time' | 'both');
        if (s.prescription_form !== 'time') { distanceForm(s); s.rule_ids.push('SES-032'); }
        s.rule_ids.push('SES-031');
      }
      const runWalk = !st.levels.HAB || st.levels.HAB < 2 || (input.profile.run_walk_preference === true && input.profile.run_walk_preference_explicit === true) || s.expected_duration_s > 60 * P('lr.long_guard_min');
      if (runWalk && s.kind !== 'ladder' && s.is_run && !s.is_goal_race) {
        const ladderRW = pval<(number[] | string)[]>(spec, 'ses.runwalk.ladder');
        const rungIdx = input.engine_state?.runwalk_rung ?? (input.profile.run_walk_preference ? pval<Record<string, number>>(spec, 'ses.runwalk.entry_rung').preference : pval<Record<string, number>>(spec, 'ses.runwalk.entry_rung').hab_low);
        const r = ladderRW[Math.min(rungIdx, ladderRW.length - 1)];
        if (Array.isArray(r)) { s.run_walk = true; s.run_walk_ratio = { run_s: r[0] * 60, walk_s: r[1] * 60, label: `${r[0]}:${r[1]}` }; s.rule_ids.push('SES-009'); }
      }
      s.rule_ids = [...new Set(s.rule_ids)].sort();
      s.messages.push({ id: 'MSG-INP-PAIN-TAP', rule_id: 'INP-022' } as MessageInstance);
    }
    const wk = finishWeek(w + L.indexOffset, start, ph, cw, all, quality_max, isRaceWeek, P, { is_calibration: isCal, long_run_form: longForm });
    for (const r of ruleIds) c.fired.push({ stage: 'S7', rule_id: r, binding: `week:${w + 1 + L.indexOffset}`, op: 'apply' });
    weeks.push(wk);
    for (const s of all) if (!s.is_goal_race) runs.push({ day: dayOf(s.date), s: s.planned_duration_s });
    const lrS = all.find(s => s.is_long_run);
    prevLR = lrS ? { date: lrS.date, s: lrS.planned_duration_s } : null;
    const hardDays = all.filter(s => s.is_hard).map(s => weekdayIndex(s.date));
    prevHard = hardDays.length ? Math.max(...hardDays) : null;
    // SPEC-QUESTION Q-E28: the "pre-taper block" of INV-08 / LOD-051 is the 3 weeks before the taper: runs/week = floor of
    // their mean, and it "had an E3+ touch" when any of them holds an E3 or E4 segment
    if (w === taperStart - 1 || (taperStart < 0 && w === L.phases.length - 1)) {
      const pre = weeks.slice(-3);
      pre_taper_runs = Math.floor(pre.reduce((a, x) => a + x.runs, 0) / pre.length);
      pre_taper_had_e3 = pre.some(x => x.has_e3_touch);
    }
  }
  void T; void testsOff; void toDays; void isoWeek;
  const race_fuel = null;
  return { weeks, pre_taper_had_e3, pre_taper_runs, race_fuel };
}

export function finishWeek(w: number, start: ISODate, ph: PhaseType, cw: { V: number; LR: number; is_deload: boolean; taper_k: number | null; is_race_week: boolean }, sessions: Session[], quality_max: number, isRaceWeek: boolean, _P: (id: string) => number, x: { is_calibration?: boolean; long_run_form?: 'a' | 'b' | null } = {}): Week {
  let hard = 0, e2 = 0, easy = 0;
  for (const s of sessions) { if (s.is_goal_race) continue; const t = effortTimes(s.segments); hard += t.hard; e2 += t.e2; easy += t.easy; }
  const planned = sessions.reduce((a, s) => a + (s.is_goal_race ? 0 : s.planned_duration_s), 0);
  const lr = sessions.find(s => s.is_long_run);
  const e3touches = sessions.filter(s => !s.is_goal_race && s.segments.some(x => hardEffort(x.effort))).length;
  return {
    index: w + 1, start, iso_week: isoWeek(start), phase: ph, season_index: 0, phase_week_index: 0, load_kind: isRaceWeek ? 'race' : cw.taper_k ? 'taper' : cw.is_deload ? 'deload' : ph === 'START_LADDER' ? 'start_ladder' : ph === 'RTR' ? 'rtr' : ph === 'SHARPEN' ? 'sharpen' : ph === 'TRANSITION' ? 'transition' : ph === 'MAINTAIN' ? 'maintain' : 'loading',
    load_ordinal: 0, is_deload: cw.is_deload, taper_k: cw.taper_k, is_race_week: isRaceWeek, kind: 'normal', planned_time_s: planned,
    planned_dist_m: null, lr_s: lr ? lr.planned_duration_s : 0, runs: sessions.filter(s => s.is_run).length, quality_max,
    key_session_count: sessions.filter(s => s.is_key).length, e3_touches: e3touches, has_e3_touch: e3touches > 0, hard_time_s: hard, e2_time_s: e2, easy_time_s: easy,
    frozen: false, log_state: 'future', sessions, is_calibration: x.is_calibration ?? false, long_run_form: x.long_run_form ?? null,
  };
}

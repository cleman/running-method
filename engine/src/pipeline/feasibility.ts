// S3 Demand & feasibility (03), with the S4 phase layout and the S6 curve of the dry run (FEA-020, 12 §2b.4).
// Native: demand, band, weeks needed and the dry run (procedures FEA-001/010/020). Engine: every formal S3 record
// (reasons, labels, FEA-011 band widening, FEA-036 verdict), evaluated on the roots built here.
import type { Distance, GeneratorInput, PhaseType, Verdict } from '../model/types.ts';
import { type Value } from '../expr/eval.ts';
import { type Effect, runRecords } from '../rules/engine.ts';
import { reasonClass, REASON_ORDER } from '../rules/helpers.ts';
import { type Spec, evalContext, openRecord, pnum, pval, roundDown } from '../context.ts';
import { addDays, daysBetween, mondayOf, weekdayIndex, WEEKDAYS, type ISODate } from '../util/dates.ts';
import { l30PlanSources, type DerivedState } from './state.ts';
import type { GateResult, FiredRule } from './gate.ts';
import { commonRoots, stateRoot } from './gate.ts';
import { computeDemand, predictBand, lrCapFn, RACE_M, FAMILY, type Band, type Demand } from './demand.ts';
import { allocatePhases, placeDeloads } from './phases.ts';
import { buildCurve, growthWeek, type CurveInputs, type CurveWeek } from './curve.ts';
import { startLadderSessions, rtrSessions, spacedDays, type LadderSession } from './ladder.ts';

export type Horizon = 'H0' | 'H1' | 'H2' | 'H3' | 'H4' | 'H5';
export interface WeeksNeeded { rtr: number; onboard: number; base: number; build: number; specific: number; taper: number }

export interface Layout {
  planStart: ISODate; W: number; phases: PhaseType[]; deloads: number[]; curve: CurveWeek[];
  ladder: LadderSession[]; ladderKind: 'start' | 'rtr' | null; ladderRunsPerWeek: number; lrWeekday: number; runs: number;
  V_peak: number; L_target: number; lrCap: (V: number) => number;
  /** curve inputs the session builder re-applies to realised week volumes (LOD-003/007) */
  /** season numbering: plan week i has index i + 1 + indexOffset (re-plans keep the parent's week numbers) */
  indexOffset: number;
  growth: { V_hold: number; prog: CurveInputs['prog']; confirmedFrom: number; preWeeks: number[]; step: number; history: { V: number; LR: number; deload: boolean }[] };
}

export interface Feasibility {
  verdict: Verdict; reasons: string[]; labels: string[]; horizon: Horizon; W: number | null;
  weeks_needed: WeeksNeeded; G: number; slack: number; K_key: number; K_all: number;
  band: Band | null; demand: Demand; layout: Layout | null; fill_capacity_s: number; fired: FiredRule[]; messages: { id: string; rule_id: string }[];
  dryRunHistory: { G: number; base: number; G2: number }[];
}

export interface Availability { days: string[]; maxRuns: number; minutes: number }

export function availability(spec: Spec, input: GeneratorInput): Availability {
  // INP-007: defaults when availability is blank
  const days = (input.profile.available_days ?? pval<string[]>(spec, 'inp.default_days')).filter(d => (WEEKDAYS as readonly string[]).includes(d));
  const runs = input.profile.max_runs_per_week ?? Math.min(days.length, pnum(spec, 'inp.default_runs'));
  return { days, maxRuns: runs, minutes: input.profile.available_minutes_per_week ?? pnum(spec, 'inp.default_runs') * pnum(spec, 'inp.default_session_min') };
}

export function horizonOf(W: number | null): Horizon {
  if (W === null) return 'H0';
  return W <= 4 ? 'H1' : W <= 8 ? 'H2' : W <= 24 ? 'H3' : W <= 52 ? 'H4' : 'H5';
}

export function planStartOf(today: ISODate): ISODate {
  // SPEC-QUESTION Q-E13: plan week 1 starts on the first Monday on or after today; a partial first week is not planned.
  const wd = weekdayIndex(today);
  return wd === 0 ? today : addDays(today, 7 - wd);
}

function lrWeekdayOf(input: GeneratorInput, days: string[]): number {
  const avail = days.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).filter(i => i >= 0).sort((a, b) => a - b);
  const pref = input.profile.long_run_day ? WEEKDAYS.indexOf(input.profile.long_run_day) : -1;
  return avail.includes(pref) ? pref : (avail.at(-1) ?? 6);          // SES-005 / INP-008
}

interface Ctx { spec: Spec; input: GeneratorInput; st: DerivedState; gate: GateResult; av: Availability }

/** Build the layout (phases, deloads, curve) for a given base_needed. extendTo > W runs the dry-run extension. */
function layoutFor(c: Ctx, d: Demand, W: number, T: number, baseNeeded: number, ladder: LadderSession[], ladderKind: 'start' | 'rtr' | null, onboard: number, extendTo = 0): Layout & { fits: boolean } {
  const { spec, input, st, gate, av } = c;
  const P = (id: string) => pnum(spec, id, gate.overrides);
  const dist = input.goal.distance;
  const shortFinish = d.family === 'base' || (d.family === 'short' && input.goal.goal_type !== 'time' && !['THR', 'VO2', 'MSP'].some(n => (d.required_levels[n] ?? 0) > 0));
  const runs = Math.min(av.maxRuns, av.days.length);
  const spaced = spacedDays(av.days.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).filter(i => i >= 0)).length;
  const ladderRunsPerWeek = Math.min(ladderKind === 'start' ? 3 : P('rtr.max_runs_per_week'), runs, spaced);
  const ladderWeeks = ladder.length ? Math.ceil(ladder.length / Math.max(1, ladderRunsPerWeek)) : 0;
  const lay = allocatePhases({
    W, T, ladderWeeks, ladderKind: ladderKind === 'start' ? 'START_LADDER' : ladderKind === 'rtr' ? 'RTR' : null, onboard, baseNeeded,
    specificMin: (pval<Record<string, number>>(spec, 'phs.specific_min')[dist] ?? 0), specificTarget: (pval<Record<string, number>>(spec, 'phs.specific_target')[dist] ?? 0),
    buildMin: P('phs.build_min'), buildMax: P('phs.build_max'), shortFinish, rolling: d.family === 'base',
  });
  const planStart = planStartOf(input.today);
  const lrWeekday = lrWeekdayOf(input, av.days);
  const every = P('deload.every');
  let phases = lay.phases;
  let deloads = lay.fits ? placeDeloads({ phases, every, minPlanWeeks: P('deload.min_plan_weeks'), minGap: P('deload.min_gap_weeks'), exclusionBeforeTaper: P('deload.exclusion_before_taper'), W, counterStart: ladderWeeks }) : [];
  // Re-plan of the same goal (04 §3 step 7b, 08): completed weeks are frozen and the phases and deloads still ahead are kept
  // from the parent version; the completed weeks, as logged, seed the LOD-003/004 baselines.
  const parent = input.parent_plan;
  const sameGoal = !!parent && parent.goal_id === input.goal.id && (parent.race_date ?? null) === (input.goal.race_date ?? null) && !ladderKind;
  const loggedIn = (start: string) => st.entries.filter(e => e.is_run && !e.flagged && daysBetween(start, e.date) >= 0 && daysBetween(start, e.date) < 7);
  // completed weeks since the profile was created (≤ 4), as logged; deload flags from the parent version when it knows them
  const created = mondayOf((input.profile.created_at ?? input.today).slice(0, 10));
  const history: { V: number; LR: number; deload: boolean }[] = [];
  for (let k = 4; k >= 1; k--) {
    const ws = addDays(planStart, -7 * k);
    const es = loggedIn(ws);
    if (ws < created && !es.length) continue;          // before the profile existed, only weeks the log covers
    history.push({ V: es.reduce((a, e) => a + e.duration_s, 0), LR: Math.max(0, ...es.map(e => e.duration_s)), // deloads and taper weeks are not baselines (LOD-003, 05 §6–§7)
      deload: (() => { const pw = parent?.weeks.find(w => w.start === ws); const de = input.engine_state?.dated_events ?? {};
        return !!(pw?.is_deload || pw?.taper_k) || (de.deload_weeks ?? []).includes(ws) || (de.taper_weeks ?? []).includes(ws); })() });
  }
  let frozen = false;
  if (sameGoal && extendTo === 0) {
    const ahead = parent!.weeks.filter(w => w.start >= planStart);
    if (ahead.length === W && ahead.length) {
      phases = ahead.map(w => w.phase);
      deloads = ahead.flatMap((w, i) => (w.is_deload ? [i] : []));
      frozen = true;
    }
  }
  const fits = frozen || lay.fits;
  if (extendTo > phases.length && lay.fits) {
    // dry-run extension: taper weeks become loading weeks, the deload cadence continues
    const ext = phases.map(p => (p === 'TAPER' ? 'SPECIFIC' : p)) as PhaseType[];
    while (ext.length < extendTo) ext.push('SPECIFIC');
    const taperStart = phases.indexOf('TAPER');
    deloads = deloads.filter(i => taperStart < 0 || i < taperStart);
    let next = (deloads.at(-1) ?? ladderWeeks - 1) + every;
    while (next < ext.length) { if (next >= Math.max(taperStart, ladderWeeks)) deloads.push(next); next += every; }
    phases = ext;
  }
  // LOD-070: at ladder exit, L30_eff = the last rung and the baseline = that week's volume; LOD-005 then holds them
  const ladderExitV = ladder.length ? ladder.slice(-ladderRunsPerWeek).reduce((a, x) => a + x.total_s, 0) : 0;
  const ladderExitL = ladder.length ? Math.max(...ladder.slice(-ladderRunsPerWeek).map(x => x.total_s)) : 0;
  const V_hold = Math.max(st.V_hold_s, ladderKind === 'rtr' ? ladderExitV : 0);
  const L_hold = Math.max(st.L_hold_s, ladderKind === 'rtr' ? ladderExitL : 0);
  const V_next = (() => { const AER = [0, 90, 180, 300, 450, 600]; const n = Math.min(5, st.levels.AER + 1); return AER[n] * 60; })();
  const avail = av.minutes * 60;
  const V_peak = Math.min(avail, Math.max(d.V_req_time_s, V_hold, V_next));
  const L_target = Math.max(d.L_req_time_s, L_hold);
  const lrCap = lrCapFn(spec, dist, d.family, runs, d.L_req_time_s);
  // ladder weeks
  const ladderWeeksArr: { V: number; LR: number; sessions: number[] }[] = [];
  for (let w = 0; w < ladderWeeks; w++) {
    const ss = ladder.slice(w * ladderRunsPerWeek, (w + 1) * ladderRunsPerWeek).map(s => s.total_s);
    ladderWeeksArr.push({ V: ss.reduce((a, b) => a + b, 0), LR: Math.max(...ss), sessions: ss });
  }
  const startOffset = daysBetween(input.today, planStart);
  // SPEC-QUESTION Q-E19 (with docs/questions.md Q4): a claimed L30 has no date; it is dated the day before today, so it
  // counts for sessions up to 29 days after today (13 §3: Ana's claim counts until week 4).
  const l30Sources = l30PlanSources(spec, st);
  const slowCtx = st.slow_ctx.length > 0 || gate.slowRules.some(r => r !== 'CTX-007');
  const preWeeks = st.logged_week_totals.filter(w => daysBetween(w.start, planStart) <= 7 * P('prog.est.window_weeks')).map(w => w.time_s);
  const gapDays = st.days_since_last_run ?? 0;
  const gap = st.gap_band ? { vol: P(`gap.vol_factor.${st.gap_band}`), long: P(`gap.long_factor.${st.gap_band}`), V7: st.V7_prev_time_s, L30: st.L30_eff_time_s } : null;
  void gapDays;
  const ci: CurveInputs = {
    phases, deloads: new Set(deloads), lrOffset: lrWeekday, startOffset, V_hold, L_hold, L_target, V_peak, avail,
    l30Sources, sourcesUntil: st.gap_band ? startOffset + 7 : undefined, slowWeeks: w => slowCtx || (w - ladderWeeks < st.probation_weeks_left) || (ladderKind !== null && w - ladderWeeks < P('log.probation_weeks')),
    confirmedFrom: st.baseline_confirmed ? 0 : ladderWeeks + Math.max(0, P('prog.est.confirm_weeks') - st.est_confirm_weeks), preWeeks, lrCap,
    prog: { slow: [P('prog.slow.week_max'), P('prog.slow.2wk_max')], standard: [P('prog.standard.week_max'), P('prog.standard.2wk_max')], est: P('prog.est.week_max'), window: P('prog.est.window_weeks') },
    deloadCut: P('deload.volume_cut'), taperCut: P('taper.volume_cut'), taperProfile: pval<Record<string, number[]>>(spec, 'taper.cut_profile')[String(T)] ?? [1], taperK0: frozen ? (parent!.weeks.find(w => w.start >= planStart && w.taper_k)?.taper_k ?? 1) : 1, taperT: T,
    ladder: ladderWeeksArr, gap, step: P('load.round_down_s'), history,
    V_base0: ladderKind === 'rtr' ? V_hold : (st.gap_band ? st.V_hold_s : Math.max(roundDown(st.V28_time_s, P('load.round_down_s')), ladderKind ? V_hold : 0)),
  };
  const curve = fits ? buildCurve(ci) : [];
  return { planStart, W, phases: frozen ? phases : lay.phases, deloads, curve, ladder, ladderKind, ladderRunsPerWeek, lrWeekday, runs, V_peak, L_target, lrCap, fits,
    indexOffset: frozen ? Math.max(0, (parent!.weeks.find(w => w.start === planStart)?.index ?? 1) - 1) : 0,
    growth: { V_hold: ci.V_base0 ?? V_hold, prog: ci.prog, confirmedFrom: ci.confirmedFrom, preWeeks, step: ci.step, history } };
}

export function assess(spec: Spec, input: GeneratorInput, st: DerivedState, gate: GateResult, av: Availability): Feasibility {
  const P = (id: string) => pnum(spec, id, gate.overrides);
  const g = input.goal;
  const c: Ctx = { spec, input, st, gate, av };
  const fired: FiredRule[] = [];
  const dist = g.distance as Distance;
  const planStart = planStartOf(input.today);
  const W = g.race_date ? Math.floor(daysBetween(planStart, g.race_date) / 7) + 1 : null;
  // a re-plan of the same goal keeps the season's horizon class and taper (04 §3 step 7b): the remaining weeks are not a new short plan
  const pp0 = input.parent_plan;
  const frozenParent = pp0 && pp0.goal_id === g.id && (pp0.race_date ?? null) === (g.race_date ?? null) && pp0.weeks.filter(w => w.start >= planStart).length === W ? pp0 : null;
  const horizon = g.goal_type === 'maintain' || g.goal_type === 'base' || dist === 'none' ? 'H0' : frozenParent ? (frozenParent.horizon as Horizon) : horizonOf(W);

  // ---- band (FEA-010), demand (FEA-001), FEA-011 widening through the engine
  // SPEC-QUESTION Q-E8: FEA-011 writes feas.B_slow = feas.B_slow × widen, which never reaches a fixpoint under 12 §3.7;
  // the engine applies it once, before the other S3 records, and they read the widened band.
  let band = predictBand(spec, st, input, dist, true, st.V28_dist_m);
  const fea011 = spec.rules.get('FEA-011');
  if (band) {
    const ctx = evalContext(spec, { ...commonRoots(input, st), state: stateRoot(input, st), feas: { B_slow: band.B_slow } as unknown as Value }, gate.overrides);
    const r = runRecords([fea011], ctx);
    const set = r.effects.find(e => e.op === 'set' && e.target === 'feas.B_slow');
    if (set && typeof set.value === 'number') {
      band = { ...band, B_slow: set.value, slow_edge_s: band.P_race_s * (1 + set.value) };
      fired.push({ stage: 'S3', rule_id: 'FEA-011', op: 'set', target: 'feas.B_slow', value: set.value });
    }
  }
  const demand = computeDemand(spec, input, st, band);
  const ladderKindEarly = gate.startLadder || st.never_run ? 'start' : null;
  // LOD-005 goal-change carry-over (ADP-080): L_hold = min(L30_eff, max(L_target_new, lr_cap(new preset, V_hold)))
  const gc = input.events.find(e => e.kind === 'goal_change');
  const prevDist = (gc?.payload as { previous_goal?: { distance?: string } } | undefined)?.previous_goal?.distance;
  if (prevDist && prevDist !== dist && demand.family !== 'base') {
    const runsC = Math.min(av.maxRuns, av.days.length);
    const cap = lrCapFn(spec, dist, demand.family, runsC, demand.L_req_time_s)(st.V_hold_s);
    st.L_hold_s = roundDown(Math.min(st.L30_eff_time_s, Math.max(demand.L_req_time_s, cap)), P('load.round_down_s'));
    fired.push({ stage: 'S3', rule_id: 'LOD-005', op: 'set', target: 'state.L_hold_s', value: st.L_hold_s });
  }
  // FEA-025 (b): a long run logged this season that reached L_req (within the rounding tolerance) within
  // feas.peak_credit_days of the race day counts toward the long-run demand
  if (ladderKindEarly === 'start' && dist === '5K' && g.goal_type === 'finish') demand.credited = true;   // 02 §2: the start ladder credits the 30-min long run
  else if (g.race_date && demand.family !== 'base') {
    const tolS = P('load.round_down_s');
    demand.credited = st.entries.some(e => e.is_run && e.measured && !e.flagged && e.type !== 'race' && e.duration_s >= demand.L_req_time_s - tolS
      && daysBetween(e.date, g.race_date!) <= P('feas.peak_credit_days') && e.date >= (input.profile.created_at ?? '').slice(0, 10));
  }
  fired.push({ stage: 'S3', rule_id: 'FEA-001', op: 'set', target: 'demand', value: demand.L_req_time_s });

  // ---- weeks needed (03 §4)
  const shortFinish = demand.family === 'short' && g.goal_type !== 'time' && !['THR', 'VO2', 'MSP'].some(n => (demand.required_levels[n] ?? 0) > 0);
  const T = frozenParent ? Math.max(frozenParent.taper_weeks_n, ...frozenParent.weeks.map(w => w.taper_k ?? 0)) : W === null ? 0 : W <= 4 ? (pval<Record<string, number>>(spec, 'taper.weeks_short')[dist] ?? 1) : shortFinish ? P('taper.weeks.short_finish') : (pval<Record<string, number>>(spec, 'taper.weeks')[dist] ?? 2);
  let ladder: LadderSession[] = [];
  let ladderKind: 'start' | 'rtr' | null = null;
  // SAF-082: a re-plan continues the active ladder from the runner's position (sessions done since its entry)
  const esL = input.engine_state?.ladder ?? null;
  const pos = esL ? st.ladder_pos : 0;
  if (esL?.kind === 'start' || (!esL && (gate.startLadder || st.never_run))) {
    ladder = startLadderSessions().slice(pos); ladderKind = ladder.length ? 'start' : null;
  } else if (esL?.kind === 'rtr' || st.L30_source === 'undefined_rtr') {
    const entry = (st.days_since_last_run ?? 0) >= P('rtr.long_gap_days') ? 0 : 1;
    ladder = rtrSessions(esL?.kind === 'rtr' ? (esL.floor_rung ?? entry) : entry, pval<Record<string, number>>(spec, 'rtr.session_min'));
    ladderKind = 'rtr';
    // LOD-010 / INV-02 bind return-ladder sessions: each rung ≤ spike.warn_ratio × the longest earlier session (Q-E21)
    // capped per rung: the three sessions of a rung are equal (rtr.sessions_per_rung)
    let longest = ladder[0].total_s;
    let prevRung = ladder[0].rung, rungCap = Infinity;
    ladder = ladder.map(x => {
      if (x.rung !== prevRung) { rungCap = roundDown(P('spike.warn_ratio') * longest, P('load.round_down_s')); prevRung = x.rung; }
      const t = Math.min(x.total_s, rungCap);
      longest = Math.max(longest, t);
      return t === x.total_s ? x : { ...x, total_s: t, run_s: t, segments: [{ ...x.segments[0], duration_s: t }] };
    }).slice(pos);
    if (!ladder.length) ladderKind = null;
  }
  const runs = Math.min(av.maxRuns, av.days.length);
  const spaced = spacedDays(av.days.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).filter(i => i >= 0)).length;
  const ladderRunsPerWeek = Math.min(ladderKind === 'start' ? 3 : P('rtr.max_runs_per_week'), runs, spaced);
  const rtrWeeks = ladder.length ? Math.ceil(ladder.length / Math.max(1, ladderRunsPerWeek)) : 0;   // SAF-085
  const measuredAnchor = st.anchor?.confidence === 'measured';
  // FEA-025: on a re-plan of the same goal, each phase minimum is reduced by the weeks already spent in that phase; with the
  // parent's layout kept (04 §3 step 7b) that is the number of weeks of the phase still ahead
  const pp = input.parent_plan;
  const ahead = pp && pp.goal_id === g.id && (pp.race_date ?? null) === (g.race_date ?? null) ? pp.weeks.filter(w => w.start >= planStart).map(w => w.phase) : null;
  const left = (ph: string, n: number) => (ahead && ahead.length === W ? Math.min(n, ahead.filter(x => x === ph).length) : n);
  const onboard = left('ONBOARD', !measuredAnchor || st.log_status !== 'rich' ? P('phs.onboard_weeks') : 0);
  const build = left('BUILD', shortFinish || horizon === 'H1' ? 0 : P('phs.build_min'));
  const specific = left('SPECIFIC', shortFinish || horizon === 'H1' ? 0 : (pval<Record<string, number>>(spec, 'phs.specific_min')[dist] ?? 0));

  let G = 0, layout: (Layout & { fits: boolean }) | null = null;
  const hist: { G: number; base: number; G2: number }[] = [];
  const tol = P('load.round_down_s');
  if (horizon !== 'H0' && horizon !== 'H1' && W !== null) {
    const L0 = Math.max(st.L30_eff_time_s, ladder.length ? ladder.at(-1)!.total_s : 0);
    const V0 = Math.max(st.V_hold_s, ladder.length ? ladder.slice(-ladderRunsPerWeek).reduce((s, x) => s + x.total_s, 0) : 0);
    const Lt = Math.max(demand.L_req_time_s, st.L_hold_s);
    // SPEC-QUESTION Q-E15: the dry run grows V toward min(V_req, available time); a V_req above the runner's time is
    // AVAILABILITY_TIME (FEA-030), not also PHASES_DO_NOT_FIT, so change_availability can be offered alone (13 §7a Ben).
    const Vt = Math.min(demand.V_req_time_s, av.minutes * 60);
    const nL = L0 > 0 && Lt > L0 ? Math.ceil(Math.log(Lt / L0) / Math.log(P('spike.warn_ratio'))) : 0;
    const rate = Math.min(st.slow_log || st.slow_ctx.length ? P('prog.slow.week_max') : P('prog.standard.week_max'), st.baseline_confirmed ? Infinity : P('prog.est.week_max'));
    const nV = V0 > 0 && Vt > V0 ? Math.ceil(Math.log(Vt / V0) / Math.log(1 + rate)) : 0;
    const m = Math.max(nL, nV);
    G = m + (W >= P('deload.min_plan_weeks') ? Math.floor(m / (P('deload.every') - 1)) : 0);
    for (let it = 0; it < 3; it++) {
      const base = Math.max(0, G - build - specific);
      const lay = layoutFor(c, demand, W, T, base, ladder, ladderKind, onboard, Math.max(W, rtrWeeks + 78));   // dry run over 1.5 years at most
      const met0 = L0 >= Lt - tol && V0 >= Vt - tol;
      if (!lay.fits) { hist.push({ G, base, G2: G }); break; }      // the base no longer fits W: keep G; slack < 0 → PHASES_DO_NOT_FIT
      const G2 = met0 ? 0 : growthWeek(lay.curve.slice(rtrWeeks), Lt, Vt, tol);
      hist.push({ G, base, G2 });
      if (G2 === G) break;
      if (G2 === Infinity) { G = Infinity; break; }
      G = it === 2 ? Math.max(G, G2) : G2;
    }
    fired.push({ stage: 'S3', rule_id: 'FEA-020', op: 'set', target: 'feas.weeks_needed', value: Number.isFinite(G) ? G : null });
  }
  // FEA-025 (a) reading: on a re-plan of the same goal, growth weeks still needed fit only where the season layout has BASE weeks left
  const base = Number.isFinite(G) ? left('BASE', Math.max(0, G - build - specific)) : 999;
  const weeks_needed: WeeksNeeded = { rtr: rtrWeeks, onboard, base, build, specific, taper: left('TAPER', T) };
  const slack = W === null ? 4 : horizon === 'H1' ? W - T : W - (rtrWeeks + Math.max(base, onboard - rtrWeeks) + build + specific + weeks_needed.taper);
  if (W !== null && horizon !== 'H0') {
    const lay = layoutFor(c, demand, W, T, Number.isFinite(G) ? base : 0, ladder, ladderKind, onboard);
    layout = lay.fits ? lay : null;
  } else if (horizon === 'H0') {
    const W0 = rtrWeeks + 4;
    const lay = layoutFor(c, demand, W0, 0, 4, ladder, ladderKind, onboard);
    layout = lay.fits ? lay : null;
  }

  // ---- level weeks (03 §4, FEA-021)
  const mw = (n: string) => pnum(spec, `cmp.min_weeks_per_level.${n}`);
  // SPEC-QUESTION Q-E32: the start ladder in the plan credits HAB L2 at its exit (02 §2), so those HAB weeks are not counted again
  const gap = (n: string) => Math.max(0, (demand.required_levels[n] ?? 0) - Math.max(st.levels[n as keyof typeof st.levels] ?? 0, n === 'HAB' && ladderKind === 'start' ? 2 : 0));
  // SPEC-QUESTION Q-E14: FEA-023 says that in H1 "non-volume levels are not gates"; the FEA-021 record has no H1 guard,
  // so the engine passes K = 0 to it in H1.
  const h1 = horizon === 'H1' || horizon === 'H0';   // H0: no goal levels to reach
  // SPEC-QUESTION Q-E29: on a re-plan, the weeks already trained with logged key sessions this season count toward
  // K_key (as FEA-025 reduces the phase minimums): a level test only comes after weeks of training, so the weeks that
  // led up to a pending test are not counted again
  const keyMods = new Set(['SES-M-007', 'SES-M-008', 'SES-M-009', 'SES-M-010', 'SES-M-011', 'SES-M-012', 'SES-M-013', 'SES-M-024']);
  const keyWeeksDone = input.parent_plan ? new Set(st.entries.filter(e => e.module_id && keyMods.has(e.module_id) && e.date >= (input.profile.created_at ?? '').slice(0, 10)).map(e => mondayOf(e.date))).size : 0;
  const K_key = h1 ? 0 : Math.max(0, Math.max(0, ...['THR', 'VO2', 'MSP', 'ECO'].map(n => gap(n) * mw(n))) - keyWeeksDone);
  // Q-E29 (same reading for FUEL): weeks of this season with a logged fuelling practice run count toward the FUEL weeks
  const fuelWeeksDone = input.parent_plan ? new Set(st.entries.filter(e => e.carb_g_per_h != null && e.date >= (input.profile.created_at ?? '').slice(0, 10)).map(e => mondayOf(e.date))).size : 0;
  const K_all = h1 ? 0 : Math.max(0, gap('HAB') * mw('HAB'), gap('FUEL') * mw('FUEL') - fuelWeeksDone);
  const P0 = rtrWeeks + Math.max(0, onboard - rtrWeeks);

  // ---- fill capacity at max runs (FEA-031): long run at its target, adjacent days ≤ LOD-013, other days ≤ LR
  const lrDay = lrWeekdayOf(input, av.days);
  const dayIdx = av.days.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).filter(i => i >= 0);
  const others = dayIdx.filter(i => i !== lrDay).slice(0, Math.max(0, runs - 1));
  const Lt = Math.max(demand.L_req_time_s, st.L_hold_s);
  const adj = others.filter(i => Math.abs(i - lrDay) === 1 || Math.abs(i - lrDay) === 6).length;
  const fill_capacity_s = runs <= 0 ? 0 : Lt + adj * Math.min(P('two_day.adjacent_ratio') * Lt, (P('two_day.cap_ratio') - 1) * Lt) + (others.length - adj) * Lt;

  // ---- required tests not yet held (FEA-026)
  const exitTests = pval<Record<string, Record<string, { module: string; segments?: { duration_s: number; repeats: number; effort: string }[] }>>>(spec, 'ses.exit_test');
  const required_tests: Value[] = [];
  for (const [node, lvl] of Object.entries(demand.required_levels)) {
    for (let n = (st.levels[node as keyof typeof st.levels] ?? 0) + 1; n <= lvl; n++) {
      const t = exitTests[node]?.[String(n)];
      if (!t?.segments) continue;
      const hard = t.segments.filter(s => s.effort === 'E3' || s.effort === 'E4').reduce((s, x) => s + x.duration_s * x.repeats, 0);
      if (horizon !== 'H1') required_tests.push({ name: `${node} ${n}`, node, level: n, hard_time_s: hard });   // H1: levels are not gates (FEA-023)
    }
  }

  // ---- reasons through the engine (S3 records)
  const s3 = spec.rules.ofStage('S3').filter(r => r.release === 'MVP' && r.expression_status === 'formal' && r.scope === 'global' && r.id !== 'FEA-011');
  const feasRoot: Record<string, Value> = {
    horizon, slack, k_key: K_key, k_all: K_all, weeks_available: W ?? (layout?.phases.length ?? 0), weeks_needed: { ...weeks_needed } as unknown as Value, p0: P0,
    P_race_s: band ? band.P_race_s : null, B_fast: band ? band.B_fast : null, B_slow: band ? band.B_slow : null,
    fast_edge_s: band ? band.fast_edge_s : null, slow_edge_s: band ? band.slow_edge_s : null, fill_capacity_s, v_peak_s: layout?.V_peak ?? Math.min(av.minutes * 60, demand.V_req_time_s),
    inputs_used: st.core_inputs as unknown as Value, reasons: [], verdict: null, s4_phases_do_not_fit: false, weeks_left: W ?? 0, degraded_available: false,
  };
  const goalRoot = { ...(commonRoots(input, st).goal as Record<string, Value>), family: FAMILY[dist], family_tid: dist === 'HM' ? 'HM' : FAMILY[dist] };
  const anchorRoot: Value = st.anchor ? { ...st.anchor } as unknown as Value : { time_s: null, confidence: 'unknown', date: null, equiv_10k_s: null };
  const demandRoot: Value = { ...demand, required_levels: { ...demand.required_levels }, required_tests, long_run_met: demand.met_by_logged_distance } as unknown as Value;
  const anchorL30 = demand.family !== 'base' && (st.L30_conf === 'measured' && st.L30_eff_dist_m != null && st.L30_eff_dist_m >= demand.race_m / ratioOf(spec, dist) || st.L30_eff_time_s >= demand.L_req_time_s - tol);
  const helpers = {
    anchor_l30_ok: () => anchorL30,
    age_low: (a: Value[]) => (typeof a[0] === 'string' ? st.age_low(a[0]) : null),
    age_high: (a: Value[]) => (typeof a[0] === 'string' ? st.age_high(a[0]) : null),
  };
  const roots = {
    ...commonRoots(input, st), goal: goalRoot as unknown as Value, state: stateRoot(input, st), feas: feasRoot as unknown as Value,
    demand: demandRoot, anchor: anchorRoot, preset: { id: demand.preset } as unknown as Value, plan: { is_regeneration: input.parent_plan != null, W } as unknown as Value,
    event: openRecord({ type: 'compute_weeks_needed' }), option: openRecord({}),
  };
  const reasons = new Set<string>(gate.reasons.filter(r => r !== 'LOW_FREQ'));
  const labels = new Set<string>();
  const messages: { id: string; rule_id: string }[] = [];
  const collect = (effs: Effect[]) => {
    for (const e of effs) {
      const raw = e.raw as { code?: string; msg?: string };
      // SPEC-QUESTION Q-E14 (extended): in H1 non-volume levels are not gates (FEA-023), so FEA-021 adds no reason there,
      // also when W − taper − P0 < 0 makes K = 0 look unreachable
      if (e.op === 'add_reason' && raw.code && !(h1 && horizon === 'H1' && e.ruleId === 'FEA-021')) reasons.add(raw.code);
      if (e.op === 'label' && raw.code) labels.add(raw.code);
      if (raw.msg) messages.push({ id: raw.msg, rule_id: e.ruleId });
      fired.push({ stage: 'S3', rule_id: e.ruleId, op: e.op, target: e.target ?? raw.code, value: typeof e.value === 'number' || typeof e.value === 'string' || typeof e.value === 'boolean' ? e.value : undefined });
    }
  };
  const ctx = evalContext(spec, roots, gate.overrides, helpers);
  const run1 = runRecords(s3.filter(r => r.id !== 'FEA-036' && r.id !== 'FEA-040' && r.id !== 'FEA-042'), ctx);
  collect(run1.effects);
  // H1: SHARPEN is feasible only if the current state meets the demand (PHS-011 → PHASES_DO_NOT_FIT handled by FEA-023's CURRENT_STATE_SHORT)
  if (horizon !== 'H0' && horizon !== 'H1' && W !== null && !layout) reasons.add('PHASES_DO_NOT_FIT');
  // a re-plan of the same goal already inside its taper (or race week) is not a squeezed plan (PHS-011 applies to new plans)
  if (horizon === 'H1' && W !== null && W <= T && !(input.parent_plan && input.parent_plan.goal_id === g.id)) reasons.add('PHASES_DO_NOT_FIT');
  if (!Number.isFinite(G) && horizon !== 'H0' && horizon !== 'H1') reasons.add('PHASES_DO_NOT_FIT');
  if (horizon === 'H0' || dist === 'none') { reasons.delete('LONG_RUN_UNREACHABLE_PRESET'); }
  // FEA-036 through the engine, on the collected reasons
  const ordered = [...reasons].sort((a, b) => REASON_ORDER.indexOf(a) - REASON_ORDER.indexOf(b));
  (feasRoot as Record<string, Value>).reasons = ordered;
  const ctx2 = evalContext(spec, { ...roots, feas: feasRoot as unknown as Value, event: openRecord({ type: 'reasons_collected' }) }, gate.overrides, helpers);
  const v = runRecords([spec.rules.get('FEA-036')], ctx2);
  const ve = v.effects.find(e => e.op === 'set_verdict');
  let verdict: Verdict = (ve && typeof ve.value === 'string' ? ve.value : 'feasible') as Verdict;
  // FEA-013/FEA-012/FEA-024 floors: verdict at least stretch when ANCHOR_UNKNOWN fired
  if (verdict === 'feasible' && ordered.some(r => reasonClass(r) === 'stretch')) verdict = 'stretch';
  fired.push({ stage: 'S3', rule_id: 'FEA-036', op: 'set_verdict', value: verdict });
  if (run1.errors.length) for (const e of run1.errors) fired.push({ stage: 'S3', rule_id: e.id, op: 'error', value: e.why.slice(0, 200) });

  return {
    verdict, reasons: ordered, labels: [...labels].sort(), horizon, W, weeks_needed, G: Number.isFinite(G) ? G : -1, slack, K_key, K_all,
    band, demand, layout, fill_capacity_s, fired, messages, dryRunHistory: hist,
  };
  void roundDown; void RACE_M;
}

export function ratioOf(spec: Spec, dist: string): number {
  const r = pval<number | Record<string, number>>(spec, 'race.longest_ratio_max.' + dist);
  return typeof r === 'number' ? r : r.method_default;
}

export type { CurveWeek };

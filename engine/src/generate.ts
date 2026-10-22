// The generator: result = f(input) (07 §2, 12 §3.7). S0 → S1 → S2 → S3/S4 → S5 → S6/S7 → S8 ⇄ S8r → S9 → S10.
// Pure: no clock, no randomness, no I/O. The spec bundle (rules.json + parameters.json) is passed in.
import type { GeneratorInput, Goal, Plan, Phase, Session } from './model/types.ts';
import { type Spec, pnum, pval, roundUp } from './context.ts';
import { canonical } from './util/canonical.ts';
import { sha256Hex } from './util/sha256.ts';
import { addDays, daysBetween, WEEKDAYS } from './util/dates.ts';
import { deriveState, type DerivedState, NODES } from './pipeline/state.ts';
import { runGate, scalar, type FiredRule, type GateResult } from './pipeline/gate.ts';
import { assess, availability, type Availability, type Feasibility } from './pipeline/feasibility.ts';
import { buildWeeks } from './pipeline/sessions.ts';
import { RACE_M } from './pipeline/demand.ts';
import { validate, type ValidationReport, type ValidatorView } from './validate/validator.ts';
import { repairOne, type LedgerEntry } from './validate/repair.ts';
import type { MessageInstance } from './model/types.ts';

export type ResultKind = 'plan' | 'fail_closed' | 'gate_stop' | 'hold' | 'safe_state';
export interface Result { [k: string]: unknown; kind: ResultKind }

interface Core {
  kind: ResultKind; gate?: GateResult; st?: DerivedState; feas?: Feasibility; plan?: Plan; validation?: ValidationReport; ledger: LedgerEntry[];
  fired: FiredRule[]; messages: MessageInstance[]; hold?: { rule_ids: string[]; questions: string[] }; error?: { rule_id: string; detail: string };
}

const HEADLINE = (verdict: string, reasons: string[], goalType: string): 'ambitious' | 'tight' | 'uncertain' | null => {
  if (verdict !== 'stretch') return null;
  const amb = ['TARGET_IN_FAST_BAND', 'TARGET_BEYOND_CURRENT', ...(goalType === 'time' ? ['LONG_RUN_TIME_CAPPED'] : [])];
  if (reasons.some(r => amb.includes(r))) return 'ambitious';
  if (reasons.some(r => ['LOW_SLACK', 'DEGRADED_COMPLETION', 'CUTOFF_AT_RISK'].includes(r))) return 'tight';
  return 'uncertain';
};

function phasesOf(ph: string[]): Phase[] {
  const out: Phase[] = [];
  ph.forEach((p, i) => { const last = out.at(-1); if (last && last.type === p) last.n_weeks++; else out.push({ type: p as Phase['type'], start_week: i + 1, n_weeks: 1, season_index: 0 }); });
  return out;
}

/** LOD-070: the return ladder's exit week volume and longest session (null when there is no return ladder). */
function rtrExit(feas: Feasibility): { V: number | null; L: number | null } {
  const L = feas.layout;
  if (!L || L.ladderKind !== 'rtr' || !L.ladder.length) return { V: null, L: null };
  const last = L.ladder.slice(-L.ladderRunsPerWeek);
  return { V: last.reduce((a, x) => a + x.total_s, 0), L: Math.max(...last.map(x => x.total_s)) };
}

function validatorView(spec: Spec, input: GeneratorInput, st: DerivedState, gate: GateResult, feas: Feasibility, plan: Plan): ValidatorView {
  const runs = feas.layout?.runs ?? 3;
  const ladderWeeks = (feas.layout?.phases ?? []).filter(p => p === 'START_LADDER').length;
  return {
    input, gate: gate.gate,
    state: {
      // Q-E21: an undefined L30 (return ladder) is replaced by the entry rung's session time, dated the day before the plan
      L30_eff_time_s: st.L30_source === 'undefined_rtr' && feas.layout?.ladder.length ? feas.layout.ladder[0].total_s : st.L30_eff_time_s,
      L30_eff_dist_m: st.L30_eff_dist_m, L30_source: st.L30_source === 'undefined_rtr' ? 'claim' : st.L30_source,
      V_hold_s: rtrExit(feas).V ?? st.V_hold_s, L_hold_s: rtrExit(feas).L ?? st.L_hold_s,
      tol_level: st.levels.TOL, tol_confidence: st.level_confidence.TOL, levels: { ...st.levels },
      ladderEndDate: ladderWeeks ? addDays(plan.plan_start, 7 * ladderWeeks) : null, max_tolerated_g_h: null,
      profileByWeek: (feas.layout?.curve ?? []).map(c => c.profile ?? 'slow'), age_low: st.age_low, age_high: st.age_high,
      logged: st.entries.filter(e => e.is_run && e.measured && !e.flagged).map(e => ({ date: e.date, duration_s: e.duration_s, distance_m: e.distance_m ?? null })),
    },
    // INV-25 binds a goal race's long-run demand; a goal-free H0 plan has none
    demand: { L_req_time_s: feas.demand.family === 'base' ? 0 : feas.demand.L_req_time_s, floor_dist_m: feas.demand.floor_dist_m, met_by_logged_distance: feas.demand.met_by_logged_distance, family: feas.demand.family, distance: input.goal.distance, time_cap_s: feas.demand.time_cap_s, runs },
    anchor: st.anchor ? { confidence: st.anchor.confidence, date: st.anchor.date } : null,
  };
  void pnum;
}

/** S0–S8r for one goal (also the nested run of each S9 option, 12 §3.7 step 5). */
function core(spec: Spec, input: GeneratorInput, nested: boolean): Core {
  const fired: FiredRule[] = [];
  const messages: MessageInstance[] = [];
  const ledger: LedgerEntry[] = [];
  // ---- S0: INP-001 — fields that offer no "I don't know" block progress until answered (birth month/year)
  const missing: string[] = [];
  if (input.profile.birth_month == null) missing.push('profile.birth_month');
  if (input.profile.birth_year == null) missing.push('profile.birth_year');
  if (missing.length) return { kind: 'hold', ledger, fired: [{ stage: 'S0', rule_id: 'INP-001', op: 'ask', target: missing.join(',') }], messages: [{ id: 'MSG-INP-AGE', rule_id: 'INP-002' }], hold: { rule_ids: ['INP-001', 'INP-002'], questions: missing } };
  const av = availability(spec, input);
  // ---- S2 (derived state; S1 reads it) and S1 gate
  const st = deriveState(spec, input);
  fired.push(...st.fired);
  let gate = runGate(spec, input, st);
  fired.push(...gate.fired);
  for (const m of gate.messages) messages.push({ id: m.id, rule_id: m.rule_id });
  if (gate.holds.length || gate.asks.length) return { kind: 'hold', gate, st, ledger, fired, messages: [...messages, { id: 'MSG-SAF-QUESTIONS' }], hold: { rule_ids: [...gate.holds, ...gate.asks].sort(), questions: gate.questions } };
  if (gate.errors.length) return { kind: 'safe_state', gate, st, ledger, fired, messages: [{ id: 'MSG-SAF-HOLD' }], error: { rule_id: gate.errors[0].id, detail: gate.errors[0].why } };
  if (gate.gate === 'pause_until_clearance' || gate.gate === 'no_plan') {
    fired.push({ stage: 'S1', rule_id: 'GEN-001', op: 'block_sessions', value: gate.gate });
    // GEN-001 / INV-24: only generic professional-contact text in a stop
    const generic = messages.filter(m => /^MSG-(SAF|SCR)-/.test(m.id));
    return { kind: 'gate_stop', gate, st, ledger, fired, messages: generic.length ? generic : [{ id: 'MSG-SAF-001', rule_id: 'GEN-001' }] };
  }
  // ---- S3/S4: feasibility, phases (dry run)
  let feas = assess(spec, input, st, gate, av);
  fired.push(...feas.fired);
  for (const m of feas.messages) messages.push({ id: m.id, rule_id: m.rule_id });
  if (feas.verdict === 'infeasible' || !feas.layout) {
    fired.push({ stage: 'S9', rule_id: 'GEN-003', op: 'fail_closed' });
    return { kind: 'fail_closed', gate, st, feas, ledger, fired, messages };
  }
  // ---- S5 template: method_default only in the MVP (LOD-021 ledger entry when another preset was asked for)
  if (input.profile.preset_preference && input.profile.preset_preference !== 'method_default') {
    ledger.push({ week_index: 1, session_id: null, field: 'preset_id', template_value: input.profile.preset_preference, plan_value: 'method_default', rule_id: 'LOD-021', criterion: 'MVP: only method_default is active' });
  }
  // ---- S6/S7 weeks and sessions, with the S1 fixpoint for rules that read the plan (SAF-060)
  let built = build(spec, input, st, gate, feas, av, fired);
  const regate = runGate(spec, input, st, built.plan.weeks.flatMap(w => w.sessions) as never);
  if (regate.gate !== gate.gate && (regate.gate === 'proceed_restricted' || regate.gate === 'pause_until_clearance' || regate.gate === 'no_plan')) {
    gate = regate;
    fired.push(...regate.fired.filter(f => f.rule_id === 'SAF-060'));
    if (gate.gate !== 'proceed_restricted') return { kind: 'gate_stop', gate, st, ledger, fired, messages: [{ id: 'MSG-SAF-060', rule_id: 'SAF-060' }] };
    feas = assess(spec, input, st, gate, av);
    if (feas.verdict === 'infeasible' || !feas.layout) return { kind: 'fail_closed', gate, st, feas, ledger, fired, messages };
    built = build(spec, input, st, gate, feas, av, fired);
  }
  const plan = built.plan;
  // ---- S8 validate ⇄ S8r repair (07 §2c)
  const view = validatorView(spec, input, st, gate, feas, plan);
  let report = validate(spec, view, plan);
  let passes = 0;
  const maxPasses = pnum(spec, 'repair.max_passes');
  while (!report.pass && passes < maxPasses && !report.errors.length) {
    passes++;
    const first = report.violations[0].date;
    const today = report.violations.filter(v => v.date === first);
    let changed = false;
    const blocked = new Set(input.profile.blocked_dates ?? []);
    const vh = validatorHelpers(spec, view, plan);
    for (const v of today) {
      const by = repairOne({ spec, plan, availableDays: av.days, blocked, l30Time: vh.l30Time, l30Dist: vh.l30Dist, presetCap: vh.presetCap }, v, ledger, fired);
      v.repaired_by = by;
      if (by) changed = true;
    }
    report = validate(spec, view, plan);
    report.passes_used = passes;
    if (!changed) break;
  }
  if (!report.pass) {
    fired.push({ stage: 'S9', rule_id: 'GEN-003', op: 'fail_closed', value: 's8r_exhausted' });
    return { kind: 'fail_closed', gate, st, feas, plan, validation: report, ledger, fired, messages };
  }
  void nested;
  return { kind: 'plan', gate, st, feas, plan, validation: report, ledger, fired, messages };
}

/** Helper bundle the repair methods use (validator-side definitions, 07 §5a). */
function validatorHelpers(spec: Spec, v: ValidatorView, plan: Plan) {
  const planned = () => plan.weeks.flatMap(w => w.sessions).filter(s => s.is_run && !s.is_goal_race);
  const l30 = (d: string, f: 'time' | 'dist') => {
    let m = 0;
    const win = (x: string) => { const k = daysBetween(x, d); return k >= 1 && k <= 30; };
    if (v.state.L30_source === 'claim' && win(addDays(v.input.today, -1))) m = f === 'time' ? v.state.L30_eff_time_s : (v.state.L30_eff_dist_m ?? 0);
    for (const e of v.state.logged) if (win(e.date)) m = Math.max(m, f === 'time' ? e.duration_s : (e.distance_m ?? 0));
    for (const s of planned()) if (win(s.date)) m = Math.max(m, f === 'time' ? s.planned_duration_s : (s.planned_distance_m ?? 0));
    return m;
  };
  const presetCap = (w: Plan['weeks'][number]) => {
    const pct = v.demand.family === 'road_classic' ? 0.5 : 0.4;
    return Math.min(Math.max(pct * w.planned_time_s, pnum(spec, 'lr.pct_floor_s')), v.demand.time_cap_s);
  };
  return { l30Time: (d: string) => l30(d, 'time'), l30Dist: (d: string) => l30(d, 'dist'), presetCap };
}

function build(spec: Spec, input: GeneratorInput, st: DerivedState, gate: GateResult, feas: Feasibility, av: Availability, fired: FiredRule[]) {
  const L = feas.layout!;
  const ladderWeeks = L.phases.filter(p => p === 'START_LADDER').length;
  // Levels for eligibility: day-0 levels; the start ladder credits HAB L2 after it (02 §2). Projection raises no other level.
  const levels = { ...st.levels };
  if (ladderWeeks) levels.HAB = Math.max(levels.HAB, 2);
  // ladder weeks are fixed by the ladder; every later week sees the ladder credit
  const b = buildWeeks({ spec, input, st, gate, feas, layout: L, av, fired, levels });
  // load ordinals and week-in-phase indices (INV-04 parent_week matching)
  const ord = new Map<string, number>();
  b.weeks.forEach((w, i) => {
    ord.set(w.load_kind, (ord.get(w.load_kind) ?? 0) + 1); w.load_ordinal = ord.get(w.load_kind)!;
    w.phase_week_index = i > 0 && b.weeks[i - 1].phase === w.phase ? b.weeks[i - 1].phase_week_index + 1 : 1;
  });
  const sessions: Session[] = b.weeks.flatMap(w => w.sessions);
  const runs = sessions.filter(s => s.is_run && !s.is_goal_race);
  const preTaper = b.weeks.filter(w => !w.taper_k && !w.is_deload && !['start_ladder', 'rtr'].includes(w.load_kind));
  const ref = preTaper.at(-1);
  const g = input.goal;
  const plan: Plan = {
    id: '', version: (input.parent_plan?.version ?? 0) + 1, parent_plan_id: input.parent_plan?.id ?? null, goal_id: g.id, preset_id: 'method_default',
    status: 'active', degraded: false, pace_mode: sessions.some(s => s.pace_range) ? 'paced' : 'effort_only', plan_start: L.planStart,
    race_date: g.race_date ?? null, W: feas.W ?? L.phases.length, horizon: feas.horizon, published_until: addDays(input.today, pnum(spec, 'replan.published_days')),
    phases: phasesOf(L.phases), taper_weeks_n: L.phases.filter(p => p === 'TAPER').length, v_ref_s: ref?.planned_time_s ?? null, lr_ref_s: ref?.lr_s ?? null,
    pre_taper_runs: b.pre_taper_runs || null, pre_taper_had_e3: b.pre_taper_had_e3, peak_lr_s: Math.max(0, ...runs.map(s => s.planned_duration_s)),
    peak_lr_dist_m: null, race_fuel_g_h: null, drink_ml_h: null, weeks: b.weeks,
  };
  for (const s of sessions) s.in_published_window = s.date <= plan.published_until;
  return { plan };
}

// ---------------------------------------------------------------- S9 options (07 §6.2, 03 §6, FEA-040/041)
function optionInputs(spec: Spec, input: GeneratorInput, feas: Feasibility, st: DerivedState): { kind: string; input: GeneratorInput; change?: Record<string, unknown> }[] {
  const out: { kind: string; input: GeneratorInput; change?: Record<string, unknown> }[] = [];
  const reasons = feas.reasons;
  const avail = reasons.filter(r => r.startsWith('AVAILABILITY'));
  const other = reasons.filter(r => !r.startsWith('AVAILABILITY') && r !== 'LOW_FREQ');
  const clone = (): GeneratorInput => JSON.parse(JSON.stringify(input));
  // 03 §6 lower bound of the date search: today + total weeks needed + feas.stretch_margin_weeks
  const wn = feas.weeks_needed;
  const need = wn.rtr + Math.max(wn.base >= 999 ? 0 : wn.base, wn.onboard - wn.rtr) + wn.build + wn.specific + wn.taper + pnum(spec, 'feas.stretch_margin_weeks');
  const k0 = Math.max(1, need - (feas.W ?? 0));
  const withDate = (inp: GeneratorInput, d: string) => { inp.goal = { ...inp.goal, race_date: d }; return inp; };
  // change_availability (+ move_date): the exact extra minutes and/or the day to add
  if (avail.length) {
    const ch = clone();
    const change: Record<string, unknown> = {};
    if (avail.includes('AVAILABILITY_TIME')) {
      const extra = roundUp(feas.demand.V_req_time_s / 60 - (input.profile.available_minutes_per_week ?? 0), 10);
      ch.profile.available_minutes_per_week = (input.profile.available_minutes_per_week ?? 0) + extra;
      change.extra_minutes_per_week = extra;
    }
    if (avail.includes('AVAILABILITY_DAYS')) {
      const have = new Set(input.profile.available_days ?? []);
      // the day that spaces the run days best (largest smallest gap around the week), earliest on ties
      const free = WEEKDAYS.filter(d => !have.has(d));
      const minGap = (ds: string[]) => { const ix = ds.map(d => WEEKDAYS.indexOf(d as (typeof WEEKDAYS)[number])).sort((a, b) => a - b); let g = 7; for (let i = 0; i < ix.length; i++) g = Math.min(g, ((ix[(i + 1) % ix.length] - ix[i] + 7) % 7) || 7); return g; };
      const pick = [...free].sort((a, b) => minGap([...have, b]) - minGap([...have, a]) || WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))[0];
      if (pick) { ch.profile.available_days = [...(input.profile.available_days ?? []), pick].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)); ch.profile.max_runs_per_week = Math.max(input.profile.max_runs_per_week ?? 0, ch.profile.available_days.length); change.add_day = pick; }
    }
    out.push({ kind: 'change_availability', input: ch, change });
    if (other.length && input.goal.race_date) {
      for (let k = k0; k <= pnum(spec, 'goal.date_search_max_weeks'); k++) out.push({ kind: 'change_availability+move_date', input: withDate(JSON.parse(JSON.stringify(ch)), addDays(input.goal.race_date, 7 * k)), change });
    }
  }
  // move_date: skipped when the only reasons are ones a later date cannot fix
  const dateCannotFix = reasons.every(r => ['TARGET_OUTSIDE_BAND', 'AVAILABILITY_TIME', 'AVAILABILITY_DAYS', 'LONG_RUN_UNREACHABLE_PRESET', 'LOW_FREQ'].includes(r));
  // growth that never reaches its targets (dry run G = ∞) does not depend on the date: a later date cannot fix it
  if (!dateCannotFix && input.goal.race_date && feas.G >= 0) {
    for (let k = k0; k <= pnum(spec, 'goal.date_search_max_weeks'); k++) out.push({ kind: 'move_date', input: withDate(clone(), addDays(input.goal.race_date, 7 * k)) });
  }
  // lower_goal: only for TARGET_* or LEVELS_UNREACHABLE (F-28)
  if (reasons.some(r => r.startsWith('TARGET_') || r === 'LEVELS_UNREACHABLE')) {
    if (input.goal.goal_type === 'time' && feas.band) {
      const t = clone(); t.goal = { ...t.goal, target_time_s: roundUp(feas.band.P_race_s, pnum(spec, 'pred.round_s')) }; out.push({ kind: 'lower_goal', input: t });
    }
    if (input.goal.goal_type === 'time') { const f = clone(); f.goal = { ...f.goal, goal_type: 'finish', target_time_s: null }; out.push({ kind: 'lower_goal', input: f }); }
  }
  // shorter_distance: next shorter distances on the original date, same goal type
  const order = ['100K', '50K', 'M', 'HM', '10K', '5K'];
  const i = order.indexOf(input.goal.distance);
  if (i >= 0) for (const d of order.slice(i + 1)) {
    const s = clone();
    s.goal = { ...s.goal, distance: d as Goal['distance'], target_time_s: input.goal.goal_type === 'time' && feas.band && st.anchor ? roundUp(st.anchor.time_s * Math.pow(RACE_M[d] / st.anchor.distance_m, 1.06) * 0.98, 60) : s.goal.target_time_s };
    out.push({ kind: 'shorter_distance', input: s });
  }
  // base_plan (H0)
  const b = clone(); b.goal = { ...b.goal, distance: 'none', goal_type: 'base', target_time_s: null, race_date: null };
  out.push({ kind: 'base_plan', input: b });
  return out;
}

function generateOptions(spec: Spec, input: GeneratorInput, feas: Feasibility, st: DerivedState, fired: FiredRule[]) {
  const max = pnum(spec, 'repair.max_options');
  const options: Record<string, unknown>[] = [];
  const doneKinds = new Set<string>();
  const stopKinds = new Set<string>();
  for (const cand of optionInputs(spec, input, feas, st)) {
    if (options.length >= max) break;
    if (doneKinds.has(cand.kind) && cand.kind !== 'lower_goal') continue;              // first passing candidate per kind
    if (cand.kind === 'change_availability+move_date' && doneKinds.has('change_availability')) continue;
    if (stopKinds.has(cand.kind)) continue;
    const r = core(spec, cand.input, true);
    const ok = r.kind === 'plan' && r.feas && r.feas.verdict !== 'infeasible' && r.validation?.pass;
    if (!ok) {
      // a later date cannot fix these reasons (03 §6): stop searching dates once a candidate shows only them
      if ((cand.kind === 'move_date' || cand.kind === 'change_availability+move_date') && r.feas && r.feas.reasons.length
        && (r.feas.reasons.every(x => ['TARGET_OUTSIDE_BAND', 'AVAILABILITY_TIME', 'AVAILABILITY_DAYS', 'LONG_RUN_UNREACHABLE_PRESET', 'LOW_FREQ', 'MINOR_DISTANCE'].includes(x)) || r.feas.G < 0)) stopKinds.add(cand.kind);
      continue;                                                                         // FEA-041: never shown unless it validates
    }
    doneKinds.add(cand.kind);
    if (cand.kind === 'lower_goal') doneKinds.add('lower_goal');
    r.plan!.id = planId(spec, cand.input);
    options.push({
      rank: options.length + 1, kind: cand.kind, new_goal: cand.input.goal, availability_change: cand.change ?? null, preset_id: 'method_default',
      explanation: { id: 'MSG-FEA-NO', rule_id: 'FEA-040' }, verdict: r.feas!.verdict, reasons: r.feas!.reasons, plan: r.plan,
    });
    fired.push({ stage: 'S9', rule_id: 'FEA-040', binding: `option:${options.length}`, op: 'generate_options', value: cand.kind });
  }
  return options;
}

/** Plan id: sha256 of the canonical serialisation of {input, ruleset_version, registry_version} (result.schema.json). */
function planId(spec: Spec, input: GeneratorInput): string { return sha256Hex(canonical({ input, ruleset_version: spec.rulesVersion, registry_version: spec.registryVersion })); }

// ---------------------------------------------------------------- S10 emit
function feasibilityOut(feas: Feasibility, input: GeneratorInput, options?: Record<string, unknown>[]) {
  const d = feas.demand, b = feas.band;
  const target = input.goal.target_time_s;
  return {
    goal_id: input.goal.id, verdict: feas.verdict, headline: HEADLINE(feas.verdict, feas.reasons, input.goal.goal_type), horizon: feas.horizon, weeks_available: feas.W,
    weeks_needed: { ...feas.weeks_needed, G: Math.max(0, feas.G), K: feas.K_all, K_key: feas.K_key }, slack: feas.W === null ? null : feas.slack,
    reasons: feas.reasons, reason_details: feas.reasons.map(r => ({ id: 'MSG-WHY-FEA', placeholders: { reason: { type: 'text', value: r } } })),
    labels: feas.labels.filter(l => ['ESTIMATED_INPUTS', 'LOW_VOLUME_PREDICTION', 'LONG_RUN_TIME_CAPPED'].includes(l)),
    predicted_band: b ? {
      model_id: b.model, point_s: Math.round(b.P_s), p_race_s: Math.round(b.P_race_s), fast_edge_s: Math.round(b.fast_edge_s), slow_edge_s: Math.round(b.slow_edge_s),
      b_fast: b.B_fast, b_slow: Math.round(b.B_slow * 1e6) / 1e6, inputs_used: [b.anchor_id], confidence: input.anchors.find(a => a.id === b.anchor_id)?.kind === 'recalled' ? 'estimated' : 'estimated',
      target_where: target == null ? null : target < b.fast_edge_s ? 'faster' : target > b.slow_edge_s ? 'slower' : 'inside',
    } : null,
    demand: d.family === 'base' ? null : {
      preset_id: d.preset, L_req_time_s: Math.round(d.L_req_time_s), floor_dist_m: Math.round(d.floor_dist_m), distance_stop_m: d.dist_stop_m, V_req_time_s: Math.round(d.V_req_time_s),
      runs_req: d.runs_req, required_levels: d.required_levels, expected_race_duration_s: Math.round(d.expected_duration_s), met_by_logged_distance: d.met_by_logged_distance, credited: false,
    },
    interim_target_s: null,
    ...(options ? { options, alternative_option: null } : {}),
  };
}

function stateOut(st: DerivedState, gate: GateResult, input: GeneratorInput) {
  return {
    as_of: input.today, log_status: st.log_status, L30_eff_time_s: st.L30_eff_time_s, L30_eff_dist_m: st.L30_eff_dist_m,
    L30_source: st.L30_source === 'log' ? 'log_rich' : st.L30_source === 'claim' ? 'log_sparse_claim' : 'undefined_rtr',
    V28_time_s: Math.round(st.V28_time_s), V28_week_s: Math.round(st.V28_time_s), V_hold_s: st.V_hold_s, L_hold_s: st.L_hold_s, days_since_last_run: st.days_since_last_run,
    age_low: st.age_low(input.today) ?? 0, age_high: st.age_high(input.today) ?? 0, tol_tier: st.tol_tier, tol_confidence: st.level_confidence.TOL,
    progression_profile: st.slow_ctx.length || st.slow_log ? 'slow' : 'standard', baseline_confirmed: st.baseline_confirmed,
    levels: NODES.filter(n => st.levels[n] > 0).map(n => ({ node: n, level: st.levels[n], confidence: st.level_confidence[n], source: st.level_confidence[n] === 'measured' ? 'log_threshold' : 'self_report' })),
    s_slow_m_s: Math.round(st.s_slow * 1e6) / 1e6, effort_ceiling: gate.gate === 'proceed_restricted' ? 'E2' : gate.effortCeiling, max_tolerated_g_h: null,
  };
}

function engineStateOut(input: GeneratorInput, st: DerivedState | undefined, feas: Feasibility | undefined, plan: Plan | undefined) {
  const prev = input.engine_state ?? {};
  return {
    ...prev, as_of: input.today, plan_version: plan?.version ?? prev.plan_version ?? 0,
    progression_profile_until: prev.progression_profile_until ?? (st && st.slow_log ? addDays(input.today, 7 * st.probation_weeks_left) : null),
    rich_weeks_consecutive: prev.rich_weeks_consecutive ?? 0, baseline_confirmed: st?.baseline_confirmed ?? prev.baseline_confirmed ?? false,
    est_confirm_weeks: st?.est_confirm_weeks ?? prev.est_confirm_weeks ?? 0,
    ladder: prev.ladder ?? (feas?.layout?.ladderKind ? { kind: feas.layout.ladderKind, rung_index: feas.layout.ladderKind === 'start' ? 1 : 1, floor_rung: feas.layout.ladderKind === 'start' ? 1 : 1, start: feas.layout.planStart, entry_reason: feas.layout.ladderKind === 'start' ? 'never_run' : 'gap', counted_session_ids: [], unclean_weeks_on_rung: 0, backfill_advance_dates: [] } : null),
    active_anchor_id: st?.anchor?.confidence === 'measured' ? st.anchor.id : (prev.active_anchor_id ?? null),
    pace_anchor_10k_equiv_s: st?.anchor?.confidence === 'measured' ? Math.round(st.anchor.equiv_10k_s) : (prev.pace_anchor_10k_equiv_s ?? null),
    last_verdict: feas?.verdict ?? prev.last_verdict ?? null,
  };
}

function firedOut(f: FiredRule[]) {
  return f.filter(x => /^([A-Z]{3}-[0-9]{3}|INV-[0-9]{2})$/.test(x.rule_id) && /^(S[0-9]+r?|S7\.[1-8]|on_entry|on_event)$/.test(x.stage)).map(x => {
    const o: Record<string, unknown> = { stage: x.stage, rule_id: x.rule_id, op: x.op };
    if (x.binding) o.binding = x.binding;
    if (x.target) o.target = x.target;
    const v = scalar(x.value as never);
    if (v !== undefined) o.value = typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v;
    if (x.applied !== undefined) o.applied = x.applied;
    return o;
  });
}

function planMessages(feas: Feasibility, input: GeneratorInput, plan?: Plan): MessageInstance[] {
  const out: MessageInstance[] = [];
  if (feas.verdict === 'stretch') out.push({ id: 'MSG-FEA-STRETCH', layer: 'card', rule_id: 'FEA-036' });
  if (feas.verdict === 'infeasible') out.push({ id: 'MSG-FEA-NO', layer: 'card', rule_id: 'FEA-036' });
  if (feas.labels.includes('ESTIMATED_INPUTS')) out.push({ id: 'MSG-FEA-ESTIMATED', layer: 'card', rule_id: 'FEA-035' });
  if (feas.band && input.goal.goal_type === 'time') out.push({ id: 'MSG-FEA-BAND', layer: 'card', rule_id: 'FEA-010', placeholders: {
    fast_edge: { type: 'time', value: Math.round(feas.band.fast_edge_s) }, point: { type: 'time', value: Math.round(feas.band.P_race_s) }, slow_edge: { type: 'time', value: Math.round(feas.band.slow_edge_s) } } });
  if (plan && plan.pace_mode === 'effort_only' && plan.phases.some(p => p.type === 'ONBOARD')) out.push({ id: 'MSG-ONBOARD-NOPACE', layer: 'card' });
  return out;
}

export function generate(spec: Spec, input: GeneratorInput): Result {
  const r = core(spec, input, false);
  const base: Result = {
    schema_version: 'v5.2', kind: r.kind, ruleset_version: spec.rulesVersion, registry_version: spec.registryVersion, today: input.today,
    messages: [] as MessageInstance[], fired_rules: [], engine_state: engineStateOut(input, r.st, r.feas, r.plan), flags: input.flags,
  };
  const dedupe = (ms: MessageInstance[]) => { const seen = new Set<string>(); return ms.filter(m => { const k = m.id; if (seen.has(k)) return false; seen.add(k); return true; }); };
  if (r.kind === 'hold') { base.hold = r.hold; base.previous_plan_kept = input.parent_plan != null; base.messages = dedupe(r.messages); base.fired_rules = firedOut(r.fired); return base; }
  if (r.kind === 'safe_state') { base.error = r.error; base.previous_plan_kept = input.parent_plan != null; base.messages = dedupe(r.messages); base.fired_rules = firedOut(r.fired); return base; }
  base.gate = r.gate!.gate;
  if (r.kind === 'gate_stop') { base.messages = dedupe(r.messages); base.fired_rules = firedOut(r.fired); return base; }
  const feas = r.feas!;
  if (r.kind === 'fail_closed') {
    const fired = [...r.fired];
    // a plan that failed validation fails closed as infeasible (GEN-003); its options are built from the original goal
    if (feas.verdict !== 'infeasible') { feas.verdict = 'infeasible'; }
    const options = generateOptions(spec, input, feas, r.st!, fired);
    base.feasibility = feasibilityOut(feas, input, options);
    base.previous_plan_kept = input.parent_plan != null;
    if (r.validation) base.validation = { pass: r.validation.pass, passes_used: r.validation.passes_used, violations: r.validation.violations.map(({ date, ...v }) => ({ ...v, repaired_by: v.repaired_by ?? null })) };
    base.messages = dedupe([...planMessages(feas, input), ...r.messages]);
    base.fired_rules = firedOut(fired);
    base.state = stateOut(r.st!, r.gate!, input);
    return base;
  }
  const plan = r.plan!;
  plan.id = planId(spec, input);
  base.plan = plan;
  base.feasibility = feasibilityOut(feas, input);
  base.validation = { pass: r.validation!.pass, passes_used: r.validation!.passes_used, violations: [] };
  base.ledger = r.ledger;
  base.state = stateOut(r.st!, r.gate!, input);
  base.messages = dedupe([...planMessages(feas, input, plan), ...r.messages]);
  base.fired_rules = firedOut(r.fired);
  return base;
}

export { pval };

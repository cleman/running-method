// S1 Safety gate (07 §2; 01, 10): the S1 records of rules.json evaluated by the rule engine, per their scope (12 §3.5).
import type { GeneratorInput, Gate } from '../model/types.ts';
import { type Value, U, isU } from '../expr/eval.ts';
import { type Effect, type RuleRecord, runRecords, composeTarget, mostRestrictiveGate } from '../rules/engine.ts';
import { levelHelpers } from '../rules/helpers.ts';
import { type Spec, evalContext, openRecord } from '../context.ts';
import { addDays, daysBetween, type ISODate } from '../util/dates.ts';
import type { DerivedState } from './state.ts';

export interface FiredRule { stage: string; rule_id: string; binding?: string; op: string; target?: string; value?: number | string | boolean | null; applied?: boolean }

export interface GateResult {
  gate: Gate;
  holds: string[]; asks: string[]; questions: string[];
  errors: { id: string; why: string }[];
  overrides: Record<string, unknown>;
  slowRules: string[];
  effortCeiling: string;
  reasons: string[];
  messages: { id: string; rule_id: string }[];
  startLadder: boolean;
  fired: FiredRule[];
}

/** Apply input.declared_unknown (paths such as profile.birth_year, event[0].C1) to a deep copy of the input: those values become U. */
export function withDeclaredUnknowns(input: GeneratorInput): { input: GeneratorInput; eventUnknown: Map<number, Set<string>> } {
  const copy = JSON.parse(JSON.stringify(input)) as GeneratorInput;
  const eventUnknown = new Map<number, Set<string>>();
  for (const path of input.declared_unknown ?? []) {
    const m = /^event\[(\d+)\]\.(.+)$/.exec(path);
    if (m) { const i = Number(m[1]); if (!eventUnknown.has(i)) eventUnknown.set(i, new Set()); eventUnknown.get(i)!.add(m[2]); continue; }
    const parts = path.split('.');
    let o: any = copy;
    for (let k = 0; k < parts.length - 1 && o; k++) o = o[parts[k] === 'screen' ? 'screening' : parts[k]];
    if (o && typeof o === 'object') o[parts.at(-1)!] = U;
  }
  return { input: copy, eventUnknown };
}

export function specialStatus(input: GeneratorInput, d: ISODate): { type: string; start: ISODate | null; due: ISODate | null } {
  const ss = [...(input.profile.special_status ?? [])].filter(s => s.start_date <= d).sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  return ss ? { type: ss.type, start: ss.start_date, due: ss.due_date ?? null } : { type: 'none', start: null, due: null };
}

/** Roots shared by S1 and later stages (profile, screen, claim, goal, flags). */
export function commonRoots(input: GeneratorInput, st: DerivedState): Record<string, Value> {
  const sc = input.screening;
  const answers = sc.answers ?? {};
  const items = Object.keys(answers).sort();
  const complete = sc.completed_on != null && items.length > 0 && items.every(q => answers[q] !== null && !isU(answers[q] as Value));
  const ss = specialStatus(input, input.today);
  const pr = input.profile;
  const g = input.goal;
  const distKm: Record<string, number> = { '5K': 5, '10K': 10, HM: 21.0975, M: 42.195, '50K': 50, '100K': 100 };
  const flagsActive = input.flags.filter(f => f.status === 'active');
  return {
    today: input.today,
    profile: {
      ...pr, special_status: ss.type, special_status_start: ss.start, due_date: ss.due,
      has_given_birth: (pr.special_status ?? []).find(s => s.type === 'pregnant')?.has_given_birth ?? null,
      saf031_attested_on: (pr.attestations ?? []).find(a => a.msg_id === 'MSG-SAF-031')?.attested_on ?? null,
      saf033_attested_on: (pr.attestations ?? []).find(a => a.msg_id === 'MSG-SAF-033')?.attested_on ?? null,
      level_tests_opt_out: pr.level_tests_opt_out ?? false,
    } as unknown as Value,
    screen: {
      ...sc, complete, items, valid_until: sc.valid_until ?? (sc.completed_on ? addDays(sc.completed_on, 365) : null),
      guardian_clearance_on: (sc as Record<string, unknown>).guardian_clearance_on ?? null,
      followup_directs_evaluation: false,
    } as unknown as Value,
    claim: { ...input.claim, agegrade_pct: null, time_distance_inconsistent: false } as unknown as Value,
    goal: { ...g, distance_km: distKm[g.distance] ?? null, edits: input.goal_edits ?? [] } as unknown as Value,
    flags: { active: flagsActive, cleared: input.flags.filter(f => f.status === 'cleared'), all: input.flags } as unknown as Value,
    log: { entries: st.entries } as unknown as Value,
  };
}

export function stateRoot(input: GeneratorInput, st: DerivedState, extra: Record<string, Value> = {}): Record<string, Value> {
  const sc = input.screening;
  const answers = sc.answers ?? {};
  const factor = sc.item_factor ?? {};
  const yes = (f: string) => Object.keys(answers).some(q => answers[q] === true && factor[q] === f);
  const sym = sc.current_symptoms ?? {};
  const levels = { ...st.levels } as Record<string, Value>;
  return {
    log_status: st.log_status, days_since_last_run: st.days_since_last_run, age_low: st.age_low(input.today), age_high: st.age_high(input.today),
    scr_symptom: yes('symptom'), scr_disease_inactive: yes('known_disease') && (input.claim.runs_per_week ?? 0) < 3,
    current_symptom: Object.values(sym).some(v => v === true),
    levels, level_confidence: { ...st.level_confidence } as unknown as Value, tol_tier: st.tol_tier, tol_level: st.levels.TOL,
    tol_confidence: st.level_confidence.TOL,
    L30_eff_time_s: st.L30_eff_time_s, L30_eff_dist_m: st.L30_eff_dist_m, V28_time_s: st.V28_time_s, V28_dist_m: st.V28_dist_m,
    V28_week_s: st.V28_time_s, V28_at_status_start_s: st.V28_time_s, // SPEC-QUESTION Q-E10: V28 at status start is not stored; today's V28 is used
    V_hold_s: st.V_hold_s, L_hold_s: st.L_hold_s, V7_prev_time_s: st.V7_prev_time_s,
    s_slow: st.s_slow, anchors: (input.anchors ?? []) as unknown as Value,
    deload_every_ctx_set: st.deload_every_ctx, reds_flag_active: input.flags.some(f => f.status === 'active' && f.subkind === 'reds_screen'),
    adp052_consecutive: 0, adp052_events: [], fatigue_weeks_consecutive: 0, runner_tags: [],
    ctx001_applies: st.slow_ctx.includes('CTX-001'), saf061_shown_this_season: (input.engine_state?.messages_shown ?? []).some(m => m.id === 'MSG-SAF-061'),
    unclean_weeks_on_rung: input.engine_state?.ladder?.unclean_weeks_on_rung ?? 0, rung_counted_sessions: [],
    ladder_rung_index: input.engine_state?.ladder?.rung_index ?? 0, last_goal_race_date: input.engine_state?.last_goal_race?.date ?? null,
    last_goal_race_distance: input.engine_state?.last_goal_race?.distance ?? null, last_verdict: input.engine_state?.last_verdict ?? null,
    gate: 'proceed', effort_ceiling: 'E4', progression_profile: 'standard', symptom_free_days_attested: 0,
    professional_contact_attested_on: null, rich_weeks_consecutive: input.engine_state?.rich_weeks_consecutive ?? 0,
    core_inputs: st.core_inputs as unknown as Value,
    ladder_kind: input.engine_state?.ladder?.kind ?? (st.never_run ? 'start' : st.L30_source === 'undefined_rtr' ? 'rtr' : 'none'),
    ladder_runs_per_week: Math.min(3, input.profile.max_runs_per_week ?? 3), rungs_to_last: 5, last_field_test_date: null,
    ...extra,
  };
}

/** The event bindings of S1: each input event (its payload) and, at onboarding, the onboarding symptom answers (10 §1). */
function eventBindings(input: GeneratorInput, eventUnknown: Map<number, Set<string>>): { label: string; ev: Record<string, Value> }[] {
  const out: { label: string; ev: Record<string, Value> }[] = [];
  const sym = { ...(input.screening.current_symptoms ?? {}) } as Record<string, Value>;
  out.push({ label: 'onboarding', ev: { ...sym, type: 'onboarding' } });
  input.events.forEach((e, i) => {
    const p: Record<string, Value> = { ...(e.payload as Record<string, Value>), type: e.kind, kind: e.kind, date: e.date };
    for (const k of eventUnknown.get(i) ?? []) p[k] = U;
    out.push({ label: `event:${e.id}`, ev: p });
  });
  return out;
}

export function runGate(spec: Spec, rawInput: GeneratorInput, st: DerivedState, planSessions: Value[] = []): GateResult {
  const { input, eventUnknown } = withDeclaredUnknowns(rawInput);
  const fired: FiredRule[] = [];
  const recs = spec.rules.ofStage('S1');
  const levelOn = (node: string) => st.levels[node as keyof typeof st.levels] ?? 0;
  const ageHelpers = {
    age_low: (a: Value[]) => (typeof a[0] === 'string' ? st.age_low(a[0]) : null),
    age_high: (a: Value[]) => (typeof a[0] === 'string' ? st.age_high(a[0]) : null),
  };
  const base = { ...commonRoots(input, st), state: stateRoot(input, st), plan: { sessions: planSessions } as unknown as Value, rule_ctx: openRecord({ envelope: [] }) };

  const all: { rec: RuleRecord; binding: string; eff: Effect[]; outcome: string; why?: string }[] = [];
  const run = (scope: string, roots: Record<string, Value>, binding: string) => {
    const ctx = evalContext(spec, roots, {}, { ...ageHelpers, ...levelHelpers(levelOn) });
    const sr = runRecords(recs.filter(r => r.scope === scope), ctx);
    for (const res of sr.results) {
      if (res.outcome === 'silent') continue;
      all.push({ rec: spec.rules.get(res.id), binding, eff: res.effects, outcome: res.outcome, why: res.error });
    }
  };
  for (const b of eventBindings(input, eventUnknown)) run('global', { ...base, event: openRecord(b.ev) }, b.label);
  // per_week S1 rules (CTX-004, SAF-051) are bound to the first plan week here; their week caps are re-applied in S6.
  run('per_week', { ...base, event: openRecord({}), week: { start: input.today, planned_time_s: null, eco_sessions_min: 0 } as unknown as Value }, 'week:1');
  for (const f of input.flags) run('per_flag', { ...base, event: openRecord({}), flag: f as unknown as Value }, `flag:${f.id}`);
  for (const e of st.entries.filter(e => daysBetween(e.date, input.today) <= 1)) {
    run('per_entry', { ...base, event: openRecord({}), entry: { ...e, pain_next_morning_yes: e.pain_next_morning === true, limping: null } as unknown as Value }, `entry:${e.id}`);
  }

  // Collect (12 §3.6): gates → most restrictive; overrides → numeric MIN; reasons, messages.
  const gates: string[] = [];
  const holds: string[] = [], asks: string[] = [], questions: string[] = [];
  const errors: { id: string; why: string }[] = [];
  const effects: Effect[] = [];
  const messages: { id: string; rule_id: string }[] = [];
  const reasons: string[] = [];
  let startLadder = false;
  const slowRules: string[] = [];
  for (const a of all) {
    if (a.outcome === 'hold') { holds.push(a.rec.id); continue; }
    if (a.outcome === 'ask') { asks.push(a.rec.id); continue; }
    if (a.outcome === 'error') { errors.push({ id: a.rec.id, why: `${a.binding}: ${a.why}` }); continue; }
    for (const e of a.eff) {
      fired.push({ stage: 'S1', rule_id: e.ruleId, binding: a.binding, op: e.op, target: e.target, value: scalar(e.value ?? null) });
      effects.push(e);
      const msg = (e.raw as unknown as { msg?: string }).msg ?? (typeof (e as any).msg_expr === 'string' ? (e as any).msg_expr : undefined);
      if (msg && e.op !== 'set') messages.push({ id: msg, rule_id: e.ruleId });
      // NOT BUILT: a gate's `until` (SAF-051: lifted by the MSG-SAF-031 attestation, then pregnancy maintenance mode) is not
      // evaluated; maintenance mode is not built, so the engine keeps the pause (fail closed) — see docs/test-report.md
      if (e.op === 'gate') gates.push(String((e.raw as unknown as { outcome: string }).outcome));
      if (e.op === 'raise_flag') { const o = (e.raw as unknown as { outcome?: string }).outcome; if (o === 'pause_until_clearance' || o === 'no_running') gates.push('pause_until_clearance'); }
      if (e.op === 'add_reason') reasons.push(String((e.raw as unknown as { code: string }).code));
      if (e.op === 'insert_phase' && (e.raw as unknown as { phase?: string }).phase === 'START_LADDER') startLadder = true;
      if (e.op === 'set' && e.target === 'state.progression_profile' && e.value === 'slow') slowRules.push(e.ruleId);
      if (e.op === 'block_sessions' && e.ruleId === 'SAF-020') gates.push('pause_until_clearance');
    }
  }
  // SCR-003 is the only rule that writes `proceed`; without it (and without a stricter gate) the gate is not open.
  const scr003 = all.some(a => a.rec.id === 'SCR-003' && a.outcome === 'fired');
  const scr007 = all.some(a => a.rec.id === 'SCR-007' && a.outcome === 'fired');
  let gate = mostRestrictiveGate(gates.length ? gates : ['proceed']) as Gate;
  if (!scr003 && !scr007 && gate === 'proceed') gate = 'no_plan';
  // clearance (SCR-007) lifts proceed_restricted from SCR-005 only
  if (scr007 && gate === 'proceed_restricted') gate = 'proceed';
  for (const id of [...holds, ...asks]) {
    const r = spec.rules.get(id);
    for (const path of rawInput.declared_unknown ?? []) if (refersTo(r, path)) questions.push(path);
  }
  for (const id of asks) if (id === 'INP-002') { questions.push('profile.birth_month', 'profile.birth_year'); }
  const overrides: Record<string, unknown> = {};
  const de = composeTarget('override.deload.every', null, effects);
  if (typeof de.value === 'number') overrides['deload.every'] = de.value;
  const qpw = composeTarget('override.quality.per_week', null, effects);
  if (typeof qpw.value === 'number') overrides['quality.per_week.cap'] = qpw.value;
  const ceil = composeTarget('state.effort_ceiling', 'E4', effects);
  return {
    gate, holds, asks, questions: [...new Set(questions)].sort(), errors, overrides, slowRules: [...new Set(slowRules)], effortCeiling: String(ceil.value ?? 'E4'),
    reasons: [...new Set(reasons)], messages, startLadder, fired,
  };
}

function refersTo(r: RuleRecord, path: string): boolean {
  const leaf = path.replace(/^event\[\d+\]\./, 'event.').replace(/^screening\./, 'screen.');
  return (r.condition ?? '').includes(leaf);
}

export function scalar(v: Value): number | string | boolean | null | undefined {
  if (v === null || typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v;
  return undefined;
}

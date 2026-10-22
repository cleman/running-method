// Rule engine: machine records of spec/rules.json, evaluated per 12 §3.2 (on_unknown), §3.3/§3.3b (actions),
// §3.5 (stage, scope), §3.6 (composition per target) and §3.7 (fixpoint per stage).
import { type EvalContext, type Value, evalExpr, isE, isU, isSpecial, truthy, Err } from '../expr/eval.ts';

export interface Action { op: string; [k: string]: unknown; then?: Action[]; otherwise?: Action }
export interface RuleRecord {
  id: string; module: string; kind: 'rule' | 'invariant'; tier: string; priority?: number; hit_policy?: string;
  condition?: string | null; on_unknown?: 'fire' | 'skip' | 'hold' | 'ask' | null; action?: Action | null;
  expression_status: 'formal' | 'procedure' | 'static' | 'text_only'; release: 'MVP' | 'spec';
  stage?: string; scope?: string; assert?: string; check_kind?: string; severity?: string; text?: string;
  evidence?: { basis?: string; grades?: string[] }; explain?: { runner: string; coach: string };
}
export interface RulesFile { version: string; counts: Record<string, number>; records: RuleRecord[] }

/** One evaluated action ("effect"), with its expressions already evaluated where the op has an expression. */
export interface Effect {
  ruleId: string; tier: string; priority: number; op: string; target?: string; value?: Value; raw: Action;
}

export type Outcome = 'fired' | 'silent' | 'hold' | 'ask' | 'error';
export interface RuleResult { id: string; outcome: Outcome; effects: Effect[]; error?: string }

const tierNum = (t: string) => Number(t.slice(1));
export const orderKey = (r: RuleRecord) => tierNum(r.tier) * 1000 + (r.priority ?? 0);

/** Fields of an action that hold a RuleExpr (everything else is a name, a list or a constant). */
const EXPR_FIELDS = new Set(['expr', 'reasons_expr', 'every_expr', 'rung_expr', 'module_expr', 'weeks_expr', 'week_expr', 'dose_expr', 'order_expr', 'max_expr', 'msg_expr', 'method_expr']);

function evalActionTree(rec: RuleRecord, a: Action, ctx: EvalContext, out: Effect[], errors: string[]): void {
  const pol = rec.on_unknown ?? 'skip';
  if (typeof a.when === 'string') {
    const w = truthy(evalExpr(a.when, ctx));
    if (isE(w)) { errors.push(`${rec.id} when: ${w.why}`); return; }
    if (w === false || (isU(w) && pol !== 'fire')) {
      if (a.otherwise && typeof a.otherwise === 'object' && w === false) evalActionTree(rec, a.otherwise as Action, ctx, out, errors);
      return;
    }
  }
  if (typeof a.unless === 'string') {
    const u = truthy(evalExpr(a.unless, ctx));
    if (u === true) return;
    if (isE(u)) { errors.push(`${rec.id} unless: ${u.why}`); return; }
  }
  const eff: Effect = { ruleId: rec.id, tier: rec.tier, priority: rec.priority ?? 0, op: a.op, raw: a };
  if (typeof a.target === 'string') eff.target = a.target;
  for (const k of Object.keys(a)) {
    if (!EXPR_FIELDS.has(k) || typeof a[k] !== 'string') continue;
    if (a[k] === 'null' && k === 'rung_expr') continue;
    const v = evalExpr(a[k] as string, ctx);
    if (k === 'expr') eff.value = v; else (eff as any)[k] = v;
    if (isE(v)) errors.push(`${rec.id} ${k}: ${v.why}`);
  }
  out.push(eff);
  for (const t of a.then ?? []) evalActionTree(rec, t, ctx, out, errors);
}

/** Evaluate one record in one binding (12 §3.2 rules 4–5). */
export function evaluateRecord(rec: RuleRecord, ctx: EvalContext): RuleResult {
  if (rec.expression_status === 'text_only' || !rec.condition || !rec.action) return { id: rec.id, outcome: 'silent', effects: [] };
  if (rec.expression_status === 'static') return { id: rec.id, outcome: 'silent', effects: [] };
  const c = truthy(evalExpr(rec.condition, ctx));
  if (isE(c)) return { id: rec.id, outcome: 'error', effects: [], error: c.why };
  if (c === false) return { id: rec.id, outcome: 'silent', effects: [] };
  if (isU(c)) {
    switch (rec.on_unknown) {
      case 'hold': return { id: rec.id, outcome: 'hold', effects: [] };
      case 'ask': return { id: rec.id, outcome: 'ask', effects: [] };
      case 'fire': break;
      default: return { id: rec.id, outcome: 'silent', effects: [] };
    }
  }
  const effects: Effect[] = [];
  const errors: string[] = [];
  evalActionTree(rec, rec.action, ctx, effects, errors);
  if (errors.length) return { id: rec.id, outcome: 'error', effects, error: errors.join('; ') };
  return { id: rec.id, outcome: 'fired', effects };
}

// ---------------------------------------------------------------- composition (12 §3.6)
export const ORDINALS: Record<string, string[]> = {
  'state.effort_ceiling': ['E0', 'E1', 'E2', 'E3', 'E4'],
  'state.progression_profile': ['slow', 'standard'],
  'state.gate': ['no_plan', 'pause_until_clearance', 'proceed_restricted', 'proceed'],
};
const GATE_RANK: Record<string, number> = { proceed: 0, proceed_restricted: 1, pause_until_clearance: 2, no_plan: 3 };

export interface Composed { value: Value; winners: string[]; losers: string[] }

/**
 * Resolve every write to one target: numeric = min(T0–T3 caps, max(T5 floors, min(T4–T6 caps, base)));
 * ordinal = most restrictive; other = lowest (tier, nnn) set.
 */
export function composeTarget(target: string, incoming: Value, effects: Effect[]): Composed {
  const mine = effects.filter(e => e.target === target && ['set', 'cap', 'floor', 'raise_long_run'].includes(e.op));
  if (!mine.length) return { value: incoming, winners: [], losers: [] };
  const sorted = [...mine].sort((a, b) => tierNum(a.tier) * 1000 + a.priority - (tierNum(b.tier) * 1000 + b.priority));
  const ord = ORDINALS[target];
  if (ord) {
    const vals = sorted.filter(e => typeof e.value === 'string' && ord.includes(e.value as string));
    if (!vals.length) return { value: incoming, winners: [], losers: [] };
    const cands = [incoming, ...vals.map(v => v.value)].filter(v => typeof v === 'string' && ord.includes(v as string)) as string[];
    const best = cands.reduce((a, b) => (ord.indexOf(b) < ord.indexOf(a) ? b : a));
    const w = vals.filter(v => v.value === best).map(v => v.ruleId);
    return { value: best, winners: w, losers: vals.filter(v => v.value !== best).map(v => v.ruleId) };
  }
  const numeric = sorted.every(e => typeof e.value === 'number' || e.value === null || isSpecial(e.value)) && (typeof incoming === 'number' || incoming === null || incoming === undefined);
  if (numeric) {
    const sets = sorted.filter(e => e.op === 'set' && typeof e.value === 'number');
    let base: number | null = sets.length ? (sets[0].value as number) : (typeof incoming === 'number' ? incoming : null);
    const capsHi = sorted.filter(e => e.op === 'cap' && tierNum(e.tier) <= 3 && typeof e.value === 'number').map(e => e.value as number);
    const capsLo = sorted.filter(e => e.op === 'cap' && tierNum(e.tier) >= 4 && typeof e.value === 'number').map(e => e.value as number);
    const floors = sorted.filter(e => (e.op === 'floor' || e.op === 'raise_long_run') && typeof e.value === 'number').map(e => e.value as number);
    if (base === null && !floors.length) return { value: incoming ?? null, winners: [], losers: [] };
    let v = base ?? -Infinity;
    if (capsLo.length) v = Math.min(v, ...capsLo);
    if (floors.length) v = Math.max(v, ...floors);
    if (capsHi.length) v = Math.min(v, ...capsHi);
    return { value: v, winners: sorted.map(e => e.ruleId), losers: [] };
  }
  const first = sorted.find(e => e.op === 'set') ?? sorted[0];
  return { value: first.value as Value, winners: [first.ruleId], losers: sorted.filter(e => e !== first).map(e => e.ruleId) };
}

export function mostRestrictiveGate(outcomes: string[]): string {
  return outcomes.reduce((a, b) => (GATE_RANK[b] > GATE_RANK[a] ? b : a), 'proceed');
}

// ---------------------------------------------------------------- rule set
export class RuleSet {
  readonly byId = new Map<string, RuleRecord>();
  readonly rules: RuleRecord[];
  readonly invariants: RuleRecord[];
  readonly file: RulesFile;
  constructor(file: RulesFile) {
    this.file = file;
    for (const r of file.records) this.byId.set(r.id, r);
    this.rules = file.records.filter(r => r.kind === 'rule').sort((a, b) => orderKey(a) - orderKey(b));
    this.invariants = file.records.filter(r => r.kind === 'invariant');
  }
  get(id: string): RuleRecord {
    const r = this.byId.get(id);
    if (!r) throw new Error('rule not in rules.json: ' + id);
    return r;
  }
  ofStage(stage: string): RuleRecord[] { return this.rules.filter(r => r.stage === stage && r.expression_status !== 'text_only'); }
}

export interface StageRun { results: RuleResult[]; effects: Effect[]; holds: string[]; asks: string[]; errors: { id: string; why: string }[] }

/** Evaluate a list of records in (tier, nnn) order in one binding; collect effects (one pass of 12 §3.6). */
export function runRecords(recs: RuleRecord[], ctx: EvalContext): StageRun {
  const out: StageRun = { results: [], effects: [], holds: [], asks: [], errors: [] };
  for (const r of [...recs].sort((a, b) => orderKey(a) - orderKey(b))) {
    const res = evaluateRecord(r, ctx);
    out.results.push(res);
    if (res.outcome === 'fired') out.effects.push(...res.effects);
    else if (res.outcome === 'hold') out.holds.push(r.id);
    else if (res.outcome === 'ask') out.asks.push(r.id);
    else if (res.outcome === 'error') out.errors.push({ id: r.id, why: res.error ?? '' });
  }
  return out;
}

export { Err };

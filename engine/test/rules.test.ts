// Rule engine: rules.json loads and parses; on_unknown policies (12 §3.2); composition per target (12 §3.6); tier order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse } from '../src/expr/parser.ts';
import { U } from '../src/expr/eval.ts';
import { evaluateRecord, composeTarget, orderKey, type RuleRecord, type Effect } from '../src/rules/engine.ts';
import { evalContext } from '../src/context.ts';
import { spec } from './helpers.ts';

test('rules.json loads: 313 rules + 31 invariants, every condition, action expression and assertion parses', () => {
  const s = spec();
  assert.equal(s.rules.rules.length, 313);   // v5.3: + EXP-001…006, SES-026…028, SES-030…032
  assert.equal(s.rules.invariants.length, 31);
  const EXPR = ['expr', 'reasons_expr', 'every_expr', 'rung_expr', 'module_expr', 'weeks_expr', 'week_expr', 'dose_expr', 'order_expr', 'max_expr', 'msg_expr', 'method_expr', 'when', 'unless', 'filter', 'until', 'place_long_run', 'constraint'];
  let n = 0;
  const walk = (a: any) => {
    if (!a || typeof a !== 'object') return;
    for (const k of EXPR) if (typeof a[k] === 'string' && a[k] !== 'never') { parse(a[k]); n++; }
    for (const t of a.then ?? []) walk(t);
    if (a.otherwise) walk(a.otherwise);
  };
  for (const r of s.rules.file.records) {
    if (r.condition) { parse(r.condition); n++; }
    if (r.assert && !/^(static|flag_only):/.test(r.assert)) { parse(r.assert); n++; }
    walk(r.action);
  }
  assert.ok(n > 600, `parsed ${n} expressions`);
});

test('no MVP rule is text_only; every MVP record names its stage and scope', () => {
  for (const r of spec().rules.file.records) {
    if (r.release !== 'MVP') continue;
    assert.notEqual(r.expression_status, 'text_only', r.id);
    assert.ok(r.stage, r.id + ' stage');
  }
});

const rec = (over: Partial<RuleRecord>): RuleRecord => ({ id: 'TST-001', module: '99', kind: 'rule', tier: 'T4', priority: 1, expression_status: 'formal', release: 'MVP', condition: 'x.a', on_unknown: 'skip', action: { op: 'set', target: 'y.b', expr: '1' }, ...over });

test('on_unknown: a U condition fires, skips, holds or asks per the record', () => {
  const ctx = evalContext(spec(), { x: { a: U } }, {});
  assert.equal(evaluateRecord(rec({ on_unknown: 'fire' }), ctx).outcome, 'fired');
  assert.equal(evaluateRecord(rec({ on_unknown: 'skip' }), ctx).outcome, 'silent');
  assert.equal(evaluateRecord(rec({ on_unknown: 'hold' }), ctx).outcome, 'hold');
  assert.equal(evaluateRecord(rec({ on_unknown: 'ask' }), ctx).outcome, 'ask');
  // E never fires (safe state)
  assert.equal(evaluateRecord(rec({ on_unknown: 'fire', condition: 'x.missing' }), ctx).outcome, 'error');
  // text_only records are refused
  assert.equal(evaluateRecord(rec({ expression_status: 'text_only' }), evalContext(spec(), { x: { a: true } }, {})).outcome, 'silent');
});

test('then / when / otherwise / unless in an action tree', () => {
  const r = rec({ condition: 'true', action: { op: 'add_reason', code: 'A', then: [{ op: 'add_reason', code: 'B', when: 'x.a', otherwise: { op: 'add_reason', code: 'C' } }, { op: 'add_reason', code: 'D', unless: 'x.a' }] } });
  const codes = (a: boolean) => evaluateRecord(r, evalContext(spec(), { x: { a } }, {})).effects.map(e => (e.raw as any).code).join('');
  assert.equal(codes(true), 'AB');
  assert.equal(codes(false), 'ACD');
});

const eff = (ruleId: string, tier: string, op: string, value: number | string, priority = 1): Effect => ({ ruleId, tier, priority, op, target: 't', value, raw: { op } });

test('composition (12 §3.6): numeric = min(T0–T3 caps, max(T5 floors, min(T4–T6 caps, base)))', () => {
  // base 300; a T5 cap 200 is overridden by a T5 floor 250; a T2 cap 240 wins over the floor
  assert.equal(composeTarget('t', 300, [eff('A-001', 'T5', 'cap', 200), eff('B-001', 'T5', 'floor', 250)]).value, 250);
  assert.equal(composeTarget('t', 300, [eff('A-001', 'T5', 'cap', 200), eff('B-001', 'T5', 'floor', 250), eff('C-001', 'T2', 'cap', 240)]).value, 240);
  assert.equal(composeTarget('t', 300, [eff('A-001', 'T6', 'set', 100)]).value, 100);
});

test('composition: ordinal targets take the most restrictive value', () => {
  const e = (v: string, tier: string) => ({ ...eff('X-00' + v.length, tier, 'set', v), target: 'state.effort_ceiling' });
  assert.equal(composeTarget('state.effort_ceiling', 'E4', [e('E2', 'T1'), e('E3', 'T5')]).value, 'E2');
  const p = (v: string) => ({ ...eff('P-001', 'T5', 'set', v), target: 'state.progression_profile' });
  assert.equal(composeTarget('state.progression_profile', 'standard', [p('slow')]).value, 'slow');
});

test('tier ordering: (tier, nnn) key', () => {
  const s = spec();
  const keys = s.rules.rules.map(orderKey);
  for (let i = 1; i < keys.length; i++) assert.ok(keys[i] >= keys[i - 1]);
  const seen = new Set<string>();
  for (const r of s.rules.rules) { const k = `${r.tier}.${r.priority}`; assert.ok(!seen.has(k), 'duplicate key ' + k + ' ' + r.id); seen.add(k); }
});

test('a real record: FEA-033 fires inside the fast band, stays silent outside it', () => {
  const s = spec();
  const r = s.rules.get('FEA-033');
  const ctx = (t: number) => evalContext(s, { goal: { goal_type: 'time', target_time_s: t }, feas: { P_race_s: 3058, B_fast: 0.07 } }, {});
  assert.equal(evaluateRecord(r, ctx(2880)).outcome, 'fired');     // 48:00 inside 47:24…50:58
  assert.equal(evaluateRecord(r, ctx(3100)).outcome, 'silent');
  assert.equal(evaluateRecord(r, ctx(2800)).outcome, 'silent');    // faster than the fast edge: FEA-032/038, not FEA-033
});

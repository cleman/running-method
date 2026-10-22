// TST-126: CEL four-valued truth tables (12 §3.2, §3.9) and the expression subset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evalExpr, U, isU, isE, Err, type Value } from '../src/expr/eval.ts';
import { baseHelpers } from '../src/rules/helpers.ts';
import { parse } from '../src/expr/parser.ts';

const E = new Err('test error');
const kinds: Record<string, Value> = { T: true, F: false, E, U };
const ctx = (roots: Record<string, Value> = {}) => ({ roots: { unit: { min_s: 60, h_s: 3600, km_m: 1000, week_d: 7, pct: 100 }, ...roots }, helpers: baseHelpers(), param: (id: string) => (id === 'x.ten' ? 10 : new Err('no ' + id)) });
const name = (v: Value) => (v === true ? 'T' : v === false ? 'F' : isE(v) ? 'E' : isU(v) ? 'U' : JSON.stringify(v));

test('&& truth table: a definite false absorbs; otherwise E dominates U', () => {
  const want: Record<string, string> = {
    TT: 'T', TF: 'F', TE: 'E', TU: 'U', FT: 'F', FF: 'F', FE: 'F', FU: 'F',
    ET: 'E', EF: 'F', EE: 'E', EU: 'E', UT: 'U', UF: 'F', UE: 'E', UU: 'U',
  };
  for (const [a, av] of Object.entries(kinds)) for (const [b, bv] of Object.entries(kinds)) {
    assert.equal(name(evalExpr('a && b', ctx({ a: av, b: bv }))), want[a + b], `${a} && ${b}`);
  }
});

test('|| truth table: a definite true absorbs; otherwise E dominates U', () => {
  const want: Record<string, string> = {
    TT: 'T', TF: 'T', TE: 'T', TU: 'T', FT: 'T', FF: 'F', FE: 'E', FU: 'U',
    ET: 'T', EF: 'E', EE: 'E', EU: 'E', UT: 'T', UF: 'U', UE: 'E', UU: 'U',
  };
  for (const [a, av] of Object.entries(kinds)) for (const [b, bv] of Object.entries(kinds)) {
    assert.equal(name(evalExpr('a || b', ctx({ a: av, b: bv }))), want[a + b], `${a} || ${b}`);
  }
});

test('! and comparisons propagate E and U', () => {
  assert.equal(name(evalExpr('!a', ctx({ a: U }))), 'U');
  assert.equal(name(evalExpr('!a', ctx({ a: E }))), 'E');
  for (const op of ['==', '!=', '<', '<=', '>', '>=']) {
    assert.equal(name(evalExpr(`a ${op} 1`, ctx({ a: U }))), 'U', op);
    assert.equal(name(evalExpr(`a ${op} 1`, ctx({ a: E }))), 'E', op);
  }
});

test('null semantics: == null true, ordering with null false, arithmetic null, member of null null, has() false', () => {
  assert.equal(evalExpr('a == null', ctx({ a: null })), true);
  assert.equal(evalExpr('a < 1', ctx({ a: null })), false);
  assert.equal(evalExpr('a >= 1', ctx({ a: null })), false);
  assert.equal(evalExpr('a + 1', ctx({ a: null })), null);
  assert.equal(evalExpr('a.b', ctx({ a: null })), null);
  assert.equal(evalExpr('has(a.b)', ctx({ a: { b: null } })), false);
  assert.equal(evalExpr('has(a.b)', ctx({ a: { b: U } })), false);
  assert.equal(evalExpr('has(a.b)', ctx({ a: { b: 3 } })), true);
});

test('absent undeclared path is E; declared unknown is U', () => {
  assert.ok(isE(evalExpr('a.missing', ctx({ a: {} }))));
  assert.ok(isE(evalExpr('nobody', ctx())));
  assert.ok(isU(evalExpr('a.c1', ctx({ a: { c1: U } }))));
});

test('comprehensions: exists with a true witness beats U; all with a false beats U; count/sum', () => {
  assert.equal(evalExpr('exists(l, x, x)', ctx({ l: [U, true] })), true);
  assert.ok(isU(evalExpr('exists(l, x, x)', ctx({ l: [U, false] }))));
  assert.equal(evalExpr('all(l, x, x)', ctx({ l: [U, false] })), false);
  assert.equal(evalExpr('count(l, x, x > 1)', ctx({ l: [1, 2, 3] })), 2);
  assert.equal(evalExpr('sum(l, x, x)', ctx({ l: [1, 2, 3] })), 6);
  assert.equal(evalExpr('max_or_zero(l, x, x)', ctx({ l: [] })), 0);
  assert.equal(evalExpr('first(l, x, x > 5)', ctx({ l: [1, 2] })), null);
});

test('helpers: p(), min/max variadic and on a list, round_down, effort_rank (E5 = E3), date helpers', () => {
  assert.equal(evalExpr("p('x.ten') * unit.min_s", ctx()), 600);
  assert.ok(isE(evalExpr("p('nope')", ctx())));
  assert.equal(evalExpr('min(3, 1, 2)', ctx()), 1);
  assert.equal(evalExpr("min(['SES-M-012', 'SES-M-008'])", ctx()), 'SES-M-008');
  assert.equal(evalExpr('round_down(185, unit.min_s)', ctx()), 180);
  assert.equal(evalExpr("effort_rank('E5') == effort_rank('E3')", ctx()), true);
  assert.equal(evalExpr("days_between('2026-11-02', '2026-11-30')", ctx()), 28);
  assert.equal(evalExpr("weekday('2026-11-08')", ctx()), 'Sun');
  assert.ok(isU(evalExpr('min(a, 1)', ctx({ a: U }))));
});

test('parser: ternary, in, lists, maps, index, the 4-argument pairs comprehension', () => {
  assert.equal(evalExpr("a in ['x', 'y'] ? 1 : 0", ctx({ a: 'y' })), 1);
  assert.equal(evalExpr("{'a': 2}['a']", ctx()), 2);
  assert.equal(evalExpr('all(pairs(l), a, b, a < b)', ctx({ l: [1, 2, 3] })), true);
  assert.equal(evalExpr('all(pairs(l), a, b, a < b)', ctx({ l: [2, 1] })), false);
  assert.throws(() => parse('a &&'));
});

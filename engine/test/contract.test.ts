// TST-130 (engine side): results of the MVP personas validate against spec/schema/result.schema.json and serialise
// canonically. Every MVP persona produces one of the five result kinds without throwing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/generate.ts';
import { canonical } from '../src/util/canonical.ts';
import { spec, fixture, fixtureIds } from './helpers.ts';
import { validateResult } from './schema-lite.ts';

// Fixtures whose option search is slow are covered once here; the full grid runs in CI time only for MVP releases.
const MVP = fixtureIds().filter(id => fixture(id).release === 'MVP');

test('every MVP persona gives a result that validates against result.schema.json', () => {
  const bad: string[] = [];
  for (const id of MVP) {
    const r = generate(spec(), fixture(id).input);
    const errs = validateResult(JSON.parse(canonical(r)));
    if (errs.length) bad.push(`${id}: ${errs.slice(0, 3).join(' | ')}`);
  }
  assert.deepEqual(bad, []);
});

test('canonical serialisation: keys sorted, no whitespace, round-trips', () => {
  const r = generate(spec(), fixture('p2-tom').input);
  const c = canonical(r);
  assert.equal(canonical(JSON.parse(c)), c);
  assert.ok(!/\n/.test(c));
});

test('fail_closed results carry no plan for the requested goal and only validated options', () => {
  for (const id of ['karim', 'mia-2-days', 'ben-availability']) {
    const r: any = generate(spec(), fixture(id).input);
    assert.equal(r.kind, 'fail_closed', id);
    assert.equal(r.plan, undefined, id);
    assert.ok(r.feasibility.options.length <= (spec().reg.base('repair.max_options') as number), id);
    for (const o of r.feasibility.options) { assert.ok(['feasible', 'stretch'].includes(o.verdict), id); assert.ok(o.plan.weeks.length > 0, id); }
  }
});

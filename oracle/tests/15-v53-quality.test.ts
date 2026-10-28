// v5.3, against a generator: the five advanced personas (TST-133) with the coach-quality properties and the
// distance/time rendering checks (TST-134), and the owner's hand-computed plan (plans/v53-clem-experienced.md).
// Skipped without an engine (README "How to run").
import { describe, expect, it } from 'vitest';
import { engineConfigured } from '../src/engine.js';
import { fixture } from '../src/fixtures.js';
import { record } from '../src/compare.js';
import { checkQuality } from '../src/quality.js';
import { violations } from '../src/invariants.js';
import { deriveExp } from '../src/v53.js';
import { CLEM_EXPECT, CLEM_WEEKS } from '../src/expected/v53-clem-plan.js';
import { diffV53Week } from '../src/v53-match.js';
import { day0Of } from './helpers.js';

const on = engineConfigured();
export const V53_PERSONAS = ['v53-clem', 'v53-clem-confirmed', 'v53-marathon-3h', 'v53-5k-19min-5runs', 'v53-masters-55-ag70', 'v53-inconsistent-claims'];

describe.skipIf(!on)('v5.3 advanced personas: path, coach-quality and rendering properties (TST-133, TST-134)', () => {
  for (const id of V53_PERSONAS) {
    it(`${id} [${deriveExp(fixture(id).input).experienced ? 'experienced' : 'cautious'} path expected]`, async () => {
      const r = await day0Of(id);
      if (!r) return;
      const f = checkQuality(fixture(id).input, r);
      record({ test: 'v53-quality', fixture: id, findings: f });
      expect(violations(f)).toEqual([]);
    });
  }
});

describe.skipIf(!on)('owner case, day-0 plan vs the hand computation (v53-clem-confirmed)', () => {
  const id = CLEM_EXPECT.fixture;
  it('phases and deload weeks', async () => {
    const r = await day0Of(id);
    if (!r?.plan) return expect.fail(`kind ${r?.kind}`);
    expect(r.plan.phases.map((p) => `${p.type}:${p.start_week}+${p.n_weeks}`).join(' ')).toBe(CLEM_EXPECT.phases);
    expect(r.plan.weeks.filter((w) => w.is_deload).map((w) => w.index)).toEqual(CLEM_EXPECT.deload_weeks);
    expect(r.plan.pace_mode).toBe('paced');
  });
  it('E3 and E4 pace ranges in week 1 (declared anchor, slow edge widened; OQ-27 readings A/B)', async () => {
    const r = await day0Of(id);
    const ss = r?.plan?.weeks[0].sessions ?? [];
    for (const [m, e] of [['SES-M-008', 'E3'], ['SES-M-010', 'E4']] as const) {
      const s = ss.find((x) => x.module_id === m);
      if (!s?.pace_range) { expect.fail(`${m} has no pace range`); continue; }
      const got = [s.pace_range.fast_s_per_km, s.pace_range.slow_s_per_km];
      expect([CLEM_EXPECT.pace.A[e], CLEM_EXPECT.pace.B[e]].map((x) => x.join('-'))).toContain(got.join('-'));
    }
  });
  for (const e of CLEM_WEEKS.filter((w) => w.index <= 6 || w.index === 9)) {
    it(`week ${e.index} (${e.phase}${e.is_deload ? ' deload' : ''}${e.is_calibration ? ' calibration' : ''}${e.long_run_form ? ' form ' + e.long_run_form : ''}) [${e.status}${e.oq ? ' ' + e.oq : ''}]: volume, long run, keys, doses, forms`, async () => {
      const r = await day0Of(id);
      if (!r?.plan) return;
      const d = diffV53Week(r.plan.weeks.find((w) => w.index === e.index), e);
      record({ test: 'v53-clem-day0', fixture: id, week: e.index, status: e.status, oq: e.oq, diffs: d });
      expect(d).toEqual([]);
    });
    it(`week ${e.index}: easy-run fill (assumed: 12 §2b.4 water_fill, strides inside the easy time, OQ-09)`, async () => {
      const r = await day0Of(id);
      if (!r?.plan) return;
      const d = diffV53Week(r.plan.weeks.find((w) => w.index === e.index), e, { easy: true }).filter((x) => /easy/.test(x));
      record({ test: 'v53-clem-day0-easy', fixture: id, week: e.index, diffs: d });
      expect(d).toEqual([]);
    });
  }
});

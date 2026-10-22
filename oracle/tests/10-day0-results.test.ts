// TST-130 (result side), TST-041 (invariants on every emitted plan and on every fail-closed option),
// GEN-004 / M-7 (determinism) on the day-0 call of every persona. Skipped without an engine (README).
import { describe, expect, it } from 'vitest';
import { engineConfigured } from '../src/engine.js';
import { allFixtures } from '../src/fixtures.js';
import { KINDS } from '../src/expected/kinds.js';
import { checkResult, violations } from '../src/invariants.js';
import { validateResult } from '../src/schema.js';
import { record } from '../src/compare.js';
import { day0Of } from './helpers.js';

const on = engineConfigured();

describe.skipIf(!on)('day-0 result of every persona', () => {
  for (const f of allFixtures()) {
    describe(f.fixture_id, () => {
      it('validates against result.schema.json (TST-130)', async () => {
        const r = await day0Of(f.fixture_id);
        if (!r) return; // offline mode without a stored result for this fixture
        expect(validateResult(r).errors).toEqual([]);
        expect(r.today).toBe(f.input.today);
      });
      const k = KINDS[f.fixture_id];
      if (k) it(`is a ${k.kind}${k.verdict ? ` (${k.verdict})` : ''}${k.gate ? ` (${k.gate})` : ''} [${k.status}${k.oq ? ' ' + k.oq : ''}; ${k.source}]`, async () => {
        const r = await day0Of(f.fixture_id);
        if (!r) return;
        const got = { kind: r.kind, verdict: r.feasibility?.verdict, gate: r.gate };
        record({ test: 'kind', fixture: f.fixture_id, expected: k, got });
        expect(r.kind).toBe(k.kind);
        if (k.verdict) expect(r.feasibility?.verdict).toBe(k.verdict);
        if (k.gate) expect(r.gate).toBe(k.gate);
      });
      it('holds every invariant the oracle can evaluate (TST-041)', async () => {
        const r = await day0Of(f.fixture_id);
        if (!r) return;
        const fs = checkResult(f.input, r);
        record({ test: 'invariants', fixture: f.fixture_id, findings: fs.filter((x) => x.severity !== 'not_checked') });
        expect(violations(fs)).toEqual([]);
      });
      it('reasons are in reason_code order and the verdict follows them (FEA-036)', async () => {
        const r = await day0Of(f.fixture_id);
        if (!r?.feasibility) return;
        const order = ['AVAILABILITY_TIME', 'AVAILABILITY_DAYS', 'MINOR_DISTANCE', 'RACE_TOO_SOON', 'LONG_RUN_UNREACHABLE_PRESET', 'LEVELS_UNREACHABLE', 'PHASES_DO_NOT_FIT', 'CURRENT_STATE_SHORT', 'TARGET_OUTSIDE_BAND', 'CUTOFF_UNREACHABLE', 'MARGIN_REQUIRED', 'ENGINE_NONCONVERGENT', 'LOW_SLACK', 'TARGET_IN_FAST_BAND', 'TARGET_BEYOND_CURRENT', 'ANCHOR_UNKNOWN', 'LOW_VOLUME_PREDICTION', 'ULTRA_LOW_CONFIDENCE', 'LONG_HORIZON_UNPROJECTED', 'LONG_RUN_TIME_CAPPED', 'DEGRADED_COMPLETION', 'CUTOFF_AT_RISK', 'LOW_FREQ'];
        const rs = r.feasibility.reasons;
        expect(rs).toEqual([...rs].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
        const infeasible = rs.some((x) => order.indexOf(x) <= order.indexOf('ENGINE_NONCONVERGENT'));
        // LOW_VOLUME_PREDICTION and LONG_RUN_TIME_CAPPED are information only for finish goals (03 §2, FEA-011)
        const infoOnly = f.input.goal.goal_type !== 'time' ? ['LOW_VOLUME_PREDICTION', 'LONG_RUN_TIME_CAPPED', 'LOW_FREQ'] : ['LOW_FREQ'];
        const stretch = rs.some((x) => order.indexOf(x) > order.indexOf('ENGINE_NONCONVERGENT') && !infoOnly.includes(x));
        const v = infeasible ? 'infeasible' : stretch ? 'stretch' : 'feasible';
        if (r.kind !== 'plan' || !r.plan?.degraded) expect(r.feasibility.verdict).toBe(v);
      });
      it('ESTIMATED_INPUTS is a label, never a reason (FEA-035)', async () => {
        const r = await day0Of(f.fixture_id);
        expect((r?.feasibility?.reasons ?? []) as string[]).not.toContain('ESTIMATED_INPUTS');
      });
    });
  }
});

describe.skipIf(!on)('fail-closed results (07 §6.2, FEA-040/041)', () => {
  for (const f of allFixtures()) {
    it(`${f.fixture_id}: options ranked, ≤ repair.max_options, none infeasible`, async () => {
      const r = await day0Of(f.fixture_id);
      if (r?.kind !== 'fail_closed') return;
      const o = r.feasibility?.options ?? [];
      expect(o.length).toBeLessThanOrEqual(4);
      expect(o.map((x) => x.rank)).toEqual([...o.map((x) => x.rank)].sort((a, b) => a - b));
      for (const x of o) expect(['feasible', 'stretch']).toContain(x.verdict);
      expect(r.plan).toBeUndefined();
    });
  }
});

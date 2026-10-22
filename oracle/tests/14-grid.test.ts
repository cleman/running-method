// TST-051 context grid (432 cases): no gate bypassed, no cap broken, every infeasible case yields ≥ 1
// validated goal-level option, every special-population case carries a message (14 §5).
import { describe, expect, it } from 'vitest';
import { loadEngine, liveEngineConfigured } from '../src/engine.js';
import { gridFixtures } from '../src/grid.js';
import { checkResult, violations } from '../src/invariants.js';
import { validateResult } from '../src/schema.js';
import { record } from '../src/compare.js';

describe.skipIf(!liveEngineConfigured())('TST-051 context grid', () => {
  for (const f of gridFixtures()) {
    it(f.fixture_id, async () => {
      const g = (await loadEngine())!;
      const r = await g(JSON.parse(JSON.stringify(f.input)));
      expect(validateResult(r).errors).toEqual([]);
      const v = violations(checkResult(f.input, r));
      record({ test: 'grid', fixture: f.fixture_id, kind: r.kind, verdict: r.feasibility?.verdict, violations: v });
      expect(v).toEqual([]);
      if (r.kind === 'fail_closed') expect((r.feasibility?.options ?? []).length, 'fail closed without a validated option').toBeGreaterThan(0);
      if (/masters65|age16|postpartum|bone-stress/.test(f.fixture_id) && r.kind === 'plan')
        expect(r.messages.length, 'special population without a message').toBeGreaterThan(0);
      // minors: no marathon or ultra plan before 18 (minor.marathon_min_age, ultra_min_age)
      if (f.fixture_id.includes('age16') && ['M', '50K', '100K'].includes(f.input.goal.distance)) expect(r.kind).not.toBe('plan');
    });
  }
});

// Item (c): TST-091 (M-1…M-8) and TST-042a–h over the MVP personas and the oracle's MVP plan inputs, plus a
// seeded sample of the TST-051 grid. Needs a live engine (each relation calls it at least twice).
import { describe, expect, it } from 'vitest';
import { loadEngine, liveEngineConfigured } from '../src/engine.js';
import { allFixtures, clone } from '../src/fixtures.js';
import { gridFixtures } from '../src/grid.js';
import { RELATIONS } from '../src/metamorphic.js';
import { record } from '../src/compare.js';
import type { Input, Result } from '../src/types.js';

const bases = [
  ...allFixtures().filter((f) => f.release === 'MVP' && f.behaviour.model !== 'day0_only'),
  // seeded sample of 24 grid cases (every 18th case): deterministic, MVP and beyond
  ...gridFixtures().filter((_, i) => i % 18 === 0),
];

describe.skipIf(!liveEngineConfigured())('metamorphic relations', () => {
  for (const rel of RELATIONS) {
    describe(`${rel.id} (${rel.source}): ${rel.statement}`, () => {
      for (const f of bases) {
        it(f.fixture_id, async () => {
          const g = (await loadEngine())!;
          const gen = async (i: Input) => (await g(clone(i))) as Result;
          let out;
          if (rel.custom) out = await rel.custom(f.input, gen);
          else {
            const t = rel.transform(clone(f.input));
            if (!t) { record({ test: 'metamorphic', rel: rel.id, fixture: f.fixture_id, skipped: rel.why }); return; }
            out = rel.check!(await gen(f.input), await gen(t), f.input);
          }
          record({ test: 'metamorphic', rel: rel.id, fixture: f.fixture_id, ...out });
          expect(out.ok, out.detail).toBe(true);
        });
      }
    });
  }
});

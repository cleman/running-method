// TST-130 (input side): every persona input — the shared spec/fixtures-input set and the inputs the oracle
// adds — validates against spec/schema/fixture-input.schema.json. Runs without an engine.
import { describe, expect, it } from 'vitest';
import { allFixtures, oracleFixtures } from '../src/fixtures.js';
import { validateFixture } from '../src/schema.js';
import { weekday } from '../src/dates.js';
import { gridFixtures } from '../src/grid.js';

describe('fixture inputs are valid against the shared schema', () => {
  for (const f of allFixtures()) {
    it(f.fixture_id, () => {
      const r = validateFixture(f);
      expect(r.errors).toEqual([]);
    });
  }
});

describe('oracle-added fixtures follow the common choices of spec/fixtures-input/README.md', () => {
  for (const f of oracleFixtures()) {
    it(`${f.fixture_id}: day 0 is a Monday and every invented value is tagged`, () => {
      expect(weekday(f.input.today)).toBe('Mon');
      for (const v of Object.values(f.provenance)) expect(v).toMatch(/^(spec|invented|derived): /);
    });
  }
});

describe('TST-051 context grid (generated, 432 cases)', () => {
  const grid = gridFixtures();
  it('has 4 budgets × 3 horizons × 6 distances × 6 profiles = 432 cases', () => {
    expect(grid.length).toBe(432);
    expect(new Set(grid.map((g) => g.fixture_id)).size).toBe(432);
  });
  it('every grid case validates against the fixture schema', () => {
    const bad = grid.map((g) => ({ id: g.fixture_id, e: validateFixture(g).errors })).filter((x) => x.e.length);
    expect(bad.slice(0, 3)).toEqual([]);
  });
});

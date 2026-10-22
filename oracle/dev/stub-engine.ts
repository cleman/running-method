// NOT A GENERATOR. Plumbing check for the oracle's own test code: for the two oracle MVP inputs it returns
// the oracle's hand plan rendered as a result (src/synthetic.ts); for anything else a safe_state.
// Run: ORACLE_ENGINE=oracle/dev/stub-engine.ts npx vitest run   (expect many failures on other personas)
import { MVP_PLANS } from '../src/expected/mvp-plans.js';
import { fixture } from '../src/fixtures.js';
import { planToResult } from '../src/synthetic.js';
import type { Input, Result } from '../src/types.js';

export function generate(input: Input): Result {
  for (const p of MVP_PLANS) {
    const f = fixture(p.fixture);
    if (input.goal.target_time_s === f.input.goal.target_time_s && input.goal.distance === f.input.goal.distance && input.profile.birth_year === f.input.profile.birth_year)
      return { ...planToResult(p, f.input), today: input.today };
  }
  return { schema_version: 'v5.2', kind: 'safe_state', ruleset_version: 'v5.2', registry_version: 'v5.2', today: input.today, messages: [], fired_rules: [], engine_state: {}, flags: [], error: { rule_id: 'STUB', detail: 'stub engine' }, previous_plan_kept: false } as unknown as Result;
}

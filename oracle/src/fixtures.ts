// Loads persona inputs: spec/fixtures-input (the shared set) plus oracle/fixtures (added by the oracle).
import fs from 'node:fs';
import path from 'node:path';
import { ORACLE_FIXTURES_DIR, SPEC_FIXTURES_DIR } from './paths.js';
import type { Fixture } from './types.js';

function readDir(dir: string): Fixture[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Fixture);
}
export const specFixtures = (): Fixture[] => readDir(SPEC_FIXTURES_DIR);
export const oracleFixtures = (): Fixture[] => readDir(ORACLE_FIXTURES_DIR);
export const allFixtures = (): Fixture[] => [...specFixtures(), ...oracleFixtures()];
export function fixture(id: string): Fixture {
  const f = allFixtures().find((x) => x.fixture_id === id);
  if (!f) throw new Error(`fixture ${id} not found`);
  return f;
}
/** Deep copy, so transformations never touch the stored fixture. */
export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

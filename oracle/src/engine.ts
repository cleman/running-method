// Adapter to the generator under test. The oracle never imports engine code by default and was written
// without reading engine/ (CLAUDE.md rule 3). Two ways to plug a generator in, chosen by environment
// variables so that nobody has to edit oracle/:
//
//   ORACLE_ENGINE=<path to a module, relative to the repository root>   e.g. engine/src/index.ts
//   ORACLE_ENGINE_EXPORT=<name of the exported function>                 default: generate
//       The function takes one GeneratorInput (spec/schema/input-profile.schema.json) and returns a
//       GeneratorResult (result.schema.json), or a Promise of one.
//
//   ORACLE_RESULTS_DIR=<directory>   offline mode: <fixture_id>.json holds the day-0 result of each fixture.
//
// With neither set, every engine-dependent test is skipped and says so.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO_DIR } from './paths.js';
import type { Input, Result } from './types.js';

export type Generate = (input: Input) => Result | Promise<Result>;

let cached: Generate | null | undefined;

export async function loadEngine(): Promise<Generate | null> {
  if (cached !== undefined) return cached;
  const mod = process.env.ORACLE_ENGINE;
  if (!mod) { cached = null; return null; }
  const file = path.resolve(REPO_DIR, mod);
  const m = await import(pathToFileURL(file).href);
  const name = process.env.ORACLE_ENGINE_EXPORT ?? 'generate';
  const fn = m[name] ?? m.default?.[name] ?? (typeof m.default === 'function' ? m.default : undefined);
  if (typeof fn !== 'function') throw new Error(`ORACLE_ENGINE ${mod} has no exported function ${name}`);
  cached = fn as Generate;
  return cached;
}

/** Day-0 result of a fixture: from the live engine, else from ORACLE_RESULTS_DIR, else null. */
export async function day0(fixtureId: string, input: Input): Promise<Result | null> {
  const g = await loadEngine();
  if (g) return await g(JSON.parse(JSON.stringify(input)));
  const dir = process.env.ORACLE_RESULTS_DIR;
  if (dir) {
    const f = path.resolve(REPO_DIR, dir, `${fixtureId}.json`);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')) as Result;
  }
  return null;
}

export const engineConfigured = (): boolean => !!process.env.ORACLE_ENGINE || !!process.env.ORACLE_RESULTS_DIR;
export const liveEngineConfigured = (): boolean => !!process.env.ORACLE_ENGINE;

// Node entry point with the one-argument signature the oracle harness expects (oracle/src/engine.ts):
// generate(input) → result, with spec/rules.json and spec/parameters.json loaded from the repository.
// Usage from the repository root: ORACLE_ENGINE=engine/node-entry.ts npx vitest run (inside oracle/).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, generate as generateWith, type Spec } from './src/index.ts';
import type { GeneratorInput } from './src/model/types.ts';

const specDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'spec');
let spec: Spec | null = null;
export function loadedSpec(): Spec {
  spec ??= loadSpec(JSON.parse(readFileSync(resolve(specDir, 'rules.json'), 'utf8')), JSON.parse(readFileSync(resolve(specDir, 'parameters.json'), 'utf8')));
  return spec;
}
export function generate(input: GeneratorInput) { return generateWith(loadedSpec(), input); }

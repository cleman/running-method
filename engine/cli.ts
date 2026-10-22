#!/usr/bin/env node
// Command line: node cli.ts profile.json > plan.json
// The input may be a generator input (spec/schema/input-profile.schema.json) or a fixture wrapper ({ input: … }).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, generate, canonical } from './src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pretty = args.includes('--pretty');
const file = args.find(a => !a.startsWith('--'));
if (!file) {
  process.stderr.write('usage: node cli.ts profile.json [--pretty] > plan.json\n');
  process.exit(2);
}
const specDir = resolve(here, '..', 'spec');
const spec = loadSpec(JSON.parse(readFileSync(resolve(specDir, 'rules.json'), 'utf8')), JSON.parse(readFileSync(resolve(specDir, 'parameters.json'), 'utf8')));
const raw = JSON.parse(readFileSync(file, 'utf8'));
const input = raw && typeof raw === 'object' && 'input' in raw && 'fixture_id' in raw ? raw.input : raw;
const result = generate(spec, input);
process.stdout.write((pretty ? JSON.stringify(JSON.parse(canonical(result)), null, 1) : canonical(result)) + '\n');

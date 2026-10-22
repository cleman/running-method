// Test helpers: load the spec bundle and fixtures from ../spec (Node only; src/ never reads files).
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec, type Spec } from '../src/context.ts';
import type { GeneratorInput } from '../src/model/types.ts';

export const SPEC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'spec');
let cached: Spec | null = null;
export function spec(): Spec {
  cached ??= loadSpec(JSON.parse(readFileSync(resolve(SPEC_DIR, 'rules.json'), 'utf8')), JSON.parse(readFileSync(resolve(SPEC_DIR, 'parameters.json'), 'utf8')));
  return cached;
}
export interface Fixture { fixture_id: string; release: string; input: GeneratorInput }
export function fixture(id: string): Fixture { return JSON.parse(readFileSync(resolve(SPEC_DIR, 'fixtures-input', id + '.json'), 'utf8')); }
export function fixtureIds(): string[] { return readdirSync(resolve(SPEC_DIR, 'fixtures-input')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort(); }
export const min = (s: number) => s / 60;
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

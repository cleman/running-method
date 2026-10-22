// Comparison of an engine value with an oracle expectation, with the status rules of
// src/expected/hand-values.ts: a value may match the oracle's value, or one of its listed alternatives
// (a named spec conflict or open question). Every outcome is also appended to reports/ for the owner.
import fs from 'node:fs';
import path from 'node:path';
import { REPORTS_DIR } from './paths.js';

export type Outcome = 'match' | 'match-alt' | 'mismatch';

function eq(a: unknown, b: unknown, tol: number): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eq(x, b[i], tol));
  return JSON.stringify(a) === JSON.stringify(b);
}

export function compare(actual: unknown, value: unknown, alt: unknown[] = [], tol = 0): Outcome {
  if (eq(actual, value, tol)) return 'match';
  if (alt.some((x) => eq(actual, x, tol))) return 'match-alt';
  return 'mismatch';
}

const rows: Record<string, unknown>[] = [];
export function record(row: Record<string, unknown>): void {
  rows.push(row);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, `outcomes-${process.pid}.json`), JSON.stringify(rows, null, 1));
}

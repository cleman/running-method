// TST-110…112 / 14 §10e: the engine against the oracle's hand values (src/expected/hand-values.ts).
// A match with an alternative is reported (reports/outcomes-*.json), not hidden; a mismatch fails and
// names the open question when there is one.
import { describe, expect, it } from 'vitest';
import { engineConfigured, liveEngineConfigured } from '../src/engine.js';
import { HAND_VALUES } from '../src/expected/hand-values.js';
import { compare, record } from '../src/compare.js';
import { callOf } from './helpers.js';

describe.skipIf(!engineConfigured())('hand values (13, 14 §10e)', () => {
  for (const h of HAND_VALUES) {
    const needsReplay = h.call !== 'day0';
    it.skipIf(needsReplay && !liveEngineConfigured())(`${h.id} — ${h.what} [${h.status}${h.oq ? ' ' + h.oq : ''}; ${h.source}; ${h.release}]`, async () => {
      const r = await callOf(h.fixture, h.call);
      if (!r) return;
      const got = h.get(r);
      const out = compare(got, h.value, h.alt, h.tol ?? 0);
      record({ test: 'hand-value', id: h.id, status: h.status, oq: h.oq, expected: h.value, alt: h.alt, got, outcome: out });
      expect(out, `${h.id}: got ${JSON.stringify(got)}, oracle ${JSON.stringify(h.value)}${h.alt ? ` (alternatives ${JSON.stringify(h.alt)})` : ''}${h.oq ? ` — see SPEC-QUESTIONS ${h.oq}` : ''}`).not.toBe('mismatch');
    });
  }
});

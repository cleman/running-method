// The oracle's invariant checker is tested before it judges the engine (14 §3 "fires" / "silent"):
// silent on the hand-computed MVP plans rendered as results, firing on minimal broken copies.
import { describe, expect, it } from 'vitest';
import { PLAN_10K, PLAN_HM } from '../src/expected/mvp-plans.js';
import { fixture, clone } from '../src/fixtures.js';
import { checkResult, violations } from '../src/invariants.js';
import { validateResult } from '../src/schema.js';
import { planToResult } from '../src/synthetic.js';
import { canonical } from '../src/metamorphic.js';
import type { Result } from '../src/types.js';

const cases = [PLAN_10K, PLAN_HM].map((p) => ({ p, input: fixture(p.fixture).input, r: planToResult(p, fixture(p.fixture).input) }));
const inv = (r: Result, input = cases[0].input) => violations(checkResult(input, r)).map((v) => v.inv);

describe('checker is silent on the hand plans', () => {
  for (const { p, input, r } of cases) {
    it(`${p.fixture}: schema-valid and no violation`, () => {
      expect(validateResult(r).errors).toEqual([]);
      expect(violations(checkResult(input, r))).toEqual([]);
    });
  }
});

describe('checker fires on broken copies (one defect each)', () => {
  const base = cases[0].r;
  const mut = (f: (r: Result) => void) => { const r = clone(base); f(r); return r; };
  const lr = (r: Result, w: number) => r.plan!.weeks[w - 1].sessions.find((s) => s.is_long_run)!;
  const grow = (r: Result, w: number, s: ReturnType<typeof lr>, by: number) => { s.planned_duration_s += by; s.segments[0].duration_s! += by; r.plan!.weeks[w - 1].planned_time_s += by; r.plan!.weeks[w - 1].lr_s += by; };
  it('INV-02: week-1 long run 20 % above 1.10 × L30', () => expect(inv(mut((r) => grow(r, 1, lr(r, 1), 600)))).toContain('INV-02'));
  it('INV-11: week total ≠ sum of sessions', () => expect(inv(mut((r) => { r.plan!.weeks[2].planned_time_s += 60; }))).toContain('INV-11'));
  it('INV-17: two hard days in a row (key moved to Saturday before the Sunday long run)', () => expect(inv(mut((r) => {
    const w = r.plan!.weeks[2]; const k = w.sessions.find((s) => s.module_id === 'SES-M-008')!; k.date = '2026-11-21';
  }), { ...cases[0].input, profile: { ...cases[0].input.profile, available_days: ['Tue', 'Wed', 'Fri', 'Sat', 'Sun'] } })).toContain('INV-17'));
  it('INV-21: a run on an unavailable day', () => expect(inv(mut((r) => { r.plan!.weeks[0].sessions[0].date = '2026-11-02'; }))).toContain('INV-21'));
  it('INV-19: a deload inside the taper', () => expect(inv(mut((r) => { r.plan!.weeks[10].is_deload = true; }))).toContain('INV-19'));
  it('INV-15: a pace range in an effort-only plan', () => expect(inv(mut((r) => { r.plan!.pace_mode = 'effort_only'; r.plan!.weeks[1].sessions[0].pace_range = { fast_s_per_km: 320, slow_s_per_km: 340 }; }))).toContain('INV-15'));
  it('INV-05: running with an active cardiac flag', () => expect(inv(base, { ...cases[0].input, flags: [{ id: 'f', kind: 'red_flag', subkind: 'cardiac', rule_id: 'SAF-001', raised_on: '2026-11-02', status: 'active' }] })).toContain('INV-05'));
  it('INV-08: taper week without an E3 touch', () => expect(inv(mut((r) => {
    const w = r.plan!.weeks[10]; const s = w.sessions.find((x) => x.segments.some((g) => g.effort === 'E3'))!;
    s.segments = [{ effort: 'E1', duration_s: s.planned_duration_s, repeats: 1 }]; w.hard_time_s = 0; w.e3_touches = 0;
  }))).toContain('INV-08'));
  it('INV-09: an HR zone without a measured reference', () => expect(inv(mut((r) => { r.plan!.weeks[0].sessions[0].hr_zone = { low_bpm: 120, high_bpm: 140 }; r.plan!.weeks[0].sessions[0].hr_source = 'hrmax_measured'; }))).toContain('INV-09'));
  it('LOD-033: hard share above 0.20 of the week', () => expect(inv(mut((r) => {
    // 12 × 5 min E3 = 3600 s of hard work in a week of 10740 + 2160 s → share 0.28 > 0.20
    const w = r.plan!.weeks[2]; const k = w.sessions.find((s) => s.module_id === 'SES-M-008')!; k.segments[1].repeats = 12; k.planned_duration_s += 9 * 300 + 9 * 120; w.planned_time_s += 3780; w.hard_time_s += 2700;
  }))).toContain('LOD-033'));
  it('GEN-001: a gate stop that still carries running sessions', () => expect(inv(mut((r) => { r.kind = 'gate_stop'; }))).toContain('GEN-001'));
});

describe('canonical serialisation (README §4) used by M-7', () => {
  it('sorts keys and drops whitespace', () => expect(canonical({ b: 1, a: [2, { d: null, c: 1.5 }] })).toBe('{"a":[2,{"c":1.5,"d":null}],"b":1}'));
});

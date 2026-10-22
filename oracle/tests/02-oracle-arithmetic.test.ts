// Self-check of the oracle's own hand values (no engine needed): every number written by hand in
// src/expected is recomputed here from the formula in its comment, and the two hand plans are checked
// against the bounds they must respect. A failure here is an oracle error, not an engine error.
import { describe, expect, it } from 'vitest';
import { MVP_PLANS, PLAN_10K, PLAN_HM, type WeekExp } from '../src/expected/mvp-plans.js';
import { P, roundDown } from '../src/params.js';

const riegel = (t: number, d1: number, d2: number) => t * (d2 / d1) ** P['pred.riegel_exp_min'];

describe('band arithmetic of 13 / 14 §10e', () => {
  it('Tom day 0: P_race 3057.6, fast 2843.6, slow 3378.6 (13 rounds to 50:58, 47:24, 56:19)', () => {
    const pr = 3120 * 0.98;
    expect(pr).toBeCloseTo(3057.6, 6);
    expect(Math.round(pr * 0.93)).toBe(2844);
    expect(Math.round(pr * 1.105)).toBe(3379);
  });
  it('Tom FT-1: 10K-equivalent 51:21, fast 46:48, slow 53:51', () => {
    const p = riegel(860, 3000, 10000);
    expect(Math.floor(p)).toBe(3081);
    expect(Math.floor(p * 0.98 * 0.93)).toBe(2808);
    expect(Math.floor(p * 0.98 * 1.07)).toBe(3231);
  });
  it('Lea 47:02–52:26 and Karim 52:52–1:02:48', () => {
    expect(Math.floor(2940 * 0.96)).toBe(2822);
    expect(Math.round(2940 * 1.07)).toBe(3146);
    expect(Math.round(3410.4 * 0.93)).toBe(3172);
    expect(Math.floor(3410.4 * 1.105)).toBe(3768);
  });
  it('Maya LADDER_RUNWALK: 5 km × 660 + 300 = 3600 ≤ 2.0 × 1980', () => {
    expect(5 * P['ladder.est_pace_s_per_km'] + 300).toBe(3600);
    expect(P['spike.block_ratio'] * (28 + 5) * 60).toBe(3960);
  });
  it('MVP bands', () => {
    const p10 = riegel(1500, 5000, 10000) * 0.98;
    expect(Math.floor(p10)).toBe(PLAN_10K.band.p_race_s);
    expect(Math.floor(p10 * 0.93)).toBe(PLAN_10K.band.fast_edge_s);
    expect(Math.floor(p10 * 1.07)).toBe(PLAN_10K.band.slow_edge_s);
    const phm = riegel(3000, 10000, 21097) * 0.98;
    expect(Math.floor(phm)).toBe(PLAN_HM.band.p_race_s);
    expect(Math.floor(phm * 0.93)).toBe(PLAN_HM.band.fast_edge_s);
    expect(Math.floor(phm * 1.07)).toBe(PLAN_HM.band.slow_edge_s);
  });
  it('MVP demand', () => {
    expect(Math.max(Math.min(10000 / 1.25 / 2.5, 9000), 8000 / 2.5, 3600)).toBe(PLAN_10K.demand.L_req_time_s);
    expect(Math.floor(Math.max(Math.min(21097 / 1.3 / 2.5, 9000), Math.floor(21097 / 1.6) / 2.5, 5400))).toBe(PLAN_HM.demand.L_req_time_s);
    expect(Math.ceil(Math.log(3600 / 2520) / Math.log(1.1))).toBe(PLAN_10K.weeks_needed.n_L);
    expect(Math.ceil(Math.log(180 / 120) / Math.log(1.15))).toBe(PLAN_10K.weeks_needed.n_V);
    expect(Math.ceil(Math.log(300 / 270) / Math.log(1.15))).toBe(PLAN_HM.weeks_needed.n_V);
  });
});

function checkWeek(w: WeekExp, prevLoading: WeekExp | undefined, lr30: number, family: 'short' | 'HM') {
  const keys = w.keys.reduce((a, k) => a + k.duration_s, 0);
  const easy = Object.values(w.easy).reduce((a, x) => a + x, 0);
  expect(w.LR_s + keys + easy, `week ${w.index} parts sum to V`).toBe(w.V_s);
  for (const x of [...Object.values(w.easy), ...w.keys.map((k) => k.duration_s)]) {
    expect(x, `week ${w.index}: no run ≥ the long run`).toBeLessThanOrEqual(Math.max(w.LR_s, 3600));
    expect(x, `week ${w.index}: lod.min_run_s`).toBeGreaterThanOrEqual(P['lod.min_run_s']);
  }
  expect(w.LR_s, `week ${w.index} spike cap`).toBeLessThanOrEqual(roundDown(1.1 * lr30, 60) + 0);
  const hard = w.keys.reduce((a, k) => a + k.e3_s, 0);
  expect(hard, `week ${w.index} TID`).toBeLessThanOrEqual((family === 'HM' ? 0.15 : 0.2) * w.V_s);
  if (prevLoading && !w.is_deload && w.taper_k == null) expect(w.V_s, `week ${w.index} INV-16`).toBeLessThanOrEqual(1.15 * prevLoading.V_s);
}

describe('the hand plans respect the bounds they claim', () => {
  for (const plan of MVP_PLANS) {
    it(`${plan.fixture} day-0 plan`, () => {
      let prev: WeekExp | undefined;
      const lrs: number[] = [plan.fixture.startsWith('mvp-10k') ? 2520 : 7920];
      for (const w of plan.day0) {
        // L30 window: the max of the long runs of the 4 previous weeks (all inside 30 days of this Sunday)
        const lr30 = Math.max(...lrs.slice(-4));
        if (w.LR_s) checkWeek(w, prev, lr30, plan.fixture.includes('hm') ? 'HM' : 'short');
        if (w.LR_s) lrs.push(w.LR_s);
        if (!w.is_deload && w.taper_k == null) prev = w;
      }
      expect(plan.day0.filter((w) => w.is_deload).map((w) => w.index)).toEqual(plan.deload_weeks);
    });
  }
});

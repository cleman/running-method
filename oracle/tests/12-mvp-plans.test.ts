// Item (e): the engine against the two hand-computed MVP plans (oracle/plans/*.md).
import { describe, expect, it } from 'vitest';
import { engineConfigured, liveEngineConfigured } from '../src/engine.js';
import { MVP_PLANS, type WeekExp } from '../src/expected/mvp-plans.js';
import { diffKind, diffWeek } from '../src/plan-match.js';
import { record } from '../src/compare.js';
import { day0Of, replayOf } from './helpers.js';

for (const plan of MVP_PLANS) {
  describe.skipIf(!engineConfigured())(`${plan.fixture}: day-0 plan`, () => {
    it('feasibility: verdict, reasons, weeks needed, slack, demand, band', async () => {
      const r = await day0Of(plan.fixture);
      if (!r) return;
      const f = r.feasibility!;
      expect(r.kind).toBe('plan');
      expect(f.verdict).toBe(plan.verdict);
      expect(f.reasons).toEqual(plan.reasons);
      expect(f.labels).toEqual(plan.labels);
      expect(f.slack).toBe(plan.slack);
      const wn = f.weeks_needed;
      for (const k of ['rtr', 'onboard', 'base', 'build', 'specific', 'taper'] as const) expect(wn[k], `weeks_needed.${k}`).toBe(plan.weeks_needed[k]);
      if (wn.G != null) expect(wn.G, 'weeks_needed.G').toBe(plan.weeks_needed.G);
      if (wn.K_key != null) expect(wn.K_key, 'K_key').toBe(plan.weeks_needed.K_key);
      expect(f.demand?.L_req_time_s).toBe(plan.demand.L_req_time_s);
      expect(f.demand?.V_req_time_s).toBe(plan.demand.V_req_time_s);
      const b = f.predicted_band!;
      expect(Math.abs((b.p_race_s ?? 0) - plan.band.p_race_s)).toBeLessThanOrEqual(1);
      expect(Math.abs(b.fast_edge_s - plan.band.fast_edge_s)).toBeLessThanOrEqual(2);
      expect(Math.abs(b.slow_edge_s - plan.band.slow_edge_s)).toBeLessThanOrEqual(2);
    });
    it('phase outline and deload weeks', async () => {
      const r = await day0Of(plan.fixture);
      if (!r?.plan) return;
      expect(r.plan.phases.map((p) => `${p.type}:${p.start_week}+${p.n_weeks}`).join(' ')).toBe(plan.phases);
      expect(r.plan.weeks.filter((w) => w.is_deload).map((w) => w.index)).toEqual(plan.deload_weeks);
      expect(r.plan.pace_mode).toBe('paced');
    });
    for (const e of plan.day0) {
      it(`week ${e.index} (${e.phase}${e.is_deload ? ' deload' : ''}${e.taper_k ? ' taper ' + e.taper_k : ''}) [${e.status}${e.oq ? ' ' + e.oq : ''}]`, async () => {
        const r = await day0Of(plan.fixture);
        if (!r?.plan) return;
        const d = diffWeek(r.plan.weeks.find((w) => w.index === e.index), e);
        record({ test: 'mvp-day0', fixture: plan.fixture, week: e.index, status: e.status, oq: e.oq, diffs: d });
        expect(d).toEqual([]);
      });
    }
    it('E3 pace range from the measured anchor (03 §3b, nearest 5 s; OQ-06)', async () => {
      const r = await day0Of(plan.fixture);
      const s = r?.plan?.weeks.flatMap((w) => w.sessions).find((x) => x.module_id === 'SES-M-008' && x.pace_range);
      if (!s) return expect.fail('no paced SES-M-008 session in a plan with a measured anchor');
      expect(Math.abs(s.pace_range!.fast_s_per_km - plan.e3_pace[0])).toBeLessThanOrEqual(5);
      expect(Math.abs(s.pace_range!.slow_s_per_km - plan.e3_pace[1])).toBeLessThanOrEqual(5);
    });
  });

  describe.skipIf(!liveEngineConfigured())(`${plan.fixture}: weeks as published at their Monday (as_planned)`, () => {
    const weeks = [...new Set(plan.published.map((p) => p.week))];
    for (const wk of weeks) {
      const exps = plan.published.filter((p) => p.week === wk);
      it(`week ${wk} [${exps.map((x) => `${x.status}${x.oq ? ' ' + x.oq : ''}${x.branch ? ' ' + x.branch : ''}`).join(' | ')}]`, async () => {
        const calls = await replayOf(plan.fixture, wk);
        const c = calls?.find((x) => x.week === wk);
        if (!c) return expect.fail(`the replay stopped before week ${wk} (${calls?.at(-1)?.result.kind})`);
        const results = exps.map((x) => {
          const d = 'kind' in x.expect ? diffKind(c.result, x.expect) : diffWeek(c.published, x.expect as WeekExp);
          return { branch: x.branch ?? 'main', oq: x.oq, diffs: d };
        });
        record({ test: 'mvp-published', fixture: plan.fixture, week: wk, results });
        const hit = results.find((x) => x.diffs.length === 0);
        expect(hit, JSON.stringify(results, null, 1)).toBeDefined();
      });
    }
  });
}

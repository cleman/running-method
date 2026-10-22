// The engine's own validator (07 §5): a clean plan passes; a plan tampered to break an invariant is caught.
// Each test changes one thing in a generated plan and checks the INV that must fire (fires / silent pairs, 14 TST-041).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/generate.ts';
import { validate, type ValidatorView } from '../src/validate/validator.ts';
import { deriveState } from '../src/pipeline/state.ts';
import { addDays } from '../src/util/dates.ts';
import type { Plan, Session } from '../src/model/types.ts';
import { spec, fixture } from './helpers.ts';

function setup(id = 'p3-ana') {
  const input = fixture(id).input;
  const r: any = generate(spec(), input);
  const st = deriveState(spec(), input);
  const plan: Plan = JSON.parse(JSON.stringify(r.plan));
  const view: ValidatorView = {
    input, gate: r.gate,
    state: {
      L30_eff_time_s: st.L30_eff_time_s, L30_eff_dist_m: st.L30_eff_dist_m, L30_source: st.L30_source, V_hold_s: st.V_hold_s, L_hold_s: st.L_hold_s,
      tol_level: st.levels.TOL, tol_confidence: st.level_confidence.TOL, levels: { ...st.levels }, ladderEndDate: null, max_tolerated_g_h: null,
      profileByWeek: plan.weeks.map((_, i) => (i < 3 ? 'slow' : 'standard')), age_low: st.age_low, age_high: st.age_high, logged: [],
    },
    demand: { L_req_time_s: r.feasibility.demand.L_req_time_s, floor_dist_m: r.feasibility.demand.floor_dist_m, met_by_logged_distance: false, family: 'road_classic', distance: 'M', time_cap_s: 180 * 60, runs: 4 },
    anchor: null,
  };
  return { plan, view };
}
const ids = (p: Plan, v: ValidatorView) => validate(spec(), v, p).violations.map(x => x.inv_id);
const recompute = (p: Plan) => { for (const w of p.weeks) w.planned_time_s = w.sessions.reduce((a, s) => a + (s.is_goal_race ? 0 : s.planned_duration_s), 0); };

test('the generated plan passes the validator (silent)', () => {
  const { plan, view } = setup();
  assert.deepEqual(validate(spec(), view, plan).violations, []);
});

test('INV-02 fires when a long run exceeds 1.10 × the 30-day maximum', () => {
  const { plan, view } = setup();
  const lr = plan.weeks[8].sessions.find(s => s.is_long_run)!;
  lr.planned_duration_s += 30 * 60; lr.segments[0].duration_s = lr.planned_duration_s; recompute(plan);
  plan.weeks[8].lr_s = lr.planned_duration_s;
  assert.ok(ids(plan, view).includes('INV-02'));
});

test('INV-11 fires when the week total is not the sum of its sessions', () => {
  const { plan, view } = setup();
  plan.weeks[2].planned_time_s += 600;
  assert.ok(ids(plan, view).includes('INV-11'));
});

test('INV-17 fires on two hard days in a row', () => {
  const { plan, view } = setup();
  const w = plan.weeks[6];                                     // BUILD week: a THR session on Thursday, the long run on Sunday
  const key = w.sessions.find(s => s.is_key && s.is_hard)!;
  const lr = w.sessions.find(s => s.is_long_run)!;
  const sat = w.sessions.find(s => s.date === addDays(lr.date, -1))!;
  [key.date, sat.date] = [sat.date, key.date];
  assert.ok(ids(plan, view).includes('INV-17'));
});

test('INV-21 fires on a session on a blocked date', () => {
  const { plan, view } = setup();
  const s: Session = plan.weeks[3].sessions[0];
  view.input = { ...view.input, profile: { ...view.input.profile, blocked_dates: [s.date] } };
  assert.ok(ids(plan, view).includes('INV-21'));
});

test('INV-06 fires on an E3 session while the gate is proceed_restricted', () => {
  const { plan, view } = setup();
  view.gate = 'proceed_restricted';
  assert.ok(ids(plan, view).includes('INV-06'));
});

test('INV-19 fires on a deload inside the taper', () => {
  const { plan, view } = setup();
  plan.weeks[16].is_deload = true;
  assert.ok(ids(plan, view).includes('INV-19'));
});

test('INV-05 fires when an active pause flag precedes planned runs', () => {
  const { plan, view } = setup();
  view.input = { ...view.input, flags: [{ id: 'f1', kind: 'red_flag', subkind: 'cardiac', rule_id: 'SAF-001', raised_on: plan.weeks[2].start, status: 'active' }] };
  assert.ok(ids(plan, view).includes('INV-05'));
});

test('INV-25 fires when the peak long run is below L_req', () => {
  const { plan, view } = setup();
  view.demand = { ...view.demand, L_req_time_s: 240 * 60 };
  assert.ok(ids(plan, view).includes('INV-25'));
});

test('violations are ordered earliest date first, then lowest INV id (07 §2c)', () => {
  const { plan, view } = setup();
  plan.weeks[2].planned_time_s += 600;
  plan.weeks[16].is_deload = true;
  const v = validate(spec(), view, plan).violations;
  for (let i = 1; i < v.length; i++) assert.ok(v[i - 1].date < v[i].date || (v[i - 1].date === v[i].date && v[i - 1].inv_id <= v[i].inv_id));
});

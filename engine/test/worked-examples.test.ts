// Worked examples of spec/13 (hand values), run through the whole generator on the persona inputs of spec/fixtures-input.
// Day-0 calls only: 13's week rows are "as published at each Monday"; for volume and long run they equal the day-0
// projection (13 §0), while key-session choices after week 2 depend on weekly re-plans and are not asserted here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/generate.ts';
import { paceRange } from '../src/pipeline/demand.ts';
import { riegel } from '../src/pipeline/state.ts';
import { canonical } from '../src/util/canonical.ts';
import { spec, fixture, min } from './helpers.ts';

const near = (a: number, b: number, tol: number, what: string) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (±${tol})`);
const hms = (h: number, m: number, s = 0) => h * 3600 + m * 60 + s;

test('13 §3 P3 Ana: verdict, demand, weeks needed, phases, deloads', () => {
  const r: any = generate(spec(), fixture('p3-ana').input);
  assert.equal(r.kind, 'plan');
  const f = r.feasibility;
  assert.equal(f.verdict, 'feasible');
  assert.deepEqual(f.reasons, []);
  assert.deepEqual(f.labels, ['ESTIMATED_INPUTS']);
  assert.equal(r.state.L30_eff_time_s, 85 * 60);                       // GEN-011: 0.9 × 95 = 85.5 → 85
  near(1000 / r.state.s_slow_m_s, 437, 1, 'S_slow 7:17 /km');
  assert.equal(f.demand.L_req_time_s, 180 * 60);
  assert.equal(f.demand.V_req_time_s, 360 * 60);
  assert.equal(f.demand.distance_stop_m, 30100);
  near(f.demand.expected_race_duration_s, 318 * 60, 60, 'expected race duration 318 min');
  assert.equal(f.weeks_needed.G, 11);
  assert.equal(f.weeks_needed.base, 6);
  assert.equal(f.slack, 4);
  const phases = r.plan.phases.map((p: any) => `${p.type}:${p.start_week}-${p.start_week + p.n_weeks - 1}`).join(' ');
  assert.equal(phases, 'ONBOARD:1-2 BASE:3-6 BUILD:7-7 SPECIFIC:8-15 TAPER:16-18');
  assert.deepEqual(r.plan.weeks.filter((w: any) => w.is_deload).map((w: any) => w.index), [4, 8, 12]);
});

test('13 §3 P3 Ana: V and LR of every week (minutes)', () => {
  const r: any = generate(spec(), fixture('p3-ana').input);
  const V = [231, 252, 277, 207, 304, 334, 360, 270, 360, 360, 360, 270, 360, 360, 360, 288, 234, 180];
  const LR = [93, 102, 112, 84, 123, 135, 148, 111, 162, 178, 180, 135, 180, 180, 180, 144, 117, 0];
  assert.deepEqual(r.plan.weeks.map((w: any) => min(w.lr_s)), LR);
  // weekly planned time: the sessions must sum to the 13 value (INV-11); the field test week may carry the test's rounding
  const got = r.plan.weeks.map((w: any) => min(w.planned_time_s));
  for (let i = 0; i < V.length; i++) near(got[i], V[i], i === 1 ? 1 : 0, `week ${i + 1} V`);
  assert.equal(r.validation.pass, true);
  assert.equal(r.validation.passes_used, 0, 'parity: a feasible persona needs no repair (TST-092)');
});

test('13 §6 Ana week 6: Sunday 135, Saturday 61 (LOD-013), Tuesday and Thursday 69 with strides', () => {
  const r: any = generate(spec(), fixture('p3-ana').input);
  const w6 = r.plan.weeks[5];
  const by = Object.fromEntries(w6.sessions.map((s: any) => [s.weekday, s]));
  assert.equal(min(by.Sun.planned_duration_s), 135);
  assert.equal(by.Sun.fuel_target_g_h, 30);                            // NUT-010: late BASE, 30 g/h
  assert.equal(min(by.Sat.planned_duration_s), 61);
  assert.equal(min(by.Tue.planned_duration_s), 69);
  assert.equal(min(by.Thu.planned_duration_s), 69);
  for (const d of ['Tue', 'Thu']) assert.ok(by[d].segments.some((x: any) => x.role === 'strides' && x.repeats === 4 && x.duration_s === 20), d + ' strides 4 × 20 s');
  assert.equal(w6.hard_time_s, 0);
});

test('13 §3 Ana: taper keeps a sharpener (SES-015) and the race week has no long run', () => {
  const r: any = generate(spec(), fixture('p3-ana').input);
  for (const i of [15, 16]) assert.ok(r.plan.weeks[i].sessions.some((s: any) => s.module_id === 'SES-M-024'), `week ${i + 1} sharpener`);
  const last = r.plan.weeks[17];
  assert.equal(last.lr_s, 0);
  assert.ok(last.sessions.some((s: any) => s.is_goal_race && s.date === '2027-03-07'));
});

test('13 §2 P2 Tom day 0: band 47:24 / 50:58 / 56:19, stretch (TARGET_IN_FAST_BAND), first long run ≤ 73', () => {
  const r: any = generate(spec(), fixture('p2-tom').input);
  const b = r.feasibility.predicted_band;
  near(b.p_race_s, hms(0, 50, 58), 1, 'P_race');
  near(b.fast_edge_s, hms(0, 47, 24), 1, 'fast edge');
  near(b.slow_edge_s, hms(0, 56, 19), 1, 'slow edge');
  assert.equal(r.feasibility.verdict, 'stretch');
  assert.ok(r.feasibility.reasons.includes('TARGET_IN_FAST_BAND'));
  assert.equal(r.feasibility.headline, 'ambitious');
  assert.equal(r.state.L30_eff_time_s, 67 * 60);
  // 13 writes "LR 67 → 73 min (1.10 × L30_eff)". 05 §3 caps LR by L_target = max(L_req 60, L_hold 67) = 67, so the engine
  // plans 67 and reads 73 as the spike cap (engine/README.md, open readings).
  assert.ok(min(r.plan.weeks[0].lr_s) <= 73);
  assert.equal(min(r.plan.weeks[0].lr_s), 67);
  assert.equal(r.plan.pace_mode, 'effort_only');                       // no measured anchor at day 0
  assert.ok(r.plan.weeks[1].sessions.some((s: any) => s.module_id === 'SES-M-019'), 'FT-1 at the end of ONBOARD');
});

test('13 §2 Tom after FT-1 (3 km 14:20): 10K-eq 51:21, P_race 50:20, band 46:48–53:51, E3 ≈ 5:20–5:35', () => {
  const a = { distance_m: 3000, time_s: hms(0, 14, 20) };
  near(riegel(spec(), a, 10000), hms(0, 51, 21), 1, '10K-equivalent');
  const p = riegel(spec(), a, 10000) * 0.98;
  near(p, hms(0, 50, 20), 1, 'P_race');
  near(p * 0.93, hms(0, 46, 48), 1, 'fast edge');
  near(p * 1.07, hms(0, 53, 51), 1, 'slow edge');
  const e3 = paceRange(spec(), a, 'E3')!;
  near(e3.fast_s_per_km, 320, 5, 'E3 fast'); near(e3.slow_s_per_km, 335, 5, 'E3 slow');
});

test('13 R-06 Ana FT-1 (3 km 16:30): E3 6:05–6:25, 10K-equivalent 59:07', () => {
  const a = { distance_m: 3000, time_s: 990 };
  near(riegel(spec(), a, 10000), hms(0, 59, 7), 1, '10K-eq');
  assert.deepEqual(paceRange(spec(), a, 'E3'), { fast_s_per_km: 365, slow_s_per_km: 385 });
});

test('13 §7b Karim (TST-127): band 52:52–1:02:48, infeasible LEVELS_UNREACHABLE, validated options', () => {
  const r: any = generate(spec(), fixture('karim').input);
  assert.equal(r.kind, 'fail_closed');
  assert.equal(r.feasibility.verdict, 'infeasible');
  assert.ok(r.feasibility.reasons.includes('LEVELS_UNREACHABLE'));
  const b = r.feasibility.predicted_band;
  near(b.p_race_s, hms(0, 56, 50), 1, 'P_race');
  near(b.fast_edge_s, hms(0, 52, 52), 1, 'fast edge');
  near(b.slow_edge_s, hms(1, 2, 48), 1, 'slow edge');
  assert.equal(r.feasibility.weeks_needed.K_key, 8);
  const kinds = r.feasibility.options.map((o: any) => o.kind);
  assert.ok(kinds.includes('move_date'), 'move_date offered');
  assert.ok(kinds.includes('lower_goal'), 'lower_goal offered');
  for (const o of r.feasibility.options) assert.notEqual(o.verdict, 'infeasible');
  assert.equal(r.plan, undefined, 'fail closed: no plan for the requested goal');
});

test('13 §7a Lea (TST-122): band 47:02–52:26 (B_fast 4 %: same distance, measured, ≤ 56 days)', () => {
  const r: any = generate(spec(), fixture('lea-goal-switch').input);
  const b = r.feasibility.predicted_band;
  near(b.fast_edge_s, hms(0, 47, 2), 1, 'fast edge');
  near(b.slow_edge_s, hms(0, 52, 26), 1, 'slow edge');
  assert.equal(b.b_fast, 0.04);
});

test('13 §7a Raj (TST-124): half in 4 weeks with 17.0 km measured → feasible (SHARPEN)', () => {
  const r: any = generate(spec(), fixture('raj-hm-4wk').input);
  assert.equal(r.feasibility.verdict, 'feasible');
  assert.equal(r.feasibility.horizon, 'H1');
  assert.ok(r.plan.phases.some((p: any) => p.type === 'SHARPEN'));
});

test('13 §5 P1 Maya: start ladder S1–S9, stretch tight (LOW_SLACK, slack 0), ladder week volumes', () => {
  const r: any = generate(spec(), fixture('p1-maya').input);
  assert.equal(r.feasibility.verdict, 'stretch');
  assert.deepEqual(r.feasibility.reasons, ['LOW_SLACK']);
  assert.equal(r.feasibility.slack, 0);
  assert.equal(r.feasibility.headline, 'tight');
  const rungs = r.plan.weeks.slice(0, 9).map((w: any) => w.sessions[0].ladder.rung);
  assert.deepEqual(rungs, ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9']);
  assert.deepEqual(r.plan.weeks.slice(0, 9).map((w: any) => min(w.planned_time_s)), [75, 75, 69, 79.5, 77, 87, 90, 99, 105]);
  assert.equal(r.plan.weeks.filter((w: any) => w.is_deload).length, 0, 'no deload inside the ladder');
  assert.ok(r.plan.weeks[9].sessions.some((s: any) => s.is_goal_race));
});

test('13 §7a Mia (TST-125) and §7b Rose (TST-128): infeasible on availability', () => {
  const mia: any = generate(spec(), fixture('mia-2-days').input);
  assert.equal(mia.feasibility.verdict, 'infeasible');
  assert.ok(mia.feasibility.reasons.includes('AVAILABILITY_DAYS'));
  const rose: any = generate(spec(), fixture('rose').input);
  assert.equal(rose.feasibility.verdict, 'infeasible');
  for (const c of ['PHASES_DO_NOT_FIT', 'AVAILABILITY_DAYS']) assert.ok(rose.feasibility.reasons.includes(c), c);
});

test('13 §7c red team: TST-095 no plan, TST-096 hold, TST-103 asks for the birth year, TST-104 is 18', () => {
  const t95: any = generate(spec(), fixture('tst095-unsure-chest-item').input);
  assert.equal(t95.kind, 'gate_stop'); assert.equal(t95.gate, 'no_plan');
  const t96: any = generate(spec(), fixture('tst096-pain-form-closed').input);
  assert.equal(t96.kind, 'hold');
  assert.ok(t96.hold.questions.includes('event[0].C1'));
  const t103: any = generate(spec(), fixture('tst103-birth-year-blank').input);
  assert.equal(t103.kind, 'hold'); assert.ok(t103.hold.questions.includes('profile.birth_year'));
  const t104: any = generate(spec(), fixture('tst104-born-feb-2008').input);
  assert.equal(t104.state.age_low, 18);
});

test('GEN-004 determinism: identical inputs give byte-identical output', () => {
  for (const id of ['p3-ana', 'p2-tom', 'karim']) {
    const a = canonical(generate(spec(), fixture(id).input));
    const b = canonical(generate(spec(), fixture(id).input));
    assert.equal(a, b, id);
  }
});

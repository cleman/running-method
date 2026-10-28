// v5.3 (spec CHANGELOG-v5.3): experienced-runner path (02 §2b, EXP-001…006), three key sessions and forms a/b (SES-007,
// SES-026), entry and top rungs (SES-027), planned dose path (SES-028), family rotation (SES-030), time and distance forms
// (SES-031/032), declared paces (INP-005, FEA-014). The engine's own tests; the oracle is written by another session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate } from '../src/generate.ts';
import { canonical } from '../src/util/canonical.ts';
import { deriveState } from '../src/pipeline/state.ts';
import { ageGradePct, bandOf } from '../src/pipeline/experienced.ts';
import { paceRange } from '../src/pipeline/demand.ts';
import { addDays, mondayOf } from '../src/util/dates.ts';
import type { ActivityRecord, GeneratorInput, Plan, Session } from '../src/model/types.ts';
import { spec, SPEC_DIR } from './helpers.ts';
import { validateResult } from './schema-lite.ts';

const CASE = resolve(SPEC_DIR, '..', 'docs', 'v5.3-case');
const clem = (): GeneratorInput => JSON.parse(readFileSync(resolve(CASE, 'clem.json'), 'utf8'));
const clemConfirmed = (): GeneratorInput => JSON.parse(readFileSync(resolve(CASE, 'clem-confirmed.json'), 'utf8'));
const run = (i: GeneratorInput): any => generate(spec(), i);
const keys = (w: Plan['weeks'][number]) => w.sessions.filter(s => s.is_key);
const hardDay = (s: Session) => s.is_hard;

test('age-grade (02 §2b): 1:21:37 half marathon, man of 36 → about 71.5%; sex unknown takes the lower table', () => {
  const m = ageGradePct(spec(), 'HM', 4897, 36, 'm')!;
  const f = ageGradePct(spec(), 'HM', 4897, 36, 'f')!;
  const u = ageGradePct(spec(), 'HM', 4897, 36, null)!;
  assert.ok(m > 71 && m < 72, String(m));
  assert.ok(f > m);
  assert.equal(u, Math.min(m, f));
  assert.equal(bandOf(spec(), m), '65');
  assert.equal(bandOf(spec(), 54.9), '0');
  assert.equal(bandOf(spec(), 75), '75');
});

test('EXP-006 fires and EXP-001 is silent while the official-result question is unanswered (clem.json as given)', () => {
  const r = run(clem());
  assert.equal(r.kind, 'plan');
  assert.equal(r.state.exp_path, 'none');
  assert.ok(r.messages.some((m: any) => m.id === 'MSG-EXP-CONFIRM-Q'));
  assert.ok(!r.state.levels.some((l: any) => l.node === 'THR'), 'no THR level from a race on the cautious path');
  assert.equal(r.state.L30_eff_time_s, 90 * 60, 'cautious path: claimed L30 capped at TOL 2 (90 min)');
  assert.ok(r.plan.phases.some((p: any) => p.type === 'ONBOARD'));
});

test('EXP-001 / EXP-002: the confirmed case enters the experienced path with declared levels', () => {
  const r = run(clemConfirmed());
  assert.equal(r.kind, 'plan');
  assert.equal(r.state.exp_path, 'calibrating');
  assert.equal(r.state.exp_calibration_until, '2026-11-22');
  const lv = Object.fromEntries(r.state.levels.map((l: any) => [l.node, l]));
  assert.equal(lv.THR.level, 3); assert.equal(lv.THR.confidence, 'declared'); assert.equal(lv.THR.source, 'race_result');
  assert.equal(lv.VO2.level, 2);
  assert.equal(lv.MSP, undefined, 'a half marathon does not set MSP for a 10K goal');
  for (const n of ['HAB', 'TOL', 'AER', 'DUR']) assert.equal(lv[n].level, 3, n);
  assert.equal(r.state.L30_eff_time_s, 149 * 60, 'GEN-011: 0.9 × 166 min, no TOL cap');
  assert.equal(r.state.progression_profile, 'standard');
  assert.ok(!r.plan.phases.some((p: any) => p.type === 'ONBOARD'), '04 §1: no ONBOARD on the experienced path');
  assert.equal(r.engine_state.experienced.path, 'calibrating');
  assert.ok(r.messages.some((m: any) => m.id === 'MSG-EXP-PATH'));
});

test('EXP-001 silent: race too old, too little training age, inconsistent claims, pain flag', () => {
  const variants: [string, (i: GeneratorInput) => void][] = [
    ['race 90 days old', i => { i.anchors[0].date = addDays(i.today, -90); }],
    ['training age 1 year', i => { i.profile.training_age_years = 1; }],
    ['claims of 120 min a week with a 71% race', i => { i.claim.weekly_time_s = 7200; }],
    ['race not all-out', i => { i.anchors[0].effort_all_out = false; }],
    ['injury in the last 12 weeks', i => { i.profile.injury_last_12m = true; i.profile.injury_last_12w = true; }],
    ['active pain flag', i => { i.flags = [{ id: 'f1', kind: 'pain', subkind: 'pain_persistent', rule_id: 'SAF-020', raised_on: i.today, status: 'active' }]; }],
  ];
  for (const [why, f] of variants) {
    const i = clemConfirmed(); f(i);
    const st = deriveState(spec(), i);
    assert.notEqual(st.exp.path, 'calibrating', why);
  }
  // an injury more than 12 weeks ago does not block
  const i = clemConfirmed(); i.profile.injury_last_12m = true; i.profile.injury_last_12w = false;
  assert.equal(deriveState(spec(), i).exp.path, 'calibrating');
});

test('EXP-003: calibration weeks hold exactly SES-M-008 and SES-M-010 at their entry rungs', () => {
  const r = run(clemConfirmed());
  const cal = r.plan.weeks.filter((w: any) => w.is_calibration && !w.is_deload);
  assert.equal(cal.length, 3);
  for (const w of cal) {
    const k = keys(w);
    assert.deepEqual(k.map((s: Session) => s.module_id).sort(), ['SES-M-008', 'SES-M-010']);
    assert.equal(k.find((s: Session) => s.module_id === 'SES-M-008')!.dose_step, 5, 'THR 3 entry rung: 5 × 8 min');
    assert.equal(k.find((s: Session) => s.module_id === 'SES-M-010')!.dose_step, 2, 'VO2 2 entry rung: 5 × 3 min');
  }
});

test('SES-007 / SES-026: three key sessions in non-deload BUILD and SPECIFIC weeks, form a easy long run, form b steady finish', () => {
  const r = run(clemConfirmed());
  const ws = r.plan.weeks.filter((w: any) => ['BUILD', 'SPECIFIC'].includes(w.phase) && !w.is_deload);
  assert.ok(ws.length > 0);
  for (const w of ws) {
    assert.equal(w.quality_max, 3, `week ${w.index}`);
    const lr = w.sessions.find((s: Session) => s.is_long_run)!;
    if (w.long_run_form === 'a') {
      assert.equal(keys(w).length, 3);
      assert.ok(lr.segments.every((x: any) => x.effort === 'E1') && !lr.is_hard, `week ${w.index} form a long run is easy and not hard`);
    } else {
      assert.equal(w.long_run_form, 'b');
      assert.equal(lr.module_id, 'SES-M-031');
      assert.ok(lr.is_hard && lr.is_key && lr.segments.some((x: any) => x.effort === 'E2'));
      assert.equal(keys(w).length, 3);
    }
    // SES-004: never two hard days in a row
    const hard = w.sessions.filter(hardDay).map((s: Session) => s.date).sort();
    for (let i = 1; i < hard.length; i++) assert.notEqual(addDays(hard[i - 1], 1), hard[i], `week ${w.index}`);
  }
  assert.equal(r.validation.pass, true);
});

test('SES-006: the runner ceiling hard_sessions_max = 2 keeps two key sessions', () => {
  const i = clemConfirmed(); i.profile.hard_sessions_max = 2;
  const r = run(i);
  for (const w of r.plan.weeks) assert.ok(keys(w).filter((s: Session) => !s.is_long_run).length <= 2 && w.quality_max <= 2, `week ${w.index}`);
});

test('SES-030: a family slot never repeats its module two weeks running while another member was eligible', () => {
  const r = run(clemConfirmed());
  const fam: Record<string, string> = { 'SES-M-008': 'THR', 'SES-M-009': 'THR', 'SES-M-030': 'THR', 'SES-M-010': 'VO2', 'SES-M-027': 'VO2', 'SES-M-029': 'VO2' };
  const seq: Record<string, string[]> = { THR: [], VO2: [] };
  for (const w of r.plan.weeks.filter((x: any) => ['BUILD', 'SPECIFIC'].includes(x.phase) && !x.is_deload)) {
    for (const s of keys(w)) if (fam[s.module_id]) seq[fam[s.module_id]].push(s.module_id);
  }
  for (const f of ['THR', 'VO2']) for (let i = 1; i < seq[f].length; i++) assert.notEqual(seq[f][i], seq[f][i - 1], `${f}: ${seq[f].join(' ')}`);
  assert.ok(new Set(seq.VO2).size >= 3 && new Set(seq.THR).size >= 3, 'at least three members of each family are used');
});

test('SES-027 / SES-028: entry rung by level, planned path one step per instance, within the top rung', () => {
  const r = run(clemConfirmed());
  const steps: number[] = [];
  for (const w of r.plan.weeks) for (const s of keys(w)) if (s.module_id === 'SES-M-008' && !w.is_deload && !w.is_calibration) steps.push(s.dose_step!);
  assert.ok(steps.length >= 3);
  // one rung per instance at most; a step down only where the week's hard-time budget does not hold the next rung (dose_fit)
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i] - steps[i - 1] <= 1, steps.join(','));
  assert.ok(steps.at(-1)! > steps[0], 'the planned path rises');
  assert.ok(Math.max(...steps) <= 7, 'THR 3 top rung: 4 × 12 min');
  // the cautious path keeps the v5.2 start: a THR-0 runner's first threshold session is 3 × 5 min
  const tom = run(JSON.parse(readFileSync(resolve(SPEC_DIR, 'fixtures-input', 'p2-tom.json'), 'utf8')).input);
  const first = tom.plan.weeks.flatMap((w: any) => w.sessions).find((s: Session) => s.module_id === 'SES-M-008');
  if (first) assert.equal(first.dose_step, 0);
  assert.ok(r.messages.some((m: any) => m.id === 'MSG-SES-PROJECTION'));
});

test('SES-031 / SES-032: distance form within the rounding tolerance; time preference and effort-only plans keep time', () => {
  const r = run(clemConfirmed());
  const anchor = { distance_m: 21097, time_s: 4897 };
  let n = 0;
  for (const s of r.plan.weeks.flatMap((w: any) => w.sessions) as Session[]) {
    if (!s.prescription_form || s.prescription_form === 'time') continue;
    for (const g of s.segments.filter(x => x.role === 'work' && x.show_distance_m)) {
      const pr = paceRange(spec(), anchor, g.effort)!;
      const slow = Math.ceil(pr.slow_s_per_km * 1.02 / 5 - 1e-9) * 5;
      const v = (1000 / pr.fast_s_per_km + 1000 / slow) / 2;
      const raw = g.duration_s! * v;
      assert.ok(Math.abs(g.show_distance_m! - raw) / raw <= 0.1, `${s.id}: ${g.show_distance_m} vs ${raw}`);
      n++;
    }
  }
  assert.ok(n > 10);
  const t = clemConfirmed(); t.profile.prescription_preference = 'time';
  const rt = run(t);
  assert.ok(rt.plan.weeks.flatMap((w: any) => w.sessions).every((s: Session) => !s.prescription_form || s.prescription_form === 'time'));
  assert.ok(rt.plan.weeks.flatMap((w: any) => w.sessions).every((s: Session) => s.segments.every(g => g.show_distance_m == null)));
  const e = run(clem());   // cautious path, late race entry: effort only
  assert.ok(e.plan.weeks.flatMap((w: any) => w.sessions).every((s: Session) => !s.prescription_form || s.prescription_form === 'time'));
});

test('INP-005 / FEA-014: a declared race sets paces on the experienced path, slow edge widened by 2%', () => {
  const r = run(clemConfirmed());
  const s = r.plan.weeks[0].sessions.find((x: Session) => x.effort_target === 'E3' && x.pace_range)!;
  const pr = paceRange(spec(), { distance_m: 21097, time_s: 4897 }, 'E3')!;
  assert.equal(s.pace_range.fast_s_per_km, pr.fast_s_per_km);
  assert.equal(s.pace_range.slow_s_per_km, Math.ceil(pr.slow_s_per_km * 1.02 / 5 - 1e-9) * 5);
  assert.equal(r.plan.pace_mode, 'paced');
});

// ---- re-plans: the runner logs the published week, and the next Monday the plan is regenerated
function logWeek(prev: any, input: GeneratorInput, weekIdx: number, f: (s: Session) => Partial<ActivityRecord> | null): ActivityRecord[] {
  const w = prev.plan.weeks[weekIdx];
  const out: ActivityRecord[] = [];
  for (const s of w.sessions as Session[]) {
    if (!s.is_run || s.is_goal_race) continue;
    const x = f(s);
    if (!x) continue;
    out.push({ id: `${s.date}-${s.id}`, date: s.date, entered_at: `${s.date}T20:00:00+01:00`, type: 'run', source: 'tick', planned_session_id: s.id, module_id: s.module_id,
      duration_s: s.planned_duration_s, distance_m: null, rpe_0_10: s.is_key ? 6 : 3, pain_any: false, pain_0_10: 0, pain_next_morning: false, ...x } as ActivityRecord);
  }
  void input;
  return out;
}
function replan(prev: any, input: GeneratorInput, log: ActivityRecord[], weeks: number): GeneratorInput {
  const today = addDays(prev.plan.plan_start, 7 * weeks);
  return { ...input, today, log: [...input.log, ...log], engine_state: prev.engine_state, parent_plan: prev.plan };
}

test('EXP-005: three calibration weeks logged as planned confirm the path and the baseline', () => {
  let input = clemConfirmed();
  let r = run(input);
  for (let k = 0; k < 3; k++) {
    input = replan(r, input, logWeek(r, input, 0, () => ({})), 1);
    r = run(input);
    assert.equal(r.kind, 'plan', `re-plan ${k + 1}`);
  }
  assert.equal(r.state.exp_path, 'confirmed');
  assert.equal(r.state.baseline_confirmed, true);
  const lv = Object.fromEntries(r.state.levels.map((l: any) => [l.node, l]));
  assert.equal(lv.TOL.confidence, 'measured');
  assert.equal(lv.THR.confidence, 'declared');
});

test('EXP-004: a missed calibration week moves the runner back to the cautious path', () => {
  // S2 only: a re-plan after a fully missed week fails closed in this engine whatever the path (the adaptation rules of 08
  // are not built; docs/test-report.md "Not covered")
  const input0 = clemConfirmed();
  const r0 = run(input0);
  const st = deriveState(spec(), replan(r0, input0, [], 1));
  assert.equal(st.exp.path, 'fallen_back');
  assert.equal(st.exp.fallback_reason, 'missed_week');
  assert.ok(st.exp.messages.includes('MSG-EXP-FALLBACK'));
  assert.ok(st.levels.THR <= 1 && st.levels.TOL <= 2, 'cautious levels again');
  assert.equal(st.L30_eff_time_s, 90 * 60, 'the TOL cap of GEN-011 applies again');
  // a logged week at 70% of plan also falls back (volume)
  const log = logWeek(r0, input0, 0, s => ({ duration_s: Math.round(s.planned_duration_s * 0.7) }));
  assert.equal(deriveState(spec(), replan(r0, input0, log, 1)).exp.fallback_reason, 'volume');
  // and a fallen-back runner never re-enters this season
  const again = { ...input0, engine_state: { ...(r0.engine_state as object), experienced: { path: 'fallen_back' as const } } } as GeneratorInput;
  assert.equal(deriveState(spec(), again).exp.path, 'fallen_back');
});

test('EXP-004: two key sessions logged far too hard move only THR and VO2 back', () => {
  const input0 = clemConfirmed();
  const r0 = run(input0);
  const log = logWeek(r0, input0, 0, s => (s.is_key ? { rpe_0_10: 9 } : {}));
  const r1 = run(replan(r0, input0, log, 1));
  assert.equal(r1.state.exp_path, 'calibrating');
  assert.deepEqual(r1.engine_state.experienced.fallback_nodes, ['THR', 'VO2']);
  const lv = Object.fromEntries(r1.state.levels.map((l: any) => [l.node, l.level]));
  assert.ok((lv.THR ?? 0) <= 1 && (lv.VO2 ?? 0) <= 1);
  assert.equal(lv.TOL, 3, 'the volume side stays');
});

test('v5.3 results validate against result.schema.json and are deterministic', () => {
  for (const i of [clem(), clemConfirmed()]) {
    const a = canonical(run(i)), b = canonical(run(i));
    assert.equal(a, b);
    assert.deepEqual(validateResult(JSON.parse(a)), []);
  }
  void mondayOf;
});

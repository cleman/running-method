// v5.3 (no engine needed): the oracle's own derivations for the five advanced personas, the transcription of the
// v5.3 parameters, the hand-plan arithmetic of the owner's case, and the v5.3 checker tested before it judges an
// engine (silent on the hand plan, firing on broken copies).
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { clone, fixture } from '../src/fixtures.js';
import { REPORTS_DIR, SPEC_DIR } from '../src/paths.js';
import { checkResult, violations } from '../src/invariants.js';
import { checkQuality } from '../src/quality.js';
import { deriveExp, equivalents, midSpeed, nearestTrack, paceRanges, renderRecovery, renderRep } from '../src/v53.js';
import { ENTRY_RUNG, LADDER, PV, TOP_RUNG, WMA_AGE_FACTOR, WMA_OPEN_S, rungTimes } from '../src/v53-params.js';
import { CLEM_EXPECT, CLEM_WEEKS, keyS, keyWorkS } from '../src/expected/v53-clem-plan.js';
import { clemResult } from '../src/v53-synthetic.js';
import { validateResult } from '../src/schema.js';
import type { Result } from '../src/types.js';

describe('v5.3 parameters: oracle transcription vs spec/parameters.json (findings, not fixes)', () => {
  it('scalars, ladders, rung tables and age-grade tables', () => {
    const reg = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, 'parameters.json'), 'utf8'));
    const by = new Map<string, any>(reg.parameters.map((p: any) => [p.id, p.default]));
    const findings: { id: string; oracle: unknown; registry: unknown }[] = [];
    let compared = 0;
    const cmp = (id: string, o: unknown, r: unknown) => { compared++; if (JSON.stringify(o) !== JSON.stringify(r)) findings.push({ id, oracle: o, registry: r }); };
    for (const [id, v] of Object.entries(PV)) cmp(id, v, by.get(id));
    cmp('ses.entry_rung', ENTRY_RUNG, by.get('ses.entry_rung.<SES-M-id>'));
    cmp('ses.top_rung', TOP_RUNG, by.get('ses.top_rung.<SES-M-id>'));
    cmp('perf.wma_open_s', WMA_OPEN_S, by.get('perf.wma_open_s'));
    const ages = (t: Record<number, number>) => Object.fromEntries(Object.entries(t).map(([k, x]) => [k, x]));
    cmp('perf.wma_age_factor', { m: ages(WMA_AGE_FACTOR.m), f: ages(WMA_AGE_FACTOR.f) }, by.get('perf.wma_age_factor'));
    // ladders: compare reps / rep_s / rec_s of each step (the registry's block format differs in shape only)
    for (const m of ['SES-M-008', 'SES-M-009', 'SES-M-010', 'SES-M-027', 'SES-M-028', 'SES-M-029', 'SES-M-030']) {
      const r = by.get(`ses.dose.${m}.steps`) as any[];
      const norm = (blocks: any[]) => blocks.map((b) => [b.reps, b.rep_s, b.reps > 1 ? b.rec_s ?? 0 : 0, b.rec_after_s ?? 0]);
      cmp(`ses.dose.${m}.steps`, LADDER[m].map(norm), r.map((st) => norm(st.blocks ?? [st])));
    }
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(REPORTS_DIR, 'params-v53-diff.json'), JSON.stringify({ compared, findings }, null, 1));
    if (findings.length) console.log('V5.3 PARAMETER FINDINGS:', JSON.stringify(findings, null, 1));
    expect(compared).toBeGreaterThan(25);
  });
});

describe('EXP-001 / EXP-002 / EXP-006 from the raw inputs (02 §2b)', () => {
  const cases: [string, boolean, number, Record<string, number> | null, boolean][] = [
    // id, experienced, age-grade (2 decimals), levels, asks "official result?"
    ['v53-clem', false, 71.54, null, true],
    ['v53-clem-confirmed', true, 71.54, { HAB: 3, TOL: 3, AER: 3, DUR: 3, THR: 3, VO2: 2, MSP: 0 }, false],
    ['v53-marathon-3h', true, 68.71, { HAB: 3, TOL: 3, AER: 3, DUR: 3, THR: 3, VO2: 2, MSP: 1 }, false],
    ['v53-5k-19min-5runs', true, 73.16, { HAB: 3, TOL: 2, AER: 3, DUR: 1, THR: 3, VO2: 2, MSP: 1 }, false],
    ['v53-masters-55-ag70', true, 70.16, { HAB: 3, TOL: 3, AER: 3, DUR: 2, THR: 3, VO2: 2, MSP: 1 }, false],
    ['v53-inconsistent-claims', false, 73.98, null, false],
  ];
  for (const [id, expd, ag, lv, ask] of cases) it(id, () => {
    const e = deriveExp(fixture(id).input);
    expect(e.experienced, e.failing.join('; ')).toBe(expd);
    expect(e.agegradePct!).toBeCloseTo(ag, 2);
    expect(e.asksConfirm).toBe(ask);
    if (lv) expect(e.levels).toEqual(lv);
  });
  it('the inconsistent runner fails on the volume band only', () => {
    expect(deriveExp(fixture('v53-inconsistent-claims').input).failing).toEqual(['claimed 150 min/week outside the 65% row band']);
  });
  it('the owner as typed fails on the unanswered question only', () => {
    expect(deriveExp(fixture('v53-clem').input).failing).toEqual(['official_result_confirmed ≠ true']);
  });
  it('a race older than 84 days, or 1 year of training, leaves the path (T-EXP-001-silent)', () => {
    const a = clone(fixture('v53-clem-confirmed').input); a.anchors[0].date = '2026-08-01';
    expect(deriveExp(a).experienced).toBe(false);
    const b = clone(fixture('v53-clem-confirmed').input); b.profile.training_age_years = 0.6;
    expect(deriveExp(b).experienced).toBe(false);
  });
});

describe('owner case: paces and distance forms (03 §3b, 06 §2d)', () => {
  const a = fixture('v53-clem-confirmed').input.anchors[0] as { distance_m: number; time_s: number };
  it('equivalent times from the 1:21:37 half (Riegel 1.06; marathon × 2.19)', () => {
    const e = equivalents(a.distance_m, a.time_s);
    expect(e.T5K).toBeCloseTo(1064.5, 0); // 17:45
    expect(e.T10K).toBeCloseTo(2219.5, 0); // 36:59
    expect(e.TM).toBeCloseTo(10724.4, 0); // 2:58:44
  });
  for (const r of ['A', 'B'] as const) it(`pace ranges, reading ${r} (OQ-27)`, () => {
    const p = paceRanges(a, true, r);
    expect(p.E3).toEqual(CLEM_EXPECT.pace[r].E3);
    expect(p.E4).toEqual(CLEM_EXPECT.pace[r].E4);
    expect(p.E1).toEqual(CLEM_EXPECT.pace[r].E1);
  });
  it('track distances of every key segment of the hand plan, under both readings', () => {
    for (const r of ['A', 'B'] as const) {
      const p = paceRanges(a, true, r);
      for (const w of CLEM_WEEKS) for (const k of w.keys) LADDER[k.module][k.step].forEach((b, i) => {
        const x = renderRep(b.rep_s, midSpeed(p[b.effort as 'E3' | 'E4']));
        expect(x.show_m, `${k.module} step ${k.step} block ${i + 1} reading ${r} (${x.exact_m.toFixed(0)} m)`).toBe(k.dist[i].rep_m);
        if (k.dist[i].rec_m != null) {
          const rec = b.reps > 1 ? b.rec_s! : b.rec_after_s!;
          expect(renderRecovery(rec, midSpeed(p.E1))).toBe(k.dist[i].rec_m);
        }
      });
    }
  });
  it('nearest track distance: ties to the shorter, then whole km', () => {
    expect(nearestTrack(700)).toBe(600);
    expect(nearestTrack(2499)).toBe(2000);
    expect(nearestTrack(2600)).toBe(3000);
    expect(renderRep(100, 4.6).show_m).toBe(500); // 460 m → 500 (8.7 %)
    expect(renderRep(155, 4.6).show_m).toBe(null); // 713 m → 800 is 12.2 % away, 600 15.9 % → time form, about 700 m
    expect(renderRep(155, 4.6).about_m).toBe(700);
  });
});

describe('owner case: hand-plan arithmetic (plans/v53-clem-experienced.md)', () => {
  it('session times of the ladder steps used', () => {
    expect(rungTimes(LADDER['SES-M-008'][5]).session_s).toBe(3780); // 600 + 2400 + 480 + 300
    expect(rungTimes(LADDER['SES-M-010'][2]).session_s).toBe(2520); // 600 + 900 + 720 + 300
    expect(rungTimes(LADDER['SES-M-008'][6]).session_s).toBe(3900);
    expect(rungTimes(LADDER['SES-M-008'][7]).session_s).toBe(4140);
    expect(rungTimes(LADDER['SES-M-009'][3]).session_s).toBe(2700);
    expect(rungTimes(LADDER['SES-M-027'][2]).session_s).toBe(2640);
    expect(rungTimes(LADDER['SES-M-030'][1]).session_s).toBe(2940);
  });
  for (const w of CLEM_WEEKS) it(`week ${w.index}: long run + keys + easy = V; hard ≤ 0.20 V; easy ≥ 15 min`, () => {
    const sum = w.LR_s + w.keys.reduce((a, k) => a + keyS(k), 0) + Object.values(w.easy).reduce((a, x) => a + x, 0);
    expect(sum).toBe(w.V_s);
    expect(w.keys.reduce((a, k) => a + keyWorkS(k), 0)).toBeLessThanOrEqual(0.2 * w.V_s);
    for (const x of Object.values(w.easy)) expect(x).toBeGreaterThanOrEqual(900);
    expect(1 + w.keys.length + Object.keys(w.easy).length).toBe(7);
  });
  it('entry rungs: THR 3 → SES-M-008 step 5 (5 × 8), VO2 2 → SES-M-010 step 2 (5 × 3); top rung THR 3 = 7', () => {
    expect(ENTRY_RUNG['SES-M-008'][3]).toBe(5);
    expect(ENTRY_RUNG['SES-M-010'][2]).toBe(2);
    expect(TOP_RUNG['SES-M-008'][3]).toBe(7);
  });
  it('L30_eff and long run: 0.9 × 9960 = 8964 s → 8940 s', () => {
    expect(0.9 * 9960).toBeCloseTo(CLEM_EXPECT.L30_eff_s, 6);
    expect(Math.floor(CLEM_EXPECT.L30_eff_s / 60) * 60).toBe(8940);
  });
});

describe('v5.3 checker is silent on the hand plan and fires on broken copies', () => {
  const input = fixture('v53-clem-confirmed').input;
  const base = clemResult(input, CLEM_WEEKS);
  const all = (r: Result, i = input) => [...violations(checkResult(i, r)), ...violations(checkQuality(i, r))];
  const ids = (r: Result, i = input) => all(r, i).map((v) => v.inv);
  const mut = (f: (r: Result) => void) => { const r = clone(base); f(r); return r; };
  const wk = (r: Result, i: number) => r.plan!.weeks[i - 1];
  const key = (r: Result, i: number, m: string) => wk(r, i).sessions.find((s) => s.module_id === m)!;

  it('the rendered hand plan is schema-valid', () => expect(validateResult(base).errors).toEqual([]));
  it('no invariant or quality violation on the hand plan', () => expect(all(base)).toEqual([]));
  it('INV-17 is not raised by the Saturday workout before the all-E1 Sunday long run (form a)', () => expect(ids(base)).not.toContain('INV-17'));
  it('QC-06 + INV-17: a steady finish on that long run makes the Saturday workout illegal', () => expect(ids(mut((r) => {
    const lr = wk(r, 9).sessions.find((s) => s.is_long_run)!;
    lr.segments = [{ effort: 'E1', duration_s: lr.planned_duration_s - 900, repeats: 1 }, { effort: 'E2', duration_s: 900, repeats: 1 }];
    lr.is_hard = true;
  }))).toEqual(expect.arrayContaining(['QC-06', 'INV-17'])));
  it('QC-02: a BUILD week with one key session (two keys only warn: SES-006 may drop one)', () => {
    const two = mut((r) => { const w = wk(r, 9); key(r, 9, 'SES-M-027').is_key = false; w.key_session_count -= 1; });
    expect(checkQuality(input, two).filter((f) => f.inv === 'QC-02').map((f) => f.severity)).toEqual(['warning']);
    expect(ids(mut((r) => {
      const w = wk(r, 9); for (const m of ['SES-M-027', 'SES-M-030']) key(r, 9, m).is_key = false; w.key_session_count -= 2;
    }))).toContain('QC-02');
  });
  it('QC-02: a third key session in a calibration week', () => expect(ids(mut((r) => {
    const w = wk(r, 2); const e = w.sessions.find((s) => s.module_id === 'SES-M-001' && s.date.endsWith('11-13'))!; e.is_key = true; w.key_session_count += 1;
  }))).toContain('QC-02'));
  it('EXP-003: a calibration session above its entry rung', () => expect(ids(mut((r) => { key(r, 2, 'SES-M-008').dose_step = 6; }))).toContain('EXP-003'));
  it('EXP-P: the result says cautious path', () => expect(ids(mut((r) => { (r.state as any).exp_path = 'none'; }))).toContain('EXP-P'));
  it('EXP-002: THR level 2 instead of 3', () => expect(ids(mut((r) => { (r.state as any).levels.find((l: any) => l.node === 'THR').level = 2; }))).toContain('EXP-002'));
  it('QC-01: a loading week at 75 % of the claimed week', () => expect(ids(mut((r) => {
    const w = wk(r, 5); for (const s of w.sessions.filter((x) => x.module_id === 'SES-M-001')) { s.planned_duration_s -= 1440; s.segments[0].duration_s! -= 1440; } w.planned_time_s -= 5 * 1440;
  }))).toContain('QC-01'));
  it('QC-05: a 120-min long run outside deload and taper (< 0.8 × 166)', () => expect(ids(mut((r) => {
    const w = wk(r, 6); const lr = w.sessions.find((s) => s.is_long_run)!; lr.planned_duration_s = 7200; lr.segments[0].duration_s = 7200;
    const e = w.sessions.find((s) => s.module_id === 'SES-M-001')!; e.planned_duration_s += 1740; e.segments[0].duration_s! += 1740; w.lr_s = 7200;
  }))).toContain('QC-05'));
  it('RD-01: 5 × 8 min at threshold shown as 1600 m', () => expect(ids(mut((r) => { key(r, 1, 'SES-M-008').segments[1].show_distance_m = 1600; }))).toContain('RD-01'));
  it('RD-02: a rendered segment prescribed by distance', () => expect(ids(mut((r) => { const g = key(r, 1, 'SES-M-008').segments[1]; g.distance_m = 2000; }))).toContain('RD-02'));
  it('RD-03: distances on an effort-only plan', () => expect(ids(mut((r) => { r.plan!.pace_mode = 'effort_only'; for (const w of r.plan!.weeks) for (const s of w.sessions) s.pace_range = null; }))).toContain('RD-03'));
  it('RD-03: the runner prefers time', () => {
    const i = clone(input); i.profile.prescription_preference = 'time';
    expect(ids(base, i)).toContain('RD-03');
  });
  it('RD-04: a 2-min jog shown as 800 m', () => expect(ids(mut((r) => { key(r, 1, 'SES-M-008').segments[1].recovery!.show_distance_m = 800; }))).toContain('RD-04'));
  it('QC-08: paces known, distance preferred, but the form is time', () => expect(ids(mut((r) => { const s = key(r, 1, 'SES-M-010'); s.prescription_form = 'time'; delete s.segments[1].show_distance_m; }))).toContain('QC-08'));
  it('QC-03 is only a warning in BASE weeks 5–7 (one key a week, Q-E34)', () => {
    const q = checkQuality(input, base).filter((f) => f.inv === 'QC-03');
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((f) => f.severity === 'warning')).toBe(true);
  });
  it('QC-05 is only a warning in deload weeks (OQ-30)', () => {
    const q = checkQuality(input, base).filter((f) => f.inv === 'QC-05');
    expect(q.map((f) => f.week)).toEqual([4, 8]);
    expect(q.every((f) => f.severity === 'warning')).toBe(true);
  });
  it('cautious path (owner as typed): the same plan breaks EXP-P and QC rules', () => {
    expect(ids(base, fixture('v53-clem').input)).toEqual(expect.arrayContaining(['EXP-P', 'RD-03']));
  });
});

// Checks the page's own logic in Node against the real engine: answers → generator input → result → text.
// Usage, from web/:  node check.mjs      (Node ≥ 22.18; no browser needed)
// What it checks: every input passes the engine without a crash; every message id in a result exists in
// messages.md; no text shown to the runner keeps a "{placeholder}"; options can be applied and re-generated;
// a weekly re-plan with the log chained through engine_state works. It does not check the screens themselves.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../engine/node-entry.ts';
import { parseMessages, parseModules, paramDefaults } from './src/catalogue.mjs';
import { emptyState, buildInput, applyOption, PARQ_PLACEHOLDERS, SYMPTOM_IDS } from './src/input.js';
import { message, reason, reasonExtras, optionText, segmentLines, headline, fmtDur } from './src/text.js';
import { addDays } from './src/dates.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(resolve(root, p), 'utf8');
const cat = { ...parseMessages(read('spec/messages.md')), modules: parseModules(read('spec/06-session-library.md')), params: paramDefaults(JSON.parse(read('spec/parameters.json'))) };

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log('  FAIL', what); } };

function person(over = {}) {
  const s = emptyState();
  Object.assign(s.profile, {
    birth_month: '5', birth_year: '1990', sex: 'f', experience: '1_3y', other_sport: 'none', injury: 'no', pregnant: 'no', postpartum: 'no',
    parq: Object.fromEntries(PARQ_PLACEHOLDERS.map(p => [p.id, false])), symptoms: Object.fromEntries(SYMPTOM_IDS.map(i => [i, false])),
    saved_on: '2026-11-01', created_at: '2026-11-02T09:00:00+01:00',
  }, over.profile ?? {});
  Object.assign(s.goal, {
    runs_pw: '3', week_min: '120', week_km: '20', l30_min: '60', l30_km: '10', last_run: 'this_week', cont30: 'yes',
    goal_kind: 'race', distance: '10K', goal_type: 'finish', race_date: '2027-01-23', days: ['Tue', 'Thu', 'Sat'], max_runs: '3', minutes: '180',
    long_day: 'Sat', runwalk: 'no', saved_on: '2026-11-01', created_at: '2026-11-02T09:00:00+01:00',
  }, over.goal ?? {});
  return s;
}

function textOf(result, input) {
  const out = [];
  const ex = reasonExtras(result, input);
  for (const m of result.messages ?? []) {
    ok(cat.msgs[m.id], `message ${m.id} is in messages.md`);
    const t = message(cat, m, ex); if (t) out.push(t.text);
  }
  const f = result.feasibility;
  if (f) {
    out.push(headline(cat, f.verdict, f.headline));
    for (const r of f.reasons ?? []) { ok(cat.reasons[r], `reason ${r} is in messages.md`); out.push(reason(cat, r, ex).text); }
    for (const o of f.options ?? []) out.push(optionText(cat, o, f.reasons));
  }
  for (const w of result.plan?.weeks ?? []) for (const s of w.sessions) {
    ok(cat.modules[s.module_id], `module ${s.module_id} has a name`);
    const why = message(cat, s.why_message); ok(why, `why ${s.why_message.id}`); if (why) out.push(why.text, why.why);
    for (const m of s.messages) { const t = message(cat, m, ex); if (t) out.push(t.text); }
    for (const l of segmentLines(s)) out.push(l.text);
    out.push(fmtDur(s.planned_duration_s));
  }
  for (const t of out) ok(typeof t === 'string' && !/[{}]/.test(t) && !/undefined|null|NaN/.test(t), `clean text: ${JSON.stringify(t)}`);
  return out;
}

function run(name, s, today, chain = null) {
  const input = buildInput(s, today, { chain, timezone: 'Europe/Paris' });
  const t0 = Date.now();
  const r = generate(input);
  const ms = Date.now() - t0;
  ok(r.kind !== 'safe_state', `${name}: no safe_state (${r.error ?? ''})`);
  textOf(r, input);
  console.log(`${name}: ${r.kind}${r.feasibility ? ` ${r.feasibility.verdict} [${r.feasibility.reasons.join(', ')}]` : ''}${r.gate ? ` gate=${r.gate}` : ''}${r.plan ? ` ${r.plan.weeks.length} weeks` : ''}${r.feasibility?.options ? ` options=${r.feasibility.options.map(o => o.kind).join(',')}` : ''} (${ms} ms)`);
  return { r, input };
}

const MON = '2026-11-02';
// 1. a runner with some history, 10K finish
const a = run('10K finish', person(), MON);
ok(a.r.kind === 'plan', '10K finish gives a plan');

// 1b. KNOWN ENGINE ISSUE (reported, not fixed here): a profile created before the first plan Monday gives a plan
// that fails INV-27/INV-16, so the page dates the profile at the plan start (app.js, firstGeneration).
const early = person({ profile: { created_at: '2026-11-01T10:00:00+01:00' } });
const e1 = generate(buildInput(early, MON, { timezone: 'Europe/Paris' }));
console.log(`(info) profile created the day before day 0: ${e1.kind}, validation ${e1.validation?.pass === false ? 'FAILED ' + e1.validation.violations.map(v => v.inv_id).join('+') : 'passed'}`);

// 2. a beginner, 5K: start ladder
run('beginner 5K', person({ profile: { experience: 'never' }, goal: { runs_pw: '0', week_min: '', week_km: '', l30_min: '', l30_km: '', last_run: 'never', cont30: 'no', distance: '5K', race_date: '2027-01-16', runwalk: '' } }), MON);

// 3. every "I don't know"
run('all unknown', person({ profile: { experience: '', injury: '' }, goal: { runs_pw: '', week_min: '', week_km: '', l30_min: '', l30_km: '', last_run: '', cont30: '', days: null, max_runs: '', minutes: '', long_day: 'auto', runwalk: '' } }), MON);

// 4. a goal that does not fit: options, then apply the first one
const tight = person({ goal: { days: ['Tue', 'Sat'], max_runs: '2', distance: 'HM', race_date: '2026-12-06', l30_min: '50', l30_km: '8' } });
const f = run('HM in 5 weeks, 2 days', tight, MON);
if (f.r.kind === 'fail_closed') {
  for (const o of f.r.feasibility.options) {
    const s2 = structuredClone(tight); applyOption(s2, o);
    const g = run(`  option ${o.rank} ${o.kind} applied`, s2, MON);
    ok(g.r.kind === 'plan', `option ${o.kind} re-generates to a plan`);
  }
}

// 5. time goal with a recent result
run('10K in 50:00 with a 5K result', person({ goal: { goal_type: 'time', target: '50:00', has_result: 'yes', res_kind: 'race', res_dist: '5K', res_time: '24:30', res_date: '2026-10-18', week_min: '200', week_km: '35', l30_min: '80', l30_km: '14', runs_pw: '4', days: ['Tue', 'Thu', 'Sat', 'Sun'], max_runs: '4', minutes: '240', long_day: 'Sun' } }), MON);

// 6. safety: a symptom answer, a minor without a guardian, a placeholder "symptom" item, a placeholder "musculoskeletal" item
run('symptom C1 = yes', person({ profile: { symptoms: { ...Object.fromEntries(SYMPTOM_IDS.map(i => [i, false])), C1: true } } }), MON);
run('aged 16, no guardian', person({ profile: { birth_year: '2010' } }), MON);
run('placeholder item 2 = yes', person({ profile: { parq: { ...Object.fromEntries(PARQ_PLACEHOLDERS.map(p => [p.id, false])), parq_placeholder_02: true } } }), MON);
const mk = run('placeholder item 5 = yes', person({ profile: { parq: { ...Object.fromEntries(PARQ_PLACEHOLDERS.map(p => [p.id, false])), parq_placeholder_05: true } } }), MON);
ok(mk.r.gate === 'proceed_restricted', 'musculoskeletal placeholder → proceed_restricted');
run('pregnant', person({ profile: { pregnant: 'yes', due_date: '2027-04-01' } }), MON);

// 7. ultra (not built, R3) and a base plan
run('50K (not built)', person({ goal: { distance: '50K', race_date: '2027-05-01' } }), MON);
run('base plan', person({ goal: { goal_kind: 'base' } }), MON);

// 8. weekly re-plan: week 1 done as planned, then week 2 with two sessions not done
function tickWeek(s, plan, weekStart, skip = 0) {
  const w = plan.weeks.find(x => x.start === weekStart);
  let n = 0;
  for (const ses of w.sessions.filter(x => x.is_run)) {
    if (n++ < skip) { s.not_done.push({ session_id: ses.id, date: ses.date }); continue; }
    s.log.push({ id: `e${s.log.length + 1}`, date: ses.date, entered_at: `${ses.date}T20:00:00+01:00`, type: ses.run_walk ? 'run_walk' : 'run', source: 'tick',
      planned_session_id: ses.id, module_id: ses.module_id, duration_s: ses.planned_duration_s, distance_m: null, rpe_0_10: 3, pain_any: false, pain_0_10: null,
      pain_next_morning: false, pain_settled_24h: null, gi_score_0_10: null, carb_g_per_h: null, fatigue_flag: false, stopped_early_reason: null,
      conditions_hot: false, effort_all_out: null, is_goal_race: false, test_completed: ses.is_test ? true : null, test_held_effort: ses.is_test ? true : null, plausibility_answer: null });
  }
}
const s8 = person();
const w1 = run('re-plan: day 0', s8, MON);
tickWeek(s8, w1.r.plan, MON);
const chain1 = { today: MON, engine_state: w1.r.engine_state, plan: w1.r.plan, flags: w1.r.flags };
const w2 = run('re-plan: week 2 after week 1 as planned', s8, addDays(MON, 7), chain1);
ok(w2.r.kind === 'plan', 'week-2 re-plan gives a plan');
if (w2.r.plan) {
  console.log('  week-2 sessions:', w2.r.plan.weeks[0].sessions.map(x => `${x.weekday} ${fmtDur(x.planned_duration_s)}`).join(', '));
  tickWeek(s8, w2.r.plan, addDays(MON, 7), 2);
  const w3 = run("re-plan: week 3 after two sessions not done", s8, addDays(MON, 14), { today: addDays(MON, 7), engine_state: w2.r.engine_state, plan: w2.r.plan, flags: w2.r.flags });
  if (w3.r.validation?.pass === false) console.log("  (info) KNOWN ENGINE ISSUE: validation failed:", w3.r.validation.violations.map(v => `${v.inv_id} week ${v.week_index} observed ${v.observed}`).join("; "));
}

// 9. a symptom check from the log (INP-023) as an event
const s9 = person();
s9.checks.push({ id: 'chk1', date: '2026-11-08', kind: 'pain', pain: 4, answers: { ...Object.fromEntries(SYMPTOM_IDS.map(i => [i, false])), B1: true }, cleared_on: null });
run('log check with B1 = yes', s9, addDays(MON, 7), chain1);
s9.checks[0].cleared_on = '2026-11-12';
run('same check, cleared', s9, addDays(MON, 14), chain1);

console.log(`\n${checks - fails} / ${checks} checks pass`);
process.exit(fails ? 1 : 0);

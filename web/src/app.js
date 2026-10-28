// The page: five screens over the unchanged engine. Answers live only in this browser (localStorage); the engine
// runs in a Web Worker built from the page itself; nothing is sent anywhere.
import { WEEKDAYS, addDays, daysBetween, deviceToday, eveningTimestamp, fmtDate, isIso, localTimestamp, mondayOnOrAfter, mondayOnOrBefore, timeZone, weekday } from './dates.js';
import {
  DISTANCES, EXPERIENCE, LAST_RUN, NOT_BUILT_DISTANCES, PARQ_PLACEHOLDERS, SPORTS, SYMPTOM_GROUPS, SYMPTOM_IDS,
  ageOn, applyOption, buildInput, clearanceMsg, emptyState, goalErrors, openStops, parseTime, profileErrors,
} from './input.js';
import { DIST_WORD, EFFORT_HINT, EFFORT_WORD, OPTION_TITLE, PHASE_WORD, fmtDur, fmtKm, fmtPace, fmtRaceTime, headline, message, optionText, reason, reasonExtras, segmentLines } from './text.js';

const CAT = JSON.parse(document.getElementById('catalogue').textContent);
const KEY = 'running-method-prototype-v1';
const $main = document.getElementById('main');

// ------------------------------------------------------------------ storage (this browser only)
let storageOk = true;
function load() {
  const base = emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    return { ...base, ...s, profile: { ...base.profile, ...s.profile }, goal: { ...base.goal, ...s.goal }, settings: { ...base.settings, ...s.settings } };
  } catch { storageOk = false; return base; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
  catch { storageOk = false; toast('This browser refused to store your answers (private mode or storage full). They will be lost when you close the page.'); }
}
function eraseAll() {
  try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
  S = emptyState();
  ui = freshUi();
  go('profile');
  toast('All your answers, your log and your plans were erased from this browser.');
}

let S = load();
const freshUi = () => ({ entry: null, symptom: null, eraseArmed: false, deleteArmed: null, replanDate: null, attestErr: null, profileErr: [], goalErr: [], copied: false });
let ui = freshUi();
let view = S.current ? 'plan' : S.profile.saved_on ? 'goal' : 'profile';

const today = () => (S.settings.tester && isIso(S.settings.pretend_today) ? S.settings.pretend_today : deviceToday());
const stamp = iso => (S.settings.tester ? eveningTimestamp(iso) : localTimestamp());
const P = id => CAT.params[id];

// ------------------------------------------------------------------ engine (Web Worker from the page's own text)
const engineSrc = document.getElementById('engine-src').textContent;
let worker = null, workerBroken = false, seq = 0;
const waiting = new Map();
function startWorker() {
  if (worker || workerBroken) return;
  try {
    const url = URL.createObjectURL(new Blob([engineSrc], { type: 'text/javascript' }));
    worker = new Worker(url);
    worker.onmessage = e => { const w = waiting.get(e.data.id); if (!w) return; waiting.delete(e.data.id); e.data.error ? w.reject(new Error(e.data.error)) : w.resolve(e.data.result); };
    worker.onerror = () => { workerBroken = true; worker = null; for (const [id, w] of waiting) { waiting.delete(id); runInPage(w.input).then(w.resolve, w.reject); } };
  } catch { workerBroken = true; worker = null; }
}
async function runInPage(input) {
  if (!globalThis.__rmEngine) { const el = document.createElement('script'); el.textContent = engineSrc; document.head.appendChild(el); }
  await new Promise(r => setTimeout(r, 50));
  return globalThis.__rmEngine.run(JSON.parse(JSON.stringify(input)));
}
function runEngine(input) {
  startWorker();
  if (!worker) return runInPage(input);
  return new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject, input }); worker.postMessage({ id, input }); });
}

// ------------------------------------------------------------------ helpers
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const attr = (cond, a) => (cond ? ` ${a}` : '');
function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 4200);
}
function setBusy(on, title, text) {
  const b = document.getElementById('busy');
  b.hidden = !on;
  if (title) document.getElementById('busy-title').textContent = title;
  if (text) document.getElementById('busy-text').textContent = text;
}
function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, path, v) { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }

function seg(path, options, { kind = 'str', rerender = false, disabled = () => false } = {}) {
  const cur = getPath(S, path);
  return `<div class="seg" role="radiogroup">${options.map(([v, label]) => {
    const checked = kind === 'bool' ? (cur === true && v === 'yes') || (cur === false && v === 'no') : String(cur ?? '') === v;
    const id = `${path}-${v}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `<label for="${id}"><input type="radio" id="${id}" name="${esc(path)}" value="${esc(v)}" data-bind="${esc(path)}" data-kind="${kind}"${attr(rerender, 'data-rerender="1"')}${attr(checked, 'checked')}${attr(disabled(v), 'disabled')}><span>${esc(label)}</span></label>`;
  }).join('')}</div>`;
}
const yesNo = (path, opts) => seg(path, [['yes', 'Yes'], ['no', 'No']], { kind: 'bool', ...opts });
function numberField(path, label, { hint = '', step = '1', min = '0', unit = '' } = {}) {
  const id = path.replace(/\./g, '-');
  return `<div class="field"><label for="${id}">${esc(label)}${unit ? ` <span class="muted small">(${esc(unit)})</span>` : ''}</label>
    <input type="number" inputmode="decimal" id="${id}" min="${min}" step="${step}" value="${esc(getPath(S, path))}" data-bind="${esc(path)}">${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}
function selectField(path, label, options, { hint = '', rerender = false } = {}) {
  const id = path.replace(/\./g, '-');
  const cur = String(getPath(S, path) ?? '');
  return `<div class="field"><label for="${id}">${esc(label)}</label>
    <select id="${id}" data-bind="${esc(path)}"${attr(rerender, 'data-rerender="1"')}>${options.map(([v, l]) => `<option value="${esc(v)}"${attr(cur === v, 'selected')}>${esc(l)}</option>`).join('')}</select>${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}
function dateField(path, label, { hint = '', rerender = false } = {}) {
  const id = path.replace(/\./g, '-');
  return `<div class="field"><label for="${id}">${esc(label)}</label><input type="date" id="${id}" value="${esc(getPath(S, path))}" data-bind="${esc(path)}"${attr(rerender, 'data-rerender="1"')}>${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}
function textField(path, label, { hint = '', placeholder = '' } = {}) {
  const id = path.replace(/\./g, '-');
  return `<div class="field"><label for="${id}">${esc(label)}</label><input type="text" id="${id}" inputmode="numeric" placeholder="${esc(placeholder)}" value="${esc(getPath(S, path))}" data-bind="${esc(path)}">${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}
const effortChip = e => `<span class="effort" data-e="${esc(e)}" title="${esc(EFFORT_HINT[e] ?? '')}"><i aria-hidden="true"></i>${esc(EFFORT_WORD[e] ?? e)}</span>`;
const coach = text => (S.settings.coach ? `<div class="coach">${esc(text)}</div>` : '');
const errBox = errs => (errs?.length ? `<div class="err" role="alert"><b>Before you go on:</b><ul>${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '');

// ------------------------------------------------------------------ generation
function slimResult(r) {
  const o = { ...r };
  delete o.fired_rules; delete o.ledger;
  if (o.kind === 'plan') o.plan = null;   // the plan itself is kept once, in S.chain
  if (o.feasibility?.options) {
    o.feasibility = { ...o.feasibility, options: o.feasibility.options.map(x => ({ ...x, plan: x.plan ? {
      weeks: x.plan.weeks.length, peak_lr_s: x.plan.peak_lr_s, race_date: x.plan.race_date,
      runs: Math.max(0, ...x.plan.weeks.map(w => w.runs ?? 0)), first_week_s: x.plan.weeks[0]?.planned_time_s ?? null,
    } : null })) };
  }
  return o;
}
function sessionLabel(s) {
  if (s.is_goal_race) return `Race day: ${DIST_WORD[S.goal.distance] ?? 'your race'}`;
  if (s.ladder?.kind === 'start' && s.ladder.rung) return `Beginner step ${s.ladder.rung}`;
  if (s.ladder?.kind === 'rtr' && s.ladder.rung) return `Return step ${s.ladder.rung}`;
  return CAT.modules[s.module_id] ?? s.kind;
}
function diffPlans(oldPlan, newPlan, from) {
  if (!oldPlan || !newPlan) return null;
  const byDate = new Map();
  for (const w of oldPlan.weeks) for (const s of w.sessions) if (s.date >= from) byDate.set(s.date, s);
  const out = [];
  const seen = new Set();
  for (const w of newPlan.weeks) for (const s of w.sessions) {
    if (s.date < from) continue;
    seen.add(s.date);
    const o = byDate.get(s.date);
    const now = `${sessionLabel(s)}, ${fmtDur(s.planned_duration_s)}`;
    if (!o) out.push({ date: s.date, from: 'nothing planned', to: now });
    else { const was = `${sessionLabel(o)}, ${fmtDur(o.planned_duration_s)}`; if (was !== now) out.push({ date: s.date, from: was, to: now }); }
  }
  for (const [d, o] of byDate) if (!seen.has(d) && (!newPlan.race_date || d <= newPlan.race_date)) out.push({ date: d, from: `${sessionLabel(o)}, ${fmtDur(o.planned_duration_s)}`, to: 'removed' });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

async function generateAt(day, why) {
  if (profileErrors(S.profile, today()).length) { go('profile'); return; }
  if (goalErrors(S.goal).length) { go('goal'); return; }
  let chain = S.chain && S.chain.today < day ? S.chain : S.chainPrev && S.chainPrev.today < day ? S.chainPrev : null;
  if (!chain) {
    // Day 0: the profile is dated at the plan start. KNOWN ENGINE ISSUE: a profile created earlier than the first plan
    // Monday makes the engine treat the gap as a logged empty week, and the plan then fails INV-27/INV-16.
    const t = `${day}T09:00:00${eveningTimestamp(day).slice(19)}`;
    S.profile.created_at = t; S.goal.created_at = t;
  }
  const input = buildInput(S, day, { chain, timezone: timeZone() });
  const slow = S.goal.goal_kind === 'race' && S.chain == null;
  setBusy(true, why === 'replan' ? 'Re-planning' : 'Building your plan',
    'The generator runs here, on this device. When a goal does not fit, it checks each option before showing it, which can take up to a minute on a phone.');
  const t0 = Date.now();
  let result;
  try { result = await runEngine(input); }
  catch (err) { result = { kind: 'safe_state', error: String(err?.message ?? err), messages: [] }; }
  setBusy(false);
  const prevPlan = (chain ?? S.chain)?.plan ?? null;
  if (result.kind === 'plan') {
    if (S.chain && S.chain.today < day) S.chainPrev = S.chain;
    S.chain = { today: day, engine_state: result.engine_state, plan: result.plan, flags: result.flags ?? [] };
    S.changes = prevPlan ? { at: day, list: diffPlans(prevPlan, result.plan, day) } : null;
  }
  const keptInput = { ...input, parent_plan: input.parent_plan ? `[plan ${input.parent_plan.id?.slice(0, 12)} v${input.parent_plan.version}]` : null, engine_state: input.engine_state ? '[engine_state]' : null };
  S.current = { today: day, at: localTimestamp(), ms: Date.now() - t0, result: slimResult(result), input: keptInput };
  S.history.unshift({ at: S.current.at, today: day, kind: result.kind, verdict: result.feasibility?.verdict ?? null, reasons: result.feasibility?.reasons ?? [], gate: result.gate ?? null, why });
  S.history = S.history.slice(0, 40);
  save();
  void slow;
  go('plan');
}

// ------------------------------------------------------------------ screen 1: profile and screening
function viewProfile() {
  const p = S.profile;
  const t = today();
  const age = ageOn(p, t);
  const months = [['', 'Month…'], ...['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => [String(i + 1), m])];
  const minor = age && age.low < P('minor.adult_age');
  const masters = age && age.high >= P('masters.vigorous_assessment_age');
  return `<section class="screen" aria-labelledby="h-profile">
  <div class="screen-head"><span class="eyebrow">Step 1 of 5</span><h2 id="h-profile">You and your health questions</h2>
    <p class="muted">Everything stays in this browser. "I don't know" is fine for the running questions; health questions, birth month and year need an answer.</p></div>

  <div class="card"><h3>About you</h3>
    <div class="row">${selectField('profile.birth_month', 'Birth month', months, { rerender: true })}${numberField('profile.birth_year', 'Birth year', { min: '1900' })}</div>
    <div class="field"><span class="label">Sex (optional)</span>${seg('profile.sex', [['f', 'Female'], ['m', 'Male'], ['', 'Prefer not to say']])}</div>
    ${selectField('profile.experience', 'How long have you run at least weekly?', [['', 'I don\'t know'], ...EXPERIENCE.map(x => [x[0], x[1]])], { hint: '"I don\'t know" counts as less than 3 months.' })}
    ${selectField('profile.other_sport', 'Another sport you train regularly?', SPORTS)}
    <div class="field"><span class="label">In the last 12 months, did an injury stop you running for a week or more?</span>${seg('profile.injury', [['yes', 'Yes'], ['no', 'No'], ['', 'I don\'t know']])}</div>
  </div>

  <div class="card"><h3>Pregnancy and birth</h3>
    <div class="field"><span class="label">Are you pregnant?</span>${seg('profile.pregnant', [['yes', 'Yes'], ['no', 'No']], { rerender: true })}</div>
    ${p.pregnant === 'yes' ? `${dateField('profile.due_date', 'Due date')}<div class="note info">Running during pregnancy is not built in this prototype: the plan stays paused.</div>` : ''}
    <div class="field"><span class="label">Have you given birth in the last 12 months?</span>${seg('profile.postpartum', [['yes', 'Yes'], ['no', 'No']], { rerender: true })}</div>
    ${p.postpartum === 'yes' ? dateField('profile.birth_date', 'Date of birth of your baby') : ''}
  </div>

  ${minor ? `<div class="card"><h3>Parent or guardian</h3><p>Runners under ${P('minor.adult_age')} need a parent or guardian to agree.</p>
    <label class="check" for="g-ok"><input type="checkbox" id="g-ok" data-bind="profile.guardian_ok"${attr(p.guardian_ok, 'checked')}><span>${esc(CAT.msgs['MSG-SAF-021'].text)}</span></label></div>` : ''}
  ${masters ? `<div class="card"><h3>Hard and very long training</h3><p>${esc(message(CAT, { id: 'MSG-SAF-060' }, { cap: 10800 })?.text ?? '')}</p>
    <label class="check" for="m-ok"><input type="checkbox" id="m-ok" data-bind="profile.masters_ok"${attr(p.masters_ok, 'checked')}><span>${esc(CAT.msgs['MSG-SAF-040'].text)}</span></label></div>` : ''}

  <div class="placeholder-box" role="group" aria-labelledby="h-parq">
    <span class="tag">Placeholder, not the PAR-Q+</span>
    <h3 id="h-parq">Standard health questionnaire</h3>
    <p>The real questionnaire is the PAR-Q+ 2023. Its licence is not obtained yet (release blocker B-1), so its text is not in this prototype. The seven items below only stand in for it, so testers can try what each kind of answer does. <b>They are not health questions.</b> If you have any doubt about your health, talk to a doctor before starting any training plan.</p>
    ${PARQ_PLACEHOLDERS.map((q, i) => `<div class="q"><p><b>Placeholder item ${i + 1} of 7.</b> Licensed question text goes here. For testing, "Yes" acts like a "${esc({ known_disease: 'known condition', symptom: 'symptom', musculoskeletal: 'bone or joint', other: 'other' }[q.factor])}" answer.</p>${yesNo(`profile.parq.${q.id}`)}</div>`).join('')}
  </div>

  <div class="card" role="group" aria-labelledby="h-now"><h3 id="h-now">Right now</h3>
    <p class="muted small">These safety questions come from the method itself (spec chapter 10). They are asked again when you log pain or tap "Something felt wrong".</p>
    ${symptomBlock('profile.symptoms')}
  </div>

  ${errBox(ui.profileErr)}
  <div class="actions"><button class="btn" type="button" data-act="save-profile" id="save-profile">Save and go to your goal</button></div>
  <div class="note">${esc(CAT.msgs['MSG-SAF-004'].text)} ${esc(CAT.msgs['MSG-SAF-STOP-SIGNS'].text)}</div>
</section>`;
}
function symptomBlock(basePath) {
  return SYMPTOM_GROUPS.map(g => `<div class="q"><p><b>${esc(g.lead)}</b></p>${g.items.map(([id, q]) => `<div class="field"><span class="label" style="font-weight:500">${esc(q)}</span>${yesNo(`${basePath}.${id}`)}</div>`).join('')}</div>`).join('');
}

// ------------------------------------------------------------------ screen 2: goal and availability
function viewGoal() {
  const g = S.goal;
  const started = S.chain || S.current;
  const day0 = mondayOnOrAfter(today());
  return `<section class="screen" aria-labelledby="h-goal">
  <div class="screen-head"><span class="eyebrow">Step 2 of 5</span><h2 id="h-goal">Your goal and your week</h2>
    <p class="muted">Leave a number blank if you don't know it. We then use a cautious guess and show it.</p></div>

  <div class="card"><h3>Your running now</h3>
    <div class="row">${numberField('goal.runs_pw', 'Runs a week, last 4 weeks')}${selectField('goal.last_run', 'When did you last run?', [['', 'I don\'t know'], ...LAST_RUN.map(x => [x[0], x[1]])])}</div>
    <div class="row">${numberField('goal.week_min', 'A normal week', { unit: 'minutes' })}${numberField('goal.week_km', 'A normal week', { unit: 'km', step: '0.1' })}</div>
    <div class="row">${numberField('goal.l30_min', 'Longest run, last 30 days', { unit: 'minutes' })}${numberField('goal.l30_km', 'Longest run, last 30 days', { unit: 'km', step: '0.1' })}</div>
    <div class="field"><span class="label">Can you run 30 minutes non-stop?</span>${seg('goal.cont30', [['yes', 'Yes'], ['no', 'No'], ['', 'I don\'t know']])}</div>
  </div>

  <div class="card"><h3>A recent result (optional)</h3>
    <div class="field"><span class="label">A race or timed run in the last 4 months?</span>${seg('goal.has_result', [['yes', 'Yes'], ['no', 'No']], { rerender: true })}</div>
    ${g.has_result === 'yes' ? `
      <div class="field"><span class="label">What was it?</span>${seg('goal.res_kind', [['race', 'A race'], ['field_test', 'A timed run on my own']])}</div>
      <div class="row">${selectField('goal.res_dist', 'Distance', [...DISTANCES.slice(0, 4), ['other', 'Other']], { rerender: true })}${g.res_dist === 'other' ? numberField('goal.res_km', 'Distance', { unit: 'km', step: '0.1' }) : ''}</div>
      <div class="row">${textField('goal.res_time', 'Time', { placeholder: '24:10 or 1:52:30' })}${dateField('goal.res_date', 'Date')}</div>
      <p class="hint muted small">Only a result entered within 2 days of the run counts as measured and can set paces; older ones count as estimates.</p>` : ''}
  </div>

  <div class="card"><h3>Your goal</h3>
    <div class="field"><span class="label">What do you want to do?</span>${seg('goal.goal_kind', [['race', 'Run a race'], ['base', 'Build my running, no race']], { rerender: true })}</div>
    ${g.goal_kind === 'race' ? `
      <div class="field"><span class="label">Distance</span>${seg('goal.distance', DISTANCES.map(([v, l]) => [v, NOT_BUILT_DISTANCES.has(v) ? `${l} (not built)` : l]), { rerender: true })}
        <span class="hint">50 km and 100 km are a later release. You can pick them to see how the generator fails safe.</span></div>
      ${dateField('goal.race_date', 'Race date')}
      <div class="field"><span class="label">Aim</span>${seg('goal.goal_type', [['finish', 'To finish'], ['time', 'A target time']], { rerender: true })}</div>
      ${g.goal_type === 'time' ? textField('goal.target', 'Target time', { placeholder: '52:30 or 1:55:00' }) : ''}
      <label class="check" for="g-hot"><input type="checkbox" id="g-hot" data-bind="goal.hot"${attr(g.hot, 'checked')}><span>The race will probably be hot</span></label>` : ''}
  </div>

  <div class="card"><h3>Your week</h3>
    <div class="field"><span class="label">Which days can you run?</span>
      <div class="seg">${WEEKDAYS.map(d => `<label for="day-${d}"><input type="checkbox" id="day-${d}" data-bind="goal.days" data-kind="days" value="${d}"${attr((g.days ?? []).includes(d), 'checked')}><span>${d}</span></label>`).join('')}</div>
      <span class="hint">None ticked means "I don't know": we use Tue, Thu and Sat for now.</span></div>
    <div class="row">${numberField('goal.max_runs', 'At most, runs a week')}${numberField('goal.minutes', 'Time a week for running', { unit: 'minutes' })}</div>
    ${selectField('goal.long_day', 'Which day suits your longest run?', [['auto', 'Choose for me'], ...WEEKDAYS.map(d => [d, d])])}
    <div class="field"><span class="label">Would you like to mix running and walking?</span>${seg('goal.runwalk', [['yes', 'Yes'], ['no', 'No'], ['', 'Not sure']])}</div>
    <label class="check" for="g-hills"><input type="checkbox" id="g-hills" data-bind="goal.hills"${attr(g.hills, 'checked')}><span>I have a hill nearby for short hill sprints</span></label>
    <label class="check" for="g-tests"><input type="checkbox" id="g-tests" data-bind="goal.tests_opt_out"${attr(g.tests_opt_out, 'checked')}><span>${esc(CAT.msgs['MSG-SES-TEST-SKIP']?.text ?? 'Skip level tests')}</span></label>
  </div>

  ${errBox(ui.goalErr)}
  <div class="actions">
    ${started
      ? `<button class="btn" type="button" data-act="update-plan" id="update-plan">Update my plan from ${esc(fmtDate(S.current?.today ?? day0))}</button>`
      : `<button class="btn" type="button" data-act="build-plan" id="build-plan">Build my plan</button>`}
  </div>
  <p class="muted small">${started ? 'Your answers change the plan from its current start date. To begin again from scratch, use "Your data".' : `Plans start on a Monday: yours starts on ${esc(fmtDate(day0))}. If you run before then, log it in step 4: it counts at the first re-plan.`}</p>
</section>`;
}

// ------------------------------------------------------------------ screen 3: plan
function sessionStatus(s) {
  if (S.log.some(e => e.planned_session_id === s.id && e.date === s.date)) return 'logged';
  if (S.not_done.some(n => n.session_id === s.id && n.date === s.date)) return 'not_done';
  return s.date < today() ? 'unlogged' : 'future';
}
function sessionHtml(s, plan) {
  const st = sessionStatus(s);
  const why = message(CAT, s.why_message);
  const extra = s.messages.filter(m => m.id !== 'MSG-INP-PAIN-TAP' && m.id !== s.why_message.id).map(m => message(CAT, m)).filter(Boolean);
  const lines = segmentLines(s);
  const rw = s.run_walk && s.run_walk_ratio ? `Run ${s.run_walk_ratio.run_s >= 60 ? `${s.run_walk_ratio.run_s / 60} min` : `${s.run_walk_ratio.run_s} s`}, walk ${s.run_walk_ratio.walk_s >= 60 ? `${s.run_walk_ratio.walk_s / 60} min` : `${s.run_walk_ratio.walk_s} s`}; repeat.` : '';
  const pace = s.pace_range && plan.pace_mode === 'paced' ? `${fmtPace(s.pace_range.fast_s_per_km)}–${fmtPace(s.pace_range.slow_s_per_km)} /km` : '';
  const tags = [
    s.is_goal_race ? '<span class="chip key">Race</span>' : '',
    s.is_test ? '<span class="chip key">Level test</span>' : '',
    s.is_key && !s.is_test ? '<span class="chip key">Key session</span>' : '',
    s.is_long_run && !s.is_goal_race ? '<span class="chip">Long run</span>' : '',
    st === 'logged' ? '<span class="chip ok">Logged</span>' : st === 'not_done' ? '<span class="chip miss">Not done</span>' : st === 'unlogged' ? '<span class="chip">Not logged</span>' : '',
  ].join('');
  const canLog = s.is_run && s.date <= today() && st !== 'logged';
  return `<div class="session${s.date < today() ? ' past' : ''}">
    <div class="s-head"><div><div class="s-day">${esc(fmtDate(s.date))}</div><div class="s-name">${esc(sessionLabel(s))}</div></div>
      <div class="s-dur">${esc(s.prescription === 'distance' && s.planned_distance_m ? fmtKm(s.planned_distance_m) : fmtDur(s.planned_duration_s))}</div></div>
    <div class="s-tags">${effortChip(s.effort_target)}${tags}</div>
    ${rw ? `<p class="s-struct">${esc(rw)}</p>` : ''}
    ${!s.ladder || s.ladder.kind === 'none' || !rw ? (lines.length > 1 || s.is_key || s.is_test ? `<ul class="s-struct" style="margin:0;padding-left:1.1em">${lines.map(l => `<li>${esc(l.text)}</li>`).join('')}</ul>` : '') : ''}
    ${pace ? `<p class="s-struct num">Pace: ${esc(pace)}</p>` : ''}
    ${s.fuel_target_g_h ? `<p class="s-struct">Practise fuelling: about ${esc(s.fuel_target_g_h)} g of carbohydrate an hour.</p>` : ''}
    <details><summary class="linkbtn">Why this session?</summary><div class="why">
      ${why ? `<p><b>${esc(why.text)}</b></p>${why.why ? `<p>${esc(why.why)}</p>` : ''}` : ''}
      ${extra.map(m => `<p>${esc(m.text)}</p>`).join('')}
      ${s.dose_step != null && s.dose_step > 0 ? `<p>${esc(CAT.msgs['MSG-SES-STEP'].text)}</p>` : ''}
      ${s.grade_label ? `<p class="muted small">How sure we are: ${esc(s.grade_label)}.</p>` : ''}
      ${coach(`${s.id} · ${s.module_id} · ${s.kind} · rules ${s.rule_ids.join(', ')}`)}
    </div></details>
    ${canLog ? `<div class="actions"><button class="btn small ghost" type="button" data-act="log-session" data-sid="${esc(s.id)}" data-date="${esc(s.date)}">Log this session</button></div>` : ''}
  </div>`;
}
function weeksHtml(plan) {
  const t = today();
  const cw = plan.weeks.find(w => t >= w.start && t < addDays(w.start, 7)) ?? plan.weeks.find(w => w.start >= t) ?? plan.weeks[0];
  const phases = plan.weeks.map(w => `<div class="ph-${esc(w.phase)}" title="Week ${w.index}: ${esc(PHASE_WORD[w.phase] ?? w.phase)}">${w.index}</div>`).join('');
  const used = [...new Set(plan.weeks.map(w => w.phase))];
  return `<div class="card"><h3>${plan.weeks.length} weeks${plan.race_date ? `, race on ${esc(fmtDate(plan.race_date))}` : ''}</h3>
    <div class="phasebar" aria-hidden="true">${phases}</div>
    <div class="legend">${used.map(p => `<span><i class="ph-${esc(p)}"></i>${esc(PHASE_WORD[p] ?? p)}</span>`).join('')}</div>
    <p class="muted small">This week and next are set. Later weeks are an outlook: the plan is re-built each Monday from what you log.</p></div>
  ${plan.weeks.map(w => `<details class="week"${attr(w === cw, 'open')}>
    <summary><span class="wk-title">Week ${w.index} · ${esc(fmtDate(w.start))}</span><span class="muted small">${esc(PHASE_WORD[w.phase] ?? w.phase)}</span>
      <span class="wk-meta"><span>${esc(fmtDur(w.planned_time_s))} in all</span>${w.lr_s ? `<span>longest ${esc(fmtDur(w.lr_s))}</span>` : ''}<span>${w.sessions.filter(s => s.is_run).length} runs</span>
      ${w.is_deload ? '<span class="chip">Easier week</span>' : ''}${w.is_race_week ? '<span class="chip key">Race week</span>' : ''}${w === cw ? '<span class="chip key">This week</span>' : ''}</span></summary>
    <div class="wk-body">${w.sessions.length ? w.sessions.map(s => sessionHtml(s, plan)).join('') : '<p class="muted">No runs this week.</p>'}</div>
  </details>`).join('')}`;
}
function resultMessages(r, input) {
  const ex = { ...reasonExtras(r, input), n: P('deload.every_ctx') };
  const plan = S.chain?.plan;
  const test = plan?.weeks.find(w => w.sessions.some(s => s.is_test));
  if (test) ex.n_test = test.index;
  const age = ageOn(S.profile, r.today ?? today());
  if (age) ex.age = age.high;
  const skip = new Set(['MSG-FEA-STRETCH', 'MSG-FEA-NO', 'MSG-FEA-ESTIMATED', 'MSG-INP-PAIN-TAP']);
  const out = [];
  for (const m of r.messages ?? []) {
    if (skip.has(m.id) || CAT.msgs[m.id]?.layer === 'attestation') continue;
    if (m.id === 'MSG-CTX-007' && r.feasibility?.labels?.includes('ESTIMATED_INPUTS')) continue;   // same sentence as the label
    const e2 = m.id === 'MSG-ONBOARD-NOPACE' ? { ...ex, n: ex.n_test } : ex;
    const t = message(CAT, m, e2);
    if (t && t.text && !out.some(o => o.text === t.text)) out.push(t);
  }
  return out;
}
function verdictBlock(r, input) {
  const f = r.feasibility;
  const ex = reasonExtras(r, input);
  const reasons = (f.reasons ?? []).filter(x => x !== 'LOW_FREQ' || f.verdict !== 'feasible').map(c => reason(CAT, c, ex));
  const nonconv = r.kind === 'fail_closed' && !reasons.length && r.validation && r.validation.pass === false;
  if (nonconv) reasons.push({ code: 'ENGINE_NONCONVERGENT', text: r.previous_plan_kept ? CAT.reasons.ENGINE_NONCONVERGENT.text : CAT.reasons.ENGINE_NONCONVERGENT.text.split('. ')[0] + '.', why: CAT.reasons.ENGINE_NONCONVERGENT.why });
  const card = reasons.slice(0, 2), more = reasons.slice(2);
  const cls = f.verdict === 'feasible' ? 'feasible' : f.verdict === 'stretch' ? 'stretch' : 'infeasible';
  return `<div class="verdict ${cls}">
    <span class="eyebrow">${esc(f.verdict === 'feasible' ? 'Fits' : f.verdict === 'stretch' ? `Fits, ${f.headline ?? 'tight'}` : 'Does not fit')}</span>
    <h3>${esc(f.verdict === 'infeasible' && !(f.options ?? []).length ? headline(CAT, f.verdict).split('. ')[0] + '.' : headline(CAT, f.verdict, f.headline))}</h3>
    ${card.length ? `<ul>${card.map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>` : ''}
    ${f.labels?.includes('ESTIMATED_INPUTS') ? `<p class="small">${esc(CAT.headlines['confidence label (not a verdict)'] ?? CAT.msgs['MSG-FEA-ESTIMATED'].text)}</p>` : ''}
    ${reasons.length ? `<details><summary class="linkbtn">Why?</summary><div class="why">${more.map(x => `<p>${esc(x.text)}</p>`).join('')}${reasons.map(x => (x.why ? `<p>${esc(x.why)}</p>` : '')).join('')}${coach(`reasons: ${(f.reasons ?? []).join(', ') || '—'} · horizon ${f.horizon} · weeks ${f.weeks_available} · slack ${f.slack}${nonconv ? ` · validation failed: ${r.validation.violations.map(v => `${v.inv_id} w${v.week_index}`).join(', ')}` : ''}`)}</div></details>` : ''}
  </div>`;
}
function optionsHtml(r, input) {
  const f = r.feasibility;
  const opts = f.options ?? [];
  if (!opts.length) {
    return `<div class="card"><h3>No option passed our checks</h3>
      <p>Each option is checked against the same safety limits before it is shown. None did this time. You can change your goal or your week, or build your running without a race.</p>
      <div class="actions"><button class="btn ghost" type="button" data-go="goal">Change goal or week</button></div></div>`;
  }
  return `<div class="screen-head"><span class="eyebrow">Options that fit, best first</span><p class="muted small">Nothing changes until you choose one.</p></div>
  ${opts.map(o => {
    const sum = o.plan;
    const vtxt = o.verdict === 'feasible' ? 'Fits' : o.verdict === 'stretch' ? 'Fits, but tight or ambitious' : o.verdict;
    return `<div class="option">
      <span class="rank">OPTION ${o.rank}</span>
      <h3>${esc(OPTION_TITLE[o.kind] ?? o.kind)}</h3>
      <p>${esc(optionText(CAT, o, f.reasons))}</p>
      <dl>
        <dt>Verdict</dt><dd>${esc(vtxt)}</dd>
        ${sum ? `<dt>Length</dt><dd>${sum.weeks} weeks${sum.race_date ? `, race ${esc(fmtDate(sum.race_date))}` : ''}</dd><dt>Longest run</dt><dd>${esc(fmtDur(sum.peak_lr_s))}</dd><dt>Runs a week</dt><dd>up to ${sum.runs}</dd>` : ''}
      </dl>
      ${(o.reasons ?? []).length ? `<p class="small muted">${o.reasons.map(c => esc(reason(CAT, c, {}).text)).join(' ')}</p>` : ''}
      ${coach(`${o.kind} · ${JSON.stringify(o.availability_change ?? {})} · goal ${JSON.stringify({ d: o.new_goal?.distance, t: o.new_goal?.goal_type, date: o.new_goal?.race_date, target: o.new_goal?.target_time_s })}`)}
      <div class="actions"><button class="btn" type="button" data-act="choose-option" data-rank="${o.rank}">Choose this option</button></div>
    </div>`;
  }).join('')}`;
}
function attestationHtml(r) {
  const parts = [];
  const t = today();
  const stops = openStops(S);
  for (const st of stops) {
    const msg = clearanceMsg(st);
    const from = addDays(st.date ?? t, P('flag.clearance_min_delay_days'));
    parts.push(`<div class="card"><h3>When you have been cleared</h3>
      <p>On ${esc(fmtDate(st.date ?? t))} you answered "yes" to a safety question. Your plan stays paused until you confirm this, on ${esc(fmtDate(from))} or later.</p>
      <label class="check" for="att-${esc(st.id)}"><input type="checkbox" id="att-${esc(st.id)}"><span>${esc(CAT.msgs[msg].text)}</span></label>
      <div class="actions"><button class="btn" type="button" data-act="clear-stop" data-stop="${esc(st.id)}" data-msg="${msg}">Confirm</button></div>
      ${ui.attestErr === st.id ? `<div class="err">You can confirm from ${esc(fmtDate(from))}. A same-day confirmation is not a consultation.</div>` : ''}
      ${st.source === 'profile' ? '<p class="muted small">After you confirm, please answer the "right now" questions again.</p>' : ''}</div>`);
  }
  const att = new Set((r.messages ?? []).map(m => m.id).filter(id => CAT.msgs[id]?.layer === 'attestation'));
  if (r.gate === 'proceed_restricted' || (r.messages ?? []).some(m => m.id === 'MSG-SAF-001')) att.add('MSG-SAF-011');
  if (stops.length) att.delete('MSG-SAF-011'), att.delete('MSG-SAF-012');
  for (const id of att) {
    const done = S.attestations.some(a => a.msg_id === id);
    parts.push(`<div class="card"><h3>${id === 'MSG-SAF-021' ? 'Parent or guardian' : 'Confirmation'}</h3>
      <label class="check" for="att-${id}"><input type="checkbox" id="att-${id}"${attr(done, 'checked disabled')}><span>${esc(CAT.msgs[id].text)}</span></label>
      ${done ? `<p class="muted small">Confirmed on ${esc(fmtDate(S.attestations.filter(a => a.msg_id === id).at(-1).attested_on))}. It counts from the day after the health questions were answered.</p>` : `<div class="actions"><button class="btn" type="button" data-act="attest" data-msg="${id}">Confirm</button></div>`}
      ${id === 'MSG-SAF-031' ? '<p class="note info">Pregnancy mode is not built in this prototype. The plan stays paused even after this confirmation (fail safe).</p>' : ''}</div>`);
  }
  return parts.join('');
}
function viewPlan() {
  const cur = S.current;
  if (!cur) {
    return `<section class="screen"><div class="screen-head"><span class="eyebrow">Step 3 of 5</span><h2>Your plan</h2></div>
      <div class="card"><p>No plan yet. Answer the questions in steps 1 and 2, then tap "Build my plan".</p>
      <div class="actions"><button class="btn" type="button" data-go="${S.profile.saved_on ? 'goal' : 'profile'}">Go to step ${S.profile.saved_on ? 2 : 1}</button></div></div></section>`;
  }
  const r = cur.result, input = cur.input;
  const head = `<div class="screen-head"><span class="eyebrow">Step 3 of 5 · generated for ${esc(fmtDate(cur.today))}</span><h2>Your plan</h2></div>`;
  const changes = S.changes && S.changes.at === cur.today && r.kind === 'plan' && S.changes.list?.length
    ? `<details class="card"><summary class="linkbtn">Your plan changed from ${esc(fmtDate(cur.today))}: ${S.changes.list.length} session${S.changes.list.length > 1 ? 's' : ''}</summary>
       <ul class="small" style="margin:0;padding-left:1.1em">${S.changes.list.map(c => `<li>${esc(fmtDate(c.date))}: ${esc(c.from)} → ${esc(c.to)}</li>`).join('')}</ul>
       <p class="muted small">${esc(CAT.msgs['MSG-WHY-ADP'].text)}</p></details>` : '';
  const msgs = resultMessages(r, input);
  const msgHtml = msgs.length ? `<div class="card"><h3>Good to know</h3>${msgs.map(m => `<p>${esc(m.text)}${m.why ? ` <span class="muted small">${esc(m.why)}</span>` : ''}</p>`).join('')}</div>` : '';
  const debug = S.settings.coach ? `<details class="card"><summary class="linkbtn">Coach view: result details</summary>
    <p class="coach">kind ${esc(r.kind)} · gate ${esc(r.gate ?? '—')} · ${cur.ms} ms · validation ${r.validation ? (r.validation.pass ? 'pass' : 'FAIL') : '—'}</p>
    <pre class="json">${esc(JSON.stringify({ ...r, plan: r.plan ? '[plan]' : undefined }, null, 1))}</pre></details>` : '';

  if (r.kind === 'plan') {
    const plan = S.chain?.plan;
    const restricted = r.gate === 'proceed_restricted' ? `<div class="note stop">Until you confirm below that a health professional agreed, all runs stay easy to steady.</div>` : '';
    return `<section class="screen">${head}${verdictBlock(r, input)}${restricted}${attestationHtml(r)}${changes}${msgHtml}${plan ? weeksHtml(plan) : ''}${debug}</section>`;
  }
  if (r.kind === 'fail_closed') {
    const kept = r.previous_plan_kept && S.chain?.plan ? `<details class="card"><summary class="linkbtn">Your previous plan (kept until you choose)</summary>${weeksHtml(S.chain.plan)}</details>` : '';
    return `<section class="screen">${head}${verdictBlock(r, input)}${optionsHtml(r, input)}${msgHtml}${kept}${debug}</section>`;
  }
  if (r.kind === 'gate_stop') {
    const texts = (r.messages ?? []).filter(m => CAT.msgs[m.id]?.layer !== 'attestation').map(m => message(CAT, m, { min_age: P('minor.min_age'), weeks: P('pp.min_weeks'), cap: 10800 })).filter(Boolean);
    return `<section class="screen">${head}
      <div class="verdict stop"><span class="eyebrow">Paused</span><h3>${esc(CAT.msgs['MSG-SAF-010'].text)}</h3>
        ${texts.map(t => `<p>${esc(t.text)}</p>`).join('')}</div>
      ${attestationHtml(r)}
      <div class="note">${esc(CAT.msgs['MSG-SAF-004'].text)}</div>
      <p class="muted small">You can keep logging runs. To change an answer, go to step 1.</p>${debug}</section>`;
  }
  if (r.kind === 'hold') {
    const qs = r.hold?.questions ?? [];
    const symptomQ = qs.some(q => /\.(C|B|H|E|I)\d$/.test(q));
    return `<section class="screen">${head}<div class="verdict stop"><span class="eyebrow">Waiting for an answer</span>
      <h3>${esc(symptomQ ? CAT.msgs['MSG-SAF-HOLD'].text : (r.messages ?? []).map(m => message(CAT, m)?.text).filter(Boolean)[0] ?? 'Please answer the questions first.')}</h3></div>
      <div class="actions"><button class="btn" type="button" data-go="profile">Go to step 1</button></div>${coach(`questions: ${qs.join(', ')}`)}${debug}</section>`;
  }
  return `<section class="screen">${head}<div class="verdict stop"><span class="eyebrow">No plan</span><h3>${esc(CAT.reasons.ENGINE_NONCONVERGENT.text.split('. ')[0])}.</h3>
    <p>The generator stopped with an internal error, so nothing is shown. Please copy the test report from "Your data" and send it to the owner.</p></div>${debug}</section>`;
}

// ------------------------------------------------------------------ screen 4: log
function plannedAround() {
  const plan = S.chain?.plan;
  if (!plan) return [];
  const t = today();
  return plan.weeks.flatMap(w => w.sessions).filter(s => s.is_run && s.date <= t && daysBetween(s.date, t) <= 9);
}
function entryForm() {
  const e = ui.entry;
  const ses = e.sid ? S.chain?.plan?.weeks.flatMap(w => w.sessions).find(s => s.id === e.sid && s.date === e.date) : null;
  const rpeWords = ['rest', '', 'easy', '', 'steady', '', 'hard', '', 'very hard', '', 'maximal'];
  const needSymptoms = e.wrong || (e.pain_any === 'yes' && Number(e.pain) > 0);
  return `<div class="card" id="entry-card"><h3>${ses ? `${esc(sessionLabel(ses))}, ${esc(fmtDate(ses.date))}` : e.wrong ? 'Something felt wrong' : 'Add a run'}</h3>
    ${e.wrong ? '' : `
    ${ses ? '' : `<div class="row"><div class="field"><label for="en-date">Date</label><input type="date" id="en-date" max="${esc(today())}" value="${esc(e.date)}" data-entry="date"></div>
      <div class="field"><label for="en-type">Kind</label><select id="en-type" data-entry="type">${[['run', 'Run'], ['run_walk', 'Run-walk'], ['race', 'Race'], ['test', 'Timed test']].map(([v, l]) => `<option value="${v}"${attr(e.type === v, 'selected')}>${l}</option>`).join('')}</select></div></div>`}
    <div class="row"><div class="field"><label for="en-min">Duration <span class="muted small">(minutes)</span></label><input type="number" inputmode="decimal" id="en-min" min="1" value="${esc(e.min)}" data-entry="min"></div>
      <div class="field"><label for="en-km">Distance <span class="muted small">(km, optional)</span></label><input type="number" inputmode="decimal" step="0.01" id="en-km" min="0" value="${esc(e.km)}" data-entry="km"></div></div>
    <div class="field"><span class="label">${esc(CAT.msgs['MSG-INP-RPE'].text)}</span>
      <div class="rpe">${Array.from({ length: 11 }, (_, i) => `<label for="rpe-${i}"><input type="radio" name="rpe" id="rpe-${i}" value="${i}" data-entry="rpe"${attr(String(e.rpe) === String(i), 'checked')}><span>${i}</span></label>`).join('')}</div>
      <div class="rpe-words"><span>0 rest</span><span>4 steady</span><span>10 all-out</span></div>
      <button class="linkbtn" type="button" data-act="rpe-skip">Skip this</button></div>
    <div class="field"><span class="label">Any pain?</span><div class="seg">${[['no', 'No'], ['yes', 'Yes']].map(([v, l]) => `<label for="pain-${v}"><input type="radio" name="pain" id="pain-${v}" value="${v}" data-entry="pain_any" data-rerender="1"${attr(e.pain_any === v, 'checked')}><span>${l}</span></label>`).join('')}</div></div>
    ${e.pain_any === 'yes' ? `<div class="field"><label for="en-pain">How much, 0 to 10?</label><input type="number" id="en-pain" min="0" max="10" value="${esc(e.pain)}" data-entry="pain" data-rerender="1"></div>` : ''}
    ${ses?.is_test ? `<div class="field"><span class="label">${esc(CAT.msgs['MSG-SES-TEST-Q'].text)}</span>
      <div class="q"><p>Did you finish every part as planned?</p><div class="seg">${[['yes', 'Yes'], ['no', 'No']].map(([v, l]) => `<label for="tc-${v}"><input type="radio" name="tc" id="tc-${v}" value="${v}" data-entry="test_completed"${attr(e.test_completed === v, 'checked')}><span>${l}</span></label>`).join('')}</div></div>
      <div class="q"><p>Could you hold the effort to the end without slowing down or walking?</p><div class="seg">${[['yes', 'Yes'], ['no', 'No']].map(([v, l]) => `<label for="th-${v}"><input type="radio" name="th" id="th-${v}" value="${v}" data-entry="test_held"${attr(e.test_held === v, 'checked')}><span>${l}</span></label>`).join('')}</div></div></div>` : ''}`}
    ${needSymptoms ? `<div class="note stop">${esc(CAT.msgs['MSG-SAF-QUESTIONS'].text)}</div>${SYMPTOM_GROUPS.map(g => `<div class="q"><p><b>${esc(g.lead)}</b></p>${g.items.map(([id, q]) => `<div class="field"><span class="label" style="font-weight:500">${esc(q)}</span><div class="seg">${[['yes', 'Yes'], ['no', 'No']].map(([v, l]) => `<label for="sy-${id}-${v}"><input type="radio" name="sy-${id}" id="sy-${id}-${v}" value="${v}" data-entry="sy.${id}"${attr(e.sy[id] === v, 'checked')}><span>${l}</span></label>`).join('')}</div></div>`).join('')}</div>`).join('')}` : ''}
    ${errBox(e.err)}
    <div class="actions"><button class="btn" type="button" data-act="save-entry">Save</button><button class="btn quiet" type="button" data-act="cancel-entry">Cancel</button></div>
  </div>`;
}
function viewLog() {
  const t = today();
  const around = plannedAround();
  const morning = S.log.filter(e => e.ui_morning_due && e.pain_next_morning == null && daysBetween(e.date, t) >= 1 && daysBetween(e.date, t) <= 3);
  const entries = [...S.log].sort((a, b) => b.date.localeCompare(a.date) || b.entered_at.localeCompare(a.entered_at));
  const nd = S.not_done.map(n => ({ ...n, nd: true }));
  const all = [...entries, ...nd].sort((a, b) => b.date.localeCompare(a.date));
  return `<section class="screen" aria-labelledby="h-log">
  <div class="screen-head"><span class="eyebrow">Step 4 of 5</span><h2 id="h-log">Your run log</h2>
    <p class="muted">Log within two days: later entries count as estimates. A session you don't log stays "not logged"; it is never counted as done.</p></div>
  ${ui.entry ? entryForm() : ''}
  ${morning.map(e => `<div class="card"><p><b>${esc(CAT.msgs['MSG-INP-PAIN-MORNING'].text.replace(' No / Yes', ''))}</b> <span class="muted small">After your run on ${esc(fmtDate(e.date))}.</span></p>
    <div class="actions"><button class="btn small quiet" type="button" data-act="morning" data-id="${esc(e.id)}" data-v="no">No</button><button class="btn small quiet" type="button" data-act="morning" data-id="${esc(e.id)}" data-v="yes">Yes</button></div></div>`).join('')}
  ${!ui.entry ? `<div class="card"><h3>Planned sessions, last days</h3>
    ${around.length ? around.map(s => {
      const st = sessionStatus(s);
      return `<div class="tick"><div class="s-head"><div><div class="s-day">${esc(fmtDate(s.date))}</div><div class="s-name">${esc(sessionLabel(s))}</div></div><div class="s-dur">${esc(fmtDur(s.planned_duration_s))}</div></div>
        ${st === 'logged' ? '<span class="chip ok" style="align-self:flex-start">Logged</span>' : st === 'not_done' ? `<div class="s-tags"><span class="chip miss">Not done</span><button class="linkbtn" type="button" data-act="undo-not-done" data-sid="${esc(s.id)}" data-date="${esc(s.date)}">Undo</button></div>` : `
        <div class="actions"><button class="btn small" type="button" data-act="tick" data-sid="${esc(s.id)}" data-date="${esc(s.date)}">Done as planned</button>
          <button class="btn small ghost" type="button" data-act="log-session" data-sid="${esc(s.id)}" data-date="${esc(s.date)}">Done, different</button>
          <button class="btn small quiet" type="button" data-act="not-done" data-sid="${esc(s.id)}" data-date="${esc(s.date)}">Not done</button></div>`}</div>`;
    }).join('') : `<p class="muted">${S.chain ? 'No planned session in the last days.' : 'No plan yet. You can still log runs.'}</p>`}
  </div>
  <div class="actions"><button class="btn" type="button" data-act="add-run">Add a run</button><button class="btn quiet" type="button" data-act="wrong">Something felt wrong</button></div>` : ''}
  <div class="card"><h3>Logged</h3>
    ${all.length ? all.map(e => e.nd
      ? `<div class="entry"><span><b>${esc(fmtDate(e.date))}</b> · not done</span><span></span></div>`
      : `<div class="entry"><span><b>${esc(fmtDate(e.date))}</b> · ${esc({ run: 'Run', run_walk: 'Run-walk', race: 'Race', test: 'Test' }[e.type] ?? e.type)} · <span class="num">${esc(Math.round(e.duration_s / 60))} min</span>${e.distance_m ? ` · <span class="num">${esc((e.distance_m / 1000).toFixed(1))} km</span>` : ''}</span>
          <button class="linkbtn" type="button" data-act="del-entry" data-id="${esc(e.id)}">${ui.deleteArmed === e.id ? 'Tap again to delete' : 'Delete'}</button>
          <span class="meta">${e.rpe_0_10 != null ? `effort ${e.rpe_0_10}/10 · ` : ''}${e.pain_any ? `pain ${e.pain_0_10 ?? '?'}/10` : e.pain_any === false ? 'no pain' : 'pain not answered'}${e.pain_next_morning === true ? ' · pain next morning' : ''}${e.source === 'backfill' ? ' · logged late (estimate)' : ''}</span></div>`).join('')
    : '<p class="muted">Nothing logged yet.</p>'}
    ${S.checks.length ? `<p class="muted small">Safety checks answered: ${S.checks.length}${openStops(S).length ? ' · one or more need clearance (see step 3)' : ''}.</p>` : ''}
  </div>
</section>`;
}
function newEntry(sid, date, mode) {
  const ses = sid ? S.chain?.plan?.weeks.flatMap(w => w.sessions).find(s => s.id === sid && s.date === date) : null;
  return {
    sid: ses?.id ?? null, date: ses?.date ?? today(), type: ses ? (ses.is_goal_race ? 'race' : ses.is_test ? 'test' : ses.run_walk ? 'run_walk' : 'run') : 'run',
    min: ses ? String(Math.round(ses.planned_duration_s / 60)) : '', km: ses?.planned_distance_m ? String(ses.planned_distance_m / 1000) : '',
    rpe: '', pain_any: '', pain: '', test_completed: '', test_held: '', sy: {}, wrong: mode === 'wrong', asPlanned: mode === 'tick', err: [],
  };
}
async function saveEntry() {
  const e = ui.entry;
  const err = [];
  const needSymptoms = e.wrong || (e.pain_any === 'yes' && Number(e.pain) > 0);
  if (!e.wrong) {
    if (!isIso(e.date) || e.date > today()) err.push('Choose a date up to today.');
    if (!(Number(e.min) > 0)) err.push('Enter how long you ran, in minutes.');
    if (e.pain_any === 'yes' && !(e.pain !== '' && Number(e.pain) >= 0 && Number(e.pain) <= 10)) err.push('Say how much pain, from 0 to 10.');
  }
  if (needSymptoms && SYMPTOM_IDS.some(id => !e.sy[id])) err.push('Answer each safety question (Yes or No).');
  if (err.length) { e.err = err; render(); return; }
  const date = e.wrong ? today() : e.date;
  if (!e.wrong) {
    const ses = e.sid ? S.chain?.plan?.weeks.flatMap(w => w.sessions).find(s => s.id === e.sid && s.date === e.date) : null;
    const entered = stamp(date);
    const late = !S.settings.tester && daysBetween(date, today()) * 24 > P('log.contemporaneous_window_h') + 24;
    S.log.push({
      id: `e${Date.now().toString(36)}`, date, entered_at: entered, type: e.type, source: late ? 'backfill' : ses && e.asPlanned ? 'tick' : 'manual_add',
      planned_session_id: ses?.id ?? null, module_id: ses?.module_id ?? null, duration_s: Math.round(Number(e.min) * 60),
      distance_m: e.km !== '' && Number(e.km) > 0 ? Math.round(Number(e.km) * 1000) : null,
      rpe_0_10: e.rpe === '' ? null : Number(e.rpe), pain_any: e.pain_any === '' ? null : e.pain_any === 'yes',
      pain_0_10: e.pain_any === 'yes' ? Number(e.pain) : null, pain_next_morning: null, pain_settled_24h: null, gi_score_0_10: null, carb_g_per_h: null,
      fatigue_flag: false, stopped_early_reason: null, conditions_hot: false, effort_all_out: e.type === 'race' ? true : null, is_goal_race: !!ses?.is_goal_race,
      test_completed: ses?.is_test ? (e.test_completed === '' ? null : e.test_completed === 'yes') : null,
      test_held_effort: ses?.is_test ? (e.test_held === '' ? null : e.test_held === 'yes') : null, plausibility_answer: null,
      ui_morning_due: !!(ses && (ses.is_long_run || ['E3', 'E4'].includes(ses.effort_target))),
    });
    S.not_done = S.not_done.filter(n => !(n.session_id === ses?.id && n.date === date));
  }
  let stop = false;
  if (needSymptoms) {
    const answers = Object.fromEntries(SYMPTOM_IDS.map(id => [id, e.sy[id] === 'yes']));
    S.checks.push({ id: `chk${Date.now().toString(36)}`, date, kind: e.wrong ? 'something_felt_wrong' : 'pain', pain: e.wrong ? null : Number(e.pain), answers, cleared_on: null });
    stop = SYMPTOM_IDS.some(id => answers[id] && id !== 'I3');
    if (answers.I3 && !stop) toast(CAT.msgs['MSG-SAF-008'].text);
  }
  ui.entry = null;
  save();
  if (stop && S.current) {
    toast('Your answers paused your plan. See step 3.');
    await generateAt(S.current.today, 'safety');
    return;
  }
  if (e.pain_any === 'yes' && Number(e.pain) > 3) toast(CAT.msgs['MSG-ADP-PAIN-STEP'].text);
  render();
}

// ------------------------------------------------------------------ screen 5: re-plan
function replanDates() {
  const base = S.chain?.today ?? S.current?.today;
  if (!base) return [];
  const t = today();
  const limit = S.settings.tester ? addDays(mondayOnOrAfter(t), 7 * 8) : mondayOnOrAfter(t);
  const out = [];
  for (let d = addDays(mondayOnOrBefore(base), 7); d <= limit; d = addDays(d, 7)) out.push(d);
  return out;
}
function viewReplan() {
  const plan = S.chain?.plan;
  const dates = replanDates();
  const t = today();
  const wd = WEEKDAYS.indexOf(weekday(t));
  // default: the coming Monday from Friday on, else this week's Monday (when it is still ahead of the plan in force)
  const natural = wd >= 4 ? mondayOnOrAfter(t) : mondayOnOrBefore(t);
  const pick = ui.replanDate && dates.includes(ui.replanDate) ? ui.replanDate : dates.includes(natural) ? natural : dates.find(d => d > natural) ?? dates.at(-1) ?? null;
  const from = S.chain?.today;
  const past = plan ? plan.weeks.flatMap(w => w.sessions).filter(s => s.is_run && s.date >= (from ?? '') && s.date < (pick ?? addDays(t, 1))) : [];
  const counts = { logged: 0, not_done: 0, unlogged: 0, future: 0 };
  for (const s of past) counts[sessionStatus(s)]++;
  const unplanned = S.log.filter(e => !e.planned_session_id && e.date >= (from ?? '') && e.date < (pick ?? addDays(t, 1))).length;
  return `<section class="screen" aria-labelledby="h-replan">
  <div class="screen-head"><span class="eyebrow">Step 5 of 5</span><h2 id="h-replan">Re-plan</h2>
    <p class="muted">Each Monday the plan is built again from your answers and your log. ${esc(CAT.msgs['MSG-WHY-ADP'].text)}</p></div>
  ${!S.current ? '<div class="card"><p>No plan yet. Build one in step 2 first.</p></div>' : `
  <div class="card"><h3>Since ${esc(fmtDate(from ?? S.current.today))}</h3>
    ${plan ? `<dl class="facts">
      <dt>Planned runs logged</dt><dd>${counts.logged}</dd><dt>Marked not done</dt><dd>${counts.not_done}</dd><dt>Not logged</dt><dd>${counts.unlogged}</dd><dt>Extra runs logged</dt><dd>${unplanned}</dd></dl>` : '<p class="muted">No plan in force.</p>'}
    ${counts.unlogged ? `<p class="small">${counts.unlogged} past session${counts.unlogged > 1 ? 's are' : ' is'} not logged. If you ran, log ${counts.unlogged > 1 ? 'them' : 'it'} first (step 4); otherwise ${counts.unlogged > 1 ? 'they count' : 'it counts'} as not run.</p>` : ''}
  </div>
  <div class="note info"><b>What re-planning does in this prototype.</b> The generator re-builds the plan from your log: what you ran, how hard it felt, any pain you entered and your safety answers. Missed-session, illness, fatigue and pain rules of the method's adaptation chapter are not built yet, so a missed run only counts through your log being smaller. ${S.settings.tester ? '' : 'Re-plans run from a Monday, as the engine is tested that way.'}</div>
  ${dates.length ? `<div class="card"><div class="field"><label for="rp-date">Re-plan from</label>
      <select id="rp-date" data-ui="replanDate">${dates.map(d => `<option value="${d}"${attr(d === pick, 'selected')}>Monday ${esc(fmtDate(d).slice(4))}${d > t ? ' (coming Monday)' : ''}</option>`).join('')}</select>
      <span class="hint">Runs logged before this date are used; later ones wait for the next re-plan.</span></div>
    <div class="actions"><button class="btn" type="button" data-act="replan" data-date="${esc(pick)}">Re-plan from ${esc(fmtDate(pick))}</button></div></div>`
    : `<div class="card"><p>The next re-plan opens on ${esc(fmtDate(addDays(mondayOnOrBefore(S.chain?.today ?? S.current.today), 7)))}.</p>${S.settings.tester ? '' : '<p class="muted small">Testers can turn on tester mode in "Your data" to try later dates.</p>'}</div>`}
  `}
  ${S.history.length ? `<div class="card"><h3>History</h3>${S.history.slice(0, 12).map(h => `<div class="entry"><span><b>${esc(fmtDate(h.today))}</b> · ${esc({ plan: 'plan', fail_closed: 'options only', gate_stop: 'paused', hold: 'waiting for an answer', safe_state: 'error' }[h.kind] ?? h.kind)}${h.verdict ? ` · ${esc(h.verdict)}` : ''}</span><span class="muted small">${esc({ replan: 're-plan', day0: 'first plan', update: 'answers changed', option: 'option chosen', safety: 'safety answer', attest: 'confirmation' }[h.why] ?? h.why ?? '')}</span>${S.settings.coach && h.reasons?.length ? `<span class="meta coach">${esc(h.reasons.join(', '))}</span>` : ''}</div>`).join('')}</div>` : ''}
</section>`;
}

// ------------------------------------------------------------------ your data
function testReport() {
  return JSON.stringify({
    report: 'running-method prototype test report', made: localTimestamp(), spec: 'v5.2', page_built: document.querySelector('.brand small')?.textContent ?? '',
    profile: S.profile, goal: S.goal, log: S.log, not_done: S.not_done, checks: S.checks, attestations: S.attestations, settings: S.settings,
    current: S.current, history: S.history,
  }, null, 1);
}
function viewData() {
  const bytes = (() => { try { return (localStorage.getItem(KEY) ?? '').length; } catch { return 0; } })();
  return `<section class="screen" aria-labelledby="h-data">
  <div class="screen-head"><span class="eyebrow">Your data</span><h2 id="h-data">What this page keeps, and where</h2></div>
  <div class="card"><p>Your answers, your log and your plans are stored <b>only in this browser, on this device</b>. The page has no server and no account, and sends nothing anywhere: the plan generator runs inside the page.</p>
    <p class="muted small">${storageOk ? `Stored now: about ${Math.ceil(bytes / 1024)} KB. Clearing this site's data in your browser settings also erases it.` : 'This browser is not letting the page store anything, so your answers last only until you close the page.'}</p>
    ${ui.eraseArmed
      ? `<div class="note stop">This erases your answers, your log and every plan from this browser. It cannot be undone.</div><div class="actions"><button class="btn danger" type="button" data-act="erase-confirm">Yes, erase everything</button><button class="btn quiet" type="button" data-act="erase-cancel">Keep my data</button></div>`
      : `<div class="actions"><button class="btn danger" type="button" data-act="erase">Erase all my answers</button></div>`}
  </div>
  <div class="card"><h3>Start a new plan</h3><p>Keeps your answers and your log, and drops the plans made so far. The new plan starts on ${esc(fmtDate(mondayOnOrAfter(today())))}.</p>
    <div class="actions"><button class="btn quiet" type="button" data-act="restart">Start a new plan</button></div></div>
  <div class="card"><h3>For testers</h3>
    <label class="check" for="set-coach"><input type="checkbox" id="set-coach" data-bind="settings.coach" data-rerender="1"${attr(S.settings.coach, 'checked')}><span>Coach view: show rule ids, reason codes and raw results</span></label>
    <label class="check" for="set-tester"><input type="checkbox" id="set-tester" data-bind="settings.tester" data-rerender="1"${attr(S.settings.tester, 'checked')}><span>Tester mode: pretend today is another date, to try later weeks quickly. Runs you log then count as logged the same evening.</span></label>
    ${S.settings.tester ? dateField('settings.pretend_today', 'Pretend today is', { rerender: true, hint: `Device date: ${fmtDate(deviceToday())}.` }) : ''}
    <p class="small">To report a problem, copy the test report and send it to the owner yourself. It holds your answers, so share it only with them.</p>
    <div class="actions"><button class="btn quiet" type="button" data-act="copy-report">${ui.copied ? 'Copied' : 'Copy test report'}</button></div>
    <details><summary class="linkbtn">Show the test report</summary><pre class="json" id="report-text">${esc(testReport())}</pre></details>
  </div>
  <div class="card"><h3>Status of this prototype</h3>
    <ul class="small" style="margin:0;padding-left:1.1em;display:flex;flex-direction:column;gap:4px">
      <li>Not validated on runners. The generator was checked against the written method and an independent test suite only.</li>
      <li>The PAR-Q+ items are placeholders (licence, blocker B-1). Regulatory reading (B-2) and clinical sign-off (B-3) are open: no public release.</li>
      <li>Not built yet: ultras (50 km, 100 km), pregnancy mode, the adaptation rules for missed sessions, illness, pain and fatigue, race-day fuelling.</li>
      <li>${esc(CAT.msgs['MSG-SAF-004'].text)}</li>
    </ul></div>
</section>`;
}

// ------------------------------------------------------------------ render and events
let rendering = false;
function render() {
  if (rendering) return;   // replacing the DOM blurs a focused field, whose change event would re-enter here
  rendering = true;
  try {
    const html = { profile: viewProfile, goal: viewGoal, plan: viewPlan, log: viewLog, replan: viewReplan, data: viewData }[view]();
    $main.innerHTML = html;
  } finally { rendering = false; }
  for (const b of document.querySelectorAll('nav.tabs button')) b.setAttribute('aria-current', b.dataset.go === view ? 'page' : 'false');
  document.getElementById('go-data').setAttribute('aria-current', view === 'data' ? 'page' : 'false');
}
function go(v) { view = v; ui.profileErr = []; ui.goalErr = []; ui.eraseArmed = false; ui.copied = false; render(); window.scrollTo(0, 0); }

function onBind(e) {
  if (rendering) return;
  const el = e.target;
  if (el.dataset.ui) { ui[el.dataset.ui] = el.value; render(); return; }
  if (el.dataset.entry && ui.entry) {
    const k = el.dataset.entry;
    if (k.startsWith('sy.')) ui.entry.sy[k.slice(3)] = el.value; else ui.entry[k] = el.value;
    if (el.dataset.rerender && e.type === 'change') render();
    return;
  }
  const path = el.dataset.bind;
  if (!path) return;
  let v;
  if (el.type === 'checkbox' && el.dataset.kind === 'days') v = [...document.querySelectorAll(`input[data-kind=days]`)].filter(x => x.checked).map(x => x.value);
  else if (el.type === 'checkbox') v = el.checked;
  else if (el.type === 'radio') { if (!el.checked) return; v = el.dataset.kind === 'bool' ? el.value === 'yes' : el.value; }
  else v = el.value;
  setPath(S, path, v);
  if (path === 'profile.guardian_ok' && v) S.profile.guardian_on = today();
  if (path === 'profile.masters_ok' && v) S.profile.masters_on = today();
  if (path === 'goal.res_time' || path === 'goal.res_date') S.goal.result_entered_at = localTimestamp();
  save();
  if (e.type === 'change' && (el.dataset.rerender || el.tagName === 'SELECT' && el.dataset.rerender)) render();
}
$main.addEventListener('change', onBind);
$main.addEventListener('input', e => { if (e.target.type !== 'radio' && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') onBind(e); });

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-go],[data-act]');
  if (!b) return;
  if (b.dataset.go) { go(b.dataset.go); return; }
  const act = b.dataset.act;
  const plan = S.chain?.plan;
  switch (act) {
    case 'save-profile': {
      ui.profileErr = profileErrors(S.profile, today());
      if (ui.profileErr.length) { render(); document.querySelector('.err')?.scrollIntoView({ block: 'center' }); return; }
      S.profile.saved_on = today(); save();
      if (S.current && S.goal.saved_on && !goalErrors(S.goal).length) { await generateAt(S.current.today, 'update'); return; }
      go('goal'); return;
    }
    case 'build-plan': case 'update-plan': {
      ui.goalErr = goalErrors(S.goal);
      if (ui.goalErr.length) { render(); document.querySelector('.err')?.scrollIntoView({ block: 'center' }); return; }
      if (!S.goal.saved_on || !S.current) S.goal.saved_on = today();
      save();
      await generateAt(act === 'build-plan' ? mondayOnOrAfter(today()) : S.current.today, act === 'build-plan' ? 'day0' : 'update');
      return;
    }
    case 'choose-option': {
      const o = S.current?.result?.feasibility?.options?.find(x => String(x.rank) === b.dataset.rank);
      if (!o) return;
      applyOption(S, o); save();
      await generateAt(S.current.today, 'option');
      return;
    }
    case 'replan': { await generateAt(b.dataset.date, 'replan'); return; }
    case 'attest': {
      const id = b.dataset.msg;
      const box = document.getElementById(`att-${id}`);
      if (box && !box.checked) { toast('Tick the box to confirm.'); return; }
      S.attestations.push({ msg_id: id, attested_on: today() });
      if (id === 'MSG-SAF-021') { S.profile.guardian_ok = true; S.profile.guardian_on = today(); }
      if (id === 'MSG-SAF-040') { S.profile.masters_ok = true; S.profile.masters_on = today(); }
      save();
      const d = S.current.today >= today() ? S.current.today : mondayOnOrAfter(today());
      await generateAt(d, 'attest');
      return;
    }
    case 'clear-stop': {
      const st = openStops(S).find(x => x.id === b.dataset.stop);
      if (!st) return;
      const box = document.getElementById(`att-${st.id}`);
      if (box && !box.checked) { toast('Tick the box to confirm.'); return; }
      if (today() < addDays(st.date ?? today(), P('flag.clearance_min_delay_days'))) { ui.attestErr = st.id; render(); return; }
      ui.attestErr = null;
      S.attestations.push({ msg_id: b.dataset.msg, attested_on: today() });
      if (st.source === 'profile') {
        S.profile.symptoms = Object.fromEntries(SYMPTOM_IDS.map(id => [id, null]));
        save(); go('profile'); toast('Thank you. Please answer the "right now" questions again, then save.');
        return;
      }
      const c = S.checks.find(x => x.id === st.id); if (c) c.cleared_on = today();
      save();
      if (!openStops(S).length) await generateAt(S.current.today >= today() ? S.current.today : mondayOnOrAfter(today()), 'attest'); else render();
      return;
    }
    case 'log-session': ui.entry = newEntry(b.dataset.sid, b.dataset.date, 'different'); view = 'log'; render(); window.scrollTo(0, 0); return;
    case 'tick': ui.entry = newEntry(b.dataset.sid, b.dataset.date, 'tick'); render(); document.getElementById('entry-card')?.scrollIntoView({ block: 'start' }); return;
    case 'add-run': ui.entry = newEntry(null, null, 'add'); render(); return;
    case 'wrong': ui.entry = newEntry(null, null, 'wrong'); render(); return;
    case 'cancel-entry': ui.entry = null; render(); return;
    case 'rpe-skip': if (ui.entry) { ui.entry.rpe = ''; render(); } return;
    case 'save-entry': await saveEntry(); return;
    case 'not-done': S.not_done.push({ session_id: b.dataset.sid, date: b.dataset.date }); save(); render(); return;
    case 'undo-not-done': S.not_done = S.not_done.filter(n => !(n.session_id === b.dataset.sid && n.date === b.dataset.date)); save(); render(); return;
    case 'morning': {
      const en = S.log.find(x => x.id === b.dataset.id);
      if (en) { en.pain_next_morning = b.dataset.v === 'yes'; save(); }
      if (b.dataset.v === 'yes') { ui.entry = { ...newEntry(null, null, 'wrong'), wrong: true }; toast(CAT.msgs['MSG-ADP-PAIN-STEP'].text); }
      render(); return;
    }
    case 'del-entry': {
      if (ui.deleteArmed !== b.dataset.id) { ui.deleteArmed = b.dataset.id; render(); return; }
      S.log = S.log.filter(x => x.id !== b.dataset.id); ui.deleteArmed = null; save(); render(); return;
    }
    case 'erase': ui.eraseArmed = true; render(); return;
    case 'erase-cancel': ui.eraseArmed = false; render(); return;
    case 'erase-confirm': eraseAll(); return;
    case 'restart': {
      S.chain = null; S.chainPrev = null; S.current = null; S.changes = null; S.not_done = [];
      S.history.unshift({ at: localTimestamp(), today: today(), kind: 'restart', why: 'restart' });
      save(); go('goal'); return;
    }
    case 'copy-report': {
      const text = testReport();
      try { await navigator.clipboard.writeText(text); ui.copied = true; render(); toast('Test report copied.'); }
      catch {
        const d = document.querySelector('#report-text')?.closest('details'); if (d) d.open = true;
        const pre = document.getElementById('report-text');
        if (pre) { const r = document.createRange(); r.selectNodeContents(pre); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
        toast('Copy was refused here. The report is selected below: copy it by hand.');
      }
      return;
    }
    default: void plan;
  }
});
document.querySelector('nav.tabs').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { e.stopPropagation(); go(b.dataset.go); } });
document.getElementById('go-data').addEventListener('click', e => { e.stopPropagation(); go('data'); });

render();

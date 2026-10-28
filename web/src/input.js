// Turns the answers stored in the browser into the engine's generator input (spec/schema/input-profile.schema.json).
// Pure functions: no DOM, no storage, no clock (the caller passes the dates), so they can be checked in Node.
import { addDays, daysBetween, isIso } from './dates.js';

// PAR-Q+ PLACEHOLDERS (blocker B-1): the licensed text is not in this repository. The item ids and the
// test factor of each item are the ones the spec fixtures use (spec/fixtures-input, "invented: PLACEHOLDER").
export const PARQ_PLACEHOLDERS = [
  { id: 'parq_placeholder_01', factor: 'known_disease' },
  { id: 'parq_placeholder_02', factor: 'symptom' },
  { id: 'parq_placeholder_03', factor: 'symptom' },
  { id: 'parq_placeholder_04', factor: 'symptom' },
  { id: 'parq_placeholder_05', factor: 'musculoskeletal' },
  { id: 'parq_placeholder_06', factor: 'other' },
  { id: 'parq_placeholder_07', factor: 'other' },
];

// 10 §1 red-flag questions, as the spec words them. C1–C4 and B1–B4 share a lead-in; P1–P2 (pregnancy mode) and
// B5 (region) are not asked: pregnancy mode is not built in the engine, and any B answer already pauses the plan.
export const SYMPTOM_GROUPS = [
  { lead: 'During or just after running, did you have:', items: [
    ['C1', 'chest pain, pressure or tightness?'],
    ['C2', 'faint or nearly faint?'],
    ['C3', 'a racing or fluttering heartbeat unusual for you?'],
    ['C4', 'far more breathlessness than the effort explains?'],
  ] },
  { lead: 'About any pain:', items: [
    ['B1', 'Is there a spot on a bone that hurts when you press it?'],
    ['B2', 'Does the pain start earlier in each run or grow as you run?'],
    ['B3', 'Does it hurt at rest or wake you at night?'],
    ['B4', 'Are you limping, or does hopping on that leg hurt?'],
  ] },
  { lead: 'Heat and drinking:', items: [
    ['H1', 'Running in warm weather: is the runner confused, acting strangely or collapsed?'],
    ['H2', 'In the heat: dizzy, sick, headache, very hot and unable to keep going?'],
    ['E1', 'After a long run or race where you drank a lot: confusion, severe headache, vomiting, or swollen hands or feet?'],
  ] },
  { lead: 'Feeling unwell:', items: [
    ['I1', 'Fever or feeling hot and shivery?'],
    ['I2', 'Chest, cough, body aches or stomach upset?'],
    ['I3', 'Only a runny nose or mild sore throat?'],
  ] },
];
export const SYMPTOM_IDS = SYMPTOM_GROUPS.flatMap(g => g.items.map(i => i[0]));

// 01 §1.1 / §1.2 answer bands → stored values
export const EXPERIENCE = [
  ['never', 'I have never run', 0], ['lt3m', 'Less than 3 months', 0.15], ['3_12m', '3–12 months', 0.6],
  ['1_3y', '1–3 years', 2], ['3_10y', '3–10 years', 5], ['gt10y', 'More than 10 years', 12],
];
export const LAST_RUN = [
  ['this_week', 'This week', 3], ['1_2_weeks', '1–2 weeks ago', 11], ['2_4_weeks', '2–4 weeks ago', 22],
  ['1_3_months', '1–3 months ago', 60], ['3_12_months', '3–12 months ago', 180], ['over_a_year', 'More than a year ago', 400],
  ['never', 'Never', null],
];
export const SPORTS = [['none', 'None'], ['cycling', 'Cycling'], ['swimming', 'Swimming'], ['triathlon', 'Triathlon'], ['team', 'A team sport'], ['other', 'Another sport']];
export const DISTANCES = [['5K', '5 km'], ['10K', '10 km'], ['HM', 'Half marathon'], ['M', 'Marathon'], ['50K', '50 km'], ['100K', '100 km']];
export const RACE_M = { '5K': 5000, '10K': 10000, HM: 21097, M: 42195, '50K': 50000, '100K': 100000 };
export const NOT_BUILT_DISTANCES = new Set(['50K', '100K']); // release R3: the engine fails closed for ultras

export function emptyState() {
  return {
    v: 1,
    profile: {
      birth_month: '', birth_year: '', sex: '', experience: '', other_sport: '', injury: '',
      pregnant: '', due_date: '', postpartum: '', birth_date: '',
      parq: Object.fromEntries(PARQ_PLACEHOLDERS.map(p => [p.id, null])),
      symptoms: Object.fromEntries(SYMPTOM_IDS.map(id => [id, null])),
      guardian_ok: false, masters_ok: false,
      saved_on: null, created_at: null,
    },
    goal: {
      runs_pw: '', week_min: '', week_km: '', l30_min: '', l30_km: '', last_run: '', cont30: '',
      has_result: 'no', res_kind: 'race', res_dist: '10K', res_km: '', res_time: '', res_date: '',
      goal_kind: '', distance: '', goal_type: 'finish', target: '', race_date: '', hot: false,
      days: [], max_runs: '', minutes: '', long_day: 'auto', runwalk: '', tests_opt_out: false, hills: false,
      saved_on: null, created_at: null,
    },
    log: [],            // ActivityRecords as sent to the engine, plus ui_* fields stripped before sending
    not_done: [],       // { session_id, date } — UI only (missed-session events of 08 are not built in the engine)
    checks: [],         // symptom checks from the log: { id, date, kind, pain, answers, cleared_on }
    attestations: [],   // { msg_id, attested_on }
    chain: null,        // last result that carried a plan: { today, engine_state, plan, flags }
    chainPrev: null,    // the one before, used when the same date is generated again
    current: null,      // last result shown: { today, at, result }
    history: [],        // { at, today, kind, verdict, reasons, gate, why }
    changes: null,      // what changed at the last re-plan
    settings: { coach: false, tester: false, pretend_today: '' },
  };
}

const num = v => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const intOr = v => (num(v) == null ? null : Math.round(num(v)));

/** "1:52:30", "52:30" or "52" (minutes) → seconds. */
export function parseTime(s) {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  const parts = t.split(':').map(x => x.trim());
  if (parts.some(p => !/^\d+$/.test(p))) return null;
  const n = parts.map(Number);
  if (n.length === 1) return n[0] * 60;
  if (n.length === 2) return n[0] * 60 + n[1];
  if (n.length === 3) return n[0] * 3600 + n[1] * 60 + n[2];
  return null;
}

export function ageOn(profile, iso) {
  const y = intOr(profile.birth_year), m = intOr(profile.birth_month);
  if (!y || !m || !isIso(iso)) return null;
  const yy = Number(iso.slice(0, 4)), mm = Number(iso.slice(5, 7));
  return { low: yy - y - (mm <= m ? 1 : 0), high: yy - y - (mm < m ? 1 : 0) };
}

/** Errors that block saving the profile (fields of inp.no_unknown_fields have no "I don't know"). */
export function profileErrors(p, today) {
  const e = [];
  const y = intOr(p.birth_year);
  if (!intOr(p.birth_month)) e.push('Choose your birth month.');
  if (!y || y < 1900 || y > Number(today.slice(0, 4))) e.push('Enter your birth year (four digits).');
  if (!p.experience) e.push('Say how long you have run at least weekly.');
  if (!p.pregnant) e.push('Answer the pregnancy question.');
  if (p.pregnant === 'yes' && !isIso(p.due_date)) e.push('Enter your due date.');
  if (!p.postpartum) e.push('Answer the question about giving birth.');
  if (p.postpartum === 'yes' && !isIso(p.birth_date)) e.push('Enter the date you gave birth.');
  if (PARQ_PLACEHOLDERS.some(q => p.parq[q.id] == null)) e.push('Answer every placeholder health item (Yes or No).');
  if (SYMPTOM_IDS.some(id => p.symptoms[id] == null)) e.push('Answer every "right now" question (Yes or No).');
  return e;
}

export function goalErrors(g) {
  const e = [];
  if (!g.goal_kind) e.push('Choose a race goal or "build my running".');
  if (g.goal_kind === 'race') {
    if (!g.distance) e.push('Choose the race distance.');
    if (!isIso(g.race_date)) e.push('Enter the race date.');
    if (g.goal_type === 'time' && !parseTime(g.target)) e.push('Enter a target time, for example 52:30 or 1:55:00.');
  }
  if (g.has_result === 'yes') {
    if (!parseTime(g.res_time)) e.push('Enter the result time, for example 24:10.');
    if (!isIso(g.res_date)) e.push('Enter the date of the result.');
    if (g.res_dist === 'other' && !(num(g.res_km) > 0)) e.push('Enter the result distance in km.');
  }
  return e;
}

/** Symptom checks still open: any yes, not yet cleared. */
export function openStops(state) {
  const out = [];
  const onb = SYMPTOM_IDS.filter(id => state.profile.symptoms[id] === true);
  if (onb.length) out.push({ source: 'profile', id: 'profile', date: state.profile.saved_on, yes: onb });
  for (const c of state.checks) {
    const yes = SYMPTOM_IDS.filter(id => c.answers[id] === true);
    if (yes.length && !c.cleared_on) out.push({ source: 'log', id: c.id, date: c.date, yes });
  }
  return out;
}
/** Which attestation a stop needs: illness alone (I1/I2) → MSG-SAF-012, otherwise MSG-SAF-011 (10 SAF-021). */
export function clearanceMsg(stop) {
  const serious = stop.yes.filter(id => id !== 'I3');
  return serious.length && serious.every(id => id === 'I1' || id === 'I2') ? 'MSG-SAF-012' : 'MSG-SAF-011';
}

/**
 * The generator input for a call on `today` (a Monday). `nowDate` is the runner's current date (device or tester
 * date); it dates nothing the engine reads except through the stored answers.
 */
export function buildInput(state, today, opts = {}) {
  const p = state.profile, g = state.goal;
  const unknown = [];
  const exp = EXPERIENCE.find(x => x[0] === p.experience);
  const never = p.experience === 'never';
  const days = Array.isArray(g.days) && g.days.length ? g.days : null;   // none ticked = "I don't know" (INP-007 defaults)
  if (!days) unknown.push('profile.available_days');
  const maxRuns = intOr(g.max_runs);
  if (maxRuns == null) unknown.push('profile.max_runs_per_week');
  const minutes = intOr(g.minutes);
  if (minutes == null) unknown.push('profile.available_minutes_per_week');
  const injury = p.injury === 'yes' ? true : p.injury === 'no' ? false : null;
  if (injury == null) unknown.push('profile.injury_last_12m');
  const rw = g.runwalk === 'yes' ? true : g.runwalk === 'no' ? false : null;
  if (rw == null) unknown.push('profile.run_walk_preference');
  const longDay = g.long_day && g.long_day !== 'auto' ? g.long_day : null;
  if (!longDay) unknown.push('profile.long_run_day');
  if (!exp) unknown.push('profile.training_age_years');

  const special = [];
  if (p.pregnant === 'yes') special.push({ type: 'pregnant', start_date: p.saved_on ?? today, attested: true, due_date: p.due_date, has_given_birth: null });
  if (p.postpartum === 'yes' && isIso(p.birth_date)) special.push({ type: 'postpartum', start_date: p.birth_date, attested: true });

  const att = state.attestations.filter(a => a.attested_on <= today);
  const latest = id => att.filter(a => a.msg_id === id).map(a => a.attested_on).sort().at(-1) ?? null;
  const age = ageOn(p, today);

  // claim (01 §1.2): answered when the profile was saved; last_run_date = answer date − band days
  const claimDate = g.saved_on ?? today;
  const band = LAST_RUN.find(x => x[0] === g.last_run);
  const runsPw = intOr(g.runs_pw);
  if (runsPw == null) unknown.push('claim.runs_per_week');
  if (!band) unknown.push('claim.last_run_band');
  const cont30 = g.cont30 === 'yes' ? true : g.cont30 === 'no' ? false : null;
  if (cont30 == null) unknown.push('claim.continuous_30min');
  const weekMin = num(g.week_min), weekKm = num(g.week_km), l30Min = num(g.l30_min), l30Km = num(g.l30_km);

  const anchors = [];
  if (g.has_result === 'yes' && parseTime(g.res_time) && isIso(g.res_date) && g.res_date <= today) {
    const dist = g.res_dist === 'other' ? Math.round(num(g.res_km) * 1000) : RACE_M[g.res_dist];
    if (dist > 0) anchors.push({
      id: 'a1', kind: g.res_kind === 'field_test' ? 'field_test' : 'race', distance_m: dist, time_s: parseTime(g.res_time),
      date: g.res_date, entered_at: g.result_entered_at ?? g.created_at ?? `${today}T12:00:00Z`, conditions_hot: false, effort_all_out: true, confirmed_by_runner: null,
    });
  }

  const goal = g.goal_kind === 'base'
    ? { id: 'goal-1', distance: 'none', goal_type: 'base', target_time_s: null, race_date: null, expected_conditions: 'normal', cutoff_h: null, milestones: [], race_status: 'planned', created_at: g.created_at }
    : { id: 'goal-1', distance: g.distance, goal_type: g.goal_type === 'time' ? 'time' : 'finish', target_time_s: g.goal_type === 'time' ? parseTime(g.target) : null,
      race_date: g.race_date, expected_conditions: g.hot ? 'hot' : 'normal', cutoff_h: null, milestones: [], race_status: 'planned', created_at: g.created_at };

  const log = state.log.filter(e => e.date < today).map(stripUi);
  // symptom checks from the log (INP-023): open ones (any yes, not cleared), and recent all-no ones
  const events = state.checks
    .filter(c => c.date <= today && !c.cleared_on && (SYMPTOM_IDS.some(id => c.answers[id] === true) || daysBetween(c.date, today) <= 7))
    .map(c => ({ id: c.id, kind: c.kind, date: c.date, payload: { ...(c.pain != null ? { pain_0_10: c.pain } : {}), ...c.answers } }));

  const chain = opts.chain ?? null;
  return {
    schema_version: 'v5.2', today, timezone: opts.timezone ?? 'UTC', ruleset_version: 'v5.2', registry_version: 'v5.2',
    declared_unknown: unknown,
    profile: {
      id: 'runner', birth_month: intOr(p.birth_month), birth_year: intOr(p.birth_year), sex: p.sex === 'f' || p.sex === 'm' ? p.sex : null,
      training_age_years: exp ? exp[2] : null, never_run: never, other_sport_background: p.other_sport || 'none', injury_last_12m: injury,
      available_days: days, max_runs_per_week: maxRuns, available_minutes_per_week: minutes, blocked_dates: [], long_run_day: longDay,
      run_walk_preference: rw, run_walk_preference_explicit: rw != null, preset_preference: null, night_shift_dates: [],
      hill_access: !!g.hills, nutrition_referral_flag: false, caffeine_sensitive: false, b2b_opt_in: false, level_tests_opt_out: !!g.tests_opt_out,
      created_at: p.created_at ?? `${today}T12:00:00Z`, special_status: special, attestations: att.map(a => ({ msg_id: a.msg_id, attested_on: a.attested_on })),
    },
    screening: {
      instrument: 'PAR-Q+ 2023',
      answers: { ...p.parq },
      followup_answers: {},
      item_factor: Object.fromEntries(PARQ_PLACEHOLDERS.map(q => [q.id, q.factor])),
      current_symptoms: { ...p.symptoms },
      guardian_attested_on: age && age.low < 18 && p.guardian_ok ? (p.guardian_on ?? p.saved_on) : null,
      guardian_hardcap_optin: false,
      completed_on: p.saved_on, valid_until: p.saved_on ? addDays(p.saved_on, 365) : undefined,
      clearance_attested_on: latest('MSG-SAF-011'),
      saf060_attested_on: p.masters_ok ? (p.masters_on ?? p.saved_on) : latest('MSG-SAF-040'),
      masters_checked: false,
    },
    claim: {
      runs_per_week: runsPw, weekly_distance_m: weekKm == null ? null : Math.round(weekKm * 1000), weekly_time_s: weekMin == null ? null : Math.round(weekMin * 60),
      L30_distance_m: l30Km == null ? null : Math.round(l30Km * 1000), L30_duration_s: l30Min == null ? null : Math.round(l30Min * 60),
      last_run_band: band ? band[0] : null, last_run_date: band && band[2] != null ? addDays(claimDate, -band[2]) : null, continuous_30min: cont30,
    },
    anchors, hr_references: [], log, sweat_tests: [], reds_screens: [],
    goal, goal_edits: [], flags: chain?.flags ?? [], events,
    engine_state: chain?.engine_state ?? null, parent_plan: chain?.plan ?? null,
  };
}

export function stripUi(e) {
  const o = {};
  for (const [k, v] of Object.entries(e)) if (!k.startsWith('ui_')) o[k] = v;
  return o;
}

/** Applies a fail-closed option (07 §6, FEA-040) to the stored answers: goal and availability, never applied silently. */
export function applyOption(state, option) {
  const g = state.goal;
  const ng = option.new_goal;
  if (ng.goal_type === 'base' || ng.distance === 'none') { g.goal_kind = 'base'; }
  else {
    g.goal_kind = 'race'; g.distance = ng.distance; g.race_date = ng.race_date ?? g.race_date;
    g.goal_type = ng.goal_type === 'time' ? 'time' : 'finish';
    g.target = ng.goal_type === 'time' && ng.target_time_s ? secondsToClock(ng.target_time_s) : '';
  }
  const ch = option.availability_change;
  if (ch?.add_day) {
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = [...new Set([...(g.days ?? []), ch.add_day])].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    g.days = days;
    g.max_runs = String(Math.max(intOr(g.max_runs) ?? 0, days.length));
  }
  if (ch?.extra_minutes_per_week) g.minutes = String((intOr(g.minutes) ?? 0) + ch.extra_minutes_per_week);
}

export function secondsToClock(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.round(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
}

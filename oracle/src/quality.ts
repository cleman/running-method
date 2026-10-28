// v5.3 plan-quality properties (proposal v5.3 §6 item 2, restated by spec 14 TST-133) and the distance/time
// rendering checks (06 §2d, SES-031/032, 14 TST-134). Every property is evaluated from the RESULT plus the raw
// INPUT; the experienced path, levels and paces are the oracle's own derivation (src/v53.ts).
//
//   QC-01 weekly running ≥ 0.85 × claimed weekly time outside deload, taper and race weeks
//   QC-02 key sessions: calibration non-deload weeks exactly 2 (SES-M-008 + SES-M-010 at the entry rung);
//         BUILD/SPECIFIC non-deload weeks 2–3, 3 only when SES-007's conditions hold, never above the runner's ceiling
//   QC-03 at least two different hard-session families in every 2 consecutive loading weeks
//   QC-04 time goal: race-pace work in SPECIFIC
//   QC-05 long run ≥ 0.8 × the habitual (claimed) long run outside taper
//   QC-06 no hard session the day before or after a long run that holds quality, or any long run on the cautious path
//   QC-07 the planned dose path rises over BUILD
//   QC-08 the distance form whenever paces are known and the preference allows it
//   RD-01 rounding to track-friendly distances within ses.dist_round_tol_pct, else time form with "about"
//   RD-02 the time stays the controlling quantity (every rendered segment keeps duration_s, no distance_m)
//   RD-03 effort-only plans and dates without paces, the time preference and fartlek: time form only
//   RD-04 recoveries in 100 m steps at the E1 midpoint speed
//   EXP-P path, calibration weeks, levels (result.state), no ONBOARD on the experienced path
import { addDays } from './dates.js';
import { effortRank, hasHardSegment, hasQualityLongSegment, runVolume, type Finding } from './invariants.js';
import { activeAnchor, deriveExp, midSpeed, nearestTrack, paceRanges, renderRecovery, type ExpDerivation, type Reading } from './v53.js';
import { ENTRY_RUNG, PV, TIME_ONLY } from './v53-params.js';
import type { Input, Plan, Result, Session, Week } from './types.js';

/** Hard-session families of proposal v5.3 §4 B3 (the eight rows), by module. */
export const B3_FAMILY: Record<string, string> = {
  'SES-M-008': 'threshold', 'SES-M-009': 'threshold', 'SES-M-012': 'threshold',
  'SES-M-010': 'vo2_long', 'SES-M-027': 'vo2_short', 'SES-M-028': 'hills', 'SES-M-029': 'fartlek',
  'SES-M-011': 'race_pace', 'SES-M-030': 'combination', 'SES-M-031': 'long_run_variant', 'SES-M-005': 'long_run_variant',
};

const isLoading = (w: Week) => !w.is_deload && w.phase !== 'TAPER' && w.phase !== 'RACE' && !w.is_race_week && w.taper_k == null && w.phase !== 'TRANSITION';
const keysOf = (w: Week) => w.sessions.filter((s) => s.is_key);
/** E2–E4 work time of a session (the dose, read from durations only). */
export function workS(s: Session): number {
  return s.segments.reduce((a, g) => a + (effortRank(g.effort) >= 2 && g.effort !== 'E5' && g.duration_s != null ? g.duration_s * g.repeats : 0), 0);
}

export interface QualityOptions { exp?: ExpDerivation }

export function checkQuality(input: Input, result: Result, opts: QualityOptions = {}): Finding[] {
  const out: Finding[] = [];
  const plan = result.plan;
  if (result.kind !== 'plan' || !plan) return out;
  const exp = opts.exp ?? deriveExp(input);
  const v = (inv: string, note: string, x: Partial<Finding> = {}) => out.push({ inv, severity: 'violation', note, ...x });
  const w_ = (inv: string, note: string, x: Partial<Finding> = {}) => out.push({ inv, severity: 'warning', note, ...x });
  checkPath(input, result, plan, exp, v, w_);
  if (exp.experienced) checkCoach(input, plan, exp, v, w_);
  else checkCautious(plan, v);
  checkRendering(input, plan, v, w_);
  return out;
}

type Emit = (inv: string, note: string, x?: Partial<Finding>) => void;

function checkPath(input: Input, result: Result, plan: Plan, exp: ExpDerivation, v: Emit, w_: Emit) {
  const st = (result.state ?? {}) as Record<string, any>;
  const path = st.exp_path ?? (result.engine_state as any)?.experienced?.path;
  const want = exp.experienced ? 'calibrating' : 'none';
  if (path == null) w_('EXP-P', `result does not report the path (state.exp_path); oracle expects ${want}`);
  else if (path !== want) v('EXP-P', `path ${path}, oracle expects ${want} (${exp.failing.join('; ') || 'all EXP-001 conditions hold'})`);
  const msgs = new Set(result.messages.map((m) => m.id));
  if (exp.asksConfirm && !msgs.has('MSG-EXP-CONFIRM-Q')) v('EXP-006', 'race qualifies except the unanswered "official result?" question, but MSG-EXP-CONFIRM-Q is not shown');
  if (exp.experienced && !msgs.has('MSG-EXP-PATH')) w_('EXP-001', 'MSG-EXP-PATH not among the messages');
  if (exp.experienced) {
    if (plan.phases.some((p) => p.type === 'ONBOARD')) v('EXP-P', 'ONBOARD phase on the experienced path (04 §1)');
    const levels = st.levels as { node: string; level: number; confidence: string }[] | undefined;
    for (const [node, want] of Object.entries(exp.levels)) {
      const got = levels?.find((l) => l.node === node);
      if (!got) continue;
      if (got.level !== want) v('EXP-002', `${node} level ${got.level}, oracle expects ${want}`);
      if (['THR', 'VO2', 'MSP', 'HAB', 'TOL', 'AER', 'DUR'].includes(node) && want > 0 && got.confidence !== 'declared') w_('EXP-002', `${node} confidence ${got.confidence}, expected declared`);
    }
    const l30 = st.L30_eff_time_s as number | undefined;
    const c = input.claim?.L30_duration_s;
    if (l30 != null && c != null) {
      const want = PV['exp.l30_discount'] * c;
      if (Math.abs(l30 - want) > 60) v('GEN-011', `L30_eff ${l30} s, oracle expects 0.9 × ${c} = ${want} s (±60 s, OQ-03)`);
    }
  }
  // calibration weeks: exactly the first exp.calibration_weeks plan weeks
  plan.weeks.forEach((w) => {
    const should = exp.experienced && w.index <= PV['exp.calibration_weeks'];
    if (w.is_calibration != null && w.is_calibration !== should) v('EXP-003', `week ${w.index} is_calibration ${w.is_calibration}, expected ${should}`, { week: w.index });
  });
}

function checkCautious(plan: Plan, v: Emit) {
  for (const w of plan.weeks) {
    if (w.is_calibration) v('EXP-P', `calibration week ${w.index} on the cautious path`, { week: w.index });
    if (w.long_run_form) v('EXP-P', `week ${w.index} long_run_form ${w.long_run_form} on the cautious path`, { week: w.index });
    if (keysOf(w).length > 2) v('SES-007', `week ${w.index}: ${keysOf(w).length} key sessions on the cautious path (max 2)`, { week: w.index });
  }
  // QC-06 cautious reading: no hard session next to any long run (INV-17 already covers it; kept for the report)
  adjacency(plan, false, v);
}

function checkCoach(input: Input, plan: Plan, exp: ExpDerivation, v: Emit, w_: Emit) {
  const claimV = input.claim?.weekly_time_s ?? null;
  const claimL = input.claim?.L30_duration_s ?? null;
  const ceiling = input.profile.hard_sessions_max ?? PV['exp.hard_sessions_max_default'];
  for (const w of plan.weeks) {
    // QC-01
    if (claimV != null && isLoading(w) && runVolume(w) < 0.85 * claimV)
      v('QC-01', `week ${w.index} (${w.phase}) runs ${runVolume(w) / 60} min < 0.85 × claimed ${claimV / 60}`, { week: w.index, observed: runVolume(w), limit: 0.85 * claimV });
    // QC-05 (deload weeks: LOD-040 cuts the long run by 25 %, which the literal property forbids; OQ-30)
    const lr = w.sessions.filter((s) => s.is_long_run && !s.is_goal_race);
    if (claimL != null && lr.length && w.phase !== 'TAPER' && w.taper_k == null && !w.is_race_week) {
      const m = Math.max(...lr.map((s) => s.planned_duration_s));
      if (m < 0.8 * claimL) (w.is_deload ? w_ : v)('QC-05', `week ${w.index}${w.is_deload ? ' (deload, OQ-30)' : ''} long run ${m / 60} min < 0.8 × habitual ${claimL / 60}`, { week: w.index });
    }
    // QC-02
    const k = keysOf(w).length;
    if (w.is_deload || !(w.phase === 'BUILD' || w.phase === 'SPECIFIC' || w.index <= PV['exp.calibration_weeks'])) continue;
    if (w.index <= PV['exp.calibration_weeks']) {
      const ids = keysOf(w).map((s) => s.module_id).sort().join(',');
      if (ids !== 'SES-M-008,SES-M-010') v('QC-02', `calibration week ${w.index} keys [${ids}], expected SES-M-008 + SES-M-010`, { week: w.index });
      for (const s of keysOf(w)) {
        const node = s.module_id === 'SES-M-008' ? 'THR' : 'VO2';
        const entry = ENTRY_RUNG[s.module_id]?.[exp.levels[node]];
        if (s.dose_step != null && entry != null && s.dose_step !== entry) v('EXP-003', `calibration week ${w.index} ${s.module_id} step ${s.dose_step}, entry rung ${entry}`, { week: w.index, session: s.id });
      }
      continue;
    }
    const runs = w.sessions.filter((s) => s.is_run).length;
    const three = runs >= PV['exp.three_keys_runs_min'] && exp.levels.TOL >= PV['exp.three_keys_tol_min'];
    const max = Math.min(ceiling, three ? PV['exp.keys_max'] : 2), min = Math.min(2, ceiling);
    if (k > max) v('QC-02', `week ${w.index} (${w.phase}) ${k} key sessions > ${max}`, { week: w.index });
    else if (k < min) v('QC-02', `week ${w.index} (${w.phase}) ${k} key sessions < ${min}`, { week: w.index });
    else if (k < max) w_('QC-02', `week ${w.index} (${w.phase}) ${k} key sessions, SES-007 allows ${max} (SES-006 budget or placement may drop one)`, { week: w.index });
    if (k === 3 && w.long_run_form === 'b' && !w.sessions.some((s) => s.is_long_run && s.is_key))
      v('SES-026', `week ${w.index} form b without a key long run`, { week: w.index });
  }
  // QC-03 two families in every pair of consecutive loading weeks that hold key sessions
  const loading = plan.weeks.filter((w) => isLoading(w) && keysOf(w).length);
  for (let i = 1; i < loading.length; i++) {
    const a = loading[i - 1], b = loading[i];
    if (b.index - a.index > 2) continue; // separated by a deload: not "consecutive"
    const fams = new Set([...keysOf(a), ...keysOf(b), ...[...a.sessions, ...b.sessions].filter((s) => s.is_long_run && hasQualityLongSegment(s))]
      .map((s) => B3_FAMILY[s.module_id] ?? s.module_id));
    if (fams.size < 2) {
      const base = a.phase === 'BASE' && b.phase === 'BASE';
      (base ? w_ : v)('QC-03', `weeks ${a.index}–${b.index} (${a.phase}/${b.phase}) hold one hard-session family: ${[...fams].join(',')}${base ? ' (BASE holds one key session, Q-E34)' : ''}`, { week: b.index });
    }
  }
  // QC-04 race-pace work in SPECIFIC for a time goal
  if (input.goal.goal_type === 'time') {
    const spec = plan.weeks.filter((w) => w.phase === 'SPECIFIC');
    if (spec.length && !spec.some((w) => w.sessions.some((s) => s.module_id === 'SES-M-011' || s.module_id === 'SES-M-005')))
      v('QC-04', 'time goal without race-pace work (SES-M-011/005) in SPECIFIC');
  }
  // QC-06
  adjacency(plan, true, v);
  // QC-07 the planned path rises over BUILD: per module, non-decreasing work over its non-deload BUILD instances,
  // and the BUILD key work as a whole rises (first vs last loading BUILD week of the same form)
  const build = plan.weeks.filter((w) => w.phase === 'BUILD' && isLoading(w));
  const byModule = new Map<string, number[]>();
  for (const w of build) for (const s of keysOf(w)) if (!s.is_test) byModule.set(s.module_id, [...(byModule.get(s.module_id) ?? []), workS(s)]);
  let rose = false;
  for (const [m, ws] of byModule) {
    for (let i = 1; i < ws.length; i++) {
      if (ws[i] < ws[i - 1]) v('QC-07', `${m} work falls in BUILD: ${ws.map((x) => x / 60).join(' → ')} min`);
      if (ws[i] > ws[i - 1]) rose = true;
    }
  }
  if (build.length >= 3 && !rose) v('QC-07', 'no key module grows over BUILD (flat projection, SES-028)');
}

/** QC-06: on the experienced path only long runs with quality forbid a hard neighbour (TST-133 restated). */
function adjacency(plan: Plan, experienced: boolean, v: Emit) {
  const all = plan.weeks.flatMap((w) => w.sessions);
  for (const lr of all.filter((s) => s.is_long_run && !s.is_goal_race)) {
    if (experienced && !hasQualityLongSegment(lr)) continue;
    for (const d of [addDays(lr.date, -1), addDays(lr.date, 1)]) for (const n of all.filter((s) => s.date === d && s.is_run && !s.is_long_run))
      if (hasHardSegment(n)) v('QC-06', `hard session ${n.module_id} on ${d} next to the ${experienced ? 'quality ' : ''}long run of ${lr.date}`, { session: n.id });
  }
}

const REPEATED = (s: Session) => s.segments.some((g) => (g.effort === 'E3' || g.effort === 'E4') && g.duration_s != null);

function checkRendering(input: Input, plan: Plan, v: Emit, w_: Emit) {
  const pref = input.profile.prescription_preference ?? PV['ses.prescription_default'];
  for (const w of plan.weeks) for (const s of w.sessions) {
    if (!s.is_run || s.is_goal_race) continue;
    const rendered = s.segments.some((g) => g.show_distance_m != null || g.show_about_m != null || g.recovery?.show_distance_m != null);
    // RD-02: the time stays the controlling quantity
    for (const g of s.segments) if ((g.show_distance_m != null || g.show_about_m != null) && (g.duration_s == null || g.distance_m != null))
      v('RD-02', `${s.id}: a rendered segment must keep duration_s and carry no distance_m`, { session: s.id });
    if (g_both(s)) v('RD-01', `${s.id}: a segment carries both show_distance_m and show_about_m`, { session: s.id });
    if (!REPEATED(s)) { if (rendered && !s.is_long_run) w_('RD-03', `${s.id}: distance shown on a session without E3/E4 repeats`, { session: s.id }); continue; }
    const aa = activeAnchor(input, s.date);
    const paced = plan.pace_mode !== 'effort_only' && aa != null;
    const timeOnly = !paced || TIME_ONLY.includes(s.module_id) || pref === 'time';
    // RD-03
    if (timeOnly) {
      if (s.prescription_form != null && s.prescription_form !== 'time') v('RD-03', `${s.id} (${s.module_id}) form ${s.prescription_form}, expected time (${!paced ? 'no paces on ' + s.date : pref === 'time' ? 'preference time' : 'time-only module'})`, { session: s.id });
      if (s.segments.some((g) => g.show_distance_m != null)) v('RD-03', `${s.id}: show_distance_m on a time-only session`, { session: s.id });
      continue;
    }
    // QC-08
    if (s.prescription_form != null && s.prescription_form !== pref) v('QC-08', `${s.id} form ${s.prescription_form}, expected ${pref}`, { session: s.id });
    if (s.prescription_form == null) w_('QC-08', `${s.id}: prescription_form not reported`, { session: s.id });
    // RD-01 / RD-04, accepting both pace readings (OQ-27) and a 2 % slack for the midpoint reading (OQ-28)
    const readings: Reading[] = ['A', 'B'];
    const ranges = readings.map((r) => paceRanges(aa!.anchor as any, aa!.widen, r));
    for (const g of s.segments) {
      if (!(g.effort === 'E3' || g.effort === 'E4') || g.duration_s == null) continue;
      const speeds = ranges.map((r) => midSpeed(r[g.effort as 'E3' | 'E4']) * (s.module_id === 'SES-M-028' ? PV['ses.hill_speed_ratio'] : 1));
      const xs = speeds.flatMap((sp) => [0.98, 1, 1.02].map((f) => g.duration_s! * sp * f));
      const tol = PV['ses.dist_round_tol_pct'] / 100;
      const okNear = xs.map((x) => ({ x, n: nearestTrack(x) }));
      if (g.show_distance_m != null) {
        if (!okNear.some(({ n }) => n === g.show_distance_m)) v('RD-01', `${s.id}: ${g.duration_s} s at ${g.effort} shown as ${g.show_distance_m} m; nearest track distance of ${Math.round(xs[1])} m is ${nearestTrack(xs[1])}`, { session: s.id, observed: g.show_distance_m });
        if (!okNear.some(({ x }) => Math.abs(g.show_distance_m! - x) / x <= tol + 1e-9)) v('RD-01', `${s.id}: ${g.show_distance_m} m differs from ${Math.round(xs[1])} m by more than ${tol * 100} %`, { session: s.id });
      } else if (g.show_about_m != null) {
        if (g.show_about_m % 100 !== 0) v('RD-01', `${s.id}: about ${g.show_about_m} m not rounded to 100 m`, { session: s.id });
        if (okNear.every(({ x, n }) => Math.abs(n - x) / x <= tol)) v('RD-01', `${s.id}: time form kept although ${nearestTrack(xs[1])} m is within ${tol * 100} % of ${Math.round(xs[1])} m`, { session: s.id });
      } else v('QC-08', `${s.id}: ${g.effort} repeats without show_distance_m or show_about_m although paces are known`, { session: s.id });
      if (g.recovery?.show_distance_m != null && g.recovery.duration_s) {
        const want = ranges.map((r) => renderRecovery(g.recovery!.duration_s, midSpeed(r.E1)));
        const rd = g.recovery.show_distance_m;
        if (rd % PV['ses.dist_round_recovery_m'] !== 0 || rd < 100 || !want.some((x) => Math.abs(x - rd) <= 100))
          v('RD-04', `${s.id}: ${g.recovery.duration_s} s jog shown as ${rd} m, oracle ${want.join('/')} m`, { session: s.id });
      }
    }
  }
}
const g_both = (s: Session) => s.segments.some((g) => g.show_distance_m != null && g.show_about_m != null);

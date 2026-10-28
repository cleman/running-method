// Plain-language text for engine results, from spec/messages.md (parsed at build time into the catalogue).
// Display rounding follows messages.md §0. Pure functions: the catalogue is passed in.
import { fmtDate } from './dates.js';

export const EFFORT_WORD = { E0: 'walk', E1: 'easy', E2: 'steady', E3: 'hard', E4: 'very hard', E5: 'fast strides' };
export const EFFORT_HINT = {
  E0: 'Walking.', E1: 'Easy: full sentences.', E2: 'Steady: short phrases.', E3: 'Hard: a few words.',
  E4: 'Very hard: you cannot talk.', E5: 'Short, fast and relaxed.',
};
export const PHASE_WORD = {
  START_LADDER: 'Beginner steps', RTR: 'Return steps', ONBOARD: 'Getting started', BASE: 'Base', BUILD: 'Build',
  SPECIFIC: 'Race-specific', SHARPEN: 'Sharpen', TAPER: 'Taper', RACE: 'Race', TRANSITION: 'Recovery', MAINTAIN: 'Keep fit',
};
export const DIST_WORD = { '5K': '5K', '10K': '10K', HM: 'half marathon', M: 'marathon', '50K': '50K', '100K': '100K', none: 'no race' };
export const OPTION_TITLE = {
  change_availability: 'Change your availability', 'change_availability+move_date': 'Add a day and move the date',
  move_date: 'Move the race date', lower_goal: 'Change the target', shorter_distance: 'Run a shorter race',
  base_plan: 'Build your running first', alternative_preset: 'Alternative approach',
};

// ---------- display rounding (messages.md §0)
/** Durations: ≤ 60 min to 5 min, above to 10 min rounded down, hours shown above 90 min. */
export function fmtDur(s, { about = true } = {}) {
  if (s == null) return '';
  const min = s / 60;
  let r;
  if (min <= 60) r = Math.max(5, Math.round(min / 5) * 5);
  else r = Math.floor(min / 10) * 10;
  const pre = about && Math.abs(r - min) > 0.01 ? 'about ' : '';
  if (r > 90) return `${pre}${Math.floor(r / 60)} h ${String(r % 60).padStart(2, '0')}`;
  return `${pre}${r} min`;
}
/** Short segment durations: exact (seconds below a minute). */
export function fmtShort(s) {
  if (s < 60) return `${s} s`;
  if (s % 60 === 0) return `${s / 60} min`;
  return `${Math.floor(s / 60)} min ${s % 60} s`;
}
export function fmtKm(m) {
  if (m == null) return '';
  const km = m / 1000;
  const r = km >= 20 ? Math.floor(km) : Math.floor(km * 2) / 2;
  return `${r % 1 ? r.toFixed(1) : r} km`;
}
/** Race and test times: to 60 s (15 s for races ≤ 30 min), rounded up (slower). */
export function fmtRaceTime(s) {
  if (s == null) return '';
  const step = s <= 1800 ? 15 : 60;
  const t = Math.ceil(s / step) * step;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), x = t % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
}
export function fmtPace(sPerKm) {
  const t = Math.round(sPerKm / 5) * 5;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function fmtValue(type, v, ref) {
  if (v == null || v === '') return null;
  switch (type) {
    case 'min': return fmtDur(v);
    case 'km': return fmtKm(v);
    case 'time': return fmtRaceTime(v);
    case 'pace': return `${fmtPace(v)} /km`;
    case 'date': return fmtDate(v, ref);
    case 'int': return String(Math.round(v));
    default: return String(v);
  }
}

/**
 * Fills a messages.md template. Placeholder values come from the engine (`ph`, {name: {type, value}}) and, where the
 * engine gives none, from `extra` ({name: value}). Optional clauses "{ … {x:type} …}" are dropped when x is missing.
 * Returns null when a required placeholder has no value, so the caller can fall back to the "why" sentence.
 */
export function fill(template, ph = {}, extra = {}, ref) {
  const val = (name, type) => {
    const p = ph?.[name];
    if (p && p.value != null) return fmtValue(p.type ?? type, p.value, ref);
    if (extra[name] != null) return fmtValue(type, extra[name], ref);
    return null;
  };
  let missing = false;
  let out = template.replace(/\{([^{}]*\{[a-z_]+:[a-z]+\}[^{}]*)\}/g, (_, inner) => {
    let miss = false;
    const s = inner.replace(/\{([a-z_]+):([a-z]+)\}/g, (__, n, t) => { const v = val(n, t); if (v == null) miss = true; return v ?? ''; });
    return miss ? '' : s;
  });
  out = out.replace(/\{([a-z_]+):([a-z]+)\}/g, (_, n, t) => { const v = val(n, t); if (v == null) missing = true; return v ?? ''; });
  return missing ? null : out;
}

/** A message instance {id, placeholders} → { text, why } in plain words, or null if unknown. */
export function message(cat, inst, extra = {}, ref) {
  const m = cat.msgs[inst.id];
  if (!m) return null;
  const text = fill(m.text, inst.placeholders, extra, ref);
  return { id: inst.id, layer: m.layer, text: text ?? m.why ?? '', why: text ? m.why : '', partial: text == null };
}

export function reason(cat, code, extra = {}, ref) {
  const r = cat.reasons[code];
  if (!r) return { code, text: code, why: '' };
  const text = fill(r.text, {}, extra, ref);
  return { code, text: text ?? r.why, why: text ? r.why : '' };
}

/** Headline of a verdict (messages.md §1). */
export function headline(cat, verdict, kind) {
  if (verdict === 'feasible') return cat.headlines.feasible;
  if (verdict === 'infeasible') return cat.headlines.infeasible;
  if (verdict === 'stretch') return cat.headlines[kind] ?? cat.headlines.tight;
  return '';
}

/** Placeholder values the engine leaves out but the result and the answers already hold. */
export function reasonExtras(result, input) {
  const f = result.feasibility ?? {};
  const b = f.predicted_band ?? {};
  const ex = {
    slack: f.slack, have: f.weeks_available, weeks: f.weeks_available != null && f.slack != null ? f.weeks_available - f.slack : null,
    target: input?.goal?.target_time_s, fast_edge: b.fast_edge_s, slow_edge: b.slow_edge_s, point: b.point_s,
    runs: input?.profile?.max_runs_per_week, sport: input?.profile?.other_sport_background,
  };
  if (f.reasons?.includes('CURRENT_STATE_SHORT')) ex.weeks = f.weeks_available;
  const opt = (f.options ?? []).find(o => o.availability_change);
  if (opt?.availability_change?.add_day) ex.day = opt.availability_change.add_day;
  if (opt?.availability_change?.extra_minutes_per_week) ex.extra = opt.availability_change.extra_minutes_per_week * 60;
  if (b.target_where) ex.where = { inside: 'inside this range', faster: 'faster than this range', slower: 'slower than this range' }[b.target_where] ?? b.target_where;
  return ex;
}

/** Card text of a fail-closed option (messages.md §5). */
export function optionText(cat, o, originalReasons, ref) {
  const g = o.new_goal ?? {};
  const why = (originalReasons ?? []).includes('LEVELS_UNREACHABLE') ? 'time to build the abilities this goal needs' : 'time to build up safely';
  const ex = {
    date: g.race_date, day: o.availability_change?.add_day, extra: o.availability_change?.extra_minutes_per_week ? o.availability_change.extra_minutes_per_week * 60 : null,
    target: g.target_time_s, distance: DIST_WORD[g.distance] ?? g.distance, reason: why,
  };
  if (o.kind === 'lower_goal' && g.goal_type === 'finish') return 'Aim just to finish instead.';
  if (o.kind === 'change_availability' && ex.extra == null && ex.day) return `Add a run on ${ex.day} and this goal fits. Change your availability?`;
  if (o.kind === 'change_availability' && ex.day == null && ex.extra != null) return `Add ${fmtDur(ex.extra)} a week and this goal fits. Change your availability?`;
  const t = cat.options[o.kind];
  return (t && fill(t, {}, ex, ref)) ?? OPTION_TITLE[o.kind] ?? o.kind;
}

/** One line per segment: "3 × 5 min hard, 2 min easy between". */
export function segmentLines(session) {
  return (session.segments ?? []).map(sg => {
    const amount = sg.duration_s != null ? fmtShort(sg.duration_s) : sg.distance_m != null ? fmtKm(sg.distance_m) : '';
    const reps = sg.repeats > 1 ? `${sg.repeats} × ` : '';
    const rec = sg.recovery ? `, ${fmtShort(sg.recovery.duration_s)} ${EFFORT_WORD[sg.recovery.effort]} between` : '';
    const role = { warmup: 'warm-up: ', cooldown: 'cool-down: ', strides: 'then ', walk: '' }[sg.role] ?? '';
    return { effort: sg.effort, text: `${role}${reps}${amount} ${EFFORT_WORD[sg.effort] ?? sg.effort}${rec}` };
  });
}

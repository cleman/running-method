// Usage (from oracle/, after npm install): npx vite-node ../docs/scripts/persona-plans.ts <fixture_id> "<title>" <output-name>
// Replays a persona with the oracle harness (the runner logs every session as planned) and writes the plan in plain words.
import { writeFileSync } from 'node:fs';
import { allFixtures } from '../../oracle/src/fixtures.ts';
import { replay } from '../../oracle/src/harness.ts';
import { generate } from '../../engine/node-entry.ts';
import { MODULES } from '../../engine/src/pipeline/modules.ts';

const [id, title, outName] = process.argv.slice(2);
const f: any = allFixtures().find(x => x.fixture_id === id)!;
const EFF: Record<string, string> = { E0: 'walk', E1: 'easy (you can chat)', E2: 'steady (short sentences)', E3: 'comfortably hard (a few words)', E4: 'hard (a word or two)', E5: 'fast strides' };
const DAY: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const PHASE: Record<string, string> = { START_LADDER: 'Start ladder (walk–run steps)', RTR: 'Return to running', ONBOARD: 'Getting started', BASE: 'Base building', BUILD: 'Build', SPECIFIC: 'Race-specific', SHARPEN: 'Sharpen', TAPER: 'Taper (lighter before the race)', MAINTAIN: 'Maintain', TRANSITION: 'Recovery' };
const REASON: Record<string, string> = {
  LOW_SLACK: 'little spare time before the race: missed weeks cannot be made up', DEGRADED_COMPLETION: 'the race is kept as a finish goal (no time target)',
  LEVELS_UNREACHABLE: 'the abilities the goal needs cannot be built in the weeks left', PHASES_DO_NOT_FIT: 'the training phases do not fit before the race date',
  CURRENT_STATE_SHORT: 'your current running is too short for this race this soon', AVAILABILITY_TIME: 'your available time is too short for this goal',
  TARGET_IN_FAST_BAND: 'the target time is at the fast edge of what your results predict', ULTRA_LOW_CONFIDENCE: 'for ultras only a wide finish-time range can be given',
  LONG_RUN_UNREACHABLE_PRESET: 'at your current easy pace, even the shortest long run accepted for this race would take too long; very long single runs have no tested safety',
  TARGET_OUTSIDE_BAND: 'the target is faster than your current fitness suggests', TARGET_BEYOND_CURRENT: 'the target is faster than your current fitness suggests; progress is checked with tests',
  ANCHOR_UNKNOWN: 'no recent race or test yet, so the first weeks are by feel and end with a short test', LONG_RUN_TIME_CAPPED: 'the longest run is capped in time, shorter than this race usually asks',
  AVAILABILITY_DAYS: 'the goal needs one more running day a week', LOW_VOLUME_PREDICTION: 'the predicted time range is wide at your current weekly running', RACE_TOO_SOON: 'too soon after your last race',
};
const mmss = (s: number) => { const m = Math.floor(s / 60), r = Math.round(s % 60); return r ? `${m} min ${r} s` : `${m} min`; };
const hm = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`; };
const fmtDate = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function describe(s: any): string {
  const m = MODULES[s.module_id]?.name ?? s.module_id;
  if (s.is_goal_race) return `**Race day** — ${f.input.goal.distance}${f.input.goal.goal_type === 'time' && f.input.goal.target_time_s ? `, aiming for ${hm(f.input.goal.target_time_s)}` : ''}${s.run_walk ? `, as run-walk (${s.run_walk_ratio?.label})` : ''}`;
  const work = s.segments.filter((g: any) => g.role === 'work');
  const strides = s.segments.find((g: any) => g.effort === 'E5');
  let txt = `${m}, ${mmss(s.planned_duration_s)}`;
  if (s.is_long_run) txt = `Long run, ${mmss(s.planned_duration_s)} easy`;
  if (work.length) txt += ': ' + work.map((g: any) => g.repeats > 1 ? `${g.repeats} × ${mmss(g.duration_s)} ${EFF[g.effort]}${g.recovery ? ` with ${mmss(g.recovery.duration_s)} easy jog between` : ''}` : `${g.duration_s ? mmss(g.duration_s) : (g.distance_m / 1000) + ' km'} ${EFF[g.effort]}`).join(', ') + (s.segments.some((g: any) => g.role === 'warmup') ? ' (warm-up and cool-down included)' : '');
  else if (!s.is_long_run) txt += ' easy';
  if (strides) txt += `, with ${strides.repeats} short strides near the end`;
  if (s.ladder && s.ladder.kind !== 'none') {
    // the walk–run pattern, with repeated run/walk pairs collapsed: "walk 5 min, then 8 × (run 1 min, walk 1 min 30 s)"
    const parts: string[] = []; const segs = s.segments; let i = 0;
    if (segs[0]?.effort === 'E0') { parts.push(`brisk walk ${mmss(segs[0].duration_s)}`); i = 1; }
    while (i < segs.length) {
      const a = segs[i], b = segs[i + 1];
      if (a.effort !== 'E0' && b?.effort === 'E0') {
        let n = 1; while (segs[i + 2 * n]?.duration_s === a.duration_s && segs[i + 2 * n]?.effort === a.effort && segs[i + 2 * n + 1]?.duration_s === b.duration_s && segs[i + 2 * n + 1]?.effort === 'E0') n++;
        parts.push(n > 1 ? `${n} × (run ${mmss(a.duration_s)}, walk ${mmss(b.duration_s)})` : `run ${mmss(a.duration_s)}, walk ${mmss(b.duration_s)}`); i += 2 * n;
      } else { parts.push(`${a.effort === 'E0' ? 'walk' : 'run'} ${mmss(a.duration_s)}`); i++; }
    }
    txt = `Walk–run (step ${s.ladder.rung}), ${mmss(s.planned_duration_s)}: ${parts.join(', then ')}; running at an easy, chatty effort`;
  } else if (s.run_walk && s.run_walk_ratio) txt += ` — as run-walk ${s.run_walk_ratio.label ?? `${s.run_walk_ratio.run_s / 60}:${s.run_walk_ratio.walk_s / 60}`} (run:walk minutes)`;
  if (s.is_test && s.test_for) txt += ` — **level test** (${s.test_for.node} level ${s.test_for.level}): afterwards the app asks if you finished every part and held the effort`;
  if (s.fuel_target_g_h) txt += ` — practise fuelling: about ${s.fuel_target_g_h} g of carbohydrate per hour`;
  if (s.pace_range) txt += ` (pace guide ${Math.floor(s.pace_range.fast_s_per_km / 60)}:${String(Math.round(s.pace_range.fast_s_per_km % 60)).padStart(2, '0')}–${Math.floor(s.pace_range.slow_s_per_km / 60)}:${String(Math.round(s.pace_range.slow_s_per_km % 60)).padStart(2, '0')} per km)`;
  return txt;
}

const { calls } = await replay(f, (i: any) => generate(i) as any, { maxWeeks: 60 });
const g = f.input.goal;
const L: string[] = [];
L.push(`# ${title}`, '');
L.push(`*Generated by the engine on the fixture \`${id}\`, replayed week by week with the oracle's "as planned" model: every Monday the app re-plans, and the runner then does and logs every session exactly as planned (target effort, no pain). Real runners will differ. This is a test output, not advice, and not validated on real runners.*`, '');
L.push(`**Goal:** ${g.goal_type === 'time' ? `${g.distance} in ${hm(g.target_time_s)}` : g.goal_type === 'finish' ? `finish a ${g.distance}` : g.goal_type}${g.race_date ? ` on ${fmtDate(g.race_date)} ${g.race_date.slice(0, 4)}` : ''}. **Days available:** ${(f.input.profile.available_days ?? []).map((d: string) => DAY[d]).join(', ')}.`, '');
const r0: any = calls[0]?.result;
const verdictWords = (r: any) => { const v = r.feasibility?.verdict; const rs = (r.feasibility?.reasons ?? []).map((x: string) => REASON[x] ?? x); return `${v === 'feasible' ? 'realistic' : v === 'stretch' ? 'possible but tight' : v === 'infeasible' ? 'not possible as asked' : v ?? '—'}${rs.length ? ` (${rs.join('; ')})` : ''}`; };
if (r0) {
  L.push(`**First answer (day 0):** ${verdictWords(r0)}.`);
  const d = r0.feasibility?.demand;
  if (d) L.push(`The plan needs a longest run of about ${hm(d.L_req_time_s)} and about ${hm(d.V_req_time_s)} of running a week before the taper.`);
  if (r0.feasibility?.predicted_band?.point_s) L.push(`Predicted race time today: about ${hm(r0.feasibility.predicted_band.point_s)}.`);
  L.push('');
}
for (const c of calls as any[]) {
  const r = c.result, w = c.published;
  L.push(`## Week ${c.week} — from ${fmtDate(c.today)}${w ? `: ${PHASE[w.phase] ?? w.phase}${w.is_deload ? ', lighter week' : ''}` : ''}`, '');
  if (!w) {
    L.push(`**No new week was published.** The app's answer this Monday: ${r.kind === 'fail_closed' ? 'the plan could not be continued safely as asked, so it was stopped' : r.kind === 'gate_stop' ? 'running is paused until the health questions are cleared' : r.kind}.`);
    const opts = r.feasibility?.options ?? [];
    if (!opts.length) L.push('', 'No alternative plan could be built either, so no choice was offered.');
    if (opts.length) { L.push('', 'Choices offered:'); for (const o of opts) L.push(`- ${String(o.kind).replace(/_/g, ' ').replace('+', ' and ')}${o.new_race_date ? ` (new date ${fmtDate(o.new_race_date)})` : ''}${o.new_target_time_s ? ` (new target ${hm(o.new_target_time_s)})` : ''}`); }
    if (r.feasibility?.reasons?.length) L.push('', `Why: ${verdictWords(r)}.`);
    L.push('');
    break;
  }
  L.push(`Total running about **${hm(w.planned_time_s)}**${w.lr_s ? `, longest run ${mmss(w.lr_s)}` : ''}. Outlook: ${verdictWords(r)}.`, '');
  for (const s of w.sessions) L.push(`- ${DAY[s.weekday] ?? s.weekday}: ${describe(s)}`);
  const restDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter(d => !w.sessions.some((s: any) => s.weekday === d));
  L.push(`- Rest: ${restDays.map(d => DAY[d]).join(', ') || 'none'}`, '');
}
writeFileSync(`${new URL('../persona-plans/', import.meta.url).pathname}${outName}.md`, L.join('\n') + '\n');
console.log(outName, calls.length, 'weeks', (calls.at(-1) as any).result.kind);

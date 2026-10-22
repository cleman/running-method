// Start ladder (10 §4b, SAF-086) and return-to-run ladder (10 §4, GEN-012) sessions.
import type { Segment } from '../model/types.ts';

export interface LadderSession { rung: string; segments: Segment[]; total_s: number; run_s: number }

const walk = (s: number): Segment => ({ effort: 'E0', role: 'walk', duration_s: s, repeats: 1 });
const run = (s: number): Segment => ({ effort: 'E1', role: 'main', duration_s: s, repeats: 1 });
const alt = (r: number, w: number, n: number, tailWalk = w): Segment[] => {
  const out: Segment[] = [];
  for (let i = 0; i < n; i++) { out.push(run(r)); out.push(walk(i === n - 1 ? tailWalk : w)); }
  return out.filter(s => (s.duration_s ?? 0) > 0);
};
const mk = (rung: string, segs: Segment[]): LadderSession => {
  const all = [walk(300), ...segs];
  return { rung, segments: all, total_s: all.reduce((s, x) => s + (x.duration_s ?? 0) * x.repeats, 0), run_s: all.filter(x => x.role === 'main').reduce((s, x) => s + (x.duration_s ?? 0), 0) };
};

/**
 * SPEC-QUESTION Q-E11: rtr.start_ladder gives only the running minutes per session; the walk breaks and the time on feet
 * are taken from the session patterns of 13 §5 (5-min brisk walk first). Three sessions per rung (rtr.sessions_per_rung).
 */
export function startLadderSessions(): LadderSession[] {
  const rungs: LadderSession[][] = [
    [mk('S1', alt(60, 90, 8, 90))],
    [mk('S2', [...alt(90, 120, 5), run(90), walk(60)])],
    [mk('S3', [run(90), walk(90), run(180), walk(180), run(90), walk(90), run(180), walk(180)])],
    [mk('S4', [run(180), walk(90), run(300), walk(150), run(180), walk(90), run(300)])],
    [mk('S5', [run(300), walk(180), run(300), walk(180), run(300)]), mk('S5', [run(480), walk(300), run(480)]), mk('S5', [run(1200)])],
    [mk('S6', [run(300), walk(180), run(480), walk(180), run(300)]), mk('S6', [run(600), walk(180), run(600)]), mk('S6', [run(1500)])],
    [mk('S7', [run(1500)])], [mk('S8', [run(1680)])], [mk('S9', [run(1800)])],
  ];
  const out: LadderSession[] = [];
  for (const r of rungs) for (let i = 0; i < 3; i++) out.push(r.length === 3 ? r[i] : r[0]);
  return out;
}

/**
 * Return-to-run ladder (10 §4, SAF-081): rungs R0…R5 with rtr.session_min, three clean sessions per rung, run-walk at E1.
 * SPEC-QUESTION Q-E12: the run/walk split of each R rung is in 10 §4 prose only; the engine renders each session as
 * continuous time on feet at E1 with run-walk allowed, and caps it by the spike rule (INV-02 binds RTR sessions).
 */
export function rtrSessions(entryRung: number, sessionMin: Record<string, number>): LadderSession[] {
  const out: LadderSession[] = [];
  for (let r = entryRung; r <= 5; r++) {
    const s = (sessionMin[String(r)] ?? 30) * 60;
    for (let i = 0; i < 3; i++) out.push({ rung: 'R' + r, segments: [{ effort: 'E1', role: 'main', duration_s: s, repeats: 1 }], total_s: s, run_s: s });
  }
  return out;
}

/** Ladder days of a week: available weekdays (Mon = 0) taken in order with one rest day between (rtr.rest_days_between). */
export function spacedDays(days: number[]): number[] {
  const out: number[] = [];
  for (const d of [...days].sort((a, b) => a - b)) if (!out.length || d - out[out.length - 1] >= 2) out.push(d);
  return out;
}

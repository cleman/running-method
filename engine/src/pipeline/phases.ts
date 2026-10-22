// S4 Phases (04 §3) and deload placement (04 §4: PHS-001…006). Native; the deload reading is the one of 13 §0 and the PHS-004 record.
import type { PhaseType } from '../model/types.ts';

export interface PhaseInputs {
  W: number; T: number; ladderWeeks: number; ladderKind: 'START_LADDER' | 'RTR' | null; onboard: number; baseNeeded: number;
  specificMin: number; specificTarget: number; buildMin: number; buildMax: number; shortFinish: boolean; rolling?: boolean;
}
export interface PhaseLayout { phases: PhaseType[]; B: number; U: number; S: number; fits: boolean }

/** 04 §3 steps 0–7; index 0 = plan week 1. */
export function allocatePhases(x: PhaseInputs): PhaseLayout {
  const { W, T } = x;
  if (x.rolling) {
    // H0 (04 §2): a rolling BASE block of 4 weeks after any ladder; ONBOARD weeks first when needed
    const rest = W - x.ladderWeeks;
    const on = Math.max(0, Math.min(rest, x.onboard - x.ladderWeeks));
    const ph: PhaseType[] = [...Array(x.ladderWeeks).fill(x.ladderKind ?? 'RTR'), ...Array(on).fill('ONBOARD'), ...Array(rest - on).fill('BASE')];
    return { phases: ph, B: rest, U: 0, S: 0, fits: rest >= 0 };
  }
  if (W <= 4) {
    // PHS-010: SHARPEN + compressed taper (H1)
    const ph: PhaseType[] = [...Array(Math.max(0, W - T)).fill('SHARPEN'), ...Array(Math.min(T, W)).fill('TAPER')];
    return { phases: ph, B: 0, U: 0, S: 0, fits: true };
  }
  const rtr = x.ladderWeeks;
  const R = W - T - rtr;
  const buildMin = x.shortFinish ? 0 : x.buildMin;
  const specMin = x.shortFinish ? 0 : x.specificMin;
  let S = x.shortFinish ? 0 : Math.min(x.specificTarget, Math.max(specMin, R - x.baseNeeded - buildMin));
  let B = Math.max(x.baseNeeded, x.onboard - rtr);
  let U = R - B - S;
  if (U > x.buildMax) { B += U - x.buildMax; U = x.buildMax; }
  if (x.shortFinish) { B += U; U = 0; }
  // H2 (5–8 weeks): BUILD and SPECIFIC merged into one SPECIFIC block (04 §2)
  if (W <= 8 && !x.shortFinish) { S += U; U = 0; }
  const fits = R >= 0 && U >= 0 && B >= 0 && S >= 0;
  if (!fits) return { phases: [], B, U, S, fits };
  const onboard = Math.max(0, Math.min(B, x.onboard - rtr));
  const phases: PhaseType[] = [
    ...Array(rtr).fill(x.ladderKind ?? 'RTR'),
    ...Array(onboard).fill('ONBOARD'), ...Array(B - onboard).fill('BASE'),
    ...Array(U).fill('BUILD'), ...Array(S).fill('SPECIFIC'), ...Array(T).fill('TAPER'),
  ];
  return { phases, B, U, S, fits };
}

/** Index of the last week of the contiguous phase block that holds week i (0-based). */
function blockEnd(ph: PhaseType[], i: number): number {
  let e = i;
  while (e + 1 < ph.length && ph[e + 1] === ph[i]) e++;
  return e;
}

export interface DeloadInputs { phases: PhaseType[]; every: number; minPlanWeeks: number; minGap: number; exclusionBeforeTaper: number; W: number; counterStart: number }

/**
 * PHS-001 (cadence from plan start or ladder exit), PHS-002 (none in or just before the taper), PHS-003 (short plans),
 * PHS-004 (≤ 1 week to a phase boundary → last week of the phase), PHS-006 (spacing). Returns 0-based week indices.
 * The phase list may extend past W (dry run); the taper exclusion then uses the first TAPER week, if any.
 */
export function placeDeloads(x: DeloadInputs): number[] {
  const ph = x.phases;
  if (x.W < x.minPlanWeeks) return [];                                   // PHS-003
  if (ph.some(p => p === 'SHARPEN')) return [];                           // H1: no deload (04 §2)
  const taperStart = ph.indexOf('TAPER');
  const out: number[] = [];
  let last = x.counterStart - 1;                                          // last recovery-like week (0-based), −1 = none
  let w = x.counterStart + x.every - 1;
  while (w < ph.length) {
    const p = ph[w];
    if (p === 'TAPER' || p === 'RACE' || p === 'TRANSITION') break;
    if (taperStart >= 0 && taperStart - w < x.exclusionBeforeTaper) break; // PHS-002
    if (p === 'START_LADDER' || p === 'RTR') { w++; continue; }
    const end = blockEnd(ph, w);
    let pos = end - w <= 1 ? end : w;                                     // PHS-004
    if (taperStart >= 0 && taperStart - pos < x.exclusionBeforeTaper) pos = w;
    if (pos - last - 1 < x.minGap) {                                      // PHS-006
      if (w - last - 1 >= x.minGap) pos = w; else { w = last + x.every + 1; continue; }
    }
    out.push(pos);
    last = pos;
    w = pos + x.every;
  }
  return out;
}

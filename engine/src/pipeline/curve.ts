// S6 Weeks: weekly volume V(w) and long run LR(w) (05 §2–§7: LOD-003/004/005/007/008/010/011/020/040/050/052/056; GEN-013).
// Future weeks are projected "as if logged as planned" (07 §2b projection, 13 §0): planned long runs enter the L30 window,
// the slow profile ends after the probation weeks and the baseline is confirmed after prog.est.confirm_weeks projected weeks.
import type { PhaseType } from '../model/types.ts';
import { roundDown } from '../context.ts';

export interface CurveInputs {
  phases: PhaseType[];
  deloads: Set<number>;
  /** day offset of week w's long run from plan start: 7w + lrOffset */
  lrOffset: number;
  /** days from today to plan start (0 when today is the plan's Monday) */
  startOffset: number;
  V_hold: number; L_hold: number; L_target: number; V_peak: number; avail: number;
  /** L30_eff at plan time and the day offsets (relative to today, ≤ 0) of the runs that carry it */
  l30Sources: { day: number; s: number }[];
  /** after a GEN-013 gap, plan-time sources count only for days before this offset (first week back) */
  sourcesUntil?: number;
  slowWeeks: (w: number) => boolean;
  confirmedFrom: number;               // first week index (0-based) with a confirmed baseline (LOD-008)
  preWeeks: number[];                  // logged weekly totals of the prog.est.window_weeks weeks before the plan (oldest first)
  lrCap: (V: number) => number;        // LOD-020
  prog: { slow: [number, number]; standard: [number, number]; est: number; window: number };
  deloadCut: number; taperCut: number; taperProfile: number[];
  /** taper week number of the plan's first TAPER week (re-plans inside the taper) and the taper length */
  taperK0?: number; taperT?: number;
  ladder: { V: number; LR: number; sessions: number[] }[];   // fixed ladder weeks at the front
  gap?: { vol: number; long: number; V7: number; L30: number } | null;    // GEN-013 first-week factors on the pre-gap values
  step: number;                        // load.round_down_s
  /** re-plans: completed weeks before plan start (oldest first), as logged; seed the LOD-003/004 baselines and the taper reference */
  history?: { V: number; LR: number; deload: boolean }[];
  /** baseline for weeks before the plan and its history (LOD-003 fallback): the starting V28 */
  V_base0?: number;
}

export interface CurveWeek {
  V: number; LR: number; profile: 'slow' | 'standard' | null; is_deload: boolean; taper_k: number | null; is_race_week: boolean;
  capsHit: string[]; l30: number;
}

export function buildCurve(x: CurveInputs): CurveWeek[] {
  const out: CurveWeek[] = [];
  const rd = (v: number) => roundDown(v, x.step);
  const runs: { day: number; s: number; pre?: boolean }[] = x.l30Sources.map(r => ({ ...r, pre: true }));
  // values of the non-deload weeks so far (completed weeks first, then plan weeks): LOD-003 baselines, deload base, taper ref
  const nd: { V: number; LR: number; w: number }[] = (x.history ?? []).filter(h => !h.deload).map((h, i, a) => ({ V: h.V, LR: h.LR, w: i - a.length }));
  const T = x.phases.filter(p => p === 'TAPER').length;
  const taperStart = x.phases.indexOf('TAPER');
  const l30At = (day: number) => Math.max(0, ...runs.filter(r => day - r.day >= 1 && day - r.day <= 30 && !(r.pre && x.sourcesUntil !== undefined && day >= x.sourcesUntil)).map(r => r.s));

  for (let w = 0; w < x.phases.length; w++) {
    const ph = x.phases[w];
    const lrDay = x.startOffset + 7 * w + x.lrOffset;
    const capsHit: string[] = [];
    if (ph === 'START_LADDER' || ph === 'RTR') {
      const L = x.ladder[w];
      const wk: CurveWeek = { V: L.V, LR: L.LR, profile: null, is_deload: false, taper_k: null, is_race_week: false, capsHit, l30: l30At(lrDay) };
      L.sessions.forEach((s, i) => runs.push({ day: x.startOffset + 7 * w + i * 2, s }));
      out.push(wk); nd.push({ V: wk.V, LR: wk.LR, w }); continue;
    }
    const l30 = l30At(lrDay);
    if (ph === 'TAPER') {
      const k = w - taperStart + (x.taperK0 ?? 1);
      const ref = nd.filter(e => e.w < taperStart).at(-1);
      const Vref = ref ? ref.V : x.V_hold, LRref = ref ? ref.LR : x.L_hold;
      const cut = x.taperCut * (x.taperProfile[k - 1] ?? 1);
      let V = rd(Vref * (1 - cut));
      let LR = k === (x.taperT ?? T) ? 0 : rd(LRref * (1 - cut));
      if (w > 0 && out[w - 1].taper_k) { V = Math.min(V, out[w - 1].V); LR = Math.min(LR, out[w - 1].LR); } // LOD-052
      LR = Math.min(LR, rd(1.1 * l30) || LR);
      out.push({ V, LR, profile: null, is_deload: false, taper_k: k, is_race_week: k === (x.taperT ?? T), capsHit: ['LOD-050'], l30 });
      if (LR) runs.push({ day: lrDay, s: LR });
      continue;
    }
    if (ph === 'SHARPEN') {
      // LOD-056: V ≤ V28, LR ≤ L30_eff, no step-ups
      const V = Math.min(rd(x.V_hold), rd(x.avail));
      const LR = Math.min(x.L_hold, rd(1.1 * l30) || x.L_hold);
      out.push({ V, LR, profile: x.slowWeeks(w) ? 'slow' : 'standard', is_deload: false, taper_k: null, is_race_week: false, capsHit: ['LOD-056'], l30 });
      runs.push({ day: lrDay, s: LR });
      nd.push({ V, LR, w });
      continue;
    }
    const lastND = nd.at(-1), prevND = nd.at(-2);
    if (x.deloads.has(w)) {
      const bV = lastND ? lastND.V : x.V_hold, bL = lastND ? lastND.LR : x.L_hold;
      const V = rd((1 - x.deloadCut) * bV);
      const LR = Math.min(rd((1 - x.deloadCut) * bL), rd(1.1 * l30));
      out.push({ V, LR, profile: x.slowWeeks(w) ? 'slow' : 'standard', is_deload: true, taper_k: null, is_race_week: false, capsHit: ['LOD-040'], l30 });
      runs.push({ day: lrDay, s: LR });
      continue;
    }
    // loading week
    const slow = x.slowWeeks(w);
    const [wk, w2] = slow ? x.prog.slow : x.prog.standard;
    const base = lastND ? lastND.V : (x.V_base0 ?? x.V_hold);
    const two = prevND ? prevND.V : (x.V_base0 ?? x.V_hold);
    let cap = Math.min((1 + wk) * base, (1 + w2) * two);                                   // LOD-003
    if (w < x.confirmedFrom) {                                                              // LOD-007 (T2)
      const recent = [...x.preWeeks, ...out.map(o => o.V)].slice(-x.prog.window);
      const est = recent.length ? Math.max(...recent) : x.V_hold;
      if ((1 + x.prog.est) * est < cap) capsHit.push('LOD-007');
      cap = Math.min(cap, (1 + x.prog.est) * est);
    }
    if (w === 0 && x.gap) { cap = Math.min(cap, x.gap.vol * x.gap.V7); capsHit.push('GEN-013'); }
    let V = Math.min(rd(cap), x.V_peak, rd(x.avail));
    // LOD-005 baseline hold: never below V_hold unless a T0–T3 limit (LOD-007, GEN-013, availability) requires it
    const t0t3 = Math.min(rd(x.avail), w < x.confirmedFrom ? rd(cap) : Infinity, w === 0 && x.gap ? rd(cap) : Infinity);
    V = Math.max(V, Math.min(rd(x.V_hold), t0t3));
    let LR = Math.min(rd(1.1 * l30), x.L_target, Math.max(rd(x.lrCap(V)), x.L_hold));     // 05 §3, LOD-010/020/005
    if (w === 0 && x.gap) LR = Math.min(LR, rd(x.gap.long * x.gap.L30));
    out.push({ V, LR, profile: slow ? 'slow' : 'standard', is_deload: false, taper_k: null, is_race_week: false, capsHit, l30 });
    runs.push({ day: lrDay, s: LR });
    nd.push({ V, LR, w });
  }
  return out;
}

/** 03 §4: the first week (1-based) whose loading values reach the growth targets within the rounding tolerance; Infinity if never. */
export function growthWeek(curve: CurveWeek[], L_target: number, V_target: number, tol: number): number {
  for (let i = 0; i < curve.length; i++) {
    const c = curve[i];
    if (c.is_deload || c.taper_k) continue;
    if (c.LR >= L_target - tol && c.V >= V_target - tol) return i + 1;
  }
  return Infinity;
}

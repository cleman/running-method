// Expected result kind (12 §3.12) of the day-0 call of each persona, from 13 §1/§7 and 14 §5/§10e.
// TST-130: "every persona of spec/fixtures-input produces a result of the kind the oracle expects".
// Personas whose 14 summary does not decide the kind ("feasible or stretch", "likely options") are listed
// with kind 'plan|fail_closed' and are only checked for a valid, invariant-clean result.
import type { Status } from './hand-values.js';

export interface KindExp { kind: string; verdict?: string; gate?: string; source: string; status: Status; oq?: string }

export const KINDS: Record<string, KindExp> = {
  'p1-maya': { kind: 'plan', verdict: 'stretch', source: '13 §1', status: 'firm' },
  'p1-maya-wk7-unlogged': { kind: 'plan', verdict: 'stretch', source: '13 §1', status: 'firm' },
  'p1-maya-wk7-backfill': { kind: 'plan', verdict: 'stretch', source: '13 §1', status: 'firm' },
  'p2-tom': { kind: 'plan', verdict: 'stretch', source: '13 §1', status: 'firm' },
  'p3-ana': { kind: 'plan', verdict: 'feasible', source: '13 §1, §3', status: 'firm' },
  'p3-ana-wk13-ext-missed': { kind: 'plan', verdict: 'feasible', source: '13 §3', status: 'firm' },
  'p4-masters-58': { kind: 'plan', verdict: 'feasible', source: '13 §1', status: 'firm' },
  'p5-ultra-100k': { kind: 'plan', verdict: 'feasible', source: '13 §1, §4', status: 'firm' },
  'lea-goal-switch': { kind: 'plan', verdict: 'stretch', source: '13 §7a', status: 'firm' },
  'tom-100k-100wk': { kind: 'plan', verdict: 'feasible', source: '13 §7a', status: 'firm' },
  'raj-hm-4wk': { kind: 'plan', verdict: 'feasible', source: '13 §7a', status: 'firm' },
  'mia-2-days': { kind: 'fail_closed', verdict: 'infeasible', source: '13 §7a', status: 'firm' },
  'karim': { kind: 'fail_closed', verdict: 'infeasible', source: '13 §7b', status: 'firm' },
  'rose': { kind: 'fail_closed', verdict: 'infeasible', source: '13 §7b', status: 'firm' },
  'ben-availability': { kind: 'fail_closed', verdict: 'infeasible', source: '13 §7a (restated)', status: 'assumed', oq: 'OQ-11' },
  'tst095-unsure-chest-item': { kind: 'gate_stop', gate: 'no_plan', source: '14 TST-095', status: 'firm' },
  'tst103-birth-year-blank': { kind: 'hold', source: '14 TST-103', status: 'firm' },
  'tst104-born-feb-2008': { kind: 'plan', source: '14 TST-104', status: 'firm' },
  'tst105a-race-week-at-s5': { kind: 'fail_closed', verdict: 'infeasible', source: '14 TST-105', status: 'firm' },
  'tst105b-race-week-at-s6': { kind: 'plan', verdict: 'stretch', source: '14 TST-105', status: 'firm' },
  'tst101-novice-inflated': { kind: 'plan', source: '14 TST-101', status: 'firm' },
  'tst102-weekly-goal-switch': { kind: 'fail_closed', verdict: 'infeasible', source: '14 TST-102', status: 'firm' },
  'tst106-62-injury': { kind: 'plan', source: '14 TST-106', status: 'firm' },
  'tst050-p05': { kind: 'gate_stop', gate: 'no_plan', source: '14 P05: 8 weeks postpartum < pp.min_weeks 12 → no_plan', status: 'firm' },
  'tst050-p15': { kind: 'gate_stop', gate: 'pause_until_clearance', source: '14 P15', status: 'firm' },
  'tst050-p06': { kind: 'plan', source: '14 P06 maintenance mode only', status: 'firm' },
  'tst050-p04': { kind: 'fail_closed', verdict: 'infeasible', source: '14 P04: 10K above the recommended 8 km at 15 → shorter-distance option', status: 'assumed', oq: 'OQ-18' },
  'tst050-p08': { kind: 'plan', source: '14 P08 SHARPEN', status: 'firm' },
  'tst050-p09': { kind: 'fail_closed', verdict: 'infeasible', source: '14 P09 PHS-011', status: 'firm' },
  'tst050-p07': { kind: 'fail_closed', verdict: 'infeasible', source: '14 P07', status: 'firm' },
  'tst050-p01': { kind: 'plan', source: '14 P01 feasible or stretch', status: 'firm' },
  'mvp-10k-time-12wk': { kind: 'plan', verdict: 'feasible', source: 'oracle/plans/mvp-10k-time-12wk.md', status: 'firm' },
  'mvp-hm-time-14wk': { kind: 'plan', verdict: 'feasible', source: 'oracle/plans/mvp-hm-time-14wk.md', status: 'firm' },
  'tst066-c25k': { kind: 'plan', verdict: 'stretch', source: '13 §5 (same structure as P1)', status: 'assumed', oq: 'OQ-19' },
  // v5.3 advanced personas (proposal v5.3 §6, 14 TST-133). The owner's verdict is the one proposal §1 reports for the
  // same goal and band (not re-derived here: 'assumed'). The inconsistent runner is cautious; its kind is not fixed.
  'v53-clem': { kind: 'plan', verdict: 'stretch', source: 'proposal v5.3 §1 (stretch, target inside the fast band)', status: 'assumed' },
  'v53-clem-confirmed': { kind: 'plan', verdict: 'stretch', source: 'proposal v5.3 §1; 03 §3 (a declared anchor counts as estimated for prediction, INP-005)', status: 'assumed' },
  'v53-marathon-3h': { kind: 'plan', source: 'oracle v5.3 persona (14 TST-133)', status: 'firm' },
  'v53-5k-19min-5runs': { kind: 'plan', source: 'oracle v5.3 persona (14 TST-133)', status: 'firm' },
  'v53-masters-55-ag70': { kind: 'plan', source: 'oracle v5.3 persona (14 TST-133)', status: 'firm' },
};

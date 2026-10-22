# CHANGELOG v2 → v3

Sources: d2-roomA/B/C (round 2), factdesk4 (fd4), architect decisions R2-x (RESOLUTIONS). Criteria as in `criteria.md`.

| # | Change | Files | Source | Criteria |
|---|---|---|---|---|
| 1 | **Start ladder S1–S9** = NHS Couch-to-5K for never-runners. 3 clean sessions per rung, no skipping, ≥ 9 weeks. Week-6 sessions 1–2 and week 8 are CREDIBLE | 10 §4b, SAF-085/086, 04 §3, parameters `rtr.start_ladder` | d2-A R1; fd4 §1 | C7, C8, C10 |
| 2 | 5K finish long-run demand = 30 min; ladder completion credits HAB L2 | 03 §2, 02 §2, `race.5k_finish_lr_min` | d2-A R2 | C9, C3 |
| 3 | Volume-carrying long run (LOD-016); short-race share cap by run count 0.45 / 0.40 / 0.30; MSG-LOD-FILL | 05 §3–4 | d2-A R3 | C5, C4, C12 |
| 4 | Feasibility dry run uses the generator's fill; AVAILABILITY_DAYS names the run day to add | FEA-020, FEA-031 | d2-A R4 | C9, C5 |
| 5 | `tid.hard_share_max.short` = 0.20 final; short polarized override 0.20 | parameters, 05 | d2-A R5 | C8, C5 |
| 6 | Same-distance band 4% (measured, ≤ 56 days); deadband grade → CORROBORATED | 03 §3, parameters | d2-A R6; fd4 §6 | C9 |
| 7 | H2 merged phase is SPECIFIC | 04 §2 | d2-A R7 | C5 |
| 8 | Distance stop at the time cap = min(race/ratio, abs cap), never from S_slow; MSG-DST-LR3H with the runner's numbers | 03 §2, 09 messages | d2-B R1 | C5, C12, C9 |
| 9 | Marathon floor reachable up to 240 min (`lr.floor_time_max_min`); over-cap share 0.60 | 03 §2, FEA-003, 05 §4, LOD-020 | d2-B R2 | C9, C2, C7 |
| 10 | **DST-019 optional extension runs** (≤ 3, ≤ 29 km / 240 min, SPECIFIC, ≥ 21 days apart, outside demand) | 09, 14 | d2-B R3; fd3 §5, fd4 §2 | C9, C7, C8, C12, C13 |
| 11 | LOW_VOLUME_PREDICTION is information only for finish goals | FEA-011 | d2-B R4 | C9, C12 |
| 12 | **FEA-006 cut-off check**, all families: CUTOFF_UNREACHABLE (infeasible) / CUTOFF_AT_RISK (stretch) | 03, 12 `Goal.cutoff_h` | d2-B R4, d2-C R2; R2-1 | C9, C12 |
| 13 | Marathon finish needs HAB 2 (3 runs); HAB 3 for time goals | 02 §5 | d2-B R5; fd4 §2 | C2, C9 |
| 14 | X-1: L_hold capped at 240 on an ultra → road switch; cliff accepted and recorded | LOD-005, 09 §4 | d2-B R6; R2-3 | C5, C7 |
| 15 | Floors declared for every preset and distance; INV-26 extended | parameters, 07 | d2-B R7 | C11 |
| 16 | Ultra distance floors 50K 25 km, 100K 33.3 km; time-capped below the floor → infeasible | parameters, FEA-003/005, INV-25 | d2-C R1 | C5, C9, C7 |
| 17 | Ultra time caps by distance: 50K 240, 100K 330 | DST-008, parameters | d2-C R3 | C5, C7, C8 |
| 18 | **One > 180-min guard (LOD-017, INV-28):** TOL L4 measured plus run-walk | 05, 07, 06 SES-009 | d2-C R3 + d2-B R3; R2-2 | C7, C5 |
| 19 | 50K AER 3 (dissent recorded) | 02 §5 | d2-C R4 | C9, C1 |
| 20 | Post-gap L30_eff reset (pre-gap runs leave the window from week 2 back) | LOD-011, GEN-013 | d2-C R5 | C6, C7 |
| 21 | NUT-034: earlier start first; accepted shortening logged with the re-run delay; carry-fluid and heat-exposure advice | 11 | d2-C R6, O1, O3; R2-7 | C6, C7, C12 |
| 22 | V28 for level thresholds excludes deload and taper weeks | 02 §2 | d2-C O4; R2-4 | C5, C9 |
| 23 | Galloway time cap 240 min of time on feet | 05 §4, parameters | d2-B optional; fd4 §4 | C10, C8 |
| 24 | Earliest feasible date and its reason always shown | 03 §6 | d2-C O5 | C9, C12 |
| 25 | Data model: `Session.is_extension`, ladder kind and rung; `Goal.cutoff_h` for all families | 12 | above | C11 |
| 26 | Validation: TST-075…078 (round-2 fixtures, feasibility–generator agreement, > 180-min guard, post-gap window); pilot metrics for extension runs | 14 §10c | d2-A R8, d2-B R3, d2-C R7 | C13 |
| 27 | 13 re-run: 5 personas and 23 room cases, with verdicts and rules | 13 | all rooms | C11 |

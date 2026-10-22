# CHANGELOG v1 → v2

Sources:
- Rooms: sub-council round 1 (d1-roomA/B/C).
- Findings: F-xx from v1 13.
- Evidence: factdesk3 (fd3) and hearing 2 (h2-*).

Criteria are numbered as in `criteria.md`.

| # | Change | Files | Source | Criteria |
|---|---|---|---|---|
| 1 | **Default road_classic preset = "classic-capped"**: 0.50 of weekly time; HM 150 / M 180 min; M 32 km; M ratio 1.40 with floor 2.00; HM ratio 1.30 with floor 1.60. Daniels opt-in (min 25%, 150 min) | 03 §2, 05 §4, 09 §4/§7, parameters | Room B R1 (DECIDED-1); F-01, F-03; fd3 §4 | C9, C3, C8, C12 |
| 2 | Time caps relabelled **coaching convention** (no duration–injury evidence) | 05 §4, 09, parameters | h2-med-acad/crit; h2-coach-field | C8, C12 |
| 3 | Marathon distance floor kept at 21.1 km; INV-23-style note on the Toresdahl association; alternative preset offered | 03 §2, 13 P3 | fd3 §5 | C7, C8, C9 |
| 4 | **Ultra caps**: 0.60 of peak-week time, 330 min, under all presets; time-capped demand → stretch (FEA-005) | 03, 05, 09 DST-008, parameters | Room C R1–R2 (DECIDED-2); F-23 | C9, C7, C8 |
| 5 | Ultra growth counts peak cadence; deload = non-peak; deload LR from the last peak | 03 §4, DST-009, 05 §6 | Room C R3, R5; F-29 | C9, C5 |
| 6 | Tune-up = min(50 km, ⌊1.10 × planned L30⌋), counts as the peak, exempt from ultra caps only | DST-012, INV-13 | Room C R4; F-24 | C10, C5, C7 |
| 7 | Knopp ultra tiers apply to 100K only; ultra V_req_dist = max(floor, L/0.60) | DST-014, 03 §2, parameters | Room C R6, R7 | C5, C8, C11 |
| 8 | 100K finish requires AER 4 / TOL 4 (was 5) | 02 §5 | Room C case 2 (architect) | C9, C1 |
| 9 | **L_req is no longer an upper bound** on the long run (all families); `L_target = max(L_req, L_hold)` | 05 §3 | Room A R1; F-04 | C5, C4 |
| 10 | **Baseline hold** LOD-005 / INV-27: no cut below the current long run or volume unless safety or T3 requires it; preset caps stop growth only | 05 §2, 07 §5 | F-04, F-05; fd3 §5, §9 | C7, C5 |
| 11 | **Water-filling** easy-run fill; adjacency cap 0.50 × LR; two-day cap 1.60 × L30; b2b day 2 ≤ 0.60, pair ≤ 1.75 × L30, ≤ 0.65 of the week | LOD-013, LOD-031, LOD-060, INV-03, parameters | F-05; h2-coach-field | C5, C7 |
| 12 | V_peak includes V_hold and the next AER level; base plans progress | 05 §5 | F-06 | C3, C5 |
| 13 | Family-scoped hard share (short 0.20 PROVISIONAL); exit-dose fit check FEA-026; race-effort segments converted, never shortened | LOD-033, FEA-026, parameters | Room A R2; Room B R5; fd3 §1; h2-coach-acad | C5, C8, C9 |
| 14 | MSP session every 2 weeks in SPECIFIC for time goals | DST-018 | Room A R3 | C4, C10 |
| 15 | 5K/10K finish: no build/specific, taper 1 week; 5K ratio 1.30 | 04 §3, 03 §4, parameters | Room A R4; F-18; fd3 §2 | C3, C9, C11 |
| 16 | HAB L2 attainable by run-walk for finish goals | 02 §2, 06 §3 | Room A R5 | C2, C4 |
| 17 | Required levels: 10K finish AER 1 / TOL 1 / DUR 1; half HAB L2; 50K HAB 3 (kept); set closed under prerequisites | 02 §5, 03 §2 | Room A R6; Room B R3 | C2, C5, C9 |
| 18 | H1: non-volume levels are not gates; SHARPEN uses eligible modules | FEA-023 | Room A R7 | C3, C9 |
| 19 | TARGET_OUTSIDE_BAND infeasible only in H1–H2; H3–H5 → TARGET_BEYOND_CURRENT with interim target and field tests every 6 weeks | FEA-032, FEA-038 | Room A R8 | C3, C9, C5 |
| 20 | Presets: FIRST `pending_fixture`; galloway caps declared; higdon ratio 1.32; INV-26 static completeness; DST-016 TID check | 05 §4, 09 §7, 06 §5, DST-016, INV-26 | Room A R9; Room B R2; F-02, F-27 | C8, C10, C11 |
| 21 | Scheduling a long run needs DUR L(n−1) (+ FUEL L1 > 150 min); TOL gates attaining DUR only | 02 §3, SES-M-003 | Room B R4 | C5, C11 |
| 22 | MSP segment ≤ min(share × race time, 90/40 min, 0.60 × run) | DST-006/007, SES-M-005 | Room B R5 | C7, C10 |
| 23 | **Pace model**: equivalent times + CS, ranges per effort, **deadband 3.5%** | 03 §3b FEA-014, SES-017, INV-15, ADP-061/062 | F-12; fd3 §3; h2-sys | C5, C11, C12 |
| 24 | Prediction from the newest measured anchor | 03 §3, ADP-062 | F-11 | C9 |
| 25 | Time governs demand; distance only via floors; rounding tolerance; % caps in time | 03 §2, INV-25, 05 §4 | F-13, F-14, F-25 | C5, C11 |
| 26 | **Re-plan logic**: remaining phases only, peak credit (70 days), degraded completion before failing closed | FEA-025, FEA-043, FEA-042, GEN-003, ADP-023, 04 §3 | F-21 | C6, C3, C9 |
| 27 | **INV-04 by load ordinal**; **published window** of 7 days (ADP-014) | 07 INV-04, 08 ADP-014, 12 | F-15; h2-sys (frozen horizon, deadband) | C6, C5 |
| 28 | Deload cadence semantics; minimum spacing (PHS-006) | 04 §4 | F-07, F-08 | C3, C5 |
| 29 | Zero-gap key-slot fallback (preset list in BUILD/SPECIFIC; strides in BASE) | CMP-007 | F-09 | C4, C10 |
| 30 | FUEL L3 required only for races > 2.5 h | CMP-008, 11 | F-10 | C4, C8 |
| 31 | ADP-022 silent on unlogged weeks; one ladder per situation with handover | ADP-022, SES-009 | F-16, F-17 | C6, C10 |
| 32 | FEA-035 also on `unknown` inputs; P0 from 04; `lower_goal` skipped when it cannot help | FEA-035, 03 §4, §6 | F-19, F-20, F-28 | C9, C12 |
| 33 | Illness return: gap bands under 30 days, ladder R0 only from 30 days | ADP-042, 10 §4 | F-22 | C6, C7 |
| 34 | Masters check-up advice for experienced masters runners (heart-rhythm association) | SAF-061, MSG-SAF-061 | F-26; h2-med | C7, C12 |
| 35 | Novice ladder labelled vs the 9-week Couch-to-5K | 10 §4 | fd3 §2; h2-med | C7, C8 |
| 36 | Hot or > 4 h training long-run card (EAH, heat) | NUT-034 | h2-nutr-acad/field; Room C O3 | C7 |
| 37 | AVAILABILITY_TIME states the minutes to add; `Goal.cutoff_h` warning | FEA-030, FEA-005, 12 | Room C O2, O4 | C9, C12 |
| 38 | Data model: preset status, caps and ratios; load_ordinal; published_until; V_hold/L_hold; interim target; degraded flag | 12 §2 | all of the above | C11 |
| 39 | Validation: C25K and FIRST fixtures; round-1 fixtures; baseline-hold, stability and degraded-completion tests; long-run > 150 min pilot metric | 14 §6, §10b | Room A R4/R9; Room B R6; Room C R7; h2-sys | C13 |
| 40 | Worked examples re-run under v2 (all H findings resolved) | 13 | F-01…F-29 | C11 |

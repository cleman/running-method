# CHANGELOG v3 → v4

**Sources:** p1-roomA/B/C (plenary round 1), factdesk5 (fd5), hearing 3 (h3), and architect decisions P1-x (RESOLUTIONS).
**Criteria** are numbered as in `criteria.md`.

| # | Change | Files | Source | Criteria |
|---|---|---|---|---|
| 1 | INV-13 ≤ max(cap, L_hold); T5 floor beats T5 caps, never T0–T3 | 07 | p1-A R1 | C5, C11 |
| 2 | Goal-change carry-over formula; new season on distance change; deload counter carried | LOD-005, ADP-080, FEA-025 | p1-A R2 | C6, C5, C3 |
| 3 | A measured logged distance meets the long-run demand | 03 §2, FEA-023/025, INV-25 | p1-A R3; fd4 §3 | C9, C5 |
| 4 | FEA-031 in H1 uses min(HAB runs, sustained F28) | FEA-031 | p1-A R4 | C5, C2 |
| 5 | 2-run share cap 0.60; goal family `base` | 05 §4, 12, parameters | p1-A R5 | C5, C11 |
| 6 | Deterministic seasons (> 52 weeks; near-equal; test → deload; dry run models boundaries) | 04, PHS-012, PHS-016 | p1-A R6 | C3, C5, C9 |
| 7 | One long-run formula for all families; FEA-005 deleted; LONG_RUN_TIME_CAPPED is stretch for time goals and information for finish goals | 03 §2, FEA-003 | p1-A R7 | C5, C9, C12 |
| 8 | Ultra exponent low edge 1.06 | parameters | p1-A R8; fd5 §3 | C9, C8 |
| 9 | LADDER_RUNWALK completion; "repeating a week is normal" | FEA-043, 10 §4b | p1-B R1 | C9, C6, C12 |
| 10 | Start-ladder adaptation: partial sessions, gap rule ADP-035, SAF-084 counts unclean weeks only | 10, 08 | p1-B R2 | C6, C7 |
| 11 | > 180-min guard uses **expected** duration; floor-bound run wording | 03 §2b, LOD-017, INV-28 | p1-B R3 | C5, C9, C7 |
| 12 | Age ≥ 65 and a run expected > 180 min → restricted until attestation (policy; dissent) | SAF-060, INV-28 | p1-B R4; fd5 §8; h3 med | C7, C12 |
| 13 | Runs > 180 min ≥ 14 days apart (LOD-018, INV-29) | 05, 07 | p1-B R5 | C5, C7, C8 |
| 14 | Recurring pain: 3 episodes in 42 days → refer | ADP-053, parameters | p1-B R6; h3 med (Yamato) | C6, C7 |
| 15 | 30-min ladder sessions after long gaps, postpartum, pregnancy stop or bone stress | SAF-081 | p1-B R7; fd5 §7 | C7 |
| 16 | Minors' caps by age on each session date (INV-30) | SAF-044, 07 | p1-B R8 | C3, C5, C9 |
| 17 | Dated night-shift roster in feasibility | 01, CTX-005, FEA-031, 12 | p1-B R9 | C2, C9, C5 |
| 18 | Reason texts, headlines and checkpoints; at most 2 reasons on the card | messages.md | p1-C R1 | C12, C9, C11 |
| 19 | ESTIMATED_INPUTS becomes a label, not a stretch reason | FEA-035 | p1-C R2; fd5 §1 | C9, C12 |
| 20 | Interim-target message with test time; 3 checkpoint outcomes | FEA-038, messages.md §3 | p1-C R3 | C12, C9 |
| 21 | Band stability within the deadband; verdict-change explanation | FEA-052 | p1-C R4; fd4 §6 | C9, C5 |
| 22 | Screening intensity defaults to vigorous | 01 §3 | p1-C R5 | C5, C7 |
| 23 | Onboarding answer bands (training age, last run, never-run) | 01 §1, 12 | p1-C R6 | C2, C11 |
| 24 | **Single typed message catalogue** with display rounding; "for you about" defined | messages.md, 12 §5, parameters §13 | p1-C R7 | C11, C12 |
| 25 | Three display layers | 07 §9, ADP-013 | p1-C R8 | C12 |
| 26 | Grade labels from basis + grade, with a plain sentence and numbers | 00 §5, messages.md §4 | p1-C R9; fd5 §2 | C8, C12 |
| 27 | Day-0 traces for P2 and P3 | 13 §2, 14 TST-093 | p1-C R10 | C11, C13 |
| 28 | **Expression grammar** (RuleExpr: CEL subset, Kleene three-valued, `has()`, `on_unknown`) and **rules.json** (285 rules + 30 invariants; formal for all T0–T2 rules and every invariant) | 12 §3.2, rules.json, 14 TST-090 | p1-C R11; h3 sys | C11, C5 |
| 29 | change_availability repair, ranked first for AVAILABILITY_* | 03 §6, FEA-040, 12 | p1-C R12 | C9, C3 |
| 30 | No deloads inside the start ladder; earliest comfortable date shown first | 04 §3, FEA-040 | p1-C R13 | C3, C12 |
| 31 | MSG-SAF-061 `why` names no condition | 10, messages.md | p1-C R14 | C7 |
| 32 | **Validator independence**: bound / metamorphic / shared-definition classes; M-1…M-8; parity property | 07 §5a, 14 TST-091/092 | p1-A R9; h3 sys | C13, C5 |
| 33 | Fixtures TST-079…089; record sync TST-090; catalogue lint TST-094 | 14 §10d | p1-A R9, p1-B R10, p1-C | C11, C13 |
| 34 | 13 re-run: 5 personas, 2 day-0 traces, 16 plenary cases, earlier fixtures | 13 | all rooms | C11 |

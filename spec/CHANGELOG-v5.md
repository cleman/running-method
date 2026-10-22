# CHANGELOG v4 → v5 (final design version)

**Sources:** p2-roomA (acceptance pre-check), p2-roomB (implementation readiness), p2-roomC (red team), factdesk6 (fd6), and architect decisions (RESOLUTIONS § Plenary round 2).
**Criteria** are numbered as in `criteria.md`. v4 is unchanged in `design/v4/`; its rationale is frozen in `design/v4/rationale-v4.md`.

## 1. Changes

| # | Change | Files | Source | Criteria |
|---|---|---|---|---|
| 1 | No "I don't know" for PAR-Q+ items, symptom items, special status, birth month/year, guardian attestation (`inp.no_unknown_fields`) | 01 INP-001, parameters | p2-C R1 | C7, C5 |
| 2 | An incomplete screen is no screen → `no_plan`; SCR-005 can no longer be satisfied by unknowns (reads `state.scr_symptom`, `state.scr_disease_inactive`) | 01 SCR-001/005, 12 §2b | p2-C R1; p2-B R3 | C7, C5 |
| 3 | `on_unknown: hold` for symptom questionnaires: no session until answered, MSG-SAF-HOLD only; no flag, no emergency text | 12 §3.2, SAF-001…007, ADP-040/050/081, NUT-033/043, messages | p2-C R2 | C7, C12 |
| 4 | One-tap "Any pain?" on every tick; next-morning prompt after long and E3+ sessions; unanswered = unknown | 01 INP-022 | p2-C R3; fd6 §3 | C6, C7 |
| 5 | Step-ups and level unlocks need answered pain on ≥ `pain.answered_min_ratio` (0.70) of the last 14 days' sessions | 05 LOD-006 (new) | p2-C R3; fd6 §3 | C6, C7 |
| 6 | Pregnancy mode stores due_date; "Have you given birth?" from due_date − 14 days; pause at due_date until answered | 10 SAF-051, SAF-054 (new), messages | p2-C R4 | C7 |
| 7 | Ladder crediting: on/after ladder start, one per day, rest spacing, ≤ `rtr.max_runs_per_week`, backfill ≤ 1 rung per 7 days | 10 SAF-082, §4b | p2-C R5 | C7, C5 |
| 8 | Implausibly fast anchor (> 2 × deadband) → confirm, estimated until a field test agrees | 01 INP-025 (new) | p2-C R6; fd4 §6 | C7, C9 |
| 9 | Two E3+ sessions at RPE ≥ 8 → paces down one deadband, field test offered | 08 ADP-066 (new) | p2-C R6 | C6, C9 |
| 10 | Claim-based L30_eff ≤ `claim.l30_cap_by_tol[tier]`; novice + high claimed weekly time → confirm | 07 GEN-011/022 | p2-C R7 | C7, C2 |
| 11 | Race recovery floor between goal races (INV-31, FEA-044, reason RACE_TOO_SOON); TRANSITION survives a goal change | 07, 03, 08 ADP-080, messages | p2-C R8; fd6 §1 | C7, C6 |
| 12 | Birth month and year required; month-based age_low/age_high; "Longer runs open from {date}" (MSG-SAF-023); no default age | 01 §1.1, INP-002, SAF-044, messages | p2-C R9 | C2, C7, C12 |
| 13 | FEA-043b numbers: 5 km × `ladder.est_pace_s_per_km` + warm-up vs 2.0 × longest ladder session; last 3 clean; race-morning questions; unknown → earliest date | 03 FEA-043 | p2-C R10 | C5, C7, C9 |
| 14 | MSG-CTX-003 and MSG-SAF-061 why texts; SAF-060 card "our cautious choice for runners aged 65 and over"; stop signs moved to a general message | messages, 10 | p2-C R11; fd2 §2 | C7, C12 |
| 15 | Red-team fixtures TST-095…106 | 14 §10e, 13 §7c | p2-C R12 | C13 |
| 16 | 13 rewritten: complete week tables for P1, P3, P5; one week as the runner sees it; all fixtures listed; Karim, Rose, red-team cases | 13 | p2-A R1 | C11, C12 |
| 17 | Typed action vocabulary (45 ops with required fields); every record's action is typed | 12 §3.3, all modules | p2-A R2; p2-B R1 | C11, C5 |
| 18 | messages.md complete (110 ids, typed placeholders, emitted-by column); module copies non-normative; lint L1–L8 | messages, 03, 06, 10, 11 | p2-A R3; p2-B R7 | C12, C11 |
| 19 | Band placeholders fast_edge / point / slow_edge; "inside / faster / slower than this range" always stated; P2 trace corrected | messages §0/§2, 03 §3, 13 §2 | p2-A R4; fd6 §7 | C9, C12 |
| 20 | FEA-021 counts only weeks that can hold key sessions (W − taper − P0) | 03 | p2-A R5 | C9, C5 |
| 21 | Combined repair option "add {day} and race on/after {date}" | 03 FEA-040, messages §5 | p2-A R6 | C9, C3 |
| 22 | Every parameter graded or basis `eng`; 26 rules and 9 invariants graded; register check | parameters, all modules, 07 | p2-A R7 | C8 |
| 23 | "Exit check" column for phases; per-module exit-test table | 04 §1, 06 §2b | p2-A R8 | C10 |
| 24 | Glossary: talk test, verdict, stretch, headline, predicted range, SHARPEN, ONBOARD, measured/estimated, basis, hold, release profile | 15 | p2-A R9 | C12 |
| 25 | Stale labels fixed; reading-path table | 00, 02, 06, 09, 13, rationale | p2-A R10 | C12, C11 |
| 26 | Honest `expression_status` (formal / procedure / static / text_only); text-only records have `on_unknown: null` | 12 §3.2, build | p2-B R2, R5 | C11, C5 |
| 27 | Evaluation context: roots, generated path table, helper functions, procedures, unit constants, effort ordering; `rule('X')` removed | 12 §2b | p2-B R3 | C11, C5 |
| 28 | Parameters instead of literals: `lr.long_guard_min` (180), `masters.vigorous_assessment_age`, `unit.*` | 05, 07, 10, 11, parameters | p2-B R4 | C5, C8 |
| 29 | GEN-020 fires to ask-confirm; CTX-005 and GEN-022 fire; no restrictive T0–T2 record skips on unknown | 01, 07 | p2-B R5 | C7, C5 |
| 30 | RULE line gains `basis ∈ {evidence, convention, design_default, eng}` | all modules, 12 §3.1, CONTRACTS | p2-B R6 | C8, C12 |
| 31 | Grammar corrected to CEL's four-valued semantics (true/false/error/unknown; unknown only when declared) | 12 §3.2 | fd6 §4 | C5, C11 |
| 32 | Module texts are the only source of rules.json: `## Machine records (v5)` blocks; `design/v5/tools/build_rules.py` | 01–11, tools | p2-B R8 | C11 |
| 33 | TST ids reallocated: TST-120 (round-1 fixtures), TST-121 (record sync + readiness), TST-122…125 (p1-A cases), TST-126 (CEL truth tables), TST-127/128 (Karim, Rose), TST-129 (messages); pilot metrics PM-100…110; TST-041 covers INV-01…31 | 14, 07, 12, CONTRACTS | p2-A R10; p2-B R9 | C13 |
| 34 | Independent oracle (a) demand, (b) weeks_needed and verdict, (c) long-run curve: TST-110…112 | 07 §5a, 14 | p2-B R10; fd6 §5 | C13, C5 |
| 35 | 66 listed MVP rules formalised, plus 39 further MVP-reachable T3–T6 rules (deload, taper, transition, levels, goal change, results, fatigue, ladder weeks) | 01–11 | p2-B R11 | C11, C5 |
| 36 | Release profiles MVP / R2 / R3 and build order | 00 §7, 12 §6 | p2-B R12 | C11, C1 |
| 37 | LOD-018 caps the non-peak or deload run, not the later run (13 R-04); P5 tune-up placed at wk 20 (13 R-01) | 05, 13 | architect (found writing 13) | C5, C7 |
| 38 | Optional "Hot today?" tap and 65+ heat note specified for R2 | 11 §9b | p2-C case 13; fd6 §2 | C7 |
| 39 | Safety texts simplified to reading grade ≤ 8 (MSG-SAF-001, -011 and others) | messages, 10 §5, 00 §6 | fd6 §6 | C12 |
| 40 | 00: reading paths, release profiles, release blockers B-1…B-5, honest known limits | 00 | brief | C11, C12 |

## 2. Rule base after v5

| | v4 | v5 |
|---|---|---|
| Rules | 285 | 290 (+ INP-025, LOD-006, SAF-054, ADP-066, FEA-044) |
| Rules with a machine record | 117 formal (T0–T2, conditions only) | **225**: 207 formal, 12 procedure, 6 static |
| Text-only rules | 168 | 65 (14 T4, 30 T5, 21 T6) |
| Invariants | 30 | 31 (24 formal, 2 procedure, 5 static) |
| Typed actions | 0 (37 ad hoc ops, all "see then_text") | every record; 45 ops, schema-checked |
| Parameters (register rows) | 249, 43 ungraded | 267, all graded or `eng` |
| Messages | 38 ids in the catalogue | 110 ids; every id used by a rule is defined |

## 3. Static checks run on v5 (21 Oct 2026)

| Check | Tool | Result |
|---|---|---|
| Build from module texts only | `python3 -I design/v5/tools/build_rules.py design/v5` | **build OK**: 290 rules, 31 invariants, 225 MVP-tagged rules; no unknown op, no missing action field, every T0–T2 rule and INV has a record, (tier, nnn) unique and inside each module's block |
| Implementation readiness (TST-121) | `python3 -I design/v5/tools/check_rules_v5.py design/v5` | **all checks pass**: no MVP or T0–T2 record text-only; no undeclared function, root or path; no literal other than 0/1/`unit.*`; no `rule('X')`; no string effort compare; every `p()` id in the register (139 ids used); every parameter graded or `eng`; no restrictive T0–T2 record with `skip`; text-only records `on_unknown: null`; no `see then_text`; every message id defined; every rule and invariant graded |
| Message lint (TST-094) | `python3 -I design/v5/tools/check_messages_v5.py design/v5` | **all checks pass** (L1 ids, L2 typed placeholders, L3 FK grade ≤ 8 and sentences ≤ 20 words, L4 no codes, L5 attribute wording, L6 multipliers, L7 glossary); 12 safety texts sit between grade 6.0 and 7.6 (target 6, reported) |
| Room B's own checker, pointed at v5 | `tools/check_rules_p2b.py` with the path changed to v5 (copy; the room's file is unchanged) | runs; its residual flags are by design: it reads v4's grammar list (so v5's declared helpers show as "not in grammar"), v4's root list, counts `true` on static records, and lists event-type conditions whose logic now sits in typed action expressions. Its v4 failures are gone: 0 literals, 0 missing p() ids, 0 missing message ids, 0 empty grade lists, 0 restrictive skips, 0 `rule()` refs, 0 string effort compares, basis now includes `convention` and `eng` |

## 4. Not done (stated, not hidden)

- About 30 text-only rules are still reachable by MVP code paths (00 §8, release blocker B-4).
- Fixture bodies are text, not data; the oracle is specified, not written (B-5).
- Readability is a formula score; the comprehension test is the real check.

## Post-audit (22 Oct 2026; audit-final.md, internal audit by the same process, not independent)

`design/v5-preaudit/` keeps the version the audit checked. All 15 required fixes are applied; 3 optional fixes too.

| Fix | Change | Files |
|---|---|---|
| 1 | Research-method disclosure: WebSearch summaries only, no primary source opened, CORROBORATED is the ceiling, nothing VERIFIED | 00 §1, ../rationale.md, 15 (Evidence grades) |
| 2 | Single-cohort findings regraded to "CREDIBLE (one cohort; several summaries)": spike.warn_ratio, spike.block_ratio (basis ev → dd), lr.m_ext_*, race.longest_floor_ratio direction, and every rule, invariant and rationale line citing Frandsen (wg4 §1 / factdesk2 §1) or Toresdahl (factdesk3 §5 / factdesk4 §2); the "one large study" example moved from "well supported" to "some research support" | parameters, 00, 02, 03, 04, 05, 07, 08, 09, 14, rationale §3/§23, messages §4 |
| 3 | Two-source rule: INP-003, INP-031, FEA-002, PHS-011, LOD-021, GEN-010, ADP-011, ADP-060, NUT-003 → `design_default`; FEA-030 → `eng`. New TST-121 checks: basis=evidence needs ≥ CORROBORATED; VERIFIED never used | 01, 03, 04, 05, 07, 08, 11, tools/check_rules_v5.py |
| 4 | Symmetric source-interest tags [corp] [industry] [trade] [state] [author] [society]; NHS, FDA, MDCG, ACSM, ACOG, preset authors and TrainAsONE tagged at citation | 00 §5, 01, 10, 14, parameters, rationale |
| 5 | 13 corrected values logged as R-05 and listed as oracle fixtures: Ana wk 4 V 207, wk 9 LR 162, wk 10 LR 178 (deload placement: fix 7); P5 illness 224 / tune-up 246; Lea 47:02–52:26; Tom 47:24 (FT-1 46:48); Karim 52:52 | 13 §2–§4, §7a, §8; 14 §10e |
| 6 | Tuesday card sums to 60 min (15 + 3 × 8 + 2 × 3 + 15) | 13 §6 |
| 7 | PHS-004: `weeks_to_phase_boundary` defined (full weeks left in the phase; 0 = last week); prose, 13 §0, R-03 and record aligned; record now moves to the last week of the deload's own phase; 04 spacing text aligned with PHS-006. P3 deloads recomputed: 4, 8, 12 (wk 11 LR 180, wk 12 deload V 270 / LR 135); P5 unchanged (5, 9, 13, 17) | 04, 12 §2b, 13 |
| 8 | The 27 MVP-reachable B-4 rules are tagged `release: MVP`; the build warns and **TST-121 fails** until they are formalised; RESOLUTIONS B11 corrected | tools/build_rules.py, 00 §8, 12 §6, RESOLUTIONS |
| 9 | L8 implemented (static part) in check_messages_v5.py; runtime part TST-103 | tools, messages §10 |
| 10 | 00 §8b "When a published plan is enough", signed by the Status-quo seat | 00 |
| 11 | 10 §0 risk table: overuse injury, bone stress, heat illness, EAH, race cardiac arrest (likelihood, severity, where, who, bounds, grade) | 10 |
| 12 | Glossary grade labels = 00 §5 / messages §4 labels | 15 |
| 13 | 01 §1 first line: "Every field not in `inp.no_unknown_fields` accepts 'I don't know'" (and the plain-words box) | 01 |
| 14 | "Build specification (v5): build-ready once B-1…B-5 close"; every "S8 pass" in 13 marked "hand-checked, not executed" | 00 §3, 13 |
| 15 | Ana's extension gate: fuelled long runs at 30 g/h in wk 6–7 (FUEL L1) and 45 g/h in wk 9–10 (FUEL L2 by wk 10); extension moved to wk 13 (≤ 198); no second extension before the taper | 13 §3, §6 |
| opt | "(v5, p2-C R11)" removed from MSG-SAF-060's why; Tom's point stays "around 51:00"; hand-value = floor(cap) check added to TST-110 | messages, 14 |

**Post-audit check results.**
- `build_rules.py`: build OK; warning: 27 MVP-tagged rules are text_only (B-4).
- `check_rules_v5.py` (TST-121): **FAIL**, by design: "MVP records that are text_only" lists the 27 B-4 rules. Every other check passes, including the new two-source and no-VERIFIED checks.
- `check_messages_v5.py` (TST-094): all checks pass, L1–L8 (L8 static part).
- Basis after post-audit: 206 design_default, 69 evidence, 10 eng, 5 convention.
- `tools/audit_final.py design/v5`: 0 of 69 evidence-basis rules below CORROBORATED; no VERIFIED; B-4: 27 MVP/text_only + 4 MVP/formal; 252 MVP-tagged rules. Its recomputed values match the corrected 13 (its "table" labels are hard-coded pre-audit strings).

Not done: the 27 B-4 rules are still prose only; fixtures and oracle are text, not code; nothing has been executed.

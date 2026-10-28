# CHANGELOG v5.2 → v5.3

28 Oct 2026, Engine session part C (`handoff/6-engine-part-C-v5.3.md`), from `docs/proposal-v5.3.md` and the owner's answers in `docs/decisions-v5.3.md` (where they differ, the decisions win). No web research was done. **Every new value is a design default** (basis `design_default`, or `eng` for pure structure), graded ALLEGED at most when it rests on coaching practice remembered by a session, UNKNOWN otherwise. Nothing here is validated on runners, and no coach has read it yet (decision 9).

> **In plain words.** A runner who sends a recent official all-out race and a training history that matches it now starts at their level: two or three real hard sessions a week, a long run near their usual one, paces from their race, and a richer set of sessions written in metres. Three normal "calibration" weeks check the start; if they go badly the plan becomes cautious again. Everyone now sees the planned progression of their sessions in advance. Safety rules are unchanged.

## 1. Experienced-runner path (proposal §3; decisions 1–3, 8)

- **02 §2b (new)**: two paths (cautious = v5.2 unchanged; experienced). Qualifying race, approximate age-grade, the age-grade → level table, consistency bands, calibration, fallback, confirmation, and a list of what the path changes elsewhere. History stays manual entry only (decision 8).
- **New rules** (02 block, new `EXP` prefix): EXP-001 eligibility (T5.120), EXP-002 declared levels (T5.121), EXP-003 calibration weeks (T5.122), EXP-004 fallback (**T2.120**, on_unknown fire), EXP-005 confirmation (T5.123), EXP-006 ask "official result?" (T6.120, basis eng). All have machine records.
- **New confidence `declared`** (between estimated and measured) for levels (source `race_result` for THR/VO2/MSP) and for a confirmed, late-entered race (INP-005).
- **Changed rules**: CMP-004 (not on the experienced path), CTX-007 and GEN-014 (no slow profile on the path), GEN-011 (L30_eff = `exp.l30_discount` × claim, no TOL cap), LOD-007 (base never below the claimed V_hold), LOD-008 (replaced by EXP-005 on the path), INP-005 (declared), FEA-014 and INV-15 (declared anchors set paces on the path, slow edge widened by `exp.declared_pace_widen_pct`), SES-014 (declared anchor counts), 04 §1 (no ONBOARD on the path), 03 §3b (widening).
- **Owner decision 1 detail**: the confirmation is a new anchor field, `official_result_confirmed`; `docs/v5.3-case/clem.json` has it unanswered, so its result is the cautious plan plus the question; `docs/v5.3-case/clem-confirmed.json` is the same profile answered "yes".

## 2. Hard sessions per week (proposal §4 B1; decision 4)

- **SES-007**: experienced path — calibration weeks 2; BASE 1 (+ strides); BUILD/SPECIFIC **3** when ≥ 6 runs (long run included) and TOL ≥ 3, else 2; TAPER 2 sharpeners; MAINTAIN 1.
- **SES-006**: new runner ceiling `profile.hard_sessions_max` (1–3, default 3).
- **SES-026 (new)**: forms a (three workouts + all-E1 long run, not a hard day) and b (two workouts + long run with a steady finish, SES-M-031, a hard day and the third key session), by `exp.long_quality_pattern`.
- **SES-004 / INV-17**: an all-E1 long run on the experienced path is not a hard day; placement ties go to the fewest workouts on the day after a long run, and the gap score counts the long runs (so workouts move away from them).
- **DST-005**: the short family allows SES-M-031's E2 finish on the experienced path.

## 3. Session library (proposal §4 B2–B4; decisions 5–6)

- **06 §2d (new)**: extended ladders (SES-M-008 to 5 × 12 min, SES-M-009 to 2 × 30 min, SES-M-010 to 6 × 5 min, SES-M-011 to `ses.msp_share_max`), **entry and top rungs by level** (levels 0–2 keep the v5.2 start and maximum, so cautious runners are unchanged), families and rotation, time and distance forms.
- **New modules**: SES-M-026 Goal race (closes Q-E5), SES-M-027 short reps, SES-M-028 hill repeats, SES-M-029 fartlek (time only), SES-M-030 combination, SES-M-031 long run with a steady finish. Each has a dose ladder in `parameters.md`.
- **New rules**: SES-027 entry/top rung, SES-030 family rotation, SES-031 time or distance form (basis eng), SES-032 rounding to track distances. **SES-022** now also turns hills into short reps without hill access. **SES-011** reads the level-dependent top rung.

## 4. Projection (proposal §5; decision 7)

- **07 §2b** rewritten and **SES-028 (new)**: future weeks show the planned dose path (one rung per planned instance, ≤ `ses.projection_max_steps` above the last logged step), labelled MSG-SES-PROJECTION; the weekly re-plan restarts from the log. This applies to every runner and replaces v5.2's "one step ahead only".

## 5. Parameters, messages, schema, data model

- `parameters.md` §15b and 42 new machine lines (`exp.*`, `perf.wma_*`, `ses.entry_rung`, `ses.top_rung`, `ses.rung_node`, `ses.family`, `ses.msp_share_max`, `ses.track_distances_m`, `ses.dist_round_*`, `ses.hill_speed_ratio`, `ses.projection_max_steps`, `ses.prescription_default`, `ses.time_only_modules`, five new dose ladders; four ladders extended). **The age-grade tables are an approximation from memory, not WMA 2023 (ALLEGED; `docs/questions.md` Q-E37).**
- `messages.md`: 6g (MSG-EXP-CONFIRM-Q, -PATH, -CALIBRATION, -FALLBACK, -CONFIRMED), MSG-WHY-EXP, ten session messages (new modules, projection, forms, hard-session ceiling, declared paces).
- `schema/`: inputs accept v5.2 or v5.3 (`profile.injury_last_12w`, `hard_sessions_max`, `prescription_preference`, `anchors[].official_result_confirmed`); results are v5.3 (`declared`, `race_result`, `engine_state.experienced`, segment `show_distance_m` / `show_about_m`, `session.prescription_form`, `week.is_calibration`, `week.long_run_form`, three state fields).
- 12: 31 new paths with types, `exp_level` and `age_grade_pct` helpers, `distance_form` procedure, event type `render_session`, EngineState `experienced`, entity rows. CONTRACTS: EXP in the 02 block. 14: TST-132…134 (TST-133 = the proposal's plan-quality checks for the Oracle session, with the "hard session next to the long run" property restated for decision 4). 15: glossary entries.
- `tools/build_rules.py`: EXP prefix (stage S2, why message), MVP tags for the new rules, version v5.3. `build_parameters.py`: version v5.3.

## 6. Counts and checks (run in this session)

313 rules (259 formal, 15 procedure, 7 static, 32 text-only), 31 invariants, 281 MVP rules; basis: design_default 223, evidence 67, eng 18, convention 5. 386 parameters. `build_rules.py` build OK; `build_parameters.py` build OK; `check_rules_v5.py` **RESULT: ALL CHECKS PASS**; `check_messages_v5.py` **RESULT: ALL MESSAGE CHECKS PASS**. The 66 persona inputs still validate.

## 7. Open (see `docs/questions.md` Q-E33…Q-E41)

BASE count after calibration (Q-E34), race-pace level across families (Q-E35), the SES-014 re-test in projections (Q-E36), official WMA tables (Q-E37, owner), GEN-022's age-grade clause (Q-E38), DST-006 in form b (Q-E39), INV-04 as a generator cap (Q-E40), the oracle's long-run adjacency property (Q-E41). The five advanced personas of proposal §6 are for the Oracle session. The coach review (decision 9) is the owner's.

# Gap analysis: rule engine (spec v5)

Scope: can a competent engineer build the **rule engine** (evaluator, action executor, pipeline driver, validator harness, repair loop) from module 12 + `rules.json` without inventing semantics? Training content (session doses, presets, demand formulas) is out of scope except where the engine must call it.

Sources read: 12 (all), 07 (all), CONTRACTS.md, 03 §2–§5, 10 §4, 08 §1–§2, RESOLUTIONS Room A, parameters.md (format), 14 TST-121/126. `rules.json` analysed with throw-away scripts (`python3 -I`): op/field census, target census, a CEL-like recursive-descent parse of all 708 expressions, bare-identifier and comprehension-field scans, nullable-field scan. The spec was not edited.

## 0. Summary verdict

**Yes, it can be built, but not without inventing semantics in about eight places. Five of them are real design decisions, and three are small spec bugs that would make an MVP misbehave.**

What is solid:
- The **expression layer** is in good shape. All 708 condition, action and assert expressions parse with a plain CEL-subset grammar. There are no undeclared functions or roots, no stray literals and no string comparisons of efforts. The four-valued logic is stated, and TST-126 pins it.
- The **record format is clean**: a typed action object, tier + nnn unique, `on_unknown` on every evaluated record.
- The pipeline stages S0–S10 and the tier table (07 §1) give a good skeleton.

What is missing is mostly the **"glue" an engine needs between a rule and the pipeline**:
- **Rule binding.** Nothing says which stage evaluates a rule, or over which bindings (each week? each session? each node?).
- **Write semantics.** There is no merge rule for writes to the same target, and "PRIORITY: first by priority" has no stated grouping key.
- **Persistence.** Many rules write `state.*`, `flag.*` and `until` conditions that must survive re-plans, which 07 §2 ("no hidden state") contradicts.
- **Blank vs unknown vs null** for optional fields.
- **Repair.** The S8r ranks REP-001…006 have no machine records at all.

**Real blockers: 8** (Q1–Q8 below). Q1–Q5 are design decisions for the engine session. Q6 is a batch of four one-line spec bugs. Q7 is the known B-4: 27 MVP `text_only` rules. Q8 is that the parameter registry is not machine-readable. None needs new research; all have a proposed default below.

Checker state (`check_rules_v5.py .`): 290 rules (207 formal, 12 procedure, 6 static, 65 text_only), 31 INV, 45 ops, 53 helpers, 9 procedures, 417 paths. The only FAIL is "MVP records that are text_only" (27). The checker does **not** check:
- fields read through comprehension variables (`s.is_run`, `s.is_hard`, …);
- undeclared bare identifiers (`today_events`, `next_session_E3`, `progression`);
- action fields outside the §3.3 schema;
- types;
- unguarded optional fields (12 §3.4 item 7b promises this check; v5 does not implement it).

## 1. Action ops (45)

Generic gaps that apply to every op, and are therefore not repeated per row:
- (a) **`then` ordering.** Are `then` steps applied in order? Do they see each other's writes? Are they skipped if the parent was a no-op? 12 §3.3 says only "applied after the first".
- (b) **`when` / `otherwise` / `unless`.** These are evaluated in what binding, and with what unknown policy (does the record's `on_unknown` apply)?
- (c) **`until`.** It takes three types: a date (`date_add(...)`), a boolean expression, or the string `'never'`. When is it re-evaluated (every regeneration? every event?) and where is it stored?
- (d) **Fields outside the schema.** 12 §3.3 lists `{op, required, then, msg, when, otherwise, until, unless}`, but the records use about 20 more: `exclude_from, max_asks, on_no_answer, questions, attach_to, once, before, msg_expr, effort_max, counted_from, constraint, fields, expr` (on hold_step/generate_options), `max_expr, args, repair, place_long_run, max_offers`, and `until`/`when` on `set`. The build accepts them silently, so their meaning is defined only by example.
- (e) **Targets that are not §2b paths.** Examples: `next_session_E3`, `progression`, `rest_or_cross` (not a module id), `log.entries_created_today[].confidence` (bulk assign), `state.levels[node.id]` (indexed write), `demand` (whole object), and `s.planned_duration_s` with `s` bound by one of two `exists` (SAF-060).

| # | Op | Uses | Class | Reason (spec location) |
|---|---|---|---|---|
| 1 | set | 110 | UNDERSPECIFIED | "assign" is clear, but 13 rules set `state.progression_profile`. LOD-002 (T5) can overwrite T1 `'slow'` with `'standard'`. 6 rules set `state.effort_ceiling`, which 2b.2 calls the "lowest" ceiling, but the op is plain assign. LOD-040/050 `set week.planned_time_s` after T2 caps. No merge rule, no persistence rule (12 §3.3, 07 §1) |
| 2 | cap | 46 | MINOR | MIN is clear. Order against `floor`/`set` is undefined. FEA-013 caps `feas.verdict_rank` at stretch, which *lowers* infeasible to stretch (the wrong direction; it should be a floor), and FEA-036 recomputes the verdict anyway (03 §3, 12 §3.3) |
| 3 | floor | 12 | MINOR | MAX is clear. "Floor beats T5 caps, never T0–T3" (07 §1, RESOLUTIONS A1) is not encoded in the op. LOD-005 embeds `t0t3_limit()` instead, which needs every T0–T3 cap evaluated first |
| 4 | gate | 14 | MINOR | The outcome lattice is clear (07 §1 T1 COLLECT, most restrictive). Optional `until` and `effort_max` are not in the schema. Gate state lives on `state.gate`, but how a gate with `until` lifts is not specified |
| 5 | raise_flag | 9 | MINOR | Creates a RiskFlag (12 §2). Open points: SAF-009 uses outcome `freeze`, which is not a GateOutcome; dedupe against an active flag of the same subkind is undefined; how `flag` binds afterwards is undefined (SAF-003 mutates "the flag in scope" raised by SAF-002) |
| 6 | route | 10 | UNDERSPECIFIED | "hand the event to the named rule or module, which decides" (12 §3.3). Targets are a rule (`SAF-001`), a module (`10`) or an alternation (`SAF-002\|SAF-011`, ADP-053); `before: gap_bands` is also used. Unstated: is the target evaluated immediately, with which event payload, and is it re-entrant? |
| 7 | block_sessions | 9 | MINOR | `filter` over `s` is clear. Unstated: whether matching sessions are removed, replaced by rest, or hidden; and how `until` persists (see (c)) |
| 8 | ask | 9 | MINOR | Clear as a UI side effect. `questions` is free text ("10 §1 C1-C4, …"). The engine state while unanswered (implicit hold?) is unstated |
| 9 | ask_confirm | 4 | MINOR | When the answer counts as "unanswered" for `on_no_answer: use_lower_value` (no timeout parameter) is unstated |
| 10 | flag_entry | 2 | CLEAR | `plausibility = flagged`; `exclude_from` names denominators (12 §3.3, INV-14) |
| 11 | reject_input | 1 | CLEAR | — |
| 12 | require_attestation | 2 | MINOR | The attestation is identified by `event.msg_id` (SAF-021). Storage and expiry are unstated |
| 13 | require_rescreen | 2 | MINOR | Does it invalidate `screen.complete` or `valid_until`? `before: next_session` vs gate interplay is unstated |
| 14 | emit_message | 22 | MINOR | The catalogue has typed placeholders (12 §5), but nothing maps a placeholder to an expression. `once`, `attach_to` and dedupe across re-plans are unstated |
| 15 | insert_phase | 7 | UNDERSPECIFIED | Unstated: where it is inserted (today? before the current phase?), how long it lasts (RTR = ladder length? TRANSITION = `phs.transition_weeks`), and what happens to later phases (shift, compress, re-run S4?). `rung_expr: "null"` for TRANSITION |
| 16 | insert_deload | 1 | MINOR | "PHS-001 placement", `counted_from: last_recovery_like_week` (extra field). Relies on 04 prose |
| 17 | drop_deload | 2 | MINOR | What the dropped week becomes (a loading week at which ordinal? INV-04) is unstated |
| 18 | move_deload | 1 | MINOR | Swap vs shift of the weeks in between is unstated |
| 19 | set_rung | 4 | MINOR | The extra `constraint` field (SAF-082) acts as a guard; this is not stated. Effect on already-placed sessions is unstated |
| 20 | drop_session | 1 | MINOR | `session.missing_part` (partial drop) needs a definition of "part" |
| 21 | move_session | 1 | UNDERSPECIFIED | `expr` returns a *week* (`next_allowed_week`), not a date. Which day, what gets displaced, and whether INV-21 is re-checked are all unstated |
| 22 | replace_module | 3 | MINOR | `'rest_or_cross'` is not a module id. `next_session_E3` is an undeclared selector. Whether the duration is kept is unstated |
| 23 | schedule_session | 6 | UNDERSPECIFIED | The date or week, what it replaces, the dose, and the budget interaction (INV-04/11) are unstated; only `module_expr` is given |
| 24 | schedule_prompt | 1 | MINOR | `when` is used as the trigger condition; timing ("next morning") comes from the field name |
| 25 | hold_step | 6 | MINOR | "no increase for N weeks" — from which week? The extra `expr` (a reference week) is undocumented. LOD-056 holds for `plan.W` weeks |
| 26 | freeze | 4 | UNDERSPECIFIED | Targets are heterogeneous: `progression` (abstract), `session` + `fields` (meaning *unchanged*), `plan.future_weeks` (meaning *not emitted*?). "No increase" vs "no change" is undefined per target |
| 27 | suppress | 3 | MINOR | The `what` vocabulary (fuel_targets, drink_targets, loading, caffeine, carb_loading, train_low, pace_targets) is enumerated nowhere |
| 28 | add_reason | 20 | CLEAR | Codes and classes in 03 §5; verdict by FEA-036 |
| 29 | label | 4 | CLEAR | "never changes the verdict" |
| 30 | set_verdict | 2 | MINOR | FEA-043 overrides FEA-036. Order vs `cap feas.verdict_rank` (FEA-013) is unstated |
| 31 | generate_options | 7 | UNDERSPECIFIED | Each option must be "generated and validated", which is a nested full pipeline run per candidate. Missing: search steps (lower goal: what time step?), recursion bound, and how the `expr` start point works. Composite kind `change_availability+move_date` is not in the `RepairOption.kind` enum. GEN-003 puts `alternative_preset` in the main order, but 07 §6.2 says it is labelled separately |
| 32 | drop_option | 1 | CLEAR | — |
| 33 | offer_options | 1 | MINOR | Option kinds (`earlier_start`, `non_peak_length`) are free strings; the effect of a choice is unstated |
| 34 | offer_swap | 1 | MINOR | The effect of acceptance is not expressed as an op |
| 35 | regenerate | 9 | UNDERSPECIFIED | Unstated: re-entrancy (ADP-010 fires on *any* event; GEN-030 does `regenerate` then `record_event`, which fires ADP-010 again); what is kept before `from_stage` (S2/S3/S4); whether `then` steps run before or after the rerun |
| 36 | fail_closed | 2 | MINOR | The S9 output is `RepairOption[]` + reasons. What is shown and kept at **first** generation (no previous version) and at re-generation (FEA-042 freeze) is spread across 07 §2, 12 §3.2 rule 5 and FEA-042 |
| 37 | raise_long_run | 1 | MINOR | Effectively `floor` with a pre-capped expr. Re-balancing the week total (INV-11) is implicit |
| 38 | shorten_week | 1 | UNDERSPECIFIED | Order tokens `easy, key, drop_easy, drop_key, long`: shorten by how much, which session first among equals, step size? Only SES-008 prose |
| 39 | filter_candidates | 1 | CLEAR | Keep `m` where the expression holds (SES-001) |
| 40 | order_events | 1 | MINOR | `today_events` is undeclared; `x.tier` of an event is undefined (AdaptationEvent has no tier) |
| 41 | record_event | 3 | MINOR | Kind `goal_edit` is not in the AdaptationEvent.kind enum; creates the regenerate loop noted in #35 |
| 42 | render_run_walk | 2 | MINOR | The source of the ratio (`ses.runwalk.*`? ladder rung?) is not stated in the op |
| 43 | render_fixed | 1 | CLEAR | static |
| 44 | constraint | 11 | MINOR | Mixes three kinds: lint prose (`static:`), validator prose (`validator:`), and live expressions with hidden actions (LOD-033 `repair: shorten_quality_segments`, SES-005 `place_long_run`) |
| 45 | log_deviation | 3 | MINOR | `template_value`, `criterion` and `grade` must be inferred from the enclosing action and record |

Tally: **CLEAR 7, MINOR 29, UNDERSPECIFIED 9** (set, route, insert_phase, move_session, schedule_session, freeze, generate_options, regenerate, shorten_week).

## 2. Expression language

| Topic | Status | Finding (location) |
|---|---|---|
| Grammar | CLEAR | 12 §3.2 operator list. All 708 expressions parse with a CEL-like Pratt parser. Two non-CEL forms: the 4-argument comprehension `all(pairs(L), a, b, pred)` (INV-29) and `min(list)` on a list of strings (GEN-005), whereas 12 §2b.3 declares `min(a, …)` variadic and numeric |
| Literals | CLEAR | Only 0, 1, `unit.*`, strings, `null` (12 §2b.5); verified |
| Four-valued truth | MINOR | Rules 1–6 of 12 §3.2. Open points: (i) the spec says "E dominates U (CEL)". My understanding is that cel-go gives *unknown* precedence over *error* in `&&`/`\|\|`; confirm against the chosen library and pin it in TST-126. (ii) `!U`, `U ? a : b`, `x in [U…]` are not stated. (iii) Comprehensions over elements that evaluate to U (`exists` with one true and one U → true?) are not stated. (iv) `has()` on a declared-unknown field is not stated (INP-001 uses `!has(input.value)`) |
| Null / blank / absent | UNDERSPECIFIED | Four notions collide: nullable §2 fields (`distance_m`, `pain_0_10`, `planned_distance_m`), the `null` literal (SAF-081 sets it; LOD-018 compares `!= null`), helpers that return "none" (`next_day`) or *unknown* (`first`), and absent = error (12 §2b intro). The scan found **40 reads of nullable fields without `has()`**. Example: ADP-053 (T0, `on_unknown: fire`) reads `entry.pain_0_10`. If a blank pain score is "declared unknown", every pain-less entry routes to the bone-stress questions. NUT-050 reads `state.last_reds_screen` (absent for a new user → E → plan stuck in safe state) |
| Types | UNDERSPECIFIED | 2b.2 has no type column. 116 paths say only "§2 entity field / engine value", and about 60 of the paths labelled "§2 entity field" are not in §2. Int vs float: durations are int seconds, but products such as `1.10 × l30` are floats, and only some places call `round_down`. Byte-identical output (GEN-004) needs a global rounding rule |
| Units | MINOR | Conventions are clear (12 §1). Exceptions: `goal.cutoff_h` is in hours; parameter units live in a prose column (`claim.l30_cap_by_tol` in minutes × `unit.min_s`). No unit typing |
| Effort ordering | **BUG** | `effort_rank` covers E0–E4 only (12 §2b.3), but E5 exists (12 §1). SES-M-006 strides (MVP, all presets) and SES-M-007 have `effort_profile` E5, and SES-M-020 has "E4/E5". SES-001 `effort_rank(m.effort_profile)` therefore gives E, which fails the plan closed |
| Dates / time | MINOR | "ISO local date, Monday start". Unstated: the timezone of `now`/`entered_at`; the meaning of `date_end` (23:59:59 local?); date–timestamp mixing (`hours_between(session.date_end, now)`, `days_between(e.submitted_at, today)`). SES-005 tests `session.date in profile.available_days` (date vs weekday set; **bug**, INV-21 uses `weekday()` correctly) |
| `p()` resolution | MINOR | Chain "registry → preset → `override` (MIN for limits)" (12 §2b.3, parameters.md). Unstated: which ids are "limits" (MIN is the *permissive* direction for floors such as `taper.freq_min_ratio`). Dynamic ids are built by string concatenation (`p('prog.' + profile + '.week_max')`, `p('gap.vol_factor.' + band)`). Map-valued parameters are indexed (`p('race.recovery_days')[d]`) but their values are prose ("14–15: 8; 16: 12", "TOL ≥ 4: no cap"). Rules also read `override.deload.every` directly, bypassing `p()` |
| Comprehension variables | MINOR | 13 names, bound by `all/exists/count/sum`. Fields read through them are unchecked: `s.is_run`, `s.is_hard`, `s.run_walk`, `s.hr_zone`, `s.hr_source`, `w.has_e3_touch` (2b.2 has `week.e3_touches`), `x.tier`, `x.one_per_day` are declared nowhere. The "witness" rule (an action may name the `exists` witness) has no defined behaviour when two `exists` appear (SAF-060) or when the action uses the root (`flag`) instead of the witness (`f`) (SAF-020) |

## 3. Helpers (53) and procedures (9)

Helpers that are **CLEAR** (signature + algorithm given in 2b.3), 36 of 53: `p` (modulo §2), `has, size, min, max, abs, round_down, round_up, ceil_div, days_between, hours_between, weeks_between, date_add, weekday, count, exists, all, sum, max_or_zero, first, last, sort_by, pairs, age_low, age_high, verdict_rank, tier_rank, kind_rank, reason_class, reason_group, module, current_week, phase_last_week, spike_cap, prereqs_hold, level_prereqs_hold, anchor_l30_ok`.

| Helper | Class | Gap |
|---|---|---|
| `effort_rank` | BUG | E5 is missing (see §2) |
| `gap_band(days)` | MINOR | Undefined outside [8, 29]; callers guard it, but the return value for other inputs should be stated |
| `rtr_entry_rung(tier, days)` | MINOR | The 10 §4 table also keys on *reason* (bone stress, postpartum, never-run, training age), which the signature lacks; `state.rtr_entry_reason` exists but is not passed |
| `l30_time / l30_dist` | MINOR | Mixes logged and *planned* runs (LOD-011). "G1/G2 gap" is defined only in 08 §4. Recursive for future weeks (planned runs raise future L30) |
| `baseline(w)` | MINOR | "Planned time of the last non-deload week": of this plan version or the parent? |
| `parent_week(w)` | MINOR | No defined result when the parent has fewer ordinals (new weeks after a date move); INV-04 reads `.planned_time_s` on it, which gives E |
| `adjacent`, `next_day`, `same_pair` | MINOR | Return "none"/empty vs null vs unknown is not unified; the definition of pair identity is implicit (SES-M-016) |
| `last_completed_comparable_week` | MINOR | "same kind": kind of week (`week.kind` normal/maintenance, or deload/loading)? |
| `last_completed_step()` | UNDERSPECIFIED | "Last loading step completed without pain": step of what (volume, long run, rung, module dose)? No arguments |
| `next_allowed_week(s, gap)` | MINOR | Returns a week; the day within it and "none" are unspecified (§1 #21) |
| `threshold_level`, `highest_tol_level` | MINOR | Point to the 02 §2 tables (content). Fine if those tables are encoded as data |
| `fuel_band_high` | MINOR | Needs the `fuel.band.by_duration` table in machine form |

Procedures:

| Procedure | Class | Gap |
|---|---|---|
| `compute_demand` (03 §2) | CLEAR-ish | Formulas are explicit; needs map parameters in data form |
| `predict_band` (03 §3) | CLEAR-ish | Explicit; "second anchor widens once" is clear |
| `pace_range` (03 §3b) | CLEAR-ish | The CS fit from "two races 3–20 min apart" needs a stated fit method (least squares on 2 points = exact) |
| `dry_run_weeks_needed` (03 §4, FEA-020) | UNDERSPECIFIED | It is "run 05's builder + the generator's week fill", but the builder needs phase lengths and deload placement (S4), which need `weeks_needed`. The **circularity** needs a stated iteration or assumed layout |
| `water_fill` (LOD-031) | UNDERSPECIFIED | "Water-filling within [min_run, min(LR, day cap)]": "day cap" is undefined; integer rounding, which days, and tie order are missing. It must be byte-deterministic |
| `preset_cap` (LOD-020) | CLEAR-ish | MIN of declared caps, for `method_default` |
| `t0t3_limit(week)` | UNDERSPECIFIED | "MIN over every T0–T3 cap that applies", i.e. it requires evaluating the T0–T3 rule set as a sub-query; no enumerated list |
| `decay(levels, gap_weeks, decay_weeks)` (CMP-003) | UNDERSPECIFIED | 12 §2b.4 cites a "per-node decay table" that does not exist. CMP-003 lowers by 1. Is it 1 total, or `floor(gap/decay_weeks)`? |
| `place_in_order(week, order)` (SES-003) | UNDERSPECIFIED | The order is given; the day assignment for key/easy sessions (spacing, which free day, ties) is not |

## 4. Execution model

| Topic | Status | Finding |
|---|---|---|
| Rule → stage binding | **BLOCKER** | Records have no `stage` or `scope` field. The engine must infer from roots that `entry` rules run on save, `session` rules per session, `week` rules per week, and `node` rules per node. 44 distinct `event.type` values are used, about half of them internal hooks (`compute_tol`, `build_week`, `fill_week_skeleton`, `distribute_week`, `candidate_list`, `tie`, `reasons_collected`, `resolve_profile`, …). There is no catalogue of who emits them, in which stage, or in which order. `adaptation_event` (ADP-010) is not an AdaptationEvent kind |
| Order within a tier | MINOR | (tier, nnn) is unique, so a total order exists (07 §1). But T0/T1 are COLLECT and T2/T3 ALL, so whether order matters there (sequential side effects such as SAF-002 then SAF-003) is unstated |
| PRIORITY hit policy (T4–T6) | **BLOCKER** | "First by priority" (DMN). Taken literally, only **one** of the 87 T5 rules would fire. The intended grouping key (per target? per decision point?) is unstated |
| Conflicts on one target | **BLOCKER** | 07 §1 says numeric = MIN across tiers, floors beat T5 caps but not T0–T3, and tier order applies to non-numeric. The ops do not implement this: `set` on numbers (LOD-040/050 deload/taper volume) bypasses MIN; ordinal enums (`effort_ceiling`, `progression_profile`) use `set`, so the last writer wins |
| Fixpoint / iteration | **BLOCKER** | No statement. Rules write values other rules read (`state.L30_eff_*` → caps → `week.lr_s` → `t0t3_limit`). Is it one pass in priority order, or iterate to a fixpoint? With what bound? |
| Repair loop | **BLOCKER** | 07 §6.1 ranks REP-001…006, but **no REP record exists in rules.json**. Missing: the violation → repair mapping in machine form, "earliest violating session" (by date? by invariant id?), and what a "pass" is. GEN-003 tests `s8r_passes > max_passes` while 07 §6.1 says "≤ max_passes" (off-by-one). REP-005/006 re-run S4/S3 inside S8r |
| Goal-level repair (S9) | UNDERSPECIFIED | See `generate_options`. Each option is a nested pipeline run with no recursion bound; option validation runs FEA-041 on `option.*` |
| Fail-closed output | MINOR | `RepairOption[]` + reasons (12 §2, 07 §2). On E at **first** generation, "keep previous version" has nothing to keep; the runner-facing result is undefined |
| Event processing | MINOR | ADP-012 orders same-day events by (tier, kind, id) and processes them "in one re-plan". Unstated: which tier an event has, and whether rule-generated events (`record_event`) join the same batch |
| Determinism | MINOR | No randomness, GEN-005 tie-break, GEN-004 byte-identity: good. Missing: float rounding policy, map/list iteration order, JSON canonicalisation for `Plan.id = hash(...)` |
| `on_unknown` for invariants | MINOR | All 31 INV records carry `fire`. For an assertion, does U mean violated (repair) or pass? Propose: U = violated |
| `hold` | CLEAR | 12 §3.2 rule 4 (MSG-SAF-HOLD, no flag on unknown) |

## 5. Data model

| Topic | Status | Finding |
|---|---|---|
| Entities | CLEAR-ish | 12 §2 lists 30 entities with key fields, but with no types beyond enums. |
| Path typing | UNDERSPECIFIED | None of the 417 paths has an explicit type. 116 say only "§2 entity field / engine value". About 60 labelled as §2 fields are absent from §2: `claim.agegrade_pct`, `claim.time_distance_inconsistent`, `entry.is_goal_race`, `entry.is_race`, `entry.ladder`, `entry.resolution`, `goal.edits`, `goal.race_status`, `m.eligible`, `profile.special_status`, `profile.b2b_opt_in`, `profile.saf031_attested_on`, `screen.masters_checked`, `week.e3_touches`, `week.quality_max`, `week.strides_allowed`, … About 33 `event.*` payload fields have no type or value set (`event.gap_cause`, `event.level`, `event.option_chosen`) |
| Inconsistent use | BUG/MINOR | (1) **INV-05 and SAF-020 test `f.kind in flag.pause_kinds`, but `pause_kinds` lists *subkinds*.** Only `illness` matches, so the pause invariant is vacuous for cardiac, bone-stress and heat flags (07 INV-05 prose says subkind). (2) `profile.special_status` is used as a scalar, but SpecialStatus is a record and a runner can be both minor and pregnant. (3) `Demand.L_req_peak (time, dist)` vs paths `demand.L_req_time_s`. (4) `Session.run_walk_ratio` vs `s.run_walk`. (5) `effort_profile` values "E4/E5", "E5 uphill". (6) `INP-007` writes a map into `profile.availability_defaults`, but the rules read `profile.available_days` |
| Parameters | **BLOCKER (MVP)** | parameters.md is a prose table. Map-valued defaults, "4 (3 via deload.every_ctx)", "TOL ≥ 4: no cap", and multi-id rows (`a / .b`) must be hand-converted. There is no machine registry with types and keys (INV-12 and `p()` need one) |
| Persistence | **BLOCKER** | Rules write `state.probation_until`, `state.adp052_events`, ladder rung, levels, flags, and `until` conditions. 07 §2 says `plan = f(profile, goal, log, today, versions)` with no hidden state. The spec must say which fields are stored inputs and which are recomputed |

## 6. MVP (5K/10K/HM, `method_default`) vs later

Blocks the MVP engine:
- Q1–Q5: binding, write semantics, fixpoint, persistence, null semantics.
- REP records (S8r).
- `effort_rank` E5: strides are in every preset.
- INV-05 kind/subkind.
- SES-005 weekday.
- Machine parameter registry.
- 27 MVP `text_only` rules (B-4). S7 cannot choose or dose sessions without CMP-007, SES-004/006/007/011/012/013/016 and DST-001/002. CMP-008 and NUT-010…013 matter only for HM (> 90 min goal races).
- Procedures `water_fill`, `place_in_order`, `dry_run_weeks_needed`, `decay`, `t0t3_limit`.

Does **not** block the MVP:
- the 38 `spec`-release text_only rules (DST ultra/marathon, NUT race fuelling, PHS-012/016 seasons, presets);
- b2b semantics (`same_pair`, INV-03 pair branch, DST-010/011);
- INV-28/29 (> 180 min expected duration; unreachable for 5K–HM except very slow HM runners, so keep them as live checks);
- `generate_options` kinds `alternative_preset` (other presets are pending_fixture).

Note: every formal or procedure record is tagged `release: MVP` (283 of 321), including marathon/ultra-only logic. The engine cannot prune by release, so it must implement every op anyway.

## 7. Questions the engine session must resolve (priority order, with proposed defaults)

**Q1. Rule binding and stage map (blocker).**
- Add `stage` (S0…S10 | on_entry | on_event) and `scope` (`global | per_week | per_session | per_entry | per_node | per_flag | per_option | per_candidate`) to each record. Publish an event-type catalogue: 44 values, internal hooks marked, emitter and stage for each.
- *Default:* derive `scope` from the condition's roots (session > week > entry > node > flag > global). Treat internal hooks as fixed pipeline callbacks in the order of 07 §2. Put the map in a new 12 §3.5, and check it in TST-121.

**Q2. Write composition (blocker).**
- *Default:* collect all actions first, then resolve per target:
  - numeric: `final = min(T0–T3 caps, max(T5 floors, min(T4–T6 caps, last set by priority)))`;
  - ordinal enums (`effort_ceiling`, `progression_profile` slow < standard, `gate`, verdict): most restrictive wins whatever the tier, so `set` on these acts as cap/floor on the order;
  - other non-numeric `set`: lowest (tier, nnn) wins.
- Read PRIORITY as "first by priority **per target**", not per tier. Fix FEA-013 to a floor on `verdict_rank` (or drop it, since FEA-036 already makes ANCHOR_UNKNOWN stretch).

**Q3. Evaluation loop (blocker).**
- *Default:* within each stage, evaluate in (tier, nnn) order and apply after each tier. Re-run the stage until no target changes, bounded by `engine.max_iterations = 5` (new eng parameter); on non-convergence fail closed with reason ENGINE_NONCONVERGENT.
- Forbid `regenerate` and `record_event` from re-triggering inside the same re-plan: queue them for the next batch (ADP-012).

**Q4. Persistence (blocker).**
- *Default:* split DerivedState into (a) **recomputed** (V7/V28/L30, tol_tier, levels from log, gate) and (b) **stored engine state**, a new entity `EngineState` with `probation_until`, `adp052_events`, `ladder_*`, `pace_anchor_10k_equiv_s`, active blocks/freezes with their `until`, and flags. Stored state becomes an explicit input to `f(...)`, so determinism holds.

**Q5. Blank / null / unknown (blocker).**
- *Default:*
  - A field the runner was **asked** and skipped is U.
  - A field **not asked or not applicable** (`target_time_s` for finish goals, pain when no pain tap shown, `planned_distance_m` on ladder sessions) is `null`. A comparison with `null` gives `false` for `<,>,<=,>=` and true equality for `== null`.
  - Helpers return `null` for "none". `first()` returns `null`, not U.
  - Absent derived values with a natural "never" (`last_reds_screen`, `last_field_test_date`) are `null`.
- Re-check the 40 unguarded reads, especially ADP-052/053 (T0/T1 `fire`). Implement the 12 §3.4-7b unguarded-optional lint.

**Q6. Fix four spec bugs before coding.**
- (a) INV-05 and SAF-020: `f.subkind in p('flag.pause_kinds')`.
- (b) `effort_rank`: add E5. *Default:* rank E5 = E3 for spacing and hard-day rules, and keep it outside TID shares (it is strides).
- (c) SES-005: `weekday(session.date) in profile.available_days`.
- (d) FEA-013: floor, not cap, on `verdict_rank`.

Also: map `adaptation_event` to "any AdaptationEvent kind"; add `goal_edit` to AdaptationEvent.kind or drop that `record_event`; settle INV-05 vs GEN-003 off-by-one (*default:* at most 3 repair passes, the 4th failing validation → S9).

**Q7. Repair as records (blocker).**
- Encode REP-001…006 as records with `fixes: [INV-ids]`.
- *Default:* pick the earliest violating session by date, then the lowest INV id. Apply the lowest-rank REP whose `fixes` list contains the INV, then re-validate. One pass = one full validate + all repairs at the earliest date.
- REP-005/006 call S4/S3 as procedures. Removed volume is dropped (07 §6.1).

**Q8. Machine parameter registry (blocker for MVP).**
- *Default:* `parameters.json` generated from parameters.md, with `{id, type (number|int|bool|enum|set|map), unit, default, keys, range, preset_overrides, limit_direction (upper|lower|none), grade, basis}`.
- `limit_direction` drives the `override` MIN/MAX: upper limit → MIN, lower limit → MAX. This settles "MIN for limits".
- Declare the dynamic-id families (`prog.<profile>.week_max`, `gap.vol_factor.<band>`, `log.pace_max_s_per_km.<type>`, `tid.hard_share_max.<family>`).

**Q9. Formalise the 27 MVP text_only rules (B-4) and the five underspecified procedures.**
- *Default:* `water_fill` = integer-second greedy fill of the shortest easy session, ties broken by earliest date, step `load.round_down_s`, day cap = `min(LR, two_day caps)`.
- `place_in_order` = long run on `long_run_day` (else the last free day); key sessions on the free days that maximise the minimum gap to other hard days, ties broken by earliest date; easy runs on the remaining earliest free days.
- `dry_run_weeks_needed` = iterate S4 layout ↔ G at most 3 times, else take the larger.
- `decay` = −1 per full `decay_weeks` of the gap, floor 0.
- `t0t3_limit` = an explicit list of the T0–T3 cap rule ids per target.

**Q10. Op-level details (minor; decide once, document in a new 12 §3.3b).**
- `insert_phase`: insert at the current week. Shift later phases right; if they no longer fit, re-run S4 (which may fail closed). RTR length = ladder rungs ÷ runs per week; TRANSITION length = `phs.transition_weeks[d]`.
- `move_session`: same weekday in the target week, else the next free day; re-validate.
- `schedule_session`: the first non-deload, non-taper week from today. It replaces the week's easy session of nearest duration and keeps the week total.
- `freeze`: `fields` given → unchanged; otherwise → no increase.
- `route`: evaluate the named rule(s) immediately with the current event. An alternation means both. A module id means all of that module's rules bound to the event.
- `until`: store it as a predicate; re-evaluate at every re-plan and event; a date means `today >= date`.
- `then`: sequential, each step sees earlier writes; `when` uses the record's `on_unknown`.
- Accept the 20 extra fields by adding them to the §3.3 schema, and have the build reject unknown fields.

**Q11. Time and determinism (minor).**
- *Default:* all dates are in the runner's profile timezone; `date_end` = local 23:59:59.
- Round half-down to int seconds and metres after every arithmetic assignment.
- Canonical JSON (sorted keys) for `Plan.id`.
- Settle the E vs U precedence against the chosen CEL library and freeze it in TST-126.

**Q12. Types for every path (minor, but needed for codegen).**
- Add a type column to 12 §2b.2, generated with the paths.
- Declare the comprehension-element fields (`s.is_run`, `s.is_hard`, `w.has_e3_touch`, `x.tier`, …) and the event payload schemas per `event.type`.
- Extend `check_rules_v5.py` to check comprehension fields and bare identifiers (`today_events`, `next_session_E3`, `progression`).

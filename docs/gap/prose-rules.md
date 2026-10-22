# Gap analysis: the 27 MVP rules still in prose (release blocker B-4)

Spec analysed: `design/v5` (frozen; identical to `spec/` in this repository apart from `rationale.md`). Nothing in the spec was changed.
Written 22 Oct 2026 for the Engine session, part A (`handoff/1-engine-part-A.md`).

Conventions used below:

- "Machine record" = the `rulexpr` JSON line of 12 §3.2 (condition, `on_unknown`, typed action of 12 §3.3).
- "Op" = an action op of 12 §3.3. "Helper" = a function of 12 §2b.3. "Path" = a field path of 12 §2b.2. A path or helper marked **new** does not exist yet and must be added to 12 §2b before TST-121 can pass.
- Every proposed value is a **design default, unvalidated**. Where a coaching source is named, it is cited from memory: **ALLEGED** at most.
- "13 constrains" means a worked example in module 13 already fixes the answer, so the formal record must reproduce it (or 13 must be corrected and the correction logged).

---

## 1. Summary

### Counts

| Difficulty | Count | Rules |
|---|---|---|
| EASY (transcription) | 8 | PHS-013, PHS-015, SES-013, SES-017, SES-019, DST-001, DST-005, NUT-012 |
| MEDIUM (1–3 design choices) | 16 | CMP-008, PHS-014, SES-004, SES-006, SES-007, SES-010, SES-015, SES-016, SES-018, DST-002, DST-004, DST-006, DST-007, NUT-010, NUT-011, NUT-013 |
| HARD (real design decision) | 3 | CMP-007, SES-011, SES-012 |

Three of the 27 are **not reachable in the MVP profile** (5K/10K/HM, `method_default`): PHS-015 (ultra only), DST-007 (marathon only) and SES-019 (`norwegian_elite` only). They can be transcribed in minutes, but the better fix is to retag them `spec` in `tools/build_rules.py` (see §4.9). Conversely, at least five text-only rules that MVP code paths **do** reach are not tagged MVP (DST-018, SES-020, SES-021, NUT-040, FEA-026); see §4.9.

### The real design decisions (5)

1. **Which ability each hard session trains** (CMP-007 with DST-002). The formula is given, but "eligible node", the node→module mapping, what happens to the second slot of the week, the "rotate by week index" fallback, and the clash between DST-002 ("no candidate → easy run") and CMP-007 ("never an easy run") are not. This is the core of the weekly session choice.
2. **How a hard session grows from one week to the next** (SES-011, with SES-016 and SES-015). Doses are prose ("3×5 min → 5×8 min (+1 rep or +1 min/rep)"), there is no target RPE per effort level, no stored "current dose", and no policy for how future weeks are shown before the runner has logged the previous one.
3. **When a level test is scheduled and how it is judged** (SES-012, SES-013). The trigger "dose max reached" does not match the tests (the THR L1 test, 2×8 min, is far below the SES-M-008 maximum of 5×8 min), and no rule turns a logged test into a pass/fail: "drift-free" needs an RPE for the last 20 minutes, which the log does not record.
4. **How many hard days, and where** (SES-004, SES-006, SES-007). Whether the long run counts as a hard day for spacing, whether a 3-run week may hold 2 hard sessions, the missing phases (TAPER, RACE, MAINTAIN, SHARPEN), and whether the weekly hard-minutes budget (LOD-033) limits the count.
5. **Fuelling practice schedule** (NUT-010…013). Which long runs are practice runs ("late BASE" is undefined), the step size (the register gives a range, 10–15 g/h), and what "reaching the level's band" means.

### Biggest cross-cutting finding

Module 07 does **not** orchestrate these rules: stage S7 is one table row ("06 modules chosen by CMP-007 among eligible modules; placed on available days"). The order in which count, choice, placement, dose, deload/taper overrides, long-run content, TID trimming and rendering happen is not written anywhere, and two priorities point the wrong way (CMP-007 T4 outranks DST-018 T5, which is meant to force race-effort sessions). The only worked plan with key sessions (P3 Ana, marathon) cannot be reproduced by CMP-007, SES-011 or SES-016 as written, and no worked example shows key sessions for any MVP distance. See §4.

---

## 2. Summary table

| Rule | Module § | Meaning (one line) | Difficulty | Ops (existing / **new**) | 13 constrains? |
|---|---|---|---|---|---|
| CMP-007 | 02 §4 | Choose the ability a hard-session slot trains: largest weighted gap, else preset rotation, else strides | HARD | `set` slot.module; **new helper** `weighted_gap`, **new** node data | P3 contradicts it (§3); no MVP example |
| CMP-008 | 02 §4 | Races > 90 min require FUEL L2; > 2.5 h require FUEL L3 | MEDIUM | `set` (as FEA-004) | P3 (FUEL L2 for M) consistent |
| PHS-013 | 04 §5 | After the goal race, insert TRANSITION of `phs.transition_weeks[distance]` | EASY | `insert_phase` (already used by ADP-065) | P3/P5 rows 19–20, 25–26 |
| PHS-014 | 04 §5 | After `maint.max_weeks` of MAINTAIN: field test + warning | MEDIUM | `schedule_session`, `emit_message` (**new msg**) | none |
| PHS-015 | 04 §5 | Ultra: BUILD VO2 → THR → steady; SPECIFIC DUR/MSP/FUEL | EASY (not MVP) | `set` / defer to DST-003 | P5 (BUILD split) |
| SES-004 | 06 §4 | Hard days never consecutive; maximise the smallest gap; ties to the earlier day | MEDIUM | `constraint` + procedure `place_in_order` | P3 (key Tuesday) constrains the spacing reading |
| SES-006 | 06 §4 | Weekly key-session count = MIN(preset count, method_default count, placeable count) | MEDIUM | `cap` week.quality_max | P3 SPECIFIC shows 1, rule gives 2 |
| SES-007 | 06 §4 | method_default count by phase and level: 0 / ≤1 / 2 | MEDIUM | `set` week.quality_max | P1, P2, P3 |
| SES-010 | 06 §4 | Run-walk ratio ladder: move up after 2 easy, pain-free sessions; never skip | MEDIUM | `set` (**new path** rung) | none (P1 uses the start ladder, a different rule) |
| SES-011 | 06 §4 | Next instance of a module steps up one dose step if the last one felt as expected | HARD | `set` (**new helpers** `next_dose`, `target_rpe`) | P3 THR doses contradict the step size |
| SES-012 | 06 §4 | At dose max for 2 instances and next-level prereqs held → schedule the exit test | HARD | `schedule_session` (+ **new** week field), **new** pass rule | none |
| SES-013 | 06 §4 | Failed / unlogged test → keep level, hold dose, retest after 3 weeks | EASY | `freeze`, `schedule_session` | none |
| SES-015 | 06 §4 | Non-race taper week keeps one sharpener and the run count | MEDIUM | `schedule_session`, `floor` | P3 wk 16–17 sharpener doses differ from `ses.taper_touch` |
| SES-016 | 06 §4 | Deload: ≤ 1 key session at its start dose; strides kept; no tests | MEDIUM | `cap`, `set`, `block_sessions` | P3 deload doses match neither SES-016 nor LOD-040 |
| SES-017 | 06 §4 | Effort word first; pace only via FEA-014; HR only from a measured reference | EASY | `constraint` | P2 FT-1, §6 card |
| SES-018 | 06 §4 | MAINTAIN week = SES-M-021 pack with one key session at its last dose | MEDIUM | `set`, `floor` | none |
| SES-019 | 06 §4 | norwegian_elite double threshold only with THR L4, AER L5, opt-in | EASY (not MVP) | `block_sessions`, `emit_message` | none |
| DST-001 | 09 §2 | Goal.family from Goal.distance | EASY | `set` | all personas |
| DST-002 | 09 §2 | Key-slot candidate nodes restricted to `dst.phase_nodes[family][phase]` | MEDIUM | `filter_candidates` | P5 only (not MVP) |
| DST-004 | 09 §2 | Hot race → HEAT L2 required and heat-exposure runs scheduled | MEDIUM | `set` (dup. FEA-004), `schedule_session` | none |
| DST-005 | 09 §4 | Short family: long runs all E1, no race effort inside | EASY | `constraint`, `filter_candidates` | P2 (implicit) |
| DST-006 | 09 §4 | HM time goal, SPECIFIC: every 2nd long run ends with an E3 segment, capped | MEDIUM | `replace_module`, `set` segment | none (no HM example) |
| DST-007 | 09 §4 | Marathon SPECIFIC: every 2nd long run with an E2 segment, capped | MEDIUM (not MVP) | as DST-006 | P3 SPECIFIC shows none |
| NUT-010 | 11 §3 | Race > 90 min: long runs ≥ 60 min become fuelling practice at the current step | MEDIUM | `replace_module`, `set` | P3 wk 6–10 constrain start and step |
| NUT-011 | 11 §3 | Two tolerated practice runs at the step → step + `fuel.step_g_h` | MEDIUM | `set` (**new path** fuel step) | P3: 30 → 45 g/h ⇒ step 15 |
| NUT-012 | 11 §3 | GI > 2 → hold; GI ≥ 5 → one step down | EASY | `set` | none |
| NUT-013 | 11 §3 | Two measured runs in the level's band with GI ≤ 2 → FUEL level n | MEDIUM | `set` levels (as CMP-002) | P3 wk 7 (L1), wk 10 (L2) |

---

## 3. Per-rule detail

### CMP-007 — key-session node choice (02 §4) — HARD

**Meaning.** For each hard-session slot, pick the ability (node) with the largest "weight × gap"; if nothing is behind, or the winner is a volume ability (AER, DUR), fill the slot from the preset's module list in BUILD/SPECIFIC, or with strides in BASE.

**Already precise.**
- `gap(N) = max(0, required_level(goal, N) − level(N)) / max_level(N)` (02 §4).
- Weights: `p('cmp.weight.<distance>.<node>')` (02 §5, registry). Required levels: `demand.required_levels[N]` (closed under prerequisites, 03 §2).
- Tie order DUR, THR, AER, MSP, VO2, ECO, FUEL.
- method_default module lists (06 §5): BUILD SES-M-008/010/012, SPECIFIC SES-M-011/005/009. Strides fallback SES-M-006.
- Tie between modules: lower ID (GEN-005, formal).

**Missing.**
- **"Eligible node"** is undefined. Is a node eligible when it has gap > 0, when it is in `dst.phase_nodes` (DST-002), when at least one module that trains its next level passes SES-001 (phase, preset, prereqs, effort ceiling), or all three?
- **Node → module.** Several modules train the same node (THR: SES-M-008 L1–L2, SES-M-009 L3–L4, SES-M-012 "support"). No rule picks one. Is the choice restricted to the preset's list for the phase (06 §5), or to the whole catalogue?
- **Second slot.** With 2 slots, the same argmax picks the same node twice. Nothing says whether a node may fill two slots in one week.
- **"Rotating by week index".** Which index (week of plan, week of phase, loading-week ordinal; do deloads count)? With 2 slots, which list entry does slot 2 take?
- **"Shown as such".** No message id for "strides instead of a hard session".
- **Distance `none`** (H0 base/maintain goals): there is no weight column, so the formula is undefined. BASE falls back to strides anyway, but MAINTAIN needs a key session (SES-018).
- **Fallback clash with DST-002**: DST-002 turns a slot with no eligible node into SES-M-001 (easy run); CMP-007 says a key slot must never become an easy run (F-09).
- **Priority clash with DST-018** (MSP every `dst.msp_every_weeks` for time goals in SPECIFIC): CMP-007 is T4.110, DST-018 is T5.458, so in PRIORITY hit policy CMP-007 always wins and DST-018 can never force its MSP session. DST-018 is also text-only and not tagged MVP.
- **Max level per node** is not a parameter (it is implicit in the 02 §2 table: HAB 4, TOL 5, AER 5, THR 4, VO2 3, ECO 3, DUR 5, MSP 3, FUEL 4, HEAT 2, PACE 3).
- `m.trains` is not a declared path in 12 §2b.2.

**Ops.** `set` on `slot.module` (or `replace_module`) is enough for the output. Needed new pieces: a helper `weighted_gap(node)` (or a declared derived list `demand.weighted_gaps`), a `sort_by`-based argmax (helpers exist: `sort_by`, `first`), a node table parameter `cmp.max_level.<node>` and `cmp.node_tie_order`, a path `week.phase_week_index`, and `m.trains`. Realistically this is a **procedure** (12 §2b.4) `choose_key_modules(week, k)`, specified in 06 or 07, with a record of status `procedure`.

**Design choices and proposed defaults (design default, unvalidated).**
1. *Eligible node* = in `dst.phase_nodes[family][phase]` **and** gap > 0 **and** at least one module of the preset's phase list (06 §5), or of SES-M-006/007 for VO2 L1/ECO L1, trains `(N, level(N)+1)` and passes SES-001. Rationale: keeps the choice inside the preset ("Frankenplan" rule, DST-016).
2. *Module for the node* = the lowest-level module whose `trains` contains `(N, level(N)+1)`, ties by lower ID. So THR at L0–L1 → SES-M-008, THR L2+ → SES-M-009.
3. *Second slot* = re-run the argmax with the first slot's node removed; a node fills two slots only when it is the only eligible node. Daniels' "2Q" weeks and Pfitzinger's mesocycles pair two different stimuli (e.g. threshold + VO2 or threshold + race pace) [ALLEGED, from memory].
4. *Rotation index* = number of loading weeks completed in the current phase (deloads not counted), slot j takes list entry `(index + j) mod len`.
5. *Fallback chain* (replaces DST-002's easy-run fallback): weighted node → preset list rotation (BUILD/SPECIFIC) → strides on an easy run (SES-M-006) → easy run only if strides are not allowed (RTR, TRANSITION, effort ceiling). Message: new `MSG-SES-STRIDES-SLOT`.
6. *DST-018 interaction*: apply DST-018 **after** CMP-007 as an override of slot 2 (or slot 1 when only one), every `dst.msp_every_weeks`-th SPECIFIC loading week; give it a priority in T4 below CMP-007, or make it part of the procedure. Formalise DST-018 in the same pass and tag it MVP.
7. *Distance none*: BASE → strides (as written); MAINTAIN → SES-018's rule (last key module).

**13.** For MVP distances no example shows a key session (P1 Maya: start ladder, 0 slots; P2 Tom: ONBOARD weeks only). **P3 Ana (marathon finish) contradicts CMP-007**: her required levels (HAB 2, AER 3, TOL 3, DUR 3, FUEL 2, closed) contain no THR level, so THR has gap 0 and can never win; in BASE the rule gives strides, yet 13 shows a progression run (wk 3) and THR intervals (wk 5–8); in BUILD it would rotate SES-M-008/010/012, yet 13 shows a steady run (SES-M-013, not in the list) and SES-M-009 (a SPECIFIC-list module, and her THR prerequisites for it are not shown). The P3 key-session column must be regenerated once the procedure exists. It is not part of the oracle fixtures (TST-110…112 cover demand, weeks needed and the long-run curve), so this does not block the oracle.

---

### CMP-008 — fuelling required by race duration (02 §4) — MEDIUM

**Meaning.** If the race should last more than 90 minutes, the plan must build FUEL L2; above 2.5 hours, FUEL L3.

**Already precise.** `fuel.required_above_min` 90; `fuel.l4_min_race_h` 2.5; write target `demand.required_levels.FUEL` (FEA-004 shows the pattern: `max(current, level)`).

**Missing.**
- **Expected race duration** `goal.expected_duration_s` is listed in 12 §2b.2 as a "§2 entity field", but neither 12 §2 (Goal) nor 03 §2 defines it. 11 §4 says "slow end of the predicted band (`predicted_band.high_s`)", which does not exist for a finish goal without an anchor (common in MVP). Then the value is unknown and the rule's behaviour depends on `on_unknown`.
- Parameter naming: the L3 threshold is called `fuel.l4_min_race_h` (it is also the NUT-014 L4 threshold). Works, but misleading.
- Consequence not discussed: FUEL L3 has prerequisite MSP L1 (02 §3), and MSP L1 needs THR L1. A slow half-marathon **finisher** (run-walk, 2 h 40) would, after prerequisite closure, need THR L1 and race-effort work, adding key-session weeks through FEA-021. That may make slow HM finish goals infeasible for a reason the runner would not understand.
- 02 §5's table gives marathon FUEL by goal type (finish 2, time 3), while CMP-008 gives it by duration. Not MVP, but the two must agree.

**Op.** `set` on `demand.required_levels.FUEL` with `max(...)`, one record with a conditional expression.

**Design choices (design default, unvalidated).**
1. Expected duration = `predicted_band.high_s` when a band exists; otherwise race distance ÷ `S_slow` (03 §2 planning speed, already slow-biased); `on_unknown: fire` (assume long, the cautious side for fuelling). New definition line in 03 §2 and 12 §2.
2. For finish goals, require FUEL L3 only when the runner is not on run-walk at race effort E1–E2, or cap the requirement at FUEL L2 for finish goals and state that FUEL L3 is "recommended". Proposed default: **finish goals stop at FUEL L2** (race fuelling still follows NUT-020's band and tolerance cap). Rationale: avoids dragging THR/MSP into a finish goal through the prerequisite graph.

**13.** P3 Ana (marathon finish, ~4:40) reaches FUEL L2 in wk 10 and the table never asks for L3: consistent with choice 2, inconsistent with a literal reading (4:40 > 2.5 h → L3).

---

### PHS-013 — transition after the goal race (04 §5) — EASY

**Meaning.** After the goal race (run or abandoned), insert a recovery block of 1–2 weeks before any new base.

**Already precise.** `phs.transition_weeks` (5K/10K/HM 1; M 2; ultra 2). ADP-065 already has a formal record that inserts TRANSITION on `goal.race_status in ['done','abandoned']`, without a length. LOD-054 (formal) sets the transition dose.

**Missing.** Length expression in the action; 12 §3.3 describes `insert_phase` as "RTR or START_LADDER" only (ADP-065 already uses it for TRANSITION, so the op description must be widened); what happens when the race date passes and nothing is logged (unlogged race: ADP-003 territory).

**Op.** `insert_phase` with `phase: TRANSITION`, a new field `weeks_expr: p('phs.transition_weeks')[goal.distance]`. Either merge into ADP-065 or keep PHS-013 as the length rule with condition `event.type == 'goal_race_closed'`.

**Small choice.** Unlogged race: treat as done after `log.contemporaneous_window_h` and insert TRANSITION anyway (cautious).

**13.** P3 wk 19–20 (M, 2 weeks), P5 wk 25–26 (ultra, 2 weeks): consistent.

---

### PHS-014 — end of a maintenance block (04 §5) — MEDIUM

**Meaning.** After 15 weeks of maintenance, schedule a test and warn that long-race endurance is not being kept.

**Already precise.** `maint.max_weeks` 15; test choice can reuse SES-014's chain (SES-M-020 → 019 → 018, formal).

**Missing.** A counter path (weeks in the current MAINTAIN block; **new** `week.weeks_in_phase` or `state.maintain_weeks`); the warning message (no `MSG-PHS-*` exists; **new** `MSG-PHS-MAINT-LIMIT`); what happens after the test (04 §1 says "re-test" but not what follows).

**Ops.** `schedule_session` (module_expr as SES-014) + `emit_message`.

**Design choices.** After the test, start a new MAINTAIN block (counter reset) and show the "set a goal" prompt; do not auto-switch to BASE. If the test is not logged within a week, keep MAINTAIN and re-offer once (same as SES-013).

**13.** None.

---

### PHS-015 — ultra phase emphasis (04 §5) — EASY, not MVP

**Meaning.** For ultras, BUILD goes VO2 → threshold → steady; SPECIFIC focuses on endurance, race effort and fuelling.

**Already precise.** DST-003 implements it per week with `dst.ultra_build_split` 0.33/0.33/0.34; `dst.phase_nodes.ultra` row.

**Missing.** "steady" is not a node (SES-M-013 trains AER L3+ and MSP); nothing beyond DST-003.

**Op.** Redundant with DST-003 + `dst.phase_nodes`. Recommend: record as `static` pointer to DST-003, or **retag `spec`** (unreachable in the MVP profile, which has no ultra).

**13.** P5 BUILD wk 6–7 VO2, 8–9 THR, 10–11 steady: the split must reproduce it when ultra ships (R3).

---

### SES-004 — spacing hard days (06 §4) — MEDIUM

**Meaning.** Never put two hard days back to back; spread them as evenly as possible; when tied, use the earlier day.

**Already precise.** Hard day = any segment ≥ E3, or the long run when `quality.counts_long[preset]` (false for method_default). `preset.consecutive_hard_allowed` exists as a path. INV-17 (formal) checks the result. Procedure `place_in_order` exists (12 §2b.4).

**Missing.**
- Does the **long run** count as hard for *spacing* even when it does not count as quality? Literal reading: no. Then, with Tue/Thu/Sat/Sun available and 2 keys, "maximise the smallest gap" puts a key on **Saturday, the day before the long run** (Tue–Sat gap 4 beats Tue–Thu gap 2).
- Is the gap measured inside the week only, or across week boundaries (Sunday long run → Monday)?
- Effort E5 (strides, hill sprints) is outside `effort_rank` (indices E0–E4 only), so "segment ≥ E3" errors on strides. SES-021 says strides do not make a day hard; the helper must say so.
- The search space and tie-break must be stated exactly (the set of candidate days after SES-005 and the long run).

**Op.** `constraint` (no consecutive hard days) + the placement itself inside `place_in_order` (status `procedure`). Possibly a **new helper** `best_spacing(days, k, fixed_hard_days)`.

**Design choices (design default, unvalidated).**
1. **The long run counts as a hard day for spacing** (not for the quality count). Practice of Pfitzinger and Daniels plans: no hard session the day before the long run [ALLEGED].
2. **Gaps are measured inside the Monday–Sunday week**; INV-17 still forbids a hard day right after the previous week's last hard day.
3. If no valid placement exists for k keys, SES-006 lowers k by one (the slot with the lowest CMP-007 rank is dropped).

**13 constrains.** P3 Ana: one key on Tuesday with the long run on Sunday (days Tue/Thu/Sat/Sun). With choices 1 and 2: Tue (5 days to Sun) beats Thu (3) → Tuesday ✓. If gaps were measured across weeks, Thursday would win (✗). In wk 9–10 her second key is E2 (steady), which is not hard, so it does not test the 2-hard-day case.

---

### SES-006 — weekly key-session count (06 §4) — MEDIUM

**Meaning.** The number of hard sessions is the smallest of: the preset's number, the default method's number for this phase and level, and the number that can actually be spread out.

**Already precise.** `quality.per_week[preset]`, `quality.method_default` (SES-007), `quality.counts_long[preset]`; `week.quality_max` path exists and is already capped by LOD-034 (ONBOARD/RTR/TRANSITION/restricted → 0) and LOD-040 (deload → `deload.quality_max`).

**Missing.**
- "Largest count placeable under SES-004 and SES-005" is circular with placement; needs "try k, k−1, … until SES-004 succeeds".
- 05 §5 says the count also respects "the phase allowance of 04" (BASE 0–1, BUILD 1–2, SPECIFIC 1–3), which SES-006 omits.
- Nothing ties the count to the run count. At 3 runs a week, 2 keys + long run leave no easy run.
- Nothing ties the count to the weekly hard-minutes budget (LOD-033: E3+E4 ≤ 10% of weekly time for road_classic, i.e. HM). LOD-033 shortens segments instead, which can shrink a second session below its start dose.

**Op.** `cap` on `week.quality_max` with `min(...)`; placement test inside the placement procedure.

**Design choices.**
1. Add **key ≤ runs per week − 2** when a long run is planned (at least one easy run besides the long run). With 3 runs: 1 key; 4 runs: 2. Common novice/intermediate practice [ALLEGED].
2. Add a **budget term**: drop the last slot when the start doses of all slots would exceed the TID hard budget (E3+E4) or the E2 budget of LOD-033. This keeps sessions whole rather than trimmed.
3. Include the 04 phase allowance in the MIN.

**13.** P3 Ana SPECIFIC wk 13–15 show **one** key (THR) although SES-007 gives 2 (she has TOL L4 from wk 10). Only choice 2 (budget term) or a correction of 13 reconciles this: 2 × 15 min E3 = 30 of a 36-min budget, so a second E3 session cannot fit at its start dose. P3 BUILD wk 9–10 show 2 keys (THR + steady E2), consistent with choice 1 (4 runs → 2).

---

### SES-007 — method_default count by phase (06 §4) — MEDIUM

**Meaning.** Beginners get no hard sessions; base and low-tolerance runners get at most one; build and specific get two.

**Already precise.** 0 in ONBOARD, RTR, TRANSITION, or HAB < L2; ≤ 1 in BASE or TOL ≤ L2; 2 in BUILD and SPECIFIC. Paths `state.levels.HAB`, `state.levels.TOL`, `week.phase` exist.

**Missing.**
- Phases **TAPER, RACE, MAINTAIN, SHARPEN** (and START_LADDER) are not listed.
- "At most 1" is a cap, not a value: is BASE 1 or 0 by default? (CMP-007's BASE fallback is strides, which suggests the slot exists.)
- Precedence when the conditions overlap (e.g. BUILD with TOL L2 → 1).

**Op.** `set` on `week.quality_max` (or a new `quality.method_default` lookup) with a nested `?:`.

**Design choices.** TAPER 1 (the sharpener, SES-015); RACE week 0 (race + strides, 05 §7); MAINTAIN 1 (SES-018, LOD-055); SHARPEN = the count of the last completed non-deload week, at most 2 ("keep current key sessions", PHS-010); START_LADDER 0. BASE = 1 (the slot may become strides via CMP-007). Order of tests: 0-conditions first, then ≤1-conditions, then 2.

**13.** P1 Maya 0 (HAB < 2, ladder) ✓; P2 Tom ONBOARD 0 ✓; P3 Ana BASE 1 ✓, deload 1 ✓, BUILD 2 ✓, TAPER 1 (sharpener) ✓ with the TAPER default; SPECIFIC see SES-006.

---

### SES-010 — run-walk ratio ladder (06 §4) — MEDIUM

**Meaning.** For runners who run-walk outside the return and start ladders, move to the next run:walk ratio after two easy, pain-free sessions; hold after pain or a missed session; never skip a step.

**Already precise.** `ses.runwalk.ladder` (1:2, 1:1, 2:1, 3:1, 5:1, 8:1, continuous), `ses.runwalk.sessions_per_rung` 2, `ses.runwalk.rpe_max` 4, `pain.during_max` 3.

**Missing.**
- **Scope.** SAF-082 (formal) governs the RTR and start ladders with 3 clean sessions per rung. SES-010 must exclude them, or two ladders compete (exactly the F-17 problem SES-009 claims to solve).
- **State.** No path for the current run-walk rung (`state.ladder_rung_index` is the RTR/start rung). **New** `state.runwalk_rung`.
- **Entry rung** for a runner rendered as run-walk by SES-009 because HAB < L2 or by preference: SES-009 says "the ratio matching the last rung" only for ladder exits.
- "Missed session" is undefined (any missed run, or a missed run-walk run?). "Consecutive"? Does a partial session count? Is the next-morning pain rule included (SAF-082 includes it)?
- What happens at the top rung ("continuous"): run-walk rendering stops only when SES-009's conditions stop.

**Op.** `set` on `state.runwalk_rung` (`set_rung` targets the RTR ladder; reuse only if the target is made explicit). Condition over a **new** list path `log.runwalk_sessions_at_rung`.

**Design choices.**
1. Applies only when `state.ladder_kind == 'none'` (not on RTR/start ladders).
2. Count = the last 2 run-walk sessions logged at this rung, each done ≥ `miss.partial_ratio`, RPE ≤ 4, pain ≤ 3 during, and next-morning rule passed (same "clean" test as SAF-082 for consistency).
3. Entry: preference-only runners start at 2:1 (Galloway's common beginner ratio [ALLEGED]); HAB < L2 runners start at 1:1.
4. A missed planned run-walk session resets the count but does not lower the rung.

**13.** None (Maya is on the start ladder, governed by SAF-082).

---

### SES-011 — dose progression of a module (06 §4) — HARD

**Meaning.** If the last time you did this kind of session it felt no harder than intended, the next one is one step bigger; otherwise repeat it; never above the module's maximum or any safety cap.

**Already precise.** `ses.progress_rpe_margin` 1; dose start and max exist as prose in 06 §2 for each module; caps combine by MIN (INV-01/02, LOD-033).

**Missing.**
- **Dose ladders.** `ses.dose.<id>` is defined as "as §2 'Dose' column", i.e. prose. Examples: SES-M-008 "3×5 min → 5×8 min (+1 rep or +1 min/rep)" does not say which comes first; SES-M-010 "5×2 → 6×3"; SES-M-011 is a share of race time; SES-M-012 "40 → 70 min" with no step; SES-M-013 "30 → 90 min" with no step; SES-M-006 "4 → 8 × 15–20 s". Recoveries ("1–2 min") are ranges.
- **Target RPE.** Modules carry an effort level (E1–E4), not an RPE. No mapping effort → session RPE exists. The log has one RPE per session (`rpe_0_10`), which for an interval session includes warm-up and recoveries.
- **State.** No path for a module's current dose or its previous instance (`state.module_dose[mid]`, `log.last_instance(mid)`: **new**).
- **Projection policy.** Future weeks are generated before the runner logs the current one. Are future instances shown at projected steps (assuming success) or at the current dose until logged?
- **Module switches.** When THR moves from SES-M-008 to SES-M-009, what dose does SES-M-009 start at?
- Interaction with deload (SES-016 start dose), taper (SES-015), a missed instance, an RPE left blank (declared unknown), and LOD-006 (step-ups require answered pain prompts; does a dose step count as a "step up"?).

**Ops.** `set` on `session.segments` (or on the new `state.module_dose[mid]`) with **new helpers** `next_dose(mid, dose)`, `dose_start(mid)`, `dose_max(mid)`, `target_rpe(effort)`; the `cap` to INV/LOD limits already exists through REP-001.

**Design choices (design default, unvalidated).**
1. **Write each MVP module's dose as an explicit ordered list** in `ses.dose.<id>.steps`. Proposal "lengthen reps first, then add a rep" (common in Daniels-style cruise intervals and Hudson's gradual extension [ALLEGED]):
   - SES-M-008 threshold intervals: 3×5, 3×6, 3×7, 3×8, 4×8, 5×8 min E3, recovery 2 min E1 jog (fixed).
   - SES-M-010 VO2 intervals: 5×2, 6×2, 5×3, 6×3 min E4, equal-time E1 jog.
   - SES-M-012 progression run: 40, 50, 60, 70 min, last 15% at E3.
   - SES-M-013 steady run: 30, 40, 50, 60, 75, 90 min E2.
   - SES-M-011 race-pace intervals: accumulated share 0.10 → 0.20 → 0.30 of expected race time (then L3 shares), in reps of ≤ 10 min (5K/10K) or ≤ 15 min (HM).
   - SES-M-006 strides: 4, 6, 8 × 20 s.
2. **Target session RPE** (CR-10, whole session): E1 3, E2 5, E3 6, E4 7 (session RPE of an interval session sits below the RPE of the hard reps because warm-up and recoveries are included; Foster's session-RPE method [ALLEGED]). With margin 1: step up when logged RPE ≤ target + 1.
3. **Unknown RPE → repeat the dose** (no step on missing data, as LOD-006).
4. **Projection:** future instances are shown at the projected next step **once**, not compounded: the plan shows "next step" for the next instance and holds later instances at that step until the log confirms. Reductions after a failed step are always allowed (INV-04 permits reductions).
5. **Module switch:** a new module starts at its own start dose, unless the previous module's accumulated hard minutes were higher; then start at the first step of the new module whose accumulated minutes ≤ the last logged accumulated minutes.
6. After a deload or taper, resume at the last completed dose (not the deload dose).

**13.** P3 Ana's THR column (3×5 → 3×8 → 3×8 → 2×8 deload → 4×8 → SES-M-009 2×15) **cannot be produced** by "+1 rep or +1 min/rep" (3×5 to 3×8 is +3 min/rep in one step). With proposal 1, wk 5 3×5 → wk 6 3×6 → wk 7 3×7. The table must be regenerated (not an oracle fixture). P5 VO2 5×3 → 6×3 is one step under proposal 1 ✓, but P5 starts above the SES-M-010 start dose (5×2) without explanation. Also the §6 card for Ana uses 15-min warm-up and cool-down and 3-min recoveries, while `ses.warmup_s` = 600 s, `ses.cooldown_s` = 300 s and SES-M-008 recovery is 1–2 min: the card and the parameters disagree.

---

### SES-012 — when to schedule an exit test (06 §4) — HARD

**Meaning.** When a session type has been done at its maximum twice and the next level's prerequisites are in place, replace the next normal week's session with the level test.

**Already precise.** `ses.exit_ready_sessions` 2; tests per level in 06 §3 and §2b; `level_prereqs_hold(node, n, d)` helper exists; excluded weeks: deload, TAPER, RACE (`week.is_deload`, `week.phase`).

**Missing.**
- **Trigger does not match the tests.** SES-M-008 trains THR L1–L2 with max 5×8 min, but the THR L1 test is 2×8 min E3. A runner reaches 5×8 (40 min E3) before being allowed to test for L1, which is far beyond the test. Same for SES-M-010 (max 6×3; VO2 L2 test 5×3).
- **Which test** a module leads to is a table in 06 §2b/§3, not data (for example `ses.exit.<node>.<level>` → module + criterion).
- **Pass/fail.** No rule evaluates a logged test. CMP-002 waits for `event.type == 'exit_test_passed'`, which nothing emits. "Drift-free" needs the RPE of the last `ses.drift_window_min` minutes, "talk test held throughout", "every rep completed at E4": none of these are fields of `ActivityRecord`.
- "Next week that is not deload, TAPER or RACE": also exclude weeks that already hold a field test (SES-014) or a fuelling-practice rehearsal? Two tests in one week are not forbidden.
- `schedule_session` has only `module_expr`; it has no week/date field.

**Ops.** `schedule_session` with a **new** field `week_expr` (or `date_expr`), plus `replace_module` on that week's instance. A **new rule** (proposed id SES-024, T5) for test evaluation: `set` an `event` of type `exit_test_passed` / `exit_test_failed`.

**Design choices (design default, unvalidated).**
1. **Trigger on the test's own size**: schedule the test for level n+1 when the module has been logged at a dose ≥ the test dose for `ses.exit_ready_sessions` consecutive instances with RPE ≤ target + margin. Example: THR L1 test after two logged SES-M-008 sessions of ≥ 2×8 min. The dose may keep growing afterwards.
2. **Test log**: on a test session the app asks three extra one-tap questions: "Did you finish every part as planned?", "Could you hold the effort to the end without slowing down or walking?", "Any pain?". Pass = yes, yes, pain ≤ `pain.during_max`, next-morning rule passed, logged within `log.contemporaneous_window_h`, and session RPE ≤ target + `ses.drift_rpe_max`. This replaces the per-segment RPE the log cannot provide. New ActivityRecord fields `test_completed`, `test_held_effort`.
3. One test per week at most; SES-014 field tests take precedence.

**13.** None.

---

### SES-013 — failed or unlogged test (06 §4) — EASY

**Meaning.** A failed or missing test changes nothing except that you keep training at the same level and try again three weeks later.

**Already precise.** `ses.exit_retest_weeks` 3; "keep the level" (no op needed); "continue at dose max".

**Missing.** "Not logged" deadline (use `log.contemporaneous_window_h` after the planned date); the reschedule week skips deload/taper/race weeks like SES-012; a path for test status (**new** `session.test_result` or `state.exit_test_due[node]`). Under SES-012 choice 1, "dose max" should read "the dose at which the test was triggered".

**Ops.** `freeze` on `state.module_dose[mid]` until the retest, then `schedule_session` with `week_expr = current week + ses.exit_retest_weeks` (same new field as SES-012). A short `emit_message` (**new** `MSG-SES-TEST-AGAIN`, plain "Not this time; we'll try again in 3 weeks").

**13.** None.

---

### SES-015 — taper keeps a sharpener and the run count (06 §4) — MEDIUM

**Meaning.** In each taper week except race week, if the runner did hard work before the taper, keep one short sharp session and the same number of runs.

**Already precise.** SES-M-024; `taper.freq_min_ratio` 1.0; paths `plan.pre_taper_had_e3`, `plan.pre_taper_runs`. LOD-051 (formal) already floors `week.runs` and `week.e3_touches`; INV-08 checks it. SES-015's only addition is "the touch is SES-M-024".

**Missing.** Which form of `ses.taper_touch` ("4×1 min E4 or 2×5 min E3"); "work scaled by the week's cut" (LOD-051) vs a fixed touch dose.

**Ops.** `schedule_session` (module SES-M-024) unless one exists; `floor` week.runs (already LOD-051, so reference it).

**Design choices.** Form = E3 (2×5 min) when the last pre-taper key session was threshold or race effort, E4 (4×1 min) when it was VO2; dose fixed at the `ses.taper_touch` value (not scaled), because it is already short.

**13.** P3 wk 16 "2×8 min E3", wk 17 "2×5 min": wk 16 matches neither `ses.taper_touch` (2×5) nor a cut-scaled THR session; correct 13 or the parameter. P5 shows "sharpener" without dose.

---

### SES-016 — deload week sessions (06 §4) — MEDIUM

**Meaning.** In a lighter week: at most one hard session, at its starting size; strides stay; no tests.

**Already precise.** `deload.quality_max` 1 (LOD-040 already caps `week.quality_max`); "strides kept"; tests SES-M-018/019/020 and exit tests are known module ids.

**Missing.** **Conflict with LOD-040**, which says the deload's quality work is "cut by `deload.volume_cut` (25%) and intensity kept", not reset to the start dose. Which session survives when 2 were planned (CMP-007 rank 1?).

**Ops.** `cap` week.quality_max (exists in LOD-040), `set` dose = `dose_start(mid)` (new helper of SES-011), `block_sessions` with filter on test modules until the week ends.

**Design choice.** Take the **smaller** of the two readings, as the spec does for every numeric limit (MIN): dose = min(start dose, 0.75 × last dose). In practice this is the start dose. Keep the slot ranked first by CMP-007.

**13.** P3 deloads: wk 8 "THR 2×8 min" (16 min E3; start dose 15, 75% of 24 = 18), wk 12 "THR 2×10 min" (20; start dose of SES-M-009 15, 75% of 30 = 22.5): **neither reading reproduces 13**. Correct 13 after the decision. P5 "1 short key" is compatible.

---

### SES-017 — effort first, pace only from the model (06 §4) — EASY

**Meaning.** Every session is described by effort first; a pace range only when a fresh measured result exists; heart-rate only from a measured value.

**Already precise.** FEA-014 (procedure, formal) attaches pace only when INV-15 allows; INV-09 and INV-15 (formal) enforce HR and pace limits; messages MSG-SES-* hold the effort words.

**Missing.** Nothing substantive; "effort first" is a display-order rule.

**Op.** `constraint` (render check: `session.effort_target` present; `!has(session.pace_range) || <INV-15 condition>`; `!has(session.hr_zone) || hr_source measured`). Could be `static` (render lint) like GEN-004, which TST-121 accepts.

**13.** P2 Tom gets paces only after the measured FT-1; §6 card shows effort words first: consistent.

---

### SES-018 — maintenance week (06 §4) — MEDIUM

**Meaning.** In a maintenance block, plan at least two runs a week, one of them a hard session at the last size the runner did.

**Already precise.** SES-M-021; `maint.sessions_min` 2; LOD-055 (formal) floors runs, volume and one E3+ touch.

**Missing.** **Which** key session (there is no goal distance for weights, see CMP-007); "last logged dose" when the runner never logged a key session; whether ADP-071 "busy" maintenance weeks (`week.kind = maintenance`) use the same pack.

**Ops.** `set` slot.module + dose from the new dose state; `floor` runs (LOD-055 already).

**Design choices.** Key = the most recently logged key module (any phase); if none, SES-M-008 at start dose when THR L1 prerequisites hold (THR L1 ⇐ AER L1, HAB L2), else strides (SES-M-006). Apply the same rule to ADP-071 busy weeks.

**13.** None.

---

### SES-019 — Norwegian double threshold (06 §4) — EASY, not MVP

**Meaning.** The elite "double threshold" preset is allowed only for very advanced runners who opt in, with a warning.

**Already precise.** THR L4, AER L5, opt-in, label "untested in amateurs", fallback DST-016.

**Missing.** A profile field for the opt-in (**new** `profile.double_threshold_opt_in`), a message id (**new** `MSG-SES-NOR-UNTESTED`); DST-016 is text-only and not MVP.

**Op.** `block_sessions` (double-threshold days) `unless` the three conditions; `emit_message`.

**Recommendation.** Retag `spec`: the MVP profile is `method_default` only, so this rule can never fire there.

**13.** None.

---

### DST-001 — goal family (09 §2) — EASY

**Meaning.** 5K/10K are "short", half and marathon "road classic", 50K/100K "ultra".

**Already precise.** Full mapping.

**Missing.** Distance `none` (goal types maintain/base): 12 §2 lists family `base` for these; DST-001 omits it.

**Op.** `set` goal.family with a nested `?:` (or `{'5K':'short',...}[goal.distance]` if map literals are allowed in action expressions; 12 §3.2 allows maps in actions). Condition `event.type in ['goal_created','goal_edited']`. Basis `eng`.

**13.** All personas use the right family.

---

### DST-002 — candidate nodes by family and phase (09 §2) — MEDIUM

**Meaning.** Only abilities listed for this race family and phase may be chosen for a hard session.

**Already precise.** `dst.phase_nodes` = the 09 §3 table (registry entry exists).

**Missing.**
- The table cells are not clean data: level-qualified entries ("VO2 L1 (strides)", "THR L1"), modifiers ("MSP reduced"), a module ("+ SES-M-024"), an ordering arrow for ultra, and a non-node ("steady").
- Phases ONBOARD, RTR, TRANSITION, MAINTAIN, SHARPEN, RACE have no row.
- Fallback "slot becomes SES-M-001" contradicts CMP-007 (see there).

**Op.** `filter_candidates` (exists) on `slot.candidates` with `node.id in p('dst.phase_nodes')[goal.family][week.phase]` plus a level ceiling.

**Design choices.** Encode each cell as a list of `{node, max_level}` (e.g. short BASE: AER 5, DUR 5, ECO 1, VO2 1, THR 1); TAPER rows are handled by SES-015, not CMP-007; phases without a row → empty list (no CMP-007 slots); SHARPEN uses the SPECIFIC row; fallback per CMP-007 choice 5.

**13.** P5 (ultra, not MVP) shows the BUILD order. Nothing for MVP.

---

### DST-004 — hot race (09 §2) — MEDIUM

**Meaning.** If the race will be hot, heat readiness becomes a required ability and heat-exposure easy runs are scheduled before the race.

**Already precise.** The required-level half is **already formal** in FEA-004 (`demand.required_levels.HEAT`). SES-M-022 exists (E1, phases SPECIFIC and TAPER, prereq AER L2). `heat.acclim_window_days` 21.

**Missing.**
- "Schedule SES-M-022 per 11" points to NUT-040, which is text-only **and not tagged MVP**.
- `heat.acclim_days` is a range (7–14), not a value.
- SES-M-022 needs AER L2; a 5K finish goal requires only AER L1, so after prerequisite closure HEAT L2 adds AER L2 (more weeks, possibly infeasible) — not discussed.
- The app cannot make the weather hot: does a planned "heat run" count only when logged with `conditions_hot`? Is extra clothing allowed as a substitute?

**Ops.** Keep FEA-004 for the level; DST-004 becomes `schedule_session` (module SES-M-022) replacing easy runs inside the window (or delegate to NUT-040 with `route`).

**Design choices.** `heat.acclim_days` = 10 (middle of the range); replace up to 10 easy runs (not the long run, not key sessions) in the last 21 days with SES-M-022, at E1, ≤ 60 min, in the warmest part of the day the runner chooses; count an exposure only if logged with `conditions_hot`; no clothing-based protocol (safety). Formalise NUT-040 with it and tag it MVP.

**13.** None.

---

### DST-005 — short-race long runs stay easy (09 §4) — EASY

**Meaning.** For 5K and 10K, the long run is always an easy run; race-effort work is done in the hard sessions only.

**Already precise.** Module SES-M-003, effort E1.

**Missing.** Nothing; strides after the long run are allowed by 09 §4 ("strides may follow"), which the record should not forbid.

**Op.** `constraint`: `goal.family != 'short' || all(plan.long_runs, lr, lr.module_id == 'SES-M-003' && all(lr.segments, g, effort_rank(g.effort) <= effort_rank('E1')))` (strides excluded through the E5 rule of SES-004), plus `filter_candidates` removing SES-M-005 for short goals.

**13.** P2 Tom (10K) shows easy long runs: consistent.

---

### DST-006 — half-marathon race effort inside long runs (09 §4) — MEDIUM

**Meaning.** For a half-marathon time goal, in the specific phase every second long run ends with a hard (E3) part, never longer than 40 minutes or 60% of the run.

**Already precise.** `dst.race_long_every_weeks` 2; `dst.msp_share.HM` (L1 0.10, L2 0.30, L3 0.55); `dst.msp_segment_max_min.HM` 40; 0.60 × run (literal must become a parameter, e.g. `dst.msp_segment_max_ratio`, because 12 §2b.5 forbids literals); LOD-033 converts any excess to E1 without shortening the run.

**Missing.**
- "Every N-th long run": counted from the first SPECIFIC week? Do deload long runs count or are they skipped?
- `[level]`: the runner's current MSP level, or the next level being trained?
- "Expected race time": target time, predicted band point, or slow edge? (see CMP-008)
- "Finish goals use the MSP L1 share" is dead text: the condition requires `goal_type = time`.
- Interaction with DST-018 (MSP key session) and the weekly hard budget (10% of weekly time for road_classic): a 0.30 × 1 h 45 = 31-min E3 segment alone can exceed the budget of a 4-hour week (24 min).

**Ops.** `replace_module` on `week.long_run` (SES-M-005) + `set` its final segment; condition with `week.phase == 'SPECIFIC'` and a **new** `week.specific_long_run_index`.

**Design choices.**
1. Count non-deload long runs from the first SPECIFIC week; the 2nd, 4th, … get the segment.
2. Share = `msp_share` of the **next** MSP level (current + 1, capped at the required level).
3. Expected race time = target time for time goals (the segment is effort-based; the time only sizes it).
4. Finish goals: no race-effort long runs (delete the dead clause), keeping the HM finish plan simpler; or include them at the L1 share. Proposed: **delete** (conservative).
5. The segment counts toward LOD-033's hard budget; when it does not fit, shorten the segment (convert to E1) rather than skipping the key session.

Pfitzinger and Hansons place goal-pace segments late in long runs in the final 6–8 weeks [ALLEGED].

**13.** No HM example exists.

---

### DST-007 — marathon effort inside long runs (09 §4) — MEDIUM, not MVP

**Meaning.** Same as DST-006 for the marathon, at E2 (marathon effort), capped at 90 minutes.

**Already precise / missing / choices.** As DST-006, with `dst.msp_segment_max_min.M` 90 and "effort words without pace" for finish goals (which here **is** in scope, since the condition has no goal-type test).

**Recommendation.** Retag `spec` (marathon is R2), or formalise together with DST-006 since the record is the same shape.

**13.** P3 Ana (marathon finish, SPECIFIC wk 13–15) shows **no** race-effort long run. The rule fires for her if MSP L1 prerequisites (THR L1, DUR L1) hold, so 13 is consistent only if Ana never passed THR L1. That is not stated. Fix when R2 ships.

---

### NUT-010 — fuelling practice on long runs (11 §3) — MEDIUM

**Meaning.** When the race needs fuelling, long runs of an hour or more become practice runs at the runner's current carbohydrate step, starting at 30 g/h.

**Already precise.** `fuel.required_above_min` 90, `fuel.practice_min_duration_min` 60, `fuel.start_g_h` 30; module SES-M-004 (fuelled long run, phases "BASE (late)–SPECIFIC", prereq DUR L1).

**Missing.**
- "06 rehearsal module" is ambiguous: SES-M-004 (fuelled long run) or SES-M-023 (race rehearsal)?
- "BASE (late)" is undefined (also used by SES-M-008 and SES-M-012).
- Does every long run ≥ 60 min become practice, including deload and taper long runs?
- **New** path for the current step (`state.fuel_step_g_h`).
- NUT-002 (referral flag) suppresses numeric targets: the practice run must then show no number.

**Op.** `replace_module` on `week.long_run` with SES-M-004 and `set` its intake target to `state.fuel_step_g_h` (default `p('fuel.start_g_h')`).

**Design choices.**
1. Module = SES-M-004; SES-M-023 is the later rehearsal (SPECIFIC last 2–6 weeks).
2. **"Late BASE" = the second half of BASE weeks** (from week ⌈B/2⌉+1 of BASE), defined once in 04 and used by every "(late)" phase tag.
3. Deload long runs count as practice at the same step (they still train the gut) but taper long runs do not raise the step.

**13 constrains.** P3 Ana: long runs from wk 1 (93 min) are ≥ 60 min, yet the first fuelled run is wk 6 (BASE wk 3–8, so the second half = wk 6–8 ✓ under choice 2). But choice 2 also excludes SES-M-008 from wk 5 and SES-M-012 from wk 3, which 13 shows (see CMP-007): one of the two must give. Ana's wk 8 deload long run is not marked fuelled; under choice 3 it would be (13 silent, compatible if it simply omits the label).

---

### NUT-011 — raising the fuelling step (11 §3) — MEDIUM

**Meaning.** After two practice runs at the current step with a calm stomach (≤ 2/10), add one step, up to the ceiling for the race.

**Already precise.** `fuel.step_runs` 2, `fuel.gi_pass_max` 2, ceiling helper `fuel_band_high(goal.expected_duration_s)` exists (HM 1–2.5 h → 60 g/h).

**Missing.**
- `fuel.step_g_h` is a range (10–15), not a value.
- "Reach the current step": logged `carb_g_per_h` ≥ step, or within some tolerance?
- "Consecutive": does a non-practice long run in between break the run?
- Ceiling for a finish goal limited to FUEL L2 (CMP-008 choice 2): 60 g/h.

**Op.** `set` on `state.fuel_step_g_h` = `min(step + p('fuel.step_g_h'), fuel_band_high(goal.expected_duration_s), p('fuel.max_default_g_h'))`; condition over a **new** list `log.practice_runs` (last `fuel.step_runs`).

**Design choices.** `fuel.step_g_h` = **15** (top of the range; required by 13); "reach" = logged intake ≥ step − 5 g/h (a gel is ~20–25 g, so exact hits are unlikely; design default); only practice runs count, others are ignored. Gut-training studies and sports-nutrition practice add ~10–20 g/h every one to two weeks [ALLEGED].

**13 constrains.** P3: 30 g/h in wk 6–7, then 45 g/h in wk 9–10 ⇒ step 15, two runs per step, deload wk 8 not counted as a raising run.

---

### NUT-012 — holding or lowering the step (11 §3) — EASY

**Meaning.** If the stomach rated more than 2/10, keep the same step; at 5/10 or more, go one step down.

**Already precise.** `fuel.gi_pass_max` 2, `fuel.gi_stepdown_min` 5, step = `fuel.step_g_h`.

**Missing.** Floor of the step-down (start value or 0?); a GI score left blank (declared unknown).

**Op.** `set` on `state.fuel_step_g_h`: `entry.gi_score_0_10 >= p('fuel.gi_stepdown_min') ? max(p('fuel.start_g_h'), step − p('fuel.step_g_h')) : step`. `on_unknown: skip` for the step-down (blank GI → hold, via NUT-011 not firing).

**Choice.** Floor = `fuel.start_g_h`; blank GI = no step-up (hold). Vomiting during a long event is already routed to SAF by NUT-033.

**13.** None.

---

### NUT-013 — FUEL level from practice runs (11 §3) — MEDIUM

**Meaning.** Two measured long runs inside the intake range of a fuelling level, with a calm stomach, prove that level (for level 3, runs that include race-effort segments).

**Already precise.** `fuel.exit_runs` 2; bands from 02 §2: L1 30 g/h, L2 45–60, L3 60–90 at race effort (MSP L1); CMP-002 pattern for the level write (`set state.levels[...]`, confidence measured).

**Missing.** "Reach the level's band" = at least the lower edge? Can the two runs be any two (not consecutive)? Within what time window? The band edges are not parameters (they are in the 02 §2 text); a **new** `fuel.level_band.L1/L2/L3`. For L3, "race-effort segments" = SES-M-005 or SES-M-023.

**Op.** `set` state.levels.FUEL (as CMP-002), with `level_prereqs_hold('FUEL', n, today)`.

**Design choices.** Reach = intake ≥ lower edge of the band (an intake above the band still counts); the last two practice runs, any distance ≥ `fuel.practice_min_duration_min`, within 6 weeks (= `cmp.decay_weeks`); L3 runs must contain an E2+ race-effort segment.

**13 constrains.** P3: two runs at 30 → FUEL L1 (wk 7), two at 45 → FUEL L2 (wk 10). Only the "≥ lower edge" reading reproduces wk 10 (45 is the lower edge of 45–60).

---

## 4. Cross-cutting gaps

### 4.1 No S7 algorithm (07 is not complete enough)

Module 07 lists S6 "key-session count" and S7 "06 modules chosen by CMP-007 among eligible modules; placed on available days" as single rows. The 27 rules need an explicit order, because several read each other's output (count needs placement; placement needs the chosen modules' effort; dose needs deload/taper status; TID trimming needs all doses). Proposed S7 sub-steps, to be written into 07 §2 (design default):

1. **Count** k: SES-007 → SES-006 (with LOD-034, LOD-040 caps).
2. **Long run**: SES-005 day; content by family (DST-005 short; DST-006 HM time goal), fuelling practice (NUT-010), heat (DST-004).
3. **Choose** k modules: DST-002 filter → CMP-007 argmax per slot → DST-018 override (time goals, SPECIFIC) → SES-012 test substitution → deload (SES-016) / taper (SES-015) / maintain (SES-018) overrides.
4. **Place**: SES-004 (+ SES-005); if no valid placement, k − 1 and back to step 3.
5. **Dose**: SES-011 (or SES-013 freeze), SES-016 start dose; then LOD-033 TID check, which drops a slot (SES-006 choice 2) before trimming segments.
6. **Easy fill**: LOD-031 water-fill, LOD-013 two-day cap.
7. **Extras**: strides (SES-021), strength (SES-020), run-walk rendering (SES-009/010).
8. **Render**: SES-017, FEA-014.

The rule priorities must then match this order. Today CMP-007 (T4.110) outranks DST-018 (T5.458), and DST-002's easy-run fallback contradicts CMP-007's "never an easy run".

### 4.2 Session-module data is prose

`ses.dose.<id>` is "as §2 'Dose' column": start, step and maximum are prose, often with alternatives ("+1 rep or +1 min/rep"), ranges ("1–2 min jog") or no step at all. The 06 §1 record format (`dose {segments template, min/max}`, `progression {step rule, max step}`, `exit_test {criterion}`) is declared but never filled. MVP needs a filled record for at least SES-M-002, 003, 004, 005, 006, 008, 009, 010, 011, 012, 013, 018, 019, 020, 021, 022, 024 (17 modules). Proposal for the steps: SES-011 choice 1.

### 4.3 Missing state and paths (12 §2b)

New paths needed by the 27 records: `state.module_dose[mid]`, `log.last_instance(mid)` (or `log.module_instances`), `state.fuel_step_g_h`, `log.practice_runs`, `state.runwalk_rung`, `log.runwalk_sessions_at_rung`, `state.exit_test_due[node]` / `session.test_result`, `week.phase_week_index`, `week.weeks_in_phase`, `week.is_late_phase` (or a helper), `week.specific_long_run_index`, `m.trains`, `state.levels.MSP` and `.FUEL` (only DUR, HAB, THR, TOL, VO2 are listed), `goal.expected_duration_s` (listed, never defined). New parameters: `cmp.max_level.<node>`, `cmp.node_tie_order`, `ses.target_rpe.<effort>`, `ses.dose.<id>.steps`, `fuel.level_band.<L>`, `dst.msp_segment_max_ratio` (the 0.60 literal), a single `fuel.step_g_h` and `heat.acclim_days`. New op fields: `schedule_session.week_expr`, `insert_phase.weeks_expr` (and widen `insert_phase` to TRANSITION). New helper: `effort_rank` must handle E5.

### 4.4 Level tests cannot be judged from the log

No rule emits `exit_test_passed`, and the pass criteria rely on data the log does not hold (per-segment RPE, talk test, every rep completed). Without this, THR, VO2 and MSP levels can only rise by log thresholds that do not exist for them (02 §2 THR L1 is test-only). Consequence: time goals (which require THR, VO2, MSP levels) never reach their required levels in the engine, and SES-012/CMP-007 keep choosing the same nodes. A new evaluation rule and three test questions are proposed under SES-012.

### 4.5 Phase sub-structure

"BASE (late)" (SES-M-004, 008, 012) and "BUILD (last third)" (SES-M-011) are undefined. 04 allocates whole phases only. Proposal: one definition in 04 (late = second half of the phase; last third = final ⌈n/3⌉ weeks), used by SES-001's phase test. For short finish goals 04 §3 step 0 makes every pre-taper week BASE, so they never see BUILD modules; that is consistent with CMP-007's "finish goal with all levels held → strides".

### 4.6 Weekly hard-minutes budget vs key sessions (half marathon)

`tid.hard_share_max.road_classic` = 0.10 also applies to the half marathon. At 240 min/week the whole week may hold 24 min at E3–E4. Two key sessions at start dose (SES-M-008 15 min + SES-M-010 10 min) already exceed it, and FEA-026 (text-only, not MVP-tagged) would make any HM time goal needing THR L2 (25 min test) infeasible below 250 min/week. The engine session should check this against the persona grid before freezing SES-006; it may justify a separate `tid.hard_share_max.HM` (e.g. 0.15) as a design default.

### 4.7 Expected race duration

CMP-008, NUT-010, NUT-011 (ceiling), DST-006/007 and NUT-020/032 all read an "expected race duration" that is not defined for goals without an anchor. Proposed definition under CMP-008.

### 4.8 Worked examples do not cover MVP key sessions, and P3 is inconsistent

- No MVP-distance example shows key sessions, doses, a deload with a key session, a fuelling ladder for a HM, or a race-effort long run. The formal records can therefore not be checked against hand values for MVP. **A hand-computed MVP fixture is needed**: suggested a 10K time goal (12 weeks, 4 runs) and a HM time goal (14 weeks, 4 runs), both with week-by-week key sessions and doses.
- P3 Ana (marathon) is inconsistent with the spec on: node choice (CMP-007), dose steps (SES-011), deload doses (SES-016 and LOD-040), sharpener dose (`ses.taper_touch`), key count in SPECIFIC (SES-007), warm-up/cool-down/recovery lengths on the §6 card (`ses.warmup_s`, `ses.cooldown_s`, SES-M-008 recovery), and possibly DST-007. Its volumes, long runs, deloads and fuel levels are consistent and remain valid oracle values.

### 4.9 MVP tagging is off in both directions

- Tagged MVP but unreachable in MVP: **PHS-015** (ultra), **DST-007** (marathon), **SES-019** (`norwegian_elite`). Also 12 §6 says "PHS-012…016 stay text_only until their profile", which contradicts tagging PHS-013…015 MVP (PHS-013 and PHS-014 are reachable: race → transition; H0 maintain).
- Reachable in MVP but text-only and tagged `spec`: **DST-018** (MSP sessions for 5K/10K/HM time goals), **SES-020** (strength placement, SES-003 step 5), **SES-021** (strides placement, step 4), **SES-022** (hill sprints → strides), **NUT-040** (heat sessions, needed by DST-004), **FEA-026** (exit-test hard minutes at peak), **NUT-021** (HM fuelling below band), **NUT-030** (drink to thirst), **DST-017** (default preset). Without them the MVP engine either skips steps of SES-003 or silently loses behaviour that 06 and 09 describe.

### 4.10 Projection vs logging

SES-010, SES-011, SES-012, NUT-011 and NUT-013 all depend on what the runner logs, but plans are generated weeks ahead and must be deterministic (GEN-004) and only reducible inside the published window (INV-04, ADP-014). The spec does not say how far ahead logged-progress rules project. Proposal (SES-011 choice 4): project one step ahead, hold after that, re-plan on each log; failures only ever reduce.

---

## 5. Decisions the user must validate

Each is written as the question a runner would answer. Recommended answers are cautious choices from common coaching practice; none has been tested on real runners yet.

1. **Which hard session each week?** The app compares what your race needs with what you can already do and works on the biggest gap first. If two hard sessions fit in a week, they are never of the same kind. When nothing is missing, it rotates through threshold, intervals and progression runs; in the base phase it gives you short fast strides instead of a hard session. *Recommended: yes, as described.*
2. **How many hard sessions, and on which days?** None while you are learning to run or coming back; at most one in the base phase; two later, but only if you run at least four times a week, and only if they fit in the week's "hard minutes" allowance. Your long run counts as a hard day, so there is never a hard session the day before or after it. *Recommended: yes.*
3. **How does a hard session grow?** Each time you do it and rate it no harder than intended (at most one point above), the next one is one small step bigger: first each repeat gets one minute longer, then one repeat is added. If you skip the rating or it felt too hard, you repeat the same session. In a lighter week you go back to the starting size. *Recommended: yes.*
4. **When and how do you test for the next level?** Once you have done a session at the size of the test twice and it felt right, the next normal week replaces it with the test. After the test the app asks three quick questions: "Did you finish every part?", "Could you hold the effort to the end without slowing or walking?", "Any pain?". Fail or no answer: nothing changes, and you try again three weeks later. *Recommended: yes.*
5. **Practising eating on long runs (races longer than about 90 minutes).** Starts in the second half of the base phase, on long runs of an hour or more, at 30 g of carbohydrate an hour. After two comfortable runs (stomach 2 out of 10 or better), add 15 g an hour, up to 60 g for a half marathon. At 5 out of 10 or worse, go back one step. Two comfortable runs at a level's amount prove that level. *Recommended: yes.*
6. **Fuelling level for slow half-marathon finishers.** If your half marathon will take more than 2.5 hours and your goal is just to finish, should the app still require the top fuelling level (which would also force race-pace and threshold sessions on you)? *Recommended: no, stop at the middle level (45–60 g an hour); the race-day plan still never exceeds what you tolerated in training.*
7. **Half-marathon race effort inside long runs.** For time goals only, in the last phase before the taper, every second long run ends with a part at half-marathon effort: about 10% of your race time at first, later about 30%, never more than 40 minutes or 60% of the run. Finish-only goals keep all long runs easy. *Recommended: yes.*
8. **Hot race.** If you expect a hot race, about 10 of your easy runs in the last three weeks become shorter easy runs (up to an hour) in the warmest part of the day you can manage; only runs you log as hot count. No extra-clothing tricks. *Recommended: yes.*
9. **After 15 weeks of "just keep fit" mode.** The app schedules a short test, reminds you that long-race endurance is not being kept, and starts a new 15-week block unless you set a goal. *Recommended: yes.*

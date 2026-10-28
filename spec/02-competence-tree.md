# 02 — Competence tree (v5.3, architect; §2b experienced-runner path added in v5.3)

Serves criteria 4 (competence tree with prerequisites and levels), 1 (determinants per distance), 10 (modules declare prerequisites), 5 (deterministic). Rule range: CMP-001…099; EXP-001…049 (v5.3, experienced-runner path, priorities from this module's block).

> **In plain words.** Running fast or far rests on a few abilities: running regularly, a big aerobic engine, legs that tolerate the pounding, holding a strong pace (threshold), top-end fitness (VO2max), efficient form, staying strong late in a long race (durability), eating and drinking on the run, and pacing yourself. Each ability has levels. You unlock harder sessions only when the easier levels underneath are in place. Your race distance decides which abilities matter most.

## 1. Design principles

1. **Every node changes a decision** [opening-firstprinciples]. A node either gates a session, enters the feasibility calculation, or sets a demand weight. Nodes that change nothing are marked `advisory` (content and education only).
2. **Levels are observable.** A level is reached by a *state threshold* computed from the training log (e.g. weekly running time) or by passing an *exit test* (a session with a pass criterion). Self-report alone gives at most `estimated` confidence and a capped level (CMP-004). Because history is entered manually (owner decision), "logged data" means *contemporaneous* manual entries (`ActivityRecord.confidence = measured`, 12 §4); onboarding claims and backfilled entries are `estimated`. Entries flagged implausible (07 INV-14) never count toward a level.
3. **Two level axes, never merged** [opening-contextrealist; wg3 impl. 1, CORROBORATED/design choice]. *Performance* (age-graded % from a dated result, WMA tables [wg3 §1, CORROBORATED]) sets paces. *Tissue tolerance* (TOL node) sets volume and long-run growth. Volume follows tolerance; pace follows performance.
4. **No precedent exists for a running competence graph** [hearing-1 §5, UNKNOWN], so correctness comes from machine checks (§6), not authority.
5. **Terrain** is fixed to `road_flat` in v1 (criteria scope). It is a constant, not a node.

## 2. Nodes and levels

Units: weekly running time `V28_time` = mean weekly running time over the last 28 days; `L30` = longest single run in the last 30 days (distance, and duration for time-based/run-walk sessions); "sustained" = in at least 3 of the last 4 weeks. All thresholds are registry parameters (`cmp.*`); values below are **design defaults** unless a grade is given. Detailed exit tests belong to 06 (session library).

| Node | Meaning (engineer) | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|---|
| **HAB** habit & frequency | sessions/week sustained; continuous running ability | run-walk 20–30 min, 3×/wk | 30 min continuous at E1, 3×/wk, 4 wk | ≥4 runs/wk, 8 wk | ≥5 runs/wk, 12 wk | — |
| **TOL** tissue tolerance | musculoskeletal load tolerance; derived from L30, V28, injury flags, training age | V28 ≥ 60 min & L30 ≥ 20 min | V28 ≥ 150 min & L30 ≥ 60 min | V28 ≥ 240 min & L30 ≥ 100 min | V28 ≥ 360 min & L30 ≥ 150 min | V28 ≥ 540 min & L30 ≥ 210 min |
| **AER** aerobic base | sustained easy volume | 90 min/wk sustained | 180 | 300 | 450 | 600 |
| **THR** threshold / sustainable fraction | work near critical speed (E3) | 2×8 min E3 exit test | 20–30 min accumulated E3 | 30–40 min continuous or 2×20 | 45–60 min accumulated | — |
| **VO2** VO2max / top end | E4 intervals | strides/short hills (E5) | 5×2–3 min E4 | 16–20 min accumulated E4 | — | — |
| **ECO** economy & strength | strides, strength, plyometrics | strides 2×/wk + basic strength 2×/wk | + low-level plyometrics | full programme | — | — |
| **DUR** durability | long run at E1 completed without effort drift | 60 min | 90 min | 120–150 min | ≥180 min (fuelled) | back-to-back capable |
| **MSP** race-specific endurance | goal-effort work as share of race duration | 10–15% | 25–40% | 50–75% (`dst.msp_share`, owned by 09) | — | — |
| **FUEL** fuelling & drinking | carbohydrate tolerance on the run (GI score ≤ 2/10) | 30 g/h on long runs | 45–60 g/h | 60–90 g/h at race effort | > 90 g/h (opt-in) | — |
| **HEAT** heat readiness (conditional) | active only if race forecast is hot | informed | acclimatised (≥ 7–14 days exposure) | — | — | — |
| **PACE** mental skills & pacing (`advisory`) | pacing discipline, race plan, coping | even-effort long run | even-split race-pace session within ±`cmp.pace_split_tol` | written race plan rehearsed | — | — |

Evidence for the node set: core model VO2max × fraction × economy [wg1 §1, CORROBORATED]; durability as fourth determinant [wg1 §1, CORROBORATED, no field test]; strength/plyometrics → economy [wg1 §6, CORROBORATED]; frequency drives response [wg3 §2 Montero & Lundby, CORROBORATED, cycling]; gut training improves tolerance [wg5 §5, CORROBORATED]; heat acclimatisation 1–2 weeks [wg5 §4, CORROBORATED]; mental skills have no dose evidence [opening-firstprinciples], hence `advisory`. DUR uses a *proxy* (long-run duration) because no durability field test exists [wg1 §1, UNKNOWN]; the label says so. FUEL L4 benefit is unproven [wg5 §3, UNKNOWN] and opt-in only.

**V28 for level thresholds (v3, d2-C O4).** For attaining TOL and AER levels, V28 is the mean of the last 4 **non-deload, non-taper** weeks. A plan whose peak sits exactly at a threshold can then reach it, even though deloads pull the plain 28-day mean below.

**Start ladder credit (v3, d2-A R2).** Completing the 9-rung start ladder (10 §4b: three sessions of 30 min continuous in S9) credits HAB L2. For a 5K finish goal it also credits the 30-min long-run demand.

**HAB L2 by run-walk (v2, Room A R5).** For a `finish` goal with `run_walk_preference = true`, HAB L2 is also reached by 3 run-walk sessions a week, each at least the expected race duration, sustained for 4 weeks. Run-walk is first-class [wg2 §1, CORROBORATED]. HAB counts in the level weeks `K` of 03 §4, and ladder weeks count toward it.

## 2b. Experienced-runner path (v5.3)

> **In plain words.** If you send us a recent all-out race result and a training history that matches it, we start your plan at your level instead of at the bottom. Your race sets how hard your sessions can be; your usual week sets how much you run. The first three weeks are normal training weeks that check the start is right. If they go badly (sessions far too hard, a missed week, pain, or much less running than planned), the plan switches to the cautious version for the affected abilities. If they go well, your history counts as confirmed.

*Owner decisions of 28 Oct 2026 (`docs/decisions-v5.3.md`, questions 1–3; history from manual entry only, question 8). Every value in this section is a design default (basis `design_default`). The age-grade → level table is ALLEGED: it follows the usual relation between age-grade, training volume and session ability in coaching practice, as remembered by the council session; it is not checked against a source and must be read by the coach of decision 9.*

**Two paths.** Every runner is on the **cautious path** (all of v5.2, unchanged) unless EXP-001 puts them on the **experienced path**. The path is stored in EngineState (`experienced.path` ∈ {none, calibrating, confirmed, fallen_back}, 12 §3.8); a runner who fell back stays on the cautious path for the rest of the season (a new goal starts a new season).

**Qualifying race (`state.exp_race`).** The most recent PerformanceAnchor of kind `race` whose distance is within `exp.distance_tol_pct` of 5K, 10K, half marathon or marathon. It qualifies when it is younger than `exp.race_max_age_days` (84) on the day of the plan, `effort_all_out = true`, and the runner answered yes to "Was this an official race result, run all-out?" (`official_result_confirmed`, new anchor field). A link or bib number is optional and is not checked.

**Age-grade (`state.exp_agegrade_pct`).** `100 × open_standard(sex, distance) / age_factor(sex, age_low(race date)) / race time`, with `perf.wma_open_s` and `perf.wma_age_factor` (linear between the 5-year ages listed; 1.00 up to 30). When `sex` is unknown, both tables are computed and the **lower** value is used (INP-032: the conservative side for a value that unlocks training). **Grade:** the two tables in `parameters.md` are an approximation from memory (road world bests and a smooth age curve), ALLEGED; they are **not** the WMA 2023 tables, which the owner should obtain and substitute (same parameter ids). The resulting band, not the exact percentage, is what EXP-002 reads.

**Starting levels (EXP-002).** Performance-side levels come from the race's age-grade band (`exp.level_table`); volume-side levels come from the claims as in v5.2 (02 §2 thresholds on the claimed weekly time, runs and longest run) but capped at `exp.claim_level_cap` (3, not 2). TOL 4 and higher need logged weeks.

| Age-grade of the race | THR | VO2 | MSP (only if the race's distance family = the goal's family; else 0) | Claimed weekly time must lie in (consistency, EXP-001) |
|---|---|---|---|---|
| < 55% | 1 | 1 | 0 | ≤ 420 min |
| 55–64% | 2 | 1 | 1 | 150–720 min |
| 65–74% | 3 | 2 | 1 | ≥ 240 min |
| ≥ 75% | 3 | 3 | 2 | ≥ 300 min |

These levels have the new confidence **`declared`** (between `estimated` and `measured`). A declared level unlocks modules (CMP-006), counts for the key-session count (06 SES-007), the entry rung of each ladder (06 SES-027) and feasibility (03 FEA-021), exactly like a measured level. It is never a passed level test: the test of the **next** level is scheduled and judged as in v5.2 (SES-012, SES-024), and a declared level is never itself tested again. CMP-004's self-report cap does not apply on the experienced path; EXP-002's own caps replace it. Example (`docs/v5.3-case`): a 1:21:37 half marathon by a 36-year-old man is ≈ 71% (approximate tables) → THR 3, VO2 2; the goal is a 10K, a different family from the half, so MSP 0; claims of 480 min, 7 runs and a 166-min longest run give HAB, TOL, AER and DUR 4, 4, 4, 3, capped to 3.

**Calibration (EXP-003).** The first `exp.calibration_weeks` (3) plan weeks of the experienced path are normal training weeks, not tests. Each non-deload calibration week holds exactly two key sessions: one threshold-type session (SES-M-008) and one VO2-type session (SES-M-010), both at the **entry rung** of the declared level (06 SES-027, no step-up inside calibration), plus a long run at `L30_eff` = `exp.l30_discount` × claimed longest run (07 GEN-011). Calibration weeks replace ONBOARD (04 §1) and never hold a third key session (owner decision 4).

**Fallback (EXP-004, T2).** During calibration, at every re-plan, the path falls back when the log shows any of: `exp.fallback_rpe_sessions` (2) key sessions logged with RPE above min(target RPE + `ses.progress_rpe_margin`, `result.rpe_high` − 1) (the SES-011 "felt as intended" limit); a completed calibration week with no logged run (a missed week); an active pain flag; a completed calibration week whose logged time is below `exp.fallback_volume_ratio` (0.80) × its planned time. A pain flag, a missed week or low volume move the whole runner to the cautious path. Two too-hard key sessions move only the **nodes those sessions train** (THR for SES-M-008, VO2 for SES-M-010): their levels drop to the cautious value (`cmp.self_report_level_cap`), and the volume side stays. The plan is regenerated; the result is always a reduction, which ADP-014 allows inside the published window. MSG-EXP-FALLBACK explains it.

**Confirmation (EXP-005).** When the last calibration week is complete and no fallback fired, the path becomes `confirmed`: HAB, AER and TOL become `measured` at their declared levels, and the baseline counts as confirmed (05 LOD-008), which replaces the six logged weeks of v5.1 for this path. THR, VO2 and MSP stay `declared` until a test or the log confirms them.

**What the experienced path changes elsewhere** (each in its own module): ONBOARD skipped (04 §1); key-session count 2–3 in BUILD and SPECIFIC (06 SES-007, SES-026); the all-easy long run is not a hard day (06 SES-004); doses start at the entry rung (06 SES-027); long run from the discounted claim without the TOL cap (07 GEN-011); standard progression profile (07 GEN-014, 01 CTX-007); LOD-007's cap measured against the claim, and LOD-008 replaced by EXP-005 (05); a confirmed late-entered race sets paces with a wider slow edge (01 INP-005, 03 FEA-014, 07 INV-15). Screening, red flags, spike caps, the > 180-min guard, no catch-up, pain rules and fail-closed are unchanged.

```
RULE EXP-001 | priority T5.120 | when a plan is generated and the runner is not already on the experienced path or fallen back from it this season | then the runner enters the experienced path (state.exp_path = calibrating, calibration until the end of plan week exp.calibration_weeks) only if all hold: a qualifying race (state.exp_race: kind race, standard distance, ≤ exp.race_max_age_days old, effort_all_out, official_result_confirmed = true); training_age_years ≥ exp.training_age_min; age_low(today) ≥ exp.age_min; the claims are consistent (claimed weekly time inside the row of the 02 §2b table for the race's age-grade, claimed runs/week ≥ exp.runs_min, no GEN-022 inconsistency); no active pain flag; no injury in the last exp.injury_free_weeks (injury_last_12m ≠ true, or injury_last_12w = false); gate = proceed; show MSG-EXP-PATH | because a recent all-out race and a history that agrees with it say more about a runner than the blanket distrust of v5.2, which gave an experienced runner a beginner's plan (proposal v5.3 §2, owner decision 1) | evidence proposal v5.3 §1–§3; thresholds are design defaults, UNKNOWN; the idea that race performance and consistent volume predict session tolerance is ALLEGED (coaching practice, from memory) | basis design_default | default? yes
RULE EXP-002 | priority T5.121 | when the runner is on the experienced path | then for each node set level = exp_level(node) when it is higher: THR and VO2 from exp.level_table by the race's age-grade band; MSP from the table only when the race's distance family equals the goal's family, else 0; HAB, TOL, AER and DUR from the claims by the 02 §2 thresholds, capped at exp.claim_level_cap; confidence = declared; nodes in state.exp_fallback_nodes keep their cautious value | because performance sets the performance-side levels and tolerance the volume-side ones (02 §1 principle 3), and a capped claim keeps TOL 4 for logged weeks | evidence wg3 §1 WMA age-grading, CORROBORATED as a scale; the age-grade → level mapping is ALLEGED (coaching practice, from memory) | basis design_default | default? yes
RULE EXP-003 | priority T5.122 | when a non-deload week lies in the calibration window (week.is_calibration) | then the week holds exactly exp.calibration_keys key sessions, SES-M-008 then SES-M-010, each at its entry rung (SES-027) without step-up, and its long run at L30_eff; show MSG-EXP-CALIBRATION in the first calibration week | because the first weeks must check the declared start with ordinary training, not with tests (owner decision 3) | evidence proposal v5.3 §3 A3; design default, UNKNOWN | basis design_default | default? yes
RULE EXP-004 | priority T2.120 | when state.exp_path = calibrating and the log shows exp.fallback_rpe_sessions key sessions above the felt-as-intended RPE limit, or a completed calibration week with no logged run, or an active pain flag, or a completed calibration week with logged time < exp.fallback_volume_ratio × planned | then fall back: a pain flag, a missed week or low volume set state.exp_path = fallen_back (cautious path for every node); too-hard sessions alone add the nodes they train to state.exp_fallback_nodes (cautious level for those nodes only); regenerate from S2 (a reduction); show MSG-EXP-FALLBACK | because a declared start that the log contradicts must not keep driving the plan | evidence proposal v5.3 §3 A3; factdesk1 §2, CORROBORATED (pain and next-morning rules); thresholds UNKNOWN | basis design_default | default? yes
RULE EXP-005 | priority T5.123 | when state.exp_path = calibrating, the calibration window has ended and every calibration week is complete without a fallback | then state.exp_path = confirmed; HAB, AER and TOL become measured at their declared levels; state.baseline_confirmed = true (replaces LOD-008's count on this path); show MSG-EXP-CONFIRMED | because three logged weeks at the declared level confirm the history the plan was built on | evidence proposal v5.3 §3 A3; factdesk2 §6, CREDIBLE (manual weekly logs fairly reliable); the three-week count is UNKNOWN | basis design_default | default? yes
RULE EXP-006 | priority T6.120 | when a race anchor would qualify except that official_result_confirmed has not been answered | then plan on the cautious path and ask MSG-EXP-CONFIRM-Q once; a "yes" re-generates the plan (EXP-001) | because the experienced path rests on the runner's own confirmation of the result (owner decision 1), and a plan should not wait for it | evidence proposal v5.3 §3 A1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
```

Tests: every rule has `T-<ID>-fires` and `T-<ID>-silent` (14); e.g. T-EXP-001-silent: the race is 90 days old.

## 3. Prerequisite edges (DAG)

`A Ln ⇐ B Lm` means "level n of A requires level m of B". TOL has no prerequisites: it is measured, not trained directly.

```
HAB L1 ⇐ (none)          HAB L2 ⇐ HAB L1          HAB L3 ⇐ HAB L2, TOL L1     HAB L4 ⇐ HAB L3, TOL L2
AER L1 ⇐ HAB L1          AER L2 ⇐ HAB L2          AER L3 ⇐ AER L2, TOL L2     AER L4 ⇐ AER L3, TOL L3   AER L5 ⇐ AER L4, TOL L4
THR L1 ⇐ AER L1, HAB L2  THR L2 ⇐ THR L1, AER L2, TOL L2   THR L3 ⇐ THR L2, AER L3   THR L4 ⇐ THR L3, AER L4
VO2 L1 ⇐ HAB L1          VO2 L2 ⇐ VO2 L1, THR L1, TOL L2   VO2 L3 ⇐ VO2 L2, THR L2, TOL L3
ECO L1 ⇐ HAB L1          ECO L2 ⇐ ECO L1, TOL L2           ECO L3 ⇐ ECO L2
DUR L1 ⇐ AER L1          DUR L2 ⇐ DUR L1, AER L2, TOL L2   DUR L3 ⇐ DUR L2, AER L3, TOL L3
DUR L4 ⇐ DUR L3, FUEL L1, TOL L4                            DUR L5 ⇐ DUR L4, TOL L5, goal.family = ultra
MSP L1 ⇐ THR L1, DUR L1  MSP L2 ⇐ MSP L1, THR L2, DUR L2   MSP L3 ⇐ MSP L2, DUR L3, FUEL L2 (if race > 90 min)
FUEL L1 ⇐ DUR L1         FUEL L2 ⇐ FUEL L1                 FUEL L3 ⇐ FUEL L2, MSP L1   FUEL L4 ⇐ FUEL L3 (opt-in)
HEAT L2 ⇐ AER L2         PACE L1 ⇐ DUR L1   PACE L2 ⇐ MSP L1   PACE L3 ⇐ PACE L2
```

**Scheduling vs attaining (v2, Room B R4).** A level's prerequisites gate **attaining** it, not every single session that trains it. Scheduling a long run needs DUR L(n−1), plus FUEL L1 when the run exceeds 150 min. The long run's length is bounded by INV-01/02/13; TOL L4 gates only the *attainment* of DUR L4. Without this, a 180-min marathon long run was blocked whenever a deload week pulled V28 under the TOL L4 threshold (INV-20 gap).

Every edge points from a more basic level to a more advanced one; the topological order is TOL → HAB → AER → {ECO, VO2 L1, DUR L1} → THR → {VO2 L2+, DUR L2+} → FUEL → MSP → PACE/HEAT. Back-to-back long runs are DUR L5: off unless the goal is an ultra and TOL L5 is reached (resolves the back-to-back conflict at the graph level; dose rules in 05/09).

## 4. Competence state

`CompetenceState {node, level, confidence ∈ {measured, declared (v5.3, §2b), estimated, unknown}, source ∈ {log_threshold, exit_test, self_report, ladder_credit, race_result (v5.3)}, achieved_on, last_exercised_on}`.

```
RULE CMP-001 | priority T5.110 | when a state threshold for node N level n is met by logged data | then set level(N) ≥ n, confidence = measured | because levels must be observable | evidence opening-systemsarchitect R4; hearing-1 §5 (UNKNOWN precedent → machine checks) | basis design_default | default? yes
RULE CMP-002 | priority T5.111 | when the exit test for N Ln is passed and all prerequisites of N Ln hold | then set level(N) = n, confidence = measured | because exit tests are the library's proof of competence (criterion 10) | evidence criteria.md C10; opening-firstprinciples, UNKNOWN (design default) | basis design_default | default? yes
RULE CMP-003 | priority T5.112 | when node N was not exercised for cmp.decay_weeks | then lower level(N) by 1 (TOL, AER, HAB recompute from the log instead) | because fitness is lost with inactivity; size unknown for recreational runners | evidence wg3 §3 detraining, CORROBORATED (direction, trained athletes); factdesk1 §4 return figures UNKNOWN | basis design_default | default? yes
RULE CMP-004 | priority T5.113 | when a level rests only on self-report (onboarding claim or backfilled entries) | then cap that node at cmp.self_report_level_cap[node] (2 for HAB, AER, TOL, DUR; 1 for THR, VO2, MSP, FUEL) with confidence = estimated, until contemporaneous log thresholds or an exit test confirm it; v5.3: not on the experienced path (EXP-002 sets and caps those levels), except for the nodes in state.exp_fallback_nodes | because self-reports are unverified and users may overstate history; weekly distance self-report is fairly reliable, pace and race times less so | evidence opening-contrarian §1.4; factdesk2 §6, CREDIBLE (distance) / UNKNOWN (race times) | basis design_default | default? yes
RULE CMP-005 | priority T1.110 | when TOL is computed and an injury in the last 12 months, other-sport background or novice status is present | then apply the context modifiers of 01 (slow progression profile) without changing the TOL level itself | because prior injury is the strongest risk factor; ex-cyclists/swimmers are higher risk | evidence hearing-1 §3, CORROBORATED; wg3 §2, CREDIBLE | basis evidence | default? no
RULE CMP-006 | priority T5.114 | when a session module requires N Ln and level(N) < n or any prerequisite of N Ln is unmet | then the module is ineligible | because prerequisites gate progression (criterion 4) | evidence criteria.md C4, C10, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE CMP-007 | priority T4.110 | when choosing which node a key-session slot trains | then pick the eligible node maximising weight(distance, N) × gap(N); ties broken by the fixed node order DUR, THR, AER, MSP, VO2, ECO, FUEL; when every weighted gap is 0, or the winner is AER or DUR, then in BUILD and SPECIFIC fill the slot from the active preset's 06 §5 module list for the phase, rotating by week index (never an easy run or a second long run); in BASE, or for a finish goal whose levels are all held, the slot becomes strides on an easy run (SES-M-006), shown as such | because sessions should close the largest weighted gap; a zero-gap or volume-node winner must not turn a key slot into easy running (F-09) | evidence opening-firstprinciples §3; opening-systemsarchitect R1; F-09, UNKNOWN (design default); v5.2 slot choices (second slot a different ability, rotation, strides fallback): ALLEGED (common coaching practice, e.g. Daniels '2Q' weeks, from memory) | basis design_default | default? yes
RULE CMP-008 | priority T4.111 | when the goal race is expected to last > fuel.required_above_min (90 min) | then FUEL L2 is a required level; FUEL L3 only when the expected duration > fuel.l4_min_race_h (2.5 h) **and the goal is a time goal** (v5.2, owner Q6: a finish goal stops at FUEL L2, so a slow finisher is not pulled into race-pace and threshold work through the FUEL L3 → MSP L1 → THR L1 prerequisites; the race-day plan still never exceeds the tolerated intake, NUT-020) | because fuelling is needed above ~90 min, and 60–90 g/h applies only beyond 2.5 h (F-10) | evidence wg5 impl. 3, §3, CORROBORATED; v5.2 finish goals stop at FUEL L2: design choice, UNKNOWN | basis design_default | default? yes
```

`gap(N) = max(0, required_level(goal, N) − level(N)) / max_level(N)`, with `max_level(N)` = `cmp.max_level.<node>` (v5.2).

**How CMP-007 chooses (v5.2, procedure `choose_key_modules(week, k)`, 07 §2b S7.3).** Design default (basis `design_default`, grade ALLEGED: pairing two different stimuli in a two-key week follows common coaching practice as remembered, e.g. Daniels' "2Q" weeks; not checked against a source).

1. **Phase overrides first.** TAPER (not race week): one sharpener (SES-015). RACE week: none. MAINTAIN, or a busy week (ADP-071): SES-018. SHARPEN: as SPECIFIC, at the last logged dose, no step-up (LOD-056). Deload: only slot 1, at its start dose, no test (SES-016).
2. **Candidate nodes** (DST-002): the nodes of `dst.phase_nodes[family][phase]` (SHARPEN uses the SPECIFIC row, MAINTAIN the BUILD row; phases with no row have no slots) whose next level is ≤ the cell's level ceiling, with gap > 0, and for which the **module pool** holds a module that trains (node, level + 1) and passes SES-001. Pool = `quality.key_modules[preset][phase]`; in SPECIFIC also the BUILD list (levels still missing); SES-M-006/007 for VO2 L1 and ECO L1. SES-M-005 is never a key slot (it is long-run content, DST-006).
3. **Slot j = 1 … k:** the candidate node not yet used this week with the largest `cmp.weight.<distance>.<node>` × gap; ties by `cmp.node_tie_order`. Its module = the lowest-level pool module that trains (node, level + 1), ties to the lower id (GEN-005). A node fills a second slot only through the fallback below.
4. **Fallback** when no candidate is left, or the winner is AER or DUR (volume nodes, trained by the long run and easy running): in BUILD and SPECIFIC, the preset's list for the phase rotated by `week.loading_index_in_phase + j − 1` (deload weeks not counted), then the BUILD list, first module that passes SES-001 and is not already used this week; in BASE (or when nothing is eligible), **strides** on an easy run (SES-M-006), shown with MSG-SES-STRIDES-SLOT; at most one strides slot a week. If strides are not allowed (RTR, TRANSITION, an effort ceiling below E3) the slot stays empty. A key slot never becomes a plain easy run (F-09); DST-002's v5 easy-run fallback is replaced by this chain.
5. **Race-effort override** (DST-018): for a time goal in a SPECIFIC loading week with `week.is_msp_week` and MSP L1 prerequisites held, when no slot trains MSP, the last slot becomes SES-M-011.
6. **Level test** (SES-012): a slot whose module has a level test due takes the test's dose (06 §3b).
7. Slots keep their rank (order of choice); SES-006 drops the last-ranked slot when placement or the weekly budgets do not allow it.

**Expected race duration (v5.2, CMP-008, NUT-010/011, DST-006, NUT-020/032).** `goal.expected_duration_s` = the slow edge of the predicted band (`predicted_band.high_s`, 03 §3; computed for information also for finish goals when an anchor exists), else race distance ÷ `S_slow` (03 §2, already slow-biased). It is never unknown, so CMP-008 always decides.

## 5. Distance demand vectors

Weights say how key-session slots are shared once prerequisites allow. They are a **design default** built from the CREDIBLE synthesis of determinant weightings [wg1 §1: 5K/10K/half weightings CREDIBLE; marathon durability CORROBORATED; 100 km volume > pace CORROBORATED association]. 09 may refine them; changes go through the registry (`cmp.weight.<distance>.<node>`).

| Node | 5K | 10K | Half | Marathon | 50K | 100K |
|---|---|---|---|---|---|---|
| AER | .25 | .25 | .30 | .30 | .35 | .35 |
| THR | .20 | .30 | .30 | .15 | .10 | .05 |
| VO2 | .30 | .20 | .10 | .05 | .05 | .00 |
| ECO | .15 | .10 | .05 | .05 | .00 | .05 |
| DUR | .00 | .05 | .10 | .25 | .30 | .35 |
| MSP | .10 | .10 | .15 | .15 | .10 | .05 |
| FUEL | .00 | .00 | .00* | .05 | .10 | .15 |

\* Half marathon gets FUEL demand through CMP-008 when expected duration > 90 min.

Required levels (finish goal / time goal), design defaults, owned jointly with 03 and 09. 03 closes the set under prerequisites (v2):

| Distance | Finish | Time goal (adds) |
|---|---|---|
| 5K | HAB 2, AER 1, TOL 1 | THR 1, VO2 2, MSP 1 |
| 10K | HAB 2, AER 1, TOL 1, DUR 1 (v2: one value with the 90-min floor, Room A R6) | THR 2, VO2 2, MSP 1 |
| Half | HAB 2, AER 2, TOL 2, DUR 2 (v2: 3 runs, Room B R3) | THR 2, MSP 2, AER 3 |
| Marathon | HAB 2, AER 3, TOL 3, DUR 3, FUEL 2 (v3: 3 runs, d2-B R5) | HAB 3, THR 2, MSP 2, FUEL 3 |
| 50K | HAB 3, AER 3, TOL 4, DUR 4, FUEL 3 (v3: AER 3, d2-C R4; Contrarian dissent recorded) | MSP 2 |
| 100K | HAB 4, AER 4, TOL 4, DUR 4 (L5 optional), FUEL 3 (v2: AER/TOL 5 would demand 10 h/week, against the corroborated finish tiers, Room C) | MSP 2 |

For **every** distance, HEAT L2 is added when `Goal.expected_conditions = hot` (FEA-004). Registry IDs: `cmp.required.<distance>.<node>`. These floors are where criterion 9 bites: 03 converts each missing level into weeks using `cmp.min_weeks_per_level.<node>` and the load-progression caps of 05.

## 6. Build-time and run-time checks (owned by 07 §7 test harness)

- **CMP-CHK-1 Acyclic:** topological sort of all `(node, level)` vertices succeeds.
- **CMP-CHK-2 Closed references:** every prerequisite and every `SessionModule.prereq` points to an existing `(node, level)`.
- **CMP-CHK-3 Trainable:** every non-TOL level has ≥ 1 session module that trains it and an attainment criterion (threshold or exit test).
- **CMP-CHK-4 Reachable:** every required level in §5 is reachable from level 0 via edges; for a given plan, 03 computes the minimum weeks to reach it and reports "unreachable within horizon" as an infeasibility reason.
- **CMP-CHK-5 Advisory isolation:** no `advisory` node appears as a prerequisite of a non-advisory level.
- **CMP-CHK-6 Weights:** each distance column sums to 1.00 ± 0.001.

## 7. Open questions for sub-councils

1. Are TOL thresholds in duration right for run-walkers and slow runners? Frandsen's exposure was distance only [wg4 §1; factdesk2 §1, CREDIBLE (one cohort; several summaries)]; duration transfer is UNKNOWN, so the time-based thresholds here are design defaults.
2. Ultra demand vector and DUR L5 criteria: no trial supports back-to-backs [wg1 §6, ALLEGED].
3. Should PACE gate time-goal race-pace sessions? Kept advisory in v1.

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "CMP-005", "condition": "profile.injury_last_12m || (profile.other_sport_background != 'none' && profile.training_age_years < p('ctx.novice_training_age_years')) || profile.training_age_years < p('ctx.novice_training_age_years')", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'"}}
{"id": "CMP-001", "condition": "threshold_level(node.id) > state.levels[node.id]", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels[node.id]", "expr": "threshold_level(node.id)", "then": [{"op": "set", "target": "state.level_confidence[node.id]", "expr": "'measured'"}]}}
{"id": "CMP-002", "condition": "entry.test_result == 'passed' && level_prereqs_hold(entry.test_node, entry.test_level, entry.date)", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels[entry.test_node]", "expr": "max(state.levels[entry.test_node], entry.test_level)", "then": [{"op": "set", "target": "state.level_confidence[entry.test_node]", "expr": "'measured'"}]}}
{"id": "CMP-003", "condition": "weeks_between(state.last_exercised[node.id], today) >= p('cmp.decay_weeks') && !(node.id in ['TOL', 'AER', 'HAB'])", "on_unknown": "fire", "action": {"op": "set", "target": "state.levels[node.id]", "expr": "decay(state.levels, weeks_between(state.last_exercised[node.id], today), p('cmp.decay_weeks'))[node.id]"}}
{"id": "CMP-004", "condition": "state.level_rests_on_self_report[node.id] && (!(state.exp_path in ['calibrating', 'confirmed']) || node.id in state.exp_fallback_nodes)", "on_unknown": "fire", "action": {"op": "cap", "target": "state.levels[node.id]", "expr": "p('cmp.self_report_level_cap')[node.id]", "then": [{"op": "set", "target": "state.level_confidence[node.id]", "expr": "'estimated'"}]}}
{"id": "CMP-007", "condition": "event.type == 'choose_keys'", "on_unknown": "skip", "action": {"op": "set", "target": "week.key_slots", "expr": "choose_key_modules(week, week.quality_max)"}}
{"id": "CMP-008", "condition": "goal.expected_duration_s > unit.min_s * p('fuel.required_above_min')", "on_unknown": "fire", "action": {"op": "floor", "target": "demand.required_levels.FUEL", "expr": "(goal.goal_type == 'time' && goal.expected_duration_s > unit.h_s * p('fuel.l4_min_race_h')) ? p('fuel.required_level_long') : p('fuel.required_level_mid')"}}
{"id": "CMP-006", "condition": "exists(m.prereqs, q, state.levels[q.node] < q.level)", "on_unknown": "fire", "action": {"op": "set", "target": "m.eligible", "expr": "false"}}
{"id": "EXP-001", "condition": "state.exp_path == 'none' && has(state.exp_race) && state.exp_race.official_result_confirmed == true && state.exp_race.effort_all_out == true && days_between(state.exp_race.date, today) <= p('exp.race_max_age_days') && profile.training_age_years >= p('exp.training_age_min') && age_low(today) >= p('exp.age_min') && state.exp_claims_consistent && !exists(flags.active, f, f.kind == 'pain') && (profile.injury_last_12m != true || profile.injury_last_12w == false) && state.gate == 'proceed'", "on_unknown": "skip", "action": {"op": "set", "target": "state.exp_path", "expr": "'calibrating'", "then": [{"op": "set", "target": "state.exp_calibration_until", "expr": "date_add(plan.plan_start, unit.week_d * p('exp.calibration_weeks') - 1)"}, {"op": "emit_message", "msg": "MSG-EXP-PATH"}]}, "stage": "S2"}
{"id": "EXP-002", "condition": "state.exp_path in ['calibrating', 'confirmed'] && !(node.id in state.exp_fallback_nodes) && exp_level(node.id) > state.levels[node.id]", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels[node.id]", "expr": "exp_level(node.id)", "then": [{"op": "set", "target": "state.level_confidence[node.id]", "expr": "'declared'"}]}, "stage": "S2"}
{"id": "EXP-003", "condition": "week.is_calibration && !week.is_deload", "on_unknown": "skip", "action": {"op": "set", "target": "week.method_default_count", "expr": "p('exp.calibration_keys')", "then": [{"op": "set", "target": "week.key_slots", "expr": "['SES-M-008', 'SES-M-010']"}, {"op": "set", "target": "week.key_dose_mode", "expr": "'entry'"}, {"op": "emit_message", "msg": "MSG-EXP-CALIBRATION", "once": true}]}, "stage": "S7.1"}
{"id": "EXP-004", "condition": "state.exp_path == 'calibrating' && (state.exp_rpe_high_keys >= p('exp.fallback_rpe_sessions') || state.exp_missed_week || exists(flags.active, f, f.kind == 'pain') || state.exp_volume_ratio_min < p('exp.fallback_volume_ratio'))", "on_unknown": "fire", "action": {"op": "set", "target": "state.exp_path", "expr": "(state.exp_missed_week || exists(flags.active, f, f.kind == 'pain') || state.exp_volume_ratio_min < p('exp.fallback_volume_ratio')) ? 'fallen_back' : 'calibrating'", "then": [{"op": "set", "target": "state.exp_fallback_nodes", "expr": "state.exp_rpe_high_nodes"}, {"op": "emit_message", "msg": "MSG-EXP-FALLBACK"}, {"op": "regenerate", "from_stage": "S2"}]}, "stage": "S2"}
{"id": "EXP-005", "condition": "state.exp_path == 'calibrating' && days_between(state.exp_calibration_until, today) > 0 && state.exp_calibration_complete", "on_unknown": "skip", "action": {"op": "set", "target": "state.exp_path", "expr": "'confirmed'", "then": [{"op": "set", "target": "state.baseline_confirmed", "expr": "true"}, {"op": "set", "target": "state.level_confidence.HAB", "expr": "'measured'"}, {"op": "set", "target": "state.level_confidence.AER", "expr": "'measured'"}, {"op": "set", "target": "state.level_confidence.TOL", "expr": "'measured'"}, {"op": "emit_message", "msg": "MSG-EXP-CONFIRMED"}]}, "stage": "S2"}
{"id": "EXP-006", "condition": "state.exp_path == 'none' && has(state.exp_race) && state.exp_race.official_result_confirmed == null && state.exp_race.effort_all_out == true && days_between(state.exp_race.date, today) <= p('exp.race_max_age_days')", "on_unknown": "skip", "action": {"op": "emit_message", "msg": "MSG-EXP-CONFIRM-Q", "once": true}, "stage": "S2"}
```

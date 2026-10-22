# 02 — Competence tree (v5, architect)

Serves criteria 4 (competence tree with prerequisites and levels), 1 (determinants per distance), 10 (modules declare prerequisites), 5 (deterministic). Rule range: CMP-001…099.

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

`CompetenceState {node, level, confidence ∈ {measured, estimated, unknown}, source ∈ {log_threshold, exit_test, self_report}, achieved_on, last_exercised_on}`.

```
RULE CMP-001 | priority T5.110 | when a state threshold for node N level n is met by logged data | then set level(N) ≥ n, confidence = measured | because levels must be observable | evidence opening-systemsarchitect R4; hearing-1 §5 (UNKNOWN precedent → machine checks) | basis design_default | default? yes
RULE CMP-002 | priority T5.111 | when the exit test for N Ln is passed and all prerequisites of N Ln hold | then set level(N) = n, confidence = measured | because exit tests are the library's proof of competence (criterion 10) | evidence criteria.md C10; opening-firstprinciples, UNKNOWN (design default) | basis design_default | default? yes
RULE CMP-003 | priority T5.112 | when node N was not exercised for cmp.decay_weeks | then lower level(N) by 1 (TOL, AER, HAB recompute from the log instead) | because fitness is lost with inactivity; size unknown for recreational runners | evidence wg3 §3 detraining, CORROBORATED (direction, trained athletes); factdesk1 §4 return figures UNKNOWN | basis design_default | default? yes
RULE CMP-004 | priority T5.113 | when a level rests only on self-report (onboarding claim or backfilled entries) | then cap that node at cmp.self_report_level_cap[node] (2 for HAB, AER, TOL, DUR; 1 for THR, VO2, MSP, FUEL) with confidence = estimated, until contemporaneous log thresholds or an exit test confirm it | because self-reports are unverified and users may overstate history; weekly distance self-report is fairly reliable, pace and race times less so | evidence opening-contrarian §1.4; factdesk2 §6, CREDIBLE (distance) / UNKNOWN (race times) | basis design_default | default? yes
RULE CMP-005 | priority T1.110 | when TOL is computed and an injury in the last 12 months, other-sport background or novice status is present | then apply the context modifiers of 01 (slow progression profile) without changing the TOL level itself | because prior injury is the strongest risk factor; ex-cyclists/swimmers are higher risk | evidence hearing-1 §3, CORROBORATED; wg3 §2, CREDIBLE | basis evidence | default? no
RULE CMP-006 | priority T5.114 | when a session module requires N Ln and level(N) < n or any prerequisite of N Ln is unmet | then the module is ineligible | because prerequisites gate progression (criterion 4) | evidence criteria.md C4, C10, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE CMP-007 | priority T4.110 | when choosing which node a key-session slot trains | then pick the eligible node maximising weight(distance, N) × gap(N); ties broken by the fixed node order DUR, THR, AER, MSP, VO2, ECO, FUEL; when every weighted gap is 0, or the winner is AER or DUR, then in BUILD and SPECIFIC fill the slot from the active preset's 06 §5 module list for the phase, rotating by week index (never an easy run or a second long run); in BASE, or for a finish goal whose levels are all held, the slot becomes strides on an easy run (SES-M-006), shown as such | because sessions should close the largest weighted gap; a zero-gap or volume-node winner must not turn a key slot into easy running (F-09) | evidence opening-firstprinciples §3; opening-systemsarchitect R1; F-09, UNKNOWN (design default) | basis design_default | default? yes
RULE CMP-008 | priority T4.111 | when the goal race is expected to last > fuel.required_above_min (90 min) | then FUEL L2 is a required level; FUEL L3 only when the expected duration > fuel.l4_min_race_h (2.5 h) | because fuelling is needed above ~90 min, and 60–90 g/h applies only beyond 2.5 h (F-10) | evidence wg5 impl. 3, §3, CORROBORATED | basis evidence | default? no
```

`gap(N) = max(0, required_level(goal, N) − level(N)) / max_level(N)`.

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
{"id": "CMP-002", "condition": "event.type == 'exit_test_passed' && level_prereqs_hold(node.id, event.level, today)", "on_unknown": "skip", "action": {"op": "set", "target": "state.levels[node.id]", "expr": "max(state.levels[node.id], event.level)", "then": [{"op": "set", "target": "state.level_confidence[node.id]", "expr": "'measured'"}]}}
{"id": "CMP-003", "condition": "weeks_between(state.last_exercised[node.id], today) >= p('cmp.decay_weeks') && !(node.id in ['TOL', 'AER', 'HAB'])", "on_unknown": "fire", "action": {"op": "set", "target": "state.levels[node.id]", "expr": "max(0, state.levels[node.id] - 1)"}}
{"id": "CMP-004", "condition": "state.level_rests_on_self_report[node.id]", "on_unknown": "fire", "action": {"op": "cap", "target": "state.levels[node.id]", "expr": "p('cmp.self_report_level_cap')[node.id]", "then": [{"op": "set", "target": "state.level_confidence[node.id]", "expr": "'estimated'"}]}}
{"id": "CMP-006", "condition": "exists(m.prereqs, q, state.levels[q.node] < q.level)", "on_unknown": "fire", "action": {"op": "set", "target": "m.eligible", "expr": "false"}}
```

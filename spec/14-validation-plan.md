# 14 — Validation plan (v5.2)

Serves criterion **13** (validation: expert review, simulation/test cases, pilot users, metrics) and supports **11** (implementation-ready) and **5** (deterministic). Test IDs TST-001…; per-rule tests keep the `T-<ruleID>-fires` / `T-<ruleID>-silent` form (CONTRACTS §1.11). This module contains **no generation rules**.

> **In plain words.** Before anyone uses the tool, experts read every rule, and thousands of computer-generated runners are pushed through it to check that no plan ever breaks a safety limit, that the same inputs always give the same plan, and that first-time runners understand what to do. Then a small group of real runners tries it while we measure how many finish, how accurate predictions are and how many get injured. We will not claim the tool prevents injuries: no study can show that yet, and our pilot will not either.

## 0. What validation can and cannot show

- **Can show:** the rules are implemented as written (unit tests); no output breaks an invariant (property tests); output is deterministic (replay); plans resemble proven templates except where a logged rule changed them (conformance); each rule changes something (removal test); runners understand the output (comprehension test); outcomes in a pilot are in the range of published baselines (pilot).
- **Cannot show:** that adaptive plans reduce injury or improve adherence relative to static plans. No such comparison exists [factdesk1 §5, CORROBORATED that evidence is absent], vendor claims are ALLEGED [hearing-1 §5], and a deterministic rule is not therefore protective [hearing-1 §5 sys-crit, CREDIBLE]. Pilot benchmarks come from other populations and are **context, not targets** [opening-expansionist §3].
- **Release gate:** stages 1–8 must pass before any public use; stage 9 (comprehension) before the pilot; stage 10 (pilot) runs under its own stop rules (§10.4).

## 1. Expert review protocol

> **In plain words.** Coaches, doctors, physiotherapists and a dietitian review every rule in their field and say whether they agree, and why.

| Panel | Members (min.) | Reviews | Criterion focus |
|---|---|---|---|
| Coaching | 2 coaches (one road 5K–M, one road ultra) | 02, 03, 04, 05, 06, 09, 13 | 1, 3, 4, 9, 10 |
| Clinical | 1 sports physician, 1 sports physiotherapist | 01, 08 (§5–6), 10 | 7 |
| Nutrition | 1 registered sports dietitian | 11 | 7, 8 |
| Engineering | 1 rule-engine / software engineer | 07, 12, 14 | 5, 11 |
| Legal | 1 regulatory reviewer (EU MDR / FDA wellness) | 00 §6, 01, 10, 11 messages | wellness boundary |

**Procedure.**
1. Each reviewer receives the module, the rules in their range, the parameter rows they own and the cited research files.
2. For each rule they record: `agree / modify / reject`, reason, and whether the cited grade matches their reading. For each parameter: whether the default and range are acceptable.
3. Disagreement between reviewers is **not** resolved by vote. It becomes either a parameter with both values as presets, or a `default? yes` label with the conservative value [charter quality rule 3].
4. Results are logged as `TST-001` (review record per module). A module passes when every `reject` is answered (rule changed, or rationale published) and no T0–T2 rule has an unresolved clinical `reject`.
5. The legal review (`TST-002`) checks the factdesk2 §2 points (a)–(e) on every user-facing safety message; the status of a PAR-Q+-style screen is UNKNOWN [factdesk2 §2] and must be answered before public release.
6. This council's own audits are **internal**, never called independent [charter]. At least one reviewer per panel must have had no part in drafting.

## 2. Static checks at build

Run on every commit; any failure blocks the build.

| ID | Check | Source |
|---|---|---|
| TST-010 | Unique rule IDs; IDs inside the owner's range; unique `T<tier>.<nnn>`; `nnn` inside the module's block | 12 §3.4.1; CONTRACTS §1.3 |
| TST-011 | Overlap report: rule pairs in one PRIORITY tier with jointly satisfiable conditions and different non-numeric actions, listed for review | 12 §3.4.2 |
| TST-012 | Unreachable rules (condition unsatisfiable under enums and parameter ranges) | 12 §3.4.3 |
| TST-013 | Every parameter referenced exists with grade and basis (INV-12); no numeric literal other than 0, 1 in `when` | 12 §3.1, §3.4.4 |
| TST-014 | No blocking condition reads ACWR, monotony, Banister output or an age-predicted HRmax (INV-09, INV-10) | wg1 §3–4, CORROBORATED/CONTRADICTED |
| TST-015 | Every T0/T1 message has `is_safety_generic = true`; forbidden-term lint (condition names, "risk of", "you may have", scores) on all safety text (INV-24) | factdesk2 §2, CORROBORATED |
| TST-016 | Competence-graph checks CMP-CHK-1…6 (acyclic, closed references, trainable, reachable, advisory isolation, weights sum to 1) | 02 §6 |
| TST-017 | Every rule has ≥ 1 firing and ≥ 1 silent test, and both pass | 12 §3.4.8 |
| TST-018 | Glossary lint: every technical term in user text is in the glossary (15) or replaced | opening-outsider §3 |
| TST-019 | Nutrition lint NUT-INV-01, NUT-INV-02, NUT-INV-05 | 11 §8 |
| TST-020 | Every `default? yes` rule references ≥ 1 parameter with basis `dd` or `conv`; every rule whose evidence is ALLEGED/UNKNOWN is `default? yes` | 07 §1; CONTRACTS §1.4 |

## 3. Unit tests per rule

Each rule `X` has `T-X-fires` (minimal input where the condition holds; asserts the action and the `FiredRuleLog` entry) and `T-X-silent` (nearest input where it does not; asserts no action). Tests are table-driven fixtures: `{inputs, registry_version, expected_action, expected_log}`. Numeric boundaries are tested at the parameter value, one unit below and one above (`TST-030`, boundary suite). When a registry value changes, the boundary suite regenerates from the registry, so tests never hold literals [opening-executor R2].

## 4. Invariant property tests

> **In plain words.** A computer invents tens of thousands of runners, goals and life events and checks that every plan it produces keeps every safety limit.

**Generator** (`TST-040`): random but seeded draws over
- profile: age 14–85, sex ∈ {f, m, unspecified}, training age 0–30 years, other-sport background, injury last 12 months, special statuses, screening answers;
- log: none / sparse / rich, with gaps 0–400 days, implausible entries, backfill bursts, inflated claims;
- availability: 1–7 days, 60–900 min/week, blocked dates;
- goal: all six distances plus none, finish/time/maintain/base, horizons **1–200 weeks**, normal/hot;
- presets: all `SchoolPreset`s, including incompatible pairs;
- event streams: random `AdaptationEvent` sequences over the plan's life (missed, partial, unlogged weeks, illness, pain, fatigue, results, availability and goal changes, red flags).

**Assertions on every emitted plan and every re-plan** (`TST-041`): INV-01…31 (v5, p2-B R9) and NUT-INV-01…07 hold; or the output is a fail-closed `RepairOption[]` whose every option itself passes. Minimum run: 100,000 generated cases per release, seed logged; any failure is shrunk to a minimal counter-example and added to the regression set.

**Metamorphic properties** (`TST-042`), each asserted over the generator:

| ID | Property |
|---|---|
| TST-042a | Adding a missed session never increases any future week's planned time, distance or long run (INV-04). |
| TST-042b | Lowering a claimed L30 or weekly volume never increases any planned session. |
| TST-042c | Adding an active red flag yields zero running sessions until attested clearance (INV-05). |
| TST-042d | Making a time goal slower never turns a feasible verdict infeasible. |
| TST-042e | Moving the race date later (same goal) never turns a feasible verdict infeasible, within `goal.date_search_max_weeks`. |
| TST-042f | Replacing a measured anchor by the same value with `confidence = estimated` removes every pace target (INV-15). |
| TST-042g | Removing available days never increases weekly planned time. |
| TST-042h | Any sequence of adaptation events followed by "nothing happens" for 8 weeks yields a plan whose long run never exceeds `spike.warn_ratio` × L30_eff of the logged data. |

## 5. Edge-persona grid

> **In plain words.** Thirty hand-made runners cover the cases most likely to break the method. For each, we know in advance what a safe answer looks like.

Each persona has a frozen expected outcome (gate result, verdict, phase outline, key invariants). Expected outcomes are written by the expert panels, not by the engine. IDs `TST-050-Pnn`.

| P | Persona | Expected outcome (summary) |
|---|---|---|
| 01 | Zero history, no anchor, 5K in 10 wk, 3 days | ONBOARD effort-only; L30 undefined → RTR/onboard rung; feasible or stretch |
| 02 | 6 weeks off after a half, wants marathon in 16 wk | G3 → RTR; feasibility re-run; likely options |
| 03 | 17-year-old wants a marathon | `no_plan` for M (minor.marathon_min_age); options ≤ minor table |
| 04 | 15-year-old wants 10K | goal capped by recommended table (8 km) → shorter-distance option |
| 05 | 8 weeks postpartum | `no_plan` (pp.min_weeks) with generic message |
| 06 | Pregnant prior runner | maintenance mode only, stop signs shown |
| 07 | 100 km in 24 wk on 3 h/week | infeasible → ranked options; never a squeezed plan |
| 08 | 2-week plan to a 10K, currently fit | SHARPEN; no build, no deload |
| 09 | 2-week plan to a marathon, never run 20 km | infeasible (PHS-011) → options |
| 10 | Inflated claims: L30 30 km claimed, weekly 25 km | GEN-022 confirm; L30_eff ≤ 0.6 × weekly; slow profile |
| 11 | Implausible entry: 42 km at 2:30 min/km | flagged (GEN-020); excluded from caps |
| 12 | Backfills 40 runs in one evening | bulk → estimated; sparse handling |
| 13 | Masters 68, wants VO2 intervals | assessment advice (masters.vigorous_assessment_age); E ≤ E2 until attested |
| 14 | Masters 58, injury last 12 m, M time goal 16 wk | slow profile, deload every 3 |
| 15 | PAR-Q+ "yes" to chest pain | `pause_until_clearance`, generic message |
| 16 | Prior high-risk bone-stress site, now cleared | RTR only after professional clearance; no in-app protocol before |
| 17 | Ex-cyclist, high aerobic fitness, no running | tolerance novice, slow profile; intensity may start higher |
| 18 | Night-shift nurse, 4 days/week | ADP-072 swaps on shift days; no catch-up |
| 19 | 12 h/week sub-elite marathoner | Knopp high tier; no INV-23 flag expected |
| 20 | Run-walk only, 10K finish | INV-02 duration caps binding; talk test with RPE |
| 21 | Fever in taper week | ADP-041/044; race "not recommended"; no catch-up |
| 22 | Pain 4/10 two sessions running | ADP-052 then ADP-053 → pause |
| 23 | Repeated fatigue for 3 weeks | ADP-055 → 056 deload + REDs screen → 057 referral freeze |
| 24 | Positive REDs screen, male | NUT-051 freeze; generic referral |
| 25 | Marathon in heat, unacclimatised | HEAT L2 required; effort-based race plan |
| 26 | Ultra, wants 120 g/h, tolerated 70 g/h | race plan capped at 70 (INV-18); L4 refused |
| 27 | Diabetes declared | NUT-002: no numeric fuelling targets |
| 28 | Goal-date shopping: 5 edits in 2 days | GEN-031 margin; GEN-032 claims estimated |
| 29 | Multi-year: 3-season plan to 100 km | PHS-012 first season detailed only; no projected gains |
| 30 | Unlogged 3 weeks mid-plan, then "I did not run" | ADP-003 → gap band G2/G3 path |
| 31 | 100 km with back-to-backs enabled, TOL L4 only | DUR L5 not reached → back-to-backs refused |
| 32 | Faster 10K result by 6% | v5.1: inside the confirmation band → ADP-067: paces unchanged, result pending (MSG-ADP-PACE-PENDING); a second result > 3.5% faster within 42 days → paces from the mean of the two |
| 33 | Claims only, 210 min/week, 360 min available, marathon in 18 weeks (Ana, 13 §3) | v5.1 LOD-007: weekly time ≤ 1.10 × best of the last 4 logged weeks until 6 logged weeks confirm the baseline (LOD-008): 231, 252, 277, deload 207, 304, 334, then 360 |

**Context grid** (`TST-051`) [opening-contextrealist §3]: time budget {3, 6, 9, 12 h/week} × horizon {4 wk, 16 wk, 2 yr} × distance {5K, 10K, HM, M, 50K, 100K} × profile {novice, masters 65+, age 16, postpartum, prior bone-stress, shift worker} = 432 cases. Assert: no gate bypassed, no cap broken, every infeasible case yields ≥ 1 validated goal-level option, and every special-population case shows its generic message.

## 6. Conformance fixtures against published plans

> **In plain words.** Given the inputs a well-known plan was written for, our tool should produce something close to that plan. Where it differs, it must say which safety rule made the change.

**Fixtures** (`TST-060…067`; all [author] or [state] sources): Higdon Novice 1, Hansons beginner, Pfitzinger 18/55, Daniels 2Q, Galloway run-walk, a Koop-ordered 50K/100K, **NHS Couch-to-5K** (9 weeks, 3 runs; week 1 = 60 s run / 90 s walk for 20 min [factdesk3 §2, CORROBORATED]; TST-066) and **FIRST** (3 quality runs + 2 cross-training; TST-067). FIRST stays `pending_fixture` until its table is encoded (Room A R9). Each fixture stores the skeleton: volume curve shape, long-run peak, quality sessions per week, taper weeks, TID [opening-statusquo §3].

**Data caveat.** Week-by-week sequences are not confirmed: Higdon's commonly cited sequence is ALLEGED; Hansons' and Pfitzinger's weekly figures are UNKNOWN [factdesk2 §7]. Fixtures must be encoded from the primary books before these tests can pass; until then they run in "report-only" mode.

- **Forward test** (`TST-066`): matching inputs → output within tolerance on everything the caps do not touch: ±`val.conformance_tol_pct` on weekly volume and long-run peak; exact on quality count and taper weeks. Every departure must have a `DeviationLedgerEntry {rule_id, criterion, grade, delta}`; an unexplained departure fails.
- **Reverse test** (`TST-067`): run the safety overlay (INV-01/02/03/13) on each fixture as written. Each flag is either a recalibration finding for the parameter owner or a user-facing warning, never a silent fix. Expected: Higdon Novice 1 triggers hold steps for step-ups above 1.10× (7 of 9 if the cited sequence is right [factdesk2 §7, desk computation on an ALLEGED sequence]) and breaks the Daniels long-run cap at peak [wg2 §1, CORROBORATED/CREDIBLE].

## 7. Removal test

> **In plain words.** We delete each rule in turn and see whether any plan changes. A rule that never changes anything is either display text or a mistake.

`TST-070`: for each rule R, rebuild all personas (§5) and a 1,000-case seeded sample from §4 with R disabled. R is **material** if, in any case, a gate outcome, verdict, phase outline, session effort, or session duration/distance changes by more than `val.removal_material_pct`. Non-material rules are reported:
- T0–T2 rules with no material case → add a persona that makes them fire (they may guard rare cases); if none can be built, the rule is unreachable (TST-012).
- T4–T6 rules with no material case → candidate for `advisory`/display-only status, decided by the architect [opening-firstprinciples §2].

## 8. Determinism replay

`TST-080`: the same `(profile, goal, log, today, ruleset_version, registry_version)` must give byte-identical `Plan`, `ValidationReport`, `DeviationLedger` and `FiredRuleLog` (GEN-004) across: 100 repeated runs; two operating systems and two runtime versions; shuffled insertion order of log entries and same-day events (ADP-012); different time zones of the server (dates are local to the runner). `TST-081`: a registry or ruleset version bump on a frozen fixture set produces a diff report; every changed session must trace to a changed rule or parameter. `TST-082`: re-plan chains (event → plan v2 → event → v3 …) replayed from stored events reproduce every stored version.

## 9. Comprehension test with first-time runners

> **In plain words.** We show real beginners one week of a plan and the "stop" card, and check they can tell us, unaided, what to run tomorrow, how hard, and when to stop.

`TST-090` [opening-outsider §3]: `val.comprehension_n` first-time or novice runners (no coach, no prior plan), recruited across ages including ≥ 1 aged 60+ and ≥ 1 non-native English reader. Each reads one generated week (persona P01 or P20), the red-flag card and one adaptation message. Unaided, they answer:
1. What do you run tomorrow, and for how long?
2. How hard? (expected answer in effort-ladder words, e.g. "I can talk in full sentences")
3. Name one sign that means stop and see a professional.
4. You missed Tuesday's run. What do you do? (expected: nothing; do not make it up)
5. What does "coaching convention / our cautious default" mean on this rule?

Pass: ≥ `val.comprehension_pass_pct` of participants answer questions 1–4 correctly. Any failed item → message rewrite and retest. The talk test is validated for continuous running only; its validity for novices and run-walk is UNKNOWN [factdesk2 §5], so question 2 is also checked for run-walk personas.

## 10. Pilot with pre-registered metrics

> **In plain words.** A small group of real runners uses the tool for a full plan. We publish in advance what we will measure and compare it with published numbers, without claiming the tool is better.

### 10.1 Design
- Opt-in, informed consent, anonymised outcome log; ethics review before start.
- `val.pilot_n` runners across the three families, at least 30% novices and at least 20% aged 50+; ≥ 30% women (published cohorts are ~80% male [hearing-1 §3, CORROBORATED]).
- One full plan per participant (or 24 weeks, whichever is shorter), plus 4 weeks follow-up.
- Outcomes are self-reported (manual log only): injury = running-related pain that stopped or reduced training for ≥ `val.injury_days_lost` days; site recorded as free text, never interpreted.

### 10.2 Metrics (pre-registered)

v5: pilot metrics carry the prefix `PM-` (formerly TST-100…110), so that TST ids name only automated suites and fixtures (p2-B R9).

| ID | Metric | Baseline for context only | Source |
|---|---|---|---|
| PM-100 | Race/test prediction error (MAE %, point vs actual) and share inside the predicted band | published errors 5.9–8% | wg1 §7, CORROBORATED |
| PM-101 | Plan completion (finished plan or raced goal) | C25K 27.3% (different population, no control) | wg3 §5, CREDIBLE (Relph 2023, single study) |
| PM-102 | Attrition at 4, 8, 12 weeks | novice attrition 42–53% | hearing-1 §2, CORROBORATED |
| PM-103 | Injuries per 1,000 h of running | novices 17.8; recreational 7.7 | wg4 §2 Videbæk, CORROBORATED |
| PM-104 | Sessions done / planned; share of weeks unlogged | none | — |
| PM-105 | Red-flag triggers, pause durations, clearance attestations | none | — |
| PM-106 | Fail-closed rate and option chosen | none | — |
| PM-107 | Spike-cap warnings on runner-edited sessions; overrides | none | wg4 §1 |
| PM-108 | Knopp range flags (INV-23) per tier | weekly 43/59/108 km, longest 31–35 km, Z4–5 ≈ 6% | wg2 §2, CORROBORATED (description) |
| PM-109 | Fuelling: race-day intake vs plan; GI complaints | none | wg5 §3 |
| PM-110 | Self-reported understanding (post-plan survey) | none | opening-outsider |

**Reporting rule.** Results are shown next to baselines with the caveat "different population, no control group". Words such as "fewer injuries", "safer" or "more effective" are forbidden in any report or marketing derived from the pilot [factdesk1 §5].

### 10.3 Knopp range flags
`TST-111`: over the persona grid and pilot plans, count INV-23 flags by tier. Ranges describe what 92 published plans prescribe, not what works [wg2 §2]; a high flag rate triggers expert review, never automatic recalibration.

### 10.4 Stop rules (design defaults)
- Any serious adverse event (hospital visit linked to training) → pilot paused, case reviewed by the clinical panel within 7 days.
- Injury rate above the novice baseline (17.8/1,000 h) after ≥ `val.pilot_min_hours` total hours → pause and review the load parameters.
- Any user-facing safety message found to name a condition → fix before resuming (INV-24).

## 10b. v2 additions (sub-council round 1)

- **TST-120 Round-1 fixtures** (v5: renumbered from the second TST-070, p2-A R10, p2-B R9). Every walk-through case of rooms A, B and C becomes a golden fixture with the v2 expected verdict:
  - Room A cases 1–6 (P01 novice 5K → stretch at 10 weeks);
  - Room B Ana, Ben, Dev, Chloé, Eva;
  - Room C cases 1–3.
  - Plus the five personas of 13 (v2 outcomes).
- **TST-071 Baseline hold.** A property test: outside deload, taper, transition, RTR and SHARPEN, no planned week falls below V_hold or L_hold unless a T0–T3 limit or a spike cap requires it (INV-27).
- **TST-072 Re-plan stability.** Replay noisy logs: random RPE ±2, a 3% faster or slower result, single unlogged days. Assert:
  - no session inside the published window changes except reductions (ADP-014);
  - paces change only past the minimum detectable change (`pace.mdc_mult` × `pace.test_te_pct`), or after two consistent results beyond `pace.deadband_pct` (ADP-067, v5.1);
  - INV-04 holds by load ordinal.
  - A weekly "plan nervousness" metric (sessions changed per re-plan) is reported [hearing-2 sys, CORROBORATED as a general practice].
- **TST-073 Degraded completion.** Illness or pause scenarios at every week of the last third of a plan. Assert:
  - done phases are never re-added;
  - a credited peak keeps the goal;
  - FEA-043 emits a plan rather than failing closed when a safe completion exists.
- **TST-074 Preset completeness** (INV-26), static.
- **Pilot metric (Room B R6).** Injuries per 1000 h in weeks containing a long run > 150 min versus all other weeks, with a review trigger at a rate ratio > `val.long_run_review_ratio` (1.5, design default). Also record the longest training run against race-day injury, to test the Toresdahl association in this population [factdesk3 §5, CREDIBLE (one cohort; several summaries)].

## 10c. v3 additions (sub-council round 2)

- **TST-075 Round-2 fixtures,** with the expected v3 verdicts listed in 13 §6:
  - room A: case 2 (3-run 10K) and case 4 (H2, same-distance band);
  - room B: P3, Fatou, Gil, Hana;
  - room C: the 8:45 and 10:00/km variants, the cut-off case, the C2 illness case, and an accepted NUT-034 shortening.
- **TST-076 Feasibility–generator agreement.** For random profiles, the dry run's verdict and weeks must equal what the generator actually produces. This includes the week fill (FEA-020/031, LOD-016). Any plan whose fill cannot reach V_req must carry AVAILABILITY_DAYS.
- **TST-077 Long-run guard.** No emitted run is over 180 min without TOL L4 measured (INV-28). Every such run is run-walk.
- **TST-078 Post-gap window.** After every 8–29-day gap, no run in weeks 2+ exceeds 1.10 × the longest *post-gap* run (LOD-011).
- **Pilot additions (d2-B R3).**
  - Injury per 1000 h in weeks with an extension run, against other SPECIFIC weeks.
  - Uptake rate of the extension offer.
  - Race-day injury by longest training run (continuous), to test the Toresdahl association [factdesk4 §2].

## 10d. v4 additions (plenary round 1)

- **TST-122…125 (p1-A cases 1–4; v5: renumbered from TST-079…082, which collided with TST-080 determinism):**
  - Lea, marathon → 10K switch (carry-over, INV-13);
  - Tom, 5K → 100K over 100 weeks (season split, test → deload);
  - Raj, half in 4 weeks with a measured 17 km (demand met by logged distance);
  - Mia, 2 runs a week (2-run share cap, family `base`, FEA-031 in H1).
- **TST-083…089 (p1-B cases A–G):**
  - A: P1 parkrun fixed at week 10 (LADDER_RUNWALK, ladder gaps, SAF-084);
  - B: Fatou, fever and busy weeks (expected-duration guard);
  - C: 67-year-old, 50K (SAF-060, LOD-018, recurring pain ADP-053);
  - D: pregnancy → postpartum (SAF-081 30-min row);
  - E: 17-year-old marathon (per-date minors' caps);
  - F: night-nurse roster (onboarding AVAILABILITY_DAYS);
  - G: half in 4 weeks with fever (degraded completion).
- **TST-121 Record sync and implementation readiness** (v5: renumbered from the second TST-090). `design/v5/tools/build_rules.py` regenerates `rules.json` from the module texts only (RULE lines + `rulexpr` blocks); `design/v5/tools/check_rules_v5.py` then checks: every T0–T2 rule, INV and MVP rule is `formal`, `procedure` or `static`; typed actions match 12 §3.3; every path, root and function is declared in 12 §2b; no literal other than 0, 1 and `unit.*`; every `p()` id is in parameters.md; every parameter and rule has a grade or basis `eng`; no restrictive T0–T2 record has `on_unknown = skip`; text-only records carry `on_unknown = null`; every message id resolves. The build fails if any persona in the grid produces an error value (E) (12 §3.2). **v5 result: build OK, all checks pass** (CHANGELOG-v5 §3). **v5.2 additions to `check_rules_v5.py`:** stage and scope on every evaluated record and the event catalogue (12 §3.5); action fields against 12 §3.3/§3.3b; a type for every path; comprehension-variable fields against the element types (12 §2b.2b and `spec/schema`); no bare identifiers; `parameters.json` rebuilt from `parameters.md` and every `p()` id with a machine line; the JSON Schemas valid and every file of `spec/fixtures-input/` valid against them; every field an invariant reads declared in `result.schema.json`; a dose ladder for every module of 06 §2c; unguarded reads of nullable fields reported (INFO). `check_messages_v5.py` adds L9 (record placeholders exist in the message text) and L10 (every message id named in a module is defined). **v5.2 result: both pass.**
- **TST-091 Metamorphic suite.** M-1…M-8 (07 §5a) on ≥ `val.property_cases_min` random profiles.
- **TST-092 Parity.** Every feasible grid persona validates with **zero repairs** (p1-A R9).
- **TST-093 Day-0 traces** (p1-C R10): P2 and P3 from onboarding to their first field test, with claims only, asserting the verdict, labels and messages shown each week.
- **TST-094 Message catalogue lint** (v5: implemented as `design/v5/tools/check_messages_v5.py`, lint L1–L8 of messages.md §10). Every message ID used in a rule exists in messages.md. Every placeholder has a type and display rounding. No rule ID, reason code or condition name appears on the card or why layers (07 §9, INV-24). The comprehension test (§9) now includes the verdict, reason and option screens.


## 10e. v5 additions (plenary round 2)

**Test-ID allocation (v5).** TST-001…094 as before; TST-095…106 red-team fixtures (p2-C R12); TST-110…112 oracles (p2-B R10 asked for TST-095–097, which room C had already taken); TST-120…128 renumbered and new fixtures; pilot metrics are PM-100…110. `check_rules_v5.py` lists any duplicate id in 14.

- **TST-095…106 Red-team fixtures (p2-C cases 1–12).** Each is a golden fixture with the v5 expected outcome (13 §7 gives the traces):

| TST | Case | Expected v5 outcome |
|---|---|---|
| TST-095 | 58, unsure on the PAR-Q+ chest-pain item | No "I don't know" is offered (INP-001); a closed, incomplete screen is no screen: `no_plan`, MSG-SCR-001 (SCR-001). **Unknown item → no_plan.** |
| TST-096 | Week 6, pain 2/10, symptom form closed unanswered | `on_unknown: hold`: no session shown, MSG-SAF-HOLD only; no flag, no emergency text (12 §3.2) |
| TST-097 | Marathoner always taps "done as planned", skips the pain tap | Each tick asks "Any pain?"; next-morning prompt after long runs; with < 70% of the last 14 days' sessions answered, no step-up or unlock (LOD-006, MSG-LOD-PAIN-ANSWER) |
| TST-098 | Pregnant runner, attested week 30, gives birth week 40 | due_date stored; from due_date − 14 days "Have you given birth?" before each session; from due_date no sessions until answered; yes → postpartum `no_plan` (SAF-054 → SAF-052) |
| TST-099 | Never-runner backfills 27 ladder sessions in one evening | INP-021 → estimated; SAF-082 counts only sessions dated on or after the ladder start, one per day, with rest spacing, ≤ rtr.max_runs_per_week a week; backfill advances ≤ 1 rung per 7 days → stays at S1 or S2 |
| TST-100 | 35 M, true 10K 55:00, enters "40:00 yesterday" | INP-025: > 2 × deadband faster than the claim band → confirm prompt; anchor stays `estimated`, no paces until a field test agrees; two E3 sessions at RPE ≥ 8 → paces eased (ADP-066) |
| TST-101 | Training age < 3 months, claims 60 km/week and a 25 km long run | GEN-022 confirm prompt (novice, weekly time above the TOL 2 band); L30_eff from claims ≤ claim.l30_cap_by_tol[2] = 90 min → first long run ≤ 99 min (GEN-011, LOD-010) |
| TST-102 | Weekly goal switch to a half marathon "next Sunday" | INV-31 / FEA-044: HM needs 14 days after the previous goal race → RACE_TOO_SOON, option "race on or after {date}"; TRANSITION survives the goal change (ADP-080) |
| TST-103 | Birth year left blank, "18+? yes" | Birth month and year are required (INP-001); no plan until entered; no age message uses a default age (lint L8) |
| TST-104 | 18-year-old born February 2008, onboarding on 21 Oct 2026 | age_low = 18 (birthday assumed 29 Feb, INP-002) → adult, no guardian attestation |
| TST-105 | 5K finish, race week at S5 | FEA-043b: 5 km × 660 s/km + 5-min warm-up = 60 min against 2.0 × the longest logged ladder session incl. warm-up walk: at S5 that is 26 min → 52 < 60 → **earliest date offered**; at S6 (30 min → 60) or later, with the last 3 sessions clean → degraded completion as run-walk at E1–E2 with race-morning symptom questions; any unknown input → earliest date (13 §7c) |
| TST-106 | 62-year-old with an injury last year | MSG-CTX-003 why "After an injury, a gentler build-up is the usual cautious approach."; lint L5 finds no risk, heart or likelihood words in attribute messages |

- **TST-110…112 Oracles (Q-01, p2-B R10; 07 §5a).** An independent oracle, written from the 03 §2–§4 and 05 §2–§5 text by someone who has not read the generator, computes for (a) **demand** (L_req_time, floor_dist, V_req), (b) **weeks_needed** and the verdict, (c) **the long-run curve** (week-by-week LR and V for one persona). Each must agree with 13's hand values (P1, P3, P5 tables of 13 §2–§4) and with the fixtures TST-075, TST-083…089 and TST-120…125 before the S group counts as tested. Differential (oracle vs generator) and metamorphic tests (TST-091) are both kept; neither is claimed superior [factdesk6 §5, CORROBORATED that they find different defects].
- **Oracle fixture values (post-audit, 13 R-05).** TST-110…112 must reproduce, with floor() applied to every cap: P3 wk 4 V 207; (v5.1, LOD-007/008) wk 5 V 304, wk 6 V 334, wk 7 V 360; wk 9 LR 162; wk 10 LR 178; wk 11 LR 180; wk 12 deload V 270 / LR 135; wk 13 extension ≤ 198; FUEL L2 reached in wk 8 (v5.2; was wk 10 under the v5 phase outline); P3 slack 4 and phases ONBOARD 1–2, BASE 3–6, BUILD 7, SPECIFIC 8–15 (v5.2); P5 illness wk 18 LR 224 and tune-up 246; Lea's range 47:02–52:26; Tom's day-0 fast edge 47:24 and FT-1 fast edge 46:48; Karim 52:52–62:48; Maya LADDER_RUNWALK 60 ≤ 66. `tools/audit_final.py` (run folder) recomputes most of these; a check that every hand value equals floor() of its cap is part of TST-110.
- **TST-126 CEL truth tables.** The evaluator returns CEL's four values exactly: for `&&`, `||`, `!`, comparisons and every §2b.3 helper, with each argument in {true, false, error, unknown}; absent undeclared paths give error, declared unknowns give unknown; `on_unknown` ∈ {fire, hold, ask, skip} acts as 12 §3.2 says [factdesk6 §4, CORROBORATED].
- **TST-127 Karim (p2-A case A).** 45, 3 runs/week, 25 km/week, 10K 58:00 entered at onboarding (estimated), sub-55 in 10 weeks: FEA-021 counts only weeks that can hold key sessions (W − taper − ONBOARD = 6 < K_key 8) → **infeasible (LEVELS_UNREACHABLE)**; the card shows "53:00 to 1:03:00, most likely around 57:00. Your goal 55:00 is inside this range." and the validated options move_date (≥ 12 weeks), lower_goal (finish), shorter_distance (13 §7b).
- **TST-128 Rose (p2-A case).** Any AVAILABILITY_* reason with other reasons → the combined option "Add a run on {day} and race on or after {date}" is generated, validated and shown first among combined options (FEA-040).
- **TST-130 Contract (v5.2).** Every generator result validates against `spec/schema/result.schema.json`, is canonically serialised (`spec/schema/README.md`), and every persona of `spec/fixtures-input/` produces a result of the kind the oracle expects; the oracle parses results only through the schema.
- **TST-131 Weekly session choice (v5.2).** For the persona grid: S7 sub-steps run in the order of 07 §2b; no week holds two hard days back to back (the long run counts); no 3-run week holds 2 key sessions; every key session's dose is a step of `ses.dose.<id>.steps` at most one above its last logged step; a level test follows SES-012 and is judged by SES-024; with `level_tests_opt_out` no test is planned and SES-025 credits levels.
- **TST-129 Messages and readability.** `check_messages_v5.py` passes (L1–L8); the comprehension test (TST-090) includes the safety-hold, pain-tap and due-date screens.

## 11. Traceability

`TST-120`: a generated matrix links each criterion (1–13) → modules → rules → tests; every criterion has ≥ 1 test, every rule ≥ 2 tests (fires/silent), every invariant ≥ 1 property test. Missing links fail the release gate.

## 12. Parameters proposed

| ID | Default | Unit | Range | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|
| val.conformance_tol_pct | 10 | % | 5–15 | design choice | dd | opening-statusquo §3 | 14 |
| val.removal_material_pct | 5 | % | 2–10 | UNKNOWN | dd | opening-firstprinciples §2 | 14 |
| val.property_cases_min | 100000 | cases | ≥ 10000 | — | dd | design | 14 |
| val.comprehension_n | 8 | runners | 5–8 | design choice | dd | opening-outsider §3 | 14 |
| val.comprehension_pass_pct | 80 | % | 70–90 | design choice | dd | opening-outsider §3 | 14 |
| val.pilot_n | 60 | runners | 40–150 | UNKNOWN (no power basis: no effect claimed) | dd | design | 14 |
| val.injury_days_lost | 7 | days | 1–14 | UNKNOWN (definitions vary) | dd | wg4 §2 | 14 |
| val.pilot_min_hours | 2000 | h | 1000–5000 | UNKNOWN | dd | design | 14 |

## 13. Conflicts with contract / other modules (v1 record; resolved in RESOLUTIONS.md)

1. **Test ID scheme.** CONTRACTS uses both `TST-nnn` (this module) and `T-<ruleID>-fires/silent` (all modules). I keep both: `TST` for suites, `T-…` for per-rule cases; TST-017 links them.
2. **Fixture data are not available.** Conformance tests (§6) cannot pass until the primary books are encoded [factdesk2 §7]; they run report-only in v1.
3. **INV-23 owner.** `knopp.range` lists 14 as owner while INV-23 sits in 07; 14 only runs and reports it.
4. **Persona expected outcomes** depend on rules not yet written (01, 03, 05, 06, 09, 10). The table in §5 states intended outcomes; panels must confirm them against the final rules.

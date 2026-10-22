# 00 — Overview (v5.2)

Status: **v5.2**, 22 Oct 2026: v5.1 plus the completed build contract (Engine session, part A; `CHANGELOG-v5.2.md`): JSON schemas for the generator's input and result, complete persona inputs, the engine glue (rule binding, write composition, evaluation loop, stored engine state, blank/unknown/null, repair records, a machine parameter registry), the ordered weekly session choice with dose ladders and level tests, Ana's worked plan rewritten to the 04 §3 phases, and machine records for every MVP rule (release blocker B-4 closed in the rule base; nothing has been executed by an engine yet). Owner decisions of 22 Oct 2026 in `CHANGELOG-v5.2.md` §2. **v5.1**, 22 Oct 2026: v5 plus four targeted fixes from the external review of v5 (study grades, pace deadband, weekly cap for estimated baselines, consistency fixes; `CHANGELOG-v5.1.md`). No new audit has been run after these fixes. v5 (final design version, 21 Oct 2026): Revised after plenary round 2 (acceptance pre-check, implementation readiness, red team) and factdesk6. Earlier versions: v4 (plenary round 1), v3, v2, v1. Changes: `CHANGELOG-v5.1.md` (v5 → v5.1), `CHANGELOG-v5.md` (v4 → v5) and the earlier changelogs; decisions: `RESOLUTIONS.md` (Round 1, Round 2, Plenary round 1, **Plenary round 2**).

## 1. Purpose

> **Research method (disclosed, post-audit).** All research for this method used WebSearch result summaries only; no primary source (paper, book, guideline document) was opened. CORROBORATED (two independent summaries agree) is therefore the ceiling; nothing in the method is VERIFIED. A finding from one study is at most CREDIBLE, however many summaries repeat it.

The method turns a runner's current state, goal, time and constraints into a training plan, then re-plans it as life happens. It has four jobs, in this order:

1. **Keep the runner safe.** Screen, stop on red flags, and never prescribe a session that breaks a hard load limit.
2. **Be honest about the goal.** Say whether the goal fits the time available, and if not, offer ranked alternatives instead of a squeezed plan.
3. **Close the gap.** Allocate the available sessions to the competences that most limit the goal.
4. **Adapt without catching up.** Re-measure, re-plan, and drop missed work rather than pile it onto later weeks.

> **In plain words.** You tell the tool where you are, what you want and how much time you have. It first checks it is safe for you to train, then tells you honestly whether the goal fits. It builds a plan from proven templates, checks every session against safety limits, and explains every choice. When you miss runs or feel unwell, it adjusts; it never makes you "make up" lost runs. It does not replace a doctor.

The method makes no claim that adaptive plans prevent injury: no study compares adaptive and static plans [factdesk1 §5, CORROBORATED that evidence is absent], and a graded novice programme was not protective [wg4 §1 Buist 2008, CORROBORATED].

## 2. Scope

| In scope | Out of scope |
|---|---|
| Road / flat running; 5K, 10K, half, marathon, 50–100 km road ultras | Trail, elevation, technical terrain (criteria scope note) |
| Self-coached runners from first run to sub-elite; ages 14+ with caps (minors) | Coach-in-the-loop features; clinical rehabilitation protocols |
| Plan horizons from 1 week to multi-year (chained seasons) | Diagnosis; meal plans; weight-loss targets [wg5 impl. 9, CREDIBLE] |
| Run-walk as a first-class mode [wg2 §1 Galloway, CORROBORATED] | Multi-day stage races |

## 3. Architecture

```
            ┌──────────────── Parameter registry (parameters.md) ────────────────┐
            │  every number: default, range, unit, school presets, grade, basis  │
            └───────────────┬─────────────────────────────┬──────────────────────┘
                            │ read-only                   │ read-only
 Inputs (01) ──► [1] SAFETY GATE (01,10) ──BLOCK──► stop + refer message
  profile,           │ CLEAR / RESTRICTED / SPECIAL
  log, goal          ▼
               [2] STATE ESTIMATION (01,02,05) : S = {V, L30, anchors, F, flags,
                    │                             competence levels, confidence}
                    ▼
               [3] DEMAND + FEASIBILITY (03,09,02) ──INFEASIBLE──► ranked repairs
                    │ feasible / stretch          (move date → lower goal → shorter distance)
                    ▼
               [4] PHASES (04) ─► [5] TEMPLATE + PRESET (06,09) ─► [6] WEEKS (05)
                    ─► [7] SESSIONS (06, competence gaps 02)
                    ▼
               [8] INDEPENDENT VALIDATOR (07 §5, invariants INV-xx) ◄──────┐
                    │ pass                       │ fail                    │
                    ▼                            ▼                         │
               [10] EMIT plan + explanations   [9] PLAN REPAIR (ranked) ───┘ ≤ N passes
                    + deviation ledger          │ still failing
                    + fired-rule log            ▼
                                             FAIL CLOSED → goal-level repairs
 Events (08) ─► adaptation = state update + re-run [2]–[10] from today, past frozen,
                 no-catch-up invariant against the previous plan version
```

Key properties:

- **Fixed rule tiers, no ties.** Every rule sits in exactly one tier: T0 red flags › T1 screening gates › T2 hard limits › T3 user constraints › T4 goal & feasibility › T5 progression & structure › T6 preferences. Within a tier, priorities are unique numbers; a build check rejects duplicates [hearing-1 §5: equal-priority rules fire in arbitrary order, CORROBORATED]. See 12 §3.
- **Pure function.** `plan = f(profile, goal, log, today, ruleset_version, registry_version)`. Same inputs → same plan [hearing-1 §5: LLM plans are non-deterministic, CORROBORATED].
- **Generate → validate → repair → fail closed.** The validator is separate code that sees only the plan, the state and the registry. A plan that cannot pass is never shown; the runner gets options instead.
- **Never cut what the runner already does (v2).** No plan cuts the runner's current long run or weekly volume unless a safety rule or the runner's own limits require it. A school's cap can stop growth, but cannot force a regression (LOD-005, INV-27).
- **Stable re-plans (v2).** Re-plans keep the next 7 days as published, unless they reduce load. Paces move only when a new measured result differs by more than the minimum detectable change of one test (about 9.5%), or when two results agree on a smaller change (more than 3.5% in the same direction; v5.1, ADP-067). No-catch-up is checked week by week, matching normal weeks with normal weeks and easy weeks with easy weeks. A late illness leads to a safe, degraded completion rather than an abandoned plan (ADP-014, FEA-014, INV-04, FEA-043).
- **Build specification (v5.1): build-ready once release blockers B-1…B-5 close** (§8; not before).
  - One typed message catalogue (`messages.md`), complete for every rule, with a lint (L1–L8) for reading level and wording.
  - One machine record per rule in RuleExpr, a CEL subset with CEL's four-valued evaluation (true, false, error, unknown) and typed actions (12 §3.2–3.3). The module texts are the only source; `tools/build_rules.py` builds `rules.json` and `tools/check_rules_v5.py` checks it.
  - A declared evaluation context: every name a rule may read is listed in 12 §2b.
  - A validator whose bound and metamorphic checks are independent of the generator's formulas, plus an independent oracle for the shared formulas (07 §5a).
  - Release profiles: MVP (5K–HM) first, then marathon, then ultra (§7).
- **First starts and long runs (v3).**
  - People who have never run follow the NHS [state] Couch-to-5K steps (9 weeks minimum).
  - Any run over 3 hours needs measured tissue tolerance and is run-walk.
  - Marathoners may opt in to up to three longer runs (≤ 29 km / 4 h).
  - Ultras stop at an explicit minimum distance.
  - Race cut-offs are checked against the predicted range.
- **Template-first.** Plans start from a phase template plus a named school preset (Daniels, Hansons, Pfitzinger-classic, Higdon-novice, Galloway, FIRST, Koop-ultra; all [author]: commercial books or programmes). Every change the rules make to the template is written to a **deviation ledger** [opening-statusquo; wg2 §1, CORROBORATED/CREDIBLE].
- **Parameter registry.** No literal numbers live in rules. Every tunable value is a registry entry with grade, sources, basis (`evidence` / `convention` / `design_default` / `eng`) and per-school values.
- **Effort first.** Sessions are written in an effort ladder (walk / easy / steady / hard / very hard / strides) defined by the talk test [factdesk1 §3, CORROBORATED]. Paces appear only when anchored on a *measured* result; heart-rate zones only from measured HRmax or threshold HR, never from age formulas [wg1 §4, CORROBORATED ±10–12 bpm error].
- **Confidence flags.** Every input is `measured`, `estimated` or `unknown`. Estimated inputs may widen a band but never unlock harder training.
- **Manual history only (owner decision, 21 Oct 2026).** There is no device import. Runners tick sessions as done (with actual duration, distance and RPE) and enter their longest recent run. "Measured" therefore means *logged at the time* (within `log.contemporaneous_window_h` of the session), never device-verified. Recalled or backfilled entries are `estimated`. Self-reported weekly distance agrees well with GPS, pace only moderately [factdesk2 §6, CREDIBLE], so distance and duration drive the load caps; logged pace never sets training paces. Implausible entries are flagged and kept out of cap calculations until confirmed (12 §4, 07 INV-14). With sparse or no log, the slower progression profile applies (07 §4).
- **The 1.10× cap is a default, not a law.** It rests on one observational, distance-only cohort whose handling of gaps is undocumented [factdesk2 §1, CREDIBLE (one cohort; several summaries) exposure; UNKNOWN gap handling]. The method adds its own return-after-gap ladder and a duration-based cap for run-walk and time-based sessions, both labelled design defaults.

## 4. How modules connect

| Module | Produces | Consumed by |
|---|---|---|
| 01 Inputs & screening | `RunnerProfile`, `ScreeningRecord`, `RiskFlag`, `ContextModifier`, confidence flags, tolerance tier | 02, 03, 05, 07, 10 |
| 02 Competence tree | `CompetenceNode`/`Level` DAG, `CompetenceState`, distance demand weights | 03, 06, 07, 09 |
| 03 Goals & feasibility | `Goal`, `Demand`, `FeasibilityResult`, predicted band, goal-level repairs | 04, 07, 08 |
| 04 Phases | `Phase` sequence for any horizon, deload/taper placement | 05, 06, 07 |
| 05 Load & progression | weekly volume curve, long-run curve, progression profiles, TID, taper/deload doses | 06, 07 |
| 06 Session library | `SessionModule` records with prerequisites, dose, progression, exit test | 07, 09 |
| 07 Generation | pipeline, validator invariants, repairs, conflict resolution | all |
| 08 Adaptation | `AdaptationEvent` handling, re-plan triggers, hysteresis | 07 |
| 09 Distance families | demand vectors, key sessions, long-run and back-to-back rules per family | 02, 03, 06 |
| 10 Safety & red flags | red-flag rules, stop/refer messages, return-to-run ladders, special populations | 01, 07, 08 |
| 11 Nutrition & fuelling | fuelling competence progression, race fuelling, hydration, heat, referral | 02, 06, 07 |
| 12 Data model | entities, fields, rule format, tiers | all |
| 13 Worked examples | 5 personas, full v5 week tables, day-0 traces, all fixtures | 14 |
| 14 Validation | review, tests, simulation, pilot, metrics | release |
| 15 Glossary | every term in plain words | all user text (lint) |
| `parameters.md` | the single parameter register (default, range, presets, grade, basis, owner) | all |
| `CONTRACTS.md` | module contracts, rule-ID ranges, priority blocks | authors |
| `RESOLUTIONS.md` | decisions on cross-module conflicts; OPEN items | all |
| `CHANGELOG-v2.md` … `CHANGELOG-v5.md` | every change → source → criterion | reviewers |
| `rules.json` | one machine record per rule and invariant, **generated** from the module texts (12 §3.2): 301 rules (248 formal, 14 procedure, 7 static, 32 text-only) and 31 invariants (v5.2); every MVP rule has a machine record | engineers |
| `tools/` | `build_rules.py` (build), `build_parameters.py` (v5.2: `parameters.json`), `check_rules_v5.py` (TST-121), `check_messages_v5.py` (TST-094) | engineers, CI |
| `schema/`, `fixtures-input/` (v5.2) | JSON Schemas of the generator input and result (the engine–oracle contract) and complete input profiles for every persona of 13 and 14 (inputs only) | engineers, oracle |
| `messages.md` | the single typed message catalogue (reason texts, headlines, evidence wording, display rounding) | engineers, writers |
| `../rationale.md` | key design choices → why → alternatives → evidence | reviewers |

## 5. How to read this specification

- **Runners** read the "In plain words" boxes and the glossary (15).
- **Coaches** read the rules: each one names its rationale, sources and grade.
- **Grade labels shown to runners (v4, p1-C R9; factdesk5 §2)** are derived from **basis and grade together**, and always pair a short label with a plain sentence. A numeric range is added where one exists.

  | Basis + grade | Label |
  |---|---|
  | evidence, CORROBORATED (VERIFIED is never reached: search summaries only) | "well supported by research" |
  | evidence, CREDIBLE | "some research support" |
  | convention (any grade; e.g. CORROBORATED only as a description of practice) | "common coaching practice" |
  | design default | "our cautious choice, not tested" |
  | UNKNOWN | "not known" |
  | eng (v5: display, ordering, data handling) | no evidence label; the why text explains the mechanism |

  Lay readers interpret words like "common" or "likely" very differently. They prefer numbers, and a numeric range lowers trust less than vague wording does [factdesk5 §2, CORROBORATED]. GRADE-style labels alone did not help understanding [ALLEGED]. CONTRADICTED claims never drive rules. Texts: messages.md §4.
- **Engineers** read 07 and 12 first, then `parameters.md`. Every rule follows:
  `RULE <ID> | priority <Tn.nnn> | when <condition> | then <action> | because <rationale> | evidence <file §, grade> | basis <evidence|convention|design_default|eng> | default? yes/no`
  and has a machine record in its module's `## Machine records (v5)` block.

**Reading paths (v5, p2-A R10).** The specification is about 100,000 words. Nobody needs all of it:

| Reader | Read | About |
|---|---|---|
| **Runner** | No spec. Their surface is `messages.md` (card and why texts), the glossary (15) and the "In plain words" boxes; checked by the comprehension test (14 TST-090) | 6–8k words |
| **Coach** | 00 → `../rationale.md` → 13 (worked plans) → 09 §1 and §7 → 10 §1–4 → 04 §1–3 → the Grade and Basis columns of `parameters.md` | 15k words |
| **Developer** | 12 (data model, §2b evaluation context, §3 rule format, §6 release profiles) → 07 → `CONTRACTS.md` → `parameters.md` → `messages.md` → `rules.json` and `tools/`, then 03, 05, 08 and 14 | 45k words |
| **Reviewer / history** | `RESOLUTIONS.md`, the CHANGELOGs, the "v1 record" sections of each module | optional |
- Evidence citations point to the council's research files (wg1–wg5, hearing-1, factdesk1, opening-*). No web claim enters the spec without one.
- "Design default" means: evidence is ALLEGED or UNKNOWN, so the method picks a conservative value, exposes it as a parameter and says so.

**Source-interest tags (post-audit, charter §2: symmetric tagging).** Every source group that has an interest is tagged the same way, not only apps:

| Tag | Groups cited in the council files | How the method treats them |
|---|---|---|
| [corp] | app and device companies: Garmin-data cohorts, Runna, TrainAsONE, TrainingPeaks | statements about their own products are at most ALLEGED; data cohorts graded on design |
| [industry] | industry-funded research: GSSI (PepsiCo) | graded on design; funding stated where the finding is used (11) |
| [trade] | trade bodies and their sponsored studies: ACE-sponsored work | as [industry] |
| [state] | state agencies: NHS (Couch-to-5K), FDA, MDCG | programme descriptions are convention; regulatory texts are boundaries, not evidence of benefit |
| [author] | commercial authors and coaches: Daniels, Pfitzinger, Hansons, Higdon, Galloway, Koop, FIRST | their plans are presets (school values), graded as descriptions of practice (convention) |
| [society] | professional societies: ACSM, ACOG, ESC | position stands are convention or consensus; their own evidence grades are not imported |

Tags appear at the first citation in a section; the research files carry the full tagging.

## 6. Wellness-product boundary and disclaimer

The tool must stay a general-wellness / lifestyle product [factdesk2 §2: FDA [state] General Wellness guidance revised 6 Jan 2026 and MDCG [state] 2019-11 Rev.1, CORROBORATED; whether a PAR-Q+-style screen is a device, UNKNOWN → legal review]. Binding design constraints, applied in 01, 08, 10 and 11:

1. Screening uses a **fixed, published questionnaire shown unchanged** (PAR-Q+ 2023 [wg4 §3, CORROBORATED]).
2. Any "yes", symptom report or red flag gets a **generic, non-individualised message**: "Before you start or go on with this plan, talk to a doctor or other health worker." (MSG-SAF-001, simplified in v5 to reading grade ≤ 8) Urgent symptoms get a generic urgent message ("Stop. Do not run. Seek medical help today."); emergencies get "Call emergency services now. Stop running and stay with someone until help arrives." (MSG-SAF-003). None names a condition.
3. The tool **never names, scores, predicts or rules out a condition** (no "you may have a stress fracture", no risk scores). Internally rules may carry clinical labels for traceability; user-facing text never does.
4. The output of every safety rule is a **training-suitability decision** only: `proceed`, `proceed_restricted` (easy only), `pause_until_clearance`, or `no_plan`.
5. No rehabilitation or injury-treatment claims; return-to-run ladders are general training progressions shown *after* the runner confirms professional clearance where 10 requires it.

Disclaimer, shown at onboarding and on every pause screen: "This tool gives general training guidance. It does not diagnose, treat or replace a doctor, physiotherapist or dietitian."


## 7. Release profiles and build order (v5, p2-B R12; details in 12 §6)

> **In plain words.** Everything is specified, but it ships in three steps. First 5K to half marathon with the default method. Marathon comes next, and only after its extra safety tests pass. Ultras come last.

| Profile | Scope | Must hold before release |
|---|---|---|
| **MVP** | 5K, 10K, half; preset `method_default`; horizons H0–H3; start ladder, return-to-run, adaptation (08, without back-to-backs) | every T0–T2 rule, every INV and every MVP-tagged rule has a machine record (`formal`, `procedure` or `static`); TST-121, TST-094, TST-126 green; oracle TST-110…112 agrees with 13; fixtures TST-095…106 and TST-127/128 pass; release blockers B-1…B-5 below closed |
| **R2** | + marathon; presets with encoded fixtures | 65+ fixtures (SAF-060), INV-28/29 fixtures and oracle (a) pass |
| **R3** | + 50K and 100K, back-to-backs, `koop_ultra` | ultra and b2b fixtures; R2 pilot data |

**Build order:** parameter registry and schema → RuleExpr evaluator with CEL's four-valued truth tables → S0–S2 and the bound (B) validator → independent oracle → S3–S8 → adaptation (08) → message catalogue and display. The acceptance criteria are those of the full specification; a profile is a subset, not a lower bar.

## 8. Open items, release blockers and known limits

**Decided through plenary round 2:** see `RESOLUTIONS.md` § Plenary round 2 (34 required changes, red-team closure table).

**Dissents kept on record:** Contrarian (ultra stretch reason; 50K AER 3); First Principles (the 65+ check-up gate is a policy rule with no comparative evidence).

**Release blockers (MVP).**
- **B-1** PAR-Q+ 2023 licence, and clinical sign-off of the item-to-factor map (`ScreeningItemMap`).
- **B-2** Regulatory reading: whether the fixed screen, the age-triggered check-up advice (SAF-060/061) and the safety hold stay general wellness [factdesk2 §2, UNKNOWN for screens].
- **B-3** Clinical review of every **S** message and of LADDER_RUNWALK (FEA-043b) and the start ladder.
- **B-4** **Closed in the rule base (v5.2).** The 27 MVP rules that were prose only now have machine records (PHS-015, DST-007 and SES-019 are retagged `spec`: not reachable in the MVP), nine more MVP-reachable rules were formalised and tagged MVP, and `check_rules_v5.py` passes. Honest limit: the records rest on design defaults accepted by the owner on 22 Oct 2026 and have not been executed; they count as tested only when the engine and the independent oracle agree (B-5).
- **B-5** Fixture bodies: 13's hand values and 14's fixtures exist as text; they must be encoded as data, and the oracle written by someone who has not read the generator.
- **R2 only:** conformance fixtures encoded from the primary books (Hansons, Pfitzinger, Higdon, Galloway, Daniels).

**8b. When a published plan is enough (signed: Status-quo seat; post-audit fix 10).**
- A healthy runner with a year of steady history, no recent injury and a goal that fits their time does well on a good book plan (Daniels, Pfitzinger, Hansons, Higdon, Galloway [author]) or on Couch-to-5K (NHS [state]) for a first 5K. These plans are tested by use, if not by trials.
- This method adds what books cannot: a fixed health screen and red-flag stops, an honest feasibility check before the plan starts, re-planning without catch-up, and caps checked on every session.
- It can also be **worse** than a book plan: DST-015 re-steps progressions that a book has proven in practice; 213 of its 301 rules (v5.2) rest on untested design defaults; its more cautious caps may under-train an experienced runner; and it has never been run.
- **Neither approach has outcome evidence**: no study compares adaptive and static plans [factdesk1 §5]. Choosing this method over a book is a bet on safety process, not on proven results.

**Known limits (honest).**
- **Safety evidence is thin where it matters most.** The spike cap (1.10×) rests on one distance-only cohort; nothing measures the risk of runs over 3 hours; deload cadence, taper fractions and most ladder steps are conventions or design defaults. 213 of 301 rules have `basis = design_default` (v5.2). The method says so on every card ("our cautious choice, not tested").
- **No outcome claim.** No study shows adaptive plans prevent injury, and none was run for this method. The pilot (14 §10) measures; it does not prove.
- **Self-report only.** Manual logging means "measured" is "logged on time", not device-checked. A runner who answers "no pain" falsely defeats the pain rules; the method can only ask well and hold steps when answers are missing.
- **Prompt compliance is unknown for running apps.** The 70% answered-pain threshold is anchored on general EMA data (75%) [factdesk6 §3]; real compliance may be lower, which would hold plans more often.
- **Readability is measured by formula,** a proxy for understanding; the comprehension test (TST-090) is the real check.
- **Predictions are ±6–8% at best** and widen for estimates, low volume and ultras.
- **32 rules remain `text_only`** (v5.2; 5 T4, 11 T5, 16 T6): ultra and marathon family detail, presets other than `method_default`, H4/H5 seasons, advanced fuelling and preferences. None is MVP-reachable.
- **Validator independence is partial.** The S group re-implements shared formulas from the same text; the oracle and metamorphic tests reduce, not remove, correlated errors [factdesk6 §5].
- **The design has not been run.** Every number in 13 is hand-computed. Writing v5 found two defects in earlier worked plans (13 R-01, R-04); more are likely until the oracle runs.

## 9. Criteria coverage

| Criterion | Where it is met (primary → supporting) |
|---|---|
| 1 Distances 5K → 100 km road, determinants | 09 → 02 §5 |
| 2 Input model and how each input changes the plan | 01 §1 → 03, 12 |
| 3 Any duration, phases, insufficient time | 04 → 03, 07 §6 |
| 4 Competence tree with prerequisites and levels | 02 → 06 (exit tests), 11 (FUEL, HEAT) |
| 5 Explicit deterministic rules, stated defaults | 07, 12 §3 → every module (rule format, `default?`) |
| 6 Adaptation and re-planning | 08 → 07 (INV-04, GEN-003) |
| 7 Load limits, red flags, screening | 10, 05 → 01, 07 §5, 11 |
| 8 Evidence grades, two-source rule, schools as parameters | `parameters.md`, every rule's `evidence` → 09 §7 presets, `../rationale.md` |
| 9 Goal feasibility with caveats | 03 → 07 §6.2 |
| 10 Session and phase modules (goal, prerequisites, dose, progression, exit test) | 06, 04 §1 → 09 |
| 11 Data model, rule format, worked examples | 12 → 07, 13 |
| 12 Plain explanations, coach rationale, glossary | 15, "In plain words" boxes → `../rationale.md` |
| 13 Validation plan | 14 → 07 §5 invariants, 12 §3.4 static checks |

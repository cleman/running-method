# CONTRACTS — module authors (v1; amended through v5.3)

Binding for every module author. Read with `00-overview.md`, `02`, `04`, `07`, `12`, `parameters.md`. A module that needs to break a contract says so in a "Conflicts with contract" section rather than silently deviating.

## 1. Rules common to all modules

1. **Rule format:** `RULE <ID> | priority <Tn.nnn> | when … | then … | because … | evidence <file §, grade> | basis <evidence|convention|design_default|eng> | default? yes/no` (12 §3; `basis` added in v5). Every T0–T2 rule and every MVP-tagged rule also needs a line in the module's `## Machine records (v5)` block (12 §3.2–3.3). IDs only within your range. Conditions use entity fields (12 §2) and parameter IDs (`parameters.md`); no literal numbers except 0, 1 and enums.
2. **Tiers** (07 §1): T0 red flags · T1 screening gates, special populations, context modifiers · T2 hard limits · T3 user constraints · T4 goal & feasibility · T5 progression & structure · T6 preferences. Pick the tier by what the rule protects, not by its module.
3. **Priority numbers.** Module `NN` uses `nnn` in **[NN×50, NN×50+49]** in every tier (01 → 050–099, 03 → 150–199, 05 → 250–299, 06 → 300–349, 08 → 400–449, 09 → 450–499, 10 → 500–549, 11 → 550–599; architect: 02 → 100–149, 04 → 200–249, 07 → 350–399; v5.3: the EXP-001…049 rules of the experienced-runner path live in 02 and use its block). The pair (tier, nnn) is unique across the rule base; the same `nnn` may be reused by its owner in different tiers. **000–049 is reserved** for architect-assigned cross-module overrides: if your non-numeric choice must beat another module's in the same tier, request a slot in "Conflicts with contract". Numeric limits always combine by MIN, so they never need an override.
4. **Evidence:** cite council files only (wg1–wg5, hearing-1, factdesk1, factdesk2, opening-*) with grade. Two-source rule: a single-source claim is ALLEGED and can justify a rule only as `default? yes` with a parameter. CONTRADICTED claims never drive rules.
5. **Parameters:** no new number without a registry ID. Put new ones in a final "Parameters proposed" table using the `parameters.md` columns.
6. **Plain language:** at least one "In plain words" box per major section; first use of a glossary term is linked or replaced; user messages are referenced by `Message` ID with `plain_text` and `why`.
7. **Effort first:** prescribe in the effort ladder E0–E5 (12 §1). Paces only through INV-15; HR only from `HRReference` measured kinds.
8. **Manual log only** (owner decision): never assume device data. Any rule reading history reads `DerivedState` (07 §3), which already applies confidence, plausibility and L30_eff fallbacks.
9. **Wellness boundary** [factdesk2 §2]: user-facing safety text is generic ("talk to a doctor or qualified health professional"; urgent: "Stop. Do not run. Seek medical help today."; emergency: "Call emergency services now. Stop running and stay with someone until help arrives." — MSG-SAF-003, confirmed in RESOLUTIONS A7), never names, scores, predicts or rules out a condition, and the rule's output is a training-suitability decision (`proceed`, `proceed_restricted`, `pause_until_clearance`, `no_plan`). Internal rule names may be clinical.
10. **No catch-up, no ACWR gate, no age-formula zones, no injury-prevention claims** (07 INV-04, INV-10, INV-09; factdesk1 §5).
11. **Tests:** each rule lists one firing and one silent test case ID (`T-<ruleID>-fires`, `T-<ruleID>-silent`); 14 collects them.
12. **Length:** 1,500–3,500 words per module.

## 2. Author A — 01 Inputs & screening, 10 Safety & red flags

### 01-inputs-and-screening.md — rule ranges INP-001…099, SCR-001…099, CTX-001…099
**Purpose:** collect the runner's inputs with confidence flags, run the fixed screening, set context modifiers and the tolerance tier. Criteria **2, 7, 12**.
**Required sections:** (1) input catalogue: for every input in `RunnerProfile`, `OnboardingClaim`, `PerformanceAnchor`, `HRReference`: question wording, "I don't know" default, confidence rule, **how it changes the plan** (criterion 2 table); (2) manual-log design: tick flow (actual duration, distance, RPE, optional pain/GI), contemporaneous window, backfill, plausibility prompts — implementing 07 GEN-020…022 wording and UX; (3) screening gate: PAR-Q+ 2023 shown unchanged, ACSM 2015 three-factor logic, outcomes, 12-month validity, re-screen triggers; (4) performance level (WMA age-grade) vs tolerance tier (TOL inputs) — two axes; (5) context-modifier table `CTX-nnn` (novice, other-sport, injury last 12 months, masters ≥ 50, shift work, < 3 runs/week, unlogged history) with envelope tags; (6) Parameters proposed.
**Must use:** entities `RunnerProfile`, `OnboardingClaim`, `ActivityRecord` (confidence, plausibility, source), `ScreeningRecord`, `ContextModifier`, `DerivedState.tol_tier/log_status/progression_profile`; params `screen.*`, `log.*`, `claim.*`, `deload.every`, `prog.slow.*`.
**Interfaces:** feeds S0–S2 of 07; hands red-flag symptoms to 10; tolerance tier to 02/05.
**Must resolve:** conservative fallback with sparse/no log (consistent with GEN-011/012); self-report inflation; "I don't know" for every field; shift-work rule as ALLEGED default [wg3 §6].

### 10-safety-and-red-flags.md — rule range SAF-001…199
**Purpose:** stop/refer rules, special populations, return-to-run ladders. Criteria **7, 12**.
**Required sections:** (1) red-flag catalogue (cardiac, bone-stress signs, heat illness, EAH signs, pregnancy stop signs, REDs warning signs routed from 11, illness/fever) as **symptom questions** with generic actions; (2) pause/clearance flow (INV-05: attestation ≥ `flag.clearance_min_delay_days` later; suspected high-risk bone-stress site → professional clearance required, no in-app protocol [factdesk1 §1]); (3) special populations: minors table (lower recommended table default, hard caps, ultra/marathon ≥ 18), pregnancy maintenance mode, postpartum < 12 weeks no plan, masters ≥ 65 vigorous → assessment advice; (4) return-to-run ladder (RTR rungs by gap length and prior tolerance, time-based, run-walk; used when L30 is undefined, GEN-012) labelled UNKNOWN-based; (5) generic message catalogue (`is_safety_generic = true`); (6) wellness-boundary checklist (factdesk2 §2 a–e); (7) Parameters proposed.
**Must use:** `RiskFlag`, `SpecialStatus`, `ScreeningRecord`, `Message`; params `flag.*`, `minor.*`, `pp.min_weeks`, `pregnancy.mode`, `masters.*`, `rtr.ladder`, `illness.*`.
**Interfaces:** T0/T1 rules consumed by 07 S1 and by 08 on every event; INV-05, INV-06, INV-07, INV-24 enforced by 07.

## 3. Author B — 03 Goals & feasibility, 05 Load & progression, 13 Worked examples

### 03-goals-and-feasibility.md — rule range FEA-001…099
**Purpose:** goal model, demand, prediction band, feasibility verdict, goal-level repair options. Criteria **9, 3, 2**.
**Required sections:** (1) goal model (`Goal`, finish/time/maintain/base); (2) demand computation: required levels (02 §5), `V_req`, `L_req` **per preset** (Daniels-capped demand differs from classic), `race.longest_ratio_max`, `feas.finish_floor`; (3) prediction: Riegel ≤ half, marathon via half × 2.19 / exponent ≥ 1.06 with volume correction, ±`pred.band_min_pct`, widened for estimated anchors, ultra = wide range only [wg1 §7; factdesk2 §3: Vickers coefficients UNKNOWN → do not encode]; (4) weeks-needed computation (`rtr`, `onboard`, `base` from L/V gaps under 05 caps incl. 1.10× steps, `specific`, `taper`); (5) verdict rules (feasible / stretch / infeasible) with plain-language consequences; (6) goal-level repair generation in the 07 §6.2 order, each pre-validated; (7) goal-edit gaming (implements GEN-030…032 behaviour); (8) Parameters proposed.
**Must use:** `Goal`, `Demand`, `FeasibilityResult`, `RepairOption`, `GoalEditAttempt`; params `pred.*`, `feas.*`, `race.*`, `goal.*`, `anchor.max_age_days`, `cmp.min_weeks_per_level`.
**Interfaces:** called at 07 S3; returns weeks_needed to 04; re-called by 08 on result/goal/life events. Never projects multi-season gains (PHS-012).

### 05-load-and-progression.md — rule range LOD-001…099
**Purpose:** weekly volume, long-run curve, intensity distribution, progression profiles, spike caps, deload and taper doses. Criteria **7, 5, 8**.
**Required sections:** (1) load model: time, distance, session RPE × time; ACWR/Banister/monotony display-only [wg1 §3]; (2) progression profiles `standard`/`slow` and which context modifiers select them; progression measured from last non-deload week; (3) spike caps INV-01/02/03 in generation terms: how the long-run curve is built so every step ≤ 1.10× L30_eff (distance and duration), hold steps; race exemption (INV-25); (4) long-run caps per preset (`lr.*`), incl. the Daniels-vs-novice conflict; (5) TID presets and `tid.easy_share_min`; quality-session dosing; (6) deload dose; (7) taper shape (exponential/step, `taper.volume_cut`, frequency and intensity kept, INV-08); (8) back-to-back pair load accounting with 09; (9) Parameters proposed.
**Must use:** `Week`, `Session`, `DerivedState`; params `spike.*`, `two_day.*`, `b2b.pair_cap_ratio`, `prog.*`, `lr.*`, `tid.*`, `deload.*`, `taper.*`.
**Interfaces:** 07 S6; 04 places deloads/taper; 06 fills sessions within the week's budget.

### 13-worked-examples.md — no rules; written after the others
Four personas end-to-end (inputs → gate → state with confidence → feasibility → phase outline → week samples → one adaptation event with re-plan and no-catch-up check). Minimum set: (a) first-timer, unknown anchor, sparse log, 5K in 10 weeks (effort-only onboarding); (b) masters 58, injury last 12 months, marathon time goal in 16 weeks; (c) 3 h/week runner asking for a marathon in 12 weeks → fail closed with ranked options; (d) experienced runner, 100 km road in 24 weeks with back-to-backs and fuelling progression. Show fired rule IDs, deviation ledger entries and validator results. Criterion **11**.

## 4. Author C — 06 Session library, 09 Distance families

### 06-session-library.md — rule range SES-001…199; module IDs SES-M-001…
**Purpose:** reusable session modules and their selection rules. Criteria **10, 4, 12**.
**Required sections:** (1) module record format (`SessionModule`: trains, prereqs, goal_text, dose, progression, exit_test, allowed phases, presets, evidence); (2) catalogue: easy/run-walk (first-class), long run, strides, hills (flat-course substitute: strides/short hills only where available — terrain out of scope), threshold, VO2 intervals, race-pace, progression run, strength & plyometrics, fuelling rehearsal long run, field tests (CS/time trial anchor test for ONBOARD exit), maintenance; (3) exit tests for every competence level in 02; (4) placement rules: hard-day spacing (INV-17), long-run day, available days (INV-21); (5) school-preset session mixes (`quality.per_week`), each preset a coherent whole [opening-statusquo R2]; (6) effort-ladder wording per module; (7) Parameters proposed.
**Must use:** `SessionModule`, `Session.segments`, `CompetenceLevel`; params `quality.per_week`, `tid.*`, `cmp.*`.
**Interfaces:** 07 S7 via CMP-007; must satisfy CMP-CHK-3 (every level trainable).

### 09-distance-families.md — rule range DST-001…099
**Purpose:** per family (5–10K · half & marathon · 50–100K road): determinants, demand vectors, phase emphasis, key sessions, long-run and back-to-back rules. Criteria **1, 3, 10**.
**Required sections:** (1) determinants with grades [wg1 §1]; (2) demand weights and required levels (refine 02 §5 via registry); (3) phase emphasis tables incl. Koop order for ultras; (4) long-run rules by family and preset; race-to-longest-run minimums; (5) back-to-backs: DUR L5 gate, `b2b.*`, off by default, ALLEGED label; tune-up 50–56 km ~5 weeks out [wg2 §4, CREDIBLE]; (6) feasibility floors per family (`feas.finish_floor`), labelled; (7) school presets per family (Daniels, Hansons, Pfitzinger-classic, Higdon-novice, Galloway, FIRST, Koop-ultra) as `SchoolPreset` records with compatibility (days, time) and grades; note Higdon step-ups > 1.10× are re-stepped (07 §7) [factdesk2 §7]; (8) Parameters proposed.
**Interfaces:** 02 (weights), 03 (demand), 05 (caps), 06 (key sessions), 11 (fuelling demand).

## 5. Author D — 08 Adaptation, 11 Nutrition & fuelling, 14 Validation

### 08-adaptation-rules.md — rule range ADP-001…099
**Purpose:** handle `AdaptationEvent`s and re-plan. Criteria **6, 7, 5**.
**Required sections:** (1) event catalogue and detection from the manual log (missed, partial, unlogged week ≠ missed: an unlogged week sets `log_status` and probation, not "rest"); (2) re-plan procedure: freeze past, update state, re-run 07 S2–S10, check INV-04 against the previous version; (3) missed sessions: drop, never catch up; repeat-week rule; (4) gaps: `gap.*` bands, RTR handover to 10's ladder when L30 undefined; (5) illness (Elliott gate, fever = no training); (6) pain/fatigue: pain ≤ `pain.during_max`, next-morning rule, never applied to suspected bone stress (route to 10); RPE-based fatigue signals with hysteresis (≥ 2 consistent signals before load changes); (7) results: re-anchor paces only from measured anchors, hysteresis (pattern, not one outlier) [hearing-1 §5, CORROBORATED]; (8) life and availability changes (T3) incl. shift work default; (9) goal changes → 03; (10) Parameters proposed.
**Must use:** `AdaptationEvent`, `Plan.version/parent_plan_id`, `Week.frozen`, `DerivedState`; params `gap.*`, `illness.*`, `pain.*`, `log.probation_weeks`.

### 11-nutrition-and-fuelling.md — rule range NUT-001…099; may register NUT-INV-*
**Purpose:** daily guidance scope, fuelling competence (FUEL node), race fuelling, hydration, heat, referral. Criteria **4, 7, 8, 12**.
**Required sections:** (1) scope boundary: information only, no meal plans, deficits, race-weight targets, EA computation [wg5 impl. 6, 9]; (2) daily carbohydrate/protein bands as information; (3) FUEL levels L1–L4 with exit tests (GI ≤ `fuel.gi_pass_max`), progression `fuel.start_g_h`/`step_g_h`, INV-18; (4) race fuelling by expected duration; >90 g/h opt-in only; (5) hydration: drink to thirst default, sweat test, `hyd.no_test_cap_ml_h`, EAH warning; (6) heat: HEAT node, acclimatisation, defer to race WBGT flags, no hard-coded WBGT; (7) REDs self-screen questions every `reds.rescreen_weeks` → generic referral + progression freeze (routes to 10, wellness wording); train-low and caffeine options; (8) Parameters proposed.

### 14-validation-plan.md — test IDs TST-001…; no generation rules
**Purpose:** prove the method. Criterion **13** (and 11).
**Required sections:** (1) expert review protocol (per module, coaches + clinicians); (2) static checks (12 §3.4, CMP-CHK-*); (3) unit tests per rule (fires/silent); (4) invariant property tests on random profiles, durations 1–200 weeks, all distances, asserting INV-01…30; (5) edge-persona grid [opening-contextrealist; opening-contrarian ~30 personas: zero history, 6 weeks off, 17-year-old marathoner, 8 weeks postpartum, 100 km on 3 h/week, 2-week plan, inflated claims, implausible entries]; (6) conformance fixtures vs published plans with deviation-ledger checks [opening-statusquo]; (7) removal test (delete each rule, measure plan change) [opening-firstprinciples]; (8) determinism replay; (9) comprehension test with first-time runners (≥ 80% pass, design default) [opening-outsider]; (10) pilot with pre-registered metrics (prediction error vs 5.9–8%, completion vs 27% C25K baseline, injury per 1000 h vs 7.7/17.8) with no efficacy claims [opening-expansionist; wg3 §5; wg4 §2]; (11) Knopp range flags (INV-23).

## 6. Criteria coverage map

| Criterion | Primary | Supporting |
|---|---|---|
| 1 Distances & determinants | 09 | 02 |
| 2 Input model | 01 | 03, 12 |
| 3 Any duration | 04 | 03, 07 |
| 4 Competence tree | 02 | 06, 11 |
| 5 Explicit deterministic rules | 07 | 12, all |
| 6 Adaptation | 08 | 07 |
| 7 Safety | 10, 05 | 01, 07, 11 |
| 8 Evidence & schools | parameters.md | all, 09 |
| 9 Goal feasibility | 03 | 07 §6 |
| 10 Modularity | 06 | 04, 09 |
| 11 Implementation-ready | 12 | 07, 13 |
| 12 Understandable | 15 (glossary) | all |
| 13 Validation | 14 | 07 §5 |

## 7. Return to the architect

Each author returns: files written, number of rules, parameters proposed, and every conflict found with another module or this contract.

## 8. v4 additions

- **Messages:** every message used by a rule must exist in `messages.md` (TST-094).
- **Rule records:** every rule must parse into `rules.json` (TST-121; v5: from the RULE line plus the module's `rulexpr` machine record, 12 §3.2). New T0–T2 rules need a formal RuleExpr condition and an `on_unknown` value (12 §3.2).

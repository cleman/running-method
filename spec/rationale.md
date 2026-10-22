# Rationale — key design choices (method v5.1)

> **Research method (disclosed, post-audit).** All research for this method used WebSearch result summaries only; no primary source (paper, book, guideline document) was opened. CORROBORATED (two independent summaries agree) is therefore the ceiling; nothing in the method is VERIFIED. A finding from one study is at most CREDIBLE, however many summaries repeat it.

For each choice: **what** was decided, **why**, **alternatives rejected**, and the **evidence grade** it rests on. Citations point to the council's research files. Module references are to `design/v5/`.

## 1. Safety first through fixed tiers with no ties
- **Choice:** Every rule belongs to one of seven tiers: T0 red flags › T1 screening gates › T2 hard limits › T3 user constraints › T4 goal › T5 progression › T6 preferences. Within a tier, each (tier, number) priority is unique. Numeric limits combine by taking the most conservative value (07 §1).
- **Why:** Rule engines fire equal-priority rules in arbitrary order. Users are self-coached, so safety must win deterministically.
- **Rejected:** Weighted scoring or optimisation, which is opaque and rests on unvalidated load models. Firing order by insertion, which is nondeterministic.
- **Evidence:** hearing-1 §5, CORROBORATED (salience/arbitrary order); opening-systemsarchitect R1.

## 2. Generate → validate → repair → fail closed
- **Choice:** An independent validator checks 31 invariants (v5) on every plan and every re-plan. Plan repairs follow a ranked order. When repairs cannot make the plan pass, the user gets no plan for that goal, only pre-validated options (later date → lower goal → shorter distance → base plan) (07 §5–6).
- **Why:** Modules that are sound alone can collide: taper vs deload, feasibility vs caps, templates vs the spike cap. A squeezed plan concentrates load.
- **Rejected:** Clamping silently and emitting anyway. Letting the generator self-check.
- **Evidence:** opening-contrarian, -executor, -systemsarchitect (convergent); wg4 §1 spikes, CORROBORATED (observational).

## 3. Single-session spike cap as the main load rule, labelled as a default
- **Choice:** A planned run is at most 1.10 × L30_eff, on both distance and duration. Runs above 2.0 × are always blocked. The weekly 10% rule is only a soft progression convention.
- **Why:** In the largest cohort, risk tracked single-session spikes; week-to-week change and ACWR showed no association.
- **Rejected:** The weekly 10% rule as a safety law (RCT null). ACWR gates (contradicted). No load rule at all.
- **Evidence:** wg4 §1, factdesk2 §1, CREDIBLE (one cohort; several summaries) (observational, distance-only). Cut-point partly convention (ALLEGED). Duration transfer UNKNOWN, so it is a design default.

## 4. Manual log with confidence flags, plausibility checks and probation
- **Choice:** History comes from manual entry only (owner decision). "Measured" means logged within 48 h. Claims are discounted. Implausible entries are excluded until confirmed. Sparse or unlogged history triggers the slow profile. No history, or a gap of 30 days or more, starts the return ladder (07 §3–4).
- **Why:** Self-reports can be inflated or mistyped, and the spike cap's denominator must be trustworthy. Weekly distance self-report is reliable; pace is only moderately reliable.
- **Rejected:** Trusting claimed history fully. Refusing to plan without logs. Using logged pace for paces.
- **Evidence:** factdesk2 §6, CREDIBLE; factdesk2 §1, UNKNOWN (gap handling); opening-contrarian §1.4.

## 5. No catch-up, ever
- **Choice:** After any adaptation, no future week gains time, distance or long-run length compared with the previous plan version. A missed hard session may only replace an easy one (INV-04).
- **Why:** Catch-up creates exactly the spikes linked to injury.
- **Rejected:** Redistributing missed volume. "Make-up" sessions.
- **Evidence:** wg4 §1, CORROBORATED; opening-contrarian §1.1.

## 6. Red flags pause; the tool stays a wellness product
- **Choice:**
  - A fixed PAR-Q+ questionnaire, shown unchanged.
  - Symptom questions only, with generic "talk to a doctor" or emergency texts.
  - Outputs are limited to proceed / restricted / pause / no plan.
  - Professional-clearance attestations are dated at least one day later.
  - Module 10 alone raises flags.
- **Why:** Self-coached users need hard stops. Naming, scoring or predicting a condition could make the tool a medical device.
- **Rejected:** Symptom triage, risk scores, in-app rehabilitation for high-risk bone sites.
- **Evidence:** wg4 §3–4, CORROBORATED; factdesk2 §2, CORROBORATED (FDA [state] 2026, MDCG [state] 2019-11 Rev.1) / UNKNOWN (screen status → legal review, release blocker).

## 7. Two separate level axes: performance and tissue tolerance
- **Choice:** Paces come from age-graded performance. Volume and long-run growth come from tissue tolerance. Neither ever reads the other (01 INP-031).
- **Why:** Returners and athletes from other sports are fit but fragile. Prior injury is the strongest risk factor.
- **Rejected:** A single "level" scale (none is validated).
- **Evidence:** wg3 §1, CORROBORATED (WMA); hearing-1 §3, CORROBORATED (prior injury); wg3 §2, CREDIBLE (other sport).

## 8. Effort first; paces only from measured anchors; no age-formula heart-rate zones
- **Choice:** Sessions are written in the talk-test effort ladder. Paces appear only from a fresh race or test logged at the time. Heart-rate zones come only from measured HRmax or threshold HR.
- **Why:** Novices cannot supply anchors. Age formulas are off by about ±10–12 bpm. False precision misleads.
- **Rejected:** VDOT from recalled times; 220 − age zones.
- **Evidence:** factdesk1 §3, factdesk2 §5, CORROBORATED (talk test; novices and run-walk UNKNOWN); wg1 §4, CORROBORATED.

## 9. Competence graph as a machine-checked dependency graph
- **Choice:** Eleven nodes (one advisory) with levels, prerequisites and exit tests. Build checks for cycles, reachability and trainability. Distance demand weights decide key sessions.
- **Why:** Criterion 4 asks for a competence tree. No precedent exists, so correctness must be checkable. Every node must change a decision.
- **Rejected:** A decorative skill tree; an untested seven-level taxonomy.
- **Evidence:** hearing-1 §5, UNKNOWN (precedent); wg1 §1, CORROBORATED (core model + durability) / CREDIBLE (weights).

## 10. Template-first generation with a deviation ledger
- **Choice:** Plans start from a phase template plus a whole school preset. Every rule-driven change is logged against the template. Conformance tests run against published plans (report-only until the fixtures are encoded).
- **Why:** Proven plans share a core. Free generation risks "Frankenplans". Published progressions often break the 1.10× cap, so the changes must be visible.
- **Rejected:** Generation from first principles alone; copying templates unchanged.
- **Evidence:** hearing-1 §2, CORROBORATED (shared core); factdesk2 §7, ALLEGED (Higdon sequence); opening-statusquo.

## 11. Schools as named presets; the defaults decided in round 1
- **Choice:**
  - Long-run caps, quality count, intensity mix and taper come from a whole preset; hybrids are logged.
  - **Half and marathon default, "classic-capped":** the long run may be up to 50% of weekly time, with a 150/180-min cap and 32 km. It must reach a distance floor (21.1 km for the marathon).
  - **Ultras:** 60% of peak-week time and 330 min. Daniels and the other schools are opt-in presets.
- **Why:**
  - No school has beaten another, and the long-run cap is contested.
  - The v1 Daniels default refused almost every first-time marathoner on 6 h a week.
  - A longer longest run is associated with fewer race-day injuries in first-time marathoners.
- **Rejected:**
  - A Daniels default, which fails honestly but is unusable.
  - A pure distance cap, which penalises slow runners.
  - Failing closed at the ultra time cap (the Contrarian's dissent is recorded).
- **Evidence:**
  - Share caps describe practice [wg2 §1–2, CORROBORATED as description] and have no injury evidence [UNKNOWN].
  - **Time caps are coaching convention**: no duration–injury data [hearing-2 med, UNKNOWN]; 2.5–3 h is field practice, CORROBORATED.
  - Daniels min(25%, 150 min), CORROBORATED [factdesk3 §4].
  - Toresdahl, CREDIBLE (one cohort; several summaries) [factdesk3 §5]. Tension with the 180-min cap is open (N-01).

## 12. Honest feasibility with error bands
- **Choice:**
  - Predictions use Riegel up to the half marathon.
  - Marathon predictions use a conservative factor plus a volume correction, with a band of at least ±7%.
  - Estimated anchors widen the band.
  - Ultras get a range only.
  - Feasibility counts the weeks needed to close the long-run and volume gaps under the caps.
- **Why:** Riegel is too optimistic for the marathon, and no ultra formula exists. False precision invites unsafe plans.
- **Rejected:** VDOT alone; projecting multi-year gains.
- **Evidence:** wg1 §7, wg3 §4, CORROBORATED; factdesk1 §6, UNKNOWN (improvement rates).

## 13. Phase decomposition for any horizon
- **Choice:**
  - Plans of 4 weeks or less only sharpen (no build, no deload).
  - Deloads never fall inside or just before the taper.
  - Plans longer than 24 weeks become seasons, re-planned from results.
  - Ultras use Koop's intensity-first order.
- **Why:** In short plans, taper plus deload leaves no training. Multi-year projections would be fiction.
- **Rejected:** Per-horizon template libraries; projecting improvement across seasons.
- **Evidence:** wg1 §5, wg2 §3, CORROBORATED (taper); wg1 §5, ALLEGED (deload); wg2 §4, CREDIBLE (Koop).

## 14. Taper keeps frequency and intensity
- **Choice:** Volume drops by about 50% progressively over 2 weeks (3 for the marathon). Run frequency and some intensity are kept.
- **Why:** This is the best-supported taper shape.
- **Rejected:** Cutting frequency; a fixed 1-week taper.
- **Evidence:** wg1 §5, wg2 §3, CORROBORATED (Bosquet, Wang, Smyth & Lawlor).

## 15. Adaptation re-measures and re-plans; it never claims to prevent injury
- **Choice:**
  - Re-planning is a pure function of the updated log.
  - Paces change only on patterns or new measured anchors.
  - Pace-only drift on a time goal keeps the plan running, labelled "not on track".
  - Infeasible demand fails closed.
- **Why:** No study shows adaptive plans beat static ones. Oscillating plans erode trust.
- **Rejected:** "Prevents injury" claims; reacting to single outliers.
- **Evidence:** factdesk1 §5, CORROBORATED (evidence absent); hearing-1 §5, CORROBORATED (pattern-based adjustment).

## 16. Run-walk and low frequency as first-class options
- **Choice:**
  - Run-walk is a full mode, and its spike cap applies to duration.
  - Plans with fewer than 3 runs a week limit quality sessions.
  - Frequency is protected before session length when time is short.
- **Why:** Completion is the main problem for beginners (C25K 27%). Frequency drives response.
- **Rejected:** Treating run-walk as a beginner workaround.
- **Evidence:** wg2 §1, CORROBORATED (Galloway, Hottenrott); wg3 §5, CREDIBLE (C25K 27%, a single study); wg3 §2, CORROBORATED (cycling) / factdesk2 §4, UNKNOWN (adherence effect).

## 17. Fuelling as a trained competence with ceilings
- **Choice:**
  - The FUEL node is required for races expected to last over 90 min.
  - Intake progresses from 30 g/h, with a default ceiling of 90 g/h; more is opt-in and labelled unproven.
  - Race intake never exceeds what was tolerated in training.
  - Drink to thirst; no energy-availability calculations.
- **Why:** Gut tolerance is trainable. Overdrinking causes hyponatraemia. Energy-availability thresholds are invalid for individuals.
- **Rejected:** Meal plans, race-weight targets, 120 g/h as a default.
- **Evidence:** wg5 §3–5, CORROBORATED/CREDIBLE; wg5 §2, CORROBORATED.

## 18. One parameter register with grades
- **Choice:** Every number is a registry entry with its default, range, presets, grade, basis and owner. Rules hold no literal numbers.
- **Why:** Many defaults rest on no evidence. Updating them must be a data edit, and coaches must see each grade.
- **Rejected:** Constants in code.
- **Evidence:** opening-executor R2 (design); charter quality rule 3.

## 19. Validation before claims
- **Choice:**
  - Static checks, firing and silent tests for every rule, and property tests over 1–200-week plans.
  - A grid of edge personas, a rule-removal test and a comprehension test.
  - A pilot with pre-registered metrics against published baselines, with no efficacy claims.
- **Why:** Deterministic does not mean protective. The method should produce the missing evidence.
- **Rejected:** Launching on expert opinion alone.
- **Evidence:** opening-expansionist, -firstprinciples, -outsider; wg4 §2, CORROBORATED (injury baselines).

## 20. Never cut what the runner already does (v2)
- **Choice:**
  - The long run grows toward max(race demand, current long run).
  - School caps stop growth but never force a regression.
  - Easy runs fill the week by water-filling.
  - The day next to a long run is at most half of it.
- **Why:** v1 cut runners' long runs (75 → 60 min) and let weekly volume collapse, eroding the levels the plan was meant to build.
- **Rejected:** treating school caps as safety limits.
- **Evidence:** spike cap CORROBORATED (observational) [wg4 §1]; share and two-day caps ALLEGED; under-preparation associated with injury in road ultras [factdesk3 §9, CREDIBLE].

## 21. Stable, honest re-planning (v2)
- **Choice:**
  - A 7-day published window that changes only by reductions.
  - A pace deadband of 3.5% for noise, and (v5.1) a confirmation band up to the minimum detectable change of one test (2.8 × 3.4% ≈ 9.5%): changes inside it need a second consistent result.
  - No-catch-up compared by load ordinal.
  - Re-plans count only the phases still ahead and credit a peak already run.
  - A degraded completion before failing closed.
- **Why:** re-planning on noisy self-reports oscillates. v1 failed a 100K plan closed after a 12-day illness 8 weeks out.
- **Rejected:** full re-optimisation on every event, which TrainAsONE [corp: app vendor] admits gives different plans for the same inputs [hearing-2 sys-field, ALLEGED].
- **Evidence:**
  - Frozen horizon and deadband are established in production planning and control [hearing-2 sys, CORROBORATED general; untested in running].
  - Recreational 5K retest CV 3.4% [factdesk3 §3, factdesk4 §6, CREDIBLE: Machado 2015, a single study]; 1–1.5% in trained runners, CORROBORATED.

## 22. First starts follow the published programme (v3)
- **Choice:** people who have never run follow the NHS [state] Couch-to-5K steps (≥ 9 weeks), rather than the 5-week return-to-run ladder.
- **Why:** with no evidence either way, use the convention that has been tested. Programmes of 8–13 weeks show similar injury rates.
- **Rejected:** the 5-week ladder (untested for never-runners); a 13-week graded plan (no benefit shown).
- **Evidence:** factdesk4 §1, CORROBORATED (C25K, GRONORUN); week-6 and week-8 values CREDIBLE.

## 23. Runs over 3 hours: guarded by measured tolerance, optional for marathoners (v3)
- **Choice:**
  - One guard for every family: any run over 180 min needs TOL L4 measured and is run-walk.
  - Marathon default stays at 180 min. Runners may opt in to ≤ 3 extension runs (≤ 29 km / 240 min) that never count as demand.
  - Ultras stop at explicit distance floors.
- **Why:** duration–injury evidence is absent. One first-timer cohort associates completing ~18 miles with fewer minor race-day injuries. Coaches split: 2.5–3 h caps against Galloway's 26-mile runs.
- **Rejected:**
  - a hard 3-h cap with no option;
  - making 29 km the default;
  - separate guards per family.
- **Evidence:**
  - hearing-2 med, UNKNOWN (duration);
  - factdesk3 §5 / factdesk4 §2, CREDIBLE (one cohort; several summaries) association;
  - factdesk4 §4, CORROBORATED (Galloway) / ALLEGED (McMillan).

## 24. Feasibility must see what the generator builds (v3)
- **Choice:** the dry run uses the same week fill as the generator. Cut-offs are checked against the honest predicted range. Same-distance anchors use a 4% band.
- **Why:** v2 issued 3-run 10K plans that could never reach their demand (a silent failure).
- **Rejected:** a closed-form estimate only.
- **Evidence:**
  - hearing-2 sys, CREDIBLE (simulation is cheap);
  - factdesk4 §6, CREDIBLE (retest CV 2.4–3.4%, Machado 2015, a single study).

## 25. A rule language that never mistakes "missing" for "no" (v4)
- **Choice:** RuleExpr, a CEL subset using CEL's own **four-valued** evaluation (true, false, error, unknown; v5 correction: unknown only for values the engine declares unknown, every other absent value is an error), explicit `has()` and a per-rule `on_unknown`:
  - restrictive safety rules fire on unknown;
  - errors never fire and keep the safe state.
  - One machine record per rule (rules.json).
- **Why:** a self-coached runner can leave fields blank. Silently treating "missing" as "no" would bypass gates.
- **Rejected:**
  - JSON Logic (missing = false);
  - DMN/FEEL (null mixes missing and error, though its table analysis is attractive);
  - a custom DSL (no tooling).
- **Evidence:** hearing-3 sys-acad, sys-field, CORROBORATED/CREDIBLE (vendor and standards documentation; no domain comparison).

## 26. Honest validator independence (v4)
- **Choice:**
  - Bound checks and metamorphic relations are independent of the generator's formulas.
  - Shared-definition invariants are re-implemented from the specification and labelled non-independent.
  - Parity: feasible plans must validate with zero repairs.
- **Why:** code that calls the generator's formula cannot detect an error in it, and separately written versions still fail together.
- **Rejected:** a validator that imports the generator's demand functions.
- **Evidence:** Knight & Leveson 1986, CORROBORATED; metamorphic testing, CREDIBLE [hearing-3 sys].

## 27. Words plus numbers, never labels alone (v4)
- **Choice:**
  - Every evidence label comes with a plain sentence and, where possible, a numeric range.
  - Labels derive from basis + grade.
  - Verdicts use three headlines.
  - Estimates are a label, not a verdict.
- **Why:** lay readers interpret probability words very differently. Numeric ranges preserve trust better than vague hedges. Every new user being "stretch" on day 0 carried no information.
- **Rejected:** GRADE-style labels alone.
- **Evidence:** factdesk5 §2, CORROBORATED (word variability; ranges) / ALLEGED (GRADE labels).

## 28. Unanswered safety questions hold, they do not alarm (v5)
- **Choice:** Symptom questionnaires use `on_unknown: hold`: if the runner closes them unanswered, no session is shown until they answer, and nothing else happens. Safety fields (PAR-Q+ items, symptom items, birth month and year, special status) offer no "I don't know"; an incomplete screen means no plan.
- **Why:** v4's "fire on unknown" raised a pause and an emergency message when a form was merely closed (red team case 2), and "not sure" on a PAR-Q+ item produced a plan (case 1). Holding is cautious without crying wolf.
- **Rejected:** treating unknown as "no" (unsafe); treating it as "yes" (false alarms, and trains runners to ignore warnings).
- **Evidence:** p2-roomC A1–A2; factdesk6 §3, CORROBORATED (prompt compliance ≈ 75%, so missing answers are common).

## 29. No step-up without pain answers (v5)
- **Choice:** Every tick asks "Any pain?" in one tap; long and hard runs get a next-morning prompt; a step-up or level unlock needs answered pain on ≥ 70% of the last 14 days' sessions.
- **Why:** the pain rules of 08 are only as good as their inputs; a runner who never answers would otherwise progress blind (red team case 3).
- **Rejected:** 80% (the room's proposal): above the pooled compliance of general EMA studies, so most compliant runners would be held. Mandatory answers before saving: blocks logging, which feeds every other cap.
- **Evidence:** factdesk1 §2, CORROBORATED (next-morning rule); factdesk6 §3, CORROBORATED (EMA compliance 75%, CI 72–78%); the threshold itself is a design default.

## 30. The module texts are the rule base (v5)
- **Choice:** Each module carries its own machine records next to its prose rules; a build script turns them into rules.json, checks typed actions against the vocabulary in 12, every name against the declared evaluation context, and every number against the parameter register. Records are honest about their status: formal, procedure (calls a named algorithm), static (a build check) or text-only (not executable).
- **Why:** v4 kept expressions in a script dictionary and every action as "see then_text", so the published rule base was not executable and could drift from the prose (p2-roomB).
- **Rejected:** a separate DSL file per module (two sources again); generating prose from records (loses the rationale and evidence that coaches read).
- **Evidence:** p2-roomB R1–R8; engineering practice, no physiological claim (basis `eng`).

## 31. Ship in three steps (v5)
- **Choice:** MVP = 5K–half with the default method; marathon (R2) only after the 65+ and over-3-hour fixtures and the oracle pass; ultra (R3) last.
- **Why:** the riskiest rules (runs over 3 hours, back-to-backs, 65+ gates) have the thinnest evidence and the most complex code; shipping them last lets the pilot test the simpler core first.
- **Rejected:** one release of everything (largest untested surface); ultra-first (the most enthusiastic users face the least-evidenced rules).
- **Evidence:** p2-roomB R12; hearing-2 med, UNKNOWN (duration and injury) → design choice.

## 32. Goal races need recovery between them (v5)
- **Choice:** A goal race is allowed only `race.recovery_days[distance of the previous goal race]` after it (5K 7, 10K 10, HM 14, M 28, ultra 42 days), across goal changes, and the post-race TRANSITION survives a goal change.
- **Why:** without it a runner could chain a half marathon every week by switching goals (red team case 8), each race exempt from the spike caps.
- **Rejected:** no floor (the attack); a marker-based minimum (no marker evidence for 5K–10K).
- **Evidence:** factdesk6 §1: "one easy day per mile" CORROBORATED as a coaching convention (3/6/13/26 days); ultra conventions CONTRADICTED (they differ ×10); defaults sit at or above the convention → design default.


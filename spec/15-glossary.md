# 15 — Glossary (v5.1)

Serves criterion 12. Each entry gives a plain-words meaning, then, where it helps, the precise meaning used by the engine (*Engine:*) and the module that defines it. The message lint (14) requires every term here to be either replaced by its plain words or linked to this page on first use in user-facing text.

## Training and physiology

- **Aerobic base (AER).** The fitness built by lots of easy running. *Engine:* competence node set by sustained weekly easy time (02).
- **Anchor.** A recent race or timed test used to set your training paces. *Engine:* `PerformanceAnchor` with confidence `measured` and younger than `anchor.max_age_days` (07 §3).
- **Back-to-back long runs.** Two long runs on consecutive days, used in ultra training. Optional and off by default; it is a coaching practice that no study has tested (09 DST-010/011).
- **Base phase.** Weeks of mostly easy running that build volume and the long run (04).
- **Benchmark test (FT-0).** A simple 30-minute easy run that shows you can run continuously. It sets no paces (06).
- **Build phase.** Weeks that add harder sessions (threshold, intervals) on top of the base (04).
- **Critical speed (CS).** The fastest pace you can hold for a long time without "blowing up", roughly your 30–60-minute race pace. Estimated from two or more timed efforts (06 field tests).
- **Cross-training.** Exercise other than running (cycling, swimming), which loads the legs less.
- **Deload (easier week).** A planned lighter week, about a quarter less volume, every 3–4 weeks. Coaching convention; how often is not proven (04, 05).
- **Durability (DUR).** Staying strong late in a long run or race. No field test exists, so the method uses long-run duration as a stand-in (02).
- **Easy run.** A run at a pace where you can speak in full sentences (effort E1).
- **Economy (ECO).** How little energy you use at a given pace. Strides, strength work and plyometrics improve it (02).
- **Effort ladder.** The shared scale used instead of numbers: **E0** walk · **E1** easy, full sentences · **E2** steady, short phrases · **E3** hard, a few words · **E4** very hard, cannot talk · **E5** strides, short, fast and relaxed (12 §1).
- **Exit test.** A session that proves you have reached a competence level and unlocks the next one (06).
- **Fartlek.** Unstructured surges within an easy run.
- **Field test.** A timed run (for example 3 km, or 400 m + 2000 m) used to set paces (06).
- **Interval.** A repeated hard segment with recovery between repeats.
- **Long run.** The longest run of the week, usually easy (E1).
- **Maintenance mode.** Two or more runs a week, keeping some intensity, to hold fitness without a goal. Holds general fitness for up to about 15 weeks, but not long-race durability (04).
- **Medium-long run.** A mid-week run about two-thirds the length of the long run (Pfitzinger-style preset).
- **Pace.** Time per kilometre (e.g. 6:00 /km).
- **Plyometrics.** Small jumps and hops that train springy tendons.
- **Polarized / pyramidal.** Two ways of sharing time between easy, moderate and hard running. *Pyramidal* (the default): mostly easy, some moderate, a little hard. *Polarized*: mostly easy, a little hard, almost no moderate. The difference is small (05).
- **Progression profile.** How fast weekly volume may grow: *standard* or *slow* (05).
- **Race-pace work (MSP).** Running segments at your goal race effort (02, 06).
- **Recovery.** Rest or very easy activity that lets training adaptations happen.
- **Run-walk.** Planned alternation of running and walking (e.g. 2 min run : 1 min walk). A full method in its own right, not a fallback (06).
- **RPE (rating of perceived exertion).** How hard a session felt, from 0 (rest) to 10 (maximal). Logged after each run (01).
- **Session RPE load.** Duration × RPE; used to describe training load, never as a gate (05).
- **Specific phase.** Weeks that rehearse race demands: race-pace work, peak long runs, fuelling (04).
- **Strides.** About 6 × 20 seconds fast but relaxed, with full recovery (E5).
- **Taper.** The last 2–3 weeks before a race, when volume drops by about half but you keep running as often and keep some fast running (04, 05).
- **Tempo / threshold run (THR).** Sustained "comfortably hard" running at effort E3 (02, 06).
- **Tissue tolerance (TOL).** How much running your bones, tendons and muscles are used to. It sets volume and long-run growth, separately from your speed (02).
- **Transition.** One to three easy weeks after a goal race (04).
- **Tune-up race.** A shorter race or long effort weeks before the goal race. It must respect the spike caps (09).
- **VO2max.** Your top aerobic capacity, trained by very hard intervals (E4).
- **Volume.** Total running per week, in time or distance.

## Safety and health

- **Bone stress injury.** Overload damage to bone, ranging from a stress reaction to a fracture. The tool never names it to you. It asks symptom questions and pauses the plan (10).
- **Clearance (attestation).** Your confirmation, on a later day, that a health professional has said you may train (10).
- **EAH (exercise-associated hyponatraemia).** Dangerously low blood sodium from drinking too much during long events. The tool tells you to drink to thirst (11). Internal term only.
- **Heat illness.** Overheating during exercise; a stop-and-seek-help sign (10, 11).
- **Neck check.** A coaching rule of thumb: symptoms only above the neck (a cold) allow light running. Never formally tested (10 SAF-008).
- **PAR-Q+.** The standard published health questionnaire, shown unchanged before you start (01).
- **Pause.** The plan stops all running until the condition is cleared (`pause_until_clearance`).
- **Red flag.** A symptom that means "stop and see a professional", for example chest pain, fainting, bone pain that worsens, or confusion in the heat (10).
- **REDs (relative energy deficiency in sport).** Health problems from eating too little for your training. The tool asks a few screening questions and refers you if needed. It never calculates or diagnoses (11). Internal term only.
- **Return-to-run ladder.** A time-based walk–run progression after a long break or a cleared problem. You move up a rung only when sessions feel fine during the run and the next morning (10).
- **Spike.** A single run much longer than your longest run of the last 30 days (05).
- **Wellness product.** The tool gives training guidance only. It never diagnoses, scores health risks or treats injuries (00 §6).

## Method and engine terms

- **ACWR (acute:chronic workload ratio).** A ratio of recent to longer-term load. It is displayed only and never used as a gate, because evidence against it as an injury predictor is strong (07 INV-10).
- **Banister model / CTL / ATL / TSB.** Fitness-fatigue models used by some apps. Descriptive only here; never a gate.
- **Competence tree (graph).** The map of running abilities, their levels and which levels must come first (02).
- **Confidence flag.** How sure the tool is of an input: **measured** (logged at the time), **estimated** (recalled or claimed), **unknown** (not given) (12 §1).
- **Context modifier.** A setting change triggered by who you are (new runner, recent injury, 50+, night shifts) that makes the plan more cautious (01).
- **Demand.** What your goal race requires: competence levels, weekly volume and peak long run (03).
- **Design default.** A cautious value chosen by the method where evidence is missing. It can be changed as a parameter and is always labelled.
- **Deviation ledger.** The record of every change the rules made to the starting template, with the reason (07 §7).
- **DMN hit policy.** How a decision table combines rules that fire together (COLLECT, ALL, PRIORITY) (07 §1).
- **Evidence grades.** VERIFIED (primary source read; **never reached in this method**) · CORROBORATED (two independent sources agree; the ceiling here) · CREDIBLE (one good source, plausible; every single-study finding) · ALLEGED (one weak source) · CONTRADICTED · UNKNOWN. **Research method (disclosed, post-audit).** All research for this method used WebSearch result summaries only; no primary source (paper, book, guideline document) was opened. CORROBORATED (two independent summaries agree) is therefore the ceiling; nothing in the method is VERIFIED. A finding from one study is at most CREDIBLE, however many summaries repeat it. Shown to runners with the labels of 00 §5 and messages.md §4: "well supported by research" (evidence, CORROBORATED) · "some research support" (evidence, CREDIBLE) · "common coaching practice" (convention) · "our cautious choice, not tested" (design default) · "not known" (UNKNOWN); engineering rules carry no evidence label.
- **Fail closed.** When no safe plan exists for your goal, you get no plan for it. You get ranked alternatives instead (07 §6.2).
- **Feasibility check.** The test of whether your goal fits your current fitness and the time available (03).
- **Fired-rule log.** The list of rules that shaped your plan (07 §9).
- **Invariant (INV-xx).** A rule every plan must satisfy, checked by the independent validator (07 §5).
- **L30 / L30_eff.** Your longest run in the last 30 days. *L30_eff* is the version the engine trusts after confidence and plausibility checks (07 §3).
- **Log status.** *rich* (≥ 3 runs logged at the time in 30 days), *sparse*, or *none* (07 §3).
- **No catch-up.** Missed running is never added to later days or weeks (07 INV-04).
- **Parameter register.** The single list of every number the method uses, with its evidence grade (`parameters.md`).
- **Plausibility check.** A prompt when an entry looks like a typo (impossible pace, huge jump). It is kept out of the safety calculations until you confirm it (07 §4).
- **Preset (school).** A coherent bundle of settings from a named method: Daniels, Hansons, Pfitzinger-classic, Higdon-novice, Galloway, FIRST, Koop-ultra, Norwegian-elite, or the method default (09).
- **Priority (Tn.nnn).** A rule's rank: tier first (T0 red flags … T6 preferences), then number (07 §1).
- **Probation.** The first weeks after unverified history, when the slow progression profile applies (07 GEN-014).
- **PROVISIONAL.** A value held only to keep the spec consistent until a sub-council decides (RESOLUTIONS).
- **Repair.** A fixed-order fix the engine applies when a plan breaks a rule (07 §6).
- **Spike cap.** No planned run longer than 1.10 × L30_eff (distance and duration); above 2.0 × is always blocked (07 INV-01/02). This is the only single-run limit with injury data (one observational cohort, distance only).
- **Tier.** One of seven rule levels: T0 red flags, T1 screening gates, T2 hard limits, T3 your constraints, T4 goal, T5 progression, T6 preferences.
- **Two-day cap.** The day before and after a long run is at most half the long run, and the two days together at most 1.60 × L30_eff (07 INV-03, v2).
- **Validator.** Separate code that checks every plan against the invariants before you see it (07 §5).
- **Experienced path (v5.3).** The start used when a recent confirmed race and a matching training history show you already train well: your plan starts at your level, checked by three calibration weeks (02 §2b).
- **Declared (v5.3).** A level or race result you gave us that we use straight away, but that your logged runs or a test have not yet confirmed. It sits between "estimated" and "measured".
- **Calibration weeks (v5.3).** The first three weeks of the experienced path: normal training that checks the declared start; if they go badly the plan becomes more cautious (02 EXP-004).
- **Entry rung (v5.3).** The size at which a session type starts for your level (06 §2d).
- **Fartlek.** Running hard and easy in turns by time or feel, without a track.
- **WMA age-grading.** Converts a race time into a percentage of the world-best performance for your age and sex (01).

## Nutrition

- **Carbohydrate (g/h).** Grams of carbohydrate eaten per hour during long runs and races (11).
- **Drink to thirst.** Drink when thirsty rather than to a schedule; the default (11).
- **Fuelling (FUEL).** Eating and drinking during long runs and races; trainable like any other skill (02, 11).
- **GI score.** Your stomach comfort, 0 (fine) to 10 (very bad), logged after fuelled runs (11).
- **Gut training.** Gradually raising carbohydrate intake in training so the stomach tolerates race amounts (11).
- **Heat acclimatisation.** One to two weeks of training in heat before a hot race (11).
- **Sweat test.** Weighing yourself before and after a run to estimate sweat rate (11).
- **Train-low.** Training with low carbohydrate on purpose. Opt-in for advanced runners only, never before quality sessions, and blocked if the energy screen is positive (11).

## Added in v2

- **Baseline hold.** The plan never cuts your current long run or weekly running unless a safety rule, your own time limits, or a planned easier week requires it. *Engine:* `V_hold`, `L_hold`, LOD-005, INV-27.
- **Classic-capped.** The default style for the half and the marathon. The long run may be up to half of your weekly running time. It stops at 3 hours (2.5 for the half) or 32 km, whichever comes first. The 3-hour stop is a coaching convention (05 §4).
- **Deadband.** A change smaller than normal test-to-test noise (3.5%) does not move your paces. A larger change up to about 9.5% moves them only when a second result agrees (03 §3b; v5.1).
- **Degraded completion.** After an illness or break late in a plan, the tool keeps your race goal as "finish" and builds the remaining weeks safely, instead of dropping the plan (FEA-043).
- **Distance floor.** The shortest long run the method accepts for a race, e.g. 21 km for a marathon (03 §2).
- **Interim target.** For a very ambitious long-term time goal, the nearer target the tool checks you against at each field test (FEA-038).
- **Load ordinal.** "The 5th normal week of the plan". No-catch-up compares normal weeks with normal weeks and easy weeks with easy weeks (INV-04).
- **Pace model.** How paces are worked out from a recent race or test. Each effort gets a pace range, and easy runs always say "or slower" (03 §3b).
- **Peak credit.** A long run you already did this season still counts toward the race, for up to 70 days (FEA-025).
- **Peak week (ultra).** For ultras, the longest runs come every second week; the weeks in between are shorter (DST-009).
- **Published window.** The next 7 days of your plan stay as shown, unless something makes them easier (ADP-014).
- **Water-filling.** How the week is filled. Easy runs share the remaining time equally; days that must stay short (next to the long run) keep their cap, and the rest goes to the other days (LOD-031).

## Added in v3

- **Cut-off check.** If a race's time limit is faster than even the optimistic end of your predicted range, the goal is not offered. If it falls inside the range, the goal is flagged "at risk" (FEA-006).
- **Distance floor (ultra).** The shortest peak long run accepted: 25 km for a 50K, 33 km for a 100K (03 §2).
- **Extension run.** An optional, labelled longer marathon long run, at most three of them, up to 29 km or 4 hours with walk breaks. It is never required (DST-019).
- **Run-count share cap.** For 5K/10K plans, the long run may be a larger share of the week when you run fewer days: 45% at 3 runs, 40% at 4, 30% at 5 or more (05 §4).
- **Start ladder.** The 9-step Couch-to-5K progression for people who have never run (10 §4b).
- **Volume-carrying long run.** When your few run days are already full, the long run grows a little (within the 10% rule) so the week reaches what your goal needs (LOD-016).

## Added in v4

- **Bound check / metamorphic relation.** Two ways the validator checks a plan without copying the generator's formulas. A bound check tests a limit stated directly on the plan, e.g. "no run more than 10% longer than your recent longest". A metamorphic relation compares related plans, e.g. "more weeks never means a steeper build" (07 §5a).
- **Change availability.** The first option offered when a goal fails only for lack of time or days. It shows exactly how much to add, and nothing changes until you do it (03 §6).
- **Expected duration.** How long a run is likely to take at your logged easy pace. Long-run safety checks use it (LOD-017).
- **Floor-bound run.** A long run that continues past the time cap only until it reaches the minimum distance your race needs (03 §2b).
- **Headline.** The one-line summary of a verdict: "ambitious", "tight" or "uncertain" (messages.md §1).
- **LADDER_RUNWALK.** If race week arrives before you finish the beginner steps, you can still run your 5K with walk breaks at your current step (FEA-043).
- **RuleExpr.** The rule language the engine uses (a small part of Google's CEL). A missing answer counts as "unknown", never silently as "no" (12 §3.2).
- **Season (multi-year).** Plans longer than a year are split into equal seasons. Each ends with a test (followed by an easier week) or a race (followed by recovery weeks) (04 §3).

## Added in v5 (p2-A R9)

- **Talk test.** How we describe effort without numbers: if you can talk in full sentences you are running easy (E1); a few words means hard (E3); no talking means very hard (E4). *Engine:* the effort ladder (12 §1).
- **Verdict.** Our answer about your goal: **feasible** (it fits), **stretch** (it fits, with a warning), or **infeasible** (it does not fit safely; we show options that do). *Engine:* `FeasibilityResult.verdict` (03 FEA-036).
- **Stretch.** A goal that fits, but with a warning shown as one of three headlines: **ambitious** (fast for your current fitness), **tight** (little spare time), **uncertain** (we know little about how you race) (messages.md §1).
- **Headline.** See Verdict and Stretch; at most one headline is shown, in the order ambitious, tight, uncertain.
- **Predicted range.** The finish times today's fitness suggests, from the fast edge to the slow edge, with the most likely time in between. The card always says whether your goal is inside it (messages.md §0, 03 §3).
- **SHARPEN.** A short plan (4 weeks or less) that keeps your running steady and sharpens it for a race; it adds no new volume (04 PHS-010).
- **ONBOARD.** The first one or two weeks of a plan, run by feel, ending with a short test that sets your paces (04, 06 SES-014).
- **Measured / estimated.** A **measured** value was logged at the time (within 48 hours) or comes from a test; an **estimated** value is recalled, claimed or entered late. Only measured values set paces or unlock very long runs (01 INP-005, INP-020).
- **Basis.** Why a rule or number is what it is: **evidence** (studies), **convention** (common coaching or clinical practice), **design default** (our cautious choice, not tested), **engineering** (how the app handles data; no health claim) (12 §3.1).
- **Hold (safety questions).** If you close the safety questions without answering, no run is shown until you answer them. Nothing else happens: no warning and no pause (12 §3.2).
- **Release profile.** Which part of the method is switched on: first 5K to half marathon, then marathon, then ultra (12 §6, 00 §7).

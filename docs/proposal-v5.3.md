# Proposal v5.3: experienced runners and real variety in hard sessions

*Written 28 Oct 2026 by the council session, on spec v5.2 and the engine of 28 Oct. This is a **proposal** from one session, not a council verdict. Nothing in `spec/` is changed yet. The decisions in §7 are yours. Every new value is a **design default, unvalidated**. Coaching conventions cited from memory are graded ALLEGED at most.*

## 0. In plain words

The generator gave an experienced runner a beginner's plan:

- one 3 × 5 min threshold session a week for 22 weeks;
- everything else easy;
- a long run far shorter than usual;
- no intervals, no race-pace work.

The engine is not at fault: it does exactly what the method says. The method was designed to never hurt a runner it knows nothing about. It therefore distrusts everything a new runner types in, and it has no path for someone who clearly knows how to train. The session library is also too narrow: few session types, all written in minutes, with low ceilings.

v5.3 proposes six things:

1. An **experienced-runner path**: a recent race result and a consistent training history set the starting levels.
2. **Two hard sessions** a week in the build phases for those runners, and a third as an option.
3. Sessions that **start at the runner's level** and go higher.
4. A **richer session library**: intervals, short reps, hills, fartlek, race-pace, combinations. Each can be written **by distance (10 × 600 m) or by time (10 × 2 min)**.
5. The plan **shows the expected progression** instead of a flat copy of week 1.
6. **Tests that judge plan quality** for advanced runners, and a review by a real coach.

Safety rules do not change: screening, the single-run spike cap, no catch-up, pain rules, fail closed. The experienced path is checked during the first weeks. It **falls back** to the cautious path if the log does not match what was declared.

---

## 1. The case

The owner's own profile, typed into the web prototype:

- **Goal:** a 10K target time of 36:00, race in 22 weeks.
- **History:** about 85 km and 480 min per week; longest recent run 34 km in 166 min.
- **Recent race:** a half marathon in 1:21:37, one week before joining.
- **Availability:** up to 12 sessions and 600 min per week.

The council session re-ran the same profile through `engine/cli.ts` (inputs in §8). What the engine decided:

| What | Engine value | Why (rule) |
|---|---|---|
| Levels | HAB, TOL, AER, DUR at 2 (estimated); **THR, VO2, MSP at 0** | CMP-004 caps self-report at 2 (1 for THR, VO2, MSP). A race result never sets a level. |
| Hard sessions per week | **1 in every phase** (`quality_max = 1`) | SES-007: "1 … while level(TOL) ≤ L2". TOL cannot exceed 2 from self-report. |
| Hard session | SES-M-008 **3 × 5 min E3**, every week from 6 to 20 | CMP-007 picks THR, the only node with an open module. The dose starts at the bottom rung, and the published plan shows one step ahead only (07 §2b). |
| Long run | **90 min** instead of 166 | GEN-011 caps claimed L30 by `claim.l30_cap_by_tol[2]`. |
| Paces | **none** (effort only) | INP-005: a race entered more than 48 h after the race is "estimated", and estimated anchors never set paces. Entered on race day, the paces appear, but nothing else changes. |
| Progression | "slow" profile; weekly volume capped at +10% until 6 logged weeks | GEN-014, LOD-007/008 (the v5.1 fix added by the council session made this stricter). |
| Verdict | "stretch", 36:00 inside the predicted fast band (point 37:00) | 03 §3 prediction band: correct and sensible. |

## 2. Diagnosis: eight causes

1. **Blanket distrust of self-report** (CMP-004, GEN-011, GEN-014). Every claim is treated as possibly inflated, whatever its consistency. That is right for an unknown beginner and wrong for a runner whose volume, long run and race time all agree.
2. **A race result sets paces, never levels.** The competence tree only rises through logged thresholds or exit tests (CMP-001/002). A 1:21 half marathon says a lot about threshold and race-specific endurance. The method ignores it.
3. **Late-entered race results are discarded for paces** (INP-005, 48 h window). Real runners enter last week's race when they sign up.
4. **The key-session count is tied to a capped level** (SES-007). Since TOL ≤ 2 for every newcomer, nobody gets 2 hard sessions until weeks of logging.
5. **Doses start at the bottom and stop low.** Every module begins at rung 1. Ladder tops are recreational:
   - threshold up to 5 × 8 min;
   - VO2 up to 6 × 3 min (18 min at E4);
   - continuous threshold up to 40 min.
6. **The session library is narrow and time-only.** There are 25 modules, but only 4 kinds of hard session (threshold reps, continuous threshold, VO2 reps of 2–3 min, race-pace reps), all in minutes. Missing:
   - short reps (200–400 m);
   - long reps (1000–2000 m);
   - hill repeats of 45–90 s;
   - fartlek;
   - combination sessions;
   - distance-based prescriptions of any kind.
   
   The data schema already allows a distance prescription (`segment.distance_m`); the library never uses it.
7. **Progression is invisible.** By design (07 §2b, v5.2), future weeks show one step above the last logged session. Seen from day 0, a 22-week plan looks like week 1 repeated.
8. **No test could catch it.** All personas are recreational (52-min 10K, first 5K, marathon beginners). The 1,958 oracle tests check that the engine follows the spec, not that the plan is good training.

## 3. Proposal A: the experienced-runner path (causes 1–4)

### A1. Eligibility (new rule EXP-001)

A runner enters the experienced path at onboarding when **all** of these hold:

- **A recent race result:** all-out, 5K to marathon, run in the last `exp.race_max_age_days` (84 days). The runner confirms it as an official result. A link or bib number is optional.
- **Training age** ≥ `exp.training_age_min` (2 years).
- **A consistent claimed history.** Claimed weekly volume, runs per week and longest run fall inside the plausible band for that performance level (A2). Wildly fast results on very low volume, or the reverse, do not qualify.
- **No current pain flag, no injury in the last `exp.injury_free_weeks`** (12 weeks), and screening = proceed.

Otherwise the runner stays on the cautious path of v5.2, unchanged.

### A2. Starting levels from performance (new table, 02 §2b)

The race's **age-grade** (WMA tables, already used by INP-005) sets the performance-side levels. The claimed history sets the volume-side levels, up to a new cap.

| Age-grade of the race | THR | VO2 | MSP (for the race's own distance family) | Plausible weekly volume band (consistency check) |
|---|---|---|---|---|
| < 55% | 1 | 1 | 0 | any |
| 55–64% | 2 | 1 | 1 | ≥ 150 min |
| 65–74% | 3 | 2 | 1 | ≥ 240 min |
| ≥ 75% | 3 | 3 | 2 | ≥ 300 min |

- **Volume-side levels.** HAB, TOL, AER and DUR come from the claims as today, but capped at `exp.claim_level_cap` (**3**, not 2). TOL 4 needs logged weeks.
- **Confidence.** A new value, `declared`, sits between `estimated` and `measured`. It unlocks modules and counts, but never a level test.
- **Example.** The owner's 1:21:37 half marathon is about 70% age-grade (men's tables, approximate). That gives THR 3, VO2 2, MSP 1, and TOL/AER/DUR 3. The levels needed for 36:00 are THR 2 and VO2 2, so they are already met. The plan can spend its weeks on **raising** them, not unlocking them.
- **Grade.** The mapping is a design default (ALLEGED: built from the usual relation between age-grade, training volume and session ability in coaching practice). It must be checked with a coach (§6).

### A3. Calibration weeks and fallback (new rules EXP-002, EXP-003)

- **Calibration.** The first `exp.calibration_weeks` (3) weeks are normal training weeks, not tests. They contain one threshold session and one VO2 session at the declared levels' **start** rung, and a long run at 0.9 × claimed L30. The runner logs them.
- **Fallback.** If, during calibration, any of these happens, the runner drops to the cautious path for the affected nodes, and the plan is re-generated (a reduction, always allowed):
  - two key sessions logged with RPE above target + margin;
  - a missed week;
  - a pain flag;
  - logged volume < 80% of planned.
- **Confirmation.** If calibration passes, `declared` levels become `measured` for HAB, AER and TOL, and the baseline counts as confirmed. That replaces the 6-week wait of LOD-008 for this path.

### A4. Long run, volume and paces on the experienced path (changes to GEN-011, GEN-014, LOD-007, INP-005)

- **Long run.** `L30_eff` = `exp.l30_discount` (0.9) × claimed L30, still capped by the spike rules. That gives about 150 min, not 90.
- **Volume.** The claimed weekly time is held from week 1. LOD-007's estimated-baseline cap applies **against the claim**, so it no longer forces a slow climb back to where the runner already is.
- **Progression profile.** "standard", not "slow".
- **Paces.** A confirmed race entered late (EXP-001) sets paces with a **wider band** (`exp.declared_pace_widen_pct`, +2%) until a race or field test entered on time confirms it. INP-025's plausibility check still applies.

## 4. Proposal B: more and better hard sessions (causes 4–6)

### B1. How many hard sessions (change to SES-007)

| Phase | Cautious path (v5.2, unchanged) | Experienced path (v5.3) |
|---|---|---|
| BASE | 0–1 | 1 + strides or hill sprints |
| BUILD, SPECIFIC | 1, or 2 once TOL ≥ 3 is logged | **2** |
| Optional third | — | **3**, on request: needs ≥ 6 runs a week, TOL ≥ 3 and the weekly hard-time budget |
| TAPER | 1 sharpener | 1–2 sharpeners |

- **Hard-time budget.** The weekly budget stays (LOD-033; short family 20% of weekly time at E3–E4). At 480 min/week that is 96 min, enough for two real sessions.
- **Long run.** A long run with a fast finish counts as a hard day for spacing, as today.

### B2. Start at the runner's level, and higher ceilings (change to SES-011, 06 §2c)

- **Start rung.** Each ladder gets an **entry rung per level**. A runner at THR 3 starts threshold work at the THR 3 rung, not at 3 × 5 min.
- **Ladders extended upwards** for levels 3–4:
  - threshold up to about 50–60 min accumulated (e.g. 3 × 15 min, 2 × 25 min);
  - VO2 up to about 24–30 min accumulated (e.g. 6 × 4 min, 8 × 1000 m);
  - 10K race pace up to about 10–12 km accumulated (e.g. 5 × 2 km).
- **Step size.** Kept: one step per well-tolerated session (SES-011). The steps are bigger in the upper rungs (+1 rep **or** +200–400 m per rep).

### B3. A richer library (06 §2): types of hard session

Each module has a **time form and a distance form**. The examples below are for an experienced 10K runner, in the BUILD and SPECIFIC phases. The doses are illustrative; the ladders set the real values.

| Family (node) | New or extended modules | Distance form (examples) | Time form (examples) | Effort |
|---|---|---|---|---|
| **Threshold** (THR) | cruise intervals (extended SES-M-008), continuous tempo (SES-M-009), **threshold in km** | 5 × 1600 m, 4 × 2 km, 3 × 3 km (60–90 s jog); tempo 6–10 km | 5 × 6 min, 4 × 8 min, 3 × 12 min; tempo 25–40 min | E3 |
| **VO2 long reps** (VO2) | extended SES-M-010 | 5–6 × 1000 m, 4–5 × 1200 m, 8 × 800 m (2–3 min jog) | 5 × 3 min, 6 × 4 min | E4 |
| **VO2 short reps / speed endurance** (VO2, ECO) | **new** | 10–16 × 400 m, 10 × 600 m, 12–20 × 200 m (equal-time or 200 m jog) | 15 × 1 min / 1 min, 20 × 30 s / 30 s | E4–E5 |
| **Hills** (VO2, ECO) | **new**, besides short hill sprints | 8–12 × 200–300 m uphill, jog down | 8–12 × 60–90 s uphill | E4 |
| **Fartlek** (THR, VO2) | **new** | — (by time only) | 10 × 1 min on / 1 min off; pyramid 1-2-3-4-3-2-1 min | E3–E4 |
| **10K race pace** (MSP) | extended SES-M-011, written in km | 10 × 1 km, 5 × 2 km, 3 × 3 km at goal pace (60–90 s jog) | 5 × 6 min, 3 × 10 min | race effort |
| **Combination** (THR + VO2) | **new** | 2 × (3 km E3 + 4 × 400 m E4); 4 km E3 + 6 × 200 m E5 | 20 min E3 + 6 × 1 min E4 | E3 + E4 |
| **Long run variants** (DUR, MSP) | **new** for short family | long run with the last 3–5 km steady (E2) | last 15–20 min E2 | E1 + E2 |

**Variety rule (new SES-030).** When a node is chosen for a slot (CMP-007), the module is picked from that node's family **in rotation**, so the same session is not repeated two weeks in a row when another eligible module exists. A typical 4-week BUILD block for a 10K runner then alternates:

- long VO2 reps;
- short reps or hills;
- threshold in km;
- combination or fartlek;

always with one THR-type and one VO2-type session per week.

### B4. Distance or time: how a session is written (new rules SES-031, SES-032)

- **Runner setting** `prescription_preference`: `distance` (default when paces are known), `time`, or `both` ("10 × 600 m, about 2 min each").
- **Effort-only runners** (no pace anchor) always get the time form. A distance rep without a pace means nothing.
- **Converting time to distance.** Rep distance = planned rep time × the effort's pace, rounded to a "track-friendly" distance: 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000 m, then whole km. The **time** stays the controlling quantity for every budget and cap (TID, spike cap, dose steps). The rounding may change a rep by at most `ses.dist_round_tol_pct` (±10%). Otherwise the next rung down is used.
- **Recoveries** are written the same way: "200 m jog" or "1 min 30 s jog".
- **Display.** "10 × 600 m at 5K effort (≈ 3:28/km, about 2:05 each), 200 m jog".

## 5. Proposal C: show the progression (cause 7)

Change 07 §2b "Projection":

- **Planned path.** Future weeks show each module's **planned dose path**, assuming every session is completed as planned: one rung per instance, within the ladder, the budgets and the caps. The path is labelled *"planned progression, if sessions go as intended"*.
- **Weekly re-plan.** When the log shows a session felt too hard or was missed, the path holds or steps back (a reduction, always allowed by ADP-014).
- **Safety.** A planned path never steps up beyond what the log has confirmed by more than `ses.projection_max_steps` (6 steps).

## 6. Proposal D: test plan quality, not only spec conformance (cause 8)

1. **Five advanced personas** in `spec/fixtures-input/`:
   - the owner's case;
   - a 3:00 marathoner;
   - a 19:00 5K runner on 5 runs a week;
   - a masters 55-year-old with 70% age-grade;
   - an "inconsistent claims" case that must stay on the cautious path.
2. **Coach-quality checks in the oracle**, as properties of any plan on the experienced path:
   - weekly volume never below 85% of the confirmed history outside deload and taper weeks;
   - 2 key sessions in every non-deload BUILD and SPECIFIC week;
   - at least two different hard-session families every 2 weeks;
   - for a time goal, race-pace work in SPECIFIC;
   - the long run never below 0.8 × the habitual long run outside taper;
   - no hard session the day before or after the long run;
   - the planned dose path rises over BUILD;
   - the distance form is shown whenever paces are known and the preference allows it.
3. **A human coach review**: 3–4 generated plans read by a qualified running coach before any tester sees the prototype. No human coach has reviewed this method yet. This is the only check that can catch "it's not good training" problems like this one.

## 7. Decisions for you

Recommended answers first. "Take your recommendations" is a valid answer.

1. **Should a recent race result set your starting level?** It would count for threshold, intervals and race pace, if run all-out in the last 12 weeks and confirmed by you. *Recommended: yes.*
2. **Should a race entered after the fact still give paces?** Slightly wider pace ranges until a training session or race confirms them. *Recommended: yes.*
3. **Should experienced runners get 3 "calibration" weeks?** They train normally at the declared level. If those weeks look wrong (too hard, missed, pain), the plan switches to the cautious version. *Recommended: yes.*
4. **How many hard sessions for experienced runners in the build phases?** *Recommended: 2 by default, 3 on request if you run at least 6 times a week.*
5. **Distance or time for intervals?** *Recommended: distance by default when your paces are known (e.g. 10 × 600 m), with a setting to choose time or both; time only when there are no paces.*
6. **The hard-session families in §4 B3:** threshold, long reps, short reps, hills, fartlek, race pace, combinations, long-run variants. *Recommended: yes, all of them, with rotation so two weeks in a row are not the same.*
7. **Show the full planned progression in advance**, labelled "if sessions go as intended"? *Recommended: yes.*
8. **Training history from a watch or Strava file** (GPX, FIT or CSV of the last 8–12 weeks), counted as measured. This reverses your 21 Oct choice "manual entry only". It would solve most of the cold start for anyone with a watch. *Recommended: yes, as the next step after v5.3, not inside it.*
9. **A coach review of 3–4 plans** before anyone else tests the prototype. You would need to find the coach. *Recommended: yes.*

## 8. Reproduction

Profile used: `docs/v5.3-case/clem.json`. It is Tom's fixture, with your history, availability, race and goal, and `today` = 2 Nov 2026. Run from `engine/`:

```
node cli.ts ../docs/v5.3-case/clem.json --pretty > plan.json
```

The result is a plan, verdict "stretch", `quality_max` 1 in every week, SES-M-008 at 3 × 5 min, and `L30_eff` 90 min. Entering the race the day it was run (`entered_at` = race day) gives paces, but nothing else changes.

## 9. What happens after your answers

1. **Engine session, part C** (`handoff/6-engine-part-C-v5.3.md`): writes v5.3 into the spec. That covers new rules, parameters, the library modules with both forms, the projection change and messages. Then it implements them in the engine.
2. **Oracle session** (`handoff/7-oracle-v5.3.md`): adds the five advanced personas and the coach-quality checks without seeing the engine. It writes the hand-computed experienced plan for your case, week by week.
3. **Integration and prototype update**, as in steps 4–5 of `START-HERE.md`.
4. **Coach review** (you).

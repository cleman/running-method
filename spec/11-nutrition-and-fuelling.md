# 11 — Nutrition and fuelling (v5)

v2: FUEL L3 (60–90 g/h at race effort) is required only for races expected to last > 2.5 h; races of 90 min to 2.5 h require FUEL L2 (02 CMP-008, F-10).

Serves criteria **4** (FUEL and HEAT nodes), **7** (hydration, heat, REDs safety), **8** (graded evidence), **12** (plain language). Rules NUT-001…099; invariants NUT-INV-01…; priority block `nnn` 550–599. Companions: 02 (FUEL, HEAT), 06 (fuelling-rehearsal long run, field tests), 07 (INV-18), 10 (red flags), `parameters.md` §8.

> **In plain words.** For races longer than about 90 minutes, eating and drinking on the run is a skill you train like any other. The tool helps you practise it on long runs, step by step, and builds your race-day plan only from what your stomach has handled in training. It tells you to drink to thirst unless you have measured your sweat rate. It gives general food information, never diets or weight targets, and points you to a professional when your answers suggest you may not be eating enough.

All evidence below is from wg5 and hearing-1 (nutr); no primary paper was opened, so CORROBORATED is the ceiling [wg5 header].

## 1. Scope boundary

The tool is a general-wellness product (00 §6) [factdesk2 §2, CORROBORATED]. Nutrition is the area where that boundary is easiest to break.

**In scope:** general information (daily carbohydrate and protein ranges, timing), the fuelling skill (FUEL node), race fuelling and drinking plans built from the runner's own logged tolerance, heat preparation, a fixed self-screen with generic referral.

**Out of scope, always:** meal plans; calorie or energy targets; deficits; weight-loss or race-weight targets; energy-availability (EA) calculation; food logging; ketogenic or other restrictive diets; supplements beyond caffeine; individual sodium prescriptions [wg5 impl. 6, 9, CORROBORATED/CREDIBLE; hearing-1 §4 refer-out boundary, CORROBORATED]. The 30 kcal/kg FFM threshold is not a valid individual cut-off [wg5 §2, CORROBORATED], EA cannot be measured reliably in the field [hearing-1 §4, CORROBORATED], and calorie-tracking apps are associated with disordered eating [hearing-1 §4, CORROBORATED association] — so the tool never computes or asks for intake.

```
RULE NUT-001 | priority T2.550 | when any user-facing text or field is built for nutrition | then it must not contain meal plans, calorie or energy targets, deficits, weight or race-weight targets, EA values, intake logs or restrictive-diet advice (enforced as NUT-INV-01/02) | because these cross the wellness boundary and carry eating-disorder risk | evidence wg5 impl. 6, 9, CORROBORATED/CREDIBLE; hearing-1 §4, CORROBORATED | basis evidence | default? no
RULE NUT-002 | priority T1.551 | when RunnerProfile.nutrition_referral_flag = true (proposed; diabetes, digestive, kidney or heart condition, medicines affecting fluid or salt balance, pregnancy) | then suppress all numeric fuelling, drinking, loading and caffeine targets; show MSG-NUT-REFER; long runs still run, without intake targets | because individual advice for these conditions belongs to a doctor or dietitian | evidence wg5 impl. 9, CREDIBLE (conditions); hearing-1 §4, CORROBORATED (refer-out) | basis evidence | default? no
RULE NUT-003 | priority T1.552 | when the runner is a minor (SpecialStatus minor) | then no caffeine, no carbohydrate loading, no train-low; general information only | because minors are a referral group and these options are adult practice | evidence wg5 impl. 9, CREDIBLE | basis design_default | default? yes
```

## 2. Daily carbohydrate and protein (information only)

> **In plain words.** The more you train, the more carbohydrate you need. The tool shows a general range for your training week. It is information, not a target.

| Planned training per day (from the active week) | Carbohydrate | Grade |
|---|---|---|
| light | 3–5 g/kg/day | range CORROBORATED; edges CREDIBLE |
| ~1 h | 5–7 g/kg/day | CREDIBLE |
| 1–3 h | 6–10 g/kg/day | CREDIBLE |
| ≥ 4–5 h | 8–12 g/kg/day | CREDIBLE |
| Protein, any load | 1.2–2.0 g/kg/day, spread over the day | CORROBORATED |

Sources: Thomas, Erdman & Burke 2016 [wg5 §1, CORROBORATED range; CREDIBLE band edges]; protein [wg5 §1, CORROBORATED]. Runners typically under-eat carbohydrate relative to load [hearing-1-nutr-field Q1, CREDIBLE].

```
RULE NUT-004 | priority T6.553 | when showing a week | then show the cho.daily_bands row for its mean daily planned time and the protein.daily_band, in g/kg; convert to grams only if body_mass_kg is entered, never asking for it for this purpose | because scaling carbohydrate to load is consensus; body mass is sensitive data | evidence wg5 §1, CORROBORATED/CREDIBLE | basis evidence | default? no
RULE NUT-005 | priority T6.554 | when the goal race is expected to last > fuel.required_above_min | then offer carbohydrate loading information (cho.loading_band for 36–48 h) labelled "raises muscle fuel stores; benefit over a normal high-carbohydrate diet unknown; can upset the stomach — try it before a long run first" | because loading raises glycogen (CORROBORATED) but its race benefit is UNKNOWN and GI risk is CORROBORATED | evidence wg5 §1, CORROBORATED/UNKNOWN | basis evidence | default? no
```

## 3. FUEL competence: levels, progression, exit tests

> **In plain words.** On long runs of an hour or more, you practise taking carbohydrate (gels, drinks, food). You start low and add a little every one or two long runs, as long as your stomach is fine (2 out of 10 or less on the stomach-comfort scale). What you can handle in training is what you use on race day.

Gut training improves GI tolerance [wg5 §5, CORROBORATED; hearing-1 §4: 8 small trials, mixed, CORROBORATED that evidence is small]. The progression rate is coaching practice [wg5 §5, CREDIBLE; dose-response UNKNOWN]. FUEL levels are defined in 02 §2 (L1 30 g/h, L2 45–60 g/h, L3 60–90 g/h at race effort, L4 > 90 g/h opt-in). The GI score is `ActivityRecord.gi_score_0_10`; intake is `carb_g_per_h`, both logged at the tick.

```
RULE NUT-010 | priority T4.555 | when the goal race is expected to last > fuel.required_above_min (FUEL required, CMP-008) and a planned long run lasts ≥ fuel.practice_min_duration_min | then make it a fuelling-practice session (06 rehearsal module) with target intake = the runner's current step, starting at fuel.start_g_h | because fuelling is a trainable skill needed above ~90 min | evidence wg5 impl. 3, CORROBORATED; wg5 §5, CORROBORATED | basis evidence | default? no
RULE NUT-011 | priority T5.556 | when fuel.step_runs consecutive measured practice runs reach the current step with gi_score_0_10 ≤ fuel.gi_pass_max | then raise the step by fuel.step_g_h, up to the band ceiling for the goal (§4) | because coaches add 10–15 g/h every one or two long runs while tolerated | evidence wg5 §5, CREDIBLE; hearing-1 §4, CORROBORATED (sequence) | basis design_default | default? yes
RULE NUT-012 | priority T5.557 | when a practice run logs gi_score_0_10 > fuel.gi_pass_max | then hold the step; when it logs ≥ fuel.gi_stepdown_min, drop one step | because tolerance, not a calendar, sets progress | evidence wg5 impl. 3, CREDIBLE; design default (step-down) | basis design_default | default? yes
RULE NUT-013 | priority T5.558 | when fuel.exit_runs measured long runs (for L3: with race-effort segments, MSP L1) reach the level's intake band with gi_score_0_10 ≤ fuel.gi_pass_max | then set FUEL level = n, confidence = measured (CMP-002) | because two rehearsals at target intake are the practice exit test | evidence wg5 impl. 3, CREDIBLE | basis design_default | default? yes
RULE NUT-014 | priority T6.559 | when the runner asks for FUEL L4 (> fuel.max_default_g_h) | then allow only if FUEL L3 is measured, the goal race is expected > fuel.l4_min_race_h, and the runner opts in after MSG-NUT-L4 ("benefit over 90 g/h unproven; stomach upset more likely") | because 120 g/h rests on one small trial measuring recovery, not race time | evidence wg5 §3, CORROBORATED (oxidation) / UNKNOWN (performance); hearing-1 §4, CORROBORATED (worst GI at 120) | basis evidence | default? no
RULE NUT-015 | priority T6.560 | when a practice run is logged | then ask which products were used (proposed field ActivityRecord.fuel_products[]) | because "nothing new on race day" is consensus practice | evidence hearing-1 §4, CORROBORATED | basis evidence | default? no
```

## 4. Race fuelling by expected duration

> **In plain words.** Short races need no food. For 1–2.5 hours, aim for 30–60 g of carbohydrate an hour; beyond 2.5 hours, up to 90 g an hour using a mix of sugars. But never more than you handled in training.

| Expected duration | Carbohydrate (`fuel.band.by_duration`) | Grade |
|---|---|---|
| < 45 min | none | CORROBORATED |
| 45–75 min | optional (mouth rinse or small amounts) | CORROBORATED (mixed in running) |
| 1–2.5 h | 30–60 g/h | CORROBORATED |
| > 2.5 h | 60–90 g/h, glucose + fructose | CORROBORATED (mostly one group) |
| > 2.5 h, FUEL L4 opt-in | > 90 g/h | tolerance CREDIBLE; benefit UNKNOWN |

Expected duration is the **slow end** of the predicted band (`predicted_band.high_s`), because a slower race needs more fuel in total and the band is wide [wg1 §7, CORROBORATED ±6–8%; ultras range only, UNKNOWN formula]. Above ~60 g/h a single sugar source saturates, so mixes are advised [hearing-1-nutr-field Q2, CORROBORATED]. Ultra runners eat 25–71 g/h in practice and also use real food [wg5 §3, CORROBORATED; hearing-1 §4, CORROBORATED].

```
RULE NUT-020 | priority T2.561 | when building the race-day fuelling plan | then target g/h = min(upper edge of fuel.band.by_duration for the expected duration, highest measured intake logged with gi_score ≤ fuel.gi_pass_max (INV-18), fuel.max_default_g_h unless NUT-014 opt-in) | because race-day intake must not exceed trained tolerance | evidence wg5 impl. 2–3, CORROBORATED/CREDIBLE; 07 INV-18 | basis evidence | default? no
RULE NUT-021 | priority T4.562 | when the highest tolerated intake is below the lower edge of the band by taper start | then keep NUT-020's capped target and show MSG-NUT-CAPPED; practice may continue on taper long runs at one step up | because running short of the band is safer than an untested gut | evidence wg5 impl. 3, CORROBORATED | basis design_default | default? yes
RULE NUT-022 | priority T6.563 | when the target exceeds fuel.dual_source_above_g_h | then advise glucose + fructose products; for ultra goals also list real food as an option | because single-transporter uptake saturates near 60 g/h; real food is standard ultra practice | evidence wg5 §3, CORROBORATED; hearing-1 §4, CORROBORATED | basis evidence | default? no
RULE NUT-023 | priority T6.564 | when the runner opts in to caffeine | then offer caffeine.default mg/kg (≤ caffeine.max) only if body_mass_kg is entered, the runner is not excluded (minor, pregnancy, nutrition_referral_flag, declared caffeine sensitivity), and it was rehearsed in ≥ 1 long run or quality session | because 3–6 mg/kg is supported; exclusions are practice | evidence wg5 §3 ISSN 2021, CORROBORATED (dose); wg5 impl. 8, CREDIBLE (exclusions) | basis evidence | default? no
```

## 5. Hydration and hyponatraemia

> **In plain words.** Drink when you are thirsty. Drinking much more than you sweat is the main cause of a dangerous drop in blood salt during long events. If you want a drinking plan, measure your sweat rate first; the plan will never ask you to drink more than you lose.

Drinking to thirst prevents over-drinking, the main cause of exercise-associated hyponatraemia (EAH) [wg5 §4 Hew-Butler 2015, CORROBORATED]. Thirst-led and planned drinking perform alike for ~1–2 h; for 50–100 km and heat the comparison is UNKNOWN [hearing-1 §4, CORROBORATED ≤ 2 h / UNKNOWN beyond]. Sodium supplements did not prevent EAH or cramps [hearing-1 §4, CORROBORATED], and sodium-per-hour numbers are contested [hearing-1 §4], so the tool prescribes no sodium dose. EAH risk factors: > 4 h, slow pace, weight gain, low body mass, drinking > ~1.5 L/h, NSAIDs, heat [wg5 §4, CORROBORATED].

**Sweat test** (`SweatTest`, proposed entity): weigh before and after a ≥ `hyd.sweat_test_min_min` run at goal effort in race-like conditions; rate = (mass before − mass after + fluid drunk) ÷ hours [wg5 §4 Baker 2017, CORROBORATED; typical 0.2–1.4 L/h]. Only the rate is stored and shown; body-mass values are discarded after calculation.

```
RULE NUT-030 | priority T6.565 | when no SweatTest exists | then the race and long-run plan says "drink to thirst" with no volume schedule | because thirst-led drinking prevents over-drinking | evidence wg5 §4, CORROBORATED | basis evidence | default? no
RULE NUT-031 | priority T2.566 | when the runner requests a drinking plan | then planned intake ≤ min(measured sweat rate, hyd.abs_cap_ml_h) with a SweatTest, or ≤ hyd.no_test_cap_ml_h without one; never a volume that implies weight gain (NUT-INV-03) | because planned intake above losses causes EAH | evidence wg5 impl. 4, CORROBORATED (no gain) / design default (caps) | basis design_default | default? yes
RULE NUT-032 | priority T2.567 | when the expected race or long-run duration > eah.warning_above_h | then show the EAH card (MSG-NUT-EAH): do not drink more than thirst asks, do not gain weight, avoid anti-inflammatory painkillers, slower finishers are more at risk; never present sodium tablets as prevention | because these are the corroborated risk factors | evidence wg5 §4, CORROBORATED; hearing-1 §4, CORROBORATED | basis evidence | default? no
RULE NUT-033 | priority T0.568 | when a runner reports confusion, severe headache, vomiting or unusual swelling during or after a long event in which they drank a lot | then route to 10's urgent red flag (generic urgent message) | because symptom-led EAH needs urgent care | evidence wg4 §4 Hew-Butler, CORROBORATED (symptom-led) / CREDIBLE (symptom list) | basis evidence | default? no
RULE NUT-034 | priority T2.577 | when a planned training long run is expected to last > eah.warning_above_h, or ≥ 180 min with conditions_hot or a hot forecast entered by the runner | then attach the drink-to-thirst card (no weight gain, carry fluid or plan water stops, sweat-test advice, generic warning signs; heat exposure starts with short easy runs, never the long run) and offer, in this order, (1) an earlier start, (2) the non-peak (0.70) length; if the runner accepts (2), log a runner shortening, show "your build moves back by {n} weeks", where n comes from the feasibility re-run (0 when the previous peak is still inside the 30-day window) and re-run feasibility through 08 (INV-04 unchanged: nothing is made up) | because EAH risk rises beyond 4 h with easy fluid access and heat adds strain; the cost of a shorter peak must be visible (d2-C R6, O1, O3) | evidence hearing-2 nutr-acad, CORROBORATED (drink to thirst needs access; > 4 h risk) / UNKNOWN (training runs); hearing-2 nutr-field, CORROBORATED (direction: heat slowdown, short runs first) | basis design_default | default? yes
```

## 6. Heat

> **In plain words.** If your race is likely to be hot, spend one to two weeks before it doing easy runs in the heat so your body adapts. On hot days, run by feel, not by pace; you will be slower, and that is expected. Follow the race organiser's heat warnings. Confusion or collapse in the heat is an emergency.

Heat acclimatisation over ~1–2 weeks is the key protective step [wg5 §4 Racinais 2015, CORROBORATED]. WBGT-based modification is guidance for organisers; exact cut-offs are UNKNOWN [wg5 §4, CORROBORATED/UNKNOWN], so the tool hard-codes no WBGT value. HEAT node (02): L1 informed, L2 acclimatised; prerequisite AER L2.

```
RULE NUT-040 | priority T4.569 | when Goal.expected_conditions = hot | then HEAT L2 becomes a required level; 06 schedules ≥ heat.acclim_days heat-exposure sessions at E0–E1 inside the heat.acclim_window_days before the race; HEAT L2 is attained when they are logged as done | because 1–2 weeks of exposure is the protective step | evidence wg5 §4, CORROBORATED | basis design_default | default? yes
RULE NUT-041 | priority T2.570 | when a session is logged or forecast as hot (ActivityRecord.conditions_hot, proposed) or the race is hot | then suppress pace targets for that session; effort governs; the race plan is effort-based with MSG-NUT-HEAT ("expect to be slower") | because pace targets in heat push effort up; effort-first is the method default | evidence wg5 impl. 5, CORROBORATED (slower goal pace); hearing-1-sys-field Q2 Runna Adapt for Heat, CORROBORATED (product practice) | basis convention | default? no
RULE NUT-042 | priority T6.571 | when a race is hot | then tell the runner to follow the organiser's heat flags and instructions; no WBGT number appears in any rule or message (NUT-INV-05) | because cut-offs are organiser guidance and UNKNOWN for individuals | evidence wg5 impl. 5, CORROBORATED | basis evidence | default? no
RULE NUT-043 | priority T0.572 | when a runner reports confusion, collapse, loss of coordination or feeling faint and very hot during or after running | then route to 10's urgent heat red flag | because CNS dysfunction with hyperthermia is a heat-stroke sign: cool first, then transport | evidence wg4 §4, CORROBORATED | basis evidence | default? no
```

## 7. REDs self-screen, train-low, caffeine

> **In plain words.** Every few months the tool asks a few short questions about periods, energy, illness, injuries and eating. If any answer suggests you may not be eating enough for your training, it suggests talking to a doctor or dietitian and stops increasing your training until you have. It never asks what you eat or how much you weigh.

Low energy availability is common in distance runners [wg5 §2, CORROBORATED]. Warning signs: absent or irregular periods, bone stress injury, unintended weight loss, persistent fatigue or underperformance, frequent illness, low libido, restrictive eating [wg5 §2, CORROBORATED]. LEAF-Q is validated in women only and screens rather than diagnoses [wg5 §2, CORROBORATED]; men need a symptom screen too [opening-contextrealist §1.5]. The screen therefore uses **fixed yes/no questions for all sexes** (sex-specific item shown only if `sex` is given), never a score, and the output is a training-suitability decision.

```
RULE NUT-050 | priority T1.573 | when onboarding completes, reds.rescreen_weeks pass since the last screen, or an off-cycle trigger fires (ADP-056 fatigue, a cleared bone-stress flag from 10, a slower result under ADP-061 without exclusion) | then present the fixed REDs self-screen (proposed REDsScreenRecord) | because warning signs change over a season; screening every 8–12 weeks is practice | evidence wg5 impl. 6, CREDIBLE (interval) / CORROBORATED (signs) | basis design_default | default? yes
RULE NUT-051 | priority T1.574 | when any REDs screen answer is yes | then hand the result to 10's SAF-009, which alone raises RiskFlag(reds_screen); show the generic professional-contact message (MSG-NUT-REDS); SAF-009 applies the freeze (no increase in weekly time, long run or quality count above the current week) until the runner attests a professional review; block train-low | because a positive screen calls for referral, and adding load to a possibly under-fuelled runner is the wrong direction | evidence wg5 impl. 6, CORROBORATED (referral) / CREDIBLE (freeze); hearing-1 §4, CORROBORATED (refer, never diagnose) | basis design_default | default? yes
RULE NUT-052 | priority T1.575 | when a REDs answer and a bone-stress or amenorrhoea answer co-occur | then also route to 10 (its bone-stress or REDs escalation rule decides pause_until_clearance) | because recurrent bone stress with energy signs is a referral case | evidence wg5 impl. 9, CORROBORATED | basis evidence | default? no
RULE NUT-053 | priority T6.576 | when the runner opts in to train-low (low-carbohydrate) sessions | then allow only if AER ≥ trainlow.min_aer_level, no reds_screen flag, not minor or pregnant, and only on easy sessions (never quality or long runs), labelled "no proven performance benefit" (NUT-INV-04) | because train-low raises signalling markers but showed no performance gain | evidence wg5 §1 Gejl & Nybo 2021, CORROBORATED (SMD 0.17, CI crosses 0); wg5 impl. 7 | basis evidence | default? no
```

Caffeine is covered by NUT-023 [wg5 §3, CORROBORATED dose].

## 8. Invariants (registered for 07's validator)

| ID | Tier | Invariant | Severity | Evidence |
|---|---|---|---|---|
| NUT-INV-01 | T2 | No user-facing text contains meal plans, calorie/energy targets, deficits, weight or race-weight targets, EA values or restrictive-diet advice (lint over the message catalogue) | build fail | wg5 impl. 9, CREDIBLE; factdesk2 §2 |
| NUT-INV-02 | T2 | No entity stores food intake, EA or body-mass history; SweatTest stores only the computed rate | build fail | wg5 §2, CORROBORATED; hearing-1 §4 |
| NUT-INV-03 | T2 | Planned drinking ≤ min(SweatTest rate, `hyd.abs_cap_ml_h`), or ≤ `hyd.no_test_cap_ml_h` without a test | repair (clamp) | wg5 impl. 4 |
| NUT-INV-04 | T2 | Train-low never on a session ≥ E3 or a long run; never with an active `reds_screen` flag, minor or pregnancy status | repair (remove) | wg5 impl. 7 |
| NUT-INV-05 | T6 | No WBGT literal in any rule, parameter or message | build fail | wg5 impl. 5 |
| NUT-INV-06 | T2 | Caffeine ≤ `caffeine.max`; never offered to excluded runners or without body mass | repair (remove) | wg5 §3, impl. 8 |
| NUT-INV-07 | T2 | With `nutrition_referral_flag`, no numeric fuelling, drinking, loading or caffeine target | repair (remove) | wg5 impl. 9 |

INV-18 (07) already enforces race fuelling ≤ trained tolerance; NUT-020 is its generation-side rule.

## 9. Messages

> **Non-normative copy (v5, p2-A R3).** `messages.md` governs every text below; where they differ, the catalogue wins and this table is a defect to be fixed at the next edit.


| ID | plain_text | why |
|---|---|---|
| MSG-NUT-REFER | "For fuelling advice that fits your health, talk to a doctor or registered dietitian. Your plan still includes long runs." | "Some conditions and medicines change what is safe to eat and drink while running." |
| MSG-NUT-L4 | "Above 90 g an hour has no proven benefit and upsets more stomachs. Only try it if 90 g has felt fine." | "Evidence above 90 g/h is thin." |
| MSG-NUT-CAPPED | "Your race plan uses the most your stomach handled in training: [x] g an hour." | "Nothing new on race day." |
| MSG-NUT-EAH | "Drink to thirst. Do not drink so much that you gain weight. Avoid anti-inflammatory painkillers during the event." | "Drinking far more than you sweat can be dangerous in long events." |
| MSG-NUT-HEAT | "It will be hot: run by feel, expect to be slower, follow the organisers' heat advice." | "Heat raises effort at any pace." |
| MSG-NUT-REDS | "Some of your answers suggest your eating may not match your training. Please talk to a doctor or registered dietitian. Your plan will not increase until you have." (`is_safety_generic = true`) | "Training more while under-fuelled can harm health and performance." |

## 10. Parameters proposed

| ID | Default | Unit | Range | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|
| cho.daily_bands | light 3–5; ~1 h 5–7; 1–3 h 6–10; ≥ 4 h 8–12 | g/kg/day | — | CORROBORATED range; CREDIBLE edges | ev | wg5 §1 | 11 |
| protein.daily_band | 1.2–2.0 | g/kg/day | — | CORROBORATED | ev | wg5 §1 | 11 |
| cho.loading_band | 10–12 for 36–48 h | g/kg/day | — | CORROBORATED (glycogen) / UNKNOWN (benefit) | ev | wg5 §1 | 11 |
| fuel.practice_min_duration_min | 60 | min | 60–75 | CORROBORATED (bands start at 1 h) | dd | wg5 §3 | 11 |
| fuel.step_runs | 2 | runs | 1–2 | CREDIBLE | conv | wg5 §5 | 11 |
| fuel.exit_runs | 2 | runs | 2–3 | CREDIBLE | conv | wg5 impl. 3 | 11 |
| fuel.gi_stepdown_min | 5 | /10 | 4–6 | UNKNOWN | dd | design | 11 |
| fuel.l4_min_race_h | 2.5 | h | — | CORROBORATED | ev | wg5 §3 | 11 |
| fuel.dual_source_above_g_h | 60 | g/h | — | CORROBORATED | ev | hearing-1-nutr-field Q2; wg5 §3 | 11 |
| hyd.abs_cap_ml_h | 1000 | mL/h | 800–1200 | CORROBORATED (> 1.5 L/h is a risk factor); value dd | dd | wg5 §4 | 11 |
| hyd.sweat_test_min_min | 60 | min | 45–90 | UNKNOWN | dd | wg5 §4 | 11 |
| heat.acclim_window_days | 21 | days | 14–28 | UNKNOWN (window); 7–14 exposure days CORROBORATED | dd | wg5 §4 | 11 |
| trainlow.min_aer_level | 3 | level | 3–4 | UNKNOWN ("advanced only" CREDIBLE) | dd | wg5 impl. 7 | 11 |

Existing entries used unchanged: `fuel.required_above_min`, `fuel.band.by_duration`, `fuel.max_default_g_h`, `fuel.start_g_h`, `fuel.step_g_h`, `fuel.gi_pass_max`, `hyd.no_test_cap_ml_h`, `eah.warning_above_h`, `heat.acclim_days`, `caffeine.default`, `caffeine.max`, `reds.rescreen_weeks`.

## 11. Conflicts with contract / other modules

1. **Data model additions:** `RunnerProfile.nutrition_referral_flag` (bool, from one fixed question), `RunnerProfile.caffeine_sensitive` (bool); `ActivityRecord.fuel_products[]`, `ActivityRecord.conditions_hot`; new entities `SweatTest {runner_id, date, duration_s, rate_ml_h, conditions}` and `REDsScreenRecord {runner_id, date, answers{q_id: bool}, trigger}`. `ScreeningRecord.instrument` is fixed to PAR-Q+, so it cannot hold the REDs screen.
2. **Red-flag ownership.** NUT-033 (hyponatraemia signs) and NUT-043 (heat illness) are routing rules at T0; 10 owns the flag and its message. If 10 defines its own trigger rules for the same symptoms, one pair must be removed to avoid duplicate firing; I propose 10 owns the trigger and NUT-033/043 become references.
3. **02 FUEL L3 prerequisite** includes MSP L1; NUT-013 asks for race-effort segments only at L3, consistent with 02. 02 HEAT L2 "≥ 7–14 days exposure" is implemented by NUT-040.
4. **INV-18 wording** says "GI ≤ 2/10"; it should reference `fuel.gi_pass_max` instead of a literal.
5. **REDs freeze vs 10.** NUT-051 freezes progression (T1) but does not pause the plan; escalation to `pause_until_clearance` is left to 10 (NUT-052). 10 must define that escalation rule.

## 9b. Heat prompts (v5, optional; p2-C case 13, factdesk6 §2)

Accepted as a low-severity gap, with two small additions for R2 (not MVP):
- **"Hot today?" tap.** Before a long run of ≥ 120 min, the session card shows one tap "Hot today? No / Yes". Yes sets `conditions_hot` for that session, so NUT-041 (no pace targets) and NUT-034 (drink-to-thirst card) apply. An unanswered tap changes nothing: heat stays runner-reported, as in v4.
- **Runners aged 65 and over.** The heat card adds: "In the heat, start shorter and easier, and build up over the first hot weeks." Older runners lose heat less well [factdesk6 §2, CORROBORATED], but fit older runners acclimatise much like younger ones, and no acclimatisation length for this age group was confirmed (UNKNOWN). This is a precautionary default, not a measured value; it never names a risk (messages lint L5).

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "NUT-001", "condition": "true", "on_unknown": "fire", "action": {"op": "constraint", "check": "lint: no nutrition text or field contains meal plans, calorie/energy targets, deficits, weight targets, EA values, intake logs or restrictive-diet advice (NUT-INV-01/02)"}, "status": "static"}
{"id": "NUT-002", "condition": "profile.nutrition_referral_flag == true", "on_unknown": "fire", "action": {"op": "suppress", "what": ["fuel_targets", "drink_targets", "loading", "caffeine"], "msg": "MSG-NUT-REFER"}}
{"id": "NUT-003", "condition": "profile.special_status == 'minor' || age_low(today) < p('minor.adult_age')", "on_unknown": "fire", "action": {"op": "suppress", "what": ["caffeine", "carb_loading", "train_low"]}}
{"id": "NUT-020", "condition": "event.type == 'build_race_fuelling'", "on_unknown": "fire", "action": {"op": "cap", "target": "plan.race_fuel_g_h", "expr": "min(fuel_band_high(goal.expected_duration_s), state.max_tolerated_g_h, p('fuel.max_default_g_h'))", "msg": "MSG-NUT-CAPPED"}}
{"id": "NUT-031", "condition": "event.type == 'drinking_plan_requested'", "on_unknown": "fire", "action": {"op": "cap", "target": "plan.drink_ml_h", "expr": "has(state.sweat_rate_ml_h) ? min(state.sweat_rate_ml_h, p('hyd.abs_cap_ml_h')) : p('hyd.no_test_cap_ml_h')"}}
{"id": "NUT-032", "condition": "goal.expected_duration_s > unit.h_s * p('eah.warning_above_h') || session.expected_duration_s > unit.h_s * p('eah.warning_above_h')", "on_unknown": "fire", "action": {"op": "emit_message", "msg": "MSG-NUT-EAH"}}
{"id": "NUT-033", "condition": "event.confusion || event.severe_headache || event.vomiting || event.unusual_swelling", "on_unknown": "hold", "action": {"op": "route", "to": "SAF-005", "msg": "MSG-SAF-003"}}
{"id": "NUT-034", "condition": "session.expected_duration_s > unit.h_s * p('eah.warning_above_h') || (session.expected_duration_s >= unit.min_s * p('lr.long_guard_min') && (session.conditions_hot || session.hot_forecast))", "on_unknown": "fire", "action": {"op": "emit_message", "msg": "MSG-NUT-EAH", "then": [{"op": "offer_options", "order": ["earlier_start", "non_peak_length"]}]}}
{"id": "NUT-041", "condition": "session.conditions_hot || session.hot_forecast || goal.expected_conditions == 'hot'", "on_unknown": "fire", "action": {"op": "suppress", "what": ["pace_targets"], "msg": "MSG-NUT-HEAT"}}
{"id": "NUT-043", "condition": "event.confusion || event.collapse || event.loss_of_coordination || (event.faint && event.very_hot)", "on_unknown": "hold", "action": {"op": "route", "to": "SAF-004", "msg": "MSG-SAF-003"}}
{"id": "NUT-050", "condition": "event.type == 'onboarding_complete' || days_between(state.last_reds_screen, today) >= unit.week_d * p('reds.rescreen_weeks') || event.off_cycle_trigger", "on_unknown": "fire", "action": {"op": "ask", "field": "event.reds_answers", "questions": "11 REDs self-screen", "msg": "MSG-NUT-REDS-Q"}}
{"id": "NUT-051", "condition": "exists(event.reds_answers, a, a == true)", "on_unknown": "fire", "action": {"op": "route", "to": "SAF-009", "msg": "MSG-NUT-REDS"}}
{"id": "NUT-052", "condition": "exists(event.reds_answers, a, a == true) && (event.bone_stress_answer || event.amenorrhoea_answer)", "on_unknown": "fire", "action": {"op": "route", "to": "SAF-012"}}
```

# 01 — Inputs and screening (v5.2; v1 author A, revised by the architect after plenary rounds 1–2)

Serves criteria 2, 7, 12. Rules INP/SCR/CTX-001…099, priorities `nnn` 050–099. Runs at 07 S0 (normalise), S1 (gate, with 10), S2 (tolerance tier, modifiers); hands symptoms to 10, `tol_tier` to 02/05.

> **In plain words.** We ask what you can answer: how much you run now, your longest recent run, your days and time, any race result. "I don't know" is allowed for everything except the health questions, your birth month and year, and any special status; we then use a cautious assumption and show it. Then come standard health questions. A guess never unlocks harder training.

## 1. Input catalogue

Every field not in `inp.no_unknown_fields` accepts "I don't know" (INP-001; post-audit wording); past facts not logged at the time are `estimated` (INP-003). Goal fields (distance, type, target time, date) belong to 03; the date or horizon sets duration (04).

### 1.1 `RunnerProfile`

| Field | Question shown | "I don't know" → | How it changes the plan |
|---|---|---|---|
| birth_month, birth_year (v5: **required**, no "I don't know") | "Month and year you were born?" | not allowed: onboarding cannot finish without it (p2-C R9) | minors (10), masters (CTX-004, SAF-060/061), age-grade; age messages never use a default age |
| sex | "Sex (optional)" | both age-grade tables (INP-032) | age-grade; 11's energy questions |
| body_mass_kg | "Body weight (optional)" | not used | per-kg amounts in 11 only; never a target |
| training_age_years | "How long have you run at least weekly?" Bands → stored value: *I have never run* → 0 (and `never_run = true`) · *less than 3 months* → 0.15 · *3–12 months* → 0.6 · *1–3 years* → 2 · *3–10 years* → 5 · *more than 10 years* → 12 (v4, p1-C R6) | "I don't know" → 0.15 (not `never_run`) | CTX-001 (< `ctx.novice_training_age_years` = 1); SAF-086 (`never_run` → start ladder); level caps (02 CMP-004) |
| other_sport_background | "Another sport you train regularly?" | none | CTX-002 |
| injury_last_12m | "In the last 12 months, did an injury stop you running for a week or more?" | yes | CTX-003; site text stored, never interpreted |
| available_days[] | "Which days can you run?" | INP-007 | INV-21 |
| max_runs_per_week | "At most, how many runs a week?" | INP-007 | INV-21; CTX-006 |
| available_minutes_per_week | "How much time a week can you give to running?" | INP-007 | INV-21; feasibility (03) |
| blocked_dates[] | "Any dates you cannot run (travel, holidays)?" | none | INV-21 |
| long_run_day | "Which day suits your longest run?" | INP-008 | placement (06) |
| run_walk_preference | "Would you like to mix running and walking?" | INP-008 | run-walk modules (06) |
| preset_preference | "Do you follow a named method?" | INP-008 | S5 preset |
| injury_last_12w (v5.3) | asked only when injury_last_12m = yes: "Was that injury in the last 12 weeks?" | yes | EXP-001 (no injury in the last `exp.injury_free_weeks`) |
| prescription_preference (v5.3) | "How do you like intervals written: by distance (10 × 600 m), by time (10 × 2 min), or both?" (settings; default distance) | distance | SES-031; time only when the plan has no paces |
| hard_sessions_max (v5.3) | "Hard sessions per week, at most: 3 (recommended), 2 or 1" (onboarding and settings) | 3 | ceiling of SES-006 (owner decision 4) |
| level_tests_opt_out (v5.2) | "Would you rather skip level tests? Your training will show when you are ready." (settings, default no) | no | SES-012 plans no test; SES-025 credits levels from training |
| night_shift_dates[] (v4: a dated roster, any day of the week, editable weeks ahead) | "Do you work night shifts? Enter your roster." | none | CTX-005; the feasibility dry run excludes post-shift dates for long and key sessions (FEA-031, p1-B R9) |

### 1.2 `OnboardingClaim` (all `estimated`)

| Field | Question shown | "I don't know" → | How it changes the plan |
|---|---|---|---|
| claimed_runs_per_week | "In the last 4 weeks, how many runs a week?" | 0 | CTX-001, ACSM [society] "active" (SCR-006) |
| claimed_weekly_distance_m / _time_s | "In a normal week, how far / how long?" | no claim | L30_eff ceiling (GEN-011); band (03) |
| claimed_L30_distance_m / _duration_s | "Your longest single run in the last 30 days?" | no claim → L30 undefined (GEN-012) | L30_eff (GEN-011) → every spike cap |
| last_run_date | "When did you last run?" Bands → stored days_since_last_run: *this week* → 3 · *1–2 weeks ago* → 11 · *2–4 weeks ago* → 22 · *1–3 months ago* → 60 · *3–12 months ago* → 180 · *more than a year* → 400 · *never* → `never_run = true` (bands align with `gap.reduce_trigger_days` 8, `gap.rtr_trigger_days` 30, `rtr.long_gap_days` 90; v4, p1-C R6) | INP-004 (→ ≥ 30) | gap bands, return ladder (GEN-012/013, 10 §4) |
| *claimed_continuous_30min* (proposed) | "Can you run 30 minutes non-stop?" | no | run-walk default; HAB level |

### 1.3 `PerformanceAnchor` and `HRReference`

| Field | Question shown | "I don't know" → | How it changes the plan |
|---|---|---|---|
| anchor | "A race or timed run in the last 4 months? Distance, time, date." | none → effort-only; field test ends ONBOARD (04) | paces only if `measured` and fresh (INV-15); band (03); `perf_level` |
| HRReference | "Your maximum heart rate **from a hard test or race** (not a formula or watch estimate)?" | none → effort only | optional HR ranges (INP-006, INV-09) |

Symptoms, pregnancy and postpartum are asked by 10 in S1.

```
RULE INP-001 | priority T2.050 | when an input is blank or answered "I don't know" and the field is not in inp.no_unknown_fields (PAR-Q+ items and follow-ups, symptom items C/B/H/E/P/I, special status, birth month and year, guardian attestation) | then set the §1 default, confidence = unknown, shown as an editable assumption; fields in inp.no_unknown_fields offer no "I don't know" and block progress until answered | because beginners must be able to answer, a gap must never unlock load, and a safety answer must never be guessed (p2-C R1: "not sure" on a chest-pain item gave an easy plan in v4) | evidence opening-outsider §1.1; opening-contrarian §1.4; p2-C case 1, UNKNOWN (design default) | basis design_default | default? yes
RULE INP-002 | priority T1.051 | when an age is needed at date d | then compute age from birth_month and birth_year: age_low = age on d assuming the birthday is on the last day of the birth month; age_high = age assuming the first day; minors' rules read age_low, masters' rules read age_high | because a year alone leaves up to a year of doubt (a real 18-year-old was treated as 17 until 1 January); the cautious end within one month is acceptable (p2-C R9) | evidence wg4 §3, §6, CORROBORATED (age gates) | basis design_default | default? yes
RULE INP-003 | priority T2.052 | when a value comes from OnboardingClaim, a recalled result or a backfilled entry | then confidence = estimated, whatever certainty the runner states | because recall is unverified | evidence factdesk2 §6, CREDIBLE / UNKNOWN; opening-contrarian §1.4 | basis design_default | default? yes
RULE INP-004 | priority T2.053 | when last_run_date is unknown | then set days_since_last_run ≥ gap.rtr_trigger_days | because how the spike cohort handled gaps is undocumented | evidence factdesk2 §1, UNKNOWN | basis design_default | default? yes
RULE INP-005 | priority T2.054 | when a PerformanceAnchor is saved | then confidence = measured only if kind ∈ {race, field_test, cs_test}, distance and time are given and entered_at ≤ date + log.contemporaneous_window_h; v5.3: else declared if kind = race, effort_all_out = true and the runner confirmed it as an official result (official_result_confirmed = true; owner decision 2); else estimated. A declared anchor sets paces only on the experienced path (02 EXP-001), with the slow edge widened by exp.declared_pace_widen_pct (03 §3b), until a measured race or test replaces it; for prediction (03 §3) it counts as estimated; age_grade_pct from WMA 2023 tables | because only contemporaneous race or test results may set paces | evidence factdesk1 §3, CORROBORATED; wg3 §1, CORROBORATED (WMA); factdesk2 §6, UNKNOWN (recalled times) | basis design_default | default? yes
RULE INP-006 | priority T2.055 | when a heart-rate value comes from an age formula, a device estimate or memory without a dated test | then do not store it; HRReference accepts only hrmax_measured or lthr_measured with date and method | because age formulas err by about ±10–12 bpm | evidence wg1 §4, CORROBORATED; factdesk2 §6, CREDIBLE | basis evidence | default? no
RULE INP-007 | priority T3.056 | when available_days, max_runs_per_week or available_minutes_per_week is unknown | then use inp.default_days, min(count(available_days), inp.default_runs), max_runs_per_week × inp.default_session_min | because T3 limits must exist; no evidence sets them | evidence criteria C2; wg3 §6, UNKNOWN | basis design_default | default? yes
RULE INP-008 | priority T6.057 | when long_run_day, run_walk_preference or preset_preference is unknown | then long_run_day = latest available weekday; run_walk = true unless claimed_continuous_30min = true; preset = method_default | because run-walk is first-class; fixed choices keep output deterministic | evidence wg2 §1, CORROBORATED (Galloway ratios); opening-systemsarchitect R1 | basis design_default | default? yes
```

## 2. Manual log (owner decision: manual entry only)

> **In plain words.** After each run, tap "done", check the time (and distance if you know it) and rate how hard it felt, 0 to 10. Entries made within two days count fully; later ones count as estimates. Unusual numbers are checked with you and never raise your limits until confirmed.

**Tick flow.** Each planned session offers **Done as planned** · **Done, different** · **Not done**. "Done, different" asks duration (required), distance (optional; not for run-walk or time-only sessions), RPE 0–10 with words at anchors (0 rest, 2 easy, 4 steady, 6 hard, 8 very hard, 10 maximal), and under "Anything else?" pain 0–10 and stomach comfort 0–10 (fuelled sessions, for 11). **Add a run** logs unplanned runs (`manual_add`). A "Something felt wrong" link is always visible.

An unlogged planned session is "not logged", never "rest" or "missed" (08 decides).

**Plausibility prompts** (wording for 07 GEN-020…022; flagged values stay out of every cap until resolved, INV-14; shared `why`: "A typo here could change your limits."):

| Trigger | Message `plain_text` |
|---|---|
| pace outside `log.pace_min/max_s_per_km` (GEN-020) | "This works out at {pace} per km. Is the distance or the time right?" [Correct] [Edit] |
| distance > `log.confirm_ratio` × L30_eff | "This run is much longer than anything you logged in the last 30 days. Is it right?" |
| week > `log.week_confirm_ratio` × max of previous 4 weeks | "This week's total is much higher than recent weeks. Please check your entries." |
| claimed L30 > claimed weekly distance with ≥ 2 runs (GEN-022) | "Your longest run ({L30}) is longer than your usual week ({week}). Which is right?" (unanswered → lower value) |
| claimed age-grade ≥ `claim.agegrade_confirm_pct` | "That time would be a national-class result for your age. Is it correct?" |

A confirmed flag counts as `estimated` (GEN-021).

```
RULE INP-020 | priority T2.058 | when an ActivityRecord is saved | then confidence = measured if source ∈ {tick, manual_add}, entered_at ≤ end of date + log.contemporaneous_window_h and plausibility = ok; estimated if later (source = backfill) or plausibility = confirmed; unknown for blank fields | because with manual entry "measured" means "logged at the time" | evidence 00 §3 owner decision; factdesk2 §6, CREDIBLE | basis design_default | default? yes
RULE INP-021 | priority T2.059 | when more than log.bulk_backfill_max past-dated entries are created on one calendar day | then all of them get confidence = estimated | because bulk entry is recall, not logging | evidence 07 §3; opening-contrarian §1.4, UNKNOWN (design default) | basis design_default | default? yes
RULE INP-022 | priority T2.060 | when a session is ticked "done as planned" | then copy planned duration and distance into the record, ask one-tap "Any pain? No / Yes" (Yes → 0–10 → INP-023) and RPE (skip → unknown); after a long run or a session ≥ E3, send a next-morning prompt "Any pain this morning? No / Yes"; an unanswered prompt is unknown, never "no pain"; source = tick | because one-tap logging keeps the log alive, but the pain model must see every session; prompt compliance is about 75%, so missing answers must stay unknown (p2-C R3) | evidence opening-contrarian §2; wg3 §5, CORROBORATED; factdesk1 §2, CORROBORATED (next-morning rule); factdesk6 §3, CORROBORATED (EMA compliance 75%) | basis design_default | default? yes
RULE INP-023 | priority T0.061 | when pain_0_10 > 0 is entered or "Something felt wrong" is tapped | then show the symptom questions of 10 §1 before saving; any yes is handled by 10 | because red flags must be caught when logging | evidence wg4 §4, CORROBORATED; factdesk1 §2 | basis evidence | default? no
RULE INP-024 | priority T2.062 | when a flagged entry is neither confirmed nor corrected | then keep it excluded, re-ask once, never auto-confirm | because silence is not confirmation | evidence opening-contrarian §1.4, UNKNOWN (design default) | basis design_default | default? yes
RULE INP-025 | priority T2.063 | when a PerformanceAnchor implies a 10K-equivalent faster than the previous measured anchor or the claimed band by more than 2 × pace.deadband_pct | then ask the runner to confirm the result; it stays confidence = estimated (no paces from it) until a field test (06 SES-M-019/020) agrees within pace.deadband_pct | because a mistyped or flattering result would otherwise set paces too fast; recalled race times are biased towards flattering values (p2-C R6) | evidence factdesk4 §6, CREDIBLE (retest CV 2.4–3.4%, Machado 2015, single study); factdesk5 §1, ALLEGED (flattering recall) | basis design_default | default? yes
```

## 3. Screening gate (S1)

> **In plain words.** You answer a standard health questionnaire (the PAR-Q+), shown exactly as published. All "no": you start. Otherwise you either run easy only until a health professional says hard running is fine, or the plan waits until you have spoken to one. We never say what an answer might mean medically.

**Order.** (1) age and guardian (10 §3); (2) pregnancy / postpartum (10 §3); (3) PAR-Q+ 2023 with its follow-up pages, unchanged; (4) ACSM 2015 three factors: current activity, known cardiovascular/metabolic/renal disease or symptoms, intended intensity [wg4 §3, CORROBORATED]; (5) current symptoms (10 §1). Most restrictive outcome wins (07 §1).

**Intended intensity (v4, p1-C R5).** S1 always treats the intended intensity as **vigorous**, except for start-ladder, return-to-run and base-plan entries, which are moderate. This removes the circular dependence on the S7 plan.

**Mapping.** `ScreeningItemMap {item_id → factor ∈ {symptom, known_disease, musculoskeletal, other}}` is filled from the licensed text and signed off in clinical review (14). `active` = claimed_runs_per_week ≥ `screen.active_runs_min` (design default). Intensity is vigorous if the plan would hold any session ≥ E3.

```
RULE SCR-001 | priority T1.064 | when no complete ScreeningRecord exists (any PAR-Q+ item or required follow-up unanswered), or today > valid_until | then outcome = no_plan with MSG-SCR-001 | because an incomplete screen is no screen (p2-C R1) | evidence wg4 §3, CORROBORATED | basis evidence | default? no
RULE SCR-002 | priority T1.065 | when the screen is rendered | then show the stored PAR-Q+ 2023 text, order and answer options unchanged; answers are stored as booleans only; no score is computed or shown | because a fixed published questionnaire keeps the tool a wellness product | evidence factdesk2 §2 (a)(c), CORROBORATED (boundary) / UNKNOWN (device status → legal review) | basis evidence | default? no
RULE SCR-003 | priority T1.066 | when every answer is no and no current symptom is reported | then outcome = proceed | because asymptomatic people need little medical evaluation (about 1% referred) | evidence wg4 §3, CORROBORATED | basis evidence | default? no
RULE SCR-004 | priority T1.067 | when any answered item maps to symptom, or the instrument's follow-up directs the person to further evaluation | then outcome = pause_until_clearance; emit MSG-SAF-001 | because symptoms of disease are a stop-and-refer factor | evidence wg4 §3, impl. 1, CORROBORATED | basis evidence | default? no
RULE SCR-005 | priority T1.068 | when the screen is complete, at least one answer is yes, and state.scr_symptom = false and state.scr_disease_inactive = false | then outcome = proceed_restricted until clearance is attested (INV-06) | because vigorous training waits on clearance when the screen is not clean; an unknown can never satisfy this rule because incomplete screens stop at SCR-001 (p2-C R1) | evidence wg4 impl. 1, CORROBORATED | basis evidence | default? no
RULE SCR-006 | priority T1.069 | when an item maps to known_disease and active = false | then outcome = pause_until_clearance | because ACSM 2015 weighs activity with known disease; the inactive branch is taken cautiously | evidence wg4 §3, CORROBORATED (factors) / design default (branch, screen.active_runs_min) | basis design_default | default? yes
RULE SCR-007 | priority T1.070 | when a clearance attestation (MSG-SAF-011) is dated ≥ outcome date + flag.clearance_min_delay_days | then outcome = proceed and set clearance_attested_on | because a same-day attestation is not a consultation | evidence opening-contrarian §1.3, UNKNOWN (design default) | basis design_default | default? yes
RULE SCR-008 | priority T1.071 | when valid_until is reached, or "Has your health changed since your last check?" (asked at each new goal, after illness, pain or red-flag events, and every screen.health_check_weeks) is answered yes, or a SpecialStatus changes, or age_high reaches masters.vigorous_assessment_age, or a cardiac flag clears | then require a new ScreeningRecord before the next session | because the screen expires and health changes | evidence wg4 §3, CORROBORATED (validity); triggers dd | basis design_default | default? yes
```

## 4. Two axes: performance level and tolerance tier

> **In plain words.** Speed and what your body is used to are different. Your race result sets paces; your recent running sets how much and how far. A fast runner back from a break still starts short.

- **`perf_level`** = WMA 2023 age-grade band of the best anchor: < 60 % developing · 60 local · 70 regional · 80 national · ≥ 90 world class [wg3 §1, CORROBORATED], with the anchor's confidence; no anchor → `unknown`.
- **Competitive band** (used by LOD-032 for the polarized opt-in): `perf_level` ≥ `perf.competitive_min_pct` (default 70, "regional") with a measured anchor; design default, since the polarized benefit appears mainly in highly trained athletes [wg1 §2, CORROBORATED].
- **`tol_tier`** = TOL level 0–5 (02 §2) on `DerivedState`, which already applies confidence and the L30_eff chain (07 §3).

| Example | perf_level | tol_tier | Result |
|---|---|---|---|
| Ex-club runner, 19:30 5K three years ago (recalled), runs twice a week | regional (estimated, too old for paces) | 1 | effort-only; volume from tier 1; slow profile |
| Novice, no result, run-walks 3 × 25 min logged | unknown | 1 | effort-only ONBOARD, field test sets the anchor |
| Logged 45 km/week, measured 10K last month | local (measured) | 3 | paces from the 10K; standard profile once probation ends |

```
RULE INP-030 | priority T2.073 | when tol_tier is computed | then tol_tier = highest TOL level whose 02 §2 thresholds hold on DerivedState.V28_time_s and L30_eff_time_s; a level resting only on estimated data is capped at cmp.self_report_level_cap[TOL]; L30_source = undefined_rtr → tol_tier = 0 | because volume follows tissue tolerance | evidence wg3 impl. 1, CORROBORATED (age-grade) / design choice (tolerance axis); opening-contextrealist §1 | basis design_default | default? yes
RULE INP-031 | priority T2.074 | when any volume, long-run, progression-profile or level-unlock value is set | then it never reads perf_level; paces never read tol_tier | because performance and tolerance diverge in returners and other-sport athletes | evidence opening-contextrealist §1; wg3 §2 other-sport, CREDIBLE | basis design_default | default? yes
RULE INP-032 | priority T6.075 | when sex is unknown | then compute age_grade_pct with both WMA tables; plausibility checks (GEN-022) use the higher value, the displayed perf_level the lower | because each use takes its cautious end | evidence wg3 §1, CORROBORATED (tables are sex-specific) | basis design_default | default? yes
```

## 5. Context modifiers

> **In plain words.** Being new, coming from cycling or swimming, a recent injury, being 50+, few runs a week, night shifts or few logged runs each call for a gentler build-up. We tell you why; the most cautious setting wins.

Each rule writes `ContextModifier` records (12 §2): numbers combine by MIN, profiles by "slow wins" (07 §1), one ledger entry each. **Envelope** tags (population the evidence comes from): CTX-001 adult novices · CTX-002 triathletes/cyclists · CTX-003 adult recreational · CTX-004 masters · CTX-005 none · CTX-006 untrained cyclists · CTX-007 none. Outside the envelope, CTX-008 adds an explanation.

```
RULE CTX-001 | priority T1.080 | when training_age_years < ctx.novice_training_age_years or claimed_runs_per_week = 0 | then progression_profile = slow; deload.every = min(deload.every, deload.every_ctx) | because inexperience predicts injury | evidence wg3 §2 NLstart2run, CORROBORATED; wg4 §2, impl. 5, CORROBORATED; wg1 impl. 11, ALLEGED (cadence) | basis design_default | default? yes
RULE CTX-002 | priority T1.081 | when other_sport_background ∈ {cycling, swimming, triathlon} and training_age_years < ctx.novice_training_age_years | then apply CTX-001's operations; intensity levels still come only from log or exit tests | because fitness outruns tissue tolerance | evidence wg3 §2, CREDIBLE (ITU review; 75-athlete stiffness study) | basis design_default | default? yes
RULE CTX-003 | priority T1.082 | when injury_last_12m = true | then apply CTX-001's operations | because prior injury is the strongest risk factor | evidence hearing-1 §3, CORROBORATED; wg3 §5, CREDIBLE (Couch-to-5K study, Relph 2023, single study; OR imprecise) | basis design_default | default? yes
RULE CTX-004 | priority T1.083 | when age_high ≥ ctx.masters_age | then deload.every = min(deload.every, deload.every_ctx); require ≥ 1 strength (ECO) module per week when available days allow | because strength helps masters' economy; extra recovery is convention | evidence wg3 §2 masters, CREDIBLE; hearing-1 §3, ALLEGED (recovery) | basis design_default | default? yes
RULE CTX-005 | priority T1.084 | when a session date is the day after a dated night shift (night_shift_dates) or the runner taps "I worked a night shift" | then no session ≥ E3 and no long run on that date (REP-004, then REP-003); the feasibility dry run applies the same exclusion, so a roster that leaves no long-run day returns AVAILABILITY_DAYS naming the shifts at onboarding, not mid-plan | because sleep loss impairs endurance, and a roster known in advance must be planned around (p1-B R9) | evidence wg3 §6, CORROBORATED (sleep) / ALLEGED (shift rule); opening-contextrealist §2 | basis design_default | default? yes
RULE CTX-006 | priority T1.085 | when max_runs_per_week < ctx.lowfreq_runs | then quality.per_week = min(quality.per_week, ctx.lowfreq_quality_max); reason LOW_FREQ to 03 | because low frequency raises non-response | evidence wg3 §2 Montero & Lundby, CORROBORATED (cycling, untrained) | basis design_default | default? yes
RULE CTX-007 | priority T1.086 | when log_status ≠ rich and the runner is not on the experienced path (02 EXP-001, v5.3: its calibration weeks check the history instead) | then progression_profile = slow (as GEN-014) and show MSG-CTX-007 | because unverified history must not unlock fast progression | evidence opening-contrarian §1.4; wg4 impl. 5, CORROBORATED | basis design_default | default? yes
RULE CTX-008 | priority T1.087 | when the runner's tags (minor, masters, female, ultra goal, novice) fall outside the envelope of a modifier or limit applied | then attach MSG-CTX-008 to that rule's explanation; the conservative value stays | because cohorts are ~80% male adults | evidence opening-contextrealist §2; hearing-1 §3, CORROBORATED | basis evidence | default? no
```

Key messages: MSG-CTX-001 "You're new to running, so we build up gently and add an easier week every 3 weeks." · MSG-CTX-002 "Your heart and lungs may be fitter than your legs are used to; we build running distance slowly." · MSG-CTX-005 "After a night shift, today's run is easy." · MSG-CTX-007 "Based partly on your estimates — log your runs to sharpen it." · MSG-CTX-008 "Most research behind this limit studied other groups of runners, so we use a cautious setting." · MSG-SCR-001 "Please answer the health questions first."

## 6. Test cases (for 14)

Seeds for `T-<ID>-fires` / `-silent`: INP-001 blank L30 / answered · INP-002 born 2009, race 2026 / adult · INP-004 last run unknown / this week · INP-006 "220 − age" / tested HRmax · INP-020 entered 72 h late / 2 h · INP-023 pain 4 / 0 · INP-030 claims only → TOL ≤ 2 / rich log · SCR-004 symptom item / musculoskeletal item · SCR-006 disease, 0 runs / disease, active · SCR-007 attested next day / same day · CTX-008 16-year-old / 35-year-old man; other rules: trigger present / absent.

## 7. Parameters proposed

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| inp.default_days | Tue, Thu, Sat | weekdays | — | — | — | dd | INP-007 | 01 |
| inp.default_runs | 3 | runs/week | 2–4 | — | UNKNOWN | dd | wg3 §6 | 01 |
| inp.default_session_min | 30 | min | 20–45 | — | UNKNOWN | dd | INP-007 | 01 |
| screen.active_runs_min | 3 | sessions/week | 2–3 | — | CORROBORATED (factor) / threshold dd | dd | wg4 §3 | 01 |
| screen.health_check_weeks | 12 | weeks | 8–26 | — | — | dd | SCR-008 | 01 |
| perf.agegrade_bands | 60 / 70 / 80 / 90 | WMA % | — | — | CORROBORATED | conv | wg3 §1 | 01 |
| ctx.novice_training_age_years | 1 | years | 0.25–1 | — | CREDIBLE (readiness criteria 3 months–1 year) | dd | wg3 §4 | 01 |
| ctx.masters_age | 50 | years | 45–55 | — | CREDIBLE (decline from ~50) | conv | wg3 §2 | 01 |
| ctx.lowfreq_runs | 3 | runs/week | 2–3 | — | CORROBORATED (cycling) | dd | wg3 §2 | 01 |
| ctx.lowfreq_quality_max | 1 | sessions/week | 0–1 | first: 3 (labelled alternative) | ALLEGED | dd | wg1 impl. 2 | 01 |
| deload.every_ctx | 3 | weeks | 2–4 | — | ALLEGED | conv | wg1 impl. 11 | 01/05 |

## 8. Conflicts with contract and other modules

1. **New fields for 12:** `RunnerProfile.night_shift_days[]`, `OnboardingClaim.claimed_continuous_30min`, derived `age_low`/`age_high`, table `ScreeningItemMap`, `ScreeningRecord.followup_answers{}`.
2. **`ContextModifier` has one `parameter_id`**; a CTX rule sets several. Proposal: records `CTX-001/a`, `/b` share the rule ID.
3. **PHS-005 (04)** lists "high life stress"; no input or research file supports it, so I did not add it. 04 should drop it.
4. **PAR-Q+ licence and item mapping** need legal and clinical sign-off (factdesk2 §2, UNKNOWN): release blocker.
5. **INP-023 is T0** (routes red flags) with `nnn` 061 from 01's block.

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "CTX-001", "condition": "profile.training_age_years < p('ctx.novice_training_age_years') || claim.runs_per_week == 0", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "then": [{"op": "cap", "target": "override.deload.every", "expr": "p('deload.every_ctx')"}, {"op": "emit_message", "msg": "MSG-CTX-001"}]}}
{"id": "CTX-002", "condition": "profile.other_sport_background in ['cycling', 'swimming', 'triathlon'] && profile.training_age_years < p('ctx.novice_training_age_years')", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "then": [{"op": "cap", "target": "override.deload.every", "expr": "p('deload.every_ctx')"}, {"op": "emit_message", "msg": "MSG-CTX-002"}]}}
{"id": "CTX-003", "condition": "profile.injury_last_12m == true", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "then": [{"op": "cap", "target": "override.deload.every", "expr": "p('deload.every_ctx')"}, {"op": "emit_message", "msg": "MSG-CTX-003"}]}}
{"id": "CTX-004", "condition": "age_high(today) >= p('ctx.masters_age')", "on_unknown": "fire", "action": {"op": "cap", "target": "override.deload.every", "expr": "p('deload.every_ctx')", "then": [{"op": "floor", "target": "week.eco_sessions_min", "expr": "1"}, {"op": "emit_message", "msg": "MSG-CTX-004"}]}}
{"id": "CTX-005", "condition": "date_add(session.date, -1) in profile.night_shift_dates || event.type == 'night_shift_tap'", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.date == session.date && (effort_rank(s.effort_target) >= effort_rank('E3') || s.is_long_run)", "until": "date_add(session.date, 1)", "msg": "MSG-CTX-005"}}
{"id": "CTX-006", "condition": "profile.max_runs_per_week < p('ctx.lowfreq_runs')", "on_unknown": "fire", "action": {"op": "cap", "target": "override.quality.per_week", "expr": "p('ctx.lowfreq_quality_max')", "then": [{"op": "add_reason", "code": "LOW_FREQ"}, {"op": "emit_message", "msg": "MSG-CTX-006"}]}}
{"id": "CTX-007", "condition": "state.log_status != 'rich' && !(state.exp_path in ['calibrating', 'confirmed'])", "on_unknown": "fire", "action": {"op": "set", "target": "state.progression_profile", "expr": "'slow'", "then": [{"op": "emit_message", "msg": "MSG-CTX-007"}]}}
{"id": "CTX-008", "condition": "exists(state.runner_tags, t, !(t in rule_ctx.envelope))", "on_unknown": "fire", "action": {"op": "emit_message", "msg": "MSG-CTX-008", "attach_to": "rule_ctx.explanation"}}
{"id": "INP-001", "condition": "!has(input.value) && !(input.field in p('inp.no_unknown_fields'))", "on_unknown": "skip", "action": {"op": "set", "target": "input.value", "expr": "input.default", "then": [{"op": "set", "target": "input.confidence", "expr": "'unknown'"}, {"op": "emit_message", "msg": "MSG-INP-ASSUMED"}]}}
{"id": "INP-002", "condition": "has(profile.birth_month) && has(profile.birth_year)", "on_unknown": "ask", "action": {"op": "set", "target": "state.age_low", "expr": "age_low(today)", "then": [{"op": "set", "target": "state.age_high", "expr": "age_high(today)"}], "msg": "MSG-INP-AGE"}}
{"id": "INP-003", "condition": "input.source in ['onboarding_claim', 'recall', 'backfill']", "on_unknown": "fire", "action": {"op": "set", "target": "input.confidence", "expr": "'estimated'"}}
{"id": "INP-004", "condition": "!has(claim.last_run_date)", "on_unknown": "fire", "action": {"op": "floor", "target": "state.days_since_last_run", "expr": "p('gap.rtr_trigger_days')"}}
{"id": "INP-005", "condition": "event.type == 'anchor_saved'", "on_unknown": "skip", "action": {"op": "set", "target": "anchor.confidence", "expr": "(anchor.kind in ['race', 'field_test', 'cs_test'] && has(anchor.distance_m) && has(anchor.time_s) && hours_between(anchor.date, anchor.entered_at) <= p('log.contemporaneous_window_h')) ? 'measured' : ((anchor.kind == 'race' && has(anchor.distance_m) && has(anchor.time_s) && anchor.effort_all_out == true && anchor.official_result_confirmed == true) ? 'declared' : 'estimated')"}}
{"id": "INP-006", "condition": "input.field in ['hrmax', 'lthr'] && !(input.source in ['hrmax_measured', 'lthr_measured'] && has(input.test_date))", "on_unknown": "fire", "action": {"op": "reject_input", "target": "input", "msg": "MSG-INP-HR"}}
{"id": "INP-007", "condition": "!has(profile.available_days) || !has(profile.max_runs_per_week) || !has(profile.available_minutes_per_week)", "on_unknown": "fire", "action": {"op": "set", "target": "profile.availability_defaults", "expr": "{'available_days': p('inp.default_days'), 'max_runs_per_week': min(size(p('inp.default_days')), p('inp.default_runs')), 'available_minutes_per_week': p('inp.default_runs') * p('inp.default_session_min')}", "then": [{"op": "set", "target": "input.confidence", "expr": "'unknown'"}]}}
{"id": "INP-020", "condition": "event.type == 'activity_saved'", "on_unknown": "skip", "action": {"op": "set", "target": "entry.confidence", "expr": "(entry.source in ['tick', 'manual_add'] && hours_between(entry.date_end, entry.entered_at) <= p('log.contemporaneous_window_h') && entry.plausibility == 'ok') ? 'measured' : 'estimated'"}}
{"id": "INP-021", "condition": "count(log.entries_created_today, e, e.date < today) > p('log.bulk_backfill_max')", "on_unknown": "fire", "action": {"op": "set", "target": "log.entries_created_today[].confidence", "expr": "'estimated'"}}
{"id": "INP-022", "condition": "event.type == 'tick_done_as_planned'", "on_unknown": "skip", "action": {"op": "set", "target": "entry.duration_s", "expr": "session.planned_duration_s", "then": [{"op": "set", "target": "entry.distance_m", "expr": "session.planned_distance_m"}, {"op": "ask", "field": "entry.pain_any", "msg": "MSG-INP-PAIN-TAP"}, {"op": "ask", "field": "entry.rpe_0_10", "msg": "MSG-INP-RPE"}, {"op": "schedule_prompt", "field": "entry.pain_next_morning", "when": "session.is_long_run || effort_rank(session.effort_target) >= effort_rank('E3')", "msg": "MSG-INP-PAIN-MORNING"}]}}
{"id": "INP-023", "condition": "(has(entry.pain_0_10) && entry.pain_0_10 > 0) || entry.pain_any == true || event.type == 'something_felt_wrong'", "on_unknown": "fire", "action": {"op": "ask", "field": "event.symptom_answers", "questions": "10 §1 C1-C4, B1-B5, H1-H2, E1, P1-P2, I1-I3", "msg": "MSG-SAF-QUESTIONS"}}
{"id": "INP-024", "condition": "entry.plausibility == 'flagged' && !has(entry.resolution)", "on_unknown": "fire", "action": {"op": "flag_entry", "target": "entry", "exclude_from": ["L30_eff", "V28", "level_attainment"], "then": [{"op": "ask_confirm", "field": "entry", "max_asks": 1}]}}
{"id": "INP-025", "condition": "has(state.prev_anchor_10k_s) && anchor.equiv_10k_s < state.prev_anchor_10k_s * (1 - p('anchor.jump_confirm_mult') * p('pace.deadband_pct') / unit.pct)", "on_unknown": "fire", "action": {"op": "set", "target": "anchor.confidence", "expr": "'estimated'", "then": [{"op": "ask_confirm", "field": "anchor", "max_asks": 1, "msg": "MSG-INP-ANCHOR-CONFIRM"}, {"op": "schedule_session", "module_expr": "'SES-M-020'"}]}}
{"id": "INP-030", "condition": "event.type == 'compute_tol'", "on_unknown": "fire", "action": {"op": "set", "target": "state.tol_tier", "expr": "state.L30_source == 'undefined_rtr' ? 0 : (state.tol_rests_on_estimated ? min(highest_tol_level(state.V28_time_s, state.L30_eff_time_s), p('cmp.self_report_level_cap')['TOL']) : highest_tol_level(state.V28_time_s, state.L30_eff_time_s))"}}
{"id": "INP-031", "condition": "true", "on_unknown": "fire", "action": {"op": "constraint", "check": "dataflow lint: no volume, long-run, progression-profile or level-unlock value reads state.perf_level; no pace reads state.tol_tier"}, "status": "static"}
{"id": "SCR-001", "condition": "!screen.complete || today > screen.valid_until", "on_unknown": "fire", "action": {"op": "gate", "outcome": "no_plan", "msg": "MSG-SCR-001"}}
{"id": "SCR-002", "condition": "event.type == 'render_screen'", "on_unknown": "fire", "action": {"op": "render_fixed", "target": "screen.instrument", "expr": "p('screen.instrument')"}, "status": "static"}
{"id": "SCR-003", "condition": "screen.complete && all(screen.items, q, screen.answers[q] == false) && !state.current_symptom", "on_unknown": "skip", "action": {"op": "gate", "outcome": "proceed"}}
{"id": "SCR-004", "condition": "state.scr_symptom", "on_unknown": "fire", "action": {"op": "gate", "outcome": "pause_until_clearance", "msg": "MSG-SAF-001"}}
{"id": "SCR-005", "condition": "screen.complete && exists(screen.items, q, screen.answers[q] == true) && !state.scr_symptom && !state.scr_disease_inactive", "on_unknown": "fire", "action": {"op": "gate", "outcome": "proceed_restricted", "until": "has(screen.clearance_attested_on)", "effort_max": "'E2'"}}
{"id": "SCR-006", "condition": "state.scr_disease_inactive", "on_unknown": "fire", "action": {"op": "gate", "outcome": "pause_until_clearance", "msg": "MSG-SAF-001"}}
{"id": "SCR-007", "condition": "has(screen.clearance_attested_on) && screen.clearance_attested_on >= date_add(screen.completed_on, p('flag.clearance_min_delay_days'))", "on_unknown": "skip", "action": {"op": "gate", "outcome": "proceed"}}
{"id": "SCR-008", "condition": "today >= screen.valid_until || event.health_changed == true || event.special_status_changed == true || (age_high(today) >= p('masters.vigorous_assessment_age') && !screen.masters_checked) || event.type == 'cardiac_flag_cleared'", "on_unknown": "fire", "action": {"op": "require_rescreen", "before": "next_session"}}
{"id": "INP-008", "condition": "!has(profile.long_run_day) || !has(profile.run_walk_preference) || !has(profile.preset_preference)", "on_unknown": "skip", "action": {"op": "set", "target": "profile.long_run_day", "expr": "has(profile.long_run_day) ? profile.long_run_day : last(profile.available_days)", "then": [{"op": "set", "target": "profile.run_walk_preference", "expr": "has(profile.run_walk_preference) ? profile.run_walk_preference : !claim.continuous_30min"}, {"op": "set", "target": "profile.preset_preference", "expr": "has(profile.preset_preference) ? profile.preset_preference : 'method_default'"}]}}
```

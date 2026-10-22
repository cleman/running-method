# 10 — Safety and red flags (v5.2; v1 author A, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria 7 (red flags, stop/refer) and 12 (plain language). Rules SAF-001…199, priorities `nnn` 500–549. T0/T1 rules run in 07 S1 and on every 08 event; 07 enforces INV-05, -06, -07, -24. Internal kinds are clinical; user text never is (00 §6).

> **In plain words.** Some signs mean "stop running and get checked": chest pain, fainting, bone pain that gets worse, confusion in the heat, and others below. Your plan then pauses until you confirm, on a later day, that you have been cleared. We never tell you what you might have. You restart with short run-walk sessions.

## 0. Risk picture (post-audit, audit-final fix 11)

> **In plain words.** Most running harm is overuse injury: common, rarely serious. Bone stress injuries are less common but keep people out for months. Heat illness, over-drinking in long events and heart events during races are rare but can be fatal. The rules below spend their strictest gates on the rare, serious cases and their caps on the common ones.

| Harm | How often (likelihood) | How bad (severity) | Where risk concentrates | Who is more exposed | Bounds used by the method | Grade |
|---|---|---|---|---|---|---|
| Overuse injury | 7.7 per 1,000 h (recreational), 17.8 per 1,000 h (novices) [wg4 §2 Videbæk] | usually days to weeks off; the main cause of drop-out | single-session spikes (> 10% above the 30-day longest run) [wg4 §1 Frandsen]; novice weeks | novices, prior injury in the last year, low weekly frequency | spike caps 1.10× / 2.0× (LOD-010, INV-01/02), slow profile (CTX-001…007), pain rules (08) | rates CORROBORATED; spike link CREDIBLE (one cohort) |
| Bone stress injury | no population rate in the council files (UNKNOWN); a minority of running injuries | 44–127 days to return; femoral neck and navicular longest, most complications [wg4 §4 Hoenig 2023] | rising load, repeated pain at rest or night | low energy availability (REDs), female athletes with absent periods, prior bone stress | B1–B5 questions → pause until professional clearance (SAF-002/003/023); REDs screen (11) | return times CORROBORATED; high/low-risk split not validated (Hoenig) |
| Heat illness | no incidence figure in the council files (UNKNOWN) | exertional heat stroke can kill; cool first [wg4 §4] | hot races, long efforts, no acclimatisation | runners aged 65 and over (lower heat loss) [factdesk6 §2], unacclimatised runners | H1/H2 red flags (SAF-004), pace targets off in heat (NUT-041), heat card | physiology CORROBORATED; incidence UNKNOWN |
| Exercise-associated hyponatraemia (EAH) | no incidence figure in the council files (UNKNOWN) | severe EAH can kill | events > 4 h, slow pace, weight gain during the race, drinking > ~1.5 L/h [wg5 §4] | slow and long-event runners, female or low body mass | drink-to-thirst card above `eah.warning_above_h` (NUT-032/034), drinking caps (NUT-031), E1 red flag (SAF-005) | risk factors CORROBORATED |
| Cardiac arrest in races | 0.54–0.60 per 100,000 race participants; marathon ≈ 1.0, half 0.27–0.47 per 100,000 [factdesk5 §8, RACER-1/2] | about 1 in 3 fatal in the latest data (66% survival) | marathon distance, race day | men (0.90–1.12 vs 0.16–0.19 per 100,000 women); older and masters runners | C1–C4 red flags (SAF-001), 65+ check-up gate (SAF-060, policy), runs > 3 h guarded (LOD-017) | CORROBORATED (two registries) |

The method makes no claim that its rules lower any of these rates (00 §8b); the pilot (14 §10) records them.

## 1. Red-flag catalogue

Asked at onboarding, after "Something felt wrong" or a pain entry (INP-023), on illness events (08), and before sessions in pregnancy mode and on the ladder. Yes/no answers; internal kinds are never shown.

| ID | Symptom question (shown) | Internal kind | Message |
|---|---|---|---|
| C1–C4 | "During or just after running, did you have: chest pain, pressure or tightness? / faint or nearly faint? / a racing or fluttering heartbeat unusual for you? / far more breathlessness than the effort explains?" | cardiac | MSG-SAF-002 |
| B1–B4 | "Is there a spot on a bone that hurts when you press it? / Does the pain start earlier in each run or grow as you run? / Does it hurt at rest or wake you at night? / Are you limping, or does hopping on that leg hurt?" | bone_stress | MSG-SAF-005 |
| B5 | "Where is it? hip or groin / front of the shin / top or inner side of the midfoot / outer edge of the foot / somewhere else" | region (internal high-risk set = first four) | MSG-SAF-006 |
| H1 | "Running in warm weather: is the runner confused, acting strangely or collapsed?" | heat (emergency) | MSG-SAF-003 |
| H2 | "In the heat: dizzy, sick, headache, very hot and unable to keep going?" | heat | MSG-SAF-002 |
| E1 | "After a long run or race where you drank a lot: confusion, severe headache, vomiting, or swollen hands or feet?" | eah (emergency) | MSG-SAF-003 |
| P1–P2 | (pregnancy mode) "Any vaginal bleeding, fluid leaking or regular painful contractions? / Dizziness, headache, chest pain, breathlessness before exercise, calf pain or swelling, or weakness affecting balance?" | pregnancy_stop | MSG-SAF-002 |
| I1–I3 | "Fever or feeling hot and shivery? / Chest, cough, body aches or stomach upset? / Only a runny nose or mild sore throat?" | illness | MSG-SAF-007 / -008 |
| R | energy-availability questions owned by 11 | reds_screen | MSG-SAF-009 |

```
RULE SAF-001 | priority T0.500 | when any of C1–C4 is yes | then raise RiskFlag(kind red_flag, subkind cardiac); outcome pause_until_clearance; emit MSG-SAF-002 | because exertional cardiac symptoms mean stop and urgent assessment | evidence wg4 §4, impl. 7, CORROBORATED; hearing-1 §3 | basis evidence | default? no
RULE SAF-002 | priority T0.501 | when any of B1–B4 is yes | then raise RiskFlag(red_flag, bone_stress); pause_until_clearance; professional clearance required; the pain model of 08 never applies; emit MSG-SAF-005 | because suspected bone stress means stop and refer | evidence factdesk1 §1, CORROBORATED (rule) / CREDIBLE (signs); hearing-1 §3 (three bases agree); wg4 impl. 8 | basis evidence | default? no
RULE SAF-003 | priority T0.502 | when SAF-002 fired and B5 ∈ flag.high_risk_regions | then subkind = bone_stress_highrisk: no in-app ladder (SAF-023) | because high-risk sites (femoral neck, anterior tibia, navicular, 5th metatarsal) need clinical care; the app runs no protocol | evidence factdesk1 §1; wg4 §4 Hoenig 2023, CORROBORATED (split not validated) | basis evidence | default? no
RULE SAF-004 | priority T0.503 | when H1 or H2 is yes | then raise RiskFlag(red_flag, heat); pause_until_clearance; emit MSG-SAF-003 for H1, MSG-SAF-002 for H2 | because heat-illness symptoms mean stop and seek help | evidence wg4 §4; wg5 impl. 5, CORROBORATED | basis evidence | default? no
RULE SAF-005 | priority T0.504 | when E1 is yes | then raise RiskFlag(red_flag, eah); pause_until_clearance; emit MSG-SAF-003 | because EAH is managed by neurological symptoms | evidence wg4 §4, impl. 7; wg5 §4, CORROBORATED (list CREDIBLE) | basis evidence | default? no
RULE SAF-006 | priority T0.505 | when SpecialStatus = pregnant and P1 or P2 is yes | then raise RiskFlag(red_flag, pregnancy_stop); pause_until_clearance; emit MSG-SAF-002 | because ACOG warning signs mean stop | evidence wg4 §5; wg3 §2, CORROBORATED | basis evidence | default? no
RULE SAF-007 | priority T0.506 | when I1 or I2 is yes | then raise RiskFlag(illness); no running sessions; return handled by 08 (illness.rest_days_min, illness.symptom_free_days); emit MSG-SAF-007 | because fever or systemic symptoms mean no training | evidence wg4 impl. 9, CORROBORATED; hearing-1 §3 | basis evidence | default? no
RULE SAF-008 | priority T1.507 | when only I3 is yes | then today's session effort ≤ E1 and duration ≤ illness.above_neck_dur_ratio × planned (REP-001); emit MSG-SAF-008 | because the "neck check" is a convention, never trialled | evidence hearing-1 §3, CREDIBLE (convention) | basis design_default | default? yes
RULE SAF-009 | priority T1.508 | when 11 reports a positive energy-availability self-screen (NUT-051 hands it over) | then raise RiskFlag(reds_screen) — the only rule that raises this flag; proceed with freeze: volume and long run ≤ last non-deload week, no level unlocks, train-low off; MSG-SAF-009; lifted by MSG-SAF-011 | because warning signs warrant referral, never diagnosis | evidence wg5 impl. 6, 9, CORROBORATED (refer) / CREDIBLE (freeze) | basis design_default | default? yes
RULE SAF-010 | priority T0.509 | when a flag of the same subkind is raised within flag.recur_window_days of a clearance | then clearance needs MSG-SAF-011 (professional), illness included; recurring bone_stress also triggers 11's energy questions | because recurrence and repeated bone stress are referral signs | evidence wg5 §2, CORROBORATED (bone stress as REDs sign); opening-contrarian §1.3 | basis design_default | default? yes
RULE SAF-011 | priority T0.514 | when 08 hands over persistent or severe pain (ADP-053) and every bone-stress question B1–B4 is no | then raise RiskFlag(pain, pain_persistent); pause_until_clearance; professional clearance required (flag.professional_kinds); emit MSG-SAF-001 | because pain beyond the pain-monitoring model is outside what a self-coached tool may manage; the tool names no cause | evidence hearing-1 §3, CORROBORATED; factdesk1 §2, CONTRADICTED thresholds → conservative; factdesk2 §2 | basis design_default | default? yes
RULE SAF-012 | priority T0.532 | when RiskFlag(reds_screen) is active and a bone-stress flag is raised or an absent-periods answer is yes (NUT-052) | then raise RiskFlag(red_flag, reds_escalated); pause_until_clearance; professional clearance required; emit MSG-SAF-009 | because energy warning signs together with bone stress or menstrual disruption are a referral case | evidence wg5 §2, impl. 9, CORROBORATED (IOC 2023 referral) | basis design_default | default? yes
```

## 2. Pause and clearance

> **In plain words.** A paused plan shows no runs. When a professional has seen you, tick the box; we accept it from the next day. After a fever, you confirm you have been well long enough. The plan then rebuilds from where you are now.

```
RULE SAF-020 | priority T0.510 | when any RiskFlag with subkind ∈ flag.pause_kinds is active (v5.2: subkind, as INV-05 says; v5 tested kind) | then Plan.status = paused; zero running sessions from raised_on (INV-05); show MSG-SAF-010 and MSG-SAF-004; logging stays open | because self-coached users need a hard stop | evidence wg4 §4, CORROBORATED; 07 GEN-001 | basis evidence | default? no
RULE SAF-021 | priority T0.511 | when a clearance attestation is submitted | then accept it only if dated ≥ raised_on + flag.clearance_min_delay_days; subkinds in flag.professional_kinds need MSG-SAF-011, illness needs MSG-SAF-012 (08 criteria met); set status = cleared, clearance_attested_on | because a same-day attestation is not a consultation | evidence opening-contrarian §1.3; factdesk2 §2 (d), UNKNOWN (design default) | basis design_default | default? yes
RULE SAF-022 | priority T1.512 | when a flag is cleared | then re-screen if cardiac (SCR-008); regenerate S2–S10 from current DerivedState; enter the ladder (§4) if days_since_last_run ≥ gap.rtr_trigger_days or subkind ∈ {bone_stress, pregnancy_stop}, else 08's gap bands; INV-04 against the paused version | because the plan restarts from current state, never old load | evidence wg3 §3 detraining, CORROBORATED (direction); factdesk2 §1 | basis design_default | default? yes
RULE SAF-023 | priority T0.513 | when subkind = bone_stress_highrisk is cleared | then generated running resumes only after MSG-SAF-013; runs logged meanwhile count; L30 undefined → ladder (SAF-080) | because high-risk returns take 3–4+ months under clinical care | evidence wg4 §4, impl. 8, CORROBORATED; factdesk1 §1 | basis evidence | default? no
```

## 3. Special populations

> **In plain words.** Under 18, race distances are capped by age and a parent or guardian must agree. In pregnancy, only people who already ran keep running, gently, with their clinician's agreement. No running plan before about 12 weeks after birth. Over 65, hard sessions wait for a medical check.

```
RULE SAF-040 | priority T1.515 | when age_low < minor.min_age | then outcome no_plan; emit MSG-SAF-020 | because the tool is not designed for children; the cautious age end applies | evidence wg4 impl. 11, CORROBORATED (norm, opinion-based) | basis design_default | default? yes
RULE SAF-041 | priority T1.516 | when age_low < minor.adult_age and no guardian attestation (MSG-SAF-021) exists | then outcome no_plan | because federation guidance expects an adult to be involved | evidence wg3 impl. 5, CORROBORATED (norm) | basis convention | default? no
RULE SAF-042 | priority T1.517 | when age_low < minor.refer_below_age | then outcome pause_until_clearance until MSG-SAF-011 is attested by the guardian | because guidance refers runners under about 16 | evidence wg4 impl. 11, CORROBORATED (opinion-based) | basis design_default | default? yes
RULE SAF-043 | priority T1.518 | when age_low at race_date < minor.adult_age and goal distance > minor.max_race_km.recommended[age_low] (or > hard cap when the guardian opted in), or goal is M/50K/100K with age_low < minor.marathon_min_age / minor.ultra_min_age | then goal infeasible (MINOR_DISTANCE); 03 offers the longest allowed distance; MSG-SAF-022 | because federations cap race distance by age; the lower table applies | evidence wg4 §6; wg3 §2, CORROBORATED (norm) | basis convention | default? no
RULE SAF-044 | priority T2.519 | when age_low on the **session date** < minor.adult_age | then that run's distance ≤ minor.lr_cap_ratio × the race cap for age_low on that date; b2b off; preset norwegian_elite and train-low unavailable; the feasibility dry run applies the cap per date | because a minor's caps change with birthdays during a long plan (p1-B R8) | evidence wg4 §6, CORROBORATED norm (opinion-based) | basis design_default | default? yes
RULE SAF-050 | priority T1.520 | when SpecialStatus = pregnant and the runner was not running before (training_age_years = 0 or claimed_runs_per_week = 0 at start_date) | then outcome no_plan for running; emit MSG-SAF-030 | because continuing is supported for people who already ran | evidence wg4 impl. 10; wg3 impl. 6, CORROBORATED | basis evidence | default? no
RULE SAF-051 | priority T1.521 | when SpecialStatus = pregnant and the runner ran before | then pause_until_clearance until MSG-SAF-031; then pregnancy.mode: goal_type = maintain, no race or time goal, weekly volume ≤ pregnancy.vol_cap_ratio × V28 at start_date, effort ≤ pregnancy.max_effort, P1–P2 before each session, re-attest every pregnancy.reattest_weeks; the runner enters due_date (required in pregnancy mode) | because ACOG supports continuing with clinician agreement; no performance plans | evidence wg4 §5 ACOG 804; wg3 impl. 6, CORROBORATED | basis design_default | default? yes
RULE SAF-052 | priority T1.522 | when SpecialStatus = postpartum and weeks since start_date < pp.min_weeks | then outcome no_plan; emit MSG-SAF-032 | because return to running is guided from about 3 months after birth | evidence wg4 §5 Goom 2019; wg3 §2, CORROBORATED (expert) | basis evidence | default? no
RULE SAF-053 | priority T1.523 | when SpecialStatus = postpartum and weeks since start_date ≥ pp.min_weeks | then pause_until_clearance until MSG-SAF-033; then ladder entry R0 | because load and impact assessment is advised before running | evidence wg4 §5, impl. 10, CORROBORATED | basis evidence | default? no
RULE SAF-054 | priority T1.534 | when SpecialStatus = pregnant and today ≥ due_date − pp.due_ask_days | then before each session ask "Have you given birth?"; from due_date the plan pauses until it is answered; yes → SpecialStatus = postpartum with start_date = birth date (SAF-052); no → ask again at each session | because pregnancy mode otherwise continued after birth until the next re-attestation; running is not advised before about 3 months postnatal (p2-C R4) | evidence factdesk5 §7, CORROBORATED (Goom 2019: 3–6 months, after screening); hearing-3 med, CORROBORATED | basis design_default | default? yes
RULE SAF-060 | priority T1.524 | when age_high ≥ masters.vigorous_assessment_age and the plan would contain any session ≥ E3 **or any run with expected duration > 180 min** (LOD-017) | then proceed_restricted (effort ≤ E2, runs capped at 180 min) until MSG-SAF-040 ("a doctor has checked that hard or very long training is fine for me") is attested; SAF-061 also fires; the card labels this "our cautious choice for runners aged 65 and over" | because ESC 2020 advises assessment before high intensity at ≥ 65; extending it to runs over 3 h is a **policy convention** — no study compares a clinical check with self-attestation, and race cardiac-arrest risk is higher in marathons and in men (p1-B R4; First Principles dissent: no new gate) | evidence wg4 §3, CORROBORATED (low evidence base); factdesk5 §8, CORROBORATED (RACER: 0.54→0.60/100k, marathon ~1.0, men ≫ women); hearing-3 med-acad, UNKNOWN (check vs attestation) | basis design_default | default? yes
RULE SAF-061 | priority T6.525 | when age_high ≥ masters.cv_advice_age, the plan has sessions ≥ E3, and (CTX-001 applies or age_high ≥ ctx.masters_age) | then show MSG-SAF-061 once per season: generic advice that a check-up before hard or very long training is sensible from this age, and a link to the stop signs shown to every runner (MSG-SAF-STOP-SIGNS; v5, p2-C R11: no heart wording in a message triggered by age) | because masters endurance athletes show an association between lifelong volume and heart-rhythm problems (size contested); v1 skipped experienced masters runners (F-26) | evidence hearing-2 med-acad/med-crit, CORROBORATED (association) / contested (magnitude); wg4 §3, CREDIBLE (age 35 framing) | basis design_default | default? yes
```

## 4. Return-to-run ladder (`rtr.ladder`)

> **In plain words.** After a long break, injury or illness, every session lasts the same time but holds more running: walking first, then 1 minute running and 2 walking, and so on. Move up after a few sessions with no pain during or next morning; if something hurts, rest a day and step back. These steps are a cautious default, not a proven schedule.

**Basis.** Structure CORROBORATED: walk–jog → easy runs with rest days → consecutive days → full training, progressed by symptoms [factdesk1 §1]; clinic start 1:1–2 run/walk [hearing-1 §3, CREDIBLE]; 2:1 [wg2 §1 Galloway, CORROBORATED]; Elliott stage 1 ≈ 15 min [wg4 §5, CORROBORATED]. **Durations, ratios and counts are UNKNOWN-based design defaults.** Time on feet is constant across rungs, so INV-02 holds; no planned distance, so INV-01 does not apply.

| Rung | Session (time on feet = `rtr.session_min[prior_tol_tier]`) | Spacing |
|---|---|---|
| R0 | walk E0 (illness entry: `rtr.illness_r0_min` light E0–E1) | 2 separate days |
| R1 | run 1 min E1 / walk 2 min E0 | ≥ `rtr.rest_days_between` rest day |
| R2 | run 2 / walk 1 | same |
| R3 | run 5 / walk 1 | same |
| R4 | continuous E1 | same |
| R5 | continuous E1 | consecutive days allowed |

| Situation | Entry rung |
|---|---|
| bone_stress cleared, postpartum, illness with gap ≥ `gap.rtr_trigger_days` (08 ADP-042; shorter illness gaps use the gap bands, F-22) | R0 |
| never run: no history **and** training age 0 (v3) | **start ladder S1** (§4b) |
| gap ≥ `rtr.long_gap_days`, prior_tol_tier ≤ 1, or no logged history but training age > 0 | R1 |
| `gap.rtr_trigger_days` ≤ gap < `rtr.long_gap_days`, prior_tol_tier = 2 | R2 |
| same gap, prior_tol_tier ≥ 3 | R4 |

### 4b. Start ladder for people who have never run (`rtr.start_ladder`, v3)

> **In plain words.** If you have never run, you start with the NHS Couch-to-5K steps: three sessions a week, each starting with a 5-minute brisk walk. You move up a step after three sessions that felt fine during the run and the next morning. You can repeat a step; you never skip one. It takes at least 9 weeks to reach 30 minutes of running.

| Rung | Session (after a 5-min brisk walk) | Running minutes | Grade |
|---|---|---|---|
| S1 | 60 s run / 90 s walk, 20 min | 8 | CORROBORATED |
| S2 | 90 s run / 2 min walk, 20 min | ~9 | CORROBORATED |
| S3 | 2 × (90 s run, 90 s walk, 3 min run, 3 min walk) | 9 | CORROBORATED |
| S4 | 3, 5, 3, 5 min runs with 90 s / 2.5 min walks between | 16 | CORROBORATED |
| S5 | session 1: 3 × 5 min (3 min walks) · session 2: 2 × 8 min (5 min walk) · session 3: 20 min continuous | 15 / 16 / 20 | CORROBORATED |
| S6 | session 1: 5-8-5 min (3 min walks) · session 2: 2 × 10 min (3 min walk) · session 3: 25 min continuous | 18 / 20 / 25 | sessions 1–2 **CREDIBLE**, session 3 CORROBORATED |
| S7 | 25 min continuous | 25 | CORROBORATED |
| S8 | 28 min continuous | 28 | **CREDIBLE** (one US copy uses 30) |
| S9 | 30 min continuous | 30 | CORROBORATED |

Source: NHS [state] Couch-to-5K as reproduced by several bodies [factdesk4 §1]. NHS itself says the plan may take longer than 9 weeks and that weeks can be repeated.

**Labels.**
- This is a **convention**. Tested novice programmes run 8–13 weeks with similar injury rates (GRONORUN 8 vs 13 weeks: 20.3% vs 20.8% [factdesk4 §1, CORROBORATED]; Couch-to-5K about 19% [Relph 2023, a single study, CREDIBLE; v5.1]). Shorter programmes are untested.
- Drop-out is not linked to ramp speed [hearing-2 med-crit], so the label promises nothing about it.

**Rules.**
- Progression: `rtr.sessions_per_rung` (3) clean sessions per rung. The clean test is the same as for the R ladder (SAF-082). A session counts toward its rung only if ≥ `miss.partial_ratio` of it was done (v4, p1-B R2); a session cut by the neck check (SAF-008) does not count.
- Gaps on the start ladder follow ADP-035 (8–14 days: repeat the last completed rung; 15–29: drop one rung; ≥ 30: SAF-080).
- **LADDER_RUNWALK completion (v4, p1-B R1).** If race week arrives before S9 for a 5K finish goal, the race is kept as run-walk at the current rung's pattern, provided the rung is ≥ S5 and the estimated time on feet is ≤ `spike.block_ratio` × the longest logged ladder session (FEA-043b). Otherwise the earliest date is offered. For any fixed date under 12 weeks the plan says up front: "Most people repeat a week; that is normal." [factdesk4 §1, CORROBORATED]
- No deload is placed inside the start ladder (04 §3, p1-C R13).
- A failed session repeats the rung; it never drops below S1. Backfilled sessions (ADP-004) count toward a rung when their pain and next-morning answers are recorded, **subject to SAF-082's v5 limits** (p2-C R5): dated on or after the ladder start, one per day, the rung's rest spacing, ≤ `rtr.max_runs_per_week` counted sessions a week, and backfill advances at most one rung per 7 days.
- INV-02 counts walk time, so the step increases in *running* minutes inside a rung (S4 → S5 R3) follow the published programme. They are not checked by the spike cap: the published programme is the best evidence available.
- Completing S9 credits HAB L2 and a 30-min long run (`race.5k_finish_lr_min`) for a 5K finish goal (02 §2, 03 §2).
- After S9 the runner exits to BASE with L30_eff_time = 30 min.

```
RULE SAF-080 | priority T2.526 | when the plan enters RTR (GEN-012, SAF-022, SAF-053, 08) | then pick the entry rung from the table, using the most cautious matching row | because prior tolerance and gap set the restart point | evidence factdesk1 §1, CORROBORATED (structure); factdesk2 §1, UNKNOWN; wg3 §3, CORROBORATED (detraining direction) | basis design_default | default? yes
RULE SAF-081 | priority T2.527 | when a ladder session is generated | then duration = rtr.session_min[prior_tol_tier], but the 30-min row whenever the gap ≥ rtr.long_gap_days or the entry is R0 after postpartum, a pregnancy stop or a bone-stress flag; effort ≤ E1, planned_distance = null, runs/week ≤ min(max_runs_per_week, rtr.max_runs_per_week), rest spacing per rung | because after a long break or a postnatal return, prior tolerance no longer applies; a graded return is advised (p1-B R7) | evidence factdesk2 §1, UNKNOWN (duration); factdesk5 §7, hearing-3 med, CORROBORATED (Goom: 3–6 months postnatal with screening, graded return) | basis design_default | default? yes
RULE SAF-082 | priority T5.528 | when rtr.sessions_per_rung consecutive sessions on a rung are clean (pain ≤ pain.during_max during, next-morning rule passed; bone_stress route: pain ≤ rtr.bone_pain_max) | then advance one rung; after R5 exit to ONBOARD/BASE with L30_eff_time from the log; a session counts toward a rung only if it is dated on or after the ladder start, is the only counted session that day, respects the rung's rest spacing, and its week holds ≤ rtr.max_runs_per_week counted sessions; backfilled sessions advance at most one rung per 7 days (v5, p2-C R5) | because progression follows symptoms, not the calendar | evidence factdesk1 §1, §2, CORROBORATED (next-morning rule) | basis design_default | default? yes
RULE SAF-083 | priority T2.529 | when a ladder session is not clean | then schedule ≥ 1 rest day and drop one rung (not below the entry rung's floor R0/R1); any B1–B4 yes → SAF-002 | because symptoms mean rest a day and go back one stage | evidence factdesk1 §1, CORROBORATED | basis evidence | default? no
RULE SAF-084 | priority T5.530 | when the runner stays on one rung for more than rtr.max_weeks_per_rung weeks **that each contain an unclean session** | then hold the rung and emit MSG-SAF-001 once; weeks without an unclean session (few runs, busy weeks) never count | because a stalled return deserves a professional look, but slow scheduling is not a symptom (p1-B R2) | evidence hearing-1 §3, CREDIBLE (no validated criteria) | basis design_default | default? yes
RULE SAF-085 | priority T4.531 | when 03 computes weeks_needed.rtr | then rtr_needed = ceil((rungs from entry to the last rung + 1) × rtr.sessions_per_rung ÷ ladder runs per week) for the R ladder, and ceil(9 × rtr.sessions_per_rung ÷ ladder runs per week) (≥ 9 weeks at 3 runs) for the start ladder; no ladder is ever compressed to fit a goal | because squeezing a return or a first start concentrates load | evidence opening-contrarian §1.2; factdesk4 §1, CORROBORATED (C25K 9 weeks) | basis design_default | default? yes
RULE SAF-086 | priority T2.533 | when the runner has no running history and training_age_years = 0 | then enter the start ladder at S1 (§4b) instead of the R ladder; never skip a rung | because a return-to-run protocol is not a first-start programme; the published 9-week convention is the tested range | evidence factdesk4 §1, CORROBORATED (C25K; GRONORUN 8–13 weeks); d2-roomA R1 | basis design_default | default? yes
```

## 5. Message catalogue (all `is_safety_generic = true`)

> **Non-normative copy (v5, p2-A R3).** `messages.md` governs every text below; where they differ, the catalogue wins and this table is a defect to be fixed at the next edit.


| ID | plain_text | why |
|---|---|---|
| MSG-SAF-001 | "Before you start or go on with this plan, talk to a doctor or other health worker." | "A professional should look first." |
| MSG-SAF-002 | "Stop. Do not run. Seek medical help today. If it is happening now or feels severe, call emergency services." | "These signs need a medical check." |
| MSG-SAF-003 | "Call emergency services now. Stop running and stay with someone until help arrives." | "These signs need urgent help." |
| MSG-SAF-004 | 00 §6 disclaimer text | disclaimer |
| MSG-SAF-005 | "Stop running. See a health professional before you run again." | "This pain needs checking first." |
| MSG-SAF-006 | "For pain in this area, follow your health professional's return plan. This app does not provide one." | "Some areas need a professional's plan." |
| MSG-SAF-007 | "Rest from running until you feel well. If you are not improving, talk to a doctor." | "Running unwell can make things worse." |
| MSG-SAF-008 | "Easy and shorter today. Stop if you feel worse." | "Light symptoms: a gentle run at most." |
| MSG-SAF-009 | "Some answers are worth discussing with a doctor or registered dietitian. Until then your plan holds steady." | "No increases until then." |
| MSG-SAF-010 | "Your plan is paused. No runs are scheduled until you confirm you have been cleared." | — |
| MSG-SAF-011 | "I have talked to a doctor or other health worker about this. They agreed I can run again." | attestation |
| MSG-SAF-012 | "I have had no fever, have felt well for the days asked, and can walk comfortably." | attestation |
| MSG-SAF-013 | "My health professional has cleared me to return to full training." | attestation |
| MSG-SAF-020 | "This tool is for runners aged {minor.min_age} and over." | "Young runners need adult-led guidance." |
| MSG-SAF-021 | "I am the parent or guardian; I agree to this plan and answered the health questions with the runner." | attestation |
| MSG-SAF-022 | "Races longer than {cap} are not recommended at your age, so we suggest a shorter goal." | "Race distances are capped by age." |
| MSG-SAF-030 | "Please talk to your midwife or doctor about what activity suits you now." | "Starting running in pregnancy is not covered." |
| MSG-SAF-031 | "My midwife or doctor agreed that I can keep running during this pregnancy." | attestation |
| MSG-SAF-032 | "A running plan starts from about {pp.min_weeks} weeks after birth." | "Your body needs time first." |
| MSG-SAF-033 | "A health professional has checked that I am ready to start running again." | attestation |
| MSG-SAF-060 | "Our cautious choice for runners aged 65 and over: hard sessions and runs over 3 hours start after a check-up with a doctor. Until then, runs stay easy to steady and at most {cap:min}." | "This is our cautious choice, not a tested rule." (v5) |
| MSG-SAF-061 | "From age {age:int}, a check-up with a doctor before hard or very long training is a sensible step." | "Long, hard training is a big demand on the body; a check-up is a sensible precaution." (v5, p2-C R11) |
| MSG-SAF-040 | "A doctor has checked that hard or very long training is fine for me." | attestation |
| MSG-SAF-041 | "If you have not trained hard for a long time, a check-up before hard sessions is a good idea." | advisory |

## 6. Wellness-boundary checklist (factdesk2 §2 a–e)

| Item | How 10 meets it | Static check |
|---|---|---|
| (a) fixed questionnaire | symptom questions are fixed text; PAR-Q+ unchanged (SCR-002) | text hash per release |
| (b) generic message | only §5 messages on T0/T1 outputs | `is_safety_generic` (INV-24) |
| (c) no naming, scoring, predicting | no condition word, score or probability in any §5 text; region (B5) only routes | word-list lint on user text |
| (d) training-suitability output | every rule outputs `proceed`, `proceed_restricted`, `pause_until_clearance` or `no_plan` (freeze = numeric cap under `proceed`) | action-vocabulary check |
| (e) disclaimer | MSG-SAF-004 at onboarding and on every pause | screen test |

## 7. Test seeds

`T-<ID>-fires` / `-silent`: SAF-002 B3 yes / pain 2, no signs · SAF-003 midfoot / elsewhere · SAF-008 runny nose / none · SAF-010 in window / after · SAF-021 next day / same day · SAF-022 40 days off → ladder / 5 days → gap bands · SAF-043 16-year-old half / 10K · SAF-052 8 / 14 weeks postpartum · SAF-060 66 with intervals / easy plan; others: trigger present / absent.

## 8. Parameters proposed

| ID | Default | Unit | Range | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|
| flag.pause_kinds | cardiac, bone_stress(_highrisk), heat, eah, pregnancy_stop, reds_escalated, pain_persistent, illness | set | — | CORROBORATED | ev | wg4 §4 | 10 |
| flag.professional_kinds | all pause kinds except illness | set | — | CORROBORATED (stop and refer) | ev | wg4 impl. 7 | 10 |
| flag.recur_window_days | 60 | days | 30–90 | — | dd | SAF-010 | 10 |
| flag.high_risk_regions | first four B5 options | set | — | CORROBORATED (sites) / mapping dd | dd | factdesk1 §1 | 10 |
| illness.above_neck_dur_ratio | 0.75 | × planned | 0.5–1.0 | CREDIBLE convention | dd | hearing-1 §3 | 10/08 |
| minor.adult_age | 18 | years | — | CORROBORATED norm | conv | wg3 §2 | 10 |
| minor.refer_below_age | 16 | years | 15–16 | CORROBORATED (opinion) | conv | wg4 impl. 11 | 10 |
| minor.lr_cap_ratio | 1.0 | × race cap | 0.8–1.0 | — | dd | SAF-044 | 10 |
| pregnancy.max_effort | E2 | effort | E2–E3 (E3 if clinician agrees) | — | dd | wg4 §5 | 10 |
| pregnancy.vol_cap_ratio | 1.0 | × V28 at start | 0.7–1.0 | — | dd | wg3 impl. 6 | 10 |
| pregnancy.reattest_weeks | 12 | weeks | 8–13 | — | dd | SAF-051 | 10 |
| masters.cv_advice_age | 35 | years | — | CREDIBLE | conv | wg4 §3 | 10 |
| rtr.session_min | prior tol 0–2: 30; ≥ 3: 45 | min | 20–60 | UNKNOWN | dd | hearing-1 §3 | 10 |
| rtr.illness_r0_min | 15 | min | 10–20 | CORROBORATED (Elliott stage 1) | ev | wg4 §5 | 10 |
| rtr.sessions_per_rung | 3 | sessions | 2–4 | UNKNOWN | dd | factdesk1 §1 | 10 |
| rtr.rest_days_between | 1 | days | 1–2 | CORROBORATED (structure) | conv | factdesk1 §1 | 10 |
| rtr.max_runs_per_week | 4 | runs | 3–4 | UNKNOWN | dd | — | 10 |
| rtr.long_gap_days | 90 | days | 60–120 | UNKNOWN | dd | wg3 §3 | 10 |
| rtr.bone_pain_max | 0 | /10 | 0–2 | UNKNOWN | dd | factdesk1 §2 | 10 |
| rtr.max_weeks_per_rung | 3 | weeks | 2–4 | UNKNOWN | dd | — | 10 |

## 9. Conflicts with contract and other modules

1. **Data model (12):** add `RiskFlag.subkind` (cardiac, bone_stress, bone_stress_highrisk, heat, eah, pregnancy_stop, illness, reds_screen) and `region`; `DerivedState.prior_tol_tier` (tier before the gap); `ScreeningRecord.guardian_attested_on` and `guardian_hardcap_optin` (SAF-043).
2. **Outcome vocabulary:** the SAF-009 freeze is numeric caps under `proceed`, not a fifth outcome; 11 should follow.
3. **Emergency message** MSG-SAF-003 goes beyond the two texts of CONTRACTS §1.9; it is generic. Architect to confirm.
4. **INV-01 during RTR:** only INV-02 binds; GEN-023 should not warn on logged ladder distances (05/07 confirm).
5. **GEN-012 vs ONBOARD (04):** a novice with no history enters the ladder at R1; 04 should count ladder weeks as ONBOARD weeks, not add both.
6. **Illness (08):** 10 raises the flag; 08 owns the return gate (`illness.*`) and hands to SAF-080 at R0.
7. **`minor.max_race_km`** lacks a hard cap for age 14; SAF-043 uses the recommended 8 km.
8. **Pain model:** the bone-stress ladder uses `rtr.bone_pain_max`, not `pain.during_max` (contract).

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "SAF-001", "condition": "event.C1 || event.C2 || event.C3 || event.C4", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "cardiac", "outcome": "pause_until_clearance", "msg": "MSG-SAF-002"}}
{"id": "SAF-002", "condition": "event.B1 || event.B2 || event.B3 || event.B4", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "bone_stress", "outcome": "pause_until_clearance", "msg": "MSG-SAF-005"}}
{"id": "SAF-003", "condition": "(event.B1 || event.B2 || event.B3 || event.B4) && event.B5 in p('flag.high_risk_regions')", "on_unknown": "hold", "action": {"op": "set", "target": "flag.subkind", "expr": "'bone_stress_highrisk'"}}
{"id": "SAF-004", "condition": "event.H1 || event.H2", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "heat", "outcome": "pause_until_clearance", "msg_expr": "event.H1 ? 'MSG-SAF-003' : 'MSG-SAF-002'"}}
{"id": "SAF-005", "condition": "event.E1 == true", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "eah", "outcome": "pause_until_clearance", "msg": "MSG-SAF-003"}}
{"id": "SAF-006", "condition": "profile.special_status == 'pregnant' && (event.P1 || event.P2)", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "pregnancy_stop", "outcome": "pause_until_clearance", "msg": "MSG-SAF-002"}}
{"id": "SAF-007", "condition": "event.I1 || event.I2", "on_unknown": "hold", "action": {"op": "raise_flag", "kind": "illness", "subkind": "illness", "outcome": "no_running", "msg": "MSG-SAF-007"}}
{"id": "SAF-008", "condition": "event.I3 == true && event.I1 == false && event.I2 == false", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_duration_s", "expr": "p('illness.above_neck_dur_ratio') * session.planned_duration_s", "then": [{"op": "set", "target": "state.effort_ceiling", "expr": "'E1'"}], "msg": "MSG-SAF-008"}}
{"id": "SAF-009", "condition": "event.reds_screen_positive == true", "on_unknown": "fire", "action": {"op": "raise_flag", "kind": "reds_screen", "subkind": "reds_screen", "outcome": "freeze", "msg": "MSG-SAF-009", "then": [{"op": "freeze", "target": "plan.progression", "until": "has(flag.clearance_attested_on)"}]}}
{"id": "SAF-010", "condition": "exists(flags.cleared, f, f.subkind == flag.subkind && days_between(f.cleared_on, flag.raised_on) <= p('flag.recur_window_days'))", "on_unknown": "fire", "action": {"op": "require_attestation", "target": "flag", "msg": "MSG-SAF-011"}}
{"id": "SAF-011", "condition": "event.handover == 'ADP-053' && event.B1 == false && event.B2 == false && event.B3 == false && event.B4 == false", "on_unknown": "fire", "action": {"op": "raise_flag", "kind": "pain", "subkind": "pain_persistent", "outcome": "pause_until_clearance", "msg": "MSG-SAF-001"}}
{"id": "SAF-012", "condition": "state.reds_flag_active && (event.bone_stress_flag_raised || event.absent_periods == true)", "on_unknown": "fire", "action": {"op": "raise_flag", "kind": "red_flag", "subkind": "reds_escalated", "outcome": "pause_until_clearance", "msg": "MSG-SAF-009"}}
{"id": "SAF-020", "condition": "exists(flags.active, f, f.subkind in p('flag.pause_kinds'))", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.is_run && s.date >= flag.raised_on", "until": "flag.status == 'cleared'", "then": [{"op": "set", "target": "plan.status", "expr": "'paused'"}], "msg": "MSG-SAF-010"}}
{"id": "SAF-021", "condition": "event.type == 'clearance_attested' && event.date >= date_add(flag.raised_on, p('flag.clearance_min_delay_days')) && (flag.subkind in p('flag.professional_kinds') ? event.msg_id == 'MSG-SAF-011' : event.msg_id in ['MSG-SAF-011', 'MSG-SAF-012'])", "on_unknown": "skip", "action": {"op": "set", "target": "flag.status", "expr": "'cleared'", "then": [{"op": "set", "target": "flag.clearance_attested_on", "expr": "event.date"}]}}
{"id": "SAF-022", "condition": "event.type == 'flag_cleared'", "on_unknown": "fire", "action": {"op": "regenerate", "from_stage": "S2", "then": [{"op": "require_rescreen", "when": "flag.subkind == 'cardiac'"}, {"op": "insert_phase", "phase": "RTR", "rung_expr": "rtr_entry_rung(state.prior_tol_tier, state.days_since_last_run)", "when": "state.days_since_last_run >= p('gap.rtr_trigger_days') || flag.subkind in ['bone_stress', 'pregnancy_stop']"}]}}
{"id": "SAF-023", "condition": "event.type == 'flag_cleared' && flag.subkind == 'bone_stress_highrisk'", "on_unknown": "fire", "action": {"op": "require_attestation", "target": "flag", "msg": "MSG-SAF-013", "then": [{"op": "insert_phase", "phase": "RTR", "rung_expr": "'R0'"}]}}
{"id": "SAF-040", "condition": "age_low(today) < p('minor.min_age')", "on_unknown": "fire", "action": {"op": "gate", "outcome": "no_plan", "msg": "MSG-SAF-020"}}
{"id": "SAF-041", "condition": "age_low(today) < p('minor.adult_age') && !has(screen.guardian_attested_on)", "on_unknown": "fire", "action": {"op": "gate", "outcome": "no_plan", "msg": "MSG-SAF-021"}}
{"id": "SAF-042", "condition": "age_low(today) < p('minor.refer_below_age')", "on_unknown": "fire", "action": {"op": "gate", "outcome": "pause_until_clearance", "until": "has(screen.guardian_clearance_on)", "msg": "MSG-SAF-011"}}
{"id": "SAF-043", "condition": "age_low(goal.race_date) < p('minor.adult_age') && (goal.distance_km > p('minor.max_race_km.recommended')[age_low(goal.race_date)] || (goal.distance == 'M' && age_low(goal.race_date) < p('minor.marathon_min_age')) || (goal.distance in ['50K', '100K'] && age_low(goal.race_date) < p('minor.ultra_min_age')))", "on_unknown": "fire", "action": {"op": "add_reason", "code": "MINOR_DISTANCE", "msg": "MSG-SAF-022"}}
{"id": "SAF-044", "condition": "age_low(session.date) < p('minor.adult_age') && session.planned_distance_m > p('minor.lr_cap_ratio') * unit.km_m * p('minor.max_race_km.recommended')[age_low(session.date)]", "on_unknown": "fire", "action": {"op": "cap", "target": "session.planned_distance_m", "expr": "p('minor.lr_cap_ratio') * unit.km_m * p('minor.max_race_km.recommended')[age_low(session.date)]", "msg": "MSG-SAF-023"}}
{"id": "SAF-050", "condition": "profile.special_status == 'pregnant' && (profile.training_age_years == 0 || claim.runs_per_week == 0)", "on_unknown": "fire", "action": {"op": "gate", "outcome": "no_plan", "msg": "MSG-SAF-030"}}
{"id": "SAF-051", "condition": "profile.special_status == 'pregnant' && profile.training_age_years > 0 && claim.runs_per_week > 0", "on_unknown": "fire", "action": {"op": "gate", "outcome": "pause_until_clearance", "until": "has(profile.saf031_attested_on)", "msg": "MSG-SAF-031", "then": [{"op": "set", "target": "goal.goal_type", "expr": "'maintain'"}, {"op": "cap", "target": "week.planned_time_s", "expr": "p('pregnancy.vol_cap_ratio') * state.V28_at_status_start_s"}, {"op": "set", "target": "state.effort_ceiling", "expr": "p('pregnancy.max_effort')"}, {"op": "ask", "field": "profile.due_date", "msg": "MSG-SAF-034"}]}}
{"id": "SAF-052", "condition": "profile.special_status == 'postpartum' && days_between(profile.special_status_start, today) < unit.week_d * p('pp.min_weeks')", "on_unknown": "fire", "action": {"op": "gate", "outcome": "no_plan", "msg": "MSG-SAF-032"}}
{"id": "SAF-053", "condition": "profile.special_status == 'postpartum' && days_between(profile.special_status_start, today) >= unit.week_d * p('pp.min_weeks')", "on_unknown": "fire", "action": {"op": "gate", "outcome": "pause_until_clearance", "until": "has(profile.saf033_attested_on)", "msg": "MSG-SAF-033", "then": [{"op": "insert_phase", "phase": "RTR", "rung_expr": "'R0'"}]}}
{"id": "SAF-054", "condition": "profile.special_status == 'pregnant' && today >= date_add(profile.due_date, -p('pp.due_ask_days'))", "on_unknown": "fire", "action": {"op": "ask", "field": "profile.has_given_birth", "msg": "MSG-SAF-035", "then": [{"op": "block_sessions", "filter": "s.is_run", "until": "has(profile.has_given_birth)", "when": "today >= profile.due_date"}]}}
{"id": "SAF-060", "condition": "age_high(today) >= p('masters.vigorous_assessment_age') && (exists(plan.sessions, s, effort_rank(s.effort_target) >= effort_rank('E3')) || exists(plan.sessions, s, s.expected_duration_s > unit.min_s * p('lr.long_guard_min'))) && !has(screen.saf060_attested_on)", "on_unknown": "fire", "action": {"op": "gate", "outcome": "proceed_restricted", "effort_max": "'E2'", "until": "has(screen.saf060_attested_on)", "msg": "MSG-SAF-060", "then": [{"op": "cap", "target": "s.planned_duration_s", "expr": "unit.min_s * p('lr.long_guard_min')"}]}}
{"id": "SAF-080", "condition": "event.type == 'enter_rtr'", "on_unknown": "fire", "action": {"op": "set_rung", "expr": "rtr_entry_rung(state.prior_tol_tier, state.days_since_last_run)"}}
{"id": "SAF-081", "condition": "session.ladder == 'rtr'", "on_unknown": "fire", "action": {"op": "set", "target": "session.planned_duration_s", "expr": "unit.min_s * ((state.days_since_last_run >= p('rtr.long_gap_days') || state.rtr_entry_reason in ['postpartum', 'pregnancy_stop', 'bone_stress']) ? p('rtr.session_min')[0] : p('rtr.session_min')[state.prior_tol_tier])", "then": [{"op": "set", "target": "session.effort_target", "expr": "'E1'"}, {"op": "set", "target": "session.planned_distance_m", "expr": "null"}, {"op": "cap", "target": "week.runs", "expr": "min(profile.max_runs_per_week, p('rtr.max_runs_per_week'))"}]}}
{"id": "SAF-082", "condition": "count(state.rung_counted_sessions, x, x.clean) >= p('rtr.sessions_per_rung')", "on_unknown": "skip", "action": {"op": "set_rung", "expr": "state.ladder_rung_index + 1", "constraint": "all(state.rung_counted_sessions, x, x.date >= state.ladder_start && x.one_per_day && x.rest_spacing_ok && x.week_counted <= p('rtr.max_runs_per_week')) && (state.rung_advanced_by_backfill_last7d == 0)"}}
{"id": "SAF-083", "condition": "session.ladder != 'none' && session.clean == false", "on_unknown": "fire", "action": {"op": "set_rung", "expr": "max(state.ladder_floor_rung, state.ladder_rung_index - 1)", "then": [{"op": "floor", "target": "state.rest_days_before_next", "expr": "1"}]}}
{"id": "SAF-084", "condition": "state.unclean_weeks_on_rung > p('rtr.max_weeks_per_rung')", "on_unknown": "fire", "action": {"op": "emit_message", "msg": "MSG-SAF-001", "once": true}}
{"id": "SAF-086", "condition": "profile.never_run == true || (state.log_status == 'none' && profile.training_age_years == 0)", "on_unknown": "fire", "action": {"op": "insert_phase", "phase": "START_LADDER", "rung_expr": "'S1'"}}
{"id": "SAF-061", "condition": "age_high(today) >= p('masters.cv_advice_age') && exists(plan.sessions, s, effort_rank(s.effort_target) >= effort_rank('E3')) && (state.ctx001_applies || age_high(today) >= p('ctx.masters_age')) && !state.saf061_shown_this_season", "on_unknown": "skip", "action": {"op": "emit_message", "msg": "MSG-SAF-061", "then": [{"op": "emit_message", "msg": "MSG-SAF-STOP-SIGNS"}]}}
{"id": "SAF-085", "condition": "event.type == 'compute_weeks_needed' && state.ladder_kind != 'none'", "on_unknown": "fire", "action": {"op": "set", "target": "feas.weeks_needed.rtr", "expr": "state.ladder_kind == 'start' ? ceil_div(size(p('rtr.start_ladder')) * p('rtr.sessions_per_rung'), state.ladder_runs_per_week) : ceil_div((state.rungs_to_last + 1) * p('rtr.sessions_per_rung'), state.ladder_runs_per_week)"}}
```

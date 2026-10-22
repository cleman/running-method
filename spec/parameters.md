# Parameter register (v5.2)

Every tunable number in the method lives here; rules reference IDs only (INV-12). Changing a value is a data edit with a registry version bump, never a code change [opening-executor R2]. This register merges the "Parameters proposed" sections of modules 01, 03, 05, 06, 08, 09, 10, 11 and 14. Duplicates were merged (RESOLUTIONS P1–P4). If a module's own table differs from this file, **this file governs**.

Columns: **ID** · **Default** · **Unit** · **Range** (allowed for tuning) · **Presets** (school or population overrides) · **Grade** of the underlying evidence · **Basis** (`ev` evidence, `conv` convention, `dd` design default, `eng` engineering: display, ordering or data handling with no physiological claim; grade `N/A`, v5 p2-A R7) · **Source** · **Owner** module.

Resolution at run time: registry default → active `SchoolPreset` override → `ContextModifier`s (MIN for limits, most restrictive for gates). OPEN-1 and OPEN-2 were **DECIDED** in sub-council round 1 (RESOLUTIONS, Round 1 decisions). No value is PROVISIONAL in v3. `tid.hard_share_max.short` = 0.20 was made final in round 2.

## 1. Load safety (T2)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| spike.warn_ratio | 1.10 | × L30_eff | 1.00–1.10 | — | CREDIBLE (one observational, distance-only cohort; several summaries); cut-point ALLEGED | dd | wg4 §1; factdesk2 §1 | 05 |
| spike.block_ratio | 2.00 | × L30_eff | 1.30–2.00 | — | CREDIBLE (> 100% increase HRR 2.28, one cohort; several summaries) | dd | wg4 §1 | 05 |
| spike.apply_duration | true | bool | true | — | UNKNOWN (duration transfer) | dd | factdesk2 §1 | 05 |
| two_day.cap_ratio | 1.60 | × L30_eff (two consecutive days) | 1.30–1.80 | — | ALLEGED; v1 1.30 collapsed weekly volume (F-05) | dd | opening-contrarian I2; F-05 | 05 |
| two_day.adjacent_ratio | 0.50 | × LR(w) (day before/after the long run) | 0.40–0.60 | — | ALLEGED | dd | F-05 | 05 |
| b2b.enabled_default | false | bool | — | ultra: opt-in only | ALLEGED (no trial) | dd | wg1 §6; wg2 §4 | 09 |
| b2b.day2_ratio | 0.60 | × day 1 | 0.50–0.60 | — | CORROBORATED as practice (100K plans: day 2 ≈ 55–60%) | conv | hearing-2 coach-field; wg2 impl. 5 | 09 |
| b2b.day2_start_ratio | 0.40 | × day 1 (first pair) | 0.30–0.50 | — | ALLEGED | dd | wg2 §4 | 09 |
| b2b.pair_cap_ratio | 1.75 | × L30_eff | 1.50–1.80 | — | ALLEGED (must exceed the general two-day cap) | dd | opening-contrarian §2 | 05 |
| b2b.pair_week_share_max | 0.65 | × V(w) | 0.55–0.70 | — | CORROBORATED as derived practice (100K plans: weekend pair ≈ 55–65% of the week) | conv | hearing-2 coach-field | 05 |
| b2b.min_interval_weeks | 2 | weeks | 2–3 | — | CREDIBLE (practice) | conv | wg2 §4 | 09 |
| lod.min_run_s | 900 | s | 600–1200 | galloway 600 | UNKNOWN | dd | 05 LOD-013 | 05 |
| load.round_down_s / load.round_down_m | 60 / 100 | s / m | 30–300 / 100–500 | — | N/A (engineering) | eng | 05 | 05 |

## 2. Manual log and self-report (T2) — owner decision 21 Oct 2026

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| log.contemporaneous_window_h | 48 | h | 24–72 | — | UNKNOWN | dd | owner decision; factdesk2 §6 | 01 |
| log.min_entries_30d | 3 | runs | 2–6 | — | UNKNOWN | dd | 07 §3 | 01 |
| log.bulk_backfill_max | 5 | entries/day | 3–10 | — | UNKNOWN | dd | 07 §3 | 01 |
| log.probation_weeks | 3 | weeks | 2–4 | — | ALLEGED | dd | opening-contrarian §1.4 | 01 |
| log.pace_min_s_per_km | 165 | s/km | 150–180 | — | UNKNOWN | dd | 07 GEN-020 | 01 |
| log.pace_max_s_per_km.run / .run_walk | 900 / 1200 | s/km | 720–1080 / 900–1500 | — | UNKNOWN | dd | 07 GEN-020 | 01 |
| log.confirm_ratio | 2.00 | × L30_eff | 1.5–2.0 | — | UNKNOWN (aligned with spike.block_ratio) | dd | wg4 §1 | 01 |
| log.week_confirm_ratio | 1.50 | × max prior 4 weeks | 1.3–2.0 | — | UNKNOWN | dd | 07 GEN-020 | 01 |
| claim.l30_discount | 0.90 | × claimed | 0.75–1.00 | — | CREDIBLE (weekly distance self-report reliable; L30 claim unstudied) | dd | factdesk2 §6 | 01 |
| claim.l30_week_ratio_max | 0.60 (1.00 if claimed runs/week ≤ 1) | × claimed weekly distance | 0.5–1.0 | — | UNKNOWN | dd | 07 GEN-011 | 01 |
| claim.agegrade_confirm_pct | 80 | WMA % | 70–90 | — | CORROBORATED (bands) | conv | wg3 §1 | 01 |
| cmp.self_report_level_cap | HAB/AER/TOL/DUR 2; THR/VO2/MSP/FUEL 1 | level | 1–3 | — | UNKNOWN | dd | 02 CMP-004 | 02 |

## 3. Inputs, screening, context modifiers (T1/T3)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| inp.default_days | Tue, Thu, Sat | weekdays | any 2–4 days | — | UNKNOWN | dd | 01 INP-007 | 01 |
| inp.default_runs | 3 | runs/week | 2–4 | — | UNKNOWN | dd | wg3 §6 | 01 |
| inp.default_session_min | 30 | min | 20–45 | — | UNKNOWN | dd | 01 INP-007 | 01 |
| screen.instrument | PAR-Q+ 2023, fixed text | — | — | — | CORROBORATED | ev | wg4 §3; factdesk2 §2 | 01 |
| screen.valid_days | 365 | days | 180–365 | — | CORROBORATED | ev | wg4 §3 | 01 |
| screen.active_runs_min | 3 | sessions/week | 2–3 | — | CORROBORATED (factor) / threshold UNKNOWN | dd | wg4 §3 | 01 |
| screen.health_check_weeks | 12 | weeks | 8–26 | — | UNKNOWN | dd | 01 SCR-008 | 01 |
| perf.agegrade_bands | 60 / 70 / 80 / 90 | WMA % | — | — | CORROBORATED | conv | wg3 §1 | 01 |
| perf.competitive_min_pct | 70 | WMA % | 60–80 | — | CORROBORATED (polarized benefit in trained athletes) / cut-off dd | dd | wg1 §2 | 01 |
| ctx.novice_training_age_years | 1 | years | 0.25–1 | — | CREDIBLE (readiness criteria 3 months–1 year) | dd | wg3 §4 | 01 |
| ctx.masters_age | 50 | years | 45–55 | — | CREDIBLE (decline from ~50) | conv | wg3 §2 | 01 |
| ctx.lowfreq_runs | 3 | runs/week | 2–3 | — | CORROBORATED (cycling, untrained) | dd | wg3 §2 | 01 |
| ctx.lowfreq_quality_max | 1 | sessions/week | 0–1 | first: 3 (labelled alternative) | ALLEGED | dd | wg1 impl. 2 | 01 |
| deload.every_ctx | 3 | weeks | 2–4 | — | ALLEGED | conv | wg1 impl. 11 | 01 |

## 4. Gaps, return, illness, pain (T0–T2/T5)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| gap.reduce_trigger_days | 8 | days | 6–10 | — | ALLEGED (Daniels "< 5 d → 100%") | dd | factdesk1 §4 | 08 |
| gap.rtr_trigger_days | 30 | days | 21–30 | — | UNKNOWN (Frandsen window; gap handling unknown) | dd | factdesk2 §1; wg3 §3 | 08 |
| gap.vol_factor.8_14 / .15_29 | 0.75 / 0.50 | × prior V7 | 0.5–0.9 / 0.3–0.7 | — | UNKNOWN | dd | factdesk1 §4; wg1 impl. 8 | 08 |
| gap.long_factor.8_14 / .15_29 | 0.80 / 0.60 | × L30_eff | 0.6–0.9 / 0.4–0.8 | — | UNKNOWN | dd | factdesk1 §4 | 08 |
| miss.partial_ratio | 0.75 | × planned | 0.5–0.9 | — | UNKNOWN | dd | 08 | 08 |
| miss.repeat_week_ratio | 0.60 | × planned week | 0.5–0.8 | — | UNKNOWN (repeat-week practice CORROBORATED) | dd | wg3 impl. 4 | 08 |
| miss.fit_check_weeks | 2 | weeks | 2–3 | — | UNKNOWN | dd | hearing-1 §2 | 08 |
| illness.rest_days_min / .symptom_free_days | 10 / 7 | days | 7–14 / 5–10 | — | CORROBORATED (post-COVID; extrapolated) | ev | wg4 §5 Elliott | 08 |
| illness.stage1_min | 15 | min | 10–20 | — | CORROBORATED (Elliott stage 1) | ev | wg4 §5 | 08 |
| illness.above_neck_dur_ratio | 0.75 | × planned | 0.5–1.0 | — | CREDIBLE (convention, never trialled) | dd | hearing-1 §3 | 10 (used by 08) |
| pain.during_max | 3 | /10 | 2–3 | — | CONTRADICTED thresholds → conservative | dd | factdesk1 §2 | 08 |
| pain.next_morning_rule | true | bool | true | — | CORROBORATED | ev | factdesk1 §2 | 08 |
| pain.severe_min | 7 | /10 | 5–7 | — | CREDIBLE | dd | hearing-1 §3 | 08 |
| pain.persist_sessions / .clear_sessions | 2 / 2 | sessions | 2–3 / 1–3 | — | UNKNOWN | dd | factdesk1 §1 | 08 |
| pain.recur_count / pain.recur_window_days | 3 / 42 | ADP-052 events / days | 2–4 / 28–56 | — | count threshold UNKNOWN (no academic or field count rule); Yamato 2015 definition (≥ 7 days or 3 consecutive sessions) CORROBORATED; non-consecutive versions ALLEGED | dd | hearing-3 med-acad, med-field; p1-B R6 | 08 |
| rpe.expected_by_effort | E0 ≤ 2; E1 ≤ 3; E2 4–5; E3 6–7; E4 ≥ 8 | CR-10 | ±1 | — | CORROBORATED anchors (VT1/VT2); mapping UNKNOWN | dd | factdesk1 §3; factdesk2 §5 | 08 |
| fatigue.rpe_excess | 2 | RPE points | 1–3 | — | UNKNOWN | dd | 08 | 08 |
| fatigue.signals_required | 2 | signals | 2–3 | — | CORROBORATED principle; count UNKNOWN | dd | hearing-1 §5 | 08 |
| fatigue.window_days | 7 | days | 5–10 | — | UNKNOWN | dd | 08 | 08 |
| fatigue.persist_weeks | 2 | weeks | 2–3 | — | UNKNOWN | dd | wg4 impl. 12 | 08 |
| fatigue.refer_weeks | 3 | weeks | 3–4 | — | UNKNOWN | dd | wg4 impl. 12 | 08 |
| fatigue.clear_weeks | 1 | weeks | 1–2 | — | UNKNOWN | dd | wg4 impl. 12 | 08 |
| result.exclusion_days | 7 | days | 7–14 | — | UNKNOWN | dd | 08 | 08 |
| result.max_upgrade_pct | 3 | % pace | 2–5 | — | UNKNOWN | dd | hearing-1 §5 | 08 |
| result.confirm_window_days | 42 | days | 28–84 | — | UNKNOWN | dd | 08 | 08 |
| result.pattern_sessions | 3 | sessions | 3–4 | — | CORROBORATED principle; count UNKNOWN | dd | hearing-1 §5 | 08 |
| rtr.ladder | rungs R0–R5 (10 §4 table) | rungs | — | — | CORROBORATED (structure) / UNKNOWN (durations) | dd | factdesk1 §1; wg4 §5 | 10 |
| rtr.start_ladder | S1–S9 = NHS [state] Couch-to-5K weeks 1–9 (10 §4b): running minutes 8, ~9, 9, 16, 15/16/20, 18/20/25, 25, 28, 30; 3 clean sessions per rung, no skipping | rungs | — | — | CORROBORATED (weeks 1–5, 7, 9, wk 6 session 3); CREDIBLE (wk 6 sessions 1–2; wk 8 = 28, one variant 30); tested programmes 8–13 weeks (GRONORUN, CORROBORATED) | conv | factdesk4 §1; d2-A R1 | 10 |
| rtr.session_min | prior tol 0–2: 30; ≥ 3: 45 | min | 20–60 | — | UNKNOWN | dd | hearing-1 §3 | 10 |
| rtr.illness_r0_min | 15 | min | 10–20 | — | CORROBORATED (Elliott stage 1) | ev | wg4 §5 | 10 |
| rtr.sessions_per_rung | 3 | sessions | 2–4 | — | UNKNOWN | dd | factdesk1 §1 | 10 |
| rtr.rest_days_between | 1 | days | 1–2 | — | CORROBORATED (structure) | conv | factdesk1 §1 | 10 |
| rtr.max_runs_per_week | 4 | runs | 3–4 | — | UNKNOWN | dd | 10 | 10 |
| rtr.long_gap_days | 90 | days | 60–120 | — | UNKNOWN | dd | wg3 §3 | 10 |
| rtr.bone_pain_max | 0 | /10 | 0–2 | — | UNKNOWN | dd | factdesk1 §2 | 10 |
| rtr.max_weeks_per_rung | 3 | weeks | 2–4 | — | UNKNOWN | dd | 10 | 10 |
| flag.clearance_min_delay_days | 1 | days | 1–3 | — | UNKNOWN | dd | opening-contrarian §1.3 | 10 |
| flag.pause_kinds | cardiac, bone_stress, bone_stress_highrisk, heat, eah, pregnancy_stop, reds_escalated, pain_persistent, illness | set | — | — | CORROBORATED (stop rules) | ev | wg4 §4 | 10 |
| flag.professional_kinds | flag.pause_kinds minus illness | set | — | — | CORROBORATED (stop and refer) | ev | wg4 impl. 7 | 10 |
| flag.recur_window_days | 60 | days | 30–90 | — | UNKNOWN | dd | 10 SAF-010 | 10 |
| flag.high_risk_regions | first four body-region options of B5 | set | — | — | CORROBORATED (sites) / mapping dd | dd | factdesk1 §1 | 10 |

## 5. Special populations (T1)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| masters.vigorous_assessment_age | 65 | years | 60–65 | — | CORROBORATED (low evidence base) | ev | wg4 §3 ESC 2020 | 10 |
| masters.cv_advice_age | 35 | years | 35–40 | — | CREDIBLE | conv | wg4 §3 | 10 |
| minor.min_age | 14 | years | 14–16 | — | UNKNOWN (wg4 §6 norms do not fix a minimum) | dd | wg4 impl. 11 | 10 |
| minor.refer_below_age | 16 | years | 15–16 | — | CORROBORATED (opinion-based) | conv | wg4 impl. 11 | 10 |
| minor.adult_age | 18 | years | — | — | CORROBORATED norm | conv | wg3 §2 | 10 |
| minor.max_race_km.recommended | 14–15: 8; 16: 12; 17: 14 | km | — | — | CORROBORATED norm | conv | wg4 §6 | 10 |
| minor.max_race_km.hard | 14: 8; 15: 12; 16: 15; 17: 25 | km | — | — | CORROBORATED norm; sources differ at 16 (15 vs 16 km) → lower; age 14 has no source value → recommended 8 km | conv / dd (14, 16) | wg3 §2; wg4 §6 | 10 |
| minor.marathon_min_age / .ultra_min_age | 18 / 18 | years | — | — | CORROBORATED norm | conv | wg3 §2; wg4 §6 | 10 |
| minor.lr_cap_ratio | 1.0 | × race cap | 0.8–1.0 | — | UNKNOWN | dd | 10 SAF-044 | 10 |
| pp.min_weeks | 12 | weeks postpartum | 12–16 | — | CORROBORATED (expert) | ev | wg4 §5 Goom | 10 |
| pregnancy.mode | maintenance only, prior runners, clinician agreement | — | — | — | CORROBORATED | ev | wg4 §5 ACOG [society] 804 | 10 |
| pregnancy.max_effort | E2 | effort | E2–E3 (E3 if clinician agrees) | — | CORROBORATED (norm/expert, wg4 §5) | conv | wg4 §5 | 10 |
| pregnancy.vol_cap_ratio | 1.0 | × V28 at start | 0.7–1.0 | — | UNKNOWN | dd | wg3 impl. 6 | 10 |
| pregnancy.reattest_weeks | 12 | weeks | 8–13 | — | UNKNOWN | dd | 10 SAF-051 | 10 |
| reds.rescreen_weeks | 10 | weeks | 8–12 | — | CREDIBLE | conv | wg5 impl. 6 | 11 |

## 6. Phases, taper, deload, transition (T5)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| taper.weeks | 5K/10K/HM 2; M 3; 50K/100K 3 | weeks | 1–3 | hansons M 2 with cut_profile [0.3, 1.0] (≈ 10-day taper) | CORROBORATED (Bosquet ~2; Smyth M ≤ 3) | ev | wg1 §5; wg2 §3 | 05 |
| taper.weeks_short | ≤ HM 1; M/ultra 2 (1 if W < 3) | weeks | 1–2 | — | UNKNOWN | dd | 04 PHS-010 | 04 |
| taper.weeks.short_finish | 1 | weeks | 1–2 | — | UNKNOWN | dd | Room A R4 | 04 |
| taper.volume_cut | 0.50 | fraction | 0.41–0.60 | — | CORROBORATED | ev | wg1 §5 | 05 |
| taper.shape | progressive | enum | progressive / step | — | CORROBORATED | ev | wg1 impl. 6 | 05 |
| taper.cut_profile | T1 [1.0]; T2 [0.6, 1.0]; T3 [0.4, 0.7, 1.0] | × taper.volume_cut per week | — | hansons [0.3, 1.0] | CREDIBLE (progressive) / fractions UNKNOWN | dd | wg1 §5; hearing-1 §1 | 05 |
| taper.freq_min_ratio | 1.0 (race week excepted) | × pre-taper runs/week | 0.8–1.0 | — | CORROBORATED (frequency kept) | ev | wg1 §5 | 05 |
| deload.every | 4 (3 via deload.every_ctx) | weeks | 3–6 | — | ALLEGED/UNKNOWN | conv | wg1 §5 impl. 11 | 05 |
| deload.volume_cut | 0.25 | fraction | 0.20–0.30 | — | ALLEGED | conv | wg1 impl. 11 | 05 |
| deload.quality_max | 1 | sessions | 0–2 | — | ALLEGED | dd | wg1 impl. 11 | 05 (used by 06) |
| deload.min_plan_weeks | 6 | weeks | 5–8 | — | UNKNOWN | dd | 04 PHS-003 | 04 |
| deload.exclusion_before_taper | 2 | weeks | 1–2 | — | UNKNOWN | dd | 04 PHS-002 | 04 |
| deload.min_gap_weeks | 2 | loading weeks between deloads | 2–3 | — | UNKNOWN | dd | F-07 | 04 |
| transition.vol_max_ratio | 0.50 | × pre-taper V_ref | 0.3–0.6 | — | ALLEGED | dd | 04 §1 | 05 |
| phs.onboard_weeks | 2 | weeks | 2–4 | — | UNKNOWN | dd | opening-outsider §2 | 04 |
| phs.specific_min | 5K/10K 2; HM 3; M 4; ultra 4 | weeks | 1–6 | — | CREDIBLE (convention) | dd | wg2 §1 | 04 |
| phs.specific_target | 5K 4; 10K 4; HM 6; M 8; 50K 8; 100K 10 | weeks | 2–12 | 09 may override | CREDIBLE | dd | wg2 §1–2 | 04 |
| phs.build_min / .build_max | 1 / 8 | weeks | 0–2 / 6–12 | — | UNKNOWN | dd | 04 §3 | 04 |
| phs.season_max_weeks | 24 | weeks | 16–30 | — | CORROBORATED (published plans 12–24 wk, description) | dd | wg2 §1–2 | 04 |
| phs.final_season_min_weeks | 12 | weeks | 8–16 | — | UNKNOWN | dd | 04 §3 | 04 |
| phs.transition_weeks | 5K/10K/HM 1; M 2; ultra 2 | weeks | 1–4 | — | ALLEGED | dd | hearing-1 §2 | 04 |
| maint.sessions_min | 2 | runs/week | 2–3 | — | CORROBORATED | ev | wg1 §5 Spiering | 04 |
| maint.max_weeks | 15 | weeks | 8–15 | — | CORROBORATED (VO2max only) | ev | wg1 §5 | 04 |
| maint.volume_cut_max | 0.50 | fraction | 0.33–0.66 | — | CORROBORATED (general population) | ev | wg1 §5 | 05 |

## 7. Progression, long run, intensity distribution (T5/T6)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| prog.standard.week_max / .2wk_max | 0.15 / 0.30 | fraction | 0.10–0.20 / 0.20–0.30 | — | CORROBORATED figures, weak (non-significant) | dd | wg4 §1, impl. 3 | 05 |
| prog.slow.week_max / .2wk_max | 0.10 / 0.20 | fraction | 0.05–0.10 / 0.10–0.20 | — | CORROBORATED that 10% is convention only | conv | wg4 §1 Buist | 05 |
| prog.baseline_max_age_weeks | 2 | weeks | 2–3 | — | UNKNOWN | dd | wg3 §3 | 05 |
| prog.est.week_max | 0.10 | fraction above week.est_base_s (best logged week of the window), while the baseline is unconfirmed (LOD-007, v5.1) | 0.05–0.10 | — | UNKNOWN as a safety limit: the weekly 10% rule did not lower injuries in its RCT (GRONORUN 20.8% vs 20.3%, wg4 §1, CORROBORATED) and week-to-week change showed no injury association (Frandsen 2025, CREDIBLE, one cohort); kept as a conservative convention for unverified starting volume | dd | wg4 §1; external review v5 item 4 | 05 |
| prog.est.window_weeks | 4 | completed weeks looked back for week.est_base_s | 3–6 | — | UNKNOWN (matches the 4-week claim window of 01 §1.2) | dd | external review v5 item 4 | 05 |
| prog.est.confirm_weeks | 6 | consecutive logged weeks that confirm the baseline (LOD-008) | 4–8 | — | UNKNOWN | dd | external review v5 item 4 | 05 |
| prog.est.confirm_ratio | 0.80 | × planned weekly time, logged from measured entries, for a week to count (LOD-008) | 0.70–0.90 | — | UNKNOWN; manual weekly logs fairly reliable (factdesk2 §6, CREDIBLE) | dd | external review v5 item 4 | 05 |
| lr.pct_cap.<preset>.<family> | method_default: short **and base** (v4) by run count **0.60 (2 runs, v4)** / 0.45 (3) / 0.40 (4) / 0.30 (≥ 5), road_classic **0.50**, ultra → lr.ultra_pct_cap; daniels 0.25; higdon_novice 0.50; hansons, pfitzinger_classic, galloway: none | × weekly **time** | 0.20–0.60 | per preset × family (05 §4, INV-26) | 0.50 CORROBORATED as description of novice plans; C25K longest run 33–40% of the week CREDIBLE [factdesk4 §5]; Daniels 25% CORROBORATED; injury link UNKNOWN | conv / dd | wg2 §1–2; factdesk3 §4, §7; d2-A R3 | 05 |
| lr.over_cap_pct.road_classic | 0.60 | × weekly time, for road long runs above the time cap (floor and extension runs) | 0.55–0.65 | — | UNKNOWN (matches the ultra peak-week cap) | dd | d2-B R2 | 05 |
| lr.floor_time_max_min.<distance> | M 240; HM 150 (= cap); 50K 240 and 100K 330 (= ultra time caps; v4 one formula); short = cap | min (time on feet incl. walks) | M 210–270 | — | coaching convention / design default; duration–injury UNKNOWN | dd | d2-B R2; p1-A R7 | 03 |
| lr.m_ext_km / .m_ext_max_runs / .m_ext_min_gap_days | 29 / 3 / 21 | km / runs / days | 26–32 / 1–3 / 14–28 | method_default M only | 18 mi from the Toresdahl cohort, CREDIBLE (one cohort; several summaries) for the association (continuous OR 0.87 CREDIBLE); counts and spacing dd | dd | factdesk3 §5; factdesk4 §2; d2-B R3 | 09 |
| lr.over180_min_gap_days | 14 | days between runs expected > 180 min (all families; a back-to-back pair counts once) | 14–21 | DST-019 extension runs keep 21 | CORROBORATED as practice (Galloway alternate weeks); CREDIBLE (Koop 2–3-week peaks); count/spacing–injury UNKNOWN | conv | factdesk4 §4; wg2 §4; p1-B R5 | 05 |
| lr.pct_floor_s | 3600 | s | 2700–4500 | — | UNKNOWN | dd | wg2 §1 | 05 |
| lr.pct_monotone | true | bool | — | — | N/A (engineering) | eng | wg2 §1 | 05 |
| lr.time_cap_min.<preset>.<distance> | method_default: short 150, HM 150, **M 180**; daniels 150; galloway **240** (time on feet incl. walks, v3) | min | 120–240 | per preset × distance | **coaching convention**: no evidence links single-run duration to injury (UNKNOWN); field practice 2.5–3 h CORROBORATED as practice; Galloway's long runs reach 26 mi, CORROBORATED [factdesk4 §4] | conv / dd (180) | hearing-2 med-acad, med-crit, coach-field; factdesk3 §4; factdesk4 §4 | 05 |
| lr.abs_cap_km.<preset> | method_default M 32; hansons 26; pfitzinger_classic 35; higdon_novice 32; others none | km | — | per preset | CORROBORATED/CREDIBLE | conv | wg2 §1; Room B R1 | 05 |
| lr.ultra_pct_cap | 0.60, **peak long-run weeks only** — DECIDED round 1 | × weekly time | 0.50–0.70 | all presets when Goal.family = ultra | CREDIBLE as a practice range (hearing-2); value UNKNOWN | dd | Room C R1; hearing-2 coach-field; wg2 §1, §4 | 09 |
| lr.ultra_time_cap_min.<distance> | **50K 240; 100K 330** (v3); when it binds above the distance floor → LONG_RUN_TIME_CAPPED (stretch for time goals, information for finish goals, FEA-003 v4), below → infeasible (FEA-003); runs > 180 min need TOL L4 measured | min | 50K 210–270; 100K 240–360 | all presets when family = ultra | coaching convention: 50K plans peak ~3:15 h (CORROBORATED range), 100K 5–6 h (CORROBORATED as practice); duration–injury UNKNOWN | conv | factdesk3 §8; hearing-2 coach-field; d2-C R3 | 09 |
| lr.ultra_peak_every_weeks | 2 | weeks | 2–3 | koop_ultra | CREDIBLE | conv | wg2 §4 | 09 |
| tid.model | pyramidal | enum | pyramidal / polarized | norwegian_elite polarized; opt-in LOD-032 | CORROBORATED (small effects) | ev | wg1 §2 | 05 |
| tid.easy_share_min | 0.75 | fraction of time E0–E1 | 0.70–0.85 | polarized 0.80 | CORROBORATED (~80% easy) | conv | wg1 impl. 2; wg2 §2 | 05 |
| tid.hard_share_max.<family> | short **0.20 (final, v3)**; road_classic 0.10; ultra 0.10 | fraction of weekly time at E3–E4 | short 0.15–0.25 | polarized: road/ultra 0.12, **short 0.20**; preset fixtures may declare their own | short: top of tested doses (10–20% zone 3, CREDIBLE); counting all of E3 is conservative; practice share UNKNOWN; road: CORROBORATED as description (Knopp ~6%) | conv / dd | hearing-2 coach-acad; factdesk3 §1; wg2 §2; d2-A R5 | 05 |
| tid.e2_share_max | 0.20 | fraction of time E2 | 0.05–0.25 | polarized 0.05 | CORROBORATED as description | conv | wg2 §2 | 05 |
| quality.per_week | method_default by phase (quality.method_default) | sessions | 0–5 | daniels 2; hansons 3; pfitzinger_classic 2–3; higdon_novice 0; first 3; norwegian_elite 4–5 (gated) | CORROBORATED (first three) | conv | wg2 impl. 7 | 06 |
| quality.method_default | ONBOARD/RTR/TRANSITION 0; BASE ≤ 1; BUILD/SPECIFIC 2 | sessions | 0–2 | — | CORROBORATED (school range) | dd | wg2 impl. 7 | 06 |
| quality.counts_long | false | bool per preset | — | hansons, first: true; pfitzinger_classic: medium-long run only | CORROBORATED (structure) | conv | wg2 §1; wg3 §3 | 06 |
| cmp.decay_weeks | 6 | weeks | 4–8 | — | CORROBORATED direction, size UNKNOWN | dd | wg3 §3 | 02 |
| cmp.min_weeks_per_level.<node> | 4 (TOL/AER derived from the progression profile) | weeks | 3–8 | — | UNKNOWN | dd | 02 §5 | 02 |
| cmp.pace_split_tol | 0.03 | fraction | 0.02–0.05 | — | UNKNOWN | dd | 02 PACE | 02 |
| cmp.weight.<distance>.<node> | 02 §5 table | weight | each column sums to 1 | — | CREDIBLE (synthesis) | dd | wg1 §1 | 02 (09 may refine) |
| cmp.required.<distance>.<node> | 02 §5 table (v3: 10K AER 1 / TOL 1; HM HAB 2; **M finish HAB 2** (HAB 3 for time goals); 50K HAB 3, **AER 3**; 100K AER 4 / TOL 4) | level | ±1 | — | CORROBORATED tiers / ALLEGED thresholds; Toresdahl ≥ 4 runs/week associated with training injury (possibly confounded) | dd | wg2 §4; wg3 §4; factdesk4 §2; Rooms A–C, d2-B R5, d2-C R4 | 02 |

## 8. Sessions (06) and distance families (09)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| ses.dose.<SES-M-id> | 06 §2 "Dose" column | segments | ±50% | per 06 §5 | ALLEGED (practice) | dd | hearing-1 §2 | 06 |
| ses.warmup_s / .cooldown_s | 600 / 300 | s | 300–900 / 0–600 | — | ALLEGED | conv | practice | 06 |
| ses.easy_min_min | 20 | min | 15–30 | — | UNKNOWN | dd | opening-contextrealist | 06 |
| ses.runwalk.ladder | 1:2, 1:1, 2:1, 3:1, 5:1, 8:1, continuous | min run : min walk | — | galloway ratios by pace | CORROBORATED (2:1 beginner) / ALLEGED (ladder) | dd | wg2 §1 | 06 |
| ses.runwalk.sessions_per_rung / .rpe_max | 2 / 4 | sessions / CR-10 | 2–4 / 3–5 | — | ALLEGED | dd | factdesk1 §1 | 06 |
| ses.progress_rpe_margin | 1 | RPE points | 0–2 | — | ALLEGED | dd | wg1 §3 | 06 |
| ses.exit_ready_sessions | 2 | instances | 1–3 | — | UNKNOWN | dd | 02 CMP-002 | 06 |
| ses.exit_retest_weeks | 3 | weeks | 2–6 | — | UNKNOWN | dd | 06 | 06 |
| ses.drift_window_min / .drift_rpe_max | 20 / 2 | min / RPE | 10–30 / 1–3 | — | UNKNOWN (no durability field test) | dd | wg1 §1 | 06 |
| ses.exit.THR2_min / .THR4_min | 25 / 45 | min at E3 | 20–30 / 45–60 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.VO2_3_min | 18 | min at E4 | 16–20 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.DUR3_min | 135 | min | 120–150 | — | ALLEGED | dd | 02 §2 | 06 |
| ses.exit.ECO_weeks | 6 | weeks | 4–8 | — | UNKNOWN | dd | 06 | 06 |
| ses.retest_lead_days | 14 | days | 7–28 | — | UNKNOWN | dd | 07 §3 | 06 |
| ses.ft0_min | 30 | min | 20–30 | — | N/A (engineering: = HAB L2) | eng | 02 §2 | 06 |
| ses.ft1_dist_m | 3000 | m | 2000–5000 | — | UNKNOWN (test choice) | dd | factdesk1 §3 | 06 |
| ses.ft2_dists_m | 400 + 2000 | m | or 2–3 recent races | — | CORROBORATED (n = 34) | ev | factdesk1 §3 | 06 |
| ses.taper_touch | 4 × 1 min E4 or 2 × 5 min E3 inside an easy run | segments | — | — | CORROBORATED (keep intensity) / dose ALLEGED | dd | wg1 §5 | 06 |
| ses.strength_per_week / .strength_session_min | 2 / 20 | sessions / min | 1–3 / 15–40 | — | CORROBORATED (economy); injury effect UNKNOWN | conv | wg1 §6 | 06 |
| ses.strides_per_week | 2 | sessions | 1–3 | — | ALLEGED | conv | 02 ECO L1 | 06 |
| ses.medlong_ratio | 0.65 | × current long run | 0.55–0.75 | pfitzinger_classic | CREDIBLE | conv | wg2 §1 | 06 |
| ses.race_effort | 5K E4; 10K E3/E4; HM E3; M E2; 50K E1/E2; 100K E1 | effort | — | — | CORROBORATED anchors / mapping dd | dd | factdesk1 §3; wg1 §1 | 06 |
| dst.phase_nodes | 09 §3 table | node sets | — | koop_ultra = ultra row | CORROBORATED structure / CREDIBLE ultra | dd | hearing-1 §2; wg2 §4 | 09 |
| dst.ultra_build_split | 0.33 / 0.33 / 0.34 | share of BUILD (VO2 / THR / steady) | ±0.15 | koop_ultra | CREDIBLE order, UNKNOWN dose | dd | wg2 §4 | 09 |
| dst.msp_share.<d>.L1 / L2 / L3 | 0.10 / 0.30 / 5K 0.75, 10K 0.65, HM 0.55, M 0.50 | share of race duration | L3 ±0.15 | — | ALLEGED | dd | 02 §2; wg2 §1 | 09 |
| dst.race_long_every_weeks | 2 | weeks | 1–3 | pfitzinger_classic 2 | CREDIBLE | conv | hearing-1 §1 | 09 |
| dst.msp_every_weeks | 2 | weeks (time goals, SPECIFIC) | 1–3 | — | CORROBORATED (rising specificity) / interval dd | dd | Room A R3 | 09 |
| dst.msp_segment_max_min | M 90; HM 40 | min | M 60–100; HM 30–50 | — | ALLEGED (Hansons 10 mi MP) | dd | Room B R5 | 09 |
| dst.ultra_alt_long_ratio | 0.70 | × last peak | 0.6–0.8 | — | ALLEGED | dd | wg2 §4 | 09 |
| dst.tuneup_dist_km | 50K: 42.2; 100K: 50 | km | 100K 50–56 | — | CREDIBLE (Comrades) / dd for 50K | conv | wg2 §4 | 09 |
| dst.tuneup_weeks_out | 5 | weeks before race | 4–6 | — | CREDIBLE | conv | wg2 §4 | 09 |
| dst.tuneup_recovery_days | 7 | days | 5–10 | — | ALLEGED | dd | hearing-1 §2 | 09 |
| preset.compat.<id> | 09 §7 table | days, min/week | — | per preset | CREDIBLE (description of the published plans, wg2 §1) | conv | wg2 §1; opening-statusquo | 09 |

## 9. Goal, feasibility, prediction, repair (T4)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| race.longest_ratio_max.5K / .10K / .HM | 1.30 / 1.25 / 1.30 | race ÷ peak long run | 1.0–1.5 | — | 5K: CREDIBLE (Couch-to-5K reaches 30 min continuous, then a 5K, F-18); 10K/HM UNKNOWN (HM: long run > 21 km associated with faster HM) | dd | factdesk3 §2; factdesk1 §7 | 03 |
| race.longest_ratio_max.M | method_default **1.40** (30.1 km); daniels 2.00; hansons 1.65; pfitzinger_classic 1.30; higdon_novice **1.32**; galloway 1.60 — DECIDED round 1 | ratio (time demand capped by lr.time_cap_min) | 1.3–2.6 | per preset | Hansons 16 mi CORROBORATED; others UNKNOWN; longer longest run → fewer race-day injuries CORROBORATED (association) | dd | Room B R1–R2; factdesk3 §5 | 03 |
| race.longest_floor_ratio.<distance>.<preset> | **all active presets:** M 2.00 (21.1 km); HM 1.60 (13.2 km); **50K 2.00 (25 km); 100K 3.00 (33.3 km)**; short = longest_ratio_max | race ÷ minimum peak long run (distance) | M 1.8–2.2; 100K 2.5–3.5 | declared per preset (INV-26) | CREDIBLE (one cohort; several summaries) for the direction (NYC first-timers); ultra floors below practice 30–42 km (ALLEGED/CORROBORATED as practice); values dd | dd | Room B R1; factdesk3 §5; d2-B R7; d2-C R1 | 03 |
| race.5k_finish_lr_min | 30 | min (continuous or run-walk) | 25–35 | — | CREDIBLE (Couch-to-5K exit: 30 min continuous, then a 5K) | conv | factdesk4 §1; d2-A R2 | 03 |
| race.longest_ratio_max.50K | 1.60 | ratio | 1.4–1.8 | — | CREDIBLE (Comrades 50–56 km about 5 weeks out) | dd | wg2 §4 | 03 |
| race.longest_ratio_max.100K | 2.50 | ratio | 2.2–3.0 | — | ALLEGED (100 km plans longest 30–42 km) | dd | wg2 §4 | 03 |
| feas.finish_floor.peak_week | 5K 3 runs; 10K 90 min; HM 150 min; M 240 min and 32 km; 50K 50 km; 100K 60 km | time/dist | ±25% | — | ALLEGED (readiness thresholds); Comrades finish tier CORROBORATED | dd | wg3 §4; factdesk1 §7; wg2 §4 | 03 |
| feas.planning_speed_margin | 0.10 | fraction | 0.05–0.20 | — | CREDIBLE (pace self-report moderate) | dd | factdesk2 §6 | 03 |
| feas.default_planning_pace_s_per_km | 480 | s/km | 420–600 | — | UNKNOWN | dd | 03 | 03 |
| feas.stretch_margin_weeks | 2 | weeks | 1–4 | — | UNKNOWN | dd | opening-contrarian §1.1 | 03 |
| pred.band_min_pct | 7 | ± % | 6–8 | — | CORROBORATED (5.9–8% errors) | ev | wg1 §7 | 03 |
| pred.band_widen_estimated | 1.5 | × band | 1.2–2.0 | — | UNKNOWN (self-reported race-time accuracy) | dd | factdesk2 §6 | 03 |
| pred.marathon_from_half | 2.19 | × half time | 2.10–2.20 | — | CREDIBLE | conv | wg1 §7 | 03 |
| pred.riegel_exp_min | 1.06 | exponent | 1.06–1.15 | — | CORROBORATED (Riegel too fast for M) | ev | wg1 §7; wg3 §4 | 03 |
| pred.low_volume_km_week | 48 | km/week | 32–48 | — | ALLEGED thresholds / CORROBORATED direction | dd | wg3 §4; factdesk1 §7 | 03 |
| pred.low_volume_widen | 1.5 | × slow half-band | 1.0–2.0 | — | UNKNOWN | dd | wg1 §7 | 03 |
| pred.max_extrapolation_ratio | 4.5 | target ÷ anchor distance | 2–8 | — | UNKNOWN | dd | wg1 §7 | 03 |
| pred.ultra_mode | range only, low confidence | — | — | — | UNKNOWN formula | dd | wg1 §7 | 03 |
| pred.ultra_exp_low / .ultra_exp_high | **1.06** / 1.30 (v4) | exponent | 1.05–1.10 / 1.20–1.40 | — | low edge: Riegel 1.06 CORROBORATED (only grounded value; Comrades fit 1.05 ALLEGED); high edge UNKNOWN; no published marathon→ultra exponent [factdesk5 §3, UNKNOWN] | conv (low) / dd (high) | wg1 §7; factdesk4 §10; factdesk5 §3; p1-A R8 | 03 |
| pred.taper_gain_pct | 2 | % | 0–3 | — | CREDIBLE (one origin) | dd | wg1 §5 | 03 |
| pred.round_s | 60 | s | 30–300 | — | N/A (engineering) | eng | 03 | 03 |
| anchor.max_age_days | 120 | days | 60–180 | — | UNKNOWN | dd | 07 §3 | 03 |
| goal.date_search_max_weeks | 52 | weeks | 26–104 | — | N/A (engineering) | eng | 07 §6.2 | 07 |
| goal.edit_fail_limit / .edit_window_days / .edit_margin_weeks | 3 / 7 / 1 | count / days / weeks | 2–5 / 3–14 / 1–2 | — | N/A (engineering) | eng | opening-contrarian | 07 |
| goal.edit_margin_pct | 1 | % of target time | 0–3 | — | UNKNOWN | dd | opening-contrarian §2 | 03 |
| pred.checkpoint_weeks | 6 | weeks between field tests for an ambitious long-horizon target | 4–8 | — | UNKNOWN | dd | Room A R8 | 03 |
| feas.peak_credit_days | 70 | days before the race within which a logged peak long run counts | 42–84 | — | UNKNOWN (durability retention) | dd | F-21 | 03 |
| pace.deadband_pct | 3.5 | % change of the 10K-equivalent below which a new result is treated as noise (v5.1: a change above it but ≤ the minimum detectable change moves paces only when confirmed, ADP-067) | 2–5 | — | **CREDIBLE** (v5.1: recreational retest CV 5K 3.44%, 10K 2.43%, Machado 2015 — a single study, so CREDIBLE however many records repeat it; v5 had CORROBORATED); trained 1–1.5% CORROBORATED | dd | factdesk3 §3; factdesk4 §6; hearing-2 sys | 03 |
| pace.test_te_pct | 3.4 | % typical error of one recreational 5K/10K test (as CV) | 2.4–3.5 | — | CREDIBLE (Machado 2015, single study, n = 31: 5K CV 3.44%, 10K 2.43%); trained runners 1–1.5% CORROBORATED | dd | factdesk3 §3; factdesk4 §6; external review v5 item 3 | 08 |
| pace.mdc_mult | 2.8 | × pace.test_te_pct = minimum detectable change of one test (2.8 × 3.4 ≈ 9.5%) | 2.0–2.8 | — | CREDIBLE as to the typical error it multiplies (single study); 2.8 ≈ 1.96 × √2, the usual 95% minimum-detectable-change formula, stated from memory (ALLEGED) | dd | external review v5 item 3 | 08 |
| pred.band_same_distance_pct / pred.same_distance_max_age_days | 4 / 56 | % fast half-width / days | 3–5 / 28–84 | — | CREDIBLE (retest CV 2.4–3.4% recreational, Machado 2015, single study; v5.1) | dd | factdesk4 §6; d2-A R6 | 03 |
| pace.e3_low / .e3_high | 0.92 / 0.97 | × CS speed | 0.90–0.98 | — | CORROBORATED direction (threshold below CS) / values dd | dd | factdesk1 §3 | 03 |
| pace.e1_low / .e1_high | 0.72 / 0.92 | × M-equivalent speed | 0.65–0.95 | — | ALLEGED (inferred from Daniels' easy vs marathon intensities); talk test governs | dd | factdesk1 §3 | 03 |
| pace.round_s | 5 | s/km | 1–10 | — | N/A (engineering) | eng | 03 §3b | 03 |
| replan.published_days | 7 | days | 3–14 | — | CORROBORATED general practice (frozen horizon); 7-day lock ALLEGED (one vendor) | dd | hearing-2 sys-acad, sys-field | 08 |
| repair.max_passes / .max_options | 3 / 4 | count | 1–5 / 3–5 | — | N/A (engineering) | eng | opening-systemsarchitect §3 | 07 |

## 10. Fuelling, hydration, heat, daily nutrition (11)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| fuel.required_above_min | 90 | min race duration | 75–90 | — | CORROBORATED | ev | wg5 impl. 3 | 11 |
| fuel.band.by_duration | < 45 min 0; 45–75 optional; 1–2.5 h 30–60; > 2.5 h 60–90 | g/h | — | — | CORROBORATED | ev | wg5 §3 | 11 |
| fuel.max_default_g_h | 90 | g/h | 60–90 | — | CORROBORATED (> 90 benefit UNKNOWN) | ev | wg5 §3 | 11 |
| fuel.start_g_h / .step_g_h | 30 / 15 (v5.2: one value, owner Q5; was 10–15) | g/h | 20–40 / 10–15 | — | CREDIBLE | conv | wg5 §5 | 11 |
| fuel.step_runs / .exit_runs | 2 / 2 | runs | 1–2 / 2–3 | — | CREDIBLE | conv | wg5 §5, impl. 3 | 11 |
| fuel.gi_pass_max | 2 | /10 | 1–3 | — | CREDIBLE | conv | wg5 impl. 3 | 11 |
| fuel.gi_stepdown_min | 5 | /10 | 4–6 | — | UNKNOWN | dd | 11 | 11 |
| fuel.practice_min_duration_min | 60 | min | 60–75 | — | CORROBORATED (bands start at 1 h) | dd | wg5 §3 | 11 |
| fuel.l4_min_race_h | 2.5 | h | — | — | CORROBORATED | ev | wg5 §3 | 11 |
| fuel.dual_source_above_g_h | 60 | g/h | — | — | CORROBORATED | ev | wg5 §3 | 11 |
| hyd.no_test_cap_ml_h | 800 | mL/h | 600–800 | — | UNKNOWN | dd | wg5 impl. 4 | 11 |
| hyd.abs_cap_ml_h | 1000 | mL/h | 800–1200 | — | CORROBORATED (> 1.5 L/h a risk factor); value dd | dd | wg5 §4 | 11 |
| hyd.sweat_test_min_min | 60 | min | 45–90 | — | UNKNOWN | dd | wg5 §4 | 11 |
| eah.warning_above_h | 4 | h | 3–4 | — | CORROBORATED | ev | wg5 §4 | 11 |
| heat.acclim_days | 10 (v5.2: one value, owner Q8; was 7–14) | exposure days | 7–14 | — | CORROBORATED | ev | wg5 §4 | 11 |
| heat.acclim_window_days | 21 | days before race | 14–28 | — | UNKNOWN (window) | dd | wg5 §4 | 11 |
| caffeine.default / .max | 3 / 6 | mg/kg | 2–3 / 3–6 | — | CORROBORATED | ev | wg5 §3 | 11 |
| cho.daily_bands | light 3–5; ~1 h 5–7; 1–3 h 6–10; ≥ 4 h 8–12 | g/kg/day | — | — | CORROBORATED range; CREDIBLE edges | ev | wg5 §1 | 11 |
| cho.loading_band | 10–12 for 36–48 h | g/kg/day | — | — | CORROBORATED (glycogen) / UNKNOWN (benefit) | ev | wg5 §1 | 11 |
| protein.daily_band | 1.2–2.0 | g/kg/day | — | — | CORROBORATED | ev | wg5 §1 | 11 |
| trainlow.min_aer_level | 3 | level | 3–4 | — | UNKNOWN ("advanced only" CREDIBLE) | dd | wg5 impl. 7 | 11 |

## 11. Validation and benchmarks (14)

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| knopp.range | weekly mean 43 / 59 / 108 km by tier; longest 31–35 km; Z4–5 ≈ 6% | — | — | — | CORROBORATED as description | ev | wg2 §2 | 14 (values); INV-23 defined in 07 |
| knopp.range.ultra | **100K only**: finish 45–50; Bronze 50–65; 60–70; 75–80; Silver 100–120 (50K: no source → silent) | km/week peak by goal tier | — | — | CORROBORATED (description) | ev | wg2 §4; Room C R6 | 14 |
| val.conformance_tol_pct | 10 | % | 5–15 | — | UNKNOWN | dd | opening-statusquo §3 | 14 |
| val.removal_material_pct | 5 | % | 2–10 | — | UNKNOWN | dd | opening-firstprinciples §2 | 14 |
| val.property_cases_min | 100000 | cases | ≥ 10000 | — | N/A (engineering) | eng | 14 | 14 |
| val.comprehension_n / .comprehension_pass_pct | 8 / 80 | runners / % | 5–8 / 70–90 | — | UNKNOWN | dd | opening-outsider §3 | 14 |
| val.pilot_n | 60 | runners | 40–150 | — | UNKNOWN (no power basis: no effect claimed) | dd | 14 | 14 |
| val.pilot_min_hours | 2000 | h | 1000–5000 | — | UNKNOWN | dd | 14 | 14 |
| val.injury_days_lost | 7 | days | 1–14 | — | UNKNOWN (definitions vary) | dd | wg4 §2 | 14 |
| val.long_run_review_ratio | 1.5 | injury rate ratio, weeks with a long run > 150 min vs other weeks | 1.2–2.0 | — | UNKNOWN | dd | Room B R6 | 14 |

## 12. Review queue

First in line for the plenary and the fact desk:
- `lr.m_ext_*`: the extension runs; Toresdahl's adjustment set is unknown
- the ultra floors
- `lr.ultra_time_cap_min.50K`
- `cmp.required.50K.AER` (dissent)
- `lr.pct_cap.short` by run count
- `feas.peak_credit_days`
- `two_day.*`, `b2b.*`
- `feas.finish_floor.*`, `gap.*`, `claim.*`, `deload.every`, phase lengths
- `pred.ultra_exp_*` (exponent evidence ALLEGED, factdesk4 §10)

## 13. Display rounding (v4, p1-C R7) — owner: messages.md

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| display.duration_round_min | 5 (≤ 60 min: 5; > 60 min: 10) | min | 1–10 | — | N/A (engineering) | eng | p1-C R7 (avoid false precision, e.g. "198 min") | 12 |
| display.distance_round_km | 0.5 (long runs ≥ 20 km: 1) | km | 0.1–1 | — | N/A (engineering) | eng | p1-C R7 | 12 |
| display.time_round_s | 60 (≤ 30 min races: 15) | s | 5–60 | — | N/A (engineering) | eng | p1-C R3 | 12 |
| display.pace_round_s | 5 | s/km | 1–10 | — | N/A (engineering) | eng | 03 §3b | 12 |
| display.max_reasons_card | 2 | reasons | 1–3 | — | N/A (engineering) | eng | p1-C R1 | 12 |

## 14. Added in v5 (plenary round 2)

Every row has a grade or basis `eng` (TST-121 checks this for the whole register).

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| inp.no_unknown_fields | PAR-Q+ items and follow-ups; symptom items C, B, H, E, P, I; special_status; birth_month; birth_year; guardian_attestation | field list | may only grow | — | N/A (engineering) | eng | p2-C R1 (case 1, A1) | 01 |
| lr.long_guard_min | 180 | min | 150–180 | — | UNKNOWN (no study of runs > 3 h; coaching practice 150–180 min, hearing-2 coach-field, CORROBORATED as practice) | dd | hearing-2 med; p1-B R3; p2-B R4 (replaces the literal 10800) | 05 |
| lr.long_guard_tol_level | 4 | TOL level | 4–5 | — | UNKNOWN | dd | LOD-017, INV-28 | 05 |
| pain.answered_min_ratio | 0.7 | share of the last 14 days' sessions with an answered pain prompt | 0.6–0.8 | — | CORROBORATED for the anchor (pooled EMA compliance 75%, CI 72–78%, factdesk6 §3); the value itself UNKNOWN | dd | p2-C R3 (room proposed 0.8; see RESOLUTIONS Plenary 2) | 05 |
| pain.hold_step_weeks | 2 | weeks | 1–2 | — | UNKNOWN | dd | 08 ADP-051 ("this week and next") | 08 |
| claim.l30_cap_by_tol | TOL 0: 30; TOL 1: 60; TOL 2: 90; TOL 3: 120; TOL ≥ 4: no cap | min | ± 30 | — | UNKNOWN | dd | p2-C R7 (case 7) | 07 |
| claim.l30_check_min_runs | 2 | runs/week | — | — | N/A (engineering: a single weekly run makes L30 = weekly distance legitimate) | eng | 07 GEN-022 | 07 |
| race.recovery_days | 5K 7; 10K 10; HM 14; M 28; 50K 42; 100K 42 | days between goal races | 5K 3–7; 10K 6–10; HM 13–21; M 26–42; ultra 21–60 | — | CORROBORATED as convention for road (≈ 1 easy day per mile: 3/6/13/26 days, factdesk6 §1); ultras CONTRADICTED (conventions differ ×10); no marker minimum for 5K/10K (UNKNOWN). Defaults sit at or above the convention | dd | p2-C R8 (case 8), INV-31 | 07 |
| ladder.est_pace_s_per_km | 660 | s/km, run-walk at S5+ | 600–720 | — | UNKNOWN (run-walk practice, wg2 §1, CORROBORATED, gives no speed) | dd | p2-C R10 (FEA-043b) | 03 |
| ladder.runwalk_race_min_rung | 5 (S5) | rung index | 4–6 | — | UNKNOWN | dd | 03 FEA-043b | 03 |
| pp.due_ask_days | 14 | days before due_date | 7–21 | — | UNKNOWN (timing); the need to re-enter after birth: Goom 2019, factdesk5 §7, CORROBORATED | dd | p2-C R4 | 10 |
| anchor.jump_confirm_mult | 2 | × pace.deadband_pct | 1.5–3 | — | CREDIBLE for the scale (retest CV 2.4–3.4%, Machado 2015, single study, factdesk4 §6; v5.1); multiplier UNKNOWN | dd | p2-C R6 (INP-025) | 01 |
| result.rpe_high | 8 | RPE 0–10 | 7–9 | — | UNKNOWN | dd | p2-C R6 (ADP-066) | 08 |
| result.rpe_high_sessions | 2 | consecutive sessions ≥ E3 | 2–3 | — | UNKNOWN | dd | p2-C R6 (ADP-066) | 08 |
| cmp.heat_required_level | 2 | HEAT level | — | — | N/A (engineering: 03 FEA-004 names L2) | eng | 03 FEA-004 | 03 |
| phs.sharpen_max_weeks | 4 | weeks | 3–5 | — | UNKNOWN | dd | 04 PHS-010/011 | 04 |
| b2b.min_dur_level / .min_tol_level | 4 / 5 | levels | — | — | N/A (engineering: DUR L5 prerequisites of 02) | eng | 09 DST-010 | 09 |
| miss.refeas_hold_weeks | 2 | consecutive ADP-022 weeks before feasibility re-runs | 2–3 | — | UNKNOWN | dd | 08 ADP-023 | 08 |

## 15. Added in v5.2 (Engine session, part A)

Every row is a design default unless its basis says `eng`. "Owner Q" = the plain-language question put to the owner on 22 Oct 2026; the owner accepted every recommended answer (CHANGELOG-v5.2 §2).

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| engine.max_iterations | 5 | passes per stage | 3–10 | — | N/A (engineering: fixpoint bound, 12 §3.7) | eng | gap/engine.md Q3 | 12 |
| ask.no_answer_days | 7 | days before an ask_confirm counts as unanswered | 3–14 | — | N/A (engineering) | eng | gap/engine.md §1 #9 | 12 |
| quality.min_hab_level | 2 | HAB level below which no key session is planned | — | — | N/A (engineering: restates SES-007's "HAB < L2") | eng | 06 SES-007 | 06 |
| quality.low_tol_level | 2 | TOL level at or below which at most 1 key session is planned | — | — | N/A (engineering: restates SES-007's "TOL ≤ L2") | eng | 06 SES-007 | 06 |
| quality.method_default_max | 2 | key sessions per week (BUILD, SPECIFIC) | 1–2 | — | CORROBORATED (school range 0–2, wg2 impl. 7) / value dd | dd | 06 SES-007 | 06 |
| quality.non_key_runs_min | 2 | runs a week that are not key sessions (the long run and at least one easy run; owner Q2) | 1–3 | — | ALLEGED (common novice and intermediate practice, from memory) | dd | gap/prose-rules.md SES-006 | 06 |
| quality.key_modules.<preset>.<phase> | method_default: BASE SES-M-006, 007, 008, 012; BUILD SES-M-008, 010, 012; SPECIFIC SES-M-011, 009 (then the BUILD list for levels still missing) | module lists | — | per 06 §5 | CORROBORATED core structure (hearing-1 §2) / lists dd | dd | 06 §5 | 06 |
| ses.target_rpe | E1 3; E2 5; E3 6; E4 7 | session RPE 0–10 (whole session) | ±1 | — | ALLEGED (session-RPE method, Foster, from memory) | dd | gap/prose-rules.md SES-011 | 06 |
| ses.dose.<SES-M-id>.steps | 06 §2c table | ordered dose steps | — | — | ALLEGED (practice, from memory) | dd | 06 §2c; owner Q3 | 06 |
| ses.msp_rep_max_min | 5K 10; 10K 10; HM 15; M 20 | min per race-effort repeat (SES-M-011) | 5–20 | — | ALLEGED | dd | 06 §2c | 06 |
| ses.runwalk.entry_rung | preference only: 2 (2:1); HAB < L2: 1 (1:1) | index into ses.runwalk.ladder | 0–3 | galloway by pace | ALLEGED (Galloway 2:1 beginner ratio, wg2 §1 CORROBORATED for the ratio; entry rule dd) | dd | gap/prose-rules.md SES-010 | 06 |
| ses.exit_test.<node>.<level> | 06 §3b table (THR1 2 × 8 min; THR2 5 × 5 min; THR3 30 min; THR4 3 × 15 min; VO2_2 5 × 3 min; VO2_3 6 × 3 min; MSP share; DUR 60/90/135/180 min; HAB2 FT-0) | test session | — | — | ALLEGED (02 §2 levels) | dd | 06 §3b | 06 |
| cmp.max_level.<node> | HAB 4; TOL 5; AER 5; THR 4; VO2 3; ECO 3; DUR 5; MSP 3; FUEL 4; HEAT 2; PACE 3 | level | — | — | N/A (engineering: the 02 §2 table) | eng | 02 §2 | 02 |
| cmp.node_tie_order | DUR, THR, AER, MSP, VO2, ECO, FUEL | order | — | — | N/A (engineering: CMP-007 tie order) | eng | 02 CMP-007 | 02 |
| dst.msp_segment_max_ratio | 0.60 | × the long run's duration (race-effort segment) | 0.5–0.7 | — | ALLEGED (replaces the literal 0.60 of DST-006/007) | dd | 09 §4 | 09 |
| fuel.reach_tol_g_h | 5 | g/h below the step that still counts as reaching it | 0–10 | — | UNKNOWN (a gel is about 20–25 g) | dd | gap/prose-rules.md NUT-011 | 11 |
| fuel.level_band | L1 30; L2 45–60; L3 60–90; L4 > 90 | g/h (lower edge proves the level, NUT-013) | — | — | CORROBORATED (bands, wg5 §3) / use as level proof dd | dd | 02 §2; 11 §3 | 11 |
| fuel.l3_level | 3 | FUEL level that needs race-effort practice runs | — | — | N/A (engineering: 02 §2) | eng | 11 NUT-013 | 11 |
| fuel.required_level_mid / .required_level_long | 2 / 3 | FUEL level required for races > 90 min / > 2.5 h (time goals only for L3; owner Q6) | — | — | CORROBORATED (bands, wg5 impl. 3) / finish-goal limit dd | dd | 02 CMP-008; owner Q6 | 02 |
| tid.hard_share_max.HM | 0.15 | fraction of weekly time at E3–E4 for the half marathon (owner Q10) | 0.10–0.20 | polarized 0.15 | ALLEGED (HM plans hold more threshold work than marathon plans; from memory); trial doses 10–20% zone 3 CREDIBLE (hearing-2 coach-acad) | dd | gap/prose-rules.md §4.6 | 05 |
| heat.exposure_max_min | 60 | min per heat-exposure easy run (SES-M-022) | 30–60 | — | ALLEGED | dd | gap/prose-rules.md DST-004; owner Q8 | 11 |

## 16. Machine registry (v5.2, engine glue Q8; 12 §3.11)

One JSON object per parameter: `id`, `type` ∈ {number, int, bool, enum, set, map, list, text, segments}, `unit`, typed `default`, optional `keys` (what a map is indexed by), `limit_direction` ∈ {upper, lower, none} (how ContextModifier and preset overrides combine: MIN for upper limits, MAX for lower limits), `owner`, optional `family` (the table row a concrete id belongs to) and `note`. Grade, basis, range, presets and sources come from the tables above. `tools/build_parameters.py` joins the two and writes `parameters.json`; a table row without a machine line, or a machine line without a table row, fails the build. **This block is the machine source; when a default changes, edit both the table and this line.**

```param
{"id": "spike.warn_ratio", "type": "number", "unit": "× L30_eff", "default": 1.1, "limit_direction": "upper", "owner": "05"}
{"id": "spike.block_ratio", "type": "number", "unit": "× L30_eff", "default": 2.0, "limit_direction": "upper", "owner": "05"}
{"id": "spike.apply_duration", "type": "bool", "unit": "bool", "default": true, "limit_direction": "upper", "owner": "05"}
{"id": "two_day.cap_ratio", "type": "number", "unit": "× L30_eff (two consecutive days)", "default": 1.6, "limit_direction": "upper", "owner": "05"}
{"id": "two_day.adjacent_ratio", "type": "number", "unit": "× LR(w) (day before/after the long run)", "default": 0.5, "limit_direction": "upper", "owner": "05"}
{"id": "b2b.enabled_default", "type": "bool", "unit": "bool", "default": false, "limit_direction": "none", "owner": "09"}
{"id": "b2b.day2_ratio", "type": "number", "unit": "× day 1", "default": 0.6, "limit_direction": "upper", "owner": "09"}
{"id": "b2b.day2_start_ratio", "type": "number", "unit": "× day 1 (first pair)", "default": 0.4, "limit_direction": "upper", "owner": "09"}
{"id": "b2b.pair_cap_ratio", "type": "number", "unit": "× L30_eff", "default": 1.75, "limit_direction": "upper", "owner": "05"}
{"id": "b2b.pair_week_share_max", "type": "number", "unit": "× V(w)", "default": 0.65, "limit_direction": "upper", "owner": "05"}
{"id": "b2b.min_interval_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "lower", "owner": "09"}
{"id": "lod.min_run_s", "type": "int", "unit": "s", "default": 900, "limit_direction": "lower", "owner": "05"}
{"id": "load.round_down_s", "type": "int", "unit": "s / m", "default": 60, "limit_direction": "none", "owner": "05"}
{"id": "load.round_down_m", "type": "int", "unit": "s / m", "default": 100, "limit_direction": "none", "owner": "05"}
{"id": "log.contemporaneous_window_h", "type": "int", "unit": "h", "default": 48, "limit_direction": "upper", "owner": "01"}
{"id": "log.min_entries_30d", "type": "int", "unit": "runs", "default": 3, "limit_direction": "lower", "owner": "01"}
{"id": "log.bulk_backfill_max", "type": "int", "unit": "entries/day", "default": 5, "limit_direction": "upper", "owner": "01"}
{"id": "log.probation_weeks", "type": "int", "unit": "weeks", "default": 3, "limit_direction": "none", "owner": "01"}
{"id": "log.pace_min_s_per_km", "type": "int", "unit": "s/km", "default": 165, "limit_direction": "lower", "owner": "01"}
{"id": "log.pace_max_s_per_km.run", "type": "int", "unit": "s/km", "default": 900, "limit_direction": "upper", "owner": "01"}
{"id": "log.pace_max_s_per_km.run_walk", "type": "int", "unit": "s/km", "default": 1200, "limit_direction": "upper", "owner": "01"}
{"id": "log.confirm_ratio", "type": "number", "unit": "× L30_eff", "default": 2.0, "limit_direction": "upper", "owner": "01"}
{"id": "log.week_confirm_ratio", "type": "number", "unit": "× max prior 4 weeks", "default": 1.5, "limit_direction": "upper", "owner": "01"}
{"id": "claim.l30_discount", "type": "number", "unit": "× claimed", "default": 0.9, "limit_direction": "none", "owner": "01"}
{"id": "claim.l30_week_ratio_max", "type": "number", "unit": "× claimed weekly distance", "default": 0.6, "limit_direction": "upper", "owner": "01", "note": "1.00 when claimed runs/week ≤ 1"}
{"id": "claim.agegrade_confirm_pct", "type": "int", "unit": "WMA %", "default": 80, "limit_direction": "none", "owner": "01"}
{"id": "cmp.self_report_level_cap", "type": "map", "unit": "level", "default": {"HAB": 2, "AER": 2, "TOL": 2, "DUR": 2, "THR": 1, "VO2": 1, "MSP": 1, "FUEL": 1}, "limit_direction": "upper", "owner": "02"}
{"id": "inp.default_days", "type": "set", "unit": "weekdays", "default": ["Tue", "Thu", "Sat"], "limit_direction": "none", "owner": "01"}
{"id": "inp.default_runs", "type": "int", "unit": "runs/week", "default": 3, "limit_direction": "none", "owner": "01"}
{"id": "inp.default_session_min", "type": "int", "unit": "min", "default": 30, "limit_direction": "lower", "owner": "01"}
{"id": "screen.instrument", "type": "text", "unit": "—", "default": "PAR-Q+ 2023", "limit_direction": "none", "owner": "01"}
{"id": "screen.valid_days", "type": "int", "unit": "days", "default": 365, "limit_direction": "none", "owner": "01"}
{"id": "screen.active_runs_min", "type": "int", "unit": "sessions/week", "default": 3, "limit_direction": "lower", "owner": "01"}
{"id": "screen.health_check_weeks", "type": "int", "unit": "weeks", "default": 12, "limit_direction": "none", "owner": "01"}
{"id": "perf.agegrade_bands", "type": "list", "unit": "WMA %", "default": [60, 70, 80, 90], "limit_direction": "none", "owner": "01"}
{"id": "perf.competitive_min_pct", "type": "int", "unit": "WMA %", "default": 70, "limit_direction": "lower", "owner": "01"}
{"id": "ctx.novice_training_age_years", "type": "int", "unit": "years", "default": 1, "limit_direction": "none", "owner": "01"}
{"id": "ctx.masters_age", "type": "int", "unit": "years", "default": 50, "limit_direction": "none", "owner": "01"}
{"id": "ctx.lowfreq_runs", "type": "int", "unit": "runs/week", "default": 3, "limit_direction": "none", "owner": "01"}
{"id": "ctx.lowfreq_quality_max", "type": "int", "unit": "sessions/week", "default": 1, "limit_direction": "upper", "owner": "01"}
{"id": "deload.every_ctx", "type": "int", "unit": "weeks", "default": 3, "limit_direction": "none", "owner": "01"}
{"id": "gap.reduce_trigger_days", "type": "int", "unit": "days", "default": 8, "limit_direction": "none", "owner": "08"}
{"id": "gap.rtr_trigger_days", "type": "int", "unit": "days", "default": 30, "limit_direction": "none", "owner": "08"}
{"id": "gap.vol_factor.8_14", "type": "number", "unit": "× prior V7", "default": 0.75, "limit_direction": "none", "owner": "08"}
{"id": "gap.vol_factor.15_29", "type": "number", "unit": "× prior V7", "default": 0.5, "limit_direction": "none", "owner": "08"}
{"id": "gap.long_factor.8_14", "type": "number", "unit": "× L30_eff", "default": 0.8, "limit_direction": "none", "owner": "08"}
{"id": "gap.long_factor.15_29", "type": "number", "unit": "× L30_eff", "default": 0.6, "limit_direction": "none", "owner": "08"}
{"id": "miss.partial_ratio", "type": "number", "unit": "× planned", "default": 0.75, "limit_direction": "upper", "owner": "08"}
{"id": "miss.repeat_week_ratio", "type": "number", "unit": "× planned week", "default": 0.6, "limit_direction": "upper", "owner": "08"}
{"id": "miss.fit_check_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "illness.rest_days_min", "type": "int", "unit": "days", "default": 10, "limit_direction": "lower", "owner": "08"}
{"id": "illness.symptom_free_days", "type": "int", "unit": "days", "default": 7, "limit_direction": "none", "owner": "08"}
{"id": "illness.stage1_min", "type": "int", "unit": "min", "default": 15, "limit_direction": "lower", "owner": "08"}
{"id": "illness.above_neck_dur_ratio", "type": "number", "unit": "× planned", "default": 0.75, "limit_direction": "upper", "owner": "10 (used by 08)"}
{"id": "pain.during_max", "type": "int", "unit": "/10", "default": 3, "limit_direction": "upper", "owner": "08"}
{"id": "pain.next_morning_rule", "type": "bool", "unit": "bool", "default": true, "limit_direction": "none", "owner": "08"}
{"id": "pain.severe_min", "type": "int", "unit": "/10", "default": 7, "limit_direction": "lower", "owner": "08"}
{"id": "pain.persist_sessions", "type": "int", "unit": "sessions", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "pain.clear_sessions", "type": "int", "unit": "sessions", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "pain.recur_count", "type": "int", "unit": "ADP-052 events / days", "default": 3, "limit_direction": "none", "owner": "08"}
{"id": "pain.recur_window_days", "type": "int", "unit": "ADP-052 events / days", "default": 42, "limit_direction": "none", "owner": "08"}
{"id": "rpe.expected_by_effort", "type": "map", "unit": "CR-10", "default": {"E0": [0, 2], "E1": [0, 3], "E2": [4, 5], "E3": [6, 7], "E4": [8, 10]}, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.rpe_excess", "type": "int", "unit": "RPE points", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.signals_required", "type": "int", "unit": "signals", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.window_days", "type": "int", "unit": "days", "default": 7, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.persist_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.refer_weeks", "type": "int", "unit": "weeks", "default": 3, "limit_direction": "none", "owner": "08"}
{"id": "fatigue.clear_weeks", "type": "int", "unit": "weeks", "default": 1, "limit_direction": "none", "owner": "08"}
{"id": "result.exclusion_days", "type": "int", "unit": "days", "default": 7, "limit_direction": "none", "owner": "08"}
{"id": "result.max_upgrade_pct", "type": "int", "unit": "% pace", "default": 3, "limit_direction": "upper", "owner": "08"}
{"id": "result.confirm_window_days", "type": "int", "unit": "days", "default": 42, "limit_direction": "none", "owner": "08"}
{"id": "result.pattern_sessions", "type": "int", "unit": "sessions", "default": 3, "limit_direction": "none", "owner": "08"}
{"id": "rtr.ladder", "type": "list", "unit": "rungs", "default": ["R0", "R1", "R2", "R3", "R4", "R5"], "limit_direction": "none", "owner": "10", "note": "sessions per 10 §4 table"}
{"id": "rtr.start_ladder", "type": "list", "unit": "rungs", "default": [{"rung": "S1", "run_min": [8]}, {"rung": "S2", "run_min": [9]}, {"rung": "S3", "run_min": [9]}, {"rung": "S4", "run_min": [16]}, {"rung": "S5", "run_min": [15, 16, 20]}, {"rung": "S6", "run_min": [18, 20, 25]}, {"rung": "S7", "run_min": [25]}, {"rung": "S8", "run_min": [28]}, {"rung": "S9", "run_min": [30]}], "limit_direction": "none", "owner": "10"}
{"id": "rtr.session_min", "type": "map", "unit": "min", "default": {"0": 30, "1": 30, "2": 30, "3": 45, "4": 45, "5": 45}, "keys": "prior_tol_tier", "limit_direction": "lower", "owner": "10"}
{"id": "rtr.illness_r0_min", "type": "int", "unit": "min", "default": 15, "limit_direction": "lower", "owner": "10"}
{"id": "rtr.sessions_per_rung", "type": "int", "unit": "sessions", "default": 3, "limit_direction": "none", "owner": "10"}
{"id": "rtr.rest_days_between", "type": "int", "unit": "days", "default": 1, "limit_direction": "upper", "owner": "10"}
{"id": "rtr.max_runs_per_week", "type": "int", "unit": "runs", "default": 4, "limit_direction": "upper", "owner": "10"}
{"id": "rtr.long_gap_days", "type": "int", "unit": "days", "default": 90, "limit_direction": "none", "owner": "10"}
{"id": "rtr.bone_pain_max", "type": "int", "unit": "/10", "default": 0, "limit_direction": "upper", "owner": "10"}
{"id": "rtr.max_weeks_per_rung", "type": "int", "unit": "weeks", "default": 3, "limit_direction": "upper", "owner": "10"}
{"id": "flag.clearance_min_delay_days", "type": "int", "unit": "days", "default": 1, "limit_direction": "lower", "owner": "10"}
{"id": "flag.pause_kinds", "type": "set", "unit": "set", "default": ["cardiac", "bone_stress", "bone_stress_highrisk", "heat", "eah", "pregnancy_stop", "reds_escalated", "pain_persistent", "illness"], "limit_direction": "none", "owner": "10"}
{"id": "flag.professional_kinds", "type": "set", "unit": "set", "default": ["cardiac", "bone_stress", "bone_stress_highrisk", "heat", "eah", "pregnancy_stop", "reds_escalated", "pain_persistent"], "limit_direction": "none", "owner": "10"}
{"id": "flag.recur_window_days", "type": "int", "unit": "days", "default": 60, "limit_direction": "none", "owner": "10"}
{"id": "flag.high_risk_regions", "type": "set", "unit": "set", "default": ["hip_groin", "front_of_shin", "midfoot", "outer_foot"], "limit_direction": "none", "owner": "10"}
{"id": "masters.vigorous_assessment_age", "type": "int", "unit": "years", "default": 65, "limit_direction": "none", "owner": "10"}
{"id": "masters.cv_advice_age", "type": "int", "unit": "years", "default": 35, "limit_direction": "none", "owner": "10"}
{"id": "minor.min_age", "type": "int", "unit": "years", "default": 14, "limit_direction": "lower", "owner": "10"}
{"id": "minor.refer_below_age", "type": "int", "unit": "years", "default": 16, "limit_direction": "none", "owner": "10"}
{"id": "minor.adult_age", "type": "int", "unit": "years", "default": 18, "limit_direction": "none", "owner": "10"}
{"id": "minor.max_race_km.recommended", "type": "map", "unit": "km", "default": {"14": 8, "15": 8, "16": 12, "17": 14}, "keys": "age_low", "limit_direction": "upper", "owner": "10"}
{"id": "minor.max_race_km.hard", "type": "map", "unit": "km", "default": {"14": 8, "15": 12, "16": 15, "17": 25}, "keys": "age_low", "limit_direction": "upper", "owner": "10"}
{"id": "minor.marathon_min_age", "type": "int", "unit": "years", "default": 18, "limit_direction": "lower", "owner": "10"}
{"id": "minor.ultra_min_age", "type": "int", "unit": "years", "default": 18, "limit_direction": "lower", "owner": "10"}
{"id": "minor.lr_cap_ratio", "type": "number", "unit": "× race cap", "default": 1.0, "limit_direction": "upper", "owner": "10"}
{"id": "pp.min_weeks", "type": "int", "unit": "weeks postpartum", "default": 12, "limit_direction": "lower", "owner": "10"}
{"id": "pregnancy.mode", "type": "text", "unit": "—", "default": "maintenance only, prior runners, clinician agreement", "limit_direction": "none", "owner": "10"}
{"id": "pregnancy.max_effort", "type": "enum", "unit": "effort", "default": "E2", "limit_direction": "upper", "owner": "10"}
{"id": "pregnancy.vol_cap_ratio", "type": "number", "unit": "× V28 at start", "default": 1.0, "limit_direction": "upper", "owner": "10"}
{"id": "pregnancy.reattest_weeks", "type": "int", "unit": "weeks", "default": 12, "limit_direction": "none", "owner": "10"}
{"id": "reds.rescreen_weeks", "type": "int", "unit": "weeks", "default": 10, "limit_direction": "none", "owner": "11"}
{"id": "taper.weeks", "type": "map", "unit": "weeks", "default": {"5K": 2, "10K": 2, "HM": 2, "M": 3, "50K": 3, "100K": 3}, "keys": "distance", "limit_direction": "none", "owner": "05"}
{"id": "taper.weeks_short", "type": "map", "unit": "weeks", "default": {"5K": 1, "10K": 1, "HM": 1, "M": 2, "50K": 2, "100K": 2}, "keys": "distance", "limit_direction": "none", "owner": "04", "note": "M/ultra 1 if W < 3"}
{"id": "taper.weeks.short_finish", "type": "int", "unit": "weeks", "default": 1, "limit_direction": "none", "owner": "04"}
{"id": "taper.volume_cut", "type": "number", "unit": "fraction", "default": 0.5, "limit_direction": "none", "owner": "05"}
{"id": "taper.shape", "type": "enum", "unit": "enum", "default": "progressive", "limit_direction": "none", "owner": "05"}
{"id": "taper.cut_profile", "type": "map", "unit": "× taper.volume_cut per week", "default": {"1": [1.0], "2": [0.6, 1.0], "3": [0.4, 0.7, 1.0]}, "keys": "T", "limit_direction": "none", "owner": "05"}
{"id": "taper.freq_min_ratio", "type": "number", "unit": "× pre-taper runs/week", "default": 1.0, "limit_direction": "lower", "owner": "05"}
{"id": "deload.every", "type": "int", "unit": "weeks", "default": 4, "limit_direction": "none", "owner": "05"}
{"id": "deload.volume_cut", "type": "number", "unit": "fraction", "default": 0.25, "limit_direction": "none", "owner": "05"}
{"id": "deload.quality_max", "type": "int", "unit": "sessions", "default": 1, "limit_direction": "upper", "owner": "05 (used by 06)"}
{"id": "deload.min_plan_weeks", "type": "int", "unit": "weeks", "default": 6, "limit_direction": "lower", "owner": "04"}
{"id": "deload.exclusion_before_taper", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "04"}
{"id": "deload.min_gap_weeks", "type": "int", "unit": "loading weeks between deloads", "default": 2, "limit_direction": "lower", "owner": "04"}
{"id": "transition.vol_max_ratio", "type": "number", "unit": "× pre-taper V_ref", "default": 0.5, "limit_direction": "upper", "owner": "05"}
{"id": "phs.onboard_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "04"}
{"id": "phs.specific_min", "type": "map", "unit": "weeks", "default": {"5K": 2, "10K": 2, "HM": 3, "M": 4, "50K": 4, "100K": 4}, "keys": "distance", "limit_direction": "lower", "owner": "04"}
{"id": "phs.specific_target", "type": "map", "unit": "weeks", "default": {"5K": 4, "10K": 4, "HM": 6, "M": 8, "50K": 8, "100K": 10}, "keys": "distance", "limit_direction": "none", "owner": "04"}
{"id": "phs.build_min", "type": "int", "unit": "weeks", "default": 1, "limit_direction": "lower", "owner": "04"}
{"id": "phs.build_max", "type": "int", "unit": "weeks", "default": 8, "limit_direction": "upper", "owner": "04"}
{"id": "phs.season_max_weeks", "type": "int", "unit": "weeks", "default": 24, "limit_direction": "upper", "owner": "04"}
{"id": "phs.final_season_min_weeks", "type": "int", "unit": "weeks", "default": 12, "limit_direction": "lower", "owner": "04"}
{"id": "phs.transition_weeks", "type": "map", "unit": "weeks", "default": {"5K": 1, "10K": 1, "HM": 1, "M": 2, "50K": 2, "100K": 2}, "keys": "distance", "limit_direction": "none", "owner": "04"}
{"id": "maint.sessions_min", "type": "int", "unit": "runs/week", "default": 2, "limit_direction": "lower", "owner": "04"}
{"id": "maint.max_weeks", "type": "int", "unit": "weeks", "default": 15, "limit_direction": "upper", "owner": "04"}
{"id": "maint.volume_cut_max", "type": "number", "unit": "fraction", "default": 0.5, "limit_direction": "upper", "owner": "05"}
{"id": "prog.standard.week_max", "type": "number", "unit": "fraction", "default": 0.15, "limit_direction": "upper", "owner": "05"}
{"id": "prog.standard.2wk_max", "type": "number", "unit": "fraction", "default": 0.3, "limit_direction": "upper", "owner": "05"}
{"id": "prog.slow.week_max", "type": "number", "unit": "fraction", "default": 0.1, "limit_direction": "upper", "owner": "05"}
{"id": "prog.slow.2wk_max", "type": "number", "unit": "fraction", "default": 0.2, "limit_direction": "upper", "owner": "05"}
{"id": "prog.baseline_max_age_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "upper", "owner": "05"}
{"id": "prog.est.week_max", "type": "number", "unit": "fraction above week.est_base_s (best logged week of the window), while the baseline is unconfirmed (LOD-007, v5.1)", "default": 0.1, "limit_direction": "upper", "owner": "05"}
{"id": "prog.est.window_weeks", "type": "int", "unit": "completed weeks looked back for week.est_base_s", "default": 4, "limit_direction": "none", "owner": "05"}
{"id": "prog.est.confirm_weeks", "type": "int", "unit": "consecutive logged weeks that confirm the baseline (LOD-008)", "default": 6, "limit_direction": "none", "owner": "05"}
{"id": "prog.est.confirm_ratio", "type": "number", "unit": "× planned weekly time, logged from measured entries, for a week to count (LOD-008)", "default": 0.8, "limit_direction": "upper", "owner": "05"}
{"id": "lr.pct_cap.<preset>.<family>", "type": "map", "unit": "× weekly **time**", "default": {"method_default": {"short": {"2": 0.6, "3": 0.45, "4": 0.4, "5+": 0.3}, "base": {"2": 0.6, "3": 0.45, "4": 0.4, "5+": 0.3}, "road_classic": 0.5, "ultra": "lr.ultra_pct_cap"}, "daniels": 0.25, "higdon_novice": 0.5, "hansons": null, "pfitzinger_classic": null, "galloway": null}, "keys": "preset, family, runs", "limit_direction": "upper", "owner": "05"}
{"id": "lr.over_cap_pct.road_classic", "type": "number", "unit": "× weekly time, for road long runs above the time cap (floor and extension runs)", "default": 0.6, "limit_direction": "upper", "owner": "05"}
{"id": "lr.floor_time_max_min.<distance>", "type": "map", "unit": "min (time on feet incl. walks)", "default": {"M": 240, "HM": 150, "50K": 240, "100K": 330, "5K": 150, "10K": 150}, "keys": "distance", "limit_direction": "upper", "owner": "03"}
{"id": "lr.m_ext_km", "type": "int", "unit": "km / runs / days", "default": 29, "limit_direction": "none", "owner": "09"}
{"id": "lr.m_ext_max_runs", "type": "int", "unit": "km / runs / days", "default": 3, "limit_direction": "upper", "owner": "09"}
{"id": "lr.m_ext_min_gap_days", "type": "int", "unit": "km / runs / days", "default": 21, "limit_direction": "lower", "owner": "09"}
{"id": "lr.over180_min_gap_days", "type": "int", "unit": "days between runs expected > 180 min (all families; a back-to-back pair counts once)", "default": 14, "limit_direction": "lower", "owner": "05"}
{"id": "lr.pct_floor_s", "type": "int", "unit": "s", "default": 3600, "limit_direction": "lower", "owner": "05"}
{"id": "lr.pct_monotone", "type": "bool", "unit": "bool", "default": true, "limit_direction": "none", "owner": "05"}
{"id": "lr.time_cap_min.<preset>.<distance>", "type": "map", "unit": "min", "default": {"method_default": {"5K": 150, "10K": 150, "HM": 150, "M": 180}, "daniels": 150, "galloway": 240}, "keys": "preset, distance", "limit_direction": "upper", "owner": "05"}
{"id": "lr.abs_cap_km.<preset>", "type": "map", "unit": "km", "default": {"method_default": 32, "hansons": 26, "pfitzinger_classic": 35, "higdon_novice": 32}, "keys": "preset", "limit_direction": "upper", "owner": "05"}
{"id": "lr.ultra_pct_cap", "type": "number", "unit": "× weekly time", "default": 0.6, "limit_direction": "upper", "owner": "09"}
{"id": "lr.ultra_time_cap_min.<distance>", "type": "map", "unit": "min", "default": {"50K": 240, "100K": 330}, "keys": "distance", "limit_direction": "upper", "owner": "09"}
{"id": "lr.ultra_peak_every_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "09"}
{"id": "tid.model", "type": "enum", "unit": "enum", "default": "pyramidal", "limit_direction": "none", "owner": "05"}
{"id": "tid.easy_share_min", "type": "number", "unit": "fraction of time E0–E1", "default": 0.75, "limit_direction": "lower", "owner": "05"}
{"id": "tid.hard_share_max.<family>", "type": "map", "unit": "fraction of weekly time at E3–E4", "default": {"short": 0.2, "road_classic": 0.1, "ultra": 0.1}, "keys": "family", "limit_direction": "upper", "owner": "05"}
{"id": "tid.e2_share_max", "type": "number", "unit": "fraction of time E2", "default": 0.2, "limit_direction": "upper", "owner": "05"}
{"id": "quality.per_week", "type": "map", "unit": "sessions", "default": {"method_default": "quality.method_default", "daniels": 2, "hansons": 3, "pfitzinger_classic": 3, "higdon_novice": 0, "first": 3, "norwegian_elite": 5}, "keys": "preset", "limit_direction": "none", "owner": "06"}
{"id": "quality.method_default", "type": "map", "unit": "sessions", "default": {"ONBOARD": 0, "RTR": 0, "TRANSITION": 0, "BASE": 1, "BUILD": 2, "SPECIFIC": 2}, "keys": "phase", "limit_direction": "none", "owner": "06"}
{"id": "quality.counts_long", "type": "map", "unit": "bool per preset", "default": {"method_default": false, "hansons": true, "first": true, "pfitzinger_classic": "SES-M-005"}, "keys": "preset", "limit_direction": "none", "owner": "06"}
{"id": "cmp.decay_weeks", "type": "int", "unit": "weeks", "default": 6, "limit_direction": "none", "owner": "02"}
{"id": "cmp.min_weeks_per_level.<node>", "type": "int", "unit": "weeks", "default": 4, "limit_direction": "lower", "owner": "02"}
{"id": "cmp.pace_split_tol", "type": "number", "unit": "fraction", "default": 0.03, "limit_direction": "none", "owner": "02"}
{"id": "cmp.weight.<distance>.<node>", "type": "map", "unit": "weight", "default": {"5K": {"AER": 0.25, "THR": 0.2, "VO2": 0.3, "ECO": 0.15, "DUR": 0.0, "MSP": 0.1, "FUEL": 0.0}, "10K": {"AER": 0.25, "THR": 0.3, "VO2": 0.2, "ECO": 0.1, "DUR": 0.05, "MSP": 0.1, "FUEL": 0.0}, "HM": {"AER": 0.3, "THR": 0.3, "VO2": 0.1, "ECO": 0.05, "DUR": 0.1, "MSP": 0.15, "FUEL": 0.0}, "M": {"AER": 0.3, "THR": 0.15, "VO2": 0.05, "ECO": 0.05, "DUR": 0.25, "MSP": 0.15, "FUEL": 0.05}, "50K": {"AER": 0.35, "THR": 0.1, "VO2": 0.05, "ECO": 0.0, "DUR": 0.3, "MSP": 0.1, "FUEL": 0.1}, "100K": {"AER": 0.35, "THR": 0.05, "VO2": 0.0, "ECO": 0.05, "DUR": 0.35, "MSP": 0.05, "FUEL": 0.15}}, "keys": "distance, node", "limit_direction": "none", "owner": "02 (09 may refine)"}
{"id": "cmp.required.<distance>.<node>", "type": "map", "unit": "level", "default": {"5K": {"finish": {"HAB": 2, "AER": 1, "TOL": 1}, "time": {"THR": 1, "VO2": 2, "MSP": 1}}, "10K": {"finish": {"HAB": 2, "AER": 1, "TOL": 1, "DUR": 1}, "time": {"THR": 2, "VO2": 2, "MSP": 1}}, "HM": {"finish": {"HAB": 2, "AER": 2, "TOL": 2, "DUR": 2}, "time": {"THR": 2, "MSP": 2, "AER": 3}}, "M": {"finish": {"HAB": 2, "AER": 3, "TOL": 3, "DUR": 3, "FUEL": 2}, "time": {"HAB": 3, "THR": 2, "MSP": 2, "FUEL": 3}}, "50K": {"finish": {"HAB": 3, "AER": 3, "TOL": 4, "DUR": 4, "FUEL": 3}, "time": {"MSP": 2}}, "100K": {"finish": {"HAB": 4, "AER": 4, "TOL": 4, "DUR": 4, "FUEL": 3}, "time": {"MSP": 2}}}, "keys": "distance, goal_type, node", "limit_direction": "none", "owner": "02"}
{"id": "ses.dose.<SES-M-id>", "type": "map", "unit": "segments", "default": "see ses.dose.<SES-M-id>.steps (v5.2)", "keys": "module", "limit_direction": "none", "owner": "06"}
{"id": "ses.warmup_s", "type": "int", "unit": "s", "default": 600, "limit_direction": "none", "owner": "06"}
{"id": "ses.cooldown_s", "type": "int", "unit": "s", "default": 300, "limit_direction": "none", "owner": "06"}
{"id": "ses.easy_min_min", "type": "int", "unit": "min", "default": 20, "limit_direction": "lower", "owner": "06"}
{"id": "ses.runwalk.ladder", "type": "list", "unit": "min run : min walk", "default": [[1, 2], [1, 1], [2, 1], [3, 1], [5, 1], [8, 1], "continuous"], "limit_direction": "none", "owner": "06", "note": "[run min, walk min]"}
{"id": "ses.runwalk.sessions_per_rung", "type": "int", "unit": "sessions / CR-10", "default": 2, "limit_direction": "none", "owner": "06"}
{"id": "ses.runwalk.rpe_max", "type": "int", "unit": "sessions / CR-10", "default": 4, "limit_direction": "upper", "owner": "06"}
{"id": "ses.progress_rpe_margin", "type": "int", "unit": "RPE points", "default": 1, "limit_direction": "none", "owner": "06"}
{"id": "ses.exit_ready_sessions", "type": "int", "unit": "instances", "default": 2, "limit_direction": "none", "owner": "06"}
{"id": "ses.exit_retest_weeks", "type": "int", "unit": "weeks", "default": 3, "limit_direction": "none", "owner": "06"}
{"id": "ses.drift_window_min", "type": "int", "unit": "min / RPE", "default": 20, "limit_direction": "lower", "owner": "06"}
{"id": "ses.drift_rpe_max", "type": "int", "unit": "min / RPE", "default": 2, "limit_direction": "upper", "owner": "06"}
{"id": "ses.exit.THR2_min", "type": "int", "unit": "min at E3", "default": 25, "limit_direction": "lower", "owner": "06"}
{"id": "ses.exit.THR4_min", "type": "int", "unit": "min at E3", "default": 45, "limit_direction": "lower", "owner": "06"}
{"id": "ses.exit.VO2_3_min", "type": "int", "unit": "min at E4", "default": 18, "limit_direction": "lower", "owner": "06"}
{"id": "ses.exit.DUR3_min", "type": "int", "unit": "min", "default": 135, "limit_direction": "lower", "owner": "06"}
{"id": "ses.exit.ECO_weeks", "type": "int", "unit": "weeks", "default": 6, "limit_direction": "none", "owner": "06"}
{"id": "ses.retest_lead_days", "type": "int", "unit": "days", "default": 14, "limit_direction": "none", "owner": "06"}
{"id": "ses.ft0_min", "type": "int", "unit": "min", "default": 30, "limit_direction": "lower", "owner": "06"}
{"id": "ses.ft1_dist_m", "type": "int", "unit": "m", "default": 3000, "limit_direction": "none", "owner": "06"}
{"id": "ses.ft2_dists_m", "type": "list", "unit": "m", "default": [400, 2000], "limit_direction": "none", "owner": "06"}
{"id": "ses.taper_touch", "type": "map", "unit": "segments", "default": {"E3": {"reps": 2, "rep_s": 300, "rec_s": 120}, "E4": {"reps": 4, "rep_s": 60, "rec_s": 60}}, "limit_direction": "none", "owner": "06"}
{"id": "ses.strength_per_week", "type": "int", "unit": "sessions / min", "default": 2, "limit_direction": "none", "owner": "06"}
{"id": "ses.strength_session_min", "type": "int", "unit": "sessions / min", "default": 20, "limit_direction": "lower", "owner": "06"}
{"id": "ses.strides_per_week", "type": "int", "unit": "sessions", "default": 2, "limit_direction": "none", "owner": "06"}
{"id": "ses.medlong_ratio", "type": "number", "unit": "× current long run", "default": 0.65, "limit_direction": "upper", "owner": "06"}
{"id": "ses.race_effort", "type": "map", "unit": "effort", "default": {"5K": "E4", "10K": "E3", "HM": "E3", "M": "E2", "50K": "E1", "100K": "E1"}, "keys": "distance", "limit_direction": "none", "owner": "06", "note": "10K is the E3/E4 boundary; 50K E1/E2 (prose 06 §6)"}
{"id": "dst.phase_nodes", "type": "map", "unit": "node sets", "default": {"short": {"BASE": [{"node": "AER", "max_level": 5}, {"node": "DUR", "max_level": 5}, {"node": "ECO", "max_level": 1}, {"node": "VO2", "max_level": 1}, {"node": "THR", "max_level": 1}], "BUILD": [{"node": "THR", "max_level": 4}, {"node": "VO2", "max_level": 3}], "SPECIFIC": [{"node": "MSP", "max_level": 3}, {"node": "VO2", "max_level": 3}, {"node": "THR", "max_level": 4}], "TAPER": [{"node": "MSP", "max_level": 3}]}, "road_classic": {"BASE": [{"node": "AER", "max_level": 5}, {"node": "DUR", "max_level": 5}, {"node": "ECO", "max_level": 1}, {"node": "THR", "max_level": 1}], "BUILD": [{"node": "THR", "max_level": 4}, {"node": "DUR", "max_level": 5}, {"node": "VO2", "max_level": 3}], "SPECIFIC": [{"node": "MSP", "max_level": 3}, {"node": "DUR", "max_level": 5}, {"node": "THR", "max_level": 4}, {"node": "FUEL", "max_level": 4}], "TAPER": [{"node": "MSP", "max_level": 3}]}, "ultra": {"BASE": [{"node": "AER", "max_level": 5}, {"node": "DUR", "max_level": 5}, {"node": "ECO", "max_level": 3}], "BUILD": [{"node": "VO2", "max_level": 3}, {"node": "THR", "max_level": 4}, {"node": "AER", "max_level": 5}], "SPECIFIC": [{"node": "DUR", "max_level": 5}, {"node": "MSP", "max_level": 3}, {"node": "FUEL", "max_level": 4}, {"node": "HEAT", "max_level": 2}], "TAPER": [{"node": "MSP", "max_level": 3}]}}, "keys": "family, phase", "limit_direction": "none", "owner": "09", "note": "[node, max level]; road_classic BUILD VO2 for HM only; phases without a row (ONBOARD, RTR, TRANSITION, RACE) have no key slots; SHARPEN uses the SPECIFIC row, MAINTAIN the BUILD row (v5.2)"}
{"id": "dst.ultra_build_split", "type": "list", "unit": "share of BUILD (VO2 / THR / steady)", "default": [0.33, 0.33, 0.34], "limit_direction": "none", "owner": "09"}
{"id": "dst.msp_share.<d>.L1", "type": "map", "unit": "share of race duration", "default": {"5K": {"1": 0.1, "2": 0.3, "3": 0.75}, "10K": {"1": 0.1, "2": 0.3, "3": 0.65}, "HM": {"1": 0.1, "2": 0.3, "3": 0.55}, "M": {"1": 0.1, "2": 0.3, "3": 0.5}, "50K": {"1": 0.1, "2": 0.3, "3": 0.3}, "100K": {"1": 0.1, "2": 0.3, "3": 0.3}}, "keys": "distance, level", "limit_direction": "none", "owner": "09"}
{"id": "dst.race_long_every_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "09"}
{"id": "dst.msp_every_weeks", "type": "int", "unit": "weeks (time goals, SPECIFIC)", "default": 2, "limit_direction": "none", "owner": "09"}
{"id": "dst.msp_segment_max_min", "type": "map", "unit": "min", "default": {"M": 90, "HM": 40}, "keys": "distance", "limit_direction": "upper", "owner": "09"}
{"id": "dst.ultra_alt_long_ratio", "type": "number", "unit": "× last peak", "default": 0.7, "limit_direction": "upper", "owner": "09"}
{"id": "dst.tuneup_dist_km", "type": "map", "unit": "km", "default": {"50K": 42.2, "100K": 50}, "keys": "distance", "limit_direction": "none", "owner": "09"}
{"id": "dst.tuneup_weeks_out", "type": "int", "unit": "weeks before race", "default": 5, "limit_direction": "none", "owner": "09"}
{"id": "dst.tuneup_recovery_days", "type": "int", "unit": "days", "default": 7, "limit_direction": "upper", "owner": "09"}
{"id": "preset.compat.<id>", "type": "map", "unit": "days, min/week", "default": "09 §7 table", "keys": "preset", "limit_direction": "none", "owner": "09"}
{"id": "race.longest_ratio_max.5K", "type": "number", "unit": "race ÷ peak long run", "default": 1.3, "limit_direction": "upper", "owner": "03"}
{"id": "race.longest_ratio_max.10K", "type": "number", "unit": "race ÷ peak long run", "default": 1.25, "limit_direction": "upper", "owner": "03"}
{"id": "race.longest_ratio_max.HM", "type": "number", "unit": "race ÷ peak long run", "default": 1.3, "limit_direction": "upper", "owner": "03"}
{"id": "race.longest_ratio_max.M", "type": "map", "unit": "ratio (time demand capped by lr.time_cap_min)", "default": {"method_default": 1.4, "daniels": 2.0, "hansons": 1.65, "pfitzinger_classic": 1.3, "higdon_novice": 1.32, "galloway": 1.6}, "keys": "preset", "limit_direction": "upper", "owner": "03"}
{"id": "race.longest_floor_ratio.<distance>.<preset>", "type": "map", "unit": "race ÷ minimum peak long run (distance)", "default": {"M": 2.0, "HM": 1.6, "50K": 2.0, "100K": 3.0, "5K": 1.3, "10K": 1.25}, "keys": "distance", "limit_direction": "upper", "owner": "03"}
{"id": "race.5k_finish_lr_min", "type": "int", "unit": "min (continuous or run-walk)", "default": 30, "limit_direction": "lower", "owner": "03"}
{"id": "race.longest_ratio_max.50K", "type": "number", "unit": "ratio", "default": 1.6, "limit_direction": "upper", "owner": "03"}
{"id": "race.longest_ratio_max.100K", "type": "number", "unit": "ratio", "default": 2.5, "limit_direction": "upper", "owner": "03"}
{"id": "feas.finish_floor.peak_week", "type": "map", "unit": "time/dist", "default": {"5K": {"runs": 3}, "10K": {"time_min": 90}, "HM": {"time_min": 150}, "M": {"time_min": 240, "dist_km": 32}, "50K": {"dist_km": 50}, "100K": {"dist_km": 60}}, "keys": "distance", "limit_direction": "lower", "owner": "03"}
{"id": "feas.planning_speed_margin", "type": "number", "unit": "fraction", "default": 0.1, "limit_direction": "none", "owner": "03"}
{"id": "feas.default_planning_pace_s_per_km", "type": "int", "unit": "s/km", "default": 480, "limit_direction": "none", "owner": "03"}
{"id": "feas.stretch_margin_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "03"}
{"id": "pred.band_min_pct", "type": "int", "unit": "± %", "default": 7, "limit_direction": "lower", "owner": "03"}
{"id": "pred.band_widen_estimated", "type": "number", "unit": "× band", "default": 1.5, "limit_direction": "none", "owner": "03"}
{"id": "pred.marathon_from_half", "type": "number", "unit": "× half time", "default": 2.19, "limit_direction": "none", "owner": "03"}
{"id": "pred.riegel_exp_min", "type": "number", "unit": "exponent", "default": 1.06, "limit_direction": "lower", "owner": "03"}
{"id": "pred.low_volume_km_week", "type": "int", "unit": "km/week", "default": 48, "limit_direction": "none", "owner": "03"}
{"id": "pred.low_volume_widen", "type": "number", "unit": "× slow half-band", "default": 1.5, "limit_direction": "none", "owner": "03"}
{"id": "pred.max_extrapolation_ratio", "type": "number", "unit": "target ÷ anchor distance", "default": 4.5, "limit_direction": "upper", "owner": "03"}
{"id": "pred.ultra_mode", "type": "text", "unit": "—", "default": "range only, low confidence", "limit_direction": "none", "owner": "03"}
{"id": "pred.ultra_exp_low", "type": "number", "unit": "exponent", "default": 1.06, "limit_direction": "none", "owner": "03"}
{"id": "pred.ultra_exp_high", "type": "number", "unit": "exponent", "default": 1.3, "limit_direction": "none", "owner": "03"}
{"id": "pred.taper_gain_pct", "type": "int", "unit": "%", "default": 2, "limit_direction": "none", "owner": "03"}
{"id": "pred.round_s", "type": "int", "unit": "s", "default": 60, "limit_direction": "none", "owner": "03"}
{"id": "anchor.max_age_days", "type": "int", "unit": "days", "default": 120, "limit_direction": "upper", "owner": "03"}
{"id": "goal.date_search_max_weeks", "type": "int", "unit": "weeks", "default": 52, "limit_direction": "upper", "owner": "07"}
{"id": "goal.edit_fail_limit", "type": "int", "unit": "count / days / weeks", "default": 3, "limit_direction": "upper", "owner": "07"}
{"id": "goal.edit_window_days", "type": "int", "unit": "count / days / weeks", "default": 7, "limit_direction": "none", "owner": "07"}
{"id": "goal.edit_margin_weeks", "type": "int", "unit": "count / days / weeks", "default": 1, "limit_direction": "none", "owner": "07"}
{"id": "goal.edit_margin_pct", "type": "int", "unit": "% of target time", "default": 1, "limit_direction": "none", "owner": "03"}
{"id": "pred.checkpoint_weeks", "type": "int", "unit": "weeks between field tests for an ambitious long-horizon target", "default": 6, "limit_direction": "none", "owner": "03"}
{"id": "feas.peak_credit_days", "type": "int", "unit": "days before the race within which a logged peak long run counts", "default": 70, "limit_direction": "none", "owner": "03"}
{"id": "pace.deadband_pct", "type": "number", "unit": "% change of the 10K-equivalent below which a new result is treated as noise (v5.1: a change above it but ≤ the minimum detectable change moves paces only when confirmed, ADP-067)", "default": 3.5, "limit_direction": "none", "owner": "03"}
{"id": "pace.test_te_pct", "type": "number", "unit": "% typical error of one recreational 5K/10K test (as CV)", "default": 3.4, "limit_direction": "none", "owner": "08"}
{"id": "pace.mdc_mult", "type": "number", "unit": "× pace.test_te_pct = minimum detectable change of one test (2.8 × 3.4 ≈ 9.5%)", "default": 2.8, "limit_direction": "none", "owner": "08"}
{"id": "pred.band_same_distance_pct", "type": "int", "unit": "% fast half-width / days", "default": 4, "limit_direction": "none", "owner": "03"}
{"id": "pred.same_distance_max_age_days", "type": "int", "unit": "% fast half-width / days", "default": 56, "limit_direction": "upper", "owner": "03"}
{"id": "pace.e3_low", "type": "number", "unit": "× CS speed", "default": 0.92, "limit_direction": "none", "owner": "03"}
{"id": "pace.e3_high", "type": "number", "unit": "× CS speed", "default": 0.97, "limit_direction": "none", "owner": "03"}
{"id": "pace.e1_low", "type": "number", "unit": "× M-equivalent speed", "default": 0.72, "limit_direction": "none", "owner": "03"}
{"id": "pace.e1_high", "type": "number", "unit": "× M-equivalent speed", "default": 0.92, "limit_direction": "none", "owner": "03"}
{"id": "pace.round_s", "type": "int", "unit": "s/km", "default": 5, "limit_direction": "none", "owner": "03"}
{"id": "replan.published_days", "type": "int", "unit": "days", "default": 7, "limit_direction": "none", "owner": "08"}
{"id": "repair.max_passes", "type": "int", "unit": "count", "default": 3, "limit_direction": "upper", "owner": "07"}
{"id": "repair.max_options", "type": "int", "unit": "count", "default": 4, "limit_direction": "upper", "owner": "07"}
{"id": "fuel.required_above_min", "type": "int", "unit": "min race duration", "default": 90, "limit_direction": "lower", "owner": "11"}
{"id": "fuel.band.by_duration", "type": "list", "unit": "g/h", "default": [{"max_min": 45, "g_h": [0, 0]}, {"max_min": 75, "g_h": [0, 30], "optional": true}, {"max_min": 150, "g_h": [30, 60]}, {"max_min": null, "g_h": [60, 90]}], "limit_direction": "upper", "owner": "11"}
{"id": "fuel.max_default_g_h", "type": "int", "unit": "g/h", "default": 90, "limit_direction": "upper", "owner": "11"}
{"id": "fuel.start_g_h", "type": "int", "unit": "g/h", "default": 30, "limit_direction": "none", "owner": "11"}
{"id": "fuel.step_g_h", "type": "int", "unit": "g/h", "default": 15, "limit_direction": "none", "owner": "11", "note": "v5.2: one value (was 10–15), owner question 5"}
{"id": "fuel.step_runs", "type": "int", "unit": "runs", "default": 2, "limit_direction": "none", "owner": "11"}
{"id": "fuel.exit_runs", "type": "int", "unit": "runs", "default": 2, "limit_direction": "none", "owner": "11"}
{"id": "fuel.gi_pass_max", "type": "int", "unit": "/10", "default": 2, "limit_direction": "upper", "owner": "11"}
{"id": "fuel.gi_stepdown_min", "type": "int", "unit": "/10", "default": 5, "limit_direction": "lower", "owner": "11"}
{"id": "fuel.practice_min_duration_min", "type": "int", "unit": "min", "default": 60, "limit_direction": "upper", "owner": "11"}
{"id": "fuel.l4_min_race_h", "type": "number", "unit": "h", "default": 2.5, "limit_direction": "lower", "owner": "11"}
{"id": "fuel.dual_source_above_g_h", "type": "int", "unit": "g/h", "default": 60, "limit_direction": "none", "owner": "11"}
{"id": "hyd.no_test_cap_ml_h", "type": "int", "unit": "mL/h", "default": 800, "limit_direction": "upper", "owner": "11"}
{"id": "hyd.abs_cap_ml_h", "type": "int", "unit": "mL/h", "default": 1000, "limit_direction": "upper", "owner": "11"}
{"id": "hyd.sweat_test_min_min", "type": "int", "unit": "min", "default": 60, "limit_direction": "lower", "owner": "11"}
{"id": "eah.warning_above_h", "type": "int", "unit": "h", "default": 4, "limit_direction": "none", "owner": "11"}
{"id": "heat.acclim_days", "type": "int", "unit": "exposure days", "default": 10, "limit_direction": "none", "owner": "11", "note": "v5.2: one value (was 7–14), owner question 8"}
{"id": "heat.acclim_window_days", "type": "int", "unit": "days before race", "default": 21, "limit_direction": "none", "owner": "11"}
{"id": "caffeine.default", "type": "int", "unit": "mg/kg", "default": 3, "limit_direction": "none", "owner": "11"}
{"id": "caffeine.max", "type": "int", "unit": "mg/kg", "default": 6, "limit_direction": "none", "owner": "11"}
{"id": "cho.daily_bands", "type": "list", "unit": "g/kg/day", "default": [{"day_min": 0, "g_kg": [3, 5]}, {"day_min": 60, "g_kg": [5, 7]}, {"day_min": 90, "g_kg": [6, 10]}, {"day_min": 240, "g_kg": [8, 12]}], "limit_direction": "none", "owner": "11"}
{"id": "cho.loading_band", "type": "list", "unit": "g/kg/day", "default": [10, 12], "limit_direction": "none", "owner": "11"}
{"id": "protein.daily_band", "type": "list", "unit": "g/kg/day", "default": [1.2, 2.0], "limit_direction": "none", "owner": "11"}
{"id": "trainlow.min_aer_level", "type": "int", "unit": "level", "default": 3, "limit_direction": "lower", "owner": "11"}
{"id": "knopp.range", "type": "map", "unit": "—", "default": {"weekly_mean_km": [43, 59, 108], "longest_km": [31, 35], "z45_share": 0.06}, "limit_direction": "none", "owner": "14 (values); INV-23 defined in 07"}
{"id": "knopp.range.ultra", "type": "map", "unit": "km/week peak by goal tier", "default": {"finish": [45, 50], "bronze": [50, 65], "tier3": [60, 70], "tier4": [75, 80], "silver": [100, 120]}, "limit_direction": "none", "owner": "14"}
{"id": "val.conformance_tol_pct", "type": "int", "unit": "%", "default": 10, "limit_direction": "none", "owner": "14"}
{"id": "val.removal_material_pct", "type": "int", "unit": "%", "default": 5, "limit_direction": "none", "owner": "14"}
{"id": "val.property_cases_min", "type": "int", "unit": "cases", "default": 100000, "limit_direction": "lower", "owner": "14"}
{"id": "val.comprehension_n", "type": "int", "unit": "runners / %", "default": 8, "limit_direction": "none", "owner": "14"}
{"id": "val.comprehension_pass_pct", "type": "int", "unit": "runners / %", "default": 80, "limit_direction": "none", "owner": "14"}
{"id": "val.pilot_n", "type": "int", "unit": "runners", "default": 60, "limit_direction": "none", "owner": "14"}
{"id": "val.pilot_min_hours", "type": "int", "unit": "h", "default": 2000, "limit_direction": "lower", "owner": "14"}
{"id": "val.injury_days_lost", "type": "int", "unit": "days", "default": 7, "limit_direction": "none", "owner": "14"}
{"id": "val.long_run_review_ratio", "type": "number", "unit": "injury rate ratio, weeks with a long run > 150 min vs other weeks", "default": 1.5, "limit_direction": "upper", "owner": "14"}
{"id": "display.duration_round_min", "type": "map", "unit": "min", "default": {"le60": 5, "gt60": 10}, "limit_direction": "upper", "owner": "12"}
{"id": "display.distance_round_km", "type": "map", "unit": "km", "default": {"default": 0.5, "ge20km": 1}, "limit_direction": "none", "owner": "12"}
{"id": "display.time_round_s", "type": "map", "unit": "s", "default": {"default": 60, "races_le30min": 15}, "limit_direction": "none", "owner": "12"}
{"id": "display.pace_round_s", "type": "int", "unit": "s/km", "default": 5, "limit_direction": "none", "owner": "12"}
{"id": "display.max_reasons_card", "type": "int", "unit": "reasons", "default": 2, "limit_direction": "upper", "owner": "12"}
{"id": "inp.no_unknown_fields", "type": "set", "unit": "field list", "default": ["screen.answers", "screen.followup_answers", "event.C1", "event.C2", "event.C3", "event.C4", "event.B1", "event.B2", "event.B3", "event.B4", "event.B5", "event.H1", "event.H2", "event.E1", "event.P1", "event.P2", "event.I1", "event.I2", "event.I3", "profile.special_status", "profile.birth_month", "profile.birth_year", "screen.guardian_attested_on"], "limit_direction": "none", "owner": "01"}
{"id": "lr.long_guard_min", "type": "int", "unit": "min", "default": 180, "limit_direction": "lower", "owner": "05"}
{"id": "lr.long_guard_tol_level", "type": "int", "unit": "TOL level", "default": 4, "limit_direction": "none", "owner": "05"}
{"id": "pain.answered_min_ratio", "type": "number", "unit": "share of the last 14 days' sessions with an answered pain prompt", "default": 0.7, "limit_direction": "lower", "owner": "05"}
{"id": "pain.hold_step_weeks", "type": "int", "unit": "weeks", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "claim.l30_cap_by_tol", "type": "map", "unit": "min", "default": {"0": 30, "1": 60, "2": 90, "3": 120, "4": null, "5": null}, "keys": "tol_tier", "limit_direction": "upper", "owner": "07"}
{"id": "claim.l30_check_min_runs", "type": "int", "unit": "runs/week", "default": 2, "limit_direction": "lower", "owner": "07"}
{"id": "race.recovery_days", "type": "map", "unit": "days between goal races", "default": {"5K": 7, "10K": 10, "HM": 14, "M": 28, "50K": 42, "100K": 42}, "keys": "distance", "limit_direction": "upper", "owner": "07"}
{"id": "ladder.est_pace_s_per_km", "type": "int", "unit": "s/km, run-walk at S5+", "default": 660, "limit_direction": "none", "owner": "03"}
{"id": "ladder.runwalk_race_min_rung", "type": "int", "unit": "rung index", "default": 5, "limit_direction": "lower", "owner": "03"}
{"id": "pp.due_ask_days", "type": "int", "unit": "days before due_date", "default": 14, "limit_direction": "none", "owner": "10"}
{"id": "anchor.jump_confirm_mult", "type": "int", "unit": "× pace.deadband_pct", "default": 2, "limit_direction": "none", "owner": "01"}
{"id": "result.rpe_high", "type": "int", "unit": "RPE 0–10", "default": 8, "limit_direction": "none", "owner": "08"}
{"id": "result.rpe_high_sessions", "type": "int", "unit": "consecutive sessions ≥ E3", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "cmp.heat_required_level", "type": "int", "unit": "HEAT level", "default": 2, "limit_direction": "none", "owner": "03"}
{"id": "phs.sharpen_max_weeks", "type": "int", "unit": "weeks", "default": 4, "limit_direction": "upper", "owner": "04"}
{"id": "b2b.min_dur_level", "type": "int", "unit": "levels", "default": 4, "limit_direction": "lower", "owner": "09"}
{"id": "b2b.min_tol_level", "type": "int", "unit": "levels", "default": 5, "limit_direction": "lower", "owner": "09"}
{"id": "miss.refeas_hold_weeks", "type": "int", "unit": "consecutive ADP-022 weeks before feasibility re-runs", "default": 2, "limit_direction": "none", "owner": "08"}
{"id": "engine.max_iterations", "type": "int", "unit": "passes per stage", "default": 5, "limit_direction": "upper", "owner": "12"}
{"id": "ask.no_answer_days", "type": "int", "unit": "days before an ask_confirm counts as unanswered", "default": 7, "limit_direction": "none", "owner": "12"}
{"id": "quality.min_hab_level", "type": "int", "unit": "HAB level below which no key session is planned", "default": 2, "limit_direction": "lower", "owner": "06"}
{"id": "quality.low_tol_level", "type": "int", "unit": "TOL level at or below which at most 1 key session is planned", "default": 2, "limit_direction": "none", "owner": "06"}
{"id": "quality.method_default_max", "type": "int", "unit": "key sessions per week (BUILD, SPECIFIC)", "default": 2, "limit_direction": "upper", "owner": "06"}
{"id": "quality.non_key_runs_min", "type": "int", "unit": "runs a week that are not key sessions (the long run and at least one easy run; owner Q2)", "default": 2, "limit_direction": "lower", "owner": "06"}
{"id": "quality.key_modules.<preset>.<phase>", "type": "map", "unit": "module lists", "default": {"method_default": {"BASE": ["SES-M-006", "SES-M-007", "SES-M-008", "SES-M-012"], "BUILD": ["SES-M-008", "SES-M-010", "SES-M-012"], "SPECIFIC": ["SES-M-011", "SES-M-009"]}}, "keys": "preset, phase", "limit_direction": "none", "owner": "06", "note": "BASE: SES-M-008/012 only in late BASE (allowed phases); SPECIFIC falls back to the BUILD list for levels still missing (07 §2b)"}
{"id": "ses.target_rpe", "type": "map", "unit": "session RPE 0–10 (whole session)", "default": {"E1": 3, "E2": 5, "E3": 6, "E4": 7}, "keys": "effort", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.<SES-M-id>.steps", "type": "segments", "unit": "ordered dose steps", "default": "one concrete entry per module below", "keys": "module", "limit_direction": "none", "owner": "06"}
{"id": "ses.msp_rep_max_min", "type": "map", "unit": "min per race-effort repeat (SES-M-011)", "default": {"5K": 10, "10K": 10, "HM": 15, "M": 20}, "keys": "distance", "limit_direction": "upper", "owner": "06"}
{"id": "ses.runwalk.entry_rung", "type": "map", "unit": "index into ses.runwalk.ladder", "default": {"preference": 2, "hab_low": 1}, "limit_direction": "none", "owner": "06"}
{"id": "ses.exit_test.<node>.<level>", "type": "map", "unit": "test session", "default": {"HAB": {"2": {"module": "SES-M-018", "segments": [{"effort": "E1", "duration_s": 1800, "repeats": 1}]}}, "THR": {"1": {"module": "SES-M-008", "segments": [{"effort": "E3", "duration_s": 480, "repeats": 2, "recovery_s": 120}]}, "2": {"module": "SES-M-008", "segments": [{"effort": "E3", "duration_s": 300, "repeats": 5, "recovery_s": 120}]}, "3": {"module": "SES-M-009", "segments": [{"effort": "E3", "duration_s": 1800, "repeats": 1}]}, "4": {"module": "SES-M-009", "segments": [{"effort": "E3", "duration_s": 900, "repeats": 3, "recovery_s": 180}]}}, "VO2": {"2": {"module": "SES-M-010", "segments": [{"effort": "E4", "duration_s": 180, "repeats": 5, "recovery_s": 180}]}, "3": {"module": "SES-M-010", "segments": [{"effort": "E4", "duration_s": 180, "repeats": 6, "recovery_s": 180}]}}, "MSP": {"1": {"module": "SES-M-011", "share_level": 1}, "2": {"module": "SES-M-011", "share_level": 2}, "3": {"module": "SES-M-011", "share_level": 3}}, "DUR": {"1": {"module": "SES-M-003", "long_run_min": 60}, "2": {"module": "SES-M-003", "long_run_min": 90}, "3": {"module": "SES-M-003", "long_run_min": "ses.exit.DUR3_min"}, "4": {"module": "SES-M-004", "long_run_min": 180}}}, "keys": "node, level", "limit_direction": "none", "owner": "06"}
{"id": "cmp.max_level.<node>", "type": "map", "unit": "level", "default": {"HAB": 4, "TOL": 5, "AER": 5, "THR": 4, "VO2": 3, "ECO": 3, "DUR": 5, "MSP": 3, "FUEL": 4, "HEAT": 2, "PACE": 3}, "keys": "node", "limit_direction": "upper", "owner": "02"}
{"id": "cmp.node_tie_order", "type": "list", "unit": "order", "default": ["DUR", "THR", "AER", "MSP", "VO2", "ECO", "FUEL"], "limit_direction": "none", "owner": "02"}
{"id": "dst.msp_segment_max_ratio", "type": "number", "unit": "× the long run's duration (race-effort segment)", "default": 0.6, "limit_direction": "upper", "owner": "09"}
{"id": "fuel.reach_tol_g_h", "type": "int", "unit": "g/h below the step that still counts as reaching it", "default": 5, "limit_direction": "none", "owner": "11"}
{"id": "fuel.level_band", "type": "map", "unit": "g/h (lower edge proves the level, NUT-013)", "default": {"1": [30, 30], "2": [45, 60], "3": [60, 90], "4": [90, null]}, "keys": "level", "limit_direction": "none", "owner": "11"}
{"id": "fuel.l3_level", "type": "int", "unit": "FUEL level that needs race-effort practice runs", "default": 3, "limit_direction": "none", "owner": "11"}
{"id": "fuel.required_level_mid", "type": "int", "unit": "FUEL level required for races > 90 min / > 2.5 h (time goals only for L3; owner Q6)", "default": 2, "limit_direction": "none", "owner": "02"}
{"id": "fuel.required_level_long", "type": "int", "unit": "FUEL level required for races > 90 min / > 2.5 h (time goals only for L3; owner Q6)", "default": 3, "limit_direction": "none", "owner": "02"}
{"id": "tid.hard_share_max.HM", "type": "number", "unit": "fraction of weekly time at E3–E4 for the half marathon (owner Q10)", "default": 0.15, "limit_direction": "upper", "owner": "05"}
{"id": "heat.exposure_max_min", "type": "int", "unit": "min per heat-exposure easy run (SES-M-022)", "default": 60, "limit_direction": "upper", "owner": "11"}
{"id": "ses.dose.SES-M-002.steps", "type": "segments", "unit": "steps", "default": [{"total_s": 1200}, {"total_s": 1500}, {"total_s": 1800}, {"total_s": 2100}, {"total_s": 2400}, {"total_s": 2700}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-006.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E5", "reps": 4, "rep_s": 20, "rec_s": 60, "rec_effort": "E0"}, {"effort": "E5", "reps": 6, "rep_s": 20, "rec_s": 60, "rec_effort": "E0"}, {"effort": "E5", "reps": 8, "rep_s": 20, "rec_s": 60, "rec_effort": "E0"}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-008.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E3", "reps": 3, "rep_s": 300, "rec_s": 120}, {"effort": "E3", "reps": 3, "rep_s": 360, "rec_s": 120}, {"effort": "E3", "reps": 3, "rep_s": 420, "rec_s": 120}, {"effort": "E3", "reps": 3, "rep_s": 480, "rec_s": 120}, {"effort": "E3", "reps": 4, "rep_s": 480, "rec_s": 120}, {"effort": "E3", "reps": 5, "rep_s": 480, "rec_s": 120}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-009.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E3", "reps": 1, "rep_s": 900}, {"effort": "E3", "reps": 1, "rep_s": 1200}, {"effort": "E3", "reps": 1, "rep_s": 1500}, {"effort": "E3", "reps": 1, "rep_s": 1800}, {"effort": "E3", "reps": 1, "rep_s": 2100}, {"effort": "E3", "reps": 1, "rep_s": 2400}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-010.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E4", "reps": 5, "rep_s": 120, "rec_s": 120}, {"effort": "E4", "reps": 6, "rep_s": 120, "rec_s": 120}, {"effort": "E4", "reps": 5, "rep_s": 180, "rec_s": 180}, {"effort": "E4", "reps": 6, "rep_s": 180, "rec_s": 180}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-011.steps", "type": "segments", "unit": "steps", "default": [{"effort": "race", "share": 0.1, "rec_s": 120}, {"effort": "race", "share": 0.15, "rec_s": 120}, {"effort": "race", "share": 0.2, "rec_s": 120}, {"effort": "race", "share": 0.25, "rec_s": 120}, {"effort": "race", "share": 0.3, "rec_s": 120}, {"effort": "race", "share": 0.4, "rec_s": 120}, {"effort": "race", "share": 0.5, "rec_s": 120}, {"effort": "race", "share": "L3", "rec_s": 120}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-012.steps", "type": "segments", "unit": "steps", "default": [{"total_s": 2400, "shares": {"E1": 0.7, "E2": 0.15, "E3": 0.15}}, {"total_s": 3000, "shares": {"E1": 0.7, "E2": 0.15, "E3": 0.15}}, {"total_s": 3600, "shares": {"E1": 0.7, "E2": 0.15, "E3": 0.15}}, {"total_s": 4200, "shares": {"E1": 0.7, "E2": 0.15, "E3": 0.15}}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-013.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E2", "reps": 1, "rep_s": 1800}, {"effort": "E2", "reps": 1, "rep_s": 2400}, {"effort": "E2", "reps": 1, "rep_s": 3000}, {"effort": "E2", "reps": 1, "rep_s": 3600}, {"effort": "E2", "reps": 1, "rep_s": 4500}, {"effort": "E2", "reps": 1, "rep_s": 5400}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-018.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E1", "reps": 1, "rep_s": 1800}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-019.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E4", "distance_m": 3000}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-020.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E4", "distance_m": 2000, "then_rec_s": 900, "then": {"effort": "E5", "distance_m": 400}}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-022.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E1", "total_s": 1800}, {"effort": "E1", "total_s": 2400}, {"effort": "E1", "total_s": 3000}, {"effort": "E1", "total_s": 3600}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-024.steps", "type": "segments", "unit": "steps", "default": [{"effort": "E3", "reps": 2, "rep_s": 300, "rec_s": 120}, {"effort": "E4", "reps": 4, "rep_s": 60, "rec_s": 60}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-003.steps", "type": "segments", "unit": "steps", "default": [{"from": "05 long-run curve"}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-004.steps", "type": "segments", "unit": "steps", "default": [{"from": "05 long-run curve", "intake": "NUT-010"}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-005.steps", "type": "segments", "unit": "steps", "default": [{"from": "05 long-run curve", "segment": "DST-006"}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
{"id": "ses.dose.SES-M-021.steps", "type": "segments", "unit": "steps", "default": [{"from": "last logged dose (SES-018)"}], "family": "ses.dose.<SES-M-id>.steps", "limit_direction": "none", "owner": "06"}
```

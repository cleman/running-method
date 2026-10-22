# 13 — Worked examples (v5.1)

Serves criteria 11 and 12. Feeds the fixtures of 14: TST-075, TST-083…089, TST-093, TST-095…106 (red team), TST-110…112 (oracle agreement), TST-120 and TST-122…125 (renumbered), TST-127 (Karim) and TST-128 (Rose). This module has no rules. **v5 is self-contained:** every table below is computed under the v5 rules and parameters (v5.1: P3 weeks 5–7 and the week-6 card recomputed under LOD-007/008, Tom's re-test row added for ADP-067; see R-06); nothing is deferred to an earlier version (p2-A R1).

> **In plain words.** Three runners are followed week by week through a whole plan: a never-runner aiming at a 5K, a first marathon, and a 100 km ultra. One week is shown exactly as the runner sees it on the phone. Then come every test case the plenary rooms and the red team used, with what v5 does in each.

## 0. Conventions

- **Units:** minutes (time on feet, walk breaks included), km, min:s per km. "V" = planned weekly time; "LR" = long run.
- **Values are hand-computed** from the formulas of 03 §2–§4 and 05 §2–§5. The oracle (TST-110…112) must reproduce them before the S-group invariants count as tested. Minutes are rounded down to whole minutes (`load.round_down_s` = 60 s).
- **`S_slow`** is used for demand only (FEA-002). **Time governs demand,** but a *measured* distance already run meets the long-run demand (03 §2).
- **"S8 pass (hand-checked, not executed)"** = INV-01…31 were checked by hand against the table; no generator or validator has run (parity, TST-092, is a future test).
- **Deload placement** (04 PHS-001/004/006; the same reading as the PHS-004 record): a deload every `deload.every` weeks, counted from the last deload placed. `weeks_to_phase_boundary` (12 §2b) = full weeks left in the current phase after this week (0 = last week). A deload with `weeks_to_phase_boundary` ≤ 1 moves to the last week of its phase; if that leaves fewer than `deload.min_gap_weeks` loading weeks since the previous deload, it stays (PHS-006); deloads within `deload.exclusion_before_taper` weeks of the taper are dropped (PHS-002).
- **Headlines** (messages.md §1): ambitious, tight, uncertain. **ESTIMATED_INPUTS** is a label, never a verdict reason.
- **Band wording** (messages.md §0): `{fast_edge}` = P_race × (1 − B_fast), `{point}` = P_race, `{slow_edge}` = P_race × (1 + B_slow); the card always says whether the target is inside the range. Displayed times are rounded up to the minute.

## 1. Personas and verdicts

| # | Day-0 state | Goal | v5 verdict (headline) | Key rules |
|---|---|---|---|---|
| P1 Maya, 34 | never ran; log none; no anchor; Tue/Thu/Sat | 5K finish, 10 weeks | **stretch: tight** (LOW_SLACK, slack 0) + ESTIMATED_INPUTS label | SAF-086 start ladder S1–S9; no deloads in the ladder (10 §4b); MSG-FEA-NEVERRUN-DATE first offers 12 weeks; she keeps 10 |
| P2 Tom, 38 | claims only; 10K 52:00 run 42 days before joining → **estimated** | 10K 48:00, 12 weeks | **stretch: ambitious** (TARGET_IN_FAST_BAND) | §2 trace (corrected band wording) |
| P3 Ana, 31 | claims only: 4 runs, 210 min/week, L30 95 min, HM 2:08 recalled; 360 min available; Tue/Thu/Sat/Sun | marathon finish, 18 weeks | **feasible** + ESTIMATED_INPUTS label | §3 full plan; v5.1 LOD-007/008 (weekly cap until 6 logged weeks) |
| P4, 58 | rich log; HM measured | marathon 3:35, 16 weeks | **feasible** | expected duration 178.6 ≤ 180 → no run over the guard; SAF-060 silent (< 65); SAF-061 shows MSG-SAF-061 once per season (age ≥ `masters.cv_advice_age`, sessions ≥ E3, age ≥ `ctx.masters_age`) |
| P5, 42 | rich log 16 weeks; V28 540 min (≈ 85 km), L30 210 min / 33 km measured; marathon 3:25 measured 10 weeks ago; Tue–Sun, 6 runs, 720 min; b2b opt-in | 100K finish, 24 weeks | **feasible** | §4 full plan |

## 2. Day-0 traces (p1-C R10; P2 corrected in v5, p2-A R4)

### P2 Tom: onboarding → first field test

| When | State | What the runner sees | Rules |
|---|---|---|---|
| Day 0 | Claims: 4 runs, 200 min, L30 75 min (estimated). Anchor 10K 52:00, run 42 days ago and entered today → **estimated** (INP-005). `log_status = sparse` | "Your plan is ready. Your goal is ambitious for your current fitness." Reason: "48:00 is inside the fast end of the range your current fitness suggests (48:00 to 57:00, most likely around 51:00)." Engine values: P_race 50:58, fast edge 47:24, slow edge 56:19 (R-05) (B_slow 7% × `pred.band_widen_estimated` 1.5); displayed edges rounded up. Label: "Based partly on your estimates." MSG-ONBOARD-NOPACE | FEA-010, FEA-033, FEA-035 (label), GEN-011 (L30_eff = 0.9 × 75 = 67), GEN-014 (slow) |
| Weeks 1–2 | ONBOARD, effort only. LR 67 → 73 min (1.10 × L30_eff). Quality 0; strides allowed. Every tick asks "Any pain?" (INP-022) | Card: effort words, durations, "why" sentences | LOD-010, LOD-034, SES-021, INP-022 |
| End of week 2 | FT-1: 3 km in 14:20, logged the same day → **measured** | 10K-equivalent 51:21; P_race 50:20; band 7% (a 3 km test is not the same distance), not widened: 46:48 to 53:51 → shown "47:00 to 54:00, most likely around 50:20 → 51:00". "Your goal 48:00 is inside this range." Paces appear: E3 ≈ 5:20–5:35 /km (FEA-014) | INP-005, INP-025 silent (not > 2 × deadband faster than the claim band), FEA-014, FEA-052 |
| Week 3 | 6 measured runs in 2 weeks → rich; after `log.probation_weeks` (3) → standard profile from week 4; ≥ 70% of sessions have an answered pain tap → step-ups allowed (LOD-006). v5.1: his weekly time still grows ≤ 1.10 × his best logged week of the last 4 until 6 logged weeks confirm his claimed 200 min (end of week 6) | "Your plan has been sharpened by your logged runs." | GEN-014, LOD-006, ADP-010, LOD-007/008 |
| Week 6 (v5.1, illustrative) | Tom races a parkrun-style 5K in 23:40, logged the same day → measured; 10K-equivalent 49:21, 3.9% faster than FT-1's 51:21: above `pace.deadband_pct` (3.5%) but below the minimum detectable change (2.8 × 3.4% ≈ 9.5%) | "Your result is 3% away from your last one…" (MSG-ADP-PACE-PENDING; 3.9 shown as a whole number, rounded down). Paces unchanged (v5 would have raised them 3% at once, to 49:49). The predicted range uses the new result (F-11) | ADP-067 (pending), FEA-052 |
| Week 10 (v5.1, illustrative) | 5K in 23:45 → 10K-equivalent 49:31, 3.6% faster than 51:21, same direction, 28 days after the pending one (≤ 42) | "Two results now agree…" (MSG-ADP-PACE-CONFIRMED). Active 10K-equivalent = mean(49:21, 49:31) = **49:26** (−3.8%); paces recomputed from it | ADP-067 (confirmed), FEA-014 |

### P3 Ana: see §3 (full plan from day 0).

## 3. P3 Ana — first marathon, finish, 18 weeks (complete v5 plan)

**Day 0.** Claims only → `log_status = sparse`. L30_eff = 0.9 × 95 = **85 min** (GEN-011; ≤ `claim.l30_cap_by_tol`[TOL 3] = 120). Slow profile for 3 weeks (GEN-014, CTX-007). V_hold = 210. `S_slow` from the claims (32 km / 210 min, + 10% margin) = 7:17 /km. Gate: SCR-003 proceed. Age 31: no CTX-004.

**Demand (03 §2).** L_req_time = max(min(42.195/1.40 km at S_slow = 219, 180), 21.1 km at S_slow = 154) = **180 min**; distance stop min(42.195/1.40, 32) = **30.1 km** ("180 min or 30.1 km, whichever comes first"). V_req = max(AER, TOL, floor 240, 180/0.50 = 360) = **360** ≤ 360 available. HAB 2 (3 runs) suffices; she has 4.

**Weeks needed (03 §4, dry run).** n_L: 85 → 180 at ×1.10 = 8 loading weeks; n_V: 210 → 360 (slow for 3 weeks, then LOD-007 at the same 10% until the baseline is confirmed: closed form = 6 loading weeks; dry run: 360 in week 7, v5.1); with deloads G = 10 growth weeks (ONBOARD inside them). BUILD 1 and SPECIFIC 4 overlap the last growth weeks, leaving base 5: weeks needed = base 5 + build 1 + specific 4 + taper 3 = 13 → **slack = 18 − 13 = 5** (≥ `feas.stretch_margin_weeks`) → **feasible**. The plan uses the slack as a longer BASE and BUILD, not as extra load. Prediction: information only (finish goal), band around 4:40 with the slow side widened (estimated anchor, low volume). Label ESTIMATED_INPUTS.

**Phases.** ONBOARD 1–2 · BASE 3–8 · BUILD 9–11 · SPECIFIC 12–15 · TAPER 16–18 (race Sunday of week 18). **Deloads:** 4 (`weeks_to_phase_boundary` 4 → stays), 8 (last BASE week, 0 → stays), **12** (3 → stays; v5-preaudit moved it to 11 under a two-sided reading the record did not implement, R-03/R-05), 16 falls in the taper → dropped (PHS-002).

| Wk | Phase | Profile | V (min) | LR (min) | LR share | Key sessions (06) | E3+ min (≤ 10%) | Checks and notes |
|---|---|---|---|---|---|---|---|---|
| 1 | ONBOARD | slow | 231 | 93 | 0.40 | none; strides | 0 | V ≤ 1.10 × 210; LR ≤ 1.10 × 85 |
| 2 | ONBOARD | slow | 252 | 102 | 0.40 | **FT-1** (SES-M-019) at week end | test | V ≤ 1.20 × 210 (2-week cap); test sets paces |
| 3 | BASE | slow | 277 | 112 | 0.40 | strides; 1 progression run (SES-M-012) | ≤ 8 | last probation week |
| 4 | BASE **deload** | — | 207 | 84 | 0.41 | 1 short key at kept intensity | ≤ 6 | floor(0.75 × 277) = 207 (R-05) |
| 5 | BASE | standard + LOD-007 | **304** | 123 | 0.40 | THR intervals 3 × 5 min (SES-M-008) | 15 | v5.1: baseline unconfirmed (4 logged weeks) → V ≤ floor(1.10 × max(231, 252, 277, 207)) = 304 (LOD-003 alone: 1.15 × 277 = 318); LR ≤ 1.10 × 112 (wk 3, 14 days ago) |
| 6 | BASE | standard + LOD-007 | **334** | 135, fuelled 30 g/h | 0.40 | THR 3 × 8 min | 24 | v5.1: V ≤ floor(1.10 × max(252, 277, 207, 304)) = 334 (LOD-003 alone: min(1.15 × 304, 1.30 × 277) = 349); FUEL L1 practice (SES-M-004, `fuel.start_g_h`); **§6 shows this week as the runner sees it** |
| 7 | BASE | standard | 360 | 148, fuelled 30 g/h | 0.41 | THR 3 × 8 min | 24 | v5.1: weeks 1–6 logged at ≥ 0.80 × planned → baseline confirmed (LOD-008), LOD-007 lifts; V ≤ min(1.15 × 334, 1.30 × 304) → V_req 360 reached; 2nd fuelled run → **FUEL L1** (`fuel.exit_runs` 2), needed to schedule runs > 150 min (02 §3) |
| 8 | BASE **deload** | — | 270 | 111 | 0.41 | THR 2 × 8 min | 16 | |
| 9 | BUILD | standard | 360 | **162**, fuelled 45 g/h | 0.45 | THR 4 × 8 min + steady 30 min E2 (SES-M-013) | 32 | LR ≤ floor(1.10 × 148) = 162 (R-05; v5-preaudit had 163, an INV-01/02 breach) |
| 10 | BUILD | standard | 360 | **178**, fuelled 45 g/h | 0.49 | THR 2 × 15 min (SES-M-009) + steady 30 min | 30 | floor(1.10 × 162) = 178; 2nd run at 45 g/h with GI ≤ 2 → **FUEL L2**; **TOL L4 measured** (non-deload V28 360, L30 ≥ 150) |
| 11 | BUILD | standard | 360 | 180 | 0.50 | THR 2 × 15 min | 30 | min(floor(1.10 × 178) = 195, L_target 180) |
| 12 | SPECIFIC **deload** | — | 270 | 135 | 0.50 | THR 2 × 10 min | 20 | PHS-004 (record reading): `weeks_to_phase_boundary` = 3 → stays in wk 12 (R-03, R-05) |
| 13 | SPECIFIC | standard | 360 | **180** or optional **extension** "29 km or 198 min" (≈ 189 min at her logged 6:30) | 0.50 / 0.53 | THR 2 × 15 min + fuelled long run 45–50 g/h | 30 | extension: DST-019 needs TOL L4 measured ✓ (wk 10) and FUEL L2 ✓ (wk 10), no flags; ≤ floor(1.10 × L30_eff 180) = 198; expected 189 > 180 → LOD-017 needs TOL L4 measured ✓ |
| 14 | SPECIFIC | standard | 360 | 180 | 0.50 | THR 2 × 15 min + race rehearsal in the long run (SES-M-023) | 30 | LOD-018: no other run > 180 min within 14 days of wk 13 (180 is not > 180) |
| 15 | SPECIFIC | standard | 360 | 180 | 0.50 | THR 2 × 12 min | 24 | a 2nd extension would need wk 16 (21 days, `lr.m_ext_min_gap_days`), which is taper → none |
| 16 | TAPER k1 | — | 288 | 144 | 0.50 | sharpener (SES-M-024) 2 × 8 min E3 | 16 | V_ref 360, LR_ref 180; −20% (05 §6) |
| 17 | TAPER k2 | — | 234 | 117 | 0.50 | sharpener 2 × 5 min | 10 | −35% |
| 18 | TAPER k3 / RACE | — | 180 + race | none | — | strides; race Sunday | — | −50%; race week: easy runs and strides, no long run |
| 19–20 | TRANSITION | — | ≤ 180 | — | — | easy only | 0 | `phs.transition_weeks` M 2; ≤ 0.50 × V_ref |

Runs per week: 4 (long run Sunday, key Tuesday, easy Thursday and Saturday). The days next to the long run obey LOD-013 (Saturday ≤ min(0.50 × LR, 1.60 × L30_eff − LR)). **S8 pass (hand-checked, not executed):** INV-01/02 (each LR ≤ 1.10 × the previous 30-day max), INV-03 (Saturday), INV-13 (LR ≤ 180, extensions are ledger entries under `lr.over_cap_pct` 0.60), INV-16 (≤ 15% on the last non-deload week; v5.1: ≤ 10% on the best logged week of the last 4 until week 7, LOD-007), INV-19 (no deload in the taper), INV-28 (extension needs TOL L4 measured; Ana is 31). **INV-25:** peak LR 180 ≥ L_req 180 ✓.

**Adaptation: the week-13 extension is missed.** ADP-020 drops it; ADP-022 holds week 14 at the last completed comparable week (LR 180). No second extension fits before the taper. Extensions are not demand, so feasibility is unchanged; INV-04 ✓.

## 4. P5 — 100K finish, 24 weeks (complete v5 plan)

**State.** Rich log, standard profile, gate proceed. TOL 5 measured (V28 540, L30 210), DUR 4, FUEL 2 (45 g/h, GI ≤ 2). No preset → `method_default` with the Koop order and ultra caps (DST-017).

**Demand.** L_req = 100 km / 2.50 = **40 km = 281.5 min** ≤ 330 (`lr.ultra_time_cap_min.100K`); distance floor 33.3 km met (FEA-003 silent). V_req 469; V_peak 600 (≤ 720 available). Prediction (information): 8:32–10:30 (ultra exponents 1.06–`pred.ultra_exp_high`). EAH card (NUT-032, > 4 h).

**Weeks needed.** LR 210 → 281.5 with peaks every 2 weeks ≈ 8 weeks; FUEL gap 1 → K 4; base 5 + build 1 + specific 4 + taper 3 = 13 → **slack 11** → **feasible**.

**Phases.** BASE 1–5 · BUILD 6–11 (VO2 6–7, THR 8–9, steady 10–11; DST-003) · SPECIFIC 12–21 · TAPER 22–24. **Deloads:** 4 (`weeks_to_phase_boundary` 1 → moves to **5**, the last BASE week), 9 (2 → stays), 13 (8 → stays), 17 (4 → stays); 21 dropped (taper exclusion). **Peak long-run weeks** every 2 weeks, restarting after each deload; non-peak LR = 0.70 × last peak (`dst.ultra_alt_long_ratio`); the 0.60 share cap applies to peak weeks only.

Every long run over `lr.long_guard_min` (180) must be ≥ 14 days from the next one (LOD-018, INV-29). v5 LOD-018 caps the **non-peak** and **deload** long runs of such a plan at 180, so only peaks exceed 3 hours (13 R-04).

| Wk | Phase | V | LR (min) | Peak? | Other key sessions | Checks and notes |
|---|---|---|---|---|---|---|
| 1 | BASE | 600 | 231 | peak | strides; hill sprints | V ≤ 1.15 × 540; LR ≤ 1.10 × 210; > 180 → TOL 5 measured ✓, run-walk by effort (SES-009) |
| 2 | BASE | 600 | 161 | — | steady 40 min E2 | 0.70 × 231 |
| 3 | BASE | 600 | 254 | peak | strides | ≤ 1.10 × 231; share 0.42 ≤ 0.60; 14 days after wk 1 |
| 4 | BASE | 600 | 177 | — | steady 40 min | 0.70 × 254 |
| 5 | BASE **deload** | 450 | 180 | — | 1 short key | 0.75 × 254 = 190 → **180** (LOD-018: 7 days before the wk-6 peak) |
| 6 | BUILD (VO2) | 600 | 279 | peak | VO2 5 × 3 min (SES-M-010) | ≤ 1.10 × 254 (wk 3, 21 days ago); 21 days after wk 3 |
| 7 | BUILD (VO2) | 600 | 180 | — | VO2 6 × 3 min | 0.70 × 279 = 195 → **180** |
| 8 | BUILD (THR) | 600 | **281** | peak (= L_req) | THR 3 × 10 min | 14 days after wk 6 |
| 9 | BUILD **deload** | 450 | 180 | — | THR 2 × 10 min | 0.75 × 281 = 210 → **180** |
| 10 | BUILD (steady) | 600 | 281 | peak | steady 60 min E2 | |
| 11 | BUILD (steady) | 600 | 180 | — | steady 60 min | 196 → **180** |
| 12 | SPECIFIC | 600 | 281, fuelled 60 g/h | peak | steady with E2 block | FUEL L3 practice (NUT-011) |
| 13 | SPECIFIC **deload** | 450 | 180 | — | 1 short key | 210 → **180** |
| 14 | SPECIFIC | 600 | **b2b pair**: Sat 281 + Sun 109 | peak | fuelled steady 60 min | DST-010 ✓ (ultra, DUR 4, TOL 5, opt-in, SPECIFIC, rich, no flag); day 2 = 0.40 × 281 = 112 → **109** by LOD-060 (pair ≤ 0.65 × 600 = 390; ≤ 1.75 × 281 = 491); the pair counts once for LOD-018 |
| 15 | SPECIFIC | 600 | 180 | — | steady 60 min | 196 → **180** |
| 16 | SPECIFIC | 600 | 281 | peak | race rehearsal (SES-M-023) | |
| 17 | SPECIFIC **deload** | 450 | 180 | — | 1 short key | 210 → **180** |
| 18 | SPECIFIC | 600 | 281 | peak | steady | |
| 19 | SPECIFIC | 600 | 180 | — | steady | the tune-up cannot sit here (7 days after wk 18; LOD-018 moves it, R-01) |
| 20 | SPECIFIC | 600 | **tune-up** 44 km ≈ 309 | peak | — | DST-012: 4 weeks out (inside 4–6); the 50 km target is capped at 1.10 × L30_eff (281) = 309; exempt from the ultra time cap only, never from INV-01/02/03; 14 days after wk 18; `dst.tuneup_recovery_days` 7 |
| 21 | SPECIFIC | 600 | 180 | — | steady, after 7 easy days | 0.70 × 309 = 216 → **180**; deload dropped (taper exclusion) |
| 22 | TAPER k1 | 480 | 144 | — | sharpener (SES-M-024) | V_ref 600, LR_ref 180 (last non-deload pre-taper week, 05 §6); −20% |
| 23 | TAPER k2 | 390 | 117 | — | sharpener | −35% |
| 24 | TAPER k3 / RACE | 300 + race | none | — | strides | −50%; race Sunday; EAH card (NUT-032) |
| 25–26 | TRANSITION | ≤ 300 | — | — | easy only | ultra 2 weeks |

**S8 pass (hand-checked, not executed):** INV-01/02 (each LR ≤ 1.10 × its 30-day maximum), INV-03 (the pair rule replaces the two-day cap only in wk 14), INV-13, INV-28 (TOL 5 measured; every run over 180 min is run-walk; age 42 < 65), **INV-29** (runs over 180 min: wk 1, 3, 6, 8, 10, 12, 14, 16, 18, 20 — each ≥ 14 days apart), INV-25 (peak 281 ≥ L_req 281.5 − `load.round_down_s`).

**Adaptation: illness in wk 16 (12-day gap).** ADP-042 → rest, then GEN-013 band 8–14: wk 18 LR ≤ floor(0.80 × 281) = **224**. From wk 19, L30_eff counts post-gap runs only (LOD-011) = 224 → tune-up floor(1.10 × 224) = **246 min (≈ 35 km)** (R-05) in wk 20. The peak credit (logged 281 within `feas.peak_credit_days`) keeps the goal: **feasible** (slack 3).

## 5. P1 Maya — never-runner, 5K finish, 10 weeks (complete v5 plan)

**Entry.** Training age 0 and no history → SAF-086 → **start ladder S1** (10 §4b). Three sessions a week (Tue/Thu/Sat), each starting with a 5-minute brisk walk. Effort E1 (talk test); no paces. Every session ends with the one-tap "Any pain?" (INP-022).

**Demand.** For a 5K finish, L_req_time = **30 min** (`race.5k_finish_lr_min`); completing S9 meets it and credits HAB L2. Weeks: ladder 9 (27 sessions / 3) + race week 1 = 10 → **slack 0** → **stretch: tight (LOW_SLACK)**. Before she accepts, MSG-FEA-NEVERRUN-DATE shows the earliest comfortable date (12 weeks).

| Wk | Rung | Sessions (after a 5-min walk) | Running min per session | Time on feet / session | V (min) | Longest | Notes |
|---|---|---|---|---|---|---|---|
| 1 | S1 | 60 s run / 90 s walk, 20 min | 8 | 25 | 75 | 25 | |
| 2 | S2 | 90 s run / 2 min walk, 20 min | ~9 | 25 | 75 | 25 | |
| 3 | S3 | 2 × (90 s run, 90 s walk, 3 min run, 3 min walk) | 9 | 23 | 69 | 23 | |
| 4 | S4 | 3, 5, 3, 5 min runs with 90 s / 2.5 min walks | 16 | 27 | 80 | 27 | ladder steps follow the published programme, not the spike cap (10 §4b) |
| 5 | S5 | 3 × 5 min · 2 × 8 min · 20 min continuous | 15 / 16 / 20 | 26 / 26 / 25 | 77 | 26 | |
| 6 | S6 | 5-8-5 min · 2 × 10 min · 25 min continuous | 18 / 20 / 25 | 29 / 28 / 30 | 87 | 30 | sessions 1–2 CREDIBLE |
| 7 | S7 | 25 min continuous | 25 | 30 | 90 | 30 | |
| 8 | S8 | 28 min continuous | 28 | 33 | 99 | 33 | CREDIBLE |
| 9 | S9 | 30 min continuous | 30 | 35 | 105 | 35 | S9 done → HAB L2, L30_eff 30 min |
| 10 | RACE week | Tue 20 easy · Thu 20 easy + strides · Sat **5K** (≈ 38–40 min) | — | 25 / 25 / ≈ 45 | ≈ 95 | race | goal race exempt (INV-25); race-morning symptom questions |

No deloads inside the ladder; no quality sessions; no paces. A rung advances after 3 clean sessions (pain ≤ 3/10 during, next-morning rule passed); only sessions dated on or after the ladder start, one per day, with the rung's rest spacing, count (SAF-082, v5).

**Adaptation: nothing logged in week 7.** ADP-003: unlogged; the rung does not advance. Re-plan: S7 in wk 8, S8 in wk 9; race week arrives at S8. **LADDER_RUNWALK** (FEA-043b, v5 numbers): rung S8 ≥ S5 ✓; estimated time on feet = 5 km × 660 s/km + 5 min warm-up = **60 min** ≤ 2.0 × longest logged ladder session (S8: 33 min incl. warm-up walk) = 66 ✓; last 3 sessions clean ✓ → degraded completion: **stretch: tight (DEGRADED_COMPLETION)**, race as run-walk at S8's pattern at E1–E2, with the race-morning symptom questions. Card: MSG-FEA-LADDER-RACE. If any of these inputs is unknown (e.g. pain taps unanswered), the earliest date is offered instead.

**Backfill branch (v5).** If she backfills week 7 the same evening (3 sessions dated Tue/Thu/Sat with pain answers), INP-021 does not fire (≤ `log.bulk_backfill_max`), the sessions are estimated, and SAF-082 credits at most one rung from backfill in 7 days → S7 → S8 as planned.

## 6. One week as the runner sees it — P3 Ana, week 6

Displayed with the rounding of messages.md §0. FT-1 at the end of week 2: 3 km in 16:30, logged the same day (measured) → paces from the 03 §3b model (10K-equivalent 59:07, CS 2.82 m/s; E3 = CS × 0.92–0.97 ≈ 6:05–6:25 /km; v5.1 corrects the v5 value 5:55–6:10, which did not follow the model).

> **Week 6 of 18 · Base**
> *Your plan grows a little each week. This week: about 5 h 30 of running.*
>
> **Tuesday — Threshold intervals · 60 min**
> 15 min easy. Then 3 × 8 min **hard but controlled** (you can say only a few words), about 6:05–6:25 /km, with 3 min easy jog between. 15 min easy to finish.
> *Why? This raises the pace you can hold for a long time.*
>
> **Thursday — Easy run · 70 min**
> Easy: you can talk in full sentences. If you can't, slow down or walk.
>
> **Saturday — Easy run · 1 h**
> Easy, the day before your long run.
>
> **Sunday — Long run · 2 h 10**
> Long and easy: full sentences all the way. Finish feeling you could go on. Take water, and practise eating about 30 g of carbohydrate an hour.
> *Why? Long runs build staying power for the end of a race.*
>
> After each run: **Any pain? No / Yes.** After Sunday's run we'll ask again on Monday morning.
>
> *Based partly on your estimates until your log is complete.* (label shown until GEN-014 ends)

Engine values (v5.1, V 334 under LOD-007): Tue 60 (15 + 24 + 2 × 3 jog + 15), Thu 78 (water-filling: the Saturday cap leaves 334 − 60 − 135 − 61), Sat 61 (LOD-013: ≤ min(0.50 × 135, 1.60 × 123 − 135 = 61)), Sun 135 → V 334. E3 time 24 min ≤ 0.10 × 334 ✓; E0–E1 share 0.93 ✓ (LOD-033). Displayed durations: 78 → "70 min", 135 → "2 h 10", week 334 → "5 h 30" (rounded down to 10 min above 60 min; hours above 90 min). v5 had V 360 with a 104-min ("1 h 40") weekday easy run.

## 7. Fixture list (all v5 expected outcomes)

### 7a. Plenary round-1 fixtures (TST-122…125, TST-083…089)

| Case | v5 verdict | Rules that fire |
|---|---|---|
| **p1-A1 Lea** (TST-122): marathon wk 9 → 10K in 6 weeks, 48:30; 10K 50:00 measured 40 days ago | **stretch: ambitious** (TARGET_IN_FAST_BAND: P_race 49:00; range 47:02 to 52:26 (B_slow 7%; R-05) → "48:00 to 53:00"; "48:30 is inside this range") | ADP-080 carry-over: L_hold = min(160, max(60, 0.40 × 330)) = 132; INV-13; TRANSITION not applicable (no race run) |
| **p1-A2 Tom** (TST-123): 5K → 100K over 100 weeks | **feasible** | 5 seasons of 20 weeks (PHS-016) |
| **p1-A3 Raj** (TST-124): half in 4 weeks, L30 17.0 km measured | **feasible** (SHARPEN) | FEA-023: 17.0 ≥ 16.2 km |
| **p1-A4 Mia** (TST-125): 2 days, 10K finish | **infeasible** (AVAILABILITY_DAYS) → change_availability "add a run on Thursday" first; base plan validates | FEA-031, FEA-040 |
| p1-B A–G (TST-083…089) | as in v4 (LADDER_RUNWALK now with the v5 numbers of §5; C: SAF-060 card label "our cautious choice for runners aged 65 and over"; E: "Longer runs open from {date}" (MSG-SAF-023)) | FEA-043b, SAF-060, SAF-044 |
| p1-C Ben | **infeasible** → change_availability "Add 60 min a week and this goal fits" | FEA-040 |

### 7b. Plenary round-2 fixtures (TST-127, TST-128)

| Case | v5 verdict | Trace |
|---|---|---|
| **Karim, 45** (TST-127): 3 runs/week, 25 km/week, 10K 58:00 three weeks ago entered at onboarding (estimated); sub-55 in 10 weeks (H3) | **infeasible** (LEVELS_UNREACHABLE) | P_race 56:50; B_fast 7%, B_slow 10.5% (widened): range 52:52 to 1:02:48 → shown "53:00 to 1:03:00, most likely around 57:00. Your goal 55:00 is inside this range." FEA-021 v5: K_key = THR 0 → 2 × 4 weeks = 8 > W − taper − ONBOARD = 10 − 2 − 2 = 6 → LEVELS_UNREACHABLE. Options (each validated): move_date "race on or after week 12", lower_goal "run it as a finish goal", shorter_distance 5K. v4 passed FEA-021 and failed silently |
| **Rose, 61** (TST-128): never run, 2 days/week, HM finish in 16 weeks | **infeasible** (PHASES_DO_NOT_FIT + AVAILABILITY_DAYS) | Start ladder at 2 runs/week = 14 weeks + taper → does not fit; HAB 2 needs 3 runs. v5 FEA-040 shows first the **combined** option "Add a run on Thursday and race on or after {date ≈ week 35}" (dry run: ladder 9 weeks at 3 runs, then growth from 30 min to the HM long run with deloads every 3 weeks for age ≥ 50 (CTX-004)), then base plan. v4 showed only the base plan |

### 7c. Red-team fixtures (p2-C cases 1–12 → TST-095…106)

| TST | Case | What the runner sees under v5 | Rules |
|---|---|---|---|
| 095 | 58, unsure on the chest-pain item | The item offers only Yes / No. Closing the screen leaves no plan: "Please answer the health questions first." | INP-001 (`inp.no_unknown_fields`), SCR-001 |
| 096 | Week 6, pain 2/10, symptom form closed | "Please answer the safety questions before your next run." No session is shown; no pause, flag or emergency text | INP-023, SAF-001…007 `on_unknown: hold` |
| 097 | Always "done as planned", pain tap skipped | Each tick asks "Any pain?"; Monday-morning prompt after long runs; after 2 weeks with < 70% answered: "Please answer the quick pain question after your runs. Your plan holds steady until most runs have an answer." | INP-022, LOD-006 |
| 098 | Pregnant, attested week 30, birth week 40 | Due date entered in pregnancy mode; from 14 days before it "Have you given birth?" before each session; from the due date no session until answered; "Yes" → "A running plan starts from about {weeks} weeks after birth." | SAF-051, SAF-054, SAF-052 |
| 099 | Never-runner backfills 27 sessions in one evening | Entries estimated; rung advances at most one step (S1 → S2) | INP-021, SAF-082 |
| 100 | 10K 55:00 runner types "40:00 yesterday" | "This result is much faster than your last one. Is it right? We won't change your paces until a short test agrees." Paces stay effort-only; FT scheduled | INP-025, ADP-066 |
| 101 | < 3 months running, claims 60 km/week, 25 km long run | "Please confirm your weekly running" prompt; long run starts ≤ 99 min (90-min claim cap × 1.10) | GEN-022, GEN-011, LOD-010 |
| 102 | Goal switched weekly to a HM "next Sunday" after racing a HM | "Your last race was on {date}. A race of this length fits from {date + 14 days}." Option: move date. TRANSITION kept | FEA-044, INV-31, ADP-080 |
| 103 | Birth year blank, "18+? yes" | No 18+ shortcut; month and year required; no plan until entered; no "From 65…" text | INP-001, INP-002, lint L8 |
| 104 | Born Feb 2008, onboarding 21 Oct 2026 | Treated as 18 (age_low with the month): adult flow, no guardian | INP-002 |
| 105 | 5K finish, race week at S5 | Kept as run-walk at the S5 pattern if 60 min ≤ 2.0 × the longest logged S5 session (26 min → 52 ✗) → here **not** met: the earliest date is offered. At S6 (30 min → 60 ✓) the race is kept | FEA-043b |
| 106 | 62, injury last year | "You had an injury in the last year. So we build up more gently…" Why: "After an injury, a gentler build-up is the usual cautious approach." No risk wording | CTX-003, CTX-004, lint L5 |

### 7d. Earlier fixtures (TST-120 round 1; TST-075 round 2)

All verdicts are as in v4 13 §3–§4, with v5 band wording on every time goal (fast edge to slow edge, "inside / faster / slower"). Changes: d1-A2 = Karim's measured variant (10K 58:00 measured, available ≥ 180) stays **stretch: ambitious** only if W ≥ 12; at 10 weeks it is now **infeasible** (LEVELS_UNREACHABLE), like Karim.

## 8. Findings while writing v5

| ID | Sev | Finding | Action |
|---|---|---|---|
| R-01 | M | P5's wk-18 peak and wk-19 tune-up were 7 days apart (INV-29). LOD-018 moves the tune-up to wk 20; v4 had shown this only after illness | fixed in §4; oracle (c) must reproduce it |
| R-02 | L | TST-105 shows that FEA-043b's "≥ S5" condition rarely holds at S5 itself with `ladder.est_pace_s_per_km` 660 (needs a 30-min logged session). The rule is safe (it fails to the earliest date) | none; recorded for the R2 review of `ladder.est_pace_s_per_km` |
| R-04 | **H** | **INV-29 vs ultra non-peak and deload long runs.** v4 LOD-018 moved or capped "the later" of two runs over 180 min. In P5 every deload (190–210 min) and non-peak (195–216 min) long run sits 7 days from a peak, so the later run was often the **peak**, which would have lost the long-run demand. v4's P5 table had this defect unnoticed | **fixed in v5 LOD-018**: the non-peak or deload run is capped at 180; only when both are peaks does the later one move (§4 shows the emitted values) |
| R-03 | L | v5-preaudit read PHS-004 as "last week before or first week after a boundary", while the record tested `weeks_to_phase_boundary ≤ 1` and P5 used the record | **post-audit:** one reading everywhere: forward-looking `weeks_to_phase_boundary` (12 §2b), as in the record; 04 PHS-004 text and §0 aligned; P3's deloads recomputed (4, 8, 12); P5 unchanged |
| R-06 | **M** | **v5.1 recomputation** (external review v5 items 3–4; recomputed by a short script, floor() of every cap): P3 wk 5 V 318 → **304**, wk 6 360 → **334**, wk 7 360 (V_req now reached in wk 7, not 6); LR, deloads and every later week unchanged (wk 8 deload 0.75 × 360 = 270); LR shares wk 5/6 0.40. Week-6 card: Thursday 104 → **78** min, week ≈ 5 h 30; E3 pace corrected to **6:05–6:25 /km** (the model gives 365.7–385.6 s/km from FT-1 3 km 16:30). Feasibility unchanged: n_V closed form 6, G 10 | corrected above; oracle fixtures in 14 §10e |
| R-05 | **M** | **Post-audit arithmetic corrections** (audit-final §A, recomputed with `tools/audit_final.py` and floor() of every cap): P3 wk 4 V 208 → **207**; wk 9 LR 163 → **162** (163 broke LOD-010/INV-01 while the table claimed "S8 pass"); wk 10 179 → **178**; with the PHS-004 reading of R-03 the deload is wk 12 (LR 135) and wk 11 is LR 180; the extension moves to wk 13 (≤ 198, after FUEL L2 is reached in wk 10 by two fuelled runs at 45 g/h: audit fix 15). P5 illness: wk 18 LR **224**, tune-up **246**. Lea's slow edge **52:26** (B_slow 7%, not 4%). Tom's day-0 fast edge **47:24**; FT-1 fast edge 46:48; Karim's fast edge 52:52 (rounding). Tuesday card sums to 60 min | corrected above; each corrected value is an oracle fixture (14 TST-110…112, list in 14 §10e) |

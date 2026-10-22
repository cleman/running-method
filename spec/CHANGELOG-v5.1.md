# CHANGELOG v5 → v5.1

22 Oct 2026. Four targeted fixes answering the external review of v5 (`docs/review-external-v5-fr.md`), plus consistency fixes found while recomputing. The frozen v5 elsewhere is unchanged. No web research was done; claims stated from memory are graded ALLEGED at most.

> **In plain words.** Two studies were graded too high and are now "credible" everywhere. Paces no longer move on one test that differs by only a few percent: a medium change needs a second test. Runners whose starting numbers come from memory now build up their weekly running more slowly until their log confirms where they start. One worked example was recomputed, and a few small inconsistencies were fixed.

## 1. Study grades (review: weakness 2, priority "ramener Machado et C25K à CREDIBLE")

Project rule: one study is at most CREDIBLE, however many records or summaries repeat it. Machado 2015 (5K/10K retest CV 3.44% / 2.43%) and the Couch-to-5K study (Relph 2023: completion 27.3%, injury 19%, prior-injury OR 7.56) are now CREDIBLE everywhere they are cited:

| Where | Was | Now |
|---|---|---|
| RESOLUTIONS R2-9 (`pace.deadband_pct`) | CORROBORATED ("two records") | CREDIBLE, with a v5.1 correction note |
| parameters.md `pace.deadband_pct` | CORROBORATED | CREDIBLE |
| parameters.md `pred.band_same_distance_pct` | CORROBORATED | CREDIBLE |
| parameters.md `anchor.jump_confirm_mult` | CORROBORATED for the scale | CREDIBLE for the scale |
| 03 §3 band text (B_fast 4%) | factdesk4 §6, CORROBORATED | CREDIBLE |
| 03 §3b step 4 | factdesk3 §3, ALLEGED | CREDIBLE (rewritten, see §2) |
| 03 FEA-014 evidence | ALLEGED (3.4% CV) | CREDIBLE |
| 03 FEA-052 evidence and **basis** | wg1 §7, factdesk4 §6, CORROBORATED · basis evidence · default no | wg1 §7 CORROBORATED (prediction error); factdesk4 §6 CREDIBLE · **basis design_default · default yes** (the decisive threshold, `pace.deadband_pct`, is a design default) |
| 01 INP-025 evidence | CORROBORATED | CREDIBLE |
| 08 ADP-061 / ADP-062 / ADP-066 evidence | ALLEGED / ungraded / CORROBORATED | CREDIBLE |
| 01 CTX-003 (prior-injury OR from the C25K study) | wg3 §5, CORROBORATED | CREDIBLE |
| 03 FEA-034, 06 SES-013, 08 ADP-024 (C25K 27%) | wg3 §5, CORROBORATED | CREDIBLE |
| 10 §4b (C25K about 19% injured) | ALLEGED | CREDIBLE |
| 14 PM-101 (C25K 27.3%) | CORROBORATED | CREDIBLE |
| rationale §16, §21, §24 | CORROBORATED / ALLEGED | CREDIBLE |

Not changed, on purpose: citations of the **NHS Couch-to-5K schedule** (a programme description reproduced by several bodies: SAF-086, `rtr.start_ladder`, 14 TST-066, rationale §22) keep their grades; they describe the programme, not the study. INP-022's "wg3 §5, CORROBORATED" refers to the adherence-predictor review in the same section, not to the C25K study.

Basis change: only FEA-052 had `basis evidence` resting on Machado; it is now `design_default` (basis counts: evidence 69 → 68). The checker still passes the two-source rule.

## 2. Pace deadband (review: weakness 3, priority "revoir le seuil de 3,5 %")

**Why.** The difference between two tests varies by √2 × 3.4% ≈ 4.8%, so noise alone crossed the 3.5% deadband in about 47% of retests, and plans would be unstable.

**What.** Three bands for a new measured, non-excluded result (03 §3b step 4):
- ≤ `pace.deadband_pct` (3.5%): noise, nothing changes;
- above it and ≤ the minimum detectable change MDC = `pace.mdc_mult` × `pace.test_te_pct` = 2.8 × 3.4% ≈ 9.5% (noise exceeds it in about 5% of retests): no pace change from one result; a second result within `result.confirm_window_days` (42) beyond the deadband **in the same direction** moves paces to the **mean** of the two (new rule ADP-067);
- above the MDC: slower applies at once (ADP-061), faster steps by `result.max_upgrade_pct` until confirmed (ADP-062).
Safety slow-downs stay immediate and test-free: ADP-066 (two very hard sessions), illness, pain and fatigue rules.

**New parameters** (basis dd): `pace.test_te_pct` = 3.4 % (CREDIBLE, single study); `pace.mdc_mult` = 2.8 (CREDIBLE input; the 1.96 × √2 formula is from memory, ALLEGED). `pace.deadband_pct` keeps 3.5 with its new meaning (noise band).

**Rules.** Changed: ADP-061, ADP-062 (threshold now the MDC; they clear a pending result), ADP-066 (states it is an immediate safety slow-down), FEA-014 and ADP-014 (refer to the bands), FEA-052 (grade/basis). New: **ADP-067** (T5.447, formal, tagged MVP in `tools/build_rules.py`).
**Unit fix in the records touched:** `pace.deadband_pct` and `result.max_upgrade_pct` are registered in %, but INP-025, FEA-052, ADP-061/062/066 used them as fractions; they are now divided by `unit.pct`.
**Data model (12):** helper `mean(a, …)`; paths `state.pending_anchor_10k_s`, `state.pending_anchor_date`, `state.pending_confirms`.
**Messages:** new MSG-ADP-PACE-PENDING, MSG-ADP-PACE-CONFIRMED; MSG-FEA-CHK-SAME why text extended.
**Examples and tests:** 13 §2 Tom: two illustrative rows (5K 23:40 → 49:21, −3.9%, pending; 5K 23:45 → 49:31, −3.6%, confirmed → active 49:26; v5 would have moved to 49:49 after the first). 14 TST-072 and persona 32 updated. Text: 00 §4, 15 Deadband, rationale §21.

## 3. Weekly cap for estimated baselines (review: weakness 4)

**Why.** Ana (claims only) went from 210 to 360 min a week in 5 weeks (+71%) within the rules; the single-session cap does not replace a weekly limit for unverified starting data.

**What (05 §2).** New **LOD-007** (T2.259, formal): while `state.baseline_confirmed` is false, V(w) ≤ (1 + `prog.est.week_max`) × the best weekly time logged in the last `prog.est.window_weeks` weeks (planned weeks count provisionally until logged; before any logged week, the claimed V_hold); outside deload, taper, transition, RTR and start-ladder weeks. T2, so the LOD-005 floor cannot lift a week above it. New **LOD-008** (T2.260, formal): the baseline is confirmed after `prog.est.confirm_weeks` consecutive logged weeks, each with ≥ `prog.est.confirm_ratio` of its planned time logged; an unlogged week restarts the count; runners whose log already holds those weeks start confirmed.

**New parameters** (all basis dd): `prog.est.week_max` 0.10 (UNKNOWN as a safety limit: the 10% rule did not lower injuries in GRONORUN, and week-to-week change showed no injury association in Frandsen 2025; a convention kept for unverified volume); `prog.est.window_weeks` 4; `prog.est.confirm_weeks` 6; `prog.est.confirm_ratio` 0.80 (all UNKNOWN).
**Data model:** paths `week.est_base_s`, `state.est_confirm_weeks`, `state.baseline_confirmed`. **Messages:** MSG-LOD-EST-CAP, MSG-LOD-BASE-CONFIRMED. 03 §4: the closed form and the dry run include LOD-007/008.

**Recomputed (script, floor() of every cap):**

| Value | v5 | v5.1 |
|---|---|---|
| Ana wk 5 V | 318 | **304** = floor(1.10 × 277) |
| Ana wk 6 V | 360 | **334** = floor(1.10 × 304) |
| Ana wk 7 V | 360 | 360 (baseline confirmed after 6 logged weeks) |
| Ana growth to wk 5 / wk 6 | +51% / +71% | +45% / +59%; 360 reached in wk 7 |
| Ana wk 5 / 6 LR share | 0.39 / 0.38 | 0.40 / 0.40 (LR unchanged: 123 / 135) |
| Ana wk-6 card: Thursday easy run | 104 min ("1 h 40") | **78 min ("70 min")**; week ≈ 5 h 30 |
| Ana n_V (closed form) / G / slack | 6 / 10 / 5 | 6 / 10 / 5 (unchanged) |
| Ana wk 8 deload and every later week | — | unchanged |

Also updated: 13 §1, §2 (Tom note), §3 checks, §6, §8 R-06; 14 persona 33 and the oracle fixture list (wk 5 304, wk 6 334, wk 7 360). 00, 07: no Ana numbers to change.

## 4. Version and counts

00 status, titles of the changed files, `rules.json` version (`v5.1`). Counts: 293 rules (210 formal, 12 procedure, 6 static, 65 text-only), 31 invariants, MVP rules 255 (00, 12 §6). Basis: design_default 210, evidence 68, eng 10, convention 5.

## 5. Consistency fixes (coordinator's extra input, each verified against the spec text)

| Claim | Verified? | Action |
|---|---|---|
| (c) Ana's week-6 E3 pace should be ≈ 6:05–6:25 /km | **Yes.** FT-1 3 km 16:30 → 10K-eq 59:07 (Riegel 1.06), CS 2.82 m/s, E3 = CS × 0.92–0.97 = 385.6–365.7 s/km. The same model reproduces Tom's 5:20–5:35 | **Fixed** in 13 §6 (two places) |
| INV-02 lacks the start-ladder exemption that 10 §4b grants | **Yes.** 10 §4b says ladder steps are not checked by the spike cap; INV-02 binds every session; Maya's S6 (30 min after S4's 27 min, +11%) would fail it | **Fixed:** INV-02 text and assertion exempt `ladder = start`; RTR sessions stay bound |
| INV-31 missing from the 07 §5a kind table | **Yes** (its record says check B) | **Fixed:** added to the B row |
| (a) Ana's phases contradict 04 §3 (SPECIFIC 8–15, not 12–15) | **Yes.** W 18, T 3, R 15, base_needed 5, build_min 1: S = min(8, max(4, 15 − 5 − 1)) = 8; B = 5; U = 2 → ONBOARD 1–2, BASE 3–5, BUILD 6–7, SPECIFIC 8–15. Deloads then fall at 5 (PHS-004 moves wk 4), 9 and 13 | **Open (not changed):** a full rewrite of the 18-week table (deloads, keys, FUEL/TOL timing, extension week, week-6 card, oracle fixtures). The v5.1 LOD-007 recompute above uses the v5 outline |
| (b) Ana's slack is 3, not 5 | **Partly.** 03 §4 says slack = W − (P0 + base + build + specific + taper) = 18 − 15 = 3, but 04 §3 step 5 counts ONBOARD inside BASE (B = max(base_needed, onboard_needed)), which gives 5. 03 and 04 disagree | **Open (design decision):** choose one reading. The verdict is feasible either way (`feas.stretch_margin_weeks` = 2) |

Noticed, not changed: FEA-023 uses `val.conformance_tol_pct` (registered in %) as a fraction, the same unit slip as above.

## 6. Still open from the review

- **Symmetric source tagging** ([corp], [author], [state] …) is only partly applied (about 7 places); not extended in v5.1.
- **No new audit** has been run after the v5 post-audit fixes or after these v5.1 fixes; any quality estimate is a self-estimate.
- The council report's **"independent acceptance check"** wording contradicts its §7 (everything was internal). That is in the report, not the spec, and is not changed here.
- Release blocker **B-4** is unchanged: 27 MVP rules are still text-only, so `check_rules_v5.py` still fails on that check only.
- Items (a) and (b) of §5.

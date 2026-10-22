# RESOLUTIONS — architect consistency pass (v1)

This file resolves the 41 conflicts in `CONFLICTS-from-authors.md` and 6 more found during the pass (P1–P5, X1). For each conflict it gives the decision and the files changed. Two items are **OPEN** for sub-councils. Each has a clearly labelled **PROVISIONAL** default, so the spec stays consistent until they decide.

## OPEN items (v1 record — both DECIDED in sub-council round 1, see the end of this file)

### OPEN-1 — Default marathon demand vs Daniels caps (Author B #1; also B #2) → **sub-council B (half & marathon)**

**Problem.** With `method_default` = Daniels long-run caps (25% of the week, or 30% under 64 km/week; at most 150 min), the marathon's minimum peak long run is race ÷ `race.longest_ratio_max.M`. That run needs weekly volumes most first-timers do not have. At ratio 1.60 it is 26.4 km, which needs about 106 km/week. Anyone slower than about 5:40/km also breaks the 150-min cap. So FEA-003 routes nearly every first marathoner to "alternative preset" or "move date".

**PROVISIONAL default (held now).**
- Ratios per preset, as Author B proposed: method_default/daniels 2.00; hansons 1.65; pfitzinger_classic and higdon_novice 1.30; galloway 1.60. The registry fallback is 1.60.
- method_default keeps the Daniels caps.
- First-time marathoners on low volume therefore usually get a fail-closed result. The ranked options include the alternative preset, labelled.
- Files: `parameters.md` §9, 03 §9.

**Options for the sub-council:**

| Option | What it means | For | Against |
|---|---|---|---|
| A. Keep the provisional default | Daniels caps plus ratio 2.00 | Most conservative about long-run share and spike size; honest failure | Even at 2.00 it needs about 84 km/week (21.1 km at 25%) or a pace under ~7:06/km. Most first-timers fail and are pushed to another preset, so the "default" is rarely used. Status-quo critique: tool looks unusable |
| B. Use `higdon_novice` / classic caps as the marathon default | Long run up to 32 km, up to 50% of the week; ratio 1.30 | Matches widely used novice plans and the Knopp corpus (longest run 31–35 km) [wg2 §1–2, CORROBORATED as description] | Puts ~50% of the week in one run, against the Daniels rule. The 1.10× spike cap stretches the build, so more plans fail on time instead |
| C. Hybrid: Daniels % cap, time cap raised to 180 min, ratio 1.60 for finish goals | Time on feet instead of distance for slow runners | Fewer infeasible verdicts; keeps a % cap | A Frankenplan that no published plan uses (opening-statusquo R2). The 180-min value is UNKNOWN |
| D. Choose the preset by goal type | finish → Galloway/run-walk with ratio 1.60; time → Daniels | Run-walk is first-class; finishing is the novice goal [wg2 §1, CORROBORATED ratios] | Two defaults to test; run-walk long-run evidence is thin ("≥ race distance" ALLEGED) |

Evidence to weigh: the Daniels cap is CREDIBLE as a choice, not a consensus [wg2 §1]. A long run over 21 km is associated with faster half-marathon times [factdesk1 §7, CORROBORATED, associational]. Using the race as a spike has no evidence (UNKNOWN). Novice injury rate is 17.8 per 1000 h [wg4 §2].

### OPEN-2 — Ultra long-run caps (Author B #4, Author C #4) → **sub-council C (50–100K road)**

**Problem.** A 150-min time cap makes every ultra infeasible, because a 40 km long run cannot be reached.

**PROVISIONAL default (held now).**
- For `Goal.family = ultra`, `lr.ultra_pct_cap` 0.40 and `lr.ultra_time_cap_min` 330 replace the marathon caps **under every preset** (DST-008, LOD-020).
- INV-01/02/03 still bind.
- `race.longest_ratio_max.100K` = 2.50 and `.50K` = 1.60.
- Files: `parameters.md` §7/§9 (presets column now "all presets when family = ultra").

**Options for the sub-council:**

| Option | For | Against |
|---|---|---|
| A. Keep the provisional default: pct + time cap for all presets | Ultra plans peak around 5.5 h [wg2 §4, ALLEGED/CREDIBLE]; one consistent rule | The 0.40 share is ALLEGED; injury rates in road ultras are UNKNOWN [wg4 §2] |
| B. Time cap only (no % cap) for ultras | Matches time-on-feet practice | A long run can dominate a low-volume week |
| C. Absolute distance cap (e.g. 42–50 km) plus `dst.ultra_alt_long_ratio` alternation | Mirrors 100 km plan publishers (longest run 30–42 km) | Distance caps penalise slow runners. Sources are trail-heavy [wg2 §4] |
| D. Make back-to-back pairs, not single long runs, the main durability tool | Smaller single-session spikes | Back-to-backs ALLEGED, no trial [wg1 §6]; the two-day cap is also ALLEGED |

## Author D (08, 11, 14)

| # | Conflict | Decision | Files changed |
|---|---|---|---|
| D1 | INV-04 forbids the ADP-021 swap | INV-04 now reads "no added time or distance". A missed hard session may *replace* a later easy session of at least equal duration in the same week. ADP-021 kept | 07 §5 |
| D2 | ADP-064 vs GEN-003 | GEN-003 (fail closed) covers infeasibility on volume, long run, levels or phases, at generation and every re-generation. Pace-only drift of a time goal goes to ADP-064: the plan continues, labelled "not on track", with lower-goal options. Paces follow the anchor, so safety is unchanged | 07 GEN-003, §8 |
| D3 | Illness vs INV-05 | INV-05 pauses every subkind in `flag.pause_kinds`. Professional clearance is needed only for `flag.professional_kinds`. Illness clears through 08's gate (ADP-042) by self-attestation. `reds_screen` alone is a freeze | 07 INV-05; parameters §4 |
| D4 | Priority uniqueness | The key (tier, nnn) is unique. A module uses only its own nnn block, and may reuse a number in different tiers. Static check updated | 07 §1, 12 §3.1/§3.4, CONTRACTS §1.3 |
| D5 | Data-model additions | All added: Week.log_state, Session.status `unlogged`, AdaptationEvent `unlogged_week`, the ActivityRecord fields, RunnerProfile.nutrition_referral_flag and caffeine_sensitive, and the SweatTest and REDsScreenRecord entities | 12 §2 |
| D6 | Red-flag ownership / double firing | **10 alone raises flags** (`RiskFlag.rule_id` is always a SAF rule). INP-023, ADP-040/041/050/053/081 and NUT-033/043/051 only present 10's questions or hand answers to a SAF rule. ADP-041 rewritten to route to SAF-007; NUT-051 to SAF-009; ADP-053 to SAF-002/SAF-011 | 08, 11, 10, 12, 07 §8 |
| D7 | INV-18 literal "GI ≤ 2/10" | Now references `fuel.gi_pass_max` | 07 |
| D8 | REDs escalation missing in 10 | New **SAF-012** (T0.532): REDs flag plus a bone-stress flag or absent periods → `reds_escalated` red flag, pause_until_clearance, professional clearance. New **SAF-011** (T0.514) for persistent or severe pain handed over by ADP-053 | 10 |
| D9 | Fixtures unavailable; knopp owner | Conformance tests run **report-only** in v1 until the primary books are encoded [factdesk2 §7]. `knopp.range` values are owned by 14; INV-23 is defined in 07 and run by 14 | parameters §11 |

## Author B (03, 05)

| # | Conflict | Decision | Files changed |
|---|---|---|---|
| B1 | Default marathon demand | **OPEN-1** (provisional above) | parameters §9 |
| B2 | Hansons ratio 1.64 > 1.60 | Preset override 1.65 (part of OPEN-1 provisional) | parameters §9 |
| B3 | FEA-002 use of logged pace | Added to 12 §4: "distance↔time demand conversion only"; never anchors, paces or cap denominators | 12 §4 |
| B4 | Ultra caps | **OPEN-2** (provisional above) | parameters §7 |
| B5 | Races ratchet L30_eff | Adopt LOD-012: a logged race raises L30_eff by at most `spike.warn_ratio` × the pre-race value | 07 GEN-010, INV-25 |
| B6 | INV-16 stale baseline | Adopt LOD-004 (`prog.baseline_max_age_weeks`) | 07 INV-16 |
| B7 | Hansons 1.5-week taper | Whole weeks kept: Hansons M taper = 2 weeks with `taper.cut_profile` [0.3, 1.0] | parameters §6; 04 §3 |
| B8 | TRANSITION "≤ 50%" literal | `transition.vol_max_ratio` | 04 §1; parameters §6 |
| B9 | "Competitive" band for polarized opt-in | `perf.competitive_min_pct` = 70 (regional) with a measured anchor; design default | 01 §4; parameters §3 |
| B10 | Ultra time goals capped at stretch | Confirmed. FEA-012 stands (no validated road-ultra predictor [wg1 §7, UNKNOWN]) | — |

## Author C (06, 09)

| # | Conflict | Decision | Files changed |
|---|---|---|---|
| C1 | INV-25 covers tune-ups | Exemption covers the **goal race only**; tune-ups obey INV-01/02/03 (DST-012) | 07 INV-01, INV-25 |
| C2 | INV-03 circular | Now "prerequisites of DUR L5 hold (DUR L4, TOL L5) and back-to-backs are enabled (DST-010)" | 07 INV-03 |
| C3 | Tune-up vs INV-13 | Ultra tune-up exempt from `lr.ultra_time_cap_min` only, never from the spike or two-day caps | 07 INV-13 |
| C4 | lr.ultra_* scope | **OPEN-2**; provisional: all presets when family = ultra | parameters §7 |
| C5 | 02 changes | `cmp.required.50K.HAB` = 3. HEAT L2 required for every distance when conditions are hot (FEA-004). MSP L3 shares owned by 09 (`dst.msp_share`) | 02 §2, §5; parameters §7 |
| C6 | ONBOARD exit unsafe for novices | Exit = onboarding weeks done **and** an anchor test, **or** the FT-0 benchmark when HAB < 2 or the gate is restricted; the plan stays effort-only (SES-014) | 04 §1 |
| C7 | Data model | RunnerProfile.hill_access added. Goal.family values already short/road_classic/ultra. SpecialStatus `pregnant` → maintenance at ≤ `pregnancy.max_effort` | 12 §2 |
| C8 | Quality counting differs by school | `quality.counts_long[preset]` adopted (replaces 06's `ses.long_counts_hard`). The TID check (LOD-033) always counts time spent at each effort level, whatever the school | 05 §5, 06, parameters §7 |
| C9 | Ultra drop order | Confirmed inside SES-008 (one T3 rule; no second competing rule) | — |
| C10 | Ownership | Fuelling and heat doses → 11; feasibility floors and race-to-longest ratios → 03 (register owners set) | parameters |

## Author A (01, 10)

| # | Conflict | Decision | Files changed |
|---|---|---|---|
| A1 | Missing fields | Added: night_shift_days[], claimed_continuous_30min, age_low/age_high, the ScreeningItemMap entity, followup_answers{}, RiskFlag.subkind and region, prior_tol_tier, guardian_attested_on, guardian_hardcap_optin | 12 §2 |
| A2 | ContextModifier with several operations | One record per operation: `CTX-nnn/x` with `rule_id` + `op_index` | 12 §2 |
| A3 | "High life stress" in PHS-005 | Dropped (no input, no evidence); PHS-005 now cites CTX-001…004 and `deload.every_ctx` | 04 |
| A4 | PAR-Q+ licence and item mapping | **Release blocker** (legal and clinical sign-off; device status UNKNOWN [factdesk2 §2]). Listed in 00 §7 and 12 ScreeningItemMap | 00, 12 |
| A5 | INP-023 is T0 inside 01's block | Allowed: blocks are per module across all tiers (D4) | — |
| A6 | SAF-009 freeze vs outcome vocabulary | Confirmed: the freeze is numeric caps under `proceed`, not a fifth outcome. 11 matches (NUT-051 hands over to SAF-009) | 11 |
| A7 | MSG-SAF-003 emergency text | Confirmed as a third generic safety text; it names no condition | CONTRACTS §1.9; 00 §6 |
| A8 | Spike caps on the return ladder | Ladder sessions have no planned distance, so only INV-02 binds; GEN-023 skips ladder sessions | 07 INV-01, GEN-023 |
| A9 | Ladder vs ONBOARD | Ladder weeks count toward ONBOARD: `P0 = rtr_needed + max(0, onboard_needed − rtr_needed)` | 04 §3 |
| A10 | Illness ownership | 10 raises the flag (SAF-007); 08 owns the return gate (`illness.*`) and hands over to SAF-080 at R0. ADP-041 now routes only | 08 |
| A11 | No hard cap at age 14 | `minor.max_race_km.hard[14]` = 8 km (= the recommended value); design default | parameters §5 |
| A12 | Bone-stress ladder pain threshold | Confirmed: `rtr.bone_pain_max` (0), not `pain.during_max` | — |

## Found in the pass

| # | Conflict | Decision | Files changed |
|---|---|---|---|
| P1 | `ses.long_counts_hard` (06) = `quality.counts_long` | Merged into `quality.counts_long` | 06, parameters |
| P2 | `ses.deload_quality_max` (06) = `deload.quality_max` (05) | Merged into `deload.quality_max` (owner 05) | 06, parameters |
| P3 | `illness.minor_duration_ratio` (08) = `illness.above_neck_dur_ratio` (10) | Merged into `illness.above_neck_dur_ratio` | 08, parameters |
| P4 | `rpe.expected_by_effort` owner "08/06" | Owner 08; 06 reads it | parameters |
| P5 | `race.longest_ratio_max` 5K/10K/HM: 03 gave 1.00/1.00/1.20, 09 gave 1.00/1.25/1.40 | 1.00 / 1.25 / 1.30. A 10K finish needs an 8 km long run. For the half, 1.30 means a ~16 km run, the peak of common novice plans. Labelled UNKNOWN / design default | 03, 09, parameters |
| X1 | SAF-004/005 used kinds `heat`/`eah` that are not RiskFlag kinds | Now `RiskFlag(red_flag, heat)` / `(red_flag, eah)`; RiskFlag.kind and subkind enums fixed in 12 | 10, 12 |

## Rule-base checks after the pass

- No rule ID is used twice. Every ID sits in its owner's range. Every `nnn` sits in its owner's block. No (tier, nnn) pair is used twice: checked by script over all `RULE` lines (267 rules after adding SAF-011/012).
- Rules with the same `nnn` in different tiers of one module (e.g. 07 GEN-010 at T2.351 and GEN-030 at T4.351) are allowed under D4.
- Dangling references fixed: 03 cited LOD-009 and LOD-007, which do not exist. They now cite LOD-020 (long-run % cap) and LOD-003/010/012/014 (curve builder).
- Each module's "Conflicts with contract" section is kept as the authors' record. **This file governs** where they differ.


---

# Round 1 decisions (v2, 21 Oct 2026)

## DECIDED-1 (was OPEN-1): default marathon/half demand → "classic-capped" (Room B, Option E)

- **Decision.** `method_default` for road_classic:
  - long-run cap = 0.50 of weekly **time**, a time cap (HM 150 / M 180 min) and M 32 km;
  - marathon: time demand from ratio 1.40 (30.1 km), capped at 180 min, with a distance floor of 2.00 (21.1 km);
  - half: ratio 1.30, floor 1.60, 150 min;
  - Half finish needs HAB L2 (3 runs).
  - `higdon_novice` ratio 1.32.
  - galloway and first declare their caps. first is `pending_fixture`.
  - Daniels min(25%, 150 min) stays a whole opt-in preset.
- **Labels.**
  - The 0.50 share is CORROBORATED as a description of novice plans (Higdon ~50%, Knopp) [wg2 §1–2].
  - The **time caps are coaching convention**: no study links single-run duration to injury [hearing-2 med-acad/med-crit, UNKNOWN]. Field practice of 2.5–3 h is CORROBORATED as practice [hearing-2 coach-field]. 180 min is a design default.
  - Daniels' rule is CORROBORATED [factdesk3 §4]. Its 30% variant is ALLEGED and retired.
- **Checked against the evidence and the traces.**
  - P3 and P4 (13 v2) now fit.
  - New evidence partly pulls the other way. NYC first-timers who completed an 18-mile run had fewer minor race-day injuries [factdesk3 §5, CORROBORATED, observational]. So the distance floor (21.1 km) was kept, and the 180-min cap carries a note and an alternative preset.
  - Re-opened for round 2 as **N-01**: it is not a failure of Option E, but a residual tension.
- **Files:** 03 §2, 05 §4, 09 §4, §7, 02 §5, parameters §7, §9, 13.

## DECIDED-2 (was OPEN-2): ultra long-run caps (Room C)

- **Decision.**
  - `lr.ultra_pct_cap` 0.60 of weekly time, **in peak long-run weeks only**. Non-peak weeks are capped at 0.70 × the last peak.
  - `lr.ultra_time_cap_min` 330, under all presets.
  - When the time cap binds, L_req becomes the cap and the verdict is *stretch* (`LONG_RUN_TIME_CAPPED`), never infeasible.
  - Growth counts one peak every 2 weeks.
  - Tune-up = min(50 km, ⌊1.10 × planned L30_eff⌋). It counts as the block's peak and is exempt from ultra caps only, not from the spike or two-day caps.
  - A deload counts as non-peak.
  - Knopp ultra tiers apply to 100K only.
  - Ultra V_req_dist = max(floor, L_req / 0.60).
- **Labels.** "Coaching convention; no injury data exist for road ultras." Field 100K plans: longest run 5–6 h, weekend pair ≈ 55–65% of the week [hearing-2 coach-field, CORROBORATED as practice]. Under-preparation is associated with injury in road ultras [factdesk3 §9, CREDIBLE]. That supports not starving volume, but does not set a cap.
- **Architect addition.**
  - 02's 100K finish requirement is lowered from AER/TOL 5 to AER/TOL 4. With L5, every 100K needed ≥ 600 min/week, which contradicts the corroborated finish tiers and the room's own case 2.
  - b2b.day2_ratio 0.60, b2b.pair_week_share_max 0.65, b2b.pair_cap_ratio 1.75: they must sit above the new general two-day cap (1.60).
- **Contrarian dissent recorded.** The room's Contrarian would prefer to fail closed at the time cap.
- **Files:** 09 DST-008/009/012/014, 03 FEA-005, 05 §4, §6, 02 §5, parameters, 13 (P5).

## Room A required changes (5–10K)

| # | Change | Applied as | Note |
|---|---|---|---|
| A-R1 | L_req out of the long-run min() | 05 §3 (all families, not only short), LOD-005 baseline hold | extended to every family because F-04 showed the same cut in HM/M/ultra |
| A-R2 | family-scoped hard share + exit-dose check | `tid.hard_share_max.<family>` (short 0.20 **PROVISIONAL**), FEA-026, LOD-033 | measured share UNKNOWN [factdesk3 §1]; trial arms 10–20% zone 3 [hearing-2 coach-acad] |
| A-R3 | MSP every 2 weeks in SPECIFIC | DST-018 | — |
| A-R4 | 5K/10K finish: no build/specific, taper 1 | 04 §3 step 0, 03 §4, `taper.weeks.short_finish` | plus the 5K ratio 1.30 (F-18), so P1 fits in 10 weeks |
| A-R5 | HAB L2 by run-walk | 02 §2, 06 §3 | — |
| A-R6 | 10K finish one value | 02 §5: AER 1, TOL 1, DUR 1 | — |
| A-R7 | H1 not gated by non-volume levels | FEA-023 | — |
| A-R8 | TARGET_OUTSIDE_BAND only H1–H2; stretch + checkpoints in H3–H5 | FEA-032, FEA-038 | — |
| A-R9 | FIRST TID-checked, never gutted | DST-016, INV-26, status pending_fixture | — |

## Room B required changes (half & marathon)

| # | Change | Applied as |
|---|---|---|
| B-R1 | Option E | DECIDED-1 |
| B-R2 | preset declarations + static check | 05 §4, 09 §7, INV-26 |
| B-R3 | Half HAB L2 | 02 §5 |
| B-R4 | Scheduling vs attaining DUR | 02 §3, 06 SES-M-003 |
| B-R5 | MSP segment cap; converted, never shortened | DST-006/007, SES-M-005, LOD-033 |
| B-R6 | pilot metric for long runs > 150 min | 14 §10b |

## Room C required changes (50–100K)

| # | Change | Applied as |
|---|---|---|
| C-R1 | 0.60 peak weeks, 330 min | DECIDED-2 |
| C-R2 | time-capped L_req → stretch | FEA-005 |
| C-R3 | growth × peak cadence | 03 §4 |
| C-R4 | tune-up fix | DST-012 |
| C-R5 | deload = non-peak | DST-009, 05 §6 |
| C-R6 | Knopp tiers 100K only | DST-014, parameters §11 |
| C-R7 | ultra V_req_dist + fixtures | 03 §2, 14 TST-070 |

## Required changes not applied as written

**None was rejected.** Three were applied more broadly than written:
- **A-R1** was extended from the short family to every family.
- **C-R1** was paired with lowering the 100K AER/TOL requirement to L4.
- **B-R1** was kept, but its residual tension with the Toresdahl cohort is re-opened (N-01).

## Optional improvements adopted

- Room C O2: `Goal.cutoff_h` field, with a warning.
- Room C O3: hot or long training-run card (NUT-034).
- Room C O4: the exact minutes to add are shown on AVAILABILITY_TIME.

## Open for sub-council round 2

| ID | Issue |
|---|---|
| N-01 | 180-min cap vs the Toresdahl association, for runners slower than 7:15/km |
| N-02 | 5-week novice ladder vs 9-week Couch-to-5K |
| N-03, N-04 | Fill limits under "easy ≤ LR" at 3–4 runs a week |
| N-05 | LOW_VOLUME_PREDICTION turns finish goals into stretch |
| N-06 | `tid.hard_share_max.short` (PROVISIONAL, fact request IR-1) |
| N-07 | HAB L3 (4 runs) for a marathon finish vs Toresdahl (≥ 4 runs/week associated with training-phase injury) |
| X-1 | **Family cliff.** Marathon 180 min / 50% vs ultra 330 min / 60% peak-week caps (Room C cross-room flag). The cliff is smaller in v2, but a runner could still enter a 50K to unlock longer runs. The ultra required levels (TOL 4, DUR 4) are the current guard |

---

# Round 2 decisions (v3, 21 Oct 2026)

All 22 required changes from d2-roomA (8), d2-roomB (7) and d2-roomC (7) are applied. Cross-room conflicts and architect choices:

| # | Topic | Decision | Why | Files |
|---|---|---|---|---|
| R2-1 | Cut-off rule: d2-B R4 (CUTOFF_AT_RISK, slow edge) vs d2-C R2 (CUTOFF_RISK / CUTOFF_UNREACHABLE, ultra range) | **One rule for all families: FEA-006.** Cut-off below the fast/low edge → CUTOFF_UNREACHABLE (infeasible); below the slow/high edge → CUTOFF_AT_RISK (stretch) | same logic; one name per outcome | 03, 12 |
| R2-2 | Guard for runs > 180 min: d2-B R3 (extension needs TOL 3 measured) vs d2-C R3 (ultra > 180 needs TOL 4 measured) | **One guard, LOD-017 / INV-28: any planned run > 180 min needs TOL L4 measured and is run-walk.** It covers extension runs, marathon floor runs and ultra runs | the more conservative value; duration evidence is UNKNOWN in every family | 05, 07, 09, 06 |
| R2-3 | X-1 after d2-C R4 (50K AER 3) | **Accepted**: Hana's 50K becomes feasible. The 50K's 240-min long run equals the marathon extension ceiling, and both need TOL 4 measured. The ultra → road switch caps L_hold at 240 (LOD-005). Re-opened for the plenary as P-02 (count cap) | d2-B's AER 4 guard and d2-C's AER 3 conflict; the cap alignment makes the cliff small | 02, 05, 09 |
| R2-4 | d2-C O4 (V28 at the TOL threshold) | **Adopted:** V28 for level thresholds excludes deload and taper weeks | without it, d1-C1 (and Fatou's floor runs) never reach TOL 4 measured under R2-2 | 02 |
| R2-5 | d2-B optional: Galloway time cap 240 | **Adopted:** factdesk4 §4 answered IR-3 (Galloway long runs reach 26 mi, CORROBORATED) | otherwise run-walkers have no preset | 05, parameters |
| R2-6 | d2-C O1, O3, O5 | **Adopted:** carry fluid; heat exposure via short runs first; earliest feasible date shown with its reason | low cost, CORROBORATED direction | 11, 03 |
| R2-7 | d2-C R6 "build moves back about 2 weeks" | **Refined:** the message states n from the feasibility re-run | a fixed "2 weeks" is wrong while the previous peak is still in the 30-day window | 11 |
| R2-8 | Start ladder with backfill | **Decided:** backfilled sessions with symptom answers count toward rungs | rung progression has no load denominator | 10 |
| R2-9 | `pace.deadband_pct` grade | Upgraded to CORROBORATED (Machado 5K 3.44%, 10K 2.43%, two records [factdesk4 §6]). **v5.1 correction (external review v5 item 2):** two records of one study are one study, so the grade is **CREDIBLE** (project rule: a single study never exceeds CREDIBLE); applied to every Machado and Couch-to-5K (Relph 2023) citation (CHANGELOG-v5.1) | — | parameters |
| R2-10 | Ultra exponent | Kept as a parameter (1.10/1.30). factdesk4 §10 grounds only ≥ 1.06. Plenary item P-05 | — | parameters |
| R2-11 | d2-C 10:00/km case | **Kept the rule; corrected the expected outcome:** the 50K also fails its new 25 km floor, so the marathon is offered | rules > room expectation | 13 |
| R2-12 | Contrarian dissents | d2-C: the dissent on the ultra time cap is **withdrawn** (R1's floor). The new dissent on 50K AER 3 is recorded | — | 02 |

## Room A (round 2)

| # | Change | Applied as |
|---|---|---|
| A2-R1 | 9-rung start ladder (C25K) for never-runners | 10 §4b, SAF-086, SAF-085, `rtr.start_ladder` (week-6 sessions 1–2 and week 8 CREDIBLE) |
| A2-R2 | 5K finish long run = 30 min; ladder credits HAB L2 | 03 §2, 02 §2, `race.5k_finish_lr_min` |
| A2-R3 | volume-carrying long run; short share cap by run count; MSG-LOD-FILL | LOD-016, 05 §4, `lr.pct_cap.short` |
| A2-R4 | dry run uses the fill; AVAILABILITY_DAYS states the day to add | FEA-020, FEA-031 |
| A2-R5 | short hard share 0.20 final; polarized override 0.20 | parameters, 05 |
| A2-R6 | same-distance band 4% | 03 §3, `pred.band_same_distance_pct` |
| A2-R7 | H2 merged phase = SPECIFIC | 04 §2 |
| A2-R8 | P1/P2 re-run, fixtures | 13, 14 TST-075 |

## Room B (round 2)

| # | Change | Applied as |
|---|---|---|
| B2-R1 | distance stop never from S_slow | 03 §2, MSG-DST-LR3H with the runner's numbers |
| B2-R2 | floor time up to 240 min; over-cap share 0.60 | 03 §2, FEA-003, 05 §4, LOD-020 |
| B2-R3 | DST-019 conditional extension runs | 09, 14 |
| B2-R4 | FEA-011 information only for finish goals; CUTOFF_AT_RISK | FEA-011, FEA-006 (R2-1) |
| B2-R5 | marathon finish HAB 2 | 02 §5 |
| B2-R6 | X-1 guard: L_hold cap on family switch | LOD-005, 09 §4 (R2-3) |
| B2-R7 | floors declared for every preset | parameters, INV-26 |

## Room C (round 2)

| # | Change | Applied as |
|---|---|---|
| C2-R1 | ultra floors 25 / 33.3 km | parameters, FEA-003/005, INV-25 |
| C2-R2 | cut-off check | FEA-006 (R2-1) |
| C2-R3 | ultra time caps 50K 240 / 100K 330, TOL 4 guard | DST-008, LOD-017 (R2-2) |
| C2-R4 | 50K AER 3 | 02 §5 |
| C2-R5 | post-gap L30_eff reset | LOD-011, GEN-013 |
| C2-R6 | NUT-034 shortening made visible | NUT-034 (R2-7) |
| C2-R7 | fixtures | 13 §2, 14 TST-075 |

## Open for the plenary

- P-01: the start ladder leaves zero slack for a 10-week first 5K.
- P-02: count cap for 50K runs over 180 min.
- P-03: TOL 4 as the > 180-min guard.
- P-04: very slow runners routed from the 50K to the marathon.
- P-05: the ultra exponent in cut-off verdicts.
- P-06: interim-target messaging.
- Release blockers are unchanged: PAR-Q+ licence, regulation review, encoding the plan fixtures.

---

# Plenary round 1 decisions (v4, 21 Oct 2026)

All 33 required changes from p1-roomA (9), p1-roomB (10) and p1-roomC (14) are applied. No room reframed.

## Room A: architecture and rule engine

| # | Change | Applied as |
|---|---|---|
| A1 | INV-13 ≤ max(cap, L_hold); T5 floor beats T5 caps, never T0–T3 | 07 §1, INV-13 |
| A2 | goal-change carry-over; new season on distance change | LOD-005, ADP-080, FEA-025 |
| A3 | measured logged distance meets the long-run demand | 03 §2, FEA-023, FEA-025, INV-25 |
| A4 | FEA-031 in H1 uses min(HAB runs, sustained F28) | FEA-031 |
| A5 | 2-run share cap 0.60; family `base` | 05 §4, parameters, 12 |
| A6 | deterministic seasons (W > 52 only; near-equal; test → deload) | 04 §2–3, PHS-012, PHS-016 |
| A7 | one long-run formula for every family; FEA-005 deleted; LONG_RUN_TIME_CAPPED: stretch for time goals, information for finish goals | 03 §2, FEA-003 |
| A8 | `pred.ultra_exp_low` = 1.06 | parameters |
| A9 | fixtures TST-079…082; parity property | 14 §10d |

## Room B: adaptation and safety

| # | Change | Applied as |
|---|---|---|
| B1 | LADDER_RUNWALK completion; "repeat a week is normal" | FEA-043b, 10 §4b |
| B2 | start-ladder adaptation: partial sessions, gaps, SAF-084 only unclean weeks, stale text removed | 10 §4b, ADP-035, SAF-084 |
| B3 | > 180-min guard on **expected** duration; floor-bound run wording | 03 §2b, LOD-017, INV-28 |
| B4 | 65+ and a run expected > 180 min → restricted until MSG-SAF-040 | SAF-060, INV-28 |
| B5 | LOD-018: runs > 180 min ≥ 14 days apart (no count cap) | LOD-018, INV-29 |
| B6 | recurring pain referral (3 in 42 days) | ADP-053, `pain.recur_*` |
| B7 | 30-min ladder sessions after long gaps, postpartum, pregnancy stop or bone stress | SAF-081 |
| B8 | minors' caps by age on the session date | SAF-044, INV-30 |
| B9 | night-shift roster in the dry run | 01, CTX-005, FEA-031 |
| B10 | fixtures A–G | 14 TST-083…089, 13 §3 |

## Room C: runner experience and build readiness

| # | Change | Applied as |
|---|---|---|
| C1 | reason texts, headlines, checkpoints; at most 2 reasons on the card | messages.md §1–2 |
| C2 | ESTIMATED_INPUTS becomes a label | FEA-035 |
| C3 | interim-target message with test time; checkpoint outcomes | FEA-038, messages.md §3 |
| C4 | band stability within the deadband; verdict change explained | FEA-052, MSG-FEA-WHY-CHANGE |
| C5 | screening intensity vigorous by default (except ladder, return, base) | 01 §3 |
| C6 | onboarding answer bands | 01 §1 |
| C7 | one typed catalogue; missing messages; display rounding; "for you about" defined | messages.md, 12 §5, parameters §13 |
| C8 | three display layers | 07 §9, ADP-013 |
| C9 | grade labels by basis + grade, with plain sentence and numbers | 00 §5, messages.md §4 |
| C10 | day-0 traces P2, P3 | 13 §2, TST-093 |
| C11 | expression grammar + one record per rule | 12 §3.2, rules.json |
| C12 | change_availability repair, first for AVAILABILITY_* | 03 §6, FEA-040, 12 |
| C13 | no deloads in the start ladder; earliest comfortable date first | 04 §3, FEA-040, MSG-FEA-NEVERRUN-DATE |
| C14 | MSG-SAF-061 names no condition | 10 §5, messages.md §7 |

## Cross-room decisions

| # | Topic | Decision |
|---|---|---|
| P1-1 | A7 (LONG_RUN_TIME_CAPPED information for finish goals) vs the v3 ultra stretch | A7 adopted. **Contrarian dissent recorded:** ultras should stay stretch whenever the time cap binds |
| P1-2 | B4 65+ attestation | Adopted as a **policy convention**: no study compares a check with self-attestation [hearing-3 med, UNKNOWN]. RACER shows higher marathon and male risk [factdesk5 §8, CORROBORATED]. **First Principles dissent recorded:** no new gate beyond TOL 4. Plenary 2: regulatory reading (Q-02) |
| P1-3 | B3 (expected duration) vs A3 (logged distance) | Compatible: both stop the S_slow margin from creating phantom shortfalls. S_slow stays feasibility-only |
| P1-4 | C12 change_availability vs B9 roster | One option kind; for rosters it names the shifts |
| P1-5 | Grammar choice | CEL subset (RuleExpr) with Kleene three-valued logic, explicit `has()`, and per-record `on_unknown` (fire for restrictive T0–T2, skip for permissive, ask where a question resolves it); errors never fire and keep the safe state. DMN rejected (null conflates missing and error), JSON Logic rejected (missing = false). Overlap analysis is our own per-tier check |
| P1-6 | Validator independence | Bound (B) and metamorphic (M) checks are independent of the generator's formulas; shared-definition (S) invariants are re-implemented from the specification, not imported, and declared non-independent (07 §5a); parity property added |
| P1-7 | Test-ID clash | Metamorphic suite = TST-091 (room A's TST-079…082 kept for fixtures) |
| P1-8 | LOD-018 and the P5 tune-up | When the post-illness week and the tune-up would be 7 days apart, the tune-up moves one week (wk 20, still within 4–6 weeks out) |

## Open for plenary round 2 (acceptance pre-check, implementation readiness, red team)

- Q-01 … Q-06 (13 §5).
- Dissents: Contrarian (ultra stretch); First Principles (65+ gate); Contrarian (50K AER 3, round 2).
- Release blockers are unchanged: PAR-Q+ licence and mapping, regulation review, encoding the plan fixtures.

# Plenary round 2 decisions (v4 → v5; final design version)

Sources: p2-roomA (acceptance pre-check, 10 required changes), p2-roomB (implementation readiness, 12), p2-roomC (red team, 12), factdesk6. All 34 required changes are applied; three are applied with a recorded deviation (marked **dev**). Details of every edit: `CHANGELOG-v5.md`.

## Room A: acceptance pre-check

| # | Change | Applied as |
|---|---|---|
| A1 | complete week tables for P1, P3, P5 + one week as card text; no "details in v3" | 13 §3–§6 (self-contained); writing them found two defects (13 R-01, R-04), both fixed |
| A2 | typed action payloads for T0–T2; formal FEA chain; list remaining text-only rules in 00 §8; extend the record-sync test | 12 §3.3 typed vocabulary (45 ops, build-checked); every FEA rule of the 5K–HM chain has a record; 00 §8 lists the 65 text-only rules; TST-121 |
| A3 | inline every MSG-SAF/NUT/SES text; module copies non-normative; message test passes | messages.md §6–§8 (110 ids); notes in 03 §8, 06 §6, 10 §5, 11 §9; TST-094 = `check_messages_v5.py`, passes |
| A4 | band placeholders {fast_edge}/{point}/{slow_edge}; correct P2 trace | messages.md §0, §2; 03 §3; 13 §2 |
| A5 | FEA-021 counts only weeks that can hold key sessions; Karim fixture | FEA-021; TST-127; 13 §7b |
| A6 | combined option "add {day} and race on/after {date}"; Rose fixture | FEA-040; messages.md §5; TST-128 |
| A7 | every parameter graded or basis `eng`; grade the 26 rules and 9 invariants; static check | 43 parameters graded (17 `eng`, 26 UNKNOWN/CREDIBLE/CORROBORATED); 26 rules and 9 INV graded; TST-121 checks grades on rules, invariants and the whole register |
| A8 | "Exit check" column in 04 §1; per-module exit test in 06 | 04 §1, 06 §2b |
| A9 | glossary: talk test, verdict and headlines, SHARPEN, predicted range, ONBOARD, measured/estimated; lint | 15 "Added in v5"; lint L7 |
| A10 | stale labels; duplicate TST-090; reading-path table | headers and rationale fixed; TST ids reallocated (below); 00 §5 reading paths |

## Room B: implementation readiness

| # | Change | Applied as |
|---|---|---|
| B1 | typed actions `{op, target, expr, then[]}` | 12 §3.3; build rejects unknown ops and missing fields; `see then_text` gone |
| B2 | event-only or `true` conditions are not formal | honest `expression_status`: formal / procedure / static / text_only; `true` only on 6 static records; event-type conditions are accepted only when the action carries the decisive expression (22 records) |
| B3 | evaluation context: roots, paths, helpers, `rule('X')` removed, effort ordering | 12 §2b (30 roots incl. `today`/`now`, 418 paths generated from the records, 53 helper functions, 9 procedures); `state.scr_symptom` / `state.scr_disease_inactive` replace `rule()`; `effort_rank()` |
| B4 | no 10800/65 literals; only unit constants | `lr.long_guard_min`, `masters.vigorous_assessment_age`; `unit.*`; zero other literals (TST-121) |
| B5 | GEN-020 fires (ask-confirm); CTX-005/GEN-022 fire; text-only `on_unknown: null` | done; no restrictive T0–T2 record has `skip` |
| B6 | `basis` field; grade required | RULE line `| basis …|`; 197 design_default, 79 evidence, 5 convention, 9 eng |
| B7 | all MSG texts; `explain.runner` per record | every record has `explain.runner` resolving in messages.md |
| B8 | module texts are the source; dict removed | `## Machine records (v5)` blocks in 01–11; `design/v5/tools/build_rules.py` parses only the module texts and 12 |
| B9 | renumber colliding TST ids; TST-041 → all INV | TST-120 (round-1 fixtures), TST-121 (record sync), TST-122…125 (p1-A); pilot metrics → PM-100…110; TST-041 covers INV-01…31 |
| B10 | oracles (a)–(c) | 07 §5a, 14 TST-110…112 — **dev**: the room asked for TST-095–097, which room C had already claimed for its fixtures; the oracles take TST-110…112 |
| B11 | formalise ≈ 75 MVP rules | all 66 listed rules plus 39 further MVP-reachable T3–T6 rules formalised. **Post-audit correction:** 27 further MVP-reachable rules (B-4) were tagged `spec`, which kept the MVP check green while they were missing; they are now tagged MVP (252 MVP rules), and TST-121 fails until they are formalised |
| B12 | release profiles and build order | 00 §7, 12 §6 |

## Room C: red team

| # | Change | Applied as |
|---|---|---|
| C1 | no "I don't know" on safety fields; incomplete screen = no screen; SCR-005 rewrite | INP-001 (`inp.no_unknown_fields`), SCR-001, SCR-005 |
| C2 | `on_unknown: hold` for SAF-001…007, ADP-050, NUT-033/043 | 12 §3.2 rule 4; also ADP-040/081 (12 records); MSG-SAF-HOLD |
| C3 | one-tap pain on every tick; next-morning prompt; step-ups need answered pain | INP-022, LOD-006 — **dev**: `pain.answered_min_ratio` = **0.70**, not the room's 0.80, because pooled EMA compliance is 75% (CI 72–78%) [factdesk6 §3]; 0.80 would hold most compliant runners' plans. Range 0.6–0.8 exposed |
| C4 | due date; "Have you given birth?"; pause at due date | SAF-051, SAF-054, MSG-SAF-034/035 |
| C5 | ladder crediting limits | SAF-082, 10 §4b |
| C6 | implausible fast anchor → confirm; RPE ≥ 8 twice → pace down | INP-025, ADP-066 |
| C7 | claim-based L30 cap by TOL tier; novice confirm prompt | GEN-011, GEN-022, `claim.l30_cap_by_tol` |
| C8 | race recovery floor; TRANSITION survives goal change | INV-31, FEA-044 (new reason RACE_TOO_SOON), ADP-080, `race.recovery_days` |
| C9 | birth month + year required; "Longer runs open from {date}"; no default age | INP-001/002, MSG-SAF-023, lint L8 |
| C10 | FEA-043b numbers | `ladder.est_pace_s_per_km` 660, warm-up counted, last 3 clean, unknown → earliest date |
| C11 | message wording; attribute lint | MSG-CTX-003, MSG-SAF-061 why texts; SAF-060 label; lint L5/L6; **dev (wording)**: MSG-SAF-061's stop-sign sentence moved to a general MSG-SAF-STOP-SIGNS shown to every runner, so the age-triggered message carries no heart wording |
| C12 | fixtures TST-095…106 | 14 §10e; 13 §7c |

## Red-team closure table

| Attack | Severity | Status | How closed / why accepted | Fixture |
|---|---|---|---|---|
| 1 Unsure PAR-Q+ answer → restricted plan | high | **closed** | no "I don't know" on screen items; incomplete screen → no_plan | TST-095 |
| 2 Closed symptom form → pause + emergency text | medium | **closed** | `on_unknown: hold`: no session, no flag, no emergency text | TST-096 |
| 3 Always "done as planned" → no pain data | high | **closed (partly by design)** | pain tap on every tick, next-morning prompt, step-ups held below 70% answered. A runner who answers "No" falsely is not detectable: accepted limit (00 §8) | TST-097 |
| 4 Birth unnoticed in pregnancy mode | high | **closed** | due date, prompt from −14 days, pause at due date | TST-098 |
| 5 Backfilled ladder credits | medium-high | **closed** | SAF-082 crediting constraints; ≤ 1 rung per 7 days from backfill | TST-099 |
| 6 Fake fast anchor accepted as measured | medium | **closed** | INP-025 confirm + estimated until a field test agrees; ADP-066 | TST-100 |
| 7 Novice inflated claims → L30_eff too high | medium | **closed** | TOL-tier cap on claim-based L30 (90 min at TOL 2); confirm prompt | TST-101 |
| 8 Weekly goal-race chain | medium-high | **closed** | INV-31 + FEA-044 (RACE_TOO_SOON); TRANSITION survives | TST-102 |
| 9 Blank birth year → adult defaults | medium | **closed** | birth month and year required; no default age in messages | TST-103 |
| 10 18-year-old treated as minor until 1 January | low | **closed** | month-based age_low | TST-104 |
| 11 5K at S5: no speed for time on feet | medium | **closed** | `ladder.est_pace_s_per_km`; FEA-043b formal; at S5 itself usually not met → earliest date (13 R-02) | TST-105 |
| 12 Personal risk wording for a 62-year-old | medium | **closed** | new why text; lint L5 | TST-106 |
| 13 Hot summer, nothing tagged | low (optional) | **accepted** | heat stays runner-reported in MVP; an optional "Hot today?" tap and a 65+ heat note are specified for R2 (11 §9b) | — |

## Decisions taken by the architect in v5 (not asked by a room)

- **LOD-018 caps the non-peak run** (13 R-04): when a peak and a non-peak or deload long run over 180 min fall < 14 days apart, the non-peak run is capped at 180; only two peaks move the later one. Reason: v4's "move the later one" could cap a peak and lose the goal's long-run demand.
- **MSG-SAF-001 and MSG-SAF-011 simplified** to reach reading grade ≤ 8 ("doctor or other health worker"); clinical review (release blocker B-3) must confirm.
- **PHS-004 reading** stated ("last week before or first week after a boundary").
- **Pilot metrics renamed PM-100…110** so TST ids name only automated tests and fixtures.

## Dissents (carried forward, unchanged)

- **Contrarian:** ultra stretch reason and 50K AER 3 requirement.
- **First Principles:** the 65+ check-up gate (SAF-060) is a policy rule without comparative evidence.
- **Room C (C3):** asked for 0.80 answered-pain coverage; v5 uses 0.70 (above).

## Remaining open items

Release blockers B-1…B-5 (00 §8). No design item is left open for another council round; tuning of design-default parameters belongs to the pilot (14 §10).

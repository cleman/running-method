# 09 — Distance families (v5.2; v1 author C, revised by the architect after sub-council rounds 1–2 and plenary rounds 1–2)

Serves criteria 1 (distances and determinants), 3 (phase emphasis per distance and horizon), 10 (key sessions as modules). Rule range DST-001…099, priorities T*.450–499. Interfaces: 02 (weights, required levels), 03 (demand, race-to-longest-run, floors), 05 (caps), 06 (key sessions), 11 (fuelling demand).

> **In plain words.** A 5K, a marathon and a 100 km race ask different things of you. Short races need a strong top end. The half and the marathon need you to hold a strong pace for a long time and to eat on the run. Road ultras need lots of easy running, staying power and a fuelling plan. The app groups races into three families and shapes your plan around what matters most for yours.

Families: `short` = {5K, 10K}; `road_classic` = {HM, M}; `ultra` = {50K, 100K} (road/flat only).

## 1. Determinants by family

| Family | Determinant | What it means for the plan | Grade |
|---|---|---|---|
| all | VO2max × sustainable fraction (CS/threshold) × economy explain most of performance | THR, VO2, ECO nodes | CORROBORATED [wg1 §1; hearing-1 §1] |
| short | VO2max and capacity above CS weigh more; CS ≈ 10K race speed | VO2 and race-pace (E4/E3) work weighted highest | weighting CREDIBLE [wg1 §1]; CS ≈ 10K CORROBORATED [factdesk1 §3] |
| road_classic | sustainable fraction: marathon run at ~85% of CS (wide SD) | THR in BUILD, race-effort (E2/E3) in SPECIFIC | CORROBORATED [wg1 §1] |
| road_classic | durability (drift of economy and threshold after ~90 min) | long run is the DUR proxy; no field test | CORROBORATED concept, size UNKNOWN [wg1 §1] |
| road_classic | longest run and weekly volume associated with marathon and half time | long-run curve, volume floors | CORROBORATED association [wg1 §6; factdesk1 §7] |
| HM (> 90 min), M | carbohydrate intake needed above ~90 min | FUEL required (CMP-008) | CORROBORATED [wg5 impl. 3] |
| ultra | weekly volume and marathon PB associated with road 100 km time; volume mattered more than pace | AER/DUR weights highest; protect volume over intensity (06 SES-008) | CORROBORATED association [wg1 §1; wg2 §4] |
| ultra | VO2max/economy do not predict 160 km | low VO2 weight | CREDIBLE (trail) [wg1 §1] |
| ultra | fuelling 60–90 g/h; EAH risk > 4 h; heat | FUEL L3, hydration and heat via 11 | CORROBORATED [wg5 §3–4] |
| ultra | injury rate for road ultras | none: no ultra-specific load relaxation | UNKNOWN [wg4 §2] |

## 2. Demand weights and required levels

The 02 §5 weights (`cmp.weight.<distance>.<node>`) are unchanged since v1: no council source quantifies them better than the CREDIBLE synthesis they rest on [wg1 §1]. Three refinements go through the registry:

1. **50K habit level.** 02 requires HAB L4 (≥ 5 runs/week) for a 50K finish. Published finish tiers for an ~89 km road ultra start at 45–50 km/week [wg2 §4, CORROBORATED], reachable on four runs; no source requires five. Adopted: `cmp.required.50K.HAB = 3` (design default). 100K stays HAB L4.
2. **Heat.** When `Goal.expected_conditions = hot`, HEAT L2 is required for every family, not only 100K: acclimatisation is the key protective step regardless of distance [wg5 §4, CORROBORATED] (DST-004).
3. **MSP shares** (02 leaves MSP L3 "distance-specific"): `dst.msp_share` gives race-effort work per session as a share of expected race duration: L1 0.10, L2 0.30 for all; L3 5K 0.75, 10K 0.65, HM 0.55, M 0.50; ultra requires MSP L2 only (design defaults, ALLEGED practice: Hansons/Pfitzinger race-pace volumes [wg2 §1]).

```
RULE DST-001 | priority T4.450 | when a Goal is created or edited | then set Goal.family from Goal.distance: {5K, 10K} → short; {HM, M} → road_classic; {50K, 100K} → ultra; none (maintain, base goals) → base (v5.2, as 12 §2) | because every family-specific rule keys on it | evidence criteria.md C1, N/A (engineering: structure or procedure, no physiological claim) | basis eng | default? no
RULE DST-002 | priority T4.451 | when CMP-007 chooses the node for a key-session slot | then only nodes listed in dst.phase_nodes[family][Phase.type] whose next level is within the cell's ceiling are candidates (SHARPEN uses the SPECIFIC row, MAINTAIN the BUILD row; phases without a row have no key slots); if none is eligible, CMP-007's fallback chain applies (preset list rotation, then strides); v5.2 drops the v5 easy-run fallback, which contradicted CMP-007 (F-09) | because phase emphasis differs by family; restricting candidates keeps CMP-007 deterministic | evidence hearing-1 §2 rising specificity, CORROBORATED; wg2 §4 Koop order, CREDIBLE; v5.2 cell encoding and empty rows: design choice, UNKNOWN | basis design_default | default? yes
RULE DST-003 | priority T4.452 | when Goal.family = ultra and Phase.type = BUILD | then split BUILD weeks in order by dst.ultra_build_split: first part VO2 (SES-M-010), then THR (SES-M-008/009), then steady (SES-M-013) | because Koop's "far = intense, near = specific" sequence is the documented ultra practice (implements PHS-015 per week) | evidence wg2 §4 impl. 6, CREDIBLE; hearing-1 coach-field | basis design_default | default? yes
RULE DST-004 | priority T4.453 | when Goal.expected_conditions = hot | then add HEAT L2 to Demand.required_levels (FEA-004) and schedule SES-M-022 per 11 (NUT-040: heat.acclim_days easy runs in the last heat.acclim_window_days, never the long run or a key session) | because heat acclimatisation over ~1–2 weeks is the main protective step | evidence wg5 §4, CORROBORATED | basis evidence | default? no
```

## 3. Phase emphasis

`dst.phase_nodes[family][phase]` (candidate nodes for key sessions; easy volume and the long run are always present):

| Family | BASE | BUILD | SPECIFIC | TAPER |
|---|---|---|---|---|
| short | AER, DUR, ECO, VO2 L1 (strides), THR L1 | THR, VO2 | MSP (race effort E4/E3), VO2, THR | MSP reduced + SES-M-024 |
| road_classic | AER, DUR, ECO, THR L1 | THR, DUR, VO2 (HM only) | MSP (HM E3, M E2), DUR, THR, FUEL | MSP reduced + SES-M-024 |
| ultra | AER, DUR, ECO | VO2 → THR → steady (DST-003) | DUR, MSP (E1/E2), FUEL, HEAT if hot | MSP reduced (E1/E2) |

Basis: shared core of all proven plans (general → specific, race-pace work concentrated late) [hearing-1 §2, CORROBORATED]; Canova funnel [hearing-1 §1, CORROBORATED]; Koop order for ultras [wg2 §4, CREDIBLE]. No periodisation model is superior [wg1 §5, CORROBORATED], so the table is a convention and a design default.

> **In plain words.** Early weeks build the engine with easy running. Middle weeks add harder sessions. The last weeks before the taper look more and more like your race. For ultras the order is turned around: faster work comes early, and long race-like days come late.

## 4. Long runs by family and preset

| Family | Content | Cap (05 §4, INV-13) | Peak minimum (INV-25) | Frequency |
|---|---|---|---|---|
| short | E1 throughout; strides may follow | method_default 0.30 of time / 150 min; may exceed L_req (Room A R1) | ≥ race / `race.longest_ratio_max.{5K,10K}` | weekly |
| HM | E1; time goals: E3 final segment every `dst.race_long_every_weeks` (DST-006) | method_default 0.50 / 150 min | time `L_req` (ratio 1.30); distance floor ratio 1.60 | weekly |
| M | E1; SPECIFIC: E2 segment (DST-007); optional extension runs (DST-019) | method_default 0.50 / 180 min (floor runs to 240 min run-walk, week ≥ L/0.60) / 32 km; daniels 0.25 / 150; hansons 26 km; pfitzinger 35 km; higdon 0.50 / 32 km; galloway 240 min time on feet | time `L_req` (ratio 1.40); distance floor 21.1 km (all presets) | weekly |
| ultra | E1, race-effort practice with walking and fuelling | `lr.ultra_pct_cap` 0.60 (peak weeks); 50K 240 / 100K 330 min (all presets) | time `L_req` (ratio 1.60 / 2.50); distance floor 25 km / 33.3 km; time-capped above the floor → LONG_RUN_TIME_CAPPED (stretch for time goals, information for finish goals), below → infeasible (FEA-003, one formula for all families, v4) | peak every `lr.ultra_peak_every_weeks`, 0.70 × peak between |

The peak minimum is a feasibility condition (03): if the caps and INV-01 cannot reach it in the weeks available, the goal fails closed (07 §6.2). It is checked on distance, and on duration when the long-run curve is time-based (run-walk). v2 (Room B R1, DECIDED): the default for road_classic is "classic-capped". The long run may be up to 50% of weekly time, as in novice practice [wg2 §1–2, CORROBORATED as description], and stops at 3 h or 32 km (MSG-DST-LR3H). Daniels' min(25%, 150 min) [factdesk3 §4, CORROBORATED] stays a whole opt-in preset.

**X-1 family cliff (v3, accepted and recorded, d2-B R6).**
- The marathon long run is 180 min. It can reach 240 min only as floor runs or extension runs, each needing TOL 4 measured.
- The 50K long run is 240 min (TOL 4 measured beyond 180 min, AER 3, DUR 4), and the 100K's is 330 min.
- Entering a 50K therefore unlocks at most 60 min more than the marathon default, and nothing beyond the marathon extension ceiling.
- A switch from ultra to road_classic caps L_hold at 240 min (LOD-005).
- Fixture: Hana (13).

```
RULE DST-005 | priority T5.450 | when Goal.family = short | then long runs are SES-M-003 at E1 only; race-effort work lives in key sessions, never in the long run; v5.3: except the steady-finish long run SES-M-031 (E2, never E3+) on the experienced path, form b of SES-026 | because short-race specificity is speed, while the long run serves AER/DUR | evidence hearing-1 §2, CORROBORATED (shared core); wg1 §1 weighting, CREDIBLE | basis design_default | default? yes
RULE DST-006 | priority T5.451 | when Goal.distance = HM, goal_type = time, Phase.type = SPECIFIC and MSP L1 prerequisites hold | then every dst.race_long_every_weeks-th non-deload long run of SPECIFIC (counted from its first week) is SES-M-005 with an E3 final segment of min(dst.msp_share[HM][next MSP level] × the target time, dst.msp_segment_max_min.HM, dst.msp_segment_max_ratio × that run); the segment counts in LOD-033's hard budget and is shortened (rest of the run at E1) when it does not fit; finish goals keep easy long runs (v5.2, owner Q7: the v5 clause 'finish goals use the MSP L1 share' could never fire and is removed) | because race-effort segments late in long runs are common practice; v1 left the dose unbounded (Room B R5) | evidence hearing-1 phys-field, CORROBORATED (practice); wg2 §1, ALLEGED (Hansons 10 mi MP) → design default; v5.2 counting and next-level share: ALLEGED (Pfitzinger and Hansons place goal-pace segments late in long runs, from memory) | basis design_default | default? yes
RULE DST-007 | priority T5.452 | when Goal.distance = M, Phase.type = SPECIFIC and MSP L1 prerequisites hold | then every dst.race_long_every_weeks-th long run is SES-M-005 with an E2 segment of min(dst.msp_share[M][level] × expected race time, dst.msp_segment_max_min.M, 0.60 × that run); finish goals use the MSP L1 share and effort words without pace | because MP segments in long runs are shared practice; a 0.50 × race-time segment gave 140 min at marathon effort for a 4:40 runner (Room B R5) | evidence hearing-1 §1, phys-field, CORROBORATED (practice); wg2 §1, ALLEGED → design default | basis design_default | default? yes
RULE DST-008 | priority T5.453 | when Goal.family = ultra | then under every preset, the long-run caps are lr.ultra_pct_cap (peak weeks only) and lr.ultra_time_cap_min[distance] (50K 240, 100K 330), replacing lr.pct_cap and lr.time_cap_min; runs over 180 min need TOL L4 measured (LOD-017); INV-01/02/03 still bind; show MSG-DST-ULTRA-CAP with the runner's own numbers | because marathon-derived caps make every ultra infeasible, and a 50K borrowing the 100K's 330 min doubled the family cliff (d2-C R3) | evidence wg2 §4, ALLEGED/CREDIBLE; factdesk3 §8, CORROBORATED range (50K plans peak ~3:15 h / 26 mi); hearing-2 coach-field, CORROBORATED as practice; wg1 §6 / factdesk3 §7, UNKNOWN (injury) → design default | basis design_default | default? yes
RULE DST-009 | priority T5.454 | when Goal.family = ultra and a week is not a peak long-run week (one every lr.ultra_peak_every_weeks; a deload week always counts as non-peak and the cadence restarts after it) | then that week's long run ≤ dst.ultra_alt_long_ratio × the last peak long run | because ultra plans place their longest runs every 2–3 weeks; deloads must not consume a peak (Room C R5) | evidence wg2 §4, CREDIBLE (practice); hearing-2 coach-field, CREDIBLE | basis design_default | default? yes
```

## 5. Back-to-back long runs and tune-ups (ultra only)

Back-to-backs are common practice but **no trial supports them**; coaching sources call them debated and very stressful [wg1 §6, ALLEGED; wg2 §4, CREDIBLE as practice; mostly trail sources]. They are off by default (`b2b.enabled_default = false`), opt-in, and labelled.

```
RULE DST-010 | priority T2.450 | when a back-to-back pair (SES-M-016) is considered | then it is allowed only if Goal.family = ultra, the prerequisites of DUR L5 hold (DUR L4, TOL L5), the runner opted in, Phase.type ∈ {BUILD, SPECIFIC}, Week.is_deload = false, log_status = rich and no RiskFlag is active; on opt-in show MSG-DST-B2B | because pairs pass per-session caps while adding two-day load whose risk is unknown | evidence wg1 §6, ALLEGED; wg4 §2 ultra injury rate UNKNOWN; opening-contrarian §2 | basis design_default | default? yes
RULE DST-011 | priority T2.451 | when a back-to-back pair is placed | then it replaces that week's single long run; day 1 ≤ the 05 long-run curve value; day 2 ≤ b2b.day2_ratio × day 1, starting at b2b.day2_start_ratio for the first pair; the pair ≤ b2b.pair_cap_ratio × L30_eff (INV-03); at most one pair per b2b.min_interval_weeks; the days before and after are E1 or rest | because practice caps day 2 at 50–60% of day 1 and spaces peak efforts; the pair cap is a design default | evidence wg2 §4 impl. 5, CREDIBLE; opening-contrarian §2, ALLEGED | basis design_default | default? yes
RULE DST-012 | priority T5.455 | when Goal.family = ultra and W ≥ dst.tuneup_weeks_out + taper.weeks | then offer (ask_confirm) a tune-up of min(dst.tuneup_dist_km[distance], round_down(spike.warn_ratio × planned L30_eff on that date)) at dst.tuneup_weeks_out before the race; it counts as that block's peak long run; it is exempt from lr.ultra_pct_cap and lr.ultra_time_cap_min but never from INV-01/02/03; a deload falling in that week moves one week later (PHS-002/006 may then drop it) | because organisers advise a long run about 5 weeks out; the v1 rule could never schedule its tune-up (Room C R4, F-24) | evidence wg2 §4, CREDIBLE (Comrades organiser + coach); wg4 §1, CORROBORATED (spike risk) | basis design_default | default? yes
RULE DST-013 | priority T5.456 | when a tune-up was run | then the next dst.tuneup_recovery_days hold only E1 sessions, no key session and no back-to-back | because recovery after racing is universal practice; length is a default | evidence hearing-1 §2, CORROBORATED (structure) | basis design_default | default? yes
```

> **In plain words.** Some ultra runners do two long runs on consecutive days. Nobody has tested whether this works better than one long run, so the app never adds them unless you ask, you already have a big training base, and your log shows it. About five weeks before a 100 km race the app can suggest a long tune-up run, but only if it is not a big jump from your recent longest run.

## 6. Feasibility floors per family (owned by 03)

`feas.finish_floor.peak_week` must be reachable under the 05 caps in the weeks available; otherwise 03 returns infeasible. All are **design defaults**: readiness thresholds are ALLEGED [wg3 §4; factdesk1 §7].

| Distance | Floor (peak week) | Supporting signal | Grade |
|---|---|---|---|
| 5K | 3 runs/week | frequency drives response | CORROBORATED (cycling) [wg3 §2] |
| 10K | 90 min/week | — | UNKNOWN |
| HM | 150 min/week | > 32 km/week and long run > 21 km associated with faster HM | CORROBORATED association [factdesk1 §7] |
| M | 240 min and 32 km/week | first-marathon advice 32–48 km/week | CREDIBLE existence, ALLEGED numbers [wg3 §4] |
| 50K | 50 km/week | ~89 km road finish tier 45–50 km/week | CORROBORATED tier [wg2 §4] |
| 100K | 60 km/week | same; 100 km plans peak 90–120 km/week | CORROBORATED tier / ALLEGED–CREDIBLE plans [wg2 §4] |

Ultra time predictions are a wide range only (`pred.ultra_mode`) [wg1 §7, UNKNOWN formula]. Peak volume of ultra plans is compared with the Comrades goal tiers as an INV-23-style **flag**, never a target:

```
RULE DST-014 | priority T6.450 | when Goal.distance = 100K and a plan is emitted | then compare its peak weekly volume with knopp.range.ultra and flag (never block) values outside it; silent for 50K (no source covers it) | because published tiers describe ~89 km road ultras, not proven doses (Room C R6) | evidence wg2 §4, CORROBORATED (tiers, description) | basis design_default | default? yes
```

## 7. School presets per family

`SchoolPreset` records (12 §2). Compatibility (`preset.compat.<id>`) states the days and weekly time the preset needs to stay coherent [opening-statusquo R2]; session mixes are in 06 §5.

| id | Families | min/max run days | min weekly time | Overrides | Grade | Note |
|---|---|---|---|---|---|---|
| method_default | all | 3 / 7 | `feas.finish_floor` | per family (05 §4): short 0.30/150; road_classic 0.50/HM 150, M 180/M 32 km, ratio M 1.40, floor M 2.00; ultra 0.60 peak/330 | design default (DECIDED round 1) | ultra: DST-003/008 apply |
| daniels | short, road_classic | 4 / 7 | 180 min | 0.25 of time, 150 min, quality 2; M ratio 2.00 | CORROBORATED [factdesk3 §4] | 30% variant ALLEGED, not used |
| hansons | road_classic | 6 / 7 | 360 min | `lr.abs_cap_km` 26, quality 3 SOS | CORROBORATED [wg2 §1] | cap only coherent with 6 days |
| pfitzinger_classic | M | 5 / 7 | 450 min | `lr.abs_cap_km` 35, quality 2–3, medium-long | CORROBORATED tiers / CREDIBLE peak [wg2 §1] | starting volume required |
| higdon_novice | M | 4 runs + 1 XT | 240 min | 0.50, 32 km, quality 0; M ratio **1.32** (F-02) | CORROBORATED [wg2 §1; factdesk2 §7] | long-run steps re-stepped (DST-015) |
| galloway | short, road_classic | 3 / 5 | `feas.finish_floor` | all runs run-walk; % none, 180 min time on feet incl. walks, no abs cap; M ratio 1.60 | CORROBORATED ratios [wg2 §1] | long runs ≥ race distance ALLEGED → not used |
| first | short, road_classic | 3 runs + 2 XT | 180 min | quality 3 (long counts) | CORROBORATED structure [factdesk3 §6]; outcomes ALLEGED [wg3 §3] | **status pending_fixture**: not selectable until its TID and long-run table are encoded (Room A R9, Room B R2) |
| koop_ultra | ultra | 4 / 7 | `feas.finish_floor` | `lr.ultra_*`, b2b opt-in | CREDIBLE [wg2 §4] | Koop plateau ~9 h/week CREDIBLE [hearing-1 §2] |
| norwegian_elite | short, HM | 6 / 7 | 600 min | quality 4–5, polarized | CORROBORATED elite / UNKNOWN amateur [wg1 §2] | gated (06 SES-019) |

Day/time values without a grade are design defaults derived from each preset's session structure.

```
RULE DST-015 | priority T5.457 | when preset = higdon_novice | then build its published long-run sequence through REP-002 hold steps so every step ≤ spike.warn_ratio × L30_eff; 03 recomputes weeks needed on the re-stepped curve; each hold step is a deviation-ledger entry | because 7 of 9 step-ups in the commonly cited sequence exceed 1.10× | evidence factdesk2 §7, CORROBORATED (start/peak) / ALLEGED (sequence); 07 §7 | basis design_default | default? yes
RULE DST-016 | priority T6.451 | when RunnerProfile.preset_preference is set and the goal family is not in the preset's families, or available run days or minutes fall outside preset.compat, or the preset's session mix would breach its declared TID shares (LOD-033) or be shortened by it, or the preset's status is pending_fixture, or SES-019's gate fails | then use method_default, log a deviation and show MSG-DST-PRESET naming the failed condition | because a preset outside its structure, or silently gutted, is a "Frankenplan" (Room A R9) | evidence opening-statusquo R2; wg2 §1, CORROBORATED | basis design_default | default? yes
RULE DST-017 | priority T6.452 | when no preset preference is set | then use method_default; for family ultra method_default takes the koop_ultra phase order and caps with back-to-backs off | because no school has been shown superior; Koop order is the documented ultra practice | evidence hearing-1 §2, CORROBORATED (no head-to-head); wg2 §4, CREDIBLE | basis design_default | default? yes
RULE DST-018 | priority T4.458 | when goal_type = time, Phase.type = SPECIFIC and the MSP L1 prerequisites hold | then at least one key session every dst.msp_every_weeks is an MSP module (SES-M-011; for road_classic the long-run segments of DST-006/007 come in addition), applied inside CMP-007's procedure after the node choice: in a SPECIFIC loading week with week.is_msp_week and no slot training MSP, the last slot becomes SES-M-011 (v5.2: moved from T5 to T4 and into the procedure, so CMP-007's priority can no longer suppress it) | because rising specificity is part of every proven plan and was lost when one key slot always went to THR (Room A R3) | evidence hearing-1 §2, CORROBORATED (rising specificity); design default (interval) | basis design_default | default? yes
RULE DST-019 | priority T5.459 | when Goal.distance = M, the active preset is method_default, Phase.type = SPECIFIC, and the longest logged run at the 180-min cap is shorter than lr.m_ext_km | then offer once (ask_confirm; no answer = the 3-h cap stays) up to lr.m_ext_max_runs extension runs, ≥ lr.m_ext_min_gap_days apart, each ≤ min(spike.warn_ratio × L30_eff in both dimensions, lr.m_ext_km, lr.floor_time_max_min), E1 run-walk, no MSP segment; only if TOL L4 is measured (LOD-017), FUEL L2 is held, there has been no flag or pain report in the last 14 days, the gate is not restricted, and the week holds the run at ≤ lr.over_cap_pct.road_classic of its time; NUT-034 when hot; extension runs never enter demand or feasibility and each is a ledger entry; show MSG-DST-LR-EXT | because one first-timer cohort links completing an ~18-mile run with fewer minor race-day injuries, while no study shows runs over 3 h are riskier: an informed, bounded option, not a default (N-01) | evidence factdesk3 §5, factdesk4 §2, CREDIBLE (one cohort; several summaries) (association) / CREDIBLE (continuous OR 0.87); hearing-2 med, UNKNOWN (duration); hearing-2 coach-field, CORROBORATED (2.5–3 h practice); d2-B R3 | basis design_default | default? yes
```

Messages: all texts for this module now live in `messages.md` (v4, p1-C R7). That includes MSG-DST-LR3H, MSG-DST-LR-EXT, MSG-DST-ULTRA-CAP (parameterised: "{cap_h} h", 4 h for a 50K and 5 h 30 for a 100K), MSG-DST-B2B, MSG-DST-PRESET and MSG-DST-TUNEUP.

Tests: every rule has `T-<ID>-fires` and `T-<ID>-silent` (14); e.g. T-DST-010-silent: TOL L4 ultra runner who opted in; T-DST-012-fires (replaced): tune-up > 1.10 × planned L30_eff.

## 8. Conflicts with contract and other modules (v1 record; resolved in RESOLUTIONS.md)

1. **INV-25 race exemption** should cover only the goal race. A tune-up entered as `is_race` must still satisfy INV-01/02/03 (DST-012). Requested wording change in 07.
2. **INV-03 wording** "if DUR L5 and back-to-backs enabled" is circular (DUR L5 is attained by doing pairs). It should read "if DUR L5 prerequisites hold and back-to-backs are enabled" (DST-010).
3. **INV-13 vs tune-up:** the tune-up is exempt from `lr.ultra_time_cap_min` (a preset convention) but not from spike caps; 05 must accept this exemption.
4. **lr.ultra_* presets column** in parameters.md says `koop_ultra` only; DST-008 applies them to every preset for ultras, otherwise `lr.time_cap_min` = 150 makes all ultras infeasible.
5. **02 changes requested:** `cmp.required.50K.HAB` 4 → 3; HEAT L2 required whenever conditions are hot (all distances).
6. **Registry gap:** `race.longest_ratio_max` lacks 5K/10K/HM values (proposed below; owner 03).
7. **06 SES-008** carries the ultra drop order (key sessions before easy volume) so that no second T3 rule competes with it.

## 9. Parameters proposed

| ID | Default | Unit | Range | Presets | Grade | Basis | Source | Owner |
|---|---|---|---|---|---|---|---|---|
| race.longest_ratio_max.5K / 10K / HM | 1.00 / 1.25 / 1.30 (merged with 03; RESOLUTIONS P5) | race ÷ peak long run | 0.8–1.2 / 1.0–1.5 / 1.2–1.6 | — | UNKNOWN (HM: long run > 21 km association) | dd | factdesk1 §7 | 03 (from 09) |
| cmp.required.50K.HAB | 3 | level | 3–4 | — | CORROBORATED tier / ALLEGED threshold | dd | wg2 §4 | 02 (from 09) |
| dst.phase_nodes | §3 table | node sets | — | koop_ultra = ultra row | CORROBORATED structure / CREDIBLE ultra | dd | hearing-1 §2; wg2 §4 | 09 |
| dst.ultra_build_split | 0.33 / 0.33 / 0.34 | share of BUILD weeks (VO2 / THR / steady) | — | koop_ultra | CREDIBLE order, UNKNOWN dose | dd | wg2 §4 | 09 |
| dst.msp_share.<d>.L1 / L2 / L3 | 0.10 / 0.30 / 5K 0.75, 10K 0.65, HM 0.55, M 0.50 | share of race duration | L3 ±0.15 | — | ALLEGED | dd | 02 §2; wg2 §1 | 09 |
| dst.race_long_every_weeks | 2 | weeks | 1–3 | pfitzinger_classic 2 | CREDIBLE (practice) | conv | hearing-1 phys-field | 09 |
| lr.ultra_peak_every_weeks | 2 | weeks | 2–3 | koop_ultra | CREDIBLE | conv | wg2 §4 | 09 |
| dst.ultra_alt_long_ratio | 0.70 | × last peak | 0.6–0.8 | — | ALLEGED | dd | wg2 §4 | 09 |
| b2b.day2_start_ratio | 0.40 | × day 1 | 0.30–0.50 | — | ALLEGED | dd | wg2 §4 | 09 |
| dst.tuneup_dist_km | 50K: 42.2 (marathon); 100K: 50 | km | 100K 50–56 | — | CREDIBLE (Comrades) / dd for 50K | conv | wg2 §4 | 09 |
| dst.tuneup_weeks_out | 5 | weeks before race | 4–6 | — | CREDIBLE | conv | wg2 §4 | 09 |
| dst.tuneup_recovery_days | 7 | days | 5–10 | — | ALLEGED | dd | hearing-1 §2 | 09 |
| knopp.range.ultra | finish 45–50; Bronze 50–65; 60–70; 75–80; Silver 100–120 | km/week peak, by goal tier | — | — | CORROBORATED (description) | ev | wg2 §4 | 14 |
| preset.compat.<id> | §7 table | days, min/week | — | per preset | as §7 | dd/conv | wg2 §1; opening-statusquo | 09 |

## Machine records (v5)

Source of `rules.json` (12 §3.2). One JSON object per line: `id`, `condition` (RuleExpr), `on_unknown`, typed `action` (12 §3.3) and, where not `formal`, `status`. `design/v5/tools/build_rules.py` joins each record to its RULE line above by `id`; a record without a RULE line, or a T0–T2 RULE line without a record, fails the build. Rules of this module that have no record here are `text_only` (`on_unknown: null`; the engine refuses to evaluate them).

```rulexpr
{"id": "DST-010", "condition": "session.is_b2b_pair && !(goal.family == 'ultra' && state.levels.DUR >= p('b2b.min_dur_level') && state.levels.TOL >= p('b2b.min_tol_level') && profile.b2b_opt_in && week.phase in ['BUILD', 'SPECIFIC'] && !week.is_deload && state.log_status == 'rich' && size(flags.active) == 0)", "on_unknown": "fire", "action": {"op": "block_sessions", "filter": "s.is_b2b_pair && s.week_id == week.id", "until": "never"}}
{"id": "DST-011", "condition": "session.is_b2b_pair", "on_unknown": "fire", "action": {"op": "cap", "target": "session.day2_s", "expr": "(week.is_first_pair ? p('b2b.day2_start_ratio') : p('b2b.day2_ratio')) * session.day1_s", "then": [{"op": "cap", "target": "session.pair_s", "expr": "p('b2b.pair_cap_ratio') * l30_time(session.date)"}]}}
{"id": "DST-001", "condition": "has(goal.distance)", "on_unknown": "skip", "action": {"op": "set", "target": "goal.family", "expr": "{'5K': 'short', '10K': 'short', 'HM': 'road_classic', 'M': 'road_classic', '50K': 'ultra', '100K': 'ultra', 'none': 'base'}[goal.distance]"}, "stage": "S0"}
{"id": "DST-002", "condition": "event.type == 'node_candidates'", "on_unknown": "skip", "action": {"op": "filter_candidates", "target": "slot.node_candidates", "expr": "exists(p('dst.phase_nodes')[goal.family][week.phase_row], q, q.node == node.id && state.levels[node.id] + 1 <= q.max_level)"}}
{"id": "DST-004", "condition": "goal.expected_conditions == 'hot'", "on_unknown": "skip", "action": {"op": "route", "to": "NUT-040"}, "stage": "S7.2"}
{"id": "DST-005", "condition": "goal.family == 'short' && event.type == 'sessions_set'", "on_unknown": "fire", "action": {"op": "constraint", "check": "all(plan.long_runs, lr, (lr.module_id == 'SES-M-003' && lr.hard_time_s == 0 && lr.e2_time_s == 0) || (state.exp_path in ['calibrating', 'confirmed'] && lr.module_id == 'SES-M-031' && lr.hard_time_s == 0))", "then": [{"op": "filter_candidates", "target": "slot.candidates", "expr": "m.id != 'SES-M-005'"}]}}
{"id": "DST-006", "condition": "goal.distance == 'HM' && goal.goal_type == 'time' && week.phase == 'SPECIFIC' && !week.is_deload && week.is_race_long_run_week && level_prereqs_hold('MSP', 1, week.long_run_date)", "on_unknown": "skip", "action": {"op": "replace_module", "target": "week.long_run", "expr": "'SES-M-005'", "then": [{"op": "set", "target": "week.long_run.race_segment_s", "expr": "min(week.msp_share_next * goal.target_time_s, unit.min_s * p('dst.msp_segment_max_min')['HM'], p('dst.msp_segment_max_ratio') * week.lr_s)"}]}, "stage": "S7.2"}
{"id": "DST-017", "condition": "!has(profile.preset_preference) || profile.preset_preference == 'method_default'", "on_unknown": "fire", "action": {"op": "set", "target": "preset.id", "expr": "'method_default'"}, "stage": "S5"}
{"id": "DST-018", "condition": "goal.goal_type == 'time' && week.phase == 'SPECIFIC' && !week.is_deload && week.is_msp_week && level_prereqs_hold('MSP', 1, week.start) && !exists(week.key_slots, x, x.node == 'MSP') && size(week.key_slots) > 0", "on_unknown": "skip", "action": {"op": "replace_module", "target": "week.last_key_slot", "expr": "'SES-M-011'"}, "stage": "S7.3"}
```

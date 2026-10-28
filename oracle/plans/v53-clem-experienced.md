# Hand-computed plan: the owner's case on the experienced path (spec v5.3)

*Oracle session, 28 Oct 2026. Derived from the spec text alone (02 §2b, 03 §3b, 04, 05, 06 §2c–§2d, 07 §2b, 09,
12 §2b.4, `parameters.md` §15b). `engine/` was not opened. `docs/v5.3-case/plan-after.md` (an engine output) was read
as part of the task's background documents before this derivation; no value below is taken from it, and where the two
agree that is noted only in §8. Every v5.3 value is a design default, unvalidated; no coach has read this. Checkable
form: `src/expected/v53-clem-plan.ts`; tests: `tests/04-v53-arithmetic.test.ts` (no engine) and
`tests/15-v53-quality.test.ts` (engine).*

Fixture: `fixtures/v53-clem-confirmed.json` (the owner's `docs/v5.3-case/clem.json` with "official result?" = yes).
Status words: **firm** (one reading), **assumed** (depends on the named open question in `SPEC-QUESTIONS.md`).

## 0. The same profile as typed (`fixtures/v53-clem.json`)

`official_result_confirmed` is unanswered → EXP-001 fails on that condition alone → **EXP-006**: cautious plan and
MSG-EXP-CONFIRM-Q once. The race was entered 8 days late (INP-005: not measured; not declared without the "yes") →
**estimated**: no paces, every session in the time form (SES-031). CMP-004 caps TOL at 2 → SES-007 gives **1 key
session in every phase**; GEN-011 caps L30_eff at `claim.l30_cap_by_tol[2]` = 90 min; slow profile (GEN-014).
These are the properties `checkQuality` asserts for a cautious plan (no calibration week, no form a/b, ≤ 2 keys).

## 1. Inputs that matter

| Input | Value |
|---|---|
| today / plan start | Mon 2 Nov 2026 |
| goal | 10K, time 36:00 (2160 s), race Sun 4 Apr 2027 |
| born | March 1990, sex blank |
| training age | "about 10 years" → band 5 (`clem.json` holds 10, not a schema band; OQ-36) |
| claims | 7 runs, 85 km, 480 min (28 800 s) a week; longest 34 km in 166 min (9960 s); last run this week |
| race | half marathon 21 097 m in 1:21:37 (4897 s) on Sun 25 Oct 2026, all-out, entered 2 Nov 21:00, official = yes |
| availability | 7 days, ≤ 12 runs, 600 min; long run Sunday; no hill access; no preferences set |

## 2. Path and levels (02 §2b)

**Qualifying race.** 21 097 m is within 2 % of the half (`exp.distance_tol_pct`); 8 days old ≤ 84; all-out; official = yes.

**Age-grade.** Age at the race: age_low(25 Oct 2026, born March 1990) = 36. Factor, linear between 35 and 40:
men 0.99 − (0.99 − 0.965) × 1/5 = **0.985**; women 0.985 − (0.985 − 0.955) × 1/5 = **0.979**.
Men: 100 × 3451 / 0.985 / 4897 = **71.54 %**. Women: 100 × 3772 / 0.979 / 4897 = 78.68 %. Sex blank → the lower:
**71.54 % → row 65–74 %**.

**EXP-001.** Claimed 480 min ≥ 240 (row band, no upper edge); 7 runs ≥ 3; training age 5 ≥ 2; age 36 ≥ 18; L30 34 km ≤
85 km (GEN-022); no pain flag; no injury; screening all "no" → gate proceed. **All hold → experienced path,
calibrating.** (A failing case for each condition is in `tests/04-v53-arithmetic.test.ts`.)

**EXP-002 levels.**

| Node | From | Raw | Level (declared) |
|---|---|---|---|
| THR | row 65–74 % | — | **3** |
| VO2 | row 65–74 % | — | **2** |
| MSP | half ≠ 10K family (road_classic vs short) | — | **0** |
| HAB | 7 runs ≥ 5 → L4 | 4 | **3** (cap `exp.claim_level_cap`) |
| TOL | 480 ≥ 360 and 166 ≥ 150 → L4 (540/210 not met) | 4 | **3** |
| AER | 480 ≥ 450 → L4 | 4 | **3** |
| DUR | 166 ≥ 120 → L3 (180 not met) | 3 | **3** |

Required for a 10K time goal (02 §5): THR 2, VO2 2, MSP 1 → only **MSP** has a gap.

## 3. Phases, deloads, volume, long run

**W** = Mon 2 Nov → Mon 29 Mar (race week) = 147 days / 7 + 1 = **22**. H3.
04 §3: T = 2; R = 20. The runner already holds the volume and long-run targets, so base_needed is small (≤ 8; the exact
G is not needed): S = min(4, max(2, 20 − base − 1)) = 4; B = base; U = 20 − B − 4 > 8 = `phs.build_max` → the excess
goes to BASE → **BASE 1–8, BUILD 9–16, SPECIFIC 17–20, TAPER 21–22**. No ONBOARD (04 §1, v5.3).
Deloads (`deload.every` 4; the runner is 36, no context modifier): weeks **4, 8** (8 is the last BASE week, PHS-004
leaves it), **12, 16**; 20 lies 1 week before the taper < `deload.exclusion_before_taper` 2 → dropped (PHS-002).

**Volume.** V_hold = the claimed 28 800 s. LOD-007 (v5.3): cap 1.10 × max(est_base, V_hold) = 31 680 s, not binding.
V_peak = min(600 min, max(V_req, V_hold 480, V_next = AER 4 threshold 450)) = **480 min**. LOD-003 never binds on a
flat curve. Standard profile (GEN-014, CTX-007 v5.3). Every loading week **28 800 s**; deload **0.75 × 28 800 = 21 600 s**.

**Long run.** GEN-011 (v5.3): L30_eff = 0.9 × 9960 = **8964 s** (no TOL cap); distance 0.9 × 34 000 = 30 600 m ≤ 0.6 ×
85 000. L_hold = L30_eff; L_target = max(L_req, L_hold) = 8964. lr_cap (short, ≥ 5 runs) = 0.30 × 28 800 = 8640 ≤ 150 min;
max(lr_cap, L_hold) = 8964. LR = round_down(min(1.10 × 8964, 8964, 8964), 60) = **8940 s (149 min)**, "or 33.6 km
whichever comes first" (1.10 × 30 600 rounded down to 100 m). Deload: 0.75 × 8940 = 6705 → **6660 s (111 min)**
[alternative 0.75 × 8964 → 6720, OQ-03]. LOD-005 holds it at L_hold in every loading week.

**Runs.** 7 a week (one per available day; the spec does not say how the count is chosen below `max_runs_per_week` 12 —
the claim is 7 and the plan cannot place two runs on one day; OQ-34).

## 4. Paces and the distance form (03 §3b, 06 §2d)

The anchor is **declared** (official, all-out, entered after 48 h) and the runner is on the experienced path → paces,
slow edge × 1.02. Valid until race + 120 days = **22 Feb 2027** (week 17); later weeks are effort-only (Q-E36).

Equivalent times (Riegel 1.06): T_5K = 4897 × (5000/21 097)^1.06 = **1064.5 s** (17:45); T_10K = **2219.5 s** (36:59);
T_M = 4897 × 2.19 = **10 724 s**. CS = 10 000 / 2219.5 = 4.5055 m/s; v5K = 4.6969; vM = 3.9345.

| Effort | Speeds (m/s) | s/km raw | nearest 5 s | slow × 1.02 (A: rounded first / B: raw) |
|---|---|---|---|---|
| E4 | 4.6969 × [0.98, 1.02] | 208.7–217.3 | 210–215 | **210–220** / 210–225 |
| E3 | 4.5055 × [0.92, 0.97] | 228.8–241.3 | 230–240 | **230–245** / 230–250 |
| E1 | 3.9345 × [0.72, 0.92] | 276.3–353.0 | 275–355 | **275–365** / 275–365 |

(OQ-27: which slow edge is widened.) Midpoint speeds (mean of the edge speeds), reading A: E3 **4.2147**, E4 **4.6537**,
E1 **3.1880** m/s (B: 4.1739, 4.6032, 3.1880). Default preference → **distance** form (SES-031).
Rep distance = rep time × midpoint speed → nearest of 200 … 2000 m, then whole km (ties shorter), kept if within 10 %:

| Rep | A: exact → shown | B: exact → shown |
|---|---|---|
| 8 min E3 (480 s) | 2023 → **2000 m** (1.1 %) | 2004 → 2000 |
| 3 min E4 (180 s) | 838 → **800 m** (4.5 %) | 829 → 800 |
| 11 min E3 (660 s) | 2782 → **3000 m** (7.8 %) | 2755 → 3000 (8.9 %) |
| 12 min E3 (720 s) | 3035 → **3000 m** | 3005 → 3000 |
| 30 min E3 (1800 s) | 7587 → **8000 m** (5.5 %) | 7513 → 8000 (6.5 %) |
| 20 min E3 (1200 s) | 5058 → **5000 m** | 5009 → 5000 |
| 1 min E4 (60 s) | 279 → **300 m** (7.4 %) | 276 → 300 (8.6 %) |
| 5 min E3 (300 s, deload alternative rung 0) | 1264 → **1200 m** (5.1 %) | 1252 → 1200 |

Jogs at E1 midpoint, 100-m steps: 2 min → 383 → **400 m**; 3 min → 574 → **600 m**; 1 min → 191 → **200 m**.
Both readings give the same card in every case below. **The time is what every budget counts**: the doses below are
the ladder's minutes; the metres are rendering only.

## 5. Weeks 1–6 (day-0 plan, projection as intended)

Session time of a key = 600 warm-up + work + recoveries + 300 cool-down (06 §2c).
Easy fill = 12 §2b.4 `water_fill`: remaining time shared equally, capped next to a long run at
min(0.5 × that LR, 1.6 × l30 − LR) (LOD-013), rounded down to 60 s, leftover by 60 s to the earliest days.
Strides on 2 easy runs a week (SES-021), counted inside the easy run's time (OQ-09).

### Week 1 — BASE, calibration (EXP-003) — firm except the days (OQ-32)
- **Keys = 2** (SES-007 v5.3: calibration week → `exp.calibration_keys`): SES-M-008 then SES-M-010, each at the **entry
  rung** (SES-027): THR 3 → step 5 = **5 × 8 min E3, 2 min jog**: 600 + 2400 + 4 × 120 + 300 = **3780 s (63 min)**;
  VO2 2 → step 2 = **5 × 3 min E4, 3 min jog**: 600 + 900 + 4 × 180 + 300 = **2520 s (42 min)**.
  Cards: "5 × 2000 m at threshold (≈ 3:50–4:05 /km), 400 m jog" · "5 × 800 m at 5K effort (≈ 3:30–3:40 /km), 600 m jog";
  time form: "5 × 8 min …, 2 min jog" · "5 × 3 min …, 3 min jog".
- **Days**: the all-E1 Sunday long run is not a hard day, but the gap score counts it (SES-004 v5.3). Points {k1, k2,
  Sun 6}: Mon 0 + Thu 3 → gaps 3, 3 (the only set with min gap 3) → **Mon, Thu**. If the claimed Sunday run of 1 Nov
  counts as "the previous week's long run", points {−1, k1, k2, 6} → best min gap 2 → no key on Monday → **Tue, Thu**
  (alternative, OQ-32).
- **Long run** Sun **8940 s**. **Volume** 28 800 s.
- **Easy**: 28 800 − 8940 − 3780 − 2520 = 13 560 s over Tue, Wed, Fri, Sat (Sat cap min(4470, 1.6 × 8964 − 8940 = 5402)
  → 4470); 13 560 / 4 = 3390 → 3360 each, +120 → **Tue 3420, Wed 3420, Fri 3360, Sat 3360**.
- TID: E3+E4 = 2400 + 900 = 3300 s ≤ 0.20 × 28 800 = 5760.

### Weeks 2 and 3 — BASE, calibration — firm
Same two sessions at the same rung (no step-up inside calibration, EXP-003); days: points {Sun −1, k1, k2, Sun 6},
non-adjacent keys, min gap 2 is the best; ties → none on Monday (day after a long run) → earliest → **Tue, Thu**.
Easy Mon (cap 4470), Wed, Fri, Sat: **Mon 3420, Wed 3420, Fri 3360, Sat 3360**. LR 8940, V 28 800.

### Week 4 — BASE deload — assumed (OQ-29)
V **21 600 s**, LR **6660 s** (alt. 6720). **1 key** (SES-016, `deload.quality_max`), the slot ranked first =
threshold → SES-M-008 at its "start dose": read as the **entry rung** for this runner, **5 × 8 min (3780 s)**
[alternative: index 0, 3 × 5 min = 600 + 900 + 240 + 300 = 2040 s, "3 × 1200 m", OQ-29]. Day: points {−1, k, 6} →
Wed (gaps 3, 4) ties Thu (4, 3) → earliest → **Wed**.
Easy: 21 600 − 6660 − 3780 = 11 160 s over Mon (cap 4470), Tue, Thu, Fri, Sat (cap min(3330, 7644) = 3330);
11 160 / 5 = 2232 → 2220 each, +60 → **Mon 2280, Tue/Thu/Fri/Sat 2220**.

### Week 5 — BASE — firm
**1 key** (SES-007 v5.3: BASE 1; Q-E34). Node: BASE candidates for the short family are AER, DUR, ECO, VO2 ≤ 1,
THR ≤ 1 (`dst.phase_nodes`); THR 3 and VO2 2 are above their ceilings, AER/DUR/ECO have no gap, MSP is not a BASE
node → no candidate → SES-026: "in BASE the one key slot takes the threshold family" → SES-M-008 (SES-M-009/030 are
BUILD–SPECIFIC only). Dose: one rung above its last non-deload instance (week 3, step 5; SES-011/028) → **step 6 =
4 × 11 min**: 600 + 2640 + 360 + 300 = **3900 s (65 min)**; card "**4 × 3 km** at threshold, 400 m jog" (2782 m → 3 km,
7.8 %). Day **Wed**. LR 8940, V 28 800.
Easy: 28 800 − 8940 − 3900 = 15 960 over Mon (cap 3330, after the 6660-s deload long run), Tue, Thu, Fri, Sat (cap 4470);
15 960 / 5 = 3192 ≤ every cap → 3180 each, +60 → **Mon 3240, others 3180**.

### Week 6 — BASE — firm
SES-M-008 **step 7 = 4 × 12 min** (the top rung for THR 3: `ses.top_rung` 7): 600 + 2880 + 360 + 300 = **4140 s
(69 min)**; card "**4 × 3 km**" (3035 m). Wed. Easy: 28 800 − 8940 − 4140 = 15 720 → 3144 → 3120 each, +120 →
**Mon 3180, Tue 3180, Thu/Fri/Sat 3120**.

(Weeks 7 and 8, not asked, follow the same rules: week 7 = week 6 (top rung); week 8 = week 4.)

## 6. A BUILD week: week 9 — firm for keys/doses/volume, assumed for days (OQ-17)

- **Key count**: BUILD, non-deload, 7 runs ≥ `exp.three_keys_runs_min` 6, TOL 3 ≥ 3, ceiling 3 → **3** (SES-007).
  Budget: work 30 + 15 + 26 = 71 min ≤ 0.20 × 480 = 96 min (SES-006 budget term does not bind).
- **Form**: `exp.long_quality_pattern.BUILD` = [a, b]; first BUILD loading week, index 0 → **form a**: three workouts and an
  all-E1 long run that is not a hard day (SES-026).
- **Modules** (SES-026 form a + SES-030 rotation): no THR/VO2 gap (THR 3 ≥ 2, VO2 2 ≥ 2) → fallback slots.
  Threshold slot: the THR family member after the last one used (SES-M-008) → **SES-M-009** continuous threshold
  (prereqs THR 2, AER 3: held). VO2 slot: after SES-M-010 → **SES-M-027** short reps. Third slot: the family with the
  larger 10K weight (THR 0.30 > VO2 0.20) → next THR member not already in the week → **SES-M-030** combination.
- **Doses** (first instances → entry rungs, SES-027):
  - SES-M-009, THR 3 → step 3 = **30 min E3**: 600 + 1800 + 300 = **2700 s (45 min)**; "**8 km** at threshold" (7587 m).
  - SES-M-027, VO2 2 → step 2 = **15 × 60 s E4, 60 s jog**: 600 + 900 + 840 + 300 = **2640 s (44 min)**; "**15 × 300 m**
    at 5K effort, 200 m jog".
  - SES-M-030, THR 3 → step 1 = **20 min E3, 3 min jog, 6 × 1 min E4, 1 min jog**: 600 + 1200 + 180 + 360 + 300 + 300 =
    **2940 s (49 min)**; "**5 km** at threshold, 600 m jog, then **6 × 300 m** at 5K effort, 200 m jog".
- **Days**: points {Sun −1, three non-adjacent keys, Sun 6}; every valid set has min gap 1; ties → fewest keys on Monday →
  the only Monday-free set of three non-adjacent days in Tue–Sat is **Tue, Thu, Sat**; slots in rank order → Tue
  SES-M-009, Thu SES-M-027, Sat SES-M-030 (OQ-17). The Saturday workout sits before an all-E1 long run: allowed (decision 4).
- **Long run** Sun 8940 s, all E1. **Volume** 28 800 s.
- **Easy**: 28 800 − 8940 − 8280 = 11 580 over Mon (cap 3330 after the deload long run), Wed, Fri; level h = (11 580 −
  3330) / 2 = 4125 → Mon 3300, Wed 4080, Fri 4080, leftover 120 → Wed **4140**, Fri **4140** (Mon would pass its cap).

## 7. Summary table (checkable values)

| Wk | Phase | V (s) | LR (s) | Keys (day: module step → session s; card) |
|---|---|---|---|---|
| 1 | BASE cal. | 28 800 | 8940 | Mon (alt. Tue): 008 s5 → 3780, 5 × 2000 m · Thu: 010 s2 → 2520, 5 × 800 m |
| 2 | BASE cal. | 28 800 | 8940 | Tue: 008 s5 · Thu: 010 s2 |
| 3 | BASE cal. | 28 800 | 8940 | Tue: 008 s5 · Thu: 010 s2 |
| 4 | BASE deload | 21 600 | 6660 (6720) | Wed: 008 s5 (alt. s0 → 2040) |
| 5 | BASE | 28 800 | 8940 | Wed: 008 s6 → 3900, 4 × 3 km |
| 6 | BASE | 28 800 | 8940 | Wed: 008 s7 → 4140, 4 × 3 km |
| 9 | BUILD form a | 28 800 | 8940 | Tue: 009 s3 → 2700, 8 km · Thu: 027 s2 → 2640, 15 × 300 m · Sat: 030 s1 → 2940, 5 km + 6 × 300 m |

## 8. Notes for the owner and the coach

- **Agreement check (done after the derivation):** the summary table of `docs/v5.3-case/plan-after.md` (an engine
  output) shows the same values for every item it prints for these weeks: path, calibration, key days (week 1 Mon/Thu,
  the primary reading here), modules, cards, long run 149 / 111 min, volume 480 / 360 min. It does not print easy runs,
  dose steps or recovery minutes, so those are not cross-checked. This is not a test of the engine: the oracle tests run
  only when someone points them at it (README).
- Coach-quality findings that follow from the spec as written (not engine bugs): one key session in BASE weeks 5–8 after
  two in calibration (Q-E34, the oracle reports it as a QC-03 warning); deload long runs of 111 min are below
  0.8 × 166 = 133 min (QC-05 as written; OQ-30); race-pace work starts at the bottom of its ladder because the half sets
  no MSP level for a 10K (Q-E35).

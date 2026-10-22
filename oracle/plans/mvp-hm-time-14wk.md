# Hand-computed MVP plan B — half-marathon time goal, 14 weeks, 4 runs a week

Written by the Oracle session from the spec text only. Input: `oracle/fixtures/mvp-hm-time-14wk.json`.
Checkable form: `oracle/src/expected/mvp-plans.ts` (`PLAN_HM`). Minutes here, seconds in the `.ts` file.

> **In plain words.** A 41-year-old who already runs 4½ hours a week, with a 2 h 12 min long run, wants a
> 1:50 half marathon in fourteen weeks. A 10K in 50:00 last month predicts about 1:48 today, so the goal fits
> ("feasible"). Because her tolerance level is 3, she gets **two** hard sessions a week: threshold intervals
> on Tuesday and a progression run on Friday, with an easy Wednesday and the long run on Sunday. The long run
> carries fuelling practice from the first week, because the race will last more than 90 minutes.

## 1. Runner (invented)

| Input | Value | Why it matters |
|---|---|---|
| Age, training age, injury | 41 (06/1985), band 5 years, none | standard profile, deload every 4 weeks |
| Days | Tue, Wed, Fri, Sun; long run Sunday; 4 runs; 360 min/week | 360 leaves room for strength above 300 min of running |
| Log | 8 weeks of Tue 45, Wed 45, Fri 48, Sun 132 min at 6:00/km | V28 270 min, L30 132 min / 22 km → TOL L3, AER L2, HAB L3; baseline confirmed |
| Anchor | 10K race 50:00 on 4 Oct 2026, entered the same day | measured |
| Goal | half marathon, 1:50:00, Sunday 7 Feb 2027 | W = 14 |

## 2. Day 0

- **S_slow** 2.5 m/s. **L_req**: ratio 21 097 / 1.30 / 2.5 = 6491 s (108 min); floor 13 185 m / 2.5 = 88 min; DUR L2 =
  90 min → **108 min**. L_hold = 132 min, so the long run is held at 132 (L_target = max(108, 132)).
- **Required levels**: HAB 2, AER 3, TOL 2, DUR 2, THR 2, MSP 2, and **FUEL 2** (expected race duration = slow edge
  1:55:40 > 90 min; CMP-008).
- **V_req** = max(AER 3 = 300, TOL 2 = 150, floor 150, max(108/0.50, 108/0.60) = 216) = **300 min**; V_peak = 300.
- **Weeks**: n_L = 0 (already above L_req), n_V = ⌈ln(300/270)/ln 1.15⌉ = 1, G = 1, base 0. **Slack** = 14 − (0 + 0 + 1 +
  3 + 2) = **8**. K_key = max(THR 2, MSP 2) × 4 = 8 ≤ 12.
- **Prediction**: 3000 × 2.1097^1.06 = 6619 s; P_race **1:48:06**; band 1:40:32 to 1:55:40. Target 1:50 inside, slower
  than P_race → **feasible**, no reasons.
- **Phases**: T 2, R 12, S = min(6, max(3, 11)) = 6, B = max(0, 0) = 0, U = 6 → **BUILD 1–6 · SPECIFIC 7–12 · TAPER
  13–14**. There is no BASE phase: the runner already meets the growth targets (OQ-23 asks whether an H3 plan
  may have none).
- **Deloads**: 4 (stays), 8 (stays), 12 (one week before the taper → dropped).
- **Key count**: HAB 3, TOL 3 → 2 in BUILD and SPECIFIC (SES-007); 4 runs − 2 non-key runs = 2 (SES-006); deload 1.
- **Paces**: CS = 3.33 m/s → E3 **5:10–5:25 /km**.

## 3. The day-0 plan

| Wk | Phase | V | LR (fuel) | Tue key | Fri key | Easy | Notes |
|---|---|---|---|---|---|---|---|
| 1 | BUILD | 300 | 132 (30 g/h), **DUR L1 test** | threshold 3 × 5 (34) | progression 40 | Wed 94 | slot 1 THR (0.30 × 2/4); slot 2 DUR wins but is a volume node → BUILD list rotated by 1: VO2 intervals fail their prerequisites → progression run |
| 2 | BUILD | 300 | 132 (30) | 3 × 5 | 40 | Wed 94 | rotation offset 2 → progression run |
| 3 | BUILD | 300 | 132 (30) | 3 × 5 | 40 | Wed 94 | |
| 4 | BUILD deload | 225 | 99 (30) | 3 × 5 | — | Wed 46, Fri 46 | 1 key at start dose |
| 5–6 | BUILD | 300 | 132 (30) | 3 × 5 | 40 | Wed 94 | |
| 7 | SPECIFIC | 300 | 132 (30) | 3 × 5 | strides slot | Wed 67, Fri 67 | slot 2: race-pace intervals need THR L1 + DUR L1; every fallback module fails (SES-M-012 is not a SPECIFIC module) → strides |
| 8 | SPECIFIC deload | 225 | 99 (30) | 3 × 5 | — | Wed 46, Fri 46 | |
| 9–12 | SPECIFIC | 300 | 132 (30) | 3 × 5 | strides slot | Wed 67, Fri 67 | no race-effort long run (DST-006) and no race-pace session (DST-018): MSP L1 prerequisites not held |
| 13 | TAPER k1 | 210 | 92 (30) | sharpener 2 × 5 E3 in Tue's easy run | — | Tue 40, Wed 39, Fri 39 | −30 % |
| 14 | RACE week | 150 + race | — | — | — | Tue 50, Wed 50, Fri 50 | |

Arithmetic: deload V 0.75 × 300 = 225, LR 0.75 × 132 = 99; taper V 300 × 0.7 = 210, LR 132 × 0.7 = 92.4 → 92;
race week 300 × 0.5 = 150. Easy Wednesday in a two-key week = 300 − 132 − 34 − 40 = 94. Hard minutes (HM budget
0.15 × 300 = 45 min): 15 + 6 = 21. E2 (budget 60 min): 6.

## 4. As published each Monday (everything logged as planned)

| Wk | Tue | Fri | Easy Wed | Long run | Rule |
|---|---|---|---|---|---|
| 1 | 3 × 5 (34) | progression 40 | 94 | 132, 30 g/h, DUR L1 test | |
| 2 | **3 × 6** (37) | **50** | 81 | 132, 30 g/h, **DUR L2 test** | SES-011 step up; SES-012 (DUR L1 passed, two logged long runs ≥ 90) — OQ-15 |
| 3 | **3 × 7** (40) | **60** | 68 | 132, **45 g/h** | NUT-011: two practice runs at 30 g/h, stomach 0/10 → +15; FUEL L1 |
| 4 deload | 3 × 5 (34) | — | Wed 46, Fri 46 | 99, 45 g/h | SES-016; deload long runs keep the step |
| 5 | **THR L1 test 2 × 8** (33) | **70** (maximum) | 65 | 132, **60 g/h** | SES-012 (weeks 2 and 3 ≥ 16 min of E3); NUT-011 ceiling 60 g/h = top of the FUEL L2 band; FUEL L2 |
| 6 | **literal reading**: the re-plan re-checks K: MSP still 0 → 8 weeks needed, 7 left → LEVELS_UNREACHABLE; the long-run demand is met (132 ≥ 108) → **degraded completion**: the goal becomes a finish goal, verdict stretch with DEGRADED_COMPLETION | | | | FEA-021, FEA-043 — **OQ-01** |
| 6 | *alternative:* **3 × 8** (43) | 70 | 55 | 132, 60 g/h | THR (0.075) still first; rotation offset 5 → progression run |
| 7+ | not tabulated (depends on OQ-01) | | | | |

Under the alternative reading, the race-pace work of SPECIFIC appears from week 7: THR L1 and DUR L1 are held,
so MSP's module (race-pace intervals, SES-M-011, at 10 % of the expected race time = 11.5 min in one repeat)
becomes eligible, week 7 is an MSP week (DST-018), and from the second SPECIFIC long run on every second long
run ends with an E3 segment (DST-006: 0.30 × 1:50 = 33 min once MSP L1 is held, else 0.10 × 1:50 = 11 min). These
weeks are described, not encoded, because they only exist on one side of OQ-01.

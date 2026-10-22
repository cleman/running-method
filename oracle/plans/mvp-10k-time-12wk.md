# Hand-computed MVP plan A — 10K time goal, 12 weeks, 4 runs a week

Written by the Oracle session from the spec text only (modules 02–06, 09, 12, parameters.md), without the
generator. Input: `oracle/fixtures/mvp-10k-time-12wk.json`. Checkable form: `oracle/src/expected/mvp-plans.ts`
(`PLAN_10K`). Every invented input value is tagged `invented` in the fixture. Durations are minutes here
(the engine works in seconds; seconds are in the `.ts` file).

> **In plain words.** A 29-year-old who runs 2 hours a week on four days wants to run 10K in 52:00 in twelve
> weeks. Her 5K of 25:00 last month says she could run about 51:00 today, so the goal fits ("feasible"). She
> builds for two weeks, then gets one hard session a week (threshold intervals) with three easy days, a
> lighter week every fourth week, and a two-week taper. She keeps one hard session a week throughout,
> because her tissue-tolerance level (TOL) stays at 1–2, and the method allows a second hard session only
> from TOL 3.

## 1. Runner (invented, `oracle/fixtures/mvp-10k-time-12wk.json`)

| Input | Value | Why it matters |
|---|---|---|
| Age, training age, injury | 29 (born 03/1997), 2 years, none | no context modifier: standard profile, deload every 4 weeks |
| Days | Tue, Wed, Fri, Sun; long run Sunday; 4 runs; 240 min/week | Sunday has no run day next to it |
| Log | 8 weeks, each Tue 30, Wed 18, Fri 30, Sun 42 min, all at 6:00/km, ticked the same evening | rich log; V28 = 120 min; L30 = 42 min / 7 km; HAB L3; baseline confirmed (LOD-008) |
| Anchor | 5K race 25:00 on 10 Oct 2026, entered the same day | measured, 23 days old → paces allowed |
| Goal | 10K, time 52:00, race Sunday 24 Jan 2027 | W = 12 |

## 2. Day 0: demand, feasibility, phases

- **Planning speed** (03 §2): median logged speed 1000/360 m/s × (1 − 0.10) = **2.5 m/s**.
- **Long-run demand**: ratio term (10 000 / 1.25) / 2.5 = 3200 s; floor 8000 m / 2.5 = 3200 s; required DUR L1 →
  60 min. L_req = max(min(3200, 150 min), 3200, 3600) = **60 min**.
- **Required levels** (02 §5, closed under prerequisites): HAB 2, AER 2, TOL 2, DUR 1, THR 2, VO2 2, MSP 1. No FUEL:
  the expected race duration is the slow edge 54:39 < 90 min (CMP-008).
- **Weekly demand**: max(AER 2 = 180, TOL 2 = 150, floor 90, % term dropped because L_req ≤ 60 min) = **180 min**.
  V_peak = min(240, max(180, V_hold 120, next AER level 180)) = 180 min.
- **Weeks needed** (03 §4): n_L = ⌈ln(60/42)/ln 1.10⌉ = 4; n_V = ⌈ln(180/120)/ln 1.15⌉ = 3; G = 4 + ⌊4/3⌋ = 5. The dry
  run (below) reaches 60 min and 180 min in week 5, so G = 5 is settled. base = 5 − 1 − 2 = **2**; build 1, specific
  2, taper 2. **Slack** = 12 − (0 + 2 + 1 + 2 + 2) = **5** → no LOW_SLACK.
- **Level weeks**: K_key = max(THR 2, VO2 2, MSP 1) × 4 = 8 ≤ 12 − 2 − 0 = 10 → no LEVELS_UNREACHABLE.
- **Prediction** (03 §3): 1500 × 2^1.06 = 3127 s; P_race = × 0.98 = **51:04**; band ±7 % (measured, other distance)
  → **47:30 to 54:39**. Target 52:00 is slower than P_race → no band reason. **Verdict: feasible**, no reasons,
  no label.
- **Phases** (04 §3): T = 2, R = 10, S = min(4, max(2, 10 − 2 − 1)) = 4, B = 2, U = 4 → **BASE 1–2 · BUILD 3–6 ·
  SPECIFIC 7–10 · TAPER 11–12**.
- **Deloads**: weeks 4 (BUILD, 2 weeks left in the phase → stays), 8 (SPECIFIC, 2 left → stays), 12 (taper →
  dropped, PHS-002).
- **Key count** (SES-007): TOL L1 (V28 120 < 150) → 1 key session a week, also in BUILD and SPECIFIC. TOL stays
  ≤ 2 for the whole plan (the long run never reaches 100 min), so the count never rises to 2.
- **Paces** (03 §3b): CS = 10 000 / 3127 = 3.20 m/s; threshold (E3) 0.92–0.97 × CS → **5:20–5:40 /km**.

## 3. The day-0 plan (what the first call returns)

At day 0 nothing is logged yet, so every future instance of a module shows its **start dose**, and no level
is projected forward (07 §2b "Projection"; OQ-24).

| Wk | Phase | V | LR | Key session (Tue) | Easy runs | Notes |
|---|---|---|---|---|---|---|
| 1 | BASE | 138 | 46 | strides slot (SES-M-006) on an easy run | Tue 31, Wed 31, Fri 30 | BASE week 1 is not "late", so threshold modules are not yet eligible; VO2 L1 (0.20 × 2/3) wins → strides |
| 2 | BASE | 156 | 50 | threshold 3 × 5 min (SES-M-008, 34 min) | Wed 36, Fri 36 | late BASE: THR L1 (0.30 × 2/4 = 0.15) wins |
| 3 | BUILD | 179 | 55 | 3 × 5 min | Wed 45, Fri 45 | |
| 4 | BUILD deload | 134 | 41 | 3 × 5 min (start dose, SES-016) | Wed 30, Fri 29 | 0.75 × 179; LR 0.75 × 55 |
| 5 | BUILD | 180 | 60 | 3 × 5 min | Wed 43, Fri 43 | LR reaches L_req; V reaches V_req |
| 6 | BUILD | 180 | 60 | 3 × 5 min | Wed 43, Fri 43 | |
| 7 | SPECIFIC | 180 | 60 | 3 × 5 min | Wed 43, Fri 43 | THR 0.15 > VO2 0.13 > MSP 0.03; no race-pace session yet: its prerequisites (THR L1, DUR L1) are not held |
| 8 | SPECIFIC deload | 135 | 45 | 3 × 5 min | Wed 28, Fri 28 | |
| 9 | SPECIFIC | 180 | 60 | 3 × 5 min | Wed 43, Fri 43 | |
| 10 | SPECIFIC | 180 | 60 | 3 × 5 min | Wed 43, Fri 43 | |
| 11 | TAPER k1 | 126 | 42 | sharpener 2 × 5 min E3 inside Tuesday's easy run | Tue 28, Wed 28, Fri 28 | −30 %; 4 runs kept |
| 12 | RACE week | 90 + race | — | — | Tue 30, Wed 30, Fri 30 | −50 %; race Sunday; no long run |

How the numbers come out (seconds in brackets):
- **V** (05 §2): week 1 = 1.15 × 120 = 138; week 2 = min(1.15 × 138, 1.30 × 120 = 156) = 156; week 3 = min(179.4, 179.4)
  rounded down to the minute = 179 (10 740); deloads 0.75 × the last loading week; taper from V_ref 180.
- **Long run** (05 §3): 1.10 × 42 = 46.2 → 46 (2760); 50.6 → 50 (3000); 55 (3300); deload 0.75 × 55 = 41 (2460); week 5
  min(1.10 × 55 = 60.5, L_target 60) = 60. Long-run cap 0.40 × V (4 runs) never binds.
- **Easy runs** (12 §2b.4 `water_fill`): (V − LR − key) shared equally, rounded down to the minute, the leftover
  minute to the earliest days. No easy day is next to the Sunday long run, and none reaches the long run, so no
  cap binds.
- **Key day** (SES-004, `place_in_order`): the long run is a hard day; of Tue, Wed, Fri, Tuesday is furthest
  from Sunday.
- **Strides** (SES-021): 2 easy runs a week, never the day before a key session (Wed and Fri; week 1 Tue and Wed).
- **Strength** (SES-020): 2 × 20 min on the earliest easy or key days, not the day before the long run. Whether
  these 40 minutes count in the week's planned time is open (OQ-09); the volumes above are running only.
- **Hard minutes** (LOD-033): 15 min of E3 ≤ 0.20 × V in every week.

## 4. The plan as published each Monday (the runner logs everything as planned)

Under the `as_planned` behaviour model each session is ticked "done" at its target RPE, so every module steps
up one rung at its next instance (SES-011) and level tests follow SES-012.

| Wk | What changes against the day-0 plan | Rule |
|---|---|---|
| 1–2 | nothing | |
| 3 | threshold **3 × 6 min** (37 min); easy Wed 44, Fri 43 | SES-011: week 2 felt as intended |
| 4 | **literal reading:** the Monday re-plan re-checks the level weeks: THR still 0 → K_key 8, but only 7 weeks that can hold key sessions are left → LEVELS_UNREACHABLE. The long-run demand (60 min) is not yet met (longest logged 55), so no degraded completion exists → **fail closed**, previous plan kept and frozen | FEA-021, FEA-042, FEA-043, 12 §3.12 — **OQ-01** |
| 4 | *alternative reading (K not re-checked at weekly re-plans):* deload, 3 × 5 min | SES-016 |
| 5 | *alt:* 3 × 7 min (40 min); VO2 L1 reached from four weeks of strides twice a week | SES-011, 02 §2 |
| 6 | *alt:* **THR L1 level test** 2 × 8 min (33 min) | SES-012: two instances ≥ 16 min (weeks 3 and 5) |
| 7 | *alt:* 3 × 8 min (43 min); the long run is the **DUR L1 level test** (two logged long runs ≥ 60 min) | SES-011, SES-012 — **OQ-15** |
| 8–12 | not tabulated: depends on OQ-01, and from week 8 the literal reading would re-check K again | |

**Why week 4 matters.** Read literally, every weekly re-plan re-runs FEA-021 with the levels held *today*
against the weeks *left*. A 10K time goal needs THR 2 and VO2 2 (8 key-session weeks each), so after the
third week the window is always too short, although the day-0 verdict was "feasible" with slack 5. The same
happens to plan B in week 6. The oracle believes this is a spec gap, not intended behaviour: see
`SPEC-QUESTIONS.md` OQ-01. Both branches are encoded; the test passes on either and reports which one the
engine took.

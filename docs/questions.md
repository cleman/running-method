# Open questions (after spec v5.2)

Each item has a proposed default; code that relies on it is marked `// SPEC-QUESTION Qn` (CLAUDE.md rule 1). Owner tasks are marked **owner**.

| # | Question | Proposed default (in force) | Who |
|---|---|---|---|
| Q1 | TST-075 and TST-120 golden fixtures (room cases of rounds 1–2) live in v4 and the room files, outside this repository. Restate them or drop them? | Dropped from the v5.2 fixture set; restate if the originals are found | owner / oracle |
| Q2 | 21 persona inputs are restated from one-line descriptions (Ben, TST-084…089, TST-050-P01…P32) with invented values. A second reader should review the `invented` tags before the oracle relies on them | Use as is; review in the Oracle session | oracle |
| Q3 | Which metamorphic list governs: 07 M-1…M-8 or 14 TST-042a–h? M-1 and TST-042e fail across horizon classes (gap/oracle.md §4) | Both, each restricted to one horizon class | oracle / engine |
| Q4 | The `l30_time`/`l30_dist` helpers still omit the claim-based L30_eff and ladder exits that 07 GEN-011 and 05 LOD-070 use (gap/oracle.md C5) | Read them as "max of L30_eff at plan time (all sources) and planned/logged runs in the window", as 05 §3 writes | engine |
| Q5 | INV-04's assertion omits the "total remaining time ≤ parent" and "published window: reductions only" clauses of its prose | The engine checks both clauses; the assertion is widened in v5.3 | engine |
| Q6 | INV-23 compares km/week ranges with a time field and has no defined "tier" | Flag only, as now; define tiers by goal type in R2 | spec |
| Q7 | DST-007 (marathon race-effort long runs) and the other marathon/ultra text-only rules | Formalise with the R2 / R3 releases; 13 §3 says which Ana weeks would change | spec (R2) |
| Q8 | The 32 remaining text-only rules (none MVP) | Formalise per release | spec |
| Q9 | SES-025 (levels from training when tests are off) makes no difference between an experienced runner and a novice who opts out | Same rule for all; review with the coaching panel | coaching panel |
| Q10 | Display of E1 paces from a short field test can look slow (Ana: 8:25–10:50 /km from a 3 km test) | Keep the model; the card always adds "or slower: talk test rules"; review after the pilot | coaching panel |
| Q11 | 13 P3 with the v5.2 rotation gives a marathon **finish** runner race-effort intervals from week 12 once THR L1 is passed | Accepted for now (marathon is R2); revisit with DST-007 | spec (R2) |
| Q12 | Expected race duration for a goal without an anchor uses distance ÷ S_slow, which can be long for slow runners and pulls FUEL L2 into slow 10K plans (expected duration > 90 min) | Kept: fuelling practice only adds an intake target to long runs ≥ 60 min | coaching panel |
| B-1 | PAR-Q+ 2023 licence; fixtures use placeholder items | — | **owner** |
| B-2 | Regulatory reading (EU MDR / FDA general wellness) | — | **owner**, with a professional |
| B-3 | Clinical sign-off of the screening map and safety messages | — | **owner**, with a professional |
| B-5 | Independent oracle and expected outputs | — | Oracle session |

## Engine questions (Engine session, part B)

Found while building `engine/`. Each has the default the engine uses now; the code carries `// SPEC-QUESTION Q-En`. Who decides: **spec** = a v5.3 spec edit; **coaching panel** = a coaching choice; **oracle** = check against the independent oracle.

| # | Question | Default in the engine | Who |
|---|---|---|---|
| Q-E1 | A `null` (not asked) value in a yes/no position of a rule: 12 §3.9 says comparisons with null are false, but not what `null` alone means | Read as false | spec |
| Q-E2 | `deload.every` is marked `none` in parameters.json, so a context override (every 3 weeks) has no stated direction | The shorter cadence wins (MIN), as PHS-005 says | spec |
| Q-E3 | L30_eff from a claim is fractional (0.9 × 95 = 85.5 min) | Rounded down to whole minutes, as 13 §3 does | spec |
| Q-E4 | The session library (06 §2) is a prose table, with no machine form | The engine holds a transcription (engine/src/pipeline/modules.ts); a second reader should check it | spec |
| Q-E5 | The goal race has no module id | `SES-M-026` "Goal race" (not in 06) | spec |
| Q-E6 | 12 says an absent path is an error, but `event` fields exist only for the event in hand (a first plan has no `event.gap_cause`) | `event` and `rule_ctx` read missing fields as null ("not asked") | spec |
| Q-E7 | 13 §3 calls Ana "TOL 3" (cap 120 min), but her 210 min/week is below the TOL 3 threshold and claims are capped at TOL 2 | TOL 2 (cap 90); her L30_eff is 85 either way | spec / oracle |
| Q-E8 | FEA-011 multiplies B_slow by itself, so a stage repeated "until nothing changes" (12 §3.7) never settles | Applied once, before the other feasibility rules | spec |
| Q-E9 | GEN-020 plausibility checks: only the pace bounds can be checked at day 0 | Pace bounds only; the ratio checks wait for the adaptation engine | spec |
| Q-E10 | `state.V28_at_status_start_s` (pregnancy volume cap) is not stored anywhere | Today's V28 | spec |
| Q-E11 | The start ladder (`rtr.start_ladder`) lists running minutes only; walk breaks and time on feet come from 13 §5 | Session patterns taken from 13 §5 | spec |
| Q-E12 | The return-to-run rungs have no run/walk split in machine form | Each session is continuous time on feet at easy effort, run-walk allowed | spec / coaching panel |
| Q-E13 | When does plan week 1 start if today is not a Monday? | The next Monday; the days before are not planned | spec |
| Q-E14 | FEA-023 says levels are not gates in plans of 4 weeks or less, but FEA-021's record has no such guard | Level weeks set to 0 in those plans (and in goal-free plans) | spec |
| Q-E15 | When the needed weekly time is above the runner's time, the dry run never reaches it, so the plan reported "phases do not fit" too | The dry run grows toward the smaller of the two; the shortage is reported only as AVAILABILITY_TIME, so "add N minutes" can be offered alone (13 §7a Ben) | spec |
| Q-E16 | A goal-free base plan has no time cap or effort-share row of its own | It uses the 5K/10K values (150 min, 20 % hard) | spec |
| Q-E17 | SES-020 asks for strength sessions, but INV-11 counts every session of a week as running time | No strength sessions are emitted until the spec says whether they count | spec |
| Q-E18 | INV-16 reads one progression profile for the whole plan, but a plan switches from slow to standard after probation | Each week is checked with its own profile | spec |
| Q-E19 | A claimed longest run has no date | Dated the day before today; it counts for 29 days (13 §3: Ana's claim counts until week 4) | spec |
| Q-E20 | INV-28 and INV-29 (runs over 3 hours) have no goal-race exemption, so a marathon race would be "capped" at 3 hours | The goal race is exempt, as it is from INV-01/02/03 | spec |
| Q-E21 | With no recent run at all (return ladder), the first rung has no 30-day reference, so INV-02 cannot hold for it | The first rung is the reference; later rungs grow at most 10 % | spec |
| Q-E22 | INV-21 forbids sessions on days the runner did not list, but the runner may race on another day | The goal race is exempt from the day check; it still counts as a run | spec |
| Q-E23 | In a field-test week the test is shorter than the easy run it replaces, so the week falls below the baseline hold | The missing time goes to the test's easy cool-down (same caps) | coaching panel |
| Q-E24 | After a break of 8–29 days, from which values do the baseline holds restart? | From the reduced first week back; older runs leave the 30-day window after that week | spec |
| Q-E25 | `t0t3_limit(w)` (INV-27) is defined only abstractly | The runner's time, and the run count × 1.10 × the 30-day maximum at the week's start | spec |
| Q-E26 | Under a restricted gate (efforts ≤ E2 until cleared), at what effort is a time-goal race planned? | At the ceiling (E2) | spec / coaching panel |

### Readings for the oracle (engine and 13 may disagree; not changed in code)

- **Tom, week 1 long run (13 §2):** 13 writes "LR 67 → 73 min". 05 §3 caps the long run at L_target = max(L_req 60, L_hold 67) = 67, so the engine plans 67 and reads 73 as the spike cap.
- **Lea (TST-122):** 13 says "stretch: ambitious". The fixture holds no evidence of threshold level (no engine state, no test log), so FEA-021 counts 8 key weeks against 4 and the engine says infeasible (LEVELS_UNREACHABLE).
- **Karim (TST-127):** 13 lists "shorter distance 5K" among the options. A 5K time goal needs VO2 level 2 (8 key weeks against 6), so the engine finds no passing shorter distance and offers move_date, lower_goal (finish) and the base plan.
- **Rose (TST-128):** 13 says the combined option races "on or after ≈ week 35". The engine's first passing date is 8 Aug 2027 (≈ week 40).
- **Ben (13 §7a):** 13 says "add 60 min a week"; the engine computes 40 min from the restated fixture (V_req − available time, rounded up to 10 min).
- **Maya race week (13 §5):** 13 shows two easy runs of about 20 min. The taper rule (−50 % of 105 min) gives two runs of 26 min.

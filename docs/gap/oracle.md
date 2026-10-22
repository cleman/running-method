# Gap analysis: can the independent oracle be written from the v5 spec alone?

Spec: `council-runs/running-method-20261020/design/v5/` (frozen, read-only). Scope: release blocker B-5, which asks for the oracle (TST-110…112) and the fixture bodies to exist as code, written by someone who has not seen the generator. Sources read: 14, 13, 07 (§2–§6 and the invariant records), 12 (§2, §2b, §6), CONTRACTS, the parts of 03, 04 and 05 the oracle has to recompute, 01 §1, 02 §2/§5, 10 §4b, parameters.md and rules.json (release tags). Nothing has been executed. Every number below was recomputed by hand or with a short Python calculation.

## Summary verdict

**Partly. An oracle session could start on part of the work today, but it cannot finish from the spec alone.**

- **What works now.** The spec is precise enough to write an independent oracle for:
  - **(a) demand**: S_slow, L_req_time, floor_dist, V_req;
  - the **prediction band**: P_race, fast edge, slow edge;
  - the **closed-form weeks-needed count**, the verdict reasons and the phase allocation;
  - deload placement, taper volumes and the long-run/volume curve, all in **time**.

  In my spot checks, every R-05 band value (Tom, Lea, Karim) and every recomputed P3/P5 curve value matched to the second or minute. The B-group invariants are mostly checkable from the output plus the raw inputs.
- **What blocks completion.** Three things:
  1. **There is no serialised output format.** 12 §2 lists entity fields, but there is no schema for the generator result: plan, fail-closed result with ranked options, or gate stop. Several fields that the invariants read are not declared anywhere.
  2. **The persona inputs are incomplete.** Not one persona has every required input field, so the oracle author would have to invent values that change the result: birth month, PAR-Q answers, training age, injury, available minutes, `today`, and how the log is filled in after day 0.
  3. **13's hand values conflict with the spec text in at least five places.** The worst one: P3 Ana's phase outline contradicts the 04 §3 allocation algorithm. Her deload weeks and most of the TST-110…112 fixture values hang on that outline.
- **Inventory.** The spec describes about 105 named cases, plus a 432-case grid, 8 conformance fixtures and 16 metamorphic statements. About **12 can be coded directly** as exact-value fixtures. About 25 more can be coded as property or verdict checks once inputs are invented, and the rest are summaries or point to v4 and the room files.
- **Scope mismatch.** The MVP covers 5K–HM only (12 §6), yet the oracle-agreement gate mostly relies on P3 (marathon) and P5 (100 km) values, which are R2/R3 scope. Only P1, Tom, Karim, Lea, Raj and Mia are MVP-scope.

## 1. Inventory of test cases, personas and fixtures

"Inputs" = are all inputs needed to run the case given? "Expected" = is an exact value given, or only a property?

| ID / case | What it tests | Inputs | Expected | Directly codable? |
|---|---|---|---|---|
| 13 P1 Maya (5K, never ran) | start ladder S1–S9, slack 0, LADDER_RUNWALK 60 ≤ 66, backfill branch | partial: no birth month, no PAR-Q, **no available minutes** (the INP-007 default 3 × 30 = 90 min is below her week-9 V of 105, which would break INV-21) | exact verdict and ladder table; some values "~" or "≈" | yes, once minutes and days are invented |
| 13 P2 Tom day-0 / FT-1 (TST-093) | prediction band, estimated → measured, paces | partial: no days, minutes or weekly distance | exact: 50:58, 47:24, 56:19; 51:21, 50:20, 46:48, 53:51; E3 5:20–5:35 (recomputed ✓) | yes for band and paces; no plan given |
| 13 P3 Ana (M, 18 wk), §3/§6 | demand, weeks needed, full 20-week V/LR table, week-6 card | partial: no claimed L30 **distance**, training age, injury, birth month or `today`; logging after day 0 is implied, never stated | exact table, **but it conflicts with 04 §3** (see §5) | not until the conflicts are settled |
| 13 P4 (58, M 3:35) | expected duration 178.6, SAF-061 | no log values at all | verdict and one number | no |
| 13 P5 (100K, 24 wk), §4 | ultra LR curve, LOD-018 spacing, b2b, tune-up, illness re-plan | summary only (V28 540, L30 210 min / 33 km, levels stated rather than derived); no planned distances | exact LR minutes per week | time curve yes (with a synthetic log); distance no |
| TST-122 Lea | goal-change carry-over, band 47:02–52:26 | partial: L30 160 and V_hold 330 are only implied | exact band and L_hold 132 | band yes; plan no |
| TST-123 Tom 5K→100K over 100 wk | H5 seasons | none | "feasible, 5 seasons of 20 wk" | property only |
| TST-124 Raj | FEA-023, 17.0 ≥ 16.2 km | partial | verdict (16.23 recomputed ✓) | demand check yes |
| TST-125 Mia | AVAILABILITY_DAYS and its option | days and minutes not given | verdict, reason, option kind | no |
| TST-083…089 (p1-B A–G) | ladder, fever, 67-year-old 50K, pregnancy, minors, roster, degraded completion | **not in v5**: "as in v4"; the bodies are in v4/13 and p1-roomB.md | verdicts mostly | no (out-of-spec sources) |
| p1-C Ben | change_availability "+60 min" | not in v5 (d1 rooms) | option text | no |
| TST-127 Karim | FEA-021 K_key 8 > 6 → LEVELS_UNREACHABLE; band | good (45 y, 3 runs, 25 km/wk, 10K 58:00 estimated, 10 wk) | exact band (52:52–1:02:48 ✓); option kinds; move_date "week 12" needs a full dry run | verdict, band, reason: yes |
| TST-128 Rose | combined option is ranked first | partial | reasons exact; date "≈ week 35" | reasons yes; date no |
| TST-095, 103, 104 | input validation (no "I don't know", birth date, age_low) | yes | exact gate or age | yes |
| TST-101 | claims capped by TOL → first LR ≤ 99 min | mostly | exact bound | yes |
| TST-102 | RACE_TOO_SOON, recovery 14 days | mostly | exact date rule | yes |
| TST-105 | FEA-043b at S5 vs S6 (52 < 60; 60 ≤ 60) | yes | exact | yes |
| TST-096–100, 106 | UI prompts, holds, wording | the event flow is unspecified | messages and states | need an event API |
| TST-120 (≈ 14 + 5 cases), TST-075 (≈ 11 cases) | round-1/2 golden fixtures | **not in v5**: 13 §7d says "as in v4", but v4 says "unchanged" from v3 and the rooms | verdicts | no |
| TST-050-P01…P32 (14 §5, says "thirty", lists 32) | edge personas | one-line descriptions | summaries ("likely options", "feasible or stretch") | property-level only |
| TST-051 grid (432) | gates, caps, options | generated | properties | yes, as a property suite |
| TST-060…067 | conformance against published plans | needs the books encoded (UNKNOWN sequences) | report-only | no |
| TST-110…112 value list (14 §10e) | 14 named values | as for P3/P5/Lea/Tom/Karim/Maya | exact | yes, but P3 values depend on the disputed phase outline |
| TST-071/072/073/076/077/078/092 | properties | generated | properties | yes (072 and 073 need an event API) |

**Count.** About 12 cases are directly codable as exact fixtures: Tom's band and paces, Karim, Lea's band, Raj, P1's ladder and LADDER_RUNWALK, P5's time curve, TST-095/101/102/103/104/105. About 25 more become property or verdict checks once inputs are invented. About 45 are not in v5 or are too vague to code: TST-075, 083–089, 120, most of P01–P32, P4, Tom-100 wk, Mia, Ben.

## 2. Plan output format: what an oracle can parse

12 §2 describes `Plan → Season → Phase → Week → Session`, plus `FeasibilityResult`, `RepairOption`, `ValidationReport`, `DeviationLedgerEntry` and `FiredRuleLog`. That is a field list, not a format. Missing pieces:

1. **No result envelope.** Nothing defines the single object the generator returns for each outcome:
   - a plan;
   - a fail-closed result (`FeasibilityResult.options[]`, where each `RepairOption` holds a `validated_plan_id` but the option plans themselves have no place in the result);
   - a gate stop (`pause_until_clearance` / `no_plan` plus a message);
   - a held state (`on_unknown: hold`, TST-096).
2. **No serialisation.** No JSON Schema, no field types for nested objects, no ordering of lists. The only byte-identity rule is GEN-004, which gives no canonical form.
3. **Fields the invariants read but the schema does not declare:**
   - `s.is_hard` (INV-17);
   - `s.hr_zone` and `s.hr_source` (INV-09);
   - `s.is_run` (GEN-001);
   - `s.run_walk` (INV-28; the Session only has `run_walk_ratio`);
   - `plan.race_fuel_g_h` (INV-18; listed only in §2b.2, not in `Plan`).
4. **Week identity.** Week has `iso_week` but no phase type or dates on the week itself (they come through `phase_id`). `load_ordinal` exists, but how ordinals are counted for SHARPEN, RTR and ladder weeks is not stated.
5. **Distance stop vs `planned_distance_m`.** It is unclear whether the "whichever comes first" stop of a time-prescribed run is stored in `planned_distance_m` (INV-01 would then check it) or kept as display text. Floor-bound runs have three numbers (cap, floor km, max min); only `expected_duration_s` has a slot.
6. **Messages in the output.** A Session carries `why_message_id`, but nothing defines how verdict cards, reasons and options carry their message IDs and **typed placeholder values**. An oracle cannot check "48:00 to 57:00 … inside this range" without them.
7. **Reason order.** FEA-036 says "reasons in code order", but no ordering of codes is declared. The 03 §5 list and the messages.md order differ by section.
8. **Race inside V.** Whether the goal race counts in the week's `planned_time_s` (INV-11) is unclear. 13 writes "180 + race" and "≈ 95".
9. **DerivedState is not part of the output.** That is fine for independence, but INV-14/20/28 cannot then be checked from the output.

## 3. The 31 invariants, as seen by an oracle

CLEAR = checkable from the output plus the raw inputs, with a precise threshold. AMBIGUOUS = the definition is unclear, or it contradicts 13. STATE = needs generator-derived state that the oracle must rebuild from a large part of the spec. STATIC = a build lint, not a plan property.

| INV | Kind (07) | Oracle class | Note |
|---|---|---|---|
| 01 | B | AMBIGUOUS | The `l30_dist(d)` helper (12 §2b.3) counts only measured logged runs and planned runs. It omits the claim-based L30_eff (GEN-011) and ladder exits (LOD-070), so Ana's week 1 fails the literal assertion. The distance-stop semantics (§2.5) are also unclear. |
| 02 | B | AMBIGUOUS | Same helper gap. Also, the assertion has **no ladder exemption**, but 10 §4b says ladder steps "are not checked by the spike cap". Maya's week 1 (L30 undefined) and S3 → S4 (23 → 27 min) fail as written. |
| 03 | B | CLEAR* | Precise, but inherits the l30 helper issue. The b2b pair alternative needs `same_pair` in the output. |
| 04 | S | AMBIGUOUS | Needs parent plan + `load_ordinal`. The assertion omits two clauses from the prose: "total remaining time ≤ parent" and "published window: reductions only". |
| 05 | B | CLEAR | Flags are inputs. Clearance dating via `flag.clearance_min_delay_days`. |
| 06 | B | STATE | Needs GateOutcome. Recomputing it needs the PAR-Q item→factor map, which is release blocker B-1 (unsigned). |
| 07 | B | CLEAR | The postpartum "no plan" clause is in the prose only. `V28_at_status_start` can be computed from the log. |
| 08 | S | CLEAR | Actually derivable from the output: taper weeks, runs/week, E3 touches. |
| 09 | B | CLEAR | But `hr_zone` / `hr_source` are not in the schema. |
| 10 | B | STATIC | Lint on rules. |
| 11 | B | CLEAR | The assertion checks time only (the prose says time and distance). Race inclusion is unclear. |
| 12 | S | STATIC | Registry lint. |
| 13 | S | AMBIGUOUS | `preset_cap` is a procedure (LOD-020): it depends on V(w), run count, and the floor/extension exception (0.60). L_hold depends on state. |
| 14 | B | STATE | `denominator_entries` is internal. It can be rebuilt from the log plus GEN-020 thresholds. |
| 15 | S | CLEAR | Anchor confidence and age come from inputs. The pace *values* are not covered by any invariant (and 13's Ana E3 pace is wrong, §5). |
| 16 | S | AMBIGUOUS | `baseline()` at plan start is unclear (claims? V28? 13 uses the claim of 210). The slow → standard switch depends on rich-log state. The 2-week clause of LOD-003 is not in the assertion. |
| 17 | B | AMBIGUOUS | `is_hard` is defined only in SES-004, which is **text_only** (B-4). |
| 18 | B | CLEAR | From the log plus `race_fuel_g_h` (field undeclared). |
| 19 | B | CLEAR | |
| 20 | S | STATE | Competence levels by date (CMP-002/003, exit tests SES-012/013 are text_only). Several thresholds in 02 §2 are ranges ("120–150 min", "20–30 min"). |
| 21 | B | CLEAR | |
| 22 | S | STATE | Needs the GoalEditAttempt audit log, which is not in the output. |
| 23 | S | AMBIGUOUS | `knopp.range` is in **km/week**, the assertion uses `peak_week_time_s`, and "tier" is undefined. Flag only. |
| 24 | B | STATIC | Plus a runtime check if messages are in the output. |
| 25 | S | STATE → oracle (a) | Recompute demand independently (feasible). |
| 26 | S | STATIC | |
| 27 | S | AMBIGUOUS | `t0t3_limit` is a procedure with no closed form ("07 S5"). The V_hold definition ("mean planned-and-logged of last two non-deload weeks") needs an execution history. |
| 28 | B | STATE | Needs TOL level and confidence (02 §2 thresholds are precise for TOL) and the logged median easy speed. |
| 29 | B | CLEAR | From `expected_duration_s` and pair membership. |
| 30 | B | CLEAR | Ladder sessions with a null distance make the literal assertion error out. |
| 31 | B (record) | CLEAR | **Missing from the 07 §5a kind table** (which lists 30 invariants). |

**Totals:** 13 CLEAR (one with an inherited caveat), 8 AMBIGUOUS, 6 STATE, 4 STATIC. 07 §5a also labels INV-08 and INV-15 as S, although an oracle can check both from the output.

## 4. Metamorphic relations

The spec has **two different lists**: M-1…M-8 (07 §5a, run as TST-091) and TST-042a–h (14 §4). They overlap: M-8 = 042a, M-5 ≈ 042c, M-6 ≈ 042f. Nothing says which list is authoritative.

| ID | Transformation → expected relation | Precise? | Problem |
|---|---|---|---|
| M-1 | +weeks to race → no week's V/LR/ramp rises; verdict_rank does not rise | no | Week alignment is undefined (from start? from race?). It can be false across horizon classes: an H1 SHARPEN plan is feasible on current state, but at H2 the phase minimums apply (04 §2–3). |
| M-2 | +minutes or days → V_peak not lower; verdict not worse; no new AVAILABILITY_* | yes | |
| M-3 | higher measured L30_eff / V28 → weeks_needed not longer | mostly | The transformation has to produce a consistent log (V28 and L30 come from entries). It can also flip log_status or profile. |
| M-4 | slower logged easy pace → L_req_time not shorter; LR targets not shorter | no | "Slower pace" is not an input transformation. The spec does not say whether durations scale up or distances scale down; the two give different L30_time. |
| M-5 | add red flag → no added runs; clearing it never removes a gate retroactively | yes / vague | The second half is undefined. |
| M-6 | measured → estimated anchor → B_fast not narrower; no pace added | yes | |
| M-7 | identical inputs → byte-identical; permuting same-day events → same | yes | Byte identity needs a canonical serialisation (§2). |
| M-8 / 042a | mark missed → no later week's time, distance or LR rises | yes | Needs `load_ordinal` alignment (INV-04). |
| 042b | lower claimed L30 / weekly → no planned session increases | no | There is no session alignment. A lower claim can lengthen BASE and move quality sessions, so this is probably false as written. |
| 042c | add active red flag → zero runs until attested clearance | yes | |
| 042d | slower time goal → feasible never becomes infeasible | yes | |
| 042e | later race date → feasible never becomes infeasible (≤ 52 wk) | no | The same horizon-class break as M-1 (Raj's 4-week half is feasible via FEA-023; at 5+ weeks the phase minimums apply). Deload re-placement can also break monotonicity. |
| 042f | measured anchor → same value estimated → every pace target removed | yes | |
| 042g | fewer days → weekly planned time not higher | yes | |
| 042h | any events, then 8 quiet weeks → LR ≤ 1.10 × L30_eff of logged data | mostly | "Logged data" during quiet weeks: are planned runs logged as done? |

## 5. Persona inputs and spec conflicts the oracle author would hit

**Fields required by 01/12 and absent from every 13 persona:**
- birth month and year (only age is given; INP-002 needs the month);
- PAR-Q answers;
- sex, training age, injury in the last 12 months (unknown → "yes", which triggers CTX-003 and deloads every 3 weeks), other-sport background;
- blocked dates, long-run day, available minutes (P1, P2, Karim, Lea, Mia);
- `today` and the race date (only "N weeks" is given);
- a **behaviour model after day 0**. Every plan table assumes the runner logs every session as planned, within 48 h, with pain taps answered. LOD-006, GEN-014 probation and TOL L4 "measured" all depend on this.

P3 also lacks a claimed L30 distance (needed for L30_eff_dist, GEN-011). P5's levels are stated rather than derived from a log.

**Conflicts between 13 and the spec text** (each one blocks "oracle agrees with 13"):

| # | Conflict | My recomputation |
|---|---|---|
| C1 | **P3 phase outline vs 04 §3.** W = 18, T = 3, R = 15, base_needed = 5. Then S = min(`phs.specific_target.M` = 8, max(4, 15 − 5 − 1)) = **8**, B = 5, U = 2. That gives BASE 1–5, BUILD 6–7, SPECIFIC 8–15, not 13's BASE 3–8 / BUILD 9–11 / SPECIFIC 12–15. The deloads would then sit at 5, 9 and 13, not 4, 8 and 12, which moves the fixture values for weeks 4, 9–13. | P5 does match 04 §3 (S = 10, U = 6). |
| C2 | P3 slack: 03 §4 says slack = W − (P0 + base + build + specific + taper) = 18 − 15 = **3**; 13 says 5 ("ONBOARD inside the growth weeks"). | The verdict is "feasible" either way (margin 2), but the value differs. |
| C3 | P3 week-6 E3 pace "5:55–6:10". From 03 §3b: FT-1 3 km 16:30 gives a 10K-equivalent of 59:07, CS pace 5:55, so E3 = CS × 0.92–0.97 = **6:05–6:25**. 5:55 is the CS pace itself. | Tom's 5:20–5:35 is correct. |
| C4 | The INV-02 assertion vs the 10 §4b ladder exemption (§3). | The machine record and the prose disagree. |
| C5 | The `l30_time`/`l30_dist` helpers omit the claim and ladder sources (§3). | Every sparse-log persona fails INV-01/02 under the literal helper. |
| C6 | Ana's L_req: 219.77 → "219" (floor) but 153.84 → "154" (rounded). | Inconsistent rounding; no effect on the result. |
| C7 | 13 says it is "self-contained" (§0) but defers TST-075/083–089/120 to v4. | The sources sit outside the frozen spec. |

## 6. What can be checked before the 27 MVP prose rules are formalised

| Can be built and checked now | Must wait for B-4 |
|---|---|
| S_slow, L_req_time, floor_dist, L_req_dist, V_req time (03 §2; FEA-001…003 are formal) | Required levels for HM when FUEL enters (CMP-008), and therefore K and LEVELS_UNREACHABLE for HM |
| Prediction band, verdict for band reasons (FEA-010/032/033/038) | Which key sessions appear, their dose and progression (CMP-007, SES-006/007/010/011) |
| Closed-form n_L, n_V, G, slack; phase allocation (04 §3); deload placement (PHS-001…006); taper V/LR | E3+ minutes per week, TID shares (LOD-033), the taper E3 touch (INV-08 content, SES-015) |
| Week-by-week V and LR curve in time (05 §3, LOD-003/005/010/013/040/050) | INV-17 hard-day definition (SES-004) |
| Two-day caps, ladder rungs (10 §4b), gap factors (GEN-013), LADDER_RUNWALK | INV-20 prerequisites (exit-test scheduling SES-012/013) |
| Karim's K_key = THR gap 2 × 4 = 8 (needs only the 02 §5 finish/time sets) | Long-run MSP segments for HM/M (DST-006/007), long-run E1 only (DST-005) |
| B invariants 05, 07, 11, 19, 21, 29, 30, 31; INV-15 presence | Fuelling progression and FUEL levels (NUT-010…013): matters for M/ultra (R2/R3) |
| Input validation (TST-095, 103, 104) | Deload/taper session content (SES-016) |

Also: FEA-020 makes the **dry run including the week fill** the authoritative G, and the fill depends on quality counts (SES-006, text_only). Until then the oracle can only bound G: closed form ≤ G, with known exceptions.

DST-001 (family mapping) is text_only but trivial; the oracle can hard-code the table. PHS-013–015 concern H5 and goal changes, which are outside MVP horizons H0–H3.

## 7. Independence risks and how to contain them

| Temptation | Why it breaks independence | Countermeasure |
|---|---|---|
| Reading `rules.json` `action.expr` / `rulexpr` blocks | The generator will likely interpret these same expressions, so any error in them would be shared. | The oracle reads prose formulas (03 §2–4, 04 §3, 05 §2–7, 10 §4b) and parameters.md only. It may use rules.json for IDs and release tags, never expressions. |
| Loading the parameter registry file the generator uses | A registry typo would pass both. | Hand-transcribe the ~60 needed parameters into `oracle/params.py` with a § reference. A separate test diffs them against the registry, and any mismatch is a finding. |
| Re-using validator helpers (`l30_time`, `baseline`, `preset_cap`) | The validator S group is already "a second version"; sharing it makes the oracle a copy. | No imports from validator or generator packages, enforced by an import-lint test. |
| Implementing FEA-020's "dry run of the curve builder" | That is the generator's algorithm. | Do three things: (1) closed-form bounds; (2) a deliberately simple week-by-week simulator written from 05 §3 (time only, no session placement); (3) hand-computed tables. Report disagreements; never tune the oracle to agree. |
| Fitting to 13's hand values | The C1–C3 conflicts would be "fixed" silently. | Every expected value cites a line in 13 or 14. When the oracle disagrees, the case is marked `spec_conflict` with both values and goes to the spec owner, never edited away. |
| `tools/audit_final.py` (run folder) | A third implementation of the same recomputations. | Do not read it before the oracle is written. Afterwards it can serve as a three-way cross-check. |
| Reading CHANGELOG / RESOLUTIONS fix notes | These prime the author toward the generator's choices. | Allowed only for scope; formulas come from the module text. |
| One author writing both the oracle and the persona inputs | Invented inputs drift toward what the oracle handles. | Persona JSON is reviewed by a second person. Every invented field is tagged `"source": "invented"`. |

Build order (12 §6) already puts the oracle before S3–S8, which helps. That order should be enforced by repository access, not just stated.

## What the oracle session needs before starting

1. **An output contract** (JSON Schema) for the generator result. It should cover:
   - the union `{plan | fail_closed | gate_stop | hold}`;
   - per-week dates, phase type, `load_ordinal`, `is_deload` and `taper_k`;
   - per-session long-run, goal-race, pair and hard flags, effort per segment, `expected_duration_s`, and the distance-stop semantics;
   - `FeasibilityResult` with `weeks_needed`, `slack`, an ordered `reasons` list and band numbers in seconds;
   - options carrying their validated plans;
   - message instances as `{id, placeholders}`;
   - one canonical serialisation for byte identity.
2. **An input contract plus complete persona files.** Every 01/12 field, `today`, the race date, full PAR-Q answers, and either a dated log or a declared behaviour model ("every planned session logged as done within 24 h, pain 0"). Plus an event-stream format for the adaptation scenarios (TST-072/073/096–100, illness re-plans).
3. **Owner rulings on C1–C7**, especially C1 (P3 phase outline), C4/C5 (the L30 helper and the ladder exemption) and which of the two metamorphic lists governs. Also a statement that M-1 and 042e are restricted to a single horizon class.
4. **Scope decision.** MVP oracle = P1, Tom, Karim, Lea, Raj, Mia plus generated 5K–HM cases; P3/P5 values to be kept for R2/R3. Or else lift the "agrees with 13" gate onto MVP personas.
5. **Fixture sources pulled into v5.** TST-075, 083–089 and 120 restated with full inputs, or explicitly dropped.
6. **Access rules in writing.** Allowed: modules 00–15, parameters.md, messages.md. Not allowed: generator and validator code, `rules.json` expressions, `audit_final.py`.

## Proposed oracle structure (files, test layers)

```
oracle/
  README.md              provenance: spec sections read, author attestation, ruling log
  params.py              hand-transcribed parameters (with § refs)
  model/
    s_slow.py demand.py      03 §2 (TST-110 a)
    predict.py               03 §3 band, 03 §3b paces
    weeks.py phases.py       03 §4 closed form + 04 §3 allocation + deload placement (TST-111 b)
    curve.py                 05 §3–§7 time curve: V(w), LR(w), deload, taper (TST-112 c)
    ladder.py l30.py         10 §4b rungs; L30_eff window incl. claims, gaps, races
  checks/
    schema.py                parse/validate generator output against the contract
    bounds.py                B invariants recomputed from raw inputs + output
    relations.py             metamorphic relations (one list, with input transformers)
  fixtures/
    personas/*.json          full inputs; each field tagged spec|invented
    expected/*.json          value, tolerance, source line, status (ok|spec_conflict)
  tests/
    L0_params_vs_registry    diff transcription vs registry (findings, not failures)
    L1_hand_values           oracle model vs 13/14 hand values (R-05 list, bands, Karim K_key)
    L2_closed_form_bounds    n_L/n_V/G bounds vs the oracle simulator
    L3_differential          oracle vs generator on personas + seeded random (5K–HM first)
    L4_bounds_property       B invariants on ≥ val.property_cases_min generated plans
    L5_metamorphic           relations of checks/relations.py, single horizon class
    L6_scenarios             TST-095…106, 127, 128 once the event API exists
    L7_import_lint           oracle imports nothing from generator/validator
```

Order of work: L0–L2 can start as soon as items 3 and 4 above are settled. L3–L5 need the output contract (item 1). L6 needs the event format (item 2).

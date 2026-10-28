# spec/schema — the shared contract between generator and oracle (v5.3)

**v5.3:** inputs accept `schema_version` v5.2 or v5.3 (every new field is optional: `profile.injury_last_12w`, `profile.hard_sessions_max`, `profile.prescription_preference`, `anchors[].official_result_confirmed`); results carry v5.3. New: confidence `declared`, level source `race_result`, `engine_state.experienced`, `segment.show_distance_m` / `show_about_m` / `recovery.show_distance_m`, `session.prescription_form`, `week.is_calibration`, `week.long_run_form`, and three state-snapshot fields (`exp_path`, `exp_agegrade_pct`, `exp_calibration_until`).

These JSON Schemas (draft 2020-12) are part of the specification. The generator (engine) reads an **input** and returns a **result**; the oracle and the validator parse the same result. Neither side may add or rename a field without a spec version bump.

| File | What it describes |
|---|---|
| `common.schema.json` | shared types: dates, efforts, reason codes (in canonical order), message instances, segments, Goal, EngineState |
| `input-profile.schema.json` | the generator input: profile, screening, claims, anchors, log, goal, flags, events, declared unknowns, stored EngineState, parent plan |
| `result.schema.json` | the generator result: `plan`, `fail_closed` (options with their validated plans), `gate_stop`, `hold`, `safe_state` |
| `fixture-input.schema.json` | a persona input fixture: the input at day 0, a behaviour model for the weeks after, and the provenance of every value (`spec/fixtures-input/`) |

`spec/tools/check_rules_v5.py` validates every file of `spec/fixtures-input/` against these schemas and checks that every field an invariant reads (07 §5) is declared in `result.schema.json`.

## Conventions (normative; 12 §3.10)

1. **Units.** Durations: integer seconds. Distances: integer metres. Paces: integer s/km. Intakes: integer g/h, mL/h. Dates: ISO local dates in `input.timezone`; weeks start on Monday. Band fractions (`b_fast`, `b_slow`) are the only non-integer numbers in a plan.
2. **Rounding.** Every arithmetic result assigned to a duration or distance is rounded **down** to an integer second or metre at once; caps are additionally rounded down to `load.round_down_s` / `load.round_down_m` where 05 says so. Displayed values are rounded by `messages.md` §0 in the display layer, never in the result.
3. **Blank, unknown, null.** In the input, a field the runner was asked and left blank or answered "I don't know" is `null` **and** listed in `declared_unknown` (it evaluates to *unknown*). A field not asked or not applicable is `null` and not listed (it evaluates to `null`). An absent required field is a schema error, i.e. *error* (E) for the engine: the result is `safe_state`.
4. **Canonical serialisation** (byte identity, GEN-004, TST-080): UTF-8 JSON, object keys sorted by code point, no insignificant whitespace, integers without decimal point or exponent, other numbers in the shortest form that round-trips an IEEE-754 double, `null` written explicitly for every nullable field the schema lists as required. List orders: weeks by `index`; sessions by (`date`, slot order long < key < easy < strides < strength, `id`); reasons by the `reason_code` enum order; options by `rank`; ledger by (`week_index`, `session_id`, `rule_id`, `field`); fired rules in evaluation order; messages in display order.
5. **Plan identity.** `plan.id` = lowercase hex SHA-256 of the canonical serialisation of `{"input": <input>, "registry_version": …, "ruleset_version": …}`.
6. **Goal race in totals.** The goal-race session is listed in its week with `is_goal_race = true`. It counts in `week.runs` (INV-21) but **not** in `week.planned_time_s` (INV-11, v5.2); taper and race-week volumes of 05 §7 are training volumes.
7. **Distance stop.** A time-prescribed run carries its "whichever comes first" distance stop in `planned_distance_m` (INV-01 checks it); a distance-prescribed run carries its time stop in `planned_duration_s`. Ladder sessions have `planned_distance_m = null`.
8. **Load ordinal.** `load_kind` + `load_ordinal` identify a week for INV-04 (`parent_week`). ONBOARD, BASE, BUILD and SPECIFIC weeks that are not deloads are `loading`; ordinals restart at each season.
9. **Messages.** Every runner-facing text is a message instance `{id, placeholders}`; placeholder values are raw engine values with their messages.md type.

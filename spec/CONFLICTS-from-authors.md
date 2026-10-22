# Conflicts reported by module authors (for the architect's consistency pass)

## Author D (08, 11, 14)
1. INV-04 wording forbids ADP-021 (swap a missed hard session into a later easy slot, no added volume) → reword INV-04 to "no added time or distance" or drop ADP-021.
2. ADP-064 vs GEN-003: mid-plan result makes a TIME goal unreachable → ADP-064 keeps the plan, labels "not on track", offers options; GEN-003 would fail closed. Decide.
3. Illness flags clear by attestation (ADP-042), not professional clearance → INV-05 should cover red-flag flags only.
4. Priority uniqueness: 07 reuses 350–352 in different tiers; clarify §12 §3.1.
5. Data model additions: Week.log_state; Session.status=unlogged; AdaptationEvent.kind=unlogged_week; ActivityRecord.{fatigue_flag, stopped_early_reason, short_sleep_or_night_shift, conditions_hot, effort_all_out, fuel_products[]}; RunnerProfile.{nutrition_referral_flag, caffeine_sensitive}; new entities SweatTest, REDsScreenRecord.
6. Red-flag ownership: NUT-033, NUT-043, ADP-040/050/053, ADP-081 are T0 routing rules; module 10 should own the triggers to avoid double firing.
7. INV-18 has literal "GI ≤ 2/10" → reference fuel.gi_pass_max.
8. REDs escalation: NUT-051 freezes progression; module 10 must define escalation to pause_until_clearance (NUT-052 routes there).
9. Module 14 dependencies: conformance fixtures need published plans encoded (Higdon ALLEGED, Hansons/Pfitzinger UNKNOWN); knopp.range owner 14 vs INV-23 in 07.

## Author B (03, 05)
1. **MAJOR — default marathon demand too high.** race.longest_ratio 1.60 + Daniels caps (method_default) → marathon long run must be 26.4 km → ~106 km/week, and anyone slower than ~5:40/km breaks the 150-min cap. Nearly every first-time marathoner is routed to the alternative preset. Proposed per-preset ratios (Daniels 2.0, Hansons 1.65, classic 1.30) — even then Daniels caps need ~84 km/week. Decide the road_classic default preset. → SUB-COUNCIL B (half & marathon) must debate.
2. Hansons' 16-mile long run gives ratio 1.64 > 1.60 → needs preset override.
3. 12 §4: FEA-002 adds a use of logged pace (demand conversion only) → add to "Used for".
4. Ultras: under the 150-min cap a 40 km long run is unreachable → koop_ultra caps must be the ultra default (LOD-020 assumes this). → SUB-COUNCIL C.
5. GEN-010 / INV-25: races count toward L30_eff only up to 1.10 × pre-race value (LOD-012), else a marathon licenses a 46 km "long run".
6. INV-16: "last non-deload week" needs an age limit (LOD-004).
7. Hansons 1.5-week taper doesn't fit 04's whole-week model → proposed 2 weeks with cut profile [0.3, 1.0].
8. 04's TRANSITION "≤ 50%" literal → transition.vol_max_ratio.
9. LOD-032 needs 01 to define a "competitive" perf_level band for polarized opt-in.
10. Ultra time goals capped at "stretch" (FEA-012) → 09/11 confirm.

## Author C (06, 09)
1. INV-25: race exemption only for the GOAL race; tune-up races stay under INV-01/02/03 (DST-012).
2. INV-03 circular ("DUR L5 and b2b enabled" while DUR L5 is earned by b2b) → "DUR L5 prerequisites hold and b2b enabled" (DST-010).
3. INV-13 / 05: tune-up exempt from lr.ultra_time_cap_min (preset convention) but not from spike caps.
4. parameters.md: lr.ultra_* listed for koop_ultra only; DST-008 applies it to every preset for ultras (else 150-min cap makes every ultra infeasible). (Same issue as author B #4.)
5. 02 changes: cmp.required.50K.HAB 4→3; HEAT L2 required whenever race is hot (all distances); dst.msp_share set by 09.
6. 04 ONBOARD exit requires an anchor field test — unsafe below HAB L2 / restricted gate → "anchor OR benchmark test (FT-0) logged".
7. 12 data model: RunnerProfile.hill_access; Goal.family values short/road_classic/ultra; SpecialStatus=pregnant → maintenance (≤E2).
8. quality.per_week counting differs by school (Hansons/FIRST count long run as quality, Daniels not) → quality.counts_long[preset]; 05 TID accounting must align.
9. Ultras: key sessions cut before easy volume under time budget (opposite of default) — placed inside SES-008 (T3.301).
10. Ownership: fuelling/heat doses → 11; feasibility floors & race-to-longest-run → 03.

## Author A (01, 10)
1. Data model missing fields: RunnerProfile.night_shift_days[]; OnboardingClaim.claimed_continuous_30min; derived age_low/age_high; ScreeningItemMap table + ScreeningRecord.followup_answers{}; RiskFlag.subkind, region; DerivedState.prior_tol_tier; ScreeningRecord.guardian_attested_on, guardian_hardcap_optin.
2. ContextModifier has one parameter_id but CTX rules set several → records CTX-001/a, /b sharing a rule ID.
3. PHS-005 (04) lists "high life stress" trigger — no input collects it, no evidence → drop from 04.
4. PAR-Q+ licence + item-to-factor mapping need legal/clinical sign-off (UNKNOWN) → RELEASE BLOCKER.
5. INP-023 is T0 (routes red flags) but uses 01's priority block (061).
6. Energy-availability freeze (SAF-009) = numeric caps under `proceed`, not a 5th outcome; 11 should match.
7. MSG-SAF-003 "Call emergency services now" exceeds the two safety texts in CONTRACTS §1.9 (generic, names no condition) → confirm.
8. Return ladder: only INV-02 applies (no planned distance); 05/07 confirm; GEN-023 should not warn on logged ladder distances.
9. GEN-012 vs ONBOARD (04): novice with no history enters ladder at R1 → count ladder weeks as ONBOARD weeks.
10. Illness: 10 raises flag/stops; 08 owns return gate (illness.*) and hands over to ladder at R0.
11. minor.max_race_km has no hard-cap value at age 14 → SAF-043 uses recommended 8 km.
12. Bone-stress ladder uses rtr.bone_pain_max (0), not pain.during_max.

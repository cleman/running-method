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

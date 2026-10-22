# Gap analysis: what the spec still needs before code

Written 22 Oct 2026, on spec v5 (before the v5.1 fixes). This is read-only analysis: nothing here changes the spec by itself. Three detailed reports, each written separately:

> **Status (22 Oct 2026, spec v5.2):** the gaps below were addressed in v5.2; see `spec/CHANGELOG-v5.2.md` for what was decided and `docs/questions.md` for what is still open.

- [`gap/engine.md`](gap/engine.md): can the **rule engine** be built from module 12 and `rules.json`?
- [`gap/prose-rules.md`](gap/prose-rules.md): the **27 MVP rules** still in prose (blocker B-4).
- [`gap/oracle.md`](gap/oracle.md): can an **independent oracle** be written from the spec alone (blocker B-5)?

## Verdict

**The method can be built. But the spec is not "ready to code" yet: there is more missing than the 27 rules.** None of the gaps needs new research. All of them have a proposed conservative default in the detailed reports. Most are design decisions about how the pieces connect, not about running physiology.

The other Claude instance was right about the 27 rules and the oracle. It underestimated the rest. Four groups of gaps:

### 1. The engine's "glue" is missing (8 blockers, `gap/engine.md` §7)

The expression language is solid: all 708 expressions parse with a plain grammar. What is missing is how rules connect to the pipeline:

- **Binding.** At which step each rule runs, and over what: each week, each session…
- **Conflicts.** What happens when two rules write the same value.
- **Loop.** How evaluation repeats until stable, and its bound.
- **Persistence.** What state survives a re-plan. The spec says "no hidden state" but many rules write state.
- **Blank, unknown and null.** How to tell them apart for optional fields.
- **Repair.** The repair steps (REP-001…006) have no machine records.
- **Four small spec bugs.**
- **Parameters.** The registry is not machine-readable.

### 2. The weekly session choice is not orchestrated (`gap/prose-rules.md` §4)

Module 07 gives step S7, "choose and place the hard sessions", one line. The 27 rules need an order:

1. count the hard sessions;
2. set the long run;
3. choose the abilities to train;
4. place them in the week;
5. set the doses;
6. fill with easy running;
7. add strides and strength;
8. render the plan.

The report proposes this order. On top of it, **session doses are prose** ("3×5 min → 5×8 min"), level tests cannot be judged from what the run log records, and some MVP tags are wrong in both directions: 3 tagged rules are not reachable in the MVP, and about 9 reachable ones are not tagged.

The 27 rules: 8 easy, 16 medium, 3 hard. The hard ones:

- which ability each hard session trains;
- how a session grows from week to week;
- when a level test is scheduled and how it is judged.

### 3. Engine and oracle have no shared contract (`gap/oracle.md`)

- **No output format.** There is no schema for the generator's result: a plan, a fail-closed result with options, a screening stop.
- **Incomplete persona inputs.** No persona has every required field: birth month, screening answers, training age, injury, available minutes, the date. Defaults change the result. For example, Maya's default 90 min/week breaks an invariant in her week 9.
- **No MVP worked plan.** No worked example shows key sessions for a 5K, 10K or half marathon. The only full worked plan is a marathon (Ana), which is outside the MVP.

### 4. Worked examples contradict the spec in places

Ana's phase outline does not follow the 04 §3 algorithm, which moves her lighter weeks. Her slack and one pace range are also off. Some invariants miss exemptions. *v5.1 fixed the clear ones: Ana's threshold pace, the ladder exemption, and INV-31. Ana's phase outline and the slack conflict between 03 and 04 are left to v5.2. See `spec/CHANGELOG-v5.1.md`.*

## What this changes in the plan

The first build step (`handoff/1-engine-part-A.md`) becomes **"complete the spec" (v5.2)**, not only "write the 27 rules". Both the engine and the oracle need these things fixed before they start:

1. The output format (a JSON schema) and the complete persona inputs. This is the shared contract.
2. The 8 engine-glue decisions, written into module 12 and 07.
3. The S7 order, the session dose tables, and the 27 rules.
4. The MVP tags corrected.

The owner validates only the decisions that change what a runner gets. Those are listed in plain words at the end of `gap/prose-rules.md` (9 questions). The engine-glue decisions are technical: the session takes the recommended defaults and records them.

**Hand-computed MVP plans (a 10K and a half marathon, week by week) are written by the Oracle session, not the Engine session.** That keeps them independent.

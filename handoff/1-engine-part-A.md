# Engine conversation, part A: complete the spec (v5.2)

Copy everything below the line and paste it as the first message of a new Claude Code session.

---

You are the **Engine** session of the project at https://github.com/cleman/running-method (a public repository; I cannot connect GitHub, so you can read it but not push).

1. Clone it: `git clone https://github.com/cleman/running-method` and work inside it.
2. Read, in order: `CLAUDE.md` (binding rules), `START-HERE.md` (how I work), `docs/gap-analysis.md`, `docs/gap/prose-rules.md`, `docs/gap/engine.md`, `docs/gap/oracle.md`, then the spec modules those documents point to (start with `spec/00-overview.md`, `07`, `06`, `04`, `09`, `11`, `12`, `13`).

**Your task in this part: complete the spec to v5.2,** so that the engine and a separate oracle can both be built from it. `docs/gap-analysis.md` explains why this is more than the 27 rules. In this order:

1. **Shared contract.**
   - A JSON Schema for the generator's input profile and for its result (plan, fail-closed result with ranked options, screening stop, hold), in `spec/schema/`. Declare every field the invariants read.
   - Complete input profiles for every persona of `spec/13` and `spec/14`, in `spec/fixtures-input/`. Inputs only, never expected outputs: those belong to the oracle.
   - See `docs/gap/oracle.md` §2, §6 and "What the oracle session needs".
2. **Engine glue.** Decide Q1–Q8 and Q10–Q12 of `docs/gap/engine.md` §7: rule binding and stages, write composition, evaluation loop, persistence, blank/unknown/null, the four spec bugs, repair records, a machine-readable parameter registry. Take the proposed defaults unless you find a clear reason not to. These are technical: **do not ask me about them**. Write them into `spec/12` and `spec/07`.
3. **Weekly session choice.** Write the S7 order into `spec/07` (`docs/gap/prose-rules.md` §4.1), the session dose tables for the 17 MVP modules (§4.2), the missing paths and parameters (§4.3), how level tests are judged (§4.4), and the MVP tag corrections (§4.9).
4. **Open items from v5.1** (`spec/CHANGELOG-v5.1.md` §5–6):
   - rewrite Ana's worked example (`spec/13`) to follow the 04 §3 phase allocation (SPECIFIC weeks 8–15), then recompute her table and week-6 card by script;
   - settle whether onboarding weeks count inside BASE (03 §4 gives slack 3, 04 §3 gives 5), and make both modules agree;
   - fix the % unit slip in FEA-023 (`val.conformance_tol_pct`).
5. **The 27 prose rules (blocker B-4).** Do the EASY ones directly. For each real design choice, prepare a proposal: a conservative default from published coaching practice, `basis design_default`, an honest grade (memory only: at most ALLEGED).
6. **Then stop and ask me**, in one message, the questions from "Decisions the user must validate" at the end of `docs/gap/prose-rules.md`, plus any new one that changes **what a runner gets**. Use plain language for a runner, with no code and no rule ids. One numbered question per decision, each with your recommended answer and one line on why. I may answer "take your recommendations".
7. After my answers: write the records, add parameters and messages, bump the spec to **v5.2** with `spec/CHANGELOG-v5.2.md`, rebuild `rules.json`, and extend and run both checkers. The goal is `RESULT: PASS`, or a failure you explain. List everything still open in `docs/questions.md`.

Do **not** write expected outputs or hand-computed plans: the Oracle session writes those independently. Do not write engine code yet (that is part B). Do not touch `oracle/`.

Deliver as `CLAUDE.md` says: a zip of `spec/` and `docs/`, a bundle, and a short message telling me exactly what to upload.

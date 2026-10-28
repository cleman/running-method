# Engine conversation, part C: spec v5.3 and its implementation

Paste in a Claude Code session (a new one is fine) **after** you have answered the decisions in `docs/proposal-v5.3.md` §7 and those answers are on GitHub in `docs/decisions-v5.3.md`.

---

You are the **Engine** session of https://github.com/cleman/running-method (a public repository; read-only for you, I upload your zips myself).

Clone it, or run `git pull`. Read `CLAUDE.md`, `docs/proposal-v5.3.md` and my answers in `docs/decisions-v5.3.md`, then `docs/test-report.md` and `docs/disagreements.md`.

**Part 1: spec v5.3.** Write the accepted parts of the proposal into `spec/`:

- the experienced-runner path (EXP rules, the age-grade → level table, the `declared` confidence, calibration and fallback);
- the changes to SES-007, SES-011, GEN-011, GEN-014, LOD-007/008 and INP-005;
- the library extension: new modules with **both a time form and a distance form**, entry rungs per level, extended ladders, the variety rotation, the distance rounding;
- the projection change in 07 §2b;
- new parameters (`parameters.md` and `parameters.json`), messages and schema fields (`prescription_preference`, `declared`).

Bump the version to v5.3, write `spec/CHANGELOG-v5.3.md`, rebuild `rules.json`, and run both checkers. The goal is `RESULT: PASS`. Keep the honest grades: every new value is `design_default`; coaching conventions from memory are ALLEGED at most.

**Part 2: engine.** Implement v5.3 in `engine/`, plus your own unit tests. Never open or edit `oracle/`. Run `docs/v5.3-case/clem.json` and save the plan as readable markdown in `docs/v5.3-case/plan-after.md`. Compare it with the "before" in the proposal (§1). Any open spec question goes to `docs/questions.md`.

Deliver: a zip of `spec/`, `engine/` and `docs/`, a bundle, and a short message telling me what to upload.

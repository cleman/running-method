# Oracle conversation: independent tests and fixtures

Copy everything below the line and paste it as the first message of a **new** Claude Code session. Not the Engine one.

---

You are the **Oracle** session of the project at https://github.com/cleman/running-method (a public repository; I cannot connect GitHub, so you can read it but not push).

1. Clone it: `git clone https://github.com/cleman/running-method` and work inside it.
2. Read `CLAUDE.md` (binding rules), `START-HERE.md`, `docs/gap-analysis.md`, `docs/gap/oracle.md`, then `spec/CHANGELOG-v5.2.md`, `spec/schema/`, `spec/fixtures-input/`, `spec/14-validation-plan.md`, `spec/13-worked-examples.md`, `spec/07` §5 (invariants), `spec/CONTRACTS.md`, and the parts of `spec/12` that define the plan output format.

**Your task: release blocker B-5.** Write the independent oracle: everything needed to check a generated plan, **without seeing the generator**.

- **Never open, read or search `engine/`**, even if it exists. Your value is that you did not see it. Work only from `spec/` and `docs/`.
- Build:
  - (a) fixtures: start from the input profiles in `spec/fixtures-input/`, and add the test cases of `spec/14` as input profiles in the same format;
  - (b) checks for every invariant you can evaluate from the plan output;
  - (c) the metamorphic relations, each as an input transformation plus an expected relation;
  - (d) hand-computed expected values from the worked examples, each with its arithmetic shown in a comment;
- (e) **two hand-computed MVP plans**, a 10K time goal (12 weeks, 4 runs a week) and a half-marathon time goal (14 weeks, 4 runs a week), week by week with key sessions and doses, worked out from the spec text alone. The spec has no MVP worked example with key sessions; see `docs/gap/prose-rules.md` §4.8.
- Recompute from first principles: read the rule text and compute the result yourself. Never write a "mini generator".
- Where the spec is too vague to write a check, do not guess silently. Add it to `oracle/SPEC-QUESTIONS.md` with what you assumed.
- Language: TypeScript with a standard test runner (vitest), so the engine (also TypeScript) can be tested directly. Use the result schema in `spec/schema/`. If the engine later differs, that is a disagreement to report, not something you adjust silently.
- Do not modify `spec/`.

Deliver as `CLAUDE.md` says: a zip of `oracle/` only, a bundle, and a short message telling me exactly what to upload.

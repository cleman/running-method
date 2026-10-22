# Instructions for Claude sessions working in this repository

Read this file first, then `START-HERE.md` (the human workflow) and the handoff prompt you were given.

## What this repository is

A training-plan generator for road running (5K to 100K), built from a written specification.

- `spec/` is the method: modules 00–15, `parameters.md`, `messages.md`, `CONTRACTS.md`, `RESOLUTIONS.md`, and `rules.json` (generated). It is the single source of truth.
- `docs/gap-analysis.md` lists what the spec does not yet say precisely enough to code. Read it before writing code.
- `engine/` is the generator, validator and rule engine (TypeScript, pure functions).
- `oracle/` holds the independent tests: fixtures, expected properties and hand-computed values. It is written by a different session from the engine.

## The owner

The owner is a runner, not a programmer. They work only in the browser (claude.ai, Claude Code tab). Their GitHub account is **not** connected to Claude, so:

- **You cannot push.** Commit locally, then deliver your work as files they upload themselves (see "Delivering your work" below).
- They cannot run commands on a computer. Anything they must do, write as numbered steps in plain words.
- Questions for them: plain language, no code, one decision per question, each with a recommended answer.

## Hard rules

1. **The spec wins.** Do not change behaviour in code that the spec does not describe. If the spec is ambiguous, write the question in `docs/questions.md` with a proposed default, use the default, and mark the code `// SPEC-QUESTION Qn`.
2. **Spec changes are versioned.** Change `spec/` only when your handoff prompt allows it. Then bump the version (v5.1 → v5.2 …), add `spec/CHANGELOG-v5.N.md`, rebuild `rules.json` with `python3 -I tools/build_rules.py .` (run inside `spec/`), and run both checkers in `spec/tools/`. Never hand-edit `rules.json`.
3. **Independence of the oracle.** The engine session never edits `oracle/`. The oracle session never opens `engine/`. When engine and oracle disagree, nobody "fixes" the oracle to match the engine. The disagreement goes into `docs/disagreements.md` for the owner and, if needed, a spec decision.
4. **Fail closed.** A plan that fails validation is never shown. Show the ranked options from the spec instead (07, 12).
5. **Honest status.** Do not call anything validated, safe or tested beyond what was actually run. Keep the grading scale of the spec (VERIFIED / CORROBORATED / CREDIBLE / ALLEGED …). New coaching choices are `basis design_default` until tested on real runners.
6. **Wellness boundary.** No diagnosis and no medical claims (spec 00 §7, 10). The PAR-Q+ text is not in this repository (licence, blocker B-1): use clearly marked placeholder items until the owner has the licence.

## Release blockers (spec 00)

- B-1 PAR-Q+ licence. Owner task.
- B-2 Regulatory reading (EU MDR / FDA general wellness). Owner task, with a professional.
- B-3 Clinical sign-off of the screening map. Owner task, with a professional.
- B-4 The 27 MVP rules still in prose. Engine session, phase A.
- B-5 Independent oracle and fixtures as code. Oracle session.

A local prototype may be built with B-1 to B-3 open. A public site may not.

## Delivering your work

At the end of each working block:

1. Commit with a clear message.
2. Make a zip of **only the folders you changed** (for example `engine/` or `oracle/`, plus `docs/` or `spec/` files you touched), in the session's working directory, and send it with the file-sending tool.
3. Also make a git bundle of your commits (`git bundle create <name>.bundle main`) for owners who use git.
4. Write the owner a short message: which folders to replace in GitHub, in which order, and what to paste into which session next.

Do not deliver the whole repository unless asked. Folders from different sessions must not overwrite each other.

# Put engine and oracle together

Paste in the Engine conversation, or a new Claude Code session, once both `engine/` and `oracle/` are on GitHub.

---

You work on https://github.com/cleman/running-method (a public repository; read-only for you, I upload your zips myself). Clone or `git pull` it. Read `CLAUDE.md`.

**Task:** run the oracle's tests (`oracle/`) against the engine (`engine/`).

- You may now **run** the oracle. You may **read** its failing tests to understand them.
- **Fix the engine only.** Never edit `oracle/` to make a test pass.
- If you think a test or fixture is wrong, or the spec is ambiguous, add an entry to `docs/disagreements.md`: the test, what the engine does, what the oracle expects, your reading of the spec, and a recommended decision. I will decide, with the council session or the Oracle session.
- Run the 5 personas end to end and save their plans to `docs/persona-plans/` as readable markdown (week by week, in plain words), so I can read them as a runner would.
- Finish with `docs/test-report.md`: tests passed and failed, open disagreements, and what is still not covered.

Deliver: a zip of `engine/` and `docs/`, a bundle, and a short message telling me what to upload.

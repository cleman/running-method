# Engine conversation, part B: build the generator

Paste the text below the line in the Engine conversation. If that conversation has expired, paste it into a new Claude Code session: it works on its own.

---

You are the **Engine** session of https://github.com/cleman/running-method (a public repository; read-only for you, I upload your zips myself).

If you don't have it yet: `git clone https://github.com/cleman/running-method`. Otherwise run `git pull` to get spec v5.2. Read `CLAUDE.md`, `docs/gap-analysis.md` and `docs/gap/engine.md` again.

**Your task: build the engine in `engine/`**, as a TypeScript library of pure functions with no network, no database and no UI. It must run in Node and in a browser.

1. **Rule engine.** Load `spec/rules.json`. Implement the expression subset with four-valued logic (true / false / error / unknown), `on_unknown`, the action ops of `spec/12` §3.3, the helpers and procedures of §2b, and tier ordering. Every ambiguity: `docs/questions.md` with a default, plus a `SPEC-QUESTION` comment.
2. **Generator.** Follow `spec/07`: generate → validate → repair → fail closed with ranked options.
3. **Validator.** Implement the invariants of `spec/07` §5 **inside the engine**. This is the engine's own check. It is separate from the oracle, and both must exist.
4. **Scope.** MVP first: 5K, 10K and half marathon, default preset. Marathon and ultra rules may load but need not pass yet.
5. **Your own tests.** Unit tests for the rule engine and the worked examples of `spec/13`. **Never open, edit or copy anything from `oracle/`.**

Output for one generated plan: a JSON document matching `spec/12` (plan, weeks, sessions, messages, reasons) or a fail-closed result. Add a small command-line script, `engine/cli.ts profile.json > plan.json`.

Deliver as `CLAUDE.md` says: a zip of `engine/` and any `docs/` you changed, a bundle, and a short message telling me what to upload.

# Oracle conversation: v5.3 advanced personas and plan-quality checks

Paste in a **new** Claude Code session, never the Engine one, once spec v5.3 is on GitHub. You can run it at the same time as part 2 of the Engine prompt.

---

You are the **Oracle** session of https://github.com/cleman/running-method (a public repository; read-only for you, I upload your zips myself).

Clone it or `git pull`. Read `CLAUDE.md`, `docs/proposal-v5.3.md` §6, `docs/decisions-v5.3.md` and `spec/CHANGELOG-v5.3.md`. **Never open, read or search `engine/`.**

Task:

1. **Five advanced personas.** Add them as complete input fixtures: the owner's case (`docs/v5.3-case/clem.json`), a 3:00 marathoner, a 19:00 5K runner on 5 runs a week, a 55-year-old at 70% age-grade, and an "inconsistent claims" runner who must stay on the cautious path.
2. **Coach-quality checks.** Write the checks of proposal §6 as oracle properties for every plan on the experienced path, plus the distance/time rendering checks: rounding to track-friendly distances, time stays the controlling quantity, effort-only runners always get time.
3. **Hand-computed plan for the owner's case.** Work out weeks 1–6 and one BUILD week from the spec text alone, with the arithmetic shown: levels, key-session count, modules, doses in both forms, long run, volume.
4. Update `oracle/SPEC-QUESTIONS.md` where v5.3 is too vague to check.

Deliver: a zip of `oracle/` only, a bundle, and a short message telling me what to upload.

# web/ — prototype page for trusted testers

## In plain words

`index.html` is one self-contained page. Open it in a browser (on a phone too) and it works with no internet:
the plan generator from `engine/` runs inside the page. There is no server and no account. Answers, the run log
and plans are stored only in that browser (`localStorage`); "Your data" → "Erase all my answers" deletes them.
The page loads nothing from the network, and the standalone file forbids network access in its own security
policy.

**This is a prototype, not a public site.** Release blockers B-1 (PAR-Q+ licence), B-2 (regulatory reading) and
B-3 (clinical sign-off) are open. The PAR-Q+ items are shown as clearly marked placeholders. A banner on every
screen says: "Prototype, not medical advice, not validated on runners".

## Screens

1. **Profile**: birth month and year, experience, injury, pregnancy and birth, the 7 placeholder PAR-Q+ items
   (same ids and test factors as the spec fixtures), and the "right now" safety questions of spec 10 §1.
2. **Goal**: current running (claims), an optional recent result, the goal, and the runner's week.
3. **Plan**: the verdict and its reasons (messages.md §1–§2), then the plan week by week. Each session has a
   "Why this session?" with its `why` message, its extra messages and its evidence grade. A goal that does not
   fit shows the spec's **ranked options** (FEA-040/041), each one already checked by the engine; nothing changes
   until the runner chooses one. A safety stop shows the generic safety text and the clearance confirmation.
4. **Log**: "Done as planned / Done, different / Not done" for recent sessions, "Add a run", RPE 0–10, the pain
   tap, the next-morning pain question, the level-test questions, and "Something felt wrong". Pain above 0 or
   "Something felt wrong" asks the safety questions before saving (INP-023).
5. **Re-plan**: re-builds the plan from a Monday with the log so far, chained through `engine_state` and the
   parent plan, and lists the sessions that changed.

"Your data" also has a coach view (rule ids, reason codes, raw result), a tester mode (pretend today is another
date, to try later weeks), and "Copy test report" (the tester sends it to the owner themselves).

## How it was checked (28 October 2026, this session)

- `node check.mjs`: answers → generator input → real engine → text, for 20 situations (10K finish, beginner 5K,
  every "I don't know", a goal that does not fit with each option applied, a time goal with a result, symptom,
  minor, placeholder items, pregnancy, 50K, base plan, weekly re-plans, a symptom check from the log). 2 589 / 2 589
  checks pass: no crash, every message id exists in messages.md, no text keeps a `{placeholder}`.
- A browser run (Chromium, phone size 390 × 844, light and dark): profile → goal → plan → log a week → re-plan →
  missed sessions → safety stop → same-day clearance refused → next-day clearance → fail-closed options →
  choose an option → erase. No page error, no network request, no sideways scrolling; storage empty after erase.
- Not checked: real phones, screen readers, other browsers, and anything with real runners.

## Choices made in the page (not in the spec; open to change)

- **Plans start on a Monday** (the next one, or today if it is Monday). The engine fails closed for other start
  days, and its tests use Monday starts and Monday re-plans.
- **The profile is dated at the plan start** (`profile.created_at`), because of engine issue E1 below.
- **Flags are kept by the page.** The engine does not return the flags it raises, so the page keeps a symptom
  check "open" until the runner confirms clearance (MSG-SAF-011, or MSG-SAF-012 for fever or illness alone) on a
  later day (`flag.clearance_min_delay_days`). Onboarding symptom answers are then asked again.
- **"Not done"** is stored by the page only: missed-session events (08) are not built in the engine, so a
  missed run counts only through the smaller log.
- B5 (pain region) and P1–P2 (pregnancy mode) are not asked: any B answer already pauses, and pregnancy mode is
  not built (the plan stays paused, fail safe).
- Option texts with placeholders the engine does not fill (for example the reason of a later date) use plain
  fallbacks; a reason whose numbers are missing shows its "why" sentence instead.
- A plan that failed its own checks (fail closed, no reasons, validation failed) shows the ENGINE_NONCONVERGENT
  text, as proposed in disagreement D11.

## Engine issues found while building this (for the engine session; nothing in engine/ was changed)

- **E1. Profile created before day 0.** With `profile.created_at` a day or more before the first plan Monday and
  no log, the week in between counts as a logged empty week: the plan fails INV-27 and INV-16, so no plan.
  Example: `check.mjs`, "(info) profile created the day before day 0". Worked around in the page.
- **E2. Week-2 re-plan after a gap-reduced week 1.** A runner who answers "last run: this week" on a Wednesday
  has a gap of 8 days by the Monday start; week 1 is reduced, and the week-2 re-plan, logged exactly as planned,
  fails INV-04 (fail closed, no options). Any runner back from a short break hits it.
- **E3. Re-plan after missed sessions.** With two of three sessions not done in week 2, the week-3 re-plan fails
  INV-27/INV-16 (or returns infeasible with no options). This is the "adaptation not built" gap of
  `docs/test-report.md`, now with a concrete case (`check.mjs`, "re-plan: week 3 after two sessions not done").
- **E4. Slow option search.** A goal that does not fit can take up to 16 s on a computer (tst087, tst050-p03),
  likely several times that on a phone. The page runs the engine in a background worker and says so.

So for now the prototype is useful for **day-0 plans, fail-closed options, safety stops, and re-plans of a runner
who does what was planned**. Testers who miss sessions will often see "We could not build a plan we are sure is
safe" instead of a new plan; that is the engine failing safe, not a page error.

## Rebuild after a change to engine/ or spec/

```
cd web
npm install
node build.mjs
node check.mjs
```

`build.mjs` bundles `engine/src`, `spec/rules.json`, `spec/parameters.json`, the texts of `spec/messages.md`
and the module names of `spec/06-session-library.md` into `index.html`. With `--fragment <file>` it also writes
the page without the `<html>`/`<head>` wrapper, for hosts that add their own (the claude.ai artifact).

| File | What |
|---|---|
| `index.html` | the built page (open this) |
| `src/app.js` | screens and events |
| `src/input.js` | answers → generator input (pure) |
| `src/text.js` | messages.md texts and display rounding (pure) |
| `src/dates.js` | calendar dates |
| `src/catalogue.mjs` | build-time parsing of messages.md and 06 |
| `src/engine-worker.ts` | the engine as loaded in the page |
| `src/style.css`, `src/body.html` | look and page frame |
| `build.mjs`, `check.mjs` | build and checks |

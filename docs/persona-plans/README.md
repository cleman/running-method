# Persona plans, week by week

Each file is the plan the engine published, one week at a time, for one persona of the spec (13 §1). The runner is
simulated with the oracle's "as planned" model: every Monday the app re-plans with everything logged so far, and the
runner then does every session exactly as planned (target effort, no pain, every level test passed). So these are
the **best case**: real runners miss sessions, feel pain or get ill, and the engine's reactions to those events
(chapter 08) are not exercised here.

| Persona | Goal | Result | Weeks |
|---|---|---|---|
| [P1 Maya](p1-maya-5k.md) | First 5K, from zero, 3 days a week | 9 weeks of walk–run steps (S1 → S9), then race week | 10 |
| [P2 Tom](p2-tom-10k.md) | 10K in 48 min | Plan to race day; time trial in week 2, threshold and durability tests | 12 |
| [P3 Ana](p3-ana-marathon.md) | First marathon, finish | Plan to race day; long run grows to 3 h; fuelling practice | 18 |
| [P4](p4-masters-marathon.md) | Marathon in 3 h 35, age 58, 5 days | Plan to race day; 6 level tests | 16 |
| [P5](p5-ultra-100k.md) | 100 km, finish | **No plan:** ultras are release R3 and not built; the engine fails closed | — |

Things to look at with a runner's eye (also in `../test-report.md`):

- From about 4–6 weeks before the race, every outlook says "possible but tight", though nothing went wrong
  (`../disagreements.md`, D13).
- Tom's key sessions can last 67 min: the weekly minutes his easy days cannot hold go into the cool-down of the key
  session (Q-E23). Reading "time trial, 67 min" is odd for a runner.
- P4 already runs 3-hour long runs but gets durability "level 1", then 2, 3 and 4 tests in successive long runs. In
  v5.2, durability is only proven by a test (06 §3).

Generated with `docs/scripts/persona-plans.ts` (run from `oracle/`, see the first line of the script). This is test
output, not advice, and not validated on real runners.

# Owner decisions on proposal v5.3

*28 Oct 2026. Answers to `docs/proposal-v5.3.md` §7. Where an answer differs from the proposal, **this file wins**.*

| # | Question | Decision |
|---|---|---|
| 1 | A recent race result sets the starting level | **Yes**, as proposed (all-out, last 12 weeks, confirmed by the runner) |
| 2 | A race entered after the fact still gives paces | **Yes**, with wider pace ranges until confirmed |
| 3 | 3 calibration weeks with fallback to the cautious path | **Yes** |
| 4 | Hard sessions per week (experienced path) | **Changed: 3 by default** when the requirements hold, otherwise 2. See below |
| 5 | Distance or time | **Yes**: distance by default when paces are known, a setting for time or both, time only when there are no paces |
| 6 | The eight hard-session families with rotation | **Yes** |
| 7 | Show the planned progression in advance | **Yes** |
| 8 | History import from watch or Strava files | **No. Manual entry only stays** (21 Oct decision confirmed). The owner cannot export files and could not test it. The experienced path must work from manual entry alone: declared history, race result, calibration weeks. |
| 9 | Coach review of 3–4 plans before other testers | **Yes**. The owner finds the coach |

## Decision 4 in detail: three hard sessions by default

**Rule.** On the experienced path, in BUILD and SPECIFIC non-deload weeks, the plan proposes **3 hard sessions automatically** when **all** of these hold:

- at least **6 runs a week** planned, **the long run included** in the 6;
- TOL ≥ 3 (declared on the experienced path, or logged);
- the three sessions fit the weekly hard-time budget (LOD-033; for the 10K, 20% of weekly time at E3–E4);
- the runner's limit (below) allows 3.

Otherwise the plan gives **2**, or fewer as v5.2 requires. Calibration weeks keep 2 (one threshold, one VO2): the third session starts after calibration passes.

**Runner setting: "Hard sessions per week, at most".** Asked at onboarding and changeable later. The choices are **3 (recommended)**, 2 or 1. The default is 3. It is a ceiling: the plan never gives more than the requirements allow.

**How three fit in a week (needed for the spacing rule SES-004).** With the long run on Sunday and no two hard days in a row, a week has only two free hard days (Tuesday and Thursday) if the long run counts as a hard day. So v5.3 defines the three hard sessions as either:

- **(a) 3 workouts + an all-easy long run.** On the experienced path, a long run that is entirely easy (E1) does **not** count as a hard day for spacing. Example: Tue, Thu, Sat workouts and Sun easy long run.
- **(b) 2 workouts + a long run with quality** (a fast finish, a steady or race-pace segment). The quality long run counts as the third hard session and as a hard day.

The weekly session choice alternates (a) and (b) according to the phase. SPECIFIC uses (b) more often for a time goal, because race-pace work in the long run is specific. Back-to-back hard days remain forbidden.

*Grade: design default (ALLEGED). Three quality sessions a week is common in published plans for experienced runners (e.g. Hansons, FIRST, Pfitzinger 2–3; from memory). The coach review (decision 9) should look at this first.*

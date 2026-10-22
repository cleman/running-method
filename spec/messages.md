# messages.md — the single message catalogue (v5.1)

Serves criteria 12 (understandable) and 11 (implementation-ready); p1-C R1, R3, R7, R9, R14. This file **governs** over any message text quoted in a module.

**Placeholders.** `{name:type}`, with type ∈ {min, km, pace, time, date, int, text}. Every value is rounded by §0 before display.

**Layers** (07 §9): `card` (always visible) · `why` (one tap) · `coach` (opt-in). Rule IDs, reason codes and parameter names appear only on the `coach` layer.

**Safety.** Rows marked **S** have `is_safety_generic = true`. They name no condition and give no score or prediction (00 §6, INV-24). Text in parentheses starting with "v5" in the Why column is an editor's note, not shown to runners. Rows marked **A** are shown because of a personal attribute (age, injury history, sport background, pregnancy, health condition); lint L5 applies to them.

**v5 completeness.** Every message id used by any rule, action or explanation in `rules.json` is defined here (TST-094; `design/v5/tools/check_rules_v5.py` and `check_messages_v5.py`). Module copies of message texts (03 §8, 06 §6, 10 §5, 11 §8) are **non-normative**.

## 0. Display rounding (`display.*`, parameters §13)

| Quantity | Rule | Example |
|---|---|---|
| Duration ≤ 60 min | nearest 5 min, rounded down for targets | 34 → "35 min" (cap stays 34 internally; the card shows "about 35 min") |
| Duration > 60 min | nearest 10 min, rounded down; hours shown above 90 min | 189 → "about 3 h 10" |
| Distance | 0.5 km (≥ 20 km: 1 km), rounded down | 27.7 → "about 27 km" |
| Race and test times | 60 s (races ≤ 30 min: 15 s); targets and band edges rounded **up** (slower) | 48:55.7 → "49:00" (rounded up to the minute) |
| Paces | 5 s/km ranges | "5:20–5:40 /km" |
| Reasons on the card | at most `display.max_reasons_card` (2); the rest under "Why?" | — |

**Band placeholders (v5, p2-A R4).** `{fast_edge:time}` = P_race × (1 − B_fast), `{point:time}` = P_race, `{slow_edge:time}` = P_race × (1 + B_slow); edges are rounded by the race-time rule (targets and edges rounded up, i.e. slower). `{where:text}` ∈ {"inside this range", "faster than this range", "slower than this range"} and is always shown: a range that does not contain the target is never shown without saying so (factdesk6 §7, UNKNOWN as evidence; a judgement).

"For you about {x:km}" uses the logged median easy speed, with no planning margin and at least 3 measured runs. Otherwise the phrase is omitted (03 §2).

## 1. Verdict headlines (card)

| Verdict / headline | text | when |
|---|---|---|
| feasible | "Your plan is ready. It fits the time you have." | verdict feasible |
| stretch: **ambitious** | "Your plan is ready. Your goal is ambitious for your current fitness." | any stretch reason in {TARGET_IN_FAST_BAND, TARGET_BEYOND_CURRENT, LONG_RUN_TIME_CAPPED (time goals)} |
| stretch: **tight** | "Your plan is ready, but there is little room for missed weeks." | stretch reasons only from {LOW_SLACK, DEGRADED_COMPLETION, CUTOFF_AT_RISK} |
| stretch: **uncertain** | "Your plan is ready. We know less than usual about how you'll race." | stretch reasons only from {ANCHOR_UNKNOWN, ULTRA_LOW_CONFIDENCE, LONG_HORIZON_UNPROJECTED, LOW_VOLUME_PREDICTION (time goals)} |
| infeasible | "This goal doesn't fit safely in the time you have. Here are options that do." | verdict infeasible |
| confidence label (not a verdict) | "Based partly on your estimates. Log your runs to sharpen it." | ESTIMATED_INPUTS |

When reasons of several kinds apply, the order is ambitious > tight > uncertain.

## 2. Reason codes (card text ≤ 1 sentence; `why` 1 sentence; checkpoint)

| Code | Card text | Why | Checkpoint shown |
|---|---|---|---|
| AVAILABILITY_TIME | "This goal needs about {extra:min} more running a week than you have." | "Your weekly time is your choice; we never squeeze extra running into it." | — (option: change availability) |
| AVAILABILITY_DAYS | "This goal needs one more running day a week ({day:text})." / roster: "Your night shifts on {dates:text} leave no day for the long run." | "Fewer days would make each run too long or too hard." | — |
| LONG_RUN_UNREACHABLE_PRESET | "At your current easy pace, even the shortest long run we accept for this race ({floor:km}) would take more than {max:min}." | "Very long single runs have no tested safe limit, so we stop at a cautious one." | — |
| LEVELS_UNREACHABLE | "There isn't enough time to build {skill:text} for this goal." | "Some abilities take several weeks each to build." | — |
| PHASES_DO_NOT_FIT | "Reaching the long run and weekly running this race needs takes about {weeks:int} weeks; you have {have:int}." | "Your longest run should grow by about a tenth at a time." | earliest feasible date |
| CURRENT_STATE_SHORT | "With only {weeks:int} weeks, we can only sharpen what you already do, and that isn't yet enough for this race." | "There's no time to build safely." | — |
| TARGET_OUTSIDE_BAND | "{target:time} is faster than the range your current fitness suggests ({fast_edge:time} to {slow_edge:time}), and there isn't time to re-test." | "Race predictions are usually within 6–8%." | — |
| MARGIN_REQUIRED | "After several attempts, we only show options with a safety margin." | "Plans that fit by a hair break with one missed week." | — |
| CUTOFF_UNREACHABLE | "Even the fast end of your predicted range ({fast_edge:time}) is slower than the cut-off ({cutoff:time})." | "Finishing within the cut-off is part of a safe race plan." | — |
| MINOR_DISTANCE | "Races longer than {cap:km} are not recommended at your age." **S** | "Race distances are capped by age." | — |
| LOW_SLACK | "Your plan fits with {slack:int} spare week(s)." | "Missed weeks are never made up, so spare weeks protect your date." | each week |
| TARGET_IN_FAST_BAND | "{target:time} is inside the fast end of the range your current fitness suggests ({fast_edge:time} to {slow_edge:time}, most likely around {point:time})." | "Most runners finish within about 6–8% of a prediction like this." | next field test |
| TARGET_BEYOND_CURRENT | "{target:time} is faster than your current fitness suggests; we'll check progress with a test every {n:int} weeks." | "We never assume improvement; we measure it." | MSG-FEA-INTERIM |
| ANCHOR_UNKNOWN | "We don't have a recent race or test result yet, so the first weeks are by feel and end with a short test." | "Paces need a measured result." | the test week |
| LOW_VOLUME_PREDICTION | time goals: "At your current weekly running, marathon predictions tend to be optimistic." / finish goals (information): "Your finish-time range is wide: {fast_edge:time} to {slow_edge:time}." | "Prediction formulas overrate runners with low weekly mileage." | next long race or test |
| ULTRA_LOW_CONFIDENCE | "For ultras we can only give a wide range: {fast_edge:time} to {slow_edge:time}." | "No tested formula predicts road ultra times." | tune-up |
| LONG_HORIZON_UNPROJECTED | "We judge your goal against today's fitness and re-check each season." | "Nobody can reliably predict improvement over years." | season start |
| LONG_RUN_TIME_CAPPED | time goals: "Your longest run stops at {cap:min}, about {dist:km} at your pace, shorter than this race usually asks." / finish (information): "Your longest run stops at {cap:min}; that's enough to finish, with walk breaks if needed." | "Past about 3 hours the extra strain is a coaching convention, not a measured limit." | — |
| DEGRADED_COMPLETION | "After your break, we've kept your race as a finish goal with a gentler build." / ladder: "You'll run your 5K with walk breaks at your current step, which is a normal way to finish." | "Missed weeks are never made up." | each week |
| CUTOFF_AT_RISK | "The slow end of your predicted range ({slow_edge:time}) is past the cut-off ({cutoff:time})." | "Keep an eye on pacing and the course's cut-off points." | next long run, tune-up |
| ESTIMATED_INPUTS | (label, §1) | "Your answers are used carefully until runs are logged." | — |
| RACE_TOO_SOON | "Your last race was on {last:date}. A race of this length fits from {next:date}." | "Your body needs some easy days after a race before the next one." | — (option: move date) |
| LOW_FREQ | "With {runs:int} runs a week, we keep to one harder session." | "Fewer runs leave less room to recover." | — |

## 3. Feasibility, interim targets and checkpoints

Moved to §6c in v5 (one table per area; every id defined once).

## 4. Evidence and uncertainty wording (layer `why`; factdesk5 §2)

Each label comes with a plain sentence, and with a number where one exists. Basis and grade together choose the label (00 §5).

| Label | Template |
|---|---|
| well supported by research | "Well supported by research: {sentence:text}{ (range)}" — only for basis evidence at CORROBORATED (two independent sources). No single-study finding uses this label (post-audit). |
| some research support | "Some research support: {sentence:text}." e.g. "runs much longer than your recent longest were linked to more injuries in one large study (about 1.5–2.3 times the risk)." (one cohort → CREDIBLE, post-audit) |
| common coaching practice | "Common coaching practice, not tested in studies: {sentence:text}." e.g. "most coaches stop long runs at 2.5–3 hours." |
| our cautious choice, not tested | "Our cautious choice, not tested: {sentence:text}." |
| not known | "Not known: no study has measured this. We use a cautious setting." |

Banned on the card: bare "likely", "rare" or "common" without a number; "moderate certainty"; "proven".

## 5. Repair options (card)

| Kind | Text |
|---|---|
| change_availability | "Add {extra:min} a week (or a run on {day:text}) and this goal fits. Change your availability?" (never applied automatically) |
| move_date | "Choose a race on or after {date:date}: the earliest date that fits ({reason:text})." |
| lower_goal | "Aim for {target:time} instead (or just to finish)." |
| shorter_distance | "Run the {distance:text} on the same date." |
| base_plan | "Build your running without a race for now." |
| change_availability + move_date (v5, p2-A R6) | "Add a run on {day:text} and race on or after {date:date}, and this goal fits." (offered whenever any reason is AVAILABILITY_* and other reasons remain; validated before it is shown) |
| alternative_preset | "Alternative approach: {preset:text}, with longer long runs. Some popular plans use it; it's outside our default caps." |

## 6. Module messages (v5: complete; typed placeholders)

### 6a. Inputs and logging (01, 07)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-INP-ASSUMED | card | "We guessed {field:text} for now. Tap to change it." | "Your plan uses a safe guess until you tell us." | field:text | INP-001 | — |
| MSG-INP-AGE | card | "Please enter your birth month and year. We need them to keep your plan safe for your age." | "Some limits depend on age." | — | INP-002 | — |
| MSG-INP-HR | card | "We only use heart-rate zones from a dated test. Your plan uses effort instead." | "Heart-rate formulas are often wrong for one person." | — | INP-006 | — |
| MSG-INP-PAIN-TAP | card | "Any pain? No / Yes" | "A quick answer keeps your plan safe." | — | INP-022 | — |
| MSG-INP-RPE | card | "How hard did it feel, from 0 (rest) to 10 (all-out)? You can skip this." | "It helps us spot tiredness early." | — | INP-022 | — |
| MSG-INP-PAIN-MORNING | card | "Any pain this morning? No / Yes" | "Pain the next morning tells us more than pain during a run." | — | INP-022 | — |
| MSG-INP-ANCHOR-CONFIRM | card | "This result is much faster than your last one. Is it right? We won't change your paces until a short test agrees." | "Typing errors happen, and paces set too fast are hard on the body." | — | INP-025 | — |
| MSG-GEN-CONFIRM | card | "This run looks unusual ({what:text}). Is it right? Until you confirm it, we leave it out of your plan." | "A wrong entry could make your plan too hard." | what:text | GEN-020 | — |
| MSG-GEN-SPIKE | card | "That run was much longer than usual. Your next long run stays where it was planned." | "Big jumps in run length are best not repeated soon." | — | GEN-023 | — |
| MSG-L30-SPARSE | card | "We've used {pct:int}% of the longest run you told us about until a few runs are logged." | "Logged runs are more reliable than memory." | pct:int | GEN-011 | — |
| MSG-SCR-001 | card | "Please answer the health questions first." | "We check a few health questions before any plan." | — | SCR-001 | — |

### 6b. Context (01)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-CTX-001 | card | "You're new to running, so we build up gently{ and add an easier week every {n:int} weeks}." | "New legs need time. (The clause in braces is left out on the start ladder.)" | n:int | CTX-001 | A |
| MSG-CTX-002 | card | "Your fitness from {sport:text} may be ahead of what your legs are used to, so we build running distance slowly." | "Legs get used to running more slowly than fitness grows." | sport:text | CTX-002 | A |
| MSG-CTX-003 | card | "You had an injury in the last year. So we build up more gently, with an easier week every {n:int} weeks." | "After an injury, a gentler build-up is the usual cautious approach. (v5, p2-C R11)" | n:int | CTX-003 | A |
| MSG-CTX-004 | card | "From {age:int}, we add an easier week every {n:int} weeks and a short strength session." | "Recovery and strength matter more with age." | age:int, n:int | CTX-004 | A |
| MSG-CTX-005 | card | "After a night shift, today's run is easy." | "Lost sleep makes hard running harder." | — | CTX-005 | — |
| MSG-CTX-006 | card | "With {runs:int} runs a week, we keep to one harder session." | "Fewer runs leave less room to recover." | runs:int | CTX-006 | — |
| MSG-CTX-007 | card | "Based partly on your estimates. Log your runs to sharpen it." | "Your plan grows from what you log." | — | CTX-007 | — |
| MSG-CTX-008 | why | "Most studies behind this limit looked at other groups of runners, so we use a cautious setting." | "—" | — | CTX-008 | — |

### 6c. Feasibility and plan building (03, 04, 05)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-FEA-BAND | card | "Today's fitness suggests about {fast_edge:time} to {slow_edge:time} on race day, most likely around {point:time}. Your goal {target:time} is {where:text}." | "Race-time predictions are often off by 6–8%, so we show a range, not one number." | fast_edge:time, point:time, slow_edge:time, target:time, where:text | S3 card | — |
| MSG-FEA-ULTRA | card | "For ultras we can only give a wide range: {fast_edge:time} to {slow_edge:time}." | "No reliable formula predicts road ultra times." | fast_edge:time, slow_edge:time | UI (no rule) | — |
| MSG-FEA-STRETCH | card | "{headline:text} {reasons:text} We'll check again {checkpoint:text}." | "The headline and up to two reasons come from §1 and §2." | checkpoint:text, headline:text, reasons:text | UI (no rule) | — |
| MSG-FEA-NO | card | "{headline:text} {reasons:text} {options:text}" | "Reaching it would need bigger jumps than our safety limits allow, or more time than you have." | headline:text, options:text, reasons:text | UI (no rule) | — |
| MSG-FEA-INTERIM | card | "Your goal {target:time} is faster than your current fitness suggests (about {fast_edge:time}). We'll test in week {n:int}. About {test_time:time} or faster on the {test_dist:km} test means you're closing the gap." | "We measure progress instead of assuming it." | fast_edge:time, n:int, target:time, test_dist:km, test_time:time | FEA-038 | — |
| MSG-FEA-CHK-IMPROVED | card | "Your test shows real progress. Your range is now {fast_edge:time} to {slow_edge:time}." | "The change is bigger than the normal ups and downs between tests." | fast_edge:time, slow_edge:time | FEA-038 | — |
| MSG-FEA-CHK-SAME | card | "Your test is within normal day-to-day variation (about 3%). Your plan and paces stay the same." | "Tests of the same runner vary by 2–4%. A bigger change needs a second test before paces move. (v5.1)" | — | UI (no rule) | — |
| MSG-FEA-CHK-SLOWER | card | "Your test was slower, so we've eased your paces. One test can be an off day; we'll look again at the next." | "Easier paces are the safe direction." | — | UI (no rule) | — |
| MSG-FEA-WHY-CHANGE | why | "Your verdict changed because {cause:text}." | "cause = 'your fitness changed' or 'we now know your fitness more precisely, not because it changed'." | cause:text | FEA-052 | — |
| MSG-FEA-NEVERRUN-DATE | card | "Most people who are new to running need about {weeks:int} weeks. The earliest comfortable date is {date:date}. Most people repeat a week, and that is normal." | "The beginner steps are never shortened." | date:date, weeks:int | UI (no rule) | — |
| MSG-FEA-ESTIMATED | card | "Based partly on your estimates. Log your runs to sharpen it." | "Your answers are used carefully until runs are logged." | — | FEA-035 | — |
| MSG-FEA-DEGRADED | card | "After your break, we've kept your race as a finish goal with a gentler build." | "Missed weeks are never made up." | — | FEA-043 | — |
| MSG-FEA-LADDER-RACE | card | "You'll run your 5K with walk breaks at your current step. That is a normal way to finish. Run easy, and stop if anything hurts." | "Run-walk lets you finish without rushing the beginner steps." | — | FEA-043 (b) | — |
| MSG-LOD-FILL | card | "Add a run day if you want your weekly running to keep growing." | "With {runs:int} runs a week, each run would otherwise get too long." | runs:int | LOD-016 | — |
| MSG-LOD-017 | card | "This long run is {cap:min} for now. Longer runs open once your logged running shows you're ready." | "Runs over 3 hours are only added when your log shows you handle long runs." | cap:min | LOD-017 | — |
| MSG-LOD-018 | card | "Your next very long run moves to {date:date}, so there is enough rest between them." | "Very long runs need more days apart." | date:date | LOD-018 | — |
| MSG-LOD-EST-CAP | card | "Your weekly running grows by at most {pct:int}% a week until your logged runs confirm where you started." | "Your starting numbers came from memory. We build up gently until your log shows them. (v5.1)" | pct:int | LOD-007 | — |
| MSG-LOD-BASE-CONFIRMED | card | "Your logged weeks now confirm where you started. Your weekly running can grow at the usual rate." | "Your plan now grows from what you have logged. (v5.1)" | — | LOD-008 | — |
| MSG-LOD-PAIN-ANSWER | card | "Please answer the quick pain question after your runs. Your plan holds steady until most runs have an answer." | "We only step up when we know your runs felt fine. (v5, p2-C R3)" | — | LOD-006 | — |

### 6d. Distance families (09)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-DST-LR3H | card | "Your longest run stops at {cap:min} or {dist:km}, whichever comes first{, for you about {own:km}}. Many plans go to 32 km." | "Past 3 hours the extra strain is a coaching convention, not a measured limit." | cap:min, dist:km, own:km | UI (no rule) | — |
| MSG-DST-FLOOR | card | "Run {cap:min}. If you haven't reached {floor:km} by then, continue to {floor:km}, at most {max:min}, with walk breaks." | "This race needs at least this distance in training." | cap:min, floor:km, max:min | UI (no rule) | — |
| MSG-DST-LR-EXT | card | "Optional: up to {n:int} longer runs, to about {km:km} or {h:time}, with walk breaks." | "In one large New York study, first-time marathoners who had done an 18-mile run reported fewer minor race-day injuries. That is a link, not proof. No study shows whether runs over 3 hours are riskier; most coaches stop at 2.5–3 hours." | h:time, km:km, n:int | DST-019 | — |
| MSG-DST-ULTRA-CAP | card | "Ultra long runs go up to 60% of a peak week and {cap_h:time}." | "This is common coaching practice. No injury data exist for road ultras." | cap_h:time | DST-008 | — |
| MSG-DST-B2B | card | "Back-to-back long runs are a coaching habit, not a proven method. They add strain. Only add them if you have trained for ultras before." | "Two long days in a row are hard on your body." | — | DST-010 | — |
| MSG-DST-PRESET | card | "Your chosen style needs {need:text}; your week has {have:text}. We used our standard plan instead." | "Each style only works as a whole." | have:text, need:text | DST-016 | — |
| MSG-DST-TUNEUP | card | "A long tune-up run tests your race plan, food and kit." | "Race organisers recommend it." | — | UI (no rule) | — |

### 6e. Adaptation (08)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-ADP-CHANGED | card | "Your plan changed from today: {list:text}. Each item reads: {session:text}: {from:text} → {to:text}, because {reason:text}." | "Changes follow fixed rules; tap a change to see why." | from:text, list:text, reason:text, session:text, to:text | ADP-013, INV-01, INV-02, INV-03, INV-04, INV-05, … 26 rules; every re-plan; INV explanations | — |
| MSG-ADP-UNLOGGED | card | "No runs logged last week. Did you run? (I ran but didn't log / I didn't run / Skip). Skip: we'll treat it as not run and keep your plan gentle for {n:int} weeks." | "Your plan grows from what you log." | n:int | ADP-003 | — |
| MSG-ADP-FIT | card | "You did less than planned for two weeks. Shall we fit the plan to the time you have?" | "A plan you can follow beats a bigger one you cannot." | — | ADP-024 | — |
| MSG-ADP-HOLD | card | "Mild pain that settles: keep running, but your plan won't step up this week or next." | "Holding steady gives your body time to settle." | — | UI (no rule) | — |
| MSG-ADP-PAIN-STEP | card | "Pain above 3 out of 10, or pain still there next morning? Take a day off. Then go back one step and run easy until two runs feel fine." | "Rest a day and go back one step: the usual return pattern." | — | ADP-052 | — |
| MSG-ADP-ILL-STOP | card | "Rest until you are well. If you feel very ill or do not get better, talk to a doctor." | "Running with a fever or a sick feeling all over is not a good idea." | — | ADP-041 | S |
| MSG-ADP-ILL-RACE | card | "This plan does not recommend racing while you recover from illness." | "The same return rules apply to races." | — | ADP-044 | S |
| MSG-ADP-TIRED-1 | card | "One tired day is normal. Nothing changes yet." | "We change your plan only when tiredness repeats." | — | ADP-054, ADP-055 | — |
| MSG-ADP-REFER | card | "You've felt very tired for a few weeks. Please talk to a doctor or health professional. Your plan holds steady until you have." | "Long-lasting tiredness is worth checking." | — | ADP-057 | S |
| MSG-ADP-PACE-DOWN | card | "Your hard runs felt very hard twice in a row, so we've eased your paces a little. A short test will reset them." | "Paces that feel too hard are eased first, then checked." | — | ADP-066 | — |
| MSG-ADP-PACE-PENDING | card | "Your result is {pct:int}% away from your last one. One test can be off by that much, so your paces stay the same until a second result agrees." | "One test can be a few percent off on a good or bad day. (v5.1)" | pct:int | ADP-067 | — |
| MSG-ADP-PACE-CONFIRMED | card | "Two results now agree, so we have set your paces from the average of the two." | "Two tests that agree tell us more than one. (v5.1)" | — | ADP-067 | — |

### 6f. Sessions (06)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-SES-EASY | card | "Easy: you can talk in full sentences. If you can't, slow down or walk." | "Easy running builds your engine with little strain." | — | UI (no rule) | — |
| MSG-SES-RW | card | "Run for the time shown, then walk briskly; repeat. Walk breaks are training, not failure." | "Walk breaks let you build time on your feet safely." | — | UI (no rule) | — |
| MSG-SES-LONG | card | "Long and easy: full sentences all the way. Finish feeling you could go on." | "Long runs build staying power for the end of a race." | — | UI (no rule) | — |
| MSG-SES-THR | card | "Hard but controlled: you can say only a few words. Hold an even effort." | "This raises the pace you can hold for a long time." | — | UI (no rule) | — |
| MSG-SES-VO2 | card | "Very hard: you cannot talk. Jog easy between repeats until your breathing settles." | "This raises your top-end fitness." | — | UI (no rule) | — |
| MSG-SES-RACE | card | "Race effort for your goal race (see the effort word for your distance)." | "Practising race effort teaches pace and confidence." | — | UI (no rule) | — |
| MSG-SES-TEST | card | "A test run: even effort, the best you can hold for the distance. Log it today." | "It sets your training paces; until then we use effort only." | — | UI (no rule) | — |
| MSG-ONBOARD-NOPACE | card | "No paces yet: the first weeks are by feel. A short test in week {n:int} sets your paces." | "Paces need a measured result; guesses can mislead." | n:int | UI (no rule) | — |
| MSG-LADDER-NORMAL | card | "Most people repeat a week; that is normal." | "The steps are never rushed." | — | UI (no rule) | — |

## 7. Safety messages (10; all **S**, inlined in v5 — 10 §5 is a non-normative copy)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-SAF-QUESTIONS | card | "Before we save this, a few quick safety questions. Please answer each one." | "These questions decide whether running is safe today." | — | INP-023 | S |
| MSG-SAF-HOLD | card | "Please answer the safety questions before your next run." | "Your next run appears once the questions are answered. (v5 `on_unknown: hold`, p2-C R2)" | — | engine on `on_unknown: hold` | S |
| MSG-SAF-001 | card | "Before you start or go on with this plan, talk to a doctor or other health worker." | "A professional should look first." | — | GEN-001, SAF-011, SAF-084, SCR-004, SCR-006 | S |
| MSG-SAF-002 | card | "Stop. Do not run. Get medical help today. If it is happening now or feels severe, call emergency services." | "These signs need a medical check." | — | ADP-040, SAF-001, SAF-004, SAF-006 | S |
| MSG-SAF-003 | card | "Call emergency services now. Stop running and stay with someone until help arrives." | "These signs need urgent help." | — | NUT-033, NUT-043, SAF-004, SAF-005 | S |
| MSG-SAF-004 | card | "This app gives general training guidance. It is not medical advice and cannot check your health. If you feel unwell, stop and get help." | "The disclaimer of 00 §6." | — | SAF-020; onboarding, every pause | S |
| MSG-SAF-005 | card | "Stop running. See a health professional before you run again." | "This pain needs checking first." | — | SAF-002 | S |
| MSG-SAF-006 | card | "For pain in this area, follow your health professional's return plan. This app does not provide one." | "Some areas need a professional's plan." | — | UI (no rule) | S |
| MSG-SAF-007 | card | "Rest from running until you feel well. If you are not getting better, talk to a doctor." | "Running unwell can make things worse." | — | SAF-007 | S |
| MSG-SAF-008 | card | "Easy and shorter today. Stop if you feel worse." | "Light symptoms: a gentle run at most." | — | SAF-008 | S |
| MSG-SAF-009 | card | "Some answers are worth talking about with a doctor or registered dietitian. Until then your plan holds steady." | "No increases until then." | — | SAF-009, SAF-012 | S |
| MSG-SAF-010 | card | "Your plan is paused. No runs are planned until you confirm you have been cleared." | "—" | — | SAF-020 | S |
| MSG-SAF-011 | attestation | "I have talked to a doctor or other health worker about this. They agreed I can run again." | "—" | — | SAF-009, SAF-010, SAF-021, SAF-042 | S |
| MSG-SAF-012 | attestation | "I have had no fever, have felt well for the days asked, and can walk comfortably." | "—" | — | SAF-021 | S |
| MSG-SAF-013 | attestation | "My health professional has cleared me to return to full training." | "—" | — | SAF-023 | S |
| MSG-SAF-020 | card | "This tool is for runners aged {min_age:int} and over." | "Young runners need adult-led guidance." | min_age:int | SAF-040 | S |
| MSG-SAF-021 | attestation | "I am the parent or guardian. I agree to this plan and answered the health questions with the runner." | "—" | — | SAF-041 | S |
| MSG-SAF-022 | card | "Races longer than {cap:km} are not suggested at your age, so we suggest a shorter goal." | "Race distances are capped by age." | cap:km | SAF-043 | SA |
| MSG-SAF-023 | card | "Longer runs open from {date:date}." | "Run lengths for young runners grow with age. (v5, p2-C R9; never computed from a default age)" | date:date | SAF-044 | SA |
| MSG-SAF-030 | card | "Please talk to your midwife or doctor about what activity suits you now." | "Starting running in pregnancy is not covered." | — | SAF-050 | SA |
| MSG-SAF-031 | attestation | "My midwife or doctor agreed that I can keep running during this pregnancy." | "—" | — | SAF-051 | S |
| MSG-SAF-032 | card | "A running plan starts from about {weeks:int} weeks after birth." | "Your body needs time first." | weeks:int | SAF-052 | SA |
| MSG-SAF-033 | attestation | "A health professional has checked that I am ready to start running again." | "—" | — | SAF-053 | S |
| MSG-SAF-034 | card | "Please enter your due date. We'll check in with you near it." | "Your plan changes after the birth. (v5, p2-C R4)" | — | SAF-051 | S |
| MSG-SAF-035 | card | "Have you given birth? Yes / Not yet" | "From your due date, runs wait for this answer. (v5, p2-C R4)" | — | SAF-054 | S |
| MSG-SAF-040 | attestation | "A doctor has checked that hard or very long training is fine for me." | "—" | — | SAF-060 | S |
| MSG-SAF-041 | card | "If you have not trained hard for a long time, a check-up before hard sessions is a good idea." | "Advisory." | — | UI (no rule) | S |
| MSG-SAF-060 | card | "Our cautious choice for runners aged 65 and over: hard sessions and runs over 3 hours start after a check-up with a doctor. Until then, runs stay easy to steady and at most {cap:min}." | "This is our cautious choice, not a tested rule." | cap:min | SAF-060 | SA |
| MSG-SAF-061 | card | "From age {age:int}, a check-up with a doctor before hard or very long training is a sensible step." | "Long, hard training is a big demand on the body; a check-up is a sensible precaution. (v5, p2-C R11)" | age:int | SAF-061 | SA |
| MSG-SAF-STOP-SIGNS | card | "Stop running and get help if you feel chest pain or feel faint. Do the same if your heartbeat feels odd." | "These signs need help fast." | — | onboarding and the safety page, for every runner; never tied to age or another personal trait (v5, p2-C R11) | S |

## 8. Nutrition (11; inlined in v5 — 11 §8 is a non-normative copy)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-NUT-REFER | card | "For fuelling advice that fits your health, talk to a doctor or registered dietitian. Your plan still includes long runs." | "Some conditions and medicines change what is safe to eat and drink while running." | — | NUT-002 | SA |
| MSG-NUT-L4 | card | "Above 90 g an hour has no proven benefit and upsets more stomachs. Only try it if 90 g has felt fine." | "Evidence above 90 g an hour is thin." | — | NUT-014 | — |
| MSG-NUT-CAPPED | card | "Your race plan uses the most your stomach handled in training: {g_h:int} g an hour." | "Nothing new on race day." | g_h:int | NUT-020, NUT-021 | — |
| MSG-NUT-EAH | card | "Drink to thirst. Do not drink so much that you gain weight. Avoid anti-inflammatory painkillers during the event." | "Drinking far more than you sweat can be dangerous in long events." | — | NUT-032, NUT-034 | S |
| MSG-NUT-HEAT | card | "It will be hot: run by feel, expect to be slower, and follow the organisers' heat advice." | "Heat makes any pace feel harder." | — | NUT-041 | — |
| MSG-NUT-REDS-Q | card | "A few questions about eating and energy. There are no wrong answers." | "They help us keep your training safe." | — | NUT-050 | S |
| MSG-NUT-REDS | card | "Some of your answers suggest your eating may not match your training. Please talk to a doctor or registered dietitian. Your plan will not increase until you have." | "Training more while under-fuelled can harm health and performance." | — | NUT-051 | S |

## 9. Generic why texts (one per module; used when a rule shows no message of its own)

| ID | Layer | Text | Why | Placeholders | Emitted by | Flags |
|---|---|---|---|---|---|---|
| MSG-WHY-INP | why | "We use what you tell us carefully until your runs are logged." | "—" | — | INP-003, INP-004, INP-005, INP-007, INP-008, INP-020, … 5 rules | — |
| MSG-WHY-SCR | why | "We check a few health questions before any plan, and again when things change." | "—" | — | SCR-002, SCR-003, SCR-005, SCR-007, SCR-008 | S |
| MSG-WHY-CMP | why | "Each ability builds on simpler ones, step by step." | "—" | — | CMP-001, CMP-002, CMP-003, CMP-004, CMP-005, CMP-006, CMP-007, CMP-008 | — |
| MSG-WHY-FEA | why | "We check that your goal fits your time and today's fitness before building a plan." | "—" | — | FEA-001, FEA-002, FEA-003, FEA-004, FEA-006, FEA-010, … 23 rules | — |
| MSG-WHY-PHS | why | "Your plan has stages, with easier weeks to recover." | "—" | — | PHS-001, PHS-002, PHS-003, PHS-004, PHS-005, PHS-006, … 7 rules | — |
| MSG-WHY-LOD | why | "Your running grows in small steps, so your body can keep up." | "—" | — | LOD-001, LOD-002, LOD-003, LOD-004, LOD-005, LOD-010, … 23 rules | — |
| MSG-WHY-SES | why | "Each session has one job, and only fits once you are ready for it." | "—" | — | SES-001, SES-002, SES-003, SES-004, SES-005, SES-006, … 17 rules | — |
| MSG-WHY-GEN | why | "Your plan is built and then checked against fixed safety limits." | "—" | — | GEN-002, GEN-003, GEN-004, GEN-005, GEN-010, GEN-012, … 7 rules | — |
| MSG-WHY-ADP | why | "When life changes your week, your plan adjusts. Missed runs are never made up." | "—" | — | ADP-001, ADP-002, ADP-004, ADP-010, ADP-011, ADP-012, … 30 rules | — |
| MSG-WHY-DST | why | "Each race distance has its own longest run and taper." | "—" | — | DST-001, DST-002, DST-003, DST-004, DST-005, DST-006, … 9 rules | — |
| MSG-WHY-SAF | why | "Safety rules always come first." | "—" | — | SAF-003, SAF-022, SAF-080, SAF-081, SAF-082, SAF-083, SAF-085, SAF-086 | S |
| MSG-WHY-NUT | why | "Fuel and drink advice stays general and is never a diet." | "—" | — | NUT-001, NUT-003, NUT-004, NUT-005, NUT-010, NUT-011, … 11 rules | — |

## 10. Message lint (v5, p2-B R7, p2-C R11, p2-A R9; run by `design/v5/tools/check_messages_v5.py`, TST-094)

| # | Check | Applies to | Basis |
|---|---|---|---|
| L1 | Every id used by a rule, action or explanation in rules.json is defined here, once | all | p2-B R7 |
| L2 | Placeholders are typed `{name:type}`, type ∈ {min, km, pace, time, date, int, text}; no bare `{x}` or `[x]` | all | p2-A R3 |
| L3 | Reading level: average sentence ≤ 20 words; Flesch–Kincaid grade ≤ 8 for every card and why text of ≥ 8 words; ≤ 6 targeted (reported) for **S** rows. Exception (wording fixed by a room): MSG-CTX-003 why (p2-C R11) | card, why | factdesk6 §6, CORROBORATED (grades 6–8 norm; a formula is a proxy, not proof) |
| L4 | No rule id, reason code or parameter name on the card or why layer | card, why | 07 §9 |
| L5 | No risk, heart or injury-likelihood words (risk, riskier, likely, chance, danger, heart, cardiac) in a message flagged **A** | A rows | p2-C R11; factdesk2 §2, CORROBORATED (Rev.1 "prediction" wording) |
| L6 | A §4 multiplier (e.g. "1.5–2.3 times") never sits in a message with a personal placeholder ({age}, {sport}) | all | p2-C R11 |
| L7 | Glossary words used on a card (talk test, stretch, SHARPEN, predicted range, ONBOARD, measured, estimated) link to 15 | card | p2-A R9 |
| L8 | Age messages never use a default age. Static part (in `check_messages_v5.py`, post-audit): birth month and year are in `inp.no_unknown_fields`, and every rule that emits an age message has an `age_low`/`age_high` condition. Runtime part: TST-103 | A rows | p2-C R9 |

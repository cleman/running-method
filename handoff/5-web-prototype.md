# A prototype you can try in the browser

Paste into a Claude Code session once step 4 is on GitHub.

---

You work on https://github.com/cleman/running-method (a public repository; read-only for you, I upload your zips myself). Clone or `git pull` it. Read `CLAUDE.md`, `docs/test-report.md` and `docs/disagreements.md`.

**Task:** a prototype web page, in `web/`, for me and a few trusted testers. It is not a public site: release blockers B-1 to B-3 are open.

- One static page, built from `engine/`. The generator runs **in the browser**. No server, no account, nothing sent anywhere. Answers are stored only in the browser, and there is a button to erase them.
- Screens:
  1. profile and screening questions, with the PAR-Q+ shown as clearly marked **placeholder** items (licence not yet obtained);
  2. goal and availability;
  3. the generated plan week by week, with each session's "why";
  4. a run log (manual entry);
  5. re-planning after logged runs or missed sessions.
- Show fail-closed results as the spec's ranked options, never as an error page.
- Mobile first: I use a phone.
- A visible banner: "Prototype, not medical advice, not validated on runners".
- Publish it as a **private** claude.ai artifact page and give me the link. Also deliver `web/` as a zip for GitHub.

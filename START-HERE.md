# Start here: how to build the generator, step by step

This page is for you, the owner. It says what to do, where, and what to copy, in order. You never need to write code.

## The idea in one paragraph

The method is written down in `spec/`. Two separate Claude conversations will turn it into software:

- the **Engine** conversation builds the generator;
- the **Oracle** conversation writes the tests that check the generator.

They must be different conversations so the tests are not written by the same "mind" that wrote the generator. Otherwise the tests would only repeat its mistakes. Each conversation reads this repository from GitHub, works, and hands you a zip file. You upload the zip to GitHub. That is how they pass work to each other: **through your GitHub repository, with you as the courier.**

## Words used on this page

| Word | Meaning |
|---|---|
| **Session** or **conversation** | One chat in the **Claude Code** tab of claude.ai. Each has its own private computer that disappears after a while. |
| **Repository (repo)** | Your project folder on GitHub: `github.com/cleman/running-method`. |
| **Handoff prompt** | A ready-made message in the `handoff/` folder. You copy it and paste it as the first message of a new conversation. |
| **Zip** | The file a session gives you at the end. You upload its content to GitHub. |

## Why the repository must be public (or GitHub connected)

Your GitHub account is not connected to Claude. A new session can still **read** a **public** repository, but it cannot read a private one, and it can never push.

- **Public (simplest).** Anyone can read the method. The PAR-Q+ questionnaire is not included, so there is no licence problem.
- **Private.** Connect GitHub at claude.ai/connect-github first. A bonus: sessions can then save their work to GitHub themselves, and you only click "Merge". This saves you all the uploads below.

## Step 0: put the repository on GitHub (once)

1. On github.com, create a new repository named `running-method`, **public**, and do **not** tick "Add a README" (the zip already has one).
2. Upload the content of `running-method.zip`. Pick one way:
   - **In the browser:** on the empty repository page, click "uploading an existing file", then drag **the content** of the unzipped folder (not the folder itself) and click "Commit changes". If GitHub refuses because there are too many files, upload `spec/` first, then the rest.
   - **With git, if you use it:** `git clone running-method.bundle running-method`, then add your GitHub remote and push `main`.
3. Check that `github.com/cleman/running-method` shows `START-HERE.md`, `spec/` and `handoff/`.

## Step 1: Engine conversation, part A: complete the spec (you answer about 10 questions)

**Where:** the Claude Code tab, a **new** session, started the same way as this one. If it asks for a repository, choose none.

1. Open `handoff/1-engine-part-A.md` on GitHub, copy all of it, and paste it as the first message.
2. The session reads the method and the gap analysis (`docs/gap-analysis.md`). It fills the technical gaps itself, without asking you. It writes the 27 rules that are still in prose, then asks you **about 10 plain-language questions** (for example: "How many hard sessions per week for a beginner preparing a 10K? Recommended: 1"). Answer them. "Take your recommendation" is a fine answer.
3. This is the longest step. Expect several usage-limit pauses: type `continue` each time.
4. At the end it gives you a zip (spec v5.2). Upload it to GitHub as in step 0. It replaces files in `spec/` and `docs/`.

## Step 2: Oracle conversation: the independent tests

**Where:** the Claude Code tab, **another new** session. It must not be the Engine conversation.

1. Wait until step 1 is on GitHub.
2. Paste `handoff/2-oracle.md` as the first message.
3. It gives you a zip containing `oracle/`. Upload it to GitHub.

## Step 3: Engine conversation, part B: build the generator

**Where:** go back to the Engine conversation from step 1. If it has expired, start a new one with `handoff/3-engine-part-B.md` instead.

1. You can do this **at the same time as step 2.** Paste `handoff/3-engine-part-B.md`.
2. It gives you a zip containing `engine/`. Upload it to GitHub.

## Step 4: put both together

**Where:** the Engine conversation, once steps 2 and 3 are both on GitHub.

1. Paste `handoff/4-integration.md`.
2. The session runs the oracle's tests against the generator, including the 5 personas. It fixes the generator, never the tests. Where it thinks a test is wrong, it writes the case in `docs/disagreements.md` for you instead of changing it.
3. Upload its zip. Then show `docs/disagreements.md` to the Oracle conversation, or ask me (the council session).

## Step 5: a prototype you can try on your phone

**Where:** any Claude Code session, after step 4.

1. Paste `handoff/5-web-prototype.md`.
2. The session builds a small web page that runs the generator **inside your browser**. Your answers never leave your device. It publishes the page as a **private** claude.ai page, so you get a link.
3. It is a prototype for you and a few trusted testers, not a public site. A public site needs the release blockers below.

## Tasks only you can do (they block a public site, not the prototype)

- **B-1:** get the PAR-Q+ licence (from the PAR-Q+ Collaboration).
- **B-2:** have someone read the regulatory side (EU medical-device rules and the "general wellness" exemption) for your exact website.
- **B-3:** have a sports physician check the screening questions and what the tool does with each answer.

## If something goes wrong

- **The session stops because of a usage limit:** wait, then type `continue`.
- **The session says it cannot read the repository:** check that it is public and that the name is exactly `cleman/running-method`.
- **You are unsure what to upload:** each session ends with a short message saying which folders to upload. You can also paste that message back to me.

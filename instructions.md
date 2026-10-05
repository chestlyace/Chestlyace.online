# Instructions for Agents

**Every agent working on this repository must read this file before starting any
implementation and again after finishing it, before opening a pull request.**
These rules override any default behaviour of the agent or its tools. The
workflow that puts them into practice is the `chestlyace-workflow` skill
(`.claude/skills/chestlyace-workflow/SKILL.md`).

The repository owner is **Chestly Ace** (GitHub: `chestlyace`), referred to below
as "the owner".

---

## 1. Work phase by phase

1. Development is split into phases, listed in [`docs/phases.md`](./docs/phases.md).
2. Work on **one phase at a time**: the current phase is the first phase whose
   status is not **Done**.
3. **Never start the next phase without the owner's approval.** Approval means
   the owner merged the current phase's pull request. An open, unmerged PR is not
   approval, and neither is silence.
4. Do only what the current phase lists. Work that belongs to a later phase waits
   for that phase, even if it looks quick.
5. A phase may be split into smaller issues only if the owner agrees.

## 2. Make no assumptions — ask

1. If anything is unclear, **stop and ask the owner before continuing.** This
   covers architecture, tech stack, libraries, folder structure, design, copy,
   data, naming, and anything else not written down in `docs/`.
2. **Do not drift from the architecture.** Build what `docs/` describes. Where the
   docs say something is "Proposed", it is not decided: ask before building on it.
3. **Open questions block work.** Anything that depends on an **Open** or
   **Proposed** item in [`docs/open-questions.md`](./docs/open-questions.md) waits
   until the owner answers it.
4. **No new dependencies** that the docs don't name without asking first.
5. Don't fill gaps with a "sensible default" and mention it later. Ask first.
6. When asking: say what is unclear, give the options, recommend one and say why,
   then wait for the answer.

## 3. The docs are read-only

1. `docs/` (architecture, schema, design, information architecture, open
   questions, phases), this file, and the workflow skill **change only with the
   owner's explicit permission**, given for that specific change.
2. If you find a doc that is wrong, incomplete, or contradicts itself, stop and
   tell the owner. Don't fix it on your own, and don't code around it.
3. When the owner answers an open question or changes a decision, update the
   docs in the same pull request as the work it affects, and only as instructed:
   the decisions log in `docs/README.md`, the relevant doc, and the question's
   status in `open-questions.md`.

## 4. Issues and pull requests

1. **Every phase or feature has its own GitHub issue**, created **before** any work
   starts. The title names the feature.
2. **Every issue gets exactly one pull request**, targeting `main`, whose
   description contains `Closes #<issue number>`.
3. **Never push to `main`. Never merge a pull request.** Only the owner merges.
4. One working branch, one open pull request at a time. After the owner merges, the
   branch restarts from the latest `main` for the next issue.
5. Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
   `refactor:`, `test:`, `style:`).
6. Review comments on an open pull request are addressed on that same pull request.

## 5. Stop after every phase

1. When a phase's work is complete and checked (§6), open the pull request.
2. Then **stop**. Tell the owner the phase is ready for review, with a link to
   the PR and a short summary, and ask for their feedback.
3. Don't start anything else, not even preparation for the next phase, until the
   owner has reviewed and merged.

## 6. Quality bar before opening a pull request

1. Typecheck, lint, and build pass (once the project has them, from Phase 1 on).
2. Tests for the phase pass, if the phase includes tests.
3. The change matches the docs. Nothing extra was added "while I was there".
4. You've read your own diff in full and found nothing to fix.
5. No secrets, `.env` files, or credentials committed.
6. For UI work: you ran the app and checked the change in light and dark mode,
   at phone and desktop widths.

## 7. Self-check after implementation

Before opening the pull request, re-read this file and confirm each line below.
Copy this checklist into the pull request description with every box ticked. If a
box can't be ticked honestly, stop and tell the owner instead of opening the PR.

```
### Instructions check
- [ ] Re-read instructions.md before starting and after finishing
- [ ] Worked only on the current phase
- [ ] Made no assumptions; every unclear point was asked and answered
- [ ] Stayed within the architecture and stack in docs/
- [ ] Edited no docs without the owner's permission
- [ ] Added no dependencies the docs don't name, unless approved
- [ ] This PR closes exactly one issue
- [ ] Quality bar (§6) met
```

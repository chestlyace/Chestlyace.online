---
name: chestlyace-workflow
description: Mandatory workflow for ANY work in the chestlyace.online repository — planning, implementing a phase or feature, fixing review feedback, or editing docs. Use at the start of every session in this repo and before any code change, issue, or pull request. Enforces phase-by-phase delivery, one issue + one PR per feature, owner approval before moving on, asking instead of assuming, and read-only docs.
---

# chestlyace.online workflow

The rules live in `instructions.md` at the repo root. This skill is the procedure
for following them. If this skill and `instructions.md` ever disagree,
`instructions.md` wins. Point out the mismatch to the owner.

## Step 1 — Load context (every session, before anything else)

1. Read `instructions.md` in full.
2. Read `docs/README.md` (index + decisions log) and `docs/phases.md`.
3. Find the **current phase**: the first phase in `docs/phases.md` whose status
   is not **Done**.
4. Read every doc section that phase points to, and each open question it lists
   as blocking.
5. Check GitHub for this repo's open issues and pull requests:
   - **Open PR for the current phase** → you're in review. Go to Step 7 and work
     only on review feedback.
   - **Previous phase's PR not merged yet** → don't start new work. Tell the
     owner what is waiting on their review.

## Step 2 — Confirm the phase can start

Before writing any code:

1. List the phase's **blocking questions** (from `docs/phases.md`). Any whose
   status in `docs/open-questions.md` is still **Open** or **Proposed** must be
   answered first. Ask the owner about all of them in one message: options plus
   your recommendation.
2. Walk through the phase's deliverables. For each one, check that the docs say
   exactly what to build. Ask about anything they don't.
3. **Visual work needs an approved design spec** (`instructions.md` §8). If the
   phase builds or restyles anything visual, every component and section in scope
   must have a spec in `docs/design.md` §13–14 that the owner has merged. If one is
   missing, stop: the design step (`a`) comes first. In a design step, ask the
   owner for references (sites, screenshots, images) and tools before writing
   specs — components first, then sections.
4. Wait for the answers. Record them in the docs only as the owner instructs
   (`instructions.md` §3.3).

## Step 3 — Open the issue

If the phase has no issue yet, create one **before** implementing:

```markdown
Title: Phase <N> — <phase name>

## Goal
<one or two sentences, from docs/phases.md>

## Scope
- <deliverable>
- <deliverable>

## References
- docs/phases.md — Phase <N>
- docs/<file>.md §<section>

## Decisions this phase relies on
- <Dn / Qn: answer>

## Done when
- <criteria from docs/phases.md>
```

## Step 4 — Prepare the branch

- One working branch, one open PR at a time.
- If the branch carries already-merged work, restart it from the latest `main`:
  `git fetch origin main && git checkout -B <branch> origin/main`.
- Never commit to or push `main`.

## Step 5 — Implement

- Build only what the issue's scope lists, exactly as the docs describe.
- **The moment something is unclear, stop and ask.** That includes a library
  choice, a file location, a name, a colour, some copy, or a behaviour the docs
  don't cover. Don't pick a default and carry on.
- Build visuals exactly to the approved spec. No invented styles, and no
  animation or UI libraries the owner hasn't named.
- Commit in small Conventional Commit steps (`feat:`, `fix:`, `chore:`, …).
- Don't touch `docs/`, `instructions.md`, or this skill unless the owner told you
  to make that specific change.

## Step 6 — Verify, self-check, open the PR

1. Run the quality bar in `instructions.md` §6: typecheck, lint, build, tests,
   and a manual check in the browser for UI work.
2. Read the full diff. Fix anything that's off scope or wrong.
3. **Re-read `instructions.md`** and go through its §7 checklist.
4. Push the branch and open the pull request:

```markdown
Title: <type>: Phase <N> — <phase name>

Closes #<issue>

## Summary
- <what was built, in owner-facing terms>

## How to check it
- <steps the owner can follow: URLs, commands, what to look for>

## Decisions applied
- <Dn / Qn answers this PR relies on>

## Questions for the owner
- <anything that came up and needs a decision, or "None">

### Instructions check
- [x] Re-read instructions.md before starting and after finishing
- [x] Worked only on the current phase
- [x] Made no assumptions; every unclear point was asked and answered
- [x] Stayed within the architecture and stack in docs/
- [x] Edited no docs without the owner's permission
- [x] Added no dependencies the docs don't name, unless approved
- [x] This PR closes exactly one issue
- [x] Quality bar (§6) met
- [x] Visual work follows an owner-approved design spec (§8), or the PR has no visual work
```

## Step 7 — Stop and wait for review

1. Tell the owner: phase ready for review, the PR link, a short summary, and any
   questions. Then **stop**.
2. While the PR is open, only:
   - answer the owner's review comments,
   - push fixes they ask for to the same PR,
   - keep CI green.
3. **The owner merging the PR is the only approval to continue.** After the merge:
   restart the branch from `main` (Step 4) and go back to Step 1 for the next
   phase.

## Asking the owner

Use this shape whenever you're blocked:

> **Question:** <what is unclear, one sentence>
> **Why it matters:** <what depends on it>
> **Options:** A) … B) … C) …
> **Recommendation:** <option> because <reason>

Ask everything you can see coming in one message. Don't drip questions one at a
time.

# AGENTS.md

Before doing anything in this repository:

1. Read [`instructions.md`](./instructions.md). Its rules are mandatory for every agent.
2. Follow the workflow in [`.claude/skills/chestlyace-workflow/SKILL.md`](./.claude/skills/chestlyace-workflow/SKILL.md).
3. The project's source of truth is [`docs/`](./docs/README.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

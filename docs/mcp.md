# MCP server — an agent that can run the admin (Phase 13)

**Goal (D92).** An AI agent connected over MCP can do everything the owner can do in the
admin dashboard: write and publish blog posts (all block types, French versions),
upload pictures, add and edit projects, skills, experience, services, certifications,
FAQ, socials and the profile, manage the creatives pieces and events, change the
settings, and moderate comments. Nothing is reachable without a token the owner
created, and every call is logged.

## 1. Scope

| In | Out |
|---|---|
| Every resource the admin edits (`lib/admin/resources.ts`), the blog, the creatives, the two settings screens, comments moderation, media and résumé upload | Creating, changing or revoking tokens (only the owner, in the admin); the admin password; the Better Auth reader accounts; deploys, environment variables, the database itself |
| One remote endpoint | A local stdio package (not built) |

## 2. Endpoint and transport

- `POST https://admin.chestlyace.online/mcp`, **Streamable HTTP**, JSON-RPC 2.0, in the
  same Next.js app (`app/sites/admin/mcp/route.ts`, passed through by `proxy.ts` on the
  admin host; no new host, no new DNS).
- **Stateless**: each request carries its token and is answered on its own (no session
  store), so it works on Vercel's functions. `GET /mcp` answers 405; there is no SSE
  stream (the server never needs to push).
- Library: the official **`@modelcontextprotocol/sdk`** (approved, D92), `McpServer` with
  a stateless `StreamableHTTPServerTransport`, tool inputs described with Zod (already a
  dependency). Nothing else is added.
- A request body is limited to 12 MB (an image sent as base64); a response is capped at
  200 KB of text (lists are paged).

## 3. Authentication: API tokens

The owner opens **Settings → Agent access** in the admin (§7) and creates a **token**:
a name ("Claude Desktop"), a set of **scopes**, an optional expiry (30, 90, 365 days or
none). The token (`cmcp_` + 32 random bytes, base64url) is **shown once**; only its
SHA-256 hash and its first 8 characters (to recognise it) are stored. The agent sends
`Authorization: Bearer cmcp_…`. A token can be revoked at any time (it stops working at
once) and shows when it was last used.

Table `agent_tokens` (migration 0012): `id`, `name`, `token_hash` (unique), `prefix`,
`scopes` (`text[]`), `expires_at`, `revoked_at`, `last_used_at`, `created_at`.
Table `agent_activity`: `id`, `token_id` (set null on delete), `token_name` (copied),
`tool`, `ok` (bool), `summary` (≤200 chars: "Updated project acme-site"), `error`
(≤300 chars), `at`. Rows older than 90 days are removed when a new row is written.

A wrong, revoked or expired token gets `401` with `WWW-Authenticate: Bearer`. A call
beyond the token's scopes gets a tool error (`isError: true`, "This token cannot delete").
**Rate limit**: 120 requests a minute per token and 30 writes a minute (the contact
form's in-memory limiter), `429` with `Retry-After`.

## 4. Scopes and guard rails

| Scope | Allows |
|---|---|
| `read` | Every list/get tool, the guides, `whoami` (always included) |
| `write` | Create and update (as a draft where the resource has a published switch: a new blog post, project, piece or event is created **unpublished** unless the token also has `publish`) |
| `publish` | Set `isPublished`/`status: published`, publish or unpublish a post, publish the French version, turn the newsletter on |
| `delete` | Delete anything (and hide/restore/delete comments) |
| `media` | Upload images and the résumé |

Guard rails on top of the scopes:

1. **Deletes are confirmed by name.** `*_delete` takes `confirm`, which must equal the
   item's title/slug/name exactly, else the call fails and says what to send. Deleting a
   whole table's worth is impossible (one item per call).
2. **Nothing goes live by accident.** Without `publish` an agent can write everything
   but the owner presses publish.
3. **Same validation as the admin.** Every write goes through the same functions
   (`lib/admin/api.ts`, `blogApi.ts`, strict Zod schemas): the rules, limits and error
   messages are the admin's, so an agent cannot store what the admin would refuse.
4. **Every write revalidates** the cache tags (`portfolio`, `blog`, `creatives`) exactly
   as the admin does.
5. **Everything is logged** and shown in the Activity screen (§7).
6. **No secrets leave**: tokens, hashes, reader emails and the password never appear in a
   tool result (comments show the reader's name only).

## 5. Tools

Tool names are `snake_case`, the arguments and results are JSON, errors are readable text
the agent can act on (field → message, like the admin's 422).

**General**

| Tool | Does |
|---|---|
| `whoami` | The token's name, scopes and expiry; the owner's site URLs |
| `list_resources` | Every resource with its fields, limits and which are translatable (the schemas, described) |
| `get_guide` | A guide as text: `blog_markdown` (every block's syntax, from `docs/blog-markdown.md`), `languages` (how French works), `images` (sizes and uses) |

**Content resources.** For each of: `projects`, `skills`, `experience` (journey),
`volunteering`, `certifications`, `services`, `faq`, `socials`, `design_pieces`,
`photo_events`, `creative_services`, `creative_faqs` the tools:

| Tool | Does | Scope |
|---|---|---|
| `<r>_list` | The items, in order, with id, title, status and (for translatable resources) whether French exists; paged | read |
| `<r>_get` | One item, complete, including `translations.fr` | read |
| `<r>_create` | Creates an item from the schema's fields | write (+ publish to be live) |
| `<r>_update` | Changes the given fields only | write (+ publish for the published switch) |
| `<r>_set_published` | Puts an item live or hides it (resources with a switch) | publish |
| `<r>_delete` | Deletes (needs `confirm`: the item's name) | delete |
| `<r>_reorder` | Sets the order from a list of ids (resources with an order) | write |

`profile_get` / `profile_update` (one row, French included, résumé address). Settings:
`creatives_settings_get/update`, `newsletter_settings_get/update`.

**Blog**

| Tool | Does | Scope |
|---|---|---|
| `blog_list` / `blog_get` | Posts with status, tags, French status; one post with its markdown | read |
| `blog_create` / `blog_update` | Title, slug, description, tags, cover, markdown content, series, canonical, `translations.fr` (title, description, content, cover alt, series, `published`) | write |
| `blog_publish` / `blog_unpublish` | Status | publish |
| `blog_validate` | Checks markdown with the block rules and returns the problems, without saving | read |
| `blog_duplicate` / `blog_delete` | A draft copy; delete | write / delete |
| `blog_comments_list` | Comments (name, text, status, likes, reports) with the post, filterable | read |
| `blog_comment_hide` / `_restore` / `_delete` | Moderation | delete |

**Media**

| Tool | Does | Scope |
|---|---|---|
| `media_upload_from_url` | Fetches an `https` image (≤10 MB, image types only) and uploads it to Cloudinary for a `use` (`project`, `logo`, `profile`, `badge`, `blog`, `creatives`, …); returns the hosted URL, width and height | media |
| `media_upload_base64` | The same from base64 data and a file name | media |
| `resume_upload` | Uploads a PDF (≤5 MB) and, optionally, sets it as the profile's résumé (or its French one) | media |

Uploads use the admin's signature logic and folders (`lib/admin/upload.ts`), so the
files land exactly where the admin's uploads do.

**Resources and prompts.** The guides are also exposed as MCP **resources**
(`guide://blog-markdown`, `guide://languages`) and there are two **prompts**
(`write_blog_post`, `add_project`) that tell an agent the order of work (read the guide,
upload the cover, create as a draft, validate, ask the owner to publish).

## 6. How the code is arranged

- `lib/mcp/server.ts` builds the `McpServer` for a token: registers only the tools the
  token's scopes allow (a tool outside them is not listed), each wrapped to log and rate
  limit.
- `lib/mcp/tools/*.ts`: `general`, `content` (generated from one table of resources and
  the existing admin config/schemas, so a new admin resource is one line), `blog`,
  `media`, `settings`.
- `lib/mcp/tokens.ts` (create, hash, verify, revoke), `lib/mcp/activity.ts`.
- Tool handlers call the **same functions** as the admin's API routes; the routes and the
  tools are two doors on one set of rules.

## 7. In the admin

**Settings → Agent access**: the token list (name, scopes as chips, prefix, created, last
used, expires, a Revoke button with a confirmation), a **New token** form (name, scope
switches with plain-language help, expiry) that shows the token once with a Copy button
and the connection snippet (URL and the header), and **Activity**: the latest 200 calls
(time, token, tool, ok/error, summary) with a filter by token. Plain admin styling
(§13.20–13.25), English only.

## 8. Testing

Unit: token creation/verification (hash, expiry, revocation), scope checks, the `confirm`
rule, the rate limiter, the tool registry per scope. Integration (PGlite): each tool group
through a real `McpServer` and the SDK's in-memory client (create → list → update →
delete for every resource; the blog's markdown validation; comments moderation;
validation errors are the admin's). End to end: the SDK's HTTP client against a built
server, with a real token created in the admin: a post is written, a picture uploaded
(Cloudinary stubbed), a project added, everything shows on the sites after the
revalidation, and a revoked token stops working.

## 9. Docs for the owner

`launch.md` gets a section: how to create a token, how to add the server to Claude
Desktop / Claude Code / Cursor (the URL and header), what each scope means, how to revoke,
and what the Activity screen shows.

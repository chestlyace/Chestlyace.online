# Blog markdown

The format posts are stored in (`blog_posts.content`, `content-schema.md` §4), what
the renderer understands, and how it maps to and from DEV (dev.to). You never have
to type any of it: the admin's block editor (`design.md` §13.48) writes it for you
and its **Markdown** tab shows it. This page is the contract between the editor,
the renderer, the importer and the exporter.

## 1. The format

Plain **CommonMark + GitHub-flavoured markdown** (paragraphs, `##`–`####`
headings, emphasis, links, lists, blockquotes, tables, images, inline code,
fenced code), plus **custom blocks**: a fenced block whose first word is a block
name. The page title is the post's `title`, so the body starts at `##`.

````text
```name key=value key="value with spaces"
the block's body, in the format below
```
````

- The fence line may carry **attributes**: `key=value` or `key="a value"`.
- A block's body is plain text in the format of its section below. Inline
  markdown (bold, links, code) works wherever the body says "text".
- An unknown block name renders as an ordinary code block and the editor warns.
- Language fences (` ```ts `, ` ```bash `, …) are ordinary highlighted code
  (`design.md` §13.30). Add `title="proxy.ts"`, `showLineNumbers` or
  `{2,4-6}` (highlighted lines) on the fence line as needed.

## 2. Blocks

### `callout`

````text
```callout type=tip title="Optional title"
Text, **with** inline markdown.
```
````

`type` is `note` (default), `tip` or `warning`. Visual: `design.md` §13.31.

### `steps`

Items are separated by a line containing only `---`. An item is a `## Title`
line, an optional `icon: name` line (a Lucide icon name, or `brand:github` for a
brand logo), then the text.

````text
```steps
## Two accounts, zero problems
icon: user-group
Set up a second config directory for client work.
---
## The wrong account, again
icon: triangle-alert
Opened a client project and got my personal account.
```
````

Visual: `design.md` §13.38.

### `compare`

An optional `title:` line, then table rows with the header first. `highlight: 3`
(optional, a line before the rows) marks the 3rd column (counting the first, label column) as the recommended one.

````text
```compare
title: Manual switching vs routing by directory
highlight: 3
| Aspect | Aliases | Directory routing |
| Commands to remember | Two or more | Just `claude` |
| Mental overhead | Constant | None |
```
````

Visual: `design.md` §13.39. (A plain GFM table stays a plain table, §13.29.)

### `filetree`

One entry per line, drawn as `tree` prints it (`├──`, `└──`, `│`) or indented by
two spaces. A folder ends with `/`. `# text` after two spaces is a note on that
entry; a leading `+ ` highlights it.

````text
```filetree
~/
├── .claude-acme/  # The Acme account
├── .claude-personal/  # The default
└── Projects/
    └── AcmeCorp/  # Everything in here uses Acme
```
````

Visual: `design.md` §13.40.

### `typewriter`

Code that types itself out, with a caption for chosen lines. `lang` (required) and
`title` (a file name) are attributes. A caption follows the code after two spaces,
`// @`, and a space.

````text
```typewriter lang=bash title=".zshrc"
claude() {                      // @ Same name as the binary, so this function wins
    case "$PWD/" in             // @ Match on the current directory
```
````

Visual: `design.md` §13.41.

### `codegroup`

Tabs of code. Each tab starts with a line `--- language file-name` (the file name
is optional).

````text
```codegroup
--- bash claude-vscode-config-wrapper
#!/bin/bash
REAL_CLAUDE="$1"
--- json settings.json
{ "claudeCode.claudeProcessWrapper": "..." }
```
````

Visual: `design.md` §13.42.

### `diff`

`lang` and `title` attributes as on `typewriter`. Lines starting `+ ` are added,
`- ` removed, two spaces unchanged.

````text
```diff lang=bash title="wrapper.sh"
- claude() {
+ #!/bin/bash
    case "$PWD/" in
```
````

Visual: `design.md` §13.43.

### `terminal`

A terminal window. A line starting `$ ` is a typed command; any other line is the
output that follows it; a line starting `# ` is a dim comment. `title` is optional.

````text
```terminal title="zsh"
$ cd ~/Projects/AcmeCorp/some-project
$ echo $CLAUDE_CONFIG_DIR
/Users/alex/.claude-acme
```
````

Visual: `design.md` §13.44.

### `flow`

A canvas of boxes and arrows (an architecture diagram). A node is
`[id|key:value|…] Label`; an arrow is `from --> to : optional label`.

| Key | Meaning |
|---|---|
| `icon` | A Lucide icon name, or `brand:name` for a brand logo |
| `style` | `blue`, `green`, `orange`, `purple`, `teal`, `red`, `gray` |
| `desc` | A line under the label |
| `pos` | `x,y` on the canvas (the editor sets it when you drag a box) |
| `group` | This node is a container for other nodes (`dir:h` or `dir:v` lays its children out) |
| `parent` | The id of the group this node sits in |

````text
```flow
[org|icon:cloud|style:teal|desc:The whole company|pos:240,0] Organization
[folder|icon:folder|style:blue|pos:240,130] Folders
[proj|group|dir:h|style:green|pos:20,290] production
[api|icon:server|style:orange|parent:proj|desc:The app] api

org --> folder
folder --> api : contains
```
````

Visual: `design.md` §13.45.

### `quiz`

Questions are separated by a line containing only `---`. `Q:` is the question,
each option starts with `) ` (wrong) or `*) ` (right; exactly one), and `E:` is the
explanation shown after answering.

````text
```quiz
Q: Which variable picks the account?
) A command-line flag
*) CLAUDE_CONFIG_DIR
) The last account you logged into
E: CLAUDE_CONFIG_DIR points the tool at a config directory with its own login.
```
````

Visual: `design.md` §13.46.

### `session`

An agent session (Claude Code). The body is empty; the session itself is stored
separately (`agent_sessions`, uploaded and redacted in the editor).

````text
```session id=4f9c1a from=3 to=18 title="Refactoring the proxy"
```
````

`from` and `to` are the first and last turns shown (default: all). Visual:
`design.md` §13.47.

### Images

`![alt text](https://…/image.webp "Optional caption")`. Add `#wide` to the address
(`…/image.webp#wide`) to let it break out of the reading column on wide screens.
An image needs alt text; a purely decorative one says so with `#decorative`
(`![](…/image.webp#decorative)`), and its alt text is then empty. The renderer
removes both marks from the address. An image with neither alt text nor
`#decorative` fails the editor's check.

## 3. Importing from DEV

The importer reads a DEV article's `body_markdown` and metadata through the Forem
API (`GET /api/articles?username=…`, `GET /api/articles/{id}`; no key needed for
published articles) and creates a **draft**:

| In the DEV article | Becomes |
|---|---|
| Markdown, fenced code, tables, images | The same, unchanged |
| `title`, `description`, `tags` (up to 4), `cover_image`, `series`, `canonical_url`, `published_at` | The matching post fields; the DEV article's id and address are stored (`devto_id`, `devto_url`) |
| `{% embed URL %}`, `{% link URL %}`, `{% youtube ID %}`, `{% github user/repo %}` | A paragraph with a link |
| `{% details Summary %}…{% enddetails %}` | A `callout` (`note`) titled with the summary |
| Any other liquid tag | The tag kept as an inline code span, and a warning in the import report |
| Images hosted on DEV's CDN | Left as they are, with a note offering to copy them to Cloudinary |

Nothing is published by the import; you review each draft in the editor.

## 4. Exporting to DEV

"Publish to DEV" sends the post through `POST /api/articles` (or
`PUT /api/articles/{id}` when the post was imported or exported before), with your
DEV API key held as a server secret. DEV only knows standard markdown, so custom
blocks are written out as their plain equivalents:

| Block | Exported as |
|---|---|
| `steps` | A numbered `### 1. Title` sequence, text under each |
| `compare` | A GFM table, the `title` as a bold line above it |
| `filetree` | A ` ```text ` block (notes as trailing `# …`) |
| `typewriter` | A normal code fence of its language (captions as comments) |
| `codegroup` | One code fence per tab, each preceded by a bold file-name line |
| `diff` | A ` ```diff ` fence |
| `terminal` | A ` ```console ` fence |
| `flow` | A PNG snapshot of the canvas (uploaded to Cloudinary at export time, wording in the final spec), with a text list of its boxes and arrows as the alt text |
| `quiz` | A "Quiz" heading and the questions with the right answers marked |
| `session` | A short summary and a link to the full replay on the blog |
| `callout` | A blockquote starting with the type in bold |

The exported article gets `canonical_url` set to the post here, so search engines
credit this blog, and a closing line "Originally published at …". It is created
as a **draft on DEV** unless you tick "Publish now".

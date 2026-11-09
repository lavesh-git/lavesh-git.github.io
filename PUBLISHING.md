# Publishing notebooks

Open **Notebooks/** as the Obsidian vault. Its parent **Notes/** remains the Git
repository connected to `lavesh-git/lavesh-git.github.io`.

## Current structure

```text
Notes/                               # Git repository root
  .git/
  _includes/
  _layouts/
  _config.yml
  index.html
  assets/                            # Website styles, scripts, and favicon
  Notebooks/                         # Open this folder in Obsidian
    .obsidian/                       # Local settings and installed plugins
    HLD/
      Index.md
      assets/                        # HLD drawings, images, and exports
    LLD/Index.md
    DSA/Index.md
    Networking/Index.md
    Database/Index.md
    OS & Linux/Index.md
```

Obsidian Git on desktop discovers the parent repository. Leave **Limit file
operations to the vault** disabled to manage the whole repository. Pull and push
operate on the parent repository and sync website files as well as notebooks.
Do not initialize a second Git repository inside `Notebooks/`.

The site lists notebook homepages with both `notebook_home: true` and `publish: true`.
Inside a notebook, nested folders become expandable chapters and subchapters.
Markdown files become note links. The selected note's H2/H3 headings appear
under it in the sidebar, linking directly to sections of that page.

## Add a notebook

Create a folder inside `Notebooks/` and add its `Index.md`:

```yaml
---
layout: note
title: Core Java
description: Language fundamentals and implementation notes.
notebook_home: true
icon: code
publish: true
color: violet
order: 7
permalink: /notebooks/core-java/
---
```

Git tracks the contents of `Notebooks/`, except `.obsidian/`, `.trash/`, and
`.DS_Store`. Existing visibility settings in each notebook's `Index.md` still
control which notebooks appear on the website. Other root folders and the
original root `Index.md` stay ignored.

## Choose icons and notebook visibility

Each notebook's `Index.md` has two editable properties:

```yaml
icon: architecture
publish: true
```

Choose a line icon by name; the same SVG appears on the card and in the sidebar:

| Icon | Represents |
| --- | --- |
| `architecture` | HLD: system architecture |
| `code` | LLD: implementation and code |
| `server` | Backend development: services and servers |
| `browser` | Frontend development: browser interfaces |
| `algorithm` | DSA: connected data structures |
| `network` | Networking: connected machines |
| `database` | Database: storage cylinder |
| `terminal` | OS & Linux: terminal prompt |
| `book` | General notebook |

Missing or unknown icon names fall back to `book`. Set `publish: false` to hide the notebook
from both lists. Notebooks without `publish: true` are hidden by default.
Use actual YAML booleans (`true` or `false`), not quoted strings.

`publish` controls discovery in the UI, not privacy: direct page URLs and tracked
files in this public repository remain accessible. The separate Jekyll property
`published: false` prevents an individual page from being generated.

## Add chapters and notes

Create a note at any depth, for example `HLD/Storage/Indexes/B-Trees.md`:

```yaml
---
layout: note
title: B-Trees
order: 1
permalink: /notes/b-trees/
---
```

Chapters are derived from folders, not URL paths. No separate menu file is needed.
`order` is optional; otherwise notes use natural alphabetical order (2 before 10).
Folders use their earliest note's order. Empty folders do not appear as chapters.
Use `published: false` for drafts, but remember that **tracked source files are
still public in this GitHub repository**. Keep private notes outside this public repository.

## Edit diagrams and publish

1. Edit notes in their notebook folders in Obsidian.
2. Create or open an Excalidraw drawing in the relevant notebook’s `assets/` folder.
3. Save the drawing (Cmd+S) to refresh its adjacent SVG automatically.
4. Review changes in Obsidian Git, then commit and push to `master`.
5. GitHub Pages builds the site automatically from `master` / root.

The website displays the exported SVG; the drawing remains editable in Obsidian.
Keep each notebook self-contained: place its drawing sources, exported SVGs,
images, and other attachments inside that notebook's `assets/` folder. For
example, use `HLD/assets/` for HLD notes and `LLD/assets/` for LLD notes.
The root `assets/` folder is reserved for shared website code and the favicon.
Use vault-root Markdown links such as `![Diagram](/HLD/assets/example.svg)`
inside Obsidian. The site converts these paths to `/Notebooks/HLD/assets/...`
when rendering HTML, so they work with custom permalinks. Keep the `Notebooks/`
prefix out of Markdown image paths. Obsidian deep links use `vault=Notebooks`.
The former System Design notebook URL redirects to `/notebooks/hld/`.

## Validation

From the repository root, run `node scripts/test-navigation.js` for the folder-tree and URL checks.
GitHub Pages validates the Jekyll build. Notebook links also work without
JavaScript; expandable folder grouping and the current-page outline enhance them.

## Study Hub

`Notebooks/Study Hub/Weeks/` contains **one Markdown note per week**. Each
question is a row in that week's Discoveries table. There are no per-card files
or native Bases to maintain. Detailed explanations and diagrams stay in your
existing notebook notes.

In Obsidian, set **Settings → Templates → Template folder location** to
`Study Hub/Templates`. Create `Study Hub/Weeks/2026-W46.md` (using the appropriate
ISO week), then insert **Weekly Review**. Add rows to its table:

```markdown
| Question / topic | Subject | Status | Source | Tags | Related notes | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Cache stampede | HLD | Unread | https://example.com/article | #caching, #interview | [[HLD/Caching/Cache Invalidation]] | High |
```

Use **Unread**, **In progress**, **Done**, or **Revisit** for Status. Leave Subject,
Status, and Priority blank to use Inbox, Unread, and Normal. Blank question rows
are ignored. Columns may be reordered; Priority is optional. The parser also
accepts optional Notes and Captured columns. Keep Question / topic and Subject
as column headings. The main template only needs the seven columns above.

Use Obsidian links in Related notes. Separate multiple links with `<br>`. In
Markdown source, escape the pipe in an aliased link inside a table:
`[[HLD/Caching/Cache Invalidation\|Invalidation]]`. Markdown links also work.

The website turns these same table rows into subject and progress cards at
`/study/`, with search, topic and priority filters. Card titles open the original
row in the weekly table; related-note links open the notebook page. Backlog and
Revisit include rows from earlier weeks without copying them forward.

Editing happens locally in Obsidian. Refresh the preview after saving, then
review, commit, and sync through Git when ready. The website is read-only.
Place Study Hub attachments in `Study Hub/assets/`, using vault-root paths as
with the other notebooks. Templates and local Obsidian settings are excluded
from the generated website.

The current week includes 45 entries imported from the Study Trello export on
4 November 2026: 19 DSA, 10 LLD, 7 HLD, and 9 Other. URL-only LeetCode cards keep their original problem URLs. Trello card
links are intentionally omitted; use original article or problem URLs as sources.
No study completion or priority was inferred. The raw export, board members, and account metadata are not
included in the repository. Previous demo and test content has been removed.

## Local website preview

A small read-only preview renders this site's Liquid layouts, GFM Markdown,
and code highlighting. It rebuilds when you refresh after editing a source file.
It binds only to `127.0.0.1` and serves rendered pages and assets, never the raw
repository or local Obsidian settings.

```sh
BUNDLE_GEMFILE=scripts/preview.Gemfile bundle install
BUNDLE_GEMFILE=scripts/preview.Gemfile bundle exec ruby scripts/preview.rb
```

Open `http://127.0.0.1:8765/study/`. Stop the preview with Ctrl+C. This preview
covers this repository's current templates; GitHub Pages remains the authority
for the production Jekyll build. Preview dependencies live in the separate
`scripts/preview.Gemfile` and do not change production dependencies.

Run `node scripts/test-study-hub.js` for the board filtering, ordering, ISO-week,
and URL checks, alongside the navigation checks above. Use `--build-only` with
the preview script to validate all rendered pages without starting a server.

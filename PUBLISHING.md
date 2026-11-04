# Publishing notebooks

The Obsidian **Notes** vault is connected to `lavesh-git/lavesh-git.github.io`.
The homepage lists notebooks. Each public notebook has its own top-level folder.

## Current structure

```text
Notes/
  System Design/
    Index.md                         # Notebook homepage
    Caching/
      Cache Aside Demo.md            # Chapter note; existing URL preserved
  DSA/
    Index.md                         # Empty notebook, ready for notes
  Published/assets/                  # Shared drawing sources and images
```

The site discovers notebook homepages from `notebook_home: true`.
Inside a notebook, nested folders become expandable chapters and subchapters.
Markdown files become note links. The selected note's H2/H3 headings appear
under it in the sidebar, linking directly to sections of that page.

## Add a notebook

Create a top-level folder, allow that folder in `.gitignore`, and add `Index.md`:

```yaml
---
layout: note
title: Core Java
description: Language fundamentals and implementation notes.
notebook_home: true
color: violet
order: 3
permalink: /notebooks/core-java/
---
```

The public-folder allowlist is intentional: adding a notebook to the website
should not accidentally publish unrelated personal notes or local settings.
The currently allowed notebook folders are `System Design/` and `DSA/`.
`.obsidian/`, the original root `Index.md`, and other root folders stay ignored.

## Add chapters and notes

Create a note at any depth, for example `System Design/Storage/Indexes/B-Trees.md`:

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
still public in this GitHub repository**. Keep private notes outside allowed folders.

## Edit diagrams and publish

1. Edit notes in their notebook folders in Obsidian.
2. Open `Published/assets/cache-aside.excalidraw.md` with the Excalidraw plugin.
3. Save the drawing (Cmd+S) to refresh its adjacent SVG automatically.
4. Review changes in Obsidian Git, then commit and push to `master`.
5. GitHub Pages builds the site automatically from `master` / root.

The website displays the exported SVG; the drawing remains editable in Obsidian.
Standard Markdown image links work in both the vault and the website.
The existing demo remains at `/notes/cache-aside/`.

## Validation

Run `node scripts/test-navigation.js` for the folder-tree and URL checks.
GitHub Pages validates the Jekyll build. Notebook links also work without
JavaScript; expandable folder grouping and the current-page outline enhance them.

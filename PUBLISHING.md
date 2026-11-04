# Publishing notes

This repository is the Git repository for the Obsidian **Notes** vault.
Only `Published/` and the explicitly allowed website files are tracked.
Other notes, `.obsidian/`, and local state are ignored by default.

## Edit and publish

1. Edit `Published/Cache Aside Demo.md` in Obsidian.
2. Edit `Published/assets/cache-aside.excalidraw.md` with the Excalidraw plugin.
3. Save the drawing (Cmd+S). Its per-file auto-export writes the adjacent SVG.
4. Review changes in Obsidian Git, then commit and push to `master`.
5. GitHub Pages builds the site automatically from `master` / root.

The website displays the exported SVG; it is not a live drawing editor.
The note uses standard Markdown image links for compatibility with both renderers.
Add new public notes under `Published/` with `layout: note`, a title, and a permalink.
Keep private notes outside `Published/`. Do not force-add ignored files.

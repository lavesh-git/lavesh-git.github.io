# Excalidraw exports

The Pages build runs `npm ci --prefix scripts/excalidraw` and then
`node scripts/excalidraw/export.cjs` before Jekyll. It converts vault-root
embeds such as `![[HLD/2 Databases/assets/Database_Indexes.excalidraw]]`
to SVGs alongside their editable `.excalidraw.md` files. These generated files
exist only in the build workspace; the drawing remains the source of truth.
Missing drawings, unsupported embedded images, and render failures fail the
build rather than silently publishing a broken image.

For a local preview, use Node 22 or newer, install the dependencies above, and
run the exporter in a disposable copy of the repository before starting
`scripts/preview.rb`. The renderer needs a local Chrome, Chromium, Edge or
Firefox; set `EXCALIDRAW_BROWSER_PATH` if it is not detected automatically.
The current exporter accepts vault-root paths. Obsidian-only embedded files
not present in the scene JSON need additional support before they can render.

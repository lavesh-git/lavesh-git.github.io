#!/usr/bin/env node
// Export drawings referenced by vault-root Obsidian embeds into temporary site assets.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { decompressFromBase64 } = require('lz-string');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const vault = path.join(root, 'Notebooks');
const cli = require.resolve('@excalidraw/cli/dist/main.js');

function* files(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(name);
    else if (entry.isFile()) yield name;
  }
}

const drawings = new Map();
for (const file of files(vault)) {
  if (!file.endsWith('.md') || file.endsWith('.excalidraw.md')) continue;
  const contents = fs.readFileSync(file, 'utf8');
  for (const match of contents.matchAll(/!\[\[([^\]|]+\.excalidraw(?:\.md)?)(?:\|[^\]]*)?\]\]/gi)) {
    const target = match[1].replace(/\.md$/i, '').replace(/^\//, '');
    const source = path.resolve(vault, target + '.md');
    if (!source.startsWith(vault + path.sep)) throw Error(`Drawing path outside vault: ${target}`);
    if (!fs.existsSync(source)) throw Error(`Drawing not found: ${target} (referenced by ${path.relative(root, file)})`);
    drawings.set(target, source);
  }
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-excalidraw-'));
try {
  for (const [target, source] of drawings) {
    const text = fs.readFileSync(source, 'utf8');
    const block = text.match(/```(compressed-json|json)\s*\n([\s\S]*?)```/);
    if (!block) throw Error(`No Excalidraw scene in ${target}`);
    const json = block[1] === 'compressed-json' ? decompressFromBase64(block[2].replace(/\s/g, '')) : block[2];
    if (!json) throw Error(`Cannot decompress ${target}`);
    const scene = JSON.parse(json);
    if (!Array.isArray(scene.elements)) throw Error(`Invalid scene: ${target}`);
    for (const element of scene.elements) {
      if (!element.isDeleted && element.type === 'image' && (!element.fileId || !scene.files?.[element.fileId])) {
        throw Error(`${target} contains an embedded image that cannot be exported from the scene`);
      }
    }
    const input = path.join(temporary, 'scene.excalidraw');
    const output = path.join(vault, target + '.svg');
    fs.writeFileSync(input, JSON.stringify(scene));
    console.log(`Exporting ${target}`);
    execFileSync(process.execPath, [cli, 'render', input, '--out', output], { stdio: 'inherit' });
    if (!fs.existsSync(output) || fs.statSync(output).size === 0) throw Error(`Empty export: ${target}`);
  }
  console.log(`Exported ${drawings.size} Excalidraw drawing(s).`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

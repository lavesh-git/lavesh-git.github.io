(function () {
  'use strict';

  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

  function compareEntries(a, b) {
    return a.order - b.order || collator.compare(a.title, b.title);
  }

  // The source folder, rather than the permalink, owns a note's notebook.
  function buildTree(notes, folder) {
    const root = { children: new Map() };
    for (const note of notes) {
      const parts = note.path.split('/');
      if (parts.shift() !== folder || !parts.length || /\.excalidraw\.md$/i.test(note.path)) continue;
      if (!note.url.startsWith('/') || note.url.startsWith('//')) continue;
      const order = Number.isFinite(Number(note.order)) ? Number(note.order) : 9999;
      let parent = root;
      for (const part of parts.slice(0, -1)) {
        const key = 'folder:' + part;
        if (!parent.children.has(key)) {
          parent.children.set(key, { title: part, order, children: new Map() });
        }
        parent = parent.children.get(key);
        parent.order = Math.min(parent.order, order);
      }
      parent.children.set('note:' + note.path, { ...note, order });
    }
    // Numbered sibling notes retain their OneNote parent/child hierarchy.
    // Resolve within each folder so identical numbers in other notebooks stay separate.
    function nestNumberedNotes(node) {
      const numbered = new Map();
      for (const entry of node.children.values()) {
        if (entry.children) nestNumberedNotes(entry);
        if (!entry.path) continue;
        const match = entry.title.match(/^(\d+(?:\.\d+)+)\s/);
        if (match) numbered.set(match[1], entry);
      }
      for (const [number, entry] of numbered) {
        const parts = number.split('.');
        parts.pop();
        let parent;
        while (parts.length > 1 && !parent) {
          parent = numbered.get(parts.join('.'));
          if (!parent) parts.pop();
        }
        if (!parent) continue;
        if (!parent.children) parent.children = new Map();
        parent.children.set('note:' + entry.path, entry);
        node.children.delete('note:' + entry.path);
      }
      // A folder's index is available from the folder label itself.
      for (const [key, entry] of node.children) {
        if (entry.path && entry.path.split('/').pop() === 'Index.md' && node !== root) {
          node.url = entry.url;
          node.children.delete(key);
        }
      }
    }
    nestNumberedNotes(root);
    function sortTree(node) {
      return Array.from(node.children.values()).sort(compareEntries).map(entry => {
        return entry.children ? { ...entry, children: sortTree(entry) } : entry;
      });
    }
    return sortTree(root);
  }

  function containsPage(node, url) {
    return node.url === url || Boolean(node.children && node.children.some(child => containsPage(child, url)));
  }

  function noteLink(node, currentUrl) {
    const link = document.createElement('a');
    link.textContent = node.title;
    link.href = node.url;
    if (node.url === currentUrl) link.setAttribute('aria-current', 'page');
    return link;
  }

  function appendOutline(item, node, options) {
    if (!options.showOutline || node.url !== options.currentUrl) return;
    const headings = document.querySelectorAll('.note-content h2[id], .note-content h3[id]');
    if (!headings.length) return;
    const outline = document.createElement('ul');
    outline.className = 'page-outline';
    for (const heading of headings) {
      const row = document.createElement('li');
      const anchor = document.createElement('a');
      anchor.textContent = heading.textContent;
      anchor.href = '#' + encodeURIComponent(heading.id);
      if (heading.tagName === 'H3') anchor.className = 'subheading';
      row.append(anchor);
      outline.append(row);
    }
    item.append(outline);
  }

  // The same numbered tree powers the sidebar and notebook contents.
  function renderTree(nodes, options) {
    const list = document.createElement('ul');
    list.className = 'chapter-tree';
    for (const node of nodes) {
      const item = document.createElement('li');
      if (node.children) {
        const group = document.createElement('details');
        group.open = options.expandAll || containsPage(node, options.currentUrl);
        const summary = document.createElement('summary');
        if (node.url) summary.append(noteLink(node, options.currentUrl));
        else summary.textContent = node.title;
        group.append(summary);
        appendOutline(group, node, options);
        group.append(renderTree(node.children, options));
        item.append(group);
      } else {
        item.append(noteLink(node, options.currentUrl));
        appendOutline(item, node, options);
      }
      list.append(item);
    }
    return list;
  }

  function initialise() {
    const source = document.getElementById('library-data');
    if (!source) return;
    let data;
    try {
      data = JSON.parse(source.textContent);
    } catch (error) {
      // Keep the server-rendered links usable if data cannot be read.
      console.error('Could not load notebook navigation.', error);
      return;
    }
    const folder = data.currentPath.split('/')[0];
    const notebook = data.notebooks.find(entry => entry.folder === folder);
    if (notebook) {
      const tree = buildTree(data.notes, folder);
      if (tree.length) {
        const sidebar = document.getElementById('chapter-tree');
        const contents = document.getElementById('notebook-contents');
        if (sidebar) sidebar.replaceChildren(renderTree(tree, {
          currentUrl: data.currentUrl,
          expandAll: notebook.url === data.currentUrl && !data.chapterIndex,
          showOutline: true
        }));
        if (contents) contents.replaceChildren(renderTree(tree, {
          currentUrl: data.currentUrl,
          expandAll: !data.chapterIndex,
          showOutline: false
        }));
      }
    }
    const filter = document.getElementById('notebook-filter');
    const filterArea = document.querySelector('.library-filter');
    if (filter && filterArea) {
      const cards = Array.from(document.querySelectorAll('.notebook-grid .notebook-card'));
      const status = filterArea.querySelector('.filter-status');
      filterArea.hidden = false;
      filter.addEventListener('input', () => {
        const query = filter.value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const card of cards) {
          const matches = card.textContent.toLocaleLowerCase().includes(query);
          card.hidden = !matches;
          if (matches) visible++;
        }
        status.textContent = query ? `${visible} of ${cards.length} notebooks shown` : '';
      });
    }
    const panel = document.querySelector('.navigation-panel');
    const mobile = window.matchMedia('(max-width: 800px)');
    if (panel) {
      panel.open = !mobile.matches;
      mobile.addEventListener('change', event => { panel.open = !event.matches; });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildTree, containsPage };
  }
  if (typeof document !== 'undefined') initialise();
})();

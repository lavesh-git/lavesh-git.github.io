(function () {
  'use strict';
  const SUBJECTS = ['Inbox', 'DSA', 'LLD', 'HLD', 'Networking', 'Database', 'OS & Linux', 'Other'];
  const STATUSES = ['Unread', 'In progress', 'Done', 'Revisit'];

  function isoWeek(value) {
    const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const year = date.getUTCFullYear();
    const day = Math.floor((date - new Date(Date.UTC(year, 0, 1))) / 86400000);
    return year + '-W' + String(Math.ceil((day + 1) / 7)).padStart(2, '0');
  }

  function safeSource(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch (_) { return null; }
  }

  function internalUrl(value) {
    return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : null;
  }

  function noteReference(target, alias, notes) {
    const [rawPath, heading] = target.split('#');
    const path = rawPath.replace(/^\//, '').replace(/\.md$/, '');
    const exact = notes.find(note => note.path === path);
    const matches = notes.filter(note => note.path.split('/').pop() === path);
    const note = exact || (matches.length === 1 && matches[0]);
    const url = note && internalUrl(note.url);
    return { label: alias || (note && note.title) || path.split('/').pop(), url: url ? url + (heading ? '#' + encodeURIComponent(heading.toLowerCase().replace(/\s+/g, '-')) : '') : null };
  }

  function wikiReferences(text, notes) {
    return Array.from(text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g), match => noteReference(match[1], match[2], notes));
  }

  function rowAnchor(title, occurrence) {
    const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'discovery';
    return 'study-' + slug + (occurrence > 1 ? '-' + occurrence : '');
  }

  // Read values from rendered Markdown cells, so escaped pipes, links and formatting
  // are handled by the same Markdown renderer as the rest of the site.
  function parseRow(fields, review, notes) {
    const value = key => ((fields[key] || {}).text || '').trim();
    const sample = /\s*\(example\)$/i.test(value('question')) || /^(true|yes)$/i.test(value('example'));
    const title = value('question').replace(/\s*\(example\)$/i, '').trim();
    if (!title || title === '—') return null;
    const sourceCell = fields.source || {};
    const sourceLink = (sourceCell.links || []).find(link => safeSource(link.href));
    const source = safeSource(sourceLink ? sourceLink.href : value('source')) || '';
    const relatedCell = fields.related || {};
    const related = wikiReferences(value('related'), notes);
    (relatedCell.links || []).forEach(link => {
      const url = internalUrl(link.href);
      if (url) related.push({ label: link.label, url });
    });
    if (!related.length && value('related') && value('related') !== '—') related.push({ label: value('related'), url: null });
    const status = STATUSES.find(status => status.toLowerCase() === value('status').toLowerCase()) || value('status') || 'Unread';
    const priority = ['High', 'Normal', 'Low'].find(priority => priority.toLowerCase() === value('priority').toLowerCase()) || 'Normal';
    return {
      title, week: review.week, subject: value('subject') || 'Inbox', status, priority,
      tags: value('tags').split(/[,\s]+/).map(tag => tag.replace(/^#/, '')).filter(tag => tag && tag !== '—'),
      related, source, sourcePlatform: sourceLink ? sourceLink.label : (source ? new URL(source).hostname : ''),
      description: value('notes'), captured: value('captured'), sample
    };
  }

  function tableCellText(cell) {
    const copy = cell.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return copy.textContent;
  }

  function tableItems(root, review, notes) {
    const aliases = { 'question / topic': 'question', 'question': 'question', 'topic': 'question', 'subject': 'subject', 'status': 'status', 'source': 'source', 'tags': 'tags', 'related notes': 'related', 'priority': 'priority', 'notes': 'notes', 'captured': 'captured', 'example': 'example' };
    const items = [];
    const occurrences = new Map();
    root.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th'), cell => aliases[cell.textContent.trim().toLowerCase()]);
      if (!headers.includes('question') || !headers.includes('subject')) return;
      table.querySelectorAll('tbody tr').forEach(row => {
        const fields = {};
        Array.from(row.cells).forEach((cell, index) => {
          if (headers[index]) fields[headers[index]] = { text: tableCellText(cell), links: Array.from(cell.querySelectorAll('a'), link => ({ label: link.textContent, href: link.getAttribute('href') })) };
        });
        const item = parseRow(fields, review, notes);
        if (!item) return;
        const key = rowAnchor(item.title);
        const occurrence = (occurrences.get(key) || 0) + 1;
        occurrences.set(key, occurrence);
        row.id = rowAnchor(item.title, occurrence);
        item.id = review.week + '/' + row.id;
        item.url = internalUrl(review.url) ? review.url + '#' + encodeURIComponent(row.id) : null;
        items.push(item);
      });
    });
    return items;
  }

  function selectItems(items, state) {
    const query = (state.query || '').trim().toLowerCase();
    return items.filter(item => {
      if (['subjects', 'progress'].includes(state.view) && item.week !== state.week) return false;
      if (state.view === 'backlog' && ['Done', 'Revisit'].includes(item.status)) return false;
      if (state.view === 'revisit' && item.status !== 'Revisit') return false;
      if (state.tag && !(item.tags || []).includes(state.tag)) return false;
      if (state.priority && item.priority !== state.priority) return false;
      const searchable = [item.title, item.description, item.subject, item.sourcePlatform, item.source,
        ...(item.tags || []), ...(item.related || []).map(note => note.label)].join(' ').toLowerCase();
      return !query || searchable.includes(query);
    }).sort((a, b) => (b.captured || '').localeCompare(a.captured || '') || a.title.localeCompare(b.title));
  }

  function groupItems(items, view) {
    const property = view === 'progress' ? 'status' : 'subject';
    const order = property === 'status' ? STATUSES : SUBJECTS;
    const groups = new Map();
    if (property === 'status') order.forEach(label => groups.set(label, []));
    items.forEach(item => {
      const label = item[property] || (property === 'status' ? 'Unread' : 'Inbox');
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });
    return Array.from(groups, ([label, entries]) => ({ label, items: entries })).sort((a, b) => {
      const index = label => order.includes(label) ? order.indexOf(label) : order.length;
      return index(a.label) - index(b.label) || a.label.localeCompare(b.label);
    });
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function statusClass(status) {
    return { 'Unread': 'unread', 'In progress': 'in-progress', 'Done': 'done', 'Revisit': 'revisit' }[status] || 'unread';
  }

  function relatedLinks(links) {
    const row = element('div', 'study-related');
    (links || []).forEach(note => {
      const url = internalUrl(note.url);
      const link = element(url ? 'a' : 'span', 'study-related-link', note.label);
      if (url) link.href = url;
      else link.title = 'No published page found for this note';
      row.append(link);
    });
    return row;
  }

  function card(item) {
    const article = element('article', 'study-card');
    const meta = element('div', 'study-card-meta');
    meta.append(element('span', 'study-status ' + statusClass(item.status), item.status));
    if (item.priority === 'High') meta.append(element('span', 'study-priority', 'High priority'));
    if (item.sample) meta.append(element('span', 'study-sample', 'Example'));
    const heading = element('h3');
    const url = internalUrl(item.url);
    const title = element(url ? 'a' : 'span', '', item.title);
    if (url) title.href = url;
    heading.append(title);
    article.append(meta, heading);
    if (item.description) article.append(element('p', 'study-card-description', item.description));
    if (item.tags && item.tags.length) {
      const tags = element('div', 'study-tags');
      item.tags.forEach(tag => tags.append(element('span', 'study-tag', '#' + tag)));
      article.append(tags);
    }
    if (item.related && item.related.length) article.append(relatedLinks(item.related));
    const footer = element('div', 'study-card-footer');
    const source = safeSource(item.source);
    if (source) {
      const link = element('a', 'study-source', item.sourcePlatform + ' ↗');
      link.href = source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      footer.append(link);
    } else footer.append(element('span', '', 'Source not added'));
    footer.append(element('span', '', item.captured || item.week));
    article.append(footer);
    return article;
  }

  // Resolve wiki links only in prose, leaving code and existing anchors untouched.
  function resolveWikiLinks(data) {
    document.querySelectorAll('.study-review').forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.includes('[[') && !node.parentElement.closest('a, code, pre, script, style')) nodes.push(node);
      }
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        let last = 0;
        const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        let match;
        while ((match = regex.exec(node.textContent))) {
          fragment.append(document.createTextNode(node.textContent.slice(last, match.index)));
          const note = noteReference(match[1], match[2], data.notes);
          const link = element(note.url ? 'a' : 'span', '', note.label);
          if (note.url) link.href = note.url;
          fragment.append(link);
          last = match.index + match[0].length;
        }
        if (last) {
          fragment.append(document.createTextNode(node.textContent.slice(last)));
          node.replaceWith(fragment);
        }
      });
    });
  }

  function initialise() {
    const source = document.getElementById('study-data');
    if (!source) return;
    const data = JSON.parse(source.textContent);
    data.items = data.weeks.flatMap(review => {
      const parsed = new DOMParser().parseFromString(review.html || '', 'text/html');
      return tableItems(parsed, review, data.notes);
    });
    const currentReview = data.weeks.find(review => review.week === data.selectedWeek);
    if (currentReview) document.querySelectorAll('.study-review').forEach(root => tableItems(root, currentReview, data.notes));
    resolveWikiLinks(data);
    document.querySelectorAll('.study-review table').forEach(table => {
      const wrapper = element('div', 'study-table-scroll');
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', 'Weekly discoveries table');
      table.replaceWith(wrapper);
      wrapper.append(table);
    });
    if (window.location.hash.startsWith('#study-')) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) requestAnimationFrame(() => target.scrollIntoView());
    }
    const board = document.getElementById('study-board');
    if (!board) return;
    const week = document.getElementById('study-week');
    const weeks = Array.from(new Set([...data.items.map(item => item.week), ...data.weeks.map(review => review.week)]))
      .filter(value => /^\d{4}-W\d{2}$/.test(value)).sort().reverse();
    const currentWeek = isoWeek(new Date());
    if (data.selectedWeek && !weeks.includes(data.selectedWeek)) weeks.unshift(data.selectedWeek);
    weeks.forEach(value => {
      const option = element('option', '', value);
      option.value = value;
      week.append(option);
    });
    const state = { view: 'subjects', week: data.selectedWeek || (weeks.includes(currentWeek) ? currentWeek : weeks[0]), query: '', tag: '', priority: '' };
    week.value = state.week || '';
    const tag = document.getElementById('study-tag');
    Array.from(new Set(data.items.flatMap(item => item.tags))).sort().forEach(value => {
      const option = element('option', '', '#' + value);
      option.value = value;
      tag.append(option);
    });
    function render() {
      const items = selectItems(data.items, state);
      board.replaceChildren();
      if (!items.length) {
        board.append(element('p', 'study-empty', data.items.length ? 'No discoveries match these filters.' : 'Your discovery queue is ready. Add your first row to a weekly table in Obsidian.'));
      } else {
        groupItems(items, state.view).forEach(group => {
          const column = element('section', 'study-column');
          column.setAttribute('aria-label', group.label);
          const header = element('div', 'study-column-heading');
          header.append(element('h2', '', group.label), element('span', 'study-column-count', String(group.items.length)));
          column.append(header);
          group.items.forEach(item => column.append(card(item)));
          if (!group.items.length) column.append(element('p', 'study-column-empty', 'Nothing here yet.'));
          board.append(column);
        });
      }
      const allWeeks = ['backlog', 'revisit'].includes(state.view);
      week.disabled = allWeeks;
      const description = allWeeks ? 'all weeks' : (state.week || 'no week selected');
      const done = items.filter(item => item.status === 'Done').length;
      document.getElementById('study-summary').textContent = items.length + (items.length === 1 ? ' discovery' : ' discoveries') + ' · ' + description + (done ? ' · ' + done + ' done' : '');
      const review = data.weeks.find(entry => entry.week === state.week);
      const reviewLink = document.getElementById('study-review-link');
      reviewLink.hidden = allWeeks || !review || !internalUrl(review.url);
      if (!reviewLink.hidden) reviewLink.href = review.url;
      const openLocal = document.getElementById('study-open-local');
      if (openLocal) openLocal.href = 'obsidian://open?vault=Notebooks&file=' + encodeURIComponent(review ? review.path : 'Study Hub/Index.md');
      document.querySelectorAll('[data-study-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studyView === state.view)));
    }
    document.querySelectorAll('[data-study-view]').forEach(button => button.addEventListener('click', () => {
      state.view = button.dataset.studyView;
      render();
    }));
    week.addEventListener('change', () => { state.week = week.value; render(); });
    document.getElementById('study-search').addEventListener('input', event => { state.query = event.target.value; render(); });
    tag.addEventListener('change', () => { state.tag = tag.value; render(); });
    document.getElementById('study-priority').addEventListener('change', event => { state.priority = event.target.value; render(); });
    render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { isoWeek, safeSource, internalUrl, selectItems, groupItems, parseRow, rowAnchor, wikiReferences };
  if (typeof document !== 'undefined') initialise();
})();

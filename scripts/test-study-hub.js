'use strict';
const assert = require('assert');
const { isoWeek, safeSource, internalUrl, selectItems, groupItems } = require('../assets/study-hub');
const item = (id, week, status, subject, tags = [], priority = 'Normal') => ({ id, week, status, subject, tags, priority, title: id, captured: '2026-11-04', related: [] });
const items = [
  item('Intervals', '2026-W45', 'Unread', 'DSA', ['heaps'], 'High'),
  { ...item('Cache stampede', '2026-W45', 'In progress', 'HLD', ['caching']), related: [{ label: 'Cache-aside note' }] },
  item('Older question', '2026-W44', 'Unread', 'LLD'),
  item('Complete', '2026-W45', 'Done', 'HLD'),
  item('Revise', '2026-W44', 'Revisit', 'Other')
];
const state = { view: 'subjects', week: '2026-W45', query: '', tag: '', priority: '' };
assert.strictEqual(selectItems(items, state).length, 3);
assert.strictEqual(selectItems(items, { ...state, week: '2026-W44' }).length, 2);
assert.deepStrictEqual(selectItems(items, { ...state, tag: 'heaps', priority: 'High' }).map(x => x.id), ['Intervals']);
assert.deepStrictEqual(selectItems(items, { ...state, query: 'CACHE-ASIDE' }).map(x => x.id), ['Cache stampede']);
assert.strictEqual(selectItems(items, { ...state, query: 'nothing matches' }).length, 0);
assert.strictEqual(selectItems(items, { ...state, view: 'backlog' }).length, 3);
assert.deepStrictEqual(selectItems(items, { ...state, view: 'revisit' }).map(x => x.id), ['Revise']);
assert.deepStrictEqual(groupItems(selectItems(items, state), 'subjects').map(x => x.label), ['DSA', 'HLD']);
assert.deepStrictEqual(groupItems([], 'progress').map(x => x.label), ['Unread', 'In progress', 'Done', 'Revisit']);
assert.deepStrictEqual(groupItems([item('New', '2026-W45', 'Unread', 'Custom')], 'subjects').map(x => x.label), ['Custom']);
assert.strictEqual(safeSource('javascript:alert(1)'), null);
assert.strictEqual(safeSource('https://leetcode.com/problems/meeting-rooms-ii/'), 'https://leetcode.com/problems/meeting-rooms-ii/');
assert.strictEqual(internalUrl('//example.com'), null);
assert.strictEqual(internalUrl('/notes/cache-aside/'), '/notes/cache-aside/');
assert.strictEqual(isoWeek(new Date(2026, 10, 4)), '2026-W45');
assert.strictEqual(isoWeek(new Date(2021, 0, 1)), '2020-W53');
assert.strictEqual(isoWeek(new Date(2024, 11, 30)), '2025-W01');
assert.deepStrictEqual(selectItems([], state), []);
console.log('Study Hub checks passed: week boundaries, combined filters, cross-week backlog, revision queue, grouping, and safe URLs.');

const { parseRow, rowAnchor, wikiReferences } = require('../assets/study-hub');
const cell = (text, links = []) => ({ text, links });
const review = { week: '2026-W45', url: '/study/weeks/2026-W45/' };
const notes = [{path: 'HLD/Caching/Cache Aside Demo', title: 'Cache-aside', url: '/notes/cache-aside/'}];
assert.strictEqual(parseRow({question: cell(' ')}, review, notes), null);
const parsed = parseRow({question: cell('Cache stampede (example)'), subject: cell('HLD'), status: cell('in progress'), source: cell('Article', [{label:'Article', href:'https://example.com/article'}]), tags: cell('#cache, #interview retries'), related: cell('[[HLD/Caching/Cache Aside Demo|Caching]]'), priority: cell('high')}, review, notes);
assert.strictEqual(parsed.title, 'Cache stampede');
assert.strictEqual(parsed.sample, true);
assert.strictEqual(parsed.status, 'In progress');
assert.strictEqual(parsed.priority, 'High');
assert.deepStrictEqual(parsed.tags, ['cache', 'interview', 'retries']);
assert.deepStrictEqual(parsed.related, [{label:'Caching',url:'/notes/cache-aside/'}]);
assert.strictEqual(parsed.source, 'https://example.com/article');
const defaults = parseRow({question:cell('Test Note'), source:cell('unsafe',[{label:'bad',href:'javascript:alert(1)'}])},review,notes);
assert.strictEqual(defaults.subject,'Inbox');
assert.strictEqual(defaults.status,'Unread');
assert.strictEqual(defaults.priority,'Normal');
assert.strictEqual(defaults.source,'');
assert.strictEqual(rowAnchor('Meeting Rooms II'), 'study-meeting-rooms-ii');
assert.strictEqual(rowAnchor('Meeting Rooms II',2), 'study-meeting-rooms-ii-2');
assert.deepStrictEqual(wikiReferences('[[Missing Note]]',notes), [{label:'Missing Note',url:null}]);
assert.strictEqual(wikiReferences('[[Cache Aside Demo]]',notes)[0].url, '/notes/cache-aside/');
console.log('Weekly table checks passed: blank rows, defaults, sources, tags, note aliases, missing notes, example labels and row anchors.');

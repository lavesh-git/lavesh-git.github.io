'use strict';

const assert = require('assert');
const { buildTree, containsPage } = require('../assets/navigation');
const note = (path, title, url, order = 9999) => ({ path, title, url, order });
const tree = buildTree([
  note('HLD/Caching/Advanced/TTL.md', 'TTL', '/ttl/', 2),
  note('HLD/Caching/Basics.md', 'Basics', '/existing-permalink/', 1),
  note('HLD/Chapter 10.md', 'Chapter 10', '/ten/'),
  note('HLD/Chapter 2.md', 'Chapter 2', '/two/'),
  note('DSA/Arrays.md', 'Arrays', '/arrays/'),
  note('HLD Extra/Other.md', 'Other', '/other/'),
  note('HLD/assets/a.excalidraw.md', 'Drawing', '/drawing/'),
  note('HLD/Unsafe.md', 'Unsafe', 'javascript:alert(1)'),
  note('HLD/External.md', 'External', '//example.com/')
], 'HLD');

assert.deepStrictEqual(tree.map(entry => entry.title), ['Caching', 'Chapter 2', 'Chapter 10']);
assert.deepStrictEqual(tree[0].children.map(entry => entry.title), ['Basics', 'Advanced']);
assert.strictEqual(tree[0].children[0].url, '/existing-permalink/');
assert.strictEqual(tree[0].children[1].children[0].title, 'TTL');
assert(containsPage(tree[0], '/ttl/'));
assert(!containsPage(tree[0], '/arrays/'));
assert.deepStrictEqual(buildTree([], 'DSA'), []);
assert.deepStrictEqual(buildTree([note('DSA/Root note.md', 'Root note', '/root/')], 'DSA').map(entry => entry.title), ['Root note']);
assert.strictEqual(buildTree([note('DSA/__proto__/Example.md', 'Example', '/safe/')], 'DSA')[0].title, '__proto__');
console.log('Navigation checks passed: nesting, notebook boundaries, ordering, permalinks, empty notebooks, and safe links.');

/**
 * `{canonical=false}`: a guide listed in two groups keeps its home for the
 * breadcrumb and the cold-entry sidebar branch, even when the copy comes first
 * in the index. Exercises the real parser on a throwaway index, then the
 * theme's pure helpers (breadcrumb walk, candidate order) on its output.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import {
  findBreadcrumbTrail,
  type SidebarChild,
} from '../../theme/components/Breadcrumbs/trail';
import {
  canonicalFirst,
  isNonCanonical,
} from '../../theme/components/Sidebar/canonical';
import { parseIndexMd } from './parser';

// The copy (Dedicated Servers › Backup) comes first, the home (Storage) second.
// `own-guide` is listed in both too, but its home is the copy's group: it
// takes the marker back with {canonical=true}.
const INDEX = `
+ Bare Metal Cloud
    + [Dedicated Servers](products/dedicated-servers)
        + [Backup](ds-backup)
            + [Backup Agent](ds-backup-agent){canonical=false}{landing=storage/agent/overview}
                + [Billing](storage/agent/billing)
            + [Veeam](ds-backup-veeam){landing=storage/veeam/overview}{canonical=false}
                + [Setup](storage/veeam/setup)
                + [Own guide](dedicated-servers/own-guide){canonical=true}
            + [Not a copy](dedicated-servers/plain)
+ Storage
    + [Backup Agent](storage-agent){landing=storage/agent/overview}
        + [Billing](storage/agent/billing)
    + [Veeam](storage-veeam)
        + [Overview](storage/veeam/overview)
        + [Setup](storage/veeam/setup)
        + [Own guide](dedicated-servers/own-guide)
    + [Copy only](storage-copy-only){canonical=false}
        + [Lonely](storage/lonely)
`;

const dir = mkdtempSync(path.join(tmpdir(), 'sidebar-canonical-'));
after(() => rmSync(dir, { recursive: true, force: true }));

function parse(index: string) {
  const file = path.join(dir, `index-${Math.random()}.md`);
  writeFileSync(file, index);
  return parseIndexMd(file).universes as unknown as SidebarChild[];
}

/** Every node, keyed `link` (leaves) or `text` (groups without a link). */
function flags(tree: SidebarChild[]): Map<string, boolean> {
  const out = new Map<string, boolean>();
  const visit = (node: SidebarChild, prefix: string) => {
    const key = `${prefix}${'link' in node && node.link ? node.link : 'text' in node ? node.text : '?'}`;
    out.set(key, isNonCanonical(node));
    if ('items' in node) for (const child of node.items) visit(child, prefix);
  };
  tree.forEach((n, i) => {
    visit(n, `${i}:`);
  });
  return out;
}

const crumbs = (tree: SidebarChild[], route: string) =>
  findBreadcrumbTrail(tree, route)?.map((c) =>
    c.title.replace('sidebar.gen.', ''),
  ) ?? null;

test('the marker flags the group, its landing link and everything below it', () => {
  const f = flags(parse(INDEX));
  assert.equal(f.get('0:/guides/storage/agent/overview'), true); // DS copy group
  assert.equal(f.get('0:/guides/storage/agent/billing'), true);
  assert.equal(f.get('0:/guides/storage/veeam/overview'), true);
  assert.equal(f.get('0:/guides/storage/veeam/setup'), true);
  assert.equal(f.get('0:/guides/dedicated-servers/own-guide'), false); // taken back
  assert.equal(f.get('0:/guides/dedicated-servers/plain'), false);
  assert.equal(f.get('0:sidebar.gen.dsBackup'), false); // parent untouched
  assert.equal(f.get('1:/guides/storage/agent/billing'), false); // the home
  assert.equal(f.get('1:/guides/storage/veeam/overview'), false);
});

test('without any marker, no node carries the flag', () => {
  const f = flags(parse(INDEX.replace(/\{canonical=(true|false)\}/g, '')));
  assert.deepEqual([...f.values()].filter(Boolean), []);
});

test('a marker value other than true or false fails the parse', () => {
  assert.throws(
    () =>
      parse('+ U\n    + [P](products/p){canonical=no}\n        + [G](u/g)\n'),
    /\{canonical=no\} must be true or false/,
  );
});

test('the breadcrumb skips the copy and follows the home', () => {
  const tree = parse(INDEX);
  assert.deepEqual(crumbs(tree, '/guides/storage/agent/billing'), [
    'storage',
    'storageAgent',
    'Billing',
  ]);
  // The copy's landing page is the home's overview leaf: the trail ends at
  // the home group (the overview rule), not at the copy group.
  assert.deepEqual(crumbs(tree, '/guides/storage/veeam/overview'), [
    'storage',
    'storageVeeam',
  ]);
  assert.deepEqual(crumbs(tree, '/guides/storage/veeam/setup.html'), [
    'storage',
    'storageVeeam',
    'Setup',
  ]);
});

test('the breadcrumb keeps the first placement where the marker does not apply', () => {
  const tree = parse(INDEX);
  // Taken back with {canonical=true}: Dedicated Servers stays the home.
  assert.deepEqual(crumbs(tree, '/guides/dedicated-servers/own-guide'), [
    'bareMetalCloud',
    'dedicatedServers',
    'dsBackup',
    'dsBackupVeeam',
    'Own guide',
  ]);
  // Every placement flagged: fall back to the first one rather than none.
  assert.deepEqual(crumbs(tree, '/guides/storage/lonely'), [
    'storage',
    'storageCopyOnly',
    'Lonely',
  ]);
  assert.equal(crumbs(tree, '/guides/not/listed'), null);
});

test('the same index without markers keeps the first placement (current behaviour)', () => {
  const tree = parse(INDEX.replace(/\{canonical=(true|false)\}/g, ''));
  assert.deepEqual(crumbs(tree, '/guides/storage/agent/billing'), [
    'bareMetalCloud',
    'dedicatedServers',
    'dsBackup',
    'dsBackupAgent',
    'Billing',
  ]);
});

test('candidates: canonical placements first, tree order kept within each part', () => {
  assert.deepEqual(
    canonicalFirst(
      ['2-0-1', '2-3-0', '5-1', '7-0'],
      new Set(['2-0-1', '2-3-0']),
    ),
    ['5-1', '7-0', '2-0-1', '2-3-0'],
  );
  assert.deepEqual(canonicalFirst(['1', '2'], new Set()), ['1', '2']);
  assert.deepEqual(canonicalFirst(['1', '2'], new Set(['1', '2'])), ['1', '2']);
});

/**
 * <ProductDirectory />: a landing page lists its sidebar group's tree. Runs
 * the real parser on a throwaway index, then the pure directory builder.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { parseIndexMd } from '../../config/sidebar/parser';
import {
  buildDirectory,
  findLandingGroup,
  type SidebarChild,
  toGuidePath,
} from './tree';

const INDEX = `
+ Public Cloud
    + [Databases](products/public-cloud-databases){landing=public-cloud/databases/overview}
        + [Overview](public-cloud/databases/overview)
        + [Start here](public-cloud/databases/start)
        + [PostgreSQL](products/public-cloud-databases-postgresql){landing=public-cloud/databases/postgresql/overview}
            + [Connect](public-cloud/databases/postgresql/connect)
        + [Common](public-cloud-databases-common)
            + [Billing](public-cloud/databases/billing)
            + [Configuration](public-cloud-databases-common-configuration)
                + [Users](public-cloud/databases/users)
            + [Empty](public-cloud-databases-common-empty)
+ Storage
    + [Copy](products/storage-copy){landing=public-cloud/databases/overview}{canonical=false}
        + [Lonely](storage/lonely)
`;

const dir = mkdtempSync(path.join(tmpdir(), 'product-directory-'));
after(() => rmSync(dir, { recursive: true, force: true }));

function parse(index: string) {
  const file = path.join(dir, `index-${Math.random()}.md`);
  writeFileSync(file, index);
  return parseIndexMd(file).universes as unknown as SidebarChild[];
}

const strip = (s: string) => s.replace(/sidebar\.gen\./g, '');

test('links are reduced to /guides/… whatever the locale prefix or suffix', () => {
  assert.equal(toGuidePath('/en/guides/a/b.html'), '/guides/a/b');
  assert.equal(toGuidePath('/guides/a/b/'), '/guides/a/b');
  assert.equal(toGuidePath('/pt/guides/a'), '/guides/a');
});

test('the landing group is the canonical placement, not an earlier copy', () => {
  const tree = parse(INDEX);
  // Put the copy first in tree order: the home must still win.
  const g = findLandingGroup(
    [...tree].reverse(),
    '/en/guides/public-cloud/databases/overview',
  );
  assert.ok(g);
  assert.equal(strip(String(g.text)), 'publicCloudDatabases');
});

test('the directory follows the index: own guides first, then sections', () => {
  const tree = parse(INDEX);
  const route = '/guides/public-cloud/databases/overview';
  const g = findLandingGroup(tree, route);
  assert.ok(g);
  const dirs = buildDirectory(g, route).map((c) => ({
    title: strip(c.title),
    items: c.items.map((i) => `${strip(i.title)} ${i.link}`),
  }));
  assert.equal(dirs.length, 3);
  // The page itself is never listed; a sub-product with its own page is one
  // link to it, not its whole tree.
  assert.equal(dirs[0].title, '');
  assert.equal(dirs[0].items.length, 2);
  assert.match(dirs[0].items[0], /\/guides\/public-cloud\/databases\/start$/);
  assert.match(
    dirs[0].items[1],
    /^publicCloudDatabasesPostgresql \/guides\/public-cloud\/databases\/postgresql\/overview$/,
  );
  assert.equal(dirs[1].title, 'publicCloudDatabasesCommon');
  assert.equal(dirs[1].items.length, 1);
  // A nested section gets its own category right after its parent; an empty
  // one gets none.
  assert.equal(
    dirs[2].title,
    'publicCloudDatabasesCommon › publicCloudDatabasesCommonConfiguration',
  );
  assert.match(dirs[2].items[0], /\/guides\/public-cloud\/databases\/users$/);
});

test('{directory=false} keeps an entry in the sidebar, off the page', () => {
  const tree = parse(`
+ Web Cloud
    + [VoIP](products/voip){landing=voip/landing}
        + [Phones](voip-phones)
            + [Previous phones](voip/previous-phones)
            + [Old phone](voip/old-phone){directory=false}
        + [Legacy](voip-legacy){directory=false}
            + [Legacy guide](voip/legacy)
`);
  const route = '/guides/voip/landing';
  const g = findLandingGroup(tree, route);
  assert.ok(g);
  // Still in the sidebar…
  const flat = JSON.stringify(g);
  assert.match(flat, /voip\/old-phone/);
  assert.match(flat, /voip\/legacy/);
  // …but not on the landing page: the leaf, and the whole marked group.
  const links = buildDirectory(g, route).flatMap((c) =>
    c.items.map((i) => i.link),
  );
  assert.deepEqual(links, ['/guides/voip/previous-phones']);
});

test('{directory=…} only takes false', () => {
  assert.throws(
    () =>
      parse('+ U\n    + [P](products/p)\n        + [G](u/g){directory=true}\n'),
    /must be false/,
  );
});

test('a page no group points to gets no directory', () => {
  assert.equal(findLandingGroup(parse(INDEX), '/guides/nowhere'), null);
});

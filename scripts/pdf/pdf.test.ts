/**
 * Tests for the pure parts of the PDF pipeline (run with `pnpm test`).
 * The Chromium print itself runs only in CI (and via `pnpm pdf:local`); these
 * cover the HTML transforms and cache-digest semantics that would otherwise rot
 * silently as the theme's markup evolves.
 */

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import {
  deheadArticle,
  escapeHtml,
  extractArticle,
  namespaceAnchors,
  refToAnchor,
  relinkCrossGuide,
  stripInteractiveWidgets,
} from './assemble-book';
import { computeDigest } from './pdf-cache';
import { readFrontmatterValue } from './resolve-product';

test('extractArticle walks balanced <div> nesting to the article end', () => {
  const article = '<div class="rp-doc rspress-doc"><div>inner</div>tail</div>';
  assert.equal(
    extractArticle(`<body>${article}<div>after</div></body>`),
    article,
  );
  assert.equal(extractArticle('<div class="other">x</div>'), null);
  // Unbalanced (truncated) markup must read as "no article", not a partial one.
  assert.equal(
    extractArticle('<div class="rp-doc rspress-doc"><p>lost body</p>'),
    null,
  );
});

test('stripInteractiveWidgets drops toolbars and code buttons, keeps the code', () => {
  const html =
    '<div class="rp-not-doc"><div>Ask AI</div></div>' +
    '<div class="rp-codeblock">' +
    '<div class="rp-code-button-group"><button class="rp-code-copy-button">copy</button></div>' +
    '<div class="rp-codeblock__content"><pre><code>ls -la</code></pre></div>' +
    '</div>' +
    '<button class="rp-code-wrap-button">wrap</button>';
  const out = stripInteractiveWidgets(html);
  assert.ok(!out.includes('rp-not-doc'));
  assert.ok(!out.includes('<button'));
  assert.ok(out.includes('ls -la'));
});

test('namespaceAnchors prefixes ids, legacy name anchors, and fragment links', () => {
  const out = namespaceAnchors(
    '<h3 id="steps">Steps</h3><a name="appcred"></a>' +
      '<a href="#steps">go</a>' +
      '<pre><code>id="raw" &lt;a href="#raw"&gt;</code></pre>',
    'net-x-a',
  );
  assert.ok(out.includes('<h3 id="net-x-a--steps">'));
  assert.ok(out.includes('<a name="net-x-a--appcred">'));
  assert.ok(out.includes('href="#net-x-a--steps"'));
  // Attribute-looking text inside code samples is not an attribute — untouched.
  assert.ok(out.includes('<code>id="raw" &lt;a href="#raw"&gt;</code>'));
});

test('deheadArticle demotes headings to styled divs, preserving ids', () => {
  assert.equal(
    deheadArticle('<h3 id="steps" class="x">Steps</h3><p>body</p>'),
    '<div class="h-like h-like--3" id="steps">Steps</div><p>body</p>',
  );
});

test('relinkCrossGuide rewrites in-bundle links only', () => {
  const anchors = new Map([['net/x/a', refToAnchor('net/x/a')]]);
  const html =
    '<a href="/en/guides/net/x/a.md#step">in</a> ' +
    '<a href="/guides/net/x/b">not-in-bundle</a> ' +
    '<a href="https://example.com/guides/net/x/a">external</a>';
  const out = relinkCrossGuide(html, anchors);
  assert.ok(out.includes('href="#net-x-a"'));
  assert.ok(out.includes('href="/guides/net/x/b"'));
  assert.ok(out.includes('href="https://example.com/guides/net/x/a"'));
});

test('escapeHtml escapes the three HTML-significant characters', () => {
  assert.equal(escapeHtml('S3 & <Swift> tips'), 'S3 &amp; &lt;Swift&gt; tips');
});

test('readFrontmatterValue reads scalar keys, strips quotes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-'));
  const file = path.join(dir, 'page.mdx');
  fs.writeFileSync(
    file,
    '---\ntitle: "On-Prem Cloud Platform"\npageType: landing\n---\n\n# Body\n',
  );
  assert.equal(readFrontmatterValue(file, 'title'), 'On-Prem Cloud Platform');
  assert.equal(readFrontmatterValue(file, 'pageType'), 'landing');
  assert.equal(readFrontmatterValue(file, 'pdf'), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('computeDigest is stable and content-sensitive', () => {
  const imageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-img-'));
  const a = computeDigest('<html><body>A</body></html>', imageRoot);
  assert.equal(computeDigest('<html><body>A</body></html>', imageRoot), a);
  assert.notEqual(computeDigest('<html><body>B</body></html>', imageRoot), a);
  fs.rmSync(imageRoot, { recursive: true, force: true });
});

test('computeDigest folds referenced images and the footer logo into the key', () => {
  const imageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-test-img-'));
  const html = '<img src="/images/x.png">';
  fs.writeFileSync(path.join(imageRoot, 'x.png'), 'v1');
  const a = computeDigest(html, imageRoot);
  fs.writeFileSync(path.join(imageRoot, 'x.png'), 'v2');
  const b = computeDigest(html, imageRoot);
  assert.notEqual(b, a);
  // The footer logo is embedded by the print step without an HTML reference —
  // a rebrand must still invalidate the cache.
  fs.writeFileSync(path.join(imageRoot, 'logo-ovhcloud-light.png'), 'logo-v2');
  assert.notEqual(computeDigest(html, imageRoot), b);
  fs.rmSync(imageRoot, { recursive: true, force: true });
});

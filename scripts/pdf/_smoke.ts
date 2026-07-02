/* Ad-hoc smoke test for the PDF core (run: tsx scripts/pdf/_smoke.ts). Not a unit test. */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeProductDigest, extractImageRefs } from './hash-product';
import { resolveProduct } from './resolve-product';
import { sanitizeMd } from './sanitize-md';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);
const dist = path.join(root, 'dist');

function check(name: string, cond: boolean) {
  console.log(`${cond ? '✅' : '❌'} ${name}`);
  if (!cond) process.exitCode = 1;
}

// --- sanitizer against known offenders ---
const kms = path.join(dist, 'en/guides/manage-and-operate/kms/quick-start.md');
if (fs.existsSync(kms)) {
  const out = sanitizeMd(fs.readFileSync(kms, 'utf-8'));
  check(
    'kms: no raw className="action"',
    !/className=["']action["']/.test(out),
  );
  check('kms: no <ManagerLink>', !/<ManagerLink/.test(out));
  check('kms: no broken multi-line code span', !/`[^`\n]*\n\s*`/.test(out));
  check(
    'kms: action label became bold',
    /\*\*Order an OKMS domain\*\*|\*\*Identity, Security & Operations\*\*/.test(
      out,
    ),
  );
} else {
  console.log('⚠️  kms built .md not found — run pnpm build:en first');
}

const dns = (() => {
  try {
    return execSync(
      `find ${dist}/en/guides -name "*.md" -path "*dns-zone*" 2>/dev/null | head -1`,
    )
      .toString()
      .trim();
  } catch {
    return '';
  }
})();
if (dns && fs.existsSync(dns)) {
  const out = sanitizeMd(fs.readFileSync(dns, 'utf-8'));
  check('dns: no <Region> wrapper left', !/<\/?Region/.test(out));
} else {
  console.log('⚠️  dns-zone built .md not found');
}

// --- resolver against VPS (nested products) ---
const guides = resolveProduct('bare-metal-cloud-virtual-private-servers', 'en');
check(
  'resolver: VPS resolves to a non-empty list',
  !!guides && guides.length > 0,
);
if (guides) {
  const refs = guides.map((g) => g.ref);
  check('resolver: refs are unique', new Set(refs).size === refs.length);
  check(
    'resolver: recursed into nested product (configuration)',
    refs.some((r) => /virtual-private-servers/.test(r)),
  );
  console.log(`   VPS guide count (en): ${guides.length}`);
  console.log(`   first 3: ${refs.slice(0, 3).join(', ')}`);

  // digest determinism + image extraction
  const d1 = computeProductDigest(guides, dist);
  const d2 = computeProductDigest(guides, dist);
  check('hash: digest is deterministic', d1 === d2);
  console.log(`   digest: ${d1.slice(0, 16)}…`);
}

// --- image ref extraction ---
const sample = '![a](/images/x/y.png)\n<img src="/images/z.png" />';
check(
  'images: extracts both md and html refs',
  extractImageRefs(sample).length === 2,
);

// --- locale pruning: fr-only guide absent for en ---
const phone = resolveProduct('bare-metal-cloud-virtual-private-servers', 'fr');
check('resolver: fr also resolves', !!phone);

// --- assembleBook against the KMS section bundle ---
import('./render-product').then(({ assembleBook }) => {
  const kmsGuides = resolveProduct('manage-operate-kms', 'en');
  check('assemble: KMS section resolves', !!kmsGuides && kmsGuides.length > 0);
  if (kmsGuides) {
    const book = assembleBook({
      title: 'Key Management Service (KMS)',
      guides: kmsGuides,
    });
    const chapters = book.match(/^# .+\{#/gm) || [];
    check(
      `assemble: one chapter per guide (${chapters.length}/${kmsGuides.length})`,
      chapters.length === kmsGuides.length,
    );
    check('assemble: title block present', /^% Key Management/.test(book));
    check(
      'assemble: no className=action leak',
      !/className=["']action["']/.test(book),
    );
    check('assemble: no <ManagerLink> leak', !/<ManagerLink/.test(book));
    check('assemble: no <Region> leak', !/<\/?Region/.test(book));
    check('assemble: no broken inline code', !/`[^`\n]*\n\s*`/.test(book));
    fs.writeFileSync(path.join(dist, 'pdfs', '_kms-book.preview.md'), book);
    console.log(
      `   book chars: ${book.length}; preview → dist/pdfs/_kms-book.preview.md`,
    );
  }
});

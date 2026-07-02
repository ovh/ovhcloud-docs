/**
 * Regenerate a product's PDF(s) and drop them straight into docs/public/pdfs/,
 * where they are committed and served at /pdfs/<locale>/<bundle-ref>.pdf.
 *
 * This is the one command to run when a product's guides change materially and its
 * committed PDF needs refreshing (the PDFs are static, hand-maintained artifacts —
 * see the infra brief). It wraps `pdf:local` (headless-Chromium generation, no
 * pandoc/Docker) and moves the output to the public dir under the served name.
 *
 * Prerequisite: a built `dist/<locale>/` for each locale (run `pnpm build:<locale>`
 * or a full build first — the generator reads the already-rendered guide HTML).
 *
 * Usage:
 *   pnpm pdf:refresh <bundle-ref> [locales]
 *   e.g. pnpm pdf:refresh hosted-private-cloud-hosted-private-cloud-opcp en,fr
 * Defaults to "en,fr" when locales are omitted.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC_PDFS = path.join(ROOT, 'docs', 'public', 'pdfs');

const bundleRef = process.argv[2];
const locales = (process.argv[3] ?? 'en,fr')
  .split(',')
  .map((l) => l.trim())
  .filter(Boolean);

if (!bundleRef) {
  console.error('Usage: pnpm pdf:refresh <bundle-ref> [locales=en,fr]');
  process.exit(1);
}

for (const locale of locales) {
  console.log(`\n=== ${bundleRef} (${locale}) ===`);
  // Generate via the local Chromium engine (writes dist/pdfs/<ref>-<locale>.pdf).
  execFileSync(
    'npx',
    ['tsx', path.join(_dirname, 'print-local.ts'), bundleRef, locale],
    { stdio: 'inherit', cwd: ROOT },
  );

  const generated = path.join(DIST, 'pdfs', `${bundleRef}-${locale}.pdf`);
  if (!fs.existsSync(generated)) {
    console.error(
      `❌ Expected output missing: ${path.relative(ROOT, generated)}`,
    );
    process.exit(1);
  }

  const destDir = path.join(PUBLIC_PDFS, locale);
  const dest = path.join(destDir, `${bundleRef}.pdf`);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(generated, dest);
  const mb = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
  console.log(`✅ → ${path.relative(ROOT, dest)} (${mb} MB)`);
}

console.log(
  `\nDone. Review + commit the updated PDF(s) under docs/public/pdfs/. If you added a\n` +
    `locale, also update PDF_LOCALES in theme/components/PdfDownloadButton/index.tsx.`,
);

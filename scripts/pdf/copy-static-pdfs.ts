/**
 * Copy pre-generated, committed product PDFs into the build output.
 *
 * Short-term staging path: instead of generating PDFs in CI (which needs
 * pandoc/weasyprint or headless Chromium that the CDS build image lacks), the PDFs
 * are produced locally with `pnpm pdf:local`, committed under `static-pdfs/`, and
 * this script copies them into `dist/pdfs/` so the site serves them at
 * `/pdfs/<locale>/<bundle-ref>.pdf` — exactly where PdfDownloadButton links.
 *
 * Runs after `build:combine` (so `dist/` exists). No-op if `static-pdfs/` is empty.
 *
 * NOTE: this is a staging convenience. The production path is `build:pdfs`
 * (scripts/pdf/build-pdfs.ts) generating PDFs in a pandoc-equipped CI image.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');
const SRC = path.join(ROOT, 'static-pdfs');
const DEST = path.join(ROOT, 'dist', 'pdfs');

function copyDir(src: string, dest: string): number {
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      n += copyDir(s, d);
    } else if (entry.name.endsWith('.pdf')) {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

if (!fs.existsSync(SRC)) {
  console.log('ℹ️  No static-pdfs/ — nothing to copy.');
  process.exit(0);
}
fs.mkdirSync(DEST, { recursive: true });
const count = copyDir(SRC, DEST);
console.log(`✅ Copied ${count} static PDF(s) → ${path.relative(ROOT, DEST)}/`);

/**
 * Content-addressed Artifactory cache for rendered product PDFs.
 *
 * A book's cache key is a digest over everything that shapes the output: the
 * assembled book's `digestInput` (guide content, titles, section labels and
 * ordering by construction; volatile cover fields already blanked by
 * assemble-book.ts), the bytes of every image it references plus the footer
 * logo print-pdf.ts embeds, the whole scripts/pdf tree (a pipeline change must
 * rebuild — coarse but simple), and the installed Playwright version, which
 * pins the Chromium build that renders. Bumping the `playwright` dependency
 * therefore invalidates the cache in the same commit.
 *
 * Objects live at `<repo>-static/cds-pdf-cache/<locale>/<ref>/<digest>.pdf`.
 * Content addressing means uploads from any branch are safe to share. The
 * CDS_INTEGRATION_ARTIFACT_MANAGER_* env is injected by CDS when the
 * artifactory integration is enabled on the job; without it (local runs) the
 * cache is disabled.
 */

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(_dirname, '..', '..');

const ART = {
  url: process.env.CDS_INTEGRATION_ARTIFACT_MANAGER_URL,
  prefix: process.env.CDS_INTEGRATION_ARTIFACT_MANAGER_REPO_PREFIX,
  token: process.env.CDS_INTEGRATION_ARTIFACT_MANAGER_TOKEN,
};

export const cacheEnabled = Boolean(ART.url && ART.prefix && ART.token);

function cacheUrl(locale: string, productRef: string, digest: string): string {
  return `${ART.url}${ART.prefix}-static/cds-pdf-cache/${locale}/${productRef}/${digest}.pdf`;
}

/** The installed Playwright version — it pins the Chromium build that renders. */
function engineVersion(): string {
  const pkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'node_modules', 'playwright', 'package.json'),
      'utf-8',
    ),
  );
  return `playwright-${pkg.version}`;
}

const IMG_RE = /<img\b[^>]*\bsrc=["'](\/images\/[^"']+)["']/g;

/** Cache key for one assembled book (see module doc for what it covers). */
export function computeDigest(digestInput: string, imageRoot: string): string {
  const h = createHash('sha256');
  h.update(`ENGINE ${engineVersion()}\n`);
  for (const f of fs.readdirSync(_dirname, { recursive: true }).sort()) {
    const p = path.join(_dirname, f as string);
    if (fs.statSync(p).isFile()) {
      h.update(`FILE ${f}\n`);
      h.update(fs.readFileSync(p));
    }
  }
  h.update(digestInput);
  // Referenced images, plus the footer logo that print-pdf.ts embeds without
  // referencing it from the HTML — a rebrand must invalidate the cache too.
  const imageRels = [...digestInput.matchAll(IMG_RE)].map((m) =>
    m[1].replace(/^\/images\//, ''),
  );
  for (const rel of [...imageRels, 'logo-ovhcloud-light.png']) {
    try {
      h.update(fs.readFileSync(path.join(imageRoot, rel)));
    } catch {
      h.update(`MISSING ${rel}\n`);
    }
  }
  return h.digest('hex');
}

/** Fetch a cached PDF into outPath. Returns false on a miss. */
export async function downloadCached(
  locale: string,
  productRef: string,
  digest: string,
  outPath: string,
): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(cacheUrl(locale, productRef, digest), {
      headers: { authorization: `Bearer ${ART.token}` },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  cache probe ${locale}/${productRef}: ${message}`);
    return false;
  }
  if (!res.ok) {
    if (res.status !== 404) {
      console.warn(
        `⚠️  cache probe ${locale}/${productRef}: HTTP ${res.status}`,
      );
    }
    return false;
  }
  let body: ArrayBuffer;
  try {
    body = await res.arrayBuffer();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  cache probe ${locale}/${productRef}: ${message}`);
    return false;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(body));
  return true;
}

/** Upload a rendered PDF. Failure is logged, not fatal — the PDF is built. */
export async function uploadCached(
  locale: string,
  productRef: string,
  digest: string,
  pdfPath: string,
): Promise<void> {
  const body = new Uint8Array(fs.readFileSync(pdfPath));
  let res: Response;
  try {
    res = await fetch(cacheUrl(locale, productRef, digest), {
      method: 'PUT',
      headers: { authorization: `Bearer ${ART.token}` },
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  cache upload ${locale}/${productRef}: ${message}`);
    return;
  }
  if (!res.ok) {
    console.warn(`⚠️  cache upload ${locale}/${productRef}: HTTP ${res.status}`);
  }
}

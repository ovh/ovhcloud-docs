/**
 * Worker thread: pre-processes HTML and MD files in a single locale directory.
 *
 * HTML: Boosts h1 weight for Pagefind and cleans header-anchor "#" symbols.
 * MD:   Injects frontmatter from source MDX (title, description, url, lang)
 *       for LLM consumption.
 *
 * Input (workerData):  { dir: string, locale: string, siteUrl: string, docsDir: string }
 * Output (message):    { html: number, md: number }
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';

const SKIP_DIRS = new Set(['pagefind', 'public', 'images', 'static']);

/**
 * Extract frontmatter fields from an MDX file.
 */
function readMdxFrontmatter(mdxPath: string): Record<string, string> | null {
  try {
    const content = fs.readFileSync(mdxPath, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const fields: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
      if (kv) {
        fields[kv[1]] = kv[2];
      }
    }
    return fields;
  } catch {
    return null;
  }
}

function processDir(
  dir: string,
  locale: string,
  siteUrl: string,
  docsDir: string,
  basePath: string,
): { html: number; md: number } {
  let html = 0;
  let md = 0;
  if (!fs.existsSync(dir)) return { html, md };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        const sub = processDir(
          fullPath,
          locale,
          siteUrl,
          docsDir,
          `${basePath}/${entry.name}`,
        );
        html += sub.html;
        md += sub.md;
      }
    } else if (entry.name.endsWith('.html')) {
      // --- HTML pre-processing ---
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;

      // Boost h1 weight so exact title matches rank first
      if (!content.includes('data-pagefind-weight')) {
        content = content.replace(
          /<h1([^>]*)>/gi,
          '<h1$1 data-pagefind-weight="10">',
        );
        changed = true;
      }

      // Clear header-anchor text so "#" doesn't appear in sub-result titles
      const cleaned = content.replace(
        /(<a\s[^>]*class="[^"]*header-anchor[^"]*"[^>]*>)\s*#\s*(<\/a>)/gi,
        '$1 $2',
      );
      if (cleaned !== content) {
        content = cleaned;
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        html++;
      }

      // --- MD frontmatter injection ---
      const mdPath = fullPath.replace(/\.html$/, '.md');
      if (!fs.existsSync(mdPath)) continue;

      const mdContent = fs.readFileSync(mdPath, 'utf-8');
      if (mdContent.startsWith('---\n')) continue; // Already has frontmatter

      // Read frontmatter from the source MDX file
      const slug = entry.name.replace(/\.html$/, '');
      const relativePath = `${basePath}/${slug}`.replace(`/${locale}/`, '');
      const mdxPath = path.join(docsDir, locale, `${relativePath}.mdx`);
      const fm = readMdxFrontmatter(mdxPath);

      const title = fm?.title || '';
      const description = fm?.description || '';
      const lastUpdated = fm?.lastUpdated || fm?.updated || '';
      const url = `${siteUrl}${basePath}/${slug}`;

      const lines = ['---'];
      if (title) lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
      if (description)
        lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
      lines.push(`url: ${url}`);
      lines.push(`lang: ${locale}`);
      if (lastUpdated) lines.push(`lastUpdated: ${lastUpdated}`);
      lines.push('---', '');

      fs.writeFileSync(mdPath, lines.join('\n') + mdContent);
      md++;
    }
  }
  return { html, md };
}

const { dir, locale, siteUrl, docsDir } = workerData as {
  dir: string;
  locale: string;
  siteUrl: string;
  docsDir: string;
};
const counts = processDir(dir, locale, siteUrl, docsDir, `/${locale}`);
parentPort?.postMessage(counts);

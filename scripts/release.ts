// Release preparation:
//   1. On develop, this script generates VERSION and CHANGELOG.md, then commits
//      them so the release metadata travels with the code.
//   2. It does not create a tag. The deploy pipeline runs on master, reads
//      VERSION from the deployed commit, and tags only versions that shipped.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REGIONS, type Region } from '../config/regions';

/**
 * A changelog entry belongs to one region, or to all of them.
 *
 * `all` covers two cases that are equivalent while there are exactly two
 * regions: a commit touching BOTH content trees, and a commit touching no
 * content at all (theme, config, scripts). Revisit if a third region appears —
 * "EU + US" would no longer mean "every region".
 */
type RegionBucket = Region | 'all';

/** Derived from config/regions.ts, never hardcoded. */
const REGION_KEYS = Object.keys(REGIONS) as Region[];
const BUCKET_ORDER: RegionBucket[] = [...REGION_KEYS, 'all'];

const bucketLabel = (bucket: RegionBucket): string =>
  bucket === 'all' ? 'All regions' : bucket.toUpperCase();

/**
 * Classify a commit from the paths it touches.
 *
 * Matched against the LOCALE subtrees (`docs/fr/…`, `docs-us/en/…`), not the
 * content root: `docs/public/` holds assets shared by every region, and one
 * shared file was enough to mislabel the whole US import as "All regions".
 *
 * No prefix collision to worry about: `docs-us/…` does not start with `docs/`.
 */
export function regionOf(files: string[]): RegionBucket {
  const touched = REGION_KEYS.filter((region) =>
    files.some((f) =>
      REGIONS[region].locales.some((locale) =>
        f.startsWith(`${REGIONS[region].contentDir}/${locale}/`),
      ),
    ),
  );
  return touched.length === 1 ? touched[0] : 'all';
}

function git(cmd: string): string {
  return execSync(`git ${cmd}`, {
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024, // 64MB
  }).trim();
}

function hasReleaseFileChanges(): boolean {
  try {
    git('diff --quiet -- CHANGELOG.md VERSION');
    return false;
  } catch {
    return true;
  }
}

function tagExists(tag: string): boolean {
  return git(`tag -l "${tag}"`) === tag;
}

function computeNextCalendarVersion(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const base = `${yyyy}.${mm}.${dd}`;

  let suffix = 0;
  let version = base;
  const existingTags = git(`tag -l "v${base}*"`).split('\n').filter(Boolean);
  if (existingTags.length > 0) {
    for (const tag of existingTags) {
      const tagVersion = tag.replace(/^v/, '');
      if (tagVersion === base) {
        suffix = Math.max(suffix, 1);
      } else {
        const match = tagVersion.match(/^\d{4}\.\d{2}\.\d{2}\.(\d+)$/);
        if (match) {
          suffix = Math.max(suffix, Number.parseInt(match[1], 10) + 1);
        }
      }
    }
    version = `${base}.${suffix}`;
  }

  return version;
}

function resolveNextReleaseVersion(): string {
  const versionPath = resolve(process.cwd(), 'VERSION');
  const preparedVersion = existsSync(versionPath)
    ? readFileSync(versionPath, 'utf-8').trim()
    : null;

  if (preparedVersion && !tagExists(`v${preparedVersion}`)) {
    return preparedVersion;
  }

  return computeNextCalendarVersion();
}

interface Commit {
  hash: string;
  type: string;
  scope: string | null;
  subject: string;
  /** Paths the commit touched, used to derive its region. */
  files: string[];
}

export function getCommitsSinceTag(tag: string | null): Commit[] {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  // `--name-only` in the same call: the changed paths are what decides a
  // commit's region, and one `git show` per commit would be needlessly slow.
  const log = git(`log ${range} --pretty=format:"%H|%s" --name-only`);

  const commits: Commit[] = [];
  let current: Commit | null = null;

  for (const raw of log.split('\n')) {
    const line = raw.replace(/^"|"$/g, '');
    const header = line.match(/^([0-9a-f]{40})\|(.*)$/);

    if (header) {
      // Reset first: the file lines that follow a skipped commit must not be
      // attributed to the previous one.
      current = null;
      const subject = header[2];
      if (subject.startsWith('chore(release):')) {
        continue;
      }
      const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
      if (!match) {
        continue;
      }
      current = {
        hash: header[1].substring(0, 7),
        type: match[1],
        scope: match[2] || null,
        subject: match[3],
        files: [],
      };
      commits.push(current);
      continue;
    }

    if (current && line.trim()) {
      current.files.push(line.trim());
    }
  }
  return commits;
}

function getLastTag(): string | null {
  const tags = git('tag -l "v*" --sort=-version:refname');
  return tags ? tags.split('\n')[0] : null;
}

interface RegionDocs {
  region: Region;
  count: number;
  locales: string[];
}

interface DocsSummary {
  total: number;
  byRegion: RegionDocs[];
}

/**
 * Count guide changes per region. Previously this scanned `docs/` only, which
 * made every change under `docs-us/` invisible in the changelog.
 */
export function summarizeDocsChangesSince(from: string | null): DocsSummary {
  if (!from) {
    return { total: 0, byRegion: [] };
  }

  const byRegion: RegionDocs[] = [];
  let total = 0;

  for (const region of REGION_KEYS) {
    const dir = REGIONS[region].contentDir;
    const output = git(
      `log ${from}..HEAD --name-only --pretty=format: -- ${dir}/`,
    );
    const files = output
      ? Array.from(new Set(output.split('\n').filter(Boolean)))
      : [];

    const mdFiles = files.filter(
      (f) => f.endsWith('.mdx') || f.endsWith('.md'),
    );
    if (mdFiles.length === 0) {
      continue;
    }

    const localesFound = new Set<string>();
    for (const f of mdFiles) {
      for (const locale of REGIONS[region].locales) {
        if (f.startsWith(`${dir}/${locale}/`)) {
          localesFound.add(locale);
          break;
        }
      }
    }

    byRegion.push({
      region,
      count: mdFiles.length,
      locales: [...localesFound].sort(),
    });
    total += mdFiles.length;
  }

  return { total, byRegion };
}

function formatCommitEntry(commit: Commit): string {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  return `- ${scope}${commit.subject}`;
}

function appendChangelogSection(
  lines: string[],
  title: string,
  entries: string[],
): void {
  if (entries.length === 0) {
    return;
  }

  lines.push(`### ${title}`, ...entries, '');
}

/**
 * Emit a rubric with one `####` sub-heading per non-empty region bucket.
 * Buckets partition the commits — nothing is filtered out — which is what the
 * entry-count check in the plan verifies.
 */
function appendRegionSections(
  lines: string[],
  title: string,
  commits: Commit[],
): void {
  if (commits.length === 0) {
    return;
  }

  lines.push(`### ${title}`, '');
  for (const bucket of BUCKET_ORDER) {
    const inBucket = commits.filter((c) => regionOf(c.files) === bucket);
    if (inBucket.length === 0) {
      continue;
    }
    lines.push(
      `#### ${bucketLabel(bucket)}`,
      ...inBucket.map(formatCommitEntry),
      '',
    );
  }
}

export function buildChangelogReleaseMarkdown(
  version: string,
  commits: Commit[],
  docs: DocsSummary,
): string {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const maintenance = commits.filter((c) =>
    ['chore', 'ci', 'refactor', 'perf', 'style', 'test'].includes(c.type),
  );

  const lines: string[] = [`## ${version}`, ''];

  appendRegionSections(lines, 'Features', features);
  appendRegionSections(lines, 'Fixes', fixes);
  appendRegionSections(lines, 'Maintenance', maintenance);

  if (docs.total > 0) {
    appendChangelogSection(
      lines,
      'Documentation',
      docs.byRegion.map(
        (r) =>
          `- ${bucketLabel(r.region)}: ${r.count} guides across ${r.locales.join(', ')}`,
      ),
    );
  }

  return lines.join('\n');
}

export function patchChangelog(
  existing: string,
  version: string,
  section: string,
): string {
  if (!existing.startsWith('# Changelog')) {
    return `# Changelog\n\n${section.trimEnd()}\n`;
  }

  const parts = existing.split(/(?=^## )/m);
  const header = parts.shift() || '# Changelog\n';
  const sections = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.startsWith(`## ${version}\n`));

  return `${header.trimEnd()}\n\n${[section.trim(), ...sections].join('\n\n').trimEnd()}\n`;
}

function main() {
  const version = resolveNextReleaseVersion();
  const lastTag = getLastTag();

  console.log(`Preparing release v${version}...`);
  if (lastTag) {
    console.log(`Previous release: ${lastTag}`);
  } else {
    console.log('No previous release found. This will be the first release.');
  }

  const commits = getCommitsSinceTag(lastTag);
  const docs = summarizeDocsChangesSince(lastTag);

  if (commits.length === 0 && docs.total === 0) {
    console.log('No changes since last release. Skipping.');
    process.exit(0);
  }

  console.log(`Found ${commits.length} commits and ${docs.total} doc changes.`);

  const section = buildChangelogReleaseMarkdown(version, commits, docs);

  const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
  let existing = '';
  if (existsSync(changelogPath)) {
    existing = readFileSync(changelogPath, 'utf-8');
  }

  const newChangelog = patchChangelog(existing, version, section);

  writeFileSync(changelogPath, newChangelog, 'utf-8');
  writeFileSync(resolve(process.cwd(), 'VERSION'), `${version}\n`, 'utf-8');
  console.log('Updated CHANGELOG.md and VERSION.');

  if (!hasReleaseFileChanges()) {
    console.log('Release files are already up to date. Skipping commit.');
    process.exit(0);
  }

  git('add CHANGELOG.md VERSION');
  git(
    `commit CHANGELOG.md VERSION -m "chore(release): update changelog ${version}"`,
  );
  console.log(`Committed release ${version}. Run 'git push' to publish.`);
}

// CLI entry point only. Importing this module used to run a full release —
// writing CHANGELOG.md and VERSION, then committing. Guarding it makes the pure
// functions above importable, which is how the region classification is tested.
//
// This script is the SOLE producer of CHANGELOG.md. A second one
// (scripts/generate-changelog.ts) used to regenerate the whole file from tags;
// it was removed because it was unreachable and, if ever run, would have
// rewritten history without the per-region sections.
if (process.argv[1]?.endsWith('release.ts')) {
  main();
}

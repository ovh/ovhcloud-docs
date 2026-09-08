// Release preparation:
//   1. On develop, this script generates VERSION and CHANGELOG.md, then commits
//      them so the release metadata travels with the code.
//   2. It does not create a tag. The deploy pipeline runs on master, reads
//      VERSION from the deployed commit, and tags only versions that shipped.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
}

function getCommitsSinceTag(tag: string | null): Commit[] {
  const range = tag ? `${tag}..HEAD` : 'HEAD';
  const log = git(`log ${range} --pretty=format:"%H|%s"`);

  const commits: Commit[] = [];
  for (const line of log.split('\n').filter(Boolean)) {
    const clean = line.replace(/^"|"$/g, '');
    const [hash, ...rest] = clean.split('|');
    const subject = rest.join('|');
    if (subject.startsWith('chore(release):')) {
      continue;
    }

    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
    if (match) {
      commits.push({
        hash: hash.substring(0, 7),
        type: match[1],
        scope: match[2] || null,
        subject: match[3],
      });
    }
  }
  return commits;
}

function getLastTag(): string | null {
  const tags = git('tag -l "v*" --sort=-version:refname');
  return tags ? tags.split('\n')[0] : null;
}

function summarizeDocsChangesSince(from: string | null): {
  count: number;
  locales: string[];
} {
  if (!from) {
    return { count: 0, locales: [] };
  }

  const LOCALES = ['fr', 'en', 'de', 'es', 'it', 'pl', 'pt'];
  const output = git(`log ${from}..HEAD --name-only --pretty=format: -- docs/`);
  const files = output
    ? Array.from(new Set(output.split('\n').filter(Boolean)))
    : [];

  const mdFiles = files.filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  const localesFound = new Set<string>();
  for (const f of mdFiles) {
    for (const locale of LOCALES) {
      if (f.startsWith(`docs/${locale}/`)) {
        localesFound.add(locale);
        break;
      }
    }
  }
  return { count: mdFiles.length, locales: [...localesFound].sort() };
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

function buildChangelogReleaseMarkdown(
  version: string,
  commits: Commit[],
  docs: { count: number; locales: string[] },
): string {
  const features = commits.filter((c) => c.type === 'feat');
  const fixes = commits.filter((c) => c.type === 'fix');
  const maintenance = commits.filter((c) =>
    ['chore', 'ci', 'refactor', 'perf', 'style', 'test'].includes(c.type),
  );

  const lines: string[] = [`## ${version}`, ''];

  appendChangelogSection(lines, 'Features', features.map(formatCommitEntry));
  appendChangelogSection(lines, 'Fixes', fixes.map(formatCommitEntry));
  appendChangelogSection(
    lines,
    'Maintenance',
    maintenance.map(formatCommitEntry),
  );

  if (docs.count > 0) {
    appendChangelogSection(lines, 'Documentation', [
      `- ${docs.count} guides updated across ${docs.locales.join(', ')}`,
    ]);
  }

  return lines.join('\n');
}

function patchChangelog(
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

  if (commits.length === 0 && docs.count === 0) {
    console.log('No changes since last release. Skipping.');
    process.exit(0);
  }

  console.log(`Found ${commits.length} commits and ${docs.count} doc changes.`);

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

main();

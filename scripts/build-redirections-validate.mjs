/**
 * Validate the three redirection maps:
 *   1. No dead destinations (target .mdx must exist, or be a locale home).
 *   2. No chains (a destination must not appear as a source elsewhere).
 *   3. Coverage stats.
 */
import { existsSync, readFileSync } from 'node:fs';

const DOCS = 'https://docs.ovhcloud.com';

const MAPS = [
  'redirections/legacy-to-new.map',
  'redirections/legacy-docs-to-new.map',
];

function parseMap(file) {
  const out = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const m = line.match(/^~?\^?(\S+?)\$?\s+(\S+);?$/);
    if (!m) continue;
    out.push({
      source: m[1].replace(/^~\^/, ''),
      dest: m[2].replace(/;$/, ''),
    });
  }
  return out;
}

console.log('=== Dead destinations ===\n');
let totalDead = 0;
for (const file of MAPS) {
  const entries = parseMap(file);
  let dead = 0;
  const samples = [];
  for (const e of entries) {
    if (!e.dest.startsWith(DOCS)) continue;
    const m = e.dest.match(/^https:\/\/docs\.ovhcloud\.com\/([a-z]{2})\/(.*)$/);
    if (!m) {
      dead++;
      continue;
    }
    const [, locale, rest] = m;
    if (rest === '' || rest === '/') continue; // locale home is always valid
    const cleanRest = rest.replace(/\/$/, '');
    const fsPath = `docs/${locale}/${cleanRest}.mdx`;
    if (!existsSync(fsPath)) {
      dead++;
      if (samples.length < 3) samples.push(`${e.source} → ${e.dest}`);
    }
  }
  totalDead += dead;
  console.log(`  ${file}: ${dead} dead (of ${entries.length})`);
  for (const s of samples) console.log(`    ${s}`);
}
console.log(`  Total dead: ${totalDead}`);

console.log('\n=== Chain detection (host-aware) ===\n');
// A chain is a redirect whose target is itself a source on the SAME host.
// Maps serving help.ovhcloud.com: legacy-to-new, csm-to-new
// Maps serving docs.ovh.com:      legacy-docs-to-new
// Destinations on docs.ovhcloud.com are terminal (no maps applied there).
const HOST_OF_MAP = {
  'redirections/legacy-to-new.map': 'help.ovhcloud.com',
  'redirections/legacy-docs-to-new.map': 'docs.ovh.com',
};

const sourcesByHost = {};
for (const file of MAPS) {
  const host = HOST_OF_MAP[file];
  if (!sourcesByHost[host]) sourcesByHost[host] = new Set();
  for (const e of parseMap(file)) {
    sourcesByHost[host].add(e.source);
    if (e.source.endsWith('/')) sourcesByHost[host].add(e.source.slice(0, -1));
  }
}

let chains = 0;
const chainSamples = [];
for (const file of MAPS) {
  for (const e of parseMap(file)) {
    // Identify destination host
    let destHost = null,
      destPath = null;
    if (e.dest.startsWith('https://docs.ovhcloud.com'))
      destHost = 'docs.ovhcloud.com';
    else if (e.dest.startsWith('https://help.ovhcloud.com')) {
      destHost = 'help.ovhcloud.com';
      destPath = e.dest.slice('https://help.ovhcloud.com'.length);
    } else if (e.dest.startsWith('https://docs.ovh.com')) {
      destHost = 'docs.ovh.com';
      destPath = e.dest.slice('https://docs.ovh.com'.length);
    }
    // Destinations on docs.ovhcloud.com are terminal — never a chain
    if (!destHost || destHost === 'docs.ovhcloud.com') continue;
    if (!destPath) continue;
    const sources = sourcesByHost[destHost];
    if (!sources) continue;
    const noQuery = destPath.split('?')[0];
    if (
      sources.has(destPath) ||
      sources.has(`${destPath}/`) ||
      sources.has(noQuery) ||
      sources.has(`${noQuery}/`)
    ) {
      chains++;
      if (chainSamples.length < 3)
        chainSamples.push(`${file}: ${e.source} → ${e.dest}`);
    }
  }
}
console.log(`Chains found: ${chains}`);
for (const s of chainSamples) console.log(`  ${s}`);

console.log('\n=== Coverage ===\n');
for (const file of MAPS) {
  const entries = parseMap(file);
  let toSpecific = 0,
    toHome = 0;
  for (const e of entries) {
    if (!e.dest.startsWith(DOCS)) continue;
    const m = e.dest.match(/^https:\/\/docs\.ovhcloud\.com\/[a-z]{2}\/(.*)$/);
    if (!m) continue;
    if (m[1] === '' || m[1] === '/') toHome++;
    else toSpecific++;
  }
  const pctSpecific = ((toSpecific / entries.length) * 100).toFixed(1);
  console.log(`  ${file}:`);
  console.log(`    total:    ${entries.length}`);
  console.log(`    → page:   ${toSpecific}  (${pctSpecific}%)`);
  console.log(`    → home:   ${toHome}`);
}

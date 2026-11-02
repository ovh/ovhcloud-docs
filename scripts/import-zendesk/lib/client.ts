/**
 * Minimal Zendesk Help Center REST client.
 *
 * Auth is HTTP Basic with `{email}/token` as the username and the API token as
 * the password (see import-us/zendesk-api-guide.html, step 1).
 *
 * Credentials come from import-us/.env, which is gitignored — they are never
 * read from a tracked file and never logged.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const ENV_FILE = path.join(ROOT, 'import-us', '.env');

export interface ZendeskConfig {
  baseUrl: string;
  email: string;
  token: string;
  locale: string;
}

/** Parse import-us/.env without pulling in a dotenv dependency. */
export function loadConfig(): ZendeskConfig {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(
      `Missing ${path.relative(ROOT, ENV_FILE)} — copy .env.example and fill it in.`,
    );
  }
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(ENV_FILE, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }

  const missing = [
    'ZENDESK_SUBDOMAIN',
    'ZENDESK_EMAIL',
    'ZENDESK_API_TOKEN',
  ].filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(`import-us/.env is missing: ${missing.join(', ')}`);
  }

  // The subdomain may be given bare ("corp1") or fully qualified
  // ("corp1.zendesk.com"); accept both, and tolerate a pasted scheme.
  const host = env.ZENDESK_SUBDOMAIN.replace(/^https?:\/\//, '').replace(
    /\/+$/,
    '',
  );
  const baseUrl = `https://${host.includes('.') ? host : `${host}.zendesk.com`}`;

  return {
    baseUrl,
    email: env.ZENDESK_EMAIL,
    token: env.ZENDESK_API_TOKEN,
    locale: env.ZENDESK_LOCALE || 'en-us',
  };
}

function authHeader(cfg: ZendeskConfig): string {
  const raw = `${cfg.email}/token:${cfg.token}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}

/** Redact anything that could leak a credential into a log line. */
export function safeUrl(url: string): string {
  return url.replace(/\/\/[^@]+@/, '//<redacted>@');
}

/**
 * GET one URL, retrying on 429 and 5xx. Zendesk sends `Retry-After` (seconds)
 * on rate limit; honour it rather than guessing a backoff.
 */
export async function getJson<T>(
  cfg: ZendeskConfig,
  url: string,
  attempt = 1,
): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: authHeader(cfg), Accept: 'application/json' },
  });

  if (res.status === 429 || res.status >= 500) {
    if (attempt > 5) {
      throw new Error(
        `${res.status} on ${safeUrl(url)} after ${attempt} attempts`,
      );
    }
    const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt;
    console.warn(
      `   ⚠ ${res.status} — retrying in ${retryAfter}s (attempt ${attempt})`,
    );
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return getJson<T>(cfg, url, attempt + 1);
  }

  if (!res.ok) {
    // 401/403 almost always means the token or the email is wrong; say so
    // without echoing either.
    const hint =
      res.status === 401 || res.status === 403
        ? ' — check ZENDESK_EMAIL and ZENDESK_API_TOKEN in import-us/.env'
        : '';
    throw new Error(
      `${res.status} ${res.statusText} on ${safeUrl(url)}${hint}`,
    );
  }

  return (await res.json()) as T;
}

/**
 * Follow cursor pagination to exhaustion, collecting `key` from each page.
 *
 * Cursor pagination is activated by `page[size]`; Zendesk then returns
 * `links.next` (and `meta.has_more`). Offset pagination returns `next_page`
 * instead — accept both so the caller does not care which mode is served.
 */
export async function getAllPages<T>(
  cfg: ZendeskConfig,
  startUrl: string,
  key: string,
  opts: { limit?: number; label?: string } = {},
): Promise<T[]> {
  const out: T[] = [];
  let url: string | null = startUrl;
  let page = 0;

  while (url) {
    page++;
    const body: Record<string, unknown> = await getJson<
      Record<string, unknown>
    >(cfg, url);
    const items = (body[key] ?? []) as T[];
    out.push(...items);

    const label = opts.label ?? key;
    console.log(`   page ${page}: +${items.length} ${label} (${out.length})`);

    if (opts.limit && out.length >= opts.limit) {
      out.length = opts.limit;
      console.log(`   ⏹ stopped at --limit ${opts.limit}`);
      break;
    }

    const links = body.links as { next?: string | null } | undefined;
    url = links?.next ?? (body.next_page as string | null) ?? null;
  }

  return out;
}

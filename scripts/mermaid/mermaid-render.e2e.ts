/**
 * Browser check of the Mermaid renderer (components/MermaidDiagram) on real
 * guides — run with `pnpm mermaid:e2e` against a running site:
 *
 *   pnpm dev                       # or pnpm preview after a build
 *   MERMAID_E2E_BASE=http://localhost:3000 pnpm mermaid:e2e
 *   MERMAID_E2E_PAGES=/fr/guides/…,/fr/guides/… (optional, comma-separated)
 *
 * For every diagram of the pages below, at three window widths, it asserts:
 *   - the diagram is rendered (an SVG, not the error panel);
 *   - the WHOLE diagram is inside its frame (nothing hidden), ratio kept, and
 *     the page itself never scrolls horizontally;
 *   - no word of a frame title lies under an arrow;
 *   - the content of every frame is centred in it (± 2 px);
 *   - a click zooms the diagram, a click and Escape close the zoom.
 * Exit code 1 on any failure.
 *
 * Browser: Playwright's Chromium (`pnpm exec playwright install chromium`), or
 * an existing one via PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 */

import { chromium, type Page } from 'playwright';

const BASE = (process.env.MERMAID_E2E_BASE ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);
// Representative diagrams: frames with titles crossed by arrows, a frame whose
// content Mermaid places off-centre, a group of blocks, a very wide LR diagram.
const DEFAULT_PAGES = [
  '/guides/public-cloud/containers-orchestration/managed-kubernetes/understanding-mks-architecture',
  '/en/guides/public-cloud/containers-orchestration/managed-kubernetes/understanding-mks-architecture',
  '/guides/public-cloud/containers-orchestration/managed-kubernetes/vrack-custom-gateway',
];
// MERMAID_E2E_PAGES=path1,path2 — e.g. against a single-locale build (/fr/guides/…)
const PAGES = process.env.MERMAID_E2E_PAGES
  ? process.env.MERMAID_E2E_PAGES.split(',').map((x) => x.trim())
  : DEFAULT_PAGES;
const WIDTHS = [390, 1024, 1440];

type Failure = string;

async function checkPage(
  page: Page,
  url: string,
  width: number,
): Promise<Failure[]> {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(BASE + url, { timeout: 300_000 });
  // consent banner, when the site shows one
  await page
    .locator('#header_tc_privacy_button')
    .click({ timeout: 3_000 })
    .catch(() => {});
  await page.waitForFunction(
    () => {
      const figs = [...document.querySelectorAll('figure.ovh-mermaid')];
      return (
        figs.length > 0 &&
        figs.every(
          (f) =>
            (f as HTMLElement).dataset.mermaidState === 'rendered' ||
            f.classList.contains('ovh-mermaid--error'),
        )
      );
    },
    null,
    { timeout: 120_000 },
  );
  const where = `${url} @${width}px`;
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 1)
      out.push('the page scrolls horizontally');
    document.querySelectorAll('figure.ovh-mermaid').forEach((fig, i) => {
      const n = `diagram ${i + 1}`;
      if (fig.classList.contains('ovh-mermaid--error')) {
        out.push(`${n}: render error`);
        return;
      }
      const svg = fig.querySelector<SVGSVGElement>('.ovh-mermaid__svg svg');
      const frame = fig.querySelector('.ovh-mermaid__frame');
      if (!svg || !frame) {
        out.push(`${n}: no SVG`);
        return;
      }
      const s = svg.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      if (s.left < f.left - 1 || s.right > f.right + 1)
        out.push(`${n}: wider than its frame (hidden part)`);
      if (
        vb.width &&
        Math.abs(s.width / s.height - vb.width / vb.height) > 0.01
      )
        out.push(`${n}: ratio not kept`);
      // arrows, sampled on screen
      const pts = [
        ...svg.querySelectorAll<SVGPathElement>('g.edgePaths path'),
      ].flatMap((p) => {
        const L = p.getTotalLength();
        const m = p.getScreenCTM();
        if (!m) return [];
        return Array.from({ length: 201 }, (_, k) => {
          const q = p.getPointAtLength((L * k) / 200);
          return new DOMPoint(q.x, q.y).matrixTransform(m);
        });
      });
      // no word of a frame title under an arrow
      svg.querySelectorAll('g.cluster-label').forEach((label) => {
        const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          const re = /[^\s ]+/g;
          for (
            let m = re.exec(t.nodeValue ?? '');
            m;
            m = re.exec(t.nodeValue ?? '')
          ) {
            const r = document.createRange();
            r.setStart(t, m.index);
            r.setEnd(t, m.index + m[0].length);
            const b = r.getBoundingClientRect();
            if (
              pts.some(
                (p) =>
                  p.x > b.left &&
                  p.x < b.right &&
                  p.y > b.top &&
                  p.y < b.bottom,
              )
            )
              out.push(`${n}: title word « ${m[0]} » under an arrow`);
          }
        }
      });
      // content centred in every frame
      svg.querySelectorAll('g.cluster').forEach((c) => {
        const rect = c.querySelector(':scope > rect');
        if (!rect) return;
        const r = rect.getBoundingClientRect();
        const inner = [
          ...svg.querySelectorAll('g.node'),
          ...[...c.querySelectorAll('g.cluster > rect')].filter(
            (x) => x !== rect,
          ),
        ]
          .filter(
            (x) => (x.textContent ?? '').trim() !== '' || x.tagName === 'rect',
          )
          .map((x) => x.getBoundingClientRect())
          .filter(
            (b) =>
              b.left >= r.left - 1 &&
              b.right <= r.right + 1 &&
              b.top >= r.top - 1 &&
              b.bottom <= r.bottom + 1,
          );
        if (!inner.length) return;
        const left = Math.min(...inner.map((b) => b.left)) - r.left;
        const right = r.right - Math.max(...inner.map((b) => b.right));
        if (Math.abs(left - right) > 2)
          out.push(
            `${n}: frame content off-centre by ${Math.round(left - right)} px`,
          );
      });
    });
    return out;
  });
  const failures = problems.map((p) => `${where} — ${p}`);
  // zoom: click opens, click closes; Escape closes
  const frame = page.locator('.ovh-mermaid__frame').first();
  await frame.scrollIntoViewIfNeeded();
  await frame.click();
  if (!(await page.locator('.ovh-mermaid__zoom').count()))
    failures.push(`${where} — a click does not open the zoom`);
  await page.mouse.click(4, 4);
  if (await page.locator('.ovh-mermaid__zoom').count())
    failures.push(`${where} — a click does not close the zoom`);
  await frame.click();
  await page.keyboard.press('Escape');
  if (await page.locator('.ovh-mermaid__zoom').count())
    failures.push(`${where} — Escape does not close the zoom`);
  return failures;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
  });
  const page = await browser.newPage();
  const failures: Failure[] = [];
  let checks = 0;
  try {
    for (const url of PAGES)
      for (const width of WIDTHS) {
        failures.push(...(await checkPage(page, url, width)));
        checks++;
      }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error(
      `✗ ${failures.length} failure(s) over ${checks} page × width checks:\n  ${failures.join('\n  ')}`,
    );
    process.exit(1);
  }
  console.log(
    `✓ ${checks} page × width checks — diagrams whole, centred, no title word under an arrow, zoom OK`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

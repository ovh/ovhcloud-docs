/**
 * Geometric clean-up of a Mermaid SVG, applied once right after rendering and
 * before display (components/MermaidDiagram). It never touches the diagram
 * source, a text, a block or an arrow: it only
 *
 * 1. opens a gap in a frame title where an arrow crosses it — Mermaid draws
 *    titles under the arrows, so a crossing arrow hid their words (measured on
 *    understanding-mks-architecture and vrack-custom-gateway). The title is
 *    split at the word boundary that needs the smallest shift, an exact gap is
 *    put under the arrow, and the title is shifted just enough to bring that
 *    gap under it (words keep their normal spacing — a slightly off-centre
 *    title reads better than stretched spaces). No word is cut or moved to
 *    another line; the arrow and its head stay fully visible;
 * 2. centres the content of every frame (blocks, nested frames) in it — Mermaid
 *    widens a frame on one side when arrows leave an inner block (measured: up
 *    to 109 px off-centre). The frame rectangle is resized symmetrically around
 *    its content and its title re-centred; blocks and arrows stay where Mermaid
 *    put them. A frame never becomes narrower than its title.
 *
 * Needs the SVG attached to the document (getBBox / getCTM): the caller mounts
 * it off-screen, calls polishSvg, and serialises the result.
 */

const GAP_SIDE = 10; // free space on each side of an arrow crossing a title
const MIN_SIDE = 8; // smallest free space kept between a frame and its content

export function polishSvg(svg: SVGSVGElement): void {
  // frames first: the title gaps are computed on the final frame geometry
  centreFrames(svg);
  openTitleGaps(svg);
}

function centreFrames(svg: SVGSVGElement): void {
  const nodes = [...svg.querySelectorAll<SVGGElement>('g.node')].filter(
    (n) => (n.textContent ?? '').replace(/[\s ]/g, '') !== '',
  );
  // innermost frames first: a nested frame's final box is part of its parent's content
  const clusters = [...svg.querySelectorAll<SVGGElement>('g.cluster')].sort(
    (a, b) => area(rectOf(a)) - area(rectOf(b)),
  );
  for (const cluster of clusters) {
    const rect = cluster.querySelector<SVGRectElement>(':scope > rect');
    if (!rect) continue;
    const r = box(rect);
    const inside = (b: DOMRect) =>
      b.x >= r.x - 1 &&
      b.x + b.width <= r.x + r.width + 1 &&
      b.y >= r.y - 1 &&
      b.y + b.height <= r.y + r.height + 1;
    const content = [
      ...nodes.map((n) => bboxIn(n, rect)),
      ...clusters
        .filter((c) => c !== cluster)
        .map((c) => rectOf(c))
        .filter((b): b is DOMRect => !!b),
    ].filter(
      (b): b is DOMRect =>
        !!b && inside(b) && !(b.x === r.x && b.width === r.width),
    );
    if (!content.length) continue;
    const left = Math.min(...content.map((b) => b.x));
    const right = Math.max(...content.map((b) => b.x + b.width));
    const gapL = left - r.x;
    const gapR = r.x + r.width - right;
    const label = cluster.querySelector<SVGGElement>(
      ':scope > g.cluster-label',
    );
    const titleW = label ? label.getBBox().width : 0;
    const centred = Math.abs(gapL - gapR) <= 2;
    const wideEnough = r.width >= titleW + 2 * MIN_SIDE;
    if (centred && wideEnough) continue;
    const side = centred
      ? Math.max(MIN_SIDE, gapL)
      : Math.max(MIN_SIDE, Math.min(gapL, gapR));
    let width = right - left + 2 * side;
    if (width < titleW + 2 * MIN_SIDE) width = titleW + 2 * MIN_SIDE;
    const centre = (left + right) / 2;
    const x = centre - width / 2;
    rect.setAttribute('x', String(x));
    rect.setAttribute('width', String(width));
    if (label) {
      const lb = label.getBBox();
      const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(
        label.getAttribute('transform') ?? '',
      );
      if (m) {
        // getBBox is in the title's own coordinates (its translate excluded):
        // shift it by the distance between the frame centre and its centre
        const current = Number(m[1]) + lb.x + lb.width / 2;
        label.setAttribute(
          'transform',
          `translate(${Number(m[1]) + (centre - current)}, ${m[2]})`,
        );
      }
    }
  }
}

function openTitleGaps(svg: SVGSVGElement): void {
  const paths = [...svg.querySelectorAll<SVGPathElement>('g.edgePaths path')];
  for (const label of [
    ...svg.querySelectorAll<SVGGElement>('g.cluster-label'),
  ]) {
    const span = label.querySelector<HTMLElement>('span.nodeLabel');
    const fo = label.querySelector<SVGForeignObjectElement>('foreignObject');
    const cluster = label.closest('g.cluster');
    const rect = cluster?.querySelector<SVGRectElement>(':scope > rect');
    if (!span || !fo || !rect) continue;
    const text = (span.textContent ?? '').trim();
    const words = text.split(/\s+/);
    if (words.length < 2) continue;
    // screen geometry: the off-screen SVG is laid out at its natural size
    const band = span.getBoundingClientRect();
    const crossing = paths
      .map((p) => {
        const L = p.getTotalLength();
        const xs: number[] = [];
        for (let k = 0; k <= 200; k++) {
          const q = p.getPointAtLength((L * k) / 200);
          const s = new DOMPoint(q.x, q.y).matrixTransform(
            p.getScreenCTM() ?? undefined,
          );
          if (
            s.y > band.top &&
            s.y < band.bottom &&
            s.x > band.left - GAP_SIDE &&
            s.x < band.right + GAP_SIDE
          )
            xs.push(s.x);
        }
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
      })
      .filter((x): x is number => x !== null);
    if (!crossing.length) continue;
    const A = crossing[0];
    // word boxes
    const node = span.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) continue;
    const boxes: DOMRect[] = [];
    let at = (node.textContent ?? '').indexOf(words[0]);
    for (const w of words) {
      at = (node.textContent ?? '').indexOf(w, at);
      const r = document.createRange();
      r.setStart(node, at);
      r.setEnd(node, at + w.length);
      boxes.push(r.getBoundingClientRect());
      at += w.length;
    }
    const space = boxes.length > 1 ? boxes[1].left - boxes[0].right : 4;
    const rr = rect.getBoundingClientRect();
    const C = (rr.left + rr.right) / 2;
    const widths = boxes.map((b) => b.width);
    const gapW = 2 * GAP_SIDE;
    // gap centre = title centre + (L − R) / 2 ; it must sit at A, so the title
    // centre goes to A − (L − R) / 2 — keep the split that shifts it least
    let best: { k: number; centre: number } | null = null;
    for (let k = 1; k < words.length; k++) {
      const L = widths.slice(0, k).reduce((a, b) => a + b, 0) + (k - 1) * space;
      const R =
        widths.slice(k).reduce((a, b) => a + b, 0) +
        (words.length - k - 1) * space;
      const centre = A - (L - R) / 2;
      if (!best || Math.abs(centre - C) < Math.abs(best.centre - C))
        best = { k, centre };
    }
    if (!best) continue;
    // rebuild the title: left words · exact gap · right words (normal spacing)
    const doc = span.ownerDocument;
    const left = doc.createElement('span');
    left.textContent = words.slice(0, best.k).join(' ');
    const gap = doc.createElement('span');
    gap.style.display = 'inline-block';
    gap.style.width = `${gapW}px`;
    const right = doc.createElement('span');
    right.textContent = words.slice(best.k).join(' ');
    span.textContent = '';
    span.append(left, gap, right);
    // resize the title box to its new width and move it to the computed centre
    const div = span.closest('div');
    const newW = span.getBoundingClientRect().width;
    fo.setAttribute('width', String(newW));
    if (div) div.style.width = `${newW}px`;
    const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(
      label.getAttribute('transform') ?? '',
    );
    if (m) {
      const lb = label.getBoundingClientRect();
      const dx = best.centre - (lb.left + lb.right) / 2;
      label.setAttribute(
        'transform',
        `translate(${Number(m[1]) + dx}, ${m[2]})`,
      );
    }
    // the frame must contain its title, shifted or not: widen it symmetrically
    // about its own centre (its content stays centred)
    const r = box(rect);
    const lb2 = label.getBoundingClientRect();
    const half = Math.max(C - lb2.left, lb2.right - C) + MIN_SIDE;
    if (r.width < 2 * half) {
      const cx = r.x + r.width / 2;
      rect.setAttribute('x', String(cx - half));
      rect.setAttribute('width', String(2 * half));
    }
  }
}

function rectOf(cluster: Element): DOMRect | null {
  const rect = cluster.querySelector<SVGRectElement>(':scope > rect');
  return rect ? box(rect) : null;
}

function box(rect: SVGRectElement): DOMRect {
  return new DOMRect(
    Number(rect.getAttribute('x')),
    Number(rect.getAttribute('y')),
    Number(rect.getAttribute('width')),
    Number(rect.getAttribute('height')),
  );
}

function area(b: DOMRect | null): number {
  return b ? b.width * b.height : 0;
}

/** Bounding box of an element, expressed in the coordinates of `ref`. */
function bboxIn(
  el: SVGGraphicsElement,
  ref: SVGGraphicsElement,
): DOMRect | null {
  const b = el.getBBox();
  const m = el.getCTM();
  const r = ref.getCTM();
  if (!m || !r) return null;
  const k = r.inverse().multiply(m);
  const p1 = new DOMPoint(b.x, b.y).matrixTransform(k);
  const p2 = new DOMPoint(b.x + b.width, b.y + b.height).matrixTransform(k);
  return new DOMRect(
    Math.min(p1.x, p2.x),
    Math.min(p1.y, p2.y),
    Math.abs(p2.x - p1.x),
    Math.abs(p2.y - p1.y),
  );
}

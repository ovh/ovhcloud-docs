/**
 * Geometric clean-up of a Mermaid SVG, applied once right after rendering and
 * before display (components/MermaidDiagram). It never touches the diagram
 * source, a text or a block, and moves an arrow only at its ends: it only
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
 *    put them. A frame never becomes narrower than its title;
 * 3. tidies the arrows between rectangular blocks — Mermaid aims every arrow
 *    at the block's centre and cuts it at the border: an arrow bound for a
 *    block far to the side leaves from a corner (measured on
 *    understanding-mks-architecture: 1 px from the corner of a 436 px block),
 *    and an arrow that arrives slanted gets a slanted head, its corner hidden
 *    under the block (on close ranks, a head askew of a still-bending line:
 *    up to 57° on lakehouse-manager-policy-tags-groups-example). Between
 *    neighbouring ranks with nothing in
 *    between, an arrow is redrawn: a straight line when the blocks face each
 *    other, otherwise one S — square to both sides. A longer arrow keeps
 *    Mermaid's route, its ends made square to the side. The ends of a side
 *    are kept in the order of where their arrows go (no crossing added), off
 *    the corners and apart; an arrowhead alone on its side aims at the side's
 *    middle (straight when the other block can face it, else one S); every
 *    line stops where its head's tip touches the block. Labels follow their
 *    arrow. Flowcharts only; a round block keeps Mermaid's radial ends, an
 *    arrow the step cannot read is left as it is.
 *    The stem of a flowchart — its head blocks, one per rank — is first
 *    centred over the first rank that branches (Mermaid lines it up with one
 *    branch), and each block alone on its rank in the tail is lined up under
 *    the one block its only incoming arrow comes from (Mermaid leaves it
 *    aside, too close for an S) — kept only if the move spoils nothing
 *    (blocks, frames, labels, arrows checked before and after; both moves,
 *    then each alone; the drawing's frame refitted).
 *    Rejected on the way (2026-10-26): Mermaid 10.9's ELK renderer (dotted
 *    links drawn solid, arrows across frame titles, the classes this clean-up
 *    and the e2e check rely on dropped); Mermaid's curves with only their ends
 *    moved (heads askew of a bending line, extra wiggles).
 *
 * Needs the SVG attached to the document (getBBox / getCTM): the caller mounts
 * it off-screen, calls polishSvg, and serialises the result.
 */

const GAP_SIDE = 10; // free space on each side of an arrow crossing a title
const MIN_SIDE = 8; // smallest free space kept between a frame and its content
const END_MARGIN = 12; // smallest distance between an arrow end and a block corner
const END_SPACING = 8; // closer than this, two arrow ends on a side overlap
const END_GAP = 24; // closer than this, ends on a side look bunched: all spaced evenly
const HEAD_RUN = 20; // straight stretch before an arrowhead on a kept route (head: 12 px)
const TAIL_RUN = 8; // straight stretch an arrow end without head leaves by
const S_MIN = 10; // an S offset by less reads as a kink: drawn straight instead
const HEAD_SKEW = 10; // beyond this angle (degrees) to its line, a head looks askew
const LABEL_GAP = 3; // free space kept around a moved arrow label
const LABEL_STEP = 2; // px along its arrow between two places tried for a label
const LABEL_HEAD = 14; // the stretch of its own arrow a label keeps off: its head (12 px)
const LABEL_SHIFT = 4; // px between two places tried aside of its arrow for a label
const LABEL_HOLD = 8; // a label shifted aside keeps its arrow this far inside its edges

/** Flowchart direction, from the diagram source: `flowchart LR`, `graph TD`… */
export function flowDirection(code: string): 'vertical' | 'horizontal' | null {
  const m = /^\s*(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)\b/im.exec(code);
  if (!m) return null;
  const d = m[1].toUpperCase();
  return d === 'LR' || d === 'RL' ? 'horizontal' : 'vertical';
}

export function polishSvg(
  svg: SVGSVGElement,
  direction: 'vertical' | 'horizontal' | null = null,
): void {
  // frames first: the title gaps are computed on the final frame geometry;
  // arrow ends before the gaps, which are computed on the final arrows
  centreFrames(svg);
  let refit = false;
  if (direction) {
    // the arrows are redrawn and checked against Mermaid's own drawing; then
    // the stem and tail moves, kept only if they spoil nothing more
    const base = flaws(svg);
    const before = svg.innerHTML;
    const skip = new Set<string>();
    tidyChecked(svg, direction, base, skip);
    const plain = svg.innerHTML;
    const known = flaws(svg);
    // both moves, then each alone: the first that spoils nothing new stays
    const moves = [
      { attr: 'data-ovh-stem', done: 'centred', run: centreStem },
      { attr: 'data-ovh-tail', done: 'aligned', run: alignTail },
    ];
    const tried = new Set<number>();
    const seen = new Set<string>();
    let kept: number[] | null = null;
    for (const set of [[0, 1], [0], [1]]) {
      svg.innerHTML = before;
      const done = set.filter((k) => moves[k].run(svg, direction));
      if (!done.length || seen.has(done.join())) continue;
      seen.add(done.join());
      for (const k of done) tried.add(k);
      tidyArrows(svg, direction, skip);
      if ([...flaws(svg)].every((f) => known.has(f))) {
        kept = done;
        break;
      }
    }
    if (!kept) svg.innerHTML = plain;
    for (const k of tried)
      svg.setAttribute(
        moves[k].attr,
        kept?.includes(k) ? moves[k].done : 'kept',
      );
    if (kept?.length) {
      svg.setAttribute('data-ovh-flow', direction);
      refit = true;
    }
  }
  // last, on the drawing kept, every kind of diagram (a state diagram is not
  // redrawn above): a redraw or a move putting a label on another arrow or
  // label was refused above, so only Mermaid's own overlaps are left here.
  // Never inside the checks: a label slid aside would let a redraw through
  // that was refused for the label it put on a block
  if (clearLabels(svg)) refit = true;
  openTitleGaps(svg);
  if (refit) fitViewBox(svg);
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
    // the element holding the title text: Mermaid 12 wraps it in a <p>
    const span =
      label.querySelector<HTMLElement>('span.nodeLabel > p') ??
      label.querySelector<HTMLElement>('span.nodeLabel');
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

type Pt = { x: number; y: number };
type Side = 'top' | 'bottom' | 'left' | 'right';

type Axis = 'vertical' | 'horizontal';

interface Link {
  path: SVGPathElement;
  pts: Pt[]; // the points Mermaid's basis curve was drawn through
  ids: [string, string];
  rects: [SVGRectElement | null, SVGRectElement | null]; // rectangular blocks
  boxes: [DOMRect | null, DOMRect | null];
  connector: boolean; // neighbouring ranks, nothing in between: redrawn whole
  start: ArrowEnd | null;
  end: ArrowEnd | null;
  label: SVGGElement | null;
}

interface ArrowEnd {
  link: Link;
  which: 'start' | 'end';
  key: string; // block id and side
  box: DOMRect;
  side: Side;
  margin: number;
  setback: number; // how far its arrowhead tip reaches past the line (0: none)
  order: number; // where the arrow heads for, along the side: sorts the ends
  want: number | null; // where it would rather sit: straight arrow, or Mermaid's spot
  base: number | null; // that wish before a lone arrowhead's middle overrides it
  pos: number;
}

function tidyArrows(
  svg: SVGSVGElement,
  axis: Axis,
  skip: Set<string> = new Set(),
): Map<string, string> {
  const blocks = new Map<string, SVGRectElement>();
  for (const n of svg.querySelectorAll<SVGGElement>('g.node')) {
    const id = blockId(n);
    const rect = n.querySelector<SVGRectElement>(
      ':scope > rect.label-container',
    );
    if (id && rect) blocks.set(id, rect);
  }
  const nodes = [...svg.querySelectorAll<SVGGElement>('g.node')];
  const allLabels = [
    ...svg.querySelectorAll<SVGGElement>('g.edgeLabels > g.edgeLabel'),
  ];
  const labels = allLabels.filter((l) => (l.textContent ?? '').trim() !== '');
  const links: Link[] = [];
  for (const path of svg.querySelectorAll<SVGPathElement>('g.edgePaths path')) {
    const [from, to] = linkIds(path);
    if (!from || !to || from === to || skip.has(path.id)) continue;
    const pts = basisPoints(path.getAttribute('d') ?? '');
    if (!pts) continue; // not a curve this step can redraw faithfully
    const ra = blocks.get(from);
    const rb = blocks.get(to);
    links.push({
      path,
      pts,
      ids: [from, to],
      rects: [ra ?? null, rb ?? null],
      boxes: [ra ? bboxIn(ra, path) : null, rb ? bboxIn(rb, path) : null],
      connector: false,
      start: null,
      end: null,
      label: null,
    });
  }
  // Mermaid centres each label on the middle of its arrow's route — not
  // always: a label it ranked near an end is missed here, and one the redraw
  // would leave behind is refused by flaws() (astray)
  for (const label of labels) {
    const t = translateOf(label);
    let best: { link: Link; d: number } | null = null;
    for (const link of links) {
      if (link.label || label.closest('g.root') !== link.path.closest('g.root'))
        continue;
      const m = polylineMiddle(link.pts);
      const d = Math.hypot(m.x - t.x, m.y - t.y);
      if (d < 20 && (!best || d < best.d)) best = { link, d };
    }
    if (best) best.link.label = label;
  }
  // which arrow each label follows, by the label's place in the drawing — for
  // flaws(), whose label keys use that place
  const labelled = new Map<string, string>();
  for (const link of links)
    if (link.label)
      labelled.set(String(allLabels.indexOf(link.label)), link.path.id);

  const groups = new Map<string, ArrowEnd[]>();
  for (const link of links) {
    const [a, b] = link.boxes;
    // neighbouring ranks: a straight arrow when the blocks face each other,
    // otherwise one S — unless that would cross another block or a label
    const sep = a && b ? separation(a, b, axis) : 0;
    if (a && b && sep) {
      const probe = connectorPath(
        ...provisionalEnds(a, b, axis, sep),
        axis,
        0,
        0,
      );
      link.connector = !crosses(link, probe, nodes, labels, a, b);
    }
    for (const which of ['start', 'end'] as const) {
      const box = link.boxes[which === 'start' ? 0 : 1];
      if (!box) continue;
      const own =
        which === 'start' ? link.pts[0] : link.pts[link.pts.length - 1];
      const toward =
        which === 'start' ? link.pts[1] : link.pts[link.pts.length - 2];
      const side: Side = link.connector
        ? facingSide(axis, which === 'start' ? sep : -sep)
        : sideToward(box, toward);
      const horizontalSide = side === 'top' || side === 'bottom';
      const along = (p: Pt) => (horizontalSide ? p.x : p.y);
      const [lo, hi] = horizontalSide
        ? [box.x, box.x + box.width]
        : [box.y, box.y + box.height];
      const i = which === 'start' ? 0 : 1;
      const rx = Number(link.rects[i]?.getAttribute('rx') ?? 0) || 0;
      // off the corner by a share of the side: 12 px reads as the corner on a
      // 436 px block
      const margin = Math.max(END_MARGIN + rx, Math.min(30, (hi - lo) / 10));
      const other = link.boxes[which === 'start' ? 1 : 0];
      let order = along(toward);
      // a kept route: in line with where it goes next, so it needs no hook;
      // too far past the side for that, it takes a free spot
      const next = Math.min(Math.max(along(toward), lo + margin), hi - margin);
      let want: number | null =
        Math.abs(along(toward) - next) <= margin ? next : null;
      if (link.connector && other) {
        const [olo, ohi] = horizontalSide
          ? [other.x, other.x + other.width]
          : [other.y, other.y + other.height];
        order = (olo + ohi) / 2;
        const from = Math.max(lo, olo) + margin;
        const to = Math.min(hi, ohi) - margin;
        want = to >= from ? (from + to) / 2 : null;
      }
      const end: ArrowEnd = {
        link,
        which,
        key: `${link.ids[i]} ${side}`,
        box,
        side,
        margin,
        setback: markerSetback(svg, link.path, which),
        order,
        want,
        base: want,
        pos: along(own),
      };
      link[which] = end;
      const list = groups.get(end.key) ?? [];
      list.push(end);
      groups.set(end.key, list);
    }
  }

  // an arrowhead alone on its side aims at the side's middle; the other end
  // of a connector faces it when its own side allows — a straight arrow.
  // Where that bends the line right under a head (blocks too close for an S
  // with straight ends), that arrow keeps its spot: second pass.
  const span = (e: ArrowEnd) =>
    e.side === 'top' || e.side === 'bottom'
      ? [e.box.x, e.box.x + e.box.width]
      : [e.box.y, e.box.y + e.box.height];
  const lone = new Set<ArrowEnd>();
  for (const ends of groups.values())
    if (ends.length === 1 && ends[0].setback) lone.add(ends[0]);
  for (let pass = 0; pass < 2; pass++) {
    for (const ends of groups.values()) for (const e of ends) e.want = e.base;
    for (const e of lone) {
      const [lo, hi] = span(e);
      e.want = (lo + hi) / 2;
    }
    for (const e of lone) {
      const o = e.which === 'start' ? e.link.end : e.link.start;
      if (!e.link.connector || !o || lone.has(o) || e.want === null) continue;
      const [lo, hi] = span(o);
      o.want =
        e.want >= lo + o.margin && e.want <= hi - o.margin ? e.want : null;
    }
    for (const ends of groups.values()) placeEnds(ends);
    // an S barely off straight reads as a kink: the lone head gives way
    for (const link of links) {
      const { start, end } = link;
      if (!link.connector || !start || !end) continue;
      const gap = end.pos - start.pos;
      if (gap === 0 || Math.abs(gap) >= S_MIN) continue;
      const [e, o] = lone.has(end)
        ? [end, start]
        : lone.has(start)
          ? [start, end]
          : [null, null];
      if (!e || !o) continue;
      const [lo, hi] = span(e);
      if (o.pos >= lo + e.margin && o.pos <= hi - e.margin) e.pos = o.pos;
    }
    for (const link of links) drawLink(link, axis);
    const askew = [...lone].filter(
      (e) => headSkew(e.link.path, e.which) > HEAD_SKEW,
    );
    if (!askew.length) break;
    for (const e of askew) lone.delete(e);
  }
  return labelled;
}

/** tidyArrows, checked with flaws() against Mermaid's drawing (base): an
 *  arrow that now runs through a block, comes loose from one or puts its
 *  label on one is left as Mermaid drew it (added to skip) and the others
 *  redrawn again; a new flaw no single arrow accounts for leaves every arrow
 *  as Mermaid drew it. */
function tidyChecked(
  svg: SVGSVGElement,
  axis: Axis,
  base: Set<string>,
  skip: Set<string>,
): void {
  const before = svg.innerHTML;
  for (let pass = 0; pass < 4; pass++) {
    const labelled = tidyArrows(svg, axis, skip);
    const added = [...flaws(svg)].filter((f) => !base.has(f));
    if (!added.length) return;
    const culprits = new Set<string>();
    for (const f of added) {
      const [kind, a, b] = f.split('|');
      const ids =
        kind === 'label'
          ? [labelled.get(a)]
          : kind === 'over'
            ? [labelled.get(a), b]
            : kind === 'labels'
              ? [labelled.get(a), labelled.get(b)]
              : kind === 'astray'
                ? [b]
                : kind === 'through' || kind === 'loose'
                  ? [a]
                  : [];
      for (const id of ids) if (id && !skip.has(id)) culprits.add(id);
    }
    svg.innerHTML = before;
    if (!culprits.size) return;
    for (const id of culprits) skip.add(id);
  }
  svg.innerHTML = before;
}

function drawLink(link: Link, axis: Axis): void {
  if (!link.start && !link.end) return;
  // tells the e2e check which arrows this step answers for
  link.path.setAttribute('data-ovh-tidy', '');
  if (link.connector && link.start && link.end)
    link.path.setAttribute(
      'd',
      connectorPath(
        endPoint(link.start),
        endPoint(link.end),
        axis,
        link.start.setback ? HEAD_RUN / 2 + 4 : 0,
        link.end.setback ? HEAD_RUN / 2 + 4 : 0,
      ),
    );
  else link.path.setAttribute('d', routePath(link, axis));
  if (link.label) {
    const L = link.path.getTotalLength();
    const m = link.path.getPointAtLength(L / 2);
    link.label.setAttribute('transform', `translate(${m.x}, ${m.y})`);
  }
}

/** Angle, in degrees, between an arrowhead and the line just behind it (the
 *  head is 12 px long): the head follows the line's very end, so a line still
 *  bending there leaves the head askew of the line the reader sees. */
function headSkew(path: SVGPathElement, which: 'start' | 'end'): number {
  const L = path.getTotalLength();
  if (L < 30) return 0;
  const P = (t: number) => path.getPointAtLength(t);
  const [tip, back, base, behind] =
    which === 'end'
      ? [P(L), P(L - 0.5), P(L - 13), P(L - 15)]
      : [P(0), P(0.5), P(13), P(15)];
  const a = Math.atan2(tip.y - back.y, tip.x - back.x);
  const b = Math.atan2(base.y - behind.y, base.x - behind.x);
  const d = Math.abs(a - b) * (180 / Math.PI);
  return Math.min(d, 360 - d);
}

/** Spots for the ends on one block side, in the order of where their arrows
 *  go (no crossing added): the straight arrows and Mermaid's good spots stay,
 *  the others share the free stretches evenly; ends crowded against a corner
 *  or against each other are all spaced evenly instead. */
function placeEnds(ends: ArrowEnd[]): void {
  const { box, side, margin } = ends[0];
  const horizontalSide = side === 'top' || side === 'bottom';
  const [lo, hi] = horizontalSide
    ? [box.x, box.x + box.width]
    : [box.y, box.y + box.height];
  ends.sort((a, b) => a.order - b.order);
  let last = Number.NEGATIVE_INFINITY;
  for (const e of ends) {
    if (e.want !== null && e.want - last < END_SPACING) e.want = null;
    if (e.want !== null) last = e.want;
  }
  for (let i = 0; i < ends.length; ) {
    const w = ends[i].want;
    if (w !== null) {
      ends[i].pos = w;
      i++;
      continue;
    }
    let j = i;
    while (j < ends.length && ends[j].want === null) j++;
    const from = i > 0 ? ends[i - 1].pos : lo;
    const to = j < ends.length ? (ends[j].want as number) : hi;
    const step = (to - from) / (j - i + 1);
    for (let k = i; k < j; k++) ends[k].pos = from + step * (k - i + 1);
    i = j;
  }
  const crowded = ends.some(
    (e, i) =>
      e.pos < lo + margin - 0.5 ||
      e.pos > hi - margin + 0.5 ||
      (i > 0 && e.pos - ends[i - 1].pos < END_GAP),
  );
  if (crowded) {
    const step = (hi - lo) / (ends.length + 1);
    ends.forEach((e, i) => {
      e.pos = lo + step * (i + 1);
    });
  }
}

/** Where the line of an arrow end stops: on its spot on the block side, set
 *  back by the length its arrowhead reaches past the line, so that the tip
 *  touches the block instead of hiding under it. */
function endPoint(e: ArrowEnd): Pt {
  const out = e.side === 'bottom' || e.side === 'right' ? 1 : -1;
  const line = {
    top: e.box.y,
    bottom: e.box.y + e.box.height,
    left: e.box.x,
    right: e.box.x + e.box.width,
  }[e.side];
  const across = line + out * e.setback;
  return e.side === 'top' || e.side === 'bottom'
    ? { x: e.pos, y: across }
    : { x: across, y: e.pos };
}

/** A straight line when both ends face each other, otherwise one S square to
 *  both sides, with a straight stretch under each arrowhead. */
function connectorPath(
  s: Pt,
  e: Pt,
  axis: Axis,
  runS: number,
  runE: number,
): string {
  const f = (v: number) => String(Math.round(v * 1000) / 1000);
  const pt = (q: Pt) => `${f(q.x)},${f(q.y)}`;
  const flow = (q: Pt) => (axis === 'vertical' ? q.y : q.x);
  const cross = (q: Pt) => (axis === 'vertical' ? q.x : q.y);
  const make = (fl: number, cr: number): Pt =>
    axis === 'vertical' ? { x: cr, y: fl } : { x: fl, y: cr };
  if (Math.abs(cross(s) - cross(e)) < 0.5) return `M${pt(s)}L${pt(e)}`;
  const dir = Math.sign(flow(e) - flow(s));
  const span = Math.abs(flow(e) - flow(s));
  const fit = span >= runS + runE + 16;
  const s1 = make(flow(s) + dir * (fit ? runS : 0), cross(s));
  const e1 = make(flow(e) - dir * (fit ? runE : 0), cross(e));
  const mid = (flow(s1) + flow(e1)) / 2;
  return `M${pt(s)}L${pt(s1)}C${pt(make(mid, cross(s1)))},${pt(make(mid, cross(e1)))},${pt(e1)}L${pt(e)}`;
}

/** Mermaid's route, its ends moved to their spots and made square to the
 *  side: a straight stretch (20 px under an arrowhead, 8 px otherwise, at most
 *  a third of the way), the Mermaid points inside that stretch dropped —
 *  except the two that keep an untouched far end arriving straight. */
function routePath(link: Link, axis: Axis): string {
  const { pts } = link;
  const inner = pts.slice(1, -1);
  const stretch = (e: ArrowEnd) => {
    const at = endPoint(e);
    const out = e.side === 'bottom' || e.side === 'right' ? 1 : -1;
    const dir =
      e.side === 'top' || e.side === 'bottom'
        ? { x: 0, y: out }
        : { x: out, y: 0 };
    const away = (p: Pt) => (p.x - at.x) * dir.x + (p.y - at.y) * dir.y;
    // entering a block by its flank, the route comes along its own column and
    // turns once, square to the side: the points between that column and
    // the block — aimed at where the end used to be — are dropped
    const flank = (axis === 'vertical') === (dir.x !== 0);
    const reach = inner.length ? Math.max(...inner.map(away)) : 0;
    const room = flank
      ? reach
      : away(e.which === 'start' ? pts[1] : pts[pts.length - 2]);
    const run = Math.max(
      0,
      Math.min(e.setback ? HEAD_RUN : TAIL_RUN, room / 3),
    );
    const step = (k: number) => ({
      x: at.x + dir.x * run * k,
      y: at.y + dir.y * run * k,
    });
    const corner =
      flank && reach > 3 * run
        ? dir.x !== 0
          ? { x: at.x + dir.x * reach, y: at.y }
          : { x: at.x, y: at.y + dir.y * reach }
        : null;
    const inside = (p: Pt) => away(p) < (corner ? reach - 2 : 2 * run + 4);
    return { at, run, step, inside, corner };
  };
  const st = link.start && stretch(link.start);
  const en = link.end && stretch(link.end);
  const n = inner.length;
  // the points near a moved end go, except the two that keep an untouched
  // far end arriving straight
  let kept = inner.map((p, i) => ({ p, i }));
  if (st) {
    const out = kept.findIndex(({ p }) => !st.inside(p));
    const first = out < 0 ? kept.length : out;
    kept = kept.filter(({ i }, k) => k >= first || (!en && i >= n - 2));
  }
  if (en) {
    let last = -1;
    kept.forEach(({ p }, k) => {
      if (!en.inside(p)) last = k;
    });
    kept = kept.filter(({ i }, k) => k <= last || (!st && i < 2));
  }
  const lead = (s: typeof st) =>
    s
      ? [
          ...(s.run > 1 ? [s.step(1), s.step(2)] : []),
          ...(s.corner ? [s.corner] : []),
        ]
      : [];
  return basisPath([
    ...(st ? [st.at, ...lead(st)] : [pts[0]]),
    ...kept.map(({ p }) => p),
    ...(en ? [...lead(en).reverse(), en.at] : [pts[pts.length - 1]]),
  ]);
}

/** +1 when block b lies wholly after block a along the flow, −1 before, 0 when
 *  they share a rank. */
function separation(a: DOMRect, b: DOMRect, axis: Axis): number {
  const [a0, a1, b0, b1] =
    axis === 'vertical'
      ? [a.y, a.y + a.height, b.y, b.y + b.height]
      : [a.x, a.x + a.width, b.x, b.x + b.width];
  if (a1 <= b0 - 4) return 1;
  if (b1 <= a0 - 4) return -1;
  return 0;
}

function facingSide(axis: Axis, sep: number): Side {
  if (axis === 'vertical') return sep > 0 ? 'bottom' : 'top';
  return sep > 0 ? 'right' : 'left';
}

/** The ends a connector would get alone: middle of the blocks' overlap, or
 *  each block's middle — to test it against the other blocks and labels. */
function provisionalEnds(
  a: DOMRect,
  b: DOMRect,
  axis: Axis,
  sep: number,
): [Pt, Pt] {
  const v = axis === 'vertical';
  const [alo, ahi, blo, bhi] = v
    ? [a.x, a.x + a.width, b.x, b.x + b.width]
    : [a.y, a.y + a.height, b.y, b.y + b.height];
  const lo = Math.max(alo, blo);
  const hi = Math.min(ahi, bhi);
  const [ca, cb] =
    hi - lo >= 2 * END_MARGIN
      ? [(lo + hi) / 2, (lo + hi) / 2]
      : [(alo + ahi) / 2, (blo + bhi) / 2];
  const fa = v
    ? sep > 0
      ? a.y + a.height
      : a.y
    : sep > 0
      ? a.x + a.width
      : a.x;
  const fb = v
    ? sep > 0
      ? b.y
      : b.y + b.height
    : sep > 0
      ? b.x
      : b.x + b.width;
  return v
    ? [
        { x: ca, y: fa },
        { x: cb, y: fb },
      ]
    : [
        { x: fa, y: ca },
        { x: fb, y: cb },
      ];
}

/** Whether a path drawn with `d` next to the link's own would run through a
 *  block other than its two, or through another arrow's label. */
function crosses(
  link: Link,
  d: string,
  nodes: SVGGElement[],
  labels: SVGGElement[],
  a: DOMRect,
  b: DOMRect,
): boolean {
  const probe = link.path.cloneNode() as SVGPathElement;
  probe.setAttribute('d', d);
  link.path.parentNode?.appendChild(probe);
  try {
    const obstacles = [
      ...nodes.map((n) => bboxIn(n, link.path)),
      ...labels
        .filter((l) => l !== link.label)
        .map((l) => bboxIn(l, link.path)),
    ].filter(
      (r): r is DOMRect =>
        !!r &&
        r.width > 0 &&
        !(Math.abs(r.x - a.x) < 1 && Math.abs(r.y - a.y) < 1) &&
        !(Math.abs(r.x - b.x) < 1 && Math.abs(r.y - b.y) < 1),
    );
    const L = probe.getTotalLength();
    for (let k = 1; k < 40; k++) {
      const q = probe.getPointAtLength((L * k) / 40);
      if (
        obstacles.some(
          (r) =>
            q.x > r.x - 2 &&
            q.x < r.x + r.width + 2 &&
            q.y > r.y - 2 &&
            q.y < r.y + r.height + 2,
        )
      )
        return true;
    }
    return false;
  } finally {
    probe.remove();
  }
}

/** How far the tip of the arrow's start or end marker reaches past the line
 *  (Mermaid's arrowheads: 4.8 px at the end, 5.4 px at the start). */
function markerSetback(
  svg: SVGSVGElement,
  path: SVGPathElement,
  which: 'start' | 'end',
): number {
  const ref = path.getAttribute(
    which === 'start' ? 'marker-start' : 'marker-end',
  );
  const id = ref ? /#([^)]+)\)/.exec(ref)?.[1] : undefined;
  const marker = id
    ? svg.querySelector<SVGMarkerElement>(`marker[id="${CSS.escape(id)}"]`)
    : null;
  const shape = marker?.querySelector('path')?.getAttribute('d');
  // a plain triangle in absolute moves (Mermaid's arrowheads); relative or
  // arc commands (cross, circle markers) cannot be read this way: no setback
  if (!marker || !shape || !/^[\sMLZz\d.,-]+$/.test(shape)) return 0;
  const vb = (marker.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  const scale = Number(marker.getAttribute('markerWidth')) / (vb[2] || 1);
  const xs = (shape.match(/-?\d*\.?\d+/g) ?? [])
    .map(Number)
    .filter((_, i) => i % 2 === 0);
  if (!xs.length || !scale) return 0;
  const tip = which === 'start' ? Math.min(...xs) : Math.max(...xs);
  return Math.abs(tip - Number(marker.getAttribute('refX'))) * scale;
}

/** A block's id in the diagram source, from Mermaid's `flowchart-<id>-<n>`. */
function blockId(el: Element): string | undefined {
  // Mermaid 12 prefixes it with the drawing's id: `<svg id>-flowchart-<id>-<n>`
  const own = el.closest('svg')?.id;
  const id =
    own && el.id.startsWith(`${own}-`) ? el.id.slice(own.length + 1) : el.id;
  return /^flowchart-(.+)-\d+$/.exec(id)?.[1];
}

/** A frame's id in the diagram source: Mermaid 12 prefixes it with the
 *  drawing's id, as it does the blocks'. */
function frameId(el: Element): string {
  const own = `${el.closest('svg')?.id}-`;
  return el.id.startsWith(own) ? el.id.slice(own.length) : el.id;
}

/** The source ids of an arrow's two ends, from Mermaid's edge id
 *  `L_<from>_<to>_<n>` (data-id) — split where both halves name a block or a
 *  frame of the drawing (an arrow may end on a frame: its block end is still
 *  redrawn); an id that splits more than one way is not read. */
function linkIds(path: Element): [string | undefined, string | undefined] {
  const m = /^L_(.+)_\d+$/.exec(path.getAttribute('data-id') ?? '');
  const svg = path.closest('svg');
  if (!m || !svg) return [undefined, undefined];
  const ids = new Set(
    [
      ...[...svg.querySelectorAll('g.node')].map(blockId),
      ...[...svg.querySelectorAll('g.cluster')].map(frameId),
    ].filter(Boolean),
  );
  const splits: [string, string][] = [];
  for (let i = m[1].indexOf('_'); i > 0; i = m[1].indexOf('_', i + 1)) {
    const [a, b] = [m[1].slice(0, i), m[1].slice(i + 1)];
    if (ids.has(a) && ids.has(b)) splits.push([a, b]);
  }
  return splits.length === 1 ? splits[0] : [undefined, undefined];
}

/** Whether box o holds box i (1 px slack). */
function holdsBox(o: DOMRect, i: DOMRect): boolean {
  return (
    i.x >= o.x - 1 &&
    i.y >= o.y - 1 &&
    i.x + i.width <= o.x + o.width + 1 &&
    i.y + i.height <= o.y + o.height + 1
  );
}

function translateOf(el: Element): Pt {
  const m = /translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\s*\)/.exec(
    el.getAttribute('transform') ?? '',
  );
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
}

/** The point halfway along a polyline — where Mermaid centres an edge label. */
function polylineMiddle(p: Pt[]): Pt {
  const seg = p.slice(1).map((q, i) => Math.hypot(q.x - p[i].x, q.y - p[i].y));
  let half = seg.reduce((s, l) => s + l, 0) / 2;
  for (let i = 0; i < seg.length; i++) {
    if (half <= seg[i]) {
      const t = seg[i] ? half / seg[i] : 0;
      return {
        x: p[i].x + (p[i + 1].x - p[i].x) * t,
        y: p[i].y + (p[i + 1].y - p[i].y) * t,
      };
    }
    half -= seg[i];
  }
  return p[p.length - 1];
}

/** Side of the block a kept route leaves or reaches it by: the one facing
 *  where the route goes next — sideways when that point lies further aside
 *  than above or below. */
function sideToward(box: DOMRect, q: Pt): Side {
  const r = box.x + box.width;
  const b = box.y + box.height;
  const dx = q.x > r ? q.x - r : q.x < box.x ? box.x - q.x : 0;
  const dy = q.y > b ? q.y - b : q.y < box.y ? box.y - q.y : 0;
  if (dx > dy) return q.x > box.x ? 'right' : 'left';
  return q.y > box.y + box.height / 2 ? 'bottom' : 'top';
}

/** The top-level blocks and frames of a flowchart with their boxes, and its
 *  ranks: Mermaid centres the blocks of a rank on one line across the flow. */
function rankLayout(svg: SVGSVGElement, axis: Axis) {
  const root = svg.querySelector<SVGGElement>('g.root');
  // a subgraph Mermaid renders in its own nested root escapes the ranks below:
  // nothing is moved in such a drawing
  if (!root || root.querySelector('g.root')) return null;
  const v = axis === 'vertical';
  const nodes = [
    ...root.querySelectorAll<SVGGElement>(':scope > g.nodes > g.node'),
  ];
  const clusters = [
    ...root.querySelectorAll<SVGGElement>(':scope > g.clusters > g.cluster'),
  ];
  const boxes = new Map<Element, DOMRect>();
  for (const n of nodes) {
    const b = bboxIn(n, root);
    if (b) boxes.set(n, b);
  }
  for (const c of clusters) {
    const r = c.querySelector<SVGRectElement>(':scope > rect');
    const b = r && bboxIn(r, root);
    if (b) boxes.set(c, b);
  }
  const bx = (e: Element) => boxes.get(e) as DOMRect;
  const flow = (b: DOMRect) => (v ? b.y + b.height / 2 : b.x + b.width / 2);
  const cross = (b: DOMRect) => (v ? b.x + b.width / 2 : b.y + b.height / 2);
  const ranks: SVGGElement[][] = [];
  for (const n of nodes
    .filter((n) => boxes.has(n))
    .sort((a, b) => flow(bx(a)) - flow(bx(b)))) {
    const last = ranks[ranks.length - 1];
    if (last && Math.abs(flow(bx(last[0])) - flow(bx(n))) < 1.5) last.push(n);
    else ranks.push([n]);
  }
  return { root, v, nodes, clusters, boxes, bx, cross, ranks };
}

/** Moves a block, its label and frame transforms, along the cross axis. */
function shiftAcross(el: Element, d: number, v: boolean): void {
  const t = translateOf(el);
  el.setAttribute(
    'transform',
    v ? `translate(${t.x + d}, ${t.y})` : `translate(${t.x}, ${t.y + d})`,
  );
}

/** The frames holding a block, or null when one of them holds other blocks
 *  too (it cannot follow the block without moving them). */
function framesOnlyHolding(
  block: SVGGElement,
  layout: NonNullable<ReturnType<typeof rankLayout>>,
): SVGGElement[] | null {
  const { nodes, clusters, boxes, bx } = layout;
  const out: SVGGElement[] = [];
  for (const c of clusters) {
    if (!boxes.has(c) || !holdsBox(bx(c), bx(block))) continue;
    if (
      nodes.some((n) => n !== block && boxes.has(n) && holdsBox(bx(c), bx(n)))
    )
      return null;
    out.push(c);
  }
  return out;
}

/** Lines up the tail of a flowchart — each rectangular block alone on its
 *  rank after the last rank that branches — under the one block its only
 *  incoming arrow comes from, in the rank just before: that arrow then runs
 *  straight into the block's middle. Mermaid leaves such a block aside
 *  (understanding-mks-architecture: the Load Balancer 92 px off Internet, too
 *  close for an S with straight ends). A frame holding only that block moves
 *  with it; anything else and the block stays. */
function alignTail(svg: SVGSVGElement, axis: Axis): boolean {
  const layout = rankLayout(svg, axis);
  if (!layout) return false;
  const { root, v, nodes, boxes, bx, cross, ranks } = layout;
  let last = -1;
  ranks.forEach((r, i) => {
    if (r.length > 1) last = i;
  });
  if (last < 0) return false;
  const links = [
    ...root.querySelectorAll<SVGPathElement>(':scope > g.edgePaths > path'),
  ].map((p) => {
    const [from, to] = linkIds(p);
    return { from, to, readable: !!basisPoints(p.getAttribute('d') ?? '') };
  });
  // an arrow that does not say which blocks it joins might be one on a block
  // moved here, and would be left behind: move nothing
  if (links.some((l) => !l.from || !l.to)) return false;
  let moved = false;
  for (let i = last + 1; i < ranks.length; i++) {
    const block = ranks[i][0];
    if (!block.querySelector(':scope > rect.label-container')) continue;
    const id = blockId(block);
    const incoming = links.filter((l) => l.to === id && l.from !== id);
    if (incoming.length !== 1) continue;
    // its arrows get redrawn on the new spot: they must be ones tidyArrows reads
    if (links.some((l) => (l.from === id || l.to === id) && !l.readable))
      continue;
    const source = nodes.find((n) => blockId(n) === incoming[0].from);
    if (!source || !ranks[i - 1].includes(source)) continue;
    const d = cross(bx(source)) - cross(bx(block));
    if (Math.abs(d) < 2) continue;
    const frames = framesOnlyHolding(block, layout);
    if (!frames) continue;
    shiftAcross(block, d, v);
    for (const c of frames) {
      const r = c.querySelector(':scope > rect');
      const k = v ? 'x' : 'y';
      if (r) r.setAttribute(k, String(Number(r.getAttribute(k)) + d));
      const l = c.querySelector(':scope > g.cluster-label');
      if (l) shiftAcross(l, d, v);
    }
    const b = bx(block);
    boxes.set(
      block,
      v
        ? new DOMRect(b.x + d, b.y, b.width, b.height)
        : new DOMRect(b.x, b.y + d, b.width, b.height),
    );
    moved = true;
  }
  return moved;
}

/** Centres the stem of a flowchart — the blocks alone on their rank at its
 *  head, before the first rank that branches — over that rank, midway
 *  between its outer blocks: Mermaid's layout lines the stem up with one of
 *  the branches instead (understanding-mks-architecture: 170 px off). Frames
 *  holding only stem blocks move with them, and so do the arrows and labels
 *  between stem blocks; the other arrows are redrawn by tidyArrows, then
 *  polishSvg keeps the move only if flaws() finds nothing new. False when
 *  there is nothing to move or a case this step leaves alone: no stem, stem
 *  blocks not in one column, a frame shared with other blocks, an arrow it
 *  cannot read. */
function centreStem(svg: SVGSVGElement, axis: Axis): boolean {
  const layout = rankLayout(svg, axis);
  if (!layout) return false;
  const { root, v, nodes, clusters, boxes, bx, cross, ranks } = layout;
  const branch = ranks.findIndex((r) => r.length > 1);
  if (branch < 1) return false;
  const stem = ranks.slice(0, branch).map((r) => r[0]);
  // tidyArrows redraws only arrows on rectangular blocks: a moved diamond or
  // round block would keep Mermaid's arrow ends where it used to be
  if (stem.some((n) => !n.querySelector(':scope > rect.label-container')))
    return false;
  const at = stem.map((n) => cross(bx(n)));
  if (Math.max(...at) - Math.min(...at) > 2) return false;
  const tips = ranks[branch].map((n) => cross(bx(n)));
  const dx = (Math.min(...tips) + Math.max(...tips)) / 2 - at[0];
  if (Math.abs(dx) < 2) return false;
  const frames: SVGGElement[] = [];
  for (const c of clusters) {
    if (!boxes.has(c)) continue;
    const held = nodes.filter((n) => boxes.has(n) && holdsBox(bx(c), bx(n)));
    if (!held.some((n) => stem.includes(n))) continue;
    if (held.some((n) => !stem.includes(n))) return false;
    frames.push(c);
  }
  const ids = new Set<string>([
    ...stem.map((n) => blockId(n) ?? ''),
    ...frames.map(frameId),
  ]);
  const shift = (p: Pt): Pt =>
    v ? { x: p.x + dx, y: p.y } : { x: p.x, y: p.y + dx };
  const labels = [
    ...root.querySelectorAll<SVGGElement>(
      ':scope > g.edgeLabels > g.edgeLabel',
    ),
  ];
  const redraw: [SVGPathElement, string][] = [];
  const carried = new Set<Element>();
  for (const path of root.querySelectorAll<SVGPathElement>(
    ':scope > g.edgePaths > path',
  )) {
    const [from, to] = linkIds(path);
    // an arrow that does not say which blocks it joins (an author's own
    // arrow id, `A e1@--> B`) might be one on a moved block: move nothing
    if (!from || !to) return false;
    const inStem = [from, to].map((id) => ids.has(id));
    if (!inStem[0] && !inStem[1]) continue;
    // every arrow on a moved block gets redrawn: it must be readable
    const pts = basisPoints(path.getAttribute('d') ?? '');
    if (!pts) return false;
    if (!inStem[0] || !inStem[1]) continue;
    redraw.push([path, basisPath(pts.map(shift))]);
    // its label follows: the nearest one not already taken
    const mid = polylineMiddle(pts);
    let best: { l: Element; d: number } | null = null;
    for (const l of labels) {
      if (carried.has(l)) continue;
      const t = translateOf(l);
      const d = Math.hypot(t.x - mid.x, t.y - mid.y);
      if (d < 20 && (!best || d < best.d)) best = { l, d };
    }
    if (best) carried.add(best.l);
  }
  const move = (el: Element) => {
    const t = shift(translateOf(el));
    el.setAttribute('transform', `translate(${t.x}, ${t.y})`);
  };
  for (const n of stem) move(n);
  for (const c of frames) {
    const r = c.querySelector(':scope > rect');
    const k = v ? 'x' : 'y';
    if (r) r.setAttribute(k, String(Number(r.getAttribute(k)) + dx));
    const l = c.querySelector(':scope > g.cluster-label');
    if (l) move(l);
  }
  for (const [path, d] of redraw) path.setAttribute('d', d);
  for (const l of carried) move(l);
  return true;
}

/** What is wrong in the drawing, one key per flaw: blocks overlapping, a
 *  frame cutting through a block or another frame, a label on a block, on
 *  another arrow than its own or on another label, or off its own arrow, an
 *  arrow through a block other than its own two or come loose from them. */
function flaws(svg: SVGSVGElement): Set<string> {
  const out = new Set<string>();
  const root = svg.querySelector<SVGGElement>('g.root');
  if (!root) return out;
  // the whole drawing, subgraphs Mermaid nests in their own root included
  const blocks: [string, DOMRect][] = [];
  for (const n of svg.querySelectorAll<SVGGElement>('g.node')) {
    const id = blockId(n);
    const b = bboxIn(n, root);
    if (id && b) blocks.push([id, b]);
  }
  const frames: [string, DOMRect][] = [];
  for (const c of svg.querySelectorAll<SVGGElement>('g.cluster')) {
    const r = c.querySelector<SVGRectElement>(':scope > rect');
    const b = r && bboxIn(r, root);
    if (b) frames.push([c.id, b]);
  }
  // labels keyed by their place in the drawing: texts repeat (OK, ÉCHEC…)
  const labels: [string, DOMRect][] = [];
  svg
    .querySelectorAll<SVGGElement>('g.edgeLabels > g.edgeLabel')
    .forEach((l, i) => {
      const b = bboxIn(l, root);
      if ((l.textContent ?? '').trim() && b && b.width > 0)
        labels.push([String(i), b]);
    });
  const meet = (a: DOMRect, b: DOMRect) =>
    a.x < b.x + b.width - 0.5 &&
    b.x < a.x + a.width - 0.5 &&
    a.y < b.y + b.height - 0.5 &&
    b.y < a.y + a.height - 0.5;
  blocks.forEach(([a, ba], i) => {
    for (const [b, bb] of blocks.slice(i + 1))
      if (meet(ba, bb)) out.add(`block|${a}|${b}`);
  });
  for (const [f, bf] of frames)
    for (const [b, bb] of blocks)
      if (meet(bf, bb) && !holdsBox(bf, bb)) out.add(`frame|${f}|${b}`);
  frames.forEach(([f, bf], i) => {
    for (const [g, bg] of frames.slice(i + 1))
      if (meet(bf, bg) && !holdsBox(bf, bg) && !holdsBox(bg, bf))
        out.add(`frames|${f}|${g}`);
  });
  for (const [l, bl] of labels)
    for (const [b, bb] of blocks) if (meet(bl, bb)) out.add(`label|${l}|${b}`);
  labels.forEach(([l, bl], i) => {
    for (const [m, bm] of labels.slice(i + 1))
      if (meet(bl, bm)) out.add(`labels|${l}|${m}`);
  });
  const owner = new Map(
    edgeLabels(svg).map((e) => [String(e.index), e.path] as const),
  );
  const paths = [
    ...svg.querySelectorAll<SVGPathElement>('g.edgePaths path'),
  ].map((p) => [p, pathPoints(svg, p, root).line] as const);
  for (const [l, bl] of labels) {
    const own = owner.get(l);
    if (!own) continue;
    const near = (q: Pt, d: number) =>
      q.x > bl.x - d &&
      q.x < bl.x + bl.width + d &&
      q.y > bl.y - d &&
      q.y < bl.y + bl.height + d;
    for (const [p, ps] of paths) {
      if (p !== own && ps.some((q) => near(q, -0.5)))
        out.add(`over|${l}|${p.id}`);
      // its own arrow no longer runs through it: left behind by a redraw
      if (p === own && !ps.some((q) => near(q, 2)))
        out.add(`astray|${l}|${p.id}`);
    }
  }
  for (const path of svg.querySelectorAll<SVGPathElement>('g.edgePaths path')) {
    const own = linkIds(path);
    const L = path.getTotalLength();
    const ends = [path.getPointAtLength(0), path.getPointAtLength(L)];
    own.forEach((id, k) => {
      const b = blocks.find(([i]) => i === id)?.[1];
      if (
        b &&
        (ends[k].x < b.x - 10 ||
          ends[k].x > b.x + b.width + 10 ||
          ends[k].y < b.y - 10 ||
          ends[k].y > b.y + b.height + 10)
      )
        out.add(`loose|${path.id}|${id}`);
    });
    for (let k = 1; k < 60; k++) {
      const q = path.getPointAtLength((L * k) / 60);
      for (const [id, b] of blocks)
        if (
          id !== own[0] &&
          id !== own[1] &&
          q.x > b.x + 1 &&
          q.x < b.x + b.width - 1 &&
          q.y > b.y + 1 &&
          q.y < b.y + b.height - 1
        )
          out.add(`through|${path.id}|${id}`);
    }
  }
  return out;
}

interface EdgeLabel {
  label: SVGGElement;
  index: number; // its place among the drawing's labels: the flaws() keys
  path: SVGPathElement | null; // the arrow it names
}

/** Every arrow label of the drawing with the arrow it names. Mermaid writes a
 *  drawing's labels (g.edgeLabels) in the order of its arrows (g.edgePaths),
 *  an empty one for an arrow without text: they are paired by place, not by
 *  distance — a state diagram's label can sit 24 px off its own arrow, nearer
 *  another one. Unpaired (null) when the two counts differ. */
function edgeLabels(svg: SVGSVGElement): EdgeLabel[] {
  return [
    ...svg.querySelectorAll<SVGGElement>('g.edgeLabels > g.edgeLabel'),
  ].map((label, index) => {
    const group = label.parentElement;
    const own = group
      ? [...group.querySelectorAll(':scope > g.edgeLabel')]
      : [];
    const paths = group?.parentElement?.querySelectorAll<SVGPathElement>(
      ':scope > g.edgePaths > path',
    );
    const path =
      paths && paths.length === own.length ? paths[own.indexOf(label)] : null;
    return { label, index, path };
  });
}

/** An arrow sampled every LABEL_STEP px, in the coordinates of `ref` (line),
 *  and the stretch its arrowheads cover, their tips included (heads). */
function pathPoints(
  svg: SVGSVGElement,
  path: SVGPathElement,
  ref: SVGGraphicsElement,
): { line: Pt[]; heads: Pt[] } {
  const m = path.getCTM();
  const r = ref.getCTM();
  if (!m || !r) return { line: [], heads: [] };
  const k = r.inverse().multiply(m);
  const at = (s: number): Pt => {
    const q = path.getPointAtLength(s);
    return new DOMPoint(q.x, q.y).matrixTransform(k);
  };
  const L = path.getTotalLength();
  const n = Math.max(1, Math.ceil(L / LABEL_STEP));
  const line = Array.from({ length: n + 1 }, (_, i) => at((L * i) / n));
  const heads: Pt[] = [];
  for (const which of ['start', 'end'] as const) {
    if (!path.getAttribute(`marker-${which}`)) continue;
    const s = (i: number) =>
      which === 'start' ? (L * i) / n : L - (L * i) / n;
    heads.push(...line.filter((_, i) => s(i) <= LABEL_HEAD));
    // the tip, past the end of the line
    const e = which === 'start' ? line[0] : line[n];
    const b = at(which === 'start' ? Math.min(L, 1) : Math.max(0, L - 1));
    const d = Math.hypot(e.x - b.x, e.y - b.y) || 1;
    const tip = markerSetback(svg, path, which);
    heads.push({
      x: e.x + ((e.x - b.x) / d) * tip,
      y: e.y + ((e.y - b.y) / d) * tip,
    });
  }
  return { line, heads };
}

/** Moves an arrow label that lies over another arrow, a block, a frame title
 *  or another label along its own arrow — or aside, its arrow still running
 *  through it — to the nearest place where it lies over none of them, nor
 *  over its own arrowheads: 3 px clear when it can.
 *  Mermaid centres a label on its arrow's route whatever crosses there, and on
 *  a state diagram even beside it, over the next arrow (measured on test
 *  diagrams; none of the guides had one on 2026-10-26). A label that lies
 *  over nothing is never moved; one with no free place on its arrow stays
 *  where it is, the drawing marked data-ovh-labels="crowded" — the component
 *  then lays it out again with more room (MERMAID_SPREADS). All diagram
 *  kinds. Returns whether a moved label reaches past the drawing's frame,
 *  which then needs a refit. */
function clearLabels(svg: SVGSVGElement): boolean {
  const ref = svg.querySelector<SVGGElement>('g.root') ?? svg;
  const items = edgeLabels(svg).filter(
    (e) => e.path && (e.label.textContent ?? '').trim() !== '',
  );
  if (!items.length) return false;
  const boxes = new Map<EdgeLabel, DOMRect>();
  for (const e of items) {
    const b = bboxIn(e.label, ref);
    if (b && b.width > 0) boxes.set(e, b);
  }
  const arrows = [
    ...svg.querySelectorAll<SVGPathElement>('g.edgePaths path'),
  ].map((p) => [p, pathPoints(svg, p, ref)] as const);
  const nodes = [...svg.querySelectorAll<SVGGElement>('g.node')]
    .map((n) => bboxIn(n, ref))
    .filter((b): b is DOMRect => !!b && b.width > 0);
  const obstacles = [
    // a block holding others (a composite state) frames them: no obstacle
    ...nodes.filter((b) => !nodes.some((o) => o !== b && holdsBox(b, o))),
    ...[...svg.querySelectorAll<SVGGElement>('g.cluster-label')]
      .map((l) => bboxIn(l, ref))
      .filter((b): b is DOMRect => !!b && b.width > 0),
  ];
  // label e at r over nothing within `gap` px (negative: overlapping by
  // more); its own arrowheads counted only for a place it would move to
  const free = (e: EdgeLabel, r: DOMRect, gap: number, heads: boolean) => {
    const [x0, x1] = [r.x - gap, r.x + r.width + gap];
    const [y0, y1] = [r.y - gap, r.y + r.height + gap];
    const hit = (q: Pt) => q.x > x0 && q.x < x1 && q.y > y0 && q.y < y1;
    const meet = (o: DOMRect) =>
      o.x < x1 && x0 < o.x + o.width && o.y < y1 && y0 < o.y + o.height;
    return (
      arrows.every(([p, a]) =>
        p === e.path
          ? !heads || !a.heads.some(hit)
          : !a.line.some(hit) && !a.heads.some(hit),
      ) &&
      !obstacles.some(meet) &&
      ![...boxes].some(([o, ob]) => o !== e && meet(ob))
    );
  };
  let moved = false;
  for (const e of items) {
    const b = boxes.get(e);
    if (!b || free(e, b, -0.5, false)) continue;
    // places where the label still sits on its arrow: centred on one of its
    // points, or shifted aside as long as that point stays inside it, its
    // edges LABEL_HOLD px away — nearest first; 3 px clear, else just clear
    const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    const nx = Math.floor(Math.max(0, b.width / 2 - LABEL_HOLD) / LABEL_SHIFT);
    const ny = Math.floor(Math.max(0, b.height / 2 - LABEL_HOLD) / LABEL_SHIFT);
    const places: Pt[] = [];
    for (const q of arrows.find(([p]) => p === e.path)?.[1].line ?? [])
      for (let i = -nx; i <= nx; i++)
        for (let j = -ny; j <= ny; j++)
          places.push({ x: q.x + i * LABEL_SHIFT, y: q.y + j * LABEL_SHIFT });
    places.sort(
      (p, q) =>
        Math.hypot(p.x - c.x, p.y - c.y) - Math.hypot(q.x - c.x, q.y - c.y),
    );
    const at = (p: Pt) =>
      new DOMRect(p.x - b.width / 2, p.y - b.height / 2, b.width, b.height);
    let to: Pt | undefined;
    for (const gap of [LABEL_GAP, 0]) {
      to = places.find((p) => free(e, at(p), gap, true));
      if (to) break;
    }
    if (!to) continue;
    // the move, in the label's own coordinates (Mermaid only translates)
    const m = (e.label.parentNode as SVGGElement | null)?.getCTM();
    const r = ref.getCTM();
    if (!m || !r) continue;
    const k = m.inverse().multiply(r);
    const p1 = new DOMPoint(c.x, c.y).matrixTransform(k);
    const p2 = new DOMPoint(to.x, to.y).matrixTransform(k);
    const t = translateOf(e.label);
    e.label.setAttribute(
      'transform',
      `translate(${t.x + p2.x - p1.x}, ${t.y + p2.y - p1.y})`,
    );
    boxes.set(e, at(to));
    moved = true;
  }
  // checked once all have moved: one may have cleared another
  if ([...boxes].some(([e, b]) => !free(e, b, -0.5, false)))
    svg.setAttribute('data-ovh-labels', 'crowded');
  if (!moved) return false;
  const vb = svg.viewBox.baseVal;
  return (
    !!vb?.width &&
    !holdsBox(new DOMRect(vb.x, vb.y, vb.width, vb.height), svg.getBBox())
  );
}

/** The drawing's frame fitted to its content again once the stem moved —
 *  Mermaid's 8 px padding — so that no empty band is left on one side. */
function fitViewBox(svg: SVGSVGElement): void {
  const b = svg.getBBox();
  const pad = 8;
  const w = b.width + 2 * pad;
  const h = b.height + 2 * pad;
  svg.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${w} ${h}`);
  if (svg.hasAttribute('width')) svg.setAttribute('width', String(w));
  if (svg.hasAttribute('height')) svg.setAttribute('height', String(h));
  if (/max-width/.test(svg.getAttribute('style') ?? ''))
    svg.style.maxWidth = `${w}px`;
}

/** The points a d3 `curveBasis` path was drawn through — Mermaid's default
 *  flowchart curve. Each cubic segment's two control points give the two
 *  points it was built from, exactly. Null when the path is not such a curve
 *  (another `curve` setting): redrawing it would change the arrow. */
function basisPoints(d: string): Pt[] | null {
  const tokens = d.match(/[MLC]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const cmds: { c: string; n: number[] }[] = [];
  for (const t of tokens) {
    if (/^[MLC]$/i.test(t)) cmds.push({ c: t.toUpperCase(), n: [] });
    else if (cmds.length) cmds[cmds.length - 1].n.push(Number(t));
  }
  const shape = cmds.map((c) => c.c).join('');
  let pts: Pt[];
  if (/^ML$/.test(shape)) {
    pts = [
      { x: cmds[0].n[0], y: cmds[0].n[1] },
      { x: cmds[1].n[0], y: cmds[1].n[1] },
    ];
  } else if (/^MLC+L$/.test(shape)) {
    pts = [];
    cmds.slice(2, -1).forEach(({ n }, j) => {
      const [c1x, c1y, c2x, c2y] = n;
      pts[j] = { x: 2 * c1x - c2x, y: 2 * c1y - c2y };
      pts[j + 1] = { x: 2 * c2x - c1x, y: 2 * c2y - c1y };
    });
  } else return null;
  // the rebuilt curve must be the original one, or the step stays out
  const a = basisPath(pts).match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const b = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  if (a.length !== b.length) return null;
  if (a.some((v, i) => Math.abs(Number(v) - Number(b[i])) > 0.01)) return null;
  return pts;
}

/** d3 `curveBasis` through the points — the curve Mermaid draws its arrows with. */
function basisPath(p: Pt[]): string {
  const f = (v: number) => String(Math.round(v * 1000) / 1000);
  const pt = (q: Pt) => `${f(q.x)},${f(q.y)}`;
  const bez = (a: Pt, b: Pt, c: Pt) =>
    `C${f((2 * a.x + b.x) / 3)},${f((2 * a.y + b.y) / 3)},${f((a.x + 2 * b.x) / 3)},${f((a.y + 2 * b.y) / 3)},${f((a.x + 4 * b.x + c.x) / 6)},${f((a.y + 4 * b.y + c.y) / 6)}`;
  if (p.length === 2) return `M${pt(p[0])}L${pt(p[1])}`;
  const n = p.length - 1;
  let d = `M${pt(p[0])}L${f((5 * p[0].x + p[1].x) / 6)},${f((5 * p[0].y + p[1].y) / 6)}`;
  for (let i = 2; i <= n; i++) d += bez(p[i - 2], p[i - 1], p[i]);
  return `${d}${bez(p[n - 1], p[n], p[n])}L${pt(p[n])}`;
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

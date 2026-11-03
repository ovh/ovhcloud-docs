/**
 * Tests for scripts/lib/mermaid-lint (run with `pnpm test`).
 */

import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  colourIssues,
  contrast,
  layoutAids,
  lintFile,
  mermaidBlocks,
  orientationChanges,
  orientations,
  syntaxError,
} from '../lib/mermaid-lint';

test('mermaidBlocks finds every ```mermaid block with its line', () => {
  const text =
    'intro\n\n```mermaid\nflowchart LR\n A --> B\n```\n\n```bash\necho\n```\n\n```mermaid\nflowchart TB\n C --> D\n```\n';
  const b = mermaidBlocks(text);
  assert.equal(b.length, 2);
  assert.equal(b[0].line, 3);
  assert.ok(b[1].code.startsWith('flowchart TB'));
});

test('orientations reads the diagram and subgraph directions (TD = TB)', () => {
  const o = orientations(
    'flowchart TD\n subgraph S["x"]\n  direction LR\n  A\n end\n',
  );
  assert.equal(o.get(''), 'TB');
  assert.equal(o.get('S'), 'LR');
});

test('an orientation change is reported, a layout-only edit is not', () => {
  assert.deepEqual(
    orientationChanges(
      'flowchart LR\n A --> B',
      'flowchart LR\n A --> B\n B --> C',
    ),
    [],
  );
  assert.equal(
    orientationChanges('flowchart LR\n A --> B', 'flowchart TB\n A --> B')
      .length,
    1,
  );
  assert.equal(
    orientationChanges(
      'flowchart LR\n subgraph S\n direction TB\n A\n end',
      'flowchart LR\n subgraph S\n A\n end',
    ).length,
    1,
  );
});

test('contrast follows WCAG', () => {
  assert.equal(contrast('#000', '#fff'), 21);
  assert.equal(contrast('#fff', '#fff'), 1);
  assert.equal(contrast('red', '#fff'), null);
});

test('colourIssues flags white on light fills and a light fill with the default text only when too pale', () => {
  const issues = colourIssues(
    [
      '    style A fill:#f0ad4e,color:#fff', // white on orange: 2:1
      '    style B fill:#e8f4f8', // default dark text on a light fill: fine
      '    style C fill:#0089C0,color:#fff', // white on OVHcloud blue: 3.9:1
      '    classDef ok fill:#0a2a36,color:#fff;', // white on dark: fine
      '    classDef inv fill:none,stroke:none', // invisible: ignored
    ].join('\n'),
  );
  assert.equal(issues.length, 2);
  assert.ok(issues[0].startsWith('style A'));
  assert.ok(issues[1].startsWith('style C'));
});

test('layoutAids flags padding, blank blocks and invisible links', () => {
  const aids = layoutAids(
    'flowchart TB\n A["Title#nbsp;#nbsp;"]\n SP["#nbsp;"]\n A ~~~ B',
  );
  assert.equal(aids.length, 3);
  assert.deepEqual(layoutAids('flowchart TB\n A["Title"] --> B'), []);
});

test('syntaxError: valid diagrams pass, an invalid one is reported (Mermaid parser, in Node)', async () => {
  assert.equal(
    await syntaxError(
      'flowchart LR\n A["a<br/>b"] --> B\n subgraph S["F"]\n C\n end',
    ),
    null,
  );
  assert.equal(await syntaxError('stateDiagram-v2\n [*] --> OK'), null);
  assert.match(
    (await syntaxError('flowchart LR\n A[Broken -->\n x ((')) ?? '',
    /Parse error/,
  );
});

test('lintFile: error for invalid syntax only; orientation change, colours and aids are warnings', async () => {
  const after =
    '```mermaid\nflowchart TB\n A --> B\n style A fill:#f0ad4e,color:#fff\n```\n\n```mermaid\nflowchart LR\n A[Broken -->\n```\n';
  const f = await lintFile(
    after,
    '```mermaid\nflowchart LR\n A --> B\n```\n\n```mermaid\nflowchart LR\n X --> Y\n```\n',
  );
  assert.ok(
    f.some(
      (x) =>
        x.severity === 'WARNING' &&
        /orientation changed: LR → TB — fine if intended/.test(x.message) &&
        x.diagram === 1,
    ),
  );
  assert.ok(
    f.some(
      (x) =>
        x.severity === 'ERROR' && /invalid/.test(x.message) && x.diagram === 2,
    ),
  );
  assert.ok(
    f.some((x) => x.severity === 'WARNING' && /contrast/.test(x.message)),
  );
  assert.ok(
    !f.some((x) => x.severity === 'ERROR' && /orientation/.test(x.message)),
  );
  // a new file has no reference: no orientation check
  assert.ok(
    !(await lintFile(after, null)).some((x) => /orientation/.test(x.message)),
  );
});

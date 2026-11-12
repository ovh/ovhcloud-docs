/**
 * Tests for plugins/remarkMermaid (run with `pnpm test`): every ```mermaid
 * block becomes <MermaidDiagram code="…">, its source passed VERBATIM (the
 * renderer must never rewrite, reorder or re-orient a diagram), and every other
 * code block is left to Shiki untouched.
 */

import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { preloadFor, remarkMermaid } from '../../plugins/remarkMermaid';

type Node = {
  type: string;
  lang?: string;
  value?: string;
  name?: string;
  attributes?: { name: string; value: string }[];
  children?: Node[];
};

const SOURCE = [
  'flowchart LR',
  '    subgraph HUB[Hub]',
  '        R["Votre routeur<br/>route, filtre"]',
  '    end',
  '    N -.->|chemin privé, indépendant de votre routeur| CP',
  '    CP <-.->|"Konnectivity"| N',
].join('\n');

function tree(...children: Node[]): Node {
  return { type: 'root', children };
}

function run(t: Node): Node {
  // the plugin is a unified attacher returning the transformer
  (remarkMermaid() as (tree: unknown) => void)(t);
  return t;
}

test('a ```mermaid block becomes <MermaidDiagram> with its source verbatim', () => {
  const out = run(tree({ type: 'code', lang: 'mermaid', value: SOURCE }));
  const [el] = out.children ?? [];
  assert.equal(el.type, 'mdxJsxFlowElement');
  assert.equal(el.name, 'MermaidDiagram');
  assert.deepEqual(
    el.attributes?.map((a) => [a.name, a.value]),
    [['code', SOURCE]],
  );
});

test('orientation, arrows and labels are not rewritten', () => {
  const out = run(tree({ type: 'code', lang: 'mermaid', value: SOURCE }));
  const code = out.children?.[0].attributes?.[0].value ?? '';
  assert.ok(code.startsWith('flowchart LR'));
  assert.ok(
    code.includes('N -.->|chemin privé, indépendant de votre routeur| CP'),
  );
  assert.ok(code.includes('CP <-.->|"Konnectivity"| N'));
});

test('other code blocks are left untouched', () => {
  const bash: Node = { type: 'code', lang: 'bash', value: 'echo mermaid' };
  const plain: Node = { type: 'code', value: 'flowchart LR' };
  const out = run(tree(bash, plain));
  assert.deepEqual(out.children, [bash, plain]);
});

test('every mermaid block of a page is converted, in place', () => {
  const p1: Node = { type: 'paragraph', children: [] };
  const p2: Node = { type: 'paragraph', children: [] };
  const out = run(
    tree(
      { type: 'code', lang: 'mermaid', value: 'flowchart TB\n A --> B' },
      p1,
      { type: 'code', lang: 'mermaid', value: 'flowchart LR\n C --> D' },
      p2,
    ),
  );
  assert.deepEqual(
    out.children?.map((n) => n.name ?? n.type),
    ['MermaidDiagram', 'paragraph', 'MermaidDiagram', 'paragraph', 'mdxjsEsm'],
  );
});

test('a page imports one preload per diagram type, a page without none', () => {
  const imports = (t: Node) =>
    (t.children ?? []).filter((n) => n.type === 'mdxjsEsm').map((n) => n.value);
  const page = run(
    tree(
      { type: 'code', lang: 'mermaid', value: 'flowchart TB\n A --> B' },
      { type: 'code', lang: 'mermaid', value: 'graph LR\n C --> D' },
      { type: 'code', lang: 'mermaid', value: 'stateDiagram-v2\n [*] --> A' },
      { type: 'code', lang: 'mermaid', value: 'sequenceDiagram\n A->>B: hi' },
    ),
  );
  assert.deepEqual(imports(page), [
    "import '@components/MermaidDiagram/preload-flowchart';",
    "import '@components/MermaidDiagram/preload-state';",
    "import '@components/MermaidDiagram/preload';",
  ]);
  assert.deepEqual(
    imports(run(tree({ type: 'code', lang: 'bash', value: 'ls' }))),
    [],
  );
});

test('the diagram type is read past front matter and %% lines', () => {
  assert.equal(
    preloadFor('---\ntitle: T\n---\n%% note\nflowchart LR\n A --> B'),
    '@components/MermaidDiagram/preload-flowchart',
  );
  assert.equal(
    preloadFor('%%{init: {}}%%\nstateDiagram\n [*] --> A'),
    '@components/MermaidDiagram/preload-state',
  );
});

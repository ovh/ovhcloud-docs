/**
 * Swaps the copy of js-yaml that Mermaid bundles for the js-yaml package this
 * repo depends on (components/MermaidDiagram/js-yaml.mjs re-exports it).
 *
 * Mermaid 12.2 ships js-yaml 4.3.0 copied into one of its own chunks. Being
 * copied, not depended on, that code is invisible to Dependabot and
 * `pnpm audit`, and stays at the version Mermaid bundled; the package is
 * pinned by pnpm-lock.yaml and watched like every other dependency. Mermaid
 * only ever calls it as `load(text, { schema: JSON_SCHEMA })`: the chunk
 * exports exactly those two names, so the package's own `load` and
 * `JSON_SCHEMA` take its place unchanged.
 *
 * The chunk is found by what it holds, not by its hashed name: the one file of
 * Mermaid's core build carrying js-yaml (YAMLException) and exporting exactly
 * `JSON_SCHEMA` and `load`. None, several, or other exports: a Mermaid update
 * has changed what it bundles, and the build stops until this is looked at.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const EXPORTS = /export\s*\{\s*JSON_SCHEMA,\s*load\s*\};?\s*$/;

function bundledJsYamlChunk(root: string): string {
  const dir = path.join(
    fs.realpathSync(path.join(root, 'node_modules/mermaid')),
    'dist/chunks/mermaid.core',
  );
  const found = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mjs'))
    .filter((f) => {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      return src.includes('YAMLException') && EXPORTS.test(src);
    });
  if (found.length !== 1)
    throw new Error(
      `mermaidJsYaml: expected one js-yaml chunk in ${dir}, found ${found.length}` +
        ' — Mermaid changed what it bundles: check plugins/mermaidJsYaml.ts',
    );
  return found[0];
}

// The little of Rspack's config and utils this needs: no @rsbuild/core import
interface RspackConfig {
  plugins?: unknown[];
}
interface RspackUtils {
  rspack: {
    NormalModuleReplacementPlugin: new (match: RegExp, by: string) => unknown;
  };
}

/** For `builderConfig.tools.rspack`, in both the dev and the build config. */
export function swapMermaidJsYaml(root: string) {
  const chunk = bundledJsYamlChunk(root);
  const shim = path.join(root, 'components/MermaidDiagram/js-yaml.mjs');
  const match = new RegExp(
    `[\\\\/]${chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
  );
  return (config: RspackConfig, { rspack }: RspackUtils) => {
    config.plugins = [
      ...(config.plugins ?? []),
      new rspack.NormalModuleReplacementPlugin(match, shim),
    ];
  };
}

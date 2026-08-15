import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const entrypoints = [
  'api/ai/identify-plant.ts',
  'api/ai/care-plan.ts',
  'api/ai/follow-up.ts',
  'api/ai/refresh-plant-from-photo.ts',
];

async function readRuntimeRelativeImports(filePath: string) {
  const source = await readFile(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const imports: string[] = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) return;
    const specifier = node.moduleSpecifier;
    if (ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
      imports.push(specifier.text);
    }
  });

  return imports;
}

function sourcePathForJsSpecifier(importerPath: string, specifier: string) {
  const emittedPath = resolve(dirname(importerPath), specifier);
  return emittedPath.endsWith('.js')
    ? `${emittedPath.slice(0, -3)}.ts`
    : emittedPath;
}

async function collectRuntimeGraph() {
  const visited = new Set<string>();
  const graph: Array<{ importer: string; specifier: string; target: string }> = [];
  const pending = entrypoints.map((entrypoint) => resolve(repoRoot, entrypoint));

  while (pending.length > 0) {
    const importer = pending.pop()!;
    if (visited.has(importer)) continue;
    visited.add(importer);

    for (const specifier of await readRuntimeRelativeImports(importer)) {
      const target = sourcePathForJsSpecifier(importer, specifier);
      graph.push({ importer, specifier, target });
      if (extname(target) === '.ts') pending.push(target);
    }
  }

  return graph;
}

describe('SAN serverless runtime imports', () => {
  it('uses explicit .js specifiers throughout the reachable runtime graph', async () => {
    const graph = await collectRuntimeGraph();

    expect(graph.length).toBeGreaterThan(0);
    expect(graph.every(({ specifier }) => specifier.endsWith('.js'))).toBe(true);
    await expect(Promise.all(graph.map(({ target }) => readFile(target, 'utf8')))).resolves.toBeDefined();
  });
});

import path from 'node:path'
import type { RootNativeConfig } from './types'

interface TransformOptions {
  config: RootNativeConfig
  componentName: string
  installedComponents: string[]
}

// Match single-line import/export: import { ... } from '...'
const SINGLE_LINE_IMPORT_REGEX =
  /((?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|[\w,\s]+)\s+from\s+)(['"])([^'"]+)\2/g

// Match multi-line import/export: import {\n  ...\n} from '...'
const MULTI_LINE_IMPORT_REGEX =
  /((?:import|export)\s+(?:type\s+)?\{[\s\S]*?\}\s+from\s+)(['"])([^'"]+)\2/g

// Shared modules under `packages/components/src/` (not `src/internal/`) that
// the registry ships inside each consuming component. Keep in sync with
// SHARED_ROOT_MODULES in scripts/build-registry.ts.
const SHARED_ROOT_MODULES = new Set(['safe-area'])

/**
 * True for an alias a bundler resolves by prefix, e.g. `@/lib` or `~/lib`.
 *
 * A relative alias (`./lib`, `../shared/lib`) is not one: `resolveAliasPath`
 * anchors it at the project root, but an import specifier is resolved from the
 * importing file's own directory. Writing it through unchanged produced
 * `components/button/lib/rootnative-utils`, which does not exist.
 */
function isPrefixAlias(alias: string): boolean {
  return !alias.startsWith('.')
}

/**
 * The specifier that reaches `<alias>/<rest>` from inside the directory a
 * component's files are written to.
 *
 * A prefix alias is position-independent, so it is used verbatim. A relative
 * alias has to be re-anchored: both aliases resolve against the project root,
 * and the file being written sits at `<componentsAlias>/<componentName>/`, so
 * the real specifier is the path between those two directories. Uses POSIX
 * separators — this is an import specifier, not a filesystem path, so it must
 * not pick up `\` on Windows.
 */
function buildSpecifier(
  alias: string,
  rest: string,
  componentsAlias: string,
  componentName: string,
): string {
  if (isPrefixAlias(alias)) {
    return `${alias}/${rest}`
  }

  const fromDir = path.posix.join(
    toPosix(stripRelativePrefix(componentsAlias)),
    componentName,
  )
  const target = path.posix.join(toPosix(stripRelativePrefix(alias)), rest)
  const relative = path.posix.relative(fromDir, target)

  return relative.startsWith('.') ? relative : `./${relative}`
}

function stripRelativePrefix(alias: string): string {
  return alias.replace(/^\.\//, '')
}

function toPosix(value: string): string {
  return value.replace(/\\/g, '/')
}

export function transformImports(
  source: string,
  options: TransformOptions,
): string {
  const { config, componentName, installedComponents } = options
  const componentsAlias = config.aliases.components
  const libAlias = config.aliases.lib

  function rewriteImport(
    match: string,
    prefix: string,
    quote: string,
    importPath: string,
  ): string {
    // @rootnative/utils → local barrel
    if (importPath === '@rootnative/utils') {
      const specifier = buildSpecifier(
        libAlias,
        'rootnative-utils',
        componentsAlias,
        componentName,
      )
      return `${prefix}${quote}${specifier}${quote}`
    }

    // @rootnative/core → keep as-is (npm package)
    if (importPath.startsWith('@rootnative/core')) {
      return match
    }

    // Shared internal files (e.g. ../internal/useStateLayer) — the installer
    // flattens them into the component's own directory
    if (importPath.startsWith('../internal/')) {
      const restOfPath = importPath.replace(/^\.\.\/internal\//, '')
      return `${prefix}${quote}./${restOfPath}${quote}`
    }

    // Shared modules that sit directly under src/ rather than in src/internal/
    // (e.g. ../safe-area). The registry ships them inside each consuming
    // component and the installer flattens them the same way.
    if (SHARED_ROOT_MODULES.has(importPath.replace(/^\.\.\//, ''))) {
      const restOfPath = importPath.replace(/^\.\.\//, '')
      return `${prefix}${quote}./${restOfPath}${quote}`
    }

    // Relative inter-component imports (e.g. ../icon-button, ../typography)
    if (importPath.startsWith('../')) {
      const targetComponent = extractComponentName(importPath)

      if (targetComponent && installedComponents.includes(targetComponent)) {
        const restOfPath = importPath.replace(/^\.\.\//, '')
        // With a relative components alias this resolves back to `../<rest>`:
        // sibling component directories, which is what the source already said.
        const specifier = buildSpecifier(
          componentsAlias,
          restOfPath,
          componentsAlias,
          componentName,
        )
        return `${prefix}${quote}${specifier}${quote}`
      }
    }

    // Same-directory imports (./styles, ./types) → keep as-is
    return match
  }

  // Apply multi-line regex first (greedy), then single-line for remaining
  let result = source.replace(MULTI_LINE_IMPORT_REGEX, rewriteImport)
  result = result.replace(SINGLE_LINE_IMPORT_REGEX, rewriteImport)

  return result
}

function extractComponentName(importPath: string): string | null {
  // ../icon-button → icon-button
  // ../icon-button/types → icon-button
  const match = importPath.match(/^\.\.\/([^/]+)/)
  return match ? match[1] : null
}

export function generateUtilsBarrel(
  utilNames: string[],
  utilExports: Record<string, string[]>,
  utilTypeExports: Record<string, string[]> = {},
): string {
  const lines = ['// Auto-generated by rootnative CLI. Do not edit.']

  for (const utilName of utilNames.sort()) {
    const exports = utilExports[utilName]
    if (exports && exports.length > 0) {
      lines.push(`export { ${exports.join(', ')} } from './${utilName}'`)
    }
    const typeExports = utilTypeExports[utilName]
    if (typeExports && typeExports.length > 0) {
      lines.push(
        `export type { ${typeExports.join(', ')} } from './${utilName}'`,
      )
    }
  }

  return lines.join('\n') + '\n'
}

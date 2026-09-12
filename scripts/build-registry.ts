/**
 * Registry Build Script
 *
 * Scans packages/components/src/ and packages/utils/src/ to auto-generate
 * all registry JSON files for the RootNative CLI.
 *
 * Usage:
 *   npx tsx scripts/build-registry.ts            # regenerate
 *   npx tsx scripts/build-registry.ts --check    # fail on drift (CI)
 *
 * The `--check` mode exists because the committed registry went stale without
 * anything noticing. 21 of 29 entries were missing
 * `packages/components/src/internal/pointerEvents.ts` from their `files` list:
 * somebody added the import, nobody re-ran this script, and every guard stayed
 * green. `check-inertia-pins.ts` reads these files, but only compares the
 * inertia floor in each one, so the file lists were unguarded. The registry is
 * what `rootnative add` copies into a consumer project, so a stale `files` list
 * hands them a component with a missing import.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COMPONENTS_SRC = path.join(ROOT, 'packages/components/src')
const REGISTRY_DIR = path.join(ROOT, 'registry')

// Read version from packages/components/package.json
const componentsPkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/components/package.json'), 'utf-8'),
)
const VERSION = componentsPkg.version as string

/**
 * The floor the CLI installs for `@rootnative/inertia`, derived from the
 * components peer range rather than repeated as a literal.
 *
 * `>=0.0.6 <0.1.0` → `>=0.0.6`. A scaffolded project needs an open-ended floor
 * (the upper bound is the library's constraint, not the consumer's), so only the
 * lower comparator is carried over.
 *
 * This used to be a hardcoded `'>=0.0.6'`, which is the exact drift CLAUDE.md
 * warns about for generated surfaces: a version bump gives nobody a reason to
 * open this file, so the floor silently lags. The `llms.txt` generator sat two
 * releases behind for the same reason.
 */
/**
 * The exact range `packages/components` declares for a peer.
 *
 * Unlike `INERTIA_FLOOR` this keeps the **upper** bound, because for the
 * animation runtime the upper bound is the consumer's constraint too. A bare
 * `>=4.0.0` resolves to Reanimated 4.6.0 and worklets 0.12.1 today, and the
 * components peers reject both (`<4.6.0`, `<0.11.0`), so the scaffold would
 * hand the user an ERESOLVE the moment they installed it.
 */
const peerRange = (name: string): string => {
  const range = componentsPkg.peerDependencies?.[name] as string | undefined

  if (!range) {
    throw new Error(
      `packages/components/package.json declares no ${name} peer — ` +
        'the registry cannot derive what the CLI should install.',
    )
  }

  return range
}

const INERTIA_FLOOR = (() => {
  const range = componentsPkg.peerDependencies?.['@rootnative/inertia'] as
    | string
    | undefined

  if (!range) {
    throw new Error(
      'packages/components/package.json declares no @rootnative/inertia peer — ' +
        'the registry cannot derive the floor the CLI should install.',
    )
  }

  const floor = range.trim().split(/\s+/)[0] ?? ''

  if (!/^>=\d+\.\d+\.\d+/.test(floor)) {
    throw new Error(
      `Unexpected @rootnative/inertia peer range "${range}" — expected it to ` +
        'start with a ">=x.y.z" comparator.',
    )
  }

  return floor
})()

// Utility value exports mapping (file stem → runtime exports)
const UTIL_EXPORTS: Record<string, string[]> = {
  color: ['alphaColor', 'blendColor'],
  elevation: ['elevationStyle'],
  'focus-visible': ['useFocusVisible', 'isFocusVisible'],
  icon: ['getMaterialCommunityIcons'],
  pressable: ['resolvePressableStyle', 'resolveColorFromStyle'],
  'render-icon': ['renderIcon'],
  rtl: ['transformOrigin', 'selectRTL', 'isRTLDirection'],
}

// Utility type-only exports (emitted as `export type {...}` from the barrel)
const UTIL_TYPE_EXPORTS: Record<string, string[]> = {
  pressable: ['PressableState', 'PressableStyleProp'],
  'render-icon': ['IconSource'],
}

// File extension override — defaults to .ts when omitted.
const UTIL_EXTENSIONS: Record<string, string> = {
  'render-icon': 'tsx',
}

// Utility → npm dependencies
const UTIL_DEPS: Record<string, Record<string, string>> = {
  color: {},
  elevation: {},
  'focus-visible': {},
  icon: { '@expo/vector-icons': '>=14.0.0' },
  pressable: {},
  'render-icon': { '@expo/vector-icons': '>=14.0.0' },
  rtl: {},
}

// Map from any util export name (value or type) to util file stem
const EXPORT_TO_UTIL: Record<string, string> = {}
for (const [util, exports] of Object.entries(UTIL_EXPORTS)) {
  for (const exp of exports) {
    EXPORT_TO_UTIL[exp] = util
  }
}
for (const [util, exports] of Object.entries(UTIL_TYPE_EXPORTS)) {
  for (const exp of exports) {
    EXPORT_TO_UTIL[exp] = util
  }
}

// Directories to skip
// 'internal' holds shared hooks (useStateLayer) that ship as util-style
// files, not as standalone registry components.
// 'test-support' holds helpers the test suite imports. It is not shipped —
// tsup has no entry for it — so scaffolding it at a consumer would be wrong.
const SKIP_DIRS = new Set(['__tests__', 'internal', 'test-support'])

interface ComponentEntry {
  name: string
  description: string
  files: string[]
  utils: string[]
  componentDependencies: string[]
  dependencies: Record<string, string>
  optionalDependencies: Record<string, string>
}

function getComponentDirs(): string[] {
  return fs
    .readdirSync(COMPONENTS_SRC)
    .filter((dir) => {
      if (SKIP_DIRS.has(dir)) return false
      const fullPath = path.join(COMPONENTS_SRC, dir)
      return fs.statSync(fullPath).isDirectory()
    })
    .sort()
}

function getComponentFiles(componentDir: string): string[] {
  const fullDir = path.join(COMPONENTS_SRC, componentDir)
  return fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map((f) => `packages/components/src/${componentDir}/${f}`)
}

/**
 * Shared modules that live directly under `src/` rather than in `src/internal/`
 * and are pulled in via `../<name>`. Same shipping rule as internal files: the
 * CLI flattens them into the consuming component's directory and rewrites the
 * import, and their own imports count toward that component's deps.
 */
const SHARED_ROOT_MODULES: Record<string, string> = {
  'safe-area': 'safe-area.tsx',
  'elevation-shadow': 'elevation-shadow.ts',
}

function analyzeImports(componentDir: string): {
  utils: Set<string>
  componentDeps: Set<string>
  externalDeps: Set<string>
  internalFiles: Set<string>
  sharedRootFiles: Set<string>
} {
  const fullDir = path.join(COMPONENTS_SRC, componentDir)
  const files = fs
    .readdirSync(fullDir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))

  const utils = new Set<string>()
  const componentDeps = new Set<string>()
  const externalDeps = new Set<string>()
  // Shared files under src/internal/ pulled in via `../internal/<name>`
  // imports. They ship inside each consuming component's registry entry (the
  // CLI flattens them into the component's directory and rewrites the
  // import), and their own imports count toward the component's deps.
  const internalFiles = new Set<string>()
  const sharedRootFiles = new Set<string>()
  const pendingInternal: string[] = []
  const pendingShared: string[] = []

  const collectSharedImports = (content: string) => {
    const internalImports = content.matchAll(
      /from\s+['"]\.\.\/internal\/([^'"]+)['"]/g,
    )
    for (const match of internalImports) {
      const name = match[1]
      if (!name) continue
      const fileName = ['.ts', '.tsx'].some((ext) => name.endsWith(ext))
        ? name
        : fs.existsSync(path.join(COMPONENTS_SRC, 'internal', `${name}.tsx`))
          ? `${name}.tsx`
          : `${name}.ts`
      if (!internalFiles.has(fileName)) {
        internalFiles.add(fileName)
        pendingInternal.push(fileName)
      }
    }

    const rootImports = content.matchAll(/from\s+['"]\.\.\/([^/'"]+)['"]/g)
    for (const match of rootImports) {
      const moduleName = match[1]
      if (!moduleName) continue
      const fileName = SHARED_ROOT_MODULES[moduleName]
      if (!fileName || sharedRootFiles.has(fileName)) continue
      sharedRootFiles.add(fileName)
      pendingShared.push(fileName)
    }
  }

  // Code the component (or an internal file it pulls in) imports directly.
  const ownContents: string[] = []
  // Shared root modules, tracked apart because they can soften a dependency:
  // `safe-area.tsx` require()s its package in a try/catch and degrades, so a
  // component that only reaches the package through it does not require it.
  const sharedContents: string[] = []

  for (const file of files) {
    ownContents.push(fs.readFileSync(path.join(fullDir, file), 'utf-8'))
  }
  for (const content of ownContents.slice()) collectSharedImports(content)
  while (pendingInternal.length > 0 || pendingShared.length > 0) {
    const internalName = pendingInternal.pop()
    if (internalName !== undefined) {
      const content = fs.readFileSync(
        path.join(COMPONENTS_SRC, 'internal', internalName),
        'utf-8',
      )
      ownContents.push(content)
      collectSharedImports(content)
      continue
    }

    const sharedName = pendingShared.pop() as string
    const content = fs.readFileSync(
      path.join(COMPONENTS_SRC, sharedName),
      'utf-8',
    )
    sharedContents.push(content)
    collectSharedImports(content)
  }

  const contents = [...ownContents, ...sharedContents]

  for (const content of contents) {
    // Check for @rootnative/utils imports
    const utilImportMatch = content.match(/from\s+['"]@rootnative\/utils['"]/g)
    if (utilImportMatch) {
      // Find which specific exports are used
      const importLines = content.match(
        /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@rootnative\/utils['"]/g,
      )
      if (importLines) {
        for (const line of importLines) {
          const match = line.match(/{([^}]+)}/)
          if (match?.[1]) {
            const names = match[1].split(',').map((s) => s.trim())
            for (const name of names) {
              const utilFile = EXPORT_TO_UTIL[name]
              if (utilFile) {
                utils.add(utilFile)
              }
            }
          }
        }
      }
    }

    // Check for inter-component imports (../<component-name>)
    const componentImports = content.matchAll(
      /from\s+['"]\.\.\/([^/'"]+)(?:\/[^'"]*)?['"]/g,
    )
    for (const match of componentImports) {
      const dep = match[1]
      if (!dep) continue
      // Only count as dep if it's a known component directory
      const depDir = path.join(COMPONENTS_SRC, dep)
      if (
        fs.existsSync(depDir) &&
        fs.statSync(depDir).isDirectory() &&
        !SKIP_DIRS.has(dep)
      ) {
        componentDeps.add(dep)
      }
    }

    // Check for external package imports
    if (content.includes('react-native-safe-area-context')) {
      externalDeps.add('react-native-safe-area-context')
    }
    if (
      content.includes('@expo/vector-icons') ||
      content.includes('getMaterialCommunityIcons')
    ) {
      externalDeps.add('@expo/vector-icons')
    }
    if (content.includes('react-native-svg')) {
      externalDeps.add('react-native-svg')
    }
    if (content.includes('react-native-reanimated')) {
      externalDeps.add('react-native-reanimated')
    }
    if (content.includes('@rootnative/inertia')) {
      externalDeps.add('@rootnative/inertia')
    }
  }

  return {
    utils,
    componentDeps,
    externalDeps,
    internalFiles,
    sharedRootFiles,
  }
}

function buildComponentEntry(componentDir: string): ComponentEntry {
  const { utils, componentDeps, externalDeps, internalFiles, sharedRootFiles } =
    analyzeImports(componentDir)
  const files = [
    ...getComponentFiles(componentDir),
    ...Array.from(internalFiles)
      .sort()
      .map((f) => `packages/components/src/internal/${f}`),
    ...Array.from(sharedRootFiles)
      .sort()
      .map((f) => `packages/components/src/${f}`),
  ]

  const dependencies: Record<string, string> = {
    '@rootnative/core': `>=${VERSION}`,
  }
  // Empty today, and kept in the schema on purpose: an installed CLI reads this
  // field, so dropping it would break older clients. Nothing a scaffolded
  // component imports is optional any more — the two peers components still
  // marks optional (Reanimated, worklets) are required for the generated code
  // to run, so they go in `dependencies` below.
  const optionalDependencies: Record<string, string> = {}

  // Always required, however it is reached. The shared `safe-area` module used
  // to require() this in a try/catch and fall back to a plain View, which made
  // it optional when reached indirectly. That lazy require did not survive tsup
  // `splitting: true`, so the import is static now and Metro fails without the
  // package — see the comment in packages/components/src/safe-area.tsx.
  if (externalDeps.has('react-native-safe-area-context')) {
    dependencies['react-native-safe-area-context'] = peerRange(
      'react-native-safe-area-context',
    )
  }

  // Required for the same reason: packages/utils/src/icon.ts imports
  // `@expo/vector-icons/MaterialCommunityIcons` statically.
  if (externalDeps.has('@expo/vector-icons')) {
    dependencies['@expo/vector-icons'] = peerRange('@expo/vector-icons')
  }

  if (externalDeps.has('react-native-svg')) {
    dependencies['react-native-svg'] = peerRange('react-native-svg')
  }

  if (externalDeps.has('react-native-reanimated')) {
    dependencies['react-native-reanimated'] = peerRange(
      'react-native-reanimated',
    )
    // Reanimated 4 runs on react-native-worklets (its own peer dep) and needs
    // the react-native-worklets/plugin Babel plugin. Pull it in alongside so
    // consumers don't hit a Metro/worklet error.
    dependencies['react-native-worklets'] = peerRange('react-native-worklets')
  }

  if (externalDeps.has('@rootnative/inertia')) {
    dependencies['@rootnative/inertia'] = INERTIA_FLOOR
    // Inertia is a thin wrapper over Reanimated 4 — its peers must be present
    // for the scaffolded component to run, even when the component itself no
    // longer imports Reanimated directly.
    dependencies['react-native-reanimated'] = peerRange(
      'react-native-reanimated',
    )
    dependencies['react-native-worklets'] = peerRange('react-native-worklets')
  }

  return {
    name: componentDir,
    description: '', // Fill in manually or from docs
    files,
    utils: Array.from(utils).sort(),
    componentDependencies: Array.from(componentDeps).sort(),
    dependencies,
    optionalDependencies,
  }
}

interface UtilRegistryEntry {
  file: string
  exports: string[]
  typeExports?: string[]
  dependencies: Record<string, string>
}

function buildUtilsRegistry(): Record<string, UtilRegistryEntry> {
  const registry: Record<string, UtilRegistryEntry> = {}

  for (const [name, exports] of Object.entries(UTIL_EXPORTS)) {
    const ext = UTIL_EXTENSIONS[name] || 'ts'
    const entry: UtilRegistryEntry = {
      file: `packages/utils/src/${name}.${ext}`,
      exports,
      dependencies: UTIL_DEPS[name] || {},
    }
    const typeExports = UTIL_TYPE_EXPORTS[name]
    if (typeExports && typeExports.length > 0) {
      entry.typeExports = typeExports
    }
    registry[name] = entry
  }

  return registry
}

// --- Main ---

const CHECK = process.argv.includes('--check')

console.log(CHECK ? 'Checking registry...\n' : 'Building registry...\n')

const componentDirs = getComponentDirs()
console.log(
  `Found ${componentDirs.length} components: ${componentDirs.join(', ')}\n`,
)

// Load existing descriptions from current registry files
const descriptions: Record<string, string> = {}
const existingRegistryDir = path.join(REGISTRY_DIR, 'components')
if (fs.existsSync(existingRegistryDir)) {
  for (const file of fs.readdirSync(existingRegistryDir)) {
    if (file.endsWith('.json')) {
      const data = JSON.parse(
        fs.readFileSync(path.join(existingRegistryDir, file), 'utf-8'),
      )
      if (data.name && data.description) {
        descriptions[data.name] = data.description
      }
    }
  }
}

// Collect every generated file before touching the disk, so both modes consume
// one result. Formatting used to happen *after* the write, by shelling out to
// `npx prettier --write registry/`, which made the generated bytes and the
// committed bytes two different artefacts — there was nothing a drift check
// could have compared. Prettier now runs on the content in memory instead.
const outputs = new Map<string, string>()

const componentEntries: ComponentEntry[] = []

for (const dir of componentDirs) {
  const entry = buildComponentEntry(dir)
  // Preserve existing description
  if (descriptions[dir]) {
    entry.description = descriptions[dir]
  }
  componentEntries.push(entry)

  outputs.set(
    `registry/components/${dir}.json`,
    JSON.stringify(entry, null, 2) + '\n',
  )
}

// Build index (with descriptions for fast list command)
const indexData = {
  version: VERSION,
  components: componentEntries.map((e) => ({
    name: e.name,
    description: e.description,
  })),
}
outputs.set('registry/index.json', JSON.stringify(indexData, null, 2) + '\n')

// Build utils registry
outputs.set(
  'registry/utils.json',
  JSON.stringify(buildUtilsRegistry(), null, 2) + '\n',
)

/**
 * An entry on disk that this run did not generate. A renamed or deleted
 * component leaves its file behind, and the CLI would keep serving it.
 */
function findOrphans(generated: Map<string, string>): string[] {
  const dir = path.join(REGISTRY_DIR, 'components')
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => `registry/components/${f}`)
    .filter((rel) => !generated.has(rel))
}

async function main(): Promise<void> {
  // Resolve the repo's Prettier config against a file that lives where the
  // output does, so `.prettierrc` and any `registry/` override both apply.
  const config = await prettier.resolveConfig(
    path.join(REGISTRY_DIR, 'index.json'),
  )

  const formatted = new Map<string, string>()
  for (const [rel, raw] of outputs) {
    formatted.set(
      rel,
      await prettier.format(raw, { ...config, parser: 'json' }),
    )
  }

  const orphans = findOrphans(formatted)

  if (CHECK) {
    const drift: string[] = []

    for (const [rel, content] of formatted) {
      const abs = path.join(ROOT, rel)
      if (!fs.existsSync(abs)) {
        drift.push(`${rel}: missing — never generated`)
      } else if (fs.readFileSync(abs, 'utf-8') !== content) {
        drift.push(`${rel}: stale — does not match the source it describes`)
      }
    }

    for (const rel of orphans) {
      drift.push(`${rel}: orphaned — no component source generates it`)
    }

    if (drift.length > 0) {
      console.error('\nRegistry drift\n')
      for (const d of drift) console.error(`  \u2717 ${d}`)
      console.error(
        `\n${drift.length} file(s) out of date. Run ` +
          '`npx tsx scripts/build-registry.ts` and commit the result.\n' +
          'The registry is what `rootnative add` copies into a consumer ' +
          'project, so a stale `files` list hands them a component with a ' +
          'missing import.\n',
      )
      process.exit(1)
    }

    console.log(
      `Registry matches the source it describes (${componentDirs.length} components).`,
    )
    return
  }

  fs.mkdirSync(path.join(REGISTRY_DIR, 'components'), { recursive: true })

  for (const [rel, content] of formatted) {
    fs.writeFileSync(path.join(ROOT, rel), content)
    console.log(`Wrote ${rel}`)
  }

  for (const rel of orphans) {
    console.log(
      `Note: ${rel} has no component source — delete it if the component is gone.`,
    )
  }

  console.log(
    `\nRegistry build complete. ${componentDirs.length} components registered.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

/**
 * Registry Build Script
 *
 * Scans packages/components/src/ and packages/utils/src/ to auto-generate
 * all registry JSON files for the RootNative CLI.
 *
 * Usage: npx tsx scripts/build-registry.ts
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COMPONENTS_SRC = path.join(ROOT, 'packages/components/src')
const REGISTRY_DIR = path.join(ROOT, 'registry')

// Read version from packages/components/package.json
const componentsPkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/components/package.json'), 'utf-8'),
)
const VERSION = componentsPkg.version as string

// Utility value exports mapping (file stem → runtime exports)
const UTIL_EXPORTS: Record<string, string[]> = {
  color: ['alphaColor', 'blendColor'],
  elevation: ['elevationStyle'],
  'focus-visible': ['useFocusVisible', 'isFocusVisible'],
  icon: ['getMaterialCommunityIcons'],
  pressable: ['resolvePressableStyle', 'resolveColorFromStyle'],
  'render-icon': ['renderIcon'],
  rtl: ['transformOrigin', 'selectRTL'],
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
const SKIP_DIRS = new Set(['__tests__', 'internal'])

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

function analyzeImports(componentDir: string): {
  utils: Set<string>
  componentDeps: Set<string>
  externalDeps: Set<string>
  internalFiles: Set<string>
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
  const pendingInternal: string[] = []

  const collectInternalImports = (content: string) => {
    const internalImports = content.matchAll(
      /from\s+['"]\.\.\/internal\/([^'"]+)['"]/g,
    )
    for (const match of internalImports) {
      const name = match[1]
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
  }

  const contents: string[] = []
  for (const file of files) {
    contents.push(fs.readFileSync(path.join(fullDir, file), 'utf-8'))
  }
  for (const content of contents) collectInternalImports(content)
  while (pendingInternal.length > 0) {
    const fileName = pendingInternal.pop() as string
    const content = fs.readFileSync(
      path.join(COMPONENTS_SRC, 'internal', fileName),
      'utf-8',
    )
    contents.push(content)
    collectInternalImports(content)
  }

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
          if (match) {
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

  return { utils, componentDeps, externalDeps, internalFiles }
}

function buildComponentEntry(componentDir: string): ComponentEntry {
  const { utils, componentDeps, externalDeps, internalFiles } =
    analyzeImports(componentDir)
  const files = [
    ...getComponentFiles(componentDir),
    ...Array.from(internalFiles)
      .sort()
      .map((f) => `packages/components/src/internal/${f}`),
  ]

  const dependencies: Record<string, string> = {
    '@rootnative/core': `>=${VERSION}`,
  }
  const optionalDependencies: Record<string, string> = {}

  if (externalDeps.has('react-native-safe-area-context')) {
    // If SafeAreaView is used directly, it's a required dep
    // Check if it's used in a core component file (not just a sub-component)
    dependencies['react-native-safe-area-context'] = '>=4.0.0'
  }

  if (externalDeps.has('@expo/vector-icons')) {
    optionalDependencies['@expo/vector-icons'] = '>=14.0.0'
  }

  if (externalDeps.has('react-native-svg')) {
    dependencies['react-native-svg'] = '>=15.0.0'
  }

  if (externalDeps.has('react-native-reanimated')) {
    dependencies['react-native-reanimated'] = '>=4.0.0'
    // Reanimated 4 runs on react-native-worklets (its own peer dep) and needs
    // the react-native-worklets/plugin Babel plugin. Pull it in alongside so
    // consumers don't hit a Metro/worklet error.
    dependencies['react-native-worklets'] = '>=0.5.0'
  }

  if (externalDeps.has('@rootnative/inertia')) {
    dependencies['@rootnative/inertia'] = '>=0.0.0-alpha.6'
    // Inertia is a thin wrapper over Reanimated 4 — its peers must be present
    // for the scaffolded component to run, even when the component itself no
    // longer imports Reanimated directly.
    dependencies['react-native-reanimated'] = '>=4.0.0'
    dependencies['react-native-worklets'] = '>=0.5.0'
  }

  // Special case: layout uses safe-area-context only in Layout.tsx (optional)
  if (
    componentDir === 'layout' &&
    dependencies['react-native-safe-area-context']
  ) {
    delete dependencies['react-native-safe-area-context']
    optionalDependencies['react-native-safe-area-context'] = '>=4.0.0'
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

console.log('Building registry...\n')

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

// Build per-component registry first (so we have descriptions for the index)
fs.mkdirSync(path.join(REGISTRY_DIR, 'components'), {
  recursive: true,
})

const componentEntries: ComponentEntry[] = []

for (const dir of componentDirs) {
  const entry = buildComponentEntry(dir)
  // Preserve existing description
  if (descriptions[dir]) {
    entry.description = descriptions[dir]
  }
  componentEntries.push(entry)

  fs.writeFileSync(
    path.join(REGISTRY_DIR, 'components', `${dir}.json`),
    JSON.stringify(entry, null, 2) + '\n',
  )
  console.log(`Wrote registry/components/${dir}.json`)
}

// Build index (with descriptions for fast list command)
const indexData = {
  version: VERSION,
  components: componentEntries.map((e) => ({
    name: e.name,
    description: e.description,
  })),
}
fs.writeFileSync(
  path.join(REGISTRY_DIR, 'index.json'),
  JSON.stringify(indexData, null, 2) + '\n',
)
console.log('Wrote registry/index.json')

// Build utils registry
const utilsData = buildUtilsRegistry()
fs.writeFileSync(
  path.join(REGISTRY_DIR, 'utils.json'),
  JSON.stringify(utilsData, null, 2) + '\n',
)
console.log('Wrote registry/utils.json')

// Format generated JSON files with Prettier
execSync('npx prettier --write registry/', { stdio: 'inherit' })

console.log(
  `\nRegistry build complete. ${componentDirs.length} components registered.`,
)

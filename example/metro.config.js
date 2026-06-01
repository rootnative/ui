const path = require('path')
const fs = require('fs')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
const workspaceRoot = path.resolve(__dirname, '..')
const stableEmptyModulePath = path.join(
  workspaceRoot,
  'node_modules',
  'metro-runtime',
  'src',
  'modules',
  'empty-module.js',
)

if (fs.existsSync(stableEmptyModulePath)) {
  config.resolver.emptyModulePath = stableEmptyModulePath
}

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Resolve workspace @rootnative/* packages to source so they go through the
// example's Babel chain. Two reasons:
//  1. `react-native-worklets/plugin` (auto-applied by babel-preset-expo) needs
//     to process files that use Reanimated worklet hooks.
//  2. The published dists (built by tsup) use the esbuild `__require` shim for
//     dynamic CJS lookups, which Metro can't statically follow — so packages
//     like `@expo/vector-icons` resolved via `__require` aren't bundled.
const WORKSPACE_PACKAGES = {
  '@rootnative/components': path.resolve(
    workspaceRoot,
    'packages/components/src',
  ),
  '@rootnative/utils': path.resolve(workspaceRoot, 'packages/utils/src'),
}
const previousResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [pkg, srcDir] of Object.entries(WORKSPACE_PACKAGES)) {
    if (moduleName !== pkg && !moduleName.startsWith(`${pkg}/`)) continue
    const rel = moduleName === pkg ? '' : moduleName.slice(pkg.length + 1)
    // Try `<rel>.{ts,tsx}` (direct file) before `<rel>/index.{ts,tsx}`. The
    // root entry (rel === '') skips the direct lookup since `src.ts` is never
    // the right answer.
    const candidates = []
    if (rel) {
      candidates.push(`${rel}.ts`, `${rel}.tsx`)
    }
    candidates.push(
      `${rel ? `${rel}/` : ''}index.ts`,
      `${rel ? `${rel}/` : ''}index.tsx`,
    )
    for (const candidate of candidates) {
      const full = path.join(srcDir, candidate)
      if (fs.existsSync(full)) {
        return { filePath: full, type: 'sourceFile' }
      }
    }
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config

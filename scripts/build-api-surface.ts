/**
 * Snapshots the published API surface of every public package.
 *
 * Why this exists: the 1.0 API freeze pass found that `core/src/index.ts` was
 * four `export *` barrels, so anything added to a sub-barrel became public API
 * by accident — and nothing anywhere would have shown it. The snapshot lives in
 * `api-surface.json` and is read off the *built* `.d.ts` files rather than the
 * source, because what consumers can import is decided by the build, not by
 * intent.
 *
 * Usage:
 *   npx tsx scripts/build-api-surface.ts           # write the snapshot
 *   npx tsx scripts/build-api-surface.ts --check    # fail on drift (CI)
 *
 * Requires a build first — it reads `dist/`.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const SNAPSHOT = path.join(ROOT, 'api-surface.json')

interface PackageSpec {
  name: string
  dir: string
  /** Entry `.d.ts` per subpath, relative to the package dir. */
  entries: Record<string, string>
}

const PACKAGES: PackageSpec[] = [
  {
    name: '@rootnative/core',
    dir: 'packages/core',
    entries: {
      '.': 'dist/index.d.mts',
      './create-theme': 'dist/create-theme/index.d.mts',
    },
  },
  {
    name: '@rootnative/components',
    dir: 'packages/components',
    entries: { '.': 'dist/index.d.ts' },
  },
  {
    name: '@rootnative/icons',
    dir: 'packages/icons',
    entries: { '.': 'dist/index.d.mts' },
  },
]

function exportedNames(entry: string): string[] {
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    noEmit: true,
  })
  const source = program.getSourceFile(entry)
  if (!source) throw new Error(`Could not load ${entry}`)

  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(source)
  if (!moduleSymbol) throw new Error(`No module symbol for ${entry}`)

  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => symbol.getName())
    .sort()
}

/** Subpaths declared in package.json, which are part of the surface too. */
function subpaths(packageDir: string): string[] {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
  ) as { exports?: Record<string, unknown> }
  return Object.keys(pkg.exports ?? {})
    .filter((key) => key !== './package.json')
    .sort()
}

interface PackageSurface {
  subpaths: string[]
  exports: Record<string, string[]>
}
type Surface = Record<string, PackageSurface>

function build(): Surface {
  const surface: Surface = {}

  for (const pkg of PACKAGES) {
    const packageDir = path.join(ROOT, pkg.dir)
    const entries: Record<string, string[]> = {}

    for (const [subpath, relative] of Object.entries(pkg.entries)) {
      const entry = path.join(packageDir, relative)
      if (!fs.existsSync(entry)) {
        throw new Error(
          `${entry} is missing — run \`pnpm run build\` before snapshotting.`,
        )
      }
      entries[subpath] = exportedNames(entry)
    }

    surface[pkg.name] = {
      subpaths: subpaths(packageDir),
      exports: entries,
    }
  }

  return surface
}

function diffLists(before: string[] = [], after: string[] = []) {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  return {
    added: after.filter((name) => !beforeSet.has(name)),
    removed: before.filter((name) => !afterSet.has(name)),
  }
}

function reportDrift(before: Surface, after: Surface) {
  console.error('\nThe public API surface changed:\n')

  for (const pkg of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const lines: string[] = []
    const wasThere = before[pkg]
    const isThere = after[pkg]

    if (!wasThere) lines.push('  + package is new')
    if (!isThere) lines.push('  - package is gone')

    const paths = diffLists(wasThere?.subpaths, isThere?.subpaths)
    for (const name of paths.added) lines.push(`  + subpath ${name}`)
    for (const name of paths.removed) lines.push(`  - subpath ${name}`)

    const subpaths = new Set([
      ...Object.keys(wasThere?.exports ?? {}),
      ...Object.keys(isThere?.exports ?? {}),
    ])
    for (const subpath of subpaths) {
      const names = diffLists(
        wasThere?.exports?.[subpath],
        isThere?.exports?.[subpath],
      )
      for (const name of names.added) lines.push(`  + ${subpath} ${name}`)
      for (const name of names.removed) lines.push(`  - ${subpath} ${name}`)
    }

    if (lines.length > 0) {
      console.error(`${pkg}`)
      lines.forEach((line) => console.error(line))
      console.error('')
    }
  }
}

const surface = build()
const serialized = `${JSON.stringify(surface, null, 2)}\n`

if (process.argv.includes('--check')) {
  if (!fs.existsSync(SNAPSHOT)) {
    console.error(
      'api-surface.json is missing. Run `npx tsx scripts/build-api-surface.ts`.',
    )
    process.exit(1)
  }

  const committed = fs.readFileSync(SNAPSHOT, 'utf8')
  if (committed === serialized) {
    console.log('API surface matches api-surface.json.')
    process.exit(0)
  }

  // Diff in-process rather than shelling out to `git diff` — the snapshot is a
  // generated file that may be untracked or already staged, either of which
  // makes a git diff silently empty and the failure unreadable.
  reportDrift(JSON.parse(committed) as Surface, surface)

  // Deliberately does NOT rewrite the snapshot. Writing it here would make the
  // check non-idempotent: the first run fails, the file now matches, and every
  // run after that passes — so a CI retry would go green on a real drift.
  console.error(
    'If the change is intended, run `pnpm run api:surface` and commit the result.\n' +
      'If not, it is an accidental widening of the semver promise — revert it.\n',
  )
  process.exit(1)
}

fs.writeFileSync(SNAPSHOT, serialized)
const total = Object.values(surface).reduce(
  (sum, entry) => sum + Object.values(entry.exports).flat().length,
  0,
)
console.log(`Wrote api-surface.json — ${total} exported names.`)

/**
 * Guards that the `templates/` runtime pins match the SDK band this repo
 * develops against, and satisfy the `@rootnative/components` peer ranges.
 *
 * Why this exists: the templates lagged a whole Expo SDK behind and nothing
 * caught it. `chore: bump to SDK 57` moved `example/`, the packages and the
 * docs, and left `templates/` on SDK 54. Four runtime pins then contradicted the
 * components peer ranges at once — react, react-native, react-native-reanimated
 * and react-native-worklets — plus the inertia floor at the published tag.
 *
 * **And npm installs that happily.** Measured on npm 11 against the pre-fix
 * template: `npm install` exits 0 with no error and *no warning*, quietly
 * bumping inertia to satisfy its peer while leaving react at 19.1.0,
 * react-native at 0.81.5, Reanimated at 4.1.7 and worklets at 0.5.1 — every one
 * outside the range `@rootnative/components` declares. `--strict-peer-deps`
 * does report it, but that is not the default and the pristine Expo SDK 57
 * template fails it too, so it is no use as a gate. The mismatch therefore has
 * **no install-time signal at all**: it surfaces when the app is built or run,
 * against a library compiled for a different Reanimated/worklets pair.
 *
 * Nothing else in CI can see it either:
 *
 *   - The templates are not workspace members. `pnpm install` never resolves
 *     them, so no lockfile, typecheck or test run ever reads those pins.
 *   - `check:inertia-pins` reads the inertia reference only. It reported
 *     "Every @rootnative/inertia reference agrees" while the four runtime pins
 *     were a band behind.
 *   - `api:check`, `docs:check` and the test suites never open the directory.
 *
 * So the drift is **silent**, in the same way CLAUDE.md describes for the
 * inertia template pin, and it stays silent until a user scaffolds a project.
 *
 * Two referents, both external to the templates — the lesson from the inertia
 * guard's upper-bound check is that comparing declared values against one
 * another lets a consistently wrong value read as consistently right:
 *
 *   1. `node_modules/expo/bundledNativeModules.json` — the version map the
 *      installed Expo SDK itself publishes, and what `npx expo install` writes.
 *      It covers react, react-native and every `expo-*` / `react-native-*`
 *      package a template declares.
 *   2. `packages/components/package.json` peer ranges — what a consumer's
 *      package manager actually enforces at install time.
 *
 * `expo` itself is in neither, so it is compared against `example/package.json`,
 * which is the app this repo develops and tests against.
 *
 * Usage:
 *   npx tsx scripts/check-template-pins.ts [--list]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const TEMPLATES = ['blank', 'with-router']

const problems: string[] = []
const notes: string[] = []

type Pkg = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')) as T
}

// --- range arithmetic ------------------------------------------------------
// Hand-rolled, like check-inertia-pins.ts, so the guard needs no dependency of
// its own. Only the four range shapes this repo actually writes are supported;
// anything else is reported rather than guessed at.

type Version = [number, number, number]
type Window = { min: Version; max: Version | null } // max is exclusive

function parseVersion(input: string): Version | null {
  const m = input.trim().match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function cmp(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

function show(v: Version | null): string {
  if (!v) return '∞'
  if (v[0] === Infinity) return '∞'
  return v.join('.')
}

/**
 * The version window a range admits, as `[min, max)`.
 *
 * An exact pin is a one-version window, which is what makes `4.5.1` fail
 * against a `~4.1.1` template pin rather than passing on a shared prefix.
 */
function windowOf(range: string): Window | null {
  const r = range.trim()

  // `>=a <b` and `>=a`
  if (r.startsWith('>=')) {
    const parts = r.split(/\s+/)
    const min = parseVersion(parts[0].slice(2))
    if (!min) return null
    const capPart = parts.find((p) => p.startsWith('<'))
    if (!capPart) return { min, max: null }
    const max = parseVersion(capPart.replace(/^</, ''))
    if (!max) return null
    return { min, max }
  }

  if (r.startsWith('~')) {
    const min = parseVersion(r.slice(1))
    if (!min) return null
    return { min, max: [min[0], min[1] + 1, 0] }
  }

  if (r.startsWith('^')) {
    const min = parseVersion(r.slice(1))
    if (!min) return null
    // `^0.x.y` is patch+minor-locked to `0.x`, the way npm treats a 0 major.
    const max: Version = min[0] === 0 ? [0, min[1] + 1, 0] : [min[0] + 1, 0, 0]
    return { min, max }
  }

  const exact = parseVersion(r)
  if (!exact) return null
  return { min: exact, max: [exact[0], exact[1], exact[2] + 1] }
}

/** Is every version `inner` admits also admitted by `outer`? */
function fitsInside(inner: Window, outer: Window): boolean {
  if (cmp(inner.min, outer.min) < 0) return false
  if (!outer.max) return true
  if (!inner.max) return false
  return cmp(inner.max, outer.max) <= 0
}

function check(
  label: string,
  dep: string,
  templateRange: string,
  expected: string,
  because: string,
): void {
  const inner = windowOf(templateRange)
  const outer = windowOf(expected)

  if (!inner) {
    problems.push(`${label}: cannot parse the ${dep} pin "${templateRange}"`)
    return
  }
  if (!outer) {
    problems.push(`${label}: cannot parse the ${dep} referent "${expected}"`)
    return
  }
  if (fitsInside(inner, outer)) return

  problems.push(
    `${label}: ${dep} pinned "${templateRange}" ` +
      `(admits ${show(inner.min)} … <${show(inner.max)}) — ` +
      `${because} needs "${expected}"`,
  )
}

// ---------------------------------------------------------------------------

const bundledPath = 'node_modules/expo/bundledNativeModules.json'
if (!fs.existsSync(path.join(ROOT, bundledPath))) {
  console.error(
    `\nCannot read ${bundledPath}.\n\n` +
      '  This guard reads the installed Expo SDK version map. Run `pnpm install` first.\n',
  )
  process.exit(1)
}

const bundled = readJson<Record<string, string>>(bundledPath)
const components = readJson<Pkg>('packages/components/package.json')
const example = readJson<Pkg>('example/package.json')

const peers = components.peerDependencies ?? {}
const optionalPeers = new Set(
  Object.entries(components.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta.optional)
    .map(([name]) => name),
)
const exampleExpo = example.dependencies?.expo

if (!exampleExpo) {
  problems.push('example/package.json: no `expo` dependency to compare against')
}

const expoVersion = readJson<{ version: string }>(
  'node_modules/expo/package.json',
).version
const sdkLabel = `Expo SDK ${expoVersion.split('.')[0]}`

notes.push(`${sdkLabel} version map: ${Object.keys(bundled).length} packages`)
notes.push(`components peers: ${Object.keys(peers).length}`)

for (const name of TEMPLATES) {
  const rel = `templates/${name}/package.json`
  const label = `templates/${name}`
  const template = readJson<Pkg>(rel)
  const deps = template.dependencies ?? {}

  // 1. Every dependency the Expo SDK version-manages must sit inside the range
  //    that SDK publishes. This is the check that sees `expo-router@~6.0.23`
  //    against SDK 57's `~57.0.19` — a peer range never mentions expo-router.
  for (const [dep, range] of Object.entries(deps)) {
    const sdkRange = bundled[dep]
    if (!sdkRange) continue
    check(label, dep, range, sdkRange, sdkLabel)
  }

  // 2. `expo` is not in its own version map, so the example app is the referent.
  if (exampleExpo && deps.expo) {
    check(label, 'expo', deps.expo, exampleExpo, 'the example app')
  } else if (!deps.expo) {
    problems.push(`${label}: no \`expo\` dependency`)
  }

  // 3. Every required peer of `@rootnative/components` must be declared, and
  //    every declared peer must satisfy its range — this is what a consumer's
  //    package manager enforces on `npm install`.
  for (const [dep, peerRange] of Object.entries(peers)) {
    // The `@rootnative/*` pins are `create.ts`'s job (core, components) or
    // check:inertia-pins's (inertia). Neither is a plain semver literal here.
    if (dep.startsWith('@rootnative/')) continue

    const declared = deps[dep]
    if (!declared) {
      if (!optionalPeers.has(dep)) {
        problems.push(
          `${label}: does not declare the required peer ${dep} (${peerRange})`,
        )
      }
      continue
    }
    check(label, dep, declared, peerRange, 'the components peer range')
  }

  notes.push(`${label}: ${Object.keys(deps).length} dependencies checked`)
}

// ---------------------------------------------------------------------------

if (process.argv.includes('--list')) {
  for (const n of notes) console.log(`  ${n}`)
}

if (problems.length === 0) {
  console.log(
    `Template pins match the installed Expo SDK and the components peer ranges.`,
  )
} else {
  console.error('\nTemplate pin drift\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

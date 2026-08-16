/**
 * Guards that every `@rootnative/inertia` version reference in this repo agrees.
 *
 * Why this exists: CLAUDE.md lists six places the inertia version is pinned and
 * warns that missing one is **silent** — "nothing fails locally when you do".
 * The two failure modes it names have both happened:
 *
 *   - The template pin is hand-maintained (`create.ts` rewrites only
 *     `@rootnative/core` and `@rootnative/components`, because inertia versions
 *     independently). A template pinning below the components peer range means
 *     every scaffolded project installs a floor the components do not satisfy.
 *   - A generated surface holding a literal drifts, because a version bump gives
 *     nobody a reason to open the generator. The `llms.txt` generator sat two
 *     releases behind for exactly this reason, and `build-registry.ts` held a
 *     hardcoded `'>=0.0.6'` until it was derived from the peer range instead.
 *
 * The peer range in `packages/components/package.json` is the source of truth:
 * it is what a consumer's package manager actually enforces, and `components`
 * uses the most inertia API so it carries the highest floor.
 *
 * **Compatibility, not equality.** inertia versions independently of this repo —
 * after 1.0.0 it can sit well behind the UI version — so the three packages are
 * allowed different floors. What is enforced is that they share one major window
 * and that `components` is never *below* another package's floor. Demanding one
 * identical literal range would force floor bumps on `core` and `utils` for API
 * they don't use.
 *
 * **The upper bound needs an external referent, and that is the newest check
 * here.** Every other rule compares the declared ranges against one another, so
 * a value that is *consistently* wrong reads as consistently right. That gap was
 * live: all three packages capped inertia at `<0.1.0` while inertia was
 * preparing its 1.0.0, and this script reported "Every @rootnative/inertia
 * reference agrees" — a cap that excludes the very release being planned would
 * have failed peer resolution for every consumer install. The dev pin is the
 * referent, because it is the inertia the workspace installs, typechecks and
 * tests against. Validated by fault injection (dev pin 1.0.0 against a `<0.1.0`
 * cap fails on all three packages; applying the range the error suggests
 * restores a clean run).
 *
 * Usage:
 *   npx tsx scripts/check-inertia-pins.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const PKG = '@rootnative/inertia'

const problems: string[] = []
const notes: string[] = []

function readPkg(rel: string): Record<string, never> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
}

type Pkg = {
  peerDependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  dependencies?: Record<string, string>
}

/** Lowest version a `>=x.y.z <a.b.c` range admits. */
function floorOf(range: string): string {
  return range.trim().split(/\s+/)[0].replace(/^>=/, '')
}

/** Compare two bare semver strings. */
function cmp(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return 0
}

// ---------------------------------------------------------------------------

const components = readPkg('packages/components/package.json') as Pkg
const peerRange = components.peerDependencies?.[PKG]

if (!peerRange) {
  console.error(`packages/components/package.json declares no ${PKG} peer.`)
  process.exit(1)
}

const floor = floorOf(peerRange)
const peerUpper = peerRange.trim().split(/\s+/)[1] ?? ''
notes.push(`source of truth: components peer ${peerRange} (floor ${floor})`)

// 1. Peer ranges must be *compatible*, not identical.
//
// Deliberately not an equality check. inertia versions independently of this
// repo, and the three packages use it to very different depths — `components`
// imports it in ~35 source files, `core` in 4, `utils` in 1. So `components`
// will legitimately need a newer inertia before the other two do, and demanding
// one shared literal range would force pointless floor bumps on packages that
// use none of the new API.
//
// What must hold instead:
//   - every declared range shares the same major window (a split major means
//     two incompatible copies resolve in one install tree)
//   - `components` carries the highest floor, since it uses the most API
//   - each package's own dev pin satisfies its own floor
const ranges = new Map<string, string>()

for (const rel of [
  'packages/core/package.json',
  'packages/utils/package.json',
  'packages/components/package.json',
]) {
  const pkg = readPkg(rel) as Pkg
  const range = pkg.peerDependencies?.[PKG]

  if (!range) {
    problems.push(`${rel}: no ${PKG} peer range`)
    continue
  }
  ranges.set(rel, range)

  const ownFloor = floorOf(range)
  const upper = range.trim().split(/\s+/)[1]

  if (!upper || !/^<\d+\.\d+\.\d+$/.test(upper)) {
    problems.push(
      `${rel}: peer range "${range}" has no "<x.y.z" upper bound — an ` +
        'open-ended peer lets a breaking inertia major resolve silently',
    )
  } else if (upper !== peerUpper) {
    problems.push(
      `${rel}: upper bound "${upper}" ≠ components "${peerUpper}" — a split ` +
        'major window resolves two incompatible inertia copies in one tree',
    )
  }

  if (cmp(ownFloor, floor) > 0) {
    problems.push(
      `${rel}: floor ${ownFloor} is above components' ${floor} — components ` +
        'uses the most inertia API, so it should carry the highest floor',
    )
  }

  // Each package's dev pin must satisfy its *own* floor, not components'.
  const dev = pkg.devDependencies?.[PKG]
  if (!dev) {
    problems.push(`${rel}: no ${PKG} devDependency pin`)
  } else if (cmp(dev, ownFloor) < 0) {
    problems.push(
      `${rel}: dev pin ${dev} is below its own peer floor ${ownFloor}`,
    )
  }

  // The window must admit the version this workspace actually builds against.
  //
  // Every other check in this file compares the declared ranges against *each
  // other*, so a value that is consistently wrong reads as consistently right.
  // That is not hypothetical: all three packages capped inertia at `<0.1.0`
  // while inertia was preparing 1.0.0, and this script printed "Every
  // @rootnative/inertia reference agrees" — a cap that excludes the very
  // release being planned. The upper bound is the one field with no internal
  // referent, so it needs an external one: the dev pin, which is the inertia
  // the workspace installs, typechecks and tests against.
  if (dev && upper && /^<\d+\.\d+\.\d+$/.test(upper)) {
    const ceiling = upper.slice(1)
    if (cmp(dev, ceiling) >= 0) {
      problems.push(
        `${rel}: peer range "${range}" excludes the dev pin ${dev} — the ` +
          'upper bound must admit the inertia this workspace builds against, ' +
          `so widen it to ">=${ownFloor} <${
            Number(dev.split('.')[0]) + 1
          }.0.0"`,
      )
    }
  }

  notes.push(`${rel}: peer ${range}, dev ${dev ?? '—'}`)
}

// 2. Exact pins that must satisfy the peer floor. The templates are the
//    dangerous ones: nothing fails locally when they lag.
for (const rel of [
  'example/package.json',
  'templates/blank/package.json',
  'templates/with-router/package.json',
]) {
  const pkg = readPkg(rel) as Pkg
  const pin = pkg.dependencies?.[PKG]

  if (!pin) {
    problems.push(`${rel}: no ${PKG} dependency`)
    continue
  }
  if (cmp(pin, floor) < 0) {
    problems.push(
      `${rel}: pins ${pin}, below the components peer floor ${floor} — ` +
        'every scaffolded project would install an unsatisfying version',
    )
  }
  notes.push(`${rel}: ${pin}`)
}

// 3. The generated registry floor must equal the peer floor. This is the
//    literal-drift check: build-registry.ts derives it, and this proves the
//    committed registry was regenerated after the last bump.
const registryDir = path.join(ROOT, 'registry/components')
const withInertia: string[] = []

for (const file of fs
  .readdirSync(registryDir)
  .filter((f) => f.endsWith('.json'))) {
  const entry = JSON.parse(
    fs.readFileSync(path.join(registryDir, file), 'utf8'),
  ) as { name: string; dependencies?: Record<string, string> }
  const dep = entry.dependencies?.[PKG]
  if (!dep) continue

  withInertia.push(entry.name)
  if (dep !== `>=${floor}`) {
    problems.push(
      `registry/components/${file}: ${PKG} floor "${dep}" ≠ ">=${floor}" — ` +
        'run `npx tsx scripts/build-registry.ts`',
    )
  }
}
notes.push(`registry: ${withInertia.length} entries declare ${PKG}`)

// 4. No generator may hold a version literal — that is the drift CLAUDE.md
//    warns about for the two auto-generated surfaces.
for (const rel of ['scripts/build-registry.ts', 'scripts/build-llms.ts']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  // Look for a semver literal on a line that also mentions inertia.
  for (const line of src.split('\n')) {
    if (!line.includes('inertia')) continue
    if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) {
      continue
    }
    const m = line.match(/['"`]>?=?\s*\d+\.\d+\.\d+/)
    if (m) {
      problems.push(
        `${rel}: hardcoded inertia version literal ${m[0].trim()} — ` +
          'derive it from the components peer range instead',
      )
    }
  }
}

// ---------------------------------------------------------------------------

if (process.argv.includes('--list')) {
  for (const n of notes) console.log(`  ${n}`)
}

if (problems.length === 0) {
  console.log(`Every ${PKG} reference agrees (floor ${floor}).`)
} else {
  console.error(`\n${PKG} pin drift\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

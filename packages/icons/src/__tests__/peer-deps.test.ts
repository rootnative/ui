import { readFileSync } from 'fs'
import { join } from 'path'

// Guards the three-place invariant every icon-library adapter has to satisfy.
//
// This exists because `peerDependenciesMeta` is only ever a *modifier*:
// `{optional: true}` marks an existing peer optional, it cannot declare one. So
// a library listed in meta but missing from `peerDependencies` is a silent
// no-op — no version range reaches consumers, and no package manager can warn
// on an incompatible installed version. All three adapter libraries shipped
// that way until it was caught by hand; nothing failed, because nothing looked.
//
// Adding an adapter (Tabler, Heroicons, Feather, …) means touching:
//   1. `peerDependencies`       — the version range consumers are held to
//   2. `peerDependenciesMeta`   — marks it optional, so nobody installs all of them
//   3. tsup `--external`        — keeps the optional import out of the bundle
// Miss any one and the failure is invisible at build and test time. These
// assertions make it loud instead.

const pkgPath = join(__dirname, '..', '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  scripts: { build: string }
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}

/** Peers that are genuinely required — everything else must be optional. */
const REQUIRED_PEERS = ['@rootnative/core', 'react', 'react-native']

const externals = Array.from(
  pkg.scripts.build.matchAll(/--external\s+(\S+)/g),
  (m) => m[1],
)

describe('icons package peer declarations', () => {
  it('declares every optional peer in peerDependencies with a version range', () => {
    // The bug this file was written for: a meta-only entry declares nothing.
    for (const name of Object.keys(pkg.peerDependenciesMeta)) {
      expect(pkg.peerDependencies).toHaveProperty(name)
      expect(pkg.peerDependencies[name]).toMatch(/\d/)
    }
  })

  it('marks every non-required peer optional', () => {
    // The inverse slip: a new adapter's library added to peerDependencies but
    // not to meta becomes a *hard* peer, so every consumer is forced to install
    // an icon library they may not use.
    for (const name of Object.keys(pkg.peerDependencies)) {
      if (REQUIRED_PEERS.includes(name)) continue
      expect(pkg.peerDependenciesMeta[name]?.optional).toBe(true)
    }
  })

  it('keeps required peers out of peerDependenciesMeta', () => {
    for (const name of REQUIRED_PEERS) {
      expect(pkg.peerDependencies).toHaveProperty(name)
      expect(pkg.peerDependenciesMeta).not.toHaveProperty(name)
    }
  })

  it('externalizes every peer in the tsup build', () => {
    // A peer bundled instead of externalized ships a second copy of the icon
    // library and breaks `instanceof` / context identity for consumers.
    for (const name of Object.keys(pkg.peerDependencies)) {
      expect(externals).toContain(name)
    }
  })
})

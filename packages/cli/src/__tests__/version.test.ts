import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
import { describe, expect, it } from 'vitest'
import { getCliVersion, UNKNOWN_VERSION } from '../lib/version'

/**
 * `rootnative --version` reported a hardcoded `0.1.0` while every published
 * release was `0.0.0-alpha.x`, so nobody could tell which build they had.
 *
 * The version has to be read when the command runs, not folded in at build
 * time: the release workflow builds first and bumps `package.json` afterwards,
 * so a build-time constant reports the previous release forever.
 */
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

async function readPackageJson() {
  return fs.readJSON(path.join(packageRoot, 'package.json'))
}

describe('getCliVersion', () => {
  it('reports the version in package.json', async () => {
    const pkg = await readPackageJson()

    expect(getCliVersion()).toBe(pkg.version)
  })

  it('finds a version rather than falling back', () => {
    expect(getCliVersion()).not.toBe(UNKNOWN_VERSION)
    expect(getCliVersion()).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('resolves package.json one level above the bundle output', async () => {
    // tsup bundles to dist/index.mjs, so the published code reads
    // ../package.json. That only holds while dist/ is a direct child of the
    // package root — assert it instead of trusting the layout.
    const pkg = await readPackageJson()
    const tsupConfig = await fs.readFile(
      path.join(packageRoot, 'tsup.config.ts'),
      'utf8',
    )

    expect(pkg.name).toBe('@rootnative/cli')
    expect(tsupConfig).toMatch(/outDir:\s*'dist'/)
  })
})

describe('the CLI version is not hardcoded', () => {
  it('passes a resolved version to commander', async () => {
    const source = await fs.readFile(
      path.join(packageRoot, 'src/index.ts'),
      'utf8',
    )

    expect(source).toContain('.version(getCliVersion())')
    expect(source).not.toMatch(/\.version\('[\d.]/)
  })
})

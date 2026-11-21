/**
 * The `@rootnative/core` peer range of the other packages and of each registry
 * entry: from a core version up to the next breaking one. Versions follow
 * modified semver, so a breaking release bumps the middle digit, and the range
 * stops there. Before, the range was `>=<version>` with no end, so a breaking
 * core `0.1.0` satisfied the peer of a `0.0.x` package.
 *
 * Both release workflows run this file to write the range:
 *
 *   npx tsx scripts/core-peer-range.ts <core version> [package dir...]
 *
 * It prints the range, and writes it into each named package that has a
 * `@rootnative/core` peer. `build-registry.ts` imports `corePeerRange`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function corePeerRange(version: string): string {
  const [major, minor] = version.split('.').map(Number)
  if (
    major === undefined ||
    minor === undefined ||
    !Number.isInteger(major) ||
    !Number.isInteger(minor)
  ) {
    throw new Error(`"${version}" isn't a version such as 0.0.2.`)
  }
  return `>=${version} <${major}.${minor + 1}.0`
}

function writePeerRange(packageDir: string, range: string): void {
  const pkgPath = path.resolve(
    import.meta.dirname,
    '..',
    'packages',
    packageDir,
    'package.json',
  )
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  if (!pkg.peerDependencies?.['@rootnative/core']) return
  pkg.peerDependencies['@rootnative/core'] = range
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [version, ...packageDirs] = process.argv.slice(2)
  if (!version) {
    console.error(
      'Usage: npx tsx scripts/core-peer-range.ts <core version> [package dir...]',
    )
    process.exit(1)
  }
  const range = corePeerRange(version)
  for (const dir of packageDirs) writePeerRange(dir, range)
  console.log(range)
}

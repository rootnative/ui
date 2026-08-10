import { createRequire } from 'node:module'

/** Reported when `package.json` cannot be found next to the running code. */
export const UNKNOWN_VERSION = '0.0.0-unknown'

/**
 * Candidate paths to the CLI's own `package.json`, relative to this module.
 *
 * Two entries, because the module's location differs between the two layouts
 * this code runs in. tsup bundles everything into `dist/index.mjs`, so at
 * runtime `import.meta.url` is that one file whatever source file the code was
 * written in — `../package.json`. Under Vitest the source is not bundled, so
 * this file stays at `src/lib/version.ts` — `../../package.json`. The name
 * check below is what makes trying both safe.
 */
const PACKAGE_JSON_CANDIDATES = ['../package.json', '../../package.json']

/**
 * The CLI version, read from `package.json` when the command runs.
 *
 * Deliberately not inlined at build time. The release workflow builds once and
 * bumps the version afterwards, so a build-time constant would report the
 * previous release forever — which is how `.version('0.1.0')` came to disagree
 * with every published version. npm always puts `package.json` in the tarball,
 * even though `files` does not list it, so the read works from the published
 * `dist/` too.
 */
export function getCliVersion(): string {
  const require = createRequire(import.meta.url)

  for (const candidate of PACKAGE_JSON_CANDIDATES) {
    try {
      const pkg = require(candidate) as { name?: string; version?: string }
      // Guard against picking up an unrelated package.json further up the tree
      if (pkg.name === '@rootnative/cli' && pkg.version) return pkg.version
    } catch {
      // Not at this depth — try the next one
    }
  }

  return UNKNOWN_VERSION
}

import { DEFAULT_CONFIG } from './config'

const NPM_REGISTRY = 'https://registry.npmjs.org'

/**
 * Why `resolveRegistryVersion` could not pin to a release tag.
 *
 * `'tag-missing'` carries the version it wanted, because that is the only
 * fallback a user can act on — it means the release shipped to npm but nobody
 * pushed `v<version>`, so `add` is about to copy trunk source against released
 * packages. The other two reasons are transient and need no action.
 */
export type RegistryVersionFallback =
  | { reason: 'tag-missing'; version: string }
  | { reason: 'npm-unreachable' }
  | { reason: 'no-latest-tag' }

export interface RegistryVersionResult {
  /** The ref to read the registry from: `v<version>`, or `main`. */
  version: string
  /** Absent when the pin succeeded. */
  fallback?: RegistryVersionFallback
}

/**
 * Resolves which ref the component registry should be read from.
 *
 * Before the 1.0 API freeze this was hard-coded to `main`, which meant the
 * copy-paste surface had no version at all: two users running
 * `rootnative add button` a week apart got different source, and any commit to
 * trunk reached every new install immediately. Semver can't describe that, so
 * `init` now pins the project to the release tag matching the latest published
 * `@rootnative/core`.
 *
 * Falls back to `main` when npm is unreachable or the tag isn't pushed yet —
 * the release workflow publishes to npm before the `v<version>` tag lands, so
 * there is a real window where the tag 404s. Same probe-then-fall-back shape as
 * `resolveTemplateSource` in `create.ts`.
 *
 * Every fallback is reported through `fallback` rather than logged here. A
 * silent degrade to trunk is what made the alpha.4 onboarding failure hard to
 * diagnose: the copied source referenced `@rootnative/core` APIs the installed
 * release did not export, and nothing said why. Callers must surface it.
 */
export async function resolveRegistryVersion(): Promise<RegistryVersionResult> {
  const fallback = 'main'

  try {
    const res = await fetch(`${NPM_REGISTRY}/@rootnative/core`)
    if (!res.ok) {
      return { version: fallback, fallback: { reason: 'npm-unreachable' } }
    }

    const data = (await res.json()) as {
      'dist-tags'?: Record<string, string>
    }
    const version = data['dist-tags']?.latest
    if (!version) {
      return { version: fallback, fallback: { reason: 'no-latest-tag' } }
    }

    const ref = `v${version}`
    // Only pin to a ref that actually serves a registry.
    const probe = await fetch(
      `${DEFAULT_CONFIG.registryUrl}/${ref}/registry/index.json`,
    )

    if (!probe.ok) {
      return { version: fallback, fallback: { reason: 'tag-missing', version } }
    }

    return { version: ref }
  } catch {
    return { version: fallback, fallback: { reason: 'npm-unreachable' } }
  }
}

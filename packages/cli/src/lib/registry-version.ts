import { DEFAULT_CONFIG } from './config'

const NPM_REGISTRY = 'https://registry.npmjs.org'

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
 */
export async function resolveRegistryVersion(): Promise<string> {
  const fallback = 'main'

  try {
    const res = await fetch(`${NPM_REGISTRY}/@rootnative/core`)
    if (!res.ok) return fallback

    const data = (await res.json()) as {
      'dist-tags'?: Record<string, string>
    }
    const version = data['dist-tags']?.latest
    if (!version) return fallback

    const ref = `v${version}`
    // Only pin to a ref that actually serves a registry.
    const probe = await fetch(
      `${DEFAULT_CONFIG.registryUrl}/${ref}/registry/index.json`,
    )
    return probe.ok ? ref : fallback
  } catch {
    return fallback
  }
}

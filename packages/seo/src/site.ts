import type { Site, SiteConfig } from './types'

export const DEFAULT_DESCRIPTION_LIMIT = 160

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/** Resolves a `SiteConfig` into a `Site` with every default filled in. */
export function defineSite(config: SiteConfig): Site {
  const name = config.name.trim()
  const url = trimTrailingSlash(config.url.trim())
  if (!name) throw new Error('defineSite: `name` must not be empty.')
  if (!/^https?:\/\//.test(url)) {
    throw new Error(
      `defineSite: \`url\` must be absolute and start with http:// or https://, got "${config.url}".`,
    )
  }
  return {
    name,
    url,
    locale: config.locale,
    titleTemplate:
      config.titleTemplate ??
      ((title) => (title === name ? title : `${title} | ${name}`)),
    twitterSite: config.twitterSite,
    descriptionLimit: config.descriptionLimit ?? DEFAULT_DESCRIPTION_LIMIT,
  }
}

/**
 * Turns a page path into an absolute URL under the site. An absolute input
 * passes through unchanged.
 */
export function resolveUrl(site: Site, pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${site.url}${path}`
}

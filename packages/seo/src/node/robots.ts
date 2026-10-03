import { writeOutput } from './write'

export type RobotsOptions = {
  /** One or more absolute sitemap URLs. */
  sitemapUrl: string | string[]
  /** Paths a crawler must not fetch. The default is none. */
  disallow?: string[]
  /** Paths a crawler may fetch inside a disallowed one. */
  allow?: string[]
  /** The default is `*`. */
  userAgent?: string
}

export type WriteRobotsOptions = RobotsOptions & {
  outDir: string
  /** The default is `robots.txt`. */
  fileName?: string
}

const WHY_NO_OVERLAY_DISALLOW = [
  '# An overlay or a per-device route is not listed here on purpose. A crawler',
  '# reads a `noindex` tag only on a page it may fetch, so a Disallow line would',
  '# hide the tag and leave the URL in the index with no title.',
]

/**
 * The text of a `robots.txt`. The file must sit at the origin root to be
 * read, so a site on a subpath host writes it from the root deploy.
 */
export function robotsTxt(options: RobotsOptions): string {
  const sitemaps = Array.isArray(options.sitemapUrl)
    ? options.sitemapUrl
    : [options.sitemapUrl]
  const lines = [`User-agent: ${options.userAgent ?? '*'}`]
  for (const path of options.allow ?? []) lines.push(`Allow: ${path}`)
  const disallow = options.disallow ?? []
  if (disallow.length === 0) {
    lines.push('Disallow:')
  } else {
    for (const path of disallow) lines.push(`Disallow: ${path}`)
  }
  lines.push('', ...WHY_NO_OVERLAY_DISALLOW, '')
  for (const url of sitemaps) lines.push(`Sitemap: ${url}`)
  lines.push('')
  return lines.join('\n')
}

/** Writes `robots.txt` into `outDir` and returns the file path. */
export function writeRobots(options: WriteRobotsOptions): Promise<string> {
  return writeOutput(
    options.outDir,
    options.fileName ?? 'robots.txt',
    robotsTxt(options),
  )
}

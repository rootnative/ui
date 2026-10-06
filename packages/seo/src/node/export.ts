import { readFile, readdir, stat } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { writeRobots, type RobotsOptions } from './robots'
import { writeSitemap } from './sitemap'
import { trimTrailingSlash } from './write'

/** What a crawler reads from one exported HTML file. */
export type ExportedPage = {
  /** The path of the file under `outDir`, with `/` separators. */
  file: string
  /**
   * The path the host serves the file at: `/` for `index.html`, `/about` for
   * `about.html`, and `/blog` for `blog/index.html`.
   */
  route: string
  /** The `href` of `<link rel="canonical">`, decoded. */
  canonical?: string
  /** True when `<meta name="robots">` holds `noindex` or `none`. */
  noindex: boolean
}

/** Why a page stays out of the sitemap. */
export type SkipReason =
  | 'special-route'
  | 'route-template'
  | 'noindex'
  | 'no-canonical'
  | 'outside-site'
  | 'duplicate'

export type WriteSeoFilesOptions = {
  /** The export folder, for example `dist`. */
  outDir: string
  /**
   * The absolute origin and base path. The default is the canonical link of
   * `index.html`.
   */
  siteUrl?: string
  /**
   * `false` writes no `robots.txt`. An object passes options to
   * `writeRobots`; its `sitemapUrl` replaces the default,
   * `<siteUrl>/sitemap.xml`.
   */
  robots?: boolean | Partial<RobotsOptions>
}

export type SeoFilesResult = {
  siteUrl: string
  /** The path of `sitemap.xml`. */
  sitemap: string
  /** The path of `robots.txt`, or `undefined` with `robots: false`. */
  robots?: string
  /** The sitemap URLs, sorted. */
  urls: string[]
  /** Every HTML file that stays out of the sitemap, and why. */
  skipped: { file: string; reason: SkipReason }[]
}

/**
 * `+not-found`, `+html`, `_sitemap`, `_layout`: Expo Router reserves both
 * prefixes. A root `404.html` is the host's not-found page, often a copy of
 * the home page with its canonical link.
 */
const SPECIAL_ROUTE = /(^|\/)[+_]|^404\.html$/
/** `[id]` or `[...rest]`: the file Expo writes for a route with no static params. */
const ROUTE_TEMPLATE = /\[[^\]]+\]/
const TAG = /<(link|meta)\b([^>]*)>/gi
const ATTRIBUTE = /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (entity, code: string) => {
      const lower = code.toLowerCase()
      if (lower.startsWith('#x'))
        return String.fromCodePoint(parseInt(lower.slice(2), 16))
      if (lower.startsWith('#'))
        return String.fromCodePoint(parseInt(lower.slice(1), 10))
      const named: Record<string, string> = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
      }
      return named[lower] ?? entity
    },
  )
}

function attributesOf(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1]?.toLowerCase()
    if (!name) continue
    attributes[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

function tokens(value: string | undefined, separator: RegExp): string[] {
  return (value ?? '')
    .toLowerCase()
    .split(separator)
    .map((token) => token.trim())
    .filter(Boolean)
}

/** The canonical link and the robots rule of one page, read from its head. */
export function readHead(
  html: string,
): Pick<ExportedPage, 'canonical' | 'noindex'> {
  const end = html.search(/<\/head>/i)
  const head = end === -1 ? html : html.slice(0, end)
  let canonical: string | undefined
  let noindex = false
  for (const match of head.matchAll(TAG)) {
    const attributes = attributesOf(match[2] ?? '')
    const tag = match[1]?.toLowerCase()
    if (
      tag === 'link' &&
      canonical === undefined &&
      tokens(attributes.rel, /\s+/).includes('canonical') &&
      attributes.href
    ) {
      canonical = attributes.href
    }
    if (tag === 'meta' && attributes.name?.toLowerCase() === 'robots') {
      const rules = tokens(attributes.content, /,/)
      if (rules.includes('noindex') || rules.includes('none')) noindex = true
    }
  }
  return { canonical, noindex }
}

function routeOf(file: string): string {
  const path = file.replace(/\.html$/, '')
  if (path === 'index') return '/'
  return `/${path.replace(/\/index$/, '')}`
}

/**
 * Reads every `.html` file under `outDir`, sorted by path. Throws when the
 * folder does not exist.
 */
export async function readExport(outDir: string): Promise<ExportedPage[]> {
  const folder = await stat(outDir).catch(() => undefined)
  if (!folder?.isDirectory()) {
    throw new Error(
      `readExport: "${outDir}" is not a folder. Run the web export first.`,
    )
  }
  const files = (await readdir(outDir, { recursive: true }))
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.split(sep).join('/'))
    .sort()
  return Promise.all(
    files.map(async (file) => ({
      file,
      route: routeOf(file),
      ...readHead(await readFile(join(outDir, file), 'utf8')),
    })),
  )
}

function absoluteSiteUrl(url: string): string {
  const trimmed = trimTrailingSlash(url.trim())
  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error(
      `writeSeoFiles: \`siteUrl\` must be absolute and start with http:// or https://, got "${url}".`,
    )
  }
  return trimmed
}

function isUnder(siteUrl: string, url: string): boolean {
  return (
    url === siteUrl ||
    url.startsWith(`${siteUrl}/`) ||
    url.startsWith(`${siteUrl}?`)
  )
}

function skipReason(
  page: ExportedPage,
  siteUrl: string,
  listed: Set<string>,
): SkipReason | undefined {
  if (SPECIAL_ROUTE.test(page.file)) return 'special-route'
  if (ROUTE_TEMPLATE.test(page.file)) return 'route-template'
  if (page.noindex) return 'noindex'
  if (!page.canonical) return 'no-canonical'
  if (!isUnder(siteUrl, page.canonical)) return 'outside-site'
  if (listed.has(page.canonical)) return 'duplicate'
  return undefined
}

/**
 * Writes `sitemap.xml` and `robots.txt` into `outDir` from the exported HTML
 * files. A page goes in the sitemap with its canonical link, when that link is
 * under the site and the page has no `noindex`. The sitemap then lists the
 * address each page declares, and a route the export did not write is never
 * listed.
 *
 * Throws when no page can go in the sitemap, because an empty sitemap on a
 * live host fails with no other signal.
 */
export async function writeSeoFiles(
  options: WriteSeoFilesOptions,
): Promise<SeoFilesResult> {
  const { outDir } = options
  const pages = await readExport(outDir)
  if (pages.length === 0) {
    throw new Error(
      `writeSeoFiles: no .html file in "${outDir}". Set \`web.output\` to \`static\` in app.json.`,
    )
  }

  const home = pages.find((page) => page.route === '/')?.canonical
  if (!options.siteUrl && !home) {
    throw new Error(
      'writeSeoFiles: no site URL. Pass `siteUrl`, or give the home page (index.html) a canonical link.',
    )
  }
  const siteUrl = absoluteSiteUrl(options.siteUrl ?? home ?? '')

  const listed = new Set<string>()
  const skipped: SeoFilesResult['skipped'] = []
  for (const page of pages) {
    const reason = skipReason(page, siteUrl, listed)
    if (reason) skipped.push({ file: page.file, reason })
    else if (page.canonical) listed.add(page.canonical)
  }

  const urls = [...listed].sort()
  if (urls.length === 0) {
    throw new Error(
      `writeSeoFiles: no page in "${outDir}" can go in the sitemap. A page needs a canonical link under ${siteUrl} and no noindex.`,
    )
  }

  const sitemap = await writeSitemap({
    outDir,
    siteUrl,
    urls: urls.map((loc) => ({ loc })),
  })

  let robots: string | undefined
  if (options.robots !== false) {
    const extra = typeof options.robots === 'object' ? options.robots : {}
    robots = await writeRobots({
      ...extra,
      outDir,
      sitemapUrl: extra.sitemapUrl ?? `${siteUrl}/sitemap.xml`,
    })
  }

  return { siteUrl, sitemap, robots, urls, skipped }
}

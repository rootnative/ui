import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { languageOf, sameLanguage } from '../lang'
import type { PageAlternate } from '../types'
import { writeRobots, type RobotsOptions } from './robots'
import { writeSitemap } from './sitemap'
import { trimTrailingSlash } from './write'

/** What a crawler reads from one exported HTML file. */
export type ExportedPage = {
  /**
   * The path of the file under the pages folder, with `/` separators: under
   * `outDir`, or for a server export under `<outDir>/rendered` or
   * `<outDir>/server` (see `exportLayout`).
   */
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
  /** Each `<link rel="alternate" hreflang>`, in the order of the head, decoded. */
  alternates: PageAlternate[]
  /** The `content` of `<meta property="og:locale">`, such as `de_DE`. */
  locale?: string
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
  /**
   * `false` leaves the `lang` of `<html>` as the shell wrote it. The default
   * sets it in each page whose own language, from its `hreflang` link to
   * itself or else its `og:locale`, is not the language on `<html>`. A
   * server export is not changed: the server renders each page at request
   * time, and the page sets its `lang` after hydration.
   */
  lang?: boolean
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
  /** Each page that got its own `lang` on `<html>`, with the language. */
  langs: { file: string; lang: string }[]
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
const HTML_TAG = /<html\b([^>]*)>/i
const LANG_ATTRIBUTE = /\slang\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i

export function decodeEntities(text: string): string {
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

/** The attributes of one tag, from the text between its name and `>`. */
export function attributesOf(source: string): Record<string, string> {
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

/** The canonical link, the robots rule, the `hreflang` links and the `og:locale` of one page, read from its head. */
export function readHead(
  html: string,
): Pick<ExportedPage, 'canonical' | 'noindex' | 'alternates' | 'locale'> {
  const end = html.search(/<\/head>/i)
  const head = end === -1 ? html : html.slice(0, end)
  let canonical: string | undefined
  let locale: string | undefined
  let noindex = false
  const alternates: PageAlternate[] = []
  for (const match of head.matchAll(TAG)) {
    const attributes = attributesOf(match[2] ?? '')
    const tag = match[1]?.toLowerCase()
    const rel = tokens(attributes.rel, /\s+/)
    if (
      tag === 'link' &&
      canonical === undefined &&
      rel.includes('canonical') &&
      attributes.href
    ) {
      canonical = attributes.href
    }
    if (
      tag === 'link' &&
      rel.includes('alternate') &&
      attributes.hreflang !== undefined &&
      attributes.href
    ) {
      alternates.push({ lang: attributes.hreflang, url: attributes.href })
    }
    if (tag === 'meta' && attributes.name?.toLowerCase() === 'robots') {
      const rules = tokens(attributes.content, /,/)
      if (rules.includes('noindex') || rules.includes('none')) noindex = true
    }
    if (
      tag === 'meta' &&
      locale === undefined &&
      attributes.property?.toLowerCase() === 'og:locale' &&
      attributes.content
    ) {
      locale = attributes.content
    }
  }
  return locale === undefined
    ? { canonical, noindex, alternates }
    : { canonical, noindex, alternates, locale }
}

/** The `lang` of `<html>`, trimmed, or `undefined` when the element has none. */
export function htmlLang(html: string): string | undefined {
  return attributesOf(html.match(HTML_TAG)?.[1] ?? '').lang?.trim()
}

/**
 * The language of an exported page, from the head `readHead` read: the
 * `hreflang` link to the page itself, else `og:locale`.
 */
export function pageLangOf(
  page: Pick<ExportedPage, 'canonical' | 'alternates' | 'locale'>,
): string | undefined {
  return languageOf({
    url: page.canonical,
    alternates: page.alternates,
    locale: page.locale,
  })
}

/** `html` with `lang` set on `<html>`. A `lang` that was there is replaced. */
export function withHtmlLang(html: string, lang: string): string {
  return html.replace(HTML_TAG, (tag) => {
    const bare = tag.replace(LANG_ATTRIBUTE, '')
    return `${bare.slice(0, -1)} lang="${lang}">`
  })
}

/** The route a static host serves `file` at: `/` for `index.html`, `/blog` for `blog/index.html`. */
export function routeOf(file: string): string {
  const path = file.replace(/\.html$/, '')
  if (path === 'index') return '/'
  return `/${path.replace(/\/index$/, '')}`
}

/** Where an export keeps its pages, and the folder the host sends as files. */
export type ExportLayout = {
  /** The folder of the `.html` pages. */
  pagesDir: string
  /** The folder for `sitemap.xml` and `robots.txt`. */
  filesDir: string
  /** True for `web.output: 'server'`. */
  server: boolean
}

/** The folder under a server export that `renderServerExport` writes to. */
export const RENDERED_DIR = 'rendered'

async function isDirectory(path: string): Promise<boolean> {
  return stat(path)
    .then((info) => info.isDirectory())
    .catch(() => false)
}

/**
 * `web.output: 'server'` writes the files the server sends as they are to
 * `<outDir>/client`, and `_expo/routes.json` to `<outDir>/server`. Up to
 * Expo SDK 57 the pages are in `<outDir>/server` too. From SDK 58 the server
 * renders each page at request time, so the pages are the ones
 * `renderServerExport` writes to `<outDir>/rendered`. A static export keeps
 * the pages and the files in `outDir`. `expo serve` tells the two apart by
 * the routes file.
 */
export async function exportLayout(outDir: string): Promise<ExportLayout> {
  const routes = await stat(join(outDir, 'server', '_expo', 'routes.json'))
    .then((info) => info.isFile())
    .catch(() => false)
  if (routes && (await isDirectory(join(outDir, 'client')))) {
    const rendered = join(outDir, RENDERED_DIR)
    return {
      pagesDir: (await isDirectory(rendered))
        ? rendered
        : join(outDir, 'server'),
      filesDir: join(outDir, 'client'),
      server: true,
    }
  }
  return { pagesDir: outDir, filesDir: outDir, server: false }
}

/** The error message of `caller` for an export with no `.html` file. */
export function noPagesMessage(
  caller: string,
  outDir: string,
  layout: ExportLayout,
): string {
  const hint = layout.server
    ? 'A server export from Expo SDK 58 has no page files: run `renderServerExport` first.'
    : 'Set `web.output` to `static` or `server` in app.json.'
  return `${caller}: no .html file in "${outDir}". ${hint}`
}

/**
 * Every `.html` file under `outDir`, as a path with `/` separators, sorted.
 * Throws when the folder does not exist. `caller` names the function in the
 * error.
 */
export async function listHtmlFiles(
  outDir: string,
  caller: string,
): Promise<string[]> {
  const folder = await stat(outDir).catch(() => undefined)
  if (!folder?.isDirectory()) {
    throw new Error(
      `${caller}: "${outDir}" is not a folder. Run the web export first.`,
    )
  }
  return (await readdir(outDir, { recursive: true }))
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.split(sep).join('/'))
    .sort()
}

/**
 * Reads every `.html` page of the export in `outDir`, sorted by path, from
 * the pages folder of `exportLayout`. Throws when the folder does not exist.
 */
export async function readExport(outDir: string): Promise<ExportedPage[]> {
  const { pagesDir } = await exportLayout(outDir)
  const files = await listHtmlFiles(pagesDir, 'readExport')
  return Promise.all(
    files.map(async (file) => ({
      file,
      route: routeOf(file),
      ...readHead(await readFile(join(pagesDir, file), 'utf8')),
    })),
  )
}

/** `url` with no trailing slash. Throws when it is not absolute. */
export function absoluteSiteUrl(url: string, caller: string): string {
  const trimmed = trimTrailingSlash(url.trim())
  if (!/^https?:\/\//.test(trimmed)) {
    throw new Error(
      `${caller}: \`siteUrl\` must be absolute and start with http:// or https://, got "${url}".`,
    )
  }
  return trimmed
}

export function isUnder(siteUrl: string, url: string): boolean {
  return (
    url === siteUrl ||
    url.startsWith(`${siteUrl}/`) ||
    url.startsWith(`${siteUrl}?`)
  )
}

/** Why `page` stays out of the sitemap, or `undefined` when it goes in. */
export function skipReason(
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
 * Writes `sitemap.xml` and `robots.txt` from the exported HTML files: into
 * `outDir`, or into `<outDir>/client` for a server export, which is the
 * folder the server sends as files. A page goes in the sitemap with its canonical link, when that link is
 * under the site and the page has no `noindex`. The sitemap then lists the
 * address each page declares, and a route the export did not write is never
 * listed. A page with `hreflang` links gets the same links as `xhtml:link`
 * entries.
 *
 * Also sets `lang` on `<html>` in each page of a static export whose own
 * language, from its `hreflang` link to itself or else its `og:locale`, is
 * not the language the shell wrote there. Expo Router writes the `<html>`
 * of `app/+html.tsx` on every page, and from Expo SDK 58 the render changes
 * no attribute of it, so the German version of an English site says
 * `lang="en"` until this runs. `lang: false` skips the step.
 *
 * Throws when no page can go in the sitemap, because an empty sitemap on a
 * live host fails with no other signal.
 */
export async function writeSeoFiles(
  options: WriteSeoFilesOptions,
): Promise<SeoFilesResult> {
  const { outDir } = options
  const pages = await readExport(outDir)
  const layout = await exportLayout(outDir)
  if (pages.length === 0) {
    throw new Error(noPagesMessage('writeSeoFiles', outDir, layout))
  }
  const { filesDir } = layout
  const langs =
    options.lang === false || layout.server
      ? []
      : await writePageLangs(layout.pagesDir, pages)

  const home = pages.find((page) => page.route === '/')?.canonical
  if (!options.siteUrl && !home) {
    throw new Error(
      'writeSeoFiles: no site URL. Pass `siteUrl`, or give the home page (index.html) a canonical link.',
    )
  }
  const siteUrl = absoluteSiteUrl(
    options.siteUrl ?? home ?? '',
    'writeSeoFiles',
  )

  const listed = new Set<string>()
  const alternates = new Map<string, PageAlternate[]>()
  const skipped: SeoFilesResult['skipped'] = []
  for (const page of pages) {
    const reason = skipReason(page, siteUrl, listed)
    if (reason) skipped.push({ file: page.file, reason })
    else if (page.canonical) {
      listed.add(page.canonical)
      if (page.alternates.length > 0) {
        alternates.set(page.canonical, page.alternates)
      }
    }
  }

  const urls = [...listed].sort()
  if (urls.length === 0) {
    throw new Error(
      `writeSeoFiles: no page in "${outDir}" can go in the sitemap. A page needs a canonical link under ${siteUrl} and no noindex.`,
    )
  }

  const sitemap = await writeSitemap({
    outDir: filesDir,
    siteUrl,
    urls: urls.map((loc) => ({ loc, alternates: alternates.get(loc) })),
  })

  let robots: string | undefined
  if (options.robots !== false) {
    const extra = typeof options.robots === 'object' ? options.robots : {}
    robots = await writeRobots({
      ...extra,
      outDir: filesDir,
      sitemapUrl: extra.sitemapUrl ?? `${siteUrl}/sitemap.xml`,
    })
  }

  return { siteUrl, sitemap, robots, urls, skipped, langs }
}

/**
 * Sets `lang` on `<html>` in each page whose own language is not the one
 * on the element, and returns those pages. A page with no language of its
 * own, such as a `noindex` overlay with no `url`, keeps the `lang` of the
 * shell.
 */
async function writePageLangs(
  pagesDir: string,
  pages: ExportedPage[],
): Promise<SeoFilesResult['langs']> {
  const langs: SeoFilesResult['langs'] = []
  for (const page of pages) {
    const lang = pageLangOf(page)
    if (!lang) continue
    const path = join(pagesDir, page.file)
    const html = await readFile(path, 'utf8')
    const current = htmlLang(html)
    if (current && sameLanguage(current, lang)) continue
    await writeFile(path, withHtmlLang(html, lang), 'utf8')
    langs.push({ file: page.file, lang })
  }
  return langs
}

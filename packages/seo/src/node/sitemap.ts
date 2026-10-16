import type { PageAlternate } from '../types'
import { escapeXml, trimTrailingSlash, writeOutput } from './write'

export type SitemapUrl = {
  /** A path under `siteUrl`, or an absolute URL. */
  loc: string
  /** ISO 8601 date or date-time. */
  lastmod?: string
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  /** Between 0 and 1. */
  priority?: number
  /**
   * Every language version of the page, this page included, as
   * `xhtml:link` entries. A relative `url` is joined under `siteUrl`.
   */
  alternates?: PageAlternate[]
}

export type SitemapOptions = {
  /** The absolute origin and base path, for example `https://example.com/app`. */
  siteUrl: string
  urls: SitemapUrl[]
}

export type WriteSitemapOptions = SitemapOptions & {
  outDir: string
  /** The default is `sitemap.xml`. */
  fileName?: string
}

function absolute(siteUrl: string, loc: string): string {
  if (/^https?:\/\//.test(loc)) return loc
  const base = trimTrailingSlash(siteUrl)
  return `${base}${loc.startsWith('/') ? loc : `/${loc}`}`
}

/**
 * The XML text of a sitemap. Every value is escaped, so `&` in a query string
 * is safe. The `xhtml` namespace is declared only when an entry has
 * `alternates`.
 */
export function sitemapXml(options: SitemapOptions): string {
  const entries = options.urls.map((url) => {
    const lines = [
      `    <loc>${escapeXml(absolute(options.siteUrl, url.loc))}</loc>`,
    ]
    if (url.lastmod)
      lines.push(`    <lastmod>${escapeXml(url.lastmod)}</lastmod>`)
    if (url.changefreq) {
      lines.push(`    <changefreq>${url.changefreq}</changefreq>`)
    }
    if (url.priority !== undefined) {
      const clamped = Math.min(1, Math.max(0, url.priority))
      lines.push(`    <priority>${clamped.toFixed(1)}</priority>`)
    }
    for (const alternate of url.alternates ?? []) {
      lines.push(
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.lang)}" href="${escapeXml(absolute(options.siteUrl, alternate.url))}"/>`,
      )
    }
    return `  <url>\n${lines.join('\n')}\n  </url>`
  })
  const xhtml = options.urls.some((url) => url.alternates?.length)
    ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"'
    : ''
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${xhtml}>`,
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}

/** Writes `sitemap.xml` into `outDir` and returns the file path. */
export function writeSitemap(options: WriteSitemapOptions): Promise<string> {
  return writeOutput(
    options.outDir,
    options.fileName ?? 'sitemap.xml',
    sitemapXml(options),
  )
}

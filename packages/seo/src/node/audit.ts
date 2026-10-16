import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PageAlternate } from '../types'
import {
  absoluteSiteUrl,
  attributesOf,
  decodeEntities,
  isUnder,
  exportLayout,
  listHtmlFiles,
  readHead,
  skipReason,
  type ExportedPage,
} from './export'

/** One rule of `auditExport`. Pass a rule in `ignore` to skip it. */
export type AuditRule =
  | 'title'
  | 'canonical'
  | 'h1'
  | 'main'
  | 'lang'
  | 'alt'
  | 'hreflang'
  | 'sitemap'

export type AuditProblem = {
  /** The path of the page under the pages folder, or `sitemap.xml`. */
  file: string
  rule: AuditRule
  message: string
}

export type AuditExportOptions = {
  /** The export folder, for example `dist`. */
  outDir: string
  /**
   * The absolute origin and base path. The default is the canonical link of
   * `index.html`. The `sitemap` rule needs it to know which page must be in
   * the sitemap; with neither, that half of the rule is skipped.
   */
  siteUrl?: string
  /** Rules to skip. */
  ignore?: AuditRule[]
}

export type AuditResult = {
  /** The number of HTML files read. */
  pages: number
  /** Every failed rule, sorted by file. Empty when the export passes. */
  problems: AuditProblem[]
}

const TITLE = /<title\b[^>]*>([\s\S]*?)<\/title>/gi
const H1 = /<h1[\s>]/gi
const MAIN = /<main[\s>]/gi
const HTML = /<html\b([^>]*)>/i
const IMG = /<img\b([^>]*)>/gi
const LOC = /<loc>([\s\S]*?)<\/loc>/gi
const URL_ENTRY = /<url>([\s\S]*?)<\/url>/gi
const XHTML_LINK = /<xhtml:link\b([^>]*?)\/?>/gi
/**
 * A language, then an optional script and an optional region: `en`,
 * `zh-Hant`, `en-GB`, `es-419`. Google reads ISO 639-1 and ISO 3166-1.
 */
const LANGUAGE_CODE =
  /^(?:x-default|[a-z]{2,3}(?:-[a-z]{4})?(?:-(?:[a-z]{2}|\d{3}))?)$/i

type AuditedPage = ExportedPage & {
  titles: string[]
  h1: number
  main: number
  lang: string | undefined
  /** The number of `<img>` tags with no `alt` attribute. */
  imgNoAlt: number
}

function headOf(html: string): string {
  const end = html.search(/<\/head>/i)
  return end === -1 ? html : html.slice(0, end)
}

async function readPage(outDir: string, file: string): Promise<AuditedPage> {
  const html = await readFile(join(outDir, file), 'utf8')
  const titles = [...headOf(html).matchAll(TITLE)].map((match) =>
    decodeEntities(match[1] ?? '').trim(),
  )
  const h1 = (html.match(H1) ?? []).length
  const main = (html.match(MAIN) ?? []).length
  const lang = attributesOf(html.match(HTML)?.[1] ?? '').lang?.trim()
  const imgNoAlt = [...html.matchAll(IMG)].filter(
    (match) => !('alt' in attributesOf(match[1] ?? '')),
  ).length
  const path = file.replace(/\.html$/, '')
  const route = path === 'index' ? '/' : `/${path.replace(/\/index$/, '')}`
  return { file, route, ...readHead(html), titles, h1, main, lang, imgNoAlt }
}

function count(n: number, noun: string): string {
  return `${n} <${noun}> tags`
}

function pageProblems(page: AuditedPage, rules: Set<AuditRule>) {
  const problems: AuditProblem[] = []
  const add = (rule: AuditRule, message: string) =>
    problems.push({ file: page.file, rule, message })

  if (rules.has('title')) {
    if (page.titles.length === 0) add('title', 'no <title>')
    else if (page.titles.length > 1)
      add('title', `${count(page.titles.length, 'title')}, expected one`)
    else if (page.titles[0] === '')
      add('title', 'empty <title>. Pass `title` to `PageHead`.')
  }

  if (rules.has('canonical')) {
    if (!page.canonical && !page.noindex) {
      add(
        'canonical',
        'no canonical link and no noindex. Pass `url` to `PageHead`, or `noindex` on a page a crawler must not index.',
      )
    } else if (page.canonical && !/^https?:\/\//.test(page.canonical)) {
      add('canonical', `canonical link "${page.canonical}" is not absolute`)
    }
  }

  if (rules.has('h1')) {
    if (page.h1 === 0) add('h1', 'no <h1>')
    else if (page.h1 > 1) {
      add(
        'h1',
        `${count(page.h1, 'h1')}, expected one. The AppBar title is level 1 by default; pass \`titleLevel\` to a bar inside the page.`,
      )
    }
  }

  if (rules.has('main')) {
    if (page.main === 0) {
      add(
        'main',
        'no <main>. Give the view around the screen content `role="main"`, once per page.',
      )
    } else if (page.main > 1) {
      add('main', `${count(page.main, 'main')}, expected one`)
    }
  }

  if (rules.has('lang') && !page.lang) {
    add('lang', 'no lang on <html>. Set it in app/+html.tsx.')
  }

  if (rules.has('alt') && page.imgNoAlt > 0) {
    add(
      'alt',
      `${page.imgNoAlt} <img> ${page.imgNoAlt === 1 ? 'tag has' : 'tags have'} no alt. Pass \`alt\` to \`Picture\`, or \`alt=""\` for a decorative image.`,
    )
  }

  return problems
}

function sitemapProblems(
  xml: string | undefined,
  pages: AuditedPage[],
  siteUrl: string | undefined,
): AuditProblem[] {
  if (xml === undefined) {
    return [
      {
        file: 'sitemap.xml',
        rule: 'sitemap',
        message: 'missing. Run `rootnative-seo <outDir>` after the export.',
      },
    ]
  }

  const locs = new Set(
    [...xml.matchAll(LOC)].map((match) =>
      decodeEntities(match[1] ?? '').trim(),
    ),
  )
  const canonicals = new Set(
    pages.map((page) => page.canonical).filter((url) => url !== undefined),
  )
  const problems: AuditProblem[] = []
  for (const loc of locs) {
    if (!canonicals.has(loc)) {
      problems.push({
        file: 'sitemap.xml',
        rule: 'sitemap',
        message: `lists ${loc}, and no page declares it as its canonical link`,
      })
    }
  }

  if (siteUrl === undefined) return problems
  const listed = new Set<string>()
  for (const page of pages) {
    if (skipReason(page, siteUrl, listed) !== undefined) continue
    if (page.canonical === undefined) continue
    listed.add(page.canonical)
    if (!locs.has(page.canonical)) {
      problems.push({
        file: page.file,
        rule: 'sitemap',
        message: `${page.canonical} is not in sitemap.xml`,
      })
    }
  }
  return problems
}

function alternateKey({ lang, url }: PageAlternate): string {
  return `${lang.toLowerCase()} ${url}`
}

function isDefault({ lang }: PageAlternate): boolean {
  return lang.toLowerCase() === 'x-default'
}

/**
 * The `hreflang` links of every indexable page: valid codes, absolute URLs,
 * one link per code, a link to the page itself, and the same set on every
 * page the set names. A link to a page outside the export is checked for
 * its shape only.
 */
function hreflangProblems(
  pages: AuditedPage[],
  siteUrl: string | undefined,
): AuditProblem[] {
  const problems: AuditProblem[] = []
  const reported = new Set<string>()
  const add = (file: string, message: string, once?: string) => {
    if (once !== undefined) {
      if (reported.has(once)) return
      reported.add(once)
    }
    problems.push({ file, rule: 'hreflang', message })
  }
  const byCanonical = new Map<string, AuditedPage>()
  for (const page of pages) {
    if (page.canonical !== undefined && !byCanonical.has(page.canonical)) {
      byCanonical.set(page.canonical, page)
    }
  }

  for (const page of pages) {
    if (page.alternates.length === 0 || page.noindex) continue
    const counts = new Map<string, number>()
    for (const { lang, url } of page.alternates) {
      if (!LANGUAGE_CODE.test(lang)) {
        add(
          page.file,
          `hreflang "${lang}" is not a language code. Use a code such as "en" or "en-US", or "x-default".`,
        )
      } else if (/-uk$/i.test(lang)) {
        add(
          page.file,
          `hreflang "${lang}": the region code of the United Kingdom is GB.`,
        )
      }
      if (!/^https?:\/\//.test(url)) {
        add(page.file, `the hreflang "${lang}" link "${url}" is not absolute`)
      }
      const code = lang.toLowerCase()
      counts.set(code, (counts.get(code) ?? 0) + 1)
    }
    for (const [code, n] of counts) {
      if (n > 1)
        add(page.file, `${n} hreflang links for "${code}", expected one`)
    }

    const canonical = page.canonical
    if (canonical === undefined) continue
    const self = page.alternates.some(
      (alternate) => alternate.url === canonical && !isDefault(alternate),
    )
    if (!self) {
      add(
        page.file,
        `no hreflang link to this page (${canonical}). List every language version, this page included.`,
      )
    }

    for (const alternate of page.alternates) {
      if (alternate.url === canonical) continue
      const target = byCanonical.get(alternate.url)
      if (!target) {
        if (siteUrl !== undefined && isUnder(siteUrl, alternate.url)) {
          add(
            page.file,
            `the hreflang "${alternate.lang}" link points to ${alternate.url}, and no page declares it as its canonical link`,
          )
        }
        continue
      }
      if (target.noindex) {
        add(
          page.file,
          `the hreflang "${alternate.lang}" link points to ${alternate.url}, which has noindex`,
        )
        continue
      }
      if (target.alternates.length === 0) {
        add(
          target.file,
          `no hreflang links, and ${page.file} names this page "${alternate.lang}". Every language version lists the same links.`,
          `${target.file} none`,
        )
        continue
      }
      const theirs = new Set(target.alternates.map(alternateKey))
      const targetHasSelf = target.alternates.some(
        (link) => link.url === target.canonical && !isDefault(link),
      )
      for (const link of page.alternates) {
        const key = alternateKey(link)
        if (theirs.has(key)) continue
        // A page with no link to itself has its own problem above.
        if (link.url === target.canonical && !targetHasSelf) continue
        add(
          target.file,
          `no hreflang "${link.lang}" link to ${link.url}, and ${page.file} lists it. Every language version lists the same links.`,
          `${target.file} ${key}`,
        )
      }
    }
  }
  return problems
}

/**
 * The `xhtml:link` entries of the sitemap against the `hreflang` links of
 * the page at each `<loc>`. The sitemap may leave them out; when it lists
 * them, it lists the same set.
 */
function sitemapHreflangProblems(
  xml: string,
  pages: AuditedPage[],
): AuditProblem[] {
  const problems: AuditProblem[] = []
  const add = (message: string) =>
    problems.push({ file: 'sitemap.xml', rule: 'hreflang', message })
  let linked = false
  for (const entry of xml.matchAll(URL_ENTRY)) {
    const body = entry[1] ?? ''
    const loc = decodeEntities(
      body.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1] ?? '',
    ).trim()
    const links: PageAlternate[] = [...body.matchAll(XHTML_LINK)].map(
      (match) => {
        const attributes = attributesOf(match[1] ?? '')
        return { lang: attributes.hreflang ?? '', url: attributes.href ?? '' }
      },
    )
    if (links.length === 0) continue
    linked = true
    const page = pages.find((candidate) => candidate.canonical === loc)
    if (!page) continue
    const listed = new Set(links.map(alternateKey))
    const declared = new Set(page.alternates.map(alternateKey))
    const same =
      listed.size === declared.size &&
      [...listed].every((key) => declared.has(key))
    if (!same) {
      add(
        `the xhtml:link entries of ${loc} differ from the hreflang links of ${page.file}`,
      )
    }
  }
  if (
    linked &&
    !/xmlns:xhtml\s*=\s*["']http:\/\/www\.w3\.org\/1999\/xhtml["']/.test(xml)
  ) {
    add(
      'has xhtml:link entries and no xmlns:xhtml="http://www.w3.org/1999/xhtml" on <urlset>',
    )
  }
  return problems
}

/**
 * Reads every `.html` page of the export in `outDir` (in `<outDir>/server`
 * for a server export) and returns each rule a page fails:
 * no `<title>` or an empty one, no canonical link on a page with no
 * `noindex`, not exactly one `<h1>`, not exactly one `<main>`, no `lang` on
 * `<html>`, an `<img>` with no `alt`, a wrong set of `hreflang` links, and a
 * `sitemap.xml` entry that no page declares or a page that must be in the
 * sitemap and is not. It does not
 * throw on a problem; the caller decides. It throws when the folder does not
 * exist or holds no HTML file.
 */
export async function auditExport(
  options: AuditExportOptions,
): Promise<AuditResult> {
  const { outDir } = options
  const { pagesDir, filesDir } = await exportLayout(outDir)
  const files = await listHtmlFiles(pagesDir, 'auditExport')
  if (files.length === 0) {
    throw new Error(
      `auditExport: no .html file in "${outDir}". Set \`web.output\` to \`static\` or \`server\` in app.json.`,
    )
  }
  const rules = new Set<AuditRule>([
    'title',
    'canonical',
    'h1',
    'main',
    'lang',
    'alt',
    'hreflang',
    'sitemap',
  ])
  for (const rule of options.ignore ?? []) rules.delete(rule)

  const pages = await Promise.all(files.map((file) => readPage(pagesDir, file)))
  const problems = pages.flatMap((page) => pageProblems(page, rules))

  if (rules.has('sitemap') || rules.has('hreflang')) {
    const home = pages.find((page) => page.route === '/')?.canonical
    const site = options.siteUrl ?? home
    const siteUrl =
      site === undefined ? undefined : absoluteSiteUrl(site, 'auditExport')
    const xml = await readFile(join(filesDir, 'sitemap.xml'), 'utf8').catch(
      () => undefined,
    )
    if (rules.has('sitemap')) {
      problems.push(...sitemapProblems(xml, pages, siteUrl))
    }
    if (rules.has('hreflang')) {
      problems.push(...hreflangProblems(pages, siteUrl))
      if (xml !== undefined) {
        problems.push(...sitemapHreflangProblems(xml, pages))
      }
    }
  }

  problems.sort((a, b) => a.file.localeCompare(b.file))
  return { pages: pages.length, problems }
}

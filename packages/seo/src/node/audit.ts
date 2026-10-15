import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  absoluteSiteUrl,
  attributesOf,
  decodeEntities,
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
  | 'sitemap'

export type AuditProblem = {
  /** The path of the file under `outDir`, or `sitemap.xml`. */
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
const LOC = /<loc>([\s\S]*?)<\/loc>/gi

type AuditedPage = ExportedPage & {
  titles: string[]
  h1: number
  main: number
  lang: string | undefined
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
  const path = file.replace(/\.html$/, '')
  const route = path === 'index' ? '/' : `/${path.replace(/\/index$/, '')}`
  return { file, route, ...readHead(html), titles, h1, main, lang }
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

  return problems
}

async function sitemapProblems(
  outDir: string,
  pages: AuditedPage[],
  siteUrl: string | undefined,
): Promise<AuditProblem[]> {
  const xml = await readFile(join(outDir, 'sitemap.xml'), 'utf8').catch(
    () => undefined,
  )
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

/**
 * Reads every `.html` file under `outDir` and returns each rule a page fails:
 * no `<title>` or an empty one, no canonical link on a page with no
 * `noindex`, not exactly one `<h1>`, not exactly one `<main>`, no `lang` on
 * `<html>`, and a `sitemap.xml` entry that no page declares or a page that
 * must be in the sitemap and is not. It does not
 * throw on a problem; the caller decides. It throws when the folder does not
 * exist or holds no HTML file.
 */
export async function auditExport(
  options: AuditExportOptions,
): Promise<AuditResult> {
  const { outDir } = options
  const files = await listHtmlFiles(outDir, 'auditExport')
  if (files.length === 0) {
    throw new Error(
      `auditExport: no .html file in "${outDir}". Set \`web.output\` to \`static\` in app.json.`,
    )
  }
  const rules = new Set<AuditRule>([
    'title',
    'canonical',
    'h1',
    'main',
    'lang',
    'sitemap',
  ])
  for (const rule of options.ignore ?? []) rules.delete(rule)

  const pages = await Promise.all(files.map((file) => readPage(outDir, file)))
  const problems = pages.flatMap((page) => pageProblems(page, rules))

  if (rules.has('sitemap')) {
    const home = pages.find((page) => page.route === '/')?.canonical
    const site = options.siteUrl ?? home
    const siteUrl =
      site === undefined ? undefined : absoluteSiteUrl(site, 'auditExport')
    problems.push(...(await sitemapProblems(outDir, pages, siteUrl)))
  }

  problems.sort((a, b) => a.file.localeCompare(b.file))
  return { pages: pages.length, problems }
}

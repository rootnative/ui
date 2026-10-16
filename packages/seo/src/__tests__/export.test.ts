import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { readExport, writeSeoFiles } from '../node'
import { main } from '../node/cli'
import { readHead } from '../node/export'

const SITE = 'https://example.com/app'

let outDir: string

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-export-'))
})

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true })
})

function page(head: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/>${head}</head><body><div id="root"></div></body></html>`
}

const canonical = (href: string) =>
  `<link data-rh="true" rel="canonical" href="${href}"/>`

async function writePages(pages: Record<string, string>): Promise<void> {
  for (const [file, html] of Object.entries(pages)) {
    const path = join(outDir, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, html, 'utf8')
  }
}

/** One page of each kind the rules decide on, as Expo Router exports them. */
async function writeExport(): Promise<void> {
  await writePages({
    'index.html': page(canonical(`${SITE}/`)),
    'about.html': page(canonical(`${SITE}/about`)),
    'blog/index.html': page(canonical(`${SITE}/blog`)),
    'items/42.html': page(canonical(`${SITE}/items/42?tab=a&amp;b`)),
    'search.html': page('<meta name="robots" content="noindex, nofollow"/>'),
    'items/[id].html': page(''),
    '+not-found.html': page(''),
    '_sitemap.html': page(canonical(`${SITE}/_sitemap`)),
    'draft.html': page(''),
    'mirror.html': page(canonical('https://other.example/mirror')),
    '404.html': page(canonical(`${SITE}/`)),
    'dup.html': page(canonical(`${SITE}/about`)),
    '_expo/static/js/web/entry.js': 'console.log(1)',
  })
}

describe('readHead', () => {
  it('reads the canonical link in any attribute order and quote style', () => {
    expect(
      readHead(page(`<link href='/a?x=1&amp;y=2' rel="canonical"/>`)),
    ).toEqual({ canonical: '/a?x=1&y=2', noindex: false, alternates: [] })
    expect(
      readHead(page('<link rel="alternate canonical" href="/b"/>')).canonical,
    ).toBe('/b')
  })

  it('reads noindex and none in a robots rule, in any case', () => {
    expect(readHead(page('<meta name="ROBOTS" content="NoIndex"/>'))).toEqual({
      canonical: undefined,
      noindex: true,
      alternates: [],
    })
    expect(readHead(page('<meta content="none" name="robots"/>')).noindex).toBe(
      true,
    )
    expect(
      readHead(page('<meta name="robots" content="nofollow"/>')).noindex,
    ).toBe(false)
  })

  it('reads the hreflang links in order, in the spelling react-helmet-async writes', () => {
    const head = [
      `<link data-rh="true" rel="alternate" hrefLang="en" href="${SITE}/a?x=1&amp;y=2"/>`,
      `<link rel="alternate" href="${SITE}/de/a" hreflang="de"/>`,
      `<link rel="alternate" type="application/rss+xml" href="${SITE}/feed.xml"/>`,
      `<link rel="alternate" hreflang="x-default" href="${SITE}/a"/>`,
    ].join('')
    expect(readHead(page(head)).alternates).toEqual([
      { lang: 'en', url: `${SITE}/a?x=1&y=2` },
      { lang: 'de', url: `${SITE}/de/a` },
      { lang: 'x-default', url: `${SITE}/a` },
    ])
  })

  it('ignores a canonical link in the body', () => {
    const html = page('').replace(
      '<div id="root">',
      '<div id="root"><link rel="canonical" href="/late"/>',
    )
    expect(readHead(html).canonical).toBeUndefined()
  })
})

describe('readExport', () => {
  it('reads every HTML file, nested ones too, with its route', async () => {
    await writeExport()
    const pages = await readExport(outDir)
    expect(pages.map((p) => p.file)).toEqual([
      '+not-found.html',
      '404.html',
      '_sitemap.html',
      'about.html',
      'blog/index.html',
      'draft.html',
      'dup.html',
      'index.html',
      'items/42.html',
      'items/[id].html',
      'mirror.html',
      'search.html',
    ])
    const routes = Object.fromEntries(pages.map((p) => [p.file, p.route]))
    expect(routes['index.html']).toBe('/')
    expect(routes['about.html']).toBe('/about')
    expect(routes['blog/index.html']).toBe('/blog')
    expect(routes['items/42.html']).toBe('/items/42')
  })

  it('throws when the folder does not exist', async () => {
    await expect(readExport(join(outDir, 'missing'))).rejects.toThrow(
      /not a folder/,
    )
  })
})

describe('writeSeoFiles', () => {
  it('lists each canonical link once and skips every other page with a reason', async () => {
    await writeExport()
    const result = await writeSeoFiles({ outDir })

    expect(result.siteUrl).toBe(SITE)
    expect(result.urls).toEqual([
      `${SITE}/`,
      `${SITE}/about`,
      `${SITE}/blog`,
      `${SITE}/items/42?tab=a&b`,
    ])
    expect(result.skipped).toEqual([
      { file: '+not-found.html', reason: 'special-route' },
      { file: '404.html', reason: 'special-route' },
      { file: '_sitemap.html', reason: 'special-route' },
      { file: 'draft.html', reason: 'no-canonical' },
      { file: 'dup.html', reason: 'duplicate' },
      { file: 'items/[id].html', reason: 'route-template' },
      { file: 'mirror.html', reason: 'outside-site' },
      { file: 'search.html', reason: 'noindex' },
    ])

    const xml = await readFile(result.sitemap, 'utf8')
    expect((xml.match(/<url>/g) ?? []).length).toBe(4)
    expect(xml).toContain(`<loc>${SITE}/items/42?tab=a&amp;b</loc>`)
  })

  it('writes robots.txt with the sitemap of the site', async () => {
    await writeExport()
    const result = await writeSeoFiles({ outDir })
    expect(result.robots).toBe(join(outDir, 'robots.txt'))
    const text = await readFile(join(outDir, 'robots.txt'), 'utf8')
    expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(text).toContain('Disallow:\n')
  })

  it('takes a site URL and robots options', async () => {
    await writeExport()
    const result = await writeSeoFiles({
      outDir,
      siteUrl: `${SITE}/`,
      robots: { sitemapUrl: ['https://example.com/sitemap.xml'] },
    })
    expect(result.siteUrl).toBe(SITE)
    const text = await readFile(join(outDir, 'robots.txt'), 'utf8')
    expect(text).toContain('Sitemap: https://example.com/sitemap.xml')
    expect(text).not.toContain(`${SITE}/sitemap.xml`)
  })

  it('writes the hreflang links of a page as xhtml:link entries', async () => {
    const alternates = (self: string) =>
      canonical(`${SITE}${self}`) +
      [
        ['en', '/a'],
        ['de', '/de/a'],
        ['x-default', '/a'],
      ]
        .map(
          ([lang, path]) =>
            `<link data-rh="true" rel="alternate" hrefLang="${lang}" href="${SITE}${path}"/>`,
        )
        .join('')
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'a.html': page(alternates('/a')),
      'de/a.html': page(alternates('/de/a')),
    })
    await writeSeoFiles({ outDir, robots: false })
    const xml = await readFile(join(outDir, 'sitemap.xml'), 'utf8')
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    )
    const links = `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/a"/>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE}/de/a"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/a"/>`
    expect(xml).toContain(`<loc>${SITE}/a</loc>\n${links}\n  </url>`)
    expect(xml).toContain(`<loc>${SITE}/de/a</loc>\n${links}\n  </url>`)
    expect(xml).toContain(`<loc>${SITE}/</loc>\n  </url>`)
  })

  it('reads the pages of a server export from server/ and writes the files to client/', async () => {
    await writePages({
      'server/_expo/routes.json': '{"htmlRoutes":[]}',
      'server/index.html': page(canonical(`${SITE}/`)),
      'server/about.html': page(canonical(`${SITE}/about`)),
      'server/+not-found.html': page(''),
      'client/_expo/static/js/web/entry.js': 'console.log(1)',
    })
    expect((await readExport(outDir)).map((p) => [p.file, p.route])).toEqual([
      ['+not-found.html', '/+not-found'],
      ['about.html', '/about'],
      ['index.html', '/'],
    ])
    const result = await writeSeoFiles({ outDir })
    expect(result.siteUrl).toBe(SITE)
    expect(result.urls).toEqual([`${SITE}/`, `${SITE}/about`])
    expect(result.sitemap).toBe(join(outDir, 'client', 'sitemap.xml'))
    expect(result.robots).toBe(join(outDir, 'client', 'robots.txt'))
    await expect(readFile(join(outDir, 'sitemap.xml'))).rejects.toThrow()
    await expect(
      readFile(join(outDir, 'server', 'sitemap.xml')),
    ).rejects.toThrow()
  })

  it('reads a folder with server/ and no routes file as a static export', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'server/index.html': page(canonical(`${SITE}/server`)),
      'client/index.html': page(canonical(`${SITE}/client`)),
    })
    const result = await writeSeoFiles({ outDir, robots: false })
    expect(result.sitemap).toBe(join(outDir, 'sitemap.xml'))
    expect(result.urls).toEqual([
      `${SITE}/`,
      `${SITE}/client`,
      `${SITE}/server`,
    ])
  })

  it('writes no robots.txt with robots: false', async () => {
    await writeExport()
    const result = await writeSeoFiles({ outDir, robots: false })
    expect(result.robots).toBeUndefined()
    await expect(readFile(join(outDir, 'robots.txt'))).rejects.toThrow()
  })

  it('skips a page whose canonical link is under another base path', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'old.html': page(canonical(`${SITE}-old/page`)),
    })
    const result = await writeSeoFiles({ outDir })
    expect(result.skipped).toEqual([
      { file: 'old.html', reason: 'outside-site' },
    ])
  })

  it('throws with no HTML file', async () => {
    await expect(writeSeoFiles({ outDir })).rejects.toThrow(/no \.html file/)
  })

  it('throws with no site URL and no canonical link on the home page', async () => {
    await writePages({ 'index.html': page('') })
    await expect(writeSeoFiles({ outDir })).rejects.toThrow(/no site URL/)
  })

  it('throws on a relative site URL', async () => {
    await writePages({ 'index.html': page(canonical(`${SITE}/`)) })
    await expect(writeSeoFiles({ outDir, siteUrl: '/app' })).rejects.toThrow(
      /must be absolute/,
    )
  })

  it('throws when no page can go in the sitemap', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'about.html': page(canonical(`${SITE}/about`)),
    })
    await expect(
      writeSeoFiles({ outDir, siteUrl: 'https://elsewhere.example' }),
    ).rejects.toThrow(/no page .* can go in the sitemap/)
  })
})

describe('rootnative-seo', () => {
  function capture() {
    const lines: string[] = []
    const errors: string[] = []
    return {
      lines,
      errors,
      output: {
        log: (line: string) => lines.push(line),
        error: (line: string) => errors.push(line),
      },
    }
  }

  it('writes both files, says why each page stays out, and notes a subpath site', async () => {
    await writeExport()
    const { lines, output } = capture()
    expect(await main([outDir], output)).toBe(0)
    const text = lines.join('\n')
    expect(text).toContain(`4 pages under ${SITE}`)
    expect(text).toContain('robots.txt')
    expect(text).toContain('origin root only')
    expect(text).toContain('search.html: noindex')
    expect(text).toContain('items/[id].html: a dynamic route template')
  })

  it('passes --site-url, --sitemap, and --no-robots through', async () => {
    await writeExport()
    expect(
      await main(
        [
          outDir,
          '--site-url',
          SITE,
          '--sitemap',
          'https://example.com/a.xml',
          '--sitemap',
          'https://example.com/b.xml',
        ],
        capture().output,
      ),
    ).toBe(0)
    const text = await readFile(join(outDir, 'robots.txt'), 'utf8')
    expect(text).toContain('Sitemap: https://example.com/a.xml')
    expect(text).toContain('Sitemap: https://example.com/b.xml')

    await rm(join(outDir, 'robots.txt'))
    expect(await main([outDir, '--no-robots'], capture().output)).toBe(0)
    await expect(readFile(join(outDir, 'robots.txt'))).rejects.toThrow()
  })

  it('prints the usage and fails with no folder or an unknown option', async () => {
    const none = capture()
    expect(await main([], none.output)).toBe(1)
    expect(none.errors.join('\n')).toContain('Usage: rootnative-seo')

    const unknown = capture()
    expect(await main([outDir, '--siteurl', SITE], unknown.output)).toBe(1)
    expect(unknown.errors.join('\n')).toContain('Usage: rootnative-seo')
  })

  it('prints the usage with --help', async () => {
    const help = capture()
    expect(await main(['--help'], help.output)).toBe(0)
    expect(help.lines.join('\n')).toContain('--no-robots')
  })

  it('reports an error and fails when the export is missing', async () => {
    const run = capture()
    expect(await main([join(outDir, 'missing')], run.output)).toBe(1)
    expect(run.errors.join('\n')).toContain('not a folder')
  })
})

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { auditExport, writeSeoFiles } from '../node'
import { main } from '../node/cli'

const SITE = 'https://example.com/app'

let outDir: string

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-audit-'))
})

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true })
})

const canonical = (href: string) =>
  `<link data-rh="true" rel="canonical" href="${href}"/>`

/** A page as Expo Router exports it, with the given head and body. */
function page(
  head: string,
  body = '<h1 aria-level="1" role="heading">Title</h1>',
): string {
  return `<!DOCTYPE html><html lang="en"><head><title data-rh="true">Page</title><meta charSet="utf-8"/>${head}</head><body><div id="root">${body}</div></body></html>`
}

async function writePages(pages: Record<string, string>): Promise<void> {
  for (const [file, html] of Object.entries(pages)) {
    const path = join(outDir, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, html, 'utf8')
  }
}

/** A clean export: two content pages, one noindex overlay, one not-found. */
async function writeCleanExport(): Promise<void> {
  await writePages({
    'index.html': page(canonical(`${SITE}/`)),
    'blog/index.html': page(canonical(`${SITE}/blog`)),
    'search.html': page('<meta name="robots" content="noindex"/>'),
    '+not-found.html': page('<meta name="robots" content="noindex"/>'),
  })
  await writeSeoFiles({ outDir, robots: false })
}

describe('auditExport', () => {
  it('passes a clean export', async () => {
    await writeCleanExport()
    const result = await auditExport({ outDir })
    expect(result).toEqual({ pages: 4, problems: [] })
  })

  it('reports the title rules', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'empty.html': page(canonical(`${SITE}/empty`)).replace(
        '<title data-rh="true">Page</title>',
        '<title data-rh="true"></title>',
      ),
      'none.html': page(canonical(`${SITE}/none`)).replace(
        '<title data-rh="true">Page</title>',
        '',
      ),
      'two.html': page(`${canonical(`${SITE}/two`)}<title>Again</title>`),
    })
    const { problems } = await auditExport({ outDir, ignore: ['sitemap'] })
    expect(problems).toEqual([
      {
        file: 'empty.html',
        rule: 'title',
        message: expect.stringMatching(/^empty <title>/),
      },
      { file: 'none.html', rule: 'title', message: 'no <title>' },
      {
        file: 'two.html',
        rule: 'title',
        message: '2 <title> tags, expected one',
      },
    ])
  })

  it('reports a page with no canonical link and no noindex, and a relative canonical link', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'draft.html': page(''),
      'relative.html': page(canonical('/relative')),
      'overlay.html': page('<meta name="robots" content="noindex"/>'),
    })
    const { problems } = await auditExport({ outDir, ignore: ['sitemap'] })
    expect(problems).toEqual([
      {
        file: 'draft.html',
        rule: 'canonical',
        message: expect.stringMatching(/^no canonical link and no noindex/),
      },
      {
        file: 'relative.html',
        rule: 'canonical',
        message: 'canonical link "/relative" is not absolute',
      },
    ])
  })

  it('reports zero and many <h1>', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'none.html': page(canonical(`${SITE}/none`), '<p>No heading</p>'),
      'many.html': page(
        canonical(`${SITE}/many`),
        '<h1>One</h1><H1 class="x">Two</H1><h10>Not a heading</h10>',
      ),
    })
    const { problems } = await auditExport({ outDir, ignore: ['sitemap'] })
    expect(problems).toEqual([
      {
        file: 'many.html',
        rule: 'h1',
        message: expect.stringMatching(/^2 <h1> tags, expected one/),
      },
      { file: 'none.html', rule: 'h1', message: 'no <h1>' },
    ])
  })

  it('reports a missing sitemap', async () => {
    await writePages({ 'index.html': page(canonical(`${SITE}/`)) })
    const { problems } = await auditExport({ outDir })
    expect(problems).toEqual([
      {
        file: 'sitemap.xml',
        rule: 'sitemap',
        message: expect.stringMatching(/^missing/),
      },
    ])
  })

  it('reports a sitemap entry no page declares, and a page the sitemap misses', async () => {
    await writeCleanExport()
    await writePages({
      'about.html': page(canonical(`${SITE}/about?a=1&amp;b=2`)),
      'mirror.html': page(canonical('https://other.example/mirror')),
      'items/[id].html': page(canonical(`${SITE}/items/undefined`)),
    })
    await writeFile(
      join(outDir, 'sitemap.xml'),
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        `  <url><loc>${SITE}/</loc></url>`,
        `  <url><loc>${SITE}/gone</loc></url>`,
        '</urlset>',
      ].join('\n'),
    )
    const { problems } = await auditExport({ outDir })
    expect(problems).toEqual([
      {
        file: 'about.html',
        rule: 'sitemap',
        message: `${SITE}/about?a=1&b=2 is not in sitemap.xml`,
      },
      {
        file: 'blog/index.html',
        rule: 'sitemap',
        message: `${SITE}/blog is not in sitemap.xml`,
      },
      {
        file: 'sitemap.xml',
        rule: 'sitemap',
        message: `lists ${SITE}/gone, and no page declares it as its canonical link`,
      },
    ])
  })

  it('checks the sitemap entries only when it has no site URL', async () => {
    await writePages({
      'index.html': page('<meta name="robots" content="noindex"/>'),
      'about.html': page(canonical(`${SITE}/about`)),
    })
    await writeFile(
      join(outDir, 'sitemap.xml'),
      `<urlset><url><loc>${SITE}/about</loc></url></urlset>`,
    )
    expect((await auditExport({ outDir })).problems).toEqual([])
    expect((await auditExport({ outDir, siteUrl: SITE })).problems).toEqual([])
  })

  it('skips an ignored rule', async () => {
    await writePages({ 'index.html': page('', '<p>Nothing</p>') })
    const { problems } = await auditExport({
      outDir,
      ignore: ['canonical', 'h1', 'sitemap'],
    })
    expect(problems).toEqual([])
  })

  it('throws when the folder is missing, empty, or the site URL is relative', async () => {
    await expect(auditExport({ outDir: join(outDir, 'no') })).rejects.toThrow(
      /auditExport: .* not a folder/,
    )
    await expect(auditExport({ outDir })).rejects.toThrow(/no \.html file/)
    await writePages({ 'index.html': page('') })
    await expect(auditExport({ outDir, siteUrl: '/app' })).rejects.toThrow(
      /auditExport: `siteUrl` must be absolute/,
    )
  })
})

describe('rootnative-seo audit', () => {
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

  it('passes a clean export and writes nothing', async () => {
    await writeCleanExport()
    const { lines, output } = capture()
    expect(await main(['audit', outDir], output)).toBe(0)
    expect(lines.join('\n')).toContain('4 pages pass')
    await expect(rm(join(outDir, 'robots.txt'))).rejects.toThrow()
  })

  it('prints each problem with its file and rule, and fails', async () => {
    await writePages({
      'index.html': page(canonical(`${SITE}/`)),
      'draft.html': page('', '<p>None</p>'),
    })
    const { errors, output } = capture()
    expect(await main(['audit', outDir, '--ignore', 'sitemap'], output)).toBe(1)
    const text = errors.join('\n')
    expect(text).toContain('2 problems in 2 pages')
    expect(text).toContain('draft.html (canonical): no canonical link')
    expect(text).toContain('draft.html (h1): no <h1>')
    expect(text).not.toContain('sitemap.xml')
  })

  it('rejects an unknown rule, --ignore outside audit, and a missing folder', async () => {
    await writeCleanExport()
    const unknown = capture()
    expect(
      await main(['audit', outDir, '--ignore', 'h2'], unknown.output),
    ).toBe(1)
    expect(unknown.errors.join('\n')).toContain('Unknown rule "h2"')

    const outside = capture()
    expect(await main([outDir, '--ignore', 'h1'], outside.output)).toBe(1)
    expect(outside.errors.join('\n')).toContain(
      '--ignore applies to audit only',
    )

    const missing = capture()
    expect(await main(['audit', join(outDir, 'no')], missing.output)).toBe(1)
    expect(missing.errors.join('\n')).toContain('not a folder')
  })
})

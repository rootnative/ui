import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  manifestJson,
  robotsTxt,
  sitemapXml,
  writeManifest,
  writeRobots,
  writeSitemap,
} from '../node'

let outDir: string

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-node-'))
})

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true })
})

describe('sitemapXml', () => {
  it('writes valid XML with absolute locations and escapes & in a query', () => {
    const xml = sitemapXml({
      siteUrl: 'https://example.com/app/',
      urls: [
        { loc: '/', changefreq: 'daily', priority: 1 },
        { loc: 'items/1?a=1&b=2', lastmod: '2026-10-01' },
        { loc: 'https://other.example/x' },
      ],
    })
    expect(
      xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset'),
    ).toBe(true)
    expect(xml).toContain('<loc>https://example.com/app/</loc>')
    expect(xml).toContain(
      '<loc>https://example.com/app/items/1?a=1&amp;b=2</loc>',
    )
    expect(xml).toContain('<loc>https://other.example/x</loc>')
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>')
    expect(xml).toContain('<changefreq>daily</changefreq>')
    expect(xml).toContain('<priority>1.0</priority>')
    expect(xml).not.toContain('&b=')
    expect((xml.match(/<url>/g) ?? []).length).toBe(3)
  })

  it('clamps the priority', () => {
    const xml = sitemapXml({
      siteUrl: 'https://x.y',
      urls: [{ loc: '/', priority: 7 }],
    })
    expect(xml).toContain('<priority>1.0</priority>')
  })
})

describe('writeSitemap', () => {
  it('writes sitemap.xml into the output directory', async () => {
    const file = await writeSitemap({
      outDir: join(outDir, 'nested'),
      siteUrl: 'https://x.y',
      urls: [{ loc: '/' }],
    })
    expect(file).toBe(join(outDir, 'nested', 'sitemap.xml'))
    expect(await readFile(file, 'utf8')).toContain('<loc>https://x.y/</loc>')
  })
})

describe('robotsTxt', () => {
  it('allows everything by default and lists the sitemap', () => {
    const txt = robotsTxt({ sitemapUrl: 'https://x.y/sitemap.xml' })
    expect(txt).toContain('User-agent: *\nDisallow:\n')
    expect(txt).toContain('Sitemap: https://x.y/sitemap.xml')
    expect(txt).toContain('noindex')
  })

  it('writes each disallow, allow and sitemap line', () => {
    const txt = robotsTxt({
      sitemapUrl: ['https://x.y/a.xml', 'https://x.y/b.xml'],
      disallow: ['/admin', '/draft'],
      allow: ['/admin/public'],
      userAgent: 'Googlebot',
    })
    expect(txt).toContain('User-agent: Googlebot')
    expect(txt).toContain('Allow: /admin/public')
    expect(txt).toContain('Disallow: /admin\nDisallow: /draft')
    expect(txt).toContain(
      'Sitemap: https://x.y/a.xml\nSitemap: https://x.y/b.xml',
    )
    expect(txt).not.toContain('Disallow:\n')
  })
})

describe('writeRobots', () => {
  it('writes robots.txt', async () => {
    const file = await writeRobots({
      outDir,
      sitemapUrl: 'https://x.y/sitemap.xml',
    })
    expect(file).toBe(join(outDir, 'robots.txt'))
    expect(await readFile(file, 'utf8')).toContain('Sitemap:')
  })
})

describe('manifestJson', () => {
  it('uses relative defaults and infers the icon type', () => {
    expect(
      manifestJson({
        name: 'My App',
        themeColor: '#4C0519',
        icons: [{ src: './apple-touch-icon.png', sizes: '180x180' }],
      }),
    ).toEqual({
      name: 'My App',
      start_url: './',
      scope: './',
      display: 'standalone',
      theme_color: '#4C0519',
      icons: [
        { src: './apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    })
  })

  it('leaves every empty field out', () => {
    const manifest = manifestJson({ name: 'A', shortName: '', icons: [] })
    expect(Object.keys(manifest).sort()).toEqual(
      ['display', 'name', 'scope', 'start_url'].sort(),
    )
  })
})

describe('writeManifest', () => {
  it('writes manifest.webmanifest as JSON', async () => {
    const file = await writeManifest({ outDir, name: 'A', fileName: 'm.json' })
    expect(file).toBe(join(outDir, 'm.json'))
    expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({
      name: 'A',
    })
  })
})

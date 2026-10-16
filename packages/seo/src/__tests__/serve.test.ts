import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { serveExport, type ExportServer } from '../node'

let outDir: string
let server: ExportServer | undefined

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-serve-'))
})

afterEach(async () => {
  await server?.close()
  server = undefined
  await rm(outDir, { recursive: true, force: true })
})

async function writeFiles(files: Record<string, string>): Promise<void> {
  for (const [file, content] of Object.entries(files)) {
    const path = join(outDir, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }
}

const page = (canonical: string, body: string) =>
  `<!DOCTYPE html><html><head><link rel="canonical" href="${canonical}"/></head><body>${body}</body></html>`

describe('serveExport', () => {
  it('maps a route to its file, under the base path of the canonical link', async () => {
    await writeFiles({
      'index.html': page('https://example.com/app/', 'home'),
      'about.html': page('https://example.com/app/about', 'about'),
      'blog/index.html': page('https://example.com/app/blog', 'blog'),
      '_expo/static/js/entry.js': 'console.log(1)',
      '+not-found.html': page('', 'missing'),
    })
    server = await serveExport({ outDir })
    expect(server.basePath).toBe('/app')
    expect(server.urlOf('/about')).toBe(`${server.origin}/app/about`)

    const home = await fetch(server.urlOf('/'))
    expect(home.status).toBe(200)
    expect(home.headers.get('content-type')).toContain('text/html')
    expect(await home.text()).toContain('home')
    expect(await (await fetch(server.urlOf('/about'))).text()).toContain(
      'about',
    )
    expect(await (await fetch(server.urlOf('/blog'))).text()).toContain('blog')
    expect(await (await fetch(server.urlOf('/blog/'))).text()).toContain('blog')
    const script = await fetch(server.urlOf('/_expo/static/js/entry.js'))
    expect(script.headers.get('content-type')).toContain('text/javascript')

    const missing = await fetch(server.urlOf('/nope'))
    expect(missing.status).toBe(404)
    expect(await missing.text()).toContain('missing')
    expect((await fetch(`${server.origin}/about`)).status).toBe(404)
  })

  it('serves the root with no canonical link, and keeps a request inside the folder', async () => {
    await writeFiles({ 'index.html': page('', 'home') })
    await writeFile(join(tmpdir(), 'seo-serve-outside.txt'), 'secret')
    server = await serveExport({ outDir })
    expect(server.basePath).toBe('')
    expect((await fetch(`${server.origin}/`)).status).toBe(200)
    const outside = await fetch(`${server.origin}/..%2Fseo-serve-outside.txt`)
    expect(outside.status).toBe(404)
    expect(await outside.text()).not.toContain('secret')
    await rm(join(tmpdir(), 'seo-serve-outside.txt'), { force: true })
  })

  it('serves a server export: a file from client, then a page from server', async () => {
    await writeFiles({
      'server/_expo/routes.json': '{"htmlRoutes":[]}',
      'server/index.html': page('https://example.com/app/', 'home'),
      'server/about.html': page('https://example.com/app/about', 'about'),
      'server/+not-found.html': page('', 'missing'),
      'client/_expo/static/js/entry.js': 'console.log(1)',
      'client/sitemap.xml': '<urlset/>',
    })
    server = await serveExport({ outDir })
    expect(server.basePath).toBe('/app')
    expect(await (await fetch(server.urlOf('/about'))).text()).toContain(
      'about',
    )
    const script = await fetch(server.urlOf('/_expo/static/js/entry.js'))
    expect(script.status).toBe(200)
    expect((await fetch(server.urlOf('/sitemap.xml'))).status).toBe(200)
    expect((await fetch(server.urlOf('/server/about'))).status).toBe(404)
    expect((await fetch(server.urlOf('/_expo/routes.json'))).status).toBe(404)
    const missing = await fetch(server.urlOf('/nope'))
    expect(missing.status).toBe(404)
    expect(await missing.text()).toContain('missing')
  })

  it('takes an explicit base path', async () => {
    await writeFiles({ 'index.html': page('', 'home') })
    server = await serveExport({ outDir, basePath: 'demo/' })
    expect(server.basePath).toBe('/demo')
    expect((await fetch(`${server.origin}/demo`)).status).toBe(200)
    expect((await fetch(`${server.origin}/`)).status).toBe(404)
  })
})

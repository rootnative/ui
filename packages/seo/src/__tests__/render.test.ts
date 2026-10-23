import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { readExport, renderServerExport, writeSeoFiles } from '../node'
import { main } from '../node/cli'

const SITE = 'https://example.com/app'
const NOT_FOUND = '/rootnative-seo-not-found'

let outDir: string
let project: string | undefined
let server: Server | undefined
let requested: string[]

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-render-'))
  requested = []
})

afterEach(async () => {
  await new Promise((done) => (server ? server.close(done) : done(null)))
  server = undefined
  await rm(outDir, { recursive: true, force: true })
  if (project) await rm(project, { recursive: true, force: true })
  project = undefined
})

function page(head: string): string {
  return `<!DOCTYPE html><html lang="en"><head>${head}</head><body></body></html>`
}

const canonical = (href: string) => `<link rel="canonical" href="${href}"/>`
const noindex = '<meta name="robots" content="noindex"/>'

async function writeFiles(
  root: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [file, content] of Object.entries(files)) {
    const path = join(root, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }
}

/** A server export with the route manifest only, as Expo SDK 58 writes it. */
async function writeServerExport(routes: object): Promise<void> {
  await writeFiles(outDir, {
    'server/_expo/routes.json': JSON.stringify(routes),
    'client/_expo/static/js/web/entry.js': 'console.log(1)',
  })
}

type Answer = { status: number; html: string }

/** A stand-in for `expo serve`: each request gets the answer of its path. */
async function startServer(answer: (path: string) => Answer) {
  const instance = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
    requested.push(path)
    const { status, html } = answer(path)
    response.writeHead(status, { 'Content-Type': 'text/html' }).end(html)
  })
  server = instance
  await new Promise<void>((done) => instance.listen(0, '127.0.0.1', done))
  return `http://127.0.0.1:${(instance.address() as AddressInfo).port}`
}

/** A page with its own canonical link, and the not-found page with 404. */
const ssr = (path: string): Answer =>
  path.endsWith(NOT_FOUND)
    ? { status: 404, html: page(noindex) }
    : { status: 200, html: page(canonical(`${SITE}${path}`)) }

describe('renderServerExport', () => {
  it('requests each route, fills the params, and writes the pages', async () => {
    await writeServerExport({
      htmlRoutes: [
        { page: '/index' },
        { page: '/about' },
        { page: '/blog/index' },
        { page: '/(tabs)/feed' },
        { page: '/items/[id]' },
        { page: '/docs/[...path]' },
        { page: '/tags/[tag]' },
      ],
      notFoundRoutes: [{ page: '/+not-found' }],
    })
    const origin = await startServer(ssr)
    const result = await renderServerExport({
      outDir,
      origin,
      params: {
        '/items/[id]': [{ id: '42' }, { id: 'a b' }],
        '/docs/[...path]': [{ path: ['guide', 'start'] }],
      },
    })

    expect(result.pagesDir).toBe(join(outDir, 'rendered'))
    expect(result.pages.map((p) => [p.file, p.route, p.status])).toEqual([
      ['index.html', '/', 200],
      ['about.html', '/about', 200],
      ['blog/index.html', '/blog', 200],
      ['feed.html', '/feed', 200],
      ['items/42.html', '/items/42', 200],
      ['items/a b.html', '/items/a%20b', 200],
      ['docs/guide/start.html', '/docs/guide/start', 200],
      ['+not-found.html', NOT_FOUND, 404],
    ])
    expect(result.skipped).toEqual([
      { page: '/tags/[tag]', reason: 'no-params' },
    ])
    expect(
      await readFile(join(outDir, 'rendered', 'items', '42.html'), 'utf8'),
    ).toContain(`${SITE}/items/42`)

    // The other functions read the rendered pages, and write to client/.
    expect((await readExport(outDir)).map((p) => p.route)).toEqual([
      '/+not-found',
      '/about',
      '/blog',
      '/docs/guide/start',
      '/feed',
      '/',
      '/items/42',
      '/items/a b',
    ])
    const files = await writeSeoFiles({ outDir, robots: false })
    expect(files.sitemap).toBe(join(outDir, 'client', 'sitemap.xml'))
    expect(files.urls).toHaveLength(7)
  })

  it('requests the routes under the base path of origin', async () => {
    await writeServerExport({
      htmlRoutes: [{ page: '/index' }, { page: '/about' }],
    })
    const origin = await startServer(ssr)
    await renderServerExport({ outDir, origin: `${origin}/app/` })
    expect(requested).toEqual(['/app/', '/app/about'])
  })

  it('removes the pages of an earlier run', async () => {
    await writeServerExport({ htmlRoutes: [{ page: '/index' }] })
    await writeFiles(outDir, { 'rendered/old.html': page('') })
    const origin = await startServer(ssr)
    await renderServerExport({ outDir, origin })
    await expect(stat(join(outDir, 'rendered', 'old.html'))).rejects.toThrow()
    expect((await readExport(outDir)).map((p) => p.file)).toEqual([
      'index.html',
    ])
  })

  it('skips a not-found page that another route answers', async () => {
    await writeServerExport({
      htmlRoutes: [{ page: '/index' }, { page: '/[slug]' }],
      notFoundRoutes: [{ page: '/+not-found' }],
    })
    const origin = await startServer(() => ({ status: 200, html: page('') }))
    const result = await renderServerExport({
      outDir,
      origin,
      params: { '/[slug]': [{ slug: 'a' }] },
    })
    expect(result.pages.map((p) => p.file)).toEqual(['index.html', 'a.html'])
    expect(result.skipped).toEqual([{ page: '/+not-found', reason: 'not-404' }])
  })

  it('throws on a server error, and leaves no page', async () => {
    await writeServerExport({
      htmlRoutes: [{ page: '/index' }, { page: '/about' }],
    })
    await writeFiles(outDir, { 'rendered/index.html': page('') })
    const origin = await startServer((path) =>
      path === '/about' ? { status: 500, html: '' } : ssr(path),
    )
    await expect(renderServerExport({ outDir, origin })).rejects.toThrow(
      'renderServerExport: GET /about answered 500.',
    )
    await expect(stat(join(outDir, 'rendered'))).rejects.toThrow()
    await expect(writeSeoFiles({ outDir })).rejects.toThrow(
      'run `renderServerExport` first',
    )
  })

  it('throws on a missing param and on a missing route manifest', async () => {
    await expect(renderServerExport({ outDir })).rejects.toThrow(
      "Export with `web.output: 'server'` first.",
    )
    await writeServerExport({ htmlRoutes: [{ page: '/items/[id]' }] })
    await expect(
      renderServerExport({
        outDir,
        origin: 'http://127.0.0.1:9',
        params: { '/items/[id]': [{ other: 'x' }] },
      }),
    ).rejects.toThrow('the params of "/items/[id]" need a string for "id"')
  })

  it('starts expo serve from projectRoot on the export, and stops it', async () => {
    await writeServerExport({
      htmlRoutes: [{ page: '/index' }],
      notFoundRoutes: [{ page: '/+not-found' }],
    })
    project = await mkdtemp(join(tmpdir(), 'seo-render-project-'))
    const pidFile = join(project, 'pid')
    // Answers as `expo serve` does, with the folder it serves in the body.
    await writeFiles(project, {
      'package.json': '{}',
      'node_modules/expo/package.json': '{"name":"expo"}',
      'node_modules/expo/bin/cli.js': `
        const { createServer } = require('node:http')
        const { writeFileSync } = require('node:fs')
        const args = process.argv.slice(2)
        if (args[0] !== 'serve') process.exit(2)
        writeFileSync(${JSON.stringify(pidFile)}, String(process.pid))
        createServer((request, response) => {
          const home = request.url === '/'
          response.writeHead(home ? 200 : 404, { 'Content-Type': 'text/html' })
          response.end('<html><head><title>' + (home ? 'Home' : 'Missing') + '</title></head><body>' + args[1] + '</body></html>')
        }).listen(Number(args[args.indexOf('--port') + 1]), '127.0.0.1')
      `,
    })

    const result = await renderServerExport({ outDir, projectRoot: project })
    expect(result.pages.map((p) => [p.file, p.status])).toEqual([
      ['index.html', 200],
      ['+not-found.html', 404],
    ])
    const home = await readFile(join(outDir, 'rendered', 'index.html'), 'utf8')
    expect(home).toContain('<title>Home</title>')
    expect(home).toContain(outDir)
    const pid = Number(await readFile(pidFile, 'utf8'))
    expect(() => process.kill(pid, 0)).toThrow()
  })

  it('throws when the project has no expo package', async () => {
    await writeServerExport({ htmlRoutes: [{ page: '/index' }] })
    project = await mkdtemp(join(tmpdir(), 'seo-render-project-'))
    await expect(
      renderServerExport({ outDir, projectRoot: project }),
    ).rejects.toThrow('no `expo` package in')
  })
})

describe('rootnative-seo render', () => {
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

  it('renders with --origin and --params, and lists each route with no page', async () => {
    await writeServerExport({
      htmlRoutes: [
        { page: '/index' },
        { page: '/items/[id]' },
        { page: '/tags/[tag]' },
      ],
      notFoundRoutes: [{ page: '/+not-found' }],
    })
    const params = join(outDir, 'params.json')
    await writeFile(params, '{"/items/[id]": [{"id": "42"}]}', 'utf8')
    const origin = await startServer(ssr)
    const run = capture()
    expect(
      await main(
        ['render', outDir, '--origin', origin, '--params', params],
        run.output,
      ),
    ).toBe(0)
    const text = run.lines.join('\n')
    expect(text).toContain(`3 pages → ${join(outDir, 'rendered')}`)
    expect(text).toContain('/tags/[tag]: a dynamic route with no entry')
    expect(
      await readFile(join(outDir, 'rendered', 'items', '42.html'), 'utf8'),
    ).toContain(`${SITE}/items/42`)
  })

  it('fails on a params file that is not a map of lists', async () => {
    await writeServerExport({ htmlRoutes: [{ page: '/index' }] })
    const params = join(outDir, 'params.json')
    for (const content of ['{"/items/[id]": {"id": "42"}}', 'not json']) {
      await writeFile(params, content, 'utf8')
      const run = capture()
      expect(
        await main(
          [
            'render',
            outDir,
            '--origin',
            'http://127.0.0.1:9',
            '--params',
            params,
          ],
          run.output,
        ),
      ).toBe(1)
      expect(run.errors.join('\n')).toContain('--params:')
    }
  })

  it('fails with --params or --origin on another command', async () => {
    const run = capture()
    expect(await main([outDir, '--origin', 'http://x'], run.output)).toBe(1)
    expect(run.errors.join('\n')).toContain('apply to render only')
  })

  it('lists render in the usage', async () => {
    const help = capture()
    expect(await main(['--help'], help.output)).toBe(0)
    expect(help.lines.join('\n')).toContain('rootnative-seo render <outDir>')
  })
})

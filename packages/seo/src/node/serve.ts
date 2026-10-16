import { readFile, stat } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { exportLayout, readHead } from './export'

export type ServeExportOptions = {
  /** The export folder, for example `dist`. */
  outDir: string
  /**
   * The path the site lives under on the host, for example `/ui/demo`. The
   * default is the path of the canonical link of `index.html`, or `/`.
   */
  basePath?: string
  /** The default is a free port. */
  port?: number
}

export type ExportServer = {
  /** The origin, for example `http://127.0.0.1:51234`. */
  origin: string
  /** The base path, with no trailing slash: `` for the root. */
  basePath: string
  /** `origin` + `basePath` + `route`. */
  urlOf: (route: string) => string
  close: () => Promise<void>
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}

/** The base path of the site from the canonical link of `index.html`, or ``. */
export async function basePathOf(outDir: string): Promise<string> {
  const html = await readFile(join(outDir, 'index.html'), 'utf8').catch(
    () => undefined,
  )
  const canonical = html === undefined ? undefined : readHead(html).canonical
  if (!canonical || !/^https?:\/\//.test(canonical)) return ''
  const path = trimSlashes(new URL(canonical).pathname)
  return path ? `/${path}` : ''
}

/**
 * The base path that `serveExport` serves under: `basePath`, else the path of
 * the canonical link of `index.html`. `''` is the root.
 */
export async function servedBasePath(
  pagesDir: string,
  basePath: string | undefined,
): Promise<string> {
  const path = basePath
    ? `/${trimSlashes(basePath)}`
    : await basePathOf(pagesDir)
  return path === '/' ? '' : path
}

async function isFile(path: string): Promise<boolean> {
  const info = await stat(path).catch(() => undefined)
  return info?.isFile() ?? false
}

/**
 * The file for a request path under the base path, as a static host serves
 * an Expo Router export: the file itself, `<path>.html`, or
 * `<path>/index.html`. `undefined` when none exists or the path leaves
 * `outDir`.
 */
async function fileFor(
  outDir: string,
  path: string,
): Promise<string | undefined> {
  const root = resolve(outDir)
  const relative = trimSlashes(path)
  const candidates = relative
    ? [relative, `${relative}.html`, `${relative}/index.html`]
    : ['index.html']
  for (const candidate of candidates) {
    const file = resolve(root, candidate)
    if (file !== root && !file.startsWith(root + sep)) return undefined
    if (await isFile(file)) return file
  }
  return undefined
}

/**
 * Serves `outDir` on `127.0.0.1` the way a static host serves an Expo Router
 * export, under `basePath`. A route with no file gets the `+not-found.html`
 * or `404.html` page with status 404. A server export is served from its two
 * folders: a file from `client`, then a page from `server`. A dynamic route
 * gets its own file only, as on a static host; the Expo server answers
 * every match with the route template. Close it when done.
 */
export async function serveExport(
  options: ServeExportOptions,
): Promise<ExportServer> {
  const { outDir } = options
  const { pagesDir, filesDir } = await exportLayout(outDir)
  const base = await servedBasePath(pagesDir, options.basePath)

  // The server folder also holds the route manifest and the server bundles,
  // which the Expo server never sends, so only a page comes from there.
  const resolveRequest = async (route: string) => {
    const file = await fileFor(filesDir, route)
    if (file || pagesDir === filesDir) return file
    const page = await fileFor(pagesDir, route)
    return page && extname(page) === '.html' ? page : undefined
  }

  const server: Server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    let path: string
    try {
      path = decodeURIComponent(url.pathname)
    } catch {
      response.writeHead(400).end()
      return
    }
    const underBase =
      base === '' || path === base || path.startsWith(`${base}/`)
    const file = underBase
      ? await resolveRequest(path.slice(base.length))
      : undefined
    if (file) {
      response.writeHead(200, {
        'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      })
      response.end(await readFile(file))
      return
    }
    for (const name of ['+not-found.html', '404.html']) {
      const notFound = join(pagesDir, name)
      if (await isFile(notFound)) {
        response.writeHead(404, { 'Content-Type': TYPES['.html'] ?? '' })
        response.end(await readFile(notFound))
        return
      }
    }
    response.writeHead(404, { 'Content-Type': TYPES['.txt'] ?? '' })
    response.end('Not found')
  })

  await new Promise<void>((done, fail) => {
    server.once('error', fail)
    server.listen(options.port ?? 0, '127.0.0.1', () => done())
  })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  const origin = `http://127.0.0.1:${port}`
  return {
    origin,
    basePath: base,
    urlOf: (route) =>
      `${origin}${base}${route.startsWith('/') ? route : `/${route}`}`,
    close: () =>
      new Promise<void>((done, fail) => {
        server.close((error) => (error ? fail(error) : done()))
      }),
  }
}

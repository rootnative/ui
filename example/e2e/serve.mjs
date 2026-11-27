/**
 * Serves a static web export at the path it was built for, `/ui/demo`.
 * `E2E_DIST` is the export folder (default `dist`), `E2E_PORT` the port.
 */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = '/ui/demo'
const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  process.env.E2E_DIST ?? 'dist',
)
const port = Number(process.env.E2E_PORT ?? 4319)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
}

if (!existsSync(join(root, 'index.html'))) {
  console.error(`[e2e] No web export in ${root}. Run "pnpm run export:web".`)
  process.exit(1)
}

createServer((request, response) => {
  let path = normalize(
    decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
  )
  if (path.startsWith(BASE)) path = path.slice(BASE.length)
  const file = [path, `${path}.html`, join(path, 'index.html')]
    .map((candidate) => join(root, candidate))
    .find(
      (candidate) =>
        candidate.startsWith(root) &&
        existsSync(candidate) &&
        statSync(candidate).isFile(),
    )
  if (file === undefined) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  response.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
  })
  response.end(readFileSync(file))
}).listen(port, '127.0.0.1')

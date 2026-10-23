import { spawn, type ChildProcess } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { dirname, join, resolve } from 'node:path'
import { RENDERED_DIR } from './export'

/** The values of the dynamic segments of one page. A catch-all segment takes a list. */
export type RouteParams = Record<string, string | string[]>

export type RenderServerExportOptions = {
  /** The folder of a `web.output: 'server'` export, for example `dist`. */
  outDir: string
  /**
   * The params of each dynamic route, by its `page` in `routes.json`:
   * `{ '/showcase/[slug]': [{ slug: 'media-card' }] }`. The server export
   * does not run `generateStaticParams`, so a dynamic route with no entry
   * gets no page.
   */
  params?: Record<string, RouteParams[]>
  /**
   * A server that answers the routes already, with the base path they are
   * under: `https://preview.example.com/app`. The default starts
   * `expo serve` on `outDir`, which matches the routes from the root.
   */
  origin?: string
  /** The folder that has `expo` installed. The default is the current folder. */
  projectRoot?: string
  /** How long to wait for `expo serve` to answer, in ms. The default is 60000. */
  timeoutMs?: number
}

export type RenderedPage = {
  /** The path of the file under `<outDir>/rendered`, with `/` separators. */
  file: string
  /** The path the page was requested at, under the origin. */
  route: string
  status: number
}

export type RenderSkip = {
  /** The `page` of the route in `routes.json`. */
  page: string
  /**
   * `no-params`: a dynamic route with no entry in `params`. `not-404`: the
   * request for a not-found page matched another route.
   */
  reason: 'no-params' | 'not-404'
}

export type RenderServerResult = {
  /** `<outDir>/rendered`. */
  pagesDir: string
  pages: RenderedPage[]
  skipped: RenderSkip[]
}

type ManifestRoute = { page: string }
type RoutesManifest = {
  htmlRoutes?: ManifestRoute[]
  notFoundRoutes?: ManifestRoute[]
}
type Target = { page: string; route: string; file: string; notFound: boolean }

const DYNAMIC = /^\[(\.\.\.)?([^\]]+)\]$/
const GROUP = /^\(.+\)$/
/** The last segment of the request for a not-found page. No app route is likely to match it. */
const NOT_FOUND_PROBE = 'rootnative-seo-not-found'

function segmentsOf(page: string): string[] {
  return page.split('/').filter((segment) => segment && !GROUP.test(segment))
}

/** The segments of `page` with each dynamic segment replaced by its param. */
function fill(page: string, segments: string[], params: RouteParams) {
  return segments.flatMap((segment) => {
    const match = DYNAMIC.exec(segment)
    if (!match) return [segment]
    const [, catchAll, name = ''] = match
    const value = params[name]
    if (value === undefined || (!catchAll && Array.isArray(value))) {
      throw new Error(
        `renderServerExport: the params of "${page}" need ${catchAll ? 'a list or a string' : 'a string'} for "${name}".`,
      )
    }
    return Array.isArray(value) ? value : [value]
  })
}

/** `index` is the page of its folder: `/blog/index` is requested at `/blog`. */
function targetOf(page: string, segments: string[], notFound = false): Target {
  const folder = segments.at(-1) === 'index' ? segments.slice(0, -1) : segments
  return {
    page,
    route: `/${folder.map(encodeURIComponent).join('/')}`,
    file: `${segments.join('/')}.html`,
    notFound,
  }
}

function targetsOf(
  manifest: RoutesManifest,
  params: Record<string, RouteParams[]>,
): { targets: Target[]; skipped: RenderSkip[] } {
  const targets = new Map<string, Target>()
  const skipped: RenderSkip[] = []
  const add = (target: Target) => {
    if (!targets.has(target.file)) targets.set(target.file, target)
  }
  for (const { page } of manifest.htmlRoutes ?? []) {
    const segments = segmentsOf(page)
    if (!segments.some((segment) => DYNAMIC.test(segment))) {
      add(targetOf(page, segments))
      continue
    }
    const list = params[page] ?? []
    if (list.length === 0) skipped.push({ page, reason: 'no-params' })
    for (const values of list) {
      add(targetOf(page, fill(page, segments, values)))
    }
  }
  for (const { page } of manifest.notFoundRoutes ?? []) {
    const segments = segmentsOf(page)
    const folder = segments.slice(0, -1)
    if (folder.some((segment) => DYNAMIC.test(segment))) {
      skipped.push({ page, reason: 'no-params' })
      continue
    }
    add({
      ...targetOf(page, [...folder, NOT_FOUND_PROBE], true),
      file: `${segments.join('/')}.html`,
    })
  }
  return { targets: [...targets.values()], skipped }
}

function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const probe = createServer()
    probe.once('error', fail)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      const port = typeof address === 'object' && address ? address.port : 0
      probe.close(() => done(port))
    })
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve()
  }
  return new Promise((done) => {
    child.once('exit', () => done())
    child.kill()
  })
}

/** Starts `expo serve` on `outDir` and resolves when it answers. */
async function startExpoServe(
  outDir: string,
  projectRoot: string,
  timeoutMs: number,
): Promise<{ origin: string; child: ChildProcess }> {
  let cli: string
  try {
    cli = createRequire(join(projectRoot, 'package.json')).resolve(
      'expo/bin/cli',
    )
  } catch {
    throw new Error(
      `renderServerExport: no \`expo\` package in "${projectRoot}". Pass \`projectRoot\`, or \`origin\` for a server that runs already.`,
    )
  }
  const port = await freePort()
  // The CLI entry with this Node, not `npx`: the kill must reach the server.
  const child = spawn(
    process.execPath,
    [cli, 'serve', resolve(outDir), '--port', String(port)],
    { cwd: projectRoot, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk)
  })
  child.on('error', (error) => {
    stderr += error.message
  })
  const origin = `http://127.0.0.1:${port}`
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      await fetch(origin)
      return { origin, child }
    } catch {
      await sleep(250)
    }
  }
  await stop(child)
  throw new Error(
    `renderServerExport: \`expo serve\` did not answer on ${origin}. ${stderr.trim()}`.trim(),
  )
}

/**
 * Renders the pages of a server export to `<outDir>/rendered`. From Expo SDK
 * 58 `web.output: 'server'` writes no page file: the server renders each
 * page at request time. This requests each route of `routes.json` from
 * `expo serve`, or from `origin`, and writes the HTML it answers. Then
 * `writeSeoFiles`, `auditExport`, `browseExport`, `readExport` and
 * `serveExport` read the pages from there.
 *
 * A dynamic route gets one page for each entry of `params`. A not-found
 * route gets the page that a path with no match answers, as
 * `+not-found.html`. Throws when the export has no `routes.json`, when
 * `expo serve` does not start, or when a request fails or answers 500 or
 * more. The pages of an earlier run are removed first, so after an error
 * the folder holds no page.
 */
export async function renderServerExport(
  options: RenderServerExportOptions,
): Promise<RenderServerResult> {
  const { outDir } = options
  const manifestFile = join(outDir, 'server', '_expo', 'routes.json')
  const source = await readFile(manifestFile, 'utf8').catch(() => undefined)
  if (source === undefined) {
    throw new Error(
      `renderServerExport: no "${manifestFile}". Export with \`web.output: 'server'\` first.`,
    )
  }
  const { targets, skipped } = targetsOf(
    JSON.parse(source) as RoutesManifest,
    options.params ?? {},
  )
  const pagesDir = join(outDir, RENDERED_DIR)
  await rm(pagesDir, { recursive: true, force: true })

  const server = options.origin
    ? undefined
    : await startExpoServe(
        outDir,
        options.projectRoot ?? process.cwd(),
        options.timeoutMs ?? 60_000,
      )
  const origin = (options.origin ?? server?.origin ?? '').replace(/\/+$/, '')
  const rendered: { page: RenderedPage; html: string }[] = []
  try {
    for (const target of targets) {
      let response: Response
      try {
        response = await fetch(`${origin}${target.route}`)
      } catch (error) {
        throw new Error(
          `renderServerExport: GET ${target.route} failed: ${(error as Error).message}`,
        )
      }
      const html = await response.text()
      if (response.status >= 500) {
        throw new Error(
          `renderServerExport: GET ${target.route} answered ${response.status}.`,
        )
      }
      if (target.notFound && response.status !== 404) {
        skipped.push({ page: target.page, reason: 'not-404' })
        continue
      }
      rendered.push({
        page: {
          file: target.file,
          route: target.route,
          status: response.status,
        },
        html,
      })
    }
  } finally {
    if (server) await stop(server.child)
  }

  for (const { page, html } of rendered) {
    const path = join(pagesDir, page.file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, html, 'utf8')
  }
  return { pagesDir, pages: rendered.map(({ page }) => page), skipped }
}

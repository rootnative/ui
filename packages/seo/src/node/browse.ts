import { spawn, type ChildProcess } from 'node:child_process'
import { accessSync, constants } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { exportLayout, listHtmlFiles, routeOf } from './export'
import { servedBasePath, serveExport } from './serve'

export type BrowseProblem = {
  /** The path of the file under `outDir`. */
  file: string
  route: string
  /** An uncaught exception, a `console.error`, or a browser log entry such as a failed request. */
  kind: 'exception' | 'console' | 'log'
  message: string
}

export type BrowseExportOptions = {
  /** The export folder, for example `dist`. */
  outDir: string
  /** The path the site lives under. The default is the canonical link of `index.html`. */
  basePath?: string
  /**
   * The Chrome or Chromium binary. The default is `CHROME_PATH`, then the
   * usual names on `PATH`, then the usual install paths.
   */
  chrome?: string
  /** How long to keep listening after the load event, so hydration runs. The default is 750. */
  settleMs?: number
  /** The time one page gets to fire its load event. The default is 30000. */
  timeoutMs?: number
}

export type BrowseResult = {
  /** The number of pages loaded. */
  pages: number
  /** Every error the browser reported, sorted by file. Empty when the export loads clean. */
  problems: BrowseProblem[]
  /** The Chrome binary used. */
  chrome: string
}

const NAMES = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
  'chrome',
  'chrome-headless-shell',
]

const PATHS: Record<string, string[]> = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
}

function runnable(path: string): boolean {
  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

/**
 * The Chrome or Chromium binary to use: `explicit`, then `CHROME_PATH`, then
 * the usual names on `PATH`, then the usual install paths. `undefined` when
 * none is found.
 */
export function findChrome(explicit?: string): string | undefined {
  const named = explicit ?? process.env.CHROME_PATH
  if (named) return runnable(named) ? named : undefined
  const suffixes = process.platform === 'win32' ? ['.exe', ''] : ['']
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) continue
    for (const name of NAMES) {
      for (const suffix of suffixes) {
        const path = join(dir, name + suffix)
        if (runnable(path)) return path
      }
    }
  }
  return (PATHS[process.platform] ?? []).find(runnable)
}

type Message = {
  id?: number
  method?: string
  params?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: { message: string }
  sessionId?: string
}

/** One Chrome, driven over its debugging pipe. No package, no port. */
class Chrome {
  private process: ChildProcess
  private nextId = 1
  private pending = new Map<
    number,
    {
      resolve: (result: Record<string, unknown>) => void
      reject: (error: Error) => void
    }
  >()
  private listeners = new Set<(message: Message) => void>()
  private buffer = ''
  private exited: Promise<void>

  constructor(
    binary: string,
    private userDataDir: string,
  ) {
    this.process = spawn(
      binary,
      [
        '--headless',
        '--remote-debugging-pipe',
        `--user-data-dir=${userDataDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--hide-scrollbars',
        '--mute-audio',
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
    )
    const output = this.process.stdio[4]
    if (!output) throw new Error('browseExport: no debugging pipe from Chrome.')
    output.on('data', (chunk: Buffer) => this.read(chunk.toString('utf8')))
    this.exited = new Promise((done) => {
      this.process.once('exit', () => {
        for (const { reject } of this.pending.values()) {
          reject(new Error('browseExport: Chrome exited.'))
        }
        this.pending.clear()
        done()
      })
    })
  }

  private read(text: string): void {
    this.buffer += text
    let end = this.buffer.indexOf('\0')
    while (end !== -1) {
      const raw = this.buffer.slice(0, end)
      this.buffer = this.buffer.slice(end + 1)
      let message: Message
      try {
        message = JSON.parse(raw) as Message
      } catch {
        message = {}
      }
      if (message.id !== undefined) {
        const waiter = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) waiter?.reject(new Error(message.error.message))
        else waiter?.resolve(message.result ?? {})
      } else if (message.method) {
        for (const listener of this.listeners) listener(message)
      }
      end = this.buffer.indexOf('\0')
    }
  }

  send(
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
  ): Promise<Record<string, unknown>> {
    const id = this.nextId++
    const input = this.process.stdio[3]
    if (!input || !('write' in input)) {
      return Promise.reject(new Error('browseExport: Chrome is not running.'))
    }
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      ;(input as NodeJS.WritableStream).write(
        `${JSON.stringify({ id, method, params, sessionId })}\0`,
      )
    })
  }

  on(listener: (message: Message) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async close(): Promise<void> {
    await this.send('Browser.close').catch(() => undefined)
    const killed = new Promise<void>((done) => {
      setTimeout(() => {
        this.process.kill('SIGKILL')
        done()
      }, 2000).unref()
    })
    await Promise.race([this.exited, killed])
    await rm(this.userDataDir, { recursive: true, force: true }).catch(
      () => undefined,
    )
  }
}

/**
 * The text of a remote object. An error's description carries its stack,
 * which points into the minified bundle, so only the first line is kept.
 */
function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const remote = value as { description?: string; value?: unknown }
    if (remote.description) return remote.description.split('\n')[0] ?? ''
    if (remote.value !== undefined) return String(remote.value)
  }
  return String(value)
}

function oneLine(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

/**
 * The path that the scripts of an Expo export load from: the part of a
 * script URL before `/_expo/`. `undefined` when no script URL on the host
 * holds `/_expo/`.
 */
function scriptBaseOf(html: string): string | undefined {
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const src = match[1] ?? ''
    if (!src.startsWith('/') || src.startsWith('//')) continue
    const at = src.indexOf('/_expo/')
    if (at !== -1) return src.slice(0, at)
  }
  return undefined
}

/**
 * Stops before the first page loads when the scripts of `index.html` are not
 * under the base path. Each script request would fail, and the browser pass
 * would report one problem for each file on each page, and not the cause.
 */
async function checkScriptBase(
  pagesDir: string,
  basePath: string,
  fromOption: boolean,
): Promise<void> {
  const html = await readFile(join(pagesDir, 'index.html'), 'utf8').catch(
    () => undefined,
  )
  const scriptBase = html === undefined ? undefined : scriptBaseOf(html)
  if (scriptBase === undefined || scriptBase === basePath) return
  const source = fromOption ? '`basePath`' : 'the canonical link of index.html'
  const fix = basePath
    ? `Export with \`experiments.baseUrl\` set to "${basePath}"`
    : 'Export with no `experiments.baseUrl`'
  throw new Error(
    `browseExport: the scripts of index.html load from "${scriptBase || '/'}", and the pages are served under "${basePath || '/'}", from ${source}. Each script request would fail. ${fix}, or pass \`basePath\` "${scriptBase || '/'}".`,
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

/**
 * Loads every exported page in headless Chrome and returns each error the
 * browser reports: an uncaught exception, a `console.error`, or a log entry
 * such as a request that failed. A hydration mismatch is a `console.error`
 * in development and a reported error in production, so both reach the
 * list. The HTML gate cannot see any of them: it reads the file, and these
 * happen when the script runs.
 *
 * Throws when no Chrome is found, the folder is missing, it holds no HTML
 * file, or the scripts of `index.html` are not under the base path.
 */
export async function browseExport(
  options: BrowseExportOptions,
): Promise<BrowseResult> {
  const { outDir } = options
  const { pagesDir } = await exportLayout(outDir)
  const files = await listHtmlFiles(pagesDir, 'browseExport')
  if (files.length === 0) {
    throw new Error(
      `browseExport: no .html file in "${outDir}". Set \`web.output\` to \`static\` or \`server\` in app.json.`,
    )
  }
  await checkScriptBase(
    pagesDir,
    await servedBasePath(pagesDir, options.basePath),
    Boolean(options.basePath),
  )
  const chrome = findChrome(options.chrome)
  if (!chrome) {
    throw new Error(
      'browseExport: no Chrome found. Install Google Chrome or Chromium, or set CHROME_PATH to the binary.',
    )
  }
  const settleMs = options.settleMs ?? 750
  const timeoutMs = options.timeoutMs ?? 30_000

  const server = await serveExport({ outDir, basePath: options.basePath })
  // Full Chrome requests /favicon.ico by itself when a page declares no icon,
  // and the headless shell never does. The page did not ask for it, so its 404
  // is not a page error, and the result must not change with the Chrome build.
  const implicitFavicon = `${server.origin}/favicon.ico`
  const userDataDir = await mkdtemp(join(tmpdir(), 'rootnative-seo-chrome-'))
  const browser = new Chrome(chrome, userDataDir)
  const problems: BrowseProblem[] = []
  try {
    const { targetId } = (await browser.send('Target.createTarget', {
      url: 'about:blank',
    })) as { targetId: string }
    const { sessionId } = (await browser.send('Target.attachToTarget', {
      targetId,
      flatten: true,
    })) as { sessionId: string }
    await browser.send('Page.enable', {}, sessionId)
    await browser.send('Runtime.enable', {}, sessionId)
    await browser.send('Log.enable', {}, sessionId)

    for (const file of files) {
      const route = routeOf(file)
      const url = server.urlOf(
        route.split('/').map(encodeURIComponent).join('/'),
      )
      const report = (kind: BrowseProblem['kind'], message: string) =>
        problems.push({ file, route, kind, message: oneLine(message) })

      let loaded!: () => void
      const load = new Promise<void>((done) => {
        loaded = done
      })
      const stop = browser.on((message) => {
        if (message.sessionId !== sessionId) return
        const params = message.params ?? {}
        switch (message.method) {
          case 'Page.loadEventFired':
            loaded()
            break
          case 'Runtime.exceptionThrown': {
            const details = params.exceptionDetails as
              | { text?: string; exception?: unknown }
              | undefined
            report(
              'exception',
              details?.exception
                ? text(details.exception)
                : (details?.text ?? ''),
            )
            break
          }
          case 'Runtime.consoleAPICalled': {
            if (params.type !== 'error' && params.type !== 'assert') break
            const args = (params.args as unknown[] | undefined) ?? []
            report('console', args.map(text).join(' '))
            break
          }
          case 'Log.entryAdded': {
            const entry = params.entry as
              | { level?: string; source?: string; text?: string; url?: string }
              | undefined
            if (entry?.level !== 'error') break
            if (entry.url === implicitFavicon) break
            report(
              'log',
              `${entry.source ?? 'log'}: ${entry.text ?? ''}${entry.url ? ` (${entry.url})` : ''}`,
            )
            break
          }
        }
      })
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        await browser.send('Page.navigate', { url }, sessionId)
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  `browseExport: ${file} fired no load event in ${timeoutMs} ms.`,
                ),
              ),
            timeoutMs,
          )
        })
        await Promise.race([load, timeout])
        await sleep(settleMs)
      } finally {
        clearTimeout(timer)
        stop()
      }
    }
    await browser
      .send('Target.closeTarget', { targetId })
      .catch(() => undefined)
  } finally {
    await browser.close()
    await server.close()
  }

  problems.sort((a, b) => a.file.localeCompare(b.file))
  return { pages: files.length, problems, chrome }
}

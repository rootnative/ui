import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { browseExport, findChrome } from '../node'
import { main } from '../node/cli'

const chrome = findChrome()
// CI has Chrome. A machine without one skips the browser pass, and says so.
// The pages declare no icon, so full Chrome requests /favicon.ico by itself.
// The headless shell does not, so only full Chrome proves the audit ignores it.
const describeWithChrome = chrome ? describe : describe.skip
if (!chrome) {
  console.warn('browse.test: no Chrome found, the browser pass is skipped.')
}

let outDir: string

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'seo-browse-'))
})

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true })
})

async function writeFiles(files: Record<string, string>): Promise<void> {
  for (const [file, content] of Object.entries(files)) {
    const path = join(outDir, file)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content, 'utf8')
  }
}

const page = (body: string) =>
  `<!DOCTYPE html><html><head><title>t</title></head><body><div id="root">x</div>${body}</body></html>`

describe('findChrome', () => {
  it('takes an explicit binary only when it runs', () => {
    expect(findChrome(join(outDir, 'missing'))).toBeUndefined()
    expect(findChrome(process.execPath)).toBe(process.execPath)
  })
})

describeWithChrome('browseExport', () => {
  jest.setTimeout(60_000)

  it('reports an exception, a console.error, and a failed request, by page', async () => {
    await writeFiles({
      'index.html': page('<script>console.log("fine")</script>'),
      'throws.html': page('<script>throw new Error("kaboom")</script>'),
      'logs.html': page('<script>console.error("boom", { a: 1 })</script>'),
      'late.html': page(
        '<script>setTimeout(() => console.error("after load"), 100)</script>',
      ),
      'asset.html': page('<script src="/missing.js"></script>'),
      'nested/index.html': page(''),
    })
    const result = await browseExport({ outDir, settleMs: 400 })
    expect(result.pages).toBe(6)
    expect(result.chrome).toBe(chrome)
    expect(result.problems.map((p) => [p.file, p.kind])).toEqual([
      ['asset.html', 'log'],
      ['late.html', 'console'],
      ['logs.html', 'console'],
      ['throws.html', 'exception'],
    ])
    const by = Object.fromEntries(result.problems.map((p) => [p.file, p]))
    expect(by['throws.html']?.message).toContain('kaboom')
    expect(by['throws.html']?.route).toBe('/throws')
    expect(by['logs.html']?.message).toContain('boom')
    expect(by['late.html']?.message).toContain('after load')
    expect(by['asset.html']?.message).toContain('missing.js')
  })

  it('runs from the command and fails on a problem', async () => {
    await writeFiles({
      'index.html': page(''),
      'bad.html': page('<script>throw new Error("kaboom")</script>'),
    })
    const errors: string[] = []
    const lines: string[] = []
    const output = {
      log: (line: string) => lines.push(line),
      error: (line: string) => errors.push(line),
    }
    expect(await main(['browse', outDir, '--settle', '300'], output)).toBe(1)
    expect(errors.join('\n')).toContain('bad.html (exception)')
    expect(errors.join('\n')).toContain('1 problem in 2 pages')

    await rm(join(outDir, 'bad.html'))
    expect(await main(['browse', outDir, '--settle', '300'], output)).toBe(0)
    expect(lines.join('\n')).toContain('1 page load clean')
  })

  it('leaves no timer that keeps the process alive', async () => {
    await writeFiles({ 'index.html': page('') })
    const pending = new Set<NodeJS.Timeout>()
    const { setTimeout: realSet, clearTimeout: realClear } = globalThis
    jest.spyOn(globalThis, 'setTimeout').mockImplementation(((
      callback: () => void,
      ms?: number,
    ) => {
      const timer = realSet(() => {
        pending.delete(timer)
        callback()
      }, ms)
      pending.add(timer)
      return timer
    }) as typeof setTimeout)
    jest.spyOn(globalThis, 'clearTimeout').mockImplementation((timer) => {
      pending.delete(timer as NodeJS.Timeout)
      realClear(timer)
    })
    try {
      await browseExport({ outDir, settleMs: 0 })
    } finally {
      jest.restoreAllMocks()
    }
    expect([...pending].filter((timer) => timer.hasRef())).toEqual([])
  })
})

describe('browseExport without Chrome', () => {
  it('throws with a clear message when the binary is missing', async () => {
    await writeFiles({ 'index.html': page('') })
    await expect(
      browseExport({ outDir, chrome: join(outDir, 'nope') }),
    ).rejects.toThrow(/no Chrome found/)
  })

  it('rejects a bad --settle', async () => {
    const errors: string[] = []
    const output = { log: () => {}, error: (line: string) => errors.push(line) }
    expect(await main(['browse', outDir, '--settle', 'soon'], output)).toBe(1)
    expect(errors.join('\n')).toContain('--settle')
  })
})

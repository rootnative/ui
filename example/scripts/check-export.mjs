/**
 * Reads the web export and asserts what a crawler reads.
 *
 * `auditExport` checks every page: the title, the canonical link or
 * `noindex`, one `<h1>`, the hreflang links, and the sitemap. The pages
 * below are checked for their content too, because this is the test that catches a head
 * renderer change in Expo Router. The unit tests in `packages/seo` mock
 * `expo-router/head`, so only a real export can show that the head reaches
 * the HTML file.
 *
 * `browseExport` then loads every page in headless Chrome and fails on an
 * uncaught exception, a `console.error`, or a failed request. That is where
 * a hydration mismatch (React error #418) shows, and the HTML cannot show
 * it. Chrome comes from `CHROME_PATH` or the usual install paths; pass
 * `--no-browser` on a machine without one, and CI runs the whole gate.
 *
 * A server export (`web.output: 'server'`) keeps its files in `client/`. From
 * Expo SDK 58 it has no page file: `write-seo.mjs` renders the pages to
 * `rendered/`, and the same checks read both folders. The script
 * then starts `expo serve` on it and asserts the status code of each route
 * in `serverRoutes`. The pages are the same HTML as the static export, so
 * the server check skips the browser pass.
 *
 * Usage, from `example/`:
 *   pnpm run check:export        # exports, then checks
 *   pnpm run check:export:server # the same with web.output: 'server'
 *   node scripts/check-export.mjs   # checks an existing dist/
 *   node scripts/check-export.mjs --no-browser
 *   node scripts/check-export.mjs --dist dist-server --no-browser
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { auditExport, browseExport } from '@rootnative/seo/node'

const here = dirname(fileURLToPath(import.meta.url))
const distFlag = process.argv.indexOf('--dist')
const dist = resolve(
  here,
  '..',
  distFlag === -1 ? 'dist' : (process.argv[distFlag + 1] ?? 'dist'),
)
// The rule `expo serve` uses: a server export has a route manifest.
const isServer = existsSync(resolve(dist, 'server', '_expo', 'routes.json'))
const pagesDir = isServer ? resolve(dist, 'rendered') : dist
const filesDir = isServer ? resolve(dist, 'client') : dist

const SITE_URL = 'https://rootnative.github.io/ui/demo'

// The AppBar title is the `<h1>` of every page: `titleLevel` defaults to 1.
// The screen intro and the home hero pass `level={2}` to `Typography`, so
// they sit under it as `<h2>`. The home page renders its own `PageHead`; the
// button page has none, so its head comes from `RouteHead` and the catalog.
const pages = [
  {
    file: 'index.html',
    title: 'RootNative UI',
    canonical: `${SITE_URL}/`,
    h1: 'Home',
    h2: 'RootNative UI',
    jsonLdType: 'WebSite',
  },
  {
    file: 'button.html',
    title: 'Button | RootNative UI',
    canonical: `${SITE_URL}/button`,
    h1: 'Button',
    h2: 'Button',
    jsonLdType: null,
  },
  // The dynamic route: one file per seeded entry, through
  // `generateStaticParams`. The bar names the parent segment.
  {
    file: 'showcase/settings-screen.html',
    title: 'Settings screen | RootNative UI',
    canonical: `${SITE_URL}/showcase/settings-screen`,
    h1: 'Showcase',
    h2: 'Settings screen',
    jsonLdType: 'BreadcrumbList',
  },
  // The German version of the i18n page. The bar title is the catalog
  // label, the same in both languages.
  {
    file: 'de/i18n.html',
    title: 'Eine Seite in zwei Sprachen | RootNative UI',
    canonical: `${SITE_URL}/de/i18n`,
    h1: 'i18n',
    h2: 'Eine Seite in zwei Sprachen',
    jsonLdType: null,
  },
]

/**
 * The hreflang links of each version of the i18n page, by value. The audit
 * passes a page with no hreflang link at all, so only this check sees a head
 * renderer that drops the attribute.
 */
const i18nAlternates = [
  `en ${SITE_URL}/i18n`,
  `de ${SITE_URL}/de/i18n`,
  `x-default ${SITE_URL}/i18n`,
]

/**
 * The status code `expo serve` sends for each route of the server export.
 * The Expo server matches a route from the origin root and ignores
 * `experiments.baseUrl`, so these paths have no `/ui/demo` prefix. A dynamic
 * route answers every slug with its template and 200, so the template must
 * be `noindex`: the static host sends 404 there, and this server cannot.
 */
const serverRoutes = [
  { path: '/', status: 200 },
  { path: '/de/i18n', status: 200 },
  { path: '/sitemap.xml', status: 200 },
  { path: '/manifest.webmanifest', status: 200 },
  { path: '/no-such-page', status: 404, noindex: true },
  { path: '/showcase/no-such-entry', status: 200, noindex: true },
]

/** Routes that must not reach the export. */
const absent = ['_sitemap.html']

/** Files `write-seo.mjs` adds after the export. */
const generated = ['sitemap.xml', 'manifest.webmanifest']

const problems = []

function count(html, pattern) {
  return (html.match(pattern) ?? []).length
}

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
}

if (!existsSync(dist)) {
  console.error(
    `[check-export] example/${basename(dist)} not found. Is \`web.output\` set to \`static\` in app.json? Run \`expo export --platform web\` first.`,
  )
  process.exit(1)
}

const audit = await auditExport({ outDir: dist })
for (const { file, rule, message } of audit.problems) {
  problems.push(`${file} (${rule}): ${message}`)
}

const browser = process.argv.includes('--no-browser')
  ? undefined
  : await browseExport({ outDir: dist })
for (const { file, kind, message } of browser?.problems ?? []) {
  problems.push(`${file} (${kind}): ${message}`)
}
if (!browser) {
  console.warn('[check-export] --no-browser: the browser pass is skipped.')
}

// The host serves the not-found page at every unknown path, so its head has
// `noindex` and no canonical link. On Expo SDK 58 that head comes from
// `NOT_FOUND_META` in `app/+not-found.tsx` on a server export, and from its
// copy in `write-seo.mjs` on a static export.
const notFound = resolve(pagesDir, '+not-found.html')
if (existsSync(notFound)) {
  const html = readFileSync(notFound, 'utf8')
  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? '')
  if (title !== 'Page not found | RootNative UI') {
    problems.push(`+not-found.html: title is "${title}"`)
  }
  if (count(html, /<meta[^>]*name="robots"[^>]*content="noindex"/g) !== 1) {
    problems.push('+not-found.html: expected one noindex rule')
  }
  if (count(html, /<link[^>]*rel="canonical"/g) !== 0) {
    problems.push(
      '+not-found.html: has a canonical link. Its meta must have no `url`: check NOT_FOUND_META in app/+not-found.tsx and its copy in scripts/write-seo.mjs.',
    )
  }
} else {
  problems.push('+not-found.html: missing')
}

// Expo writes the route template too, rendered with no matching entry. The
// screen answers with `noindex` and no `url`, so the file is not a page a
// crawler indexes. The audit alone cannot tell this file from a real page.
const template = resolve(pagesDir, 'showcase', '[slug].html')
if (existsSync(template)) {
  const html = readFileSync(template, 'utf8')
  if (count(html, /<meta[^>]*name="robots"[^>]*content="noindex"/g) !== 1) {
    problems.push('showcase/[slug].html: the route template must be noindex')
  }
  if (count(html, /<link[^>]*rel="canonical"/g) !== 0) {
    problems.push(
      'showcase/[slug].html: the route template has a canonical link',
    )
  }
}

// `Picture` writes a plain `<img>` on the export, with the text and the size
// a crawler reads, and the export copies `public/` to the root.
const showcasePage = resolve(pagesDir, 'showcase', 'settings-screen.html')
if (existsSync(showcasePage)) {
  const html = readFileSync(showcasePage, 'utf8')
  const img = html.match(/<img\b[^>]*>/)?.[0] ?? ''
  if (!img.includes('src="/ui/demo/showcase/settings-screen.svg"')) {
    problems.push('showcase/settings-screen.html: no <img> for the wireframe')
  }
  if (!img.includes('alt="Settings screen wireframe"')) {
    problems.push('showcase/settings-screen.html: the <img> has no alt text')
  }
  if (!img.includes('width="600"') || !img.includes('height="360"')) {
    problems.push('showcase/settings-screen.html: the <img> has no size')
  }
  if (!existsSync(resolve(filesDir, 'showcase', 'settings-screen.svg'))) {
    problems.push('showcase/settings-screen.svg: missing. Is public/ copied?')
  }
  if (count(html, /<meta[^>]*property="og:image"/g) !== 1) {
    problems.push('showcase/settings-screen.html: expected one og:image')
  }
}

for (const file of ['i18n.html', 'de/i18n.html']) {
  const path = resolve(pagesDir, file)
  if (!existsSync(path)) {
    problems.push(`${file}: missing`)
    continue
  }
  const html = readFileSync(path, 'utf8')
  const found = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => [
      tag.match(/hreflang="([^"]*)"/i)?.[1],
      decode(tag.match(/href="([^"]*)"/)?.[1] ?? ''),
    ])
    .filter(([lang]) => lang !== undefined)
    .map(([lang, href]) => `${lang} ${href}`)
  if (found.join('\n') !== i18nAlternates.join('\n')) {
    problems.push(
      `${file}: hreflang links are [${found.join(', ')}], expected [${i18nAlternates.join(', ')}]`,
    )
  }
}
const sitemapFile = resolve(filesDir, 'sitemap.xml')
if (existsSync(sitemapFile)) {
  const xml = readFileSync(sitemapFile, 'utf8')
  for (const loc of [`${SITE_URL}/i18n`, `${SITE_URL}/de/i18n`]) {
    const start = xml.indexOf(`<loc>${loc}</loc>`)
    const entry =
      start === -1 ? '' : xml.slice(start, xml.indexOf('</url>', start))
    if ((entry.match(/<xhtml:link /g) ?? []).length !== 3) {
      problems.push(`sitemap.xml: ${loc} has no 3 xhtml:link entries`)
    }
  }
}

for (const page of pages) {
  const file = resolve(pagesDir, page.file)
  if (!existsSync(file)) {
    problems.push(`${page.file}: missing`)
    continue
  }
  const html = readFileSync(file, 'utf8')
  const where = page.file

  const title = decode(html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? '')
  if (title !== page.title) {
    problems.push(`${where}: title is "${title}", expected "${page.title}"`)
  }

  const canonical = decode(
    html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1] ?? '',
  )
  if (canonical !== page.canonical) {
    problems.push(
      `${where}: canonical is "${canonical}", expected "${page.canonical}"`,
    )
  }

  // `ScrollViewStyleReset` gives `#root` its height. Without it the Stack
  // screen, which fills its parent, has no parent to fill, and the page shows
  // the AppBar over an empty area while the DOM holds every node.
  if (!html.includes('<style id="expo-reset">')) {
    problems.push(
      `${where}: missing the expo-reset style. Render <ScrollViewStyleReset /> in app/+html.tsx.`,
    )
  }
  if (count(html, /<meta[^>]*name="description"/g) !== 1) {
    problems.push(`${where}: expected one meta description`)
  }
  if (count(html, /<meta[^>]*property="og:title"/g) !== 1) {
    problems.push(`${where}: expected one og:title`)
  }
  if (
    !html.includes(
      '<link rel="manifest" href="/ui/demo/manifest.webmanifest"/>',
    )
  ) {
    problems.push(`${where}: expected the manifest link under the base path`)
  }

  for (const level of [1, 2]) {
    const expected = level === 1 ? page.h1 : page.h2
    const pattern = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g')
    const found = [...html.matchAll(pattern)].map((m) =>
      decode(m[1].replace(/<[^>]+>/g, '')).trim(),
    )
    if (found.length !== 1) {
      problems.push(
        `${where}: expected one <h${level}>, found ${found.length}` +
          (found.length ? ` (${found.join(', ')})` : ''),
      )
    } else if (found[0] !== expected) {
      problems.push(
        `${where}: <h${level}> is "${found[0]}", expected "${expected}"`,
      )
    }
  }

  const scripts = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => m[1])
  if (page.jsonLdType === null) {
    if (scripts.length !== 0) {
      problems.push(`${where}: expected no JSON-LD, found ${scripts.length}`)
    }
  } else if (scripts.length !== 1) {
    problems.push(
      `${where}: expected one JSON-LD script, found ${scripts.length}`,
    )
  } else {
    try {
      const data = JSON.parse(scripts[0])
      if (data['@type'] !== page.jsonLdType) {
        problems.push(
          `${where}: JSON-LD @type is "${data['@type']}", expected "${page.jsonLdType}"`,
        )
      }
    } catch (error) {
      problems.push(`${where}: JSON-LD is not valid JSON (${error.message})`)
    }
  }
}

for (const file of generated) {
  if (!existsSync(resolve(filesDir, file))) {
    problems.push(
      `${file}: missing. Run \`node scripts/write-seo.mjs\` after the export.`,
    )
  }
}

for (const file of absent) {
  if (existsSync(resolve(pagesDir, file))) {
    problems.push(
      `${file}: must not be exported. Set extra.router.sitemap to false.`,
    )
  }
}

/** A port no other process listens on now. */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer()
    probe.once('error', fail)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => done(port))
    })
  })
}

async function waitForServer(origin, child) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      await fetch(origin)
      return true
    } catch {
      await new Promise((done) => setTimeout(done, 250))
    }
  }
  return false
}

/** Starts `expo serve` on the export and checks each of `serverRoutes`. */
async function serverProblems() {
  const found = []
  const port = await freePort()
  // The CLI entry, not `npx`: a kill must reach the server process itself.
  const cli = createRequire(import.meta.url).resolve('expo/bin/cli')
  const child = spawn(
    process.execPath,
    [cli, 'serve', dist, '--port', String(port)],
    { cwd: resolve(here, '..'), stdio: ['ignore', 'ignore', 'pipe'] },
  )
  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk
  })
  try {
    const origin = `http://127.0.0.1:${port}`
    if (!(await waitForServer(origin, child))) {
      return [`expo serve did not start. ${stderr.trim()}`]
    }
    for (const route of serverRoutes) {
      const response = await fetch(`${origin}${route.path}`)
      const body = await response.text()
      if (response.status !== route.status) {
        found.push(
          `expo serve ${route.path}: status ${response.status}, expected ${route.status}`,
        )
      }
      if (
        route.noindex &&
        count(body, /<meta[^>]*name="robots"[^>]*content="noindex"/g) !== 1
      ) {
        found.push(`expo serve ${route.path}: expected one noindex rule`)
      }
    }
  } finally {
    child.kill()
  }
  return found
}

if (isServer) problems.push(...(await serverProblems()))

if (problems.length === 0) {
  console.log(
    `[check-export] ${audit.pages} pages pass the audit${browser ? ` and load clean in Chrome` : ''}; ${pages.length} pages carry the expected title, canonical link, <h1>, <h2>, manifest link, and JSON-LD; both i18n versions and their sitemap entries carry the hreflang set; +not-found and the route template have noindex and no canonical link; the showcase <img> has alt and size${isServer ? `; expo serve sends the expected status for ${serverRoutes.length} routes` : ''}.`,
  )
} else {
  console.error('\n[check-export] The static export is missing head data\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

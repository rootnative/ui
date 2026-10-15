/**
 * Reads the static web export and asserts what a crawler reads.
 *
 * `auditExport` checks every page: the title, the canonical link or
 * `noindex`, one `<h1>`, and the sitemap. The two pages below are checked
 * for their content too, because this is the test that catches a head
 * renderer change in Expo Router. The unit tests in `packages/seo` mock
 * `expo-router/head`, so only a real export can show that the head reaches
 * the HTML file.
 *
 * Usage, from `example/`:
 *   pnpm run check:export        # exports, then checks
 *   node scripts/check-export.mjs   # checks an existing dist/
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { auditExport } from '@rootnative/seo/node'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', 'dist')

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
    '[check-export] example/dist not found. Is `web.output` set to `static` in app.json? Run `expo export --platform web` first.',
  )
  process.exit(1)
}

const audit = await auditExport({ outDir: dist })
for (const { file, rule, message } of audit.problems) {
  problems.push(`${file} (${rule}): ${message}`)
}

// The not-found screen renders a `PageHead` with `noindex` and no `url`, and
// the route defaults would give it a canonical link. The `PageHead` must win
// the whole page, so the export holds no canonical link here.
const notFound = resolve(dist, '+not-found.html')
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
      '+not-found.html: has a canonical link. The PageHead must win over the route defaults; is <RouteHead /> after the navigator?',
    )
  }
} else {
  problems.push('+not-found.html: missing')
}

for (const page of pages) {
  const file = resolve(dist, page.file)
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
  if (!existsSync(resolve(dist, file))) {
    problems.push(
      `${file}: missing. Run \`node scripts/write-seo.mjs\` after the export.`,
    )
  }
}

for (const file of absent) {
  if (existsSync(resolve(dist, file))) {
    problems.push(
      `${file}: must not be exported. Set extra.router.sitemap to false.`,
    )
  }
}

if (problems.length === 0) {
  console.log(
    `[check-export] ${audit.pages} pages pass the audit; ${pages.length} pages carry the expected title, canonical link, <h1>, <h2>, manifest link, and JSON-LD; +not-found has noindex and no canonical link.`,
  )
} else {
  console.error('\n[check-export] The static export is missing head data\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

/**
 * Reads the static web export and asserts what a crawler reads on one page.
 *
 * This is the test that catches a head renderer change in Expo Router. The
 * unit tests in `packages/seo` mock `expo-router/head`, so only a real export
 * can show that the head reaches the HTML file.
 *
 * Usage, from `example/`:
 *   pnpm run check:export        # exports, then checks
 *   node scripts/check-export.mjs   # checks an existing dist/
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', 'dist')

const SITE_URL = 'https://rootnative.github.io/ui/demo'

// The AppBar title is the `<h1>` of every page: the library gives it the
// header role and react-native-web writes a level-less header as `<h1>`. The
// screen intro and the home hero sit under it as `<h2>`.
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

for (const page of pages) {
  const file = resolve(dist, page.file)
  if (!existsSync(file)) {
    problems.push(
      `${page.file}: missing. Is \`web.output\` set to \`static\` in app.json?`,
    )
    continue
  }
  const html = readFileSync(file, 'utf8')
  const where = page.file

  const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((m) =>
    decode(m[1]),
  )
  if (titles.length !== 1) {
    problems.push(`${where}: expected one <title>, found ${titles.length}`)
  } else if (titles[0] !== page.title) {
    problems.push(`${where}: title is "${titles[0]}", expected "${page.title}"`)
  }

  const canonicals = [
    ...html.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/g),
  ].map((m) => decode(m[1]))
  if (canonicals.length !== 1) {
    problems.push(
      `${where}: expected one canonical link, found ${canonicals.length}`,
    )
  } else if (canonicals[0] !== page.canonical) {
    problems.push(
      `${where}: canonical is "${canonicals[0]}", expected "${page.canonical}"`,
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

const sitemapFile = resolve(dist, 'sitemap.xml')
if (existsSync(sitemapFile)) {
  const xml = readFileSync(sitemapFile, 'utf8')
  for (const page of pages) {
    if (!xml.includes(`<loc>${page.canonical}</loc>`)) {
      problems.push(`sitemap.xml: missing ${page.canonical}`)
    }
  }
  if (xml.includes('+not-found') || xml.includes('_sitemap')) {
    problems.push('sitemap.xml: lists a route that must stay out')
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
    `[check-export] ${pages.length} pages carry the title, the canonical link, one <h1>, one <h2>, the manifest link, and the JSON-LD; sitemap.xml lists them.`,
  )
} else {
  console.error('\n[check-export] The static export is missing head data\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

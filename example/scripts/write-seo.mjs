/**
 * Writes the files a crawler reads next to the exported pages: `sitemap.xml`
 * and `manifest.webmanifest`. Runs after `expo export --platform web`.
 *
 * `writeSeoFiles` lists every exported page by its canonical link, so the
 * sitemap cannot drift from the app.
 *
 * No `robots.txt`: a crawler reads that file at the origin root only, and the
 * demo lives under `/ui/demo/`. The root deploy owns it.
 *
 * Usage, from `example/`: `node scripts/write-seo.mjs [exportDir]`. The
 * default is `dist`. A server export gets its pages rendered first, and both
 * files go to its `client/` folder, next to the sitemap.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineSite, headTagsHtml, toHeadTags } from '@rootnative/seo'
import {
  renderServerExport,
  writeManifest,
  writeSeoFiles,
} from '@rootnative/seo/node'
import showcaseEntries from '../src/showcase.json' with { type: 'json' }

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', process.argv[2] ?? 'dist')

if (!existsSync(dist)) {
  console.error(
    `[write-seo] example/${basename(dist)} not found — run \`expo export --platform web\` first.`,
  )
  process.exit(1)
}

// The site of `src/site.ts`. This script does not import that file: the
// example package has no `"type": "module"`, so Node warns on the import.
const site = defineSite({
  name: 'RootNative UI',
  url: 'https://rootnative.github.io/ui/demo',
  locale: 'en_US',
})

/**
 * Expo SDK 58 writes each page head of a static export from
 * `generateMetadata`, but the export skips internal routes, so `+not-found`
 * gets no head. This writes the head of its `PageHead`. A page that already
 * has a `<title>` stays as it is. A server renders that head itself.
 */
function writeNotFoundHead() {
  const file = resolve(dist, '+not-found.html')
  if (!existsSync(file)) return
  const html = readFileSync(file, 'utf8')
  if (/<title[\s>]/.test(html)) return
  const tags = headTagsHtml(
    toHeadTags(site, { title: 'Page not found', noindex: true }),
  )
  writeFileSync(file, html.replace('</head>', `${tags}</head>`))
  console.log(`[write-seo] head → ${file}`)
}

/**
 * Expo SDK 58 renders each page of a server export at request time and
 * writes no page file. This renders the pages through `expo serve`, with the
 * entries of the one dynamic route, so `writeSeoFiles` has pages to read.
 */
async function renderPages() {
  const { pages, pagesDir, skipped } = await renderServerExport({
    outDir: dist,
    projectRoot: resolve(here, '..'),
    params: {
      '/showcase/[slug]': showcaseEntries.map(({ slug }) => ({ slug })),
    },
  })
  console.log(`[write-seo] ${pages.length} pages rendered → ${pagesDir}`)
  // A route with no page is a page the sitemap and the checks never see.
  if (skipped.length > 0) {
    for (const { page, reason } of skipped) {
      console.error(`[write-seo] ${page}: no page (${reason})`)
    }
    process.exit(1)
  }
}

if (existsSync(resolve(dist, 'server', '_expo', 'routes.json'))) {
  await renderPages()
} else {
  writeNotFoundHead()
}

const { sitemap, urls } = await writeSeoFiles({ outDir: dist, robots: false })
const manifest = await writeManifest({
  outDir: dirname(sitemap),
  name: 'RootNative UI',
  shortName: 'RootNative',
  description: 'Material Design 3 components for React Native, in the browser.',
  themeColor: '#2563eb',
  backgroundColor: '#ffffff',
  icons: [{ src: './favicon.ico', sizes: '48x48' }],
})

console.log(`[write-seo] ${urls.length} routes → ${sitemap}`)
console.log(`[write-seo] manifest → ${manifest}`)

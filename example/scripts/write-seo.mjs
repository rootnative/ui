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
 * default is `dist`. A server export gets both files in its `client/`
 * folder, next to the sitemap.
 */
import { existsSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeManifest, writeSeoFiles } from '@rootnative/seo/node'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', process.argv[2] ?? 'dist')

if (!existsSync(dist)) {
  console.error(
    `[write-seo] example/${basename(dist)} not found — run \`expo export --platform web\` first.`,
  )
  process.exit(1)
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

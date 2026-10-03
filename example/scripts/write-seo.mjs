/**
 * Writes the files a crawler reads next to the exported pages: `sitemap.xml`
 * and `manifest.webmanifest`. Runs after `expo export --platform web`.
 *
 * The routes come from the exported HTML files, so the sitemap cannot drift
 * from the app. `+not-found` is the 404 page and stays out.
 *
 * No `robots.txt`: a crawler reads that file at the origin root only, and the
 * demo lives under `/ui/demo/`. The root deploy owns it.
 */
import { readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeManifest, writeSitemap } from '@rootnative/seo/node'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '..', 'dist')

const SITE_URL = 'https://rootnative.github.io/ui/demo'
const EXCLUDED = new Set(['+not-found.html', '_sitemap.html'])

if (!existsSync(dist)) {
  console.error(
    '[write-seo] example/dist not found — run `expo export --platform web` first.',
  )
  process.exit(1)
}

const urls = readdirSync(dist)
  .filter((file) => file.endsWith('.html') && !EXCLUDED.has(file))
  .sort()
  .map((file) => {
    const route =
      file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}`
    return {
      loc: route,
      changefreq: 'weekly',
      priority: route === '/' ? 1 : 0.7,
    }
  })

const sitemap = await writeSitemap({ outDir: dist, siteUrl: SITE_URL, urls })
const manifest = await writeManifest({
  outDir: dist,
  name: 'RootNative UI',
  shortName: 'RootNative',
  description: 'Material Design 3 components for React Native, in the browser.',
  themeColor: '#2563eb',
  backgroundColor: '#ffffff',
  icons: [{ src: './favicon.ico', sizes: '48x48' }],
})

console.log(`[write-seo] ${urls.length} routes → ${sitemap}`)
console.log(`[write-seo] manifest → ${manifest}`)

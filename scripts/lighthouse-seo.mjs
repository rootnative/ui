/**
 * Runs the Lighthouse SEO audit on each URL and fails when a page scores
 * below 100. The deploy workflow runs it on the live site after each deploy,
 * because the export checks prove the tags reach the HTML, and only the host
 * proves that a crawler gets them: the status code, `robots.txt`, and the
 * served head.
 *
 * Lighthouse audits the DOM after the page's script ran, not the served
 * HTML. The client-side head rewrites the title and the canonical link, so a
 * defect in the HTML file can score 100 here; `auditExport` reads the file
 * and is the gate for that. This one catches what the host adds or blocks:
 * a `noindex`, a `robots.txt` rule, a wrong status code.
 *
 * `--bust <token>` adds `?gate=<token>` to each URL. GitHub Pages sends
 * `cache-control: max-age=600`, so an edge can serve the previous deploy for
 * ten minutes; a new query string fetches the fresh page. The bundle files
 * carry a hash in their name, so only the HTML needs it.
 *
 * Needs Chrome: the `ubuntu-latest` runner has it, and a machine without one
 * sets `CHROME_PATH`. Lighthouse itself comes from npx at a pinned version.
 *
 * Usage:
 *   node scripts/lighthouse-seo.mjs [--bust <token>] <url>...
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const LIGHTHOUSE = 'lighthouse@13.5.0'

const args = process.argv.slice(2)
const urls = []
let bust
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--bust') {
    bust = args[i + 1]
    i += 1
  } else {
    urls.push(args[i])
  }
}
if (urls.length === 0) {
  console.error(
    'Usage: node scripts/lighthouse-seo.mjs [--bust <token>] <url>...',
  )
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), 'lighthouse-seo-'))
let failed = false

for (const [index, url] of urls.entries()) {
  const target = bust
    ? `${url}${url.includes('?') ? '&' : '?'}gate=${bust}`
    : url
  const report = join(dir, `${index}.json`)
  execFileSync(
    'npx',
    [
      '--yes',
      LIGHTHOUSE,
      target,
      '--only-categories=seo',
      '--quiet',
      '--output=json',
      `--output-path=${report}`,
      '--chrome-flags=--headless --no-sandbox',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] },
  )
  const result = JSON.parse(readFileSync(report, 'utf8'))
  if (result.runtimeError) {
    failed = true
    console.error(
      `✗ ${url}: ${result.runtimeError.code} ${result.runtimeError.message}`,
    )
    continue
  }
  const score = result.categories.seo.score
  const failing = Object.values(result.audits).filter(
    (audit) => audit.score !== null && audit.score < 1,
  )
  if (score === 1 && failing.length === 0) {
    console.log(`✓ ${url}: SEO 100`)
    continue
  }
  failed = true
  console.error(
    `✗ ${url}: SEO ${score === null ? 'n/a' : Math.round(score * 100)}`,
  )
  for (const audit of failing) {
    console.error(`    ${audit.id}: ${audit.title}`)
  }
}

rmSync(dir, { recursive: true, force: true })
process.exit(failed ? 1 : 0)

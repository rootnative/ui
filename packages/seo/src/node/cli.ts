import { parseArgs } from 'node:util'
import {
  writeSeoFiles,
  type SkipReason,
  type WriteSeoFilesOptions,
} from './export'

const USAGE = `Usage: rootnative-seo <outDir> [options]

Writes sitemap.xml and robots.txt into <outDir> from the exported HTML files.
A page goes in the sitemap when it has a canonical link under the site URL and
no noindex.

Options:
  --site-url <url>  The site URL. The default is the canonical link of index.html.
  --sitemap <url>   A sitemap URL for robots.txt. Repeat it to list more.
                    The default is <site-url>/sitemap.xml.
  --no-robots       Do not write robots.txt.
  -h, --help        Show this help.`

const REASONS: Record<SkipReason, string> = {
  'special-route': 'a special route (+, _, or the host 404 page)',
  'route-template': 'a dynamic route template',
  noindex: 'noindex',
  'no-canonical': 'no canonical link',
  'outside-site': 'the canonical link is outside the site',
  duplicate: 'the same canonical link as another page',
}

type Output = { log: (line: string) => void; error: (line: string) => void }

/** Runs the command with `argv` (no `node` and no script path) and returns the exit code. */
export async function main(
  argv: string[],
  output: Output = console,
): Promise<number> {
  let parsed: ReturnType<typeof parse>
  try {
    parsed = parse(argv)
  } catch (error) {
    output.error(`${(error as Error).message}\n\n${USAGE}`)
    return 1
  }
  const { values, positionals } = parsed
  if (values.help) {
    output.log(USAGE)
    return 0
  }
  const outDir = positionals[0]
  if (!outDir || positionals.length > 1) {
    output.error(USAGE)
    return 1
  }

  try {
    let robots: WriteSeoFilesOptions['robots'] = !values['no-robots']
    if (robots && values.sitemap?.length)
      robots = { sitemapUrl: values.sitemap }
    const result = await writeSeoFiles({
      outDir,
      siteUrl: values['site-url'],
      robots,
    })
    output.log(
      `[rootnative-seo] ${result.sitemap}: ${pages(result.urls.length)} under ${result.siteUrl}`,
    )
    if (result.robots) {
      output.log(`[rootnative-seo] ${result.robots}`)
      if (new URL(result.siteUrl).pathname !== '/') {
        output.log(
          '[rootnative-seo] Note: a crawler reads robots.txt at the origin root only, and this site is under a subpath.',
        )
      }
    }
    if (result.skipped.length) {
      output.log(
        `[rootnative-seo] ${pages(result.skipped.length)} ${result.skipped.length === 1 ? 'stays' : 'stay'} out of the sitemap:`,
      )
      for (const { file, reason } of result.skipped) {
        output.log(`  ${file}: ${REASONS[reason]}`)
      }
    }
    return 0
  } catch (error) {
    output.error(`[rootnative-seo] ${(error as Error).message}`)
    return 1
  }
}

function pages(count: number): string {
  return `${count} ${count === 1 ? 'page' : 'pages'}`
}

function parse(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'site-url': { type: 'string' },
      sitemap: { type: 'string', multiple: true },
      'no-robots': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
}

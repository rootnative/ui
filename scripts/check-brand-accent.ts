/**
 * Guards that the docs accent tokens still match the generated logo's tones.
 *
 * Why this exists: `scripts/build-brand.mjs` generates every brand asset,
 * `docs/static/img/logo.svg` included, and its palette comment states the
 * contract — "Keep the top tone in step with `--rn-accent` in
 * docs/src/css/custom.css". Nothing enforced it, and both themes had drifted by
 * one rung of the same blue ramp:
 *
 *   - light `--rn-accent` was `#2563eb` while `LIGHT_FACES.top` was `#60a5fa`
 *   - dark `--rn-accent` was `#60a5fa` while `DARK_FACES.top` was `#bfdbfe`
 *
 * The drift was invisible for two compounding reasons. The token was dead code
 * — defined twice, referenced nowhere — so a wrong value changed no pixels. And
 * each value is a real tone from the mark's own ramp, so neither looked wrong in
 * isolation; the light token held the *dark* theme's tone. This is the same
 * failure mode `check-inertia-pins.ts` documents: a constant duplicated across
 * two files, where a bump gives nobody a reason to open the other one.
 *
 * **The mark is the source of truth**, not the stylesheet. The generator draws
 * the shipped asset, and the comment declares the CSS as the follower.
 *
 * Two tones per theme are checked, because the light top face is only 2.54:1 on
 * white and cannot carry a focus ring on its own:
 *
 *   - `--rn-accent`        <- `faces.top`   (decorative; the lit face)
 *   - `--rn-accent-strong` <- `faces.right` (WCAG 1.4.11 surfaces: 5.17:1 light,
 *                                            7.79:1 dark)
 *
 * Validated by fault injection: reverting either token to its pre-fix value
 * fails with the offending pair named, and restoring it returns a clean run.
 *
 * Usage:
 *   npx tsx scripts/check-brand-accent.ts
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BRAND_SCRIPT = path.join(ROOT, 'scripts', 'build-brand.mjs')
const CSS_FILE = path.join(ROOT, 'docs', 'src', 'css', 'custom.css')

const problems: string[] = []

// --- read the generator's palette -------------------------------------------
// `LIGHT_FACES` / `DARK_FACES` are flat object literals of hex strings, so a
// scoped regex is enough and avoids importing the generator (which writes files
// on import of its main path).
const brandSrc = fs.readFileSync(BRAND_SCRIPT, 'utf8')

function readFaces(name: string): Record<string, string> {
  const block = brandSrc.match(new RegExp(`const ${name} = \\{([^}]*)\\}`))
  if (!block) {
    problems.push(
      `scripts/build-brand.mjs: could not find \`const ${name} = { … }\` — ` +
        'the palette moved or was renamed. Update this script rather than ' +
        'letting the check pass vacuously.',
    )
    return {}
  }
  const faces: Record<string, string> = {}
  for (const m of block[1].matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)) {
    faces[m[1]] = m[2].toLowerCase()
  }
  return faces
}

const lightFaces = readFaces('LIGHT_FACES')
const darkFaces = readFaces('DARK_FACES')

// --- read the stylesheet's tokens -------------------------------------------
// `:root` carries the light theme and `[data-theme='dark']` the dark one. Both
// declare the same token names, so the blocks have to be split before matching
// or the first hit wins for both themes.
const cssSrc = fs.readFileSync(CSS_FILE, 'utf8')
const darkIdx = cssSrc.indexOf("[data-theme='dark']")

if (darkIdx === -1) {
  problems.push(
    "docs/src/css/custom.css: no `[data-theme='dark']` block — the dark " +
      'palette moved. Update this script rather than checking light twice.',
  )
}

const lightCss = darkIdx === -1 ? cssSrc : cssSrc.slice(0, darkIdx)
const darkCss = darkIdx === -1 ? '' : cssSrc.slice(darkIdx)

function readToken(css: string, token: string): string | null {
  const m = css.match(new RegExp(`--${token}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`))
  return m ? m[1].toLowerCase() : null
}

// --- compare ----------------------------------------------------------------
// `face` names the generator key each token follows; see the header for why the
// lit top face cannot also serve the WCAG surfaces.
const PAIRS: Array<{
  theme: string
  css: string
  faces: Record<string, string>
  token: string
  face: string
}> = [
  {
    theme: 'light',
    css: lightCss,
    faces: lightFaces,
    token: 'rn-accent',
    face: 'top',
  },
  {
    theme: 'light',
    css: lightCss,
    faces: lightFaces,
    token: 'rn-accent-strong',
    face: 'right',
  },
  {
    theme: 'dark',
    css: darkCss,
    faces: darkFaces,
    token: 'rn-accent',
    face: 'top',
  },
  {
    theme: 'dark',
    css: darkCss,
    faces: darkFaces,
    token: 'rn-accent-strong',
    face: 'right',
  },
]

let compared = 0

for (const { theme, css, faces, token, face } of PAIRS) {
  const expected = faces[face]
  const actual = readToken(css, token)

  if (!expected) {
    problems.push(
      `build-brand.mjs: ${theme} palette has no \`${face}\` face — cannot ` +
        `verify \`--${token}\`.`,
    )
    continue
  }
  if (!actual) {
    problems.push(
      `custom.css (${theme}): \`--${token}\` is missing — the logo's ` +
        `${face} face is ${expected}, so a consumer of this token would ` +
        'fall back to an unset value.',
    )
    continue
  }

  compared++

  if (actual !== expected) {
    problems.push(
      `custom.css (${theme}): \`--${token}\` is ${actual} but the logo's ` +
        `${face} face is ${expected} — set the token to ${expected}, or ` +
        'change the face in build-brand.mjs and regenerate with ' +
        '`pnpm run build:brand`.',
    )
  }
}

// A run that compared nothing is not a pass. Both readers above are regex-based
// against files this repo generates and formats, so a refactor can quietly
// starve them — the same vacuous-pass trap `check-worklets.ts` guards.
if (compared === 0 && problems.length === 0) {
  problems.push(
    'No token/face pairs were compared — the palette or stylesheet layout ' +
      'drifted past this script. Update it rather than letting the check ' +
      'pass vacuously.',
  )
}

// ---------------------------------------------------------------------------

if (problems.length === 0) {
  console.log(
    `Docs accent tokens match the generated logo (${compared} token/face ` +
      'pairs across light and dark).',
  )
} else {
  console.error('\nBrand accent drift\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

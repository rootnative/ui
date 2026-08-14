/**
 * Guards that every module-level singleton in `@rootnative/components` is
 * defined exactly once across the built bundles.
 *
 * Why this exists: the package ships 30 entry points, and without
 * `splitting: true` each one is a self-contained bundle that *inlines* every
 * module it touches — so `PortalContext` was emitted five separate times, once
 * per entry that reached it. Splitting was the explicit switch back when the
 * package built CJS; it is automatic for the ESM it builds now, so the flag is
 * belt-and-braces and this check is what keeps the guarantee honest either way.
 *
 * `createContext` identity is what React matches a provider to a consumer, so
 * five copies are five unrelated contexts. A `PortalHost` imported from
 * `@rootnative/components/portal` published to copy A while a `Tooltip`
 * imported from `@rootnative/components/tooltip` read copy B and never found a
 * provider. That broke Tooltip, Menu, Dialog, BottomSheet and Snackbar —
 * every overlay in the library — for anyone following the subpath import style
 * the docs recommend.
 *
 * What made it worth a permanent guard is how thoroughly it hid:
 *
 *   - **TypeScript cannot see it.** Both import paths type-check identically.
 *   - **The test suite cannot see it.** Tests import from `src/`, where there
 *     is only ever one copy. All 945 passed while the shipped bundles were
 *     broken.
 *   - **`api:check` cannot see it.** The public API surface is unchanged; this
 *     is purely how the emitted code is laid out.
 *   - **The runtime error misdiagnosed it**, telling the developer to wrap the
 *     app in a `<PortalHost>` that was already there.
 *   - **It degrades rather than crashes.** `Portal` falls back to inline
 *     rendering, so an overlay still appears — just in the wrong place in the
 *     tree. It reaches production as a z-index or clipping bug.
 *
 * So a regression here would ship silently through every other check in CI.
 * This script reads the built output, which is the only place the duplication
 * is observable.
 *
 * Usage:
 *   npx tsx scripts/check-singletons.ts        # requires a prior build
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'packages/components/dist')

/**
 * Values that must exist exactly once in the built output.
 *
 * A React context belongs here whenever a provider and its consumer can be
 * imported from *different* entry points — that is what makes a duplicate
 * observable. All four currently qualify: `Portal`/`PortalHost`,
 * `SnackbarProvider`/`useSnackbar`, and the Dialog and Menu compound
 * components each split a provider from its children across subpaths.
 *
 * Add a new context here as soon as it is created. The cost of a wrong entry
 * is a loud failure; the cost of a missing one is the silent bug above.
 */
const SINGLETONS = [
  'PortalContext',
  'SnackbarContext',
  'DialogContext',
  'MenuContext',
]

const problems: string[] = []

/** Every emitted `.js` file, entries and shared chunks alike. */
function bundles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...bundles(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

if (!fs.existsSync(DIST)) {
  console.error(
    'packages/components/dist not found — run `pnpm run build` first.',
  )
  process.exit(1)
}

const files = bundles(DIST)

for (const name of SINGLETONS) {
  // Match the declaration, not a reference to it — every duplicate is a fresh
  // definition, so definitions are what count.
  //
  // The bundler rewrites the call in more than one shape, and the exact shape
  // depends on settings this script exists to police, so match all of them:
  //
  //   (0, import_react.createContext)(null)       esbuild, no splitting
  //   _react.createContext.call(void 0, null)     esbuild, splitting on
  //   createContext(null)                         unwrapped
  //
  // Hence: an optional `(0, ` prefix, an optional namespace, and an optional
  // `.call` suffix. Written loosely on purpose — a shape this misses reads as
  // "defined in no bundle", which fails loudly rather than passing silently.
  const declaration = new RegExp(
    `\\b${name}\\s*=\\s*\\(?\\s*(?:0\\s*,\\s*)?(?:\\w+\\.)?createContext\\b`,
  )
  const owners = files.filter((f) =>
    declaration.test(fs.readFileSync(f, 'utf8')),
  )

  const where = owners.map((f) => path.relative(DIST, f))

  if (owners.length === 0) {
    problems.push(
      `${name}: defined in no bundle — renamed or removed? ` +
        'Update SINGLETONS in this script.',
    )
  } else if (owners.length > 1) {
    problems.push(
      `${name}: defined ${owners.length} times (${where.join(', ')}) — ` +
        'each copy is a separate React context, so a provider imported from ' +
        'one entry point cannot be seen by a consumer imported from another. ' +
        'Check that `splitting: true` is still set in ' +
        'packages/components/tsup.config.ts.',
    )
  }
}

// ---------------------------------------------------------------------------

if (problems.length === 0) {
  console.log(
    `Every singleton is defined once across ${files.length} bundles ` +
      `(${SINGLETONS.length} checked).`,
  )
} else {
  console.error('\nDuplicated singletons in the built output\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

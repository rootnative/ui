/**
 * Guards that every Reanimated hook call in the built bundles survives in a
 * shape the Reanimated Babel plugin can auto-workletize.
 *
 * Why this exists: the plugin workletizes **by callee name**. In
 * `processCalleesAutoworkletizableCallbacks` it unwraps a `SequenceExpression`
 * and then reads `callee.name` / `callee.property.name`, checking the result
 * against a fixed set (`useAnimatedStyle`, `useAnimatedProps`, …). So the
 * *shape* the bundler emits decides whether the consumer's Babel pass converts
 * the callback into a worklet at all:
 *
 *   useAnimatedStyle(cb)                        bare — matches
 *   (0, import_reanimated.useAnimatedStyle)(cb) esbuild CJS, no splitting — matches
 *   _reanimated.useAnimatedStyle.call(void 0, cb)  esbuild CJS + splitting — DOES NOT
 *
 * The last one resolves to `call`, never matches, and the callback ships as a
 * plain function. Reanimated then hands the UI thread a serialized object and
 * the component dies on mount with:
 *
 *   TypeError: updater is not a function (it is Object)
 *
 * That shipped in alpha.10 and alpha.11. `splitting: true` was added to fix the
 * PortalContext duplication (see check-singletons.ts) and, under `format:
 * 'cjs'`, silently flipped all 30 hook calls into the `.call` form. Every
 * animated component in the library was dead on native — a single `<IconButton
 * />` was enough to crash an app. The package now builds ESM, which emits the
 * bare form.
 *
 * What makes it worth a permanent guard is that **nothing else in CI can see
 * it**:
 *
 *   - TypeScript can't — the source is correct either way; only the emitted
 *     call shape differs.
 *   - The tests can't — they import from `src/`, which Babel transforms
 *     normally, and the Jest Reanimated mock never exercises a real worklet.
 *     All 957 passed while the shipped bundles were broken.
 *   - `api:check` can't — the public surface is identical.
 *   - `check:singletons` can't — it only counts `createContext` definitions.
 *   - **Counting `__workletHash` does not work either.** The library build
 *     never workletizes: that is the *consumer's* Babel pass. alpha.9 (working)
 *     and alpha.11 (broken) both ship zero occurrences, so the marker is not a
 *     signal. The call shape is.
 *
 * The only way to catch it is to read the built output and assert no hook call
 * was emitted in the un-workletizable form.
 *
 * Usage:
 *   npx tsx scripts/check-worklets.ts        # requires a prior build
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'packages/components/dist')

/**
 * The hooks whose callback the plugin auto-workletizes. Taken from
 * `reanimatedFunctionHooks` / `reanimatedObjectHooks` in the worklets plugin,
 * narrowed to the ones this library actually calls. Adding one the library
 * starts using is cheap; omitting one leaves a gap, so err toward including.
 */
const WORKLETIZED_HOOKS = [
  'useAnimatedStyle',
  'useAnimatedProps',
  'useDerivedValue',
  'useAnimatedReaction',
  'useAnimatedScrollHandler',
  'useFrameCallback',
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

let totalCalls = 0

for (const hook of WORKLETIZED_HOOKS) {
  // The broken shape: any member access ending in `.<hook>.call(`. This is the
  // one form the plugin provably cannot see.
  const broken = new RegExp(`\\.${hook}\\s*\\.\\s*call\\s*\\(`, 'g')

  // Every call of the hook, in any shape, so we can tell "no broken calls"
  // apart from "the hook is no longer used and this check is now vacuous".
  const any = new RegExp(`\\b${hook}\\s*[).]?\\s*\\(`, 'g')

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')

    totalCalls += source.match(any)?.length ?? 0

    const hits = source.match(broken)?.length ?? 0
    if (hits > 0) {
      problems.push(
        `${path.relative(DIST, file)}: ${hits} call(s) to \`${hook}\` emitted ` +
          `as \`.${hook}.call(void 0, …)\`. The Reanimated Babel plugin ` +
          'matches by callee name and reads `call` here, so the callback ' +
          'never becomes a worklet and the component crashes at runtime with ' +
          '"updater is not a function (it is Object)". Check that ' +
          "`format: 'esm'` is still set in packages/components/tsup.config.ts.",
      )
    }
  }
}

// A build that calls none of these hooks means the library stopped animating,
// or the hook list drifted. Either way a silent pass would be misleading.
if (totalCalls === 0) {
  problems.push(
    'No calls to any workletized hook found across the built output — the ' +
      'library animates, so this means the bundle layout or the ' +
      'WORKLETIZED_HOOKS list in this script has drifted. Update it rather ' +
      'than letting the check pass vacuously.',
  )
}

// ---------------------------------------------------------------------------

if (problems.length === 0) {
  console.log(
    `Every Reanimated hook call is workletizable across ${files.length} ` +
      `bundles (${totalCalls} call sites, ${WORKLETIZED_HOOKS.length} hooks ` +
      'checked).',
  )
} else {
  console.error('\nUn-workletizable Reanimated calls in the built output\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

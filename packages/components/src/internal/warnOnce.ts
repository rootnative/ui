declare const __DEV__: boolean

const warned = new Set<string>()

/**
 * Dev-only warning that fires at most once per `key` for the lifetime of the
 * module.
 *
 * These warnings describe a misuse of a component's API — a `<Grid.Cell>` with
 * no `<Grid>`, a `<Portal>` with no host — so they fire from render, where an
 * unguarded `console.error` repeats on every re-render and buries the signal.
 *
 * This replaces a per-instance `useRef(false)` latch that five components each
 * carried. The ref form was read and written during render, which is what
 * `react-hooks/refs` (React Compiler) forbids, and it is also the weaker
 * guard: it warned once per mounted instance, so a list of a hundred
 * misused cells printed a hundred identical errors. Keying the guard rather
 * than using one boolean keeps two different misuses from silencing each
 * other.
 *
 * Mirrors the `warnOnce` helper in the icons and inertia packages.
 *
 * Do not write those package names in full here. `scripts/build-registry.ts`
 * detects a dependency with a plain substring match over the file text, so a
 * scoped name in a comment adds a real dependency to the registry entry of
 * every component that imports this file.
 */
export function warnOnce(key: string, message: string): void {
  if (!__DEV__) return
  if (warned.has(key)) return
  warned.add(key)
  console.error(message)
}

/** @internal — test-only hook to reset the once-per-key state. */
export function __resetWarnOnceForTests(): void {
  warned.clear()
}

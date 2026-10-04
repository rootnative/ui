type Handler = (...args: never[]) => void
type Loose = (...args: unknown[]) => void

/**
 * Merge a component's own gesture handlers with the ones a consumer passed in
 * the same props. The consumer's handler runs first, then the component's, so
 * a consumer `onPressIn` or `onHoverIn` on a `Pressable`-based component is
 * no longer replaced by the state-layer bag spread after the props.
 *
 * Keys the consumer did not pass come through untouched.
 */
export function composeHandlers<T extends object>(
  own: T,
  consumer: { [K in keyof T]?: Handler | null },
): T {
  const out = { ...own } as Record<keyof T, unknown>
  for (const key of Object.keys(own) as (keyof T)[]) {
    const theirs = consumer[key]
    const ours = own[key]
    if (typeof theirs !== 'function' || typeof ours !== 'function') continue
    out[key] = (...args: unknown[]) => {
      ;(theirs as Loose)(...args)
      ;(ours as Loose)(...args)
    }
  }
  return out as T
}

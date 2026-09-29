import { useSyncExternalStore } from 'react'

/**
 * A store that never changes, read only for *when* React reads it.
 *
 * React calls `getServerSnapshot` during server rendering **and** through the
 * hydration pass, then `getSnapshot` for every render after. So this is
 * `true` exactly while the client is reproducing the server's markup, and
 * `false` everywhere else — including the very first render of a client-only
 * tree, which never hydrates.
 */
const subscribeToNothing = () => () => {}
const notHydrating = () => false
const isHydratingOnServer = () => true

/**
 * `true` on the server and while the client hydrates a static export, `false`
 * on every other render.
 *
 * Every value in `core` that the server cannot know — the window size, the
 * color scheme — reads this one hook. So during hydration they all report the
 * server's value together, and all switch to the measured value on the same
 * re-render.
 */
export function useIsHydrating(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    notHydrating,
    isHydratingOnServer,
  )
}

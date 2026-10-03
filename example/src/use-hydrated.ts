import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * `false` on the server and during the client render that hydrates the static
 * HTML, `true` from the next render on. Use it to gate a value the server
 * cannot know, such as `useWindowDimensions`, which reports a 0 wide window
 * on the export server. The breakpoint hooks from `@rootnative/core` need no
 * gate, because they hold the compact value through hydration on their own.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

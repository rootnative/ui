import { Platform } from 'react-native'
import type { Role, ViewProps } from 'react-native'

const WEB: Pick<ViewProps, 'role'> = { role: 'search' as Role }
const NATIVE: Pick<ViewProps, 'accessibilityRole'> = {
  accessibilityRole: 'search',
}

/**
 * The props that make a `View` a `search` landmark.
 *
 * React Native's `Role` union has no `search`, and its
 * `accessibilityRole="search"` names a search field. A web runtime can render
 * that one as `role="searchbox"`, which is the role of the input inside. On
 * the web, a `role` that the runtime does not know reaches the element as it
 * is, so `role="search"` gives the landmark on each runtime.
 */
export function searchLandmarkProps(): Pick<
  ViewProps,
  'role' | 'accessibilityRole'
> {
  return Platform.OS === 'web' ? WEB : NATIVE
}

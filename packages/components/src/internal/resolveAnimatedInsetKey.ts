import { webKeepsPhysicalSides } from '@rootnative/utils'
import { Platform } from 'react-native'

/**
 * The key for a start or end inset in a Reanimated animated style.
 *
 * On the web, Reanimated writes each animated frame to `element.style`
 * through the `createReactDOMStyle` of the runtime. react-native-web's
 * doesn't resolve a logical key. `start` is not a CSS property, so the
 * browser drops the frame. So on the web this returns a physical key, in LTR
 * too, unlike `resolveLogicalKey`. A web runtime that swaps `left` and
 * `right` applies `left` to the start side in RTL too. Native returns the
 * logical key, which React Native resolves.
 */
export function resolveAnimatedInsetKey(key: 'start' | 'end'): string {
  if (Platform.OS !== 'web') return key
  const startSide = webKeepsPhysicalSides() ? 'right' : 'left'
  if (key === 'start') return startSide
  return startSide === 'left' ? 'right' : 'left'
}

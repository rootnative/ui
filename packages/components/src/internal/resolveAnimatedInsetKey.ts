import { isRTLDirection } from '@rootnative/utils'
import { Platform } from 'react-native'

/**
 * The key for a start or end inset in a Reanimated animated style.
 *
 * On the web, Reanimated writes each animated frame to `element.style`
 * through react-native-web's `createReactDOMStyle`, which doesn't resolve a
 * logical key. `start` is not a CSS property, so the browser drops the frame.
 * So on the web this returns the physical key for the document direction, in
 * LTR too, unlike `resolveLogicalKey`. Native returns the logical key, which
 * React Native resolves.
 */
export function resolveAnimatedInsetKey(key: 'start' | 'end'): string {
  if (Platform.OS !== 'web') return key
  const isRTL = isRTLDirection()
  if (key === 'start') return isRTL ? 'right' : 'left'
  return isRTL ? 'left' : 'right'
}

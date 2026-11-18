import { selectRTL } from '@rootnative/utils'
import { Platform } from 'react-native'
import type { TextStyle } from 'react-native'

const ALIGN_LEFT: TextStyle = { textAlign: 'left' }
const ALIGN_RIGHT: TextStyle = { textAlign: 'right' }

/**
 * The style that aligns the value and the placeholder of a `TextInput` with
 * the start edge of the layout, also for Latin text in RTL.
 *
 * iOS needs none: its natural alignment follows the layout direction. Android
 * aligns by the first strong character of the text, and react-native-web gives
 * each input `dir="auto"`, so Latin text in an RTL layout aligns left on both.
 * The value is physical: Android resolves `textAlign: 'start'` against the
 * text too, and React Native doesn't swap `left` and `right` on a `TextInput`.
 *
 * The two styles are constants, so a memoized style array keeps its identity.
 */
export function startTextAlignStyle(): TextStyle | undefined {
  if (Platform.OS !== 'android' && Platform.OS !== 'web') return undefined
  return selectRTL(ALIGN_LEFT, ALIGN_RIGHT)
}

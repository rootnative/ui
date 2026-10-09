import { Platform } from 'react-native'

/**
 * Removes the browser's focus outline on web, from a node whose focus has
 * another indicator: the MD3 focus ring a component draws, or the active
 * indicator of a text field.
 *
 * Chromium draws `outline: auto` on `:focus-visible`, in the system focus
 * color, so without this reset a keyboard user sees two rings in two colors.
 * Put it only on a node that has its own indicator. On any other node it
 * removes the only one — the close button of an input `Chip` keeps the
 * browser outline for that reason.
 *
 * The rings follow a modality tracker: keyboard at the start and after a
 * keydown, pointer after a pointer down. Measured in Chromium, that agrees
 * with `:focus-visible` for keyboard focus, for a script focus after keyboard
 * input, and for a script focus after a click on a control. One case
 * differs: after a click that focuses nothing, Chromium shows the outline on
 * a script focus and the ring does not, so that focus has no indicator.
 * Keyboard input always shows the ring.
 *
 * `outline-style: none` is the CSS reset. React Native types the key as
 * solid / dotted / dashed only, so the value is cast; react-native-web writes
 * the string `'none'`.
 */
export const webOutlineReset =
  Platform.OS === 'web' ? { outlineStyle: 'none' as 'solid' } : null

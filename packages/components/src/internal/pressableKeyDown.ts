import type { GestureResponderEvent } from 'react-native'

/**
 * The event a `Pressable` receives from a key press on web.
 *
 * react-native-web forwards `onKeyDown` from `Pressable` to the DOM element,
 * but the upstream `PressableProps` type does not include it. The augmentation
 * below types the prop once for every component that reads keys on web.
 * Native platforms never call it, so the DOM methods are optional.
 */
export interface PressableKeyDownEvent {
  nativeEvent: { key?: string; repeat?: boolean; defaultPrevented?: boolean }
  target?: unknown
  currentTarget?: { getAttribute?: (name: string) => string | null }
  preventDefault?: () => void
  stopPropagation?: () => void
}

declare module 'react-native' {
  interface PressableProps {
    onKeyDown?: (event: PressableKeyDownEvent) => void
  }
}

/**
 * The roles that the WAI-ARIA patterns press with Space, other than `button`.
 *
 * react-native-web presses a `Pressable` on Enter for each role, but on Space
 * only for the `button` role (`isValidKeyPress` in
 * `modules/usePressEvents/PressResponder.js`, 0.21.4). Space is the key that
 * a user tries first on a checkbox, a switch, a radio and a tab.
 */
const SPACE_PRESS_ROLES = new Set(['checkbox', 'switch', 'radio', 'tab'])

/**
 * An `onKeyDown` that presses on Space when the focused element has one of
 * the `SPACE_PRESS_ROLES`. It reads the role from the element, so a role that
 * the consumer passes, such as `role="checkbox"` on a `Card`, counts too.
 *
 * `onKeyDown` runs first. When it calls `preventDefault`, Space does not
 * press, so an app that handles Space itself does not press twice.
 */
export function pressOnSpace(
  onPress: ((event: GestureResponderEvent) => void) | null | undefined,
  disabled: boolean,
  onKeyDown?: (event: PressableKeyDownEvent) => void,
): (event: PressableKeyDownEvent) => void {
  return (event) => {
    onKeyDown?.(event)
    const { key, repeat, defaultPrevented } = event.nativeEvent
    if (key !== ' ' || defaultPrevented || disabled || !onPress) return
    // A key from a focused descendant, such as a link in a card, is not a
    // press of this control.
    if (event.target !== event.currentTarget) return
    const role = event.currentTarget?.getAttribute?.('role')
    if (!role || !SPACE_PRESS_ROLES.has(role)) return
    // Claim a repeat too, or the page scrolls while the key is held.
    event.preventDefault?.()
    event.stopPropagation?.()
    // react-native-web also gives `onPress` the key event, on Enter.
    if (!repeat) onPress(event as unknown as GestureResponderEvent)
  }
}

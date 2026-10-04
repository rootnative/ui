import { Platform } from 'react-native'

/**
 * The toggle state of a `button`. ARIA defines `aria-pressed` for it, and
 * `aria-selected` is not a valid state on a button, so a web screen reader
 * announces nothing from it. React Native has no `aria-pressed`: it maps
 * `aria-selected` into `accessibilityState.selected`, which is what TalkBack
 * and VoiceOver read for a toggle. So each platform gets its own spelling.
 */
export function pressedState(pressed: boolean) {
  return Platform.OS === 'web'
    ? { 'aria-pressed': pressed }
    : { 'aria-selected': pressed }
}

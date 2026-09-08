import { StyleSheet } from 'react-native'

/**
 * `pointerEvents` as a style rather than a prop.
 *
 * react-native-web deprecated `props.pointerEvents` and warns once per app
 * (`createDOMProps`), so a single component passing the prop puts a warning in
 * every consumer's console. React Native has accepted the key in `style` since
 * 0.71, and it is in `ViewStyle` for the whole supported band.
 *
 * The two spellings are the same thing: react-native-web's own implementation
 * translated the prop into exactly this style and appended it after the
 * caller's `style`. So a call site keeps its behavior by putting one of these
 * **last** in its style array — including ahead of nothing else, since last is
 * where the prop used to land.
 *
 * A shared frozen table rather than a per-component style entry: the value is
 * a behavior flag, not part of any component's visual design, and `StyleSheet`
 * registers each object once for the whole library.
 */
export const pointerEvents = StyleSheet.create({
  auto: { pointerEvents: 'auto' },
  boxNone: { pointerEvents: 'box-none' },
  boxOnly: { pointerEvents: 'box-only' },
  none: { pointerEvents: 'none' },
})

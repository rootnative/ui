/**
 * The event a `Pressable` receives from a key press on web.
 *
 * react-native-web forwards `onKeyDown` from `Pressable` to the DOM element,
 * but the upstream `PressableProps` type does not include it. The augmentation
 * below types the prop once for every component that reads keys on web.
 * Native platforms never call it, so the DOM methods are optional.
 */
export interface PressableKeyDownEvent {
  nativeEvent: { key?: string }
  preventDefault?: () => void
  stopPropagation?: () => void
}

declare module 'react-native' {
  interface PressableProps {
    onKeyDown?: (event: PressableKeyDownEvent) => void
  }
}

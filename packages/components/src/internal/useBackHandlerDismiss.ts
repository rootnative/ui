import { useEffect } from 'react'
import { BackHandler, Platform } from 'react-native'

/**
 * Android hardware back closes an open overlay before it pops the navigation
 * stack. The native counterpart of `useFocusTrap`'s `onEscape`.
 *
 * Subscribes only while `active` is true and `onDismiss` exists, so a surface
 * that is closed, or one the user must resolve with an action, never swallows
 * a back press.
 */
export function useBackHandlerDismiss(
  active: boolean,
  onDismiss: (() => void) | undefined,
): void {
  useEffect(() => {
    if (!active || !onDismiss || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [active, onDismiss])
}

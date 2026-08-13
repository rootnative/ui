import { useContext, useEffect } from 'react'
import { SnackbarContext } from './context'

/**
 * Raise the snackbar's bottom offset while the calling component is mounted.
 *
 * `SnackbarProvider`'s `bottomOffset` prop sets one offset for the whole app,
 * which is wrong whenever only some screens carry a FAB: the provider lives in
 * the app root and the FAB lives in a screen, so the constant that decides the
 * layout sits in a different file from the component that determines it, with
 * no link between them. This hook puts the offset where the FAB is.
 *
 * ```tsx
 * import { FAB, FAB_SIZES, snackbarOffsetFor, useSnackbarOffset } from '@rootnative/components'
 *
 * function Screen() {
 *   useSnackbarOffset(snackbarOffsetFor(FAB_SIZES.medium))
 *   return <FAB icon="plus" accessibilityLabel="Add" onPress={add} />
 * }
 * ```
 *
 * While any caller is mounted its offset wins over the provider's prop. With
 * several mounted — which happens during a navigation transition, when the
 * outgoing screen has not unmounted yet — the largest applies, so the snackbar
 * clears every FAB currently on screen. Passing `0` is meaningful: it overrides
 * the provider's prop down to zero for this screen.
 *
 * Throws without a `<SnackbarProvider>` above, for the same reason
 * `useSnackbar` does: a silent no-op would look like a layout bug in the
 * caller's own code.
 */
export function useSnackbarOffset(offset: number): void {
  const store = useContext(SnackbarContext)

  if (!store) {
    throw new Error(
      '[@rootnative/components] useSnackbarOffset() must be called inside a ' +
        '<SnackbarProvider>. Mount one at the app root, inside <PortalHost>.',
    )
  }

  // Keyed on the value, so a changing offset removes the old entry and pushes a
  // new one rather than mutating in place. Cheap — the effect body is two array
  // operations — and it keeps the store's entries immutable, which is what lets
  // removal work by identity regardless of unmount order.
  useEffect(() => store.pushOffset(offset), [store, offset])
}

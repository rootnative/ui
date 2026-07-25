import { useContext, useMemo } from 'react'
import { SnackbarContext } from './context'
import type { SnackbarApi, SnackbarId, SnackbarOptions } from './types'

/**
 * Imperative handle on the snackbar queue. Returns a stable object, so it is
 * safe in dependency arrays and as a `useCallback` dependency.
 *
 * Throws when there is no `<SnackbarProvider>` above — a silent no-op here
 * would look like a bug in the caller's own code.
 */
export function useSnackbar(): SnackbarApi {
  const store = useContext(SnackbarContext)

  if (!store) {
    throw new Error(
      '[@rootnative/components] useSnackbar() must be called inside a ' +
        '<SnackbarProvider>. Mount one at the app root, inside <PortalHost>.',
    )
  }

  return useMemo<SnackbarApi>(
    () => ({
      show: (options: SnackbarOptions): SnackbarId => store.show(options),
      hide: (id?: SnackbarId): void => store.hide(id, 'manual'),
      clear: (): void => store.clear(),
    }),
    [store],
  )
}

import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import { SnackbarContext } from './context'
import { SnackbarSurface } from './SnackbarSurface'
import { SnackbarStore } from './store'
import { SNACKBAR_SLIDE, createSnackbarStyles } from './styles'
import type { SnackbarProviderProps } from './types'

interface SnackbarHostProps {
  store: SnackbarStore
  bottomOffset: number
  style: SnackbarProviderProps['style']
}

function SnackbarHost({ store, bottomOffset, style }: SnackbarHostProps) {
  const theme = useTheme()
  const entry = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  // A mounted `useSnackbarOffset` wins over the prop. `null` means nobody
  // pushed one — distinct from a pushed `0`, which is a screen deliberately
  // overriding the prop down to zero.
  const pushedOffset = useSyncExternalStore(
    store.subscribeOffset,
    store.getOffset,
    store.getOffset,
  )
  const effectiveOffset = pushedOffset ?? bottomOffset

  const styles = useMemo(
    () => createSnackbarStyles(theme, effectiveOffset, false),
    [theme, effectiveOffset],
  )

  const durationMs = entry?.durationMs ?? null
  const entryId = entry?.id

  // Auto-dismiss. Keyed on the id so a replacement restarts the clock, and
  // skipped entirely for indefinite snackbars.
  useEffect(() => {
    if (entryId === undefined || durationMs === null) return
    const timer = setTimeout(() => store.hide(entryId, 'timeout'), durationMs)
    return () => clearTimeout(timer)
  }, [store, entryId, durationMs])

  return (
    <Portal priority={PORTAL_LAYERS.snackbar}>
      {/* `box-none` so the layer's own band — full width, plus 16dp of
          padding — never intercepts touches meant for the UI behind it. Only
          the snackbar surface itself is tappable. */}
      <SafeAreaView
        edges={['bottom']}
        style={styles.layer}
        pointerEvents="box-none"
        // Fixed handle, like `snackbar-layer` below: the snackbar API carries no
        // `testID` down because the queue is driven by `show()` rather than by
        // props, and `bottomOffset` lands on this node's padding, not on the
        // animated one.
        testID="snackbar-safe-area"
      >
        <Presence>
          {entry ? (
            <Motion.View
              key={entry.id}
              // The entrance animates here, not on the surface — and nothing
              // in the snackbar API carries a `testID` down, since the queue is
              // driven by `show()` rather than by props. A fixed handle, like
              // `switch-thumb`, so tests can assert settled entrance values.
              testID="snackbar-layer"
              initial={{ opacity: 0, translateY: SNACKBAR_SLIDE }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: SNACKBAR_SLIDE }}
              transition="spring-default-spatial"
            >
              <SnackbarSurface
                entry={entry}
                bottomOffset={effectiveOffset}
                style={style}
                onAction={() => {
                  entry.onAction?.()
                  store.hide(entry.id, 'action')
                }}
                onClose={() => store.hide(entry.id, 'close')}
              />
            </Motion.View>
          ) : null}
        </Presence>
      </SafeAreaView>
    </Portal>
  )
}

/**
 * Owns the snackbar queue and renders the visible one into the
 * `PORTAL_LAYERS.snackbar` layer. Mount it once, inside `ThemeProvider` and
 * inside the app's `PortalHost`.
 *
 * The queue lives in a store rather than component state, so `show()` never
 * re-renders the children this provider wraps.
 */
export function SnackbarProvider({
  children,
  bottomOffset = 0,
  style,
}: SnackbarProviderProps) {
  const store = useMemo(() => new SnackbarStore(), [])

  return (
    <SnackbarContext.Provider value={store}>
      {children}
      <SnackbarHost store={store} bottomOffset={bottomOffset} style={style} />
    </SnackbarContext.Provider>
  )
}

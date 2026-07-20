import { useTheme } from '@rootnative/core'
import {
  useGestureLayer,
  type GestureLayerStates,
  type UseGestureLayerResult,
} from '@rootnative/inertia/gesture-layer'
import { alphaColor, blendColor } from '@rootnative/utils'
import { useMemo } from 'react'

export interface UseStateLayerOptions {
  /**
   * Resolved container color at rest — the variant's background, or
   * `'transparent'` for fill-less variants (text/outlined buttons, standard
   * icon buttons, ...).
   */
  rest: string
  /**
   * Content color the hover/press/focus layers derive from (label + icon
   * color, already including any `contentColor` override).
   */
  content: string
  /**
   * Consumer `containerColor` override. Wins over `rest`, and the state
   * layers re-derive from it — per the override contract they must never
   * stay at the variant defaults.
   */
  containerColor?: string
  /** Suppresses hover/press/focus layers and activates the disabled layer. */
  disabled?: boolean
  /**
   * Container background while disabled — MD3's 12% `onSurface` for filled
   * variants. Omit for variants whose disabled container is transparent (the
   * layer then falls back to `rest`). Never derived from `containerColor`:
   * disabled treatment is not overridable.
   */
  disabledContainerColor?: string
}

/**
 * The MD3 state-layer system, written once. Binds theme tokens to inertia's
 * generic `useGestureLayer` primitive — every piece of MD3 opinion lives
 * here, on the consumer side of the inertia contract:
 *
 * - Layer colors derive from the container/content pair with the theme's
 *   `stateLayer` opacities: translucent overlay (`alphaColor`) on
 *   transparent containers, opaque blend (`blendColor`) on filled ones —
 *   the same rule every component's `styles.ts` applies today.
 * - Focus feedback rides the `focusVisible` sub-state, so it appears for
 *   keyboard focus only (replaces the hand-rolled `isFocusVisible()`
 *   gating).
 * - Per-state timings reference the named transitions `ThemeProvider`
 *   registers from `theme.motion` — hover 'state-hover' (150ms), press
 *   'state-press' (100ms), focus 'state-focus' (200ms), all on the MD3
 *   standard curve.
 * - Priority cascade (pressed wins) and the disabled override come from
 *   `useGestureLayer` itself.
 *
 * Returns inertia's `{ style, handlers, states }` untouched: spread
 * `handlers` on the `Pressable`, put `style` on the animated container, and
 * feed `states.hovered` into progress-driven hooks like `useShadow` for the
 * elevation crossfade.
 *
 * Internal — not exported from the package.
 */
export function useStateLayer(
  options: UseStateLayerOptions,
): UseGestureLayerResult {
  const {
    rest,
    content,
    containerColor,
    disabled = false,
    disabledContainerColor,
  } = options
  const { stateLayer } = useTheme()

  const layers = useMemo<GestureLayerStates>(() => {
    const base = containerColor ?? rest
    const layerColor = (opacity: number) =>
      base === 'transparent'
        ? alphaColor(content, opacity)
        : blendColor(base, content, opacity)
    const states: GestureLayerStates = {
      rest: { backgroundColor: base },
      hovered: { backgroundColor: layerColor(stateLayer.hoveredOpacity) },
      focusVisible: {
        backgroundColor: layerColor(stateLayer.focusedOpacity),
      },
      pressed: { backgroundColor: layerColor(stateLayer.pressedOpacity) },
    }
    if (disabledContainerColor) {
      states.disabled = { backgroundColor: disabledContainerColor }
    }
    return states
  }, [containerColor, rest, content, stateLayer, disabledContainerColor])

  const gestureOptions = useMemo(
    () => ({
      disabled,
      transition: {
        hovered: 'state-hover',
        pressed: 'state-press',
        focused: 'state-focus',
        focusVisible: 'state-focus',
      } as const,
    }),
    [disabled],
  )

  return useGestureLayer(layers, gestureOptions)
}

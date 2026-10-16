import { useTheme } from '@rootnative/core'
import { useInterpolatedStyle } from '@rootnative/inertia'
import {
  useGestureLayer,
  type GestureLayerStates,
  type UseGestureLayerResult,
} from '@rootnative/inertia/gesture-layer'
import { alphaColor, blendColor } from '@rootnative/utils'
import { useEffect, useMemo } from 'react'

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
  /**
   * Suppresses hover/press/focus layers and shows the disabled container
   * color. Keep `style` on the container while disabled: a view keeps the
   * last value that an animated style wrote after the style is removed.
   */
  disabled?: boolean
  /**
   * Container background while disabled — MD3's 12% `onSurface` for filled
   * variants. Omit for variants whose disabled container is their own rest
   * color (the layer then falls back to `rest`, not to `containerColor`):
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
/**
 * Opacity of the focus ring, 0 to 1 off the `focusVisible` progress, so the
 * ring appears for keyboard focus only. Put it on the ring node beside the
 * component's static ring style.
 */
export function useFocusRingStyle(
  focusVisible: UseGestureLayerResult['states']['focusVisible'],
) {
  return useInterpolatedStyle(focusVisible, { opacity: [0, 1] })
}

export interface UseStateLayerResult extends UseGestureLayerResult {
  focusRingStyle: ReturnType<typeof useFocusRingStyle>
}

export function useStateLayer(
  options: UseStateLayerOptions,
): UseStateLayerResult {
  const {
    rest,
    content,
    containerColor,
    disabled = false,
    disabledContainerColor,
  } = options
  const { stateLayer } = useTheme()

  const layers = useMemo<GestureLayerStates>(() => {
    const disabledBase = disabledContainerColor ?? rest
    // While disabled, every layer starts from the disabled color. The
    // `disabled` layer alone is not sufficient: its progress starts at 0, so
    // a control that mounts disabled would show `rest` first.
    const base = disabled ? disabledBase : (containerColor ?? rest)
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
    // The disabled layer never reads `containerColor`. Without this line
    // `useGestureLayer` falls back to `rest`, which is the override.
    states.disabled = { backgroundColor: disabledBase }
    return states
  }, [
    disabled,
    containerColor,
    rest,
    content,
    stateLayer,
    disabledContainerColor,
  ])

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

  const layer = useGestureLayer(layers, gestureOptions)
  const { pressed, hovered } = layer.states

  // A control that becomes disabled during a press or a hover gets no
  // release, because its handlers are detached. Put both layers back to
  // rest, or the control shows them again when it is enabled.
  useEffect(() => {
    if (!disabled) return
    pressed.value = 0
    hovered.value = 0
  }, [disabled, pressed, hovered])

  const focusRingStyle = useFocusRingStyle(layer.states.focusVisible)
  return { ...layer, focusRingStyle }
}

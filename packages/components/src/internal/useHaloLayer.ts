import { useTheme } from '@rootnative/core'
import {
  useGestureLayer,
  type GestureLayerStates,
} from '@rootnative/inertia/gesture-layer'
import { useMemo } from 'react'
import { useFocusRingStyle } from './useStateLayer'
import type { UseStateLayerResult } from './useStateLayer'

/**
 * The state layer of a selection control (Switch, Checkbox, Radio): a round
 * halo behind the control whose *opacity* carries the MD3 state-layer alpha
 * over a solid colour, instead of a blended container background.
 *
 * The gesture layer composes the strongest active interaction through a
 * clamped max, so the token values stay intact; the `disabled` layer pins the
 * halo off while disabled regardless of gesture state. Focus feedback rides
 * `focusVisible`, so it appears for keyboard focus only.
 *
 * Internal — not exported from the package.
 */
export function useHaloLayer(disabled: boolean): UseStateLayerResult {
  const { stateLayer } = useTheme()
  const layers = useMemo<GestureLayerStates>(
    () => ({
      rest: { opacity: 0 },
      hovered: { opacity: stateLayer.hoveredOpacity },
      focusVisible: { opacity: stateLayer.focusedOpacity },
      pressed: { opacity: stateLayer.pressedOpacity },
      disabled: { opacity: 0 },
    }),
    [stateLayer],
  )
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
  const focusRingStyle = useFocusRingStyle(layer.states.focusVisible)
  return { ...layer, focusRingStyle }
}

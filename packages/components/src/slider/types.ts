import type { IconSource } from '@rootnative/utils'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/** Single number for one-thumb sliders, or `[low, high]` tuple for range sliders. */
export type SliderValue = number | [number, number]

export interface SliderProps extends Omit<ViewProps, 'children'> {
  /**
   * Current value. Pass a number for single-thumb mode or `[low, high]` for
   * range mode. Use `defaultValue` for uncontrolled usage.
   */
  value?: SliderValue
  /**
   * Initial value for uncontrolled usage. Pass a `[low, high]` tuple to
   * enable range mode.
   */
  defaultValue?: SliderValue
  /** Called continuously during a drag with the latest value. */
  onValueChange?: (value: SliderValue) => void
  /** Called once when the user releases the thumb. */
  onSlidingComplete?: (value: SliderValue) => void
  /**
   * Lowest allowed value.
   * @default 0
   */
  minimumValue?: number
  /**
   * Highest allowed value.
   * @default 1
   */
  maximumValue?: number
  /**
   * Step interval. Set to a positive number to enable discrete mode (values
   * snap to multiples of `step` and tick marks are shown by default).
   * Omit or set to `0` for a continuous slider.
   * @default 0
   */
  step?: number
  /**
   * Centered slider — the active track fills from the midpoint to the thumb
   * instead of from the start. Useful for symmetric values like balance or
   * EQ adjustments. Single-thumb mode only; ignored for range sliders.
   * @default false
   */
  centered?: boolean
  /**
   * Whether to render tick marks along the track. Defaults to `true` when
   * `step > 0`, otherwise `false`. Pass an explicit boolean to override.
   */
  showTickMarks?: boolean
  /**
   * Show the value bubble above the thumb. `true` shows it during drag only,
   * `'always'` keeps it visible, `false` hides it entirely.
   * @default true
   */
  showValueLabel?: boolean | 'always'
  /**
   * Custom formatter for the value-label text. Defaults to integer rounding
   * for discrete sliders and 2-decimal rounding for continuous sliders.
   */
  formatValueLabel?: (value: number) => string
  /**
   * Optional icon decoration shown at the start (leading edge) of the track.
   * Accepts a string name (resolved via the theme's `iconResolver`), a
   * pre-rendered element, or a render function.
   */
  startIcon?: IconSource
  /** Optional icon decoration shown at the end (trailing edge) of the track. */
  endIcon?: IconSource
  /**
   * Override the active track color. Hover/press state-layer colors on the
   * thumb are derived from `contentColor` (or the active track color when
   * unset).
   */
  containerColor?: string
  /** Override the thumb color. */
  contentColor?: string
  /** Override the inactive track color. */
  inactiveTrackColor?: string
  /**
   * Disable interaction. Renders the standard MD3 disabled treatment
   * (38% `onSurface`); `containerColor`/`contentColor` are ignored.
   * @default false
   */
  disabled?: boolean
  /** Style applied to the root container. */
  style?: StyleProp<ViewStyle>
}

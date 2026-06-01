import type { IconSource } from '@rootnative/utils'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

export interface CheckboxProps extends Omit<
  PressableProps,
  'children' | 'style'
> {
  /**
   * Whether the checkbox is checked.
   * @default false
   */
  value?: boolean
  /** Callback fired when the checkbox is toggled. Receives the new value. */
  onValueChange?: (value: boolean) => void
  /**
   * Render the MD3 indeterminate ("mixed") state — a dash mark on the
   * selected container colors. Wins over `value` visually, and reports
   * `checked: 'mixed'` to accessibility.
   * @default false
   */
  indeterminate?: boolean
  /**
   * Render the MD3 error state: `error`-colored outline when unchecked, and
   * an `error` container with `onError` mark when checked or indeterminate.
   * State-layer (hover, focus, press) colors also use `error`. The standard
   * disabled treatment wins over the error state.
   * @default false
   */
  error?: boolean
  /**
   * Icon shown when the checkbox is checked. Accepts a string name (resolved
   * via the theme's `iconResolver`, defaulting to `MaterialCommunityIcons`),
   * a pre-rendered element, or a render function that receives `{ size, color }`.
   *
   * Override this when your `iconResolver` doesn't map the default `'check'`
   * name (e.g. a Lucide-only resolver).
   * @default 'check'
   */
  checkIcon?: IconSource
  /**
   * Override the container (box) color when checked.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the checkmark icon color.
   */
  contentColor?: string
  /**
   * Style applied to the root container. Static form only — the function
   * form `(state) => style` is not supported because the component drives
   * its container background through Reanimated. Use `containerColor` /
   * `contentColor` for state-aware styling.
   */
  style?: StyleProp<ViewStyle>
}

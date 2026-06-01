import type { IconSource } from '@rootnative/utils'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'

/**
 * Visual variant of a button group.
 * - `standard`: pill-shaped buttons separated by a small gap.
 * - `connected`: buttons share edges as a single segmented bar; the selected
 *   button morphs to a smaller corner radius.
 */
export type ButtonGroupVariant = 'standard' | 'connected'

/** Size of the buttons in the group. Heights map to MD3 Expressive sizes. */
export type ButtonGroupSize =
  | 'extraSmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'

/**
 * Selection behavior of the group.
 * - `none`: items act as standalone actions; no selection state is tracked.
 * - `single`: exactly one item can be selected at a time.
 * - `multiple`: any number of items can be selected.
 */
export type ButtonGroupSelectionMode = 'none' | 'single' | 'multiple'

/** A single button rendered inside a `ButtonGroup`. */
export interface ButtonGroupItem {
  /** Stable identifier used for selection state and the press callback. */
  value: string
  /** Text label rendered inside the button. */
  label?: string
  /**
   * Icon rendered before the label. Accepts a string name (resolved via the
   * theme's `iconResolver`), a pre-rendered element, or a render function
   * receiving `{ size, color }`.
   */
  leadingIcon?: IconSource
  /** Icon rendered after the label. */
  trailingIcon?: IconSource
  /** Disable this item only. */
  disabled?: boolean
  /** Accessibility label override (defaults to `label`). */
  accessibilityLabel?: string
}

interface ButtonGroupBaseProps {
  /** The buttons to render in the group. */
  items: ButtonGroupItem[]
  /**
   * Visual variant.
   * @default 'standard'
   */
  variant?: ButtonGroupVariant
  /**
   * Button size.
   * @default 'small'
   */
  size?: ButtonGroupSize
  /**
   * Override the icon size (in dp) for all items. Defaults to a size that
   * matches the group `size`.
   */
  iconSize?: number
  /** Disable the entire group. Per-item `disabled` is also honored. */
  disabled?: boolean
  /**
   * Override the container (background) color of unselected items.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /** Override the content (label and icon) color of unselected items. */
  contentColor?: string
  /** Override the container color of selected items. */
  selectedContainerColor?: string
  /** Override the content color of selected items. */
  selectedContentColor?: string
  /** Style applied to each item label. */
  labelStyle?: StyleProp<TextStyle>
  /** Style applied to the root container. */
  style?: StyleProp<ViewStyle>
  /** Accessibility label for the group container. */
  accessibilityLabel?: string
  /** Test ID forwarded to the root container. */
  testID?: string
}

interface ButtonGroupNoSelectionProps extends ButtonGroupBaseProps {
  selectionMode?: 'none'
  value?: never
  defaultValue?: never
  onValueChange?: never
  /** Called when an item is pressed. Only available when `selectionMode` is `'none'`. */
  onItemPress?: (value: string) => void
}

interface ButtonGroupSingleSelectionProps extends ButtonGroupBaseProps {
  selectionMode: 'single'
  /** Currently selected item value (controlled). */
  value?: string | null
  /** Initial selected item value (uncontrolled). */
  defaultValue?: string | null
  /** Called when the selection changes. */
  onValueChange?: (value: string | null) => void
  onItemPress?: (value: string) => void
}

interface ButtonGroupMultipleSelectionProps extends ButtonGroupBaseProps {
  selectionMode: 'multiple'
  /** Currently selected item values (controlled). */
  value?: string[]
  /** Initial selected item values (uncontrolled). */
  defaultValue?: string[]
  /** Called when the selection changes. */
  onValueChange?: (value: string[]) => void
  onItemPress?: (value: string) => void
}

export type ButtonGroupProps =
  | ButtonGroupNoSelectionProps
  | ButtonGroupSingleSelectionProps
  | ButtonGroupMultipleSelectionProps

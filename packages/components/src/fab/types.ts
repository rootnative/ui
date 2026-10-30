import type { IconSource } from '@rootnative/utils'
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native'

/** Color variant of the FAB. */
export type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'surface'

/**
 * Physical size of the FAB. Ignored when `label` is set — extended FABs are
 * always 56dp tall.
 */
export type FABSize = 'small' | 'medium' | 'large'

export interface FABProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'style' | 'accessibilityLabel'
> {
  /**
   * Icon to display. Accepts a string name (resolved via the theme's
   * `iconResolver`, for example `mdiResolver`), a pre-rendered
   * element, or a render function that receives `{ size, color }`.
   */
  icon: IconSource
  /**
   * Optional text label. When provided, renders an extended FAB (56dp tall)
   * and `size` is ignored. The label is also used as the accessible name
   * unless `accessibilityLabel` is also set.
   */
  label?: string
  /**
   * Color variant. Controls container and content colors.
   * @default 'primary'
   */
  variant?: FABVariant
  /**
   * Physical size. Ignored when `label` is set.
   * @default 'medium'
   */
  size?: FABSize
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the content (icon + label) color.
   * State-layer colors are derived automatically when no `containerColor` is set.
   */
  contentColor?: string
  /** Style applied to the label text. Only used when `label` is set. */
  labelStyle?: StyleProp<TextStyle>
  /**
   * Style for the component. The keys that place or size it in its parent —
   * `alignSelf`, `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `width`, the
   * margins, `position`, the insets and `zIndex` — go to the outer wrapper,
   * so the focus ring and the shadow move with it. `minWidth` and `maxWidth`
   * go with a `width`; alone, they style the container. The wrapper sets no
   * `alignSelf`, so the parent's `alignItems` places the component. In a
   * parent that stretches its children, the component keeps its own width at
   * the start edge. Every other key styles the container. Static form only — the function form `(state) => style` is
   * not supported because the component drives its container background
   * through Reanimated. Use `containerColor` / `contentColor` for
   * state-aware styling.
   */
  style?: StyleProp<ViewStyle>
  /** Called when the FAB is pressed. */
  onPress?: () => void
  /**
   * Disables the FAB.
   * @default false
   */
  disabled?: boolean
  /**
   * When `false`, the FAB draws no shadow and does not lift on hover. MD3
   * places a flat FAB in a `BottomAppBar`, which sets this for you. The
   * container color and the state layers do not change.
   * @default true
   */
  elevated?: boolean
  /**
   * Accessible name for screen readers. Required for icon-only FABs. When
   * `label` is set, defaults to the label and may be omitted (override only
   * if you need a more descriptive name).
   */
  accessibilityLabel?: string
}

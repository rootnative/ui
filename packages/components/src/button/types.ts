import type { IconSource } from '@rootnative/utils'
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native'

// react-native-web reads `hrefAttrs` on a `View` that has an `href`, but the
// upstream `ViewProps` type does not declare it. Keep this block in a module
// that an exported type reaches: the declaration bundler drops an augmentation
// from any other module, as it does with `internal/pressableKeyDown.ts`.
declare module 'react-native' {
  interface ViewProps {
    /**
     * Web only. The `target`, `rel` and `download` of the `<a>` that a view
     * with an `href` renders, for example under Expo Router's
     * `<Link asChild>`. `target: '_blank'` opens the link in a new tab.
     * Native ignores it.
     */
    hrefAttrs?: { target?: string; rel?: string; download?: boolean | string }
  }
}

/** Visual style variant of the button following Material Design 3 roles. */
export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'tonal'

/**
 * MD3 Expressive button size. Drives container height, horizontal padding,
 * icon size, and label typography. `'small'` (40 dp) is the default and
 * matches the pre-Expressive button.
 */
export type ButtonSize =
  | 'extraSmall'
  | 'small'
  | 'medium'
  | 'large'
  | 'extraLarge'

/**
 * MD3 Expressive container shape. `'round'` rests as a full pill; `'square'`
 * rests at a size-dependent rounded-rectangle corner. Both morph one step
 * squarer on press.
 */
export type ButtonShape = 'round' | 'square'

export interface ButtonProps extends Omit<
  PressableProps,
  'children' | 'style'
> {
  /** Text label rendered inside the button. */
  children: string
  /**
   * Visual variant. Controls background, border, and text color.
   * @default 'filled'
   */
  variant?: ButtonVariant
  /**
   * MD3 Expressive size — one of `'extraSmall' | 'small' | 'medium' |
   * 'large' | 'extraLarge'`. Sets container height, padding, icon size, and
   * label typography.
   * @default 'small'
   */
  size?: ButtonSize
  /**
   * Container shape. `'round'` is a full pill; `'square'` rests at a
   * size-dependent rounded corner. Both morph squarer on press.
   * @default 'round'
   */
  shape?: ButtonShape
  /**
   * Icon rendered before the label. Accepts a string name (resolved via the
   * theme's `iconResolver`, for example `mdiResolver`), a
   * pre-rendered element, or a render function that receives `{ size, color }`.
   */
  leadingIcon?: IconSource
  /**
   * Icon rendered after the label. Accepts a string name (resolved via the
   * theme's `iconResolver`, for example `mdiResolver`), a
   * pre-rendered element, or a render function that receives `{ size, color }`.
   */
  trailingIcon?: IconSource
  /**
   * Size of leading and trailing icons in dp. Used when resolving string
   * icon names or invoking the render-function form. Pre-rendered elements
   * are not resized. Defaults to the icon size for the current `size`
   * (20 for `extraSmall` and `small`, 24 for `medium`, 32 for `large`, 40 for
   * `extraLarge`).
   */
  iconSize?: number
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the content (label and icon) color.
   * State-layer colors are derived automatically when no containerColor is set.
   */
  contentColor?: string
  /** Additional style applied to the label text. */
  labelStyle?: StyleProp<TextStyle>
  /**
   * Show an indeterminate `CircularProgress` in place of `leadingIcon`, at
   * the icon size and in the label color. The button keeps its colors and
   * its focus, ignores `onPress` and `onLongPress`, shows no hover or press
   * state, and sets `aria-busy`. MD3 has no loading button, so this is a
   * library addition.
   *
   * With no `leadingIcon`, the spinner adds the icon and its gap, so the
   * button gets wider while it loads. Give it a `width` in `style` to keep
   * the size. Pass `disabled` as well if the button must also look disabled.
   * @default false
   */
  loading?: boolean
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
}

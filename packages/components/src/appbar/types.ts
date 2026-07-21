import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import type { IconButtonProps } from '../icon-button'

/** Size/layout variant of the AppBar. */
export type AppBarVariant = 'small' | 'center-aligned' | 'medium' | 'large'

/**
 * Color scheme that determines the default container and content colors.
 *
 * - `'surface'` — `surface` / `onSurface` (default, elevated uses `surfaceContainer`)
 * - `'surfaceContainerLowest'` — `surfaceContainerLowest` / `onSurface`
 * - `'surfaceContainerLow'` — `surfaceContainerLow` / `onSurface`
 * - `'surfaceContainer'` — `surfaceContainer` / `onSurface`
 * - `'surfaceContainerHigh'` — `surfaceContainerHigh` / `onSurface`
 * - `'surfaceContainerHighest'` — `surfaceContainerHighest` / `onSurface`
 * - `'primary'` — `primary` / `onPrimary`
 * - `'primaryContainer'` — `primaryContainer` / `onPrimaryContainer`
 */
export type AppBarColorScheme =
  | 'surface'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'primary'
  | 'primaryContainer'

interface AppBarActionBase {
  /** Accessibility label for screen readers (required). */
  accessibilityLabel: string
  /** Called when the action is pressed. */
  onPress?: () => void
  /**
   * Disables the action.
   * @default false
   */
  disabled?: boolean
}

/** An icon-button action in the AppBar trailing slot. */
export interface AppBarIconAction extends AppBarActionBase {
  /**
   * Icon to render. Accepts the same forms as `IconButton.icon` — a string
   * name (resolved via the theme's `iconResolver`, defaulting to
   * `MaterialCommunityIcons`), a pre-rendered element, or a render function.
   */
  icon: IconButtonProps['icon']
  label?: never
}

/** A text-button action (e.g. "Save", "Done") in the AppBar trailing slot. */
export interface AppBarTextAction extends AppBarActionBase {
  /** Text label rendered inside a `Button` with `variant="text"`. */
  label: string
  icon?: never
}

/**
 * A single action item rendered in the AppBar trailing slot. Provide either
 * `icon` (renders an `IconButton`) or `label` (renders a text button).
 */
export type AppBarAction = AppBarIconAction | AppBarTextAction

export interface AppBarProps {
  /** Title text displayed in the bar. */
  title: string
  /**
   * Layout variant.
   * @default 'small'
   */
  variant?: AppBarVariant
  /**
   * Color scheme that determines the default container and content colors.
   * `containerColor` and `contentColor` props override these defaults.
   * @default 'surface'
   */
  colorScheme?: AppBarColorScheme
  /**
   * When `true`, renders a back button in the leading slot.
   * @default false
   */
  canGoBack?: boolean
  /** Called when the auto-rendered back button is pressed. */
  onBackPress?: () => void
  /**
   * When `true`, wraps the bar in a SafeAreaView that handles the top inset.
   * @default false
   */
  insetTop?: boolean
  /**
   * When `true`, applies the MD3 on-scroll tonal shift: the container color
   * animates from its resting color to its elevated color (`surface` →
   * `surfaceContainer` for the default `'surface'` color scheme). No shadow
   * is added. Only the `'surface'` scheme defines a distinct elevated color;
   * other schemes keep the same container color. Toggle this from your
   * scroll handler when content scrolls under the bar. When `scrollOffset`
   * is provided on a `'medium'`/`'large'` bar, the tonal shift is driven
   * from the scroll position automatically and this prop only forces the
   * elevated color on.
   * @default false
   */
  elevated?: boolean
  /**
   * Vertical scroll offset (in px) of the content scrolling under the bar,
   * as a Reanimated shared value. Pass `scrollY` from
   * `@rootnative/inertia`'s `useScroll()` and give the matching `onScroll`
   * to your scroll view:
   *
   * ```tsx
   * const { scrollY, onScroll } = useScroll()
   * <AppBar variant="large" title="Title" scrollOffset={scrollY} />
   * <Motion.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
   * ```
   *
   * Drives the MD3 collapse-on-scroll behavior of the `'medium'` and
   * `'large'` variants: the container collapses to the small (64dp) form
   * and the title interpolates to `titleLarge` as the user scrolls, with
   * the on-scroll tonal shift riding the same progress. Ignored by the
   * `'small'` and `'center-aligned'` variants.
   */
  scrollOffset?: SharedValue<number>
  /** Custom leading content. When provided, overrides `canGoBack`. */
  leading?: ReactNode
  /** Custom trailing content. When provided, overrides `actions`. */
  trailing?: ReactNode
  /**
   * Array of actions rendered in the trailing slot. Each entry is either an
   * icon action (`{ icon }`) or a text action (`{ label }`, e.g. "Save").
   */
  actions?: AppBarAction[]
  /**
   * Override the container (background) color.
   * Applied to both normal and elevated states.
   */
  containerColor?: string
  /**
   * Override the content (title and icon) color.
   */
  contentColor?: string
  /** Additional style applied to the title text. */
  titleStyle?: StyleProp<TextStyle>
  /** Custom style applied to the root container. */
  style?: StyleProp<ViewStyle>
}

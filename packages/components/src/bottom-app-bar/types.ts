import type { SharedValue } from '@rootnative/inertia'
import type { ReactNode } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'
import type { FABProps, FABVariant } from '../fab'
import type { IconButtonProps } from '../icon-button'

/** An icon-button action at the start of the bar. */
export interface BottomAppBarAction {
  /**
   * Icon to render. Accepts the same forms as `IconButton.icon` — a string
   * name (resolved via the theme's `iconResolver`, for example
   * `mdiResolver`), a pre-rendered element, or a render function.
   */
  icon: IconButtonProps['icon']
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

/**
 * The FAB at the end of the bar. It renders a flat `FAB`: no shadow, and no
 * lift on hover, as the MD3 bottom app bar specifies.
 */
export interface BottomAppBarFab {
  /** Icon of the FAB. Accepts the same forms as `FAB.icon`. */
  icon: FABProps['icon']
  /**
   * Optional text label. When provided, the bar renders an extended FAB, and
   * the label is the accessible name unless `accessibilityLabel` is set.
   */
  label?: string
  /**
   * Color variant of the FAB.
   * @default 'secondary'
   */
  variant?: FABVariant
  /** Called when the FAB is pressed. */
  onPress?: () => void
  /**
   * Disables the FAB.
   * @default false
   */
  disabled?: boolean
  /**
   * Accessible name for screen readers. Required when `label` is not set.
   */
  accessibilityLabel?: string
}

interface BottomAppBarCommonProps extends Omit<ViewProps, 'children'> {
  /**
   * The FAB at the end of the bar. Leave it off for a bar of actions only.
   */
  fab?: BottomAppBarFab
  /**
   * When `true`, wraps the row in a SafeAreaView that adds the bottom inset
   * below the bar's 80dp, so it clears the home indicator. Leave it off when
   * an ancestor (e.g. `Layout` with a `bottom` edge) already handles it.
   * @default false
   */
  insetBottom?: boolean
  /**
   * Vertical scroll offset (in px) of the content behind the bar, as a
   * Reanimated shared value. Pass `scrollY` from `@rootnative/inertia`'s
   * `useScroll()` and give the matching `onScroll` to your scroll view:
   *
   * ```tsx
   * import { Motion, useScroll } from '@rootnative/inertia'
   *
   * const { scrollY, onScroll } = useScroll()
   * <Motion.ScrollView onScroll={onScroll} scrollEventThrottle={16}>
   * <BottomAppBar actions={actions} scrollOffset={scrollY} />
   * ```
   *
   * Drives the MD3 hide-on-scroll behavior: the bar moves down by its own
   * height while the content scrolls down, and comes back while the content
   * scrolls up. The bar moves and the content does not, so place the bar
   * over the content and pad the end of the content by the bar height.
   * On iOS, keep `contentInsetAdjustmentBehavior` at `'never'` and pad the
   * content instead: with `'automatic'`, the scroll event leaves out the
   * bottom safe-area inset, and the last stretch of the content (about
   * 34 pt) does not move the bar.
   * While a screen reader is on (iOS and Android), the bar stays in place.
   * On web, focus on a control in the bar brings the bar back.
   */
  scrollOffset?: SharedValue<number>
  /**
   * Override the bar background.
   * @default surfaceContainer
   */
  containerColor?: string
  /**
   * Override the icon color of the actions. It reaches each standard
   * `IconButton` in `leading` too. The FAB keeps the colors of its variant.
   * @default onSurfaceVariant
   */
  contentColor?: string
  /** Style applied to the bar container. */
  style?: StyleProp<ViewStyle>
}

/**
 * Start slot of the bar. `leading` and `actions` both fill the same space,
 * so they are mutually exclusive: only one can render.
 *
 * Use `actions` for the MD3 default — a row of up to four icon buttons. Use
 * `leading` when the slot needs something `actions` cannot build, such as a
 * `Menu` anchor or a `Tooltip`.
 */
type BottomAppBarLeadingProps =
  | {
      /**
       * Icon actions rendered at the start of the bar. MD3 recommends up to
       * four.
       */
      actions?: BottomAppBarAction[]
      leading?: never
    }
  | {
      actions?: never
      /**
       * Custom start content. Use this instead of `actions` when the slot
       * needs a component `actions` cannot build, such as a `Menu` anchor or
       * a `Tooltip`. A standard `IconButton` in the slot takes the action
       * color; other content reads it with `useAppBarContentColor()`.
       */
      leading: ReactNode
    }

/**
 * Props of the BottomAppBar. `leading` and `actions` fill the same slot and
 * are mutually exclusive — see `BottomAppBarLeadingProps`.
 */
export type BottomAppBarProps = BottomAppBarCommonProps &
  BottomAppBarLeadingProps

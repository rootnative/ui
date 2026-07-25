import type { IconSource } from '@rootnative/utils'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'

/** Side of the anchor the menu opens on when it fits there. */
export type MenuSide = 'top' | 'bottom'

/**
 * Cross-axis alignment against the anchor, in logical terms — `'start'` is the
 * anchor's left edge in LTR and its right edge in RTL.
 */
export type MenuAlign = 'start' | 'center' | 'end'

export interface MenuProps {
  /**
   * The trigger. Rendered where the `<Menu>` sits in the tree, wrapped in a
   * measuring `View`.
   *
   * When `visible` is omitted the menu manages its own open state, and it needs
   * to hook the trigger's press: pass a single element that accepts `onPress`
   * (any RootNative pressable does). The element's own `onPress` still fires.
   */
  anchor: ReactNode
  /** `Menu.Item`s, `Divider`s, or arbitrary content. */
  children?: ReactNode
  /**
   * Controlled visibility. Omit to let the menu open itself on an anchor press
   * and close itself on an outside press, an item press, or Android back.
   */
  visible?: boolean
  /**
   * Called when the menu closes — outside press, item press, or Android back.
   * Required to close a controlled menu; optional otherwise.
   */
  onDismiss?: () => void
  /**
   * Side of the anchor the menu prefers. It flips to the other side when it
   * does not fit and that side is roomier.
   * @default 'bottom'
   */
  side?: MenuSide
  /**
   * Cross-axis alignment against the anchor.
   * @default 'start'
   */
  align?: MenuAlign
  /**
   * Gap between the anchor edge and the menu, in dp.
   * @default 0
   */
  offset?: number
  /**
   * Minimum distance the menu keeps from every screen edge, in dp.
   * @default 8
   */
  screenMargin?: number
  /**
   * Cap the menu's height in dp, scrolling past it. Only ever makes the menu
   * shorter: the space available on the resolved side still wins, since a menu
   * taller than that would put items where they cannot be seen. Reach for it
   * when a long menu *could* fill the screen but shouldn't — 30 items with room
   * for all of them is a wall of text, and `maxHeight={280}` reads better.
   */
  maxHeight?: number
  /**
   * Override the container (surface) color.
   * @default surfaceContainer
   */
  containerColor?: string
  /**
   * Name of the `PortalHost` to render into. Defaults to the root host, which
   * is what puts the menu above every other layer.
   */
  hostName?: string
  /** Style applied to the menu surface. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the `View` wrapping the anchor. */
  anchorStyle?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the full-screen region that closes the menu on an
   * outside press.
   * @default 'Close menu'
   */
  dismissAccessibilityLabel?: string
  /** Test id applied to the menu surface. */
  testID?: string
}

export interface MenuItemProps {
  /** Item text. */
  label: string
  /**
   * Leading icon at 24dp. Accepts a string name (resolved via the theme's
   * `iconResolver`), a pre-rendered element, or a render function.
   */
  leadingIcon?: IconSource
  /** Trailing icon at 24dp. Mutually exclusive with `trailingText` in practice. */
  trailingIcon?: IconSource
  /** Trailing text — a keyboard shortcut or a short status. */
  trailingText?: string
  /** Called when the item is pressed. */
  onPress?: () => void
  /**
   * Whether pressing the item closes the menu. Set `false` for an item that
   * toggles something and should stay open.
   * @default true
   */
  closeOnPress?: boolean
  /** Greys the item out at 38% and stops it responding. */
  disabled?: boolean
  /**
   * Override the item's container background. Hover/press/focus state-layer
   * colors are derived from it automatically.
   */
  containerColor?: string
  /**
   * Override every piece of content the item renders — label, both icons, and
   * trailing text — and the state-layer colors derived from it. Defaults are
   * `onSurface` for the label and `onSurfaceVariant` for the rest.
   */
  contentColor?: string
  /** Style applied to the label `Text` only — does not affect the icons. */
  labelStyle?: StyleProp<TextStyle>
  /**
   * Style applied to the item container. Static form only — the function form
   * `(state) => style` is not supported because the item drives its background
   * through Reanimated. Use `containerColor` / `contentColor` instead.
   */
  style?: StyleProp<ViewStyle>
  /** Test id applied to the item container. */
  testID?: string
}

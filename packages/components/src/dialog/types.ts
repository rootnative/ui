import type { IconSource } from '@rootnative/utils'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native'

/**
 * `'basic'` is the centered MD3 dialog. `'fullscreen'` fills the screen with a
 * header (close button, headline, confirming action) above scrollable content.
 */
export type DialogVariant = 'basic' | 'fullscreen'

export interface DialogProps extends ViewProps {
  /** Whether the dialog is shown. Exit animations run before it unmounts. */
  visible: boolean
  /**
   * Called when the user dismisses the dialog — scrim tap, Android back
   * button, or the fullscreen close button. Actions inside `Dialog.Actions`
   * are wired up by the consumer, not by this callback.
   */
  onDismiss: () => void
  /** `Dialog.Icon`, `Dialog.Title`, `Dialog.Content`, `Dialog.Actions`. */
  children?: ReactNode
  /**
   * Dialog anatomy.
   * @default 'basic'
   */
  variant?: DialogVariant
  /**
   * Whether a scrim tap and the Android back button dismiss the dialog. Set
   * `false` for a dialog the user must resolve with one of its actions.
   * @default true
   */
  dismissable?: boolean
  /**
   * Override the container (surface) color.
   * @default surfaceContainerHigh (basic) / surface (fullscreen)
   */
  containerColor?: string
  /**
   * Icon for the fullscreen variant's leading close button.
   * @default 'close'
   */
  closeIcon?: IconSource
  /** Screen-reader label for the fullscreen close button. @default 'Close' */
  closeAccessibilityLabel?: string
  /** Screen-reader label for the scrim's dismiss action. @default 'Close dialog' */
  scrimAccessibilityLabel?: string
  /**
   * Announced role. An MD3 dialog is a plain `'dialog'`; pass `'alertdialog'`
   * only for one that interrupts the user with something they must resolve
   * (destructive confirmation, error), since assistive technology treats that
   * role as urgent.
   * @default 'dialog'
   */
  role?: ViewProps['role']
  /**
   * Accessible name for the dialog. Derived from `Dialog.Title` when its
   * headline is a plain string, so this is only needed when the headline is
   * built from nodes or the dialog has no title.
   */
  accessibilityLabel?: string
  /** Style applied to the dialog surface. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the scrim. Ignored by the fullscreen variant. */
  scrimStyle?: StyleProp<ViewStyle>
  /** Test id applied to the dialog surface. */
  testID?: string
}

export interface DialogIconProps {
  /**
   * Icon to display. Accepts a string name (resolved via the theme's
   * `iconResolver`), a pre-rendered element, or a render function.
   */
  icon: IconSource
  /** Override the icon color. @default theme.colors.secondary */
  color?: string
  /** Override the icon size in dp. @default 24 */
  size?: number
  style?: StyleProp<ViewStyle>
}

export interface DialogTitleProps {
  /** Headline text, or arbitrary nodes when a plain string isn't enough. */
  children: ReactNode
  /** Override the headline color. @default theme.colors.onSurface */
  color?: string
  style?: StyleProp<TextStyle>
}

export interface DialogContentProps {
  /**
   * Supporting text or arbitrary content. Strings and numbers are wrapped in
   * MD3 supporting-text styling; anything else renders as given.
   */
  children: ReactNode
  /** Override the supporting-text color. @default theme.colors.onSurfaceVariant */
  color?: string
  style?: StyleProp<ViewStyle>
}

export interface DialogActionsProps {
  /** Action buttons — text `Button`s per MD3. */
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

import type { IconSource } from '@rootnative/utils'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

/**
 * How long a snackbar stays up. `'short'` is 4s and `'long'` is 10s per MD3;
 * a number is milliseconds. `'indefinite'` waits for the action, the close
 * button, or an explicit `hide()`.
 */
export type SnackbarDuration = 'short' | 'long' | 'indefinite' | number

/** Why a snackbar went away — passed to the per-snackbar `onDismiss`. */
export type SnackbarDismissReason =
  | 'timeout'
  | 'action'
  | 'close'
  | 'replaced'
  | 'manual'

export interface SnackbarOptions {
  /** The message. One line where possible, two at most per MD3. */
  message: string
  /** Label for the single trailing action. */
  actionLabel?: string
  /** Called when the action is pressed. The snackbar dismisses afterwards. */
  onAction?: () => void
  /**
   * Visible duration.
   * @default 'short' — or `'indefinite'` when `actionLabel` is set, since an
   * action the user never sees is worse than one that waits.
   */
  duration?: SnackbarDuration
  /**
   * Show a trailing close button. Required reading for an `'indefinite'`
   * snackbar with no action — otherwise there is no way out.
   * @default false
   */
  showCloseIcon?: boolean
  /** Icon for the close button. @default 'close' */
  closeIcon?: IconSource
  /** Screen-reader label for the close button. @default 'Dismiss' */
  closeAccessibilityLabel?: string
  /** Called once the snackbar leaves, with the reason it left. */
  onDismiss?: (reason: SnackbarDismissReason) => void
  /** Override the container color. @default theme.colors.inverseSurface */
  containerColor?: string
  /** Override the message color. @default theme.colors.inverseOnSurface */
  contentColor?: string
  /** Override the action label color. @default theme.colors.inversePrimary */
  actionColor?: string
  /**
   * Replace the visible snackbar instead of queueing behind it. The replaced
   * one dismisses with reason `'replaced'`.
   * @default false
   */
  replace?: boolean
}

/** Identifier returned by `show()`, accepted by `hide()`. */
export type SnackbarId = number

export interface SnackbarApi {
  /** Enqueue a snackbar. Returns its id. */
  show: (options: SnackbarOptions) => SnackbarId
  /**
   * Dismiss the visible snackbar, or a specific one by id — including one
   * still waiting in the queue.
   */
  hide: (id?: SnackbarId) => void
  /** Dismiss the visible snackbar and drop everything queued behind it. */
  clear: () => void
}

/**
 * Deliberately does NOT extend `ViewProps`. `SnackbarProvider` is a provider,
 * not a view: it renders `children` plus an imperative host, so there is no
 * root node for RN props to address. `style` here targets the snackbar surface.
 */
export interface SnackbarProviderProps {
  children: ReactNode
  /**
   * Extra space below the snackbar, on top of the safe-area bottom inset.
   * Set this to clear a FAB or a bottom navigation bar.
   * @default 0
   */
  bottomOffset?: number
  /** Style applied to the snackbar surface. */
  style?: StyleProp<ViewStyle>
}

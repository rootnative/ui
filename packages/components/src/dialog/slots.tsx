import { useIconResolver, useTheme } from '@rootnative/core'
import { renderIcon } from '@rootnative/utils'
import { isValidElement, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useDialogContext } from './context'
import { DIALOG_ICON_SIZE, createDialogStyles } from './styles'
import type {
  DialogActionsProps,
  DialogContentProps,
  DialogIconProps,
  DialogTitleProps,
} from './types'

/**
 * Slot kinds Dialog routes on. Tagged on the component function rather than
 * matched by reference so the CLI's flattened copies keep working after the
 * import rewrite.
 */
export type DialogSlotKind = 'icon' | 'title' | 'content' | 'actions'

interface SlotTag {
  dialogSlot?: DialogSlotKind
}

export function slotKindOf(node: ReactNode): DialogSlotKind | null {
  if (!isValidElement(node)) return null
  const type = node.type as SlotTag | string
  if (typeof type === 'string') return null
  return type.dialogSlot ?? null
}

export function DialogIcon({ icon, color, size, style }: DialogIconProps) {
  const { variant } = useDialogContext('Dialog.Icon')
  const theme = useTheme()
  const resolver = useIconResolver()
  const styles = useMemo(
    () => createDialogStyles(theme, variant),
    [theme, variant],
  )

  const node = renderIcon(
    icon,
    {
      // MD3 `DialogTokens.IconColor` is `secondary`.
      size: size ?? DIALOG_ICON_SIZE,
      color: color ?? theme.colors.secondary,
    },
    resolver,
  )

  return (
    <View aria-hidden style={[styles.icon, style]}>
      {node}
    </View>
  )
}
DialogIcon.dialogSlot = 'icon' satisfies DialogSlotKind

export function DialogTitle({ children, color, style }: DialogTitleProps) {
  const { variant, hasIcon } = useDialogContext('Dialog.Title')
  const theme = useTheme()
  const styles = useMemo(
    () => createDialogStyles(theme, variant),
    [theme, variant],
  )

  const colorStyle = useMemo(() => (color ? { color } : undefined), [color])

  return (
    <Text
      role="heading"
      style={[
        styles.title,
        variant === 'fullscreen' ? styles.fullscreenTitle : undefined,
        hasIcon && variant === 'basic' ? styles.titleCentered : undefined,
        colorStyle,
        style,
      ]}
      numberOfLines={variant === 'fullscreen' ? 1 : undefined}
    >
      {children}
    </Text>
  )
}
DialogTitle.dialogSlot = 'title' satisfies DialogSlotKind

export function DialogContent({ children, color, style }: DialogContentProps) {
  const { variant, contentIsFlush } = useDialogContext('Dialog.Content')
  const theme = useTheme()
  const styles = useMemo(
    () => createDialogStyles(theme, variant),
    [theme, variant],
  )

  const textStyle = useMemo(
    () => [styles.supportingText, color ? { color } : undefined],
    [styles.supportingText, color],
  )

  const isPlainText =
    typeof children === 'string' || typeof children === 'number'

  return (
    <View
      style={[
        styles.content,
        contentIsFlush ? styles.contentFlush : undefined,
        style,
      ]}
    >
      {isPlainText ? <Text style={textStyle}>{children}</Text> : children}
    </View>
  )
}
DialogContent.dialogSlot = 'content' satisfies DialogSlotKind

export function DialogActions({ children, style }: DialogActionsProps) {
  const { variant } = useDialogContext('Dialog.Actions')
  const theme = useTheme()
  const styles = useMemo(
    () => createDialogStyles(theme, variant),
    [theme, variant],
  )

  return <View style={[styles.actions, style]}>{children}</View>
}
DialogActions.dialogSlot = 'actions' satisfies DialogSlotKind

import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'
import { Button } from '../button'
import { IconButton } from '../icon-button'
import type { SnackbarEntry } from './store'
import {
  createSnackbarStyles,
  resolveActionColor,
  resolveContentColor,
} from './styles'

interface SnackbarSurfaceProps {
  entry: SnackbarEntry
  bottomOffset: number
  style?: StyleProp<ViewStyle>
  onAction: () => void
  onClose: () => void
}

export function SnackbarSurface({
  entry,
  bottomOffset,
  style,
  onAction,
  onClose,
}: SnackbarSurfaceProps) {
  const theme = useTheme()
  const actionLabel = entry.actionLabel
  const showClose = entry.showCloseIcon === true
  const hasTrailing = actionLabel !== undefined || showClose

  const styles = useMemo(
    () =>
      createSnackbarStyles(
        theme,
        bottomOffset,
        hasTrailing,
        entry.containerColor,
        entry.contentColor,
        entry.actionColor,
      ),
    [
      theme,
      bottomOffset,
      hasTrailing,
      entry.containerColor,
      entry.contentColor,
      entry.actionColor,
    ],
  )

  const actionColor = resolveActionColor(theme, entry.actionColor)
  const closeColor = resolveContentColor(theme, entry.contentColor)

  return (
    <View
      style={[styles.container, style]}
      // Announced on mount without stealing focus, which is the whole point of
      // a snackbar — it informs, it does not interrupt.
      role="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.message} numberOfLines={2}>
        {entry.message}
      </Text>

      {hasTrailing ? (
        <View style={styles.trailing}>
          {actionLabel !== undefined ? (
            <Button
              variant="text"
              contentColor={actionColor}
              onPress={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
          {showClose ? (
            <IconButton
              variant="standard"
              size="s"
              icon={entry.closeIcon ?? 'close'}
              contentColor={closeColor}
              accessibilityLabel={entry.closeAccessibilityLabel ?? 'Dismiss'}
              onPress={onClose}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

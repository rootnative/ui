import { resolveLogicalKey } from '@rootnative/utils'
import { useEffect, useMemo } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { AccessibilityInfo, Platform, Text, View } from 'react-native'
import { Button } from '../button'
import { IconButton } from '../icon-button'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import type { SnackbarEntry } from './store'
import {
  containerInsetStyle,
  createSnackbarStyles,
  resolveActionColor,
  resolveContentColor,
  trailingGapStyle,
} from './styles'

interface SnackbarSurfaceProps {
  entry: SnackbarEntry
  bottomOffset: number
  style?: StyleProp<ViewStyle>
  onAction: () => void
  onClose: () => void
  onHoverChange: (hovered: boolean) => void
}

export function SnackbarSurface({
  entry,
  bottomOffset,
  style,
  onAction,
  onClose,
  onHoverChange,
}: SnackbarSurfaceProps) {
  const theme = useMaterialTheme()
  const actionLabel = entry.actionLabel
  const showClose = entry.showCloseIcon === true
  const hasTrailing = actionLabel !== undefined || showClose

  const styles = useMemo(
    () =>
      createSnackbarStyles(
        theme,
        bottomOffset,
        entry.containerColor,
        entry.contentColor,
        entry.actionColor,
      ),
    [
      theme,
      bottomOffset,
      entry.containerColor,
      entry.contentColor,
      entry.actionColor,
    ],
  )

  // Keys resolved on each render, not in a memo, so the one-sided styles
  // follow a runtime change of the document `dir` on the web.
  const paddingStartKey = resolveLogicalKey('paddingStart')
  const paddingEndKey = resolveLogicalKey('paddingEnd')
  const marginStartKey = resolveLogicalKey('marginStart')
  const containerStyle = useMemo(
    () => [
      styles.container,
      containerInsetStyle(theme, paddingStartKey, paddingEndKey, hasTrailing),
      style,
    ],
    [
      styles.container,
      theme,
      paddingStartKey,
      paddingEndKey,
      hasTrailing,
      style,
    ],
  )
  const trailingStyle = useMemo(
    () => [styles.trailing, trailingGapStyle(theme, marginStartKey)],
    [styles.trailing, theme, marginStartKey],
  )

  const actionColor = resolveActionColor(theme, entry.actionColor)
  const closeColor = resolveContentColor(theme, entry.contentColor)

  // `accessibilityLiveRegion` is Android-only and `role="alert"` is a live
  // region on the web, so iOS is the one platform where a mounted snackbar
  // says nothing. VoiceOver needs an explicit announcement. Keyed on the id so
  // a replacement speaks again.
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    AccessibilityInfo.announceForAccessibility(entry.message)
  }, [entry.id, entry.message])

  return (
    <View
      style={containerStyle}
      // Announced on mount without stealing focus, which is the whole point of
      // a snackbar — it informs, it does not interrupt.
      role="alert"
      accessibilityLiveRegion="polite"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
    >
      <Text style={styles.message} numberOfLines={2}>
        {entry.message}
      </Text>

      {hasTrailing ? (
        <View style={trailingStyle}>
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
              size="small"
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

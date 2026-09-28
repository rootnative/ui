import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { pointerEvents } from '../internal/pointerEvents'
import { createStyles } from './styles'
import type { BadgeProps } from './types'

export const BADGE_MAX_DEFAULT = 999

export function formatBadgeLabel(
  label: string | number | undefined,
  max: number,
): string | undefined {
  if (label === undefined) return undefined
  if (typeof label === 'string') return label
  if (!Number.isFinite(label)) return String(label)
  if (label > max) return `${max}+`
  return String(label)
}

export function Badge({
  label,
  max = BADGE_MAX_DEFAULT,
  visible = true,
  children,
  containerColor,
  contentColor,
  style,
  wrapperStyle,
  accessibilityLabel,
  testID,
  ...props
}: BadgeProps) {
  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])

  const text = formatBadgeLabel(label, max)
  const isLarge = text !== undefined
  const hasAnchor = children !== undefined && children !== null

  const colorStyle = useMemo(
    () => ({ backgroundColor: containerColor ?? theme.colors.error }),
    [containerColor, theme.colors.error],
  )
  const labelStyle = useMemo(
    () => [styles.label, { color: contentColor ?? theme.colors.onError }],
    [styles.label, contentColor, theme.colors.onError],
  )

  const badge = visible ? (
    <View
      {...props}
      accessible={accessibilityLabel !== undefined || undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.badge,
        isLarge ? styles.large : styles.small,
        colorStyle,
        hasAnchor
          ? isLarge
            ? styles.anchoredLarge
            : styles.anchoredSmall
          : undefined,
        style,
        hasAnchor ? pointerEvents.none : undefined,
      ]}
    >
      {isLarge ? (
        <Text style={labelStyle} numberOfLines={1} allowFontScaling={false}>
          {text}
        </Text>
      ) : null}
    </View>
  ) : null

  if (!hasAnchor) return badge

  return (
    <View
      style={[styles.wrapper, wrapperStyle]}
      testID={testID === undefined ? undefined : `${testID}-wrapper`}
    >
      {children}
      {badge === null ? null : (
        <View style={[styles.anchorPoint, pointerEvents.none]}>{badge}</View>
      )}
    </View>
  )
}

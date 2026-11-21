import { resolveLogicalKey } from '@rootnative/utils'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { pointerEvents } from '../internal/pointerEvents'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import {
  anchorPointEndStyle,
  anchoredOffsetStyle,
  createStyles,
} from './styles'
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
  const theme = useMaterialTheme()
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
  // Keys resolved on each render, not in a memo, so the badge follows a
  // runtime change of the document `dir` on the web.
  const startKey = resolveLogicalKey('start')
  const endKey = resolveLogicalKey('end')
  const anchoredOffset = useMemo(
    () => anchoredOffsetStyle(startKey, isLarge),
    [startKey, isLarge],
  )
  const anchorPointStyle = useMemo(
    () => [styles.anchorPoint, anchorPointEndStyle(endKey), pointerEvents.none],
    [styles.anchorPoint, endKey],
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
        hasAnchor ? anchoredOffset : undefined,
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
      {badge === null ? null : <View style={anchorPointStyle}>{badge}</View>}
    </View>
  )
}

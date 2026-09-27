import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

/**
 * MD3 badge metrics.
 * Source: androidx.compose.material3 BadgeTokens + Badge.kt —
 * `Size = 6.dp`, `LargeSize = 16.dp`, `Shape / LargeShape = CornerFull`,
 * `Color / LargeColor = error`, `LargeLabelTextColor = onError`,
 * `LargeLabelTextFont = LabelSmall`,
 * `BadgeWithContentHorizontalPadding = 4.dp`,
 * `BadgeWithContentHorizontalOffset = 12.dp`,
 * `BadgeWithContentVerticalOffset = 14.dp`, `BadgeOffset = 6.dp`.
 *
 * `BadgedBox` places the badge at
 * `x = anchorWidth - horizontalOffset`, `y = -badgeHeight + verticalOffset`.
 * The same geometry is expressed here without a measure: `start: '100%'`
 * is the anchor's end edge, and a negative `marginStart` pulls the badge
 * back by the offset.
 */
export const BADGE_SMALL_SIZE = 6
export const BADGE_LARGE_SIZE = 16
export const BADGE_LARGE_HORIZONTAL_PADDING = 4
export const BADGE_SMALL_OFFSET = 6
export const BADGE_LARGE_HORIZONTAL_OFFSET = 12
export const BADGE_LARGE_VERTICAL_OFFSET = 14

export function createStyles(theme: MaterialTheme) {
  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start',
    },
    badge: {
      borderRadius: theme.shape.cornerFull,
      alignItems: 'center',
      justifyContent: 'center',
    },
    small: {
      width: BADGE_SMALL_SIZE,
      height: BADGE_SMALL_SIZE,
    },
    large: {
      minWidth: BADGE_LARGE_SIZE,
      height: BADGE_LARGE_SIZE,
      paddingHorizontal: BADGE_LARGE_HORIZONTAL_PADDING,
    },
    anchoredSmall: {
      position: 'absolute',
      top: 0,
      start: '100%',
      marginStart: -BADGE_SMALL_OFFSET,
    },
    anchoredLarge: {
      position: 'absolute',
      top: -BADGE_LARGE_SIZE + BADGE_LARGE_VERTICAL_OFFSET,
      start: '100%',
      marginStart: -BADGE_LARGE_HORIZONTAL_OFFSET,
    },
    label: {
      ...theme.typography.labelSmall,
      // The pill is exactly one line tall. A line height taller than the
      // pill pushes the glyph off centre on Android.
      lineHeight: BADGE_LARGE_SIZE,
      includeFontPadding: false,
      textAlign: 'center',
    },
  })
}

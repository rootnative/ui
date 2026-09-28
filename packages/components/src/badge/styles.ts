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
 * The same geometry is expressed here without a measure: `anchorPoint` is a
 * zero-size node at the anchor's top-end corner, and the badge inside it
 * takes a negative `start` equal to the offset.
 *
 * Do not put the badge directly in the wrapper with `start: '100%'`. React
 * Native runs Yoga with its classic errata, which resolves a percentage
 * inset against the width the parent offers, not the wrapper's final width:
 * in the 56dp NavigationBar pill the badge landed 32dp to the right of a
 * 24dp icon. Yoga also caps an absolute child in a column at its containing
 * block's width, which cut `999+` to `99…` on a 24dp anchor. A trailing inset
 * resolves against the final width, and a zero-width row imposes no cap.
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
    anchorPoint: {
      position: 'absolute',
      top: 0,
      end: 0,
      flexDirection: 'row',
    },
    anchoredSmall: {
      position: 'absolute',
      top: 0,
      start: -BADGE_SMALL_OFFSET,
    },
    anchoredLarge: {
      position: 'absolute',
      top: -BADGE_LARGE_SIZE + BADGE_LARGE_VERTICAL_OFFSET,
      start: -BADGE_LARGE_HORIZONTAL_OFFSET,
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

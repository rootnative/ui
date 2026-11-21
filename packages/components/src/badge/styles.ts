import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'

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
    // `anchorPointEndStyle` and `anchoredOffsetStyle` give the end and start
    // insets.
    anchorPoint: {
      position: 'absolute',
      top: 0,
      flexDirection: 'row',
    },
    anchoredSmall: {
      position: 'absolute',
      top: 0,
    },
    anchoredLarge: {
      position: 'absolute',
      top: -BADGE_LARGE_SIZE + BADGE_LARGE_VERTICAL_OFFSET,
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

// The one-sided insets take style keys that the caller resolves against the
// layout direction on each render. react-native-web resolves a logical key,
// such as `start`, as LTR under `<html dir="rtl">`, also in a
// `StyleSheet.create` style.

/** Puts the anchor point at the top-end corner of the anchor. */
export function anchorPointEndStyle(endKey: string): ViewStyle {
  return { [endKey]: 0 }
}

/**
 * The negative start inset that pulls the badge back over the anchor's
 * corner. A `StyleSheet` style, as before, so a consumer `style` keeps its
 * precedence on the web: react-native-web puts an inline key above each of
 * its classes.
 */
export function anchoredOffsetStyle(
  startKey: string,
  isLarge: boolean,
): ViewStyle {
  return StyleSheet.create({
    offset: {
      [startKey]: isLarge
        ? -BADGE_LARGE_HORIZONTAL_OFFSET
        : -BADGE_SMALL_OFFSET,
    },
  }).offset
}

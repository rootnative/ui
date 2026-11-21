import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'

/**
 * MD3 `DividerTokens.Thickness` — 1dp.
 * Source: androidx.compose.material3.tokens.DividerTokens
 */
export const DIVIDER_THICKNESS = 1

/**
 * MD3 list inset: 16dp leading padding + 24dp leading icon + 16dp gap, so the
 * divider starts where the list item headline starts.
 */
export const DIVIDER_LIST_INSET = 56

export function createDividerStyles(
  theme: MaterialTheme,
  insetStart: number,
  insetEnd: number,
  thickness: number,
  containerColor?: string,
) {
  // MD3 `DividerDefaults.color` is `outlineVariant`.
  const color = containerColor ?? theme.colors.outlineVariant

  return StyleSheet.create({
    // `horizontalInsetStyle` gives the start and end insets.
    horizontal: {
      height: thickness,
      backgroundColor: color,
    },
    vertical: {
      width: thickness,
      // Fill the cross-axis of the row that contains it, regardless of the
      // parent's `alignItems`.
      alignSelf: 'stretch',
      marginTop: insetStart,
      marginBottom: insetEnd,
      backgroundColor: color,
    },
  })
}

/**
 * The start and end insets of a horizontal divider. The caller resolves the
 * keys against the layout direction on each render: react-native-web resolves
 * a logical key, such as `marginStart`, as LTR under `<html dir="rtl">`, also
 * in a `StyleSheet.create` style. A `StyleSheet` style, as before, so a
 * consumer `style` keeps its precedence on the web.
 */
export function horizontalInsetStyle(
  startKey: string,
  endKey: string,
  insetStart: number,
  insetEnd: number,
): ViewStyle {
  return StyleSheet.create({
    inset: { [startKey]: insetStart, [endKey]: insetEnd },
  }).inset
}

import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { Platform, StyleSheet } from 'react-native'

// RN-Web only: the focus ring and the focus state layer are the focus signal,
// so the browser's own rectangle inside the pill is noise. RN's types do not
// admit 'none', so we cast — RN-Web translates the string to CSS.
const webOutlineReset =
  Platform.OS === 'web' ? { outlineStyle: 'none' as 'solid' } : null

export const SEARCH_BAR_HEIGHT = 56
export const SEARCH_BAR_MAX_WIDTH = 720
export const SEARCH_BAR_ICON_SIZE = 24
export const SEARCH_BAR_FOCUS_RING_OFFSET = 2
export const SEARCH_BAR_FOCUS_RING_WIDTH = 3
// The frame of an `IconButton` at size 's'. A static leading icon sits in a
// frame of the same size, so the text starts at 56 dp in both cases.
const SLOT_SIZE = 40

export function createStyles(theme: MaterialTheme) {
  const bodyLarge = theme.typography.bodyLarge
  const disabledContent = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledOpacity,
  )

  // A disabled bar keeps its container color: only the content drops to 38%
  // `onSurface` (Compose `SearchBarDefaults.inputFieldColors`).
  const colors = {
    container: theme.colors.surfaceContainerHigh,
    leadingIcon: theme.colors.onSurface,
    trailingIcon: theme.colors.onSurfaceVariant,
    inputText: theme.colors.onSurface,
    placeholder: theme.colors.onSurfaceVariant,
    disabledContent,
    stateLayerContent: theme.colors.onSurface,
  }

  const focusRingInset = -(
    SEARCH_BAR_FOCUS_RING_OFFSET + SEARCH_BAR_FOCUS_RING_WIDTH
  )

  return {
    colors,
    styles: StyleSheet.create({
      root: {
        alignSelf: 'stretch',
        maxWidth: SEARCH_BAR_MAX_WIDTH,
      },
      pressableReset: { ...webOutlineReset },
      container: {
        height: SEARCH_BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.shape.cornerFull,
        paddingHorizontal: theme.spacing.sm,
      },
      slot: {
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      },
      trailing: {
        minWidth: SLOT_SIZE,
        height: SLOT_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      },
      input: {
        flex: 1,
        alignSelf: 'stretch',
        marginHorizontal: theme.spacing.sm,
        marginVertical: 0,
        fontFamily: bodyLarge.fontFamily,
        fontSize: bodyLarge.fontSize,
        // No `lineHeight`: on iOS a single-line `TextInput` with a line
        // height draws its text below the vertical center of the bar.
        fontWeight: bodyLarge.fontWeight,
        letterSpacing: bodyLarge.letterSpacing,
        color: colors.inputText,
        paddingVertical: 0,
        paddingHorizontal: 0,
        includeFontPadding: false,
        ...webOutlineReset,
      },
      inputDisabled: {
        color: disabledContent,
      },
      // Takes the input's place in the row while the bar is a button.
      triggerFrame: {
        flex: 1,
        alignSelf: 'stretch',
        flexDirection: 'row',
      },
      focusRing: {
        position: 'absolute',
        top: focusRingInset,
        start: focusRingInset,
        end: focusRingInset,
        bottom: focusRingInset,
        borderRadius: theme.shape.cornerFull,
        borderWidth: SEARCH_BAR_FOCUS_RING_WIDTH,
        borderColor: theme.colors.secondary,
      },
    }),
  }
}

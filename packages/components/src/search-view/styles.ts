import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import { webOutlineReset } from '../internal/focusOutline'
import { SEARCH_BAR_MAX_WIDTH } from '../search-bar/styles'

/**
 * MD3 search view metrics.
 * Source: androidx.compose.material3.tokens.SearchViewTokens v0_210 +
 * SearchBar.kt — `ContainerColor = surfaceContainerHigh`,
 * `DividerColor = outline`, `HeaderContainerHeight = 72.dp`,
 * `HeaderInputTextFont = bodyLarge`, `HeaderLeadingIconColor = onSurface`,
 * `HeaderTrailingIconColor = onSurfaceVariant`,
 * `HeaderSupportingTextColor = onSurfaceVariant`,
 * `FullScreenContainerShape = CornerNone`,
 * `DockedContainerShape = CornerExtraLarge`,
 * `DockedActiveTableMinHeight = 240.dp`, docked maximum height two thirds
 * of the window, `SearchBarDefaults.ShadowElevation = Level0` for both.
 */
export const SEARCH_VIEW_HEADER_HEIGHT = 72
export const SEARCH_VIEW_DOCKED_MIN_HEIGHT = 240
export const SEARCH_VIEW_DOCKED_MAX_WIDTH = SEARCH_BAR_MAX_WIDTH
/** Distance the surface travels on enter and exit. */
export const SEARCH_VIEW_SLIDE = 24
// The frame of an `IconButton` at size 'small', the same as the bar's slots.
const SLOT_SIZE = 40

export function createStyles(theme: MaterialTheme, containerColor?: string) {
  const bodyLarge = theme.typography.bodyLarge

  const colors = {
    container: containerColor ?? theme.colors.surfaceContainerHigh,
    leadingIcon: theme.colors.onSurface,
    trailingIcon: theme.colors.onSurfaceVariant,
    inputText: theme.colors.onSurface,
    placeholder: theme.colors.onSurfaceVariant,
    divider: theme.colors.outline,
  }

  return {
    colors,
    styles: StyleSheet.create({
      // Absolute-fills the portal layer. A docked view leaves the screen
      // behind it visible and closes on a press there; a full-screen view
      // covers it, so the layer takes no pointer events.
      layer: {
        ...StyleSheet.absoluteFill,
      },
      dismissArea: {
        ...StyleSheet.absoluteFill,
      },
      fullscreenLayer: {
        ...StyleSheet.absoluteFill,
      },
      fullscreenSurface: {
        flex: 1,
        backgroundColor: colors.container,
      },
      // The fallback for a docked view with no anchor: top of the layer,
      // centered, at the bar's maximum width.
      dockedLayer: {
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
        alignItems: 'center',
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
      },
      dockedFallback: {
        width: '100%',
        alignItems: 'center',
      },
      dockedSurface: {
        width: '100%',
        maxWidth: SEARCH_VIEW_DOCKED_MAX_WIDTH,
        minHeight: SEARCH_VIEW_DOCKED_MIN_HEIGHT,
        borderRadius: theme.shape.cornerExtraLarge,
        backgroundColor: colors.container,
        overflow: 'hidden',
      },
      // `accessibilityRole="search"` on the header, so the row is a `search`
      // landmark on web, the same as the bar.
      header: {
        height: SEARCH_VIEW_HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
      },
      slot: {
        width: SLOT_SIZE,
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
        // height draws its text below the vertical center of the header.
        fontWeight: bodyLarge.fontWeight,
        letterSpacing: bodyLarge.letterSpacing,
        color: colors.inputText,
        paddingVertical: 0,
        paddingHorizontal: 0,
        includeFontPadding: false,
        ...webOutlineReset,
      },
      fullscreenBody: {
        flex: 1,
      },
      // No `flexGrow` with a zero basis here: Yoga gives such a child no
      // intrinsic height, so a docked surface would stay at its minimum
      // height and cut the list. The body takes its content height, and
      // shrinks so a scrollable child scrolls inside the maximum height.
      dockedBody: {
        flexShrink: 1,
        minHeight: 0,
      },
    }),
  }
}

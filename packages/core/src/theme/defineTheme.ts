import type { BaseTheme } from './types'

/**
 * Identity function that validates a custom theme object against `BaseTheme`.
 * Provides type-checking and autocompletion when creating themes for custom design systems.
 *
 * @example
 * const myTheme = defineTheme({
 *   colors: { brand: '#FF6B00', background: '#FFFFFF', text: '#1A1A1A' },
 *   typography: { heading: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: 0 } },
 *   shape: { roundness: 1, cornerNone: 0, cornerExtraSmall: 4, cornerSmall: 8, cornerMedium: 12, cornerLarge: 16, cornerExtraLarge: 28, cornerFull: 999 },
 *   spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
 *   stateLayer: { pressedOpacity: 0.1, focusedOpacity: 0.1, hoveredOpacity: 0.08, draggedOpacity: 0.16, disabledOpacity: 0.38, disabledContainerOpacity: 0.12 },
 *   elevation: { ... },
 *   motion: { ... },
 * })
 */
export function defineTheme<T extends BaseTheme>(theme: T): T {
  return theme
}

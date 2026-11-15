import type { BaseTheme } from './types'

/**
 * Identity function that validates a theme object against `BaseTheme`.
 * Provides type-checking and autocompletion for a theme with your own roles.
 *
 * A theme with your own role names is for your own components. The
 * components of `@rootnative/components` read the MD3 roles, so they need a
 * theme that keeps them: spread `lightTheme`, and add your tokens beside it.
 *
 * @example
 * // Your own roles, for your own components
 * const myTheme = defineTheme({
 *   colors: { brand: '#FF6B00', background: '#FFFFFF', text: '#1A1A1A' },
 *   typography: { heading: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: 0 } },
 *   radius: { control: 8, card: 16 },
 * })
 *
 * @example
 * // The MD3 roles plus your own tokens, for the library components too
 * const appTheme = defineTheme({
 *   ...lightTheme,
 *   status: { success: '#388E3C', onSuccess: '#FFFFFF' },
 * })
 */
export function defineTheme<T extends BaseTheme>(theme: T): T {
  return theme
}

import { darkTheme } from '../theme/dark'
import { lightTheme } from '../theme/light'
import { defaultTopAppBarTokens } from '../theme/topAppBar'

/**
 * Material Design 3 preset — groups all MD3-specific theme values.
 *
 * @example
 * import { material } from '@rootnative/core'
 *
 * <ThemeProvider theme={material.darkTheme}>
 *   <App />
 * </ThemeProvider>
 */
export const material = {
  lightTheme,
  darkTheme,
  defaultTopAppBarTokens,
} as const

import { useContext } from 'react'
import { ThemeModeContext } from './ThemeModeContext'
import type { ThemeModeContextValue } from './ThemeModeContext'

/**
 * Reads and controls the light/dark mode of the nearest `ThemeProvider`.
 *
 * Requires a provider configured with a theme *pair* — `theme={{ light, dark }}`.
 * A provider given a single theme has no mode to report, so this throws rather
 * than inventing one.
 *
 * @example
 * const { mode, scheme, setMode } = useThemeMode()
 *
 * <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
 * <Button onPress={() => setMode(scheme === 'dark' ? 'light' : 'dark')} />
 */
export function useThemeMode(): ThemeModeContextValue {
  const value = useContext(ThemeModeContext)

  if (value === null) {
    throw new Error(
      'useThemeMode() requires a <ThemeProvider theme={{ light, dark }}>. ' +
        'A provider with a single theme has no light/dark mode to control.',
    )
  }

  return value
}

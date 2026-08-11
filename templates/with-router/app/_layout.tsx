import {
  ThemeProvider,
  darkTheme,
  lightTheme,
  useThemeMode,
} from '@rootnative/core'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

/**
 * Keeps the status bar readable against the current theme. `scheme` is the
 * resolved 'light' | 'dark' — `mode` may be 'system', which tells you what was
 * asked for rather than what is on screen.
 */
function ThemedStatusBar() {
  const { scheme } = useThemeMode()

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
}

export default function RootLayout() {
  return (
    // Follows the OS light/dark setting. Call `setMode()` from `useThemeMode()`
    // to override it, and pass `storage={AsyncStorage}` to remember the choice.
    <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
      <Stack screenOptions={{ headerShown: false }} />
      <ThemedStatusBar />
    </ThemeProvider>
  )
}

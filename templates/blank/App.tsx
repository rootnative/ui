import { Box, Column, Typography, Card } from '@rootnative/components'
import { PortalHost } from '@rootnative/components/portal'
import {
  ThemeProvider,
  darkTheme,
  lightTheme,
  useTheme,
  useThemeMode,
} from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'

function HomeScreen() {
  const theme = useTheme()

  return (
    <Box
      flex={1}
      align="center"
      justify="center"
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Column gap="lg" style={styles.content}>
        <Column gap="sm">
          <Typography variant="headlineMedium">
            Welcome to RootNative
          </Typography>
          <Typography
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Material Design 3 components for React Native
          </Typography>
        </Column>

        <Card variant="filled">
          <Column px="lg" py="lg" gap="md">
            <Typography variant="titleMedium">Get Started</Typography>
            <Typography
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Edit App.tsx to start building your app.
            </Typography>
          </Column>
        </Card>
      </Column>
    </Box>
  )
}

/**
 * Keeps the status bar readable against the current theme. `scheme` is the
 * resolved 'light' | 'dark' — `mode` may be 'system', which tells you what was
 * asked for rather than what is on screen.
 */
function ThemedStatusBar() {
  const { scheme } = useThemeMode()

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
}

export default function App() {
  return (
    // Follows the OS light/dark setting. Call `setMode()` from `useThemeMode()`
    // to override it, and pass `storage={AsyncStorage}` to remember the choice.
    <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
      {/*
        PortalHost is required by BottomSheet, Dialog, Snackbar, Menu and
        Tooltip — without it they render nothing at all. Keep it wrapping the
        app content, because a host inside a screen cannot paint above it.
      */}
      <PortalHost>
        <HomeScreen />
      </PortalHost>
      <ThemedStatusBar />
    </ThemeProvider>
  )
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 16,
  },
})

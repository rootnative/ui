import { AppBar, Layout } from '@rootnative/components'
import type { AppBarAction } from '@rootnative/components'
import {
  ThemeProvider,
  darkTheme,
  lightTheme,
  useTheme,
} from '@rootnative/core'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Updates from 'expo-updates'
import { useCallback, useMemo, useState } from 'react'
import { Alert, I18nManager, Platform, useColorScheme } from 'react-native'

// Restore persisted RTL preference on web before first render
if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
  try {
    const stored = localStorage.getItem('forceRTL')
    if (stored === 'true') {
      I18nManager.allowRTL(true)
      I18nManager.forceRTL(true)
    }
  } catch {
    // Ignore storage errors (SSR, private browsing, etc.)
  }
}

function resolveRouteName(segments: string[]): string {
  const visibleSegments = segments.filter((segment) => !segment.startsWith('('))
  const currentSegment = visibleSegments[visibleSegments.length - 1]

  return currentSegment ?? 'index'
}

function resolveTitle(routeName: string): string {
  if (routeName === 'index') {
    return 'Home'
  }

  return routeName
    .replace(/^\[|\]$/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const stackScreenOptions = {
  headerShown: false,
} as const
type ThemePreference = 'system' | 'light' | 'dark'

function isDarkColor(color: string): boolean {
  const normalizedHex = color.replace('#', '')

  if (normalizedHex.length !== 6 && normalizedHex.length !== 8) {
    return false
  }

  const r = Number.parseInt(normalizedHex.slice(0, 2), 16)
  const g = Number.parseInt(normalizedHex.slice(2, 4), 16)
  const b = Number.parseInt(normalizedHex.slice(4, 6), 16)

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return false
  }

  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance < 0.5
}

async function toggleRTL() {
  const nextIsRTL = !I18nManager.isRTL
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(nextIsRTL)

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem('forceRTL', String(nextIsRTL))
    } catch {
      // Ignore storage errors
    }
    window.location.reload()
  } else {
    try {
      await Updates.reloadAsync()
    } catch {
      // reloadAsync is unavailable in Expo Go / dev builds
      Alert.alert(
        'Restart Required',
        `Layout direction set to ${nextIsRTL ? 'RTL' : 'LTR'}. Please restart the app to apply.`,
      )
    }
  }
}

interface RootLayoutContentProps {
  isDarkTheme: boolean
  onToggleTheme: () => void
}

function RootLayoutContent({
  isDarkTheme,
  onToggleTheme,
}: RootLayoutContentProps) {
  const theme = useTheme()
  const router = useRouter()
  const segments = useSegments()
  const routeName = useMemo(() => resolveRouteName(segments), [segments])
  const title = useMemo(() => resolveTitle(routeName), [routeName])
  const canGoBack = routeName !== 'index'
  const statusBarStyle = isDarkColor(theme.colors.surface) ? 'light' : 'dark'
  const appBarActions = useMemo<AppBarAction[]>(
    () => [
      {
        icon: I18nManager.isRTL
          ? 'format-pilcrow-arrow-left'
          : 'format-pilcrow-arrow-right',
        accessibilityLabel: I18nManager.isRTL
          ? 'Switch to LTR layout'
          : 'Switch to RTL layout',
        onPress: toggleRTL,
      },
      {
        icon: isDarkTheme ? 'white-balance-sunny' : 'weather-night',
        accessibilityLabel: isDarkTheme
          ? 'Switch to light theme'
          : 'Switch to dark theme',
        onPress: onToggleTheme,
      },
    ],
    [isDarkTheme, onToggleTheme],
  )

  return (
    <>
      <StatusBar
        animated={false}
        style={statusBarStyle}
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <Layout edges={['bottom']}>
        <AppBar
          elevated
          title={title}
          canGoBack={canGoBack}
          onBackPress={() =>
            router.canGoBack() ? router.back() : router.replace('/')
          }
          actions={appBarActions}
          insetTop
        />
        <Slot screenOptions={stackScreenOptions} />
      </Layout>
    </>
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [themePreference, setThemePreference] =
    useState<ThemePreference>('system')
  const isDarkTheme =
    themePreference === 'system'
      ? colorScheme === 'dark'
      : themePreference === 'dark'
  const theme = isDarkTheme ? darkTheme : lightTheme
  const toggleTheme = useCallback(() => {
    setThemePreference((currentPreference) => {
      const currentIsDark =
        currentPreference === 'system'
          ? colorScheme === 'dark'
          : currentPreference === 'dark'

      return currentIsDark ? 'light' : 'dark'
    })
  }, [colorScheme])

  return (
    <ThemeProvider theme={theme}>
      <RootLayoutContent
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />
    </ThemeProvider>
  )
}

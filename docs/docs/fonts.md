---
sidebar_position: 6
---

# Fonts

RootNative UI uses platform-default fonts out of the box — Roboto on Android, System (San Francisco) on iOS, and the system font stack on web. You can replace these with any custom font.

## Quick setup with createMaterialTheme

The easiest way to use a custom font is the `fontFamily` option on `createMaterialTheme`:

```tsx
import { createMaterialTheme } from '@rootnative/core/create-theme'
import { ThemeProvider } from '@rootnative/core'

const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter',
})

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      {/* All text uses Inter */}
    </ThemeProvider>
  )
}
```

This applies the font to all 15 MD3 typography styles (display, headline, title, body, label) at once.

## Loading fonts in Expo

Before using a custom font, you need to load it. Expo provides two approaches:

### Using expo-font (recommended)

```bash
npx expo install expo-font
```

```tsx
// app/_layout.tsx
import { useFonts } from 'expo-font'
import { Slot } from 'expo-router'
import { ThemeProvider } from '@rootnative/core'
import { createMaterialTheme } from '@rootnative/core/create-theme'

const { lightTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter',
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  })

  if (!fontsLoaded) return null

  return (
    <ThemeProvider theme={lightTheme}>
      <Slot />
    </ThemeProvider>
  )
}
```

### Using Google Fonts

```bash
npx expo install @expo-google-fonts/inter expo-font
```

```tsx
// app/_layout.tsx
import { useFonts, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter'
import { Slot } from 'expo-router'
import { ThemeProvider } from '@rootnative/core'
import { createMaterialTheme } from '@rootnative/core/create-theme'

const { lightTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter_400Regular',
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
  })

  if (!fontsLoaded) return null

  return (
    <ThemeProvider theme={lightTheme}>
      <Slot />
    </ThemeProvider>
  )
}
```

> **Note:** When using `@expo-google-fonts`, the `fontFamily` value must match the exact export name (e.g. `Inter_400Regular`, not `Inter`).

## Different fonts per weight

If your font files use separate family names per weight (common with Google Fonts), you can override individual typography styles:

```tsx
import { lightTheme } from '@rootnative/core'
import type { Theme } from '@rootnative/core'

const theme: Theme = {
  ...lightTheme,
  typography: {
    ...lightTheme.typography,
    // Display and headline styles use regular weight
    displayLarge: { ...lightTheme.typography.displayLarge, fontFamily: 'Inter_400Regular' },
    displayMedium: { ...lightTheme.typography.displayMedium, fontFamily: 'Inter_400Regular' },
    // Title and label styles use medium weight
    titleLarge: { ...lightTheme.typography.titleLarge, fontFamily: 'Inter_500Medium' },
    titleMedium: { ...lightTheme.typography.titleMedium, fontFamily: 'Inter_500Medium' },
    labelLarge: { ...lightTheme.typography.labelLarge, fontFamily: 'Inter_500Medium' },
  },
}
```

## Combining with other options

`fontFamily` works alongside other `createMaterialTheme` options:

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter',
  roundness: 0.5, // Slightly rounded corners
})
```

## Platform defaults

When no `fontFamily` is specified, RootNative UI uses:

| Platform | Default font |
|----------|-------------|
| Android | Roboto |
| iOS | System (San Francisco) |
| Web | System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`) |

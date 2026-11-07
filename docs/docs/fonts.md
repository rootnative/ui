---
sidebar_position: 6
description: Replace the platform-default font stack with any custom font, and map a family across the MD3 type scale.
---

# Fonts

Root Native UI uses the platform-default fonts by default: Roboto on Android, System (San Francisco) on iOS, and the system font stack on web. You can replace these with any custom font.

## Quick setup with createMaterialTheme

The easiest way to use a custom font is the `fontFamily` option of `createMaterialTheme`:

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

This applies the font to all 30 MD3 typography styles at once: the 15 base roles (display, headline, title, body, label) and their 15 emphasized counterparts.

## Loading fonts in Expo

Before you use a custom font, you need to load it. Expo gives you two ways:

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

> **Note:** With `@expo-google-fonts`, the `fontFamily` value must match the exact export name (for example `Inter_400Regular`, not `Inter`).

## Different fonts per weight

If your font files use a separate family name per weight (common with Google Fonts), you can override single typography styles:

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

`fontFamily` works together with the other `createMaterialTheme` options:

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter',
  roundness: 0.5, // Slightly rounded corners
})
```

## Platform defaults

When you set no `fontFamily`, Root Native UI uses:

| Platform | Default font |
|----------|-------------|
| Android | Roboto |
| iOS | System (San Francisco) |
| Web | System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`) |

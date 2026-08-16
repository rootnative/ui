import type { Typography } from './types'

const webFontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

// This module must not import `react-native` at the top level: the
// `create-theme` subpath reaches it, and that subpath has to stay importable
// from plain Node (scripts, CI, design-token pipelines), where react-native's
// Flow source cannot load. The environment sniff below replaces
// `Platform.select`, and no branch changes what renders: Android registers
// neither 'Roboto' nor 'System' as a family name, so both resolve through the
// unknown-family fallback to the same default typeface, and 'System' is the
// intended iOS value. The only value that must land exactly is the web font
// stack — including during static-export SSR, where no `document` exists and
// `process.env.EXPO_OS` is the signal.
declare const require: ((id: string) => unknown) | undefined
declare const process: { env?: { EXPO_OS?: string } } | undefined

function resolveDefaultFontFamily(): string {
  // Expo inlines EXPO_OS at build time; it is the only signal that survives
  // static-export SSR, where the web stack must win with no DOM present.
  if (typeof process !== 'undefined' && process.env?.EXPO_OS) {
    return process.env.EXPO_OS === 'web' ? webFontFamily : 'System'
  }
  try {
    // CJS environments (Jest, Node require chains) still get the real
    // Platform. Plain Node ESM has no `require` in scope and skips this.
    if (typeof require === 'function') {
      const { Platform } = require('react-native') as {
        Platform: {
          select: (spec: Record<string, string>) => string | undefined
        }
      }
      const selected = Platform.select({
        android: 'Roboto',
        ios: 'System',
        web: webFontFamily,
        default: 'System',
      })
      if (selected) return selected
    }
  } catch {
    // react-native is absent or cannot parse here — fall through.
  }
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'System'
  }
  // Web, static-export SSR, and plain Node all land here. The web stack is
  // the value that must be exact on web (SSR included, where no `document`
  // exists); in a Node script the string is inert data.
  return webFontFamily
}

const defaultFontFamily = resolveDefaultFontFamily()

export const defaultTypography: Typography = {
  displayLarge: {
    fontFamily: defaultFontFamily,
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: defaultFontFamily,
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: defaultFontFamily,
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: defaultFontFamily,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: defaultFontFamily,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: defaultFontFamily,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: defaultFontFamily,
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: defaultFontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  // MD3 Expressive emphasized styles — androidx TypeScaleTokens.kt v0_103.
  // Same size/line-height as the base style, weight one step heavier
  // (400→500, 500→700); displayLarge/titleMedium/bodyLarge/bodyMedium also
  // adjust tracking per the Compose tokens.
  displayLargeEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 57,
    fontWeight: '500',
    lineHeight: 64,
    letterSpacing: 0,
  },
  displayMediumEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 45,
    fontWeight: '500',
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmallEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLargeEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMediumEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmallEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLargeEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMediumEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmallEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLargeEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  bodyMediumEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmallEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLargeEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMediumEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmallEmphasized: {
    fontFamily: defaultFontFamily,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
}

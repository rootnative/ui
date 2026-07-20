import { MotionConfig } from '@rootnative/inertia'
import * as React from 'react'
import { lightTheme } from '../theme/light'
import { motionTransitions } from '../theme/motionAdapter'
import type { BaseTheme } from '../theme/types'
import { IconResolverContext } from './IconResolverContext'
import type { IconResolver } from './IconResolverContext'
import { ThemeContext } from './ThemeContext'

export interface ThemeProviderProps {
  /**
   * Theme object to provide to all child components via context.
   * Accepts any theme extending `BaseTheme` — Material, Apple, or custom.
   * @default lightTheme (Material Design 3)
   */
  theme?: BaseTheme
  /**
   * Resolves string icon names (e.g. `leadingIcon="check"`) to icon nodes.
   * Set this once at the app root to use SF Symbols, Lucide, custom SVGs,
   * etc. instead of the default `MaterialCommunityIcons`.
   *
   * @example
   * import { Check, ArrowRight } from 'lucide-react-native'
   *
   * const icons = { check: Check, 'arrow-right': ArrowRight }
   *
   * <ThemeProvider iconResolver={(name, { size, color }) => {
   *   const Icon = icons[name]
   *   return Icon ? <Icon size={size} color={color} /> : null
   * }}>
   *   <App />
   * </ThemeProvider>
   */
  iconResolver?: IconResolver
  /** Tree of components that will have access to the theme via `useTheme()`. */
  children: React.ReactNode
}

/**
 * Provides a theme to all child components via context.
 * Works with any design system — Material Design 3 or custom themes.
 * Defaults to the Material Design 3 light theme when no theme is provided.
 *
 * @example
 * // Material Design 3 (default)
 * import { ThemeProvider } from '@rootnative/core'
 *
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * @example
 * // Custom or Apple theme
 * import { ThemeProvider } from '@rootnative/core'
 *
 * <ThemeProvider theme={myTheme}>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  theme,
  iconResolver,
  children,
}: ThemeProviderProps) {
  const resolvedTheme = theme ?? lightTheme
  // Register the theme's motion tokens as inertia named transitions so any
  // descendant can reference them by name ('state-hover', 'spring-fast-
  // spatial', ...). MotionConfig defaults reducedMotion to 'user', so the OS
  // accessibility setting is respected app-wide for free. Consumers can nest
  // their own <MotionConfig> to add names or scope reduced motion — nested
  // providers merge, child wins.
  const transitions = React.useMemo(
    () => motionTransitions(resolvedTheme.motion),
    [resolvedTheme.motion],
  )
  return (
    <ThemeContext.Provider value={resolvedTheme}>
      <IconResolverContext.Provider value={iconResolver ?? null}>
        <MotionConfig transitions={transitions}>{children}</MotionConfig>
      </IconResolverContext.Provider>
    </ThemeContext.Provider>
  )
}

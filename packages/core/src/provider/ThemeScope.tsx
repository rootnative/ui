import { MotionConfig, useMotionConfig } from '@rootnative/inertia'
import type { MotionConfigValue } from '@rootnative/inertia'
import * as React from 'react'
import type { BaseTheme } from '../theme/types'
import { IconResolverContext } from './IconResolverContext'
import type { IconResolver } from './IconResolverContext'
import { ThemeContext } from './ThemeContext'
import { ThemeModeContext } from './ThemeModeContext'
import type { ThemeModeContextValue } from './ThemeModeContext'

/**
 * Everything a `ThemeProvider` gives its descendants, read at one place in
 * the tree so that it can be provided again at another. Treat it as opaque:
 * read it with `useThemeScope()` and hand it to `ThemeScopeProvider`.
 */
export interface ThemeScope {
  /** The resolved theme at the call site. */
  readonly theme: BaseTheme
  /** The mode value at the call site; `null` under a single-theme provider. */
  readonly mode: ThemeModeContextValue | null
  /** The icon resolver at the call site; `null` when none is set. */
  readonly iconResolver: IconResolver | null
  /** The merged motion config at the call site. */
  readonly motion: MotionConfigValue
}

/**
 * Reads the theme, the mode, the icon resolver and the motion config of the
 * nearest providers, as one value for `ThemeScopeProvider`.
 *
 * Use the pair when you render content at another place in the tree, for
 * example through a portal. The content then reads the theme of the place
 * where you wrote it, not the theme of the place where it renders.
 * `@rootnative/components` does this in `Portal`, so every overlay follows
 * the provider it is written under.
 *
 * @example
 * function MyPortal({ children }) {
 *   const scope = useThemeScope()
 *   return createPortal(
 *     <ThemeScopeProvider scope={scope}>{children}</ThemeScopeProvider>,
 *     host,
 *   )
 * }
 */
export function useThemeScope(): ThemeScope {
  const theme = React.useContext(ThemeContext)
  const mode = React.useContext(ThemeModeContext)
  const iconResolver = React.useContext(IconResolverContext)
  const motion = useMotionConfig()

  return React.useMemo(
    () => ({ theme, mode, iconResolver, motion }),
    [theme, mode, iconResolver, motion],
  )
}

export interface ThemeScopeProviderProps {
  /** The value that `useThemeScope()` returned at the place to copy. */
  scope: ThemeScope
  children: React.ReactNode
}

/**
 * Provides a `ThemeScope` to its descendants, as if the providers at the
 * place that read it stood here. A `ThemeProvider` below it inherits from it
 * the same way it inherits from a real parent provider.
 */
export function ThemeScopeProvider({
  scope,
  children,
}: ThemeScopeProviderProps) {
  return (
    <ThemeContext.Provider value={scope.theme}>
      <ThemeModeContext.Provider value={scope.mode}>
        <IconResolverContext.Provider value={scope.iconResolver}>
          <MotionConfig
            reducedMotion={scope.motion.reducedMotion}
            transitions={scope.motion.transitions}
          >
            {children}
          </MotionConfig>
        </IconResolverContext.Provider>
      </ThemeModeContext.Provider>
    </ThemeContext.Provider>
  )
}

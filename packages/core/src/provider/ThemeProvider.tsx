import { MotionConfig } from '@rootnative/inertia'
import * as React from 'react'
import { useColorScheme } from 'react-native'
import { lightTheme } from '../theme/light'
import { motionTransitions } from '../theme/motionAdapter'
import type { BaseTheme } from '../theme/types'
import { IconResolverContext } from './IconResolverContext'
import type { IconResolver } from './IconResolverContext'
import { ThemeContext } from './ThemeContext'
import { ThemeModeContext } from './ThemeModeContext'
import type {
  ColorScheme,
  ThemeMode,
  ThemeModeContextValue,
  ThemeModeStorage,
} from './ThemeModeContext'

/**
 * A light/dark pair. Matches what `createMaterialTheme()` returns, so its
 * result can be renamed straight into the prop:
 * `const { lightTheme: light, darkTheme: dark } = createMaterialTheme(seed)`.
 */
export interface ThemePair {
  light: BaseTheme
  dark: BaseTheme
}

/** Storage key for the persisted mode. Namespaced to avoid app collisions. */
export const THEME_MODE_STORAGE_KEY = 'rootnative.theme-mode'

function isThemePair(theme: BaseTheme | ThemePair): theme is ThemePair {
  // A BaseTheme always carries `colors`; a pair never does. Cheaper and more
  // robust than checking for both keys, since a pair member could be a custom
  // theme with extra keys of its own.
  return !('colors' in theme)
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark'
}

export interface ThemeProviderProps {
  /**
   * Theme object to provide to all child components via context.
   * Accepts any theme extending `BaseTheme` — Material, Apple, or custom.
   *
   * Pass a `{ light, dark }` pair to enable light/dark switching: the provider
   * then resolves which one to use from `mode` plus the OS setting, and
   * `useThemeMode()` becomes available to descendants.
   *
   * @default lightTheme (Material Design 3)
   */
  theme?: BaseTheme | ThemePair
  /**
   * Which theme of the pair to use. `'system'` follows the OS and keeps
   * following it; `'light'` / `'dark'` pin it. Ignored when `theme` is a
   * single theme.
   *
   * Leave uncontrolled (the default) and drive it with `setMode()` from
   * `useThemeMode()`. Pass it to control the mode from your own state — the
   * provider then never changes it on its own, so pair it with `onModeChange`.
   *
   * @default 'system'
   */
  mode?: ThemeMode
  /**
   * Initial mode for the uncontrolled case. A persisted value from `storage`
   * wins over this once it loads.
   *
   * @default 'system'
   */
  defaultMode?: ThemeMode
  /** Called whenever `setMode()` runs, controlled or not. */
  onModeChange?: (mode: ThemeMode) => void
  /**
   * Persists the mode across launches. Any object with `getItem`/`setItem` —
   * AsyncStorage, MMKV, `localStorage`. `@rootnative/core` takes no storage
   * dependency of its own, so nothing is persisted unless you pass this.
   *
   * Ignored when `mode` is controlled: your own state is then the source of
   * truth and persisting behind it would fight it.
   *
   * @example
   * import AsyncStorage from '@react-native-async-storage/async-storage'
   *
   * <ThemeProvider theme={{ light, dark }} storage={AsyncStorage}>
   */
  storage?: ThemeModeStorage
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
 * // Light/dark, following the OS
 * import { ThemeProvider, lightTheme, darkTheme } from '@rootnative/core'
 *
 * <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
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
  mode: controlledMode,
  defaultMode = 'system',
  onModeChange,
  storage,
  iconResolver,
  children,
}: ThemeProviderProps) {
  const pair = theme && isThemePair(theme) ? theme : null
  const systemScheme = useColorScheme()

  const [uncontrolledMode, setUncontrolledMode] =
    React.useState<ThemeMode>(defaultMode)
  const isControlled = controlledMode !== undefined
  const mode = isControlled ? controlledMode : uncontrolledMode

  // Nothing to wait for when the mode is controlled or unpersisted.
  const [isReady, setIsReady] = React.useState(
    () => !storage || isControlled || !pair,
  )

  // Read the persisted mode once on mount. Deliberately not re-run when
  // `storage` changes identity: an inline object literal would otherwise
  // re-read every render and stomp the user's choice back to the stored one.
  const storageRef = React.useRef(storage)
  storageRef.current = storage
  const shouldLoad = Boolean(storage) && !isControlled && Boolean(pair)

  React.useEffect(() => {
    if (!shouldLoad) {
      setIsReady(true)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const stored = await storageRef.current?.getItem(THEME_MODE_STORAGE_KEY)

        if (!cancelled && isThemeMode(stored)) {
          setUncontrolledMode(stored)
        }
      } catch {
        // A failed read is not worth crashing an app over — fall back to
        // `defaultMode`, which is already in state.
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [shouldLoad])

  const setMode = React.useCallback(
    (nextMode: ThemeMode) => {
      if (!isControlled) {
        setUncontrolledMode(nextMode)
      }

      onModeChange?.(nextMode)

      if (!isControlled) {
        try {
          const result = storageRef.current?.setItem(
            THEME_MODE_STORAGE_KEY,
            nextMode,
          )
          // Swallow a rejected promise too; a sync throw is caught above.
          void Promise.resolve(result).catch(() => {})
        } catch {
          // Persisting is best-effort; the in-memory mode already changed.
        }
      }
    },
    [isControlled, onModeChange],
  )

  const scheme: ColorScheme =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode

  const resolvedTheme = pair
    ? scheme === 'dark'
      ? pair.dark
      : pair.light
    : ((theme as BaseTheme | undefined) ?? lightTheme)

  const modeValue = React.useMemo<ThemeModeContextValue | null>(
    () => (pair ? { mode, scheme, setMode, isReady } : null),
    [pair, mode, scheme, setMode, isReady],
  )

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
      <ThemeModeContext.Provider value={modeValue}>
        <IconResolverContext.Provider value={iconResolver ?? null}>
          <MotionConfig transitions={transitions}>{children}</MotionConfig>
        </IconResolverContext.Provider>
      </ThemeModeContext.Provider>
    </ThemeContext.Provider>
  )
}

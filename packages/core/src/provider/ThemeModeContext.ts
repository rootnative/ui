import * as React from 'react'

/**
 * What the app asks for. `'system'` follows the OS setting and keeps
 * following it as the OS changes; `'light'` / `'dark'` pin the scheme.
 */
export type ThemeMode = 'system' | 'light' | 'dark'

/** What the app actually renders. `'system'` is always resolved away. */
export type ColorScheme = 'light' | 'dark'

/**
 * Persists the user's mode choice across launches. Deliberately structural
 * rather than a dependency on any one storage library: pass an
 * AsyncStorage-shaped object, MMKV, `localStorage`, SecureStore, or your own
 * wrapper. `@rootnative/core` takes no storage dependency of its own.
 *
 * Both methods may be sync or async — the provider awaits either.
 *
 * @example
 * import AsyncStorage from '@react-native-async-storage/async-storage'
 *
 * <ThemeProvider theme={{ light, dark }} storage={AsyncStorage}>
 */
export interface ThemeModeStorage {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => unknown | Promise<unknown>
}

export interface ThemeModeContextValue {
  /** The requested mode, including `'system'`. */
  mode: ThemeMode
  /**
   * The resolved scheme actually in use. `mode: 'system'` resolves this from
   * the OS; `'light'` / `'dark'` pass straight through. Use this to sync
   * anything outside the theme — most commonly the status bar.
   */
  scheme: ColorScheme
  /** Sets the mode, and persists it when a `storage` is configured. */
  setMode: (mode: ThemeMode) => void
  /**
   * `false` until a persisted mode has been read back from `storage`. Always
   * `true` when no `storage` is configured, since there is nothing to wait
   * for. Gate a splash screen on this to avoid a light-to-dark flash on
   * launch.
   */
  isReady: boolean
}

/**
 * Null when no `ThemeProvider` above, and also when the provider was given a
 * single theme rather than a `{ light, dark }` pair — there is no mode to
 * report in that case. `useThemeMode()` turns both into a thrown error.
 */
export const ThemeModeContext =
  React.createContext<ThemeModeContextValue | null>(null)

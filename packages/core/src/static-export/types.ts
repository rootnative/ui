/** Options for `schemeGuardScript`. */
export interface SchemeGuardScriptOptions {
  /**
   * The `localStorage` key that holds the mode the reader chose. A stored
   * `'light'` or `'dark'` wins over the OS scheme, as it does in
   * `ThemeProvider`. Pass `null` when the app does not keep the mode in
   * `localStorage` under one key: the script then reads the OS scheme only.
   *
   * @default THEME_MODE_STORAGE_KEY ('rootnative.theme-mode'), the key that
   * `ThemeProvider` writes through `storage`
   */
  storageKey?: string | null
}

/** Options for `schemeGuardCss`. */
export interface SchemeGuardCssOptions {
  /**
   * The CSS color that a dark-scheme reader sees while the page is hidden.
   * Use the background color of the dark theme, for example
   * `darkTheme.colors.background`.
   */
  background: string
  /**
   * The element that holds the app. The guard hides it until the theme is
   * ready.
   *
   * @default '#root', the element Expo hydrates into
   */
  rootSelector?: string
  /**
   * How long to wait for the theme before the page shows anyway, in
   * milliseconds. This is for a bundle that fails to load. A short value
   * shows the light page to a dark-scheme reader on a slow connection; a long
   * value keeps a reader with a failed bundle on an empty page.
   *
   * @default 8000
   */
  timeoutMs?: number
}

/**
 * The two `<html>` attributes the scheme guard is built on. The shell script
 * and `ThemeProvider` write them, and `schemeGuardCss` reads them, so the
 * writers and the CSS share one spelling.
 */

/**
 * Set on `<html>` by `schemeGuardScript`, before the body paints, to the
 * scheme the reader will get after hydration: `'dark'` or `'light'`.
 */
export const SCHEME_ATTRIBUTE = 'data-rootnative-scheme'

/**
 * Set on `<html>` by `ThemeProvider` on web, on the first render after
 * hydration with the stored mode loaded. From then on the theme on screen is
 * the final one, so the guard stands down.
 */
export const THEME_READY_ATTRIBUTE = 'data-rootnative-theme-ready'

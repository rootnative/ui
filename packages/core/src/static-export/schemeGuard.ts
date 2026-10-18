import { THEME_MODE_STORAGE_KEY } from '../provider/storageKey'
import { SCHEME_ATTRIBUTE, THEME_READY_ATTRIBUTE } from './attributes'
import type { SchemeGuardCssOptions, SchemeGuardScriptOptions } from './types'

const KEYFRAMES = 'rootnative-scheme-guard'

const DEFAULT_ROOT_SELECTOR = '#root'

const DEFAULT_TIMEOUT_MS = 8000

/**
 * `JSON.stringify` with `<` escaped, so that a value cannot close the
 * `<script>` element it is written into.
 */
function scriptLiteral(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/**
 * The source of an inline script for the `<head>` of a static export. It
 * finds the scheme the reader will get after hydration and writes it to
 * `<html>` as `SCHEME_ATTRIBUTE`, before the body paints.
 *
 * ## The problem it solves
 *
 * The export server cannot know the color scheme of the reader, so the HTML
 * holds the light theme. react-native-web writes each theme color into the
 * HTML as an inline style, and shell CSS cannot change an inline style. So a
 * reader with a dark scheme sees the light page until the bundle downloads
 * and hydrates: about 1.3 s on a fast computer, and more than 5 s on a slow
 * phone. A mode stored with `storage` loads after hydration, so a reader who
 * chose dark sees the same light page.
 *
 * This script and `schemeGuardCss` hide the page from a dark-scheme reader
 * until `ThemeProvider` shows the final theme. A light-scheme reader sees no
 * change. Without JavaScript the script does not run, so nothing is hidden.
 *
 * ## How to use it
 *
 * Put both in the HTML shell — for Expo Router that is `app/+html.tsx`. The
 * script must come before the body:
 *
 * ```tsx
 * import { darkTheme } from '@rootnative/core'
 * import {
 *   schemeGuardCss,
 *   schemeGuardScript,
 * } from '@rootnative/core/static-export'
 *
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: schemeGuardScript() }} />
 *   <style
 *     dangerouslySetInnerHTML={{
 *       __html: schemeGuardCss({ background: darkTheme.colors.background }),
 *     }}
 *   />
 * </head>
 * ```
 *
 * The scheme comes from the same sources as `ThemeProvider` uses: a stored
 * `'light'` or `'dark'` first, then the OS scheme. The script cannot see a
 * mode that the app controls with `mode`. It then reads the OS scheme, and
 * the page can stay hidden until hydration for a reader who will see light.
 */
export function schemeGuardScript(options?: SchemeGuardScriptOptions): string {
  const storageKey =
    options?.storageKey === undefined
      ? THEME_MODE_STORAGE_KEY
      : options.storageKey
  const readStored =
    storageKey === null
      ? ''
      : `try { stored = window.localStorage.getItem(${scriptLiteral(storageKey)}) } catch (e) {}\n`

  return `(function () {
  try {
    var stored = null
    ${readStored}var scheme = stored === 'dark' || stored === 'light'
      ? stored
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    document.documentElement.setAttribute(${scriptLiteral(SCHEME_ATTRIBUTE)}, scheme)
  } catch (e) {}
})()
`
}

/**
 * CSS for the HTML shell of a static export. For a reader whose scheme is
 * dark, it hides the app element and paints `background` until
 * `ThemeProvider` marks the theme as ready. See `schemeGuardScript` for the
 * problem, and for the script that this CSS needs.
 *
 * The hidden page keeps its layout, so nothing moves when it shows. The cost
 * is time: a dark-scheme reader sees content when hydration ends, not when the
 * HTML arrives, so the Largest Contentful Paint is later for that reader.
 *
 * If the theme is not ready after `timeoutMs`, the page shows anyway. That is
 * for a bundle that fails to load.
 */
export function schemeGuardCss(options: SchemeGuardCssOptions): string {
  const root = options.rootSelector ?? DEFAULT_ROOT_SELECTOR
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const guarded = `html[${SCHEME_ATTRIBUTE}='dark']:not([${THEME_READY_ATTRIBUTE}])`

  return `@keyframes ${KEYFRAMES} {
  to { visibility: visible; }
}
${guarded},
${guarded} body {
  background-color: ${options.background};
}
${guarded} ${root} {
  visibility: hidden;
  animation: ${KEYFRAMES} 0s ${timeout}ms forwards;
}
`
}

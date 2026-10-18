/**
 * `@rootnative/core/static-export` — helpers for the HTML shell of a static
 * web export.
 *
 * A separate subpath on purpose. An HTML shell reads these once, at export
 * time, so they do not belong in the app bundle. The root entry does not
 * re-export them.
 */
export { schemeGuardCss, schemeGuardScript } from './schemeGuard'
export { SCHEME_ATTRIBUTE, THEME_READY_ATTRIBUTE } from './attributes'
export type { SchemeGuardCssOptions, SchemeGuardScriptOptions } from './types'

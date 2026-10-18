import { useEffect } from 'react'
import { THEME_READY_ATTRIBUTE } from '../static-export/attributes'

/**
 * Stamps `THEME_READY_ATTRIBUTE` on `<html>` when `isFinal` becomes `true`, so
 * that `schemeGuardCss` shows the page. Native has no `document`, so this
 * does nothing there.
 *
 * The attribute is never removed. Once the theme on screen is final, a later
 * change of mode is an ordinary re-render, with no light server paint to hide.
 */
export function useMarkThemeReady(isFinal: boolean): void {
  useEffect(() => {
    if (!isFinal || typeof document === 'undefined') return
    document.documentElement.setAttribute(THEME_READY_ATTRIBUTE, '')
  }, [isFinal])
}

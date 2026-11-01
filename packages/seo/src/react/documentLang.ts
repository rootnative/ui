import { useEffect } from 'react'
import { sameLanguage } from '../lang'

/**
 * Sets `lang` on `<html>` to the language of the page while `active`, when
 * it names another language than the one on the element, and puts the one
 * that was there back when the page goes. A page in the language of the
 * shell changes nothing: `en-US` on `en` is the same language. An effect
 * runs after the first paint and never on a server, so the exported file
 * gets its `lang` from `writeSeoFiles`.
 */
export function useDocumentLang(
  lang: string | undefined,
  active: boolean,
): void {
  useEffect(() => {
    if (!active || !lang || typeof document === 'undefined') return undefined
    const root = document.documentElement
    const before = root.getAttribute('lang')
    if (before && sameLanguage(before, lang)) return undefined
    root.setAttribute('lang', lang)
    return () => {
      if (before === null) root.removeAttribute('lang')
      else root.setAttribute('lang', before)
    }
  }, [active, lang])
}

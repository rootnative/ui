import { resolveUrl } from './site'
import type { PageAlternate, PageMeta, Site } from './types'

/** The signals in a page head that name its language. */
export type LanguageSignals = {
  /** The absolute URL of the page: its canonical link. */
  url?: string
  /** The `hreflang` links of the page, with absolute URLs. */
  alternates?: PageAlternate[]
  /** The `og:locale`, such as `de_DE`. */
  locale?: string
}

/** The locale `de_DE` as the BCP 47 tag `de-DE`. */
export function languageTag(locale: string): string {
  return locale.trim().replace(/_/g, '-')
}

function primarySubtag(tag: string): string {
  return tag.trim().split('-')[0]?.toLowerCase() ?? ''
}

/** True when two tags name one language: `en` and `en-GB`, not `en` and `de`. */
export function sameLanguage(a: string, b: string): boolean {
  return primarySubtag(a) === primarySubtag(b)
}

/**
 * The language of a page, from the signals its head holds: the `hreflang`
 * link that points at the page itself, else the `og:locale`. `undefined`
 * when the head has neither. The `x-default` link names no language.
 */
export function languageOf(signals: LanguageSignals): string | undefined {
  const self = signals.url
    ? signals.alternates?.find(
        ({ lang, url }) =>
          url === signals.url && lang.trim().toLowerCase() !== 'x-default',
      )
    : undefined
  if (self) return self.lang.trim()
  const locale = signals.locale?.trim()
  return locale ? languageTag(locale) : undefined
}

/**
 * The language of one page as the `lang` of `<html>`: the `hreflang` entry
 * of `alternates` that points at the page itself, else `locale`, else the
 * locale of the site, as a BCP 47 tag. `undefined` when none is set. The
 * page heads set it on `<html>` while the page is on, and `writeSeoFiles`
 * sets it in each exported file, when it is not the language of the shell.
 */
export function pageLang(site: Site, meta: PageMeta): string | undefined {
  const url = meta.url ? resolveUrl(site, meta.url) : undefined
  return languageOf({
    url,
    alternates: meta.alternates?.map(({ lang, url: href }) => ({
      lang,
      url: resolveUrl(site, href),
    })),
    locale: meta.locale ?? site.locale,
  })
}

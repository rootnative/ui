import type { JsonLd } from '../types'
import { jsonLd, thing } from './compact'

export type WebSiteInput = {
  name: string
  url: string
  /** A URL template with `{search_term_string}`, for example `https://example.com/search?q={search_term_string}`. */
  searchUrlTemplate?: string
}

export function webSite(input: WebSiteInput): JsonLd {
  return jsonLd('WebSite', {
    name: input.name,
    url: input.url,
    potentialAction: input.searchUrlTemplate
      ? thing('SearchAction', {
          target: thing('EntryPoint', { urlTemplate: input.searchUrlTemplate }),
          'query-input': 'required name=search_term_string',
        })
      : undefined,
  })
}

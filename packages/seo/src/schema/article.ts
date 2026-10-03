import type { JsonLd } from '../types'
import { jsonLd, personRef } from './compact'

export type ArticleInput = {
  headline: string
  url: string
  image?: string
  description?: string
  /** ISO 8601 date or date-time. */
  datePublished?: string
  dateModified?: string
  author?: string | { name: string; url?: string }
}

export function article(input: ArticleInput): JsonLd {
  return jsonLd('Article', {
    headline: input.headline,
    url: input.url,
    mainEntityOfPage: input.url,
    image: input.image,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: personRef(input.author),
  })
}

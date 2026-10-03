import { thing } from './compact'

export type RatingInput = {
  ratingValue: number
  ratingCount?: number
  reviewCount?: number
  /** The default is 5. */
  bestRating?: number
  /** The default is 1. */
  worstRating?: number
}

/**
 * An `AggregateRating`. Returns `undefined` without a value or without a count,
 * because a rating with no votes is not a rating a search engine shows.
 */
export function aggregateRating(input: RatingInput | undefined) {
  if (!input) return undefined
  if (!Number.isFinite(input.ratingValue)) return undefined
  const count = input.ratingCount ?? input.reviewCount
  if (!count || count <= 0) return undefined
  return thing('AggregateRating', {
    ratingValue: input.ratingValue,
    ratingCount: input.ratingCount,
    reviewCount: input.reviewCount,
    bestRating: input.bestRating ?? 5,
    worstRating: input.worstRating ?? 1,
  })
}

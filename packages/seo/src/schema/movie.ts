import { isoDuration } from '../text'
import type { JsonLd } from '../types'
import { jsonLd, personRef } from './compact'
import { aggregateRating, type RatingInput } from './rating'

export type MovieInput = {
  name: string
  url: string
  image?: string
  description?: string
  /** ISO 8601 date. */
  datePublished?: string
  genre?: string | string[]
  /** Converted to an ISO 8601 duration. `0` writes no duration. */
  durationMinutes?: number
  actors?: Array<string | { name: string; url?: string }>
  director?: string | { name: string; url?: string }
  rating?: RatingInput
}

export function movie(input: MovieInput): JsonLd {
  return jsonLd('Movie', {
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    datePublished: input.datePublished,
    genre: input.genre,
    duration:
      input.durationMinutes === undefined
        ? undefined
        : isoDuration(input.durationMinutes),
    actor: input.actors?.map(personRef),
    director: personRef(input.director),
    aggregateRating: aggregateRating(input.rating),
  })
}

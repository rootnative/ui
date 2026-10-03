import type { JsonLd } from '../types'
import { jsonLd, placeRef } from './compact'

export type EventInput = {
  name: string
  url: string
  /** ISO 8601 date or date-time. */
  startDate: string
  endDate?: string
  location?: string | { name: string; address?: string }
  image?: string
  description?: string
}

export function event(input: EventInput): JsonLd {
  return jsonLd('Event', {
    name: input.name,
    url: input.url,
    startDate: input.startDate,
    endDate: input.endDate,
    location: placeRef(input.location),
    image: input.image,
    description: input.description,
  })
}

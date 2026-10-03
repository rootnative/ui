import type { JsonLd } from '../types'
import { jsonLd, placeRef } from './compact'

export type PersonInput = {
  name: string
  url: string
  image?: string
  description?: string
  /** ISO 8601 date. */
  birthDate?: string
  deathDate?: string
  birthPlace?: string
  jobTitle?: string
  sameAs?: string[]
}

export function person(input: PersonInput): JsonLd {
  return jsonLd('Person', {
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    birthDate: input.birthDate,
    deathDate: input.deathDate,
    birthPlace: placeRef(input.birthPlace),
    jobTitle: input.jobTitle,
    sameAs: input.sameAs,
  })
}

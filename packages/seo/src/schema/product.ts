import type { JsonLd } from '../types'
import { jsonLd, thing } from './compact'
import { aggregateRating, type RatingInput } from './rating'

export type OfferInput = {
  price: number | string
  /** ISO 4217 code, for example `USD`. */
  priceCurrency: string
  /** A schema.org `ItemAvailability` name, for example `InStock`. */
  availability?:
    | 'InStock'
    | 'OutOfStock'
    | 'PreOrder'
    | 'Discontinued'
    | 'LimitedAvailability'
  url?: string
}

export type ProductInput = {
  name: string
  url: string
  image?: string
  description?: string
  brand?: string
  sku?: string
  offers?: OfferInput
  aggregateRating?: RatingInput
}

export function product(input: ProductInput): JsonLd {
  return jsonLd('Product', {
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    sku: input.sku,
    brand: input.brand ? thing('Brand', { name: input.brand }) : undefined,
    offers: input.offers
      ? thing('Offer', {
          price: String(input.offers.price),
          priceCurrency: input.offers.priceCurrency,
          availability: input.offers.availability
            ? `https://schema.org/${input.offers.availability}`
            : undefined,
          url: input.offers.url,
        })
      : undefined,
    aggregateRating: aggregateRating(input.aggregateRating),
  })
}

import type { JsonLd } from '../types'
import { jsonLd } from './compact'

export type OrganizationInput = {
  name: string
  url: string
  logo?: string
  /** Profile URLs on other sites. */
  sameAs?: string[]
}

export function organization(input: OrganizationInput): JsonLd {
  return jsonLd('Organization', {
    name: input.name,
    url: input.url,
    logo: input.logo,
    sameAs: input.sameAs,
  })
}

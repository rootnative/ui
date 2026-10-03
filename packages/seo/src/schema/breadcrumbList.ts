import type { JsonLd } from '../types'
import { jsonLd, thing } from './compact'

export type Breadcrumb = { name: string; url: string }

export function breadcrumbList(trail: Breadcrumb[]): JsonLd {
  return jsonLd('BreadcrumbList', {
    itemListElement: trail.map((crumb, index) =>
      thing('ListItem', {
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      }),
    ),
  })
}

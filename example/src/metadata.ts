import { toMetadata } from '@rootnative/seo'
import type { PageMeta } from '@rootnative/seo'
import { findEntry } from './catalog'
import { site } from './site'

/** The head of a catalog screen: its label, its description and its route. */
export function catalogMeta(route: string): PageMeta | undefined {
  const entry = findEntry(route)
  if (!entry) {
    return undefined
  }
  return {
    title: entry.label,
    description: entry.description,
    url: entry.route,
  }
}

/**
 * The `generateMetadata` result of a page. From Expo SDK 58 the static export
 * writes the head from it, not from `PageHead` or `RouteHead`.
 */
export function pageMetadata(meta: PageMeta) {
  return toMetadata(site, meta)
}

/**
 * The `generateMetadata` result of a catalog screen. The export calls
 * `generateMetadata` with no request, so each route names its own path. A
 * path outside the catalog throws: the export then fails, and no page ships
 * with no head.
 */
export function catalogMetadata(route: string) {
  const meta = catalogMeta(route)
  if (!meta) {
    throw new Error(`[metadata] ${route} is not in the catalog.`)
  }
  return pageMetadata(meta)
}

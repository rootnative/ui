import { createContext, useContext, type ReactNode } from 'react'
import type { Site } from '../types'

export const SeoContext = createContext<Site | null>(null)

export type SeoProviderProps = {
  site: Site
  children?: ReactNode
}

/** Gives every `PageHead` below it the site from `defineSite`. */
export function SeoProvider({ site, children }: SeoProviderProps) {
  return <SeoContext.Provider value={site}>{children}</SeoContext.Provider>
}

/**
 * The site for the current tree. A `site` argument wins over the provider, so
 * a page outside the provider, such as a `+not-found` route, can pass its own.
 */
export function useSite(site?: Site): Site {
  const fromContext = useContext(SeoContext)
  const resolved = site ?? fromContext
  if (!resolved) {
    throw new Error(
      'No site found. Wrap the tree in <SeoProvider site={site}> or pass `site` as a prop.',
    )
  }
  return resolved
}

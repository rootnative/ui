import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Site } from '../types'
import { createClaimStore, noClaims, type ClaimStore } from './claims'

export type SeoContextValue = {
  site: Site
  claims: ClaimStore
}

export const SeoContext = createContext<SeoContextValue | null>(null)

export type SeoProviderProps = {
  site: Site
  children?: ReactNode
}

/** Gives every `PageHead` and `RouteHead` below it the site from `defineSite`. */
export function SeoProvider({ site, children }: SeoProviderProps) {
  const [claims] = useState(createClaimStore)
  const [value, setValue] = useState<SeoContextValue>(() => ({ site, claims }))
  if (value.site !== site) setValue({ site, claims })
  return <SeoContext.Provider value={value}>{children}</SeoContext.Provider>
}

/**
 * The site for the current tree. A `site` argument wins over the provider, so
 * a page outside the provider, such as a `+not-found` route, can pass its own.
 */
export function useSite(site?: Site): Site {
  const fromContext = useContext(SeoContext)
  const resolved = site ?? fromContext?.site
  if (!resolved) {
    throw new Error(
      'No site found. Wrap the tree in <SeoProvider site={site}> or pass `site` as a prop.',
    )
  }
  return resolved
}

/** The claim store of the provider, or one that never claims without a provider. */
export function useClaims(): ClaimStore {
  return useContext(SeoContext)?.claims ?? noClaims()
}

/**
 * Claims `pathname` for the component that calls this, for as long as it is
 * rendered with that pathname. `null` holds no claim. The claim is made during
 * render, so a `RouteHead` later in the same pass sees it; the static export
 * runs no effect. The release and the notice to listeners run in an effect.
 */
export function useClaim(claims: ClaimStore, pathname: string | null): void {
  const [held, setHeld] = useState<string | null>(() => {
    if (pathname !== null) claims.claim(pathname)
    return pathname
  })
  if (held !== pathname) {
    if (pathname !== null) claims.claim(pathname)
    setHeld(pathname)
  }
  useEffect(() => {
    claims.notify()
    return () => {
      if (pathname !== null) {
        claims.release(pathname)
        claims.notify()
      }
    }
  }, [claims, pathname])
}

import { usePathname } from 'expo-router'
import Head from 'expo-router/head'
import { useEffect, useSyncExternalStore } from 'react'
import { Platform } from 'react-native'
import { toHeadTags } from '../head'
import { useClaims, useSite } from '../react/SeoProvider'
import type { PageMeta, Site } from '../types'
import { renderHeadTag } from './PageHead'

/** The head of a route that has no `PageHead`, from its pathname. `undefined` writes nothing. */
export type RouteDefaults = (pathname: string) => PageMeta | undefined

export type RouteHeadProps = {
  defaults: RouteDefaults
  /** Wins over the site from `SeoProvider`. */
  site?: Site
}

/**
 * Writes the head of the current route when no screen on it renders a
 * `PageHead`. Put it after the navigator in the root layout, so the screen
 * renders first and its `PageHead` wins the whole page, not one tag at a
 * time. Renders nothing on native.
 */
export function RouteHead(props: RouteHeadProps) {
  if (Platform.OS !== 'web') return null
  return <WebRouteHead {...props} />
}

let warnedOrder = false

function WebRouteHead({ defaults, site }: RouteHeadProps) {
  const resolved = useSite(site)
  const pathname = usePathname()
  const claims = useClaims()
  const claimed = useSyncExternalStore(
    claims.subscribe,
    () => claims.has(pathname),
    () => claims.has(pathname),
  )
  const meta = claimed ? undefined : defaults(pathname)
  const wrote = meta !== undefined

  useEffect(() => {
    if (!wrote || !claims.has(pathname) || warnedOrder) return
    if (process.env.NODE_ENV !== 'production') {
      warnedOrder = true
      console.warn(
        `RouteHead wrote the defaults for "${pathname}" before the PageHead of that route rendered, so the static export holds both. Put <RouteHead /> after the navigator.`,
      )
    }
  }, [claims, pathname, wrote])

  if (!meta) return null
  return <Head>{toHeadTags(resolved, meta).map(renderHeadTag)}</Head>
}

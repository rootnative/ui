import { useIsFocused, usePathname } from 'expo-router'
import { Platform } from 'react-native'
import { toHeadTags } from '../head'
import { useClaim, useClaims, useSite } from '../react/SeoProvider'
import type { PageMeta, Site } from '../types'
import { HeadTags } from './HeadTags'

export type PageHeadProps = PageMeta & {
  /** Wins over the site from `SeoProvider`. */
  site?: Site
}

/**
 * Writes the head of one page through `expo-router/head`, and its JSON-LD
 * into the page body. Renders nothing on native, where no document exists,
 * and reads no site there, so a native tree and a native test need no
 * `SeoProvider`. On the web a missing site throws, and the static export
 * fails on the first page that has one.
 *
 * From Expo SDK 58 the static export writes the head tags from the
 * `generateMetadata` export of the route, not from this component. Return
 * `toMetadata(site, meta)` there with the same `meta`. This component still
 * writes the JSON-LD on every SDK, and the head after a client navigation.
 */
export function PageHead(props: PageHeadProps) {
  if (Platform.OS !== 'web') return null
  return <WebPageHead {...props} />
}

function WebPageHead({ site, ...meta }: PageHeadProps) {
  const resolved = useSite(site)
  // A focused screen is the page at `pathname`. The claim keeps `RouteHead`
  // from writing the route defaults next to this head. A screen that stays
  // mounted behind the focused one holds no claim, as it writes no head.
  const focused = useIsFocused()
  const pathname = usePathname()
  useClaim(useClaims(), focused ? pathname : null)
  return <HeadTags tags={toHeadTags(resolved, meta)} active={focused} />
}

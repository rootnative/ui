import Head from 'expo-router/head'
import { Platform } from 'react-native'
import { toHeadTags } from '../head'
import { useSite } from '../react/SeoProvider'
import type { HeadTag, PageMeta, Site } from '../types'

export type PageHeadProps = PageMeta & {
  /** Wins over the site from `SeoProvider`. */
  site?: Site
}

function keyOf(tag: HeadTag, index: number): string {
  switch (tag.tag) {
    case 'title':
      return 'title'
    case 'link':
      return `link:${tag.rel}`
    case 'meta':
      return 'name' in tag ? `meta:${tag.name}` : `meta:${tag.property}`
    case 'script':
      return `ld:${index}`
  }
}

/** Turns one `HeadTag` record into the element `expo-router/head` expects. */
export function renderHeadTag(tag: HeadTag, index: number) {
  const key = keyOf(tag, index)
  switch (tag.tag) {
    case 'title':
      return <title key={key}>{tag.text}</title>
    case 'meta':
      return 'name' in tag ? (
        <meta key={key} name={tag.name} content={tag.content} />
      ) : (
        <meta key={key} property={tag.property} content={tag.content} />
      )
    case 'link':
      return <link key={key} rel={tag.rel} href={tag.href} />
    // A string child, not `dangerouslySetInnerHTML`: react-helmet-async reads
    // the inner HTML of a script from its child and drops the tag otherwise.
    // The text is already safe — `serializeJsonLd` escapes every `<`.
    case 'script':
      return (
        <script key={key} type={tag.type}>
          {tag.text}
        </script>
      )
  }
}

/**
 * Writes the head of one page through `expo-router/head`. Renders nothing on
 * native, where no document exists, and reads no site there, so a native tree
 * and a native test need no `SeoProvider`. On the web a missing site throws,
 * and the static export fails on the first page that has one.
 */
export function PageHead(props: PageHeadProps) {
  if (Platform.OS !== 'web') return null
  return <WebPageHead {...props} />
}

function WebPageHead({ site, ...meta }: PageHeadProps) {
  const resolved = useSite(site)
  return <Head>{toHeadTags(resolved, meta).map(renderHeadTag)}</Head>
}

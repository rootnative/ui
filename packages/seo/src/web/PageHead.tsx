import { useEffect } from 'react'
import { Platform } from 'react-native'
import { toHeadTags } from '../head'
import { inPageSlot } from '../headSlots'
import { pageLang } from '../lang'
import { useDocumentLang } from '../react/documentLang'
import { useSite } from '../react/SeoProvider'
import type { HeadTag, PageMeta, Site } from '../types'

export type PageHeadProps = PageMeta & {
  /** Wins over the site from `SeoProvider`. */
  site?: Site
  /**
   * `false` renders no tag, for a screen that stays mounted behind another.
   * A React Navigation screen passes `useIsFocused()`.
   * @default true
   */
  active?: boolean
}

/** On each head tag this component renders, so the sweep leaves it. */
const OWNER = { 'data-rootnative-seo': '' }
const OWNER_ATTRIBUTE = 'data-rootnative-seo'

function elementOf(tag: HeadTag, index: number) {
  switch (tag.tag) {
    case 'title':
      return (
        <title key="title" {...OWNER}>
          {tag.text}
        </title>
      )
    case 'meta':
      return 'name' in tag ? (
        <meta
          key={`meta:${tag.name}`}
          name={tag.name}
          content={tag.content}
          {...OWNER}
        />
      ) : (
        <meta
          key={`meta:${tag.property}`}
          property={tag.property}
          content={tag.content}
          {...OWNER}
        />
      )
    case 'link':
      return (
        <link
          key={`link:${tag.rel}:${tag.hreflang ?? ''}`}
          rel={tag.rel}
          hrefLang={tag.hreflang}
          href={tag.href}
          {...OWNER}
        />
      )
    // React moves a title, a meta tag and a link into the head. It leaves a
    // script with no `src` in place, and a crawler reads JSON-LD in the body.
    case 'script':
      return (
        <script
          key={`ld:${index}`}
          type={tag.type}
          // The text escapes every `<`, so a `</script>` cannot end the tag.
          dangerouslySetInnerHTML={{ __html: tag.text }}
        />
      )
  }
}

/**
 * Takes out the title and every head tag in a page slot that this component
 * did not render, while the page is active, and puts them back when it goes.
 * Those are the tags of the HTML template. React adds the tags of the page
 * and removes only its own, so without this the head holds two descriptions,
 * and the title of the template wins because it comes first. The sweep
 * covers the slots the page leaves empty too: a `noindex` page renders no
 * canonical link, and the one of the template must not stay.
 */
function useTemplateTagSweep(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined
    const head = document.head
    const displaced: Element[] = []
    for (const node of Array.from(head.children)) {
      if (node.hasAttribute(OWNER_ATTRIBUTE)) continue
      if (node.tagName === 'TITLE' || inPageSlot(node)) {
        node.remove()
        displaced.push(node)
      }
    }
    return () => {
      for (const node of displaced) head.appendChild(node)
    }
  }, [active])
}

/**
 * Renders the head of one page as elements, for a React 19 app on the web
 * with no Expo Router. React moves the title, the meta tags and the links
 * into `<head>`, on the server and in the browser, so a page that the server
 * renders, or a build step prerenders, has its head in the HTML file. The
 * same `toHeadTags` records as the other two `PageHead` components, so the
 * three write the same head. The JSON-LD stays in the page body.
 *
 * React does not merge two heads. A screen that stays mounted behind another
 * passes `active={false}`, or the head holds the tags of both. Renders
 * nothing on native.
 */
export function PageHead(props: PageHeadProps) {
  if (Platform.OS !== 'web') return null
  return <WebPageHead {...props} />
}

function WebPageHead({ site, active = true, ...meta }: PageHeadProps) {
  const resolved = useSite(site)
  useDocumentLang(pageLang(resolved, meta), active)
  useTemplateTagSweep(active)
  if (!active) return null
  return <>{toHeadTags(resolved, meta).map(elementOf)}</>
}

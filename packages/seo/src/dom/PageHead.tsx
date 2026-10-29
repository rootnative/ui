import { useEffect } from 'react'
import { Platform } from 'react-native'
import { toHeadTags } from '../head'
import { inPageSlot } from '../headSlots'
import { useSite } from '../react/SeoProvider'
import type { HeadTag, PageMeta, Site } from '../types'

export type PageHeadProps = PageMeta & {
  /** Wins over the site from `SeoProvider`. */
  site?: Site
  /**
   * `false` takes the head out again, for a screen that stays mounted
   * behind another. A React Navigation screen passes `useIsFocused()`.
   * @default true
   */
  active?: boolean
}

const OWNER = 'data-rootnative-seo'

/** What one `PageHead` put in the head, so it can take it out again. */
type Written = {
  nodes: Element[]
  /** Tags of the same identity that were there before, to put back. */
  displaced: Element[]
  title: string
}

function elementOf(doc: Document, tag: HeadTag): Element | null {
  switch (tag.tag) {
    case 'title':
      return null
    case 'meta': {
      const meta = doc.createElement('meta')
      if ('name' in tag) meta.setAttribute('name', tag.name)
      else meta.setAttribute('property', tag.property)
      meta.setAttribute('content', tag.content)
      return meta
    }
    case 'link': {
      const link = doc.createElement('link')
      link.setAttribute('rel', tag.rel)
      if (tag.hreflang !== undefined) {
        link.setAttribute('hreflang', tag.hreflang)
      }
      link.setAttribute('href', tag.href)
      return link
    }
    case 'script': {
      const script = doc.createElement('script')
      script.setAttribute('type', tag.type)
      script.textContent = tag.text
      return script
    }
  }
}

function write(doc: Document, tags: HeadTag[]): Written {
  const head = doc.head
  const written: Written = { nodes: [], displaced: [], title: doc.title }
  // Every tag in a page slot goes, also from a slot this head leaves empty:
  // a template tag, or the tag of a screen below. This head's own tags from
  // the last write are gone already, because the effect cleanup ran first.
  for (const node of Array.from(head.children)) {
    if (inPageSlot(node)) {
      node.remove()
      written.displaced.push(node)
    }
  }
  for (const tag of tags) {
    if (tag.tag === 'title') {
      doc.title = tag.text
      continue
    }
    const node = elementOf(doc, tag)
    if (!node) continue
    node.setAttribute(OWNER, '')
    head.appendChild(node)
    written.nodes.push(node)
  }
  return written
}

function erase(doc: Document, written: Written): void {
  for (const node of written.nodes) node.remove()
  for (const node of written.displaced) doc.head.appendChild(node)
  doc.title = written.title
}

/**
 * Writes the head of one page to `document.head` in an effect, for an app
 * with no Expo Router: React Navigation on react-native-web, a Vite build,
 * an Electron renderer. The same `toHeadTags` records as the Expo Router
 * `PageHead`, so the two write the same head. Every tag in a page slot (the
 * description, the robots tag, the canonical link, the `hreflang` links,
 * `og:*` and `twitter:*`) that was there before is taken out while this head
 * is on, also from a slot this head leaves empty, and put back when it goes:
 * a screen that mounts over another wins, and the one below gets its head
 * back when the top one unmounts. The charset, the viewport, the icons and
 * the manifest of a template stay. Renders nothing on native.
 *
 * An effect runs after the first paint, and never on a server, so this
 * writes nothing into a static file. A build-time template takes
 * `headTagsHtml` from the core instead.
 */
export function PageHead(props: PageHeadProps) {
  if (Platform.OS !== 'web') return null
  return <WebPageHead {...props} />
}

function WebPageHead({ site, active = true, ...meta }: PageHeadProps) {
  const resolved = useSite(site)
  const tags = toHeadTags(resolved, meta)
  const key = JSON.stringify(tags)
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined
    const written = write(document, JSON.parse(key) as HeadTag[])
    return () => erase(document, written)
  }, [active, key])
  return null
}

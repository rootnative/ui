import Head from 'expo-router/head'
import { useEffect } from 'react'
import { slotOf } from '../headSlots'
import type { HeadTag } from '../types'

/** react-helmet-async marks each tag it writes with this attribute. */
const HELMET_ATTRIBUTE = 'data-rh'

function keyOf(tag: HeadTag, index: number): string {
  switch (tag.tag) {
    case 'title':
      return 'title'
    case 'link':
      return tag.hreflang === undefined
        ? `link:${tag.rel}`
        : `link:${tag.rel}:${tag.hreflang}`
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
    // No `hrefLang={undefined}`: react-helmet-async writes an undefined prop
    // as an empty attribute, and the canonical link gets `hreflang=""`.
    case 'link':
      return tag.hreflang === undefined ? (
        <link key={key} rel={tag.rel} href={tag.href} />
      ) : (
        <link key={key} rel={tag.rel} hrefLang={tag.hreflang} href={tag.href} />
      )
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
 * Takes out each head tag that fills a slot of `tags` and that Helmet did not
 * write. From Expo SDK 58 those are the tags of `generateMetadata` in a static
 * page. Helmet removes only its own tags, so without this the head holds two
 * sets after hydration, and the canonical link of the first page after a
 * client navigation. A removed tag is not put back.
 */
function useServerTagSweep(active: boolean, tags: HeadTag[]) {
  const key = JSON.stringify(tags)
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const slots = (JSON.parse(key) as HeadTag[])
      .map(slotOf)
      .filter((slot) => slot !== null)
    for (const node of Array.from(document.head.children)) {
      if (node.hasAttribute(HELMET_ATTRIBUTE)) continue
      if (slots.some((inSlot) => inSlot(node))) node.remove()
    }
  }, [active, key])
}

/**
 * Writes the tags of one page on the web. The head tags go through
 * `expo-router/head`. The JSON-LD goes into the body, in place, while
 * `active`: from Expo SDK 58 the static export writes no `expo-router/head`
 * tag, and `Metadata` has no field for JSON-LD. A script with no `src` is not
 * hoisted by React, so it hydrates where the server wrote it.
 */
export function HeadTags({
  tags,
  active,
}: {
  tags: HeadTag[]
  active: boolean
}) {
  useServerTagSweep(active, tags)
  const scripts = active ? tags.filter((tag) => tag.tag === 'script') : []
  return (
    <>
      <Head>
        {tags.filter((tag) => tag.tag !== 'script').map(renderHeadTag)}
      </Head>
      {scripts.map((tag, index) => (
        <script
          key={`ld:${index}`}
          type={tag.type}
          // The text escapes every `<`, so a `</script>` cannot end the tag.
          dangerouslySetInnerHTML={{ __html: tag.text }}
        />
      ))}
    </>
  )
}

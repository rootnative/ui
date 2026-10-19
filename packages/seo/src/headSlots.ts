import type { HeadTag } from './types'

/** Whether a head element fills the same slot as `tag`, or `null` for a title or a script. */
export function slotOf(tag: HeadTag): ((node: Element) => boolean) | null {
  switch (tag.tag) {
    case 'meta':
      return 'name' in tag
        ? (node) =>
            node.tagName === 'META' && node.getAttribute('name') === tag.name
        : (node) =>
            node.tagName === 'META' &&
            node.getAttribute('property') === tag.property
    case 'link':
      // The `hreflang` links of a page are one slot, not one per language:
      // a language of the head below that this page does not list must go
      // too. A link with no `hreflang`, such as a feed, is not in that slot.
      return (node) =>
        node.tagName === 'LINK' &&
        node.getAttribute('rel') === tag.rel &&
        node.hasAttribute('hreflang') === (tag.hreflang !== undefined)
    default:
      return null
  }
}

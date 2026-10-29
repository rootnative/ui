const PAGE_META_NAMES = new Set(['description', 'robots'])

/**
 * Whether a head element is in a slot that a page head writes: the
 * description, the robots tag, the canonical link, the `hreflang` links, and
 * the `og:*` and `twitter:*` tags. A page head owns every one of these slots,
 * also the ones it leaves empty: a `noindex` page writes no canonical link,
 * and the canonical link of the shell must not stay beside its robots tag.
 * The charset, the viewport, the theme colour, the icons, the manifest, the
 * preconnect links and a feed link are not page slots.
 */
export function inPageSlot(node: Element): boolean {
  if (node.tagName === 'META') {
    const name = node.getAttribute('name')
    if (name !== null) {
      return PAGE_META_NAMES.has(name) || name.startsWith('twitter:')
    }
    const property = node.getAttribute('property')
    return property !== null && property.startsWith('og:')
  }
  if (node.tagName === 'LINK') {
    const rel = node.getAttribute('rel')
    return (
      rel === 'canonical' ||
      (rel === 'alternate' && node.hasAttribute('hreflang'))
    )
  }
  return false
}

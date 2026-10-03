import { resolveUrl } from './site'
import { clipDescription, serializeJsonLd } from './text'
import type { HeadTag, PageMeta, Site } from './types'

/**
 * Turns a `PageMeta` into a flat list of head tags. The list holds data, not
 * React elements, so any head renderer can write it and a test can read it
 * with no renderer.
 *
 * Rules:
 * - The tab title uses the site template. The Open Graph title does not,
 *   because the card shows the site name on its own line.
 * - A page with no `url` gets no canonical link and no share card.
 * - `og:image:width` and `og:image:height` are written only with an image.
 * - The Twitter card is `summary_large_image` with an image and `summary`
 *   without one, unless `twitterCard` forces it.
 */
export function toHeadTags(site: Site, meta: PageMeta): HeadTag[] {
  const tags: HeadTag[] = []
  const title = meta.title.trim()
  const description = meta.description
    ? clipDescription(meta.description, site.descriptionLimit)
    : undefined

  tags.push({ tag: 'title', text: site.titleTemplate(title) })
  if (description) {
    tags.push({ tag: 'meta', name: 'description', content: description })
  }
  if (meta.noindex) {
    tags.push({ tag: 'meta', name: 'robots', content: 'noindex' })
  }

  if (!meta.url) return tags.concat(jsonLdTags(meta))

  const url = resolveUrl(site, meta.url)
  const image = meta.image ? resolveUrl(site, meta.image) : undefined
  const locale = meta.locale ?? site.locale

  tags.push({ tag: 'link', rel: 'canonical', href: url })
  tags.push({
    tag: 'meta',
    property: 'og:type',
    content: meta.type ?? 'website',
  })
  tags.push({ tag: 'meta', property: 'og:site_name', content: site.name })
  tags.push({ tag: 'meta', property: 'og:title', content: title })
  if (description) {
    tags.push({ tag: 'meta', property: 'og:description', content: description })
  }
  tags.push({ tag: 'meta', property: 'og:url', content: url })
  if (locale) tags.push({ tag: 'meta', property: 'og:locale', content: locale })
  if (image) {
    tags.push({ tag: 'meta', property: 'og:image', content: image })
    if (meta.imageSize) {
      tags.push({
        tag: 'meta',
        property: 'og:image:width',
        content: String(meta.imageSize.width),
      })
      tags.push({
        tag: 'meta',
        property: 'og:image:height',
        content: String(meta.imageSize.height),
      })
    }
    if (meta.imageAlt) {
      tags.push({
        tag: 'meta',
        property: 'og:image:alt',
        content: meta.imageAlt,
      })
    }
  }

  const card = meta.twitterCard ?? (image ? 'summary_large_image' : 'summary')
  tags.push({ tag: 'meta', name: 'twitter:card', content: card })
  if (site.twitterSite) {
    tags.push({ tag: 'meta', name: 'twitter:site', content: site.twitterSite })
  }
  tags.push({ tag: 'meta', name: 'twitter:title', content: title })
  if (description) {
    tags.push({
      tag: 'meta',
      name: 'twitter:description',
      content: description,
    })
  }
  if (image) {
    tags.push({ tag: 'meta', name: 'twitter:image', content: image })
    if (meta.imageAlt) {
      tags.push({
        tag: 'meta',
        name: 'twitter:image:alt',
        content: meta.imageAlt,
      })
    }
  }

  return tags.concat(jsonLdTags(meta))
}

function jsonLdTags(meta: PageMeta): HeadTag[] {
  return (meta.jsonLd ?? []).map((item) => ({
    tag: 'script',
    type: 'application/ld+json',
    text: serializeJsonLd(item),
  }))
}

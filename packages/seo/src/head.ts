import { resolveUrl } from './site'
import { clipDescription, serializeJsonLd } from './text'
import type {
  HeadTag,
  OpenGraphType,
  PageAlternate,
  PageMeta,
  PageMetadata,
  Site,
} from './types'

/** The share card and the links of a page that has a `url`. */
type ResolvedShare = {
  url: string
  alternates: { hreflang: string; href: string }[]
  type: OpenGraphType
  locale?: string
  image?: {
    url: string
    size?: { width: number; height: number }
    alt?: string
  }
  card: 'summary' | 'summary_large_image'
}

/**
 * One page head with every rule applied. `toHeadTags` and `toMetadata` both
 * write from it, so the two cannot disagree.
 */
type ResolvedHead = {
  /** The tab title, from the site template. */
  tabTitle: string
  /** The page title with no site name, for the share card. */
  title: string
  description?: string
  noindex: boolean
  share?: ResolvedShare
}

function resolveHead(site: Site, meta: PageMeta): ResolvedHead {
  const title = meta.title.trim()
  const description = meta.description
    ? clipDescription(meta.description, site.descriptionLimit)
    : ''
  const head: ResolvedHead = {
    tabTitle: site.titleTemplate(title),
    title,
    description: description || undefined,
    noindex: Boolean(meta.noindex),
  }
  if (!meta.url) return head

  const image = meta.image ? resolveUrl(site, meta.image) : undefined
  head.share = {
    url: resolveUrl(site, meta.url),
    alternates: resolveAlternates(site, meta.alternates ?? []),
    type: meta.type ?? 'website',
    locale: meta.locale ?? site.locale,
    image: image
      ? { url: image, size: meta.imageSize, alt: meta.imageAlt }
      : undefined,
    card: meta.twitterCard ?? (image ? 'summary_large_image' : 'summary'),
  }
  return head
}

/**
 * Turns a `PageMeta` into a flat list of head tags. The list holds data, not
 * React elements, so any head renderer can write it and a test can read it
 * with no renderer.
 *
 * Rules:
 * - The tab title uses the site template. The Open Graph title does not,
 *   because the card shows the site name on its own line.
 * - A page with no `url` gets no canonical link, no `hreflang` links, and no
 *   share card.
 * - The `hreflang` links get an `x-default` from the first entry when the
 *   list has none.
 * - `og:image:width` and `og:image:height` are written only with an image.
 * - The Twitter card is `summary_large_image` with an image and `summary`
 *   without one, unless `twitterCard` forces it.
 */
export function toHeadTags(site: Site, meta: PageMeta): HeadTag[] {
  const tags: HeadTag[] = []
  const { tabTitle, title, description, noindex, share } = resolveHead(
    site,
    meta,
  )

  tags.push({ tag: 'title', text: tabTitle })
  if (description) {
    tags.push({ tag: 'meta', name: 'description', content: description })
  }
  if (noindex) {
    tags.push({ tag: 'meta', name: 'robots', content: 'noindex' })
  }

  if (!share) return tags.concat(jsonLdTags(meta))

  const { url, image } = share
  tags.push({ tag: 'link', rel: 'canonical', href: url })
  for (const { hreflang, href } of share.alternates) {
    tags.push({ tag: 'link', rel: 'alternate', hreflang, href })
  }
  tags.push({ tag: 'meta', property: 'og:type', content: share.type })
  tags.push({ tag: 'meta', property: 'og:site_name', content: site.name })
  tags.push({ tag: 'meta', property: 'og:title', content: title })
  if (description) {
    tags.push({ tag: 'meta', property: 'og:description', content: description })
  }
  tags.push({ tag: 'meta', property: 'og:url', content: url })
  if (share.locale) {
    tags.push({ tag: 'meta', property: 'og:locale', content: share.locale })
  }
  if (image) {
    tags.push({ tag: 'meta', property: 'og:image', content: image.url })
    if (image.size) {
      tags.push({
        tag: 'meta',
        property: 'og:image:width',
        content: String(image.size.width),
      })
      tags.push({
        tag: 'meta',
        property: 'og:image:height',
        content: String(image.size.height),
      })
    }
    if (image.alt) {
      tags.push({ tag: 'meta', property: 'og:image:alt', content: image.alt })
    }
  }

  tags.push({ tag: 'meta', name: 'twitter:card', content: share.card })
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
    tags.push({ tag: 'meta', name: 'twitter:image', content: image.url })
    if (image.alt) {
      tags.push({ tag: 'meta', name: 'twitter:image:alt', content: image.alt })
    }
  }

  return tags.concat(jsonLdTags(meta))
}

/**
 * Turns a `PageMeta` into the `Metadata` object that an Expo Router route
 * returns from `generateMetadata`. From Expo SDK 58 the static export writes
 * the head of a page from that object, not from `PageHead`.
 *
 * The result holds the same tags as `toHeadTags`, with the same rules, except
 * the JSON-LD: `Metadata` has no field for it. `PageHead` writes the JSON-LD
 * into the page body, so keep the `PageHead` on the screen.
 */
export function toMetadata(site: Site, meta: PageMeta): PageMetadata {
  const { tabTitle, title, description, noindex, share } = resolveHead(
    site,
    meta,
  )
  const metadata: PageMetadata = { title: tabTitle }
  if (description) metadata.description = description
  if (noindex) metadata.robots = 'noindex'
  if (!share) return metadata

  const { url, image } = share
  metadata.alternates = { canonical: url }
  if (share.alternates.length > 0) {
    metadata.alternates.languages = Object.fromEntries(
      share.alternates.map(({ hreflang, href }) => [hreflang, href]),
    )
  }

  const openGraph: NonNullable<PageMetadata['openGraph']> = {
    type: share.type,
    siteName: site.name,
    title,
    url,
  }
  if (description) openGraph.description = description
  if (share.locale) openGraph.locale = share.locale
  if (image) {
    openGraph.images = [
      {
        url: image.url,
        ...image.size,
        ...(image.alt ? { alt: image.alt } : {}),
      },
    ]
  }
  metadata.openGraph = openGraph

  const twitter: NonNullable<PageMetadata['twitter']> = {
    card: share.card,
    title,
  }
  if (site.twitterSite) twitter.site = site.twitterSite
  if (description) twitter.description = description
  if (image) {
    twitter.images = [
      { url: image.url, ...(image.alt ? { alt: image.alt } : {}) },
    ]
  }
  metadata.twitter = twitter

  return metadata
}

function resolveAlternates(
  site: Site,
  alternates: PageAlternate[],
): ResolvedShare['alternates'] {
  const links = alternates.map(({ lang, url }) => ({
    hreflang: lang.trim(),
    href: resolveUrl(site, url),
  }))
  const first = links[0]
  if (
    first &&
    !links.some((link) => link.hreflang.toLowerCase() === 'x-default')
  ) {
    links.push({ ...first, hreflang: 'x-default' })
  }
  return links
}

function jsonLdTags(meta: PageMeta): HeadTag[] {
  return (meta.jsonLd ?? []).map((item) => ({
    tag: 'script',
    type: 'application/ld+json',
    text: serializeJsonLd(item),
  }))
}

function escapeAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * The tags as HTML, one per line, for a static template such as the
 * `index.html` of a Vite build. A JSON-LD script is written as is: its text
 * already escapes every `<`.
 */
export function headTagsHtml(tags: HeadTag[]): string {
  return tags
    .map((tag) => {
      switch (tag.tag) {
        case 'title':
          return `<title>${escapeAttribute(tag.text)}</title>`
        case 'meta':
          return 'name' in tag
            ? `<meta name="${escapeAttribute(tag.name)}" content="${escapeAttribute(tag.content)}">`
            : `<meta property="${escapeAttribute(tag.property)}" content="${escapeAttribute(tag.content)}">`
        case 'link': {
          const hreflang =
            tag.hreflang === undefined
              ? ''
              : ` hreflang="${escapeAttribute(tag.hreflang)}"`
          return `<link rel="${escapeAttribute(tag.rel)}"${hreflang} href="${escapeAttribute(tag.href)}">`
        }
        case 'script':
          return `<script type="${tag.type}">${tag.text}</script>`
      }
    })
    .join('\n')
}

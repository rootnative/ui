/**
 * One schema.org object, ready for a `<script type="application/ld+json">`.
 * The builders in `@rootnative/seo/schema` return this shape.
 */
export type JsonLd = {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

export type OpenGraphType =
  | 'website'
  | 'article'
  | 'profile'
  | 'video.movie'
  | 'product'

/** The head of one page. The app maps its data to this shape. */
export type PageMeta = {
  /** The page title, without the site name. The template adds it. */
  title: string
  description?: string
  /** Absolute, or relative to the site URL. No `url` means no canonical link and no share card. */
  url?: string
  /** Absolute, or relative to the site URL. `null` means "this page has no image". */
  image?: string | null
  imageSize?: { width: number; height: number }
  imageAlt?: string
  type?: OpenGraphType
  locale?: string
  noindex?: boolean
  /** Force the Twitter card type. The default follows the image. */
  twitterCard?: 'summary' | 'summary_large_image'
  jsonLd?: JsonLd[]
}

export type SiteConfig = {
  name: string
  /** The absolute origin and base path of the site, for example `https://example.com/app`. */
  url: string
  locale?: string
  /** Turns a page title into the tab title. The default is `"<title> | <name>"`. */
  titleTemplate?: (title: string) => string
  /** The `@handle` of the site on Twitter / X. */
  twitterSite?: string
  /** The maximum length of a description. The default is 160. */
  descriptionLimit?: number
}

/** A resolved `SiteConfig`. Every optional field has its default. */
export type Site = {
  name: string
  url: string
  locale?: string
  titleTemplate: (title: string) => string
  twitterSite?: string
  descriptionLimit: number
}

export type HeadTag =
  | { tag: 'title'; text: string }
  | { tag: 'meta'; name: string; content: string }
  | { tag: 'meta'; property: string; content: string }
  | { tag: 'link'; rel: string; href: string }
  | { tag: 'script'; type: 'application/ld+json'; text: string }

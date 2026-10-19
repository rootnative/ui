// The serializer that turns the `generateMetadata` result into head tags. From
// Expo SDK 58 the static export writes each page head with it.
import { serializeMetadataToTags } from '@expo/router-server/build/utils/metadata/serialize'
import { defineSite, toHeadTags, toMetadata } from '../index'
import type { HeadTag, PageMeta } from '../index'
import { movie } from '../schema'

const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app/',
  locale: 'en_GB',
  twitterSite: '@trek',
})

const LONG =
  'A duke moves his family to a desert planet that holds the only source of the most valuable substance in the universe, and a rival house plans to take it back by force before the year ends.'

/** Each page shape whose head must not depend on the renderer. */
const PAGES: Record<string, PageMeta> = {
  'every field': {
    title: 'Dune',
    description: 'A duke moves to a desert planet.',
    url: '/movies/1',
    image: '/posters/dune.jpg',
    imageSize: { width: 1200, height: 630 },
    imageAlt: 'Dune poster',
    type: 'video.movie',
    alternates: [
      { lang: 'en', url: '/movies/1' },
      { lang: ' de ', url: '/de/movies/1' },
    ],
    jsonLd: [movie({ name: 'Dune', url: 'https://example.com/app/movies/1' })],
  },
  'no url and noindex': { title: 'Not found', noindex: true },
  'a url only': { title: 'About', url: '/about' },
  'noindex with a url': { title: 'Draft', url: '/draft', noindex: true },
  'an image with no size and no alt': {
    title: 'Arrival',
    url: '/movies/2',
    image: 'https://cdn.example.com/arrival.jpg',
  },
  'an x-default in the list': {
    title: 'Dune',
    url: '/movies/1',
    alternates: [
      { lang: 'en', url: '/movies/1' },
      { lang: 'X-Default', url: '/choose-language' },
    ],
  },
  'a forced card and a page locale': {
    title: 'Dune',
    url: '/movies/1',
    image: '/a.jpg',
    twitterCard: 'summary',
    locale: 'fr_FR',
  },
  'a clipped description': { title: 'Dune', url: '/x', description: LONG },
  'an empty description': { title: 'Dune', url: '/x', description: '  ' },
  'the site name as the title': { title: 'Trek', url: '/' },
}

function line(name: string, attributes: Record<string, string>): string {
  const pairs = Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}="${value}"`)
  return `${name} ${pairs.join(' ')}`
}

function fromHeadTags(tags: HeadTag[]): string[] {
  return tags.flatMap((tag) => {
    switch (tag.tag) {
      case 'title':
        return [`title ${tag.text}`]
      case 'meta':
        return [
          line(
            'meta',
            'name' in tag
              ? { name: tag.name, content: tag.content }
              : { property: tag.property, content: tag.content },
          ),
        ]
      case 'link':
        return [
          line('link', {
            rel: tag.rel,
            href: tag.href,
            ...(tag.hreflang === undefined ? {} : { hreflang: tag.hreflang }),
          }),
        ]
      case 'script':
        return []
    }
  })
}

function fromMetadata(meta: PageMeta): string[] {
  return serializeMetadataToTags(toMetadata(site, meta)).map((tag) =>
    tag.tagName === 'title'
      ? `title ${tag.content}`
      : line(tag.tagName, tag.attributes),
  )
}

describe('toMetadata', () => {
  it.each(Object.entries(PAGES))(
    'writes the same head tags as toHeadTags through the Expo serializer: %s',
    (_, meta) => {
      const expected = fromHeadTags(toHeadTags(site, meta))
      const written = fromMetadata(meta)
      expect([...written].sort()).toEqual([...expected].sort())
      expect(new Set(written).size).toBe(written.length)
    },
  )

  it('keeps the order of the hreflang links', () => {
    const meta = PAGES['every field']!
    const hreflangs = (lines: string[]) =>
      lines.filter((entry) => entry.includes('hreflang='))
    expect(hreflangs(fromMetadata(meta))).toEqual(
      hreflangs(fromHeadTags(toHeadTags(site, meta))),
    )
  })

  it('returns the Metadata shape of a page with every field', () => {
    expect(toMetadata(site, PAGES['every field']!)).toEqual({
      title: 'Dune | Trek',
      description: 'A duke moves to a desert planet.',
      alternates: {
        canonical: 'https://example.com/app/movies/1',
        languages: {
          en: 'https://example.com/app/movies/1',
          de: 'https://example.com/app/de/movies/1',
          'x-default': 'https://example.com/app/movies/1',
        },
      },
      openGraph: {
        type: 'video.movie',
        siteName: 'Trek',
        title: 'Dune',
        description: 'A duke moves to a desert planet.',
        url: 'https://example.com/app/movies/1',
        locale: 'en_GB',
        images: [
          {
            url: 'https://example.com/app/posters/dune.jpg',
            width: 1200,
            height: 630,
            alt: 'Dune poster',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        site: '@trek',
        title: 'Dune',
        description: 'A duke moves to a desert planet.',
        images: [
          {
            url: 'https://example.com/app/posters/dune.jpg',
            alt: 'Dune poster',
          },
        ],
      },
    })
  })

  it('returns only the title and the robots rule for a page with no url', () => {
    expect(toMetadata(site, PAGES['no url and noindex']!)).toEqual({
      title: 'Not found | Trek',
      robots: 'noindex',
    })
  })

  it('carries no JSON-LD, which PageHead writes into the body', () => {
    expect(JSON.stringify(toMetadata(site, PAGES['every field']!))).not.toMatch(
      /schema\.org|ld\+json/,
    )
  })
})

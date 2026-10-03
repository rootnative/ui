import { defineSite, resolveUrl, toHeadTags } from '../index'
import type { HeadTag } from '../index'
import { movie } from '../schema'

const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app/',
  locale: 'en_GB',
  twitterSite: '@trek',
})

function meta(tags: HeadTag[], key: string): string | undefined {
  const hit = tags.find(
    (tag) =>
      tag.tag === 'meta' &&
      (('name' in tag && tag.name === key) ||
        ('property' in tag && tag.property === key)),
  )
  return hit && 'content' in hit ? hit.content : undefined
}

function count(tags: HeadTag[], key: string): number {
  return tags.filter(
    (tag) =>
      tag.tag === 'meta' &&
      (('name' in tag && tag.name === key) ||
        ('property' in tag && tag.property === key)),
  ).length
}

describe('defineSite', () => {
  it('strips the trailing slash and fills the defaults', () => {
    expect(site.url).toBe('https://example.com/app')
    expect(site.descriptionLimit).toBe(160)
    expect(site.titleTemplate('Dune')).toBe('Dune | Trek')
    expect(site.titleTemplate('Trek')).toBe('Trek')
  })

  it('rejects a relative url and an empty name', () => {
    expect(() => defineSite({ name: 'X', url: '/app' })).toThrow(/absolute/)
    expect(() => defineSite({ name: ' ', url: 'https://x.y' })).toThrow(/name/)
  })

  it('accepts a custom title template', () => {
    const custom = defineSite({
      name: 'Trek',
      url: 'https://example.com',
      titleTemplate: (title) => `${title} · Trek`,
    })
    expect(custom.titleTemplate('Dune')).toBe('Dune · Trek')
  })
})

describe('resolveUrl', () => {
  it('joins a path under the site and passes an absolute url through', () => {
    expect(resolveUrl(site, '/movies/1')).toBe(
      'https://example.com/app/movies/1',
    )
    expect(resolveUrl(site, 'movies/1')).toBe(
      'https://example.com/app/movies/1',
    )
    expect(resolveUrl(site, 'https://cdn.example.com/a.jpg')).toBe(
      'https://cdn.example.com/a.jpg',
    )
  })
})

describe('toHeadTags', () => {
  it('writes the full head for a page with every field', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      description: 'A duke moves to a desert planet.',
      url: '/movies/1',
      image: '/posters/dune.jpg',
      imageSize: { width: 1200, height: 630 },
      imageAlt: 'Dune poster',
      type: 'video.movie',
      jsonLd: [
        movie({ name: 'Dune', url: 'https://example.com/app/movies/1' }),
      ],
    })

    expect(tags[0]).toEqual({ tag: 'title', text: 'Dune | Trek' })
    expect(meta(tags, 'description')).toBe('A duke moves to a desert planet.')
    expect(tags).toContainEqual({
      tag: 'link',
      rel: 'canonical',
      href: 'https://example.com/app/movies/1',
    })
    expect(meta(tags, 'og:type')).toBe('video.movie')
    expect(meta(tags, 'og:site_name')).toBe('Trek')
    expect(meta(tags, 'og:title')).toBe('Dune')
    expect(meta(tags, 'og:url')).toBe('https://example.com/app/movies/1')
    expect(meta(tags, 'og:locale')).toBe('en_GB')
    expect(meta(tags, 'og:image')).toBe(
      'https://example.com/app/posters/dune.jpg',
    )
    expect(meta(tags, 'og:image:width')).toBe('1200')
    expect(meta(tags, 'og:image:height')).toBe('630')
    expect(meta(tags, 'og:image:alt')).toBe('Dune poster')
    expect(meta(tags, 'twitter:card')).toBe('summary_large_image')
    expect(meta(tags, 'twitter:site')).toBe('@trek')
    expect(meta(tags, 'twitter:title')).toBe('Dune')
    expect(meta(tags, 'twitter:image')).toBe(
      'https://example.com/app/posters/dune.jpg',
    )
    expect(meta(tags, 'robots')).toBeUndefined()

    const scripts = tags.filter((tag) => tag.tag === 'script')
    expect(scripts).toHaveLength(1)
    expect(JSON.parse((scripts[0] as { text: string }).text)['@type']).toBe(
      'Movie',
    )
  })

  it('writes each tag once', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      description: 'x',
      url: '/movies/1',
      image: '/a.jpg',
    })
    const keys = tags.map((tag) =>
      tag.tag === 'meta' ? ('name' in tag ? tag.name : tag.property) : tag.tag,
    )
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('writes no canonical link and no share card for a page with no url', () => {
    const tags = toHeadTags(site, {
      title: 'Filters',
      description: 'Pick a genre.',
      noindex: true,
      image: '/a.jpg',
    })
    expect(tags).toEqual([
      { tag: 'title', text: 'Filters | Trek' },
      { tag: 'meta', name: 'description', content: 'Pick a genre.' },
      { tag: 'meta', name: 'robots', content: 'noindex' },
    ])
  })

  it('writes the robots tag with noindex and keeps the canonical link', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      url: '/movies/1',
      noindex: true,
    })
    expect(meta(tags, 'robots')).toBe('noindex')
    expect(tags.some((tag) => tag.tag === 'link')).toBe(true)
  })

  it('writes no image size without an image, and no size tags without a size', () => {
    const noImage = toHeadTags(site, {
      title: 'Dune',
      url: '/movies/1',
      imageSize: { width: 1, height: 1 },
    })
    expect(meta(noImage, 'og:image')).toBeUndefined()
    expect(count(noImage, 'og:image:width')).toBe(0)
    expect(meta(noImage, 'twitter:card')).toBe('summary')

    const noSize = toHeadTags(site, {
      title: 'Dune',
      url: '/movies/1',
      image: 'https://cdn.example.com/a.jpg',
    })
    expect(meta(noSize, 'og:image')).toBe('https://cdn.example.com/a.jpg')
    expect(count(noSize, 'og:image:width')).toBe(0)
    expect(count(noSize, 'og:image:height')).toBe(0)
    expect(meta(noSize, 'twitter:card')).toBe('summary_large_image')
  })

  it('treats a null image the same as no image', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      url: '/movies/1',
      image: null,
    })
    expect(meta(tags, 'og:image')).toBeUndefined()
    expect(meta(tags, 'twitter:image')).toBeUndefined()
  })

  it('lets twitterCard force the card type', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      url: '/movies/1',
      image: '/a.jpg',
      twitterCard: 'summary',
    })
    expect(meta(tags, 'twitter:card')).toBe('summary')
  })

  it('writes og:description and the meta description from the same clipped text', () => {
    const long = 'word '.repeat(60)
    const tags = toHeadTags(site, {
      title: 'Dune',
      url: '/x',
      description: long,
    })
    const description = meta(tags, 'description')!
    expect(description.length).toBeLessThanOrEqual(160)
    expect(meta(tags, 'og:description')).toBe(description)
    expect(meta(tags, 'twitter:description')).toBe(description)
  })

  it('writes no description tags for an empty description', () => {
    const tags = toHeadTags(site, {
      title: 'Dune',
      url: '/x',
      description: '  ',
    })
    expect(count(tags, 'description')).toBe(0)
    expect(count(tags, 'og:description')).toBe(0)
  })

  it('escapes </script> inside the JSON-LD', () => {
    const tags = toHeadTags(site, {
      title: 'x',
      jsonLd: [
        movie({
          name: '</script><script>alert(1)</script>',
          url: 'https://x.y',
        }),
      ],
    })
    const script = tags.find((tag) => tag.tag === 'script') as { text: string }
    expect(script.text).not.toContain('</script>')
    expect(script.text).toContain('\\u003c/script>')
    expect(JSON.parse(script.text).name).toBe(
      '</script><script>alert(1)</script>',
    )
  })

  it('uses the page locale over the site locale', () => {
    const tags = toHeadTags(site, { title: 'x', url: '/x', locale: 'fr_FR' })
    expect(meta(tags, 'og:locale')).toBe('fr_FR')
  })
})

import { render } from '@testing-library/react'
import Head from 'expo-router/head'
import { PageHead as DomPageHead } from '../../dom'
import { PageHead as RouterPageHead } from '../../expo-router'
import { defineSite, headTagsHtml, toHeadTags } from '../../index'
import { SeoProvider } from '../../react'
import { movie } from '../../schema'
import type { PageMeta } from '../../types'

const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app',
  twitterSite: '@trek',
})

const dune: PageMeta = {
  title: 'Dune',
  description: 'A duke moves to a desert planet.',
  url: '/movies/1',
  image: '/posters/dune.jpg',
  imageSize: { width: 1200, height: 630 },
  type: 'video.movie',
  alternates: [
    { lang: 'en', url: '/movies/1' },
    { lang: 'de', url: '/de/movies/1' },
  ],
  jsonLd: [movie({ name: 'Dune', url: 'https://example.com/app/movies/1' })],
}

/**
 * The head elements that are tags: react-native-web adds a stylesheet, and
 * `document.title = ''` leaves an empty `<title>`.
 */
function headTags(): Element[] {
  return Array.from(document.head.children).filter(
    (node) =>
      node.tagName !== 'STYLE' &&
      !(node.tagName === 'TITLE' && node.textContent === ''),
  )
}

/**
 * One line per head element, with no renderer marker, sorted. The JSON-LD is
 * not in it: the Expo Router `PageHead` writes it into the body.
 */
function headSignature(): string[] {
  return headTags()
    .filter((node) => node.tagName !== 'SCRIPT')
    .map((node) => {
      const attributes = Array.from(node.attributes)
        .filter((attribute) => !attribute.name.startsWith('data-'))
        .map((attribute) => `${attribute.name}="${attribute.value}"`)
        .sort()
        .join(' ')
      return `${node.tagName.toLowerCase()} ${attributes} ${node.textContent}`
    })
    .sort()
}

/** `lang href` for each `hreflang` link in the head, in order. */
function hreflangs(): string[] {
  return Array.from(document.head.querySelectorAll('link[hreflang]')).map(
    (node) => `${node.getAttribute('hreflang')} ${node.getAttribute('href')}`,
  )
}

/** The text of each JSON-LD script in the document, head and body. */
function jsonLdTexts(): string[] {
  return Array.from(
    document.querySelectorAll('script[type="application/ld+json"]'),
  ).map((node) => node.textContent ?? '')
}

function content(selector: string): string[] {
  return Array.from(document.head.querySelectorAll(selector)).map(
    (node) => node.getAttribute('content') ?? node.getAttribute('href') ?? '',
  )
}

afterEach(() => {
  document.head.innerHTML = ''
  document.title = ''
})

describe('PageHead from /dom', () => {
  it('writes the same head as the Expo Router PageHead, from one PageMeta', () => {
    const router = render(
      <Head.Provider>
        <SeoProvider site={site}>
          <RouterPageHead {...dune} />
        </SeoProvider>
      </Head.Provider>,
    )
    const fromRouter = headSignature()
    const routerTitle = document.title
    const routerJsonLd = jsonLdTexts()
    router.unmount()
    document.head.innerHTML = ''

    render(
      <SeoProvider site={site}>
        <DomPageHead {...dune} />
      </SeoProvider>,
    )
    expect(fromRouter.length).toBeGreaterThan(10)
    expect(fromRouter.filter((line) => line.includes('hreflang'))).toHaveLength(
      3,
    )
    expect(headSignature()).toEqual(fromRouter)
    expect(document.title).toBe(routerTitle)
    expect(routerJsonLd).toHaveLength(1)
    expect(jsonLdTexts()).toEqual(routerJsonLd)
  })

  it('replaces its tags on a change and takes them out on unmount', () => {
    const { rerender, unmount } = render(
      <SeoProvider site={site}>
        <DomPageHead title="One" description="First" url="/one" />
      </SeoProvider>,
    )
    expect(document.title).toBe('One | Trek')
    expect(content('meta[name="description"]')).toEqual(['First'])
    expect(content('link[rel="canonical"]')).toEqual([
      'https://example.com/app/one',
    ])

    rerender(
      <SeoProvider site={site}>
        <DomPageHead title="Two" url="/two" />
      </SeoProvider>,
    )
    expect(document.title).toBe('Two | Trek')
    expect(content('meta[name="description"]')).toEqual([])
    expect(content('link[rel="canonical"]')).toEqual([
      'https://example.com/app/two',
    ])

    unmount()
    expect(headTags()).toHaveLength(0)
    expect(document.title).toBe('')
  })

  it('takes a template tag of the same slot out while it is on, and puts it back', () => {
    document.head.innerHTML =
      '<meta charset="utf-8"><meta name="description" content="From the template"><link rel="canonical" href="/template">'
    document.title = 'Template'
    const { unmount } = render(
      <SeoProvider site={site}>
        <DomPageHead title="Page" description="From the page" url="/page" />
      </SeoProvider>,
    )
    expect(content('meta[name="description"]')).toEqual(['From the page'])
    expect(content('link[rel="canonical"]')).toEqual([
      'https://example.com/app/page',
    ])
    expect(document.head.querySelector('meta[charset]')).not.toBeNull()

    unmount()
    expect(content('meta[name="description"]')).toEqual(['From the template'])
    expect(content('link[rel="canonical"]')).toEqual(['/template'])
    expect(document.title).toBe('Template')
  })

  it('takes a template tag out of a slot it leaves empty, and puts it back', () => {
    document.head.innerHTML =
      '<link rel="manifest" href="/manifest.json"><link rel="canonical" href="/template"><meta property="og:image" content="/template.jpg">'
    const { unmount } = render(
      <SeoProvider site={site}>
        <DomPageHead title="Trailer" noindex />
      </SeoProvider>,
    )
    expect(content('meta[name="robots"]')).toEqual(['noindex'])
    expect(content('link[rel="canonical"]')).toEqual([])
    expect(content('meta[property="og:image"]')).toEqual([])
    expect(document.head.querySelector('link[rel="manifest"]')).not.toBeNull()

    unmount()
    expect(content('link[rel="canonical"]')).toEqual(['/template'])
    expect(content('meta[property="og:image"]')).toEqual(['/template.jpg'])
  })

  it('lets a screen mounted over another win, and gives the head back below', () => {
    const { rerender } = render(
      <SeoProvider site={site}>
        <DomPageHead title="List" description="The list" url="/list" />
      </SeoProvider>,
    )
    rerender(
      <SeoProvider site={site}>
        <DomPageHead title="List" description="The list" url="/list" />
        <DomPageHead title="Item" description="The item" url="/list/1" />
      </SeoProvider>,
    )
    expect(document.title).toBe('Item | Trek')
    expect(content('meta[name="description"]')).toEqual(['The item'])

    rerender(
      <SeoProvider site={site}>
        <DomPageHead title="List" description="The list" url="/list" />
      </SeoProvider>,
    )
    expect(document.title).toBe('List | Trek')
    expect(content('meta[name="description"]')).toEqual(['The list'])
    expect(content('link[rel="canonical"]')).toEqual([
      'https://example.com/app/list',
    ])
  })

  it('takes the hreflang links below out as one set, and leaves a feed link', () => {
    document.head.innerHTML = [
      '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
      '<link rel="alternate" hreflang="en" href="/template">',
      '<link rel="alternate" hreflang="fr" href="/fr/template">',
    ].join('')
    const list = (
      <DomPageHead
        title="List"
        url="/list"
        alternates={[
          { lang: 'en', url: '/list' },
          { lang: 'es', url: '/es/list' },
        ]}
      />
    )
    const feed = () =>
      document.head.querySelectorAll('link[type="application/rss+xml"]')
    const { rerender, unmount } = render(
      <SeoProvider site={site}>{list}</SeoProvider>,
    )
    expect(hreflangs()).toEqual([
      'en https://example.com/app/list',
      'es https://example.com/app/es/list',
      'x-default https://example.com/app/list',
    ])
    expect(feed()).toHaveLength(1)

    rerender(
      <SeoProvider site={site}>
        {list}
        <DomPageHead
          title="Item"
          url="/list/1"
          alternates={[
            { lang: 'en', url: '/list/1' },
            { lang: 'de', url: '/de/list/1' },
          ]}
        />
      </SeoProvider>,
    )
    expect(hreflangs()).toEqual([
      'en https://example.com/app/list/1',
      'de https://example.com/app/de/list/1',
      'x-default https://example.com/app/list/1',
    ])

    rerender(<SeoProvider site={site}>{list}</SeoProvider>)
    expect(hreflangs()).toEqual([
      'en https://example.com/app/list',
      'es https://example.com/app/es/list',
      'x-default https://example.com/app/list',
    ])

    unmount()
    expect(hreflangs()).toEqual(['en /template', 'fr /fr/template'])
    expect(feed()).toHaveLength(1)
  })

  it('writes nothing while inactive, and takes the site from the prop', () => {
    const { rerender } = render(
      <DomPageHead site={site} title="Behind" url="/behind" active={false} />,
    )
    expect(headTags()).toHaveLength(0)
    rerender(<DomPageHead site={site} title="Behind" url="/behind" />)
    expect(document.title).toBe('Behind | Trek')
  })
})

describe('headTagsHtml', () => {
  it('writes the tags for a static template, escaped', () => {
    const html = headTagsHtml(
      toHeadTags(site, {
        title: 'Tom & "Jerry" <3',
        description: 'A cat & a mouse',
        url: '/t?a=1&b=2',
        alternates: [{ lang: 'en', url: '/t?a=1&b=2' }],
        jsonLd: [
          movie({ name: '</script>', url: 'https://example.com/app/t' }),
        ],
      }),
    )
    expect(html).toContain(
      '<title>Tom &amp; &quot;Jerry&quot; &lt;3 | Trek</title>',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://example.com/app/t?a=1&amp;b=2">',
    )
    expect(html).toContain(
      '<link rel="alternate" hreflang="en" href="https://example.com/app/t?a=1&amp;b=2">',
    )
    expect(html).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://example.com/app/t?a=1&amp;b=2">',
    )
    expect(html).toContain(
      '<meta name="description" content="A cat &amp; a mouse">',
    )
    expect(html).toContain(
      '<meta property="og:title" content="Tom &amp; &quot;Jerry&quot; &lt;3">',
    )
    expect(html).toContain('<script type="application/ld+json">')
    expect(html).not.toContain('</script>"')
    expect(html).toContain('\\u003c/script>')
  })
})

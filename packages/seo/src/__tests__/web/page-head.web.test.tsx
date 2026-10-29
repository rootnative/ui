import { render } from '@testing-library/react'
import Head from 'expo-router/head'
import type { ReactElement } from 'react'
import { PageHead } from '../../expo-router'
import { defineSite } from '../../index'
import { SeoProvider } from '../../react'
import { movie } from '../../schema'

declare global {
  // eslint-disable-next-line no-var
  var __seoRoute: { pathname: string; focused: boolean }
}

const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app',
  twitterSite: '@trek',
})

const JSON_LD = 'script[type="application/ld+json"]'

function renderHead(ui: ReactElement) {
  return render(<Head.Provider>{ui}</Head.Provider>)
}

function metaContent(selector: string): string[] {
  return Array.from(document.head.querySelectorAll(selector)).map(
    (node) => node.getAttribute('content') ?? '',
  )
}

/** Puts a tag into the head the way a static page holds it: no Helmet marker. */
function serverTag(html: string) {
  document.head.insertAdjacentHTML('beforeend', html)
}

beforeEach(() => {
  global.__seoRoute = { pathname: '/', focused: true }
})

afterEach(() => {
  document.head.innerHTML = ''
})

describe('PageHead', () => {
  it('writes each head tag once into document.head through the provider, and the JSON-LD into the body', () => {
    const { container } = renderHead(
      <SeoProvider site={site}>
        <PageHead
          title="Dune"
          description="A duke moves to a desert planet."
          url="/movies/1"
          image="/posters/dune.jpg"
          imageSize={{ width: 1200, height: 630 }}
          type="video.movie"
          jsonLd={[
            movie({ name: 'Dune', url: 'https://example.com/app/movies/1' }),
          ]}
        />
      </SeoProvider>,
    )

    expect(document.title).toBe('Dune | Trek')
    expect(metaContent('meta[name="description"]')).toEqual([
      'A duke moves to a desert planet.',
    ])
    expect(metaContent('meta[property="og:title"]')).toEqual(['Dune'])
    expect(metaContent('meta[property="og:type"]')).toEqual(['video.movie'])
    expect(metaContent('meta[property="og:image:width"]')).toEqual(['1200'])
    expect(metaContent('meta[name="twitter:card"]')).toEqual([
      'summary_large_image',
    ])

    const canonical = document.head.querySelectorAll('link[rel="canonical"]')
    expect(canonical).toHaveLength(1)
    expect(canonical[0]?.getAttribute('href')).toBe(
      'https://example.com/app/movies/1',
    )

    // From Expo SDK 58 the static export writes no Helmet tag, so the
    // JSON-LD is in the page body, where every renderer writes it.
    expect(document.head.querySelectorAll(JSON_LD)).toHaveLength(0)
    const scripts = container.querySelectorAll(JSON_LD)
    expect(scripts).toHaveLength(1)
    expect(JSON.parse(scripts[0]?.textContent ?? '')).toMatchObject({
      '@type': 'Movie',
      name: 'Dune',
    })
  })

  it('writes no JSON-LD from a screen that is not focused', () => {
    global.__seoRoute.focused = false
    const { container } = renderHead(
      <PageHead
        site={site}
        title="Dune"
        url="/movies/1"
        jsonLd={[
          movie({ name: 'Dune', url: 'https://example.com/app/movies/1' }),
        ]}
      />,
    )
    expect(document.querySelectorAll(JSON_LD)).toHaveLength(0)
    expect(container.innerHTML).toBe('')
  })

  it('takes out each server tag in a page slot, and keeps every other tag', () => {
    // The head a static page holds from `generateMetadata` and `+html.tsx`.
    serverTag('<title>Dune | Trek</title>')
    serverTag('<meta name="description" content="Old text.">')
    serverTag('<link rel="canonical" href="https://example.com/app/old">')
    serverTag(
      '<link rel="alternate" hreflang="fr" href="https://example.com/app/fr/old">',
    )
    serverTag('<meta property="og:url" content="https://example.com/app/old">')
    serverTag('<meta name="theme-color" content="#000000">')
    serverTag('<link rel="icon" href="/favicon.ico">')
    serverTag('<meta property="og:image" content="https://example.com/a.jpg">')

    renderHead(
      <PageHead
        site={site}
        title="Dune"
        description="A duke moves to a desert planet."
        url="/movies/1"
        alternates={[{ lang: 'en', url: '/movies/1' }]}
      />,
    )

    expect(metaContent('meta[name="description"]')).toEqual([
      'A duke moves to a desert planet.',
    ])
    expect(
      Array.from(document.head.querySelectorAll('link[rel="canonical"]')).map(
        (node) => node.getAttribute('href'),
      ),
    ).toEqual(['https://example.com/app/movies/1'])
    expect(
      Array.from(document.head.querySelectorAll('link[hreflang]')).map((node) =>
        node.getAttribute('hreflang'),
      ),
    ).toEqual(['en', 'x-default'])
    expect(metaContent('meta[property="og:url"]')).toEqual([
      'https://example.com/app/movies/1',
    ])
    expect(document.querySelectorAll('title')).toHaveLength(1)
    expect(document.title).toBe('Dune | Trek')
    // Not a page slot: the shell tags stay.
    expect(metaContent('meta[name="theme-color"]')).toEqual(['#000000'])
    expect(document.head.querySelector('link[rel="icon"]')).not.toBeNull()
    // A page slot this page leaves empty: the image of a `generateMetadata`
    // that disagrees with the screen goes too.
    expect(metaContent('meta[property="og:image"]')).toEqual([])
  })

  it('takes the canonical link and the share card of the shell out under a noindex head', () => {
    // A route the export did not write is served from the home shell, with
    // the home head from `generateMetadata` and the tags of `+html.tsx`.
    serverTag('<meta charset="utf-8">')
    serverTag('<meta name="viewport" content="width=device-width">')
    serverTag('<title>Trek</title>')
    serverTag('<meta name="description" content="The home page.">')
    serverTag('<link rel="canonical" href="https://example.com/app/">')
    serverTag('<meta property="og:type" content="website">')
    serverTag('<meta property="og:title" content="Trek">')
    serverTag('<meta property="og:url" content="https://example.com/app/">')
    serverTag('<meta property="og:image" content="https://example.com/a.jpg">')
    serverTag('<meta name="twitter:card" content="summary_large_image">')
    serverTag('<meta name="twitter:title" content="Trek">')
    serverTag('<link rel="manifest" href="/manifest.json">')
    serverTag('<link rel="icon" href="/favicon.ico">')
    serverTag(
      '<link rel="alternate" type="application/rss+xml" href="/feed.xml">',
    )

    renderHead(<PageHead site={site} title="Trailer" noindex />)

    expect(document.title).toBe('Trailer | Trek')
    expect(metaContent('meta[name="robots"]')).toEqual(['noindex'])
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
    expect(metaContent('meta[name="description"]')).toEqual([])
    expect(
      document.head.querySelectorAll('meta[property^="og:"]'),
    ).toHaveLength(0)
    expect(
      document.head.querySelectorAll('meta[name^="twitter:"]'),
    ).toHaveLength(0)
    expect(document.head.querySelector('meta[charset]')).not.toBeNull()
    expect(document.head.querySelector('meta[name="viewport"]')).not.toBeNull()
    expect(document.head.querySelector('link[rel="manifest"]')).not.toBeNull()
    expect(document.head.querySelector('link[rel="icon"]')).not.toBeNull()
    expect(
      document.head.querySelector(
        'link[rel="alternate"][type="application/rss+xml"]',
      ),
    ).not.toBeNull()
  })

  it('takes out no server tag from a screen that is not focused', () => {
    global.__seoRoute.focused = false
    serverTag('<meta name="description" content="Old text.">')
    renderHead(<PageHead site={site} title="Dune" description="New text." />)
    // The mock `Head` has no focus check, so it still writes "New text.".
    expect(metaContent('meta[name="description"]')).toContain('Old text.')
  })

  it('takes the site from the prop when there is no provider', () => {
    renderHead(<PageHead site={site} title="Not found" noindex />)
    expect(document.title).toBe('Not found | Trek')
    expect(metaContent('meta[name="robots"]')).toEqual(['noindex'])
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('lets the prop win over the provider', () => {
    const other = defineSite({ name: 'Other', url: 'https://other.example' })
    renderHead(
      <SeoProvider site={site}>
        <PageHead site={other} title="Page" url="/p" />
      </SeoProvider>,
    )
    expect(document.title).toBe('Page | Other')
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe('https://other.example/p')
  })

  it('throws without a provider and without a prop', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHead(<PageHead title="x" />)).toThrow(/SeoProvider/)
    error.mockRestore()
  })
})

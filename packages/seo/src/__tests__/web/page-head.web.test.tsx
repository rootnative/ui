import { render } from '@testing-library/react'
import Head from 'expo-router/head'
import type { ReactElement } from 'react'
import { PageHead } from '../../expo-router'
import { defineSite } from '../../index'
import { SeoProvider } from '../../react'
import { movie } from '../../schema'

const site = defineSite({
  name: 'Trek',
  url: 'https://example.com/app',
  twitterSite: '@trek',
})

function renderHead(ui: ReactElement) {
  return render(<Head.Provider>{ui}</Head.Provider>)
}

function metaContent(selector: string): string[] {
  return Array.from(document.head.querySelectorAll(selector)).map(
    (node) => node.getAttribute('content') ?? '',
  )
}

afterEach(() => {
  document.head.innerHTML = ''
})

describe('PageHead', () => {
  it('writes each tag once into document.head through the provider', () => {
    renderHead(
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

    const scripts = document.head.querySelectorAll(
      'script[type="application/ld+json"]',
    )
    expect(scripts).toHaveLength(1)
    expect(JSON.parse(scripts[0]?.textContent ?? '')).toMatchObject({
      '@type': 'Movie',
      name: 'Dune',
    })
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

import { cleanup, render } from '@testing-library/react'
import { PageHead as DomPageHead } from '../../dom'
import { defineSite } from '../../index'
import { SeoProvider } from '../../react'
import { movie } from '../../schema'
import type { PageMeta } from '../../types'
import { PageHead } from '../../web'

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

/** One line per head tag, with no renderer marker, sorted. */
function headSignature(): string[] {
  return Array.from(document.head.children)
    .filter(
      (node) =>
        node.tagName !== 'STYLE' &&
        node.tagName !== 'SCRIPT' &&
        !(node.tagName === 'TITLE' && node.textContent === ''),
    )
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

function jsonLdTexts(root: ParentNode): string[] {
  return Array.from(
    root.querySelectorAll('script[type="application/ld+json"]'),
  ).map((node) => node.textContent ?? '')
}

function content(selector: string): string[] {
  return Array.from(document.head.querySelectorAll(selector)).map(
    (node) => node.getAttribute('content') ?? node.getAttribute('href') ?? '',
  )
}

// React removes its own head tags on unmount, so the unmount comes first.
afterEach(() => {
  cleanup()
  document.head.innerHTML = ''
  document.title = ''
})

describe('PageHead from /web', () => {
  it('writes the same head as the /dom PageHead, from one PageMeta', () => {
    const dom = render(
      <SeoProvider site={site}>
        <DomPageHead {...dune} />
      </SeoProvider>,
    )
    const fromDom = headSignature()
    const domTitle = document.title
    const domJsonLd = jsonLdTexts(document)
    dom.unmount()

    const { container } = render(
      <SeoProvider site={site}>
        <PageHead {...dune} />
      </SeoProvider>,
    )
    expect(fromDom.length).toBeGreaterThan(10)
    expect(headSignature()).toEqual(fromDom)
    expect(document.title).toBe(domTitle)
    expect(domJsonLd).toHaveLength(1)
    expect(jsonLdTexts(container)).toEqual(domJsonLd)
  })

  it('replaces its tags on a change and takes them out on unmount', () => {
    const { rerender, unmount } = render(
      <SeoProvider site={site}>
        <PageHead title="One" description="First" url="/one" />
      </SeoProvider>,
    )
    expect(document.title).toBe('One | Trek')
    expect(content('meta[name="description"]')).toEqual(['First'])

    rerender(
      <SeoProvider site={site}>
        <PageHead title="Two" url="/two" />
      </SeoProvider>,
    )
    expect(document.title).toBe('Two | Trek')
    expect(content('meta[name="description"]')).toEqual([])
    expect(content('link[rel="canonical"]')).toEqual([
      'https://example.com/app/two',
    ])

    unmount()
    expect(headSignature()).toHaveLength(0)
    expect(document.title).toBe('')
  })

  it('takes the template tags of its slots out while it is on, and puts them back', () => {
    document.head.innerHTML =
      '<meta charset="utf-8"><title>Template</title><meta name="description" content="From the template"><link rel="canonical" href="/template"><meta property="og:image" content="/template.jpg">'
    const { unmount } = render(
      <SeoProvider site={site}>
        <PageHead title="Trailer" description="From the page" noindex />
      </SeoProvider>,
    )
    expect(document.title).toBe('Trailer | Trek')
    expect(content('meta[name="description"]')).toEqual(['From the page'])
    expect(content('meta[name="robots"]')).toEqual(['noindex'])
    expect(content('link[rel="canonical"]')).toEqual([])
    expect(content('meta[property="og:image"]')).toEqual([])
    expect(document.head.querySelector('meta[charset]')).not.toBeNull()

    unmount()
    expect(document.title).toBe('Template')
    expect(content('meta[name="description"]')).toEqual(['From the template'])
    expect(content('link[rel="canonical"]')).toEqual(['/template'])
    expect(content('meta[property="og:image"]')).toEqual(['/template.jpg'])
  })

  it('renders no tag while active is false', () => {
    const list = (active: boolean) => (
      <SeoProvider site={site}>
        <PageHead
          title="List"
          description="The list"
          url="/list"
          active={active}
        />
        {active ? null : (
          <PageHead title="Item" description="The item" url="/list/1" />
        )}
      </SeoProvider>
    )
    const { rerender, container } = render(list(false))
    expect(document.title).toBe('Item | Trek')
    expect(content('meta[name="description"]')).toEqual(['The item'])

    rerender(list(true))
    expect(document.title).toBe('List | Trek')
    expect(content('meta[name="description"]')).toEqual(['The list'])
    expect(jsonLdTexts(container)).toHaveLength(0)
  })
})

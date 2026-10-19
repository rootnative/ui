import { render } from '@testing-library/react'
import Head from 'expo-router/head'
import type { ReactElement } from 'react'
import { PageHead, RouteHead } from '../../expo-router'
import { defineSite } from '../../index'
import { SeoProvider } from '../../react'
import { webSite } from '../../schema'

declare global {
  // eslint-disable-next-line no-var
  var __seoRoute: { pathname: string; focused: boolean }
}

const site = defineSite({ name: 'Trek', url: 'https://example.com/app' })

const defaults = (pathname: string) =>
  pathname === '/none'
    ? undefined
    : {
        title: `Default ${pathname}`,
        description: 'From the route.',
        url: pathname,
      }

function renderHead(ui: ReactElement) {
  return render(<Head.Provider>{ui}</Head.Provider>)
}

function canonical(): string | null {
  const links = document.head.querySelectorAll('link[rel="canonical"]')
  expect(links.length).toBeLessThanOrEqual(1)
  return links[0]?.getAttribute('href') ?? null
}

function robots(): string | null {
  return (
    document.head
      .querySelector('meta[name="robots"]')
      ?.getAttribute('content') ?? null
  )
}

beforeEach(() => {
  global.__seoRoute = { pathname: '/movies', focused: true }
})

afterEach(() => {
  document.head.innerHTML = ''
})

describe('RouteHead', () => {
  it('writes the defaults of a route with no PageHead', () => {
    renderHead(
      <SeoProvider site={site}>
        <RouteHead defaults={defaults} />
      </SeoProvider>,
    )
    expect(document.title).toBe('Default /movies | Trek')
    expect(canonical()).toBe('https://example.com/app/movies')
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe('From the route.')
  })

  it('writes nothing when the defaults return undefined', () => {
    global.__seoRoute.pathname = '/none'
    renderHead(
      <SeoProvider site={site}>
        <RouteHead defaults={defaults} />
      </SeoProvider>,
    )
    expect(document.title).toBe('')
    expect(canonical()).toBeNull()
  })

  it('lets a PageHead on the route win the whole page', () => {
    renderHead(
      <SeoProvider site={site}>
        <PageHead title="Not found" noindex />
        <RouteHead defaults={defaults} />
      </SeoProvider>,
    )
    expect(document.title).toBe('Not found | Trek')
    expect(robots()).toBe('noindex')
    expect(canonical()).toBeNull()
  })

  it('writes the defaults again once the PageHead is gone', () => {
    const { rerender } = renderHead(
      <SeoProvider site={site}>
        <PageHead title="Page" url="/page" />
        <RouteHead defaults={defaults} />
      </SeoProvider>,
    )
    expect(document.title).toBe('Page | Trek')

    rerender(
      <Head.Provider>
        <SeoProvider site={site}>
          <RouteHead defaults={defaults} />
        </SeoProvider>
      </Head.Provider>,
    )
    expect(document.title).toBe('Default /movies | Trek')
    expect(canonical()).toBe('https://example.com/app/movies')
  })

  it('ignores a PageHead on a screen that is not focused', () => {
    global.__seoRoute.focused = false
    renderHead(
      <SeoProvider site={site}>
        <PageHead title="Behind" url="/behind" />
        <RouteHead defaults={defaults} />
      </SeoProvider>,
    )
    expect(document.title).toBe('Default /movies | Trek')
  })

  it('hides itself after the fact, with a warning, when it sits before the PageHead', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    renderHead(
      <SeoProvider site={site}>
        <RouteHead defaults={defaults} />
        <PageHead title="Not found" noindex />
      </SeoProvider>,
    )
    expect(document.title).toBe('Not found | Trek')
    expect(canonical()).toBeNull()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('after the navigator'),
    )
    warn.mockRestore()
  })

  it('takes the site from the prop when there is no provider', () => {
    renderHead(<RouteHead site={site} defaults={defaults} />)
    expect(document.title).toBe('Default /movies | Trek')
  })

  it('writes the JSON-LD of the defaults into the body, and takes out a server tag in its slot', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<link rel="canonical" href="https://example.com/app/old">',
    )
    const { container } = renderHead(
      <RouteHead
        site={site}
        defaults={(pathname) => ({
          title: 'Movies',
          url: pathname,
          jsonLd: [webSite({ name: 'Trek', url: 'https://example.com/app' })],
        })}
      />,
    )
    expect(canonical()).toBe('https://example.com/app/movies')
    const selector = 'script[type="application/ld+json"]'
    expect(document.head.querySelectorAll(selector)).toHaveLength(0)
    expect(container.querySelectorAll(selector)).toHaveLength(1)
  })
})

import { renderToString } from 'react-dom/server'
import { defineSite } from '../index'
import { SeoProvider } from '../react'
import { movie } from '../schema'
import { PageHead } from '../web'

// The component renders nothing on native, and this project runs as native.
// `react-dom/server` needs a `MessageChannel`, which the `web` project does
// not have, so the server render is tested here.
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }))

const site = defineSite({ name: 'Trek', url: 'https://example.com/app' })

describe('PageHead from /web on a server', () => {
  it('puts the head in the HTML', () => {
    const html = renderToString(
      <SeoProvider site={site}>
        <PageHead
          title="Dune"
          description="A duke moves to a desert planet."
          url="/movies/1"
          alternates={[
            { lang: 'en', url: '/movies/1' },
            { lang: 'de', url: '/de/movies/1' },
          ]}
          jsonLd={[
            movie({ name: 'Dune', url: 'https://example.com/app/movies/1' }),
          ]}
        />
      </SeoProvider>,
    )
    expect(html).toContain('>Dune | Trek</title>')
    expect(html).toContain('content="A duke moves to a desert planet."')
    expect(html).toContain(
      '<link rel="canonical" href="https://example.com/app/movies/1"',
    )
    expect(html).toContain('hrefLang="de"')
    expect(html).toContain('<script type="application/ld+json">')
  })

  it('renders no tag while active is false', () => {
    const html = renderToString(
      <SeoProvider site={site}>
        <PageHead title="Dune" url="/movies/1" active={false} />
      </SeoProvider>,
    )
    expect(html).toBe('')
  })
})

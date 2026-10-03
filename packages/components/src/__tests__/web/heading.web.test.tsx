/**
 * The heading outline a crawler reads, pinned where it can be read.
 *
 * The static export of the example app had three `<h1>` on its home page:
 * the AppBar title, the hero, and a display glyph. The library gave every
 * display and headline variant the header role with no level, and
 * react-native-web writes a level-less header as `<h1>`. The native suite
 * cannot see this: RNTL reads `accessibilityRole="header"` and is satisfied.
 * Only the DOM tag name shows the level.
 */
import { screen } from '@testing-library/react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppBar } from '../../appbar'
import { Typography } from '../../typography'
import { renderWeb } from './render-web'

describe('Typography heading level on the web', () => {
  it('renders <hN> for a level', () => {
    renderWeb(
      <Typography variant="titleMedium" level={2}>
        Cast
      </Typography>,
    )
    const node = screen.getByText('Cast')
    expect(node.tagName).toBe('H2')
    expect(node.getAttribute('aria-level')).toBe('2')
  })

  it('renders a plain element for a headline variant with no level', () => {
    renderWeb(<Typography variant="headlineSmall">Aa</Typography>)
    const node = screen.getByText('Aa')
    expect(node.tagName).not.toMatch(/^H[1-6]$/)
    expect(node.getAttribute('role')).toBeNull()
  })

  it('keeps an aria-level passed by a wrapper, as Heading from @rootnative/seo does', () => {
    renderWeb(
      <Typography
        variant="titleMedium"
        accessibilityRole="header"
        aria-level={3}
      >
        Crew
      </Typography>,
    )
    expect(screen.getByText('Crew').tagName).toBe('H3')
  })

  it('renders <h1> for a display variant with level 1', () => {
    renderWeb(
      <Typography variant="displayLarge" level={1}>
        Dune
      </Typography>,
    )
    expect(screen.getByText('Dune').tagName).toBe('H1')
  })
})

describe('AppBar title level on the web', () => {
  it('is <h1> by default', () => {
    renderWeb(
      <SafeAreaProvider>
        <AppBar title="Button" />
      </SafeAreaProvider>,
    )
    expect(screen.getByText('Button').tagName).toBe('H1')
  })

  it('follows titleLevel', () => {
    renderWeb(
      <SafeAreaProvider>
        <AppBar title="Button" titleLevel={2} />
      </SafeAreaProvider>,
    )
    expect(screen.getByText('Button').tagName).toBe('H2')
  })
})

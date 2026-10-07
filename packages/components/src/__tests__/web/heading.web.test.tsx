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
import { NavigationDrawer } from '../../navigation-drawer'
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

  it.each(['headlineSmall', 'headlineLargeEmphasized'] as const)(
    'renders a plain element for %s with no level',
    (variant) => {
      renderWeb(<Typography variant={variant}>Aa</Typography>)
      const node = screen.getByText('Aa')
      expect(node.tagName).not.toMatch(/^H[1-6]$/)
      expect(node.getAttribute('role')).toBeNull()
    },
  )

  it('renders <h1> for an emphasized headline with level 1', () => {
    renderWeb(
      <Typography variant="headlineLargeEmphasized" level={1}>
        Dune
      </Typography>,
    )
    expect(screen.getByText('Dune').tagName).toBe('H1')
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

describe('NavigationDrawer section headline level on the web', () => {
  function renderSection(headingLevel?: 2 | 3) {
    renderWeb(
      <NavigationDrawer variant="standard" defaultValue="inbox">
        <NavigationDrawer.Section headline="Mail" headingLevel={headingLevel}>
          <NavigationDrawer.Item value="inbox" label="Inbox" />
        </NavigationDrawer.Section>
      </NavigationDrawer>,
    )
  }

  it('is <h2> by default, not one <h1> per section', () => {
    renderSection()
    expect(screen.getByText('Mail').tagName).toBe('H2')
  })

  it('follows headingLevel', () => {
    renderSection(3)
    expect(screen.getByText('Mail').tagName).toBe('H3')
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

  it.each(['small', 'large'] as const)(
    'keeps the subtitle out of the heading on a %s bar',
    (variant) => {
      renderWeb(
        <SafeAreaProvider>
          <AppBar title="Inbox" subtitle="3 unread" variant={variant} />
        </SafeAreaProvider>,
      )
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.textContent).toBe('Inbox')
      const subtitle = screen.getByText('3 unread')
      expect(subtitle.closest('h1, h2, h3, h4, h5, h6')).toBeNull()
      expect(subtitle.getAttribute('role')).toBeNull()
    },
  )
})

import { render, screen } from '@testing-library/react-native'
import { PageHead } from '../expo-router'
import { defineSite } from '../index'
import { Heading, imageLabel, SeoProvider } from '../react'

const site = defineSite({ name: 'Trek', url: 'https://example.com' })

describe('imageLabel', () => {
  it('joins the subject and the lower-cased kind', () => {
    expect(imageLabel('Poster', 'Dune')).toBe('Dune poster')
  })

  it('returns the kind alone without a subject', () => {
    expect(imageLabel('Poster')).toBe('Poster')
    expect(imageLabel('Poster', null)).toBe('Poster')
    expect(imageLabel('Poster', '  ')).toBe('Poster')
  })
})

describe('Heading on native', () => {
  it('announces a header with the level', () => {
    render(<Heading level={2}>Cast</Heading>)
    const node = screen.getByText('Cast')
    expect(node.props.accessibilityRole).toBe('header')
    expect(node.props['aria-level']).toBe(2)
  })
})

describe('PageHead on native', () => {
  it('renders nothing', () => {
    const { toJSON } = render(
      <SeoProvider site={site}>
        <PageHead title="Dune" url="/m/1" />
      </SeoProvider>,
    )
    expect(toJSON()).toBeNull()
  })

  it('still needs a site, so a missing provider fails on every platform', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<PageHead title="Dune" />)).toThrow(/SeoProvider/)
    error.mockRestore()
  })
})

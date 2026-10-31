import { render, screen } from '@testing-library/react-native'
import { Picture } from '../expo-image'
import { defineSite } from '../index'
import { SeoProvider } from '../react'

const site = defineSite({ name: 'Trek', url: 'https://example.com/app' })

describe('Picture on native', () => {
  it('renders expo-image with the source under the site, the text, and the box', () => {
    render(
      <SeoProvider site={site}>
        <Picture
          source="/posters/dune.jpg"
          alt="Dune poster"
          width={300}
          height={450}
          contentFit="contain"
          testID="poster"
        />
      </SeoProvider>,
    )
    const image = screen.getByTestId('poster')
    expect(image.props.source).toEqual({
      uri: 'https://example.com/app/posters/dune.jpg',
    })
    expect(image.props.alt).toBe('Dune poster')
    expect(image.props.accessibilityLabel).toBe('Dune poster')
    expect(image.props.accessible).toBe(true)
    expect(image.props.contentFit).toBe('contain')
    expect(image.props.style).toEqual([{ width: 300, height: 450 }, undefined])
  })

  it('gives expo-image each srcSet file under the site, with its height from the box ratio', () => {
    render(
      <SeoProvider site={site}>
        <Picture
          source="/posters/w342/dune.jpg"
          srcSet={[
            { source: '/posters/w185/dune.jpg', width: 185 },
            { source: 'https://cdn.example/w500/dune.jpg', width: 500 },
          ]}
          alt="Dune poster"
          width={342}
          height={513}
          testID="poster"
        />
      </SeoProvider>,
    )
    expect(screen.getByTestId('poster').props.source).toEqual([
      {
        uri: 'https://example.com/app/posters/w185/dune.jpg',
        width: 185,
        height: 278,
      },
      { uri: 'https://cdn.example/w500/dune.jpg', width: 500, height: 750 },
    ])
  })

  it('passes an absolute source through with no site, and marks a decorative image', () => {
    render(
      <Picture
        source="https://cdn.example/a.png"
        alt=""
        width={10}
        height={10}
        testID="decor"
      />,
    )
    const image = screen.getByTestId('decor')
    expect(image.props.source).toEqual({ uri: 'https://cdn.example/a.png' })
    expect(image.props.accessible).toBe(false)
    expect(image.props.contentFit).toBe('cover')
  })

  it('takes the site from the prop, and throws for a relative source with none', () => {
    render(
      <Picture
        site={site}
        source="a.png"
        alt="A"
        width={1}
        height={1}
        testID="a"
      />,
    )
    expect(screen.getByTestId('a').props.source).toEqual({
      uri: 'https://example.com/app/a.png',
    })
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(<Picture source="/a.png" alt="A" width={1} height={1} />),
    ).toThrow(/relative `source` needs the site/)
    error.mockRestore()
  })
})

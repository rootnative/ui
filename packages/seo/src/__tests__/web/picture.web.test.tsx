import { render, screen } from '@testing-library/react'
import { StyleSheet } from 'react-native'
import { Picture } from '../../expo-image'
import { defineSite } from '../../index'
import { SeoProvider } from '../../react'

const site = defineSite({ name: 'Trek', url: 'https://example.com/app' })

const styles = StyleSheet.create({
  poster: { borderRadius: 12, width: '100%' },
})

describe('Picture on the web', () => {
  it('renders a plain <img> under the host path, with alt, size, loading and object-fit', () => {
    render(
      <SeoProvider site={site}>
        <Picture
          source="/posters/dune.jpg?v=2"
          alt="Dune poster"
          width={300}
          height={450}
          contentFit="contain"
          loading="eager"
          style={styles.poster}
          testID="poster"
        />
      </SeoProvider>,
    )
    const image = screen.getByTestId('poster') as HTMLImageElement
    expect(image.tagName).toBe('IMG')
    expect(image.getAttribute('src')).toBe('/app/posters/dune.jpg?v=2')
    expect(image.getAttribute('alt')).toBe('Dune poster')
    expect(image.getAttribute('width')).toBe('300')
    expect(image.getAttribute('height')).toBe('450')
    expect(image.getAttribute('loading')).toBe('eager')
    expect(image.getAttribute('decoding')).toBe('async')
    expect(image.style.objectFit).toBe('contain')
    expect(image.style.borderRadius).toBe('12px')
    expect(image.style.width).toBe('100%')
  })

  it('defaults to lazy and cover, keeps an absolute source, and allows an empty alt', () => {
    render(
      <Picture
        source="https://cdn.example/a.png"
        alt=""
        width={10}
        height={10}
        testID="decor"
      />,
    )
    const image = screen.getByTestId('decor') as HTMLImageElement
    expect(image.getAttribute('src')).toBe('https://cdn.example/a.png')
    expect(image.getAttribute('alt')).toBe('')
    expect(image.getAttribute('loading')).toBe('lazy')
    expect(image.style.objectFit).toBe('cover')
  })

  // jsdom does no layout, so these read the CSS. The layout that the CSS
  // gives was measured in headless Chromium: a `flex: 1` picture in a
  // shorter frame, a `width` with an `aspectRatio`, and a border.
  it('lays out as a react-native-web view, so a flex item can shrink and a border draws', () => {
    render(
      <Picture
        source="https://cdn.example/a.png"
        alt=""
        width={500}
        height={750}
        style={framed.poster}
        testID="poster"
      />,
    )
    const { style } = screen.getByTestId('poster')
    expect(style.boxSizing).toBe('border-box')
    expect(style.borderStyle).toBe('solid')
    expect(style.borderWidth).toBe('1px')
    expect(style.borderColor).toBe('red')
    expect(style.minHeight).toMatch(/^0(px)?$/)
    expect(style.minWidth).toMatch(/^0(px)?$/)
    expect(style.flexShrink).toBe('0')
    expect(style.position).toBe('relative')
  })

  it('takes the box from width and height, as native does, and a size in style wins', () => {
    render(
      <>
        <Picture
          source="https://cdn.example/a.png"
          alt=""
          width={780}
          height={439}
          testID="plain"
        />
        <Picture
          source="https://cdn.example/a.png"
          alt=""
          width={500}
          height={750}
          style={framed.poster}
          testID="poster"
        />
      </>,
    )
    const plain = screen.getByTestId('plain').style
    expect([plain.width, plain.height]).toEqual(['780px', '439px'])
    const poster = screen.getByTestId('poster').style
    expect([poster.width, poster.height]).toEqual(['112px', '750px'])
  })

  // With no CSS height, the `height` attribute gives the height, and an
  // `aspectRatio` does nothing. On native that side is `auto`.
  it('writes auto for a side that the style sets to undefined', () => {
    render(
      <Picture
        source="https://cdn.example/a.png"
        alt=""
        width={600}
        height={360}
        style={framed.fluid}
        testID="fluid"
      />,
    )
    const { style } = screen.getByTestId('fluid')
    expect(style.width).toBe('100%')
    expect(style.height).toBe('auto')
  })
})

const framed = StyleSheet.create({
  poster: { width: 112, borderWidth: 1, borderColor: 'red' },
  fluid: { width: '100%', height: undefined, aspectRatio: 600 / 360 },
})

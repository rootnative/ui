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
})
